"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

const links = [
  { label: "Catálogo", href: "/loja" },
  { label: "Miniatura do seu pet", href: "/miniatura-pet" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Encomenda personalizada", href: "/encomenda" },
  { label: "Contato", href: "/#contato" },
];

export default function StoreNav({ showCart = true }: { showCart?: boolean }) {
  const { count, ready } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-charcoal bg-offwhite">
      <nav
        aria-label="Navegação da loja"
        className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/leon-logo.png"
            alt="Camu logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full border-2 border-charcoal object-cover"
            priority
          />
          <span className="font-heading text-2xl font-bold text-charcoal">camu</span>
        </Link>

        <div className="flex items-center gap-5 md:gap-7">
          <ul className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-charcoal transition-colors hover:text-teal-dark"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {showCart && (
            <Link
              href="/carrinho"
              aria-label={`Carrinho${ready && count > 0 ? `, ${count} itens` : ""}`}
              className="sticker-shadow-sm relative rounded-full border-[3px] border-charcoal bg-coral px-5 py-2.5 font-heading text-sm font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
            >
              Carrinho
              {ready && count > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-offwhite bg-charcoal font-heading text-xs font-extrabold text-teal">
                  {count}
                </span>
              )}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
