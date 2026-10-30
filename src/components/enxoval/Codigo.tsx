import { useEffect, useRef, useState } from 'preact/hooks';
import { segundosAte, soDigitos } from '../../lib/enxoval/link';
import type { Tela } from '../../lib/enxoval/estado';

type TelaCodigo = Extract<Tela, { t: 'codigo' }>;

interface Props {
  tela: TelaCodigo;
  ocupado: boolean;
  aoEnviar(codigo: string): void;
  aoReenviar(): void;
  aoTrocarEmail(): void;
}

export function Codigo({ tela, ocupado, aoEnviar, aoReenviar, aoTrocarEmail }: Props) {
  const [valor, setValor] = useState('');
  const [agora, setAgora] = useState(() => Date.now());
  const campo = useRef<HTMLInputElement>(null);
  const falta = segundosAte(tela.reenviarAte, agora);

  // Contagem do "Reenviar": um tique por segundo, só enquanto falta tempo.
  useEffect(() => {
    setAgora(Date.now());
    if (segundosAte(tela.reenviarAte, Date.now()) === 0) return;
    const t = setInterval(() => {
      const n = Date.now();
      setAgora(n);
      if (segundosAte(tela.reenviarAte, n) === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [tela.reenviarAte]);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  // Código recusado: limpa o campo e devolve o foco para digitar de novo.
  useEffect(() => {
    if (tela.erro && !ocupado) {
      setValor('');
      campo.current?.focus();
    }
  }, [tela.erro, ocupado]);

  function aoDigitar(texto: string) {
    const limpo = soDigitos(texto);
    setValor(limpo);
    if (limpo.length === 6 && !ocupado) aoEnviar(limpo);
  }

  return (
    <section class="passo" aria-labelledby="titulo-tela">
      <p class="selo-passo">Enxoval de {tela.gestanteNome}</p>
      <h1 id="titulo-tela" tabIndex={-1}>
        Digite o código
      </h1>
      <p class="passo-texto">
        Enviamos um código de seis dígitos para <strong class="quebra">{tela.email}</strong>. Ele vale por dez minutos.
      </p>

      <form
        class="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (valor.length === 6 && !ocupado) aoEnviar(valor);
        }}
      >
        <div class="campo">
          <label for="campo-codigo">Código de seis dígitos</label>
          <input
            id="campo-codigo"
            ref={campo}
            class="campo-codigo"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            value={valor}
            readOnly={ocupado}
            aria-invalid={tela.erro ? 'true' : undefined}
            aria-describedby={tela.erro ? 'erro-codigo' : undefined}
            onInput={(e) => aoDigitar((e.currentTarget as HTMLInputElement).value)}
          />
          {tela.erro && (
            <p class="erro-campo" id="erro-codigo" role="alert">
              {tela.erro}
            </p>
          )}
        </div>
        <button class="btn btn-cheio" type="submit" disabled={ocupado || valor.length < 6}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div class="passo-acoes">
        <button type="button" class="btn btn-suave" onClick={aoReenviar} disabled={ocupado || falta > 0}>
          {falta > 0 ? `Reenviar em ${falta} s` : 'Reenviar código'}
        </button>
        <button type="button" class="btn-texto" onClick={aoTrocarEmail} disabled={ocupado}>
          Trocar o e-mail
        </button>
      </div>
    </section>
  );
}
