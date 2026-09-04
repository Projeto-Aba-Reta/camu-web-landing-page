"use server";

import { after } from "next/server";
import { getPaymentGateway, paymentBypassEnabled, orderConfirmedUrl } from "@/lib/payments";
import { runPetMiniatureGeneration, retryPetMiniatureGeneration } from "@/lib/pet-miniature-pipeline";
import {
  attachPhotosToRequest,
  createExpressPetMiniatureRequests,
  createPetMiniatureRequest,
  getPetMiniatureRequest,
  getPetMiniatureRequestsByOrderId,
  linkOrder,
  publicMediaUrl,
  setSelectedVariant,
  validatePhotos,
  type IncomingPhoto,
} from "@/lib/pet-miniature";
import {
  applyPaymentStatus,
  createOrder,
  getOrderByCode,
  getPetMiniaturePricing,
  setOrderPreference,
} from "@/lib/store";
import { isValidEmail } from "@/lib/auth/session";
import { isValidPhone } from "@/lib/contact";
import { computePetCartPricing } from "@/lib/pet-miniature-cart-pricing";
import type { PetMiniatureRequest, PetMiniatureVariant } from "@/lib/types";
import { getPostHogClient } from "@/lib/posthog-server";

export type PetMiniatureIntakeResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

/** Cria a encomenda a partir do formulário (nome, WhatsApp, 3–4 fotos) e
 *  dispara a geração da prévia em background — a resposta ao cliente não
 *  espera o pipeline de IA terminar. */
