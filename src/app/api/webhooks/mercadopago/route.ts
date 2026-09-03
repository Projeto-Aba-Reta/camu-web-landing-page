import type { NextRequest } from "next/server";
import { mercadoPagoGateway } from "@/lib/payments";
import { applyPaymentStatus } from "@/lib/store";
import { getPostHogClient } from "@/lib/posthog-server";

/**
 * Webhook do Mercado Pago. Recebe notificações de pagamento, busca o pagamento
 * e atualiza o pedido correspondente (external_reference = order_code).
 *
 * Continua ativo mesmo quando `PAYMENT_GATEWAY=stripe` (não atrapalha) — mas só
 * o gateway ativo cria checkouts. Em localhost o MP não alcança essa rota; a
 * página de confirmação reconcilia por conta própria. Em produção, configure a
 * notification_url no painel do Mercado Pago apontando pra
 * {SITE_URL}/api/webhooks/mercadopago.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await mercadoPagoGateway.parseWebhook(request);
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
              gateway: "mercadopago",
            },
          });
          await posthog.flush();
        }
      }
    }
    return Response.json({ ok: true });
  } catch (err) {
    // Responder 200 evita reentrega infinita; logamos pra depurar.
    console.error("[mercadopago webhook]", err);
    return Response.json({ ok: false });
  }
}
