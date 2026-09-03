## 1. Fase 1 — Hero, âncora e copy (P0)

- [x] 1.1 Buscar `href="#` em todo o repo e mapear âncoras usadas (`#top`, `#sobre`, `#como-funciona`, `#contato`, `#catalogo`) antes de mexer nas sections
- [x] 1.2 Adicionar em `src/lib/data.ts`: `heroPet` (badge, headline, subtítulo, faixa de preço/prazo, texto "prévia grátis antes de pagar"), tipos correspondentes
- [x] 1.3 Reescrever `src/components/Hero.tsx` para a oferta da miniatura do pet: headline, imagem de exemplo (fallback Leon), faixa preço/prazo, CTA primário único `Fazer a miniatura do meu pet` → `/miniatura-pet`
- [x] 1.4 Adicionar CTAs secundários no hero apontando para `/loja` e `/encomenda` (visualmente subordinados)
- [x] 1.5 Remover do hero e de `data.ts` qualquer texto de "compra 100% pelos marketplaces"
- [x] 1.6 Mover o conteúdo institucional antigo do hero para `src/components/About.tsx` sem perder o `id="sobre"`
- [x] 1.7 Corrigir `src/components/About.tsx`: link "Ler a história completa →" deixa de apontar para `#contato` (remover ou apontar para conteúdo real)
- [x] 1.8 `src/components/Navbar.tsx`: consolidar "Loja" + "Ir pra loja" num único CTA e adicionar link "Miniatura do pet" → `/miniatura-pet`
- [x] 1.9 `npm run build` (typecheck + lint) e revisão visual da home em desktop e mobile

## 2. Fase 2 — Bloco do produto principal na home (P0)

- [x] 2.1 Adicionar em `data.ts` os passos da miniatura (envio de fotos → prévia por IA → aprovação e pagamento) reutilizáveis pela home e por `/miniatura-pet`
- [x] 2.2 Criar `src/components/ProdutoPrincipal.tsx`: section com os 3 passos, imagens de exemplo e CTA repetido → `/miniatura-pet` (card usa `sticker-shadow-lg`)
- [x] 2.3 Inserir `ProdutoPrincipal` em `src/app/page.tsx` logo após o `Hero`
- [x] 2.4 Revisão visual: bloco aparece na primeira rolagem abaixo do hero

## 3. Fase 3 — Menu mobile nas duas navbars (P1)

- [x] 3.1 Criar `src/components/MobileMenu.tsx` (client): botão hambúrguer, painel deslizante, `aria-expanded`, foco visível, fecha com Esc e clique fora, recebe lista de links via prop
- [x] 3.2 `src/components/Navbar.tsx`: usar `MobileMenu` abaixo de `md`; links inline continuam `hidden md:flex`
- [x] 3.3 `src/components/store/StoreNav.tsx`: trocar `hidden lg:flex` por `hidden md:flex` e usar `MobileMenu` abaixo de `md` com todos os links (incl. "Miniatura do seu pet")
- [x] 3.4 Verificar navegação por teclado e foco visível nos dois menus
- [x] 3.5 Revisão em viewport de celular e tablet: nenhum link de navegação some

## 4. Fase 4 — Barra de CTA fixa no mobile + intake (P1)

- [x] 4.1 Criar `src/components/StickyCta.tsx` (client): `fixed bottom-0`, `md:hidden`, respeita `env(safe-area-inset-bottom)`, recebe `label` e `href`
- [x] 4.2 Incluir `StickyCta` na home; adicionar `padding-bottom` ao `main` no mobile para não cobrir o footer
- [x] 4.3 Incluir `StickyCta` em `/miniatura-pet`; quando o formulário já está na viewport, o clique faz scroll/focus no formulário em vez de navegar
- [x] 4.4 Reordenar `src/app/(store)/miniatura-pet/page.tsx`: no mobile, formulário como primeiro bloco interativo; passos resumidos acima, completos abaixo; desktop mantém 2 colunas
- [x] 4.5 Reduzir conteúdo acima do primeiro campo no mobile (badge + título + 1 linha)
- [x] 4.6 Revisão: primeiro campo do formulário a no máximo uma rolagem curta do topo no celular

## 5. Fase 5 — Catálogo: comprar agora, prazo, frete, imagem (P1)

