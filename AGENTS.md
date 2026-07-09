# camu-web-landing-page

Landing page institucional da Camu (impressão 3D sob medida). Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4. Frontend puro — sem carrinho, checkout ou pagamento; toda venda acontece nos marketplaces (Mercado Livre, Shopee, Elo7, Etsy). Ver `README.md` para stack, estrutura de pastas e conteúdo placeholder pendente.

## Regras da marca (não violar)

- Paleta fixa: teal `#0FBFA0`, coral `#FF6B4A`, charcoal `#1B1F1E`, off-white `#FAF7F2`. Não introduzir cores fora dela (variações de tom via opacity/hover são ok).
- Direção visual: *Sticker Pop* — contornos grossos (`border-charcoal`, geralmente 3px), sombras `.sticker-shadow*` (definidas em `globals.css`), cantos bem arredondados. Não usar 3D realista, fotorrealismo ou pixel art no mascote (Leon).
- Fontes: `font-heading` (Baloo 2) para títulos, `font-sans`/padrão (Space Grotesk) para corpo — já configuradas em `layout.tsx`, não trocar sem necessidade.
- Nunca adicionar carrinho, checkout ou fluxo de pagamento — é fora de escopo por definição do produto.
- Conteúdo do site é em português (pt-BR).

## Convenções deste repo

- Tailwind v4: tema fica em `src/app/globals.css` via `@theme inline` — não existe `tailwind.config.js`, não criar um.
- Uma section = um componente em `src/components/`, importado e ordenado em `src/app/page.tsx`.
- Conteúdo estruturado (produtos, passos, marketplaces, depoimentos, links) fica em `src/lib/data.ts`, não hardcoded nos componentes.
- Dados/placeholders ainda não finais devem continuar claramente marcados (texto tipo `[foto produto]`, comentário "substituir por depoimentos reais") até o usuário fornecer o conteúdo real.
- Assets do Leon (mascote) ficam em `public/images/`; foram extraídos do projeto Claude Design linkado no README — se precisar de mais variações, puxar de lá em vez de gerar novas ilustrações do zero.

## Comandos

```bash
npm run dev     # dev server (Turbopack)
npm run build   # build de produção (roda typecheck + lint)
npm run lint
```

## Convenção de commit

Todo commit segue o padrão `Tipo({package}): {message}`, por exemplo:

```
Feat(camu-web-landing-page): implementa a home institucional
Fix(camu-web-landing-page): corrige contraste do CTA no hero
Docs(camu-web-landing-page): atualiza README com instruções de deploy
Chore(camu-web-landing-page): renomeia pacote
```

Tipos comuns: `Feat`, `Fix`, `Docs`, `Chore`, `Refactor`, `Style`, `Test`. O escopo entre parênteses é o nome do pacote/repo (`camu-web-landing-page`).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
