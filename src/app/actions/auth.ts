"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/payments";
import { createMagicToken } from "@/lib/auth/magic-token";
import { sendMagicLinkEmail } from "@/lib/auth/send-magic-link";
import { clearSessionCookie, isValidEmail, normalizeEmail } from "@/lib/auth/session";
import { getPostHogClient } from "@/lib/posthog-server";

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

    // Capture login request — distinctId is the normalized email (treated as
    // the stable customer identifier on the server side; email is PII so we
    // also call identify() to attach it to the person profile).
    const posthog = getPostHogClient();
    if (posthog) {
      posthog.identify({ distinctId: email, properties: { email } });
      posthog.capture({ distinctId: email, event: "magic_link_requested" });
      await posthog.flush();
    }

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
