import { CATEGORIAS, type Categoria, type Escolha, type Presente } from './tipos';

export const MAXIMO_POR_ESCOLHA = 999;

/** Minúsculas e sem acento, para a busca achar "alimentacao" digitando "Alimentação". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Categorias que existem na lista, na ordem fixa do app. */
export function categoriasPresentes(presentes: readonly Presente[]): Categoria[] {
  const achadas = new Set(presentes.map((p) => p.categoria));
  return CATEGORIAS.filter((c) => achadas.has(c));
}

export function filtrar(presentes: readonly Presente[], busca: string, categoria: Categoria | null): Presente[] {
  const termo = normalizar(busca);
  return presentes.filter((p) => {
    if (categoria && p.categoria !== categoria) return false;
    if (!termo) return true;
    return normalizar(`${p.nome} ${p.observacao ?? ''}`).includes(termo);
  });
}

export interface Grupo<T extends { categoria: Categoria }> {
  categoria: Categoria;
  itens: T[];
}

/** Agrupa por categoria na ordem fixa; dentro de cada uma, mantém a ordem recebida. */
export function agrupar<T extends { categoria: Categoria }>(itens: readonly T[]): Grupo<T>[] {
  return CATEGORIAS.map((categoria) => ({ categoria, itens: itens.filter((i) => i.categoria === categoria) })).filter(
    (g) => g.itens.length > 0,
  );
}

/** O mais que a pessoa pode ter escolhido neste presente agora. */
export function limiteDaEscolha(item: Pick<Presente, 'restante' | 'minha_quantidade'>): number {
  if (item.restante === null) return MAXIMO_POR_ESCOLHA;
  return Math.min(MAXIMO_POR_ESCOLHA, item.restante + item.minha_quantidade);
}

/** Presente de uma unidade possível escolhe direto, sem passo para a quantidade. */
export function escolheDireto(item: Pick<Presente, 'restante' | 'minha_quantidade'>): boolean {
  return limiteDaEscolha(item) <= 1;
}

/** Quanto ainda dá para subir numa escolha que já existe (item removido nunca sobe). */
export function limiteDaMinhaEscolha(escolha: Pick<Escolha, 'restante' | 'quantidade' | 'removido'>): number {
  if (escolha.removido) return escolha.quantidade;
  if (escolha.restante === null) return MAXIMO_POR_ESCOLHA;
  return Math.min(MAXIMO_POR_ESCOLHA, escolha.restante + escolha.quantidade);
}

export function limitar(valor: number, minimo: number, maximo: number): number {
  if (!Number.isFinite(valor)) return minimo;
  return Math.min(maximo, Math.max(minimo, Math.trunc(valor)));
}

/** Só endereços http e https viram link; qualquer outra coisa (javascript:, data:) é descartada. */
export function lojaSegura(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

export function textoRestante(restante: number | null): string | null {
  if (restante === null) return null;
  return `Restam ${restante}`;
}

export function conta(n: number, singular: string, plural: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${plural}`;
}
