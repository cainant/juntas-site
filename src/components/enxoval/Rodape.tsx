import { useRef } from 'preact/hooks';
import type { Lista } from '../../lib/enxoval/tipos';

interface Props {
  lista: Lista;
  ocupado: boolean;
  aoSair(): void;
  aoApagar(): void;
}

export function Rodape({ lista, ocupado, aoSair, aoApagar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);

  function fechar() {
    dialogo.current?.close();
    gatilho.current?.focus();
  }

  return (
    <footer class="enxoval-rodape">
      <p class="quem">
        Você entrou como <strong>{lista.convidado.nome}</strong>
        <span class="quebra"> ({lista.convidado.email})</span>.
      </p>
      <div class="rodape-acoes">
        <button type="button" class="btn btn-contorno" disabled={ocupado} onClick={aoSair}>
          Sair
        </button>
        <button type="button" class="btn-texto perigo" ref={gatilho} onClick={() => dialogo.current?.showModal()}>
          Apagar meus dados
        </button>
        <a href="/privacidade/#convidado">Política de privacidade</a>
      </div>

      <dialog ref={dialogo} class="dialogo" aria-labelledby="titulo-apagar" onCancel={() => gatilho.current?.focus()}>
        <h2 id="titulo-apagar">Apagar os seus dados?</h2>
        <p>
          Isso apaga o seu nome, o seu e-mail e as suas escolhas, e tira você da lista. O que você escolheu volta para a lista dos
          presentes. Não dá para desfazer.
        </p>
        <div class="dialogo-acoes">
          <button
            type="button"
            class="btn btn-perigo"
            onClick={() => {
              dialogo.current?.close();
              aoApagar();
            }}
          >
            Apagar meus dados
          </button>
          <button type="button" class="btn btn-suave" onClick={fechar} autoFocus>
            Cancelar
          </button>
        </div>
      </dialog>
    </footer>
  );
}
