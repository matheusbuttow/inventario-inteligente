const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { AppError, dadosInvalidos, naoAutenticado, conflito } = require('../utils/errors');
const { textoValido, emailValido } = require('../utils/validators');

const BCRYPT_ROUNDS = 10;

const registrar = async (req, res, next) => {
  try {
    const body = req.body || {};
    const nome = textoValido(body.nome, { min: 1, max: 120 });
    const matricula = textoValido(
      body.matricula !== undefined && body.matricula !== null ? String(body.matricula) : '',
      { min: 1, max: 20 }
    );
    const email = emailValido(body.email);
    const senha = typeof body.senha === 'string' ? body.senha : '';
    // Cadastro público sempre cria aluno; contas de admin são criadas por um admin em /usuarios.
    const perfil = 'aluno';

    if (!nome) {
      return next(dadosInvalidos('O campo nome é obrigatório e deve ter até 120 caracteres.'));
    }
    if (!matricula) {
      return next(dadosInvalidos('O campo matrícula é obrigatório e deve ter até 20 caracteres.'));
    }
    if (!email) {
      return next(dadosInvalidos('Informe um e-mail válido.'));
    }
    if (senha.length < 6) {
      return next(dadosInvalidos('A senha deve ter no mínimo 6 caracteres.'));
    }

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    const { rows } = await db.query(
      `INSERT INTO usuario (nome, matricula, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, matricula, email, perfil, criado_em`,
      [nome, matricula, email, senhaHash, perfil]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error && error.code === '23505') {
      const detalhe = `${error.constraint || ''} ${error.detail || ''}`.toLowerCase();
      if (detalhe.includes('email')) {
        return next(conflito('CONFLITO', 'Este e-mail já está cadastrado.'));
      }
      if (detalhe.includes('matricula')) {
        return next(conflito('CONFLITO', 'Esta matrícula já está cadastrada.'));
      }
      return next(conflito('CONFLITO', 'E-mail ou matrícula já cadastrados.'));
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const emailBruto = typeof body.email === 'string' ? body.email.trim() : '';
    const matriculaBruta =
      body.matricula !== undefined && body.matricula !== null
        ? String(body.matricula).trim()
        : '';
    const senha = typeof body.senha === 'string' ? body.senha : '';

    if ((!emailBruto && !matriculaBruta) || !senha) {
      return next(dadosInvalidos('E-mail e senha são obrigatórios.'));
    }

    let result;
    if (emailBruto) {
      result = await db.query(
        `SELECT id, nome, matricula, email, senha_hash, perfil, ativo, criado_em
         FROM usuario
         WHERE LOWER(email) = LOWER($1)`,
        [emailBruto]
      );
    } else {
      result = await db.query(
        `SELECT id, nome, matricula, email, senha_hash, perfil, ativo, criado_em
         FROM usuario
         WHERE matricula = $1`,
        [matriculaBruta]
      );
    }

    const user = result.rows[0];
    let senhaValida = false;
    if (user && typeof user.senha_hash === 'string') {
      try {
        senhaValida = await bcrypt.compare(senha, user.senha_hash);
      } catch {
        senhaValida = false;
      }
    }

    if (!user || !senhaValida) {
      return next(naoAutenticado('E-mail ou senha inválidos.'));
    }

    if (user.ativo === false) {
      return next(naoAutenticado('Esta conta foi desativada. Fale com o administrador.'));
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está configurado.');
      return next(
        new AppError(500, 'ERRO_INTERNO', 'A autenticação não está configurada no servidor.')
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        perfil: user.perfil,
        email: user.email,
        matricula: user.matricula,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        matricula: user.matricula,
        email: user.email,
        perfil: user.perfil,
        criado_em: user.criado_em,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const eu = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, nome, matricula, email, perfil, criado_em
       FROM usuario
       WHERE id = $1`,
      [req.usuario.id]
    );

    if (!rows[0]) {
      return next(naoAutenticado('Usuário não encontrado. Faça login novamente.'));
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registrar,
  login,
  eu,
};
