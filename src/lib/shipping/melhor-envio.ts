import "server-only";

/**
 * Cotação de frete em tempo real via API do Melhor Envio
 * (`POST /me/shipment/calculate`). Usada só para entregas **fora do Sul e
 * Sudeste** — nas demais regiões o frete é incluso (ver `isFreteInclusoUF`).
 *
 * O valor cotado aqui é somado ao total do pedido no servidor
 * (`createOrder` → `orders.shipping_cents`) e, por consequência, ao valor
 * cobrado pelo gateway (Stripe / Mercado Pago). Nunca confie num frete vindo
 * do client — a fonte de verdade é esta função.
 *
 * Env:
 *  - `MELHOR_ENVIO_API_URL`  Base da API. Sandbox:
 *      https://sandbox.melhorenvio.com.br/api/v2 · Produção:
 *      https://melhorenvio.com.br/api/v2
 *  - `MELHOR_ENVIO_TOKEN`    Bearer token (OAuth2) da conta Melhor Envio.
 *  - `MELHOR_ENVIO_USER_AGENT`  User-Agent com e-mail de contato (exigido pelo
 *      Melhor Envio). Default: "Camu (contato@camu.com.br)".
 *  - `STORE_ORIGIN_ZIPCODE`  CEP de origem (remetente), 8 dígitos.
 *  - `SHIPPING_BOX_{HEIGHT,WIDTH,LENGTH}_CM`  Dimensões da caixa (cm).
 *  - `SHIPPING_WEIGHT_KG_PER_ITEM`  Peso por item (kg). Default 0,3.
 *  - `NEXT_PUBLIC_ALLOWED_SHIPPING_IDS`  (opcional) allowlist de service_id,
 *      separada por vírgula. Ausente = todas as opções.
 */

export type FreteQuote = {
  /** Preço do frete em centavos (inteiro). */
  cents: number;
  /** Nome do serviço, ex.: "PAC", "SEDEX", ".Package". */
  service: string;
  /** Transportadora, ex.: "Correios", "Jadlog". */
  carrier: string;
  /** service_id do Melhor Envio. */
  serviceId: number;
  /** Prazo estimado em dias úteis. */
  deliveryDays: number;
};

type MelhorEnvioOption = {
  id?: number;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: { name?: string };
  error?: string | null;
};

const onlyDigits = (v: string) => v.replace(/\D/g, "");

function boxDimensions() {
  return {
    height: Number(process.env.SHIPPING_BOX_HEIGHT_CM ?? 10),
    width: Number(process.env.SHIPPING_BOX_WIDTH_CM ?? 15),
    length: Number(process.env.SHIPPING_BOX_LENGTH_CM ?? 20),
  };
}

function weightPerItemKg() {
  const raw = Number(process.env.SHIPPING_WEIGHT_KG_PER_ITEM ?? 0.3);
  return Number.isFinite(raw) && raw > 0 ? raw : 0.3;
}

function allowedServiceIds(): Set<number> | null {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_SHIPPING_IDS?.trim();
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return ids.length > 0 ? new Set(ids) : null;
}

export function shippingIsConfigured(): boolean {
  return Boolean(process.env.MELHOR_ENVIO_API_URL && process.env.MELHOR_ENVIO_TOKEN);
}

/**
 * Cota o frete para um CEP de destino. Retorna a **opção mais barata** entre as
 * transportadoras disponíveis. Lança `Error` com mensagem amigável quando o
 * frete não pode ser calculado (config ausente, CEP inválido, nenhuma opção
 * atende o trecho).
 */
export async function quoteFrete(params: {
  toCep: string;
  /** Quantidade total de itens no carrinho (define o peso do pacote). */
  itemCount: number;
  /** Valor dos itens para o seguro (em reais). */
  insuranceValueReais: number;
}): Promise<FreteQuote> {
  const apiUrl = process.env.MELHOR_ENVIO_API_URL?.replace(/\/$/, "");
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!apiUrl || !token) {
    throw new Error(
      "Cálculo de frete indisponível: defina MELHOR_ENVIO_API_URL e MELHOR_ENVIO_TOKEN.",
    );
  }

  const from = onlyDigits(process.env.STORE_ORIGIN_ZIPCODE ?? "");
  const to = onlyDigits(params.toCep ?? "");
  if (from.length !== 8) {
    throw new Error("CEP de origem inválido — configure STORE_ORIGIN_ZIPCODE (8 dígitos).");
  }
  if (to.length !== 8) {
    throw new Error("Informe um CEP de entrega válido para calcular o frete.");
  }

  const perItem = weightPerItemKg();
  const count = Number.isFinite(params.itemCount) ? Math.max(1, Math.floor(params.itemCount)) : 1;
  const weight = Number((perItem * count).toFixed(3));
  const insurance = Number.isFinite(params.insuranceValueReais)
    ? Math.max(0, params.insuranceValueReais)
    : 0;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent":
          process.env.MELHOR_ENVIO_USER_AGENT ?? "Camu (contato@camu.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: from },
        to: { postal_code: to },
        package: { ...boxDimensions(), weight },
        options: { receipt: false, own_hand: false, insurance_value: insurance },
      }),
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(
      `Não foi possível falar com o serviço de frete. ${err instanceof Error ? err.message : ""}`.trim(),
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Erro ao calcular frete (HTTP ${res.status}). ${detail.slice(0, 200)}`.trim());
  }

  const data = (await res.json()) as MelhorEnvioOption[];
  const allow = allowedServiceIds();

  const options: FreteQuote[] = (Array.isArray(data) ? data : [])
    .filter((o) => !o.error)
    .map((o) => {
      const rawPrice = o.custom_price ?? o.price ?? "0";
      return {
        cents: Math.round(parseFloat(String(rawPrice)) * 100),
        service: o.name ?? "Frete",
        carrier: o.company?.name ?? "Transportadora",
        serviceId: Number(o.id ?? 0),
        deliveryDays: Number(o.custom_delivery_time ?? o.delivery_time ?? 0),
      };
    })
    .filter((o) => o.cents > 0)
    .filter((o) => !allow || allow.has(o.serviceId));

  if (options.length === 0) {
    throw new Error("Nenhuma transportadora atende esse CEP no momento.");
  }

  return options.sort((a, b) => a.cents - b.cents)[0];
}
