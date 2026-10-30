/**
 * A sessão do convidado fica no localStorage, numa chave que inclui o ambiente e o link.
 * O token e o link nunca vão para o console nem para uma query string.
 */
export interface SessaoGuardada {
  token: string;
  link: string;
  gestanteNome: string;
  /** milissegundos de época do último uso, para escolher a mais recente. */
  em: number;
}

const PREFIXO = 'juntas.enxoval.';

function chave(ambiente: string, link: string): string {
  return `${PREFIXO}${ambiente}.${link}`;
}

function ler(storage: Storage, k: string): SessaoGuardada | null {
  try {
    const bruto = storage.getItem(k);
    if (!bruto) return null;
    const v = JSON.parse(bruto) as Partial<SessaoGuardada>;
    if (typeof v.token !== 'string' || typeof v.link !== 'string') return null;
    return { token: v.token, link: v.link, gestanteNome: String(v.gestanteNome ?? ''), em: Number(v.em ?? 0) };
  } catch {
    return null;
  }
}

function chavesDoAmbiente(storage: Storage, ambiente: string): string[] {
  const inicio = `${PREFIXO}${ambiente}.`;
  const achadas: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && k.startsWith(inicio)) achadas.push(k);
  }
  return achadas;
}

export function sessaoDoLink(storage: Storage, ambiente: string, link: string): SessaoGuardada | null {
  return ler(storage, chave(ambiente, link));
}

/** Sessões guardadas do ambiente, a mais recente primeiro (usada quando a página abre sem link). */
export function sessoesGuardadas(storage: Storage, ambiente: string): SessaoGuardada[] {
  return chavesDoAmbiente(storage, ambiente)
    .map((k) => ler(storage, k))
    .filter((s): s is SessaoGuardada => s !== null)
    .sort((a, b) => b.em - a.em);
}

export function guardarSessao(storage: Storage, ambiente: string, sessao: SessaoGuardada): void {
  try {
    storage.setItem(chave(ambiente, sessao.link), JSON.stringify(sessao));
  } catch {
    // armazenamento cheio ou bloqueado: a pessoa entra de novo na próxima vez
  }
}

/** Apaga todo registro que guarda este token (o mesmo token pode estar sob mais de um link). */
export function esquecerToken(storage: Storage, ambiente: string, token: string): void {
  for (const k of chavesDoAmbiente(storage, ambiente)) {
    if (ler(storage, k)?.token === token) {
      try {
        storage.removeItem(k);
      } catch {
        // ignora
      }
    }
  }
}
