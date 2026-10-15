import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app">
      <main className="conteudo"><Outlet /></main>
      <nav className="menu">
        <NavLink to="/">Componentes</NavLink>
        <NavLink to="/scanner">Escanear</NavLink>
        <NavLink to="/meus-emprestimos">Meus</NavLink>
        <NavLink to="/historico">Histórico</NavLink>
      </nav>
    </div>
  );
}