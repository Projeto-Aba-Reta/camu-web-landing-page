## ADDED Requirements

### Requirement: Contrato de status logístico do pedido

A tela `/pedido/[code]` SHALL derivar o passo atual da timeline a partir de `orders.status`, aceitando o vocabulário `pending`, `paid`, `in_production`, `finishing`, `shipped`, `delivered` e `cancelled`. O mapeamento status → passo SHALL viver em `src/lib/status.ts` como fonte única. Um status fora do vocabulário SHALL cair no passo inicial (0) sem lançar erro.

#### Scenario: Status conhecido escrito pelo admin

- **WHEN** o admin muda `orders.status` de `paid` para `shipped`
- **THEN** a página de acompanhamento passa a destacar o passo "Enviado" na timeline

#### Scenario: Status desconhecido

- **WHEN** `orders.status` contém um valor não previsto no vocabulário
- **THEN** a página renderiza a timeline no passo inicial em vez de quebrar

#### Scenario: Pedido cancelado

- **WHEN** `orders.status` é `cancelled`
- **THEN** a página exibe o aviso de cancelamento no lugar da timeline

### Requirement: order_events somente-adição com nota exibida ao cliente

A página SHALL ler `order_events` (colunas `status`, `note`, `created_at`) em ordem cronológica e exibir a `note` de cada evento junto do passo correspondente da timeline. A página SHALL tratar `order_events` como somente-adição — nunca editar nem apagar eventos — e SHALL funcionar quando `note` for nula.

#### Scenario: Evento com nota escrita no admin

- **WHEN** o admin move o pedido pra "Acabamento" com a nota "peça reimpressa, no prazo"
- **THEN** a timeline do cliente mostra o passo "Acabamento" com o texto "peça reimpressa, no prazo"

#### Scenario: Evento sem nota

- **WHEN** um evento de `order_events` tem `note` nula
- **THEN** a timeline exibe só o passo e a data, sem linha de nota e sem erro

#### Scenario: Datas por passo seguem os eventos

- **WHEN** o pedido tem eventos em datas distintas para pagamento e envio
- **THEN** cada passo da timeline exibe a data do evento que o originou, e passos ainda não atingidos ficam sem data
