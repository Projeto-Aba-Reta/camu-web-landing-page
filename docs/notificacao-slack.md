# Notificação de venda no Slack

Quando um pedido é **pago pela primeira vez** (qualquer gateway: Stripe, Mercado
Pago ou AbacatePay), o site dispara uma notificação de venda em todos os canais
configurados. Hoje são dois:

| Canal | Onde chega | Variável de ambiente |
| --- | --- | --- |
| E-mail (Resend) | `contato@camu3d.com.br` + `camu.3dprint@gmail.com` | `SALE_NOTIFICATION_EMAIL_TO` (lista separada por vírgula) |
| Slack | canal do workspace da Camu | `SALE_NOTIFICATION_SLACK_WEBHOOK_URL` |

O disparo acontece em `applyPaymentStatus` (`src/lib/store.ts`), que é chamado
tanto pelos webhooks (`src/app/api/webhooks/{stripe,mercadopago,abacatepay}`)
quanto pela reconciliação da página de confirmação (cobre o localhost). A
notificação é **best-effort**: se um canal falhar ou não estiver configurado, o
erro é só logado no servidor (`[notify:slack]` / `[notify:email]`) e não
interrompe o pedido nem os outros canais.

Código do canal: `src/lib/notify/slack.ts`, registrado em
`src/lib/notify/index.ts`.

---

## Como criar o app do Slack (Incoming Webhook)

Você vai criar **um app** com **dois webhooks** — um para cada canal (dev e
produção). O webhook do Slack já embute o canal de destino; não dá pra trocar o
canal pela requisição.

1. Acesse <https://api.slack.com/apps> → **Create New App** → **From scratch**.
2. Nome: `Camu — Notificações de venda`. Workspace: o da Camu.
3. No menu lateral, **Incoming Webhooks** → ligue **Activate Incoming Webhooks**.
4. Clique em **Add New Webhook to Workspace**.
   - Selecione o canal **de produção**, ex.: `#vendas`. Autorize.
   - Copie a URL gerada (`https://hooks.slack.com/services/T00000000/B00000000/xxxxxxxxxxxxxxxxxxxxxxxx`).
     Essa é a `SALE_NOTIFICATION_SLACK_WEBHOOK_URL` de **produção**.
5. Clique em **Add New Webhook to Workspace** de novo.
   - Selecione o canal **de dev**, ex.: `#vendas-dev` (crie antes se não existir;
     pode ser privado).
   - Copie a segunda URL. Essa é a `SALE_NOTIFICATION_SLACK_WEBHOOK_URL` de
     **desenvolvimento**.

> Dica: se preferir separar de verdade, crie **dois apps** (`Camu Vendas [dev]` e
> `Camu Vendas`) com um webhook cada. O código é o mesmo — só muda qual URL entra
> em qual ambiente.

---

## Configuração por ambiente

### Desenvolvimento (local)

Em `.env.local`:

```bash
SALE_NOTIFICATION_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/SEU/WEBHOOK/DEV
SALE_NOTIFICATION_EMAIL_TO=contato@camu3d.com.br,camu.3dprint@gmail.com
```

Reinicie o `npm run dev` depois de mexer no `.env.local`.

Como o Slack e o Mercado Pago não alcançam o `localhost`, o webhook não chega —
mas a página `/pedido/confirmado/[code]` reconcilia o pagamento sozinha e é aí
que a notificação dispara. Para testar ponta a ponta:

1. `PAYMENT_GATEWAY=stripe` + `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   (ou deixe a página de confirmação reconciliar).
2. Faça um checkout de teste e conclua o pagamento.
3. A mensagem deve cair no canal `#vendas-dev`.

Atalho sem gateway: `PAYMENTS_SKIP_ENABLED=true` marca o pedido como pago na hora
em localhost — a notificação dispara igual.

### Produção (Vercel)

Em **Project → Settings → Environment Variables**, escopo **Production**:

```
SALE_NOTIFICATION_SLACK_WEBHOOK_URL = https://hooks.slack.com/services/SEU/WEBHOOK/PROD
SALE_NOTIFICATION_EMAIL_TO          = contato@camu3d.com.br,camu.3dprint@gmail.com
```

Se houver ambiente **Preview**, aponte o `SALE_NOTIFICATION_SLACK_WEBHOOK_URL` de
Preview para o webhook de **dev** (`#vendas-dev`), para não poluir `#vendas` com
testes de branch.

Faça um **redeploy** depois de alterar as variáveis (a Vercel não recarrega env
em runtime).

Em produção o webhook do gateway chega normalmente:

- **Stripe:** painel → Developers → Webhooks → endpoint `https://SEU_SITE/api/webhooks/stripe`.
- **Mercado Pago:** painel → Webhooks → `https://SEU_SITE/api/webhooks/mercadopago`.
- **AbacatePay:** painel → `https://SEU_SITE/api/webhooks/abacatepay?webhookSecret=...`.

---

## Formato da mensagem

```
🛒 Nova venda na Camu — pedido #A1B2C3
Cliente: Fulano de Tal
Itens: Leon P (×2), Chaveiro Camu
Total: R$ 149,90
```

Encomendas de miniatura de pet usam 🐾 e anexam a prévia da imagem gerada.

---

## Troubleshooting

| Sintoma | Causa provável |
| --- | --- |
| Nada chega no Slack, log `Canal do Slack não configurado` | `SALE_NOTIFICATION_SLACK_WEBHOOK_URL` vazia no ambiente |
| Log `Slack respondeu 404 no_service` | Webhook revogado/errado — gere outro em api.slack.com/apps |
| Log `Slack respondeu 403 invalid_token` | URL truncada ou de outro workspace |
| E-mail chega, Slack não (ou vice-versa) | Canais são independentes; veja o log do canal que falhou |
| Nada dispara nem no e-mail | O pedido não chegou a `paid` — confira `payment_status` e o webhook do gateway |
| Notificação duplicada | `applyPaymentStatus` só notifica na 1ª transição `pending → paid`; duplicidade real indica dois pedidos |
