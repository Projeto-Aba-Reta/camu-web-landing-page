import { testimonials } from "@/lib/data";

export default function Testimonials() {
  return (
    <section className="bg-offwhite-2 px-6 py-16 sm:px-10 md:py-20">
      <h2 className="mb-2 font-heading text-3xl font-bold text-charcoal sm:text-4xl">
        O que a galera fala
      </h2>
      <p className="mb-7 font-mono text-xs font-semibold text-charcoal/45">
        [exemplo — substituir por depoimentos reais]
      </p>
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.author + t.quote}
            className="rounded-2xl border-[3px] border-charcoal bg-offwhite p-5"
          >
            <p className="mb-3.5 text-[14.5px] leading-relaxed text-charcoal/80">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="font-heading text-[13px] font-bold text-charcoal">
              {t.author}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
