"use server";

import { after } from "next/server";
import { getPaymentGateway, paymentBypassEnabled, orderConfirmedUrl } from "@/lib/payments";
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
import {
  applyPaymentStatus,
  createOrder,
  getPetMiniaturePricing,
  setOrderPreference,
} from "@/lib/store";
import { isValidEmail } from "@/lib/auth/session";
import { isValidPhone } from "@/lib/contact";
import type { PetMiniatureVariant } from "@/lib/types";
import { getPostHogClient } from "@/lib/posthog-server";

export type PetMiniatureIntakeResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

/** Cria a encomenda a partir do formulário (nome, WhatsApp, 3–4 fotos) e
 *  dispara a geração da prévia em background — a resposta ao cliente não
 *  espera o pipeline de IA terminar. */
export async function submitPetMiniatureIntake(formData: FormData): Promise<PetMiniatureIntakeResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!name || !phone || !email) {
    return { ok: false, error: "Preencha nome, WhatsApp e e-mail." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Digite um e-mail válido — é por ele que você acompanha o pedido." };
  }
  if (!isValidPhone(phone)) {
    return { ok: false, error: "Digite um WhatsApp válido com DDD, ex.: +55 (11) 91258-1464." };
  }

  const photos: IncomingPhoto[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push({ name: file.name, type: file.type, buffer });
  }

  const validationError = validatePhotos(photos);
  if (validationError) return { ok: false, error: validationError };

  try {
    const request = await createPetMiniatureRequest({ name, phone, email, photos });

    after(() => runPetMiniatureGeneration(request.id));

    // Server-side: identify the user and capture the intake creation event.
    // distinctId is the request id (a stable, non-PII uuid); PII goes only to
    // identify() so it lands on the person profile, never on the event itself.
    const posthog = getPostHogClient();
    if (posthog) {
      posthog.identify({
        distinctId: request.id,
        properties: { email, phone_country: phone.startsWith("+55") ? "BR" : "other" },
      });
      posthog.capture({
        distinctId: request.id,
        event: "pet_miniature_order_created",
        properties: { photo_count: photos.length, request_id: request.id },
      });
      await posthog.flush();
    }

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

/** Endereço de entrega coletado na aprovação. O site busca rua/bairro/cidade
 *  pelo CEP nos Correios e o cliente confirma; `line` já vem montado
 *  (logradouro, número, complemento, bairro). Nenhum campo pode ficar vazio;
 *  e-mail é opcional. */
export type PetMiniatureAddress = {
  cep: string;
  line: string;
  city: string;
  uf: string;
  email?: string;
};

const CEP_RE = /^\d{5}-?\d{3}$/;

/** O SDK do Mercado Pago rejeita com objetos que não são `instanceof Error`
 *  (ex.: `{ message, status, cause: [{ description }] }`). Extrai a mensagem
 *  mais útil pra não cair no genérico "Erro inesperado". */
function errorMessage(err: unknown): string | null {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; cause?: unknown };
    const cause = Array.isArray(e.cause) ? e.cause[0] : e.cause;
    const causeMsg =
      cause && typeof cause === "object"
        ? (cause as { description?: string }).description
        : undefined;
    if (causeMsg) return causeMsg;
    if (typeof e.message === "string") return e.message;
  }
  return null;
}

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
  address: PetMiniatureAddress,
): Promise<PetMiniatureApprovalResult> {
  const productId = PRODUCT_ID_BY_VARIANT[variant];
  if (!productId) {
    return { ok: false, error: "Produto de miniatura de pet ainda não está configurado." };
  }

  const cep = (address?.cep ?? "").trim();
  if (!CEP_RE.test(cep)) {
    return { ok: false, error: "Informe um CEP válido (formato 00000-000) para a entrega." };
  }
  const line = (address?.line ?? "").trim();
  const city = (address?.city ?? "").trim();
  const uf = (address?.uf ?? "").trim();
  if (!line || !city || !uf) {
    return { ok: false, error: "Endereço de entrega incompleto — nenhum campo pode ficar vazio." };
  }
  const request = await getPetMiniatureRequest(requestId);
  if (!request) return { ok: false, error: "Encomenda não encontrada." };
  if (request.status !== "pronto") {
    return { ok: false, error: "A prévia ainda não está pronta pra aprovação." };
  }

  // E-mail vem do intake; o do endereço é só um fallback pra encomendas antigas.
  const email = (request.customer_email || address?.email || "").trim();

  try {
    await setSelectedVariant(requestId, variant);

    const { order, items } = await createOrder({
      items: [{ productId, variant: VARIANT_LABEL[variant], qty: 1 }],
      customer: {
        name: request.customer_name,
        email,
        phone: request.customer_phone,
        cep,
        line,
        city,
        uf,
      },
    });

    // Dev: pula o Mercado Pago e marca o pedido como pago na hora.
    if (paymentBypassEnabled()) {
      await linkOrder(requestId, order.id);
      await applyPaymentStatus(order.order_code, "approved", null);
      return { ok: true, initPoint: orderConfirmedUrl(order.order_code) };
    }

    const { sessionId, initPoint } = await getPaymentGateway().createCheckout({
      orderCode: order.order_code,
      items: items.map((it) => ({
        title: it.product_name,
        quantity: it.qty,
        unit_price: it.unit_price_cents / 100,
      })),
      shippingReais: order.shipping_cents / 100,
      payer: email ? { name: request.customer_name, email } : undefined,
    });

    await setOrderPreference(order.id, sessionId);
    await linkOrder(requestId, order.id);

    return { ok: true, initPoint };
  } catch (err) {
    console.error("approvePetMiniatureAndPay falhou", err);
    return { ok: false, error: errorMessage(err) ?? "Erro inesperado ao gerar o pagamento." };
  }
}
