## Context

A home atual (`src/app/page.tsx`) renderiza `Hero → About → HowItWorks → Contact`. O carro-chefe (miniatura do pet, rota `/miniatura-pet` no route group `(store)`) não é citado. O hero (`src/components/Hero.tsx`) tem CTA para `#catalogo` (âncora inexistente) e copy dizendo "compra 100% pelos marketplaces". As duas navbars — `src/components/Navbar.tsx` (home) e `src/components/store/StoreNav.tsx` (loja) — escondem os links em `hidden md:flex` / `hidden lg:flex` sem hambúrguer, deixando o produto principal inacessível no mobile. `CatalogClient.tsx` só oferece "+ Carrinho". `data.ts` tem placeholders ("Cliente exemplo") e `CatalogClient` mostra `[foto produto]`.

Restrições: Next.js 16 App Router (checar `node_modules/next/dist/docs/` antes de assumir APIs), React 19, Tailwind v4 (tema em `globals.css` via `@theme inline`, sem `tailwind.config.js`), paleta fixa da marca, estilo Sticker Pop. `@vercel/analytics` já instalado. Todo acesso a banco é server-side com service role.

## Goals / Non-Goals

**Goals:**
- Reduzir a jornada home → formulário de intake para 1 clique.
- Colocar a miniatura do pet como oferta central da home (hero + bloco dedicado).
- Tornar toda a navegação acessível no mobile (hambúrguer nas duas navbars).
- Aumentar percepção de acabamento/confiança: prova social real, faixa de confiança, remoção de placeholders crus, hierarquia visual.
- Instrumentar o funil para medir conversão por etapa.
- Dar ao catálogo um caminho rápido de compra ("Comprar agora").

**Non-Goals:**
- Nenhuma mudança de schema no Supabase; prazo/frete estimado pode começar como conteúdo estático.
- Não redesenhar o checkout nem o fluxo de pagamento Mercado Pago.
- Não introduzir cores novas nem abandonar o estilo Sticker Pop.
- Não produzir as fotos reais de peças (conteúdo do usuário); até lá, usar ilustrações do Leon como fallback, claramente não-placeholder.
- Não construir dashboard de analytics — apenas emitir os eventos.

## Decisions

### 1. Home como página de conversão, não só institucional

Nova ordem em `page.tsx`: `Navbar → Hero(pet) → ProdutoPrincipal → FaixaConfianca → HowItWorks → ProvaSocial → About → FAQ → Contact → Footer → CTAFixaMobile`. Cada section continua sendo um componente próprio em `src/components/` (convenção do repo). `Hero.tsx` é reescrito para a oferta do pet; o conteúdo antigo do hero (institucional) é absorvido por `About`.

*Alternativa considerada:* criar uma landing separada `/miniatura-pet` como home. Rejeitado — perde o SEO/entrada institucional e duplica navegação; a home é o ponto de entrada do tráfego social.

### 2. Conteúdo estruturado em `data.ts`

Copy do hero, passos da miniatura, itens da faixa de confiança, FAQ, depoimentos e specs de prazo/frete vão para `src/lib/data.ts` (tipados), não hardcoded nos componentes. Depoimentos e galeria ficam como arrays possivelmente vazios; componentes retornam `null` quando vazios (nada de "Cliente exemplo"). Placeholders remanescentes ficam marcados com comentário `// substituir por conteúdo real`.

### 3. Menu mobile: um componente compartilhado

Criar `src/components/MobileMenu.tsx` (client component) reutilizado pelas duas navbars: botão hambúrguer + painel deslizante, `aria-expanded`, foco visível, fecha com Esc e no clique fora. `Navbar` e `StoreNav` passam sua lista de links como prop. `StoreNav` troca `hidden lg:flex` por `hidden md:flex` e usa `MobileMenu` abaixo de `md`; `Navbar` idem abaixo de `md`. Consolida "Loja"/"Ir pra loja" em um único CTA "Ir pra loja" + adiciona link "Miniatura do pet".

*Alternativa:* dois menus separados. Rejeitado — dobra manutenção e é a causa da inconsistência atual.

### 4. Barra de CTA fixa no mobile

`src/components/StickyCta.tsx` (client): `position: fixed; bottom: 0`, só renderiza `< md` (Tailwind `md:hidden`), respeita `env(safe-area-inset-bottom)`. Recebe `label` e `href`. Incluída na home e em `/miniatura-pet` (na página do produto, se o formulário estiver na viewport, faz scroll/focus em vez de navegar). Adiciona `padding-bottom` ao `main` no mobile para não cobrir o footer.

