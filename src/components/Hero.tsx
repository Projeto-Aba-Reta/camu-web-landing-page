import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import { heroPet, petBeforeAfterExamples } from "@/lib/data";
import { STORE_ENABLED } from "@/lib/features";
import PetBeforeAfterCarousel from "@/components/store/PetBeforeAfterCarousel";

export default function Hero() {
  return (
    <section
      id="top"
      className="px-6 py-14 sm:px-10 md:py-24 lg:min-h-[80vh] lg:flex lg:items-center"
      style={{
        background:
          "radial-gradient(circle at 85% 20%, rgba(15,191,160,.14), transparent 55%)",
      }}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <span className="mb-5 inline-block -rotate-2 rounded-full border-2 border-charcoal bg-teal px-3.5 py-1.5 text-xs font-bold text-charcoal">
            {heroPet.badge}
          </span>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.05] text-charcoal sm:text-5xl md:text-6xl">
            {heroPet.title[0]}
            <br />
            {heroPet.title[1]}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-charcoal/75">
            {heroPet.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-heading text-[13px] font-bold text-charcoal/70 md:justify-start">
            <span>{heroPet.priceFrom}</span>
            <span aria-hidden>·</span>
            <span>{heroPet.leadTime}</span>
            <span aria-hidden>·</span>
            <span className="text-teal-dark">{heroPet.previewNote}</span>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3.5 md:justify-start">
            <TrackedLink
              href={heroPet.primaryCta.href}
              event="home_cta_miniatura"
              eventProps={{ origem: "hero" }}
              className="sticker-shadow-lg rounded-full border-[3px] border-charcoal bg-coral px-7 py-4 font-heading text-base font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
            >
              {heroPet.primaryCta.label} →
            </TrackedLink>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 font-heading text-sm font-bold text-charcoal md:justify-start">
            {heroPet.secondaryCtas
              .filter((cta) => STORE_ENABLED || cta.href !== "/loja")
              .map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className="underline decoration-charcoal/30 decoration-2 underline-offset-4 transition-colors hover:decoration-coral"
                >
                  {cta.label} →
                </Link>
              ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center md:mt-0">
          {/* wrapper do tamanho exato do card para o badge não desgrudar da imagem */}
          <div className="relative">
            <PetBeforeAfterCarousel examples={petBeforeAfterExamples} variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
