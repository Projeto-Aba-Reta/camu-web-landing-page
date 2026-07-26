"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "./types";

const STORAGE_KEY = "camu:cart:v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  addItem: (item: CartItem) => void;
  setQty: (productId: string, variant: string, qty: number) => void;
  removeItem: (productId: string, variant: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartItem, productId: string, variant: string) {
  return a.productId === productId && a.variant === variant;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Hidrata do localStorage no mount (evita mismatch de SSR).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
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

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotalCents = items.reduce((s, i) => s + i.price_cents * i.qty, 0);

    return {
      items,
      count,
      subtotalCents,
      ready,
      addItem: (item) =>
        setItems((prev) => {
          const idx = prev.findIndex((p) => sameLine(p, item.productId, item.variant));
          if (idx === -1) return [...prev, item];
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
          return next;
        }),
      setQty: (productId, variant, qty) =>
        setItems((prev) =>
          prev
            .map((p) => (sameLine(p, productId, variant) ? { ...p, qty } : p))
            .filter((p) => p.qty > 0),
        ),
      removeItem: (productId, variant) =>
        setItems((prev) => prev.filter((p) => !sameLine(p, productId, variant))),
      clear: () => setItems([]),
    };
  }, [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
