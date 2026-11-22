import { useState } from "react";
import { devolver, mensagemDeErro, pegar, usuarioLogado } from "../services/inventario";

// Botões grandes Pegar / Devolver. Só mostra o que faz sentido para o estado do componente.
export default function AcoesComponente({ componente, onAlterado }) {
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const eu = usuarioLogado();
  const aberto = componente.emprestimo_aberto;
  const podeDevolver = aberto && eu && (aberto.usuario_id === eu.id || eu.perfil === "admin");

  async function executar(acao, sucesso) {
    setEnviando(true);
    setMensagem(null);
    try {
      await acao();
      setMensagem({ tipo: "ok", texto: sucesso });
      await onAlterado?.();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(err) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="acoes">
      {componente.status === "disponivel" && !aberto && (
        <button
          type="button"
          className="botao botao-grande"
          disabled={enviando}
          onClick={() => executar(() => pegar(componente.id), "Pronto! O componente está com você.")}
        >
          {enviando ? "Registrando…" : "Pegar"}
        </button>
      )}
      {podeDevolver && (
        <button
          type="button"
          className="botao botao-grande botao-devolver"
          disabled={enviando}
          onClick={() => executar(() => devolver(aberto.id), "Devolução registrada. Obrigado!")}
        >
          {enviando ? "Registrando…" : "Devolver"}
        </button>
      )}
      {aberto && !podeDevolver && (
        <p className="aviso">Está com {aberto.usuario_nome}. Só essa pessoa ou um admin registra a devolução.</p>
      )}
      {componente.status === "manutencao" && !aberto && (
        <p className="aviso">Em manutenção: não pode ser emprestado agora.</p>
      )}
      {mensagem && (
        <p className={mensagem.tipo === "ok" ? "mensagem-ok" : "mensagem-erro"} role="status">
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}
