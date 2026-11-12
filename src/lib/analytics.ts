import { track } from "@vercel/analytics";
import { sendGAEvent } from "@next/third-parties/google";
import posthog from "posthog-js";
import { readAbPetVariantFromBrowser } from "@/lib/ab-pet";
import { logFirebaseEvent, setFirebaseUserProperties } from "@/lib/firebase";

/**
 * Eventos do funil da miniatura do pet (home → pedido pago), cobrindo tanto o
 * fluxo normal (prévia antes de pagar) quanto o expressa (paga primeiro, manda
 * fotos depois).
 * Nunca passar PII (e-mail, telefone, nome) nas props — só origem, etapa e ids.
 */
export type FunnelEvent =
  | "home_cta_miniatura"
  | "intake_iniciado"
  | "intake_enviado"
  | "previa_pronta"
  | "previa_aprovada"
  | "previa_adicionada_carrinho"
  | "previa_retentativa"
  | "checkout_iniciado"
  | "express_fotos_enviadas"
  | "express_previa_pronta"
  | "pedido_pago"
  | "login_link_solicitado"
  | "conta_visualizada"
  | "conta_fotos_pendentes_click";

type Props = Record<string, string | number | boolean>;

/**
 * PostHog event names mirroring the funnel events above.
 * Captured alongside Vercel Analytics e Google Analytics (GA4) so as três
 * ferramentas vejam as mesmas ações.
 */
const POSTHOG_EVENT_MAP: Record<FunnelEvent, string> = {
  home_cta_miniatura: "home_cta_clicked",
  intake_iniciado: "intake_started",
  intake_enviado: "intake_submitted",
  previa_pronta: "preview_ready",
  previa_aprovada: "preview_approved",
  previa_adicionada_carrinho: "preview_added_to_cart",
  previa_retentativa: "preview_retry_requested",
  checkout_iniciado: "checkout_started",
  express_fotos_enviadas: "express_photos_uploaded",
  express_previa_pronta: "express_preview_ready",
  pedido_pago: "payment_completed",
  login_link_solicitado: "login_link_requested",
  conta_visualizada: "account_viewed",
  conta_fotos_pendentes_click: "account_pending_photos_clicked",
};

/** Client-side. Best-effort: nunca lança. */
export function trackFunnel(event: FunnelEvent, props?: Props): void {
  try {
    track(event, props);
  } catch {
    // analytics é best-effort
  }
  try {
    posthog.capture(POSTHOG_EVENT_MAP[event], props);
  } catch {
    // analytics é best-effort
  }
  try {
    sendGAEvent("event", event, props ?? {});
  } catch {
    // analytics é best-effort
  }
  try {
    // Firebase Analytics (metas do A/B Testing de /miniatura-pet). Manda o evento
    // do funil com a variante e, quando existe, o equivalente padrão do GA4
    // (purchase com receita em BRL, begin_checkout, generate_lead).
    const variant = readAbPetVariantFromBrowser();
    const params: Props = variant ? { ...props, ab_variant: variant } : { ...props };
    if (variant) void setFirebaseUserProperties({ ab_miniatura_pet: variant });
    void logFirebaseEvent(event, params);

    const standard = FIREBASE_STANDARD_EVENT[event];
    if (standard) {
      const extra: Props = {};
      if (event === "pedido_pago" && typeof props?.total_cents === "number") {
        extra.value = props.total_cents / 100;
        extra.currency = "BRL";
        if (typeof props.pedido === "string") extra.transaction_id = props.pedido;
      }
      void logFirebaseEvent(standard, { ...params, ...extra });
    }
  } catch {
    // analytics é best-effort
  }
}

/** Eventos padrão do GA4/Firebase que espelham o funil (receita, checkout, lead). */
const FIREBASE_STANDARD_EVENT: Partial<Record<FunnelEvent, string>> = {
  pedido_pago: "purchase",
  checkout_iniciado: "begin_checkout",
  intake_enviado: "generate_lead",
};
