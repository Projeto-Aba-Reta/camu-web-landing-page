## Why

O produto principal da Camu — a **miniatura do pet** — não aparece na home e só é alcançável por um caminho de 3 cliques pouco chamativos, sendo que o último link fica escondido no menu da loja e **não existe no mobile** (nenhuma das duas navbars tem menu hambúrguer). O CTA mais visível do site (`Ver catálogo →` no hero) aponta para a âncora `#catalogo`, que não existe na página — é um clique morto. Além disso, o texto do hero ainda manda o cliente comprar "100% pelos marketplaces", contradizendo a loja própria com Pix e cartão. O estudo de usabilidade (`estudo-funil.html`, artifact `5aa0ad56`) detalha 12 pontos que travam a conversão e a percepção de acabamento do site.

## What Changes

- **Hero da home** passa a vender a miniatura do pet: nova headline, imagem de exemplo, faixa de preço/prazo, prova de "prévia grátis antes de pagar", e um CTA primário único `Fazer a miniatura do meu pet` que leva direto a `/miniatura-pet` (1 clique da home ao formulário).
- **Corrige o CTA quebrado**: remove/substitui a âncora `#catalogo`; CTAs secundários passam a apontar para rotas reais (`/loja`, `/encomenda`).
- **Atualiza a copy** do hero e de `data.ts` que ainda tratam marketplace como canal único de compra.
- **Novo bloco "produto principal"** na home logo após o hero: os 3 passos da miniatura + imagens de exemplo + CTA repetido, reaproveitando conteúdo de `/miniatura-pet`.
- **Menu mobile (hambúrguer)** em `Navbar` (home) e `StoreNav` (loja); menu da loja passa de `hidden lg:flex` para visível a partir de `md`, com hambúrguer abaixo disso. Adiciona link direto "Miniatura do pet" na navbar da home.
- **Barra de CTA fixa no mobile** ("Fazer minha miniatura") na home e na página do produto.
- **Consolida** os dois botões redundantes "Loja"/"Ir pra loja" da navbar.
- **Catálogo**: botão `Comprar agora` (adiciona e vai ao checkout) além de `+ Carrinho`; exibe prazo de produção e frete estimado no card.
- **Placeholders**: substitui `[foto produto]` por imagem real ou oculta o card sem capa; remove depoimentos "Cliente exemplo" até haver conteúdo real.
- **Prova social real** na home: galeria de peças entregues, depoimentos verdadeiros, contagem de pedidos, selo "pagamento seguro Mercado Pago"; FAQ curto (prazo, materiais, retentativa de prévia).
- **Reordena `/miniatura-pet` no mobile**: formulário como primeiro elemento visível; reduz passos exibidos antes do envio.
- **Hierarquia visual**: elevação diferenciada (só CTA principal e card do produto-chave usam `sticker-shadow-lg`), ritmo vertical variável entre seções, estados de foco visíveis, bloco de confiança em faixa teal.
- **Corrige o link** "Ler a história completa →" em Sobre, que hoje aponta para `#contato` (só redes sociais).
- **Instrumentação do funil** via Vercel Analytics: eventos de clique no CTA do hero, início do formulário, envio de fotos, aprovação de prévia, checkout iniciado, pedido pago.

## Capabilities

### New Capabilities
- `home-conversion`: estrutura e conteúdo da página inicial voltados à conversão — hero orientado ao produto principal, bloco de produto principal, prova social, faixa de preço/prazo, FAQ, e o funil-alvo de 1 clique da home ao formulário de intake.
- `site-navigation`: comportamento da navegação em desktop e mobile nas duas navbars (institucional e loja) — menu hambúrguer, breakpoints, links diretos para o produto principal, consolidação de CTAs redundantes, barra de CTA fixa no mobile.
- `catalog-purchase-actions`: ações de compra no card do catálogo — `Comprar agora` além de `+ Carrinho`, exibição de prazo de produção e frete estimado, tratamento de produto sem imagem.
- `pet-miniature-intake-ux`: ordenação e densidade do formulário de intake da miniatura de pet, priorizando a ação no mobile.
- `funnel-analytics`: eventos de analytics que medem o funil da home até o pedido pago.

### Modified Capabilities
<!-- Nenhuma capability especificada em openspec/specs/ ainda; todas as mudanças de comportamento entram como capabilities novas. -->

## Impact

- **Componentes**: `src/components/Hero.tsx`, `src/components/Navbar.tsx`, `src/components/About.tsx`, `src/components/Contact.tsx`, `src/components/Testimonials.tsx`, `src/components/store/StoreNav.tsx`, `src/components/store/CatalogClient.tsx`, `src/components/store/PetMiniatureIntakeForm.tsx` + novos componentes de section (bloco produto principal, prova social, FAQ, faixa de confiança, barra CTA mobile, menu mobile).
- **Páginas**: `src/app/page.tsx` (nova ordem de sections), `src/app/(store)/miniatura-pet/page.tsx` (ordem no mobile), `src/app/(store)/loja/page.tsx`.
- **Dados/conteúdo**: `src/lib/data.ts` (copy, links, remoção de placeholders), `src/lib/store.ts` (prazo/frete no tipo `Product` se vierem do banco).
- **Estilo**: `src/app/globals.css` (possíveis utilitárias novas para elevação/faixa de confiança; sem alterar a paleta fixa).
- **Analytics**: integração com Vercel Web Analytics já instalada (`@vercel/analytics`); adicionar `track()` nos pontos do funil.
- **Assets**: `public/images/` — precisa de fotos reais de peças/miniaturas de pet (conteúdo a ser fornecido pelo usuário; até lá, placeholders marcados).
- **Sem mudança de schema** no Supabase; prazo/frete estimado pode ser conteúdo estático inicialmente.
- **Marca**: mantém paleta fixa e estilo Sticker Pop; nenhuma cor nova.
