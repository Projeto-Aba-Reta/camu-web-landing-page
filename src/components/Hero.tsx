import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import { heroPet } from "@/lib/data";

export default function Hero() {
  return (
    <section
      id="top"
      className="grid items-center gap-10 px-6 py-16 sm:px-10 md:grid-cols-[1.1fr_0.9fr] md:py-24 lg:min-h-[80vh]"
      style={{
        background:
          "radial-gradient(circle at 85% 20%, rgba(15,191,160,.14), transparent 55%)",
      }}
    >
      <div>
        <span className="mb-5 inline-block -rotate-2 rounded-full border-2 border-charcoal bg-teal px-3.5 py-1.5 text-xs font-bold text-charcoal">
          {heroPet.badge}
        </span>
        <h1 className="font-heading text-5xl font-extrabold leading-[1.05] text-charcoal sm:text-6xl">
          {heroPet.title[0]}
          <br />
          {heroPet.title[1]}
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-charcoal/75">
          {heroPet.subtitle}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-heading text-[13px] font-bold text-charcoal/70">
          <span>{heroPet.priceFrom}</span>
          <span aria-hidden>·</span>
          <span>{heroPet.leadTime}</span>
          <span aria-hidden>·</span>
          <span className="text-teal-dark">{heroPet.previewNote}</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3.5">
          <TrackedLink
            href={heroPet.primaryCta.href}
            event="home_cta_miniatura"
            eventProps={{ origem: "hero" }}
            className="sticker-shadow-lg rounded-full border-[3px] border-charcoal bg-coral px-7 py-4 font-heading text-base font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
          >
            {heroPet.primaryCta.label} →
          </TrackedLink>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-heading text-sm font-bold text-charcoal">
          {heroPet.secondaryCtas.map((cta) => (
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

      <div className="flex items-center justify-center">
        {/* wrapper do tamanho exato do card para o badge não desgrudar da imagem */}
        <div className="relative">
          <div className="sticker-shadow-lg flex h-72 w-72 rotate-3 items-center justify-center rounded-[32px] border-4 border-charcoal bg-teal sm:h-[340px] sm:w-[340px]">
            {/* [substituir por foto real: pet + miniatura impressa lado a lado] */}
            <Image
              src="/images/leon-printing.png"
              alt="Leon, mascote camaleão da Camu, imprimindo uma miniatura em 3D"
              width={241}
              height={185}
              priority
              className="-rotate-3 h-[78%] w-[78%] object-contain"
            />
          </div>
          <span className="absolute -bottom-3.5 -left-3.5 -rotate-6 whitespace-nowrap rounded-full border-[3px] border-charcoal bg-offwhite px-4 py-2.5 font-heading text-[13px] font-bold text-charcoal">
            você aprova antes de pagar
          </span>
        </div>
      </div>
    </section>
  );
}
