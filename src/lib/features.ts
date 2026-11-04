/**
 * Feature flags do site.
 *
 * Loja própria / catálogo (`NEXT_PUBLIC_STORE_ENABLED`):
 * - Ligada (padrão, ausente ou qualquer valor diferente de "false"): as telas
 *   `/loja` e `/loja/[id]` funcionam e os links pro catálogo aparecem.
 * - Desligada (`=false`): `/loja` e `/loja/[id]` respondem 404 e todo link/CTA
 *   que aponta pro catálogo some da navegação e dos fluxos. A miniatura de pet
 *   e a encomenda personalizada continuam ativas.
 */
export const STORE_ENABLED = process.env.NEXT_PUBLIC_STORE_ENABLED !== "false";

/**
 * Catálogo V2 (`NEXT_PUBLIC_STORE_V2`): `/loja` e `/loja/[slug]` leem os
 * produtos da Vitrine do admin (view `storefront_products_v`).
 * - Ligado (padrão): catálogo moderno com slug, variantes, selos e SEO.
 * - Desligado (`=false`): volta ao catálogo legado (products + listing
 *   `loja_propria`). A miniatura de pet não é afetada em nenhum dos modos.
 */
export const STORE_V2 = process.env.NEXT_PUBLIC_STORE_V2 !== "false";
