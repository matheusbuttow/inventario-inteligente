import { useState } from "react";
import { Link } from "react-router-dom";
import { Carregando, Erro, Vazio } from "../components/Estado";
import useCarregar from "../hooks/useCarregar";
import { atrasados, devolver, meusEmprestimos, mensagemDeErro } from "../services/inventario";

// Meus empréstimos abertos + a lista de atrasados, para destacar os meus que passaram do prazo.
async function buscarMeus() {
  const [meus, emAtraso] = await Promise.all([meusEmprestimos(), atrasados()]);
  return { meus, emAtraso };
}
import { dataHora, diasDesde, local } from "../utils/formato";

export default function MeusEmprestimos() {
  const { dados, erro: erroCarga, recarregar } = useCarregar(buscarMeus, "Não foi possível carregar seus empréstimos.");
  const [erroAcao, setErroAcao] = useState(null);
  const [devolvendo, setDevolvendo] = useState(null);
  const itens = dados?.meus ?? null;
  const idsAtrasados = new Set((dados?.emAtraso ?? []).map((e) => e.id));
  const erro = erroAcao || erroCarga;

  async function registrarDevolucao(id) {
    setDevolvendo(id);
    try {
      await devolver(id);
      setErroAcao(null);
      recarregar();
    } catch (err) {
      setErroAcao(mensagemDeErro(err));
    } finally {
      setDevolvendo(null);
    }
  }

  return (
    <section>
      <h1>Meus empréstimos</h1>
      {erro && <Erro mensagem={erro} onTentarDeNovo={() => { setErroAcao(null); recarregar(); }} />}
      {!erro && itens === null && <Carregando />}
      {!erro && itens?.length === 0 && <Vazio texto="Você não está com nenhum componente." />}
      <ul className="lista">
        {itens?.map((e) => {
          const atrasado = idsAtrasados.has(e.id);
          return (
            <li key={e.id} className={atrasado ? "cartao cartao-atrasado" : "cartao"}>
              <div className="cartao-topo">
                <Link to={`/componentes/${e.componente_id}`}>
                  <strong>{e.componente?.nome}</strong>
                </Link>
                {atrasado && <span className="badge badge-atrasado">Atrasado</span>}
              </div>
              <span className="detalhe">Pegou em {dataHora(e.retirado_em)} ({diasDesde(e.retirado_em)})</span>
              <span className="detalhe">Devolver em: {local(e.componente)}</span>
              <button
                type="button"
                className="botao botao-devolver"
                disabled={devolvendo === e.id}
                onClick={() => registrarDevolucao(e.id)}
              >
                {devolvendo === e.id ? "Registrando…" : "Devolver"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
