import type { Metadata } from "next";
import PetMiniatureIntakeForm from "@/components/store/PetMiniatureIntakeForm";
import StickyCta from "@/components/StickyCta";
import { petMiniatureSteps } from "@/lib/data";

export const metadata: Metadata = {
  title: "Miniatura do seu pet",
  description:
    "Manda 3 a 4 fotos do seu pet e veja uma prévia gerada por IA de como ele ficaria em uma miniatura impressa em 3D — aprove e pague direto pelo site.",
};

export default function MiniaturaPetPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-28 pt-12 sm:px-10 md:py-16 md:pb-16">
      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-12">
        {/* Cabeçalho — compacto, sempre acima do formulário */}
        <div className="order-1 md:order-1">
          <div
            className="mb-4 inline-block rounded-full border-2 border-charcoal bg-teal px-3.5 py-1.5 font-sans text-xs font-bold text-charcoal"
            style={{ transform: "rotate(-2deg)" }}
          >
            novidade
          </div>
          <h1 className="mb-3 font-heading text-3xl font-extrabold leading-tight text-charcoal sm:text-4xl">
            A miniatura
            <br />
            do seu pet, em 3D.
          </h1>
          <p className="font-sans text-[15px] leading-relaxed text-charcoal/70">
            Manda as fotos e veja a prévia antes de pagar qualquer coisa.
          </p>
        </div>

        {/* Formulário — primeiro bloco interativo no mobile */}
        <div id="intake-form" className="order-2 md:order-2 md:row-span-2 md:self-start">
          <PetMiniatureIntakeForm />
        </div>

        {/* Passos — abaixo do formulário no mobile, coluna esquerda no desktop */}
        <ol className="order-3 flex flex-col gap-3 md:order-3">
          {petMiniatureSteps.map((step) => (
            <li
              key={step.n}
              className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 p-4"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-charcoal bg-coral font-heading text-xs font-extrabold text-charcoal">
                {step.n}
              </span>
              <span className="font-sans text-[13px] leading-relaxed text-charcoal/70">
                <strong className="font-bold text-charcoal">{step.title}.</strong>{" "}
                {step.desc}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <StickyCta
        label="Gerar prévia da miniatura"
        href="#intake-form"
        origin="miniatura-pet-barra-mobile"
        scrollTargetId="intake-form"
      />
    </section>
  );
}
