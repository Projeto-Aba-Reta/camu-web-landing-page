import "server-only";
import { getOrdersByEmail, type OrderWithEvents } from "./store";
import { getPetMiniatureRequestsByEmail, publicMediaUrl } from "./pet-miniature";
import { statusLabel, timelineIndex } from "./status";
import type { OrderStatus, PetMiniatureRequest } from "./types";

export type DashboardItem = {
  key: string;
  kind: "loja" | "miniatura";
  title: string;
  createdAt: string;
  href: string;
  statusLabel: string;
  /** Índice na ORDER_TIMELINE; -1 = cancelado; null = ainda não virou pedido. */
  timelineIndex: number | null;
  /** Datas por passo da timeline (quando timelineIndex != null). */
  stepDates: (string | null)[];
  previewImageUrl: string | null;
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function itemsSummary(order: OrderWithEvents): string {
  return order.items
    .map((it) => `${it.product_name}${it.qty > 1 ? ` (×${it.qty})` : ""}`)
    .join(", ");
}

/** Datas por passo: 0 = criação; passos seguintes seguem os eventos != pending. */
function stepDatesFor(order: OrderWithEvents, currentIndex: number): (string | null)[] {
  const laterDates = order.events
    .filter((e) => e.status !== "pending")
    .map((e) => shortDate(e.created_at));
  return [0, 1, 2, 3, 4].map((i) => {
    if (currentIndex < 0 || i > currentIndex) return null;
    if (i === 0) return shortDate(order.order.created_at);
    return laterDates[i - 1] ?? shortDate(order.order.updated_at);
  });
}

function miniaturePreview(req: PetMiniatureRequest): string | null {
  const path =
    req.selected_variant === "sem_pintura"
      ? req.generated_image_plain_path
      : req.generated_image_painted_path ?? req.generated_image_plain_path;
  return path ? publicMediaUrl(path) : null;
}

function miniatureStandaloneLabel(req: PetMiniatureRequest): string {
  if (req.status === "processando") return "Gerando prévia";
  if (req.status === "falhou") return "Prévia falhou";
  return "Prévia pronta — aprove pra pagar";
}

/** Lista unificada de pedidos (loja + miniatura de pet) de um e-mail, mais
 *  recentes primeiro. Miniatura já paga aparece como pedido da loja. */
export async function getCustomerDashboard(email: string): Promise<DashboardItem[]> {
  const [orders, requests] = await Promise.all([
    getOrdersByEmail(email),
    getPetMiniatureRequestsByEmail(email),
  ]);

  const orderById = new Map(orders.map((o) => [o.order.id, o]));
  const petByOrderId = new Map(
    requests.filter((r) => r.order_id).map((r) => [r.order_id as string, r]),
  );

  const items: DashboardItem[] = [];

  for (const o of orders) {
    const idx = timelineIndex(o.order.status as OrderStatus);
    const pet = petByOrderId.get(o.order.id);
    items.push({
      key: `order-${o.order.id}`,
      kind: pet ? "miniatura" : "loja",
      title: pet ? "Miniatura do seu pet" : itemsSummary(o) || "Pedido",
      createdAt: o.order.created_at,
      href: `/pedido/${o.order.order_code}`,
      statusLabel: statusLabel(o.order.status as OrderStatus),
      timelineIndex: idx,
      stepDates: stepDatesFor(o, idx),
      previewImageUrl: pet ? miniaturePreview(pet) : null,
    });
  }

  // Encomendas de miniatura que ainda não viraram pedido pago.
  for (const req of requests) {
    if (req.order_id && orderById.has(req.order_id)) continue;
    items.push({
      key: `pet-${req.id}`,
      kind: "miniatura",
      title: "Miniatura do seu pet",
      createdAt: req.created_at,
      href: `/miniatura-pet/${req.id}`,
      statusLabel: miniatureStandaloneLabel(req),
      timelineIndex: null,
      stepDates: [],
      previewImageUrl: miniaturePreview(req),
    });
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
