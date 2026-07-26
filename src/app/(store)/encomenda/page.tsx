import type { Metadata } from "next";
import CustomOrderForm from "@/components/store/CustomOrderForm";

export const metadata: Metadata = {
  title: "Encomenda personalizada",
  description:
    "Manda a ideia, a gente imprime. Conta o que você quer e a Camu te chama no WhatsApp com o orçamento.",
};

export default function EncomendaPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
      <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div
            className="mb-4 inline-block rounded-full border-2 border-charcoal bg-coral px-3.5 py-1.5 font-sans text-xs font-bold text-charcoal"
            style={{ transform: "rotate(-2deg)" }}
          >
            sob medida
          </div>
          <h1 className="mb-4 font-heading text-3xl font-extrabold leading-tight text-charcoal sm:text-4xl">
            Manda a ideia,
            <br />a gente imprime.
          </h1>
          <p className="mb-5 font-sans text-[15px] leading-relaxed text-charcoal/70">
            Conta o que você quer, anexa uma referência e a gente te chama no WhatsApp com o
            orçamento.
          </p>
          <div className="rounded-2xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 p-5">
            <div className="mb-1.5 font-heading text-[13px] font-bold text-charcoal">
              Como funciona depois de enviar
            </div>
            <div className="font-sans text-[12.5px] leading-relaxed text-charcoal/60">
              1. Você preenche o formulário → 2. Abrimos uma conversa no WhatsApp já com os detalhes
              → 3. Fechamos preço e prazo por lá.
            </div>
          </div>
        </div>

        <CustomOrderForm />
      </div>
    </section>
  );
}
