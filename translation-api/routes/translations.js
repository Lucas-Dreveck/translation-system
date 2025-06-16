const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');
const languageController = require('../controllers/languageController');

// GET /translations/languages - Obter idiomas suportados
router.get('/languages', languageController.getSupportedLanguages);

// GET /translations/language-pairs - Obter pares de idiomas suportados
router.get('/language-pairs', languageController.getSupportedLanguagePairs);

// GET /translations/method - Obter método de tradução ativo
router.get('/method', languageController.getTranslationMethod);

// POST /translations - Criar nova solicitação de tradução
router.post('/', translationController.createTranslation);

// GET /translations/:requestId - Consultar status da tradução
router.get('/:requestId', translationController.getTranslationStatus);

// GET /translations - Listar todas as traduções (endpoint adicional)
router.get('/', translationController.getAllTranslations);

module.exports = router;

