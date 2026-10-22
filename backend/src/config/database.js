const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};