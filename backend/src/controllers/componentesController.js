const db = require('../config/database');
const { dadosInvalidos, naoEncontrado, qrInvalido, conflito } = require('../utils/errors');
const { STATUS_VALIDOS, parseIntPositivo, textoValido } = require('../utils/validators');

const SELECT_COMPONENTE_COMPLETO = `
  SELECT
    c.id,
    c.nome,
    c.categoria,
    c.codigo_qr,
    c.localizacao_id,
    c.status,
    c.criado_em,
    l.id AS loc_id,
    l.nome AS loc_nome,
    l.laboratorio AS loc_laboratorio,
    e.id AS emp_id,
    e.usuario_id AS emp_usuario_id,
    u.nome AS emp_usuario_nome,
    e.retirado_em AS emp_retirado_em
  FROM componente c
  LEFT JOIN localizacao l ON l.id = c.localizacao_id
  LEFT JOIN emprestimo e ON e.componente_id = c.id AND e.devolvido_em IS NULL
  LEFT JOIN usuario u ON u.id = e.usuario_id
`;

function mapComponente(row, incluirEmprestimo = true) {
  const componente = {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    codigo_qr: row.codigo_qr,
    localizacao_id: row.localizacao_id,
    status: row.status,
    criado_em: row.criado_em,
    localizacao: row.loc_id
      ? {
          id: row.loc_id,
          nome: row.loc_nome,
          laboratorio: row.loc_laboratorio,
        }
      : null,
  };

  if (incluirEmprestimo) {
    componente.emprestimo_aberto = row.emp_id
      ? {
          id: row.emp_id,
          usuario_id: row.emp_usuario_id,
          usuario_nome: row.emp_usuario_nome,
          retirado_em: row.emp_retirado_em,
        }
      : null;
  }

  return componente;
}

async function buscarComponenteCompletoPorId(id, incluirEmprestimo = true) {
  const { rows } = await db.query(`${SELECT_COMPONENTE_COMPLETO} WHERE c.id = $1`, [id]);
  if (!rows[0]) return null;
  return mapComponente(rows[0], incluirEmprestimo);
}

