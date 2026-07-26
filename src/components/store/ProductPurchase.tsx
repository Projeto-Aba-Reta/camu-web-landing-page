"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";
import QtyStepper from "./QtyStepper";

export default function ProductPurchase({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  function add() {
    addItem({
      productId: product.id,
      name: product.name,
      variant: "Padrão",
      qty,
      price_cents: product.price_cents,
    });
    setAdded(true);
  }

  return (
    <div>
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
    </div>
  );
}
