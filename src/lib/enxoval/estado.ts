import type { Lista } from './tipos';

/**
 * Máquina de estados da tela do convidado. É pura: o componente faz as chamadas à API e
 * entrega o resultado como evento. A lista que a API devolve é a única fonte de verdade
 * (nunca somamos nem subtraímos escolhas por conta própria).
 */

export type Vista = 'presentes' | 'escolhas';

/** O que a pessoa tentou fazer, para o "Tentar de novo" repetir. */
export type Acao =
  | { k: 'iniciar' }
  | { k: 'pedir-codigo'; reenvio: boolean }
  | { k: 'entrar'; codigo: string }
  | { k: 'escolher'; itemId: number; quantidade: number; nova: boolean }
  | { k: 'desfazer'; itemId: number }
  | { k: 'sair' }
  | { k: 'apagar' };

export type Tela =
  | { t: 'iniciando' }
  | { t: 'sem-link' }
  | { t: 'link-invalido' }
  | { t: 'entrar'; gestanteNome: string; nome: string; email: string; campos: { nome?: string; email?: string }; erro: string | null }
  | { t: 'codigo'; gestanteNome: string; nome: string; email: string; reenviarAte: number; erro: string | null }
  | { t: 'lista'; lista: Lista; vista: Vista };

export interface Aviso {
  texto: string;
  /** Presente para o qual "Desfazer" apaga a escolha recém-criada. */
  desfazItemId?: number;
  /** Texto de erro (conflito etc.): vai num alerta, não num aviso de sucesso. */
  erro?: boolean;
}

export interface Estado {
  tela: Tela;
  aviso: Aviso | null;
  /** Rede caiu: a tela mostra "Tentar de novo" para repetir esta ação. */
  falha: Acao | null;
  /** Há uma chamada em curso; os botões ficam desligados para não correr em paralelo. */
  ocupado: boolean;
  /** Incrementa a cada 409, para a tela reposicionar o foco. */
  conflitos: number;
}

export type Evento =
  | { e: 'sem-link' }
  | { e: 'iniciando' }
  | { e: 'link-invalido' }
  | { e: 'link-ok'; gestanteNome: string }
  | { e: 'ocupado' }
  | { e: 'rede-falhou'; acao: Acao }
  | { e: 'editar-dados'; nome: string; email: string }
  | { e: 'pedido-recusado'; campos: { nome?: string; email?: string }; erro: string | null }
  | { e: 'codigo-enviado'; reenviarAte: number; aviso?: Aviso }
  | { e: 'codigo-recusado'; erro: string }
  | { e: 'trocar-email' }
  | { e: 'entrou'; lista: Lista }
  | { e: 'lista'; lista: Lista; aviso: Aviso | null }
  | { e: 'conflito'; lista: Lista | null; mensagem: string }
  | { e: 'sessao-expirou'; gestanteNome: string | null }
  | { e: 'saiu'; gestanteNome: string | null; apagou: boolean }
  | { e: 'vista'; vista: Vista }
  | { e: 'fechar-aviso' };

export const estadoInicial: Estado = { tela: { t: 'iniciando' }, aviso: null, falha: null, ocupado: false, conflitos: 0 };

export function nomeDaGestante(tela: Tela): string | null {
  switch (tela.t) {
    case 'entrar':
    case 'codigo':
      return tela.gestanteNome;
    case 'lista':
      return tela.lista.gestante_nome;
    default:
      return null;
  }
}

function entrarVazio(gestanteNome: string, nome = '', email = ''): Tela {
  return { t: 'entrar', gestanteNome, nome, email, campos: {}, erro: null };
}

const livre = { ocupado: false, falha: null } as const;

export function reduzir(estado: Estado, ev: Evento): Estado {
  const { tela } = estado;
  switch (ev.e) {
    case 'sem-link':
      return { ...estado, ...livre, tela: { t: 'sem-link' }, aviso: null };
    case 'iniciando':
      return { ...estado, ...livre, tela: { t: 'iniciando' }, aviso: null };
    case 'link-invalido':
      return { ...estado, ...livre, tela: { t: 'link-invalido' }, aviso: null };
    case 'link-ok':
      return { ...estado, ...livre, tela: entrarVazio(ev.gestanteNome), aviso: null };
    case 'ocupado':
      return { ...estado, ocupado: true, falha: null };
    case 'rede-falhou':
      return { ...estado, ocupado: false, falha: ev.acao };
    case 'editar-dados':
      if (tela.t === 'entrar') return { ...estado, tela: { ...tela, nome: ev.nome, email: ev.email, campos: {}, erro: null } };
      return estado;
    case 'pedido-recusado':
      if (tela.t === 'entrar') return { ...estado, ...livre, tela: { ...tela, campos: ev.campos, erro: ev.erro } };
      if (tela.t === 'codigo') return { ...estado, ...livre, tela: { ...tela, erro: ev.erro ?? Object.values(ev.campos)[0] ?? null } };
      return { ...estado, ...livre };
    case 'codigo-enviado':
      if (tela.t === 'entrar' || tela.t === 'codigo') {
        return {
          ...estado,
          ...livre,
          aviso: ev.aviso ?? null,
          tela: { t: 'codigo', gestanteNome: tela.gestanteNome, nome: tela.nome, email: tela.email, reenviarAte: ev.reenviarAte, erro: null },
        };
      }
      return { ...estado, ...livre };
    case 'codigo-recusado':
      if (tela.t === 'codigo') return { ...estado, ...livre, tela: { ...tela, erro: ev.erro } };
      return { ...estado, ...livre };
    case 'trocar-email':
      if (tela.t === 'codigo') return { ...estado, ...livre, tela: entrarVazio(tela.gestanteNome, tela.nome, tela.email) };
      return estado;
    case 'entrou':
      return { ...estado, ...livre, aviso: null, tela: { t: 'lista', lista: ev.lista, vista: 'presentes' } };
    case 'lista': {
      const vista = tela.t === 'lista' ? tela.vista : 'presentes';
      return { ...estado, ...livre, aviso: ev.aviso, tela: { t: 'lista', lista: ev.lista, vista } };
    }
    case 'conflito': {
      // Os dados que vieram no 409 substituem os da tela; sem eles, o componente busca de novo.
      const aviso: Aviso = { texto: ev.mensagem, erro: true };
      if (ev.lista) {
        const vista = tela.t === 'lista' ? tela.vista : 'presentes';
        return { ...estado, ...livre, aviso, conflitos: estado.conflitos + 1, tela: { t: 'lista', lista: ev.lista, vista } };
      }
      return { ...estado, ...livre, aviso, conflitos: estado.conflitos + 1 };
    }
    case 'sessao-expirou': {
      const nome = ev.gestanteNome ?? nomeDaGestante(tela);
      if (nome === null) return { ...estado, ...livre, tela: { t: 'iniciando' }, aviso: null };
      return { ...estado, ...livre, aviso: null, tela: entrarVazio(nome) };
    }
    case 'saiu': {
      const nome = ev.gestanteNome ?? nomeDaGestante(tela);
      const aviso: Aviso = { texto: ev.apagou ? 'Seus dados foram apagados.' : 'Você saiu do enxoval.' };
      if (nome === null) return { ...estado, ...livre, aviso, tela: { t: 'sem-link' } };
      return { ...estado, ...livre, aviso, tela: entrarVazio(nome) };
    }
    case 'vista':
      if (tela.t === 'lista') return { ...estado, tela: { ...tela, vista: ev.vista } };
      return estado;
    case 'fechar-aviso':
      return { ...estado, aviso: null };
  }
}
