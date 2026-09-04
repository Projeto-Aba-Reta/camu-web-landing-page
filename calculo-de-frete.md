# Cálculo de Frete — Especificação de Integração

Documento de referência para reimplementar o cálculo de frete deste e-commerce
em outro serviço/linguagem/plataforma. Descreve o fluxo completo, contratos de
dados, variáveis de ambiente e regras de negócio observadas no código atual
(Next.js App Router).

---

## 1. Visão geral

O frete é calculado **em tempo real** via API do **Melhor Envio**
(endpoint `POST /me/shipment/calculate`), que retorna cotações de múltiplas
transportadoras (Correios PAC/SEDEX, Jadlog, etc.).

Fluxo resumido:

```
[Cliente digita CEP (8 dígitos)]
        │
        ▼
[Consulta ViaCEP para preencher endereço]   → https://viacep.com.br/ws/{cep}/json/
        │
        ▼
[Frontend monta pacote: peso, dimensões, valor do seguro]
        │
        ▼
[POST /api/frete/cotar]  (rota interna — proxy que esconde o token)
        │
        ▼
[POST {MELHOR_ENVIO_API_URL}/me/shipment/calculate]  (Bearer token)
        │
        ▼
[Normaliza resposta → lista de opções de frete]
        │
        ▼
[Frontend filtra por env, ordena, seleciona a 1ª opção por padrão]
        │
        ▼
[shippingCost = opção selecionada .price ; total = subtotal + shippingCost]
```

> **Por que existe a rota interna `/api/frete/cotar`?**
> O token do Melhor Envio é secreto e não pode ir para o browser. A rota
> server-side recebe a requisição do frontend, injeta o `Authorization: Bearer`,
> chama o Melhor Envio e devolve uma resposta já normalizada.

---

## 2. Variáveis de ambiente

| Variável | Onde | Obrigatória | Descrição |
|---|---|---|---|
| `MELHOR_ENVIO_API_URL` | server | sim | Base URL da API. Sandbox: `https://sandbox.melhorenvio.com.br/api/v2` · Produção: `https://melhorenvio.com.br/api/v2` |
| `MELHOR_ENVIO_TOKEN` | server | sim | Bearer token (OAuth2) da conta Melhor Envio. Sem ele a rota retorna HTTP 500 `{ "error": "Token do Melhor Envio não configurado" }` |
| `NEXT_PUBLIC_ALLOWED_SHIPPING_IDS` | client | não | Lista de `service_id` permitidos, separada por vírgula (ex.: `"1,2,3"`). Se ausente, todas as opções são exibidas. Usada para restringir quais serviços aparecem ao cliente. |

**CEP de origem (remetente):** hardcoded no código em `lib/utils.ts` →
`getOriginZipCode()` retorna `"05140140"`. Ao portar, torne isso configurável
(ex.: `STORE_ORIGIN_ZIPCODE`).

**User-Agent exigido pelo Melhor Envio:** todas as chamadas enviam
`User-Agent: Ecommerce Roupas (contato@seudominio.com)`. O Melhor Envio
**exige** um User-Agent com e-mail de contato válido; troque pelo seu.

---

## 3. Contrato: Frontend → `POST /api/frete/cotar`

### Request body (JSON)

```json
{
  "from": { "postal_code": "05140140" },
  "to":   { "postal_code": "12247720" },
  "package": {
    "height": 4,
    "width": 12,
    "length": 17,
    "weight": 0.9
  },
  "insurance_value": 199.90
}
```

| Campo | Tipo | Regra |
|---|---|---|
| `from.postal_code` | string | CEP de origem. Limpo com `cleanZipCode()` (só dígitos, exatamente 8). Inválido → HTTP 400 `CEP de origem inválido`. |
| `to.postal_code` | string | CEP de destino. Mesma validação. Inválido → HTTP 400 `CEP de destino inválido`. |
| `package.height` | number (cm) | Padrão do projeto: **4** |
| `package.width` | number (cm) | Padrão do projeto: **12** |
| `package.length` | number (cm) | Padrão do projeto: **17** |
| `package.weight` | number (kg) | **Somatório**: `Σ (item.weight ?? 0.50) × item.quantity`. Fallback por item = **0,3 kg** em `shipping-service.ts` e **0,5 kg** em `shipping-form.tsx` (inconsistência do código atual — padronize em um só valor ao portar). |
| `insurance_value` | number (R$) | Valor total dos itens p/ seguro: `Σ (item.price ?? 10.1) × item.quantity`. Default `0` se ausente. |

