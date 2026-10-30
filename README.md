# juntas-site

Site do app Juntas, em https://juntas.app.br. É um projeto Astro com saída estática (`dist/`), publicado pelo GitHub Pages por um workflow do GitHub Actions. As páginas de conteúdo são HTML sem JavaScript. Só `/enxoval/` tem uma ilha em Preact: a tela do convidado, que fala com a API do Juntas.

Decisão e motivos: ADR 0026 no repositório do app (`cainant/juntas`, `docs/adr/0026-site-com-build-e-modulo-do-convidado.md`).

| URL | Página |
| --- | --- |
| `/` | Início |
| `/contato/` (e `/suporte/`, que redireciona) | Suporte |
| `/privacidade/` | Política de privacidade |
| `/termos/` | Termos de uso |
| `/excluir-conta/` | Como excluir a conta (exigida pelo Google Play) |
| `/enxoval/` | Tela do convidado, contra a API de produção |
| `/enxoval/homolog/` | A mesma tela, contra a API de homologação, com a etiqueta "homologação" |
| `/404.html`, `/robots.txt`, `/sitemap.xml` | Gerados |

As URLs de contato, suporte, privacidade, termos e exclusão vão para as lojas: não as mude. As duas páginas do enxoval ficam fora do `sitemap.xml` e do `robots.txt` e têm `noindex`.

## Rodar

Precisa de Node 22.23.4 ou mais novo (o mínimo do Astro 7; o CI usa exatamente 22.23.4, veja `.node-version`) e pnpm 12 (campo `packageManager`).

```
pnpm install
pnpm dev          # servidor de desenvolvimento
pnpm build        # escreve dist/
pnpm preview      # serve dist/
pnpm test         # testes unitários (vitest)
pnpm check        # tipos (astro check)
pnpm conferir     # texto das páginas legais contra o HTML antigo de main (veja abaixo)
pnpm test:e2e     # fluxo do convidado no navegador (não roda no CI)
```

## Estrutura

- `src/pages`: uma página por URL. `src/layouts`: `Base` (cabeçalho, rodapé, tags de compartilhamento), `Documento` (páginas legais) e `PaginaEnxoval`.
- `src/styles`: `site.css` (base e documentos), `landing.css` (início), `enxoval.css` (convidado).
- `src/components/enxoval`: a ilha em Preact. `src/lib/enxoval`: cliente da API, máquina de estados, filtros e regras da lista, sessão guardada. Tudo isso é lógica pura com testes em `tests/`.
- `public/`: copiado como está. `CNAME` guarda o domínio para o Pages; `assets/` tem fontes, ícones, `og.jpg` (1200×630, a imagem de compartilhamento) e `telas/` (os celulares das peças de loja, sem fundo, em WebP, vindos de `marketing/src/telas.mjs` do repositório do app).
- `scripts/api-falsa.mjs`: API do convidado em memória, só para testes.

O texto das páginas legais fica nos `.astro` correspondentes. Ao editá-lo, mude a data no topo da política ou dos termos.

## Módulo do convidado

O link do enxoval vem no fragmento da URL (`https://juntas.app.br/enxoval/#<link>`), que nunca chega ao servidor nem ao `Referer`. A sessão do convidado fica no `localStorage`, numa chave que inclui o ambiente e o link; nem o link nem o token vão para query string ou log. A página tem `<meta name="referrer" content="no-referrer">` e uma CSP por `<meta>` (gerada pelo Astro, com hash dos scripts) que limita `connect-src` às duas APIs.

APIs usadas:

- produção: `https://api.juntas.app.br/api/v1`
- homologação: `https://api-homolog.juntas.app.br/api/v1`

`PUBLIC_API_URL` (variável de build) troca a API nas duas páginas e entra no `connect-src`; serve para desenvolvimento local e para o teste ponta a ponta. Exemplo: `PUBLIC_API_URL=http://localhost:8000/api/v1 pnpm dev`.

## Testes

- `pnpm test`: regras da lista, máquina de estados, cliente da API e sessão guardada.
- `pnpm test:e2e`: constrói o site em `dist-e2e/` apontando para `scripts/api-falsa.mjs`, sobe a API falsa e o preview, e percorre o fluxo em 390×844 e 1280×800 com Playwright. Salva capturas em `../juntas-site-evidence/` (mude com `EVIDENCIAS=`). Primeira vez: `pnpm exec playwright install chromium`. Se o download estiver bloqueado, o script tenta o Edge e o Chrome instalados.
- `pnpm conferir`: compara o texto visível de privacidade, termos, excluir-conta e contato em `dist/` com o HTML antigo em `main` (`git show main:<página>`); a única diferença permitida é a seção "Quem é chamado para um enxoval". Foi pensado para a migração: quando `main` já não tem o HTML gerado, avisa e sai sem erro. O CI o roda nos pull requests com `--ref origin/main`.

## Publicação

O workflow `.github/workflows/deploy.yml` roda em:

- pull request: instala, testa, constrói, confere os textos e checa as URLs de `dist/`. Não publica;
- push em `main`: o mesmo, e publica `dist/` com `actions/upload-pages-artifact` e `actions/deploy-pages`.

No repositório, em Settings, Pages, a fonte precisa ser "GitHub Actions" (antes era a raiz de `main`). Domínio no registro.br: quatro registros A da raiz para os IPs do GitHub Pages e `www` CNAME para `cainant.github.io`. Se o domínio mudar, mude `site` em `astro.config.mjs`, `SITE` em `src/lib/paginas.ts` e `src/layouts/Base.astro`, e o `CNAME`.

O repositório continua público até a migração para o Cloudflare Pages (issue #3 deste repositório): o GitHub Pages só serve repositório privado em plano pago. Como a saída é estática, a troca de hospedagem não mexe no código. Por isso não coloque segredos aqui.
