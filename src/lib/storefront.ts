import "server-only";
import { getServiceClient } from "./supabase/server";

/**
 * Catálogo da loja V2 — lê a view `storefront_products_v` do ERP (só produtos
 * `publicado`, com mídia e variantes agregadas). A miniatura de pet NÃO vive
 * aqui: continua em `store.ts` / `pet-miniature.ts` (ver docs do admin,
 * catalogo-v2-plano.md §2.1).
 */

export type StoreBadge = "novo" | "mais_vendido" | "edicao_limitada" | "presente";

export type StoreVariant = {
  id: string;
  label: string;
  priceDeltaCents: number;
};

export type StoreItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  category: string | null;
  badges: string[];
  highlights: string[];
  fulfillment: "sob_encomenda" | "pronta_entrega";
  leadDaysMin: number | null;
  leadDaysMax: number | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  images: { url: string; alt: string | null }[];
  variants: StoreVariant[];
};

function imageUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/product-media/${path}` : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toItem(r: any): StoreItem {
  const images = ((r.media ?? []) as { path: string; alt: string | null }[])
    .map((m) => ({ url: imageUrl(m.path), alt: m.alt }))
    .filter((m): m is { url: string; alt: string | null } => Boolean(m.url));
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    shortDescription: r.short_description,
    description: r.description,
    priceCents: r.price_cents,
    compareAtPriceCents: r.compare_at_price_cents,
    category: r.category,
    badges: r.badges ?? [],
    highlights: r.highlights ?? [],
    fulfillment: r.fulfillment,
    leadDaysMin: r.lead_days_min,
    leadDaysMax: r.lead_days_max,
    featured: r.featured_rank != null,
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    publishedAt: r.published_at,
    images,
    variants: ((r.variants ?? []) as any[]).map((v) => ({
      id: v.id,
      label: v.label,
      priceDeltaCents: v.price_delta_cents,
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Destaques primeiro, depois os mais recentes. */
export async function getStoreItems(): Promise<StoreItem[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("storefront_products_v")
    .select("*")
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar a vitrine: ${error.message}`);
  return (data ?? []).map(toItem);
}

export async function getStoreItemBySlug(slug: string): Promise<StoreItem | null> {
  const db = getServiceClient();
  const { data, error } = await db.from("storefront_products_v").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Falha ao carregar produto: ${error.message}`);
  return data ? toItem(data) : null;
}

/** Usado para redirecionar links antigos `/loja/<uuid>` para `/loja/<slug>`. */
export async function getStoreSlugById(id: string): Promise<string | null> {
  const db = getServiceClient();
  const { data } = await db.from("storefront_products_v").select("slug").eq("id", id).maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}

export async function getRelatedItems(item: StoreItem, limit = 4): Promise<StoreItem[]> {
  const all = await getStoreItems();
  const others = all.filter((p) => p.id !== item.id);
  const same = others.filter((p) => item.category && p.category === item.category);
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, limit);
}

/** Faixa de prazo em texto: "5 a 8 dias", "até 7 dias" ou null. */
export function leadTimeLabel(item: Pick<StoreItem, "leadDaysMin" | "leadDaysMax" | "fulfillment">): string {
  if (item.fulfillment === "pronta_entrega") return "Pronta entrega";
  const { leadDaysMin: min, leadDaysMax: max } = item;
  if (min != null && max != null) return min === max ? `Produzido em ${min} dias` : `Produzido em ${min} a ${max} dias`;
  if (max != null) return `Produzido em até ${max} dias`;
  if (min != null) return `Produzido em ${min}+ dias`;
  return "Feito sob encomenda";
}

export const BADGE_LABEL: Record<string, string> = {
  novo: "Novo",
  mais_vendido: "Mais vendido",
  edicao_limitada: "Edição limitada",
  presente: "Ideia de presente",
};
