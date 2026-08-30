# Banco de dados

O schema é **propriedade do ERP** `camu-web-admin` — não versione migrations aqui.
Este site (landing page) apenas **lê** o catálogo e **escreve** pedidos/leads no
mesmo projeto Supabase, sempre pelo servidor usando a service role.

- Tabelas relevantes (criadas no admin):
  - `products`, `product_media`, `product_channel_listings` — catálogo. O preço da
    loja do site vem do canal `loja_propria` (`product_channel_listings`).
  - `orders`, `order_items`, `order_events` — pedidos da loja (migration
    `20260722120000_pedidos_loja_e_canal_site.sql` no admin).
  - `custom_orders` — leads de encomenda personalizada.
  - `pet_miniature_requests` — encomendas de miniatura de pet gerada por IA (fotos,
    status, imagem gerada, `order_id`, `customer_email`). Schema de referência em
    `pet-miniature-schema.sql` — aplicar no admin, não é migration deste repo.
  - `customer_magic_tokens` — magic links de login do site (área `/conta`); o
    campo `customer_email` em `pet_miniature_requests` também entra aqui. Schema
    de referência em `customer-magic-auth-schema.sql` — aplicar no admin. A
    sessão do cliente é cookie assinado (HMAC), sem tabela.
- Storage:
  - bucket público `product-media` (fotos das peças, via `product_media.storage_path`).
  - bucket privado `pet-photos` (fotos originais enviadas pelo cliente, só service role lê).
  - bucket público `pet-media` (prévias geradas pela IA da miniatura de pet).

## Para um produto aparecer na loja do site

Precisa, no ERP, ter:
1. `products.status = 'ativo'`
2. um `product_channel_listings` com `channel = 'loja_propria'` e `is_active = true`
   (o `listed_price` é o preço cobrado no site).

## Dev

Para popular rápido o canal `loja_propria` a partir dos preços de Mercado Livre já
cadastrados (só para teste local), rode `dev-seed-loja-propria.sql` no SQL Editor.
