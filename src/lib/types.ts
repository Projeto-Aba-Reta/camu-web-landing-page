/** Produto como a loja do site enxerga — derivado do catálogo do ERP:
 *  preço vem do listing `loja_propria`; imagem, da capa em `product_media`. */
export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string; // miniatura_colecionavel | personalizado | utilitario | linha_leon
  size_tier: string | null; // P | M | G | ...
  price_cents: number;
  image_url: string | null;
};

/** Item como vive no carrinho do cliente (localStorage). Sem preço confiável —
 *  o servidor sempre recalcula a partir do banco. */
export type CartItem = {
  productId: string;
  name: string;
  variant: string;
  qty: number;
  price_cents: number; // só pra exibição no client; nunca usado pra cobrar
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "in_production"
  | "finishing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  order_code: string;
  status: OrderStatus;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  address_cep: string | null;
  address_line: string | null;
  address_city: string | null;
  address_uf: string | null;
  payment_method: string | null;
  payment_status: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  product_name: string;
  variant: string | null;
  unit_price_cents: number;
  qty: number;
};

/** Status do processamento de uma encomenda de miniatura de pet gerada por IA. */
export type PetMiniatureStatus = "processando" | "pronto" | "falhou";

/** Variante escolhida pelo cliente na aprovação — cada uma com seu próprio
 *  produto/preço no catálogo (canal loja_propria). */
export type PetMiniatureVariant = "sem_pintura" | "com_pintura";

/** Encomenda de miniatura de pet — fotos do cliente, as duas prévias geradas
 *  por IA (pintada e sem pintura) e, depois de aprovada, a variante escolhida
 *  e o pedido de pagamento vinculado (order_id). */
export type PetMiniatureRequest = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  photo_paths: string[]; // caminhos no bucket privado
  status: PetMiniatureStatus;
  generated_image_painted_path: string | null; // caminho no bucket público
  generated_image_plain_path: string | null; // caminho no bucket público
  selected_variant: PetMiniatureVariant | null;
  ai_error: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
};
