"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { approvePetMiniatureCartAndPay } from "@/app/actions/pet-miniature";
import { usePetCart } from "@/lib/pet-miniature-cart";
import { formatBRL, FRETE_ENABLED, SHIPPING_CENTS, isFreteInclusoUF } from "@/lib/money";
import { trackFunnel } from "@/lib/analytics";
import AddressFields, {
  addressLine,
  emptyAddress,
  validateAddress,
  type AddressFormValue,
} from "./AddressFields";

const variantLabel = (v: string) => (v === "com_pintura" ? "Com pintura" : "Sem pintura");

export default function PetMiniatureCart() {
  const router = useRouter();
  const { items, ready, pricing, remove, clear } = usePetCart();
  const [address, setAddress] = useState<AddressFormValue>(emptyAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const netByRequest = useMemo(
    () => new Map(pricing.lines.map((l) => [l.key, l])),
    [pricing.lines],
  );

  if (!ready) {
    return <p className="font-sans text-sm text-charcoal/60">Carregando o carrinho…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 px-8 py-16 text-center">
        <h1 className="mb-3 font-heading text-2xl font-bold text-charcoal">
          Nenhuma miniatura no carrinho
        </h1>
        <p className="mb-7 font-sans text-charcoal/65">
          Mande as fotos do seu pet e aprove uma prévia pra começar.
        </p>
        <Link
          href="/miniatura-pet"
          className="sticker-shadow-sm inline-block rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading font-bold text-charcoal"
        >
          Fazer a miniatura do meu pet →
        </Link>
      </div>
    );
  }

  const ufFilled = address.uf.trim().length > 0;
  const freteIncluso = isFreteInclusoUF(address.uf);
  const shippingFree = !FRETE_ENABLED && (freteIncluso || !address.uf.trim());
  const shippingLabel = FRETE_ENABLED
    ? formatBRL(SHIPPING_CENTS)
    : shippingFree
      ? "Frete grátis"
      : "combinado à parte pelo WhatsApp";
  const totalCents = pricing.itemsTotalCents + (FRETE_ENABLED ? SHIPPING_CENTS : 0);
  const orderEmail = items.find((i) => i.customerEmail)?.customerEmail ?? null;

  async function onSubmit() {
    const addrError = validateAddress(address);
    if (addrError) {
      setError(addrError);
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await approvePetMiniatureCartAndPay(
      items.map((i) => ({ requestId: i.requestId, variant: i.variant })),
      {
        cep: address.cep.trim(),
        line: addressLine(address),
        city: address.city.trim(),
        uf: address.uf.trim(),
      },
    );
    if (res.ok) {
      trackFunnel("checkout_iniciado", { fluxo: "miniatura_pet_carrinho" });
      clear();
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
          <h2 className="mb-2 font-heading text-xl font-bold text-charcoal">Endereço de entrega</h2>
          <p className="mb-4 font-sans text-sm text-charcoal/60">
            Digite o CEP: buscamos o endereço nos Correios e você confere o resto. Preencha o
            número — nenhum campo pode ficar vazio.
          </p>
          <AddressFields value={address} onChange={setAddress} disabled={submitting} />
        </section>

        <section className="flex flex-col gap-3">
          {items.map((line) => {
            const p = netByRequest.get(line.requestId);
            const discounted = p?.discounted ?? false;
            return (
              <div
                key={line.requestId}
                className="flex items-center gap-4 rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-3"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 border-charcoal">
                  {line.previewUrl && (
                    <Image
                      src={line.previewUrl}
                      alt="Prévia da miniatura"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-bold text-charcoal">
                    Miniatura do seu pet
                  </p>
                  <p className="font-sans text-[13px] text-charcoal/60">
                    {variantLabel(line.variant)}
                  </p>
                </div>
                <div className="text-right">
                  {discounted && p ? (
                    <>
                      <span className="block font-sans text-[12px] text-charcoal/45 line-through">
                        {formatBRL(p.unitPriceCents)}
                      </span>
                      <span className="font-heading text-sm font-bold text-teal-dark">
                        {formatBRL(p.netPriceCents)}
                      </span>
                    </>
                  ) : (
                    <span className="font-heading text-sm font-bold text-charcoal">
                      {formatBRL(p?.unitPriceCents ?? line.unitPriceCents)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.requestId)}
                  aria-label="Remover do carrinho"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-charcoal bg-offwhite font-heading text-xs font-extrabold text-charcoal"
                >
                  ×
                </button>
              </div>
            );
          })}

          <Link
            href="/miniatura-pet"
            className="self-start rounded-full border-[3px] border-charcoal bg-transparent px-5 py-2.5 font-heading text-[13px] font-bold text-charcoal transition-colors hover:bg-charcoal/5"
          >
            + Adicionar outro pet
          </Link>
        </section>
      </div>

      <aside className="self-start rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 p-6">
        <h2 className="mb-1 font-heading text-[17px] font-bold text-charcoal">Resumo</h2>
        {orderEmail && (
          <p className="mb-4 font-sans text-[12.5px] text-charcoal/55">Pedido para {orderEmail}</p>
        )}

        {pricing.pairDiscountPct > 0 && (
          <div className="mb-4 rounded-xl border-2 border-dashed border-teal bg-teal/10 px-3 py-2 font-sans text-[12.5px] text-charcoal/75">
            Leve 2 e cada par sai com <strong>{pricing.pairDiscountPct}% OFF</strong>.
            {items.length === 1 && " Adicione mais um pet pra ativar."}
          </div>
        )}

        <div className="mb-2 flex justify-between font-sans text-sm font-medium text-charcoal">
          <span>
            Subtotal ({items.length} {items.length === 1 ? "miniatura" : "miniaturas"})
          </span>
          <span>{formatBRL(pricing.subtotalCents)}</span>
        </div>
        {pricing.discountCents > 0 && (
          <div className="mb-2 flex justify-between font-sans text-sm font-medium text-teal-dark">
            <span>Desconto ({pricing.discountedUnitCount} un.)</span>
            <span>−{formatBRL(pricing.discountCents)}</span>
          </div>
        )}
        {ufFilled && (
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
          disabled={submitting}
          className="sticker-shadow w-full rounded-full border-[3px] border-charcoal bg-coral py-4 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Redirecionando…" : "Ir para o pagamento →"}
        </button>
      </aside>
    </div>
  );
}
