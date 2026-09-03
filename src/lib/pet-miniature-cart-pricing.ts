/** Preço do carrinho de miniaturas de pet com a promoção "leve 2".
 *
 *  Regra: a cada par de miniaturas, as duas ganham X% OFF. Em quantidade ímpar,
 *  a unidade MAIS CARA fica sem desconto (as `floor(n/2)*2` mais baratas entram
 *  na promoção).
 *
 *  Módulo puro e sem `server-only` de propósito: o mesmo cálculo roda no client
 *  (resumo do carrinho) e no servidor (server action) — mas o servidor SEMPRE
 *  recalcula a partir dos preços do canal `loja_propria`, nunca confia no client.
 */

function clampPct(raw: number): number {
  if (!Number.isFinite(raw)) return 10;
  return Math.min(90, Math.max(0, raw));
}

/** Percentual de desconto por par (`NEXT_PUBLIC_PET_MINIATURE_PAIR_DISCOUNT_PCT`, padrão 10). */
export const PET_MINIATURE_PAIR_DISCOUNT_PCT = clampPct(
  Number(process.env.NEXT_PUBLIC_PET_MINIATURE_PAIR_DISCOUNT_PCT ?? "10"),
);

export type PetCartUnit = { key: string; unitPriceCents: number };

export type PetCartLinePricing = {
  key: string;
  unitPriceCents: number;
  /** Preço já com o desconto aplicado (== unitPriceCents quando não entrou na promoção). */
  netPriceCents: number;
  discountCents: number;
  discounted: boolean;
};

export type PetCartPricing = {
  lines: PetCartLinePricing[];
  /** Soma dos preços cheios. */
  subtotalCents: number;
  /** Total abatido pela promoção. */
  discountCents: number;
  /** subtotalCents - discountCents (só itens, sem frete). */
  itemsTotalCents: number;
  /** Quantas unidades entraram na promoção (sempre par). */
  discountedUnitCount: number;
  pairDiscountPct: number;
};

export function computePetCartPricing(
  units: PetCartUnit[],
  pairDiscountPct: number = PET_MINIATURE_PAIR_DISCOUNT_PCT,
): PetCartPricing {
  const pct = clampPct(pairDiscountPct);
  // As mais baratas primeiro — são elas que ganham o desconto quando sobra ímpar.
  const sorted = [...units].sort((a, b) => a.unitPriceCents - b.unitPriceCents);
  const discountedUnitCount = sorted.length - (sorted.length % 2);

  const pricingByKey = new Map<string, PetCartLinePricing>();
  sorted.forEach((unit, index) => {
    const discounted = index < discountedUnitCount && pct > 0;
    const discountCents = discounted
      ? Math.round((unit.unitPriceCents * pct) / 100)
      : 0;
    pricingByKey.set(unit.key, {
      key: unit.key,
      unitPriceCents: unit.unitPriceCents,
      netPriceCents: unit.unitPriceCents - discountCents,
      discountCents,
      discounted,
    });
  });

  // Devolve na ordem original de `units`.
  const lines = units.map(
    (u) =>
      pricingByKey.get(u.key) ?? {
        key: u.key,
        unitPriceCents: u.unitPriceCents,
        netPriceCents: u.unitPriceCents,
        discountCents: 0,
        discounted: false,
      },
  );

  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents, 0);
  const discountCents = lines.reduce((s, l) => s + l.discountCents, 0);

  return {
    lines,
    subtotalCents,
    discountCents,
    itemsTotalCents: subtotalCents - discountCents,
    discountedUnitCount,
    pairDiscountPct: pct,
  };
}
