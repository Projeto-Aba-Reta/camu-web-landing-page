import { marketplaces } from "@/lib/data";

export default function WhereToBuy() {
  return (
    <section id="onde-comprar" className="bg-offwhite px-6 py-16 sm:px-10 md:py-20">
      <h2 className="mb-7 font-heading text-3xl font-bold text-charcoal sm:text-4xl">
        Onde comprar
      </h2>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {marketplaces.map((m) => (
          <a
            key={m.name}
            href={m.href}
            className="rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-6 text-center transition-transform hover:-translate-y-1"
          >
            <div className="mb-3.5 font-heading text-xl font-extrabold text-charcoal">
              {m.name}
            </div>
            <span className="inline-block rounded-full border-2 border-charcoal bg-coral px-5 py-2.5 font-heading text-[13px] font-bold text-charcoal">
              Ir pra loja →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
