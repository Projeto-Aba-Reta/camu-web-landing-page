import "server-only";
import { randomUUID } from "node:crypto";
import { getServiceClient } from "./supabase/server";
import type { PetMiniatureRequest, PetMiniatureStatus, PetMiniatureVariant } from "./types";

/** Fotos originais do cliente — nunca públicas, só leitura via service role. */
const PHOTOS_BUCKET = "pet-photos";
/** Prévias geradas pela IA — públicas, mesmo padrão do bucket `product-media`. */
const MEDIA_BUCKET = "pet-media";

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB por foto
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function publicMediaUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}

export type IncomingPhoto = { name: string; type: string; buffer: Buffer };

export function validatePhotos(photos: IncomingPhoto[]): string | null {
  if (photos.length < MIN_PHOTOS || photos.length > MAX_PHOTOS) {
    return `Envie entre ${MIN_PHOTOS} e ${MAX_PHOTOS} fotos do seu pet.`;
  }
  for (const photo of photos) {
    if (!ALLOWED_MIME.has(photo.type)) {
      return "Cada foto precisa ser JPG, PNG ou WEBP.";
    }
    if (photo.buffer.byteLength > MAX_PHOTO_BYTES) {
      return "Cada foto deve ter até 8MB.";
    }
  }
  return null;
}

function extFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/** Cria a encomenda: sobe as fotos pro bucket privado e insere o registro
 *  com status inicial "processando". Preços e produto do catálogo entram
 *  só na aprovação. */
