import { track } from "@vercel/analytics";
import posthog from "posthog-js";

/**
 * Eventos do funil da miniatura do pet (home → pedido pago).
 * Nunca passar PII (e-mail, telefone, nome) nas props — só origem, etapa e ids.
 */
export type FunnelEvent =
  | "home_cta_miniatura"
  | "intake_iniciado"
  | "intake_enviado"
  | "previa_aprovada"
  | "previa_retentativa"
  | "checkout_iniciado"
  | "pedido_pago";

type Props = Record<string, string | number | boolean>;

/**
 * PostHog event names mirroring the funnel events above.
 * Captured alongside Vercel Analytics so both tools see the same actions.
 */
const POSTHOG_EVENT_MAP: Record<FunnelEvent, string> = {
  home_cta_miniatura: "home_cta_clicked",
  intake_iniciado: "intake_started",
  intake_enviado: "intake_submitted",
  previa_aprovada: "preview_approved",
  previa_retentativa: "preview_retry_requested",
  checkout_iniciado: "checkout_started",
  pedido_pago: "payment_completed",
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
}