### 5. Catálogo: "Comprar agora"

`CatalogClient.tsx` ganha segundo botão que chama `addItem(...)` e então `router.push('/checkout')` (`useRouter` de `next/navigation`). Prazo/frete vêm de `data.ts` (constante) ou, se já existirem no tipo `Product` retornado por `getProducts()`, dali. Fallback de imagem: usar ilustração do Leon (`public/images/`) quando `image_url` ausente, em vez do texto `[foto produto]`.

### 6. Analytics: wrapper fino sobre `track()`

`src/lib/analytics.ts` exporta `trackFunnel(event, props?)` que chama `track()` do `@vercel/analytics` e centraliza os nomes de evento (`home_cta_miniatura`, `intake_iniciado`, `intake_enviado`, `previa_aprovada`, `previa_retentativa`, `checkout_iniciado`, `pedido_pago`). Client-side nos CTAs e no form; `pedido_pago` no server (webhook/reconciliação) via `track()` server-side do pacote. Nenhuma PII nas props — só origem, etapa e id de pedido/rascunho.

### 7. Hierarquia visual dentro do Sticker Pop

Sem cores novas. Regras: só o CTA primário do hero e o card do produto principal usam `sticker-shadow-lg`; sections de apoio usam borda fina ou fundo `offwhite-2` sem sombra. Faixa de confiança em `bg-teal` com contorno grosso. Adicionar utilitária de foco visível (`:focus-visible` outline coral 3px) global em `globals.css`. Ritmo vertical: alternar `py` entre sections e usar `bg-offwhite-2` para separar blocos em vez das linhas `border-charcoal/10` quase invisíveis.

## Risks / Trade-offs

- **Falta de fotos reais de peças** → usar ilustrações do Leon e depoimentos vazios (componente retorna `null`); marcar claramente o que falta. Sem inventar depoimento.
- **Reescrever `Hero.tsx` pode quebrar âncoras existentes** (`#top`, `#sobre` usados por links) → manter os `id` de section ao mover conteúdo; buscar por `href="#` em todo o repo antes de renomear.
- **Barra fixa no mobile cobre conteúdo** → padding-bottom no `main` + testar com o footer e o teclado virtual aberto no form.
- **`track()` server-side** pode exigir contexto de request no Next 16 → confirmar API em `node_modules/@vercel/analytics` e nos docs; se indisponível no webhook, registrar `pedido_pago` via `order_events` e derivar a métrica de lá.
- **Escopo grande num só change** → tasks.md agrupa em fases; as 3 primeiras fases (hero, nav mobile, âncora/copy) são as de maior retorno e podem ir sozinhas se necessário.
- **Regressão visual** → revisão manual em mobile e desktop antes do merge; `npm run build` roda typecheck + lint.

## Migration Plan

1. Fase 1 (P0): reescrever `Hero.tsx` para a oferta do pet, corrigir âncora `#catalogo`, atualizar copy em `Hero`/`data.ts`, adicionar link "Miniatura do pet" e consolidar CTA na `Navbar`.
2. Fase 2 (P0): `ProdutoPrincipal` section + inserir em `page.tsx`.
3. Fase 3 (P1): `MobileMenu` compartilhado nas duas navbars; breakpoint da loja para `md`.
4. Fase 4 (P1): `StickyCta` na home e em `/miniatura-pet`; reordenar `/miniatura-pet` no mobile.
5. Fase 5 (P1): "Comprar agora" + prazo/frete + fallback de imagem no catálogo.
6. Fase 6 (P2): `ProvaSocial`, `FaixaConfianca`, `FAQ`, corrigir link do `About`, hierarquia visual em `globals.css`.
7. Fase 7 (P2): `analytics.ts` + instrumentação dos eventos.

Rollback: cada fase é um commit isolado; reverter o commit restaura o comportamento anterior (a home antiga fica recuperável via git).

## Open Questions

- Prazo de produção e política de frete: valores reais para exibir? (assumir "pronto em ~7 dias úteis" e "frete calculado no checkout" até confirmação)
- Preço inicial da miniatura do pet para o "a partir de R$ X" no hero.
- Já existem fotos de peças entregues / depoimentos reais para a galeria?
- `pet_miniature_requests` tem um estado consultável de "prévia aprovada" para disparar o evento client-side, ou isso vem só de `/conta`?
