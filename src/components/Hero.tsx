import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="top"
      className="grid items-center gap-10 px-6 py-16 sm:px-10 md:grid-cols-[1.1fr_0.9fr] md:py-24"
      style={{
        background:
          "radial-gradient(circle at 85% 20%, rgba(15,191,160,.14), transparent 55%)",
      }}
    >
      <div>
        <span className="mb-5 inline-block -rotate-2 rounded-full border-2 border-charcoal bg-teal px-3.5 py-1.5 text-xs font-bold text-charcoal">
          impressão 3D sob medida
        </span>
        <h1 className="font-heading text-5xl font-extrabold leading-[1.05] text-charcoal sm:text-6xl">
          Leon vira o que
          <br />
          você precisar.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-charcoal/75">
          Miniaturas, action figures, decor geek — se você imaginou, a gente
          imprime, camada por camada. Compra 100% pelos marketplaces.
        </p>
        <div className="mt-8 flex flex-wrap gap-3.5">
          <a
            href="#catalogo"
            className="sticker-shadow rounded-full border-[3px] border-charcoal bg-coral px-7 py-4 font-heading text-base font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
          >
            Ver catálogo →
          </a>
          <a
            href="#sobre"
            className="rounded-full border-[3px] border-charcoal bg-transparent px-7 py-4 font-heading text-base font-bold text-charcoal transition-colors hover:bg-charcoal hover:text-offwhite"
          >
            Conhecer a Camu
          </a>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="sticker-shadow-lg flex h-72 w-72 rotate-3 items-center justify-center rounded-[32px] border-4 border-charcoal bg-teal sm:h-[340px] sm:w-[340px]">
          <Image
            src="/images/leon-waving.png"
            alt="Leon, mascote camaleão da Camu, acenando"
            width={676}
            height={369}
            priority
            className="-rotate-3 h-[78%] w-[78%] object-contain"
          />
        </div>
        <span className="absolute -bottom-3.5 -left-3.5 -rotate-6 rounded-full border-[3px] border-charcoal bg-offwhite px-4 py-2.5 font-heading text-[13px] font-bold text-charcoal">
          100% geek approved
        </span>
      </div>
    </section>
  );
}
