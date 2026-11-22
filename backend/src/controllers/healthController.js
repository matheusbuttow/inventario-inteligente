const db = require('../config/database');

const checkHealth = async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      database: 'Conectado',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Falha ao verificar conexão com o banco de dados:', error);
    return res.status(500).json({
      erro: 'ERRO_INTERNO',
      mensagem: 'Não foi possível conectar ao banco de dados.',
    });
  }
};

module.exports = { checkHealth };
