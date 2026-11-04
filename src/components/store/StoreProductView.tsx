"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/money";
import type { StoreItem } from "@/lib/storefront";
import QtyStepper from "./QtyStepper";

const BADGE_LABEL: Record<string, string> = {
  novo: "Novo",
  mais_vendido: "Mais vendido",
  edicao_limitada: "Edição limitada",
  presente: "Ideia de presente",
};

export default function StoreProductView({ item, lead }: { item: StoreItem; lead: string }) {
  const { addItem } = useCart();
  const [imgIndex, setImgIndex] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(item.variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = item.variants.find((v) => v.id === variantId) ?? null;
  const unit = item.priceCents + (variant?.priceDeltaCents ?? 0);
  const compareAt = item.compareAtPriceCents && item.compareAtPriceCents > item.priceCents ? item.compareAtPriceCents : null;
  const current = item.images[imgIndex];

  function add() {
    addItem({
      productId: item.id,
      name: item.title,
      variant: variant?.label ?? "Padrão",
      qty,
      price_cents: unit,
    });
    setAdded(true);
  }

  return (
    <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
      <div>
        <div className="placeholder-tiles relative mb-3.5 flex aspect-square items-center justify-center overflow-hidden rounded-[20px] border-[3px] border-charcoal">
          {current ? (
            <Image
              src={current.url}
              alt={current.alt ?? item.title}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
              priority
            />
          ) : (
            <span className="font-mono text-xs font-semibold text-charcoal/55">[foto principal produto]</span>
          )}
        </div>
        {item.images.length > 1 && (
          <div className="grid grid-cols-5 gap-2.5">
            {item.images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setImgIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded-xl border-[3px] ${
                  i === imgIndex ? "border-coral" : "border-charcoal"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3.5 flex flex-wrap gap-2">
          <span className="rounded-full border-2 border-charcoal bg-teal px-3 py-1.5 font-sans text-[11px] font-bold text-charcoal">
            {lead}
          </span>
          {item.badges.map((b) => (
            <span key={b} className="rounded-full border-2 border-charcoal bg-coral px-3 py-1.5 font-sans text-[11px] font-bold text-charcoal">
              {BADGE_LABEL[b] ?? b}
            </span>
          ))}
        </div>
        <h1 className="mb-2.5 font-heading text-3xl font-extrabold text-charcoal">{item.title}</h1>
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-heading text-2xl font-bold text-teal-dark">{formatBRL(unit)}</span>
          {compareAt && <span className="text-base text-charcoal/45 line-through">{formatBRL(compareAt)}</span>}
        </div>

        {item.shortDescription && (
          <p className="mb-4 font-sans text-[15px] leading-relaxed text-charcoal/75">{item.shortDescription}</p>
        )}

        {item.highlights.length > 0 && (
          <ul className="mb-6 space-y-1.5 font-sans text-[14px] text-charcoal/80">
            {item.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span aria-hidden className="font-bold text-teal-dark">✓</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        {item.variants.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 font-heading text-[13px] font-bold text-charcoal">Opção</div>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-full border-2 border-charcoal px-4 py-2 font-heading text-[13px] font-bold text-charcoal transition-colors ${
                    v.id === variantId ? "bg-teal" : "bg-offwhite-2 hover:bg-teal/30"
                  }`}
                >
                  {v.label}
                  {v.priceDeltaCents !== 0 && (
                    <span className="ml-1 font-normal text-charcoal/65">
                      ({v.priceDeltaCents > 0 ? "+" : "−"}
                      {formatBRL(Math.abs(v.priceDeltaCents))})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <div className="font-heading text-[13px] font-bold text-charcoal">Quantidade</div>
          <QtyStepper qty={qty} onChange={setQty} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={add}
            className="sticker-shadow rounded-full border-[3px] border-charcoal bg-coral px-7 py-4 font-heading text-base font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
          >
            Adicionar ao carrinho
          </button>
          {added && (
            <Link
              href="/carrinho"
              className="rounded-full border-[3px] border-charcoal bg-teal px-6 py-4 font-heading text-base font-bold text-charcoal transition-transform hover:-translate-y-0.5"
            >
              Ir para o carrinho →
            </Link>
          )}
        </div>
        <p className="mt-4 font-sans text-[12.5px] text-charcoal/55">Frete calculado no checkout · Pix ou cartão</p>

        {item.description && (
          <div className="mt-8 border-t-2 border-charcoal/15 pt-6">
            <h2 className="mb-2 font-heading text-lg font-bold text-charcoal">Sobre a peça</h2>
            <p className="whitespace-pre-line font-sans text-[15px] leading-relaxed text-charcoal/75">{item.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
