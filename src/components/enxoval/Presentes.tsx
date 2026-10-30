import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { agrupar, categoriasPresentes, conta, escolheDireto, filtrar, limiteDaEscolha, lojaSegura, textoRestante } from '../../lib/enxoval/lista';
import { ROTULO_CATEGORIA, type Categoria, type Presente } from '../../lib/enxoval/tipos';
import { Quantidade } from './Quantidade';

interface Props {
  presentes: Presente[];
  ocupado: boolean;
  aoEscolher(itemId: number, quantidade: number, nova: boolean): void;
}

export function Presentes({ presentes, ocupado, aoEscolher }: Props) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const categorias = useMemo(() => categoriasPresentes(presentes), [presentes]);
  // Se a categoria escolhida sumiu da lista (tudo nela foi escolhido), o filtro cai sozinho.
  const ativa = categoria && categorias.includes(categoria) ? categoria : null;
  const grupos = useMemo(() => agrupar(filtrar(presentes, busca, ativa)), [presentes, busca, ativa]);
  const total = grupos.reduce((n, g) => n + g.itens.length, 0);

  return (
    <div class="presentes">
      <div class="busca">
        <label for="busca" class="sr">
          Buscar presente
        </label>
        <input
          id="busca"
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Buscar presente"
          value={busca}
          onInput={(e) => setBusca((e.currentTarget as HTMLInputElement).value)}
        />
      </div>

      {categorias.length > 1 && (
        <div class="chips" role="group" aria-label="Filtrar por categoria">
          <button type="button" class="chip" aria-pressed={ativa === null} onClick={() => setCategoria(null)}>
            Todos
          </button>
          {categorias.map((c) => (
            <button type="button" class="chip" key={c} aria-pressed={ativa === c} onClick={() => setCategoria(ativa === c ? null : c)}>
              {ROTULO_CATEGORIA[c]}
            </button>
          ))}
        </div>
      )}

      <p class="sr" role="status">
        {presentes.length > 0 ? conta(total, 'presente', 'presentes') : ''}
      </p>

      {presentes.length === 0 && (
        <p class="vazio">Não há presentes para escolher agora.</p>
      )}
      {presentes.length > 0 && total === 0 && <p class="vazio">Nenhum presente encontrado. Tente outra palavra ou outra categoria.</p>}

      {grupos.map((g) => (
        <section class="grupo" key={g.categoria} aria-labelledby={`cat-${g.categoria}`}>
          <h3 id={`cat-${g.categoria}`} class="grupo-titulo">
            {ROTULO_CATEGORIA[g.categoria]}
          </h3>
          <ul class="cartoes">
            {g.itens.map((p) => (
              <li key={p.id}>
                <CartaoPresente presente={p} ocupado={ocupado} aoEscolher={aoEscolher} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CartaoPresente({ presente: p, ocupado, aoEscolher }: { presente: Presente; ocupado: boolean; aoEscolher: Props['aoEscolher'] }) {
  const [aberto, setAberto] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  const eraAberto = useRef(false);
  // Fechou o seletor: o foco volta para o botão que o abriu.
  useEffect(() => {
    if (eraAberto.current && !aberto) gatilho.current?.focus();
    eraAberto.current = aberto;
  }, [aberto]);
  const limite = limiteDaEscolha(p);
  const [qtd, setQtd] = useState(Math.max(1, p.minha_quantidade));
  const quantidade = Math.min(Math.max(1, qtd), limite);
  const loja = lojaSegura(p.link_loja);
  const restante = textoRestante(p.restante);
  const jaTem = p.minha_quantidade > 0;
  const nova = !jaTem;

  function abrir() {
    if (escolheDireto(p) && nova) {
      aoEscolher(p.id, 1, true);
      return;
    }
    setQtd(Math.max(1, p.minha_quantidade));
    setAberto(true);
  }

  return (
    <article class={`cartao-presente${jaTem ? ' tem' : ''}`}>
      <div class="cartao-topo">
        <h4>{p.nome}</h4>
        {restante && <span class="restam">{restante}</span>}
      </div>
      {p.observacao && <p class="obs">{p.observacao}</p>}
      {jaTem && <p class="voce">Você escolheu {p.minha_quantidade}</p>}

      {aberto ? (
        <div class="escolher">
          <Quantidade rotulo={`Quantidade de ${p.nome}`} valor={quantidade} minimo={1} maximo={limite} desligado={ocupado} aoMudar={setQtd} />
          <div class="escolher-acoes">
            <button
              type="button"
              class="btn btn-cheio"
              aria-disabled={ocupado || (jaTem && quantidade === p.minha_quantidade) ? 'true' : undefined}
              onClick={() => {
                if (ocupado || (jaTem && quantidade === p.minha_quantidade)) return;
                aoEscolher(p.id, quantidade, nova);
                setAberto(false);
              }}
            >
              {jaTem ? 'Salvar' : 'Escolher'}
            </button>
            <button type="button" class="btn-texto" onClick={() => setAberto(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div class="cartao-acoes">
          {(!jaTem || limite > p.minha_quantidade || limite > 1) && (
            <button type="button" class="btn btn-suave" ref={gatilho} aria-disabled={ocupado ? 'true' : undefined} onClick={() => !ocupado && abrir()} aria-label={`${jaTem ? 'Alterar' : 'Escolher'}: ${p.nome}`}>
              {jaTem ? 'Alterar' : 'Escolher'}
            </button>
          )}
          {loja && (
            <a class="loja-link" href={loja} target="_blank" rel="noopener noreferrer">
              Ver na loja<span class="sr"> (abre em outra aba): {p.nome}</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
