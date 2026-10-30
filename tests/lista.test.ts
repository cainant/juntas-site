import { describe, expect, it } from 'vitest';
import {
  agrupar,
  categoriasPresentes,
  escolheDireto,
  filtrar,
  limiteDaEscolha,
  limiteDaMinhaEscolha,
  limitar,
  lojaSegura,
  textoRestante,
} from '../src/lib/enxoval/lista';
import type { Presente } from '../src/lib/enxoval/tipos';

const p = (id: number, nome: string, categoria: Presente['categoria'], extra: Partial<Presente> = {}): Presente => ({
  id,
  nome,
  categoria,
  restante: 3,
  observacao: null,
  link_loja: null,
  minha_quantidade: 0,
  ...extra,
});

const itens = [
  p(1, 'Body manga curta', 'vestir'),
  p(2, 'Berço', 'quarto', { observacao: 'Cor madeira clara' }),
  p(3, 'Sabonete líquido', 'higiene'),
  p(4, 'Macacão', 'vestir'),
];

describe('categorias e agrupamento', () => {
  it('lista só as categorias presentes, na ordem do app', () => {
    expect(categoriasPresentes(itens)).toEqual(['quarto', 'vestir', 'higiene']);
  });

  it('agrupa mantendo a ordem de chegada dentro de cada categoria', () => {
    const g = agrupar(itens);
    expect(g.map((x) => x.categoria)).toEqual(['quarto', 'vestir', 'higiene']);
    expect(g[1].itens.map((i) => i.id)).toEqual([1, 4]);
  });

  it('lista vazia não gera grupo', () => {
    expect(agrupar([])).toEqual([]);
  });
});

describe('filtro', () => {
  it('ignora acento e maiúscula, e olha a observação', () => {
    expect(filtrar(itens, 'BERCO', null).map((i) => i.id)).toEqual([2]);
    expect(filtrar(itens, 'madeira', null).map((i) => i.id)).toEqual([2]);
    expect(filtrar(itens, 'sabonete liquido', null).map((i) => i.id)).toEqual([3]);
  });

  it('combina busca e categoria', () => {
    expect(filtrar(itens, 'ma', 'vestir').map((i) => i.id)).toEqual([1, 4]);
    expect(filtrar(itens, 'berço', 'vestir')).toEqual([]);
  });

  it('busca vazia devolve tudo', () => {
    expect(filtrar(itens, '  ', null)).toHaveLength(4);
  });
});

describe('limite da escolha', () => {
  it('é o restante mais o que a pessoa já escolheu', () => {
    expect(limiteDaEscolha({ restante: 2, minha_quantidade: 3 })).toBe(5);
    expect(limiteDaEscolha({ restante: 0, minha_quantidade: 1 })).toBe(1);
  });

  it('ilimitado vai até 999', () => {
    expect(limiteDaEscolha({ restante: null, minha_quantidade: 0 })).toBe(999);
  });

  it('nunca passa de 999', () => {
    expect(limiteDaEscolha({ restante: 990, minha_quantidade: 20 })).toBe(999);
  });

  it('presente de uma unidade possível escolhe direto', () => {
    expect(escolheDireto({ restante: 1, minha_quantidade: 0 })).toBe(true);
    expect(escolheDireto({ restante: 0, minha_quantidade: 1 })).toBe(true);
    expect(escolheDireto({ restante: 2, minha_quantidade: 0 })).toBe(false);
    expect(escolheDireto({ restante: null, minha_quantidade: 0 })).toBe(false);
  });

  it('item removido só desce', () => {
    expect(limiteDaMinhaEscolha({ restante: 5, quantidade: 2, removido: true })).toBe(2);
    expect(limiteDaMinhaEscolha({ restante: 5, quantidade: 2, removido: false })).toBe(7);
    expect(limiteDaMinhaEscolha({ restante: null, quantidade: 2, removido: false })).toBe(999);
  });

  it('limitar corta nos extremos e aceita lixo', () => {
    expect(limitar(0, 1, 5)).toBe(1);
    expect(limitar(9, 1, 5)).toBe(5);
    expect(limitar(2.9, 1, 5)).toBe(2);
    expect(limitar(Number.NaN, 1, 5)).toBe(1);
  });
});

describe('textos e links', () => {
  it('restante nulo não mostra nada', () => {
    expect(textoRestante(null)).toBeNull();
    expect(textoRestante(4)).toBe('Restam 4');
  });

  it('só http e https viram link de loja', () => {
    expect(lojaSegura('https://loja.com/berco')).toBe('https://loja.com/berco');
    expect(lojaSegura('http://loja.com/')).toBe('http://loja.com/');
    expect(lojaSegura('javascript:alert(1)')).toBeNull();
    expect(lojaSegura('data:text/html,x')).toBeNull();
    expect(lojaSegura('não é url')).toBeNull();
    expect(lojaSegura(null)).toBeNull();
  });
});
