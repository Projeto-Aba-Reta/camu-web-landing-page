"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { PetBeforeAfterExample } from "@/lib/data";

const PHASE_MS = 2200;
const SLIDE_MS = 6600;

type Props = {
  examples: PetBeforeAfterExample[];
};

export default function PetBeforeAfterCarousel({ examples }: Props) {
  const [slide, setSlide] = useState(0);
  const current = examples[slide];

  // Com mais de um pet, avança o carrossel automaticamente.
  useEffect(() => {
    if (examples.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % examples.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [examples.length]);

  function goTo(i: number) {
    setSlide(((i % examples.length) + examples.length) % examples.length);
  }

  if (current == null) return null;

  return (
    <div className="mb-10">
      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[20px] border-[3px] border-charcoal bg-offwhite-2 sm:max-w-md">
        {/* key força remount ao trocar de pet, reiniciando o ciclo antes/depois do zero */}
        <PetBeforeAfterSlide key={current.petName} example={current} priority={slide === 0} />

        {examples.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(slide - 1)}
              aria-label="Pet anterior"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-charcoal bg-offwhite font-heading text-sm font-extrabold text-charcoal"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(slide + 1)}
              aria-label="Próximo pet"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-charcoal bg-offwhite font-heading text-sm font-extrabold text-charcoal"
            >
              ›
            </button>
          </>
        )}
      </div>

      {examples.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {examples.map((ex, i) => (
            <button
              key={ex.petName}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver ${ex.petName}`}
              className={`h-2.5 rounded-full border-2 border-charcoal transition-all ${
                i === slide ? "w-6 bg-coral" : "w-2.5 bg-offwhite"
              }`}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-center font-sans text-[12.5px] text-charcoal/55">
        Toque na imagem pra ver a transformação.
      </p>
    </div>
  );
}

function PetBeforeAfterSlide({
  example,
  priority,
}: {
  example: PetBeforeAfterExample;
  priority: boolean;
}) {
  const [showAfter, setShowAfter] = useState(false);

  // Alterna foto → miniatura em looping enquanto este pet estiver em tela.
  useEffect(() => {
    const t = setInterval(() => setShowAfter((v) => !v), PHASE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setShowAfter((v) => !v)}
      aria-label="Ver antes e depois"
      className="relative block aspect-square w-full cursor-pointer"
    >
      <Image
        src={example.beforeSrc}
        alt={example.beforeAlt}
        fill
        sizes="(min-width: 640px) 400px, 90vw"
        className={`object-cover transition-all duration-700 ease-in-out ${
          showAfter ? "scale-105 opacity-0 blur-sm" : "scale-100 opacity-100 blur-0"
        }`}
        priority={priority}
      />
      <Image
        src={example.afterSrc}
        alt={example.afterAlt}
        fill
        sizes="(min-width: 640px) 400px, 90vw"
        className={`object-cover transition-all duration-700 ease-in-out ${
          showAfter ? "scale-100 opacity-100 blur-0" : "scale-95 opacity-0 blur-sm"
        }`}
      />

      {/* key muda a cada troca de fase, remontando o brilho e reiniciando a animação CSS */}
      <span
        key={`sweep-${showAfter}`}
        className="pet-transform-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-offwhite/70 to-transparent"
        aria-hidden
      />
      <span
        key={`sparkle-${showAfter}`}
        className="pet-transform-sparkle pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl"
        aria-hidden
      >
        ✨
      </span>

      <span
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-charcoal px-3.5 py-1.5 font-heading text-xs font-extrabold uppercase tracking-wide text-charcoal transition-colors duration-300 ${
          showAfter ? "bg-teal" : "bg-coral"
        }`}
      >
        {showAfter ? `Depois — a miniatura do ${example.petName}` : `Antes — a foto do ${example.petName}`}
      </span>
    </button>
  );
}
