import { trustItems } from "@/lib/data";

export default function FaixaConfianca() {
  return (
    <section className="border-y-[3px] border-charcoal bg-teal px-6 py-10 sm:px-10">
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
        {trustItems.map((item) => (
          <div key={item.title} className="text-charcoal">
            <div className="font-heading text-[15px] font-extrabold">
              {item.title}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-charcoal/75">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
