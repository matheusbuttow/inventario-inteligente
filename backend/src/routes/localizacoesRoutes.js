const express = require('express');
const localizacoesController = require('../controllers/localizacoesController');
const { autenticar, exigirAdmin } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.use(autenticar);

router.get('/', localizacoesController.listar);
router.post('/', exigirAdmin, localizacoesController.criar);
router.put('/:id', exigirAdmin, localizacoesController.atualizar);
router.delete('/:id', exigirAdmin, localizacoesController.remover);

module.exports = router;
