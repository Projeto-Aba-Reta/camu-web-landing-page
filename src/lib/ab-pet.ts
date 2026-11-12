/**
 * Teste A/B da entrada /miniatura-pet: 50% vão pra /miniatura-pet/v2 (prévia
 * antes de pagar) e 50% pra /miniatura-pet/expressa (paga primeiro, fotos depois).
 * A atribuição vem do Firebase Remote Config + A/B Testing (split configurado no
 * console; ver `AbPetRedirect`) e a medição vai pro Firebase Analytics.
 */
export const AB_PET_EXPERIMENT = "miniatura_pet_entrada";
export const AB_PET_COOKIE = "camu_ab_pet";
/** Chave do parâmetro no Remote Config (valores: "v2" | "expressa"). */
export const AB_PET_RC_KEY = "miniatura_pet_variant";
export const AB_PET_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export const AB_PET_VARIANTS = ["v2", "expressa"] as const;
export type AbPetVariant = (typeof AB_PET_VARIANTS)[number];

export function isAbPetVariant(value: string | undefined): value is AbPetVariant {
  return value === "v2" || value === "expressa";
}

/** Lê a variante do cookie no navegador (o cookie não é httpOnly de propósito). */
export function readAbPetVariantFromBrowser(): AbPetVariant | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${AB_PET_COOKIE}=`));
  const value = match?.split("=")[1];
  return isAbPetVariant(value) ? value : null;
}

/** Guarda a variante num cookie legível pelo client (exposição + eventos do funil). */
export function writeAbPetVariantCookie(variant: AbPetVariant): void {
  document.cookie = `${AB_PET_COOKIE}=${variant}; Max-Age=${AB_PET_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}
