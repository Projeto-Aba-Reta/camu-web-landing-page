import type { Metadata } from "next";
import { getPetMiniaturePricing } from "@/lib/store";
import PetMiniatureExpressForm from "@/components/store/PetMiniatureExpressForm";

export const dynamic = "force-dynamic";

// Página acessada só por URL — fora do menu e não indexável.
export const metadata: Metadata = {
  title: "Miniatura do seu pet — pedido expresso",
  robots: { index: false, follow: false },
};

const steps = [
  { n: "1", title: "Você escolhe e paga", desc: "Versão, quantidade, endereço — e paga no site." },
  { n: "2", title: "Manda as fotos", desc: "Depois do pagamento, num link só seu: 3-4 fotos de cada pet." },
  { n: "3", title: "A gente produz", desc: "Impressão 3D sob medida. Detalhes da pintura combinamos no WhatsApp." },
];

export default async function MiniaturaPetExpressaPage() {
  const pricing = await getPetMiniaturePricing();

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10 md:py-16">
      <div className="mb-8 max-w-2xl">
        <div
          className="mb-4 inline-block rounded-full border-2 border-charcoal bg-teal px-3.5 py-1.5 font-sans text-xs font-bold text-charcoal"
          style={{ transform: "rotate(-2deg)" }}
        >
          pedido expresso
        </div>
        <h1 className="mb-3 font-heading text-3xl font-extrabold leading-tight text-charcoal sm:text-4xl">
          A miniatura do seu pet, sem enrolação.
        </h1>
        <p className="font-sans text-[15px] leading-relaxed text-charcoal/70">
          Paga agora e manda as fotos depois — só e-mail, sem cadastro, sem esperar prévia.
        </p>
      </div>

      <ol className="mb-10 grid gap-3 sm:grid-cols-3">
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

      <PetMiniatureExpressForm
        semPinturaCents={pricing.semPinturaCents}
        comPinturaCents={pricing.comPinturaCents}
      />
    </section>
  );
}
