# Integração com a API SuperFrete

> Documento de referência fiel à documentação oficial (https://superfrete.readme.io) para que um LLM/agente de desenvolvimento consiga configurar a integração com a API da SuperFrete em qualquer projeto (site próprio / E-commerce com desenvolvimento próprio).
>
> Dúvidas sobre a integração: **integracao@superfrete.com**

---

## 1. Visão geral

A API da SuperFrete permite:

- Calcular frete (cotação) com base em CEP de origem/destino e características do pacote/produtos.
- Consultar informações técnicas dos serviços dos Correios (limites, seguro, requisitos).
- Criar uma etiqueta de frete (pedido) a partir dos dados do pedido.
- Pagar/finalizar (checkout) uma etiqueta usando o saldo da conta SuperFrete.
- Consultar informações de um pedido/etiqueta.
- Gerar o link/PDF de impressão de uma ou mais etiquetas.
- Listar etiquetas da conta, com filtros e paginação.
- Cancelar um pedido/etiqueta.
- Consultar endereços cadastrados e dados da conta do usuário.
- Configurar Webhooks para receber eventos em tempo real sobre os pedidos.

A integração com a API é **gratuita e não possui mensalidade**.

> **Observação:** Esta documentação é voltada para quem quer integrar a API da SuperFrete em um site com **desenvolvimento próprio**. Se o site estiver em uma plataforma de E-commerce (Nuvemshop, Shopify, Wix etc.), a SuperFrete já pode ter uma integração pronta — nesse caso, o cenário indicado é o de autenticação via **OAuth 2.0** (ver seção 3).

---

## 2. Ambientes e URLs base

| Ambiente | Uso | URL base |
|---|---|---|
| **Sandbox** (testes) | Testar a integração. Etiquetas geradas aqui **não têm veracidade** — não podem ser usadas para postagem real com as transportadoras. | `https://sandbox.superfrete.com/` |
| **Produção** (real) | Ambiente real de operação. | `https://api.superfrete.com/` |

Cada ambiente exige seu **próprio token** — o token gerado no Sandbox só funciona nas requisições feitas para a URL de Sandbox, e o token de Produção só funciona nas requisições feitas para a URL de Produção.

---

## 3. Autenticação

Existem **dois modelos** de autenticação. Escolha um de acordo com o cenário da sua integração.

### 3.1 Token manual (recomendado para site/loja própria com um único seller)

Use este modelo quando a integração é para **um único seller** (site próprio). É o modelo indicado por esta documentação para desenvolvimento próprio.

**Geração do token:**

1. **Sandbox:**
   - Acesse: `https://sandbox.superfrete.com/#/integrations`
   - Clique em **Integrar** em Desenvolvedores.
   - Clique em **Confirmar**.
   - O token será gerado e exibido na tela — copie-o para usar nas requisições de Sandbox.
2. **Produção:**
   - Acesse: `https://web.superfrete.com/#/integrations`
   - Clique em **Integrar** em Desenvolvedores.
   - Clique em **Confirmar**.
   - O token será gerado e exibido na tela — copie-o para usar nas requisições de Produção.

**Uso do token:**

Inclua o token no header HTTP `Authorization`, usando o esquema `Bearer`:

```
Authorization: Bearer {token}
```

**Header obrigatório adicional — `User-Agent`:**

É **obrigatório** informar dados da aplicação para contato técnico através do header `User-Agent`, no formato:

```
User-Agent: Nome da sua aplicação e versão (seu_email@para_contato.com)
```

**Exemplo completo (cURL):**

```bash
curl --request POST \
  --url https://sandbox.superfrete.com/api/v0/calculator \
  --header 'Authorization: Bearer {token}' \
  --header 'User-Agent: Superfrete (integracao@superfrete.com)' \
  --header 'accept: application/json' \
  --header 'content-type: application/json'
```

### 3.2 OAuth 2.0 (exclusivo para integrações multiloja)

> **Elegibilidade:** OAuth 2.0 é exclusivo para operações com **múltiplas lojas** (plataformas de e-commerce como Nuvemshop, Shopify, Wix etc.). Integrações de **um único seller** (site próprio) devem usar exclusivamente o **token manual** (seção 3.1).

O OAuth 2.0 é o modelo indicado para ecossistemas multilojas, pois facilita a jornada de autorização de cada usuário/loja, com o token sendo gerado automaticamente.

**Pré-requisito:** solicitar as credenciais de autenticação à equipe SuperFrete através [deste formulário](https://superfrete.readme.io/reference/autentica%C3%A7%C3%A3o) (contato: integracao@superfrete.com). Serão fornecidos:

- `client_id`
- `client_secret`
- Ambos para ambiente de **produção** e de **sandbox**.

Também será necessário informar a `redirect_uri` (URL de callback da sua aplicação, para onde será enviado o código de autorização temporário).

#### Passo 1 — Obter o código de autorização

Redirecione o usuário (seller) para a URL de autorização do ambiente desejado, a partir de dentro da sua plataforma, no momento em que ele decide integrar com a SuperFrete:

- **Sandbox:**
  `https://sandbox.superfrete.com/#/auth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&state={state}`
- **Produção:**
  `https://web.superfrete.com/#/auth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&state={state}`

**Parâmetros:**

| Parâmetro | Obrigatório | Descrição |
|---|---|---|
| `client_id` | Sim | Identificador da sua aplicação, fornecido pela SuperFrete |
| `redirect_uri` | Sim | URL de retorno — deve ser idêntica à cadastrada previamente na SuperFrete |
| `state` | Não | Valor único gerado por você para cada solicitação, usado para validar a integridade do fluxo (proteção contra CSRF) |

Ao acessar essa URL, o seller verá a tela de autorização da SuperFrete. Ao clicar em "Autorizar", a SuperFrete envia um `GET` para a `redirect_uri` com o código de autorização anexado na query string:

```
{redirect_uri}?code={authorization_code}&state={state}
```

> ⚠️ **Atenção:** esse `code` tem validade curta e só pode ser utilizado **uma vez**. Ele não é o token de acesso final — é apenas a credencial usada para solicitá-lo no Passo 2.

#### Passo 2 — Trocar o código pelo token de acesso

Com o `code` recebido no Passo 1, faça uma requisição `POST` para trocar o código pelo token de acesso definitivo.

- **Sandbox:**
  `POST https://us-central1-sandbox-api-superfrete.cloudfunctions.net/apiIntegrationOAuth/api/v0/oauth/token`
- **Produção:**
  `POST https://api.superfrete.com/api/v0/oauth/token`

**Corpo da requisição (JSON):**

```json
{
  "grant_type": "authorization_code",
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",
  "code": "{authorization_code}",
  "state": "{state}",
  "redirect_uri": "{redirect_uri}"
}
```

| Campo | Descrição |
|---|---|
| `grant_type` | `"authorization_code"` |
| `client_id` | O mesmo utilizado no Passo 1 |
| `client_secret` | Fornecido previamente pela SuperFrete — **nunca deve ser exposto no front-end** |
| `code` | O código de autorização recebido no `redirect_uri` após o usuário autorizar |
| `state` | O mesmo valor enviado no Passo 1, para validação |
| `redirect_uri` | A mesma URL registrada e usada na solicitação inicial |

**Resposta (sucesso):**

```json
{
  "access_token": "...",
  "expires": "never",
  "token_type": "Bearer"
}
```

> ❗ **Segurança:** o `client_secret` deve ser mantido apenas no backend da sua aplicação. Nunca faça essa requisição diretamente do front-end/navegador.

**Respostas possíveis:** `200`, `400`, `401`, `500`.

### 3.3 Adicionar saldo em Sandbox (para testar emissão/pagamento de etiquetas)

Para simular compra e emissão de etiquetas no Sandbox, é necessário adicionar saldo à carteira de teste:

1. Acesse o Sandbox: `https://sandbox.superfrete.com/#/account/credits`
2. Clique em **Recarregue com Pix**.
3. Selecione um valor para recarga.
4. Clique em **Recarregar com Pix**.
5. Clique em **Copiar código PIX**.
6. Cole o código PIX copiado na barra de endereço do navegador e pressione Enter — isso simula o pagamento e credita o saldo na carteira de Sandbox.

(Alternativamente, a partir do menu **Perfil > Carteira** dentro do painel Sandbox, o mesmo fluxo de recarga via Pix está disponível.)

---

## 4. Códigos de serviço (transportadoras)

Usados nos campos `services` (calculadora) e `service` (criação de etiqueta):

| Código | Serviço |
|---|---|
| `1` | PAC (Correios) |
| `2` | SEDEX (Correios) |
| `17` | Mini Envios (Correios) |
| `3` | Jadlog |
| `31` | Loggi |
| `33` | J&T |

Exemplos: apenas Sedex → `"2"`; PAC e Sedex → `"1,2"`.

> **Loggi:** não é mais necessário enviar o código `31` no campo `services` para calcular Loggi — a ativação/desativação é controlada nas configurações do token usado na requisição (`https://web.superfrete.com/#/integrations` → Configurações do token (ícone de engrenagem) → desativar Loggi → Salvar). Para a Loggi aparecer no cálculo é necessário existir um ponto de postagem Loggi próximo ao CEP de origem.
>
> **Jadlog:** para aparecer no cálculo, precisa existir um ponto de postagem Jadlog próximo ao CEP de origem.
>
> **J&T:** para aparecer no cálculo, precisa existir um ponto de postagem J&T próximo ao CEP de origem. Telefone do destinatário é **obrigatório** para J&T (opcional para Correios, Jadlog e Loggi).

### Limites por transportadora

| Transportadora | Dimensão máxima por lado | Soma dos lados | Peso máximo | Seguro máximo |
|---|---|---|---|---|
| Loggi | 100 cm | ≤ 200 cm | 30 kg | R$ 3.000,00 |
| Jadlog — Franquias (unidades oficiais) | 80×80×80 cm | — | 120 kg | R$ 1.500,00 |
| Jadlog — Lojas Parceiras | 60×60×60 cm | — | 30 kg | R$ 1.500,00 |
| J&T | 100 cm | ≤ 200 cm (L+C+A) | 11 kg | — |
| Correios (PAC/SEDEX) | ver endpoint "Informações dos pacotes" | soma máx. 200 cm | ver endpoint | ver endpoint (ex.: mín. R$25,63 / máx. R$38.057,59) |

---

## 5. Endpoints da API

Todas as URLs abaixo usam a base de **Sandbox** (`https://sandbox.superfrete.com`). Em **Produção**, substitua a base por `https://api.superfrete.com`, mantendo o mesmo path.

Todas as requisições autenticadas exigem os headers:

```
Authorization: Bearer {token}
User-Agent: Nome da sua aplicação e versão (seu_email@para_contato.com)
accept: application/json
content-type: application/json
```

### 5.1 Cotação de frete (calculadora)

```
POST /api/v0/calculator
```

**Objetivo:** calcular o valor do frete para uma encomenda, com base no CEP de origem, CEP de destino e nas características dos produtos/pacote.

**Campos do corpo (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `from.postal_code` | string | Sim | CEP de origem. Aceita `XXXXX-XXX` ou `XXXXXXXX`. |
| `to.postal_code` | string | Sim | CEP de destino. Aceita `XXXXX-XXX` ou `XXXXXXXX`. |
| `services` | string | Sim | Lista de códigos de serviço a calcular (ver seção 4). Padrão: `1,2,17`. |
| `options.own_hand` | boolean | Não | Mão Própria. `true` para habilitar. Padrão `false`. |
| `options.receipt` | boolean | Não | Aviso de Recebimento. `true` para habilitar. Padrão `false`. |
| `options.insurance_value` | float | Não | Valor declarado da encomenda, usado no cálculo do seguro. Padrão `0`. |
| `options.use_insurance_value` | boolean | Não | Habilita o uso de `insurance_value` no cálculo do seguro. Padrão `false`. |
| `package` | object | Não* | Dimensões da caixa já conhecida: `weight` (kg), `height` (cm), `width` (cm), `length` (cm) — todos `float`, obrigatórios dentro do objeto se ele for usado. Se enviado, **tem prioridade** sobre `products` no cálculo. |
| `products` | array de objetos | Não* | Dimensões de cada produto individual: `quantity` (int, padrão 1), `weight` (float, kg), `height` (float, cm), `width` (float, cm), `length` (float, cm) — todos obrigatórios dentro de cada item. |

\* É necessário enviar **`package` OU `products`** (uma das duas formas de descrever o volume a ser enviado).

> 📘 **Importante — caixa ideal a partir de produtos:** ao enviar `products`, a API calcula e retorna automaticamente as dimensões da **caixa ideal** para acomodar todos os itens. É essencial usar essas dimensões retornadas (campo `package` da resposta) ao criar a etiqueta na API de criação de frete — isso garante precisão e evita divergência com a transportadora.
>
> **Exemplo:** 2 produtos de peso 2 kg, altura 2 cm, largura 16 cm, comprimento 20 cm cada → a caixa ideal retornada foi peso 4 kg, altura 6 cm, largura 16 cm, comprimento 24 cm. Essas dimensões (e não as dos produtos individuais) devem ser usadas ao criar o frete.

**Exemplo de requisição (com `products`):**

```json
{
  "from": { "postal_code": "01153000" },
  "to": { "postal_code": "20020050" },
  "services": "1,2,17,3,33,31",
  "options": {
    "own_hand": false,
    "receipt": false,
    "insurance_value": 0,
    "use_insurance_value": false
  },
  "products": [
    {
      "quantity": 1,
      "height": 4,
      "length": 3,
      "width": 3,
      "weight": 0.03
    }
  ]
}
```

**Exemplo de requisição (com `package`):**

```json
{
  "from": { "postal_code": "01153000" },
  "to": { "postal_code": "20020050" },
  "services": "1,2,17",
  "options": {
    "own_hand": false,
    "receipt": false,
    "insurance_value": 0,
    "use_insurance_value": false
  },
  "package": {
    "height": 2,
    "width": 11,
    "length": 16,
    "weight": 0.3
  }
}
```

**Respostas:** `200`, `400`.

---

### 5.2 Informações dos pacotes (serviços dos Correios)

```
GET /api/v0/services/info
```

**Objetivo:** retorna os detalhes técnicos de cada serviço dos Correios (PAC, SEDEX, Mini Envios): limites de dimensão, peso, valores de seguro, requisitos obrigatórios/opcionais.

**Estrutura da resposta**, organizada por código de serviço (`1` → PAC, `2` → SEDEX, `17` → Mini Envios), cada um contendo:

- `name`: nome comercial do serviço (ex.: `"PAC"`, `"SEDEX"`, `"MiniEnvios"`).
- `type`: categoria interna do serviço (ex.: `"express"`).
- `range`: abrangência — para os serviços dos Correios sempre `"interstate"` (envios nacionais).
- `restrictions.insurance_value`: `min`/`max` — valores mínimo/máximo permitidos de seguro (ex., PAC e SEDEX: mín. R$ 25,63, máx. R$ 38.057,59).
- `restrictions.formats.package`: limites de embalagem (`weight` kg, `width` cm, `height` cm, `length` cm — cada um com mín./máx.) e `sum` (soma altura+largura+comprimento, máximo 200 cm).
- `requirements`: dados obrigatórios para envio — `"names"` (nome remetente/destinatário) e `"addresses"` (endereço completo).
- `optionals`: serviços adicionais contratáveis — `AR` (Aviso de Recebimento), `MP` (Mão Própria), `VD` (Valor Declarado).
- `company`: `name` (`"Correios"`) e `picture` (link do logo).

**Respostas:** `200`, `400`.

---

### 5.3 Criar frete / gerar etiqueta (carrinho)

```
POST /api/v0/cart
```

**Objetivo:** enviar os detalhes de um pedido e gerar uma etiqueta de frete. A etiqueta criada fica com status `pending` (aguardando pagamento).

Para emitir a etiqueta depois de criada, há duas opções:

1. **Pagamento via painel SuperFrete** — cartão de crédito ou saldo em conta.
2. **Pagamento via API** — usar o endpoint de checkout (seção 5.4), descontando o saldo em conta.

**Corpo da requisição:**

```json
{
  "from": {
    "name": "string (obrigatório, até 50 caracteres)",
    "address": "string (obrigatório, até 50 caracteres)",
    "complement": "string (opcional, até 20 caracteres)",
    "number": "string (opcional, até 10 caracteres)",
    "district": "string (obrigatório, até 60 caracteres)",
    "city": "string (obrigatório, até 50 caracteres)",
    "state_abbr": "string (obrigatório, UF em maiúsculas, ex. SP)",
    "postal_code": "string (obrigatório, 8 dígitos)",
    "document": "string (opcional — CPF ou CNPJ)"
  },
  "to": {
    "name": "string (obrigatório, até 50 caracteres)",
    "address": "string (obrigatório, até 50 caracteres)",
    "complement": "string (opcional, até 20 caracteres)",
    "number": "string (opcional, até 10 caracteres)",
    "district": "string (obrigatório, até 50 caracteres)",
    "city": "string (obrigatório, até 50 caracteres)",
    "state_abbr": "string (obrigatório, UF em maiúsculas, ex. SP)",
    "postal_code": "string (obrigatório, 8 dígitos)",
    "email": "string (opcional — para envio do código de rastreio)",
    "phone": "string (opcional p/ Correios, Jadlog e Loggi; obrigatório p/ J&T — exatamente 11 dígitos, sem formatação, ex. 119111111111)",
    "document": "string (obrigatório — CPF ou CNPJ, exigido por todas as transportadoras p/ garantir emissão de DC-e quando aplicável)"
  },
  "service": 1,
  "products": [
    {
      "name": "string (obrigatório)",
      "quantity": "string",
      "unitary_value": "string"
    }
  ],
  "volumes": {
    "height": 0,
    "width": 0,
    "length": 0,
    "weight": 0
  },
  "options": {
    "insurance_value": 0,
    "receipt": false,
    "own_hand": false,
    "non_commercial": false,
    "invoice": {
      "number": "string (obrigatório se objeto invoice for usado, mesmo vazio — nº da nota fiscal, 44 dígitos)",
      "key": "string (opcional — chave/identificador da nota fiscal)"
    }
  },
  "tags": [
    {
      "tag": "string — identificação do pedido na sua plataforma",
      "url": "string — URL da plataforma"
    }
  ],
  "platform": "string (obrigatório — nome da sua plataforma)"
}
```

**Detalhamento dos campos:**

- **`from`** (obrigatório) — dados do remetente.
  - `name` (obrigatório): precisa ter **nome e sobrenome**. Se for o nome da loja e tiver apenas 1 palavra, adicione "Loja" antes (ex.: `SuperFrete` → `Loja SuperFrete`).
  - `address` (obrigatório): rua do remetente.
  - `complement` (opcional).
  - `number` (opcional): se não houver, enviar string vazia `""`.
  - `district` (obrigatório): se não houver, enviar `"NA"`.
  - `city` (obrigatório).
  - `state_abbr` (obrigatório): ambas letras em **caixa alta** (ex.: `"SP"`), senão não é aceito.
  - `postal_code` (obrigatório): 8 dígitos.
  - `document` (opcional): CPF ou CNPJ; se não enviado, usa o vinculado à conta.
- **`to`** (obrigatório) — dados do destinatário. Mesmas regras de `name`, `address`, `complement`, `number`, `district` (`"NA"` se vazio), `city`, `state_abbr` e `postal_code` do remetente, mais:
  - `email` (opcional): se não houver mas quiser manter o campo, enviar `null`.
  - `phone`: opcional para Correios/Jadlog/Loggi; **obrigatório para J&T** — exatamente 11 caracteres, sem formatação.
  - `document` (obrigatório): CPF/CNPJ do destinatário — obrigatório para todas as transportadoras.
- **`service`** (obrigatório, `int32`): modalidade de envio — `1` PAC, `2` SEDEX, `17` Mini Envios, `3` Jadlog, `31` Loggi, `33` J&T.
- **`products`** (array, opcional) — usado para a **declaração de conteúdo**:
  - `name`: nome do produto.
  - `quantity`: quantidade enviada no pacote.
  - `unitary_value`: valor unitário de cada produto.
  - Para usar declaração de conteúdo, enviar `options.non_commercial: true`. Para usar nota fiscal em vez da declaração, `non_commercial` deve ser `null`/omitido.
- **`volumes`** (obrigatório) — dimensões/peso do pacote **retornado pela API de cálculo do frete** (ver seção 5.1, "caixa ideal a partir de produtos"):
  - `height`, `width`, `length`, `weight` (todos obrigatórios, `float`).
- **`options`** (opcional) — serviços adicionais; se nada for enviado, todos são considerados `false`:
  - `insurance_value` (float): valor da encomenda (sem o frete) para adicionar seguro; enviar `null` caso não use.
  - `receipt` (boolean): confirmação de recebimento.
  - `own_hand` (boolean): mão própria.
  - `non_commercial` (boolean): `true` para usar declaração de conteúdo; `false`/omitido para exigir nota fiscal. **Atenção:** se não for passado ou for `false`, a Nota Fiscal se torna obrigatória.
  - `invoice` (object): nota fiscal — enviar o frete sem declaração de conteúdo, apenas com a nota fiscal (ainda será necessário imprimir e anexar a NF ao pacote fisicamente).
    - `number` (obrigatório, mesmo vazio): número da nota fiscal (44 dígitos).
    - `key` (opcional): identificador da nota fiscal.
- **`tags`** (array de objetos, opcional):
  - `tag`: identificação do pedido na sua plataforma.
  - `url`: URL da plataforma.
- **`platform`** (obrigatório, string): nome da sua plataforma.

**Status possíveis da etiqueta:**

| Status | Significado |
|---|---|
| `pending` | Aguardando emissão (pagamento) |
| `released` | Aguardando postagem |
| `posted` | Postado |
| `delivered` | Entregue |
| `cancelled` | Cancelado |

> 📘 **Código de rastreio:** só fica disponível a partir do status `released`. Para obtê-lo, consulte o endpoint de "Informações do pedido" (seção 5.5) usando o `id` da etiqueta gerada — o campo `tracking` trará a informação.

**Respostas:** `200`, `400`.

---

### 5.4 Finalizar pedido e gerar etiqueta (checkout / pagamento)

```
POST /api/v0/checkout
```

**Objetivo:** pagar uma etiqueta de frete previamente gerada, utilizando o **saldo disponível** na conta SuperFrete.

> 🚧 **Pré-requisito:** possuir saldo suficiente na carteira SuperFrete.

**Como adicionar saldo (Produção):**

1. Acesse `https://web.superfrete.com/#/calcular-correios`.
2. Menu **Perfil** → **Carteira**.
3. Clique em **Recarregue com Pix**.
4. Escolha o valor e clique em **Recarregar com pix**.
5. Pague o código Pix gerado pelo seu banco.
6. Após confirmação, o crédito é adicionado automaticamente ao saldo.

**Como adicionar saldo (Sandbox / testes):** ver seção 3.3.

> 📘 Etiquetas geradas em Sandbox não têm validade para postagem real; a recarga em Sandbox serve apenas para testar a integração.

**Corpo da requisição:**

```json
{
  "orders": ["id_da_etiqueta_1", "id_da_etiqueta_2"]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `orders` | array de strings | Sim | IDs das etiquetas geradas pelo endpoint de criação de frete (seção 5.3) a serem pagas. |

Se a requisição for concluída com sucesso (ID válido + saldo suficiente), o status da etiqueta muda para `released` (pronta para postagem).

**Respostas:** `200`, `400`.

---

### 5.5 Informações do pedido (consultar etiqueta)

```
GET /api/v0/order/info/{id}
```

**Objetivo:** recuperar informações detalhadas de uma etiqueta específica pelo seu `id`.

**Path params:** `id` (string, obrigatório) — ID do pedido SuperFrete.

**Campos retornados (JSON):**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | ID único da etiqueta. |
| `protocol` | string | Identificador de protocolo interno (geralmente idêntico ao `id`). |
| `format` | string | Formato da embalagem (ex.: `"box"`). |
| `delivery` | integer | Prazo de entrega em dias úteis (do momento do cálculo). |
| `delivery_min` / `delivery_max` | integer | Prazo mínimo/máximo de entrega em dias úteis. |
| `discount` | float | Valor do desconto aplicado (se houver). |
| `height` / `width` / `length` | string | Dimensões da embalagem em cm. |
| `weight` | string | Peso da embalagem em kg. |
| `from` | object | Dados do remetente: `address`, `city`, `complement`, `email`, `district`, `document`, `name`, `location_number`, `postal_code`, `state_abbr`, `country_id` (sempre `"BR"`). |
| `to` | object | Dados do destinatário: mesmos campos de `from` (exceto `email`). |
| `invoice` | object ou null | Detalhes da nota fiscal, se utilizada; `null` se usada declaração de conteúdo. |
| `own_hand` | boolean | Se Mão Própria foi solicitada. |
| `receipt` | boolean | Se Aviso de Recebimento foi solicitado. |
| `price` | float | Valor total do frete. |
| `tracking` | string ou null | Código de rastreamento — só preenchido após status `released` ou posterior. |
| `status` | string | `pending`, `released`, `posted`, `delivered`, `canceled`. |
| `service_id` | integer | Código do serviço (`1` PAC, `2` SEDEX, `17` Mini Envios, etc.). |
| `products` | array | Produtos declarados: `name`, `quantity`, `unitary_value`. |
| `insurance_value` | float ou null | Valor do seguro declarado, se houver. |
| `generated_at` | string (ISO 8601 UTC) | Data/hora de geração da etiqueta. |
| `posted_at` | string ou null (ISO 8601 UTC) | Data/hora de postagem (null até ser postada). |
| `created_at` | string (ISO 8601 UTC) | Data/hora de criação do pedido. |
| `updated_at` | string (ISO 8601 UTC) | Data/hora da última atualização. |
| `print.url` | string | URL do PDF da etiqueta para impressão. |
| `tags` | array de objetos | `tag` e `url` — identificação do pedido na plataforma de origem. |

**Respostas:** `200`, `400`.

---

### 5.6 Link para impressão da etiqueta

```
POST /api/v0/tag/print
```

**Objetivo:** retorna a URL da etiqueta em formato PDF, a partir dos IDs de pedidos informados.

**Corpo da requisição:**

```json
{
  "orders": ["01JK6D99A7SVYXV03C3ZFS7CXA"]
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `orders` | array de strings | IDs das etiquetas a imprimir. |

> Para baixar a etiqueta em formato **A6 (Zebra)**: acesse a SuperFrete → menu **Etiquetas** → **Configurações** → ative a opção **A6 (Zebra)**. A partir daí, todas as etiquetas geradas serão enviadas automaticamente nesse formato.

**Respostas:** `200`, `400`.

---

### 5.7 Listar etiquetas

```
GET /api/v0/me/orders
```

**Objetivo:** listar os envios/pedidos do usuário autenticado, com filtros, paginação e ordenação.

> 🚧 **Pré-requisito:** informar o e-mail cadastrado na SuperFrete (via header, ver abaixo) e o token do ambiente configurado.

Sem filtro, retorna todas as etiquetas de todos os status, **20 por página**.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `status` | string | Filtra por status: `pending`, `released`, `posted`, `delivered`, `canceled`. Sem ele, retorna todos. |
| `page` | string | Número da página (ex.: `1`, `2`, `3`...). |
| `per_page` | string | Número de resultados por página. |
| `order` | string | `asc`/`desc`. Sozinho, ordena pela data de criação; associado a `sort_by`, usa a data definida em `sort_by`. |
| `sort_by` | string | Critério de ordenação: `created_at` ou `updated_at`. |

**Headers:**

| Header | Descrição |
|---|---|
| `User-agent` | Identificação de e-mail SuperFrete do usuário (ex.: `Aplicação (listaretiquetas@superfrete.com)`). |

**Resposta:** inclui volume total de etiquetas, volume por página, página atual, última página, e para cada etiqueta: ID, status, transportadora, tracking, preço do frete (valor de balcão, desconto SuperFrete, valor com desconto), prazo de entrega (e mín./máx.), dados do remetente (nome, telefone, documento, CEP, endereço, número, complemento, UF, cidade, bairro), dados do destinatário (idem + e-mail), dados do ponto de postagem (se aplicável), data de criação e de última atualização.

**Respostas:** `200`, `400`.

---

### 5.8 Cancelar pedido

```
POST /api/v0/order/cancel
```

**Objetivo:** cancelar uma etiqueta de frete, respeitando as regras de cancelamento da SuperFrete.

**Corpo da requisição:**

```json
{
  "order": {
    "id": "string (obrigatório)",
    "description": "string (obrigatório, ex.: 'Cancelado pelo usuário')"
  }
}
```

> **Importante:**
> - Só é possível cancelar etiquetas **que ainda não foram postadas**.
> - Após o cancelamento bem-sucedido, o valor é **estornado diretamente para a carteira** no aplicativo.
> - Se o pedido não for elegível (ex.: já postado ou já utilizado), a API retorna um erro informando o motivo.

**Respostas:** `200`, `400`.

---

### 5.9 Listar endereços

```
GET /api/v0/user/addresses
```

**Objetivo:** retorna os endereços cadastrados na conta (equivalente ao campo "Meus Endereços" em Perfil).

**Resposta:** para cada endereço — CEP, logradouro, número, bairro, cidade e estado.

**Respostas:** `200`, `400`.

---

### 5.10 Buscar informações do usuário

```
GET /api/v0/user
```

**Objetivo:** retorna informações da conta SuperFrete associada ao token de autenticação.

**Campos retornados:**

| Campo | Descrição |
|---|---|
| `firstname` | Primeiro nome do usuário. |
| `lastname` | Sobrenome do usuário. |
| `phone` | Telefone de contato. |
| `email` | E-mail cadastrado. |
| `document` | CPF do usuário. |
| `limits` | Limites de uso da conta. |
| `shipments` | Quantidade de etiquetas aguardando postagem. |
| `shipments_available` | Limite restante de etiquetas para aguardar postagem. |
| `balance` | Saldo total na conta. |

**Respostas:** `200`, `400`.

---

## 6. Webhooks

A integração via Webhooks permite configurar, listar, atualizar e remover **"webhook apps"** para receber notificações em tempo real sobre eventos de pedidos. Quando um evento configurado ocorre, a SuperFrete envia um `POST` com um payload JSON para a URL cadastrada.

### 6.1 Autenticação

Todos os endpoints de Webhook exigem autenticação via token JWT no header:

```
Authorization: Bearer {token}
```

O token é o mesmo token de integração gerado no painel da SuperFrete (Produção ou Sandbox — ver seção 3.1).

### 6.2 Eventos disponíveis

| Evento | Disparado quando... |
|---|---|
| `order.created` | o pedido é criado |
| `order.released` | o pedido é pago |
| `order.generated` | a etiqueta do pedido é gerada |
| `order.posted` | o pedido é postado |
| `order.delivered` | o pedido é entregue no destino |
| `order.cancelled` | o pedido é cancelado |

**Exemplo de payload recebido** (os campos `tracking` e `tracking_url` só ficam disponíveis a partir do evento `order.generated`):

```json
{
  "event": "order.delivered",
  "data": {
    "protocol": null,
    "id": "[id]",
    "status": "delivered",
    "tracking": "[tracking]",
    "self_tracking": null,
    "user_id": "[uid]",
    "tags": [
      { "tag": "tag1", "url": "www.url1.com" }
    ],
    "created_at": "2024-03-29T23:49:26+00:00",
    "paid_at": "2024-03-29T23:50:47+00:00",
    "generated_at": "2024-03-29T23:51:47+00:00",
    "posted_at": "2024-03-29T23:55:00+00:00",
    "delivered_at": "2024-03-29T23:57:47+00:00",
    "canceled_at": null,
    "expired_at": null,
    "tracking_url": "rastreio.superfrete.com/#/tracking/[tracking_id]"
  }
}
```

### 6.3 Política de reenvio e validação

- Se o envio da notificação falhar ou não houver resposta após **timeout de 30 segundos**, o sistema reenvia após **15 minutos**.
- São feitas até **5 tentativas** antes de descartar a notificação.
- A URL informada ao criar/atualizar um Webhook App deve ser válida, acessível, e **do tipo POST**. URLs inválidas ou que não respondem podem causar falhas nas notificações.

### 6.4 Segurança e assinatura (`X-ME-Signature`)

Toda notificação enviada inclui o header `X-ME-Signature`, contendo uma assinatura **HMAC-SHA256** gerada a partir do corpo da requisição e do `secret_token` fornecido na criação do Webhook App. O destinatário deve validar essa assinatura para garantir integridade e autenticidade.

**Processo de validação:**

1. **Receber o webhook**: capture o payload da requisição recebida, exatamente como foi enviado.
2. **Recuperar o `secret_token`**: o mesmo fornecido na criação do Webhook App — deve ser mantido em segredo.
3. **Gerar assinatura local**: use `secret_token` + corpo da requisição (payload) para gerar uma assinatura HMAC-SHA256 localmente.
4. **Comparar assinaturas**: compare a assinatura gerada localmente com a recebida no header `X-ME-Signature`. Se forem iguais, a requisição é válida e não foi alterada.

**Observações importantes:**

- O payload deve ser processado **exatamente como recebido** — qualquer alteração invalida a assinatura.
- O `secret_token` é uma chave secreta e deve ser mantido seguro no servidor — **nunca exponha publicamente**.
- A assinatura só é gerada corretamente com o `secret_token` correto (o mesmo gerado na criação do webhook).

### 6.5 Criar webhook app

```
POST /api/v0/webhook
```

**Objetivo:** cadastra um webhook para receber notificações de eventos (pedidos gerados, etiquetas emitidas etc.).

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name` | string | Sim | Nome do Webhook App. |
| `url` | string | Sim | URL que receberá as notificações. |
| `events` | array de strings | Não | Lista de eventos a acompanhar (ver seção 6.2). |

**Resposta:** informações do webhook criado (identificador, URL, eventos associados).

**Respostas:** `201`, `400`.

### 6.6 Listar Webhook Apps

```
GET /api/v0/webhook
```

**Objetivo:** retorna todos os Webhook Apps cadastrados na conta autenticada, com identificador, URL e eventos associados de cada um.

**Respostas:** `200`, `400`.

### 6.7 Atualizar Webhook App

```
PUT /api/v0/webhook/{id}
```

**Objetivo:** atualizar um Webhook App já cadastrado (URL, eventos monitorados etc.). Apenas os campos enviados na requisição são atualizados.

**Path params:** `id` (string, obrigatório) — identificador do Webhook App.

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name` | string | Não | Novo nome do Webhook App. |
| `url` | string | Não | Nova URL para receber notificações. |
| `events` | array de strings | Não | Nova lista de eventos. |
| `is_active` | boolean | Não | Ativar ou desativar o webhook. |

**Respostas:** `200`, `400`.

### 6.8 Deletar Webhook app

```
DELETE /api/v0/webhook/{id}
```

**Objetivo:** remove um Webhook App cadastrado. Após a remoção, ele deixa de receber notificações.

**Path params:** `id` (string, obrigatório) — identificador do Webhook App a deletar.

> 🚧 **Importante:** a remoção é **definitiva** e não pode ser desfeita.

**Respostas:** `204`, `400`.

---

## 7. Códigos de erro

A API pode retornar os seguintes tipos de erro (padrão de erros gRPC/Google API):

```
'cancelled' | 'unknown' | 'invalid-argument' | 'deadline-exceeded' | 'not-found' |
'already-exists' | 'permission-denied' | 'resource-exhausted' | 'failed-precondition' |
'aborted' | 'out-of-range' | 'unimplemented' | 'internal' | 'unavailable' |
'data-loss' | 'unauthenticated'
```

---

## 8. Fluxo de integração recomendado (resumo end-to-end)

1. **Gerar token** (manual, seção 3.1) ou concluir fluxo **OAuth 2.0** (seção 3.2, apenas para multiloja).
2. **Calcular o frete** — `POST /api/v0/calculator` (seção 5.1) enviando CEP de origem/destino e produtos ou pacote. Guardar as dimensões da **caixa ideal** retornadas quando `products` for usado.
3. (Opcional) **Consultar limites dos Correios** — `GET /api/v0/services/info` (seção 5.2).
4. **Criar a etiqueta** — `POST /api/v0/cart` (seção 5.3), usando os dados de remetente/destinatário e o `volumes` retornado no passo 2. A etiqueta nasce com status `pending`.
5. **Pagar a etiqueta**:
   - Pelo painel SuperFrete (cartão ou saldo), **ou**
   - Via API — `POST /api/v0/checkout` (seção 5.4), usando o `id` do passo 4 e saldo em conta.
   - Após o pagamento, o status muda para `released`.
6. **Obter o link de impressão** — `POST /api/v0/tag/print` (seção 5.6) ou consultar `print.url` em `GET /api/v0/order/info/{id}` (seção 5.5).
7. **Acompanhar o pedido**:
   - Consultando `GET /api/v0/order/info/{id}` (rastreio disponível a partir de `released`), e/ou
   - Configurando **Webhooks** (seção 6) para receber os eventos `order.created`, `order.released`, `order.generated`, `order.posted`, `order.delivered`, `order.cancelled` em tempo real.
8. Se necessário, **cancelar** — `POST /api/v0/order/cancel` (seção 5.8), apenas antes da postagem; o valor é estornado à carteira.

---

## 9. Referência rápida de endpoints

| Endpoint | Método | Path |
|---|---|---|
| Solicitar token OAuth | `POST` | `/api/v0/oauth/token` |
| Cotação de frete | `POST` | `/api/v0/calculator` |
| Informações dos pacotes (Correios) | `GET` | `/api/v0/services/info` |
| Criar frete / etiqueta | `POST` | `/api/v0/cart` |
| Finalizar pedido (pagar etiqueta) | `POST` | `/api/v0/checkout` |
| Informações do pedido | `GET` | `/api/v0/order/info/{id}` |
| Link para impressão da etiqueta | `POST` | `/api/v0/tag/print` |
| Listar etiquetas | `GET` | `/api/v0/me/orders` |
| Cancelar pedido | `POST` | `/api/v0/order/cancel` |
| Listar endereços | `GET` | `/api/v0/user/addresses` |
| Buscar informações do usuário | `GET` | `/api/v0/user` |
| Criar webhook app | `POST` | `/api/v0/webhook` |
| Listar webhook apps | `GET` | `/api/v0/webhook` |
| Atualizar webhook app | `PUT` | `/api/v0/webhook/{id}` |
| Deletar webhook app | `DELETE` | `/api/v0/webhook/{id}` |

---

*Fonte: documentação oficial da API SuperFrete — https://superfrete.readme.io (seções: Primeiros passos, Autenticação OAuth, Solicitação do token, Cálculo de frete, Cotação de frete, Informações dos pacotes, Criar frete para a SuperFrete, Finalizar pedido e gerar etiqueta, Informações do pedido, Link para impressão da etiqueta, Listar etiquetas, Cancelar pedido, Listar endereços, Buscar informações do usuário, Webhook e endpoints de Webhook App).*
