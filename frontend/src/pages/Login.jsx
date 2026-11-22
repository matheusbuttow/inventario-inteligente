import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login, mensagemDeErro } from "../services/inventario";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  // Lido só ao abrir a tela: quem já está logado vai direto para a lista.
  const [jaLogado] = useState(() => Boolean(localStorage.getItem("token")));

  if (jaLogado) return <Navigate to="/" replace />;

  async function entrar(event) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email.trim(), senha);
      navigate("/scanner", { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível entrar. Tente de novo."));
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <h1>Inventário do Lab</h1>
      <p className="subtitulo">Entre uma vez e registre empréstimos em segundos.</p>
      <form onSubmit={entrar} className="formulario">
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <button type="submit" className="botao botao-grande" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
