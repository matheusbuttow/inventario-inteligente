class AppError extends Error {
  constructor(status, erro, mensagem) {
    super(mensagem);
    this.status = status;
    this.erro = erro;
    this.mensagem = mensagem;
  }
}

function dadosInvalidos(mensagem = 'Campos obrigatórios ausentes ou inválidos.') {
  return new AppError(400, 'DADOS_INVALIDOS', mensagem);
}

function naoAutenticado(mensagem = 'Faça login para continuar.') {
  return new AppError(401, 'NAO_AUTENTICADO', mensagem);
}

function semPermissao(mensagem = 'Você não tem permissão para esta ação.') {
  return new AppError(403, 'SEM_PERMISSAO', mensagem);
}

function naoEncontrado(mensagem = 'Recurso não encontrado.') {
  return new AppError(404, 'NAO_ENCONTRADO', mensagem);
}

function qrInvalido(mensagem = 'Nenhum componente encontrado para este QR Code.') {
  return new AppError(404, 'QR_INVALIDO', mensagem);
}

function conflito(erro, mensagem) {
  return new AppError(409, erro, mensagem);
}

function formatarDiaMes(data) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
}

module.exports = {
  AppError,
  dadosInvalidos,
  naoAutenticado,
  semPermissao,
  naoEncontrado,
  qrInvalido,
  conflito,
  formatarDiaMes,
};
