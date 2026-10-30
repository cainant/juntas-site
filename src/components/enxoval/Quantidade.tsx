import { limitar } from '../../lib/enxoval/lista';

interface Props {
  rotulo: string;
  valor: number;
  minimo: number;
  maximo: number;
  desligado?: boolean;
  /** Esconde o botão de aumentar (item que saiu da lista só desce). */
  semAumentar?: boolean;
  aoMudar(valor: number): void;
}

/** Seletor de quantidade: menos, campo numérico, mais. Alvos de 44px. */
export function Quantidade({ rotulo, valor, minimo, maximo, desligado, semAumentar, aoMudar }: Props) {
  return (
    <div class="qtd" role="group" aria-label={rotulo}>
      <button
        type="button"
        class="qtd-btn"
        aria-label="Diminuir"
        aria-disabled={desligado || valor <= minimo ? 'true' : undefined}
        onClick={() => !desligado && valor > minimo && aoMudar(limitar(valor - 1, minimo, maximo))}
      >
        <span aria-hidden="true">−</span>
      </button>
      <input
        class="qtd-valor"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label="Quantidade"
        value={String(valor)}
        readOnly={desligado || semAumentar}
        onChange={(e) => aoMudar(limitar(parseInt((e.currentTarget as HTMLInputElement).value, 10), minimo, maximo))}
      />
      {!semAumentar && (
        <button
          type="button"
          class="qtd-btn"
          aria-label="Aumentar"
          aria-disabled={desligado || valor >= maximo ? 'true' : undefined}
          onClick={() => !desligado && valor < maximo && aoMudar(limitar(valor + 1, minimo, maximo))}
        >
          <span aria-hidden="true">+</span>
        </button>
      )}
    </div>
  );
}
