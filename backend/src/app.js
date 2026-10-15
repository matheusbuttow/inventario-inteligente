require('dotenv').config({ path: '../.env' }); 

const express = require('express')
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes); // A rota ficará acessível em /api/health

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});