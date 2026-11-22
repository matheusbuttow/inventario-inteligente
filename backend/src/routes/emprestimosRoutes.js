const express = require('express');
const emprestimosController = require('../controllers/emprestimosController');
const { autenticar } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.use(autenticar);

router.post('/', emprestimosController.criar);
router.get('/meus', emprestimosController.meus);
router.get('/historico', emprestimosController.historico);
router.get('/atrasados', emprestimosController.atrasados);
router.patch('/:id/devolver', emprestimosController.devolver);

module.exports = router;
