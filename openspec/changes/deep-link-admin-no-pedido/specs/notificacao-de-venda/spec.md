## ADDED Requirements

### Requirement: Deep-link pro pedido no admin na notificação de venda

A notificação de venda SHALL incluir uma URL que abre o pedido correspondente no camu-web-admin, montada como `${ADMIN_BASE_URL}/vendas/pedidos/codigo/${orderCode}`, onde `ADMIN_BASE_URL` é lida do ambiente e tem a barra final removida. O link SHALL aparecer em todos os canais ativos (Slack e e-mail).

#### Scenario: Notificação no Slack com admin configurado

- **WHEN** um pedido `#A1B2C3` é confirmado como pago e `ADMIN_BASE_URL` está definida como `https://admin.camu.com.br`
- **THEN** a mensagem do Slack contém o link `https://admin.camu.com.br/vendas/pedidos/codigo/A1B2C3` rotulado como "Abrir no admin"

#### Scenario: ADMIN_BASE_URL com barra final

- **WHEN** `ADMIN_BASE_URL` está definida como `https://admin.camu.com.br/`
- **THEN** o link gerado é `https://admin.camu.com.br/vendas/pedidos/codigo/A1B2C3`, sem barra dupla

### Requirement: Degradação graciosa sem admin configurado

Quando `ADMIN_BASE_URL` não estiver definida ou estiver vazia, a notificação SHALL ser enviada normalmente, sem a linha do link e sem registrar erro.

#### Scenario: Ambiente sem ADMIN_BASE_URL

- **WHEN** um pedido é confirmado como pago e `ADMIN_BASE_URL` não está no ambiente
- **THEN** a notificação é disparada nos canais ativos sem o link do admin, e o fluxo do pedido não é afetado
