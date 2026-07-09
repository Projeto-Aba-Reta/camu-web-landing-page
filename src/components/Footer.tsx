export default function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 bg-charcoal px-6 py-8 sm:px-10">
      <span className="font-heading text-lg font-bold text-offwhite">camu</span>
      <span className="text-xs text-offwhite/50">
        [CNPJ placeholder] · © Camu {new Date().getFullYear()}
      </span>
    </footer>
  );
}
