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

/** UFs do Sul e Sudeste — regiões com frete incluso na miniatura de pet. */
const FRETE_INCLUSO_UFS = new Set([
  "SP", "RJ", "MG", "ES", // Sudeste
  "PR", "SC", "RS",       // Sul
]);

/** true quando a UF de entrega está no Sul ou Sudeste (frete incluso). */
export function isFreteInclusoUF(uf: string): boolean {
  return FRETE_INCLUSO_UFS.has(uf.trim().toUpperCase());
}

/**
 * Primeiros dígitos de CEP do Sul e Sudeste (macrorregião definida pelo 1º
 * dígito): 0/1 = SP · 2 = RJ/ES · 3 = MG · 8 = PR/SC · 9 = RS.
 * Serve pra decidir "frete grátis" já na digitação do CEP, antes de resolver a
 * UF nos Correios — evita mostrar um valor de frete que depois vira grátis.
 */
const FRETE_INCLUSO_CEP_PREFIXES = new Set(["0", "1", "2", "3", "8", "9"]);

/** true quando o CEP (mesmo parcial) é de uma faixa do Sul ou Sudeste. */
export function isFreteInclusoCep(cep: string): boolean {
  const digits = cep.replace(/\D/g, "");
  return digits.length >= 1 && FRETE_INCLUSO_CEP_PREFIXES.has(digits[0]!);
}
