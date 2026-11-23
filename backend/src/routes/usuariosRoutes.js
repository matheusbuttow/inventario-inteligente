const express = require('express');
const usuariosController = require('../controllers/usuariosController');
const { autenticar, exigirAdmin } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.use(autenticar, exigirAdmin);

router.get('/', usuariosController.listar);
router.post('/', usuariosController.criar);
router.patch('/:id', usuariosController.atualizar);

module.exports = router;
