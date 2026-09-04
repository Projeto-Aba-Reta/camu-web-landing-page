/** Helpers de formatação compartilhados pelos canais de notificação. */

export function fullAddress(a: {
  line: string | null;
  city: string | null;
  uf: string | null;
  cep: string | null;
}): string {
  const cityUf = [a.city, a.uf].filter(Boolean).join("/");
  const parts = [a.line, cityUf, a.cep ? `CEP ${a.cep}` : null].filter(Boolean);
  return parts.join(" — ");
}

export function paymentMethodLabel(method: string | null): string {
  if (!method) return "—";
  const map: Record<string, string> = {
    pix: "Pix",
    credit_card: "Cartão de crédito",
    debit_card: "Cartão de débito",
    boleto: "Boleto",
    card: "Cartão",
  };
  return map[method] ?? method;
}

export function variantLabel(variant: string | null): string {
  if (!variant) return "—";
  const map: Record<string, string> = {
    com_pintura: "Com pintura",
    sem_pintura: "Sem pintura",
  };
  return map[variant] ?? variant;
}

/** Link direto pro pedido no camu-web-admin, ou `null` se `ADMIN_BASE_URL` não estiver configurada. */
export function adminOrderUrl(orderCode: string): string | null {
  const base = process.env.ADMIN_BASE_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/vendas/pedidos/codigo/${orderCode}`;
}
