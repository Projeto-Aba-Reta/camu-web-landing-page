import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

/** Client Mercado Pago (server-only). Usa o Access Token do vendedor. */
function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Mercado Pago não configurado: defina MP_ACCESS_TOKEN em .env.local");
  }
  return new MercadoPagoConfig({ accessToken });
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number; // em reais (não centavos)
};

/**
 * Cria uma preferência de Checkout Pro. Pix + cartão ficam disponíveis na
 * tela do Mercado Pago. `orderCode` vira external_reference pra reconciliar
 * depois no webhook / na página de confirmação.
 */
export async function createPreference(params: {
  orderCode: string;
  items: PreferenceItem[];
  shippingReais: number;
  payer?: { name?: string; email?: string };
}): Promise<{ preferenceId: string; initPoint: string }> {
  const preference = new Preference(getClient());
  const base = siteUrl();

  const items = [...params.items];
  if (params.shippingReais > 0) {
    items.push({ title: "Frete", quantity: 1, unit_price: params.shippingReais });
  }

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
      auto_return: "approved",
      notification_url: `${base}/api/webhooks/mercadopago`,
      statement_descriptor: "CAMU3D",
    },
  });

  const initPoint = result.init_point ?? result.sandbox_init_point;
  if (!result.id || !initPoint) {
    throw new Error("Mercado Pago não retornou init_point");
  }
  return { preferenceId: String(result.id), initPoint };
}

/** Detalhes de um pagamento pelo id. */
export async function getPayment(paymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}

/**
 * Busca o pagamento mais recente de um pedido (external_reference).
 * Usado pra reconciliar quando o webhook não chega (ex.: localhost).
 */
export async function findPaymentByOrderCode(
  orderCode: string,
): Promise<{ id: string; status: string } | null> {
  const payment = new Payment(getClient());
  const res = await payment.search({
    options: { external_reference: orderCode, sort: "date_created", criteria: "desc" },
  });
  const first = res.results?.[0];
  if (!first?.id || !first.status) return null;
  return { id: String(first.id), status: String(first.status) };
}
