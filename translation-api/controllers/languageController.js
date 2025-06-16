const rabbitMQPublisher = require('../config/rabbitmq');

class LanguageController {
  // GET /translations/languages - Obter lista de idiomas suportados
  async getSupportedLanguages(req, res) {
    try {
      // Como não temos comunicação direta com o worker, vamos retornar
      // uma lista baseada na configuração do Gemini
      const geminiConfigured = process.env.GEMINI_API_KEY && 
                              process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

      let languages;
      
      if (geminiConfigured) {
        // Lista completa de idiomas suportados pelo Gemini
        languages = [
          { code: 'en', name: 'Inglês' },
          { code: 'pt', name: 'Português' },
          { code: 'es', name: 'Espanhol' },
          { code: 'fr', name: 'Francês' },
          { code: 'de', name: 'Alemão' },
          { code: 'it', name: 'Italiano' },
          { code: 'ja', name: 'Japonês' },
          { code: 'ko', name: 'Coreano' },
          { code: 'zh', name: 'Chinês' },
          { code: 'ru', name: 'Russo' },
          { code: 'ar', name: 'Árabe' }
        ];
      } else {
        // Lista limitada do dicionário mockado
        languages = [
          { code: 'en', name: 'Inglês' },
          { code: 'pt', name: 'Português' },
          { code: 'es', name: 'Espanhol' }
        ];
      }

      res.json({
        languages,
        method: geminiConfigured ? 'gemini' : 'mock',
        total: languages.length
      });

    } catch (error) {
      console.error('Erro ao obter idiomas suportados:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /translations/language-pairs - Obter pares de idiomas suportados
  async getSupportedLanguagePairs(req, res) {
    try {
      const geminiConfigured = process.env.GEMINI_API_KEY && 
                              process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

      let languagePairs;
      
      if (geminiConfigured) {
        // Com Gemini, qualquer combinação é possível
        languagePairs = [
          { source: 'en', target: 'pt', label: 'Inglês → Português' },
          { source: 'pt', target: 'en', label: 'Português → Inglês' },
          { source: 'en', target: 'es', label: 'Inglês → Espanhol' },
          { source: 'es', target: 'en', label: 'Espanhol → Inglês' },
          { source: 'en', target: 'fr', label: 'Inglês → Francês' },
          { source: 'fr', target: 'en', label: 'Francês → Inglês' },
          { source: 'en', target: 'de', label: 'Inglês → Alemão' },
          { source: 'de', target: 'en', label: 'Alemão → Inglês' },
          { source: 'en', target: 'it', label: 'Inglês → Italiano' },
          { source: 'it', target: 'en', label: 'Italiano → Inglês' },
          { source: 'en', target: 'ja', label: 'Inglês → Japonês' },
          { source: 'ja', target: 'en', label: 'Japonês → Inglês' },
          { source: 'en', target: 'ko', label: 'Inglês → Coreano' },
          { source: 'ko', target: 'en', label: 'Coreano → Inglês' },
          { source: 'en', target: 'zh', label: 'Inglês → Chinês' },
          { source: 'zh', target: 'en', label: 'Chinês → Inglês' },
          { source: 'en', target: 'ru', label: 'Inglês → Russo' },
          { source: 'ru', target: 'en', label: 'Russo → Inglês' },
          { source: 'en', target: 'ar', label: 'Inglês → Árabe' },
          { source: 'ar', target: 'en', label: 'Árabe → Inglês' },
          { source: 'pt', target: 'es', label: 'Português → Espanhol' },
          { source: 'es', target: 'pt', label: 'Espanhol → Português' },
          { source: 'pt', target: 'fr', label: 'Português → Francês' },
          { source: 'fr', target: 'pt', label: 'Francês → Português' },
          { source: 'es', target: 'fr', label: 'Espanhol → Francês' },
          { source: 'fr', target: 'es', label: 'Francês → Espanhol' }
        ];
      } else {
        // Pares limitados do dicionário mockado
        languagePairs = [
          { source: 'en', target: 'pt', label: 'Inglês → Português' },
          { source: 'pt', target: 'en', label: 'Português → Inglês' },
          { source: 'en', target: 'es', label: 'Inglês → Espanhol' },
          { source: 'es', target: 'en', label: 'Espanhol → Inglês' }
        ];
      }

      res.json({
        languagePairs,
        method: geminiConfigured ? 'gemini' : 'mock',
        total: languagePairs.length
      });

    } catch (error) {
      console.error('Erro ao obter pares de idiomas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /translations/translation-method - Obter método de tradução ativo
  async getTranslationMethod(req, res) {
    try {
      const geminiConfigured = process.env.GEMINI_API_KEY && 
                              process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

      res.json({
        method: geminiConfigured ? 'gemini' : 'mock',
        geminiConfigured,
        description: geminiConfigured 
          ? 'Tradução com IA do Google Gemini' 
          : 'Tradução com dicionário mockado',
        capabilities: {
          languages: geminiConfigured ? 11 : 3,
          languagePairs: geminiConfigured ? 26 : 4,
          quality: geminiConfigured ? 'high' : 'basic'
        }
      });

    } catch (error) {
      console.error('Erro ao obter método de tradução:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new LanguageController();

