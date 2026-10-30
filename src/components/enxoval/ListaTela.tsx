import { useEffect, useRef } from 'preact/hooks';
import type { Vista } from '../../lib/enxoval/estado';
import type { Lista } from '../../lib/enxoval/tipos';
import { Escolhas } from './Escolhas';
import { Presentes } from './Presentes';
import { Rodape } from './Rodape';

interface Props {
  lista: Lista;
  vista: Vista;
  ocupado: boolean;
  temErro: boolean;
  aoVista(v: Vista): void;
  aoEscolher(itemId: number, quantidade: number, nova: boolean): void;
  aoDesfazer(itemId: number): void;
  aoSair(): void;
  aoApagar(): void;
}

export function ListaTela({ lista, vista, ocupado, temErro, aoVista, aoEscolher, aoDesfazer, aoSair, aoApagar }: Props) {
  const painelPresentes = useRef<HTMLElement>(null);
  const painelEscolhas = useRef<HTMLElement>(null);

  // Depois de uma ação, se o botão que tinha o foco saiu da lista, o foco vai para o painel
  // em vez de cair no começo da página. (Em caso de erro quem trata é o alerta.)
  useEffect(() => {
    if (temErro) return;
    const ativo = document.activeElement;
    if (!ativo || ativo === document.body || !ativo.isConnected) {
      (vista === 'presentes' ? painelPresentes : painelEscolhas).current?.focus({ preventScroll: true });
    }
  }, [lista]);

  function teclas(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const proxima: Vista = e.key === 'ArrowLeft' || e.key === 'Home' ? 'presentes' : 'escolhas';
    aoVista(proxima);
    document.getElementById(`aba-${proxima}`)?.focus();
  }

  const n = lista.minhas_escolhas.length;

  return (
    <div class="lista-tela">
      <header class="lista-cabeca">
        <h1 id="titulo-tela" tabIndex={-1}>
          Enxoval de {lista.gestante_nome}
        </h1>
        {lista.recado && (
          <aside class="recado" aria-label={`Recado de ${lista.gestante_nome}`}>
            <p>{lista.recado}</p>
          </aside>
        )}
      </header>

      <div class="abas" role="tablist" aria-label="O que ver" onKeyDown={teclas}>
        <button
          type="button"
          role="tab"
          id="aba-presentes"
          aria-selected={vista === 'presentes'}
          aria-controls="painel-presentes"
          tabIndex={vista === 'presentes' ? 0 : -1}
          onClick={() => aoVista('presentes')}
        >
          Presentes
        </button>
        <button
          type="button"
          role="tab"
          id="aba-escolhas"
          aria-selected={vista === 'escolhas'}
          aria-controls="painel-escolhas"
          tabIndex={vista === 'escolhas' ? 0 : -1}
          onClick={() => aoVista('escolhas')}
        >
          Minhas escolhas{n > 0 && <span class="contagem"> ({n})</span>}
        </button>
      </div>

      <div class="paineis">
        <section
          id="painel-presentes"
          class="painel"
          role="tabpanel"
          aria-labelledby="aba-presentes"
          tabIndex={-1}
          ref={painelPresentes}
          hidden={vista !== 'presentes'}
        >
          <h2 class="painel-titulo">Presentes</h2>
          <Presentes presentes={lista.disponiveis} ocupado={ocupado} aoEscolher={aoEscolher} />
        </section>
        <section
          id="painel-escolhas"
          class="painel painel-escolhas"
          role="tabpanel"
          aria-labelledby="aba-escolhas"
          tabIndex={-1}
          ref={painelEscolhas}
          hidden={vista !== 'escolhas'}
        >
          <h2 class="painel-titulo">
            Minhas escolhas{n > 0 && <span class="contagem"> ({n})</span>}
          </h2>
          <Escolhas
            escolhas={lista.minhas_escolhas}
            ocupado={ocupado}
            aoMudar={(id, q) => aoEscolher(id, q, false)}
            aoDesfazer={aoDesfazer}
            aoVerPresentes={() => aoVista('presentes')}
          />
        </section>
      </div>

      <Rodape lista={lista} ocupado={ocupado} aoSair={aoSair} aoApagar={aoApagar} />
    </div>
  );
}
