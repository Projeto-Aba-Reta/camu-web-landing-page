## ADDED Requirements

### Requirement: Notificação de venda por canal configurável
O sistema SHALL notificar o time da Camu através de uma abstração de canais quando um pedido é confirmado como pago, com um canal de e-mail habilitado por padrão e a capacidade de habilitar outros canais sem alterar o ponto de disparo.

#### Scenario: Pedido pago dispara notificação por e-mail
- **WHEN** um pedido (incluindo encomendas de miniatura de pet) tem o pagamento confirmado como aprovado
- **THEN** o sistema envia uma notificação por e-mail para o endereço configurado, contendo os dados essenciais do pedido (código, cliente, valor, tipo de item)

#### Scenario: Múltiplos canais habilitados simultaneamente
- **WHEN** mais de um canal de notificação está configurado como ativo (por exemplo e-mail e um webhook)
- **THEN** o sistema dispara o evento em todos os canais ativos de forma independente, sem que a falha de um impeça o disparo dos demais

#### Scenario: Canal de notificação falha ao enviar
- **WHEN** o envio por um canal específico falha (erro do provedor, timeout)
- **THEN** o sistema registra a falha sem interromper a confirmação do pagamento nem o fluxo do cliente, e o erro fica disponível para investigação

#### Scenario: Novo canal pode ser adicionado sem mudar o ponto de disparo
- **WHEN** um novo canal de notificação é implementado seguindo a interface comum do módulo
- **THEN** habilitá-lo via configuração é suficiente para que passe a receber os mesmos eventos de venda, sem alterar o código que dispara a notificação
