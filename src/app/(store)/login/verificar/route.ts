import { NextResponse, type NextRequest } from "next/server";
import { consumeMagicToken } from "@/lib/auth/magic-token";
import { writeSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Alvo do magic link: consome o token, abre a sessão e manda pra /conta. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const email = await consumeMagicToken(token);

  if (!email) {
    return NextResponse.redirect(new URL("/login?erro=link_invalido", request.url));
  }

  await writeSessionCookie(email);
  return NextResponse.redirect(new URL("/conta", request.url));
}
