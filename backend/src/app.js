const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const corsMiddleware = require('./middlewares/corsMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3000;

app.use(corsMiddleware);
// Fotos chegam em base64 (até 2 MB de imagem ≈ 2,7 MB de texto).
app.use(express.json({ limit: '3mb' }));
app.use('/', routes);

app.use((req, res) => {
  res.status(404).json({
    erro: 'NAO_ENCONTRADO',
    mensagem: 'Rota não encontrada.',
  });
});

app.use(errorMiddleware);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
