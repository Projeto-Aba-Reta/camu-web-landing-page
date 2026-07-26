# camu-web-landing-page

Site da **Camu**, empresa brasileira de impressão 3D sob medida, servido em `www.camu.com.br`. Tem a home institucional **e uma loja própria** com fluxo de compra completo (catálogo → produto → carrinho → checkout → confirmação → acompanhamento), backend em **Supabase** e pagamento via **Mercado Pago** (Pix + cartão). Os marketplaces (Mercado Livre, Shopee, Elo7, Etsy) continuam como canal de venda adicional. Encomendas personalizadas (sob medida) têm um fluxo próprio que termina no WhatsApp.

## Sobre a marca

- **Mascote:** Leon, um camaleão que "se transforma no que você precisar" — metáfora da personalização via impressão 3D.
- **Público:** fãs de cultura pop/geek, colecionadores, entusiastas de impressão 3D.
- **Tom de voz:** leve, próximo, com humor sutil — nunca corporativo.
- **Direção visual atual:** *Sticker Pop* — fundo claro, contornos grossos, sombras "flat" tipo adesivo colecionável, cantos bem arredondados.

**Paleta:**

| Cor | Hex | Uso |
|---|---|---|
| Teal | `#0FBFA0` | primária |
| Coral | `#FF6B4A` | destaque / CTA |
| Charcoal | `#1B1F1E` | texto / fundo escuro |
| Off-white | `#FAF7F2` | fundo claro |

**Tipografia:** Baloo 2 (títulos, `font-heading`) + Space Grotesk (corpo/UI, `font-sans`), via `next/font/google`.

O design de origem (todas as opções de estilo exploradas) vive no projeto Claude Design [`CAMU institutional site prompt`](https://claude.ai/design/p/f7e62e8a-3f40-4861-b0fa-dc83483b08b7); o spec completo usado para gerar este projeto está em `uploads/prompt-site-institucional-camu.md` desse mesmo projeto.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (tema via `@theme` em `src/app/globals.css`, sem `tailwind.config.js`)
- `next/image` para otimização de imagens, `next/font` para as fontes
- [Supabase](https://supabase.com) (Postgres) para catálogo, pedidos e leads
- [Mercado Pago](https://www.mercadopago.com.br/developers) Checkout Pro para pagamento (Pix + cartão)

## Estrutura

```
src/
  app/
    layout.tsx        metadata, Open Graph, JSON-LD, fontes, <CartProvider>
    page.tsx          monta a home a partir das sections
    globals.css       tema Tailwind (cores, sombras "sticker")
    sitemap.ts / robots.ts
    (store)/          route group da loja (não afeta a URL) — layout com
                      StoreNav + Footer. Telas: loja, loja/[id], carrinho,
                      checkout, pedido/[code], pedido/confirmado/[code], encomenda
    actions/          server actions (orders.ts, custom-orders.ts)
    api/webhooks/mercadopago/route.ts   webhook de pagamento
  components/
    (home)            uma section por arquivo (Navbar, Hero, About, Catalog, …)
    store/            componentes da loja (StoreNav, CatalogClient, CartView,
                      CheckoutForm, ProductPurchase, OrderTimeline, CustomOrderForm)
  lib/
    data.ts           conteúdo estruturado da home (placeholder, ver abaixo)
    supabase/server.ts  client service-role (server-only)
    store.ts          camada de dados da loja (produtos, pedidos)
    mercadopago.ts    integração Mercado Pago
    cart-context.tsx  carrinho client-side (localStorage)
    money.ts / status.ts / types.ts
supabase/                 schema NÃO mora aqui — é do ERP camu-web-admin.
  README.md                o que este site lê/escreve no banco compartilhado
  dev-seed-loja-propria.sql  (opcional) popula o canal loja_propria pra testar
public/images/           assets do Leon (mascote)
```

> **Banco compartilhado:** este site usa o **mesmo** projeto Supabase do ERP
> [`camu-web-admin`](../camu-web-admin), que é dono do schema (catálogo, storage,
> e as tabelas de pedido criadas na migration `20260722120000_pedidos_loja_e_canal_site.sql`).
> Aqui a gente só **lê** catálogo e **escreve** pedidos/leads, sempre pelo servidor.

## Configuração (Supabase + Mercado Pago)

1. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — **os mesmos** do `camu-web-admin/.env.local` (é o mesmo projeto).
   - `MP_ACCESS_TOKEN` (Mercado Pago → suas credenciais; use o de **teste** em dev pra não gerar cobrança real).
   - `NEXT_PUBLIC_SITE_URL` (ex.: `http://localhost:3000` em dev; o domínio em produção).
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` (só dígitos, com DDI+DDD).
2. **Aplique a migration de pedidos no banco** (no repo `camu-web-admin`): `supabase db push`, ou cole `supabase/migrations/20260722120000_pedidos_loja_e_canal_site.sql` no SQL Editor. Ela cria `orders`/`order_items`/`order_events`/`custom_orders` e adiciona o canal `loja_propria`.
3. **Publique produtos na loja:** cada peça precisa estar `ativa` e ter um `product_channel_listings` com `channel = 'loja_propria'` e `is_active = true` (o preço do site é o `listed_price`). Para testar rápido em dev, rode `supabase/dev-seed-loja-propria.sql`.
4. Em produção, cadastre a **notification_url** no painel do Mercado Pago apontando para `{SITE_URL}/api/webhooks/mercadopago`. Em localhost o webhook não é alcançável, mas a página de confirmação reconcilia o pagamento sozinha.

> Segurança: toda escrita no banco acontece no servidor com a service role (que ignora a RLS por role do ERP). Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` nem `MP_ACCESS_TOKEN` no browser.

## Conteúdo placeholder

Estes pontos usam dados de exemplo e precisam ser substituídos com conteúdo real antes de publicar:

- Fotos de produto e foto da equipe/oficina (hoje: blocos com textura diagonal). Na loja, cada produto tem `image_url` no Supabase — enquanto for `null`, aparece o tile placeholder `[foto produto]`.
- Catálogo da loja: os produtos e preços vêm do ERP (`camu-web-admin`); publique via canal `loja_propria` (ver "Configuração" acima).
- Depoimentos em `src/lib/data.ts` (`testimonials`)
- Links de redes sociais e marketplaces em `src/lib/data.ts` (`socialLinks`, `marketplaces`, `products`)
- CNPJ no footer (`src/components/Footer.tsx`)
- Domínio em `src/app/layout.tsx` (`siteUrl`) e `src/app/sitemap.ts` / `robots.ts` — hoje apontam para `https://camu.com.br`, ajustar para o domínio final

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de produção
npm run start   # roda o build de produção
npm run lint     # eslint
```

## Deploy

Frontend estático/SSR simples — compatível com Vercel (recomendado, mesma equipe do Next.js) ou qualquer host com suporte a Node.js. Alvo: `www.camu.com.br`.
