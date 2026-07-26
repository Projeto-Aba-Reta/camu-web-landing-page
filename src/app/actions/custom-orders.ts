"use server";

import { getServiceClient } from "@/lib/supabase/server";

export type CustomOrderResult =
  | { ok: true; whatsappUrl: string }
  | { ok: false; error: string };

/**
 * Salva a encomenda personalizada (lead) no Supabase e devolve um link do
 * WhatsApp já preenchido — o fluxo termina na conversa (tela 7).
 */
export async function submitCustomOrder(formData: FormData): Promise<CustomOrderResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const budget = String(formData.get("budget") ?? "").trim();

  if (!name || !phone || !description) {
    return { ok: false, error: "Preencha nome, WhatsApp e a descrição da ideia." };
  }

  try {
    const db = getServiceClient();
    const { error } = await db.from("custom_orders").insert({
      name,
      phone,
      description,
      budget_range: budget || null,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível registrar sua ideia.";
    return { ok: false, error: message };
  }

  const target = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  const text = [
    "Olá! Quero uma encomenda personalizada na Camu.",
    `Nome: ${name}`,
    budget ? `Orçamento: ${budget}` : null,
    `Ideia: ${description}`,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
  return { ok: true, whatsappUrl };
}
