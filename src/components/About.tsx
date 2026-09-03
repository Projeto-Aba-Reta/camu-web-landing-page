import Image from "next/image";
import { socialLinks } from "@/lib/data";

const whatsapp = socialLinks.find((s) => s.label === "WhatsApp");

export default function About() {
  return (
    <section
      id="sobre"
      className="grid items-center gap-10 bg-offwhite-2 px-6 py-16 sm:px-10 md:grid-cols-[0.9fr_1.1fr] md:py-20 lg:min-h-[80vh]"
    >
      {/* Ilustração do Leon no lugar da foto da oficina — pode ser trocada por
          foto real da equipe/oficina quando existir. */}
      <div className="relative mx-auto w-full max-w-md px-4 py-4">
        <div
          className="sticker-shadow-lg flex aspect-[4/3] w-full -rotate-2 items-center justify-center overflow-hidden rounded-[24px] border-[3px] border-charcoal bg-offwhite"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 105%, rgba(15,191,160,.28), transparent 60%), radial-gradient(#1b1f1e1a 1.5px, transparent 1.5px)",
            backgroundSize: "100% 100%, 16px 16px",
          }}
        >
          <Image
            src="/images/leon-printing.png"
            alt="Leon, mascote camaleão da Camu, imprimindo uma peça em 3D"
            width={241}
            height={185}
            className="w-[72%] rotate-2 object-contain"
          />
        </div>
        <span className="absolute -left-1 top-1 -rotate-6 rounded-full border-[3px] border-charcoal bg-coral px-3.5 py-2 font-heading text-[13px] font-bold text-charcoal">
          camada por camada
        </span>
        <span className="absolute -right-1 bottom-1 rotate-3 rounded-full border-[3px] border-charcoal bg-teal px-3.5 py-2 font-heading text-[13px] font-bold text-charcoal">
          oficina Camu
        </span>
      </div>
      <div>
        <span className="text-[13px] font-bold uppercase tracking-wider text-teal-dark">
          Sobre a Camu
        </span>
        <h2 className="mt-2.5 font-heading text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
          Leon vira o que você precisar.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-charcoal/75 sm:text-lg">
          A Camu nasceu da vontade de dar forma física a personagens, cenas e
          ideias que só existiam na tela. Miniaturas, action figures, decor
          geek — se você imaginou, a gente imprime, camada por camada. Leon é o
          símbolo disso: um bicho que se adapta e se transforma no que for
          preciso, igual a impressão 3D.
        </p>
        {whatsapp && (
          <a
            href={whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block font-heading text-[15px] font-bold text-charcoal underline decoration-coral decoration-[3px] underline-offset-4"
          >
            Falar com a Camu no WhatsApp →
          </a>
        )}
      </div>
    </section>
  );
}
