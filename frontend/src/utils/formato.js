const STATUS = {
  disponivel: "Disponível",
  emprestado: "Emprestado",
  manutencao: "Em manutenção",
};

export const nomeDoStatus = (status) => STATUS[status] || status;

export function dataHora(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function diasDesde(iso) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (dias <= 0) return "hoje";
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

export const local = (componente) =>
  componente?.localizacao
    ? `${componente.localizacao.nome} · ${componente.localizacao.laboratorio}`
    : "Sem localização";
