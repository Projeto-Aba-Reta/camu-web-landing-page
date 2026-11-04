"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/money";
import type { StoreItem } from "@/lib/storefront";

const BADGE_LABEL: Record<string, string> = {
  novo: "Novo",
  mais_vendido: "Mais vendido",
  edicao_limitada: "Edição limitada",
  presente: "Ideia de presente",
};

type Sort = "destaques" | "menor" | "maior" | "novidades";

function leadLabel(p: StoreItem): string {
  if (p.fulfillment === "pronta_entrega") return "Pronta entrega";
  if (p.leadDaysMin != null && p.leadDaysMax != null) return `Produzido em ${p.leadDaysMin}–${p.leadDaysMax} dias`;
  if (p.leadDaysMax != null) return `Produzido em até ${p.leadDaysMax} dias`;
  return "Feito sob encomenda";
}

export function StoreCard({ p, priority = false }: { p: StoreItem; priority?: boolean }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const hasVariants = p.variants.length > 0;
  const cover = p.images[0];
  const discount =
    p.compareAtPriceCents && p.compareAtPriceCents > p.priceCents
      ? Math.round((1 - p.priceCents / p.compareAtPriceCents) * 100)
      : null;

  function add(goCheckout: boolean) {
    // Com variantes, a escolha acontece na página do produto.
    if (hasVariants) return router.push(`/loja/${p.slug}`);
    addItem({ productId: p.id, name: p.title, variant: "Padrão", qty: 1, price_cents: p.priceCents });
    if (goCheckout) return router.push("/checkout");
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 transition-transform hover:-translate-y-1">
      <Link href={`/loja/${p.slug}`} className="relative block">
        <div className="placeholder-tiles relative flex aspect-square items-center justify-center">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt ?? p.title}
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <Image src="/images/leon-questioning.png" alt={p.title} width={160} height={160} className="w-[55%] object-contain opacity-90" />
          )}
        </div>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount && (
            <span className="rounded-full border-2 border-charcoal bg-coral px-2.5 py-0.5 font-heading text-[11px] font-bold text-charcoal">
              -{discount}%
            </span>
          )}
          {p.badges.slice(0, 2).map((b) => (
            <span key={b} className="rounded-full border-2 border-charcoal bg-teal px-2.5 py-0.5 font-heading text-[11px] font-bold text-charcoal">
              {BADGE_LABEL[b] ?? b}
            </span>
          ))}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link href={`/loja/${p.slug}`} className="font-heading text-[15px] font-bold leading-tight text-charcoal">
          {p.title}
        </Link>
        {p.shortDescription && <p className="line-clamp-2 text-[12.5px] leading-snug text-charcoal/65">{p.shortDescription}</p>}
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-base font-bold text-teal-dark">
            {hasVariants ? "a partir de " : ""}
            {formatBRL(p.priceCents)}
          </span>
          {discount && p.compareAtPriceCents && (
            <span className="text-[12px] text-charcoal/45 line-through">{formatBRL(p.compareAtPriceCents)}</span>
          )}
        </div>
        <p className="text-[11.5px] leading-snug text-charcoal/55">{leadLabel(p)}</p>
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => add(true)}
            className="sticker-shadow-sm rounded-full border-[3px] border-charcoal bg-coral py-2.5 text-center font-heading text-[12.5px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
          >
            {hasVariants ? "Escolher opção" : "Comprar agora"}
          </button>
          {!hasVariants && (
            <button
              type="button"
              onClick={() => add(false)}
              className="rounded-full border-2 border-charcoal bg-teal py-2.5 text-center font-heading text-[12.5px] font-bold text-charcoal transition-colors hover:bg-teal-dark hover:text-offwhite"
            >
              {added ? "Adicionado ✓" : "+ Carrinho"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StoreCatalog({ items }: { items: StoreItem[] }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("destaques");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.map((p) => p.category).filter((c): c is string => Boolean(c))))],
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q) || (p.shortDescription ?? "").toLowerCase().includes(q)),
    );
    const sorted = [...list];
    if (sort === "menor") sorted.sort((a, b) => a.priceCents - b.priceCents);
    else if (sort === "maior") sorted.sort((a, b) => b.priceCents - a.priceCents);
    else if (sort === "novidades")
      sorted.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
    // "destaques": a ordem já vem do servidor (destaques primeiro).
    return sorted;
  }, [items, category, query, sort]);

  if (items.length === 0) {
    return (
      <div className="rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 px-8 py-14 text-center font-sans text-charcoal/65">
        Nenhuma peça publicada na loja ainda. Volte já já!
      </div>
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2.5">
          {categories.length > 2 &&
            categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border-2 border-charcoal px-4 py-2 font-heading text-[13px] font-bold text-charcoal transition-colors ${
                  category === c ? "bg-teal" : "bg-offwhite-2 hover:bg-teal/30"
                }`}
              >
                {c === "all" ? "Todos" : c}
              </button>
            ))}
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Buscar peça"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-40 rounded-full border-2 border-charcoal bg-offwhite-2 px-4 py-2 font-sans text-[13px] text-charcoal outline-none sm:w-52"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Ordenar"
            className="rounded-full border-2 border-charcoal bg-offwhite-2 px-3 py-2 font-sans text-[13px] text-charcoal"
          >
            <option value="destaques">Destaques</option>
            <option value="novidades">Novidades</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center font-sans text-charcoal/65">Nenhuma peça encontrada para esse filtro.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {visible.map((p, i) => (
            <StoreCard key={p.id} p={p} priority={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}
