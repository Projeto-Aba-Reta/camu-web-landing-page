import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getServiceClient } from "@/lib/supabase/server";
import { normalizeEmail } from "./session";

const TOKEN_TTL_MS = 20 * 60 * 1000; // 20 minutos

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Cria um magic link de uso único: gera o token cru (devolvido), grava só o
 *  sha256 + validade em `customer_magic_tokens`. */
export async function createMagicToken(email: string): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  const db = getServiceClient();
  const { error } = await db.from("customer_magic_tokens").insert({
    email: normalizeEmail(email),
    token_hash: hashToken(raw),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`Falha ao gerar o link de acesso: ${error.message}`);
  return raw;
}

export type ConsumedMagicToken = {
  email: string;
  /** Segundos entre o link ser gerado e o clique — sinal de quão rápido/impaciente
   *  o cliente foi até abrir o e-mail e clicar. */
  secondsSinceCreated: number;
};

/** Consome o token: rejeita se não existe, já foi usado ou expirou. Retorna o
 *  e-mail associado (+ tempo até o clique) ou null. */
export async function consumeMagicToken(raw: string): Promise<ConsumedMagicToken | null> {
  if (!raw) return null;
  const db = getServiceClient();
  const tokenHash = hashToken(raw);

  const { data, error } = await db
    .from("customer_magic_tokens")
    .select("id, email, expires_at, consumed_at, created_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data) return null;
  if (data.consumed_at) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;

  const { error: updErr } = await db
    .from("customer_magic_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", data.id as string)
    .is("consumed_at", null);
  if (updErr) return null;

  const secondsSinceCreated = Math.max(
    0,
    Math.round((Date.now() - new Date(data.created_at as string).getTime()) / 1000),
  );
  return { email: data.email as string, secondsSinceCreated };
}
