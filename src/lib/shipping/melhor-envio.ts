import "server-only";

/**
 * Cotação de frete via API do Melhor Envio (`POST /me/shipment/calculate`).
 *
 * Portado do projeto de referência `ecommerce-roupas`
 * (`app/api/frete/cotar/route.ts`, `lib/shipping-service.ts`, `lib/utils.ts`) —
 * ver `calculo-de-frete.md`. Usa **as mesmas variáveis de ambiente** da
 * referência, nada além delas:
 *
 *  - `MELHOR_ENVIO_API_URL`  (server) Base da API. Sandbox:
 *      https://sandbox.melhorenvio.com.br/api/v2 · Produção:
 *      https://melhorenvio.com.br/api/v2
 *  - `MELHOR_ENVIO_TOKEN`    (server) Bearer token (OAuth2) da conta.
 *  - `NEXT_PUBLIC_ALLOWED_SHIPPING_IDS`  (opcional) allowlist de `service_id`
 *      separada por vírgula (ex.: "1,2,3"). Ausente = todas as opções.
 *
 * Tudo o mais é constante no código, igual à referência: CEP de origem, caixa
 * única `{4,12,17}` cm, peso padrão por item e o User-Agent (o Melhor Envio
 * exige um com e-mail de contato).
 *
 * Só é usado para entregas **fora do Sul e Sudeste** — nas demais UFs o frete
 * é incluso (ver `isFreteInclusoUF`). O valor cotado é somado ao total do
 * pedido no servidor (`createOrder` → `orders.shipping_cents`) e cobrado pelo
 * gateway (Stripe / Mercado Pago). Nunca confie num frete vindo do client.
 */

/** CEP de origem da loja (remetente). Igual à referência (`getOriginZipCode`).
 *  TODO: trocar pelo CEP real de expedição da Camu. */
export const ORIGIN_ZIP_CODE = "05140140";

/** User-Agent com e-mail de contato — exigido pelo Melhor Envio. */
const USER_AGENT = "Camu (contato@camu.com.br)";

/** Caixa única fixa (cm) — igual à referência. */
const PACKAGE_DIMENSIONS = { height: 4, width: 12, length: 17 };

/** Peso padrão por item (kg) quando o produto não informa — igual à referência
 *  (`lib/shipping-service.ts`: 0,3 kg/item). */
export const DEFAULT_ITEM_WEIGHT_KG = 0.3;

/** Limpa e valida um CEP: só dígitos, exatamente 8. Igual a `cleanZipCode`. */
export function cleanZipCode(zipCode: string): string | null {
  const cleaned = String(zipCode ?? "").replace(/\D/g, "").trim();
  return cleaned.length === 8 ? cleaned : null;
}

/** Opção de frete normalizada — mesmo shape que a rota da referência devolve. */
export type FreteOption = {
  name: string;
  /** Preço em reais. */
  price: number;
  /** Prazo em dias úteis. */
  delivery_time: number;
  company: string;
  service_id: number;
  /** Preenchido quando a transportadora não atende o trecho. */
  error: string | null;
};

type MelhorEnvioRaw = {
  id?: number;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: { name?: string };
  error?: string | null;
};

/**
 * Chama o Melhor Envio e devolve a lista normalizada (incluindo itens com
 * `error`, pra quem chama decidir). Replica a estratégia de fallback da
 * referência: (1) `from`/`to` como objeto, (2) como string, (3) GET com query
 * params se vier 405.
 */
