export default function About() {
  return (
    <section
      id="sobre"
      className="grid items-center gap-10 bg-offwhite-2 px-6 py-16 sm:px-10 md:grid-cols-[0.9fr_1.1fr] md:py-20"
    >
      <div className="placeholder-tiles flex aspect-[4/3] w-full items-center justify-center rounded-[20px] border-[3px] border-charcoal">
        <span className="font-mono text-xs font-semibold text-charcoal/60">
          [ foto da equipe / oficina ]
        </span>
      </div>
      <div>
        <span className="text-[13px] font-bold uppercase tracking-wider text-teal-dark">
          Sobre a Camu
        </span>
        <h2 className="mt-2.5 font-heading text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
          Um camaleão que virou empresa.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-charcoal/75 sm:text-lg">
          A Camu nasceu da vontade de dar forma física a personagens, cenas e
          ideias que só existiam na tela. Leon é o símbolo disso: um bicho que
          se adapta e se transforma no que for preciso — igual a impressão
          3D.
        </p>
        <a
          href="#contato"
          className="mt-5 inline-block font-heading text-[15px] font-bold text-charcoal underline decoration-coral decoration-[3px] underline-offset-4"
        >
          Ler a história completa →
        </a>
      </div>
    </section>
  );
}
