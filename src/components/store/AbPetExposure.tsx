"use client";

import { useEffect } from "react";
import {
  AB_PET_EXPERIMENT,
  readAbPetVariantFromBrowser,
} from "@/lib/ab-pet";
import { logFirebaseEvent, setFirebaseUserProperties } from "@/lib/firebase";

/**
 * Registra no Firebase Analytics a exposição ao teste A/B de /miniatura-pet.
 * Montado nas páginas v2 e expressa; não renderiza nada. Quem chega direto
 * pela URL sem passar pelo teste (sem cookie) não é contabilizado.
 */
export default function AbPetExposure() {
  useEffect(() => {
    const variant = readAbPetVariantFromBrowser();
    if (!variant) return;
    void setFirebaseUserProperties({ ab_miniatura_pet: variant });
    void logFirebaseEvent("ab_exposure", { experiment: AB_PET_EXPERIMENT, variant });
  }, []);

  return null;
}
