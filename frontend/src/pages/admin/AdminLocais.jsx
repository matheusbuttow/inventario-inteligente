import { useCallback, useState } from "react";
import { Carregando, Erro, Vazio } from "../../components/Estado";
import useCarregar from "../../hooks/useCarregar";
import {
  atualizarLocalizacao,
  criarLocalizacao,
  listarLocalizacoes,
  mensagemDeErro,
  removerLocalizacao,
} from "../../services/inventario";

const VAZIO = { nome: "", laboratorio: "" };

export default function AdminLocais() {
  const buscar = useCallback(() => listarLocalizacoes(), []);
  const { dados: locais, erro, recarregar } = useCarregar(buscar, "Não foi possível carregar os locais.");
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState(null); // id do local em edição
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setEnviando(true);
    setMensagem(null);
    try {
      if (editando) {
        await atualizarLocalizacao(editando, form);
        setMensagem({ ok: true, texto: "Local atualizado." });
      } else {
        await criarLocalizacao(form);
        setMensagem({ ok: true, texto: "Local cadastrado." });
      }
      setForm(VAZIO);
      setEditando(null);
      recarregar();
    } catch (err) {
      setMensagem({ ok: false, texto: mensagemDeErro(err, "Não foi possível salvar o local.") });
    } finally {
      setEnviando(false);
    }
  }

  async function remover(local) {
    if (!window.confirm(`Remover "${local.nome}"? Os equipamentos desse local ficam sem localização.`)) return;
    try {
      await removerLocalizacao(local.id);
      recarregar();
    } catch (err) {
      setMensagem({ ok: false, texto: mensagemDeErro(err, "Não foi possível remover o local.") });
    }
  }

  return (
    <>
      <form className="formulario painel" onSubmit={salvar}>
        <h2>{editando ? "Editar local" : "Novo local"}</h2>
        <label>
          Onde fica (armário, gaveta, prateleira)
          <input required maxLength={80} value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Armário 3 — Gaveta A" />
        </label>
        <label>
          Laboratório
          <input required maxLength={80} value={form.laboratorio}
            onChange={(e) => setForm({ ...form, laboratorio: e.target.value })} placeholder="Lab. de Sistemas Embarcados" />
        </label>
        <button type="submit" className="botao" disabled={enviando}>
          {editando ? "Salvar alterações" : "Cadastrar local"}
        </button>
        {editando && (
          <button type="button" className="botao botao-claro" onClick={() => { setEditando(null); setForm(VAZIO); }}>
            Cancelar edição
          </button>
        )}
        {mensagem && <p className={mensagem.ok ? "mensagem-ok" : "mensagem-erro"} role="status">{mensagem.texto}</p>}
      </form>

      {erro && <Erro mensagem={erro} onTentarDeNovo={recarregar} />}
      {!erro && !locais && <Carregando />}
      {locais?.length === 0 && <Vazio texto="Nenhum local cadastrado." />}
      <ul className="lista">
        {locais?.map((l) => (
          <li key={l.id} className="cartao">
            <strong>{l.nome}</strong>
            <span className="detalhe">{l.laboratorio}</span>
            <div className="linha-acoes">
              <button type="button" className="botao-link"
                onClick={() => { setEditando(l.id); setForm({ nome: l.nome, laboratorio: l.laboratorio }); setMensagem(null); }}>
                Editar
              </button>
              <button type="button" className="botao-link perigo" onClick={() => remover(l)}>Remover</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
