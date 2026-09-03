import type { NextRequest } from "next/server";
import { abacatePayGateway } from "@/lib/payments";
import { applyPaymentStatus } from "@/lib/store";

/**
 * Webhook da AbacatePay. Ativo quando `PAYMENT_GATEWAY=abacatepay`. Cadastre no
 * painel da AbacatePay a URL:
 *
 *   {SITE_URL}/api/webhooks/abacatepay?webhookSecret=SEU_SEGREDO
 *
 * e coloque o mesmo segredo em `ABACATEPAY_WEBHOOK_SECRET`. Eventos relevantes:
 * `billing.paid` (e afins). Em localhost a página `/pedido/confirmado/[code]`
 * reconcilia sozinha.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await abacatePayGateway.parseWebhook(request);
    if (result) {
      await applyPaymentStatus(result.orderCode, result.status, result.paymentId);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[abacatepay webhook]", err);
    // 400 faz a AbacatePay reenviar; use pra segredo inválido / erro transitório.
    return new Response("webhook error", { status: 400 });
  }
}
