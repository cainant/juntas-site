import { emailValido } from '../../lib/enxoval/link';
import type { Tela } from '../../lib/enxoval/estado';

type TelaEntrar = Extract<Tela, { t: 'entrar' }>;

interface Props {
  tela: TelaEntrar;
  ocupado: boolean;
  aoEditar(nome: string, email: string): void;
  aoEnviar(): void;
  aoInvalido(campos: { nome?: string; email?: string }): void;
}

export function Entrar({ tela, ocupado, aoEditar, aoEnviar, aoInvalido }: Props) {
  const { nome, email, campos, erro } = tela;

  function enviar(e: Event) {
    e.preventDefault();
    const faltas: { nome?: string; email?: string } = {};
    if (!nome.trim()) faltas.nome = 'Escreva o seu nome.';
    if (!email.trim()) faltas.email = 'Escreva o seu e-mail.';
    else if (!emailValido(email)) faltas.email = 'Esse e-mail não parece certo. Confira e tente de novo.';
    if (faltas.nome || faltas.email) {
      aoInvalido(faltas);
      return;
    }
    aoEnviar();
  }

  return (
    <section class="passo" aria-labelledby="titulo-tela">
      <p class="selo-passo">Enxoval</p>
      <h1 id="titulo-tela" tabIndex={-1}>
        {tela.gestanteNome} chamou você para o enxoval.
      </h1>
      <p class="passo-texto">
        Sem senha e sem baixar nada: enviamos um código para o seu e-mail.
      </p>

      <form class="form" onSubmit={enviar} noValidate>
        <div class="campo">
          <label for="campo-nome">Seu nome</label>
          <input
            id="campo-nome"
            name="nome"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            maxLength={120}
            value={nome}
            aria-invalid={campos.nome ? 'true' : undefined}
            aria-describedby={campos.nome ? 'erro-nome' : undefined}
            onInput={(e) => aoEditar((e.currentTarget as HTMLInputElement).value, email)}
          />
          {campos.nome && (
            <p class="erro-campo" id="erro-nome">
              {campos.nome}
            </p>
          )}
        </div>
        <div class="campo">
          <label for="campo-email">Seu e-mail</label>
          <input
            id="campo-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellcheck={false}
            value={email}
            aria-invalid={campos.email ? 'true' : undefined}
            aria-describedby={campos.email ? 'erro-email' : undefined}
            onInput={(e) => aoEditar(nome, (e.currentTarget as HTMLInputElement).value)}
          />
          {campos.email && (
            <p class="erro-campo" id="erro-email">
              {campos.email}
            </p>
          )}
        </div>
        {erro && (
          <p class="erro-campo" role="alert">
            {erro}
          </p>
        )}
        <button class="btn btn-cheio" type="submit" disabled={ocupado}>
          {ocupado ? 'Enviando…' : 'Receber código'}
        </button>
      </form>

      <p class="nota">
        Guardamos o seu nome e o seu e-mail só para esta lista. Veja a <a href="/privacidade/#convidado">política de privacidade</a>.
      </p>
    </section>
  );
}
