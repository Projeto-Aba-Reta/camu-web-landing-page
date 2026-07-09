# camu-web-landing-page

Site institucional (landing page) da **Camu**, empresa brasileira de impressão 3D sob medida. Este repositório é **somente o frontend público** servido em `www.camu.com.br` — não há loja, carrinho ou checkout aqui; toda venda acontece nos marketplaces (Mercado Livre, Shopee, Elo7, Etsy), para onde o site direciona o visitante.

## Sobre a marca

- **Mascote:** Leon, um camaleão que "se transforma no que você precisar" — metáfora da personalização via impressão 3D.
- **Público:** fãs de cultura pop/geek, colecionadores, entusiastas de impressão 3D.
- **Tom de voz:** leve, próximo, com humor sutil — nunca corporativo.
- **Direção visual atual:** *Sticker Pop* — fundo claro, contornos grossos, sombras "flat" tipo adesivo colecionável, cantos bem arredondados.

**Paleta:**

| Cor | Hex | Uso |
|---|---|---|
| Teal | `#0FBFA0` | primária |
| Coral | `#FF6B4A` | destaque / CTA |
| Charcoal | `#1B1F1E` | texto / fundo escuro |
| Off-white | `#FAF7F2` | fundo claro |

**Tipografia:** Baloo 2 (títulos, `font-heading`) + Space Grotesk (corpo/UI, `font-sans`), via `next/font/google`.

O design de origem (todas as opções de estilo exploradas) vive no projeto Claude Design [`CAMU institutional site prompt`](https://claude.ai/design/p/f7e62e8a-3f40-4861-b0fa-dc83483b08b7); o spec completo usado para gerar este projeto está em `uploads/prompt-site-institucional-camu.md` desse mesmo projeto.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (tema via `@theme` em `src/app/globals.css`, sem `tailwind.config.js`)
- `next/image` para otimização de imagens, `next/font` para as fontes

## Estrutura

```
src/
  app/
    layout.tsx      metadata, Open Graph, JSON-LD Organization, fontes
    page.tsx         monta a home a partir das sections
    globals.css       tema Tailwind (cores, sombras "sticker")
    sitemap.ts / robots.ts
  components/          uma section por arquivo (Navbar, Hero, About, Catalog,
                        HowItWorks, WhereToBuy, Testimonials, Contact, Footer)
  lib/data.ts           conteúdo estruturado (produtos, passos, marketplaces,
                        depoimentos) — parte é placeholder, ver abaixo
public/images/           assets do Leon (mascote)
```

## Conteúdo placeholder

Estes pontos usam dados de exemplo e precisam ser substituídos com conteúdo real antes de publicar:

- Fotos de produto e foto da equipe/oficina (hoje: blocos com textura diagonal)
- Depoimentos em `src/lib/data.ts` (`testimonials`)
- Links de redes sociais e marketplaces em `src/lib/data.ts` (`socialLinks`, `marketplaces`, `products`)
- CNPJ no footer (`src/components/Footer.tsx`)
- Domínio em `src/app/layout.tsx` (`siteUrl`) e `src/app/sitemap.ts` / `robots.ts` — hoje apontam para `https://camu.com.br`, ajustar para o domínio final

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de produção
npm run start   # roda o build de produção
npm run lint     # eslint
```

## Deploy

Frontend estático/SSR simples — compatível com Vercel (recomendado, mesma equipe do Next.js) ou qualquer host com suporte a Node.js. Alvo: `www.camu.com.br`.
