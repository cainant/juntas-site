import { agrupar, limiteDaMinhaEscolha, lojaSegura } from '../../lib/enxoval/lista';
import { ROTULO_CATEGORIA, type Escolha } from '../../lib/enxoval/tipos';
import { Quantidade } from './Quantidade';

interface Props {
  escolhas: Escolha[];
  ocupado: boolean;
  aoMudar(itemId: number, quantidade: number): void;
  aoDesfazer(itemId: number): void;
  aoVerPresentes(): void;
}

export function Escolhas({ escolhas, ocupado, aoMudar, aoDesfazer, aoVerPresentes }: Props) {
  if (escolhas.length === 0) {
    return (
      <div class="vazio-grande">
        <p class="vazio-titulo">Você ainda não escolheu nada.</p>
        <p>Os presentes que você escolher aparecem aqui, e só você os vê.</p>
        <button type="button" class="btn btn-suave mostrar-so-celular" onClick={aoVerPresentes}>
          Ver os presentes
        </button>
      </div>
    );
  }

  return (
    <div>
      <p class="nota-escolhas">Só você vê esta lista.</p>
      {agrupar(escolhas).map((g) => (
        <section class="grupo" key={g.categoria} aria-label={ROTULO_CATEGORIA[g.categoria]}>
          <h3 class="grupo-titulo" aria-hidden="true">
            {ROTULO_CATEGORIA[g.categoria]}
          </h3>
          <ul class="cartoes">
            {g.itens.map((e) => {
              const loja = lojaSegura(e.link_loja);
              const limite = limiteDaMinhaEscolha(e);
              return (
                <li key={e.item_id}>
                  <article class={`cartao-presente${e.removido ? ' removido' : ''}`}>
                    <div class="cartao-topo">
                      <h4>{e.nome}</h4>
                    </div>
                    {e.observacao && <p class="obs">{e.observacao}</p>}
                    {e.removido && <p class="removido-nota">Saiu da lista, mas continua aqui porque você escolheu.</p>}
                    <div class="escolha-linha">
                      <Quantidade
                        rotulo={`Quantidade de ${e.nome}`}
                        valor={e.quantidade}
                        minimo={1}
                        maximo={limite}
                        desligado={ocupado}
                        semAumentar={e.removido}
                        aoMudar={(q) => q !== e.quantidade && aoMudar(e.item_id, q)}
                      />
                      <button type="button" class="btn btn-contorno" aria-disabled={ocupado ? 'true' : undefined} onClick={() => !ocupado && aoDesfazer(e.item_id)} aria-label={`Desfazer escolha: ${e.nome}`}>
                        Desfazer
                      </button>
                    </div>
                    {loja && !e.removido && (
                      <a class="loja-link" href={loja} target="_blank" rel="noopener noreferrer">
                        Ver na loja<span class="sr"> (abre em outra aba): {e.nome}</span>
                      </a>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