export async function submitPetMiniatureIntake(formData: FormData): Promise<PetMiniatureIntakeResult> {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  // Pet 2+: reaproveita nome/WhatsApp/e-mail da 1ª encomenda do carrinho — o
  // cliente só manda as fotos do próximo pet.
  const fromRequestId = String(formData.get("fromRequestId") ?? "").trim();
  let name: string;
  let phone: string;
  let email: string;

  if (fromRequestId) {
    const base = await getPetMiniatureRequest(fromRequestId);
    if (!base) {
      return { ok: false, error: "Não achamos a encomenda anterior — recomece informando seus dados." };
    }
    name = base.customer_name;
    phone = base.customer_phone;
    email = (base.customer_email ?? "").trim().toLowerCase();
  } else {
    name = String(formData.get("name") ?? "").trim();
    phone = String(formData.get("phone") ?? "").trim();
    email = String(formData.get("email") ?? "").trim().toLowerCase();
  }

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

export type PetMiniatureCartItem = {
  requestId: string;
  variant: PetMiniatureVariant;
};

/** Aprova um carrinho de miniaturas (uma ou várias, uma por pet), grava a
 *  variante escolhida de cada uma, aplica a promoção "leve 2" e cria **um**
 *  pedido com todos os itens + preferência de pagamento. Os preços vêm sempre
 *  dos listings do canal `loja_propria` — o desconto é recalculado aqui, nunca
 *  confiando no que o client mandou. */
export async function approvePetMiniatureCartAndPay(
  cartItems: PetMiniatureCartItem[],
  address: PetMiniatureAddress,
): Promise<PetMiniatureApprovalResult> {
  // Dedup por encomenda (a última variante escolhida vence).
  const byRequest = new Map<string, PetMiniatureVariant>();
  for (const it of cartItems ?? []) {
    if (it?.requestId && (it.variant === "sem_pintura" || it.variant === "com_pintura")) {
      byRequest.set(it.requestId, it.variant);
    }
  }
  const entries = [...byRequest.entries()];
  if (entries.length === 0) {
    return { ok: false, error: "Seu carrinho de miniaturas está vazio." };
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

  for (const variant of entries.map(([, v]) => v)) {
    if (!PRODUCT_ID_BY_VARIANT[variant]) {
      return { ok: false, error: "Produto de miniatura de pet ainda não está configurado." };
    }
  }

  // Carrega e valida cada encomenda.
  const requests = await Promise.all(entries.map(([id]) => getPetMiniatureRequest(id)));
  const loaded: { id: string; variant: PetMiniatureVariant; request: PetMiniatureRequest }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const [id, variant] = entries[i];
    const request = requests[i];
    if (!request) return { ok: false, error: "Uma das encomendas não foi encontrada." };
    if (request.status !== "pronto") {
      return { ok: false, error: "Uma das prévias ainda não está pronta pra aprovação." };
    }
    if (request.order_id) {
      return { ok: false, error: "Uma das miniaturas já foi comprada — remova-a do carrinho." };
    }
    loaded.push({ id, variant, request });
  }

  // Preço de cada variante vem do canal loja_propria.
  const pricing = await getPetMiniaturePricing();
  const priceOf = (v: PetMiniatureVariant) =>
    v === "com_pintura" ? pricing.comPinturaCents : pricing.semPinturaCents;
  if (loaded.some((l) => priceOf(l.variant) == null)) {
    return { ok: false, error: "Preço da miniatura indisponível no momento. Tente de novo em instantes." };
  }

  // Promoção "leve 2": recalculada no servidor a partir dos preços reais.
  const cartPricing = computePetCartPricing(
    loaded.map((l) => ({ key: l.id, unitPriceCents: priceOf(l.variant) as number })),
  );
  const netByKey = new Map(cartPricing.lines.map((l) => [l.key, l.netPriceCents]));

  // Identidade do pedido: a primeira encomenda do carrinho.
  const primary = loaded[0].request;
  const email = (primary.customer_email || address?.email || "").trim();

  try {
    await Promise.all(loaded.map((l) => setSelectedVariant(l.id, l.variant)));

    const { order } = await createOrder({
      items: loaded.map((l) => ({
        productId: PRODUCT_ID_BY_VARIANT[l.variant] as string,
        variant: VARIANT_LABEL[l.variant],
        qty: 1,
      })),
      discountCents: cartPricing.discountCents,
      customer: {
        name: primary.customer_name,
        email,
        phone: primary.customer_phone,
        cep,
        line,
        city,
        uf,
      },
    });

    // Dev: pula o gateway e marca como pago na hora.
    if (paymentBypassEnabled()) {
      await Promise.all(loaded.map((l) => linkOrder(l.id, order.id)));
      await applyPaymentStatus(order.order_code, "approved", null);
      return { ok: true, initPoint: orderConfirmedUrl(order.order_code) };
    }

    // Itens do checkout com o preço LÍQUIDO (já com desconto) — o gateway não
    // recebe um total à parte, então a soma das linhas precisa fechar com o
    // total do pedido.
    const { sessionId, initPoint } = await getPaymentGateway().createCheckout({
      orderCode: order.order_code,
      items: loaded.map((l) => ({
        title: `Miniatura do seu pet — ${VARIANT_LABEL[l.variant]}`,
        quantity: 1,
        unit_price: (netByKey.get(l.id) ?? (priceOf(l.variant) as number)) / 100,
      })),
      shippingReais: order.shipping_cents / 100,
      payer: email ? { name: primary.customer_name, email } : undefined,
    });

    await setOrderPreference(order.id, sessionId);
    await Promise.all(loaded.map((l) => linkOrder(l.id, order.id)));

    return { ok: true, initPoint };
  } catch (err) {
    console.error("approvePetMiniatureCartAndPay falhou", err);
    return { ok: false, error: errorMessage(err) ?? "Erro inesperado ao gerar o pagamento." };
  }
}

// ---------------------------------------------------------------------------
// Fluxo "expressa": paga primeiro, manda as fotos depois. Sem prévia de IA,
// sem nome, sem telefone — só e-mail. A tela é acessada só por URL
// (/miniatura-pet/expressa).
// ---------------------------------------------------------------------------

const MAX_EXPRESS_PETS = 6;

export type ExpressPetMiniatureInput = {
  variant: PetMiniatureVariant;
  quantity: number;
  email: string;
  address: PetMiniatureAddress;
};

/** Cria o pedido da miniatura (uma ou várias, mesma variante), aplica a
 *  promoção "leve 2" e devolve a URL de pagamento. As encomendas nascem sem
 *  fotos — o cliente envia depois em /miniatura-pet/expressa/fotos/[code]. */
export async function createExpressPetMiniatureOrderAndPay(
  input: ExpressPetMiniatureInput,
): Promise<PetMiniatureApprovalResult> {
  const variant = input?.variant;
  if (variant !== "sem_pintura" && variant !== "com_pintura") {
    return { ok: false, error: "Escolha a versão da miniatura (com ou sem pintura)." };
  }

  const quantity = Math.floor(Number(input?.quantity));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_EXPRESS_PETS) {
    return { ok: false, error: `Informe de 1 a ${MAX_EXPRESS_PETS} pets.` };
  }

  const email = String(input?.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, error: "Digite um e-mail válido — é por ele que você manda as fotos e acompanha o pedido." };
  }

  const cep = (input?.address?.cep ?? "").trim();
  if (!CEP_RE.test(cep)) {
    return { ok: false, error: "Informe um CEP válido (formato 00000-000) para a entrega." };
  }
  const line = (input?.address?.line ?? "").trim();
  const city = (input?.address?.city ?? "").trim();
  const uf = (input?.address?.uf ?? "").trim();
  if (!line || !city || !uf) {
    return { ok: false, error: "Endereço de entrega incompleto — nenhum campo pode ficar vazio." };
  }

  const productId = PRODUCT_ID_BY_VARIANT[variant];
  if (!productId) {
    return { ok: false, error: "Produto de miniatura de pet ainda não está configurado." };
  }

  const pricing = await getPetMiniaturePricing();
  const unitPriceCents =
    variant === "com_pintura" ? pricing.comPinturaCents : pricing.semPinturaCents;
  if (unitPriceCents == null) {
    return { ok: false, error: "Preço da miniatura indisponível no momento. Tente de novo em instantes." };
  }

  // Promoção "leve 2" — recalculada no servidor a partir do preço real.
  const cartPricing = computePetCartPricing(
    Array.from({ length: quantity }, (_, i) => ({ key: String(i), unitPriceCents })),
  );

  try {
    const { order } = await createOrder({
      items: [{ productId, variant: VARIANT_LABEL[variant], qty: quantity }],
      discountCents: cartPricing.discountCents,
      customer: { name: "", email, phone: "", cep, line, city, uf },
    });

    await createExpressPetMiniatureRequests({
      email,
      variant,
      orderId: order.id,
      count: quantity,
    });

    if (paymentBypassEnabled()) {
      await applyPaymentStatus(order.order_code, "approved", null);
      return { ok: true, initPoint: orderConfirmedUrl(order.order_code) };
    }

    const { sessionId, initPoint } = await getPaymentGateway().createCheckout({
      orderCode: order.order_code,
      items: cartPricing.lines.map((l, i) => ({
        title: `Miniatura do seu pet — ${VARIANT_LABEL[variant]}${quantity > 1 ? ` (${i + 1}/${quantity})` : ""}`,
        quantity: 1,
        unit_price: l.netPriceCents / 100,
      })),
      shippingReais: order.shipping_cents / 100,
      payer: { email },
    });

    await setOrderPreference(order.id, sessionId);
    return { ok: true, initPoint };
  } catch (err) {
    console.error("createExpressPetMiniatureOrderAndPay falhou", err);
    return { ok: false, error: errorMessage(err) ?? "Erro inesperado ao gerar o pagamento." };
  }
}

export type ExpressPetPhotosResult = { ok: true } | { ok: false; error: string };

/** Recebe as fotos de um pet (fluxo expressa, pós-pagamento). Identifica a
 *  encomenda pelo par (código do pedido + índice) pra não expor o uuid. */
export async function uploadExpressPetPhotos(
  orderCode: string,
  petIndex: number,
  formData: FormData,
): Promise<ExpressPetPhotosResult> {
  const data = await getOrderByCode(String(orderCode ?? "").trim());
  if (!data) return { ok: false, error: "Pedido não encontrado." };

  const requests = await getPetMiniatureRequestsByOrderId(data.order.id);
  const request = requests[Math.floor(Number(petIndex))];
  if (!request) return { ok: false, error: "Não encontramos esse pet no pedido." };
  if (request.photo_paths.length > 0) {
    return { ok: false, error: "As fotos deste pet já foram enviadas." };
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photos: IncomingPhoto[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push({ name: file.name, type: file.type, buffer });
  }

  const validationError = validatePhotos(photos);
  if (validationError) return { ok: false, error: validationError };

  try {
    await attachPhotosToRequest(request.id, photos);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Não foi possível enviar as fotos." };
  }
}
