import { describe, expect, it, vi } from 'vitest';
import { criarCliente, traduzirErro } from '../src/lib/enxoval/api';
import { linkDoHash, segundosAte, soDigitos } from '../src/lib/enxoval/link';
import { esquecerToken, guardarSessao, sessaoDoLink, sessoesGuardadas } from '../src/lib/enxoval/sessao';

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status });
}

describe('cliente da API', () => {
  it('manda o token no cabeçalho, nunca na URL, e sem cookies', async () => {
    const buscar = vi.fn(async () => resposta(204));
    await criarCliente('https://api.exemplo/api/v1/', buscar as unknown as typeof fetch).sair('segredo');
    const [url, init] = buscar.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.exemplo/api/v1/convidado/sessao');
    expect(url).not.toContain('segredo');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer segredo');
    expect(init.credentials).toBe('omit');
    expect(init.method).toBe('DELETE');
  });

  it('PUT de escolha leva a quantidade no corpo', async () => {
    const lista = { data: { gestante_nome: 'Ana', recado: null, convidado: { nome: 'a', email: 'b' }, disponiveis: [], minhas_escolhas: [] } };
    const buscar = vi.fn(async () => resposta(200, lista));
    const r = await criarCliente('https://x/api/v1', buscar as unknown as typeof fetch).escolher('t', 7, 3);
    const [url, init] = buscar.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x/api/v1/convidado/escolhas/7');
    expect(init.body).toBe('{"quantidade":3}');
    expect(r.ok).toBe(true);
  });

  it('o link vai escapado no caminho', async () => {
    const buscar = vi.fn(async () => resposta(200, { data: { gestante_nome: 'Ana' } }));
    await criarCliente('https://x/api/v1', buscar as unknown as typeof fetch).infoDoLink('a/b');
    expect((buscar.mock.calls[0] as unknown as [string])[0]).toBe('https://x/api/v1/convidado/enxoval/a%2Fb');
  });

  it('erro de rede vira { tipo: rede }', async () => {
    const buscar = vi.fn(async () => {
      throw new TypeError('failed');
    });
    const r = await criarCliente('https://x', buscar as unknown as typeof fetch).lista('t');
    expect(r).toEqual({ ok: false, erro: { tipo: 'rede' } });
  });

  it('traduz os status do contrato', () => {
    expect(traduzirErro(401, null)).toEqual({ tipo: 'nao-autorizado' });
    expect(traduzirErro(404, null)).toEqual({ tipo: 'nao-encontrado' });
    expect(traduzirErro(429, { message: 'Muitos' })).toEqual({ tipo: 'limite', mensagem: 'Muitos' });
    expect(traduzirErro(422, { message: 'm', errors: { codigo: ['Código inválido ou vencido. Peça outro.'] } })).toEqual({
      tipo: 'validacao',
      mensagem: 'm',
      campos: { codigo: 'Código inválido ou vencido. Peça outro.' },
    });
    const lista = { gestante_nome: 'Ana', disponiveis: [], minhas_escolhas: [] };
    expect(traduzirErro(409, { message: 'acabou', data: lista })).toMatchObject({ tipo: 'conflito', mensagem: 'acabou', lista });
  });
});

describe('link e tempo', () => {
  it('lê o link do fragmento e recusa o que não parece link', () => {
    expect(linkDoHash('#AbC123xyzAbC123xyz')).toBe('AbC123xyzAbC123xyz');
    expect(linkDoHash('')).toBeNull();
    expect(linkDoHash('#')).toBeNull();
    expect(linkDoHash('#../../etc')).toBeNull();
    expect(linkDoHash('#curto')).toBeNull();
  });

  it('segundos até o fim nunca ficam negativos', () => {
    expect(segundosAte(10_000, 4_500)).toBe(6);
    expect(segundosAte(1_000, 5_000)).toBe(0);
  });

  it('código só aceita seis dígitos', () => {
    expect(soDigitos('12a3 45 678')).toBe('123456');
  });
});

describe('sessão guardada', () => {
  function memoria(): Storage {
    const m = new Map<string, string>();
    return {
      get length() {
        return m.size;
      },
      key: (i: number) => [...m.keys()][i] ?? null,
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
      clear: () => m.clear(),
    };
  }

  it('guarda por ambiente e link; sem link, lista as do ambiente (a mais recente primeiro)', () => {
    const s = memoria();
    guardarSessao(s, 'prod', { token: 't1', link: 'LINKANTIGO', gestanteNome: 'Ana', em: 1 });
    guardarSessao(s, 'homolog', { token: 't2', link: 'LINKHOMOLOG', gestanteNome: 'Ana', em: 2 });
    expect(sessaoDoLink(s, 'prod', 'LINKANTIGO')?.token).toBe('t1');
    expect(sessaoDoLink(s, 'prod', 'LINKNOVO')).toBeNull();
    expect(sessoesGuardadas(s, 'prod').map((x) => x.token)).toEqual(['t1']);
  });

  it('esquecer o token apaga todas as chaves que o guardam', () => {
    const s = memoria();
    guardarSessao(s, 'prod', { token: 't1', link: 'A', gestanteNome: 'Ana', em: 1 });
    guardarSessao(s, 'prod', { token: 't1', link: 'B', gestanteNome: 'Ana', em: 2 });
    guardarSessao(s, 'prod', { token: 't9', link: 'C', gestanteNome: 'Bia', em: 3 });
    esquecerToken(s, 'prod', 't1');
    expect(s.length).toBe(1);
  });
});
