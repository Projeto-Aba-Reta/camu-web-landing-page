"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/money";
import type { Product } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  all: "Todos",
  miniatura_colecionavel: "Miniaturas",
  personalizado: "Personalizados",
  utilitario: "Utilitários",
  linha_leon: "Linha Leon",
};

function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c] ?? c;
}

export default function CatalogClient({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState("all");
  const { addItem } = useCart();
  const [added, setAdded] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const visible = filter === "all" ? products : products.filter((p) => p.category === filter);

  function quickAdd(p: Product) {
    addItem({
      productId: p.id,
      name: p.name,
      variant: "Padrão",
      qty: 1,
      price_cents: p.price_cents,
    });
    setAdded(p.id);
    setTimeout(() => setAdded((s) => (s === p.id ? null : s)), 1400);
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 px-8 py-14 text-center font-sans text-charcoal/65">
        Nenhuma peça publicada na loja ainda. Volte já já!
      </div>
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap gap-2.5">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded-full border-2 border-charcoal px-4 py-2 font-heading text-[13px] font-bold text-charcoal transition-colors ${
              filter === c ? "bg-teal" : "bg-offwhite-2 hover:bg-teal/30"
            }`}
          >
            {categoryLabel(c)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {visible.map((p) => (
          <div
            key={p.id}
            className="flex flex-col overflow-hidden rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 transition-transform hover:-translate-y-1"
          >
            <Link href={`/loja/${p.id}`} className="block">
              <div className="placeholder-tiles relative flex aspect-square items-center justify-center">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="font-mono text-[11px] font-semibold text-charcoal/55">
                    [foto produto]
                  </span>
                )}
              </div>
            </Link>
            <div className="flex flex-1 flex-col gap-2.5 p-4">
              <Link href={`/loja/${p.id}`} className="font-heading text-[15px] font-bold text-charcoal">
                {p.name}
              </Link>
              <div className="font-heading text-base font-bold text-teal-dark">
                {formatBRL(p.price_cents)}
              </div>
              <button
                type="button"
                onClick={() => quickAdd(p)}
                className="mt-auto rounded-full border-2 border-charcoal bg-teal py-2.5 text-center font-heading text-[12.5px] font-bold text-charcoal transition-colors hover:bg-teal-dark hover:text-offwhite"
              >
                {added === p.id ? "Adicionado ✓" : "+ Carrinho"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
