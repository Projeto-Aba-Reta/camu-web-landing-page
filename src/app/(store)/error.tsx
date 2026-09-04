"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useEffect } from "react";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    posthog.captureException(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-6 py-20 text-center sm:px-10">
      <div className="rounded-[18px] border-[3px] border-charcoal bg-offwhite-2 px-8 py-14">
        <h1 className="mb-3 font-heading text-2xl font-bold text-charcoal">
          Deu ruim por aqui
        </h1>
        <p className="mb-7 font-sans text-charcoal/65">
          Não conseguimos carregar a loja agora. Tenta de novo em instantes.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="sticker-shadow-sm rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5"
          >
            Tentar de novo
          </button>
          <Link
            href="/miniatura-pet"
            className="rounded-full border-[3px] border-charcoal bg-transparent px-6 py-3 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5"
          >
            Voltar para a miniatura do pet
          </Link>
        </div>
      </div>
    </section>
  );
}
