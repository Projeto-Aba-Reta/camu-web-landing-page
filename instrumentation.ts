import { getPostHogClient } from "@/lib/posthog-server";

/** Extrai o distinct id do cookie do PostHog (`ph_<token>_posthog`) pra que a
 *  exceção do servidor caia na mesma pessoa/sessão do navegador. Retorna
 *  undefined quando não há cookie — a exceção é capturada de forma anônima. */
function distinctIdFromCookie(cookie: string | undefined): string | undefined {
  if (!cookie) return undefined;
  const match = cookie.match(/\bph_[^=]+_posthog=([^;]+)/);
  if (!match) return undefined;
  try {
    return JSON.parse(decodeURIComponent(match[1])).distinct_id;
  } catch {
    return undefined;
  }
}

/** Captura falhas de render de Server Component, Server Action e Route Handler.
 *  Sem este hook, erros do lado do servidor nunca chegam ao PostHog: o error
 *  boundary do cliente só vê uma versão saneada com `digest`, sem o stack real. */
export async function onRequestError(
  error: unknown,
  request: Readonly<{ headers: Record<string, string | string[] | undefined> }>,
): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  const posthog = getPostHogClient();
  if (!posthog) return;

  const cookie = request.headers.cookie;
  const distinctId = distinctIdFromCookie(
    Array.isArray(cookie) ? cookie.join("; ") : cookie,
  );

  await posthog.captureExceptionImmediate(error, distinctId);
}
