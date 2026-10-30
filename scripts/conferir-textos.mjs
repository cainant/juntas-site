// Confere que o texto das páginas legais não mudou na migração para o Astro.
// Compara o texto visível do <main> (e o título e a descrição) do HTML antigo, tirado de
// `git show main:<caminho>`, com o de dist/. A única diferença permitida é a seção nova
// da política de privacidade ("Quem é chamado para um enxoval").
// Uso: pnpm build && node scripts/conferir-textos.mjs [--ref main] [--exigir]
// Sem --exigir, sai com sucesso quando a referência já não tem o HTML antigo.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.env.OUT_DIR ? join(raiz, process.env.OUT_DIR) : join(raiz, 'dist');
const refArg = process.argv.indexOf('--ref');
const ref = refArg > -1 ? process.argv[refArg + 1] : 'main';

const PAGINAS = ['privacidade', 'termos', 'excluir-conta', 'contato', '404.html'];
const SECAO_NOVA = { pagina: 'privacidade', inicio: '<h2 id="convidado"', titulo: 'Quem é chamado para um enxoval' };

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodificar(texto) {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m);
}

function paraTexto(html) {
  return decodificar(
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function principal(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!m) throw new Error('sem <main>');
  return m[1];
}

function meta(html) {
  const titulo = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  const desc = html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? '';
  return paraTexto(`${titulo} | ${desc}`);
}

function antigo(pagina) {
  const caminho = pagina.endsWith('.html') ? pagina : `${pagina}/index.html`;
  return execFileSync('git', ['show', `${ref}:${caminho}`], { cwd: raiz, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
}

function novo(pagina) {
  const caminho = pagina.endsWith('.html') ? pagina : `${pagina}/index.html`;
  return readFileSync(join(dist, caminho), 'utf8');
}

function primeiraDiferenca(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const contexto = (s) => JSON.stringify(s.slice(Math.max(0, i - 50), i + 90));
  return `posição ${i}\n  antigo: ${contexto(a)}\n  novo:   ${contexto(b)}`;
}

// Depois que a migração entra em main, o HTML antigo deixa de existir lá e não há o que comparar.
try {
  execFileSync('git', ['cat-file', '-e', `${ref}:privacidade/index.html`], { cwd: raiz, stdio: 'ignore' });
} catch {
  if (process.argv.includes('--exigir')) {
    console.error(`FALHOU: ${ref} não tem o HTML antigo para comparar`);
    process.exit(1);
  }
  console.log(`Nada a comparar: ${ref} não tem mais o HTML gerado (migração já concluída).`);
  process.exit(0);
}

let falhas = 0;

for (const pagina of PAGINAS) {
  let htmlNovo = principal(novo(pagina));
  let extra = '';

  if (pagina === SECAO_NOVA.pagina) {
    const ini = htmlNovo.indexOf(SECAO_NOVA.inicio);
    if (ini < 0) {
      console.error(`FALHOU ${pagina}: a seção nova não está na página`);
      falhas++;
      continue;
    }
    const fim = htmlNovo.indexOf('</ul>', ini) + '</ul>'.length;
    extra = paraTexto(htmlNovo.slice(ini, fim));
    if (!extra.includes(SECAO_NOVA.titulo)) {
      console.error(`FALHOU ${pagina}: a seção nova não tem o título "${SECAO_NOVA.titulo}"`);
      falhas++;
      continue;
    }
    htmlNovo = htmlNovo.slice(0, ini) + htmlNovo.slice(fim);
  }

  const a = paraTexto(principal(antigo(pagina)));
  const b = paraTexto(htmlNovo);
  const ma = meta(antigo(pagina));
  const mb = meta(novo(pagina));

  if (a !== b) {
    console.error(`FALHOU ${pagina}: o texto mudou\n  ${primeiraDiferenca(a, b)}`);
    falhas++;
  } else if (ma !== mb) {
    console.error(`FALHOU ${pagina}: título ou descrição mudou\n  ${primeiraDiferenca(ma, mb)}`);
    falhas++;
  } else {
    console.log(`ok     ${pagina} (${a.length} caracteres iguais${extra ? '; seção nova à parte' : ''})`);
    if (extra) console.log(`       seção nova: ${extra}`);
  }
}

// O endereço /suporte/ continua redirecionando para /contato/.
const suporte = novo('suporte');
if (/http-equiv="refresh" content="0; url=\/contato\/"/.test(suporte) && /rel="canonical" href="https:\/\/juntas\.app\.br\/contato\/"/.test(suporte)) {
  console.log('ok     suporte (redireciona para /contato/)');
} else {
  console.error('FALHOU suporte: perdeu o redirecionamento ou o canonical');
  falhas++;
}

if (falhas > 0) {
  console.error(`\n${falhas} página(s) com diferença.`);
  process.exit(1);
}
console.log('\nTextos conferidos.');
