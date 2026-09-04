"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBRL, FRETE_ENABLED, SHIPPING_CENTS, isFreteInclusoUF } from "@/lib/money";
import { useFreteQuote } from "@/lib/use-frete-quote";
import { STORE_ENABLED } from "@/lib/features";
import { trackFunnel } from "@/lib/analytics";
import { createCheckout } from "@/app/actions/orders";

const STEPS = ["Carrinho", "Endereço", "Pagamento", "Confirmação"];

const inputClass =
  "w-full rounded-xl border-2 border-charcoal bg-offwhite-2 px-4 py-3.5 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark";

export default function CheckoutForm({ initialError }: { initialError?: string }) {
  const { items, subtotalCents, count, ready, clear } = useCart();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  const freteIncluso = isFreteInclusoUF(uf);
  const frete = useFreteQuote({
    cep,
    uf,
    itemCount: count,
    insuranceValueReais: subtotalCents / 100,
  });
  const freteRequired = !FRETE_ENABLED && uf.trim().length === 2 && !freteIncluso;
  const shippingFree = !FRETE_ENABLED && (freteIncluso || !uf.trim());
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

  if (ready && items.length === 0 && !submitting) {
    return (
      <div className="rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 px-8 py-16 text-center">
        <h1 className="mb-3 font-heading text-2xl font-bold text-charcoal">Nada pra finalizar</h1>
        <p className="mb-7 font-sans text-charcoal/65">Seu carrinho está vazio.</p>
        <Link
          href={STORE_ENABLED ? "/loja" : "/miniatura-pet"}
          className="sticker-shadow-sm inline-block rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading font-bold text-charcoal"
        >
          {STORE_ENABLED ? "Ver o catálogo →" : "Fazer a miniatura do meu pet →"}
        </Link>
      </div>
    );
  }

  const total = subtotalCents + shippingCents;

  async function onSubmit(formData: FormData) {
    if (freteRequired && frete.status !== "done") {
      setError(
        frete.status === "error"
          ? frete.error
          : "Aguarde o cálculo do frete para o seu CEP antes de continuar.",
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await createCheckout({
      items: items.map((i) => ({ productId: i.productId, variant: i.variant, qty: i.qty })),
      customer: {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        cep: String(formData.get("cep") ?? ""),
        line: String(formData.get("line") ?? ""),
        city: String(formData.get("city") ?? ""),
        uf: String(formData.get("uf") ?? ""),
      },
    });

    if (res.ok) {
      trackFunnel("checkout_iniciado", { fluxo: "catalogo" });
      clear();
      window.location.href = res.initPoint; // redirect pro Checkout Pro do Mercado Pago
    } else {
      setError(res.error);
      setSubmitting(false);
    }
  }

  return (
    <form action={onSubmit}>
      {/* stepper */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`rounded-full border-2 border-charcoal px-4 py-2 font-heading text-[12.5px] font-bold ${
              i === 1 ? "bg-teal text-charcoal" : "bg-offwhite-2 text-charcoal/55"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          {error}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-7">
          <section>
            <h2 className="mb-4 font-heading text-xl font-bold text-charcoal">Seus dados</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <input name="name" required placeholder="Nome completo" className={`${inputClass} sm:col-span-2`} />
              <input name="email" type="email" required placeholder="E-mail" className={inputClass} />
              <input name="phone" placeholder="WhatsApp / telefone" className={inputClass} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-heading text-xl font-bold text-charcoal">Endereço de entrega</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <input
                name="cep"
                placeholder="CEP"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className={inputClass}
              />
              <input name="city" placeholder="Cidade" className={inputClass} />
              <input
                name="uf"
                placeholder="UF"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className={inputClass}
              />
              <input name="line" placeholder="Endereço, número, complemento" className={`${inputClass} sm:col-span-2`} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-heading text-xl font-bold text-charcoal">Pagamento</h2>
            <div className="rounded-2xl border-2 border-dashed border-teal bg-offwhite p-5">
              <div className="mb-1.5 font-heading text-sm font-bold text-charcoal">
                Pix ou cartão de crédito
              </div>
              <p className="font-sans text-[13px] leading-relaxed text-charcoal/65">
                Ao finalizar, você vai pro ambiente seguro do <strong>Mercado Pago</strong> pra
                pagar com Pix (confirmação na hora) ou cartão. Assim que o pagamento cair, seu
                pedido entra em produção.
              </p>
            </div>
          </section>
        </div>

        <aside className="self-start rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 p-6">
          <h2 className="mb-4 font-heading text-[17px] font-bold text-charcoal">Resumo do pedido</h2>
          <div className="mb-4 font-sans text-[13.5px] text-charcoal/65">
            {ready ? `${count} ${count === 1 ? "item" : "itens"}` : "…"}
          </div>
          <div className="mb-2 flex justify-between font-sans text-sm font-medium text-charcoal">
            <span>Subtotal</span>
            <span>{formatBRL(subtotalCents)}</span>
          </div>
          <div className="mb-3.5 flex justify-between font-sans text-sm font-medium text-charcoal">
            <span>Frete</span>
            <span className={shippingFree ? "font-bold text-teal" : undefined}>{shippingLabel}</span>
          </div>
          <div className="mb-3.5 h-0.5 bg-charcoal/15" />
          <div className="mb-6 flex justify-between font-heading text-lg font-extrabold text-charcoal">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting || (freteRequired && frete.status === "loading")}
            className="sticker-shadow w-full rounded-full border-[3px] border-charcoal bg-coral py-4 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Redirecionando…" : "Finalizar pedido"}
          </button>
        </aside>
      </div>
    </form>
  );
}
