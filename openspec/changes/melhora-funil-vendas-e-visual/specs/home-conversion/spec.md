## ADDED Requirements

### Requirement: Hero orientado ao produto principal

O hero da home SHALL apresentar a miniatura do pet como oferta central: headline sobre a miniatura, imagem ilustrativa de exemplo, sinalização de preço inicial ("a partir de R$ X") e prazo, e a mensagem de que a prévia é gerada antes de qualquer pagamento. O hero NÃO SHALL conter texto que direcione a compra exclusivamente para marketplaces.

#### Scenario: Visitante chega na home

- **WHEN** o visitante carrega `/` em qualquer viewport
- **THEN** a primeira dobra exibe a headline da miniatura do pet, uma imagem de exemplo, a faixa de preço/prazo e a frase de prévia grátis antes de pagar
- **AND** nenhum texto afirma que a compra é feita "100% pelos marketplaces"

#### Scenario: CTA primário do hero

- **WHEN** o visitante ativa o CTA primário do hero
- **THEN** o navegador vai para `/miniatura-pet`
- **AND** o CTA não aponta para nenhuma âncora inexistente (ex.: `#catalogo`)

#### Scenario: CTAs secundários

- **WHEN** o visitante procura outras opções abaixo do CTA primário
- **THEN** existem links secundários para o catálogo (`/loja`) e para encomenda personalizada (`/encomenda`), visualmente subordinados ao CTA primário

### Requirement: Bloco do produto principal na home

A home SHALL exibir, logo após o hero, uma section dedicada à miniatura do pet contendo os passos do processo (envio de fotos → prévia por IA → aprovação e pagamento), imagens de exemplo e um CTA repetido para `/miniatura-pet`.

#### Scenario: Rolagem após o hero

- **WHEN** o visitante rola uma tela abaixo do hero
- **THEN** vê a section do produto principal com os 3 passos, exemplos visuais e um botão para `/miniatura-pet`

### Requirement: Prova social e confiança na home

A home SHALL exibir prova social real (galeria de peças entregues, depoimentos de clientes reais, contagem de pedidos) e sinais de confiança (prévia antes de pagar, prazo de produção, pagamento seguro via Mercado Pago). Conteúdo placeholder ("Cliente exemplo", `[foto produto]`) NÃO SHALL ser exibido como se fosse real.

#### Scenario: Depoimentos sem conteúdo real disponível

- **WHEN** não há depoimentos reais cadastrados
- **THEN** a section de depoimentos não é renderizada (em vez de mostrar "Cliente exemplo")

#### Scenario: Faixa de confiança

- **WHEN** o visitante percorre a home
- **THEN** encontra um bloco com "prévia antes de pagar", "pronto em N dias" e "pagamento seguro Mercado Pago"

### Requirement: FAQ curto na home

A home SHALL incluir uma section de perguntas frequentes cobrindo pelo menos: prazo de produção, materiais, e o que acontece se a prévia não agradar (retentativa).

#### Scenario: Visitante com dúvida antes de comprar

- **WHEN** o visitante chega à section de FAQ
- **THEN** vê respostas para prazo, materiais e política de retentativa da prévia

### Requirement: Funil de 1 clique da home ao formulário

A jornada do visitante da home até o formulário de intake da miniatura SHALL exigir no máximo 1 clique.

#### Scenario: Caminho mais curto até a conversão

- **WHEN** o visitante decide fazer a miniatura a partir da home
- **THEN** um único clique (no CTA do hero, no bloco do produto principal, ou na barra fixa de mobile) o leva a `/miniatura-pet` com o formulário acessível
