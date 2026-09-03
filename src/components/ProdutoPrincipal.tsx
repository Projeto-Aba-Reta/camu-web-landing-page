import Image from "next/image";
import TrackedLink from "@/components/TrackedLink";
import { heroPet, petMiniatureSteps } from "@/lib/data";

export default function ProdutoPrincipal() {
  return (
    <section
      id="miniatura-pet"
      className="border-t-[3px] border-charcoal bg-offwhite-2 px-6 py-16 sm:px-10 md:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 md:grid-cols-[0.85fr_1.15fr]">
          {/* Card em destaque — única peça da home com sticker-shadow-lg junto do CTA do hero. */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="sticker-shadow-lg flex aspect-square w-full -rotate-2 items-center justify-center overflow-hidden rounded-[28px] border-[3px] border-charcoal bg-teal">
              {/* [substituir por foto real: pet + miniatura impressa lado a lado] */}
              <Image
                src="/images/leon-jumping.png"
                alt="Miniatura impressa em 3D — exemplo"
                width={320}
                height={320}
                className="w-[74%] rotate-2 object-contain"
              />
            </div>
            <span className="absolute -right-3 -top-3 rotate-3 rounded-full border-[3px] border-charcoal bg-coral px-3.5 py-2 font-heading text-[13px] font-bold text-charcoal">
              {heroPet.previewNote}
            </span>
          </div>

          <div>
            <span className="text-[13px] font-bold uppercase tracking-wider text-teal-dark">
              O carro-chefe da Camu
            </span>
            <h2 className="mt-2.5 font-heading text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
              Transforme seu pet numa miniatura de verdade.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-charcoal/75">
              Sem risco: a prévia é gerada antes de qualquer pagamento. Você só
              fecha se a miniatura ficar com a cara do seu bicho.
            </p>

            <ol className="mt-6 flex flex-col gap-3">
              {petMiniatureSteps.map((step) => (
                <li key={step.n} className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-[3px] border-charcoal bg-teal font-heading text-sm font-extrabold text-charcoal">
                    {step.n}
                  </span>
                  <div>
                    <div className="font-heading text-[15px] font-bold text-charcoal">
                      {step.title}
                    </div>
                    <div className="text-sm leading-relaxed text-charcoal/65">
                      {step.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <TrackedLink
                href={heroPet.primaryCta.href}
                event="home_cta_miniatura"
                eventProps={{ origem: "bloco-produto" }}
                className="sticker-shadow rounded-full border-[3px] border-charcoal bg-coral px-6 py-3.5 font-heading text-[15px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
              >
                {heroPet.primaryCta.label} →
              </TrackedLink>
              <span className="font-heading text-[13px] font-bold text-charcoal/70">
                {heroPet.priceFrom} · {heroPet.leadTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
