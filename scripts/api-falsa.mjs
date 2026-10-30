// API falsa do convidado, em memória, só para testar o site sem o servidor de verdade.
// Segue docs/enxoval-dados-e-api.md do repositório cainant/juntas ("Convidado sem sessão" e
// "Convidado com sessão"). O código de e-mail é sempre 123456.
//
//   node scripts/api-falsa.mjs [porta]        (padrão 8787; prefixo /api/v1)
//
// Rotas de apoio ao teste (não existem na API de verdade), todas POST em /__teste/:
//   outra     { itemId, quantidade }   outra pessoa escolhe (o restante cai, sem a pessoa ver quem)
//   remover   { itemId }               a gestante tira o presente da lista (soft delete)
//   expirar                            apaga todas as sessões (o próximo pedido responde 401)
//   reenviar  { segundos }             muda o tempo de reenvio do código (padrão 60)
//   reiniciar                          volta ao estado inicial
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const PORTA = Number(process.argv[2] || process.env.PORT || 8787);
const LINK = 'LinkDeTeste0123456789abcdefABCDEF';
// Segundo link da mesma gestante: simula o link trocado (as sessões abertas seguem valendo).
const LINK2 = 'LinkNovoDeTeste0123456789abcdefAB';
const CODIGO = '123456';

function estadoInicial() {
  return {
    reenviarSeg: 60,
    itens: [
      { id: 1, nome: 'Berço', categoria: 'quarto', quantidade: 1, observacao: 'Cor madeira clara', link_loja: 'https://exemplo.com.br/berco', removido: false },
      { id: 2, nome: 'Body manga curta', categoria: 'vestir', quantidade: 5, observacao: 'Tamanho RN e P', link_loja: null, removido: false },
      { id: 3, nome: 'Macacão', categoria: 'vestir', quantidade: null, observacao: null, link_loja: null, removido: false },
      { id: 4, nome: 'Sabonete líquido', categoria: 'higiene', quantidade: 3, observacao: null, link_loja: null, removido: false },
      { id: 5, nome: 'Toalha com capuz', categoria: 'banho', quantidade: 2, observacao: null, link_loja: 'javascript:alert(1)', removido: false },
      { id: 6, nome: 'Carrinho de passeio', categoria: 'passeio', quantidade: 1, observacao: 'Que feche pequeno', link_loja: 'http://exemplo.com.br/carrinho', removido: false },
      { id: 7, nome: 'Mamadeira anticólica', categoria: 'alimentacao', quantidade: 2, observacao: null, link_loja: null, removido: false },
      { id: 8, nome: 'Móbile musical', categoria: 'quarto', quantidade: 2, observacao: null, link_loja: null, removido: false },
    ],
    convidados: new Map(), // email -> { nome, email, id }
    sessoes: new Map(), // token -> email
    escolhas: [], // { itemId, convidado (email ou 'outra'), quantidade }
    codigos: new Map(), // email -> { nome, tentativas }
    proximoId: 1,
  };
}

let S = estadoInicial();

const soma = (itemId) => S.escolhas.filter((e) => e.itemId === itemId).reduce((n, e) => n + e.quantidade, 0);
const restanteDe = (i) => (i.quantidade === null ? null : Math.max(0, i.quantidade - soma(i.id)));
const minha = (email, itemId) => S.escolhas.find((e) => e.itemId === itemId && e.convidado === email);

function lista(email) {
  const c = S.convidados.get(email);
  return {
    gestante_nome: 'Ana',
    recado: 'Chá de bebê dia 12/12, às 15h. Entrega na casa da Vó Lúcia, Rua das Flores, 120.',
    convidado: { nome: c.nome, email: c.email },
    disponiveis: S.itens
      .filter((i) => !i.removido && (restanteDe(i) === null || restanteDe(i) > 0))
      .map((i) => ({
        id: i.id,
        nome: i.nome,
        categoria: i.categoria,
        restante: restanteDe(i),
        observacao: i.observacao,
        link_loja: i.link_loja,
        minha_quantidade: minha(email, i.id)?.quantidade ?? 0,
      })),
    minhas_escolhas: S.escolhas
      .filter((e) => e.convidado === email)
      .map((e) => {
        const i = S.itens.find((x) => x.id === e.itemId);
        return {
          item_id: i.id,
          nome: i.nome,
          categoria: i.categoria,
          quantidade: e.quantidade,
          removido: i.removido,
          restante: restanteDe(i),
          observacao: i.observacao,
          link_loja: i.link_loja,
        };
      }),
  };
}

function enviar(res, status, corpo) {
  const dados = corpo === undefined ? '' : JSON.stringify(corpo);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });
  res.end(dados);
}

async function lerCorpo(req) {
  const partes = [];
  for await (const p of req) partes.push(p);
  const texto = Buffer.concat(partes).toString('utf8');
  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    return {};
  }
}

