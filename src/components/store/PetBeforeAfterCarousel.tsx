"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { PetBeforeAfterExample } from "@/lib/data";

const SLIDE_MS = 5000;

type Props = {
  examples: PetBeforeAfterExample[];
  /** "page": card grande usado em /miniatura-pet/expressa. "hero": card compacto e rotacionado, no estilo dos cartões sticker da home. */
  variant?: "page" | "hero";
};

const FRAME_CLASSES: Record<NonNullable<Props["variant"]>, string> = {
  page: "mx-auto w-full max-w-md overflow-hidden rounded-[20px] border-[3px] border-charcoal bg-offwhite-2 sm:max-w-lg",
  hero: "sticker-shadow-lg w-72 rotate-3 overflow-hidden rounded-[32px] border-4 border-charcoal bg-offwhite-2 sm:w-80 md:w-[380px]",
};

export default function PetBeforeAfterCarousel({ examples, variant = "page" }: Props) {
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
    <div className={variant === "hero" ? "" : "mb-10"}>
      <div className={`relative ${FRAME_CLASSES[variant]}`}>
        {/* key força remount ao trocar de pet, disparando a animação de transição entre exemplos */}
        <PetBeforeAfterSlide key={current.petName} example={current} priority={slide === 0} compact={variant === "hero"} />

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

      {variant === "page" && (
        <p className="mt-3 text-center font-sans text-[12.5px] text-charcoal/55">
          Foto que o cliente manda → miniatura impressa em 3D.
        </p>
      )}
    </div>
  );
}

function PetBeforeAfterSlide({
  example,
  priority,
  compact = false,
}: {
  example: PetBeforeAfterExample;
  priority: boolean;
  compact?: boolean;
}) {
  return (
    <div className="pet-transform-in relative flex aspect-[4/3] w-full">
      <div className="relative h-full w-1/2 overflow-hidden">
        <Image
          src={example.beforeSrc}
          alt={example.beforeAlt}
          fill
          sizes="(min-width: 640px) 200px, 45vw"
          className="object-cover"
          priority={priority}
        />
        <span
          className={`absolute left-1.5 top-1.5 rounded-full border-2 border-charcoal bg-coral font-heading font-extrabold uppercase tracking-wide text-charcoal ${
            compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
          }`}
        >
          Antes
        </span>
      </div>

      <div className="relative h-full w-1/2 overflow-hidden border-l-[3px] border-charcoal">
        <Image
          src={example.afterSrc}
          alt={example.afterAlt}
          fill
          sizes="(min-width: 640px) 200px, 45vw"
          className="object-cover"
        />
        <span
          className={`absolute right-1.5 top-1.5 rounded-full border-2 border-charcoal bg-teal font-heading font-extrabold uppercase tracking-wide text-charcoal ${
            compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
          }`}
        >
          Depois
        </span>
      </div>

      {/* pulso de brilho e seta central — só ao entrar um novo exemplo no carrossel */}
      <span
        className="pet-transform-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-offwhite/70 to-transparent"
        aria-hidden
      />
      <span
        className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-charcoal bg-offwhite font-heading text-sm font-extrabold text-charcoal"
        aria-hidden
      >
        →
      </span>

      <span
        className="pet-transform-sparkle pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl"
        aria-hidden
      >
        ✨
      </span>

      <span className="sr-only">{`${example.petName}: antes (foto) e depois (miniatura impressa em 3D)`}</span>
    </div>
  );
}
