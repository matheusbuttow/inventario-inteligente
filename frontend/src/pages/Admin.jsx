import { useSearchParams } from "react-router-dom";
import AdminComponentes from "./admin/AdminComponentes";
import AdminPessoas from "./admin/AdminPessoas";
import AdminLocais from "./admin/AdminLocais";

const ABAS = [
  ["componentes", "Equipamentos"],
  ["pessoas", "Pessoas"],
  ["locais", "Locais"],
];

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const aba = ABAS.some(([id]) => id === params.get("aba")) ? params.get("aba") : "componentes";

  return (
    <section>
      <h1>Administração</h1>
      <div className="filtros abas" role="tablist">
        {ABAS.map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            className={aba === id ? "filtro ativo" : "filtro"}
            onClick={() => setParams({ aba: id }, { replace: true })}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {aba === "componentes" && <AdminComponentes />}
      {aba === "pessoas" && <AdminPessoas />}
      {aba === "locais" && <AdminLocais />}
    </section>
  );
}
