"use client";

import Link from "next/link";
import { trackFunnel } from "@/lib/analytics";

type Props = {
  label: string;
  href: string;
  /** origem do clique, pro analytics do funil */
  origin: string;
  /**
   * Se informado e o elemento existir na viewport atual, o clique rola/foca
   * esse elemento em vez de navegar (usado na própria página /miniatura-pet).
   */
  scrollTargetId?: string;
};

export default function StickyCta({ label, href, origin, scrollTargetId }: Props) {
  function onClick(e: React.MouseEvent) {
    trackFunnel("home_cta_miniatura", { origem: origin });

    if (!scrollTargetId) return;
    const el = document.getElementById(scrollTargetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const jaVisivel = rect.top < window.innerHeight && rect.bottom > 0;
    if (jaVisivel) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.querySelector<HTMLElement>("input, select, textarea, button")?.focus({
        preventScroll: true,
      });
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-charcoal bg-offwhite p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
      <Link
        href={href}
        onClick={onClick}
        className="block rounded-full border-[3px] border-charcoal bg-coral py-3.5 text-center font-heading text-[15px] font-bold text-charcoal"
      >
        {label} →
      </Link>
    </div>
  );
}
