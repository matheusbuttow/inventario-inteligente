import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Carregando, Erro, Vazio } from "../components/Estado";
import useCarregar from "../hooks/useCarregar";
import { historico } from "../services/inventario";
import { dataHora } from "../utils/formato";

export default function Historico() {
  const [params] = useSearchParams();
  const componenteId = params.get("componente_id") || undefined;
  const buscar = useCallback(() => historico({ componente_id: componenteId }), [componenteId]);
  const { dados: itens, erro, recarregar } = useCarregar(buscar, "Não foi possível carregar o histórico.");

  return (
    <section>
      <h1>Histórico</h1>
      {componenteId && (
        <p className="subtitulo">
          Só de um componente. <Link to="/historico">Ver todos</Link>
        </p>
      )}
      {erro && <Erro mensagem={erro} onTentarDeNovo={recarregar} />}
      {!erro && itens === null && <Carregando />}
      {!erro && itens?.length === 0 && <Vazio texto="Nenhum empréstimo registrado ainda." />}
      <ul className="lista">
        {itens?.map((e) => (
          <li key={e.id} className="cartao">
            <div className="cartao-topo">
              <Link to={`/componentes/${e.componente_id}`}>
                <strong>{e.componente?.nome}</strong>
              </Link>
              {!e.devolvido_em && <span className="badge badge-emprestado">Em uso</span>}
            </div>
            <span className="detalhe">{e.usuario?.nome || e.usuario_nome}</span>
            <span className="detalhe">
              Pegou {dataHora(e.retirado_em)}
              {e.devolvido_em ? ` · devolveu ${dataHora(e.devolvido_em)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
