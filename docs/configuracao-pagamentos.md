# Configuração do gateway de pagamento

O site processa checkouts atrás de uma interface única (`src/lib/payments/`).
Um único `.env` (`PAYMENT_GATEWAY`) decide qual gateway está ativo — **Mercado
Pago** ou **Stripe**. Os dois ficam no código; só o escolhido cria sessões de
pagamento e é reconciliado.

Trocar de gateway **não exige migration**: o id da sessão (preferência do MP ou
`cs_...` do Stripe) reaproveita a coluna `orders.mp_preference_id`.

---

## 1. Como o fluxo funciona

```
checkout  →  gateway.createCheckout()  →  redireciona o cliente pro gateway
                                          (salva sessionId em orders.mp_preference_id)

cliente paga no gateway
      │
      ├─ webhook  →  /api/webhooks/{mercadopago|stripe}  →  applyPaymentStatus()
      │
      └─ volta pro site  →  /pedido/confirmado/[code]  →  reconcile() (fallback
                                                          se o webhook não chegou)
```

- **Redirect de volta (success/cancel):** montado automaticamente pelo código a
  partir de `NEXT_PUBLIC_SITE_URL`. **Você não configura isso no painel** de
  nenhum dos dois gateways.
  - sucesso / pendente → `{SITE_URL}/pedido/confirmado/{order_code}`
  - falha / cancelou → `{SITE_URL}/checkout?erro=pagamento&pedido={order_code}`
- **Webhook:** você **precisa** cadastrar a URL no painel do gateway (produção)
  ou rodar um túnel local (dev). É o que confirma o pagamento de forma confiável.
- **Status:** o Stripe é normalizado pro vocabulário do Mercado Pago
  (`approved` / `pending` / `in_process` / `rejected` / `cancelled` /
  `refunded`). A página de confirmação e a timeline do pedido só entendem esse
  vocabulário.

---

## 2. Variáveis de ambiente

Em `.env.local` (nunca commitar):

```bash
# Qual gateway processa os checkouts
PAYMENT_GATEWAY=mercadopago         # ou: stripe

# Base usada nos redirects e nos webhooks
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # em produção: https://www.camu.com.br

# --- Mercado Pago (quando PAYMENT_GATEWAY=mercadopago) ---
MP_ACCESS_TOKEN=APP_USR-...          # use as credenciais de TESTE em dev

# --- Stripe (quando PAYMENT_GATEWAY=stripe) ---
STRIPE_SECRET_KEY=sk_test_...        # sk_live_... em produção
STRIPE_WEBHOOK_SECRET=whsec_...      # signing secret do endpoint (ver abaixo)

# Dev: pula o gateway e marca o pedido como pago na hora.
# Só funciona com NEXT_PUBLIC_SITE_URL apontando pra localhost.
PAYMENTS_SKIP_ENABLED=true
```

> Em produção **remova** `PAYMENTS_SKIP_ENABLED` (ou deixe diferente de `true`).
> Fora de localhost ela já é ignorada, mas melhor não depender disso.

---

## 3. Mercado Pago

### 3.1 Credenciais

1. <https://www.mercadopago.com.br/developers/panel/app> → sua aplicação.
2. Copie o **Access Token**:
   - **Credenciais de teste** → `.env.local` de dev.
   - **Credenciais de produção** → variáveis de ambiente do deploy.
3. Cole em `MP_ACCESS_TOKEN`.

### 3.2 Webhook (produção)

1. No painel da aplicação → **Webhooks** / **Notificações** → **Configurar
   notificações**.
2. **URL de produção:**
   ```
   https://www.camu.com.br/api/webhooks/mercadopago
   ```
3. **Eventos:** marque **Pagamentos** (`payment`). O handler ignora o resto.
4. Salve. O MP passa a chamar essa URL a cada mudança de status de pagamento.

> O `notification_url` também é enviado embutido em cada preferência pelo próprio
> código quando `NEXT_PUBLIC_SITE_URL` é público (https, não-localhost). Cadastrar
> no painel é o backup e cobre reentregas.

### 3.3 Dev / localhost

