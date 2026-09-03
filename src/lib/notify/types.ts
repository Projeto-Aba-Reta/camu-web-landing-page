/** Item vendido, já com os valores em centavos. */
export type SaleEventItem = {
  name: string;
  variant: string | null;
  qty: number;
  unitPriceCents: number;
};

/** Evento de venda confirmada, repassado a todos os canais de notificação.
 *  Carrega todos os dados coletados do cliente para o time atender o pedido
 *  sem precisar abrir o ERP. */
export type SaleEvent = {
  orderCode: string;
  kind: "pet_miniature" | "catalog";
  createdAt: string | null;
  paymentMethod: string | null;
  paymentStatus: string;

  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };

  /** Endereço de entrega informado no checkout. */
  shippingAddress: {
    line: string | null; // rua, número, complemento
    city: string | null;
    uf: string | null;
    cep: string | null;
  };

  items: SaleEventItem[];
  itemsSummary: string; // ex.: "Leon P (×2), Chaveiro Camu"
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;

  previewImageUrl?: string | null; // só pra encomendas de miniatura de pet
  petMiniature?: {
    requestId: string;
    selectedVariant: string | null;
    photoCount: number;
  } | null;
};

/** Um canal de notificação de venda plugável (e-mail, Slack, webhook…). */
export type SaleNotificationChannel = {
  name: string;
  send(event: SaleEvent): Promise<void>;
};
