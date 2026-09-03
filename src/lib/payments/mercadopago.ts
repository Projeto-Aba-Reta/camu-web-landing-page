import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import {
  isPublicUrl,
  siteUrl,
  type CheckoutSession,
  type CreateCheckoutParams,
  type PaymentGateway,
  type PaymentResult,
} from "./common";

/** Client Mercado Pago (server-only). Usa o Access Token do vendedor. */
function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Mercado Pago não configurado: defina MP_ACCESS_TOKEN em .env.local");
  }
  return new MercadoPagoConfig({ accessToken });
}

/**
 * Cria uma preferência de Checkout Pro. Pix + cartão ficam disponíveis na
 * tela do Mercado Pago. `orderCode` vira external_reference pra reconciliar
 * depois no webhook / na página de confirmação.
 */
async function createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession> {
  const preference = new Preference(getClient());
  const base = siteUrl();

  const items = [...params.items];
  if (params.shippingReais > 0) {
    items.push({ title: "Frete", quantity: 1, unit_price: params.shippingReais });
  }

  // O Mercado Pago só aceita `auto_return` / `notification_url` com URL pública
  // (https, não-localhost). Em dev (localhost) ele responde 400
  // "auto_return invalid. back_url.success must be defined" — então omitimos.
  const publicUrl = isPublicUrl(base);

  const result = await preference.create({
    body: {
      items: items.map((it, i) => ({
        id: `${params.orderCode}-${i}`,
        title: it.title,
        quantity: it.quantity,
        unit_price: it.unit_price,
        currency_id: "BRL",
      })),
      payer: params.payer?.email
        ? { name: params.payer.name, email: params.payer.email }
        : undefined,
      external_reference: params.orderCode,
      back_urls: {
        success: `${base}/pedido/confirmado/${params.orderCode}`,
        pending: `${base}/pedido/confirmado/${params.orderCode}`,
        failure: `${base}/checkout?erro=pagamento&pedido=${params.orderCode}`,
      },
      ...(publicUrl
        ? {
            auto_return: "approved" as const,
            notification_url: `${base}/api/webhooks/mercadopago`,
          }
        : {}),
      statement_descriptor: "CAMU3D",
    },
  });

  const initPoint = result.init_point ?? result.sandbox_init_point;
  if (!result.id || !initPoint) {
    throw new Error("Mercado Pago não retornou init_point");
  }
  return { sessionId: String(result.id), initPoint };
}

/** Detalhes de um pagamento pelo id. */
async function getPayment(paymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}

async function parseWebhook(
  request: Request,
): Promise<({ orderCode: string } & PaymentResult) | null> {
  const url = new URL(request.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? null;
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");

  let bodyType = type;
  if (!paymentId) {
    const body = (await request.json().catch(() => null)) as
      | { type?: string; topic?: string; data?: { id?: string | number }; id?: string | number }
      | null;
    if (body) {
      bodyType = body.type ?? body.topic ?? bodyType;
      paymentId =
        body.data?.id != null ? String(body.data.id) : body.id != null ? String(body.id) : null;
    }
  }

  // Só nos interessa notificação de pagamento.
  if (bodyType && bodyType !== "payment" && bodyType !== "payment.updated") return null;
  if (!paymentId) return null;

  const payment = await getPayment(paymentId);
  const orderCode = payment.external_reference;
  const status = payment.status;
  if (!orderCode || !status) return null;

  return { orderCode, status, paymentId: String(payment.id ?? paymentId) };
}

/**
 * Reconcilia o pagamento consultando o Mercado Pago pelo external_reference.
 * Usado quando o webhook não chega (ex.: localhost).
 */
async function reconcile(order: {
  order_code: string;
  mp_preference_id: string | null;
}): Promise<PaymentResult | null> {
  const payment = new Payment(getClient());
  const res = await payment.search({
    options: {
      external_reference: order.order_code,
      sort: "date_created",
      criteria: "desc",
    },
  });
  const first = res.results?.[0];
  if (!first?.id || !first.status) return null;
  return { status: String(first.status), paymentId: String(first.id) };
}

export const mercadoPagoGateway: PaymentGateway = {
  id: "mercadopago",
  createCheckout,
  parseWebhook,
  reconcile,
};
