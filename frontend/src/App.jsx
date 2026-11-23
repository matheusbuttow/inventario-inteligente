import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Componentes from "./pages/Componentes";
import Detalhe from "./pages/Detalhe";
import Scanner from "./pages/Scanner";
import MeusEmprestimos from "./pages/MeusEmprestimos";
import Historico from "./pages/Historico";
import Admin from "./pages/Admin";
import ComponenteForm from "./pages/admin/ComponenteForm";
import { ehAdmin } from "./services/inventario";

function Privada({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

// Telas de cadastro: só quem entrou com perfil admin (a API também confere).
function SoAdmin({ children }) {
  return ehAdmin() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Privada><Layout /></Privada>}>
          <Route path="/" element={<Componentes />} />
          <Route path="/componentes/:id" element={<Detalhe />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/meus-emprestimos" element={<MeusEmprestimos />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/admin" element={<SoAdmin><Admin /></SoAdmin>} />
          <Route path="/admin/componentes/novo" element={<SoAdmin><ComponenteForm /></SoAdmin>} />
          <Route path="/admin/componentes/:id" element={<SoAdmin><ComponenteForm /></SoAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}