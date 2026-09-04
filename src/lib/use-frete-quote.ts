"use client";

import { useEffect, useState } from "react";
import { FRETE_ENABLED, isFreteInclusoUF } from "@/lib/money";
import { cepDigits } from "@/lib/cep";

export type FreteQuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      freteCents: number;
      service: string;
      carrier: string;
      prazoDias: number;
    }
  | { status: "error"; error: string };

type Params = {
  cep: string;
  uf: string;
  itemCount: number;
  insuranceValueReais: number;
};

type Resolved =
  | { status: "done"; freteCents: number; service: string; carrier: string; prazoDias: number }
  | { status: "error"; error: string };

/**
 * Cota o frete (Melhor Envio, via `/api/frete/cotar`) para entregas **fora do
 * Sul e Sudeste**, para exibir o valor no resumo do pedido. O valor cobrado é
 * sempre recalculado no servidor em `createOrder`.
 *
 * Fica `idle` quando o frete fixo está ligado (`NEXT_PUBLIC_FRETE_ENABLED`),
 * quando a UF é do Sul/Sudeste (frete incluso) ou quando o CEP ainda não tem
 * 8 dígitos.
 */
export function useFreteQuote({ cep, uf, itemCount, insuranceValueReais }: Params): FreteQuoteState {
  const digits = cepDigits(cep);
  const needsQuote =
    !FRETE_ENABLED && uf.trim().length === 2 && !isFreteInclusoUF(uf) && digits.length === 8;
  const key = needsQuote ? `${digits}|${itemCount}|${insuranceValueReais}` : null;

  const [resolved, setResolved] = useState<{ key: string; value: Resolved } | null>(null);

  useEffect(() => {
    if (!key) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/frete/cotar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: digits, itemCount, insuranceValueReais }),
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          setResolved({
            key,
            value: data.ok
              ? {
                  status: "done",
                  freteCents: data.freteCents,
                  service: data.service,
                  carrier: data.carrier,
                  prazoDias: data.prazoDias,
                }
              : { status: "error", error: data.error ?? "Erro ao calcular frete." },
          });
        })
        .catch((err) => {
          if (err?.name === "AbortError") return;
          setResolved({
            key,
            value: { status: "error", error: "Não foi possível calcular o frete agora." },
          });
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, digits, itemCount, insuranceValueReais]);

  if (!key) return { status: "idle" };
  if (resolved?.key === key) return resolved.value;
  return { status: "loading" };
}
