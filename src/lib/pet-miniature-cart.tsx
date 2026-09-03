"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PetMiniatureVariant } from "./types";
import { computePetCartPricing, type PetCartPricing } from "./pet-miniature-cart-pricing";

const STORAGE_KEY = "camu:pet-cart:v1";

/** Uma miniatura aprovada, à espera de checkout. `unitPriceCents` é só pra
 *  exibição — o servidor recalcula tudo pelo canal `loja_propria`. */
export type PetCartLine = {
  requestId: string;
  variant: PetMiniatureVariant;
  previewUrl: string | null;
  unitPriceCents: number;
  customerName: string | null;
  customerEmail: string | null;
};

type PetCartContextValue = {
  items: PetCartLine[];
  count: number;
  ready: boolean;
  pricing: PetCartPricing;
  add: (line: PetCartLine) => void;
  remove: (requestId: string) => void;
  clear: () => void;
  has: (requestId: string) => boolean;
};

const PetCartContext = createContext<PetCartContextValue | null>(null);

export function PetCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PetCartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as PetCartLine[]);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, ready]);

  const value = useMemo<PetCartContextValue>(() => {
    const pricing = computePetCartPricing(
      items.map((i) => ({ key: i.requestId, unitPriceCents: i.unitPriceCents })),
    );

    return {
      items,
      count: items.length,
      ready,
      pricing,
      add: (line) =>
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.requestId === line.requestId);
          if (idx === -1) return [...prev, line];
          const next = [...prev];
          next[idx] = line; // upsert: troca variante/preço da mesma encomenda
          return next;
        }),
      remove: (requestId) =>
        setItems((prev) => prev.filter((p) => p.requestId !== requestId)),
      clear: () => setItems([]),
      has: (requestId) => items.some((p) => p.requestId === requestId),
    };
  }, [items, ready]);

  return <PetCartContext.Provider value={value}>{children}</PetCartContext.Provider>;
}

export function usePetCart(): PetCartContextValue {
  const ctx = useContext(PetCartContext);
  if (!ctx) throw new Error("usePetCart precisa estar dentro de <PetCartProvider>");
  return ctx;
}
