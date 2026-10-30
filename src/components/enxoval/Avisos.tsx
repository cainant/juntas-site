import { useEffect, useRef } from 'preact/hooks';
import type { Acao, Aviso } from '../../lib/enxoval/estado';

interface Props {
  aviso: Aviso | null;
  falha: Acao | null;
  conflitos: number;
  aoFechar(): void;
  aoDesfazer(itemId: number): void;
  aoTentar(acao: Acao): void;
}

/**
 * Três coisas que a pessoa precisa saber, fora do fluxo da página:
 * - confirmação de sucesso, num aviso educado (aria-live polite);
 * - erro da API (409 e outros), num alerta;
 * - rede caída, com "Tentar de novo".
 * A região do aviso fica sempre montada: leitor de tela só anuncia o que muda dentro de uma região que já existia.
 */
export function Avisos({ aviso, falha, conflitos, aoFechar, aoDesfazer, aoTentar }: Props) {
  const alerta = useRef<HTMLDivElement>(null);

  // Some sozinho, menos quando tem "Desfazer" (quem usa teclado precisa de tempo).
  useEffect(() => {
    if (!aviso || aviso.erro || aviso.desfazItemId !== undefined) return;
    const t = setTimeout(aoFechar, 6000);
    return () => clearTimeout(t);
  }, [aviso]);

  // Depois de um 409, se o foco estava num botão que saiu da tela, ele vai para o alerta.
  useEffect(() => {
    if (conflitos === 0) return;
    const ativo = document.activeElement;
    if (!ativo || ativo === document.body || !ativo.isConnected) alerta.current?.focus();
  }, [conflitos, aviso]);

  const sucesso = aviso && !aviso.erro ? aviso : null;
  const erro = aviso?.erro ? aviso : null;

  return (
    <div class="pilha">
      <div class="avisos" aria-live="polite" aria-atomic="true">
        {sucesso && (
          <div class="aviso-ok">
            <span>{sucesso.texto}</span>
            {sucesso.desfazItemId !== undefined && (
              <button type="button" class="btn-texto" onClick={() => aoDesfazer(sucesso.desfazItemId!)}>
                Desfazer
              </button>
            )}
            <button type="button" class="btn-texto" onClick={aoFechar} aria-label="Fechar aviso">
              Fechar
            </button>
          </div>
        )}
      </div>
      <div class="alertas" role="alert">
        {erro && (
          <div class="aviso-erro" tabIndex={-1} ref={alerta}>
            <span>{erro.texto}</span>
            <button type="button" class="btn-texto" onClick={aoFechar}>
              Entendi
            </button>
          </div>
        )}
        {falha && (
          <div class="aviso-erro">
            <span>Sem conexão com o Juntas. Confira a internet e tente de novo.</span>
            <button type="button" class="btn-texto" onClick={() => aoTentar(falha)}>
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
