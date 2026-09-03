import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/lib/store";
import { STORE_ENABLED } from "@/lib/features";
import { formatBRL } from "@/lib/money";
import ProductPurchase from "@/components/store/ProductPurchase";

export const dynamic = "force-dynamic";

type Params = { id: string };

const SIZE_LABEL: Record<string, string> = { P: "Pequena", M: "Média", G: "Grande" };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProdutoPage({ params }: { params: Promise<Params> }) {
  if (!STORE_ENABLED) notFound();

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const sizeLabel = product.size_tier
    ? SIZE_LABEL[product.size_tier] ?? product.size_tier
    : null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
      <Link
        href="/loja"
        className="mb-6 inline-block font-sans text-sm font-medium text-charcoal/60 hover:text-teal-dark"
      >
        ← Voltar ao catálogo
      </Link>

      <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="placeholder-tiles relative mb-3.5 flex aspect-square items-center justify-center overflow-hidden rounded-[20px] border-[3px] border-charcoal">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
                priority
              />
            ) : (
              <span className="font-mono text-xs font-semibold text-charcoal/55">
                [foto principal produto]
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3.5 inline-block rounded-full border-2 border-charcoal bg-teal px-3 py-1.5 font-sans text-[11px] font-bold text-charcoal">
            feito sob encomenda{sizeLabel ? ` · peça ${sizeLabel.toLowerCase()}` : ""}
          </div>
          <h1 className="mb-2.5 font-heading text-3xl font-extrabold text-charcoal">
            {product.name}
          </h1>
          <div className="mb-5 font-heading text-2xl font-bold text-teal-dark">
            {formatBRL(product.price_cents)}
          </div>
          {product.description && (
            <p className="mb-6 font-sans text-[15px] leading-relaxed text-charcoal/75">
              {product.description}
            </p>
          )}
          <ProductPurchase product={product} />
        </div>
      </div>
    </section>
  );
}
