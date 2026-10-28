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


Todos os links são relativos, exceto o `<base>` do `404.html`. Ao trocar para o domínio próprio, mude esse `<base>` para `/`.

Não coloque segredos aqui: o repositório é público.
