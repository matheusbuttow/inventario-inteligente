import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import AcoesComponente from "../components/AcoesComponente";
import { Carregando, Erro } from "../components/Estado";
import EtiquetaQr from "../components/EtiquetaQr";
import Foto from "../components/Foto";
import StatusBadge from "../components/StatusBadge";
import useCarregar from "../hooks/useCarregar";
import { buscarComponente, ehAdmin } from "../services/inventario";
import { dataHora, diasDesde, local } from "../utils/formato";

export default function Detalhe() {
  const { id } = useParams();
  const buscar = useCallback(() => buscarComponente(id), [id]);
  const { dados: componente, erro, recarregar } = useCarregar(buscar, "Não foi possível carregar o componente.");

  if (erro) return <Erro mensagem={erro} onTentarDeNovo={recarregar} />;
  if (!componente) return <Carregando />;

  const aberto = componente.emprestimo_aberto;
  return (
    <section>
      <Link to="/" className="voltar">← Componentes</Link>
      <Foto componente={componente} tamanho="grande" />
      <h1>{componente.nome}</h1>
      <StatusBadge status={componente.status} />
      <dl className="ficha">
        <dt>Onde fica</dt>
        <dd>{local(componente)}</dd>
        <dt>Categoria</dt>
        <dd>{componente.categoria || "—"}</dd>
        <dt>Código</dt>
        <dd><code>{componente.codigo_qr}</code></dd>
        {aberto && (
          <>
            <dt>Com quem está</dt>
            <dd>
              {aberto.usuario_nome}, desde {dataHora(aberto.retirado_em)} ({diasDesde(aberto.retirado_em)})
            </dd>
          </>
        )}
      </dl>
      <AcoesComponente componente={componente} onAlterado={recarregar} />
      <Link to={`/historico?componente_id=${componente.id}`} className="link">
        Ver histórico deste componente
      </Link>
      {ehAdmin() && (
        <div className="painel-admin">
          <Link to={`/admin/componentes/${componente.id}`} className="botao botao-claro">Editar equipamento</Link>
          <EtiquetaQr codigo={componente.codigo_qr} nome={componente.nome} />
        </div>
      )}
    </section>
  );
}
