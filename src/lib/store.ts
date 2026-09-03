import "server-only";
import { track } from "@vercel/analytics/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "./supabase/server";
import { activeGatewayId, getPaymentGateway } from "./payments";
import { SHIPPING_CENTS } from "./money";
import { notifySaleChannels } from "./notify";
import { getPetMiniatureRequestByOrderId, publicMediaUrl } from "./pet-miniature";
import type { Order, OrderItem, OrderStatus, Product } from "./types";

const SITE_CHANNEL = "loja_propria";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Produtos da miniatura de pet: têm listing 'loja_propria' só pra fornecer preço
 *  à tela /miniatura-pet — não devem aparecer no catálogo geral da loja. */
function petMiniatureProductIds(): Set<string> {
  return new Set(
    [
      process.env.PET_MINIATURE_PRODUCT_ID_SEM_PINTURA,
      process.env.PET_MINIATURE_PRODUCT_ID_COM_PINTURA,
    ].filter((v): v is string => Boolean(v)),
  );
}

// ----------------------------------------------------------------------------
// Catálogo (lê o schema do ERP: products + product_channel_listings + product_media)
// ----------------------------------------------------------------------------

function publicImageUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/product-media/${storagePath}`;
}

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  size_tier: string | null;
};

function toProduct(row: ProductRow, priceReais: number, coverPath: string | null): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    size_tier: row.size_tier,
    price_cents: Math.round(priceReais * 100),
    image_url: publicImageUrl(coverPath),
  };
}

/** Mapa product_id -> caminho da capa (is_cover), pra montar a imagem. */
async function coverPaths(db: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await db
    .from("product_media")
    .select("product_id, storage_path")
    .eq("is_cover", true)
    .in("product_id", ids);
  return new Map(
    (data ?? []).map((m) => [m.product_id as string, m.storage_path as string]),
  );
}

/** Peços ativas com listing 'loja_propria' ativo. Preço = listed_price do canal. */
export async function getProducts(): Promise<Product[]> {
  const db = getServiceClient();

  const { data: listings, error: lErr } = await db
    .from("product_channel_listings")
    .select("product_id, listed_price")
    .eq("channel", SITE_CHANNEL)
    .eq("is_active", true);
  if (lErr) throw new Error(`Falha ao carregar preços da loja: ${lErr.message}`);

  const petIds = petMiniatureProductIds();
  const priceByProduct = new Map<string, number>(
    (listings ?? [])
      .filter((l) => !petIds.has(l.product_id as string))
      .map((l) => [l.product_id as string, Number(l.listed_price)]),
  );
  const ids = [...priceByProduct.keys()];
  if (ids.length === 0) return [];

  const { data: products, error: pErr } = await db
    .from("products")
    .select("id, name, description, category, size_tier")
    .eq("status", "ativo")
    .in("id", ids)
    .order("name", { ascending: true });
  if (pErr) throw new Error(`Falha ao carregar produtos: ${pErr.message}`);

  const rows = (products ?? []) as ProductRow[];
  const covers = await coverPaths(db, rows.map((p) => p.id));

  return rows.map((p) => toProduct(p, priceByProduct.get(p.id) ?? 0, covers.get(p.id) ?? null));
}

export type PetMiniaturePricing = {
  semPinturaCents: number | null;
  comPinturaCents: number | null;
};

/** Preços das duas variantes da miniatura de pet, sempre lidos do listing
 *  'loja_propria' — nunca hardcoded no site. */
export async function getPetMiniaturePricing(): Promise<PetMiniaturePricing> {
  const semPinturaId = process.env.PET_MINIATURE_PRODUCT_ID_SEM_PINTURA;
  const comPinturaId = process.env.PET_MINIATURE_PRODUCT_ID_COM_PINTURA;
  const ids = [semPinturaId, comPinturaId].filter((v): v is string => Boolean(v));
  if (ids.length === 0) return { semPinturaCents: null, comPinturaCents: null };

  const db = getServiceClient();
  const { data, error } = await db
    .from("product_channel_listings")
    .select("product_id, listed_price")
    .eq("channel", SITE_CHANNEL)
    .eq("is_active", true)
    .in("product_id", ids);
  if (error) throw new Error(`Falha ao carregar preços da miniatura de pet: ${error.message}`);

  const priceByProduct = new Map(
    (data ?? []).map((l) => [l.product_id as string, Math.round(Number(l.listed_price) * 100)]),
  );
  return {
    semPinturaCents: semPinturaId ? priceByProduct.get(semPinturaId) ?? null : null,
    comPinturaCents: comPinturaId ? priceByProduct.get(comPinturaId) ?? null : null,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!UUID_RE.test(id)) return null;
  if (petMiniatureProductIds().has(id)) return null; // vendido só pela tela /miniatura-pet
  const db = getServiceClient();

  const { data: product, error } = await db
    .from("products")
    .select("id, name, description, category, size_tier, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar produto: ${error.message}`);
  if (!product || product.status !== "ativo") return null;

  const { data: listing } = await db
    .from("product_channel_listings")
    .select("listed_price")
    .eq("product_id", id)
    .eq("channel", SITE_CHANNEL)
    .eq("is_active", true)
    .maybeSingle();
  if (!listing) return null; // ativo mas não publicado na loja do site

  const covers = await coverPaths(db, [id]);
  return toProduct(product as ProductRow, Number(listing.listed_price), covers.get(id) ?? null);
}

