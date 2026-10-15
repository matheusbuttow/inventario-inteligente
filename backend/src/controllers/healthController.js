const db = require('../config/database');

const checkHealth = async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      status: 'OK',
      database: 'Conectado',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Desconectado',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = { checkHealth };