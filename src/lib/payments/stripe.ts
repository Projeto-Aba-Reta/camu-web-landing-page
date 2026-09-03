import "server-only";
import Stripe from "stripe";
import {
  siteUrl,
  type CheckoutSession,
  type CreateCheckoutParams,
  type PaymentGateway,
  type PaymentResult,
} from "./common";

let cached: Stripe | null = null;

function getClient(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe não configurado: defina STRIPE_SECRET_KEY em .env.local");
  }
  cached = new Stripe(key);
  return cached;
}

const reais = (v: number) => Math.round(v * 100);

/** Normaliza status do Stripe pro vocabulário do Mercado Pago que o resto do
 *  app entende. */
function normalizeStatus(input: {
  sessionPaymentStatus?: string | null;
  sessionStatus?: string | null;
  intentStatus?: string | null;
  refunded?: boolean;
}): string {
  if (input.refunded) return "refunded";

  switch (input.intentStatus) {
    case "succeeded":
      return "approved";
    case "processing":
      return "in_process";
    case "canceled":
      return "cancelled";
    case "requires_payment_method":
      // após uma falha de cobrança
      return "rejected";
  }

  if (input.sessionPaymentStatus === "paid" || input.sessionPaymentStatus === "no_payment_required") {
    return "approved";
  }
  if (input.sessionStatus === "expired") return "cancelled";
  return "pending";
}

async function createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession> {
  const stripe = getClient();
  const base = siteUrl();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency: "brl",
      unit_amount: reais(it.unit_price),
      product_data: { name: it.title },
    },
  }));
  if (params.shippingReais > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "brl",
        unit_amount: reais(params.shippingReais),
        product_data: { name: "Frete" },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    client_reference_id: params.orderCode,
    metadata: { orderCode: params.orderCode },
    payment_intent_data: { metadata: { orderCode: params.orderCode } },
    customer_email: params.payer?.email || undefined,
    success_url: `${base}/pedido/confirmado/${params.orderCode}`,
    cancel_url: `${base}/checkout?erro=pagamento&pedido=${params.orderCode}`,
  });

  if (!session.url) throw new Error("Stripe não retornou a URL de checkout");
  return { sessionId: session.id, initPoint: session.url };
}

async function parseWebhook(
  request: Request,
): Promise<({ orderCode: string } & PaymentResult) | null> {
  const stripe = getClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const raw = await request.text();

  let event: Stripe.Event;
  if (secret && signature) {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
  } else {
    // Sem segredo configurado (ex.: dev) — confia no payload. Nunca faça isso
    // em produção: configure STRIPE_WEBHOOK_SECRET.
    event = JSON.parse(raw) as Stripe.Event;
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderCode =
        session.client_reference_id ?? session.metadata?.orderCode ?? null;
      if (!orderCode) return null;
      const intent = session.payment_intent;
      const intentStatus =
        intent && typeof intent !== "string" ? intent.status : null;
      const paymentId =
        typeof intent === "string" ? intent : intent?.id ?? session.id;
      return {
        orderCode,
        status: normalizeStatus({
          sessionPaymentStatus: session.payment_status,
          sessionStatus: session.status,
          intentStatus,
        }),
        paymentId,
      };
    }
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderCode = intent.metadata?.orderCode ?? null;
      if (!orderCode) return null;
      return {
        orderCode,
        status: normalizeStatus({ intentStatus: intent.status }),
        paymentId: intent.id,
      };
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const orderCode = charge.metadata?.orderCode ?? null;
      const intentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (!orderCode && !intentId) return null;
      let code = orderCode;
      if (!code && intentId) {
        const intent = await getClient().paymentIntents.retrieve(intentId);
        code = intent.metadata?.orderCode ?? null;
      }
      if (!code) return null;
      return { orderCode: code, status: "refunded", paymentId: intentId ?? charge.id };
    }
    default:
      return null;
  }
}

async function reconcile(order: {
  order_code: string;
  mp_preference_id: string | null;
}): Promise<PaymentResult | null> {
  const stripe = getClient();

  // A sessão é sempre gravada em orders.mp_preference_id logo após ser criada.
  if (!order.mp_preference_id?.startsWith("cs_")) return null;
  const session = await stripe.checkout.sessions.retrieve(order.mp_preference_id, {
    expand: ["payment_intent"],
  });

  const intent = session.payment_intent;
  const intentStatus = intent && typeof intent !== "string" ? intent.status : null;
  const paymentId =
    typeof intent === "string" ? intent : intent?.id ?? session.id;

  return {
    status: normalizeStatus({
      sessionPaymentStatus: session.payment_status,
      sessionStatus: session.status,
      intentStatus,
    }),
    paymentId,
  };
}

export const stripeGateway: PaymentGateway = {
  id: "stripe",
  createCheckout,
  parseWebhook,
  reconcile,
};
