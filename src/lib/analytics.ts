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
  | "conta_fotos_pendentes_click"
  | "erro_fluxo";

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
  erro_fluxo: "error_occurred",
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
      if (event === "erro_fluxo") {
        extra.description = String(props?.mensagem ?? "");
        extra.fatal = false;
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
  erro_fluxo: "exception",
};

const recentErrors = new Map<string, number>();

/** Tira e-mails, telefones/números longos e query strings de URL; limita o tamanho. */
function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\d[\d\s().-]{7,}\d/g, "[num]")
    .replace(/(https?:\/\/[^\s?]+)\?\S*/g, "$1")
    .slice(0, 150);
}

/**
 * Registra um erro (validação, falha de action, exceção de render/JS) em todas as
 * ferramentas. `origem` identifica onde ocorreu (ex.: "intake_miniatura").
 * Deduplica o mesmo erro em 2s. Best-effort: nunca lança, sem PII.
 */
export function trackError(origem: string, message: string, props?: Props): void {
  try {
    const mensagem = sanitizeErrorMessage(message || "erro desconhecido");
    const key = `${origem}|${mensagem}`;
    const now = Date.now();
    const last = recentErrors.get(key);
    if (last && now - last < 2000) return;
    recentErrors.set(key, now);
    const pagina = typeof window !== "undefined" ? window.location.pathname : "";
    trackFunnel("erro_fluxo", { origem, mensagem, pagina, ...props });
  } catch {
    // analytics é best-effort
  }
}
