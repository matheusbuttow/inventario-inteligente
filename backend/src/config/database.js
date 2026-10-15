const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};