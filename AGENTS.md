# camu-web-landing-page

Site da Camu (impressão 3D sob medida). Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4. Além da home institucional, o site tem **loja própria** (fluxo de compra: catálogo → produto → carrinho → checkout → confirmação → acompanhamento) com backend em **Supabase** e pagamento **Mercado Pago** (Pix + cartão via Checkout Pro). Os marketplaces (Mercado Livre, Shopee, Elo7, Etsy) seguem como canal adicional. Ver `README.md` para stack, estrutura de pastas, variáveis de ambiente e conteúdo placeholder pendente.

## Regras da marca (não violar)

- Paleta fixa: teal `#0FBFA0`, coral `#FF6B4A`, charcoal `#1B1F1E`, off-white `#FAF7F2`. Não introduzir cores fora dela (variações de tom via opacity/hover são ok).
- Direção visual: *Sticker Pop* — contornos grossos (`border-charcoal`, geralmente 3px), sombras `.sticker-shadow*` (definidas em `globals.css`), cantos bem arredondados. Não usar 3D realista, fotorrealismo ou pixel art no mascote (Leon).
- Fontes: `font-heading` (Baloo 2) para títulos, `font-sans`/padrão (Space Grotesk) para corpo — já configuradas em `layout.tsx`, não trocar sem necessidade.
- Conteúdo do site é em português (pt-BR).

## Convenções deste repo

- Tailwind v4: tema fica em `src/app/globals.css` via `@theme inline` — não existe `tailwind.config.js`, não criar um.
- Uma section = um componente em `src/components/`, importado e ordenado em `src/app/page.tsx`.
- Conteúdo estruturado (produtos, passos, marketplaces, depoimentos, links) fica em `src/lib/data.ts`, não hardcoded nos componentes.
- Dados/placeholders ainda não finais devem continuar claramente marcados (texto tipo `[foto produto]`, comentário "substituir por depoimentos reais") até o usuário fornecer o conteúdo real.
- Assets do Leon (mascote) ficam em `public/images/`; foram extraídos do projeto Claude Design linkado no README — se precisar de mais variações, puxar de lá em vez de gerar novas ilustrações do zero.

## Loja / backend

- **O schema do banco é do ERP `camu-web-admin`** (mesmo projeto Supabase) — não versione migrations aqui. Este repo só lê catálogo e escreve pedidos/leads. Tabelas de pedido (`orders`, `order_items`, `order_events`, `custom_orders`) e o canal `loja_propria` foram criados na migration `20260722120000_pedidos_loja_e_canal_site.sql` **do admin**. Mudou schema? A migration vai no admin. Ver `supabase/README.md`.
- As telas da loja ficam no route group `src/app/(store)/` (não afeta a URL) e compartilham `StoreNav` + `Footer` via `(store)/layout.tsx`. Rotas: `/loja`, `/loja/[id]`, `/carrinho`, `/checkout`, `/pedido/[code]`, `/pedido/confirmado/[code]`, `/encomenda`. Produto é identificado por **uuid** (`products.id`) — não há slug no catálogo.
- **Preço da loja** = `product_channel_listings.listed_price` do canal `loja_propria` (is_active). Só aparece na loja produto `ativo` com esse listing. **Imagem** = capa (`product_media.is_cover`) no bucket público `product-media` do Storage.
- **Todo acesso ao banco é no servidor** com a service role (`src/lib/supabase/server.ts`, `server-only`) — ela ignora a RLS por role do ERP. Nunca importar esse client em Client Component nem expor `SUPABASE_SERVICE_ROLE_KEY`.
- Camada de dados em `src/lib/store.ts`; server actions em `src/app/actions/`. **Preços são sempre recalculados a partir do canal `loja_propria`** no servidor — nunca confiar no valor que o client manda.
- Carrinho é client-side (`src/lib/cart-context.tsx`, localStorage, chaveado por `productId`) — não há login. Dinheiro em centavos (inteiro); formatar com `formatBRL` (`src/lib/money.ts`).
- Pagamento é Mercado Pago Checkout Pro (`src/lib/mercadopago.ts`): cria preferência → redireciona. Webhook em `src/app/api/webhooks/mercadopago/route.ts`; a página de confirmação também reconcilia por `external_reference` (cobre localhost).
- Segredos ficam em `.env.local` (ver `.env.example`); os 3 valores de Supabase são os **mesmos** do `camu-web-admin`. Nunca commitar chaves.

## Comandos

```bash
npm run dev     # dev server (Turbopack)
npm run build   # build de produção (roda typecheck + lint)
npm run lint
```

## Convenção de commit

Todo commit segue o padrão `Tipo({package}): {message}`, por exemplo:

```
Feat(camu-web-landing-page): implementa a home institucional
Fix(camu-web-landing-page): corrige contraste do CTA no hero
Docs(camu-web-landing-page): atualiza README com instruções de deploy
Chore(camu-web-landing-page): renomeia pacote
```

Tipos comuns: `Feat`, `Fix`, `Docs`, `Chore`, `Refactor`, `Style`, `Test`. O escopo entre parênteses é o nome do pacote/repo (`camu-web-landing-page`).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
