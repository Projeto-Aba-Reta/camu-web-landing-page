import "server-only";

/** Gateway de pagamento ativo, escolhido por `PAYMENT_GATEWAY` no .env.
 *  `mercadopago` (padrão) ou `stripe`. Os dois ficam no código; só um
 *  processa os checkouts por vez. */
export type GatewayId = "mercadopago" | "stripe";

export function activeGatewayId(): GatewayId {
  const raw = (process.env.PAYMENT_GATEWAY ?? "mercadopago").trim().toLowerCase();
  if (raw === "stripe") return "stripe";
  if (raw === "mercadopago" || raw === "") return "mercadopago";
  throw new Error(
    `PAYMENT_GATEWAY inválido: "${raw}". Use "mercadopago" ou "stripe".`,
  );
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/** URL pública (https, não-localhost)? Webhooks / auto-return só funcionam nesse caso. */
export function isPublicUrl(base: string = siteUrl()): boolean {
  return /^https:\/\//.test(base) && !/localhost|127\.0\.0\.1/.test(base);
}

/**
 * Flag de desenvolvimento: quando `PAYMENTS_SKIP_ENABLED=true` **e** o site está
 * rodando em localhost, o checkout pula o gateway e marca o pedido como pago na
 * hora, redirecionando direto pra página de confirmação. Fora de localhost a
 * flag é ignorada (nunca pula pagamento em produção).
 */
export function paymentBypassEnabled(): boolean {
  if (process.env.PAYMENTS_SKIP_ENABLED !== "true") return false;
  return /\/\/(localhost|127\.0\.0\.1)(:|$|\/)/.test(siteUrl());
}

/** URL da página de confirmação de um pedido (usada no bypass de pagamento). */
export function orderConfirmedUrl(orderCode: string): string {
  return `${siteUrl()}/pedido/confirmado/${orderCode}`;
}

export type PaymentItem = {
  title: string;
  quantity: number;
  unit_price: number; // em reais (não centavos)
};

export type CreateCheckoutParams = {
  orderCode: string;
  items: PaymentItem[];
  shippingReais: number;
  payer?: { name?: string; email?: string };
};

/** Sessão de checkout criada no gateway. `sessionId` é gravado em
 *  `orders.mp_preference_id` (coluna reaproveitada); `initPoint` é a URL pra
 *  onde o cliente é redirecionado. */
export type CheckoutSession = {
  sessionId: string;
  initPoint: string;
};

/** Resultado de pagamento já normalizado pro vocabulário do Mercado Pago, que é
 *  o que `applyPaymentStatus` / a página de confirmação entendem:
 *  `approved` | `pending` | `in_process` | `rejected` | `cancelled` |
 *  `refunded` | `charged_back`. */
export type PaymentResult = {
  status: string;
  paymentId: string | null;
};

export interface PaymentGateway {
  readonly id: GatewayId;

  /** Cria a sessão de checkout e devolve a URL de pagamento. */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession>;

  /** Lê uma notificação (webhook) da rota do gateway e devolve o pedido +
   *  status, ou `null` se a notificação não interessa. */
  parseWebhook(request: Request): Promise<
    ({ orderCode: string } & PaymentResult) | null
  >;

  /** Reconcilia direto na API do gateway (usado quando o webhook não chega,
   *  ex.: localhost). Recebe o pedido — pode usar `order_code` ou o
   *  `mp_preference_id` (id da sessão) já gravado. */
  reconcile(order: {
    order_code: string;
    mp_preference_id: string | null;
  }): Promise<PaymentResult | null>;
}
