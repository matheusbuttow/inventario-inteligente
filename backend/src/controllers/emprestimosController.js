const db = require('../config/database');
const {
  dadosInvalidos,
  naoAutenticado,
  semPermissao,
  naoEncontrado,
  conflito,
  formatarDiaMes,
} = require('../utils/errors');
const { parseIntPositivo } = require('../utils/validators');

const SELECT_EMPRESTIMO_COMPLETO = `
  SELECT
    e.id,
    e.usuario_id,
    e.componente_id,
    e.retirado_em,
    e.devolvido_em,
    u.id AS usr_id,
    u.nome AS usr_nome,
    u.matricula AS usr_matricula,
    u.email AS usr_email,
    u.perfil AS usr_perfil,
    u.criado_em AS usr_criado_em,
    c.id AS comp_id,
    c.nome AS comp_nome,
    c.categoria AS comp_categoria,
    c.codigo_qr AS comp_codigo_qr,
    c.localizacao_id AS comp_localizacao_id,
    c.status AS comp_status,
    c.criado_em AS comp_criado_em,
    l.id AS loc_id,
    l.nome AS loc_nome,
    l.laboratorio AS loc_laboratorio
  FROM emprestimo e
  JOIN usuario u ON u.id = e.usuario_id
  JOIN componente c ON c.id = e.componente_id
  LEFT JOIN localizacao l ON l.id = c.localizacao_id
`;

function mapEmprestimo(row) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    componente_id: row.componente_id,
    retirado_em: row.retirado_em,
    devolvido_em: row.devolvido_em,
    usuario: {
      id: row.usr_id,
      nome: row.usr_nome,
      matricula: row.usr_matricula,
      email: row.usr_email,
      perfil: row.usr_perfil,
      criado_em: row.usr_criado_em,
    },
    componente: {
      id: row.comp_id,
      nome: row.comp_nome,
      categoria: row.comp_categoria,
      codigo_qr: row.comp_codigo_qr,
      localizacao_id: row.comp_localizacao_id,
      status: row.comp_status,
      criado_em: row.comp_criado_em,
      localizacao: row.loc_id
        ? {
            id: row.loc_id,
            nome: row.loc_nome,
            laboratorio: row.loc_laboratorio,
          }
        : null,
    },
  };
}

async function buscarEmprestimoCompletoPorId(id) {
  const { rows } = await db.query(`${SELECT_EMPRESTIMO_COMPLETO} WHERE e.id = $1`, [id]);
  if (!rows[0]) return null;
  return mapEmprestimo(rows[0]);
}

