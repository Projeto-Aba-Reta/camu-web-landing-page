import type { Metadata } from "next";
import PetMiniatureIntakeForm from "@/components/store/PetMiniatureIntakeForm";

export const metadata: Metadata = {
  title: "Miniatura do seu pet",
  description:
    "Manda 3 a 4 fotos do seu pet e veja uma prévia gerada por IA de como ele ficaria em uma miniatura impressa em 3D — aprove e pague direto pelo site.",
};

const STEPS = [
  { n: "1", label: "Você manda nome, WhatsApp e 3–4 fotos do seu pet" },
  { n: "2", label: "Nossa IA gera uma prévia de como ficaria a miniatura impressa" },
  { n: "3", label: "Você aprova (ou pede outra tentativa) e paga no site" },
];

export default function MiniaturaPetPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
      <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div
            className="mb-4 inline-block rounded-full border-2 border-charcoal bg-teal px-3.5 py-1.5 font-sans text-xs font-bold text-charcoal"
            style={{ transform: "rotate(-2deg)" }}
          >
            novidade
          </div>
          <h1 className="mb-4 font-heading text-3xl font-extrabold leading-tight text-charcoal sm:text-4xl">
            A miniatura
            <br />
            do seu pet, em 3D.
          </h1>
          <p className="mb-5 font-sans text-[15px] leading-relaxed text-charcoal/70">
            Manda umas fotos, veja a prévia antes de pagar qualquer coisa.
          </p>

          <ol className="flex flex-col gap-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 p-4"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-charcoal bg-coral font-heading text-xs font-extrabold text-charcoal">
                  {step.n}
                </span>
                <span className="font-sans text-[13px] leading-relaxed text-charcoal/70">
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <PetMiniatureIntakeForm />
      </div>
    </section>
  );
}
