const express = require('express');
const componentesController = require('../controllers/componentesController');
const { autenticar, exigirAdmin } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.get('/:id/foto', componentesController.obterFoto);

router.use(autenticar);

router.get('/', componentesController.listar);
router.get('/qr/:codigo', componentesController.buscarPorQr);
router.get('/:id', componentesController.buscarPorId);
router.post('/', exigirAdmin, componentesController.criar);
router.put('/:id', exigirAdmin, componentesController.atualizar);
router.delete('/:id', exigirAdmin, componentesController.remover);
router.put('/:id/foto', exigirAdmin, componentesController.salvarFoto);
router.delete('/:id/foto', exigirAdmin, componentesController.removerFoto);

module.exports = router;