// ----------------------------------------------------------------------------
// Pedidos
// ----------------------------------------------------------------------------

export type IncomingItem = { productId: string; variant?: string; qty: number };

export type OrderWithItems = {
  order: Order;
  items: OrderItem[];
};

/**
 * Cria um pedido a partir dos itens do carrinho. Os PREÇOS são sempre
 * recalculados a partir do canal 'loja_propria' — o que o client mandou é ignorado.
 */
export async function createOrder(input: {
  items: IncomingItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    cep: string;
    line: string;
    city: string;
    uf: string;
  };
}): Promise<OrderWithItems> {
  const db = getServiceClient();

  const cleaned = input.items
    .filter((i) => UUID_RE.test(i.productId) && Number.isFinite(i.qty) && i.qty > 0)
    .map((i) => ({ productId: i.productId, variant: i.variant || "Padrão", qty: Math.floor(i.qty) }));
  if (cleaned.length === 0) throw new Error("Carrinho vazio.");

  const ids = [...new Set(cleaned.map((i) => i.productId))];

  const [{ data: listings, error: lErr }, { data: products, error: pErr }] = await Promise.all([
    db
      .from("product_channel_listings")
      .select("product_id, listed_price")
      .eq("channel", SITE_CHANNEL)
      .eq("is_active", true)
      .in("product_id", ids),
    db.from("products").select("id, name, status").in("id", ids),
  ]);
  if (lErr) throw new Error(`Falha ao validar preços: ${lErr.message}`);
  if (pErr) throw new Error(`Falha ao validar itens: ${pErr.message}`);

  const priceByProduct = new Map(
    (listings ?? []).map((l) => [l.product_id as string, Number(l.listed_price)]),
  );
  const prodById = new Map((products ?? []).map((p) => [p.id as string, p]));

  const lineItems = cleaned.map((i) => {
    const p = prodById.get(i.productId) as { name: string; status: string } | undefined;
    const priceReais = priceByProduct.get(i.productId);
    if (!p || p.status !== "ativo" || priceReais == null) {
      throw new Error("Um dos itens não está mais disponível na loja.");
    }
    return {
      product_id: i.productId,
      product_name: p.name,
      variant: i.variant,
      unit_price_cents: Math.round(priceReais * 100),
      qty: i.qty,
    };
  });

  const subtotal = lineItems.reduce((s, it) => s + it.unit_price_cents * it.qty, 0);
  const shipping = SHIPPING_CENTS;
  const total = subtotal + shipping;

  const { data: orderRow, error: orderErr } = await db
    .from("orders")
    .insert({
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone,
      address_cep: input.customer.cep,
      address_line: input.customer.line,
      address_city: input.customer.city,
      address_uf: input.customer.uf,
      payment_method: activeGatewayId(),
      payment_status: "pending",
      status: "pending",
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
    })
    .select("*")
    .single();
  if (orderErr || !orderRow) throw new Error(`Falha ao criar pedido: ${orderErr?.message}`);
  const order = orderRow as Order;

  const { error: itemsErr } = await db
    .from("order_items")
    .insert(lineItems.map((it) => ({ order_id: order.id, ...it })));
  if (itemsErr) throw new Error(`Falha ao salvar itens: ${itemsErr.message}`);

  await db.from("order_events").insert({
    order_id: order.id,
    status: "pending",
    note: "Pedido recebido, aguardando pagamento.",
  });

  return { order, items: lineItems.map((it, idx) => ({ id: String(idx), ...it })) };
}

