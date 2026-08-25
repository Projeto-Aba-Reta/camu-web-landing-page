/** Evento de venda confirmada, repassado a todos os canais de notificação. */
export type SaleEvent = {
  orderCode: string;
  customerName: string | null;
  totalCents: number;
  itemsSummary: string; // ex.: "Miniatura Pet Personalizada" ou "Leon P (×2)"
  kind: "pet_miniature" | "catalog";
  previewImageUrl?: string | null; // só pra encomendas de miniatura de pet
};

/** Um canal de notificação de venda plugável (e-mail, Slack, webhook…). */
export type SaleNotificationChannel = {
  name: string;
  send(event: SaleEvent): Promise<void>;
};
