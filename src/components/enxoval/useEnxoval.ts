import { useCallback, useEffect, useMemo, useReducer, useRef } from 'preact/hooks';
import { criarCliente, type Resultado } from '../../lib/enxoval/api';
import { estadoInicial, nomeDaGestante, reduzir, type Acao, type Estado, type Evento } from '../../lib/enxoval/estado';
import { linkDoHash } from '../../lib/enxoval/link';
import { esquecerToken, guardarSessao, sessaoDoLink, sessoesGuardadas, type SessaoGuardada } from '../../lib/enxoval/sessao';
import type { ErroApi, Lista } from '../../lib/enxoval/tipos';

const TEXTO_LIMITE = 'Muitas tentativas em pouco tempo. Espere um instante e tente de novo.';
const TEXTO_SERVIDOR = 'Algo deu errado do nosso lado. Tente de novo em instantes.';

export interface Controle {
  estado: Estado;
  executar(acao: Acao): void;
  editarDados(nome: string, email: string): void;
  trocarEmail(): void;
  mostrarErros(campos: { nome?: string; email?: string }): void;
  mudarVista(vista: 'presentes' | 'escolhas'): void;
  fecharAviso(): void;
}

export function useEnxoval(apiUrl: string, ambiente: string): Controle {
  const [estado, enviar] = useReducer(reduzir, estadoInicial);
  const api = useMemo(() => criarCliente(apiUrl), [apiUrl]);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const tokenRef = useRef<string | null>(null);
  const linkRef = useRef<string | null>(null);
  const ocupadoRef = useRef(false);
  const geracao = useRef(0);

  const guardar = useCallback(
    (token: string, link: string, gestanteNome: string) => {
      tokenRef.current = token;
      const sessao: SessaoGuardada = { token, link, gestanteNome, em: Date.now() };
      guardarSessao(window.localStorage, ambiente, sessao);
    },
    [ambiente],
  );

  const esquecer = useCallback(() => {
    if (tokenRef.current) esquecerToken(window.localStorage, ambiente, tokenRef.current);
    tokenRef.current = null;
  }, [ambiente]);

  /** Resultado de erro que vale para qualquer chamada. Devolve true se já tratou. */
  const tratarComum = useCallback(
    (erro: ErroApi, acao: Acao): boolean => {
      if (erro.tipo === 'rede') {
        enviar({ e: 'rede-falhou', acao });
        return true;
      }
      return false;
    },
    [],
  );

  const iniciar = useCallback(async () => {
    const minha = ++geracao.current;
    const vivo = () => minha === geracao.current;
    const bruto = window.location.hash.replace(/^#/, '').trim();
    const link = linkDoHash(window.location.hash);
    linkRef.current = link;
    tokenRef.current = null;
    ocupadoRef.current = false;
    enviar({ e: 'iniciando' });

    if (bruto && !link) {
      enviar({ e: 'link-invalido' });
      return;
    }

    // Uma sessão guardada vale primeiro: quem já entrou segue entrando mesmo se o link foi trocado.
    const propria = link ? sessaoDoLink(window.localStorage, ambiente, link) : sessoesGuardadas(window.localStorage, ambiente)[0] ?? null;
    if (propria) {
      const r = await api.lista(propria.token);
      if (!vivo()) return;
      if (r.ok) {
        guardar(propria.token, propria.link, r.dado.gestante_nome);
        enviar({ e: 'entrou', lista: r.dado });
        return;
      }
      if (r.erro.tipo === 'nao-autorizado') {
        esquecerToken(window.localStorage, ambiente, propria.token);
      } else {
        enviar({ e: 'rede-falhou', acao: { k: 'iniciar' } });
        return;
      }
    }

    if (!link) {
      enviar({ e: 'sem-link' });
      return;
    }

    const info = await api.infoDoLink(link);
    if (!vivo()) return;
    if (!info.ok) {
      if (info.erro.tipo === 'nao-encontrado') enviar({ e: 'link-invalido' });
      else enviar({ e: 'rede-falhou', acao: { k: 'iniciar' } });
      return;
    }

    enviar({ e: 'link-ok', gestanteNome: info.dado.gestante_nome });
  }, [api, ambiente, guardar]);

  useEffect(() => {
    void iniciar();
    const aoMudar = () => void iniciar();
    window.addEventListener('hashchange', aoMudar);
    return () => {
      window.removeEventListener('hashchange', aoMudar);
      geracao.current++;
    };
  }, [iniciar]);

  const aposLista = useCallback(
    (r: Resultado<Lista>, acao: Acao, sucesso: (lista: Lista) => Evento) => {
      if (r.ok) {
        enviar(sucesso(r.dado));
        return;
      }
      const e = r.erro;
      if (tratarComum(e, acao)) return;
      if (e.tipo === 'nao-autorizado') {
        const nome = nomeDaGestante(estadoRef.current.tela);
        esquecer();
        if (nome === null) void iniciar();
        else enviar({ e: 'sessao-expirou', gestanteNome: nome });
        return;
      }
      if (e.tipo === 'conflito') {
        if (e.lista) {
          enviar({ e: 'conflito', lista: e.lista, mensagem: e.mensagem || 'Esse presente acabou de ser escolhido por outra pessoa.' });
        } else {
          enviar({ e: 'conflito', lista: null, mensagem: e.mensagem || 'A lista mudou. Confira de novo.' });
          void (async () => {
            if (!tokenRef.current) return;
            const l = await api.lista(tokenRef.current);
            if (l.ok) enviar({ e: 'conflito', lista: l.dado, mensagem: e.mensagem || 'A lista mudou. Confira de novo.' });
            else enviar({ e: 'rede-falhou', acao: { k: 'iniciar' } });
          })();
        }
        return;
      }
      if (e.tipo === 'nao-encontrado') {
        // O presente saiu do ar (ou a escolha já não existe): mostra a lista como ela está.
        void (async () => {
          if (!tokenRef.current) return;
          const l = await api.lista(tokenRef.current);
          if (l.ok) enviar({ e: 'lista', lista: l.dado, aviso: { texto: 'Essa lista mudou. Confira de novo.', erro: true } });
          else enviar({ e: 'rede-falhou', acao: { k: 'iniciar' } });
        })();
        return;
      }
      const texto = e.tipo === 'limite' ? e.mensagem || TEXTO_LIMITE : e.tipo === 'validacao' ? e.campos.quantidade || e.mensagem : TEXTO_SERVIDOR;
      enviar({ e: 'lista', lista: (estadoRef.current.tela as { lista: Lista }).lista, aviso: { texto: texto || TEXTO_SERVIDOR, erro: true } });
    },
    [api, esquecer, iniciar, tratarComum],
  );

  const executar = useCallback(
    (acao: Acao) => {
      if (ocupadoRef.current) return;
      const tela = estadoRef.current.tela;
      const link = linkRef.current;
      const token = tokenRef.current;
      const rodar = async () => {
        ocupadoRef.current = true;
        enviar({ e: 'ocupado' });
        try {
          switch (acao.k) {
            case 'iniciar':
              ocupadoRef.current = false;
              void iniciar();
              return;
            case 'pedir-codigo': {
              if (!link || (tela.t !== 'entrar' && tela.t !== 'codigo')) return;
              const { nome, email } = tela;
              const r = await api.pedirCodigo(link, { nome: nome.trim(), email: email.trim() });
              if (r.ok) {
                enviar({
                  e: 'codigo-enviado',
                  reenviarAte: Date.now() + r.dado.reenviar_em_seg * 1000,
                  aviso: acao.reenvio ? { texto: 'Enviamos outro código para o seu e-mail.' } : undefined,
                });
                return;
              }
              if (tratarComum(r.erro, acao)) return;
              const e = r.erro;
              if (e.tipo === 'validacao') enviar({ e: 'pedido-recusado', campos: { nome: e.campos.nome, email: e.campos.email }, erro: e.campos.nome || e.campos.email ? null : e.mensagem });
              else if (e.tipo === 'nao-encontrado') enviar({ e: 'link-invalido' });
              else enviar({ e: 'pedido-recusado', campos: {}, erro: e.tipo === 'limite' ? e.mensagem || TEXTO_LIMITE : TEXTO_SERVIDOR });
              return;
            }
            case 'entrar': {
              if (!link || tela.t !== 'codigo') return;
              const r = await api.entrar(link, { email: tela.email.trim(), codigo: acao.codigo });
              if (!r.ok) {
                if (tratarComum(r.erro, acao)) return;
                const e = r.erro;
                if (e.tipo === 'validacao') enviar({ e: 'codigo-recusado', erro: e.campos.codigo || e.campos.email || e.mensagem || 'Código inválido ou vencido. Peça outro.' });
                else if (e.tipo === 'nao-encontrado') enviar({ e: 'link-invalido' });
                else enviar({ e: 'codigo-recusado', erro: e.tipo === 'limite' ? e.mensagem || TEXTO_LIMITE : TEXTO_SERVIDOR });
                return;
              }
              const token = r.dado.token;
              tokenRef.current = token;
              const l = await api.lista(token);
              if (!l.ok) {
                if (tratarComum(l.erro, acao)) return;
                esquecer();
                enviar({ e: 'codigo-recusado', erro: TEXTO_SERVIDOR });
                return;
              }
              guardar(token, link, l.dado.gestante_nome);
              enviar({ e: 'entrou', lista: l.dado });
              return;
            }
            case 'escolher': {
              if (!token || tela.t !== 'lista') return;
              const r = await api.escolher(token, acao.itemId, acao.quantidade);
              const nome = nomeDoItem(tela.lista, acao.itemId);
              aposLista(r, acao, (lista) => ({
                e: 'lista',
                lista,
                aviso: acao.nova
                  ? { texto: `Você escolheu: ${nome}.`, desfazItemId: acao.itemId }
                  : { texto: `Quantidade de ${nome} atualizada para ${acao.quantidade}.` },
              }));
              return;
            }
            case 'desfazer': {
              if (!token || tela.t !== 'lista') return;
              const r = await api.desfazer(token, acao.itemId);
              const nome = nomeDoItem(tela.lista, acao.itemId);
              aposLista(r, acao, (lista) => ({ e: 'lista', lista, aviso: { texto: `Escolha desfeita: ${nome}.` } }));
              return;
            }
            case 'sair':
            case 'apagar': {
              if (!token) return;
              const nome = nomeDaGestante(tela);
              const r = acao.k === 'sair' ? await api.sair(token) : await api.apagarEu(token);
              if (!r.ok && r.erro.tipo === 'rede') {
                enviar({ e: 'rede-falhou', acao });
                return;
              }
              // 401 aqui só quer dizer que a sessão já acabou: o resultado é o mesmo.
              if (!r.ok && r.erro.tipo !== 'nao-autorizado' && r.erro.tipo !== 'nao-encontrado') {
                enviar({ e: 'lista', lista: (tela as { lista: Lista }).lista, aviso: { texto: r.erro.tipo === 'limite' ? TEXTO_LIMITE : TEXTO_SERVIDOR, erro: true } });
                return;
              }
              esquecer();
              enviar({ e: 'saiu', gestanteNome: nome, apagou: acao.k === 'apagar' });
              return;
            }
          }
        } finally {
          ocupadoRef.current = false;
        }
      };
      void rodar();
    },
    [api, aposLista, esquecer, guardar, iniciar, tratarComum],
  );

  const editarDados = useCallback((nome: string, email: string) => {
    enviar({ e: 'editar-dados', nome, email });
  }, []);

  return {
    estado,
    executar,
    editarDados,
    trocarEmail: () => enviar({ e: 'trocar-email' }),
    mostrarErros: (campos) => enviar({ e: 'pedido-recusado', campos, erro: null }),
    mudarVista: (vista) => enviar({ e: 'vista', vista }),
    fecharAviso: () => enviar({ e: 'fechar-aviso' }),
  };
}

function nomeDoItem(lista: Lista, id: number): string {
  return lista.disponiveis.find((p) => p.id === id)?.nome ?? lista.minhas_escolhas.find((e) => e.item_id === id)?.nome ?? 'presente';
}
