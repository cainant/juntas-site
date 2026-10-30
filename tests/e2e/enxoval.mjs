// Teste ponta a ponta do módulo do convidado, no navegador de verdade.
//   pnpm test:e2e
// Constrói o site em dist-e2e/ com PUBLIC_API_URL apontando para a API falsa, sobe a API falsa
// (scripts/api-falsa.mjs) e o `astro preview`, e percorre o fluxo inteiro em 390x844 e 1280x800.
// Salva capturas de tela em EVIDENCIAS (padrão: ../juntas-site-evidence). Não roda no CI.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVIDENCIAS = process.env.EVIDENCIAS || join(raiz, '..', 'juntas-site-evidence');
const PORTA_API = 8787;
const PORTA_SITE = 4321;
const API = `http://127.0.0.1:${PORTA_API}`;
const SITE = `http://127.0.0.1:${PORTA_SITE}`;
const LINK = 'LinkDeTeste0123456789abcdefABCDEF';
const LINK2 = 'LinkNovoDeTeste0123456789abcdefAB';
const astro = join(raiz, 'node_modules', 'astro', 'bin', 'astro.mjs');
const env = { ...process.env, OUT_DIR: 'dist-e2e', PUBLIC_API_URL: `${API}/api/v1` };

mkdirSync(EVIDENCIAS, { recursive: true });

