const db = require('../config/database');
const { dadosInvalidos, naoEncontrado } = require('../utils/errors');
const { textoValido, parseIntPositivo } = require('../utils/validators');

const listar = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, nome, laboratorio
       FROM localizacao
       ORDER BY id ASC`
    );
    return res.status(200).json(rows);
  } catch (error) {
    return next(error);
  }
};

const criar = async (req, res, next) => {
  try {
    const body = req.body || {};
    const nome = textoValido(body.nome, { min: 1, max: 80 });
    const laboratorio = textoValido(body.laboratorio, { min: 1, max: 80 });

    if (!nome) {
      return next(dadosInvalidos('O campo nome é obrigatório e deve ter até 80 caracteres.'));
    }
    if (!laboratorio) {
      return next(dadosInvalidos('O campo laboratório é obrigatório e deve ter até 80 caracteres.'));
    }

    const { rows } = await db.query(
      `INSERT INTO localizacao (nome, laboratorio)
       VALUES ($1, $2)
       RETURNING id, nome, laboratorio`,
      [nome, laboratorio]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const id = parseIntPositivo(req.params.id);
    if (!id) {
      return next(dadosInvalidos('ID da localização inválido.'));
    }
    const body = req.body || {};
    const nome = textoValido(body.nome, { min: 1, max: 80 });
    const laboratorio = textoValido(body.laboratorio, { min: 1, max: 80 });
    if (!nome || !laboratorio) {
      return next(dadosInvalidos('Informe nome e laboratório (até 80 caracteres cada).'));
    }
    const { rows } = await db.query(
      `UPDATE localizacao SET nome = $1, laboratorio = $2 WHERE id = $3
       RETURNING id, nome, laboratorio`,
      [nome, laboratorio, id]
    );
    if (!rows[0]) {
      return next(naoEncontrado('Localização não encontrada.'));
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    return next(error);
  }
};

// Componentes que estavam nesse local ficam sem localização (ON DELETE SET NULL).
const remover = async (req, res, next) => {
  try {
    const id = parseIntPositivo(req.params.id);
    if (!id) {
      return next(dadosInvalidos('ID da localização inválido.'));
    }
    const { rows } = await db.query('DELETE FROM localizacao WHERE id = $1 RETURNING id', [id]);
    if (!rows[0]) {
      return next(naoEncontrado('Localização não encontrada.'));
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listar,
  criar,
  atualizar,
  remover,
};
