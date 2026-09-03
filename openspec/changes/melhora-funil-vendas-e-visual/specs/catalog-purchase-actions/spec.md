## ADDED Requirements

### Requirement: Ação "Comprar agora" no card do catálogo

Cada card de produto no catálogo SHALL oferecer, além de "+ Carrinho", uma ação "Comprar agora" que adiciona o item e leva o visitante direto ao checkout.

#### Scenario: Visitante decidido

- **WHEN** o visitante ativa "Comprar agora" em um card
- **THEN** o item é adicionado ao carrinho com quantidade 1
- **AND** o navegador vai para `/checkout`

#### Scenario: "+ Carrinho" preservado

- **WHEN** o visitante ativa "+ Carrinho"
- **THEN** o comportamento atual é mantido (adiciona e mostra confirmação "Adicionado ✓" sem sair da página)

### Requirement: Prazo e frete no card do catálogo

O card de produto SHALL exibir o prazo estimado de produção e uma indicação de frete (ex.: "frete calculado no checkout" ou valor estimado).

#### Scenario: Card renderizado

- **WHEN** o catálogo é exibido
- **THEN** cada card mostra o prazo de produção estimado e a informação de frete

### Requirement: Produto sem imagem não expõe placeholder cru

Um produto sem imagem de capa NÃO SHALL renderizar o texto `[foto produto]` sobre padrão listrado como se fosse um estado normal do catálogo.

#### Scenario: Produto sem capa

- **WHEN** um produto do catálogo não tem `product_media.is_cover`
- **THEN** o card usa uma imagem/ilustração de fallback da marca (ex.: Leon) OU o produto é omitido da listagem
- **AND** o texto `[foto produto]` não aparece para o visitante final
