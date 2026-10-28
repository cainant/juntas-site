# juntas-site

Site estático do app Juntas, publicado pelo GitHub Pages a partir da raiz da branch `main`.

| URL | Página |
| --- | --- |
| `/` | Início |
| `/contato/` (e `/suporte/`, que redireciona) | Suporte |
| `/privacidade/` | Política de privacidade |
| `/termos/` | Termos de uso |
| `/excluir-conta/` | Como excluir a conta (exigida pelo Google Play) |

As URLs vão para as lojas: não renomeie as pastas.

HTML e CSS puros. As páginas saem de `gerar.mjs`: edite o conteúdo lá e rode `node gerar.mjs` (Node 18 ou mais novo). O HTML gerado fica no repositório, porque é o que o Pages publica. A página `suporte/` é um redirecionamento escrito à mão.

As imagens de `assets/telas/` são os celulares das peças de loja (`marketing/src/telas.mjs` do repositório do app), renderizados sem fundo e convertidos para WebP.


Os links entre páginas são relativos. Ao trocar para o domínio próprio, mude em `gerar.mjs` a constante `SITE` (usada nas tags de compartilhamento, no `sitemap.xml` e no `robots.txt`) e o `<base>` do `404.html` para `/`, e rode `node gerar.mjs`. O `robots.txt` só vale na raiz do domínio, então passa a funcionar com o domínio próprio.

`assets/og.jpg` (1200×630) é a imagem que aparece quando alguém compartilha o link.

Não coloque segredos aqui: o repositório é público.
