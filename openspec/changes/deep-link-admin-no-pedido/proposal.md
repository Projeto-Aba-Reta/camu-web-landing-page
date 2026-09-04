## Why

Quando um pedido da loja própria é pago, o time recebe a notificação de venda no Slack mas não tem um caminho direto pra abrir aquele pedido e agir sobre ele — precisa entrar no admin e procurar pelo código na mão. Além disso, a timeline de acompanhamento do cliente (`/pedido/[code]`) só avança sozinha via webhook de pagamento; nenhum ator externo (o admin) atualiza o andamento logístico hoje, e a página não está preparada pra exibir bem eventos escritos por fora (notas, status intermediários). Este repo precisa (1) mandar o link do pedido no admin junto da notificação e (2) firmar o contrato de que `orders.status` + `order_events` é a fonte de verdade que o admin escreve e o cliente lê.

## What Changes

- A notificação de venda (Slack e e-mail) passa a incluir um **link direto pro pedido no camu-web-admin**, montado a partir de uma nova variável de ambiente `ADMIN_BASE_URL` + o código do pedido (ex.: `${ADMIN_BASE_URL}/vendas/pedidos/codigo/{order_code}`). Sem `ADMIN_BASE_URL` configurada, a notificação sai sem o link (sem quebrar).
- A página de acompanhamento `/pedido/[code]` passa a **renderizar a nota (`order_events.note`) de cada evento** da timeline, não só a posição do passo — assim uma atualização feita no admin ("saiu pra entrega", "peça reimpressa") aparece pro cliente.
- Documenta-se explicitamente o **contrato de status/timeline** consumido por este repo: valores válidos de `orders.status` (`pending`, `paid`, `in_production`, `finishing`, `shipped`, `delivered`, `cancelled`), o mapeamento pra passo da timeline (`src/lib/status.ts`) e a regra de que `order_events` é somente-adição. O admin escreve seguindo esse contrato; a página tolera status desconhecido caindo no passo 0 em vez de quebrar.
- **BREAKING**: nenhuma. Mudança aditiva; sem migration (colunas já existem).

## Capabilities

### New Capabilities
- `notificacao-de-venda`: conteúdo e canais da notificação disparada quando um pedido é confirmado como pago — inclui agora o deep-link pro pedido correspondente no camu-web-admin, com degradação graciosa quando o admin não está configurado.
- `acompanhamento-de-pedido`: a tela pública `/pedido/[code]` e o contrato de dados que ela lê — `orders.status` (vocabulário e mapeamento pra timeline de 5 passos), `order_events` somente-adição com nota exibida ao cliente, e tolerância a escritas feitas pelo admin.

### Modified Capabilities
(nenhuma — não há specs em `openspec/specs/` ainda)

## Impact

- **`src/lib/notify/`**: `slack.ts` e `email.ts` (ou `format.ts`) passam a montar o link do admin; `types.ts` ganha o campo opcional na `SaleEvent` ou lê `ADMIN_BASE_URL` no ponto de formatação. Ponto de disparo (`notifySaleChannels`) não muda.
- **`.env.example` / `.env.local`**: nova var `ADMIN_BASE_URL` (URL base do camu-web-admin, sem barra final).
- **`src/app/(store)/pedido/[code]/page.tsx`** e componentes `OrderTimeline*`: exibir `note` dos eventos.
- **`src/lib/status.ts`**: nenhuma mudança de valores; vira a referência citada pela spec `acompanhamento-de-pedido`.
- **Sem mudança de schema.** A proposta irmã em `camu-web-admin` é quem cria a tela `/vendas/pedidos/codigo/[orderCode]` e a ação que escreve `orders.status` + `order_events`.
- Nenhum impacto nos fluxos de catálogo, carrinho, checkout ou pagamento.
