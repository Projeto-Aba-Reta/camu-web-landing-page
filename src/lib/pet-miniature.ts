import "server-only";
import { randomUUID } from "node:crypto";
import { getServiceClient } from "./supabase/server";
import type { PetMiniatureRequest, PetMiniatureStatus } from "./types";

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
      photo_paths: photoPaths,
      status: "processando" satisfies PetMiniatureStatus,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Falha ao criar encomenda: ${error?.message}`);
  return data as PetMiniatureRequest;
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

export async function markReady(
  id: string,
  image: { mimeType: string; base64: string },
): Promise<void> {
  const db = getServiceClient();
  const path = `${id}/preview-${Date.now()}.${extFor(image.mimeType)}`;
  const { error: upErr } = await db.storage
    .from(MEDIA_BUCKET)
    .upload(path, Buffer.from(image.base64, "base64"), {
      contentType: image.mimeType,
      upsert: true,
    });
  if (upErr) throw new Error(`Falha ao salvar prévia gerada: ${upErr.message}`);

  const { error } = await db
    .from("pet_miniature_requests")
    .update({
      status: "pronto" satisfies PetMiniatureStatus,
      generated_image_path: path,
      ai_error: null,
    })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar encomenda: ${error.message}`);
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

/** Usada pela notificação de venda pra saber se um pedido veio desse fluxo. */
export async function getPetMiniatureRequestByOrderId(
  orderId: string,
): Promise<PetMiniatureRequest | null> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("pet_miniature_requests")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar encomenda pelo pedido: ${error.message}`);
  return (data as PetMiniatureRequest) ?? null;
}
