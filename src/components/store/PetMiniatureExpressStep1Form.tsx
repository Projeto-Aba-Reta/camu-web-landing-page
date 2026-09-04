"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computePetCartPricing } from "@/lib/pet-miniature-cart-pricing";
import { formatBRL } from "@/lib/money";
import { isValidEmail } from "@/lib/contact";

type Props = {
  comPinturaCents: number | null;
  initialQuantity?: number;
  initialEmail?: string;
};

export default function PetMiniatureExpressStep1Form({
  comPinturaCents,
  initialQuantity,
  initialEmail,
}: Props) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [error, setError] = useState<string | null>(null);

  const unitPriceCents = comPinturaCents;

  const pricing = useMemo(
    () =>
      computePetCartPricing(
        Array.from({ length: quantity }, (_, i) => ({
          key: String(i),
          unitPriceCents: unitPriceCents ?? 0,
        })),
      ),
    [quantity, unitPriceCents],
  );

  function onContinue() {
    if (!isValidEmail(email)) {
      setError("Digite um e-mail válido — é por ele que você manda as fotos.");
      return;
    }
    setError(null);
    const params = new URLSearchParams({
      quantidade: String(quantity),
      email: email.trim(),
    });
    router.push(`/miniatura-pet/expressa/entrega?${params.toString()}`);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-7">
        <section>
          <h2 className="mb-2 font-heading text-xl font-bold text-charcoal">Quantos pets?</h2>
          <p className="mb-3 font-sans text-sm text-charcoal/60">
            Miniatura pintada nas cores reais do seu pet
            {unitPriceCents != null && <> — {formatBRL(unitPriceCents)} cada</>}. Cada par sai com
            desconto. Você manda as fotos de cada pet depois do pagamento.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Menos um pet"
              className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-charcoal bg-offwhite font-heading text-lg font-extrabold text-charcoal"
            >
              −
            </button>
            <span className="w-10 text-center font-heading text-lg font-extrabold text-charcoal">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Mais um pet"
              className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-charcoal bg-offwhite font-heading text-lg font-extrabold text-charcoal"
            >
              +
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-bold text-charcoal">Seu e-mail</h2>
          <div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              className="w-full rounded-xl border-2 border-charcoal bg-offwhite px-4 py-3.5 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark"
            />
            <p className="mt-1.5 font-sans text-[11px] text-charcoal/50">
              É só o e-mail — a gente manda por ele o link pra enviar as fotos e acompanhar o pedido,
              sem senha.
            </p>
          </div>
        </section>
      </div>

      <aside className="self-start rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 p-6">
        <h2 className="mb-4 font-heading text-[17px] font-bold text-charcoal">Resumo</h2>

        {pricing.pairDiscountPct > 0 && (
          <div className="mb-4 rounded-xl border-2 border-dashed border-teal bg-teal/10 px-3 py-2 font-sans text-[12.5px] text-charcoal/75">
            Leve 2 e cada par sai com <strong>{pricing.pairDiscountPct}% OFF</strong>.
            {quantity === 1 && " Adicione mais um pet pra ativar."}
          </div>
        )}

        <div className="mb-2 flex justify-between font-sans text-sm font-medium text-charcoal">
          <span>
            Subtotal ({quantity} {quantity === 1 ? "miniatura" : "miniaturas"})
          </span>
          <span>{formatBRL(pricing.subtotalCents)}</span>
        </div>
        {pricing.discountCents > 0 && (
          <div className="mb-2 flex justify-between font-sans text-sm font-medium text-teal-dark">
            <span>Desconto ({pricing.discountedUnitCount} un.)</span>
            <span>−{formatBRL(pricing.discountCents)}</span>
          </div>
        )}
        <div className="mb-3.5 h-0.5 bg-charcoal/15" />
        <div className="mb-6 flex justify-between font-heading text-lg font-extrabold text-charcoal">
          <span>Subtotal</span>
          <span>{formatBRL(pricing.itemsTotalCents)}</span>
        </div>
        <p className="mb-4 font-sans text-[11.5px] text-charcoal/50">
          Frete é calculado no próximo passo, a partir do seu CEP.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="sticker-shadow w-full rounded-full border-[3px] border-charcoal bg-coral py-4 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
        >
          Continuar para entrega →
        </button>
      </aside>
    </div>
  );
}
