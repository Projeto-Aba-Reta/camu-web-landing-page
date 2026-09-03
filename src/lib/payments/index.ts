import "server-only";
import { activeGatewayId, type GatewayId, type PaymentGateway } from "./common";
import { mercadoPagoGateway } from "./mercadopago";
import { stripeGateway } from "./stripe";

export type {
  CheckoutSession,
  CreateCheckoutParams,
  GatewayId,
  PaymentGateway,
  PaymentItem,
  PaymentResult,
} from "./common";
export {
  activeGatewayId,
  orderConfirmedUrl,
  paymentBypassEnabled,
  siteUrl,
} from "./common";
export { mercadoPagoGateway } from "./mercadopago";
export { stripeGateway } from "./stripe";

const GATEWAYS: Record<GatewayId, PaymentGateway> = {
  mercadopago: mercadoPagoGateway,
  stripe: stripeGateway,
};

/** Gateway ativo, definido por `PAYMENT_GATEWAY` no .env. */
export function getPaymentGateway(): PaymentGateway {
  return GATEWAYS[activeGatewayId()];
}