const listar = async (req, res, next) => {
  try {
    const condicoes = [];
    const valores = [];

    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    if (status) {
      if (!STATUS_VALIDOS.includes(status)) {
        return next(
          dadosInvalidos('Status inválido. Use "disponivel", "emprestado" ou "manutencao".')
        );
      }
      valores.push(status);
      condicoes.push(`c.status = $${valores.length}`);
    }

    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';
    if (busca) {
      valores.push(`%${busca}%`);
      const idx = valores.length;
      condicoes.push(`(c.nome ILIKE $${idx} OR c.categoria ILIKE $${idx} OR c.codigo_qr ILIKE $${idx})`);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await db.query(
      `${SELECT_COMPONENTE_COMPLETO} ${where} ORDER BY c.id ASC`,
      valores
    );

    return res.status(200).json(rows.map((row) => mapComponente(row, true)));
  } catch (error) {
    return next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const id = parseIntPositivo(req.params.id);
    if (!id) {
      return next(dadosInvalidos('ID do componente inválido.'));
    }

    const componente = await buscarComponenteCompletoPorId(id, true);
    if (!componente) {
      return next(naoEncontrado('Componente não encontrado.'));
    }

    return res.status(200).json(componente);
  } catch (error) {
    return next(error);
  }
};

const buscarPorQr = async (req, res, next) => {
  try {
    const codigo = textoValido(req.params.codigo, { min: 1, max: 64 });
    if (!codigo) {
      return next(qrInvalido());
    }

    const { rows } = await db.query(
      `${SELECT_COMPONENTE_COMPLETO} WHERE c.codigo_qr = $1`,
      [codigo]
    );

    if (!rows[0]) {
      return next(qrInvalido());
    }

    return res.status(200).json(mapComponente(rows[0], true));
  } catch (error) {
    return next(error);
  }
};

const criar = async (req, res, next) => {
  try {
    const body = req.body || {};
    const nome = textoValido(body.nome, { min: 1, max: 120 });
    const categoria = textoValido(body.categoria, { min: 1, max: 60 });
    const codigoQr = textoValido(body.codigo_qr, { min: 1, max: 64 });
    const localizacaoId = parseIntPositivo(body.localizacao_id);
    const status = body.status === undefined ? 'disponivel' : body.status;

    if (!nome) {
      return next(dadosInvalidos('O campo nome é obrigatório e deve ter até 120 caracteres.'));
    }
    if (!categoria) {
      return next(dadosInvalidos('O campo categoria é obrigatório e deve ter até 60 caracteres.'));
    }
    if (!codigoQr) {
      return next(dadosInvalidos('O campo codigo_qr é obrigatório e deve ter até 64 caracteres.'));
    }
    if (!localizacaoId) {
      return next(dadosInvalidos('O campo localizacao_id deve ser um inteiro positivo.'));
    }
    if (!STATUS_VALIDOS.includes(status)) {
      return next(
        dadosInvalidos('Status inválido. Use "disponivel", "emprestado" ou "manutencao".')
      );
    }

    const { rows } = await db.query(
      `INSERT INTO componente (nome, categoria, codigo_qr, localizacao_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [nome, categoria, codigoQr, localizacaoId, status]
    );

    const componente = await buscarComponenteCompletoPorId(rows[0].id, false);
    return res.status(201).json(componente);
  } catch (error) {
    if (error && error.code === '23505') {
      return next(conflito('CONFLITO', 'Já existe um componente com este código QR.'));
    }
    if (error && error.code === '23503') {
      return next(dadosInvalidos('Localização informada não existe.'));
    }
    return next(error);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const id = parseIntPositivo(req.params.id);
    if (!id) {
      return next(dadosInvalidos('ID do componente inválido.'));
    }

    const body = req.body || {};
    const campos = [];
    const valores = [];

    if (body.nome !== undefined) {
      const nome = textoValido(body.nome, { min: 1, max: 120 });
      if (!nome) {
        return next(dadosInvalidos('O campo nome deve ter entre 1 e 120 caracteres.'));
      }
      valores.push(nome);
      campos.push(`nome = $${valores.length}`);
    }

    if (body.categoria !== undefined) {
      const categoria = textoValido(body.categoria, { min: 1, max: 60 });
      if (!categoria) {
        return next(dadosInvalidos('O campo categoria deve ter entre 1 e 60 caracteres.'));
      }
      valores.push(categoria);
      campos.push(`categoria = $${valores.length}`);
    }

    if (body.codigo_qr !== undefined) {
      const codigoQr = textoValido(body.codigo_qr, { min: 1, max: 64 });
      if (!codigoQr) {
        return next(dadosInvalidos('O campo codigo_qr deve ter entre 1 e 64 caracteres.'));
      }
      valores.push(codigoQr);
      campos.push(`codigo_qr = $${valores.length}`);
    }

    if (body.localizacao_id !== undefined) {
      const localizacaoId = parseIntPositivo(body.localizacao_id);
      if (!localizacaoId) {
        return next(dadosInvalidos('O campo localizacao_id deve ser um inteiro positivo.'));
      }
      valores.push(localizacaoId);
      campos.push(`localizacao_id = $${valores.length}`);
    }

    if (body.status !== undefined) {
      if (!STATUS_VALIDOS.includes(body.status)) {
        return next(
          dadosInvalidos('Status inválido. Use "disponivel", "emprestado" ou "manutencao".')
        );
      }
      valores.push(body.status);
      campos.push(`status = $${valores.length}`);
    }

    if (campos.length === 0) {
      return next(dadosInvalidos('Informe ao menos um campo para atualizar.'));
    }

    valores.push(id);
    const { rows } = await db.query(
      `UPDATE componente
       SET ${campos.join(', ')}
       WHERE id = $${valores.length}
       RETURNING id`,
      valores
    );

    if (!rows[0]) {
      return next(naoEncontrado('Componente não encontrado.'));
    }

    const componente = await buscarComponenteCompletoPorId(rows[0].id, false);
    return res.status(200).json(componente);
  } catch (error) {
    if (error && error.code === '23505') {
      return next(conflito('CONFLITO', 'Já existe um componente com este código QR.'));
    }
    if (error && error.code === '23503') {
      return next(dadosInvalidos('Localização informada não existe.'));
    }
    return next(error);
  }
};

const remover = async (req, res, next) => {
  try {
    const id = parseIntPositivo(req.params.id);
    if (!id) {
      return next(dadosInvalidos('ID do componente inválido.'));
    }

    const existente = await db.query('SELECT id FROM componente WHERE id = $1', [id]);
    if (!existente.rows[0]) {
      return next(naoEncontrado('Componente não encontrado.'));
    }

    const historico = await db.query(
      'SELECT 1 FROM emprestimo WHERE componente_id = $1 LIMIT 1',
      [id]
    );
    if (historico.rows.length > 0) {
      return next(
        conflito(
          'COMPONENTE_COM_HISTORICO',
          'Não é possível remover um componente que possui histórico de empréstimos.'
        )
      );
    }

    await db.query('DELETE FROM componente WHERE id = $1', [id]);
    return res.status(204).send();
  } catch (error) {
    if (error && error.code === '23503') {
      return next(
        conflito(
          'COMPONENTE_COM_HISTORICO',
          'Não é possível remover um componente que possui histórico de empréstimos.'
        )
      );
    }
    return next(error);
  }
};

module.exports = {
  listar,
  buscarPorId,
  buscarPorQr,
  criar,
  atualizar,
  remover,
};
