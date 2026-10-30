import { describe, expect, it } from 'vitest';
import { estadoInicial, reduzir, type Estado, type Evento } from '../src/lib/enxoval/estado';
import type { Lista } from '../src/lib/enxoval/tipos';

const lista = (extra: Partial<Lista> = {}): Lista => ({
  gestante_nome: 'Ana',
  recado: null,
  convidado: { nome: 'Bia', email: 'bia@exemplo.com' },
  disponiveis: [],
  minhas_escolhas: [],
  ...extra,
});

const rodar = (...eventos: Evento[]): Estado => eventos.reduce(reduzir, estadoInicial);

describe('entrada', () => {
  it('link ok mostra o formulário com o nome da gestante', () => {
    const s = rodar({ e: 'link-ok', gestanteNome: 'Ana' });
    expect(s.tela).toMatchObject({ t: 'entrar', gestanteNome: 'Ana', nome: '', email: '' });
  });

  it('sem link e link inválido são telas próprias', () => {
    expect(rodar({ e: 'sem-link' }).tela.t).toBe('sem-link');
    expect(rodar({ e: 'link-invalido' }).tela.t).toBe('link-invalido');
  });

  it('pedir código leva à tela do código e guarda quando poderá reenviar', () => {
    const s = rodar(
      { e: 'link-ok', gestanteNome: 'Ana' },
      { e: 'editar-dados', nome: 'Bia', email: 'bia@exemplo.com' },
      { e: 'ocupado' },
      { e: 'codigo-enviado', reenviarAte: 1000 },
    );
    expect(s.ocupado).toBe(false);
    expect(s.tela).toMatchObject({ t: 'codigo', nome: 'Bia', email: 'bia@exemplo.com', reenviarAte: 1000, erro: null });
  });

  it('422 no pedido fica no campo', () => {
    const s = rodar(
      { e: 'link-ok', gestanteNome: 'Ana' },
      { e: 'pedido-recusado', campos: { email: 'Este e-mail não pode entrar neste enxoval.' }, erro: null },
    );
    expect(s.tela).toMatchObject({ t: 'entrar', campos: { email: 'Este e-mail não pode entrar neste enxoval.' } });
  });

  it('código errado mostra o erro na tela do código', () => {
    const s = rodar(
      { e: 'link-ok', gestanteNome: 'Ana' },
      { e: 'codigo-enviado', reenviarAte: 1 },
      { e: 'codigo-recusado', erro: 'Código inválido ou vencido. Peça outro.' },
    );
    expect(s.tela).toMatchObject({ t: 'codigo', erro: 'Código inválido ou vencido. Peça outro.' });
  });

  it('trocar o e-mail volta ao formulário com o que foi digitado', () => {
    const s = rodar(
      { e: 'link-ok', gestanteNome: 'Ana' },
      { e: 'editar-dados', nome: 'Bia', email: 'errado@exemplo.com' },
      { e: 'codigo-enviado', reenviarAte: 1 },
      { e: 'trocar-email' },
    );
    expect(s.tela).toMatchObject({ t: 'entrar', nome: 'Bia', email: 'errado@exemplo.com' });
  });

  it('entrar leva à lista em Presentes', () => {
    const s = rodar({ e: 'link-ok', gestanteNome: 'Ana' }, { e: 'entrou', lista: lista() });
    expect(s.tela).toMatchObject({ t: 'lista', vista: 'presentes' });
  });
});

describe('lista', () => {
  const dentro = () => rodar({ e: 'entrou', lista: lista() });

  it('a lista devolvida substitui a da tela e mantém a vista', () => {
    const nova = lista({ recado: 'Chá dia 12' });
    const s = reduzir(reduzir(dentro(), { e: 'vista', vista: 'escolhas' }), { e: 'lista', lista: nova, aviso: { texto: 'ok' } });
    expect(s.tela).toMatchObject({ t: 'lista', vista: 'escolhas' });
    expect(s.tela.t === 'lista' && s.tela.lista).toBe(nova);
    expect(s.aviso).toEqual({ texto: 'ok' });
  });

  it('409 troca a lista pelos dados e mostra a mensagem como erro', () => {
    const nova = lista({ recado: 'nova' });
    const s = reduzir(dentro(), { e: 'conflito', lista: nova, mensagem: 'Esse presente acabou de ser escolhido por outra pessoa.' });
    expect(s.tela.t === 'lista' && s.tela.lista).toBe(nova);
    expect(s.aviso).toEqual({ texto: 'Esse presente acabou de ser escolhido por outra pessoa.', erro: true });
    expect(s.conflitos).toBe(1);
  });

  it('409 sem dados mantém a lista e ainda avisa', () => {
    const antes = dentro();
    const s = reduzir(antes, { e: 'conflito', lista: null, mensagem: 'x' });
    expect(s.tela).toBe(antes.tela);
    expect(s.aviso?.erro).toBe(true);
  });

  it('falha de rede guarda a ação e some na próxima tentativa', () => {
    const acao = { k: 'escolher', itemId: 3, quantidade: 2, nova: true } as const;
    const falhou = reduzir(reduzir(dentro(), { e: 'ocupado' }), { e: 'rede-falhou', acao });
    expect(falhou.falha).toEqual(acao);
    expect(falhou.ocupado).toBe(false);
    expect(reduzir(falhou, { e: 'ocupado' }).falha).toBeNull();
  });

  it('a lista continua na tela depois de uma falha de rede', () => {
    const s = reduzir(dentro(), { e: 'rede-falhou', acao: { k: 'desfazer', itemId: 1 } });
    expect(s.tela.t).toBe('lista');
  });

  it('401 volta para entrar com o nome da gestante', () => {
    const s = reduzir(dentro(), { e: 'sessao-expirou', gestanteNome: null });
    expect(s.tela).toMatchObject({ t: 'entrar', gestanteNome: 'Ana' });
  });

  it('sair e apagar voltam para entrar, com o aviso certo', () => {
    expect(reduzir(dentro(), { e: 'saiu', gestanteNome: null, apagou: false }).aviso?.texto).toBe('Você saiu do enxoval.');
    const apagou = reduzir(dentro(), { e: 'saiu', gestanteNome: null, apagou: true });
    expect(apagou.aviso?.texto).toBe('Seus dados foram apagados.');
    expect(apagou.tela).toMatchObject({ t: 'entrar', gestanteNome: 'Ana', nome: '', email: '' });
  });

  it('trocar a vista fora da lista não faz nada', () => {
    const s = rodar({ e: 'sem-link' });
    expect(reduzir(s, { e: 'vista', vista: 'escolhas' })).toBe(s);
  });
});
