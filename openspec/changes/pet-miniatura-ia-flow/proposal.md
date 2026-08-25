## Why

Hoje a única forma de encomendar algo personalizado é a tela `/encomenda`, que só captura um lead (nome, telefone, descrição) e termina numa conversa manual no WhatsApp — sem prévia visual, sem preço fechado e sem pagamento online. O produto "miniatura do seu pet" é um dos apelos mais fortes da Camu e merece um fluxo dedicado, autoguiado: o cliente sobe fotos do pet, vê uma prévia gerada por IA de como ficaria a miniatura impressa em 3D, aprova e paga direto no site — sem depender de troca de mensagens pra fechar a venda. Isso reduz fricção de conversão e tira carga manual do time, que só precisa ser avisado quando uma venda acontece.

## What Changes

- Novo fluxo público `/miniatura-pet` (nome a confirmar) com 4 passos guiados e visualmente didáticos, na paleta Sticker Pop: **1) dados do cliente** (nome + WhatsApp) e **upload de 3–4 fotos do pet** → **2) processamento** (fotos entram num pipeline de geração de imagem por IA) → **3) prévia do resultado** (imagem gerada da miniatura, com opção de aprovar ou pedir nova tentativa) → **4) pagamento** via Mercado Pago Checkout Pro (Pix/cartão), reaproveitando a infra de pedidos existente (`orders`/`order_items`, página de confirmação/acompanhamento).
- Upload das fotos do pet para um bucket dedicado no Supabase Storage, associado ao pedido.
- Pipeline assíncrono de geração de imagem por IA: recebe as fotos, chama um provider de geração de imagem, grava a imagem resultante e expõe status (`processando` / `pronto` / `falhou`) pro cliente acompanhar sem manter a aba presa a uma chamada síncrona longa.
- Modelo de dados novo para esse tipo de encomenda (fotos do pet, prompt/params usados, imagem gerada, status de aprovação do cliente) — vive no schema do ERP (`camu-web-admin`), como as demais tabelas de pedido. **BREAKING**: nenhuma (aditivo).
- Camada de notificação de venda modular: interface única (`notifyChannels(event)`) com um primeiro canal implementado (**e-mail**), desenhada para plugar novos canais (Slack, webhook genérico, WhatsApp Business) e disparar em mais de um canal simultaneamente, sem mudar o ponto de chamada.
- Reaproveita o gate de preço/servidor já existente: o valor cobrado nunca vem do client, é fixado no servidor (preço da miniatura personalizada configurado como um produto/listing próprio no canal `loja_propria`, ou uma constante de servidor até existir esse SKU no catálogo).

## Capabilities

### New Capabilities
- `pet-miniature-order`: fluxo completo do cliente — intake (nome, telefone, 3–4 fotos), acompanhamento da geração da prévia por IA, aprovação da prévia e pagamento — incluindo o novo modelo de dados e as telas em `src/app/(store)/`.
- `sale-notifications`: abstração de notificação de venda para o time da Camu, com canal de e-mail inicial e suporte a múltiplos canais configuráveis, disparada quando um pedido (de qualquer tipo, incluindo miniatura de pet) é confirmado como pago.

### Modified Capabilities
(nenhuma — não há specs existentes em `openspec/specs/`; o fluxo reaproveita código de checkout/pagamento já implementado, mas sem alterar seu contrato)

## Impact

- **Admin (`camu-web-admin`, dono do schema)**: nova migration para uma tabela de encomendas de miniatura de pet (fotos, imagem gerada, status de aprovação, vínculo com `orders`/`order_items`), seguindo o padrão de `20260722120000_pedidos_loja_e_canal_site.sql`. Este repo só consome; a migration não é versionada aqui.
- **Supabase Storage**: novo bucket (ou prefixo dedicado) para fotos enviadas pelo cliente e para a imagem gerada pela IA — acesso só via service role no servidor, como os demais dados de pedido.
- **Novo endpoint/rota server-side** para orquestrar o pipeline de geração de imagem (chamada ao provider de IA, gravação do resultado, atualização de status) — precisa rodar fora do ciclo de request síncrono da página (rota de API + polling do client, ou fila).
- **Segredos novos**: credencial do provider de geração de imagem por IA e credenciais do provedor de e-mail (`.env.local`, nunca commitadas).
- **`src/app/actions/`**: nova server action para o intake (upload + criação do registro) e reaproveito de `createPreference`/`createOrder`-like flow para o pagamento.
- **`src/lib/`**: novo módulo de notificação (`src/lib/notify/` ou similar) e cliente do provider de geração de imagem.
- Sem mudança nos fluxos existentes de loja (catálogo, carrinho) nem no schema de `orders` além de uma referência opcional ao novo registro de encomenda de pet.
