import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/data";
import { STORE_ENABLED } from "@/lib/features";
import MobileMenu from "@/components/MobileMenu";
import TrackedLink from "@/components/TrackedLink";

const mobileLinks = [
  { label: "Miniatura do pet", href: "/miniatura-pet" },
  ...(STORE_ENABLED ? [{ label: "Loja", href: "/loja" }] : []),
  ...navLinks,
  { label: "Minha conta", href: "/conta" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-charcoal bg-offwhite">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10"
      >
        <Link href="#top" className="flex items-center gap-2.5">
          <Image
            src="/images/circleLogo.svg"
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
          <li>
            <Link
              href="/miniatura-pet"
              className="text-sm font-medium text-charcoal transition-colors hover:text-teal-dark"
            >
              Miniatura do pet
            </Link>
          </li>
          {STORE_ENABLED && (
            <li>
              <Link
                href="/loja"
                className="text-sm font-medium text-charcoal transition-colors hover:text-teal-dark"
              >
                Loja
              </Link>
            </li>
          )}
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

        <div className="flex items-center gap-3">
          <Link
            href="/conta"
            className="hidden rounded-full border-2 border-charcoal bg-transparent px-4 py-2 font-heading text-[13px] font-bold text-charcoal transition-colors hover:bg-charcoal/5 md:block"
          >
            Minha conta
          </Link>
          <TrackedLink
            href="/miniatura-pet"
            event="home_cta_miniatura"
            eventProps={{ origem: "navbar" }}
            className="sticker-shadow-sm rounded-full border-[3px] border-charcoal bg-coral px-4 py-2.5 font-heading text-[13px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none sm:px-5 sm:text-sm"
          >
            Fazer minha miniatura
          </TrackedLink>
          <MobileMenu links={mobileLinks} />
        </div>
      </nav>
    </header>
  );
}