export async function setOrderPreference(orderId: string, preferenceId: string): Promise<void> {
  const db = getServiceClient();
  await db.from("orders").update({ mp_preference_id: preferenceId }).eq("id", orderId);
}

export async function getOrderByCode(code: string): Promise<
  (OrderWithItems & { events: { status: string; note: string | null; created_at: string }[] }) | null
> {
  const db = getServiceClient();
  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("order_code", code)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar pedido: ${error.message}`);
  if (!order) return null;

  const [{ data: items }, { data: events }] = await Promise.all([
    db.from("order_items").select("*").eq("order_id", (order as Order).id),
    db
      .from("order_events")
      .select("status, note, created_at")
      .eq("order_id", (order as Order).id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    order: order as Order,
    items: (items ?? []) as OrderItem[],
    events: (events ?? []) as { status: string; note: string | null; created_at: string }[],
  };
}

export type OrderWithEvents = OrderWithItems & {
  events: { status: string; note: string | null; created_at: string }[];
};

/** Todos os pedidos da loja feitos com um e-mail (área "minha conta"). */
export async function getOrdersByEmail(email: string): Promise<OrderWithEvents[]> {
  const db = getServiceClient();
  const { data: orders, error } = await db
    .from("orders")
    .select("*")
    .ilike("customer_email", email)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao buscar pedidos: ${error.message}`);
  const rows = (orders ?? []) as Order[];
  if (rows.length === 0) return [];

  const ids = rows.map((o) => o.id);
  const [{ data: items }, { data: events }] = await Promise.all([
    db.from("order_items").select("*").in("order_id", ids),
    db
      .from("order_events")
      .select("order_id, status, note, created_at")
      .in("order_id", ids)
      .order("created_at", { ascending: true }),
  ]);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const it of (items ?? []) as (OrderItem & { order_id: string })[]) {
    const list = itemsByOrder.get(it.order_id) ?? [];
    list.push(it);
    itemsByOrder.set(it.order_id, list);
  }
  const eventsByOrder = new Map<string, OrderWithEvents["events"]>();
  for (const ev of (events ?? []) as (OrderWithEvents["events"][number] & {
    order_id: string;
  })[]) {
    const list = eventsByOrder.get(ev.order_id) ?? [];
    list.push({ status: ev.status, note: ev.note, created_at: ev.created_at });
    eventsByOrder.set(ev.order_id, list);
  }

  return rows.map((order) => ({
    order,
    items: itemsByOrder.get(order.id) ?? [],
    events: eventsByOrder.get(order.id) ?? [],
  }));
}

// ----------------------------------------------------------------------------
// Pagamento
// ----------------------------------------------------------------------------

