import "server-only";
import {
  siteUrl,
  type CheckoutSession,
  type CreateCheckoutParams,
  type PaymentGateway,
  type PaymentResult,
} from "./common";

/**
 * Gateway AbacatePay (Pix + cartão, Brasil). Ativo quando
 * `PAYMENT_GATEWAY=abacatepay`.
 *
 * Usa a API de cobrança (`/v1/billing`): o site cria uma cobrança one-time com
 * os itens do pedido e redireciona o cliente pra `data.url` (página hospedada
 * da AbacatePay). O `order_code` vai como `externalId` pra reconciliar depois.
 * O id da cobrança (`bill_...`) é gravado em `orders.mp_preference_id` (coluna
 * reaproveitada, sem migration).
 *
 * Docs: https://docs.abacatepay.com
 */

const API_BASE = "https://api.abacatepay.com/v1";

function getApiKey(): string {
  const key = process.env.ABACATEPAY_API_KEY;
  if (!key) {
    throw new Error(
      "AbacatePay não configurado: defina ABACATEPAY_API_KEY em .env.local",
    );
  }
  return key;
}

async function api<T>(
  path: string,
  init: RequestInit & { method: "GET" | "POST" },
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as
    | { data?: T; error?: string | null }
    | null;
  if (!res.ok || !json || json.error) {
    throw new Error(
      `AbacatePay ${path} falhou (${res.status}): ${json?.error ?? res.statusText}`,
    );
  }
  if (json.data == null) {
    throw new Error(`AbacatePay ${path}: resposta sem "data"`);
  }
  return json.data;
}

/** Normaliza o status da AbacatePay pro vocabulário do Mercado Pago que o
 *  resto do app entende. */
function normalizeStatus(raw: string | null | undefined): string {
  switch ((raw ?? "").toUpperCase()) {
    case "PAID":
      return "approved";
    case "REFUNDED":
      return "refunded";
    case "CANCELLED":
    case "EXPIRED":
      return "cancelled";
    default:
      return "pending";
  }
}

const reais = (v: number) => Math.round(v * 100); // AbacatePay usa centavos

type Billing = {
  id: string;
  url: string;
  status: string;
  externalId?: string | null;
  metadata?: { externalId?: string | null } | null;
};

async function createCheckout(
  params: CreateCheckoutParams,
): Promise<CheckoutSession> {
  const base = siteUrl();

  const products = params.items.map((it, i) => ({
    externalId: `${params.orderCode}-${i}`,
    name: it.title,
    quantity: it.quantity,
    price: reais(it.unit_price),
  }));
  if (params.shippingReais > 0) {
    products.push({
      externalId: `${params.orderCode}-frete`,
      name: "Frete",
      quantity: 1,
      price: reais(params.shippingReais),
    });
  }

  const billing = await api<Billing>("/billing/create", {
    method: "POST",
    body: JSON.stringify({
      frequency: "ONE_TIME",
      methods: ["PIX", "CARD"],
      products,
      externalId: params.orderCode,
      returnUrl: `${base}/checkout?erro=pagamento&pedido=${params.orderCode}`,
      completionUrl: `${base}/pedido/confirmado/${params.orderCode}`,
      customer: params.payer?.email
        ? { name: params.payer.name, email: params.payer.email }
        : undefined,
    }),
  });

  if (!billing.id || !billing.url) {
    throw new Error("AbacatePay não retornou a URL de cobrança");
  }
  return { sessionId: billing.id, initPoint: billing.url };
}

async function parseWebhook(
  request: Request,
): Promise<({ orderCode: string } & PaymentResult) | null> {
  // Camada 1: segredo na query string (?webhookSecret=...).
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (secret) {
    const got = new URL(request.url).searchParams.get("webhookSecret");
    if (got !== secret) {
      throw new Error("AbacatePay webhook: webhookSecret inválido");
    }
  }

  const body = (await request.json().catch(() => null)) as
    | {
        event?: string;
        data?: {
          billing?: Billing;
          payment?: { id?: string; status?: string } | null;
        } | null;
      }
    | null;
  if (!body?.data) return null;

  const billing = body.data.billing;
  const orderCode =
    billing?.externalId ?? billing?.metadata?.externalId ?? null;
  if (!orderCode) return null;

  // O evento (billing.paid) já indica a intenção, mas confiamos no status do
  // objeto quando presente.
  const status =
    body.event === "billing.paid"
      ? "approved"
      : normalizeStatus(billing?.status);

  return {
    orderCode,
    status,
    paymentId: body.data.payment?.id ?? billing?.id ?? null,
  };
}

async function reconcile(order: {
  order_code: string;
  mp_preference_id: string | null;
}): Promise<PaymentResult | null> {
  // A cobrança é sempre gravada em orders.mp_preference_id logo após criada.
  const billId = order.mp_preference_id;
  if (!billId?.startsWith("bill_")) return null;

  const list = await api<Billing[]>("/billing/list", { method: "GET" });
  const billing = list.find((b) => b.id === billId);
  if (!billing) return null;

  return {
    status: normalizeStatus(billing.status),
    paymentId: billing.id,
  };
}

export const abacatePayGateway: PaymentGateway = {
  id: "abacatepay",
  createCheckout,
  parseWebhook,
  reconcile,
};
