## Context

A loja da Camu já tem um fluxo de pedido pago funcionando (`orders`/`order_items`, `createOrder`, `createPreference` do Mercado Pago, webhook + reconciliação por `external_reference`, telas `/pedido/[code]` e `/pedido/confirmado/[code]`). Também já existe um fluxo de lead personalizado (`/encomenda` → `custom_orders` → link de WhatsApp), mas sem prévia visual e sem cobrança online.

Este change introduz um terceiro fluxo, que é um *produto* novo (miniatura de pet gerada por IA) e não só um formulário: envolve upload de mídia do cliente, uma chamada a um provider externo de geração de imagem (assíncrona, de duração incerta), uma etapa de aprovação humana antes de cobrar, e só então reaproveita o checkout/pagamento já existente. O schema do banco é do ERP `camu-web-admin` — este repo só lê/escreve, migrations vão lá.

## Goals / Non-Goals

**Goals:**
- Fluxo autoguiado de ponta a ponta: intake → geração por IA → aprovação → pagamento → notificação da venda, sem intervenção manual do time até a notificação final.
- Reaproveitar ao máximo a infra de pagamento/pedido já existente (preço calculado no servidor, Checkout Pro, página de acompanhamento) em vez de duplicar lógica de cobrança.
- Canal de notificação de venda desacoplado do evento que o dispara, para crescer de "e-mail" para múltiplos canais sem reescrever o ponto de disparo.
- Visual didático e consistente com a identidade Sticker Pop existente (mesmos tokens de cor, `border-charcoal`, `.sticker-shadow*`).

**Non-Goals:**
- Não inclui edição manual da imagem gerada pelo cliente (crop, ajuste de composição) além de "tentar de novo".
- Não inclui um painel administrativo novo para revisar encomendas de pet — a operação usa o que já existe (Supabase Studio / e-mail) até haver demanda por mais.
- Não decide qual provider de geração de imagem por IA usar — o design define a interface e o ponto de integração; a escolha do provider fica como tarefa de implementação/decisão de custo.
- Não altera o schema ou o comportamento dos pedidos de catálogo existentes.

## Decisions

**1. Preço via SKU no catálogo, não constante hardcoded.**
A miniatura de pet personalizada vira um produto no catálogo do ERP (categoria `personalizado`, já prevista em `Product.category`), com um `product_channel_listings` ativo no canal `loja_propria`. O fluxo de aprovação chama `createOrder`/`createPreference` exatamente como o carrinho normal, passando esse `productId` fixo com `qty: 1`.
- *Alternativa considerada*: constante de preço hardcoded no servidor deste repo. Rejeitada porque duplicaria a lógica de "preço nunca vem do client" que `store.ts` já resolve, e tornaria o reajuste de preço um deploy de código em vez de um update no ERP.

**2. Vínculo pedido ↔ encomenda de pet fica na tabela nova, não em `orders`.**
A nova tabela (`pet_miniature_requests`, no schema do admin) guarda `order_id` (nullable, preenchido só na aprovação). Nenhuma coluna nova é necessária em `orders`/`order_items`.
- *Alternativa considerada*: FK `pet_request_id` em `orders`. Rejeitada para não tocar numa tabela compartilhada com outros fluxos de pedido só por causa deste caso de uso.

**3. Geração de imagem é assíncrona com polling simples pelo client, não WebSocket/SSE.**
A tela de acompanhamento faz polling (ex.: a cada poucos segundos) num endpoint de status até o registro sair de `processando`. Consistente com a página de confirmação de pedido, que já reconcilia pagamento sob demanda em vez de usar push.
- *Alternativa considerada*: Supabase Realtime. Mais robusto, mas introduz uma dependência de client nova nesta base majoritariamente server-first; fica como possível evolução, não bloqueia o MVP.

