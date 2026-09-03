"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBRL, FRETE_ENABLED, SHIPPING_CENTS } from "@/lib/money";
import { STORE_ENABLED } from "@/lib/features";
import QtyStepper from "./QtyStepper";

export default function CartView() {
  const { items, subtotalCents, ready, setQty, removeItem } = useCart();

  if (!ready) {
    return <div className="py-16 text-center font-sans text-charcoal/50">Carregando…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 px-8 py-16 text-center">
        <h1 className="mb-3 font-heading text-2xl font-bold text-charcoal">
          Seu carrinho está vazio
        </h1>
        <p className="mb-7 font-sans text-charcoal/65">
          {STORE_ENABLED
            ? "Bora escolher umas peças pra imprimir?"
            : "Que tal fazer a miniatura do seu pet?"}
        </p>
        <Link
          href={STORE_ENABLED ? "/loja" : "/miniatura-pet"}
          className="sticker-shadow-sm inline-block rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5"
        >
          {STORE_ENABLED ? "Ver o catálogo →" : "Fazer a miniatura do meu pet →"}
        </Link>
      </div>
    );
  }

  const total = subtotalCents + SHIPPING_CENTS;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <h1 className="mb-6 font-heading text-3xl font-bold text-charcoal">Seu carrinho</h1>
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variant}`}
              className="flex items-center gap-4 rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-4"
            >
              <div className="placeholder-tiles h-[72px] w-[72px] flex-shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-heading text-[15px] font-bold text-charcoal">
                  {item.name}
                </div>
                <div className="mt-0.5 font-sans text-[12.5px] text-charcoal/55">
                  {item.variant}
                </div>
              </div>
              <QtyStepper
                qty={item.qty}
                size="sm"
                onChange={(n) => setQty(item.productId, item.variant, n)}
              />
              <div className="w-20 text-right font-heading text-[15px] font-bold text-teal-dark">
                {formatBRL(item.price_cents * item.qty)}
              </div>
              <button
                type="button"
                aria-label={`Remover ${item.name}`}
                onClick={() => removeItem(item.productId, item.variant)}
                className="font-heading text-lg font-bold text-charcoal/40 transition-colors hover:text-coral"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <aside className="self-start sticker-shadow rounded-[18px] border-[3px] border-charcoal bg-teal p-7">
        <h2 className="mb-5 font-heading text-xl font-bold text-charcoal">Resumo</h2>
        <div className="mb-2.5 flex justify-between font-sans text-sm font-medium text-charcoal">
          <span>Subtotal</span>
          <span>{formatBRL(subtotalCents)}</span>
        </div>
        <div className="mb-3.5 flex justify-between font-sans text-sm font-medium text-charcoal">
          <span>Frete</span>
          <span>{FRETE_ENABLED ? formatBRL(SHIPPING_CENTS) : "combinado à parte"}</span>
        </div>
        <div className="mb-6 h-0.5 bg-charcoal/20" />
        <div className="mb-6 flex justify-between font-heading text-xl font-extrabold text-charcoal">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
        <Link
          href="/checkout"
          className="block rounded-full bg-charcoal py-4 text-center font-heading font-bold text-offwhite transition-opacity hover:opacity-90"
        >
          Ir para o checkout →
        </Link>
      </aside>
    </div>
  );
}
