import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** Cookie de sessão do cliente da loja — httpOnly, assinado com HMAC, sem
 *  tabela de sessão. Guarda só o e-mail + validade. */
export const SESSION_COOKIE = "camu_conta";

const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 dias
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(normalizeEmail(value));
}

function getSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "Sessão do cliente não configurada: defina CUSTOMER_SESSION_SECRET (>= 16 chars) em .env.local",
    );
  }
  return secret;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Monta o valor do cookie: `<base64url(email|exp)>.<hmac>`. */
export function signSession(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_S;
  const payload = `${normalizeEmail(email)}|${exp}`;
  return `${b64url(payload)}.${sign(payload)}`;
}

/** Valida assinatura + expiração. Retorna o e-mail ou null. */
export function verifySession(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const [encoded, sig] = raw.split(".");
  if (!encoded || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [email, expStr] = payload.split("|");
  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  return email;
}

/** E-mail do cliente logado (ou null). Seguro em Server Components. */
export async function getCurrentCustomerEmail(): Promise<string | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Grava o cookie de sessão. Só em Server Action / Route Handler. */
export async function writeSessionCookie(email: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

/** Encerra a sessão. Só em Server Action / Route Handler. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
