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


Publicado em https://juntas.app.br (domínio no registro.br: quatro registros A da raiz para os IPs do GitHub Pages e `www` CNAME para `cainant.github.io`; o arquivo `CNAME` guarda o domínio para o Pages). Os links entre páginas são relativos. Se o domínio mudar, mude a constante `SITE` em `gerar.mjs` (tags de compartilhamento, `sitemap.xml` e `robots.txt`) e rode `node gerar.mjs`.

`assets/og.jpg` (1200×630) é a imagem que aparece quando alguém compartilha o link.

Não coloque segredos aqui: o repositório é público.
