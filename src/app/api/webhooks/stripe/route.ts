import type { NextRequest } from "next/server";
import { stripeGateway } from "@/lib/payments";
import { applyPaymentStatus } from "@/lib/store";
import { getPostHogClient } from "@/lib/posthog-server";

/**
 * Webhook do Stripe. Ativo quando `PAYMENT_GATEWAY=stripe`. Configure o endpoint
 * no painel do Stripe apontando pra {SITE_URL}/api/webhooks/stripe e copie o
 * signing secret pra `STRIPE_WEBHOOK_SECRET`.
 *
 * Eventos relevantes: checkout.session.completed / .async_payment_succeeded /
 * .async_payment_failed / .expired, payment_intent.succeeded / .payment_failed /
 * .canceled, charge.refunded.
 *
 * Em localhost use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 * ou deixe a página de confirmação reconciliar sozinha.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await stripeGateway.parseWebhook(request);
    if (result) {
      await applyPaymentStatus(result.orderCode, result.status, result.paymentId);
      if (result.status === "approved") {
        const posthog = getPostHogClient();
        if (posthog) {
          posthog.capture({
            distinctId: result.orderCode,
            event: "payment_completed",
            properties: {
              order_code: result.orderCode,
              payment_id: result.paymentId,
              gateway: "stripe",
            },
          });
          await posthog.flush();
        }
      }
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[stripe webhook]", err);
    // 400 faz o Stripe reenviar; use pra assinatura inválida / erro transitório.
    return new Response("webhook error", { status: 400 });
  }
}
