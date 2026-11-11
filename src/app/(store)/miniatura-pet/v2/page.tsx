import type { Metadata } from "next";
import PetMiniatureIntakeForm from "@/components/store/PetMiniatureIntakeForm";
import PetBeforeAfterCarousel from "@/components/store/PetBeforeAfterCarousel";
import { petBeforeAfterExamplesV2 } from "@/lib/data";

// Página acessada só por URL — fora do menu e não indexável.
export const metadata: Metadata = {
  title: "Miniatura do seu pet — v2",
  robots: { index: false, follow: false },
};

const steps = [
  { n: "1", title: "Nome e fotos", desc: "Diga o nome do pet e mande 3-4 fotos dele." },
  { n: "2", title: "Veja a prévia", desc: "Geramos uma prévia da miniatura antes de você pagar qualquer coisa." },
  { n: "3", title: "Gostou? Finalize", desc: "Só então pedimos seus dados e o endereço de entrega." },
];

// Mobile: cabeçalho enxuto + carrossel + formulário compactos pra caber foto e
// botão "gerar prévia" na primeira tela, sem os passos. Em telas grandes (lg+)
// os passos ocupam uma coluna ao lado do conteúdo principal.
export default function MiniaturaPetV2Page() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-5 sm:px-10 md:py-16 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,44rem)_18rem] lg:justify-center lg:gap-12">
      <div>
        <div className="mb-3 max-w-2xl md:mb-8">
          <div
            className="mb-2 inline-block rounded-full border-2 border-charcoal bg-teal px-3 py-1 font-sans text-xs font-bold text-charcoal md:mb-4 md:px-3.5 md:py-1.5"
            style={{ transform: "rotate(-2deg)" }}
          >
            100% grátis · sem compromisso
          </div>
          <h1 className="mb-1 font-heading text-2xl font-extrabold leading-tight text-charcoal sm:text-4xl md:mb-3">
            A miniatura do seu pet, em 3D.
          </h1>
          <p className="font-sans text-[13px] leading-snug text-charcoal/70 md:text-[15px] md:leading-relaxed">
            Só o nome e as fotos — veja a prévia antes de qualquer cadastro ou pagamento.
          </p>
        </div>

        <PetBeforeAfterCarousel
          examples={petBeforeAfterExamplesV2}
          glow={false}
          className="mb-4 md:mb-10"
        />

        <PetMiniatureIntakeForm v2 />
      </div>

      <ol className="hidden self-start lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-3 lg:pt-24">
        {steps.map((step) => (
          <li
            key={step.n}
            className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 p-4"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-charcoal bg-coral font-heading text-xs font-extrabold text-charcoal">
              {step.n}
            </span>
            <span className="font-sans text-[13px] leading-relaxed text-charcoal/70">
              <strong className="font-bold text-charcoal">{step.title}.</strong> {step.desc}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
