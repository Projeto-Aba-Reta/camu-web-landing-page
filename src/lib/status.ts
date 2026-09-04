import type { OrderStatus } from "./types";

/**
 * Fonte única do contrato de status/timeline consumido pela spec
 * `acompanhamento-de-pedido` (openspec/changes/deep-link-admin-no-pedido). O
 * admin (camu-web-admin) escreve `orders.status` seguindo este vocabulário;
 * `timelineIndex` cai no passo 0 para qualquer status fora dele em vez de
 * quebrar a página de acompanhamento.
 */

/** Passos da timeline de acompanhamento (tela 6). */
export const ORDER_TIMELINE = [
  { key: "received", label: "Recebido" },
  { key: "production", label: "Em produção" },
  { key: "finishing", label: "Acabamento" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregue" },
] as const;

/** Índice do passo atingido para cada status logístico. */
export function timelineIndex(status: OrderStatus): number {
  switch (status) {
    case "pending":
      return 0; // recebido, aguardando pagamento
    case "paid":
    case "in_production":
      return 1;
    case "finishing":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  in_production: "Em produção",
  finishing: "Acabamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status] ?? status;
}
