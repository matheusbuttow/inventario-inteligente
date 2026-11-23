const bcrypt = require('bcrypt');
const db = require('../config/database');
const { dadosInvalidos, naoEncontrado, conflito, AppError } = require('../utils/errors');
const { PERFIS_VALIDOS, parseIntPositivo, textoValido, emailValido } = require('../utils/validators');

const BCRYPT_ROUNDS = 10;
const CAMPOS = 'id, nome, matricula, email, perfil, ativo, criado_em';

function erroDeDuplicado(error) {
  const detalhe = `${error.constraint || ''} ${error.detail || ''}`.toLowerCase();
  if (detalhe.includes('email')) return conflito('CONFLITO', 'Este e-mail já está cadastrado.');
  if (detalhe.includes('matricula')) return conflito('CONFLITO', 'Esta matrícula já está cadastrada.');
  return conflito('CONFLITO', 'E-mail ou matrícula já cadastrados.');
}

const listar = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT ${CAMPOS} FROM usuario ORDER BY nome ASC`);
    return res.status(200).json(rows);
  } catch (error) {
    return next(error);
  }
};

// Só admin chega aqui; pode criar aluno ou outro admin.
const criar = async (req, res, next) => {
  try {
    const body = req.body || {};
    const nome = textoValido(body.nome, { min: 1, max: 120 });
    const matricula = textoValido(
      body.matricula !== undefined && body.matricula !== null ? String(body.matricula) : '',
      { min: 1, max: 20 }
    );
    const email = emailValido(body.email);
    const senha = typeof body.senha === 'string' ? body.senha : '';
    const perfil = body.perfil === undefined ? 'aluno' : body.perfil;

    if (!nome) return next(dadosInvalidos('O campo nome é obrigatório e deve ter até 120 caracteres.'));
    if (!matricula) return next(dadosInvalidos('O campo matrícula é obrigatório e deve ter até 20 caracteres.'));
    if (!email) return next(dadosInvalidos('Informe um e-mail válido.'));
    if (senha.length < 6) return next(dadosInvalidos('A senha deve ter no mínimo 6 caracteres.'));
    if (!PERFIS_VALIDOS.includes(perfil)) return next(dadosInvalidos('Perfil inválido. Use "aluno" ou "admin".'));

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    const { rows } = await db.query(
      `INSERT INTO usuario (nome, matricula, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${CAMPOS}`,
      [nome, matricula, email, senhaHash, perfil]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error && error.code === '23505') return next(erroDeDuplicado(error));
    return next(error);
  }
};

// Altera nome, e-mail, matrícula, perfil, ativo e/ou senha.
const atualizar = async (req, res, next) => {
  try {
    const id = parseIntPositivo(req.params.id);
    if (!id) return next(dadosInvalidos('ID do usuário inválido.'));

    const body = req.body || {};
    const proprio = req.usuario && req.usuario.id === id;
    const campos = [];
    const valores = [];
    const set = (coluna, valor) => {
      valores.push(valor);
      campos.push(`${coluna} = $${valores.length}`);
    };

    if (body.nome !== undefined) {
      const nome = textoValido(body.nome, { min: 1, max: 120 });
      if (!nome) return next(dadosInvalidos('O campo nome deve ter entre 1 e 120 caracteres.'));
      set('nome', nome);
    }
    if (body.email !== undefined) {
      const email = emailValido(body.email);
      if (!email) return next(dadosInvalidos('Informe um e-mail válido.'));
      set('email', email);
    }
    if (body.matricula !== undefined) {
      const matricula = textoValido(body.matricula === null ? '' : String(body.matricula), { min: 1, max: 20 });
      if (!matricula) return next(dadosInvalidos('O campo matrícula deve ter entre 1 e 20 caracteres.'));
      set('matricula', matricula);
    }
    if (body.perfil !== undefined) {
      if (!PERFIS_VALIDOS.includes(body.perfil)) {
        return next(dadosInvalidos('Perfil inválido. Use "aluno" ou "admin".'));
      }
      if (proprio && body.perfil !== 'admin') {
        return next(new AppError(400, 'OPERACAO_INVALIDA', 'Você não pode tirar o seu próprio acesso de admin.'));
      }
      set('perfil', body.perfil);
    }
    if (body.ativo !== undefined) {
      if (typeof body.ativo !== 'boolean') return next(dadosInvalidos('O campo ativo deve ser true ou false.'));
      if (proprio && body.ativo === false) {
        return next(new AppError(400, 'OPERACAO_INVALIDA', 'Você não pode desativar a sua própria conta.'));
      }
      set('ativo', body.ativo);
    }
    if (body.senha !== undefined) {
      if (typeof body.senha !== 'string' || body.senha.length < 6) {
        return next(dadosInvalidos('A senha deve ter no mínimo 6 caracteres.'));
      }
      set('senha_hash', await bcrypt.hash(body.senha, BCRYPT_ROUNDS));
    }

    if (campos.length === 0) return next(dadosInvalidos('Informe ao menos um campo para atualizar.'));

    valores.push(id);
    const { rows } = await db.query(
      `UPDATE usuario SET ${campos.join(', ')} WHERE id = $${valores.length} RETURNING ${CAMPOS}`,
      valores
    );
    if (!rows[0]) return next(naoEncontrado('Usuário não encontrado.'));
    return res.status(200).json(rows[0]);
  } catch (error) {
    if (error && error.code === '23505') return next(erroDeDuplicado(error));
    return next(error);
  }
};

module.exports = { listar, criar, atualizar };
