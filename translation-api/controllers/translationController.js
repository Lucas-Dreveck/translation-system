const { v4: uuidv4 } = require('uuid');
const Translation = require('../models/Translation');
const rabbitMQPublisher = require('../config/rabbitmq');

class TranslationController {
  // POST /translations - Criar nova solicitação de tradução
  async createTranslation(req, res) {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;

      // Validação dos dados de entrada
      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({
          error: 'Campos obrigatórios: text, sourceLanguage, targetLanguage'
        });
      }

      if (text.trim().length === 0) {
        return res.status(400).json({
          error: 'O texto não pode estar vazio'
        });
      }

      if (text.length > 5000) {
        return res.status(400).json({
          error: 'O texto não pode exceder 5000 caracteres'
        });
      }

      // Gerar requestId único
      const requestId = uuidv4();

      // Criar registro no banco de dados
      const translation = new Translation({
        requestId,
        originalText: text.trim(),
        sourceLanguage: sourceLanguage.toLowerCase(),
        targetLanguage: targetLanguage.toLowerCase(),
        status: 'queued'
      });

      await translation.save();

      // Enviar mensagem para a fila
      const queueMessage = {
        requestId,
        originalText: text.trim(),
        sourceLanguage: sourceLanguage.toLowerCase(),
        targetLanguage: targetLanguage.toLowerCase(),
        timestamp: new Date().toISOString()
      };

      await rabbitMQPublisher.publishMessage(queueMessage);

      // Responder ao cliente
      res.status(202).json({
        requestId,
        status: 'queued',
        message: 'Solicitação de tradução recebida e está sendo processada',
        createdAt: translation.createdAt
      });

    } catch (error) {
      console.error('Erro ao criar tradução:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /translations/:requestId - Consultar status da tradução
  async getTranslationStatus(req, res) {
    try {
      const { requestId } = req.params;

      // Validar formato do UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(requestId)) {
        return res.status(400).json({
          error: 'Formato de requestId inválido'
        });
      }

      // Buscar tradução no banco de dados
      const translation = await Translation.findOne({ requestId });

      if (!translation) {
        return res.status(404).json({
          error: 'Tradução não encontrada'
        });
      }

      // Preparar resposta baseada no status
      const response = {
        requestId: translation.requestId,
        status: translation.status,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        createdAt: translation.createdAt,
        updatedAt: translation.updatedAt
      };

      // Adicionar campos específicos baseados no status
      if (translation.status === 'completed') {
        response.originalText = translation.originalText;
        response.translatedText = translation.translatedText;
      } else if (translation.status === 'failed') {
        response.errorMessage = translation.errorMessage;
      }

      res.json(response);

    } catch (error) {
      console.error('Erro ao consultar tradução:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /translations - Listar todas as traduções (endpoint adicional para debug)
  async getAllTranslations(req, res) {
    try {
      const { status, limit = 10, offset = 0 } = req.query;

      const filter = {};
      if (status) {
        filter.status = status;
      }

      const translations = await Translation.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .select('-__v');

      const total = await Translation.countDocuments(filter);

      res.json({
        translations,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      });

    } catch (error) {
      console.error('Erro ao listar traduções:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new TranslationController();

