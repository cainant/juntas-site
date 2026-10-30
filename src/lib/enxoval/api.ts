import type { Entrada, ErroApi, InfoLink, Lista } from './tipos';

export type Resultado<T> = { ok: true; dado: T } | { ok: false; erro: ErroApi };

export interface ClienteApi {
  infoDoLink(link: string): Promise<Resultado<InfoLink>>;
  pedirCodigo(link: string, corpo: { nome: string; email: string }): Promise<Resultado<{ reenviar_em_seg: number }>>;
  entrar(link: string, corpo: { email: string; codigo: string }): Promise<Resultado<Entrada>>;
  lista(token: string): Promise<Resultado<Lista>>;
  escolher(token: string, itemId: number, quantidade: number): Promise<Resultado<Lista>>;
  desfazer(token: string, itemId: number): Promise<Resultado<Lista>>;
  sair(token: string): Promise<Resultado<null>>;
  apagarEu(token: string): Promise<Resultado<null>>;
}

type Corpo = Record<string, unknown> | null;

const TEMPO_LIMITE_MS = 20_000;

function mensagemDe(corpo: Corpo): string {
  return corpo && typeof corpo.message === 'string' ? corpo.message : '';
}

/** Primeira mensagem de cada campo do formato de erro do Laravel. */
function camposDe(corpo: Corpo): Record<string, string> {
  const campos: Record<string, string> = {};
  const erros = corpo?.errors;
  if (erros && typeof erros === 'object') {
    for (const [campo, msgs] of Object.entries(erros as Record<string, unknown>)) {
      if (Array.isArray(msgs) && typeof msgs[0] === 'string') campos[campo] = msgs[0];
    }
  }
  return campos;
}

function listaDe(corpo: Corpo): Lista | null {
  const d = corpo?.data as Lista | undefined;
  return d && Array.isArray(d.disponiveis) && Array.isArray(d.minhas_escolhas) ? d : null;
}

export function traduzirErro(status: number, corpo: Corpo): ErroApi {
  if (status === 401) return { tipo: 'nao-autorizado' };
  if (status === 404) return { tipo: 'nao-encontrado' };
  if (status === 409) return { tipo: 'conflito', mensagem: mensagemDe(corpo), lista: listaDe(corpo) };
  if (status === 422) return { tipo: 'validacao', mensagem: mensagemDe(corpo), campos: camposDe(corpo) };
  if (status === 429) return { tipo: 'limite', mensagem: mensagemDe(corpo) };
  return { tipo: 'servidor', mensagem: mensagemDe(corpo) };
}

/**
 * Cliente da API do convidado. Nada aqui registra link ou token em log, e o token
 * só vai no cabeçalho Authorization, nunca na URL.
 */
export function criarCliente(base: string, buscar: typeof fetch = (...a) => fetch(...a)): ClienteApi {
  const raiz = base.replace(/\/+$/, '');

  async function chamar<T>(
    metodo: string,
    caminho: string,
    opcoes: { token?: string; corpo?: unknown; extrair?: (corpo: Corpo) => T | null },
  ): Promise<Resultado<T>> {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
      const cabecalhos: Record<string, string> = { Accept: 'application/json' };
      if (opcoes.token) cabecalhos.Authorization = `Bearer ${opcoes.token}`;
      if (opcoes.corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
      const resposta = await buscar(`${raiz}${caminho}`, {
        method: metodo,
        headers: cabecalhos,
        body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: controle.signal,
      });
      let corpo: Corpo = null;
      if (resposta.status !== 204) {
        try {
          corpo = (await resposta.json()) as Corpo;
        } catch {
          corpo = null;
        }
      }
      if (!resposta.ok) return { ok: false, erro: traduzirErro(resposta.status, corpo) };
      const dado = opcoes.extrair ? opcoes.extrair(corpo) : (null as T);
      if (dado === null && opcoes.extrair) return { ok: false, erro: { tipo: 'servidor', mensagem: '' } };
      return { ok: true, dado: dado as T };
    } catch {
      return { ok: false, erro: { tipo: 'rede' } };
    } finally {
      clearTimeout(relogio);
    }
  }

  const lista = (c: Corpo) => listaDe(c);
  const l = (link: string) => encodeURIComponent(link);
  const e = (id: number) => encodeURIComponent(String(id));

  return {
    infoDoLink: (link) =>
      chamar<InfoLink>('GET', `/convidado/enxoval/${l(link)}`, {
        extrair: (c) => {
          const d = c?.data as InfoLink | undefined;
          return d && typeof d.gestante_nome === 'string' ? d : null;
        },
      }),
    pedirCodigo: (link, corpo) =>
      chamar('POST', `/convidado/enxoval/${l(link)}/codigo`, {
        corpo,
        extrair: (c) => {
          const s = Number((c?.data as { reenviar_em_seg?: unknown } | undefined)?.reenviar_em_seg);
          return { reenviar_em_seg: Number.isFinite(s) && s > 0 ? s : 60 };
        },
      }),
    entrar: (link, corpo) =>
      chamar<Entrada>('POST', `/convidado/enxoval/${l(link)}/entrar`, {
        corpo,
        extrair: (c) => {
          const d = c?.data as Entrada | undefined;
          return d && typeof d.token === 'string' && d.convidado ? d : null;
        },
      }),
    lista: (token) => chamar('GET', '/convidado/lista', { token, extrair: lista }),
    escolher: (token, id, quantidade) =>
      chamar('PUT', `/convidado/escolhas/${e(id)}`, { token, corpo: { quantidade }, extrair: lista }),
    desfazer: (token, id) => chamar('DELETE', `/convidado/escolhas/${e(id)}`, { token, extrair: lista }),
    sair: (token) => chamar<null>('DELETE', '/convidado/sessao', { token }),
    apagarEu: (token) => chamar<null>('DELETE', '/convidado/eu', { token }),
  };
}

export const API_PRODUCAO = 'https://api.juntas.app.br/api/v1';
export const API_HOMOLOGACAO = 'https://api-homolog.juntas.app.br/api/v1';

export function origemDe(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}