const filhos = [];
function subir(args, nome) {
  const p = spawn(process.execPath, args, { cwd: raiz, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  p.stdout.on('data', () => {});
  p.stderr.on('data', (d) => process.stderr.write(`[${nome}] ${d}`));
  filhos.push(p);
  return p;
}

async function esperarUrl(url, ms = 30000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`não subiu: ${url}`);
}

let falhas = 0;
let verificacoes = 0;
function ok(cond, msg) {
  verificacoes++;
  if (!cond) {
    falhas++;
    console.error(`  FALHOU: ${msg}`);
  }
}

async function admin(acao, corpo = {}) {
  await fetch(`${API}/__teste/${acao}`, { method: 'POST', body: JSON.stringify(corpo) });
}

async function lancarNavegador() {
  try {
    const b = await chromium.launch();
    return { b, nome: 'chromium (Playwright)' };
  } catch (e) {
    console.error(`chromium do Playwright indisponível (${String(e.message).split('\n')[0]}); tentando o Edge e o Chrome instalados`);
  }
  for (const channel of ['msedge', 'chrome']) {
    try {
      return { b: await chromium.launch({ channel }), nome: channel };
    } catch {
      // próximo
    }
  }
  throw new Error('nenhum navegador disponível');
}

async function rodar(browser, nomeVista, viewport) {
  console.log(`\n== ${nomeVista} ${viewport.width}x${viewport.height}`);
  const mobile = viewport.width < 960;
  await admin('reiniciar');
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, locale: 'pt-BR', hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);

  const erros = [];
  const pedidos = [];
  page.on('console', (m) => {
    const t = m.text();
    // O navegador registra todo 4xx da API como erro de recurso; os esperados (404, 409, 422, 401) não contam.
    if (/^Failed to load resource/.test(t)) return;
    if (m.type() === 'error' || /content security policy/i.test(t)) erros.push(`[console.${m.type()}] ${t}`);
  });
  page.on('pageerror', (e) => erros.push(`[pageerror] ${e.message}`));
  page.on('request', (r) => pedidos.push({ url: r.url(), referer: r.headers()['referer'] }));

  let n = 0;
  const foto = async (nome) => {
    n++;
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(EVIDENCIAS, `${nomeVista}-${String(n).padStart(2, '0')}-${nome}.png`), fullPage: false });
  };
  const semRolagemLateral = async (onde) => {
    const largura = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
    ok(largura.doc <= largura.janela, `${onde}: rolagem lateral (${largura.doc} > ${largura.janela})`);
  };
  const painelPresentes = page.locator('#painel-presentes');
  const painelEscolhas = page.locator('#painel-escolhas');
  const cartao = (nome, painel = painelPresentes) => painel.locator('article.cartao-presente', { has: page.getByRole('heading', { name: nome, exact: true }) });
  const abrirEscolhas = async () => {
    if (mobile) await page.getByRole('tab', { name: /Minhas escolhas/ }).click();
  };
  const abrirPresentes = async () => {
    if (mobile) await page.getByRole('tab', { name: 'Presentes' }).click();
  };
  const entrar = async (nome, email) => {
    await page.getByLabel('Seu nome').fill(nome);
    await page.getByLabel('Seu e-mail').fill(email);
    await page.getByRole('button', { name: 'Receber código' }).click();
    await page.locator('#campo-codigo').waitFor();
    await page.locator('#campo-codigo').pressSequentially('123456');
    await page.getByRole('heading', { name: 'Enxoval de Ana' }).waitFor();
  };

  // Conteúdo estático: nenhuma página de conteúdo carrega script.
  // --- 1. sem link
  await page.goto(`${SITE}/enxoval/`);
  await page.getByRole('heading', { name: 'Abra o link que você recebeu' }).waitFor();
  await foto('sem-link');
  ok((await page.locator('meta[name="referrer"]').getAttribute('content')) === 'no-referrer', 'meta referrer no-referrer');
  ok((await page.locator('meta[name="robots"]').getAttribute('content')) === 'noindex', 'noindex');
  const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
  ok(/connect-src[^;]*api\.juntas\.app\.br/.test(csp) && /api-homolog\.juntas\.app\.br/.test(csp) && /script-src 'self'/.test(csp), 'CSP com connect-src das APIs e script-src self');
  await semRolagemLateral('sem link');

  // --- 2. link que não existe
  await page.goto(`${SITE}/enxoval/#linkqueNaoExiste12345`);
  await page.reload();
  await page.getByRole('heading', { name: 'Este link não funciona mais.' }).waitFor();
  ok(await page.getByText('Peça um novo a quem chamou você.').isVisible(), 'texto do link inválido');
  await foto('link-invalido');

  // --- 3. entrar
  await page.goto(`${SITE}/enxoval/#${LINK}`);
  await page.reload();
  await page.getByRole('heading', { name: 'Ana chamou você para o enxoval.' }).waitFor();
  ok(await page.getByText('Sem senha e sem baixar nada').isVisible(), 'linha sobre senha e download');
  await foto('entrar');
  await page.getByRole('button', { name: 'Receber código' }).click();
  ok(await page.getByText('Escreva o seu nome.').isVisible(), 'erro de nome vazio');
  await semRolagemLateral('entrar');
  await page.getByLabel('Seu nome').fill('Maria Souza');
  await page.getByLabel('Seu e-mail').fill('ana@exemplo.com');
  await page.getByRole('button', { name: 'Receber código' }).click();
  await page.getByText('Este e-mail não pode entrar neste enxoval.').waitFor();
  await foto('entrar-422');
  ok((await page.getByLabel('Seu e-mail').getAttribute('aria-invalid')) === 'true', 'campo e-mail marcado inválido');

  // --- 4. código
  await admin('reenviar', { segundos: 4 });
  await page.getByLabel('Seu e-mail').fill('maria@exemplo.com');
  await page.getByRole('button', { name: 'Receber código' }).click();
  const campo = page.locator('#campo-codigo');
  await campo.waitFor();
  ok((await campo.getAttribute('inputmode')) === 'numeric', 'inputmode numeric');
  ok((await campo.getAttribute('autocomplete')) === 'one-time-code', 'autocomplete one-time-code');
  ok(await campo.evaluate((el) => el === document.activeElement), 'campo do código com foco');
  ok(await page.getByText('maria@exemplo.com').first().isVisible(), 'e-mail mostrado na tela do código');
  const contagem = page.getByRole('button', { name: /Reenviar em \d+ s/ });
  ok(await contagem.isVisible(), 'contagem do reenvio visível');
  await foto('codigo');
  await campo.pressSequentially('111111');
  await page.getByText('Código inválido ou vencido. Peça outro.').waitFor();
  await page.waitForFunction(() => document.querySelector('#campo-codigo').value === '').catch(() => {});
  ok((await campo.inputValue()) === '', 'campo limpo depois do código errado');
  ok(await campo.evaluate((el) => el === document.activeElement), 'foco volta ao campo');
  await foto('codigo-errado');
  await page.getByRole('button', { name: 'Reenviar código' }).waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: 'Reenviar código' }).click();
  await page.getByText('Enviamos outro código para o seu e-mail.').waitFor();
  await campo.pressSequentially('123456');
  await page.getByRole('heading', { name: 'Enxoval de Ana' }).waitFor();

  // --- 5. lista
  ok(await page.getByText('Chá de bebê dia 12/12').isVisible(), 'recado visível');
  ok((await cartao('Berço').getByRole('link', { name: /Ver na loja/ }).getAttribute('target')) === '_blank', 'Ver na loja abre em outra aba');
  ok((await cartao('Berço').getByRole('link', { name: /Ver na loja/ }).getAttribute('rel')) === 'noopener noreferrer', 'rel noopener noreferrer');
  ok((await cartao('Toalha com capuz').getByRole('link', { name: /Ver na loja/ }).count()) === 0, 'link javascript: não vira link');
  ok(await cartao('Body manga curta').getByText('Restam 5').isVisible(), 'Restam 5');
  ok((await cartao('Macacão').getByText(/Restam/).count()) === 0, 'ilimitado não mostra Restam');
  ok((await page.getByText(/quantidade total|ao todo/i).count()) === 0, 'sem total');
  ok((await page.locator('#painel-presentes .chip').count()) === 7, 'chips: Todos + as 6 categorias presentes (Outros não tem item)');
  await foto('lista');
  await semRolagemLateral('lista');

  // busca e filtro
  await page.getByPlaceholder('Buscar presente').fill('berco');
  ok((await painelPresentes.locator('article').count()) === 1, 'busca sem acento acha Berço');
  await page.getByPlaceholder('Buscar presente').fill('');
  await page.getByRole('button', { name: 'Higiene', exact: true }).click();
  ok((await painelPresentes.locator('article').count()) === 1, 'filtro por categoria');
  await page.getByRole('button', { name: 'Todos', exact: true }).click();

  // alvos de toque
  const pequenos = await page.evaluate(() =>
    [...document.querySelectorAll('button, a[href], input, [role=tab]')]
      .filter((el) => el.getClientRects().length && !el.closest('[hidden]') && !el.classList.contains('pular') && !el.closest('.rodape-min'))
      .map((el) => ({ el: el.outerHTML.slice(0, 70), r: el.getBoundingClientRect() }))
      .filter((x) => x.r.width > 0 && (x.r.height < 43.5 || x.r.width < 43.5))
      .map((x) => `${Math.round(x.r.width)}x${Math.round(x.r.height)} ${x.el}`),
  );
  ok(pequenos.length === 0, `alvos menores que 44px: ${pequenos.join(' | ')}`);
  const fontes = await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => parseFloat(getComputedStyle(i).fontSize) < 16).length);
  ok(fontes === 0, 'campos a 16px ou mais (iOS não dá zoom)');

  // --- 6. escolher com quantidade
  await cartao('Body manga curta').getByRole('button', { name: /Escolher/ }).click();
  await cartao('Body manga curta').getByRole('button', { name: 'Aumentar' }).click();
  await cartao('Body manga curta').getByRole('button', { name: 'Aumentar' }).click();
  await foto('quantidade');
  await cartao('Body manga curta').getByRole('button', { name: 'Escolher', exact: true }).click();
  await page.getByText('Você escolheu: Body manga curta.').waitFor();
  ok(await cartao('Body manga curta').getByText('Você escolheu 3').isVisible(), 'Você escolheu 3');
  ok(await cartao('Body manga curta').getByText('Restam 2').isVisible(), 'Restam 2 depois da escolha (vem da API)');
  await foto('escolhido');

  // --- 7. presente de uma unidade: escolhe direto e sai da lista ao zerar
  await cartao('Berço').getByRole('button', { name: /Escolher/ }).click();
  await page.getByText('Você escolheu: Berço.').waitFor();
  ok((await cartao('Berço').count()) === 0, 'Berço sai de Presentes quando o restante zera');
  ok(await page.evaluate(() => document.activeElement !== document.body), 'foco não caiu no body depois de o item sair');
  await foto('item-saiu');
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await page.getByText('Escolha desfeita: Berço.').waitFor();
  ok((await cartao('Berço').count()) === 1, 'Desfazer devolve o Berço');
  await cartao('Berço').getByRole('button', { name: /Escolher/ }).click();
  await page.getByText('Você escolheu: Berço.').waitFor();

  // --- 8. minhas escolhas
  await abrirEscolhas();
  ok((await painelEscolhas.locator('article').count()) === 2, 'duas escolhas');
  ok(await page.getByRole('tab', { name: /Minhas escolhas \(2\)/ }).count() > 0 || !mobile, 'contagem só das minhas escolhas na aba');
  await cartao('Body manga curta', painelEscolhas).getByRole('button', { name: 'Aumentar' }).click();
  await page.waitForFunction(() => document.querySelector('#painel-escolhas input.qtd-valor')?.value !== undefined);
  await page.getByText('Quantidade de Body manga curta atualizada para 4.').waitFor();
  await foto('minhas-escolhas');
  await semRolagemLateral('minhas escolhas');

  // --- 9. conflito (409): outra pessoa leva 2 dos 3 sabonetes
  await abrirPresentes();
  await cartao('Sabonete líquido').getByRole('button', { name: /Escolher/ }).click();
  await cartao('Sabonete líquido').getByRole('button', { name: 'Aumentar' }).click();
  await cartao('Sabonete líquido').getByRole('button', { name: 'Aumentar' }).click();
  await admin('outra', { itemId: 4, quantidade: 2 });
  await cartao('Sabonete líquido').getByRole('button', { name: 'Escolher', exact: true }).click();
  await page.getByText('Esse presente acabou de ser escolhido por outra pessoa.').waitFor();
  ok(await cartao('Sabonete líquido').getByText('Restam 1').isVisible(), 'lista atualizada com os dados do 409');
  ok(await page.evaluate(() => document.activeElement !== document.body), 'foco preservado depois do 409');
  await foto('conflito-409');
  await page.getByRole('button', { name: 'Entendi' }).click();

  // --- 10. item removido pela gestante: continua em Minhas escolhas
  await admin('remover', { itemId: 2 });
  await page.reload();
  await page.getByRole('heading', { name: 'Enxoval de Ana' }).waitFor();
  await abrirEscolhas();
  const removido = cartao('Body manga curta', painelEscolhas);
  ok(await removido.getByText('Saiu da lista, mas continua aqui porque você escolheu.').isVisible(), 'nota do item removido');
  ok((await removido.getByRole('button', { name: 'Aumentar' }).count()) === 0, 'item removido não sobe');
  await removido.getByRole('button', { name: 'Diminuir' }).click();
  await page.getByText('Quantidade de Body manga curta atualizada para 3.').waitFor();
  await foto('item-removido');
  await removido.getByRole('button', { name: /Desfazer escolha/ }).click();
  await page.getByText('Escolha desfeita: Body manga curta.').waitFor();
  ok((await cartao('Body manga curta', painelEscolhas).count()) === 0, 'desfazer tira o item removido de vez');

  // --- 11. erro de rede: fica na tela com Tentar de novo
  await abrirPresentes();
  await page.route(`${API}/api/v1/convidado/escolhas/**`, (r) => r.abort());
  await cartao('Macacão').getByRole('button', { name: /Escolher/ }).click();
  await cartao('Macacão').getByRole('button', { name: 'Escolher', exact: true }).click();
  await page.getByRole('button', { name: 'Tentar de novo' }).waitFor();
  ok((await cartao('Macacão').count()) === 1, 'a lista continua na tela com a rede fora');
  await foto('rede-caiu');
  await page.unroute(`${API}/api/v1/convidado/escolhas/**`);
  await page.getByRole('button', { name: 'Tentar de novo' }).click();
  await page.getByText('Você escolheu: Macacão.').waitFor();

  // --- 12. 401: a sessão acabou
  await admin('expirar');
  await cartao('Mamadeira anticólica').getByRole('button', { name: /Escolher/ }).click();
  await cartao('Mamadeira anticólica').getByRole('button', { name: 'Escolher', exact: true }).click();
  await page.getByRole('heading', { name: 'Ana chamou você para o enxoval.' }).waitFor();
  ok((await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('juntas.enxoval.')).length)) === 0, '401 limpa a sessão guardada');
  await foto('sessao-expirou');
  await entrar('Maria Souza', 'maria@exemplo.com');
  await abrirEscolhas();
  ok((await painelEscolhas.locator('article').count()) >= 2, 'as escolhas voltam depois de entrar de novo');

  // --- 13. sessão vale só no link dela: outro link pede a entrada, e nunca reaproveita por nome
  const linkAtual = await page.evaluate(() => location.hash.slice(1));
  await page.evaluate((l) => (location.hash = l), LINK2);
  await page.getByRole('heading', { name: 'Ana chamou você para o enxoval.' }).waitFor();
  ok(true, 'outro link pede a entrada mesmo com o mesmo primeiro nome');
  await page.evaluate((l) => (location.hash = l), linkAtual);
  await page.getByRole('heading', { name: 'Enxoval de Ana' }).waitFor();
  ok(true, 'o link antigo com a sessão guardada continua entrando direto');

  // --- 14. sair
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByText('Você saiu do enxoval.').waitFor();
  await page.getByRole('heading', { name: 'Ana chamou você para o enxoval.' }).waitFor();
  ok((await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('juntas.enxoval.')).length)) === 0, 'sair apaga a sessão guardada');
  await foto('saiu');

  // --- 15. apagar meus dados
  await entrar('Maria Souza', 'maria@exemplo.com');
  await page.getByRole('button', { name: 'Apagar meus dados' }).first().click();
  await page.getByRole('dialog').waitFor();
  ok(await page.getByText('Isso apaga o seu nome, o seu e-mail e as suas escolhas').isVisible(), 'texto da confirmação');
  await foto('apagar-confirmacao');
  await page.getByRole('dialog').getByRole('button', { name: 'Apagar meus dados' }).click();
  await page.getByText('Seus dados foram apagados.').waitFor();
  await page.getByRole('heading', { name: 'Ana chamou você para o enxoval.' }).waitFor();
  await foto('dados-apagados');
  await entrar('Maria Souza', 'maria@exemplo.com');
  await abrirEscolhas();
  ok(await page.getByText('Você ainda não escolheu nada.').isVisible(), 'depois de apagar, nada escolhido');
  await foto('sem-escolhas');
  await abrirPresentes();
  ok((await cartao('Berço').count()) === 1, 'o que foi escolhido voltou para a lista');
  ok(await page.getByRole('link', { name: 'Política de privacidade' }).first().isVisible(), 'link para a política de privacidade');

  // --- verificações globais
  const daApi = pedidos.filter((p) => p.url.startsWith(API));
  const fora = pedidos.filter((p) => !p.url.startsWith(SITE) && !p.url.startsWith(API) && !p.url.startsWith('data:'));
  ok(fora.length === 0, `pedidos a terceiros: ${fora.map((f) => f.url).join(', ')}`);
  ok(daApi.every((p) => !p.url.includes('?')), 'nenhuma URL da API com query string');
  ok(daApi.every((p) => !p.referer), 'nenhum pedido da API com Referer');
  ok(pedidos.every((p) => !p.url.includes('#')), 'nenhuma URL pedida com fragmento');
  ok(erros.length === 0, `erros no console: ${erros.join(' || ')}`);

  await ctx.close();
}

