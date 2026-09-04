## Context

A loja própria grava pedidos em `orders` / `order_items` / `order_events` no Supabase compartilhado com o ERP `camu-web-admin`. Hoje só o webhook de pagamento (`src/lib/store.ts` → `applyPaymentStatus`) avança `orders.status` e insere em `order_events`; a tela `/pedido/[code]` monta a timeline de 5 passos a partir de `orders.status` (`src/lib/status.ts`) e usa os eventos apenas pra datar cada passo — a `note` é ignorada.

A notificação de venda (`src/lib/notify/`) dispara no e-mail e no Slack via `notifySaleChannels` quando um pedido é pago pela primeira vez. A mensagem traz dados do pedido mas nenhum link acionável.

A proposta irmã em `camu-web-admin` adiciona a tela `/vendas/pedidos/codigo/[orderCode]` e a ação que escreve `orders.status` + `order_events` seguindo esse contrato. Este repo precisa apontar pra essa tela e passar a exibir o que o admin escreve.

## Goals / Non-Goals

**Goals:**
- Incluir o link `${ADMIN_BASE_URL}/vendas/pedidos/codigo/{order_code}` na notificação de venda (Slack e e-mail), com degradação graciosa.
- Exibir a `note` de cada `order_events` na timeline do cliente.
- Tornar `src/lib/status.ts` a referência explícita do contrato de status e torná-lo tolerante a valores desconhecidos.

**Non-Goals:**
- Criar tela ou ação de gestão de pedido neste repo — isso é do admin.
- Alterar schema, migrations ou o vocabulário de `orders.status`.
- Autenticação/deep-link autenticado no admin (o admin cuida do seu próprio gate de acesso).
- Notificar o cliente a cada mudança de status (fora de escopo; a página é pull, não push).

## Decisions

### 1. `ADMIN_BASE_URL` como env deste repo, link montado no ponto de formatação

O link é montado em `src/lib/notify/format.ts` (helper `adminOrderUrl(orderCode)`) e consumido por `slack.ts` e `email.ts`. `ADMIN_BASE_URL` é lida com `process.env` e normalizada com `.replace(/\/$/, "")`. Sem a var, `adminOrderUrl` retorna `null` e os canais omitem a linha.

_Alternativa descartada:_ colocar a URL pronta na `SaleEvent`. Rejeitada porque a `SaleEvent` é montada em vários pontos (`store.ts`) e o link é puramente de apresentação — melhor derivar na borda.

### 2. Rota do admin fixada por convenção, não configurável

O caminho `/vendas/pedidos/codigo/{code}` fica hardcoded no helper. É a rota que a proposta do admin cria; se mudar, muda nos dois repos junto. Não vale a complexidade de um template configurável.

### 3. `note` renderizada como sub-linha de cada passo, sem novo componente

`OrderTimeline` e `OrderTimelineVertical` já recebem `stepDates`. Adiciona-se `stepNotes: (string | null)[]` montado do mesmo jeito que `stepDates` em `page.tsx` (índice do passo → nota do evento que o originou). Quando a nota é nula, nada é renderizado.

### 4. `timelineIndex` já tem `default: return 0` — só falta a spec citá-lo

O código atual já cai no passo 0 para status desconhecido. A mudança é documental (a spec `acompanhamento-de-pedido` fixa esse comportamento) mais um teste que trava a regra.

## Risks / Trade-offs

- **Rota do admin diverge entre repos** → helper centraliza o caminho num único lugar; a task lista a checagem cruzada com a proposta do admin.
- **`note` escrita no admin pode conter texto interno não destinado ao cliente** → a spec do admin define que a nota da ação de status é voltada ao cliente; mitigação adicional: truncar em ~140 chars na exibição e escapar como texto puro (sem markdown/HTML).
- **`ADMIN_BASE_URL` apontando pra host errado vaza link quebrado no Slack** → baixo impacto (só o time vê); documentar no `.env.example` que é a URL pública do admin sem barra final.
- **Ordem dos eventos vs. passos** quando o admin volta o pedido de etapa (ex.: `shipped` → `in_production`) → a timeline usa `orders.status` como posição atual e os eventos só pra datar/anotar; regressão de status simplesmente recua o destaque. Aceitável.

## Migration Plan

1. Merge sem `ADMIN_BASE_URL` no ambiente → comportamento idêntico ao atual (link omitido, notas aparecem quando existirem).
2. Deploy da proposta do admin; configurar `ADMIN_BASE_URL` no ambiente da landing.
3. Rollback: remover a var e reverter o commit; sem estado persistido, sem migration.

## Open Questions

- O e-mail de venda deve mostrar o link do admin ou só o Slack? (default assumido: ambos, já que os dois são canais internos do time.)
- Truncar a `note` do cliente em quantos caracteres? (proposto: 140.)
