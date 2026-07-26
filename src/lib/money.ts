/** Helpers de dinheiro. Guardamos tudo em centavos (inteiro) e formatamos em BRL. */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Frete fixo — o design usa R$ 18,00. Ajuste aqui se virar cálculo por CEP. */
export const SHIPPING_CENTS = 1800;
