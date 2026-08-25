## ADDED Requirements

### Requirement: Intake de dados e fotos do pet
O sistema SHALL apresentar um formulário público onde o cliente informa nome, número de WhatsApp e envia entre 3 e 4 fotos do pet antes de prosseguir.

#### Scenario: Cliente preenche o formulário com o mínimo exigido
- **WHEN** o cliente informa nome, WhatsApp e anexa 3 fotos válidas (jpg/png/webp, dentro do limite de tamanho)
- **THEN** o sistema aceita o envio, salva as fotos no Storage e cria um registro de encomenda com status inicial "processando"

#### Scenario: Cliente tenta prosseguir sem o mínimo de fotos
- **WHEN** o cliente tenta enviar o formulário com menos de 3 fotos ou sem nome/WhatsApp preenchidos
- **THEN** o sistema bloqueia o envio no client e exibe mensagem indicando o que falta, sem criar registro no servidor

#### Scenario: Cliente envia mais fotos que o permitido
- **WHEN** o cliente tenta anexar uma 5ª foto
- **THEN** o sistema impede o anexo adicional e informa o limite de 4 fotos

#### Scenario: Arquivo enviado não é uma imagem válida
- **WHEN** o cliente anexa um arquivo que não é imagem ou excede o tamanho máximo permitido
- **THEN** o sistema rejeita esse arquivo especificamente, mantém os demais já aceitos e explica o motivo da rejeição

### Requirement: Pipeline assíncrono de geração de imagem por IA
O sistema SHALL processar as fotos recebidas em um pipeline assíncrono que gera, via provider de geração de imagem por IA, uma imagem representando o pet como miniatura impressa em 3D, sem manter a requisição HTTP do cliente aberta durante todo o processamento.

#### Scenario: Processamento inicia após o envio das fotos
- **WHEN** um registro de encomenda de miniatura é criado com as fotos salvas
- **THEN** o sistema dispara o pipeline de geração de imagem de forma assíncrona e o registro fica com status "processando"

#### Scenario: Geração concluída com sucesso
- **WHEN** o provider de IA retorna uma imagem gerada com sucesso
- **THEN** o sistema salva a imagem gerada associada ao registro e atualiza o status para "pronto"

#### Scenario: Geração falha
- **WHEN** o provider de IA retorna erro ou expira o tempo limite configurado
- **THEN** o sistema marca o registro com status "falhou" e disponibiliza uma opção de nova tentativa para o cliente, sem cobrar nada

### Requirement: Acompanhamento e prévia do resultado
O sistema SHALL permitir que o cliente acompanhe o status do processamento e visualize a prévia gerada assim que estiver pronta, em uma tela didática e na identidade visual Sticker Pop.

#### Scenario: Cliente acompanha o processamento em andamento
- **WHEN** o cliente está na tela de acompanhamento e o status ainda é "processando"
- **THEN** o sistema exibe um indicador de progresso claro, sem exigir que o cliente recarregue a página manualmente

#### Scenario: Prévia pronta é exibida ao cliente
- **WHEN** o status do registro muda para "pronto"
- **THEN** o sistema exibe a imagem gerada da miniatura junto com as ações de "aprovar e continuar para pagamento" e "gerar nova tentativa"

#### Scenario: Cliente pede nova tentativa de geração
- **WHEN** o cliente aciona "gerar nova tentativa" a partir da tela de prévia
- **THEN** o sistema reprocessa as mesmas fotos no pipeline de IA e volta o status para "processando", sem exigir novo upload

### Requirement: Aprovação da prévia e pagamento
O sistema SHALL só permitir avançar para o pagamento depois que o cliente aprovar explicitamente a prévia gerada, e o valor cobrado SHALL ser determinado pelo servidor, nunca pelo client.

#### Scenario: Cliente aprova a prévia e é levado ao pagamento
- **WHEN** o cliente aprova uma prévia com status "pronto"
- **THEN** o sistema cria o pedido correspondente com o preço fixado no servidor e redireciona o cliente para o Checkout Pro do Mercado Pago (Pix/cartão)

#### Scenario: Pagamento aprovado atualiza a encomenda
- **WHEN** o Mercado Pago confirma um pagamento aprovado para o pedido vinculado à encomenda de miniatura
- **THEN** o sistema marca a encomenda como paga, dispara a notificação de venda e o cliente pode acompanhar o pedido pela tela de acompanhamento existente

#### Scenario: Cliente tenta pagar antes de aprovar a prévia
- **WHEN** não há prévia aprovada para a encomenda
- **THEN** o sistema não permite gerar cobrança e mantém o cliente na etapa de prévia
