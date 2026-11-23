const express = require('express');
const healthController = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const localizacoesRoutes = require('./localizacoesRoutes');
const componentesRoutes = require('./componentesRoutes');
const emprestimosRoutes = require('./emprestimosRoutes');
const usuariosRoutes = require('./usuariosRoutes');

const router = express.Router();

router.get('/health', healthController.checkHealth);
router.use('/auth', authRoutes);
router.use('/localizacoes', localizacoesRoutes);
router.use('/componentes', componentesRoutes);
router.use('/emprestimos', emprestimosRoutes);
router.use('/usuarios', usuariosRoutes);

module.exports = router;
