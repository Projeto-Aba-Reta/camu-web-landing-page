import { faqItems } from "@/lib/data";

export default function Faq() {
  return (
    <section id="faq" className="bg-offwhite-2 px-6 py-16 sm:px-10 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 font-heading text-3xl font-bold text-charcoal sm:text-4xl">
          Perguntas frequentes
        </h2>
        <div className="flex flex-col gap-3">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border-2 border-charcoal bg-offwhite p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-heading text-[15px] font-bold text-charcoal">
                {item.q}
                <span
                  className="font-heading text-xl leading-none text-teal-dark transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-charcoal/70">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
