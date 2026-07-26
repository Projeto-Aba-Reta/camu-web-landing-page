import Link from "next/link";
import { products } from "@/lib/data";

export default function Catalog() {
  return (
    <section id="catalogo" className="bg-offwhite px-6 py-16 sm:px-10 md:py-20">
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">
          Catálogo em destaque
        </h2>
        <Link
          href="/loja"
          className="text-sm font-semibold text-teal-dark underline-offset-4 hover:underline"
        >
          ver catálogo completo →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.name}
            href="/loja"
            className="group overflow-hidden rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 transition-transform hover:-translate-y-1"
          >
            <div className="placeholder-tiles flex aspect-square items-center justify-center">
              <span className="font-mono text-[11px] font-semibold text-charcoal/55">
                [foto produto]
              </span>
            </div>
            <div className="p-4">
              <div className="mb-2 font-heading text-base font-bold text-charcoal">
                {p.name}
              </div>
              <span className="inline-block rounded-full border-2 border-charcoal bg-teal px-2.5 py-1 text-[11px] font-bold text-charcoal">
                {p.market}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
