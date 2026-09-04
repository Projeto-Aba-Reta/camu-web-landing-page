"use client";

import { useMemo, useState } from "react";
import { createExpressPetMiniatureOrderAndPay } from "@/app/actions/pet-miniature";
import { computePetCartPricing } from "@/lib/pet-miniature-cart-pricing";
import {
  formatBRL,
  FRETE_ENABLED,
  SHIPPING_CENTS,
  isFreteInclusoUF,
  isFreteInclusoCep,
} from "@/lib/money";
import { cepDigits } from "@/lib/cep";
import { useFreteQuote } from "@/lib/use-frete-quote";
import { isValidEmail } from "@/lib/contact";
import { trackFunnel } from "@/lib/analytics";
import type { PetMiniatureVariant } from "@/lib/types";
import AddressFields, {
  addressLine,
  emptyAddress,
  validateAddress,
  type AddressFormValue,
} from "./AddressFields";

const MAX_PETS = 6;

const inputClass =
  "w-full rounded-xl border-2 border-charcoal bg-offwhite px-4 py-3.5 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark";

type Props = {
  semPinturaCents: number | null;
  comPinturaCents: number | null;
};

export default function PetMiniatureExpressForm({ semPinturaCents, comPinturaCents }: Props) {
  const [variant, setVariant] = useState<PetMiniatureVariant>("com_pintura");
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressFormValue>(emptyAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitPriceCents = variant === "com_pintura" ? comPinturaCents : semPinturaCents;
  const priceReady = unitPriceCents != null;

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

  const frete = useFreteQuote({
    cep: address.cep,
    uf: address.uf,
    itemCount: quantity,
    insuranceValueReais: pricing.itemsTotalCents / 100,
  });

  const cepComplete = cepDigits(address.cep).length === 8;
  const freteIncluso = isFreteInclusoCep(address.cep) || isFreteInclusoUF(address.uf);
  const regionKnown = cepComplete || address.uf.trim().length > 0;
  const freteRequired = !FRETE_ENABLED && regionKnown && !freteIncluso;
  const shippingFree = !FRETE_ENABLED && (freteIncluso || !regionKnown);
  const shippingCents = FRETE_ENABLED
    ? SHIPPING_CENTS
    : frete.status === "done"
      ? frete.freteCents
      : 0;

  const shippingLabel = FRETE_ENABLED
    ? formatBRL(SHIPPING_CENTS)
    : shippingFree
      ? "Frete grátis"
      : frete.status === "loading"
        ? "Calculando…"
        : frete.status === "done"
          ? `${formatBRL(frete.freteCents)} · ${frete.service} (${frete.prazoDias} dia(s) úteis)`
          : frete.status === "error"
            ? frete.error
            : "—";

  const totalCents = pricing.itemsTotalCents + shippingCents;

  async function onSubmit() {
    setError(null);
    if (!priceReady) {
      setError("Preço indisponível no momento. Recarregue a página em instantes.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Digite um e-mail válido — é por ele que você manda as fotos.");
      return;
    }
    const addrError = validateAddress(address);
    if (addrError) {
      setError(addrError);
      return;
    }
    if (freteRequired && frete.status !== "done") {
      setError(
        frete.status === "error"
          ? frete.error
          : "Aguarde o cálculo do frete para o seu CEP antes de continuar.",
      );
      return;
    }

    setSubmitting(true);
    const res = await createExpressPetMiniatureOrderAndPay({
      variant,
      quantity,
      email: email.trim(),
      address: {
        cep: address.cep.trim(),
        line: addressLine(address),
        city: address.city.trim(),
        uf: address.uf.trim(),
      },
    });
    if (res.ok) {
      trackFunnel("checkout_iniciado", { fluxo: "miniatura_pet_expressa" });
      window.location.href = res.initPoint;
      return;
    }
    setSubmitting(false);
    setError(res.error);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-7">
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold text-charcoal">Versão da miniatura</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { v: "sem_pintura", label: "Sem pintura", cents: semPinturaCents, hint: "Cor sólida, mais simples." },
                { v: "com_pintura", label: "Com pintura", cents: comPinturaCents, hint: "Pintada nas cores reais do seu pet." },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setVariant(opt.v)}
                className={`rounded-2xl border-[3px] border-charcoal p-4 text-left transition-colors ${
                  variant === opt.v ? "bg-teal" : "bg-offwhite-2 hover:bg-charcoal/5"
                }`}
              >
                <p className="font-heading font-bold text-charcoal">{opt.label}</p>
                {opt.cents != null && (
                  <p className="font-sans text-sm text-charcoal/70">{formatBRL(opt.cents)}</p>
                )}
                <p className="mt-1 font-sans text-[12.5px] text-charcoal/60">{opt.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-bold text-charcoal">Quantos pets?</h2>
          <p className="mb-3 font-sans text-sm text-charcoal/60">
            Cada par de miniaturas sai com desconto. Você manda as fotos de cada pet depois do pagamento.
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
              onClick={() => setQuantity((q) => Math.min(MAX_PETS, q + 1))}
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
              className={inputClass}
              disabled={submitting}
            />
            <p className="mt-1.5 font-sans text-[11px] text-charcoal/50">
              É só o e-mail — a gente manda por ele o link pra enviar as fotos e acompanhar o pedido,
              sem senha.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-bold text-charcoal">Endereço de entrega</h2>
          <p className="mb-4 font-sans text-sm text-charcoal/60">
            Digite o CEP: buscamos o endereço nos Correios e você confere o resto. Preencha o número —
            nenhum campo pode ficar vazio.
          </p>
          <AddressFields value={address} onChange={setAddress} disabled={submitting} />
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
        {regionKnown && (
          <div className="mb-3.5 flex justify-between font-sans text-sm font-medium text-charcoal">
            <span>Frete</span>
            <span className={shippingFree ? "font-bold text-teal" : undefined}>
              {shippingFree ? "Frete grátis" : shippingLabel}
            </span>
          </div>
        )}
        <div className="mb-3.5 h-0.5 bg-charcoal/15" />
        <div className="mb-6 flex justify-between font-heading text-lg font-extrabold text-charcoal">
          <span>Total</span>
          <span>{formatBRL(totalCents)}</span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || (freteRequired && frete.status === "loading")}
          className="sticker-shadow w-full rounded-full border-[3px] border-charcoal bg-coral py-4 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Redirecionando…" : "Ir para o pagamento →"}
        </button>
        <p className="mt-3 font-sans text-[12px] leading-relaxed text-charcoal/55">
          Depois de pagar, você envia as fotos de cada pet numa página só sua. Detalhes da pintura a
          gente combina no WhatsApp.
        </p>
      </aside>
    </div>
  );
}
