import { track } from "@vercel/analytics";

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

/** Client-side. Best-effort: nunca lança. */
export function trackFunnel(event: FunnelEvent, props?: Props): void {
  try {
    track(event, props);
  } catch {
    // analytics é best-effort
  }
}
