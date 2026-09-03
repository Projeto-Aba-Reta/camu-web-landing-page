## ADDED Requirements

### Requirement: Eventos do funil de conversão

O site SHALL emitir eventos de analytics (via Vercel Web Analytics `track()`) nos pontos-chave do funil da miniatura do pet, para permitir medir conversão por etapa.

#### Scenario: Clique no CTA principal da home

- **WHEN** o visitante ativa o CTA primário do hero ou o CTA do bloco do produto principal ou a barra fixa de mobile
- **THEN** um evento `home_cta_miniatura` é emitido, com propriedade indicando a origem do clique (hero, bloco, barra-mobile)

#### Scenario: Início do formulário

- **WHEN** o visitante preenche o primeiro campo do formulário de `/miniatura-pet`
- **THEN** um evento `intake_iniciado` é emitido uma vez por sessão

#### Scenario: Envio de fotos concluído

- **WHEN** o visitante submete o formulário de intake com as fotos
- **THEN** um evento `intake_enviado` é emitido

#### Scenario: Decisão sobre a prévia

- **WHEN** o visitante aprova a prévia ou pede uma retentativa
- **THEN** um evento `previa_aprovada` ou `previa_retentativa` é emitido de acordo

#### Scenario: Checkout iniciado e pedido pago

- **WHEN** o visitante é redirecionado ao Mercado Pago
- **THEN** um evento `checkout_iniciado` é emitido
- **WHEN** o pagamento é confirmado (webhook ou reconciliação por `external_reference`)
- **THEN** um evento `pedido_pago` é registrado

### Requirement: Nenhum dado sensível nos eventos

Os eventos de analytics NÃO SHALL incluir PII do cliente (e-mail, telefone, nome) nas propriedades.

#### Scenario: Propriedades do evento

- **WHEN** qualquer evento do funil é emitido
- **THEN** as propriedades contêm apenas identificadores não-pessoais (origem, id do pedido/rascunho, etapa)
