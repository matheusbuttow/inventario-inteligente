import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Carregando, Erro, Vazio } from "../components/Estado";
import StatusBadge from "../components/StatusBadge";
import { listarComponentes, mensagemDeErro } from "../services/inventario";
import { local } from "../utils/formato";

const FILTROS = [
  ["", "Todos"],
  ["disponivel", "Disponíveis"],
  ["emprestado", "Emprestados"],
  ["manutencao", "Manutenção"],
];

export default function Componentes() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setItens(await listarComponentes({ status: status || undefined, busca: busca.trim() || undefined }));
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar os componentes."));
    }
  }, [busca, status]);

  useEffect(() => {
    const espera = setTimeout(carregar, 250); // evita uma requisição por tecla
    return () => clearTimeout(espera);
  }, [carregar]);

  return (
    <section>
      <h1>Componentes</h1>
      <input
        type="search"
        className="busca"
        placeholder="Buscar por nome, categoria ou código"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        aria-label="Buscar componentes"
      />
      <div className="filtros" role="group" aria-label="Filtrar por status">
        {FILTROS.map(([valor, rotulo]) => (
          <button
            key={valor || "todos"}
            type="button"
            className={status === valor ? "filtro ativo" : "filtro"}
            aria-pressed={status === valor}
            onClick={() => setStatus(valor)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {erro && <Erro mensagem={erro} onTentarDeNovo={carregar} />}
      {!erro && itens === null && <Carregando />}
      {!erro && itens?.length === 0 && <Vazio texto="Nenhum componente encontrado." />}
      <ul className="lista">
        {itens?.map((c) => (
          <li key={c.id}>
            <Link to={`/componentes/${c.id}`} className="cartao">
              <div className="cartao-topo">
                <strong>{c.nome}</strong>
                <StatusBadge status={c.status} />
              </div>
              <span className="detalhe">{local(c)}</span>
              {c.emprestimo_aberto && (
                <span className="detalhe">Com {c.emprestimo_aberto.usuario_nome}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