try {
  console.log('Construindo o site de teste (dist-e2e/)…');
  const b = spawnSync(process.execPath, [astro, 'build'], { cwd: raiz, env, encoding: 'utf8' });
  if (b.status !== 0) throw new Error(`build falhou\n${b.stdout}\n${b.stderr}`);
  subir([join(raiz, 'scripts', 'api-falsa.mjs'), String(PORTA_API)], 'api');
  subir([astro, 'preview', '--port', String(PORTA_SITE), '--host', '127.0.0.1'], 'site');
  await esperarUrl(`${API}/api/v1/convidado/enxoval/${LINK}`);
  await esperarUrl(`${SITE}/enxoval/`);

  // Landing, para a conferência visual
  const { b: navegador, nome } = await lancarNavegador();
  console.log(`Navegador: ${nome}`);
  for (const [v, vp] of [
    ['celular', { width: 390, height: 844 }],
    ['desktop', { width: 1280, height: 800 }],
  ]) {
    const ctx = await navegador.newContext({ viewport: vp, deviceScaleFactor: vp.width < 960 ? 2 : 1, locale: 'pt-BR' });
    const pg = await ctx.newPage();
    for (const [rota, arq] of [
      ['/', 'landing'],
      ['/privacidade/', 'privacidade'],
    ]) {
      await pg.goto(`${SITE}${rota}`);
      await pg.waitForLoadState('networkidle');
      await pg.screenshot({ path: join(EVIDENCIAS, `${v}-${arq}-completa.png`), fullPage: true });
      const larg = await pg.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth, scripts: document.scripts.length }));
      ok(larg.doc <= larg.janela, `${arq} ${v}: rolagem lateral`);
      ok(larg.scripts === 0, `${arq} ${v}: página de conteúdo sem JavaScript (${larg.scripts} scripts)`);
    }
    await ctx.close();
    await rodar(navegador, v, vp);
  }
  await navegador.close();
} catch (e) {
  falhas++;
  console.error(e);
} finally {
  for (const f of filhos) f.kill();
}

console.log(`\n${verificacoes} verificações, ${falhas} falha(s). Capturas em ${EVIDENCIAS}`);
process.exit(falhas ? 1 : 0);
