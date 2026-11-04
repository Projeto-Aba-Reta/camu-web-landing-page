import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/lib/store";
import { getRelatedItems, getStoreItemBySlug, getStoreSlugById, leadTimeLabel } from "@/lib/storefront";
import { STORE_ENABLED, STORE_V2 } from "@/lib/features";
import { formatBRL } from "@/lib/money";
import ProductPurchase from "@/components/store/ProductPurchase";
import StoreProductView from "@/components/store/StoreProductView";
import { StoreCard } from "@/components/store/StoreCatalog";

export const dynamic = "force-dynamic";

type Params = { slug: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIZE_LABEL: Record<string, string> = { P: "Pequena", M: "Média", G: "Grande" };
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://camu3d.com.br";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;

  if (STORE_V2) {
    const item = await getStoreItemBySlug(slug);
    if (item) {
      const title = item.seoTitle || item.title;
      const description = item.seoDescription || item.shortDescription || item.description?.slice(0, 160) || undefined;
      return {
        title,
        description,
        alternates: { canonical: `/loja/${item.slug}` },
        openGraph: { title, description, images: item.images[0] ? [item.images[0].url] : undefined },
      };
    }
  }
  const legacy = UUID_RE.test(slug) ? await getProductById(slug) : null;
  if (!legacy) return { title: "Produto não encontrado" };
  return { title: legacy.name, description: legacy.description ?? undefined };
}

export default async function ProdutoPage({ params }: { params: Promise<Params> }) {
  if (!STORE_ENABLED) notFound();
  const { slug } = await params;

  if (STORE_V2) {
    const item = await getStoreItemBySlug(slug);
    if (item) {
      const related = await getRelatedItems(item);
      const lead = leadTimeLabel(item);
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.title,
        description: item.seoDescription || item.shortDescription || item.description || undefined,
        image: item.images.map((i) => i.url),
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: (item.priceCents / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/loja/${item.slug}`,
        },
      };
      return (
        <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <Link href="/loja" className="mb-6 inline-block font-sans text-sm font-medium text-charcoal/60 hover:text-teal-dark">
            ← Voltar ao catálogo
          </Link>
          <StoreProductView item={item} lead={lead} />
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="mb-5 font-heading text-2xl font-bold text-charcoal">Você também vai gostar</h2>
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {related.map((p) => (
                  <StoreCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          )}
        </section>
      );
    }

    // Link antigo /loja/<uuid> → URL amigável.
    if (UUID_RE.test(slug)) {
      const newSlug = await getStoreSlugById(slug);
      if (newSlug) permanentRedirect(`/loja/${newSlug}`);
    }
  }

  // Caminho legado (products + listing loja_propria), só por uuid.
  const product = UUID_RE.test(slug) ? await getProductById(slug) : null;
  if (!product) notFound();
  const sizeLabel = product.size_tier ? SIZE_LABEL[product.size_tier] ?? product.size_tier : null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
      <Link href="/loja" className="mb-6 inline-block font-sans text-sm font-medium text-charcoal/60 hover:text-teal-dark">
        ← Voltar ao catálogo
      </Link>
      <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div className="placeholder-tiles relative mb-3.5 flex aspect-square items-center justify-center overflow-hidden rounded-[20px] border-[3px] border-charcoal">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" priority />
          ) : (
            <span className="font-mono text-xs font-semibold text-charcoal/55">[foto principal produto]</span>
          )}
        </div>
        <div>
          <div className="mb-3.5 inline-block rounded-full border-2 border-charcoal bg-teal px-3 py-1.5 font-sans text-[11px] font-bold text-charcoal">
            feito sob encomenda{sizeLabel ? ` · peça ${sizeLabel.toLowerCase()}` : ""}
          </div>
          <h1 className="mb-2.5 font-heading text-3xl font-extrabold text-charcoal">{product.name}</h1>
          <div className="mb-5 font-heading text-2xl font-bold text-teal-dark">{formatBRL(product.price_cents)}</div>
          {product.description && (
            <p className="mb-6 font-sans text-[15px] leading-relaxed text-charcoal/75">{product.description}</p>
          )}
          <ProductPurchase product={product} />
        </div>
      </div>
    </section>
  );
}