export async function calcularFrete(params: {
  toZipCode: string;
  weightKg: number;
  insuranceValue: number;
}): Promise<FreteOption[]> {
  const apiUrl = process.env.MELHOR_ENVIO_API_URL;
  const token = process.env.MELHOR_ENVIO_TOKEN;

  if (!apiUrl || !token) {
    throw new Error("Token do Melhor Envio não configurado");
  }

  const from = cleanZipCode(ORIGIN_ZIP_CODE);
  const to = cleanZipCode(params.toZipCode);
  if (!from) throw new Error("CEP de origem inválido");
  if (!to) throw new Error("Informe um CEP de entrega válido para calcular o frete.");

  const pkg = { ...PACKAGE_DIMENSIONS, weight: params.weightKg };
  const options = {
    receipt: false,
    own_hand: false,
    insurance_value: params.insuranceValue || 0,
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
  };
  const url = `${apiUrl}/me/shipment/calculate`;

  // (1) formato canônico: from/to como objeto { postal_code }
  let response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ from: { postal_code: from }, to: { postal_code: to }, package: pkg, options }),
    cache: "no-store",
  });

  // (2) fallback: from/to como string do CEP puro
  if (!response.ok) {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ from, to, package: pkg, options }),
      cache: "no-store",
    });
  }

  // (3) fallback: GET com query params
  if (!response.ok && response.status === 405) {
    const qs = new URLSearchParams({
      from: JSON.stringify({ postal_code: from }),
      to: JSON.stringify({ postal_code: to }),
      package: JSON.stringify(pkg),
      options: JSON.stringify(options),
    });
    response = await fetch(`${url}?${qs}`, { method: "GET", headers, cache: "no-store" });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[melhor-envio] erro", response.status, text.slice(0, 300));
    throw new Error(`Erro ao calcular frete (HTTP ${response.status}).`);
  }

  const raw = (await response.json()) as MelhorEnvioRaw[];
  return (Array.isArray(raw) ? raw : []).map((item) => ({
    name: item.name ?? "Frete",
    price: parseFloat(String(item.custom_price ?? item.price ?? "0")),
    delivery_time: Number(item.custom_delivery_time ?? item.delivery_time ?? 0),
    company: item.company?.name ?? "Transportadora",
    service_id: Number(item.id ?? 0),
    error: item.error ?? null,
  }));
}

/** Aplica a allowlist opcional `NEXT_PUBLIC_ALLOWED_SHIPPING_IDS`. */
export function filterByAllowedIds(options: FreteOption[]): FreteOption[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_SHIPPING_IDS?.trim();
  if (!raw) return options;
  const allowed = new Set(raw.split(",").map((s) => s.trim()));
  return options.filter((o) => allowed.has(String(o.service_id)));
}

/** Só as opções cobráveis: sem `error` e com preço > 0, já filtradas pela
 *  allowlist. Igual ao `filter` do `shipping-form.tsx` da referência. */
export function validFreteOptions(options: FreteOption[]): FreteOption[] {
  return filterByAllowedIds(options.filter((o) => !o.error && o.price > 0));
}

export type FreteQuote = { cents: number; service: string; carrier: string; prazoDias: number };

/**
 * Cota o frete para um CEP e devolve a opção selecionada (a **primeira** da
 * lista válida — mesma regra da referência, que não é a mais barata e sim a
 * ordem que a API retorna). Lança `Error` amigável se nada atende o trecho.
 */
export async function quoteFrete(params: {
  toCep: string;
  itemCount: number;
  insuranceValueReais: number;
}): Promise<FreteQuote> {
  const count = Number.isFinite(params.itemCount) ? Math.max(1, Math.floor(params.itemCount)) : 1;
  const weight = Number((DEFAULT_ITEM_WEIGHT_KG * count).toFixed(3));

  const options = await calcularFrete({
    toZipCode: params.toCep,
    weightKg: weight,
    insuranceValue: Number.isFinite(params.insuranceValueReais)
      ? Math.max(0, params.insuranceValueReais)
      : 0,
  });

  const valid = validFreteOptions(options);
  if (valid.length === 0) {
    throw new Error("Nenhuma opção de frete disponível para este CEP");
  }

  const chosen = valid[0];
  return {
    cents: Math.round(chosen.price * 100),
    service: chosen.name,
    carrier: chosen.company,
    prazoDias: chosen.delivery_time,
  };
}
