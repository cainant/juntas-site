import { useEffect, useRef } from 'preact/hooks';
import { Avisos } from './Avisos';
import { Codigo } from './Codigo';
import { Entrar } from './Entrar';
import { ListaTela } from './ListaTela';
import { useEnxoval } from './useEnxoval';

interface Props {
  /** Endereço da API (termina em /api/v1). */
  apiUrl: string;
  /** produção ou homologação: separa as sessões guardadas de cada uma. */
  ambiente: string;
}

export default function Enxoval({ apiUrl, ambiente }: Props) {
  const { estado, executar, editarDados, trocarEmail, mostrarErros, mudarVista, fecharAviso } = useEnxoval(apiUrl, ambiente);
  const { tela } = estado;
  const anterior = useRef(tela.t);

  // Mudou de tela: o título recebe o foco, para quem usa leitor de tela saber onde está.
  // (A tela do código foca o próprio campo.)
  useEffect(() => {
    if (anterior.current !== tela.t && tela.t !== 'codigo') {
      document.getElementById('titulo-tela')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    }
    anterior.current = tela.t;
  }, [tela.t]);

  let corpo;
  switch (tela.t) {
    case 'iniciando':
      return (
        <div class="enx-base">
          <section class="passo" aria-busy="true">
            <h1 id="titulo-tela" tabIndex={-1} class="discreto">
              Abrindo o enxoval…
            </h1>
          </section>
          <Avisos {...avisosProps()} />
        </div>
      );
    case 'sem-link':
      corpo = (
        <section class="passo" aria-labelledby="titulo-tela">
          <p class="selo-passo">Enxoval</p>
          <h1 id="titulo-tela" tabIndex={-1}>
            Abra o link que você recebeu
          </h1>
          <p class="passo-texto">
            Quem chamou você para o enxoval mandou um link. Abra esse link por aqui para ver os presentes e escolher os seus. Se perdeu
            o link, peça outro a quem chamou você.
          </p>
        </section>
      );
      break;
    case 'link-invalido':
      corpo = (
        <section class="passo" aria-labelledby="titulo-tela">
          <p class="selo-passo">Enxoval</p>
          <h1 id="titulo-tela" tabIndex={-1}>
            Este link não funciona mais.
          </h1>
          <p class="passo-texto">Peça um novo a quem chamou você.</p>
        </section>
      );
      break;
    case 'entrar':
      corpo = (
        <Entrar
          tela={tela}
          ocupado={estado.ocupado}
          aoEditar={editarDados}
          aoEnviar={() => executar({ k: 'pedir-codigo', reenvio: false })}
          aoInvalido={mostrarErros}
        />
      );
      break;
    case 'codigo':
      corpo = (
        <Codigo
          tela={tela}
          ocupado={estado.ocupado}
          aoEnviar={(codigo) => executar({ k: 'entrar', codigo })}
          aoReenviar={() => executar({ k: 'pedir-codigo', reenvio: true })}
          aoTrocarEmail={trocarEmail}
        />
      );
      break;
    case 'lista':
      corpo = (
        <ListaTela
          lista={tela.lista}
          vista={tela.vista}
          ocupado={estado.ocupado}
          temErro={estado.aviso?.erro === true}
          aoVista={mudarVista}
          aoEscolher={(itemId, quantidade, nova) => executar({ k: 'escolher', itemId, quantidade, nova })}
          aoDesfazer={(itemId) => executar({ k: 'desfazer', itemId })}
          aoSair={() => executar({ k: 'sair' })}
          aoApagar={() => executar({ k: 'apagar' })}
        />
      );
      break;
  }

  function avisosProps() {
    return {
      aviso: estado.aviso,
      falha: estado.falha,
      conflitos: estado.conflitos,
      aoFechar: fecharAviso,
      aoDesfazer: (itemId: number) => executar({ k: 'desfazer', itemId }),
      aoTentar: (acao: NonNullable<typeof estado.falha>) => executar(acao),
    };
  }

  return (
    <div class={`enx-base${tela.t === 'lista' ? ' enx-lista' : ''}`}>
      {corpo}
      <Avisos {...avisosProps()} />
    </div>
  );
}
