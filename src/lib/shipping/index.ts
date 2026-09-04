import "server-only";

import type { FreteQuote, QuoteFreteParams, ShippingGateway } from "./types";
import { melhorEnvioGateway } from "./melhor-envio";
import { superFreteGateway } from "./superfrete";

export type { FreteQuote, QuoteFreteParams, ShippingGateway };

/**
 * Gateway de frete ativo, escolhido por `SHIPPING_GATEWAY` no `.env`:
 *  - `superfrete`    → SuperFrete (`POST /api/v0/calculator`, só cotação);
 *  - `melhor_envio`  → Melhor Envio (padrão, mantido para rollback).
 *
 * Ambos param no cálculo do valor do frete — nenhum emite etiqueta.
 */
const GATEWAYS: Record<string, ShippingGateway> = {
  [melhorEnvioGateway.name]: melhorEnvioGateway,
  [superFreteGateway.name]: superFreteGateway,
};

export function getShippingGateway(): ShippingGateway {
  const key = process.env.SHIPPING_GATEWAY?.trim() || melhorEnvioGateway.name;
  const gateway = GATEWAYS[key];
  if (!gateway) {
    throw new Error(
      `SHIPPING_GATEWAY inválido: "${key}". Use ${Object.keys(GATEWAYS).join(" ou ")}.`,
    );
  }
  return gateway;
}

/** Atalho: cota o frete pelo gateway ativo. */
export function quoteFrete(params: QuoteFreteParams): Promise<FreteQuote> {
  return getShippingGateway().quoteFrete(params);
}
