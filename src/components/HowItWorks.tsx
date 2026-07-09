import { steps } from "@/lib/data";

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative border-t border-charcoal/10 bg-offwhite px-6 py-16 sm:px-10 md:py-20"
    >
      <h2 className="mb-8 font-heading text-3xl font-bold text-charcoal sm:text-4xl">
        Como funciona
      </h2>
      <div className="relative grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-6">
        <div className="absolute left-[8%] right-[8%] top-7 hidden h-0 border-t-[3px] border-dashed border-teal md:block" />
        {steps.map((s) => (
          <div key={s.n} className="relative z-10">
            <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-teal bg-offwhite font-heading text-xl font-extrabold text-teal-dark">
              {s.n}
            </div>
            <div className="mb-1.5 font-heading text-lg font-bold text-charcoal">
              {s.title}
            </div>
            <div className="text-sm leading-relaxed text-charcoal/65">
              {s.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
