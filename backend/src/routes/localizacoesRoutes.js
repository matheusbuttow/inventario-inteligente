const express = require('express');
const localizacoesController = require('../controllers/localizacoesController');
const { autenticar, exigirAdmin } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.use(autenticar);

router.get('/', localizacoesController.listar);
router.post('/', exigirAdmin, localizacoesController.criar);

module.exports = router;
