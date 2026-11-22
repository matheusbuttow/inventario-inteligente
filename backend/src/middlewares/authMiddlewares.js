const jwt = require('jsonwebtoken');
const { AppError, naoAutenticado, semPermissao } = require('../utils/errors');

const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return next(naoAutenticado());
  }

  const [esquema, token] = authHeader.split(' ');
  if (esquema !== 'Bearer' || !token) {
    return next(naoAutenticado('Token ausente ou malformado.'));
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET não está configurado.');
    return next(new AppError(500, 'ERRO_INTERNO', 'A autenticação não está configurada no servidor.'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id: payload.id,
      perfil: payload.perfil,
      email: payload.email,
      matricula: payload.matricula,
    };
    return next();
  } catch {
    return next(naoAutenticado('Token inválido ou expirado.'));
  }
};

const exigirAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return next(semPermissao());
  }
  return next();
};

module.exports = {
  autenticar,
  exigirAdmin,
};