/** Mapeia o status do pagamento no Mercado Pago pro status logístico do pedido. */
function nextStatus(mpStatus: string): { orderStatus: OrderStatus | null; note: string } {
  switch (mpStatus) {
    case "approved":
      return { orderStatus: "paid", note: "Pagamento aprovado — pedido entrou na fila de produção." };
    case "cancelled":
    case "refunded":
    case "charged_back":
      return { orderStatus: "cancelled", note: `Pagamento ${mpStatus}.` };
    default:
      return { orderStatus: null, note: `Pagamento ${mpStatus}.` };
  }
}

/** Aplica um status de pagamento vindo do MP, atualizando pedido + timeline. */
export async function applyPaymentStatus(
  code: string,
  mpStatus: string,
  paymentId: string | null,
): Promise<void> {
  const db = getServiceClient();
  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("order_code", code)
    .maybeSingle();
  if (!order) return;
  const current = order as Order;

  // Nada a fazer se já registramos esse mesmo status.
  if (current.payment_status === mpStatus && current.mp_payment_id === paymentId) return;

  const { orderStatus, note } = nextStatus(mpStatus);
  const update: Record<string, unknown> = { payment_status: mpStatus };
  if (paymentId) update.mp_payment_id = paymentId;
  // Só avança o status logístico; nunca regride de um estado já produzido.
  if (orderStatus && current.status === "pending") update.status = orderStatus;
  if (orderStatus === "cancelled") update.status = "cancelled";

  await db.from("orders").update(update).eq("id", current.id);
  await db.from("order_events").insert({
    order_id: current.id,
    status: (update.status as string) ?? current.status,
    note,
  });

  // Pedido acabou de ser pago pela primeira vez: avisa o time da Camu.
  if (orderStatus === "paid" && current.status === "pending") {
    await notifySaleOfPaidOrder({ ...current, ...update } as Order);
    // Evento de funil — best-effort, sem PII.
    try {
      await track("pedido_pago", {
        pedido: current.order_code,
        total_cents: current.total_cents,
      });
    } catch {
      // analytics é best-effort
    }
  }
}

/** Notificação de venda — best-effort, nunca interrompe a atualização do pedido. */
async function notifySaleOfPaidOrder(order: Order): Promise<void> {
  try {
    const db = getServiceClient();
    const [{ data: items }, petRequest] = await Promise.all([
      db.from("order_items").select("*").eq("order_id", order.id),
      getPetMiniatureRequestByOrderId(order.id),
    ]);
    const itemsSummary = ((items ?? []) as OrderItem[])
      .map((it) => `${it.product_name}${it.qty > 1 ? ` (×${it.qty})` : ""}`)
      .join(", ");

    await notifySaleChannels({
      orderCode: order.order_code,
      customerName: order.customer_name,
      totalCents: order.total_cents,
      itemsSummary,
      kind: petRequest ? "pet_miniature" : "catalog",
      previewImageUrl: (() => {
        if (!petRequest) return null;
        const path =
          petRequest.selected_variant === "com_pintura"
            ? petRequest.generated_image_painted_path
            : petRequest.generated_image_plain_path;
        return path ? publicMediaUrl(path) : null;
      })(),
    });
  } catch (err) {
    console.error("[notifySaleOfPaidOrder]", err);
  }
}

/**
 * Reconcilia o pagamento consultando direto a API do gateway ativo.
 * Útil quando o webhook não chega (localhost) — chamado na página de confirmação.
 */
export async function reconcileOrderPayment(code: string): Promise<void> {
  try {
    const db = getServiceClient();
    const { data: order } = await db
      .from("orders")
      .select("order_code, mp_preference_id")
      .eq("order_code", code)
      .maybeSingle();
    if (!order) return;

    const found = await getPaymentGateway().reconcile(
      order as { order_code: string; mp_preference_id: string | null },
    );
    if (found) await applyPaymentStatus(code, found.status, found.paymentId);
  } catch {
    // Reconciliação é best-effort; o webhook ainda cobre o caso normal.
  }
}