### Regras de cálculo do pacote (frontend)

```
pesoTotal      = soma de (peso_do_item_kg * quantidade)   // peso_do_item_kg default 0.5 (ou 0.3)
valorSeguro    = soma de (preco_do_item * quantidade)
dimensoes      = { height: 4, width: 12, length: 17 }     // caixa única fixa
```

> Observação: o projeto usa **uma única caixa fixa** para qualquer carrinho.
> Não há cubagem por item nem múltiplos volumes. Ao portar, considere se
> precisa de dimensões dinâmicas.

---

## 4. Contrato: `/api/frete/cotar` → Melhor Envio

### Endpoint

```
POST {MELHOR_ENVIO_API_URL}/me/shipment/calculate
```

### Headers

```
Authorization: Bearer {MELHOR_ENVIO_TOKEN}
Accept: application/json
Content-Type: application/json
User-Agent: Ecommerce Roupas (contato@seudominio.com)
```

### Payload enviado (formato principal)

```json
{
  "from": { "postal_code": "05140140" },
  "to":   { "postal_code": "12247720" },
  "package": { "height": 4, "width": 12, "length": 17, "weight": 0.9 },
  "options": {
    "receipt": false,
    "own_hand": false,
    "insurance_value": 199.90
  }
}
```

### Estratégia de fallback (código atual)

A rota tenta variações caso a primeira falhe:

1. **POST** com `from`/`to` como objeto `{ postal_code }` (acima) — formato canônico.
2. Se `!response.ok`: **POST** com `from`/`to` como **string** do CEP puro.
3. Se `status === 405`: **GET** com os mesmos dados em query params (`from`, `to`, `package`, `options` como JSON stringificado).

> Recomendação ao portar: use **apenas o formato 1** (objeto `{ postal_code }`),
> que é o documentado pelo Melhor Envio. Os fallbacks são gambiarra defensiva.

### Resposta do Melhor Envio (array)

```json
[
  {
    "id": 1,
    "name": "PAC",
    "price": "23.90",
    "custom_price": "23.90",
    "delivery_time": 6,
    "custom_delivery_time": 6,
    "company": { "id": 1, "name": "Correios" },
    "error": null
  },
  {
    "id": 3,
    "name": "SEDEX",
    "price": "39.90",
    "delivery_time": 2,
    "company": { "name": "Correios" }
  },
  {
    "id": 15,
    "name": ".Package",
    "error": "Este serviço não atende o trecho informado."
  }
]
```

Itens com `error` preenchido = serviço indisponível para aquele trecho.

---

## 5. Contrato: `/api/frete/cotar` → Frontend (resposta normalizada)

A rota mapeia a resposta do Melhor Envio para:

```json
[
  {
    "name": "PAC",
    "price": 23.90,
    "delivery_time": 6,
    "company": "Correios",
    "service_id": 1,
    "error": null
  }
]
```

Regras de normalização:

| Campo saída | Origem | Lógica |
|---|---|---|
| `name` | `item.name` | — |
| `price` | `item.custom_price ?? item.price ?? '0'` | `parseFloat` |
| `delivery_time` | `item.custom_delivery_time ?? item.delivery_time ?? 0` | dias úteis |
| `company` | `item.company?.name ?? 'Transportadora'` | — |
| `service_id` | `item.id` | — |
| `error` | `item.error ?? null` | repassado p/ o frontend filtrar |

Erros da rota:

| Situação | HTTP | Body |
|---|---|---|
| Token ausente | 500 | `{ "error": "Token do Melhor Envio não configurado" }` |
| CEP origem/destino inválido | 400 | `{ "error": "...", "details": { "received": ... } }` |
| Falha na API Melhor Envio | status da API | `{ "error": "Erro ao calcular frete", "details": {...} }` |
| Exceção interna | 500 | `{ "error": "Erro interno ao buscar cotações", "details": "..." }` |

---

## 6. Processamento final no Frontend

Em `components/checkout/shipping-form.tsx`:

