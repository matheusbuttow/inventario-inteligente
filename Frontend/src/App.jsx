import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Componentes from "./pages/Componentes";
import Detalhe from "./pages/Detalhe";
import Scanner from "./pages/Scanner";
import MeusEmprestimos from "./pages/MeusEmprestimos";
import Historico from "./pages/Historico";

function Privada({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />;
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}