## ADDED Requirements

### Requirement: Formulário priorizado no mobile

Na página `/miniatura-pet`, em viewport mobile, o formulário de intake SHALL ser o primeiro bloco interativo visível, antes da lista completa de passos explicativos.

#### Scenario: Abertura no celular

- **WHEN** o visitante abre `/miniatura-pet` no celular
- **THEN** o formulário (nome, WhatsApp, upload de fotos) aparece sem exigir rolagem longa
- **AND** o detalhamento dos passos aparece de forma resumida acima e/ou completo abaixo do formulário

#### Scenario: Desktop mantém layout de duas colunas

- **WHEN** o visitante abre `/miniatura-pet` em desktop
- **THEN** o layout de duas colunas (explicação + formulário) é preservado

### Requirement: Redução de fricção antes do envio

A quantidade de conteúdo exibido acima do primeiro campo do formulário no mobile SHALL ser mínima (badge + título + 1 linha de subtítulo), com os passos completos acessíveis sem bloquear a ação.

#### Scenario: Contagem de rolagem

- **WHEN** o visitante abre `/miniatura-pet` no celular
- **THEN** o primeiro campo do formulário está a no máximo uma rolagem curta do topo
