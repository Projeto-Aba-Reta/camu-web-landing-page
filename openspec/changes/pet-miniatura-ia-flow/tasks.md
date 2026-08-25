## 1. Pré-requisitos (bloqueantes, fora deste repo)

- [x] 1.1 Confirmar provider de geração de imagem por IA (custo, latência, política de conteúdo para fotos de pets/pessoas) — ver Open Questions do design.md — **decidido: Google Gemini (`gemini-2.5-flash-image` / "Nano Banana")**
- [x] 1.2 Confirmar plataforma de deploy do site e o mecanismo de execução em background disponível nela (`after()`/`waitUntil`, cron, fila) — **decidido: Vercel, usando `after()` do Next.js**
- [x] 1.3 Confirmar provedor de e-mail transacional a usar no canal inicial de notificação — **decidido: Resend (nenhum provider de e-mail já estava em uso no repo)**
- [ ] 1.4 No `camu-web-admin`: criar migration com a tabela `pet_miniature_requests` (fotos, status, imagem gerada, `order_id` nullable, timestamps) seguindo o padrão de `20260722120000_pedidos_loja_e_canal_site.sql` — **SQL de referência pronto em `supabase/pet-miniature-schema.sql`; a migration real precisa ser criada no repo `camu-web-admin`, que este agente não tem acesso**
- [ ] 1.5 No `camu-web-admin`: cadastrar o produto "Miniatura Pet Personalizada" (categoria `personalizado`) com listing ativo no canal `loja_propria` e preço definido — **statement de referência incluído no mesmo SQL; falta rodar e definir o preço real**
- [ ] 1.6 Aplicar a migration no banco Supabase compartilhado e validar que o produto aparece via `getProductById` — **pendente de acesso ao banco**

## 2. Infra de armazenamento e segredos

- [x] 2.1 Criar bucket privado no Supabase Storage para as fotos originais enviadas pelo cliente — **feito contra o projeto real; o bucket `pet-photos` já existia (criado em 2026-07-24, provavelmente por trabalho anterior no admin) mas estava marcado `public=true` — corrigido para privado**
- [x] 2.2 Criar bucket público no Supabase Storage para as imagens geradas (padrão de `product-media`) — **bucket `pet-media` criado no projeto real**
- [x] 2.3 Adicionar variáveis de ambiente novas (credencial do provider de IA, credenciais do provedor de e-mail) em `.env.example` e `.env.local`
- [x] 2.4 Documentar as novas variáveis/buckets no `README.md` / `supabase/README.md`

## 3. Camada de dados (`src/lib/`)

- [x] 3.1 Adicionar tipos em `src/lib/types.ts` para `PetMiniatureRequest` (status `processando`/`pronto`/`falhou`, fotos, imagem gerada, `order_id`)
- [x] 3.2 Criar `src/lib/pet-miniature.ts` (ou módulo equivalente) com funções server-only: criar registro, listar fotos, atualizar status/imagem gerada, buscar por id
- [x] 3.3 Criar `src/lib/notify/` com a interface `SaleNotificationChannel` e a função `notifySaleChannels(event)`
- [x] 3.4 Implementar o canal de e-mail em `src/lib/notify/email.ts`, configurável via env
- [x] 3.5 Criar cliente do provider de geração de imagem em `src/lib/ai-image.ts` (interface própria, isolando o SDK/HTTP do provider escolhido)

## 4. Intake do cliente (nome, WhatsApp, fotos)

- [x] 4.1 Criar server action de intake em `src/app/actions/pet-miniature.ts`: valida nome/WhatsApp/3–4 fotos, faz upload pro bucket privado, cria o registro com status `processando`
- [x] 4.2 Disparar a geração de imagem logo após o insert, sem bloquear a resposta do server action — **implementado com `after()` chamando `runPetMiniatureGeneration` diretamente, em vez de uma rota de API separada (mesmo efeito de não bloquear a resposta; ver nota na task 5.1)**
- [x] 4.3 Criar componente de formulário de intake (`src/components/` ou dentro da rota da loja) com upload de 3–4 fotos, contador de fotos, e validação client-side (tipo/tamanho/quantidade), na identidade Sticker Pop
- [x] 4.4 Tratar e exibir erros de validação (menos de 3 fotos, mais de 4, arquivo inválido) sem submeter ao servidor

