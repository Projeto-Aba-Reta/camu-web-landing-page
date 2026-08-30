"use server";

import {
  createOrder,
  setOrderPreference,
  applyPaymentStatus,
  type IncomingItem,
} from "@/lib/store";
import { createPreference, paymentBypassEnabled, orderConfirmedUrl } from "@/lib/mercadopago";

export type CheckoutInput = {
  items: IncomingItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    cep: string;
    line: string;
    city: string;
    uf: string;
  };
};

export type CheckoutResult =
  | { ok: true; orderCode: string; initPoint: string }
  | { ok: false; error: string };

/**
 * Cria o pedido no Supabase (preços recalculados no servidor), gera a
 * preferência do Mercado Pago e devolve o link de pagamento. O client limpa o
 * carrinho e redireciona pro Checkout Pro.
 */
export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const c = input.customer;
  if (!c?.name?.trim() || !c?.email?.trim()) {
    return { ok: false, error: "Preencha nome e e-mail." };
  }
  if (!input.items?.length) {
    return { ok: false, error: "Seu carrinho está vazio." };
  }

  try {
    const { order, items } = await createOrder({
      items: input.items,
      customer: {
        name: c.name.trim(),
        email: c.email.trim(),
        phone: (c.phone ?? "").trim(),
        cep: (c.cep ?? "").trim(),
        line: (c.line ?? "").trim(),
        city: (c.city ?? "").trim(),
        uf: (c.uf ?? "").trim(),
      },
    });

    // Dev: pula o Mercado Pago e marca o pedido como pago na hora.
    if (paymentBypassEnabled()) {
      await applyPaymentStatus(order.order_code, "approved", null);
      return {
        ok: true,
        orderCode: order.order_code,
        initPoint: orderConfirmedUrl(order.order_code),
      };
    }

    const { preferenceId, initPoint } = await createPreference({
      orderCode: order.order_code,
      items: items.map((it) => ({
        title: it.variant ? `${it.product_name} (${it.variant})` : it.product_name,
        quantity: it.qty,
        unit_price: it.unit_price_cents / 100,
      })),
      shippingReais: order.shipping_cents / 100,
      payer: { name: c.name.trim(), email: c.email.trim() },
    });

    await setOrderPreference(order.id, preferenceId);

    return { ok: true, orderCode: order.order_code, initPoint };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado no checkout.";
    return { ok: false, error: message };
  }
}
