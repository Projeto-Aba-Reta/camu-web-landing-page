## ADDED Requirements

### Requirement: Menu de navegação acessível no mobile

Ambas as navbars (institucional `Navbar` e da loja `StoreNav`) SHALL oferecer, em viewports onde os links horizontais ficam ocultos, um botão de menu (hambúrguer) que revela todos os links de navegação. Nenhum link de navegação primária SHALL ficar inacessível por viewport.

#### Scenario: Visitante no celular abre o menu da home

- **WHEN** o visitante carrega `/` em viewport estreito (onde os links inline estão ocultos)
- **THEN** há um botão de menu visível
- **AND** ao ativá-lo, todos os links (incluindo "Loja" e "Miniatura do pet") ficam acessíveis

#### Scenario: Visitante no celular abre o menu da loja

- **WHEN** o visitante carrega uma rota do route group `(store)` em viewport estreito
- **THEN** há um botão de menu visível
- **AND** ao ativá-lo, todos os links de `StoreNav` (incluindo "Miniatura do seu pet") ficam acessíveis

#### Scenario: Menu do teclado

- **WHEN** o visitante navega o botão de menu via teclado
- **THEN** o botão tem estado de foco visível e alterna o menu com Enter/Espaço

### Requirement: Breakpoint do menu da loja

O menu horizontal de `StoreNav` SHALL ficar visível a partir do breakpoint `md`; abaixo disso o menu hambúrguer assume.

#### Scenario: Tablet

- **WHEN** o visitante acessa a loja em viewport de tablet (≥ `md`, < `lg`)
- **THEN** os links de navegação da loja aparecem inline (não mais ocultos até `lg`)

### Requirement: Link direto para o produto principal e CTAs sem redundância

A navbar institucional SHALL conter um link direto para `/miniatura-pet` e NÃO SHALL apresentar dois controles distintos que levem ambos a `/loja`.

#### Scenario: Navbar da home

- **WHEN** o visitante olha a navbar em `/`
- **THEN** existe um link/CTA para `/miniatura-pet`
- **AND** não há dois botões separados ("Loja" e "Ir pra loja") apontando para o mesmo destino

### Requirement: Barra de CTA fixa no mobile

Na home e na página `/miniatura-pet`, em viewport mobile, o site SHALL exibir uma barra fixa na base da viewport com um CTA para iniciar a miniatura do pet.

#### Scenario: Rolagem no mobile

- **WHEN** o visitante rola a home ou a página do produto no celular
- **THEN** uma barra fixa com o CTA "Fazer minha miniatura" permanece visível
- **AND** ativá-la leva a `/miniatura-pet` (ou foca o formulário, se já estiver nele)

#### Scenario: Desktop

- **WHEN** o visitante acessa em viewport desktop
- **THEN** a barra fixa de CTA não é exibida
