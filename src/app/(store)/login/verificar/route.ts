import { NextResponse, type NextRequest } from "next/server";
import { consumeMagicToken } from "@/lib/auth/magic-token";
import { writeSessionCookie } from "@/lib/auth/session";
import { getPostHogClient } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

/** Alvo do magic link: consome o token, abre a sessão e manda pra /conta. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await consumeMagicToken(token);

  if (!result) {
    return NextResponse.redirect(new URL("/login?erro=link_invalido", request.url));
  }

  const { email, secondsSinceCreated } = result;

  // segundos_ate_clique mede quanto tempo o cliente levou entre pedir o link
  // e abrir o e-mail/clicar — sinal de quão ansioso ele está pra acompanhar o pedido.
  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: email,
      event: "login_concluido",
      properties: { segundos_ate_clique: secondsSinceCreated },
    });
    await posthog.flush();
  }

  await writeSessionCookie(email);
  return NextResponse.redirect(new URL("/conta", request.url));
}