O MP **não alcança** `localhost`. Duas opções:

- **Sem webhook:** deixe `PAYMENTS_SKIP_ENABLED=true` e o checkout nem vai pro MP.
- **Com MP de teste:** exponha a porta 3000 com um túnel (ver §5) e cadastre
  `https://SEU-TUNEL/api/webhooks/mercadopago` no painel. Sem túnel, a página
  `/pedido/confirmado/[code]` ainda reconcilia sozinha ao ser aberta (busca o
  pagamento por `external_reference`).

### 3.4 Cartões de teste

<https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards>

---

## 4. Stripe

### 4.1 Credenciais

1. <https://dashboard.stripe.com/apikeys> (ative o **modo de teste** no topo).
2. Copie a **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`.
3. Em produção, repita com a chave `sk_live_...` (exige a conta ativada).
4. A moeda das sessões é fixada em **BRL** no código.

### 4.2 Webhook (produção)

1. <https://dashboard.stripe.com/webhooks> → **Add endpoint**.
2. **Endpoint URL:**
   ```
   https://www.camu.com.br/api/webhooks/stripe
   ```
3. **Eventos a escutar** (Select events):
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
4. **Add endpoint** → abra o endpoint criado → **Signing secret** → **Reveal** →
   copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.
5. Faça o redeploy pra nova env valer.

> Sem `STRIPE_WEBHOOK_SECRET` o handler **não valida a assinatura** (aceita o
> payload cru). Isso é só pra dev — **nunca** deixe assim em produção.

### 4.3 Dev / localhost — Stripe CLI (recomendado)

```bash
# 1. instale e faça login
stripe login

# 2. encaminhe os eventos pro seu servidor local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

O comando imprime um `whsec_...` **temporário** — cole em `STRIPE_WEBHOOK_SECRET`
no `.env.local` e reinicie o `npm run dev`.

Disparar um evento de teste:

```bash
stripe trigger checkout.session.completed
```

### 4.4 Cartões de teste

| Cenário            | Número                |
|--------------------|-----------------------|
| Aprovado           | `4242 4242 4242 4242` |
| Requer autenticação| `4000 0025 0000 3155` |
| Recusado           | `4000 0000 0000 9995` |

Qualquer data futura, qualquer CVC, qualquer CEP.
<https://docs.stripe.com/testing>

---

## 5. Túnel local (para testar webhook real do Mercado Pago)

Necessário só pro MP — o Stripe usa a CLI (§4.3).

```bash
# opção A: cloudflared
cloudflared tunnel --url http://localhost:3000

# opção B: ngrok
ngrok http 3000
```

Pegue a URL `https://...` gerada e:

1. `NEXT_PUBLIC_SITE_URL=https://SEU-TUNEL` no `.env.local` (reinicie o dev).
2. Cadastre `https://SEU-TUNEL/api/webhooks/mercadopago` no painel do MP.

---

## 6. Trocar de gateway

1. Ajuste `PAYMENT_GATEWAY` e preencha as chaves do gateway novo.
2. Redeploy.
3. Confira que o webhook do novo gateway está cadastrado e ativo (§3.2 / §4.2).
4. Pedidos antigos continuam consultáveis; a reconciliação usa o gateway que
   estiver ativo no momento, então pedidos em aberto criados no gateway anterior
   podem não reconciliar sozinhos — confirme manualmente pelo painel se preciso.

---

## 7. Checklist de produção

- [ ] `PAYMENT_GATEWAY` definido
- [ ] `NEXT_PUBLIC_SITE_URL` = domínio real (https)
- [ ] chave secreta do gateway ativo (produção, não teste)
- [ ] endpoint de webhook cadastrado no painel apontando pro domínio real
- [ ] `STRIPE_WEBHOOK_SECRET` preenchido (se Stripe)
- [ ] `PAYMENTS_SKIP_ENABLED` **removido** ou ≠ `true`
- [ ] compra de ponta a ponta testada: checkout → pagamento → webhook →
      `/pedido/confirmado/[code]` mostra "Pedido confirmado" → status `paid`