1. Rejeita a resposta se vazia, ou se **todas** as opções têm `error`
   → toast "Nenhuma opção de frete disponível para este CEP".
2. `filter(c => !c.error && c.price)` — mantém só opções válidas com preço.
3. `map` para o tipo `ShippingMethod`:
   ```ts
   {
     id: String(cotacao.service_id),
     name: `${cotacao.name} (${delivery_time} dia(s) útil(eis))`,
     price: Number(cotacao.price),
     carrier: cotacao.company,
     service: cotacao.name,
     estimatedDelivery: `${delivery_time} dia(s) útil(eis)`
   }
   ```
4. Filtro opcional por `NEXT_PUBLIC_ALLOWED_SHIPPING_IDS`.
5. Seleciona automaticamente a **primeira** opção da lista (não é a mais barata —
   é a ordem retornada pela API).
6. `shippingCost = selectedShipping.price`
7. `total = subtotal + shippingCost` (ver `app/(store)/checkout/page.tsx`).

### Tipo `ShippingMethod` (`types/checkout.ts`)

```ts
interface ShippingMethod {
  id: string
  name: string
  price: number
  carrier: string
  service: string
  estimatedDelivery?: string
}
```

---

## 7. Consulta de endereço por CEP (ViaCEP)

Independente do Melhor Envio. Chamado no `onChange` do campo CEP quando atinge 8 dígitos:

```
GET https://viacep.com.br/ws/{cep}/json/
```

Resposta relevante: `logradouro`, `bairro`, `localidade` (cidade), `uf` (estado).
`{ "erro": true }` → CEP não encontrado. Sem token, sem rate limit relevante.

---

## 8. Checklist para reimplementar em outro serviço

- [ ] Criar conta no Melhor Envio e gerar token OAuth2 (sandbox + produção).
- [ ] Configurar `MELHOR_ENVIO_API_URL`, `MELHOR_ENVIO_TOKEN`.
- [ ] Definir CEP de origem configurável (hoje hardcoded `05140140`).
- [ ] Definir `User-Agent` com e-mail de contato real.
- [ ] Endpoint server-side que:
  - valida/limpa CEPs (regex `\D` removido, exige 8 dígitos);
  - calcula `weight = Σ item.weight×qty` (padronizar fallback: 0,3 **ou** 0,5 kg/item);
  - calcula `insurance_value = Σ item.price×qty`;
  - usa caixa fixa `{4, 12, 17}` cm (ou implementar cubagem);
  - chama `POST /me/shipment/calculate` com header Bearer;
  - normaliza a resposta (price = `custom_price ?? price`, company = `company.name`);
  - filtra itens com `error`.
- [ ] Frontend: seleção default = 1ª opção; `total = subtotal + frete`.
- [ ] (Opcional) Allowlist de `service_id`.
- [ ] Consulta ViaCEP para auto-preenchimento de endereço.
- [ ] Tratar todos os caminhos de erro com mensagem amigável.

---

## 9. Arquivos de referência no repositório

| Arquivo | Papel |
|---|---|
| `app/api/frete/cotar/route.ts` | Proxy server-side p/ Melhor Envio + normalização |
| `app/api/frete/test/route.ts` | Rota de diagnóstico (dois formatos de payload) |
| `lib/shipping-service.ts` | Helper `fetchShippingMethods()` + stubs (label, tracking) |
| `components/checkout/shipping-form.tsx` | UI, cálculo do pacote, ViaCEP, filtro, seleção |
| `components/checkout/order-summary.tsx` | Exibe frete e total |
| `app/(store)/checkout/page.tsx` | `shippingCost` e `total` |
| `lib/utils.ts` | `getOriginZipCode()`, `cleanZipCode()` |
| `types/checkout.ts` | Tipo `ShippingMethod` |

## 10. Pendências / stubs não implementados

Em `lib/shipping-service.ts` são apenas placeholders (retornam valores fixos):

- `calculateDeliveryTime()` → `"3-5 dias úteis"`
- `generateShippingLabel()` → `"LABEL-{orderId}"`
- `trackPackage()` → objeto estático

Para geração de etiqueta e rastreio reais, usar o fluxo de carrinho/checkout do
Melhor Envio (`/me/cart`, `/me/shipment/checkout`, `/me/shipment/generate`,
`/me/shipment/tracking`).
