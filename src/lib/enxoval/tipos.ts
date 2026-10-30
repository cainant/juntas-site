/** Formatos do contrato da API do convidado (docs/enxoval-dados-e-api.md no repositório do app). */

export const CATEGORIAS = ['quarto', 'vestir', 'higiene', 'banho', 'alimentacao', 'passeio', 'outros'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  quarto: 'Quarto',
  vestir: 'Vestir',
  higiene: 'Higiene',
  banho: 'Banho',
  alimentacao: 'Alimentação',
  passeio: 'Passeio',
  outros: 'Outros',
};

export interface Presente {
  id: number;
  nome: string;
  categoria: Categoria;
  /** null quando o item é ilimitado. Nunca existe a quantidade total. */
  restante: number | null;
  observacao: string | null;
  link_loja: string | null;
  minha_quantidade: number;
}

export interface Escolha {
  item_id: number;
  nome: string;
  categoria: Categoria;
  quantidade: number;
  removido: boolean;
  restante: number | null;
  observacao: string | null;
  link_loja: string | null;
}

export interface Lista {
  gestante_nome: string;
  recado: string | null;
  convidado: { nome: string; email: string };
  disponiveis: Presente[];
  minhas_escolhas: Escolha[];
}

export interface InfoLink {
  gestante_nome: string;
}

export interface Entrada {
  token: string;
  convidado: { nome: string; email: string };
}

/** Falha da API já traduzida para o que a tela precisa. */
export type ErroApi =
  | { tipo: 'rede' }
  | { tipo: 'nao-encontrado' }
  | { tipo: 'nao-autorizado' }
  | { tipo: 'validacao'; mensagem: string; campos: Record<string, string> }
  | { tipo: 'limite'; mensagem: string }
  | { tipo: 'conflito'; mensagem: string; lista: Lista | null }
  | { tipo: 'servidor'; mensagem: string };
