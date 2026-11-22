const express = require('express');
const authController = require('../controllers/authController');
const { autenticar } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.get('/eu', autenticar, authController.eu);

module.exports = router;
