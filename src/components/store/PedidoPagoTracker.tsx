"use client";

import { useEffect } from "react";
import { trackFunnel } from "@/lib/analytics";

type Props = {
  orderCode: string;
  totalCents: number;
  fluxo: "miniatura_pet_expressa" | "miniatura_pet_normal" | "catalogo";
};

const STORAGE_PREFIX = "camu_tracked_pedido_pago_";

/** Dispara `pedido_pago` uma única vez por navegador quando a página de
 *  confirmação carrega com pagamento aprovado — cobre GA/PostHog/Vercel, que
 *  não recebem o evento server-side disparado pelo webhook. */
export default function PedidoPagoTracker({ orderCode, totalCents, fluxo }: Props) {
  useEffect(() => {
    const key = `${STORAGE_PREFIX}${orderCode}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      // se localStorage falhar, segue e dispara mesmo assim (best-effort)
    }
    trackFunnel("pedido_pago", { pedido: orderCode, total_cents: totalCents, fluxo });
  }, [orderCode, totalCents, fluxo]);

  return null;
}