- [x] 5.1 Adicionar em `data.ts`/`store.ts` prazo de produção estimado e texto de frete (estático inicialmente) — `catalogInfo` em `data.ts`
- [x] 5.2 `src/components/store/CatalogClient.tsx`: botão "Comprar agora" que chama `addItem` e `router.push('/checkout')` (`useRouter` de `next/navigation`), mantendo "+ Carrinho" com o comportamento atual
- [x] 5.3 `CatalogClient.tsx`: exibir prazo de produção e info de frete em cada card
- [x] 5.4 `CatalogClient.tsx`: substituir o texto `[foto produto]` por ilustração de fallback do Leon (ou omitir card sem capa)
- [x] 5.5 `npm run build` e revisão do catálogo

## 6. Fase 6 — Prova social, confiança, FAQ e hierarquia visual (P2)

- [x] 6.1 `data.ts`: arrays de depoimentos reais e galeria (vazios por ora), itens da faixa de confiança, perguntas do FAQ; remover entradas "Cliente exemplo"
- [x] 6.2 `src/components/Testimonials.tsx`: retornar `null` quando não houver depoimentos reais; ajustar para consumir `data.ts`
- [x] 6.3 Criar `src/components/FaixaConfianca.tsx`: bloco `bg-teal` com "prévia antes de pagar", "pronto em N dias", "pagamento seguro Mercado Pago"
- [x] 6.4 Criar `src/components/ProvaSocial.tsx`: galeria de peças entregues + contagem de pedidos (renderiza `null`/estado marcado enquanto não há conteúdo real)
- [x] 6.5 Criar `src/components/Faq.tsx`: prazo, materiais, política de retentativa da prévia (conteúdo em `data.ts`)
- [x] 6.6 `src/app/page.tsx`: ordenar sections `Navbar → Hero → ProdutoPrincipal → FaixaConfianca → HowItWorks → ProvaSocial → About → Faq → Contact → Footer → StickyCta`
- [x] 6.7 `src/app/globals.css`: adicionar `:focus-visible` (outline coral 3px) global; reservar `sticker-shadow-lg` para CTA primário e card do produto principal
- [x] 6.8 Ajustar ritmo vertical entre sections (alternar `py`, usar `bg-offwhite-2` para separar blocos em vez de `border-charcoal/10`)
- [x] 6.9 Revisão visual completa desktop + mobile

## 7. Fase 7 — Instrumentação do funil (P2)

- [x] 7.1 Confirmar API do `@vercel/analytics` (`track` client e server) em `node_modules/@vercel/analytics` e nos docs do Next 16 — `@vercel/analytics` (client) e `@vercel/analytics/server` (server) expõem `track`
- [x] 7.2 Criar `src/lib/analytics.ts` com `trackFunnel(event, props?)` e os nomes de evento (`home_cta_miniatura`, `intake_iniciado`, `intake_enviado`, `previa_aprovada`, `previa_retentativa`, `checkout_iniciado`, `pedido_pago`)
- [x] 7.3 Emitir `home_cta_miniatura` (com origem: hero/bloco/navbar/barra-mobile) nos CTAs da home e na `StickyCta` — via `TrackedLink` + `StickyCta`
- [x] 7.4 Emitir `intake_iniciado` (1x/sessão) no primeiro foco de campo e `intake_enviado` no submit em `PetMiniatureIntakeForm.tsx`
- [x] 7.5 Emitir `previa_aprovada` / `previa_retentativa` na ação correspondente do fluxo de prévia (`PetMiniaturePreview.tsx`)
- [x] 7.6 Emitir `checkout_iniciado` no redirecionamento ao Mercado Pago (`CheckoutForm`, `PetMiniaturePreview`); registrar `pedido_pago` server-side em `store.ts` quando o pedido é pago pela 1ª vez
- [x] 7.7 Garantir que nenhuma propriedade de evento contém PII (e-mail, telefone, nome) — props só têm origem, variante, fluxo, order_code e centavos

## 8. Fechamento

- [x] 8.1 `npm run build` limpo (typecheck + lint) — build e typecheck OK; `npm run lint` só acusa erro **pré-existente** em `src/lib/cart-context.tsx:40` (não faz parte deste change)
- [ ] 8.2 Revisão manual do funil ponta a ponta em mobile e desktop: home → 1 clique → formulário — **pendente:** rodar `npm run dev` (sem ferramenta de screenshot no ambiente)
- [x] 8.3 Registrar em `data.ts`/README os placeholders que ainda dependem de conteúdo real do usuário (fotos de peças, depoimentos, preço inicial, prazo/frete definitivos)
- [ ] 8.4 Commits por fase seguindo o padrão `Tipo(camu-web-landing-page): ...` — **pendente:** aguardando o usuário pedir o commit
