"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AB_PET_RC_KEY,
  isAbPetVariant,
  writeAbPetVariantCookie,
} from "@/lib/ab-pet";
import { getRemoteConfigString } from "@/lib/firebase";

/**
 * Entrada do teste A/B de /miniatura-pet: pergunta ao Firebase Remote Config
 * qual variante este visitante recebe (split definido no console) e redireciona.
 * Se o Remote Config falhar/demorar, cai em "v2". Cobre a página até redirecionar
 * pra não piscar o conteúdo original; crawlers ignoram o JS e veem a página normal.
 */
export default function AbPetRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void getRemoteConfigString(AB_PET_RC_KEY, "v2").then((value) => {
      if (cancelled) return;
      const variant = isAbPetVariant(value) ? value : "v2";
      writeAbPetVariantCookie(variant);
      router.replace(`/miniatura-pet/${variant}`);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[60] flex items-center justify-center bg-offwhite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-charcoal/20 border-t-teal" />
    </div>
  );
}
