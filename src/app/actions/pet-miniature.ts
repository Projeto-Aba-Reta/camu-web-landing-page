"use server";

import { after } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { runPetMiniatureGeneration, retryPetMiniatureGeneration } from "@/lib/pet-miniature-pipeline";
import {
  createPetMiniatureRequest,
  getPetMiniatureRequest,
  linkOrder,
  publicMediaUrl,
  setSelectedVariant,
  validatePhotos,
  type IncomingPhoto,
} from "@/lib/pet-miniature";
import { createOrder, getPetMiniaturePricing, setOrderPreference } from "@/lib/store";
import type { PetMiniatureVariant } from "@/lib/types";

export type PetMiniatureIntakeResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

/** Cria a encomenda a partir do formulário (nome, WhatsApp, 3–4 fotos) e
 *  dispara a geração da prévia em background — a resposta ao cliente não
 *  espera o pipeline de IA terminar. */
export async function submitPetMiniatureIntake(formData: FormData): Promise<PetMiniatureIntakeResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!name || !phone) {
    return { ok: false, error: "Preencha nome e WhatsApp." };
  }

  const photos: IncomingPhoto[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push({ name: file.name, type: file.type, buffer });
  }

  const validationError = validatePhotos(photos);
  if (validationError) return { ok: false, error: validationError };

  try {
    const request = await createPetMiniatureRequest({ name, phone, photos });

    after(() => runPetMiniatureGeneration(request.id));

    return { ok: true, requestId: request.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível enviar suas fotos.";
    return { ok: false, error: message };
  }
}

export type PetMiniatureStatusResult =
  | {
      ok: true;
      status: "processando" | "pronto" | "falhou";
      paintedPreviewUrl: string | null;
      plainPreviewUrl: string | null;
      semPinturaCents: number | null;
      comPinturaCents: number | null;
      error: string | null;
    }
  | { ok: false; error: string };

/** Consultada por polling na tela de acompanhamento. */
export async function getPetMiniatureStatus(requestId: string): Promise<PetMiniatureStatusResult> {
  const request = await getPetMiniatureRequest(requestId);
  if (!request) return { ok: false, error: "Encomenda não encontrada." };

  const pricing = await getPetMiniaturePricing();

  return {
    ok: true,
    status: request.status,
    paintedPreviewUrl: request.generated_image_painted_path
      ? publicMediaUrl(request.generated_image_painted_path)
      : null,
    plainPreviewUrl: request.generated_image_plain_path
      ? publicMediaUrl(request.generated_image_plain_path)
      : null,
    semPinturaCents: pricing.semPinturaCents,
    comPinturaCents: pricing.comPinturaCents,
    error: request.ai_error,
  };
}

/** Reprocessa as mesmas fotos, sem exigir novo upload. */
export async function requestPetMiniatureRetry(requestId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const request = await getPetMiniatureRequest(requestId);
  if (!request) return { ok: false, error: "Encomenda não encontrada." };
  if (request.status === "processando") return { ok: true };

  after(() => retryPetMiniatureGeneration(requestId));
  return { ok: true };
}

export type PetMiniatureApprovalResult =
  | { ok: true; initPoint: string }
  | { ok: false; error: string };

const PRODUCT_ID_BY_VARIANT: Record<PetMiniatureVariant, string | undefined> = {
  sem_pintura: process.env.PET_MINIATURE_PRODUCT_ID_SEM_PINTURA,
  com_pintura: process.env.PET_MINIATURE_PRODUCT_ID_COM_PINTURA,
};

const VARIANT_LABEL: Record<PetMiniatureVariant, string> = {
  sem_pintura: "Sem pintura",
  com_pintura: "Com pintura",
};

/** Aprova a prévia pronta, grava a variante escolhida (sem pintura / com
 *  pintura) e cria o pedido/preferência de pagamento. O preço vem sempre do
 *  listing do produto correspondente no catálogo (canal `loja_propria`) —
 *  nunca de um valor calculado aqui. */
export async function approvePetMiniatureAndPay(
  requestId: string,
  variant: PetMiniatureVariant,
): Promise<PetMiniatureApprovalResult> {
  const productId = PRODUCT_ID_BY_VARIANT[variant];
  if (!productId) {
    return { ok: false, error: "Produto de miniatura de pet ainda não está configurado." };
  }

  const request = await getPetMiniatureRequest(requestId);
  if (!request) return { ok: false, error: "Encomenda não encontrada." };
  if (request.status !== "pronto") {
    return { ok: false, error: "A prévia ainda não está pronta pra aprovação." };
  }

  try {
    await setSelectedVariant(requestId, variant);

    const { order, items } = await createOrder({
      items: [{ productId, variant: VARIANT_LABEL[variant], qty: 1 }],
      customer: {
        name: request.customer_name,
        email: "",
        phone: request.customer_phone,
        cep: "",
        line: "",
        city: "",
        uf: "",
      },
    });

    const { preferenceId, initPoint } = await createPreference({
      orderCode: order.order_code,
      items: items.map((it) => ({
        title: it.product_name,
        quantity: it.qty,
        unit_price: it.unit_price_cents / 100,
      })),
      shippingReais: order.shipping_cents / 100,
    });

    await setOrderPreference(order.id, preferenceId);
    await linkOrder(requestId, order.id);

    return { ok: true, initPoint };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao gerar o pagamento.";
    return { ok: false, error: message };
  }
}
