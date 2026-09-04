import "server-only";

/**
 * Contrato comum das cotações de frete. O site usa **apenas cotação** — nenhum
 * gateway aqui emite etiqueta. O gateway ativo é escolhido pela env
 * `SHIPPING_GATEWAY` (ver `src/lib/shipping/index.ts`).
 */

export type FreteQuote = {
  /** Preço em centavos (inteiro). */
  cents: number;
  /** Nome do serviço (ex.: "PAC", "SEDEX"). */
  service: string;
  /** Transportadora (ex.: "Correios", "Jadlog"). */
  carrier: string;
  /** Prazo em dias úteis. */
  prazoDias: number;
};

export type QuoteFreteParams = {
  toCep: string;
  itemCount: number;
  insuranceValueReais: number;
};

export interface ShippingGateway {
  /** Identificador do gateway, igual ao valor de `SHIPPING_GATEWAY`. */
  readonly name: string;
  /**
   * Cota o frete para um CEP e devolve a opção selecionada (a **primeira** da
   * lista válida). Lança `Error` amigável se nada atende o trecho.
   */
  quoteFrete(params: QuoteFreteParams): Promise<FreteQuote>;
}
