-- DEV ONLY — popula o canal 'loja_propria' pra você conseguir testar a loja
-- localmente. Espelha o preço já cadastrado no Mercado Livre de cada peça ativa.
-- Em produção, quem define o que vai pro site e por quanto é o admin (ERP).

insert into public.product_channel_listings (product_id, channel, listed_price, is_active)
select l.product_id, 'loja_propria', l.listed_price, true
from public.product_channel_listings l
join public.products p on p.id = l.product_id
where l.channel = 'mercado_livre'
  and l.is_active = true
  and p.status = 'ativo'
on conflict (product_id, channel) do nothing;
