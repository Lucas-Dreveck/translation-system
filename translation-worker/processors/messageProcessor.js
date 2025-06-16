const Translation = require('../models/Translation');
const translationService = require('../services/translationService');

class MessageProcessor {
  constructor() {
    this.isProcessing = false;
  }

  async processMessage(message) {
    const { requestId, originalText, sourceLanguage, targetLanguage } = message;
    
    console.log(`Processando tradução: ${requestId}`);
    
    try {
      // Marcar como "processing"
      await this.updateTranslationStatus(requestId, 'processing');

      // Verificar se o par de idiomas é suportado
      if (!translationService.isLanguagePairSupported(sourceLanguage, targetLanguage)) {
        throw new Error(`Par de idiomas não suportado: ${sourceLanguage}-${targetLanguage}`);
      }

      // Realizar a tradução (tentará Gemini primeiro, depois fallback para mock)
      const translationResult = await translationService.translateText(
        originalText,
        sourceLanguage,
        targetLanguage
      );

      if (translationResult.success) {
        // Atualizar com tradução completa
        await this.updateTranslationComplete(
          requestId,
          translationResult.translatedText
        );
        
        console.log(`Tradução concluída com sucesso: ${requestId} (método: ${translationResult.method})`);
        if (translationResult.note) {
          console.log(`Nota: ${translationResult.note}`);
        }
      } else {
        // Marcar como falha
        await this.updateTranslationFailed(
          requestId,
          translationResult.error || 'Erro desconhecido na tradução'
        );
        
        console.error(`Tradução falhou: ${requestId} - ${translationResult.error}`);
      }

    } catch (error) {
      console.error(`Erro ao processar mensagem ${requestId}:`, error);
      
      // Marcar como falha
      await this.updateTranslationFailed(
        requestId,
        error.message || 'Erro interno do processador'
      );
    }
  }

  async updateTranslationStatus(requestId, status) {
    try {
      const result = await Translation.findOneAndUpdate(
        { requestId },
        { 
          status,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!result) {
        throw new Error(`Tradução não encontrada: ${requestId}`);
      }

      console.log(`Status atualizado para ${status}: ${requestId}`);
      return result;
    } catch (error) {
      console.error(`Erro ao atualizar status: ${requestId}`, error);
      throw error;
    }
  }

  async updateTranslationComplete(requestId, translatedText) {
    try {
      const result = await Translation.findOneAndUpdate(
        { requestId },
        { 
          status: 'completed',
          translatedText,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!result) {
        throw new Error(`Tradução não encontrada: ${requestId}`);
      }

      console.log(`Tradução concluída: ${requestId}`);
      return result;
    } catch (error) {
      console.error(`Erro ao marcar tradução como concluída: ${requestId}`, error);
      throw error;
    }
  }

  async updateTranslationFailed(requestId, errorMessage) {
    try {
      const result = await Translation.findOneAndUpdate(
        { requestId },
        { 
          status: 'failed',
          errorMessage,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!result) {
        throw new Error(`Tradução não encontrada: ${requestId}`);
      }

      console.log(`Tradução marcada como falha: ${requestId}`);
      return result;
    } catch (error) {
      console.error(`Erro ao marcar tradução como falha: ${requestId}`, error);
      throw error;
    }
  }

  // Método para validar mensagem
  validateMessage(message) {
    const requiredFields = ['requestId', 'originalText', 'sourceLanguage', 'targetLanguage'];
    
    for (const field of requiredFields) {
      if (!message[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }

    // Validar formato do requestId (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(message.requestId)) {
      throw new Error('Formato de requestId inválido');
    }

    // Validar tamanho do texto
    if (message.originalText.length > 5000) {
      throw new Error('Texto muito longo para tradução');
    }

    return true;
  }

  // Método principal para processar mensagens com validação
  async handleMessage(message) {
    try {
      // Validar mensagem
      this.validateMessage(message);
      
      // Processar mensagem
      await this.processMessage(message);
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Se temos um requestId válido, marcar como falha
      if (message && message.requestId) {
        try {
          await this.updateTranslationFailed(message.requestId, error.message);
        } catch (updateError) {
          console.error('Erro ao atualizar status de falha:', updateError);
        }
      }
    }
  }

  // Método para obter estatísticas do processador
  async getProcessorStats() {
    try {
      const stats = await Translation.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      return result;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

module.exports = MessageProcessor;

