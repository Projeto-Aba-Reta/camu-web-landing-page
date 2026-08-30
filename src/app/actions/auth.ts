"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/mercadopago";
import { createMagicToken } from "@/lib/auth/magic-token";
import { sendMagicLinkEmail } from "@/lib/auth/send-magic-link";
import { clearSessionCookie, isValidEmail, normalizeEmail } from "@/lib/auth/session";

export type MagicLinkResult = { ok: true } | { ok: false; error: string };

/** Gera um magic link e manda por e-mail. Resposta é sempre genérica no caso
 *  feliz — qualquer e-mail pode logar e ver os pedidos vinculados a ele. */
export async function requestMagicLink(formData: FormData): Promise<MagicLinkResult> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) {
    return { ok: false, error: "Digite um e-mail válido." };
  }

  try {
    const token = await createMagicToken(email);
    const url = `${siteUrl()}/login/verificar?token=${encodeURIComponent(token)}`;
    await sendMagicLinkEmail(email, url);
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Não foi possível enviar o link agora.";
    return { ok: false, error: message };
  }
}

export async function logoutCustomer(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
