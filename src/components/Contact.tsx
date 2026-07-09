import { socialLinks } from "@/lib/data";

export default function Contact() {
  return (
    <section id="contato" className="bg-offwhite px-6 py-16 text-center sm:px-10 md:py-20">
      <h2 className="mb-5 font-heading text-3xl font-bold text-charcoal">
        Bora trocar ideia?
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {socialLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target={s.href.startsWith("http") ? "_blank" : undefined}
            rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-full border-[3px] border-charcoal bg-teal px-6 py-3.5 font-heading text-sm font-bold text-charcoal transition-transform hover:-translate-y-0.5"
          >
            {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}