const emailValido = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const caminho = url.pathname;
  if (req.method === 'OPTIONS') return enviar(res, 204);

  // Apoio ao teste
  if (caminho.startsWith('/__teste/')) {
    const corpo = await lerCorpo(req);
    const acao = caminho.slice('/__teste/'.length);
    if (acao === 'reiniciar') S = estadoInicial();
    else if (acao === 'expirar') S.sessoes.clear();
    else if (acao === 'reenviar') S.reenviarSeg = Number(corpo.segundos) || 60;
    else if (acao === 'remover') S.itens.find((i) => i.id === corpo.itemId).removido = true;
    else if (acao === 'outra') S.escolhas.push({ itemId: corpo.itemId, convidado: 'outra', quantidade: corpo.quantidade });
    return enviar(res, 200, { ok: true });
  }

  const base = '/api/v1';
  if (!caminho.startsWith(`${base}/convidado/`)) return enviar(res, 404, { message: 'Não encontrado.' });
  const rota = caminho.slice(`${base}/convidado`.length);

  // Sem sessão
  let m = rota.match(/^\/enxoval\/([^/]+)(\/codigo|\/entrar)?$/);
  if (m) {
    const link = decodeURIComponent(m[1]);
    if (link !== LINK && link !== LINK2) return enviar(res, 404, { message: 'Link inválido.' });
    if (!m[2] && req.method === 'GET') return enviar(res, 200, { data: { gestante_nome: 'Ana' } });
    const corpo = await lerCorpo(req);
    if (m[2] === '/codigo' && req.method === 'POST') {
      const erros = {};
      if (!corpo.nome || !String(corpo.nome).trim()) erros.nome = ['O campo nome é obrigatório.'];
      if (!emailValido(corpo.email)) erros.email = ['O campo e-mail deve ser um endereço válido.'];
      else if (String(corpo.email).trim().toLowerCase() === 'ana@exemplo.com') erros.email = ['Este e-mail não pode entrar neste enxoval.'];
      if (Object.keys(erros).length) return enviar(res, 422, { message: 'Dados inválidos.', errors: erros });
      S.codigos.set(String(corpo.email).trim().toLowerCase(), { nome: String(corpo.nome).trim(), tentativas: 0 });
      return enviar(res, 202, { data: { reenviar_em_seg: S.reenviarSeg } });
    }
    if (m[2] === '/entrar' && req.method === 'POST') {
      const email = String(corpo.email ?? '').trim().toLowerCase();
      const pendente = S.codigos.get(email);
      if (!pendente || String(corpo.codigo) !== CODIGO) {
        return enviar(res, 422, { message: 'Código inválido ou vencido. Peça outro.', errors: { codigo: ['Código inválido ou vencido. Peça outro.'] } });
      }
      S.codigos.delete(email);
      let c = S.convidados.get(email);
      if (!c) {
        c = { id: S.proximoId++, nome: pendente.nome, email };
        S.convidados.set(email, c);
      }
      const token = randomBytes(32).toString('hex');
      S.sessoes.set(token, email);
      return enviar(res, 200, { data: { token, convidado: { nome: c.nome, email: c.email } } });
    }
    return enviar(res, 404, { message: 'Não encontrado.' });
  }

  // Com sessão
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  const email = S.sessoes.get(token);
  if (!email || !S.convidados.has(email)) return enviar(res, 401, { message: 'Não autenticado.' });

  if (rota === '/lista' && req.method === 'GET') return enviar(res, 200, { data: lista(email) });

  if (rota === '/sessao' && req.method === 'DELETE') {
    S.sessoes.delete(token);
    return enviar(res, 204);
  }

  if (rota === '/eu' && req.method === 'DELETE') {
    S.convidados.delete(email);
    S.escolhas = S.escolhas.filter((e) => e.convidado !== email);
    for (const [t, e] of S.sessoes) if (e === email) S.sessoes.delete(t);
    return enviar(res, 204);
  }

  m = rota.match(/^\/escolhas\/(\d+)$/);
  if (m) {
    const item = S.itens.find((i) => i.id === Number(m[1]));
    if (!item) return enviar(res, 404, { message: 'Não encontrado.' });
    const atual = minha(email, item.id);
    if (req.method === 'DELETE') {
      if (!atual) return enviar(res, 404, { message: 'Você não escolheu este presente.' });
      S.escolhas = S.escolhas.filter((e) => e !== atual);
      return enviar(res, 200, { data: lista(email) });
    }
    if (req.method === 'PUT') {
      const { quantidade } = await lerCorpo(req);
      if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 999) {
        return enviar(res, 422, { message: 'Quantidade inválida.', errors: { quantidade: ['A quantidade deve ser de 1 a 999.'] } });
      }
      if (item.removido) {
        if (!atual) return enviar(res, 404, { message: 'Não encontrado.' });
        if (quantidade > atual.quantidade) return enviar(res, 422, { message: 'Esse presente saiu da lista.', errors: { quantidade: ['Esse presente saiu da lista.'] } });
      }
      const limite = item.quantidade === null ? 999 : Math.min(999, (restanteDe(item) ?? 0) + (atual?.quantidade ?? 0));
      if (quantidade > limite && !(item.removido && atual)) {
        return enviar(res, 409, { message: 'Esse presente acabou de ser escolhido por outra pessoa.', data: lista(email) });
      }
      if (atual) atual.quantidade = quantidade;
      else S.escolhas.push({ itemId: item.id, convidado: email, quantidade });
      return enviar(res, 200, { data: lista(email) });
    }
  }

  return enviar(res, 404, { message: 'Não encontrado.' });
});

servidor.listen(PORTA, '127.0.0.1', () => console.log(`API falsa em http://127.0.0.1:${PORTA}/api/v1 (links ${LINK} e ${LINK2}, código ${CODIGO})`));
