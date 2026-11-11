/** Client-safe: marcador gravado em `pet_miniature_requests.ai_error` quando a
 *  geração de imagem falha por falta de cota/créditos do provider de IA. A UI
 *  reconhece o marcador e oferece o contato pelo WhatsApp em vez do retry. */
export const AI_QUOTA_MARKER = "[sem-cota-ia]";

export const AI_QUOTA_MESSAGE =
  "Estamos com muitos pedidos de prévia agora e não conseguimos gerar a imagem do seu cantinho pet automaticamente. Chama a gente no WhatsApp que a gente faz a prévia pra você!";

export function isAiQuotaError(error: string | null | undefined): boolean {
  return !!error && error.includes(AI_QUOTA_MARKER);
}

/** Detecta erros de cota/créditos esgotados do provider (HTTP 429, RESOURCE_EXHAUSTED…). */
export function looksLikeQuotaError(err: unknown): boolean {
  const e = err as { status?: unknown; code?: unknown; message?: unknown } | null;
  if (e && (e.status === 429 || e.code === 429)) return true;
  const msg = err instanceof Error ? err.message : typeof e?.message === "string" ? e.message : "";
  return /resource_exhausted|quota|rate.?limit|insufficient|billing|\b429\b/i.test(msg);
}

const DEFAULT_WA_NUMBER = "5511912581464";

/** Link do WhatsApp (contato cadastrado) já falando do cantinho pet. */
export function cantinhoPetWhatsappUrl(petName?: string | null, orderCode?: string | null): string {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "") || DEFAULT_WA_NUMBER;
  const text =
    `Oi! Tentei fazer a prévia do cantinho pet${petName ? ` do ${petName}` : ""}` +
    `${orderCode ? ` (pedido #${orderCode})` : ""} pelo site, mas não consegui gerar a imagem. Pode me ajudar?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
