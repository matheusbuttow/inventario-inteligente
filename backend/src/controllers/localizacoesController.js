const db = require('../config/database');
const { dadosInvalidos } = require('../utils/errors');
const { textoValido } = require('../utils/validators');

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

module.exports = {
  listar,
  criar,
};
