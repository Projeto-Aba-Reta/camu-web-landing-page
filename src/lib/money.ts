/** Helpers de dinheiro. Guardamos tudo em centavos (inteiro) e formatamos em BRL. */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Feature flag do frete (`NEXT_PUBLIC_FRETE_ENABLED=true`).
 * - Ativa: o frete fixo entra no total cobrado online (pedido + preferência MP).
 * - Inativa: o pedido cobra só os produtos e o frete é combinado à parte.
 */
export const FRETE_ENABLED = process.env.NEXT_PUBLIC_FRETE_ENABLED === "true";

/** Frete fixo em centavos — o design usa R$ 18,00. Ajuste aqui se virar cálculo por CEP. */
export const SHIPPING_FEE_CENTS = 1800;

/** Frete efetivamente somado ao pedido: 0 quando a flag está desligada. */
export const SHIPPING_CENTS = FRETE_ENABLED ? SHIPPING_FEE_CENTS : 0;
