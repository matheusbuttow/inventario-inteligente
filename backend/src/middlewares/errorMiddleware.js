const { AppError } = require('../utils/errors');

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      erro: err.erro,
      mensagem: err.mensagem,
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      erro: 'DADOS_INVALIDOS',
      mensagem: 'JSON inválido no corpo da requisição.',
    });
  }

  console.error('Erro não tratado na API:', err);
  return res.status(500).json({
    erro: 'ERRO_INTERNO',
    mensagem: 'Erro interno no servidor.',
  });
};

module.exports = errorMiddleware;
