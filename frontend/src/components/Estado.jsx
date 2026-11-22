// Mensagens de carregamento, erro e lista vazia usadas por todas as telas.
export function Carregando({ texto = "Carregando…" }) {
  return <p className="estado" role="status">{texto}</p>;
}

export function Erro({ mensagem, onTentarDeNovo }) {
  return (
    <div className="estado estado-erro" role="alert">
      <p>{mensagem}</p>
      {onTentarDeNovo && (
        <button type="button" className="botao botao-secundario" onClick={onTentarDeNovo}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Vazio({ texto }) {
  return <p className="estado">{texto}</p>;
}
