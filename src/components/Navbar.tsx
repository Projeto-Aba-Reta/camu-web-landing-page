import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/data";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-charcoal bg-offwhite">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10"
      >
        <Link href="#top" className="flex items-center gap-2.5">
          <Image
            src="/images/leon-logo.png"
            alt="Camu logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
            priority
          />
          <span className="font-heading text-2xl font-bold text-charcoal">
            camu
          </span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-charcoal transition-colors hover:text-teal-dark"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#onde-comprar"
          className="sticker-shadow-sm rounded-full border-[3px] border-charcoal bg-coral px-5 py-2.5 font-heading text-sm font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
        >
          Ver na loja
        </a>
      </nav>
    </header>
  );
}
