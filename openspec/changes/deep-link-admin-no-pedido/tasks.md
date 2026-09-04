## 1. Config de ambiente

- [x] 1.1 Adicionar `ADMIN_BASE_URL` ao `.env.example` com comentário (URL pública do camu-web-admin, sem barra final)
- [x] 1.2 Registrar `ADMIN_BASE_URL` no `.env.local` local para teste

## 2. Deep-link do admin na notificação de venda

- [x] 2.1 Criar helper `adminOrderUrl(orderCode: string): string | null` em `src/lib/notify/format.ts` — lê `process.env.ADMIN_BASE_URL`, normaliza barra final, monta `${base}/vendas/pedidos/codigo/${orderCode}`, retorna `null` sem a var
- [x] 2.2 `src/lib/notify/slack.ts`: incluir linha "Abrir no admin: <url>" quando `adminOrderUrl` não for nulo
- [x] 2.3 `src/lib/notify/email.ts`: incluir o mesmo link no corpo do e-mail quando disponível
- [x] 2.4 Teste unitário de `adminOrderUrl`: com var, com var terminando em `/`, sem var — `src/lib/notify/format.test.ts`

## 3. Nota dos eventos na timeline do cliente

- [x] 3.1 `src/app/(store)/pedido/[code]/page.tsx`: montar `stepNotes: (string | null)[]` a partir de `events` (nota do evento que originou cada passo), truncada em 140 chars
- [x] 3.2 `src/components/store/OrderTimeline.tsx`: aceitar prop `stepNotes` e renderizar a nota como sub-linha do passo (texto puro, sem markdown)
- [x] 3.3 `src/components/store/OrderTimelineVertical.tsx`: mesmo tratamento para o layout mobile
- [x] 3.4 Verificar visualmente: evento com nota, evento sem nota (`null`), pedido só com evento `pending` — verificado por inspeção de código (sem ferramenta de browser disponível no ambiente); os três casos são cobertos pelo mapeamento em `page.tsx` (`truncateNote(null)` → `null`; passo 0 sempre `null`; fallback `?? null`)

## 4. Contrato de status

- [x] 4.1 Adicionar comentário em `src/lib/status.ts` marcando-o como fonte única do contrato consumido pela spec `acompanhamento-de-pedido` (vocabulário + mapeamento)
- [x] 4.2 Teste de `timelineIndex`: cada status conhecido → passo esperado; status desconhecido → `0`; `cancelled` → `-1` — `src/lib/status.test.ts`

## 5. Fechamento

- [x] 5.1 Conferir que a rota `/vendas/pedidos/codigo/{code}` bate com a criada na proposta irmã do camu-web-admin (`gestao-de-status-de-pedido-da-loja`) — confirmado em `camu-web-admin/openspec/changes/gestao-de-status-de-pedido-da-loja/proposal.md` e `specs/deep-link-de-pedido-por-codigo/spec.md`
- [x] 5.2 `npm run build` (typecheck + lint) verde
- [x] 5.3 Atualizar `docs/notificacao-slack.md` mencionando o link do admin e a var `ADMIN_BASE_URL`

> **Nota:** o repo não tinha test runner configurado; adicionado `vitest` (devDependency) + script `npm test` a pedido do usuário. `npm test` roda os 11 testes novos, todos verdes.