**4. Execução do pipeline de IA fica atrás de uma rota de API própria, desacoplada do server action de intake.**
O server action de intake grava fotos + registro com status `processando` e retorna rápido; a chamada ao provider de IA roda numa rota de API dedicada (`/api/pet-miniature/generate` ou equivalente), disparada logo após o insert. Isso evita segurar a resposta do formulário pela duração incerta da geração de imagem.
- **Open Question**: a plataforma de deploy alvo (Vercel ou outra) determina o mecanismo exato de "trabalho em background após a resposta" (`after()`/`waitUntil` da Vercel, cron do Supabase, ou uma fila). Precisa ser confirmado antes de implementar — ver Open Questions.

**5. Notificação de venda como interface de canal único com implementações plugáveis.**
`src/lib/notify/` expõe um tipo `SaleNotificationChannel` (`send(event): Promise<void>`) e uma função `notifySaleChannels(event)` que itera sobre os canais habilitados via env/config e dispara todos, capturando erro por canal sem interromper os demais. O canal de e-mail é a primeira implementação; o ponto de disparo (webhook do Mercado Pago / reconciliação, quando `payment_status` vira `approved`) não conhece os canais individualmente.
- *Alternativa considerada*: chamar o provedor de e-mail direto no webhook. Rejeitada por contrariar explicitamente o pedido do usuário de manter isso fácil de modularizar.

**6. Fotos do cliente ficam em bucket privado; a imagem gerada, em bucket público.**
Fotos originais do pet nunca precisam ser servidas publicamente — leitura só via service role (ex.: para auditoria ou reprocessamento). A imagem gerada pela IA, que o cliente vê na prévia, fica num bucket público dedicado (padrão similar ao `product-media` já usado pelo catálogo), servida por URL direta.

## Risks / Trade-offs

- [Provider de IA lento ou instável] → pipeline assíncrono + status `falhou` com retry manual pelo cliente; nenhuma cobrança acontece antes de `pronto` + aprovação explícita.
- [Custo por geração de imagem sem limite] → considerar limitar tentativas de "gerar de novo" por encomenda na implementação (não coberto nos specs desta proposta; anotar como possível follow-up).
- [Migration em outro repositório (`camu-web-admin`) pode atrasar o cronograma deste repo] → tasks.md deve deixar claro que a migration é pré-requisito bloqueante e por que repositório ela passa.
- [Upload de fotos sensíveis de terceiros — imagens de pets/pessoas] → bucket privado por padrão para as fotos originais, acesso só server-side, sem expor listagem pública.
- [Preço do SKU "miniatura personalizada" desatualizado no ERP] → mesmo mecanismo de proteção que já existe para o catálogo normal (preço sempre lido do `product_channel_listings` no momento do pedido).

## Migration Plan

1. Migration no `camu-web-admin`: tabela `pet_miniature_requests` (fotos, status, imagem gerada, `order_id` nullable) + produto de catálogo "Miniatura Pet Personalizada" com listing ativo em `loja_propria`.
2. Criar buckets/prefixos de Storage (fotos privadas, imagens geradas públicas) e configurar variáveis de ambiente (provider de IA, provedor de e-mail).
3. Implementar intake + pipeline de geração + telas de acompanhamento/prévia, sem tocar no checkout existente.
4. Ligar a aprovação da prévia ao `createOrder`/`createPreference` já existentes.
5. Implementar `src/lib/notify/` com canal de e-mail e plugar no ponto onde `payment_status` já vira `approved` (webhook/reconciliação).
6. Deploy incremental: nada disso é exposto na navegação principal até o fluxo estar validado ponta a ponta em produção com um teste real (Pix em sandbox/valor baixo).

Rollback: como é uma rota nova e aditiva, desativar basta remover o link de navegação e, se necessário, desabilitar o listing do produto no ERP — não há dado existente para migrar de volta.

## Open Questions

- Qual provider de geração de imagem por IA será usado (custo, latência típica, política de conteúdo para fotos de pets/pessoas)?
- Qual é a plataforma de deploy deste site hoje (Vercel ou outra), para definir o mecanismo de execução em background do pipeline de IA?
- Qual provedor de e-mail transacional usar para o canal inicial (Resend, SES, etc.) — repositório já usa algum em outro ponto?
- Deve haver limite de tentativas de "gerar de novo" por encomenda antes de escalar para atendimento humano?
