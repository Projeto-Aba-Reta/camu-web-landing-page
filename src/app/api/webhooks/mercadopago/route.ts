import type { NextRequest } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { applyPaymentStatus } from "@/lib/store";

/**
 * Webhook do Mercado Pago. Recebe notificações de pagamento, busca o pagamento
 * e atualiza o pedido correspondente (external_reference = order_code).
 *
 * Em localhost o MP não consegue alcançar essa rota; a página de confirmação
 * reconcilia por conta própria. Em produção, configure a notification_url no
 * painel do Mercado Pago apontando pra {SITE_URL}/api/webhooks/mercadopago.
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let paymentId =
      url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? null;
    const type = url.searchParams.get("type") ?? url.searchParams.get("topic");

    let bodyType = type;
    if (!paymentId) {
      const body = (await request.json().catch(() => null)) as
        | { type?: string; topic?: string; data?: { id?: string | number }; id?: string | number }
        | null;
      if (body) {
        bodyType = body.type ?? body.topic ?? bodyType;
        paymentId = body.data?.id != null ? String(body.data.id) : body.id != null ? String(body.id) : null;
      }
    }

    // Só nos interessa notificação de pagamento.
    if (bodyType && bodyType !== "payment" && bodyType !== "payment.updated") {
      return Response.json({ ignored: true });
    }
    if (!paymentId) return Response.json({ ignored: true });

    const payment = await getPayment(paymentId);
    const orderCode = payment.external_reference;
    const status = payment.status;
    if (orderCode && status) {
      await applyPaymentStatus(orderCode, status, String(payment.id ?? paymentId));
    }

    return Response.json({ ok: true });
  } catch (err) {
    // Responder 200 evita reentrega infinita; logamos pra depurar.
    console.error("[mercadopago webhook]", err);
    return Response.json({ ok: false });
  }
}
