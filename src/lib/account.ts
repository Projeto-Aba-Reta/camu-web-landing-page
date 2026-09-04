import "server-only";
import { getOrdersByEmail, type OrderWithEvents } from "./store";
import { getPetMiniatureRequestsByEmail, publicMediaUrl } from "./pet-miniature";
import { statusLabel, timelineIndex } from "./status";
import type { OrderStatus, PetMiniatureRequest } from "./types";

export type DashboardItem = {
  key: string;
  kind: "loja" | "miniatura";
  /** "approval" = prévia de miniatura ainda em aprovação (não virou pedido);
   *  "order" = pedido do pagamento em diante. */
  stage: "approval" | "order";
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

export type PendingPhotosOrder = {
  orderCode: string;
  href: string;
  missingCount: number;
};

/** Lista unificada de pedidos (loja + miniatura de pet) de um e-mail, mais
 *  recentes primeiro. Miniatura já paga aparece como pedido da loja. */
export async function getCustomerDashboard(email: string): Promise<DashboardItem[]> {
  const [orders, requests] = await Promise.all([
    getOrdersByEmail(email),
    getPetMiniatureRequestsByEmail(email),
  ]);

  const orderById = new Map(orders.map((o) => [o.order.id, o]));
  const petsByOrderId = new Map<string, PetMiniatureRequest[]>();
  for (const r of requests) {
    if (!r.order_id) continue;
    const list = petsByOrderId.get(r.order_id) ?? [];
    list.push(r);
    petsByOrderId.set(r.order_id, list);
  }

  const items: DashboardItem[] = [];

  for (const o of orders) {
    const idx = timelineIndex(o.order.status as OrderStatus);
    const pets = petsByOrderId.get(o.order.id) ?? [];
    const firstPet = pets[0] ?? null;
    items.push({
      key: `order-${o.order.id}`,
      kind: firstPet ? "miniatura" : "loja",
      stage: "order",
      title: firstPet
        ? `Miniatura do seu pet${pets.length > 1 ? ` (×${pets.length})` : ""}`
        : itemsSummary(o) || "Pedido",
      createdAt: o.order.created_at,
      href: `/pedido/${o.order.order_code}`,
      statusLabel: statusLabel(o.order.status as OrderStatus),
      timelineIndex: idx,
      stepDates: stepDatesFor(o, idx),
      previewImageUrl: firstPet ? miniaturePreview(firstPet) : null,
    });
  }

  // Encomendas de miniatura que ainda não viraram pedido pago.
  for (const req of requests) {
    if (req.order_id && orderById.has(req.order_id)) continue;
    items.push({
      key: `pet-${req.id}`,
      kind: "miniatura",
      stage: "approval",
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

/** Pedidos do fluxo "expressa" (paga antes, fotos depois) que já foram pagos
 *  mas ainda têm pet(s) sem foto enviada. Usado pra destacar isso em "minha
 *  conta" — só deve aparecer se houver algum pendente. */
export async function getPendingPhotosOrders(email: string): Promise<PendingPhotosOrder[]> {
  const orders = await getOrdersByEmail(email);
  const requests = await getPetMiniatureRequestsByEmail(email);

  const petsByOrderId = new Map<string, PetMiniatureRequest[]>();
  for (const r of requests) {
    if (!r.order_id) continue;
    const list = petsByOrderId.get(r.order_id) ?? [];
    list.push(r);
    petsByOrderId.set(r.order_id, list);
  }

  const pending: PendingPhotosOrder[] = [];
  for (const o of orders) {
    const pets = petsByOrderId.get(o.order.id) ?? [];
    const missingCount = pets.filter((p) => p.photo_paths.length === 0).length;
    if (missingCount === 0) continue;
    pending.push({
      orderCode: o.order.order_code,
      href: `/miniatura-pet/expressa/fotos/${o.order.order_code}`,
      missingCount,
    });
  }

  return pending;
}
