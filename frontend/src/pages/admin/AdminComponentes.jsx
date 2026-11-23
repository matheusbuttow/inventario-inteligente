import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Carregando, Erro, Vazio } from "../../components/Estado";
import Foto from "../../components/Foto";
import StatusBadge from "../../components/StatusBadge";
import useCarregar from "../../hooks/useCarregar";
import { listarComponentes } from "../../services/inventario";
import { local } from "../../utils/formato";

export default function AdminComponentes() {
  const buscar = useCallback(() => listarComponentes(), []);
  const { dados: itens, erro, recarregar } = useCarregar(buscar, "Não foi possível carregar os equipamentos.");

  return (
    <>
      <Link to="/admin/componentes/novo" className="botao botao-bloco">+ Cadastrar equipamento</Link>
      {erro && <Erro mensagem={erro} onTentarDeNovo={recarregar} />}
      {!erro && !itens && <Carregando />}
      {itens?.length === 0 && <Vazio texto="Nenhum equipamento cadastrado ainda." />}
      <ul className="lista">
        {itens?.map((c) => (
          <li key={c.id}>
            <Link to={`/admin/componentes/${c.id}`} className="cartao cartao-com-foto">
              <Foto componente={c} />
              <div className="cartao-texto">
                <div className="cartao-topo">
                  <strong>{c.nome}</strong>
                  <StatusBadge status={c.status} />
                </div>
                <span className="detalhe">{local(c)}</span>
                <span className="detalhe">Editar · <code>{c.codigo_qr}</code></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
