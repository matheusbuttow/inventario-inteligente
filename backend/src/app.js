const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const jwt = require('jsonwebtoken');
const routes = require('./routes');
const bcrypt = require('bcrypt');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes); // A rota ficará acessível em /api/health

app.post('/login', async (req, res) => {
  try {
    const { matricula, senha } = req.body;

    if (!matricula || !senha) {
      return res.status(400).json({
        erro: 'DADOS_INVALIDOS',
        mensagem: 'Matrícula e senha são obrigatórias.',
      });
    }

    const { rows } = await db.query(
      'SELECT id, matricula, senha_hash FROM usuario WHERE matricula = $1',
      [matricula]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
      return res.status(401).json({
        erro: 'NAO_AUTENTICADO',
        mensagem: 'Matrícula ou senha inválida.',
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está configurado.');
      return res.status(500).json({
        erro: 'ERRO_INTERNO',
        mensagem: 'A autenticação não está configurada no servidor.',
      });
    }

    const token = jwt.sign(
      { id: user.id, matricula: user.matricula },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.json({ token, message: 'Login realizado com sucesso' });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: 'ERRO_INTERNO',
      mensagem: 'Erro interno no servidor.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
