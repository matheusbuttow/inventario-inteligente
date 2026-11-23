import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ehAdmin, sair, usuarioLogado } from "../services/inventario";

export default function Layout() {
  const navigate = useNavigate();
  const usuario = usuarioLogado();

  function encerrar() {
    sair();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app">
      <header className="topo">
        <span>{usuario?.nome ? `Olá, ${usuario.nome.split(" ")[0]}` : "Inventário do Lab"}</span>
        <button type="button" className="botao-link" onClick={encerrar}>Sair</button>
      </header>
      <main className="conteudo"><Outlet /></main>
      <nav className="menu">
        <NavLink to="/" end>Componentes</NavLink>
        <NavLink to="/scanner">Escanear</NavLink>
        <NavLink to="/meus-emprestimos">Meus</NavLink>
        <NavLink to="/historico">Histórico</NavLink>
        {ehAdmin() && <NavLink to="/admin">Admin</NavLink>}
      </nav>
    </div>
  );
}