## 5. Pipeline de geração de imagem

- [x] 5.1 Criar rota de API (`src/app/api/pet-miniature/generate/route.ts` ou equivalente) que busca o registro, chama `ai-image.ts`, salva o resultado no bucket público e atualiza o status — **desvio deliberado: virou uma função (`src/lib/pet-miniature-pipeline.ts`), chamada via `after()` a partir das server actions de intake/retry, em vez de uma rota HTTP própria. No Vercel isso já roda fora do caminho crítico da resposta sem precisar de um self-fetch; se a plataforma de deploy mudar, vale revisitar essa decisão**
- [x] 5.2 Tratar timeout/erro do provider: marcar status `falhou` sem criar cobrança
- [x] 5.3 Implementar o mecanismo de "nova tentativa" reaproveitando as fotos já salvas (reseta status para `processando` e chama a rota novamente)

## 6. Telas do fluxo (`src/app/(store)/`)

- [x] 6.1 Criar rota `/miniatura-pet` (tela 1: intake) reaproveitando `StoreNav`/`Footer` do layout do grupo `(store)`
- [x] 6.2 Criar tela de acompanhamento (`/miniatura-pet/[id]`) com polling de status e indicador de progresso enquanto `processando`
- [x] 6.3 Criar tela de prévia com a imagem gerada, botão "aprovar e pagar" e botão "gerar nova tentativa", exibida quando status vira `pronto`
- [x] 6.4 Tratar exibição de estado `falhou` com opção de tentar novamente
- [x] 6.5 Adicionar chamada/link de acesso ao fluxo a partir da navegação existente (`StoreNav`), com copy didática explicando os passos

## 7. Aprovação → pagamento

- [x] 7.1 Criar server action de aprovação: valida que a encomenda está `pronto`, chama `createOrder` com o `productId` do SKU "Miniatura Pet Personalizada" e `createPreference`, e grava `order_id` no registro da encomenda de pet
- [x] 7.2 Redirecionar o cliente para o Checkout Pro (`initPoint`) após aprovar
- [x] 7.3 Garantir que tentar pagar sem prévia aprovada/pronta é bloqueado (guard no server action)
- [x] 7.4 Validar que a página `/pedido/[code]` e `/pedido/confirmado/[code]` já existentes funcionam sem alteração para pedidos originados desse fluxo — **validado por leitura: `getOrderByCode`/`reconcileOrderPayment` são genéricos, não dependem da origem do pedido**

## 8. Notificação de venda

- [x] 8.1 Plugar `notifySaleChannels` no ponto onde `payment_status` vira `approved` (em `applyPaymentStatus`, chamado pelo webhook do Mercado Pago e pela reconciliação)
- [x] 8.2 Garantir que falha em um canal não interrompe a atualização do pedido nem os demais canais
- [x] 8.3 Incluir no e-mail os dados essenciais: código do pedido, cliente, valor, indicação de que é uma encomenda de miniatura de pet, link para a imagem gerada

## 9. Testes e validação

- [x] 9.1 Rodar `npm run build` (typecheck + lint) e `npm run lint` — passou; os únicos avisos/erro do lint são pré-existentes em `src/app/page.tsx` e `src/lib/cart-context.tsx`, não relacionados a este change
- [ ] 9.2 Testar o fluxo completo manualmente em ambiente local/staging: intake → geração → prévia → aprovação → pagamento (sandbox Mercado Pago) → notificação por e-mail recebida — **pendente: precisa das tasks 1.4–1.6 e 2.1–2.2 aplicadas (schema + buckets reais) e das credenciais (`GEMINI_API_KEY`, `RESEND_API_KEY`, `PET_MINIATURE_PRODUCT_ID`) em `.env.local`**
- [ ] 9.3 Testar os casos de erro: menos de 3 fotos, mais de 4 fotos, falha do provider de IA, tentativa de pagar sem aprovar prévia — **mesma dependência da 9.2**
- [ ] 9.4 Revisar responsividade e acessibilidade das novas telas (mobile-first, como o resto do site) — **precisa de `npm run dev` + revisão visual no navegador, não executável nesta sessão**
