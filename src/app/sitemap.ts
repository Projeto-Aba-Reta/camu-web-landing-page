import type { MetadataRoute } from "next";
import { STORE_ENABLED, STORE_V2 } from "@/lib/features";
import { getStoreItems } from "@/lib/storefront";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://camu3d.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
  if (!STORE_ENABLED) return entries;

  entries.push({ url: `${SITE_URL}/loja`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
  if (STORE_V2) {
    try {
      const items = await getStoreItems();
      for (const p of items) {
        entries.push({
          url: `${SITE_URL}/loja/${p.slug}`,
          lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch {
      // Sem banco no build: o sitemap sai só com as páginas estáticas.
    }
  }
  return entries;
}