const criar = async (req, res, next) => {
  const body = req.body || {};
  const componenteId = parseIntPositivo(body.componente_id);

  if (!componenteId) {
    return next(dadosInvalidos('O campo componente_id é obrigatório e deve ser um inteiro positivo.'));
  }

  let client;
  try {
    client = await db.getClient();
    await client.query('BEGIN');

    const compResult = await client.query(
      'SELECT id, nome, status FROM componente WHERE id = $1 FOR UPDATE',
      [componenteId]
    );
    const componente = compResult.rows[0];

    if (!componente) {
      await client.query('ROLLBACK');
      return next(naoEncontrado('Componente não encontrado.'));
    }

    const abertoResult = await client.query(
      `SELECT e.id, e.usuario_id, e.retirado_em, u.nome AS usuario_nome
       FROM emprestimo e
       JOIN usuario u ON u.id = e.usuario_id
       WHERE e.componente_id = $1 AND e.devolvido_em IS NULL
       LIMIT 1`,
      [componenteId]
    );

    if (abertoResult.rows[0]) {
      const aberto = abertoResult.rows[0];
      const dataFormatada = formatarDiaMes(aberto.retirado_em);
      await client.query('ROLLBACK');
      return next(
        conflito(
          'COMPONENTE_JA_EMPRESTADO',
          dataFormatada
            ? `Este componente está com ${aberto.usuario_nome} desde ${dataFormatada}.`
            : `Este componente já está emprestado para ${aberto.usuario_nome}.`
        )
      );
    }

    if (componente.status === 'manutencao') {
      await client.query('ROLLBACK');
      return next(
        conflito(
          'COMPONENTE_EM_MANUTENCAO',
          'Este componente está em manutenção e não pode ser emprestado.'
        )
      );
    }

    if (componente.status === 'emprestado') {
      await client.query('ROLLBACK');
      return next(
        conflito('COMPONENTE_JA_EMPRESTADO', 'Este componente já está emprestado.')
      );
    }

    const insertResult = await client.query(
      `INSERT INTO emprestimo (usuario_id, componente_id)
       VALUES ($1, $2)
       RETURNING id`,
      [req.usuario.id, componenteId]
    );

    await client.query(
      "UPDATE componente SET status = 'emprestado' WHERE id = $1",
      [componenteId]
    );

    await client.query('COMMIT');

    const emprestimo = await buscarEmprestimoCompletoPorId(insertResult.rows[0].id);
    return res.status(201).json(emprestimo);
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    if (error && error.code === '23505') {
      return next(
        conflito('COMPONENTE_JA_EMPRESTADO', 'Este componente já possui um empréstimo aberto.')
      );
    }
    if (error && error.code === '23503') {
      return next(naoAutenticado('Usuário da sessão não encontrado. Faça login novamente.'));
    }
    return next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
};

const devolver = async (req, res, next) => {
  const id = parseIntPositivo(req.params.id);
  if (!id) {
    return next(dadosInvalidos('ID do empréstimo inválido.'));
  }

  let client;
  try {
    client = await db.getClient();
    await client.query('BEGIN');

    const empResult = await client.query(
      `SELECT id, usuario_id, componente_id, retirado_em, devolvido_em
       FROM emprestimo
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );
    const emprestimo = empResult.rows[0];

    if (!emprestimo) {
      await client.query('ROLLBACK');
      return next(naoEncontrado('Empréstimo não encontrado.'));
    }

    if (emprestimo.devolvido_em !== null) {
      await client.query('ROLLBACK');
      return next(conflito('JA_DEVOLVIDO', 'Este empréstimo já foi devolvido.'));
    }

    const podeDevolver =
      emprestimo.usuario_id === req.usuario.id || req.usuario.perfil === 'admin';
    if (!podeDevolver) {
      await client.query('ROLLBACK');
      return next(
        semPermissao('Apenas quem retirou o componente ou um administrador pode registrar a devolução.')
      );
    }

    await client.query(
      'UPDATE emprestimo SET devolvido_em = NOW() WHERE id = $1',
      [id]
    );

    await client.query(
      "UPDATE componente SET status = 'disponivel' WHERE id = $1 AND status <> 'manutencao'",
      [emprestimo.componente_id]
    );

    await client.query('COMMIT');

    const atualizado = await buscarEmprestimoCompletoPorId(id);
    return res.status(200).json(atualizado);
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    return next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
};

const meus = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `${SELECT_EMPRESTIMO_COMPLETO}
       WHERE e.usuario_id = $1 AND e.devolvido_em IS NULL
       ORDER BY e.retirado_em DESC, e.id DESC`,
      [req.usuario.id]
    );
    return res.status(200).json(rows.map(mapEmprestimo));
  } catch (error) {
    return next(error);
  }
};

const historico = async (req, res, next) => {
  try {
    const condicoes = [];
    const valores = [];

    if (req.query.componente_id !== undefined && String(req.query.componente_id).trim() !== '') {
      const componenteId = parseIntPositivo(req.query.componente_id);
      if (!componenteId) {
        return next(dadosInvalidos('O filtro componente_id deve ser um inteiro positivo.'));
      }
      valores.push(componenteId);
      condicoes.push(`e.componente_id = $${valores.length}`);
    }

    if (req.query.usuario_id !== undefined && String(req.query.usuario_id).trim() !== '') {
      const usuarioId = parseIntPositivo(req.query.usuario_id);
      if (!usuarioId) {
        return next(dadosInvalidos('O filtro usuario_id deve ser um inteiro positivo.'));
      }
      valores.push(usuarioId);
      condicoes.push(`e.usuario_id = $${valores.length}`);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await db.query(
      `${SELECT_EMPRESTIMO_COMPLETO}
       ${where}
       ORDER BY e.retirado_em DESC, e.id DESC`,
      valores
    );

    return res.status(200).json(rows.map(mapEmprestimo));
  } catch (error) {
    return next(error);
  }
};

const atrasados = async (req, res, next) => {
  try {
    const diasAtraso = parseIntPositivo(process.env.DIAS_ATRASO) || 7;
    const { rows } = await db.query(
      `${SELECT_EMPRESTIMO_COMPLETO}
       WHERE e.devolvido_em IS NULL
         AND e.retirado_em < NOW() - ($1::int * INTERVAL '1 day')
       ORDER BY e.retirado_em ASC, e.id ASC`,
      [diasAtraso]
    );
    return res.status(200).json(rows.map(mapEmprestimo));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  criar,
  devolver,
  meus,
  historico,
  atrasados,
};
