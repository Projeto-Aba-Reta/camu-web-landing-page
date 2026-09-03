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
