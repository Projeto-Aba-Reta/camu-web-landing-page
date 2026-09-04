export default function Footer() {
  return (
    <footer className="bg-charcoal px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 text-center sm:justify-between sm:text-left">
        <span className="font-heading text-lg font-bold text-offwhite">camu3d</span>
        <span className="text-xs text-offwhite/50">
          © Camu3d {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
