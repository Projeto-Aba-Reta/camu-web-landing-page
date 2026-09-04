import "server-only";

import type { FreteQuote, QuoteFreteParams, ShippingGateway } from "./types";
import { ORIGIN_ZIP_CODE, DEFAULT_ITEM_WEIGHT_KG, cleanZipCode } from "./melhor-envio";

/**
 * Cotação de frete via API da SuperFrete (`POST /api/v0/calculator`).
 *
 * **Só cotação.** O fluxo do site vai até o cálculo do valor do frete e para
 * aí — este módulo NÃO chama `/api/v0/cart`, `/api/v0/checkout` nem
 * `/api/v0/tag/print`, ou seja, nunca cria pedido nem emite etiqueta na
 * SuperFrete. Emissão de etiqueta, quando houver, é feita manualmente no painel.
 *
 * Envs (server, exceto onde indicado):
 *  - `SUPERFRETE_API_URL`   Base da API. Sandbox: https://sandbox.superfrete.com ·
 *      Produção: https://api.superfrete.com
 *  - `SUPERFRETE_TOKEN`     Bearer token de integração (por ambiente).
 *  - `SUPERFRETE_SERVICES`  (opcional) códigos de serviço a cotar, separados por
 *      vírgula. Padrão: "1,2,17" (PAC, SEDEX, Mini Envios).
 *  - `NEXT_PUBLIC_ALLOWED_SHIPPING_IDS`  (opcional) allowlist de `service_id`
 *      (compartilhada com o Melhor Envio). Ausente = todas as opções.
 *
 * CEP de origem, caixa e peso por item são os mesmos constantes do Melhor Envio
 * (`ORIGIN_ZIP_CODE`, `PACKAGE_DIMENSIONS`, `DEFAULT_ITEM_WEIGHT_KG`).
 */

/** User-Agent com e-mail de contato — exigido pela SuperFrete. */
const USER_AGENT = "Camu (contato@camu.com.br)";

/** Caixa única fixa (cm) — igual ao Melhor Envio. */
const PACKAGE_DIMENSIONS = { height: 4, width: 12, length: 17 };

const DEFAULT_SERVICES = "1,2,17";

type SuperFreteRaw = {
  id?: number;
  name?: string;
  price?: string | number;
  discount?: string | number;
  delivery_time?: number;
  delivery_range?: { min?: number; max?: number };
  company?: { name?: string };
  error?: string | null;
};

function allowedServiceIds(): Set<string> | null {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_SHIPPING_IDS?.trim();
  if (!raw) return null;
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

async function quoteFrete(params: QuoteFreteParams): Promise<FreteQuote> {
  const apiUrl = process.env.SUPERFRETE_API_URL;
  const token = process.env.SUPERFRETE_TOKEN;
  if (!apiUrl || !token) {
    throw new Error("Token da SuperFrete não configurado");
  }

  const from = cleanZipCode(ORIGIN_ZIP_CODE);
  const to = cleanZipCode(params.toCep);
  if (!from) throw new Error("CEP de origem inválido");
  if (!to) throw new Error("Informe um CEP de entrega válido para calcular o frete.");

  const count = Number.isFinite(params.itemCount)
    ? Math.max(1, Math.floor(params.itemCount))
    : 1;
  const weight = Number((DEFAULT_ITEM_WEIGHT_KG * count).toFixed(3));
  const insuranceValue = Number.isFinite(params.insuranceValueReais)
    ? Math.max(0, params.insuranceValueReais)
    : 0;

  const body = {
    from: { postal_code: from },
    to: { postal_code: to },
    services: (process.env.SUPERFRETE_SERVICES?.trim() || DEFAULT_SERVICES),
    options: {
      own_hand: false,
      receipt: false,
      insurance_value: insuranceValue,
      use_insurance_value: insuranceValue > 0,
    },
    package: { ...PACKAGE_DIMENSIONS, weight },
  };

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v0/calculator`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[superfrete] erro", response.status, text.slice(0, 300));
    throw new Error(`Erro ao calcular frete (HTTP ${response.status}).`);
  }

  const raw = (await response.json()) as SuperFreteRaw[];
  const allow = allowedServiceIds();
  const valid = (Array.isArray(raw) ? raw : [])
    .filter((o) => !o.error && parseFloat(String(o.price ?? "0")) > 0)
    .filter((o) => !allow || allow.has(String(o.id ?? "")));

  if (valid.length === 0) {
    throw new Error("Nenhuma opção de frete disponível para este CEP");
  }

  const chosen = valid[0];
  return {
    cents: Math.round(parseFloat(String(chosen.price ?? "0")) * 100),
    service: chosen.name ?? "Frete",
    carrier: chosen.company?.name ?? "Transportadora",
    prazoDias: Number(
      chosen.delivery_time ?? chosen.delivery_range?.max ?? chosen.delivery_range?.min ?? 0,
    ),
  };
}

/** Gateway de frete "superfrete". */
export const superFreteGateway: ShippingGateway = {
  name: "superfrete",
  quoteFrete,
};
