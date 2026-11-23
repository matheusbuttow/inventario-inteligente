import { useCallback, useState } from "react";
import { Carregando, Erro, Vazio } from "../../components/Estado";
import useCarregar from "../../hooks/useCarregar";
import {
  atualizarUsuario,
  criarUsuario,
  listarUsuarios,
  mensagemDeErro,
  usuarioLogado,
} from "../../services/inventario";

const VAZIO = { nome: "", matricula: "", email: "", senha: "", perfil: "aluno" };

export default function AdminPessoas() {
  const buscar = useCallback(() => listarUsuarios(), []);
  const { dados: pessoas, erro, recarregar } = useCarregar(buscar, "Não foi possível carregar as pessoas.");
  const [form, setForm] = useState(VAZIO);
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const eu = usuarioLogado();

  async function cadastrar(e) {
    e.preventDefault();
    setEnviando(true);
    setMensagem(null);
    try {
      const nova = await criarUsuario(form);
      setMensagem({ ok: true, texto: `${nova.nome} cadastrado(a). Já pode entrar com o e-mail e a senha informados.` });
      setForm(VAZIO);
      recarregar();
    } catch (err) {
      setMensagem({ ok: false, texto: mensagemDeErro(err, "Não foi possível cadastrar.") });
    } finally {
      setEnviando(false);
    }
  }

  async function alterar(pessoa, dados, texto) {
    setMensagem(null);
    try {
      await atualizarUsuario(pessoa.id, dados);
      setMensagem({ ok: true, texto });
      recarregar();
    } catch (err) {
      setMensagem({ ok: false, texto: mensagemDeErro(err, "Não foi possível alterar.") });
    }
  }

  function novaSenha(pessoa) {
    const senha = window.prompt(`Nova senha para ${pessoa.nome} (mínimo 6 caracteres):`);
    if (senha) alterar(pessoa, { senha }, `Senha de ${pessoa.nome} trocada.`);
  }

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => setForm({ ...form, [nome]: e.target.value }),
  });

  return (
    <>
      <form className="formulario painel" onSubmit={cadastrar}>
        <h2>Cadastrar pessoa</h2>
        <label>Nome completo<input required maxLength={120} {...campo("nome")} /></label>
        <label>Matrícula<input required maxLength={20} {...campo("matricula")} /></label>
        <label>E-mail<input required type="email" maxLength={120} autoCapitalize="none" {...campo("email")} /></label>
        <label>Senha inicial<input required type="password" minLength={6} autoComplete="new-password" {...campo("senha")} /></label>
        <label>
          Perfil
          <select {...campo("perfil")}>
            <option value="aluno">Aluno — pega e devolve componentes</option>
            <option value="admin">Admin — também cadastra equipamentos e pessoas</option>
          </select>
        </label>
        <button type="submit" className="botao" disabled={enviando}>Cadastrar</button>
        {mensagem && <p className={mensagem.ok ? "mensagem-ok" : "mensagem-erro"} role="status">{mensagem.texto}</p>}
      </form>

      {erro && <Erro mensagem={erro} onTentarDeNovo={recarregar} />}
      {!erro && !pessoas && <Carregando />}
      {pessoas?.length === 0 && <Vazio texto="Nenhuma pessoa cadastrada." />}
      <ul className="lista">
        {pessoas?.map((p) => {
          const souEu = p.id === eu?.id;
          return (
            <li key={p.id} className={p.ativo === false ? "cartao cartao-inativo" : "cartao"}>
              <div className="cartao-topo">
                <strong>{p.nome}{souEu && " (você)"}</strong>
                <span className={`badge ${p.perfil === "admin" ? "badge-admin" : "badge-manutencao"}`}>
                  {p.perfil === "admin" ? "Admin" : "Aluno"}
                </span>
              </div>
              <span className="detalhe">{p.email} · matrícula {p.matricula}</span>
              {p.ativo === false && <span className="detalhe">Conta desativada — não consegue entrar</span>}
              {!souEu && (
                <div className="linha-acoes">
                  <button type="button" className="botao-link"
                    onClick={() => alterar(p, { perfil: p.perfil === "admin" ? "aluno" : "admin" },
                      `${p.nome} agora é ${p.perfil === "admin" ? "aluno" : "admin"}.`)}>
                    {p.perfil === "admin" ? "Tornar aluno" : "Tornar admin"}
                  </button>
                  <button type="button" className="botao-link" onClick={() => novaSenha(p)}>Trocar senha</button>
                  <button type="button" className={p.ativo === false ? "botao-link" : "botao-link perigo"}
                    onClick={() => alterar(p, { ativo: p.ativo === false },
                      p.ativo === false ? `${p.nome} reativado(a).` : `${p.nome} desativado(a).`)}>
                    {p.ativo === false ? "Reativar" : "Desativar"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
