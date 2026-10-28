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

HTML e CSS puros, sem build. Os tokens de `assets/site.css` vêm de `docs/design-system/tokens.css` do repositório do app; o ícone é `docs/design-system/assets/AppIcon/app-icon.svg`. As fontes Fraunces e Manrope (subconjunto latin, licença SIL OFL 1.1, em `assets/fonts/`) são servidas pelo próprio site.

Todos os links são relativos, exceto o `<base>` do `404.html`. Ao trocar para o domínio próprio, mude esse `<base>` para `/`.

Não coloque segredos aqui: o repositório é público.
