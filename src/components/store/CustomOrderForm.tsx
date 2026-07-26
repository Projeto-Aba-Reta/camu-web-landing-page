"use client";

import { useState } from "react";
import { submitCustomOrder } from "@/app/actions/custom-orders";

const BUDGETS = ["Até R$150", "R$150–300", "R$300–600", "Acima de R$600"];

const inputClass =
  "w-full rounded-xl border-2 border-charcoal bg-offwhite px-4 py-3.5 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark";

export default function CustomOrderForm() {
  const [budget, setBudget] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    formData.set("budget", budget);
    const res = await submitCustomOrder(formData);
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      window.location.href = res.whatsappUrl; // abre a conversa já preenchida
    } else {
      setError(res.error);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input name="name" required placeholder="Nome" className={inputClass} />
      <input name="phone" required placeholder="WhatsApp" className={inputClass} />
      <textarea
        name="description"
        required
        rows={3}
        placeholder="Descreva a ideia (personagem, tamanho, referência de cor…)"
        className={`${inputClass} resize-y`}
      />

      <div>
        <div className="mb-2.5 font-heading text-[13px] font-bold text-charcoal">
          Faixa de orçamento
        </div>
        <div className="flex flex-wrap gap-2.5">
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBudget((cur) => (cur === b ? "" : b))}
              className={`rounded-full border-2 border-charcoal px-4 py-2 font-heading text-[12.5px] font-bold text-charcoal transition-colors ${
                budget === b ? "bg-teal" : "bg-offwhite-2 hover:bg-teal/30"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Upload de referência: pós-MVP — por ora a referência vai na conversa do WhatsApp. */}
      <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-charcoal/5 font-heading text-xl font-extrabold text-charcoal/40">
          +
        </div>
        <span className="font-sans text-[12.5px] font-semibold text-charcoal/60">
          Depois de enviar, você anexa a imagem de referência direto na conversa do WhatsApp.
        </span>
      </div>

      {error && (
        <div className="rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || done}
        className="sticker-shadow mt-1.5 rounded-full border-[3px] border-charcoal bg-teal py-4 text-center font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar pelo WhatsApp →"}
      </button>
    </form>
  );
}