export async function createPetMiniatureRequest(input: {
  name: string;
  phone: string;
  email: string;
  photos: IncomingPhoto[];
}): Promise<PetMiniatureRequest> {
  const db = getServiceClient();
  const id = randomUUID();

  const photoPaths: string[] = [];
  for (const [i, photo] of input.photos.entries()) {
    const path = `${id}/${i}.${extFor(photo.type)}`;
    const { error } = await db.storage
      .from(PHOTOS_BUCKET)
      .upload(path, photo.buffer, { contentType: photo.type, upsert: true });
    if (error) throw new Error(`Falha ao enviar foto: ${error.message}`);
    photoPaths.push(path);
  }

  const { data, error } = await db
    .from("pet_miniature_requests")
    .insert({
      id,
      customer_name: input.name,
      customer_phone: input.phone,
      customer_email: input.email.trim().toLowerCase(),
      photo_paths: photoPaths,
      status: "processando" satisfies PetMiniatureStatus,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Falha ao criar encomenda: ${error?.message}`);
  return data as PetMiniatureRequest;
}

/** Fluxo "expressa": o cliente paga primeiro e só depois manda as fotos. Cria
 *  `count` encomendas já vinculadas ao pedido, sem fotos (`photo_paths: []`) e
 *  com a variante escolhida. `customer_phone` fica vazio de propósito — esse
 *  fluxo não pede telefone. As fotos entram depois via `attachPhotosToRequest`. */
export async function createExpressPetMiniatureRequests(input: {
  email: string;
  variant: PetMiniatureVariant;
  orderId: string;
  count: number;
}): Promise<PetMiniatureRequest[]> {
  const db = getServiceClient();
  const rows = Array.from({ length: Math.max(1, input.count) }, () => ({
    customer_name: "",
    customer_phone: "",
    customer_email: input.email.trim().toLowerCase(),
    photo_paths: [] as string[],
    status: "processando" satisfies PetMiniatureStatus,
    selected_variant: input.variant,
    order_id: input.orderId,
  }));

  const { data, error } = await db
    .from("pet_miniature_requests")
    .insert(rows)
    .select("*");
  if (error || !data) throw new Error(`Falha ao criar encomendas: ${error?.message}`);
  return data as PetMiniatureRequest[];
}

/** Anexa as fotos originais a uma encomenda que ainda não tem nenhuma (fluxo
 *  expressa, pós-pagamento). Sobe pro bucket privado e grava `photo_paths`.
 *  Registra um evento no pedido pra aparecer na timeline de acompanhamento. */
export async function attachPhotosToRequest(
  requestId: string,
  photos: IncomingPhoto[],
): Promise<void> {
  const db = getServiceClient();
  const request = await getPetMiniatureRequest(requestId);
  if (!request) throw new Error("Encomenda não encontrada.");
  if (request.photo_paths.length > 0) {
    throw new Error("As fotos deste pet já foram enviadas.");
  }

  const paths: string[] = [];
  for (const [i, photo] of photos.entries()) {
    const path = `${requestId}/${i}.${extFor(photo.type)}`;
    const { error } = await db.storage
      .from(PHOTOS_BUCKET)
      .upload(path, photo.buffer, { contentType: photo.type, upsert: true });
    if (error) throw new Error(`Falha ao enviar foto: ${error.message}`);
    paths.push(path);
  }

  const { error } = await db
    .from("pet_miniature_requests")
    .update({ photo_paths: paths })
    .eq("id", requestId);
  if (error) throw new Error(`Falha ao salvar fotos: ${error.message}`);

  if (request.order_id) {
    const { data: order } = await db
      .from("orders")
      .select("id, status")
      .eq("id", request.order_id)
      .maybeSingle();
    if (order) {
      await db.from("order_events").insert({
        order_id: order.id,
        status: (order as { status: string }).status,
        note: "Cliente enviou as fotos do pet.",
      });
    }
  }
}

export async function getPetMiniatureRequest(id: string): Promise<PetMiniatureRequest | null> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("pet_miniature_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar encomenda: ${error.message}`);
  return (data as PetMiniatureRequest) ?? null;
}

/** Baixa as fotos originais do bucket privado, em base64, pro pipeline de IA. */
export async function downloadPhotosBase64(
  request: PetMiniatureRequest,
): Promise<{ mimeType: string; base64: string }[]> {
  const db = getServiceClient();
  const results: { mimeType: string; base64: string }[] = [];
  for (const path of request.photo_paths) {
    const { data, error } = await db.storage.from(PHOTOS_BUCKET).download(path);
    if (error || !data) throw new Error(`Falha ao ler foto '${path}': ${error?.message}`);
    const buffer = Buffer.from(await data.arrayBuffer());
    results.push({ mimeType: data.type || "image/jpeg", base64: buffer.toString("base64") });
  }
  return results;
}

export async function markProcessing(id: string): Promise<void> {
  const db = getServiceClient();
  await db
    .from("pet_miniature_requests")
    .update({ status: "processando" satisfies PetMiniatureStatus, ai_error: null })
    .eq("id", id);
}

async function uploadPreview(
  db: ReturnType<typeof getServiceClient>,
  id: string,
  variant: "painted" | "plain",
  image: { mimeType: string; base64: string },
): Promise<string> {
  const path = `${id}/preview-${variant}-${Date.now()}.${extFor(image.mimeType)}`;
  const { error } = await db.storage
    .from(MEDIA_BUCKET)
    .upload(path, Buffer.from(image.base64, "base64"), {
      contentType: image.mimeType,
      upsert: true,
    });
  if (error) throw new Error(`Falha ao salvar prévia gerada: ${error.message}`);
  return path;
}

export async function markReady(
  id: string,
  images: {
    painted: { mimeType: string; base64: string };
    plain: { mimeType: string; base64: string };
  },
): Promise<void> {
  const db = getServiceClient();
  const [paintedPath, plainPath] = await Promise.all([
    uploadPreview(db, id, "painted", images.painted),
    uploadPreview(db, id, "plain", images.plain),
  ]);

  const { error } = await db
    .from("pet_miniature_requests")
    .update({
      status: "pronto" satisfies PetMiniatureStatus,
      generated_image_painted_path: paintedPath,
      generated_image_plain_path: plainPath,
      ai_error: null,
    })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar encomenda: ${error.message}`);
}

/** Grava a variante escolhida pelo cliente na aprovação (define o preço/produto). */
export async function setSelectedVariant(id: string, variant: PetMiniatureVariant): Promise<void> {
  const db = getServiceClient();
  const { error } = await db
    .from("pet_miniature_requests")
    .update({ selected_variant: variant })
    .eq("id", id);
  if (error) throw new Error(`Falha ao registrar a variante escolhida: ${error.message}`);
}

export async function markFailed(id: string, message: string): Promise<void> {
  const db = getServiceClient();
  await db
    .from("pet_miniature_requests")
    .update({ status: "falhou" satisfies PetMiniatureStatus, ai_error: message })
    .eq("id", id);
}

export async function linkOrder(id: string, orderId: string): Promise<void> {
  const db = getServiceClient();
  const { error } = await db.from("pet_miniature_requests").update({ order_id: orderId }).eq("id", id);
  if (error) throw new Error(`Falha ao vincular pedido: ${error.message}`);
}

/** Encomendas de miniatura de pet feitas com um e-mail (área "minha conta"). */
export async function getPetMiniatureRequestsByEmail(
  email: string,
): Promise<PetMiniatureRequest[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("pet_miniature_requests")
    .select("*")
    .ilike("customer_email", email)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao buscar encomendas: ${error.message}`);
  return (data ?? []) as PetMiniatureRequest[];
}

/** Encomendas de miniatura vinculadas a um pedido. Um pedido pode juntar várias
 *  miniaturas (uma por pet) — daí retornar lista. Usada pela notificação de
 *  venda e pelas telas de pedido pra saber se veio desse fluxo. */
export async function getPetMiniatureRequestsByOrderId(
  orderId: string,
): Promise<PetMiniatureRequest[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("pet_miniature_requests")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true }); // desempate estável (várias criadas de uma vez)
  if (error) throw new Error(`Falha ao buscar encomendas pelo pedido: ${error.message}`);
  return (data ?? []) as PetMiniatureRequest[];
}
