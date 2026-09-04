"use client";

import { useEffect } from "react";
import { trackFunnel } from "@/lib/analytics";

type Props = {
  pedidos: number;
  fotosPendentes: number;
};

/** Dispara `conta_visualizada` a cada carregamento de /conta — quantidade de
 *  pedidos e de fotos pendentes ajudam a ver se o cliente está voltando
 *  repetidas vezes só pra checar o status (sinal de ansiedade/impaciência). */
export default function ContaTracker({ pedidos, fotosPendentes }: Props) {
  useEffect(() => {
    trackFunnel("conta_visualizada", { pedidos, fotos_pendentes: fotosPendentes });
  }, [pedidos, fotosPendentes]);

  return null;
}
