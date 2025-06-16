const axios = require('axios');

class HybridTranslationService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // Dicionário mockado para fallback
    this.mockDictionary = {
      'en-pt': {
        'hello': 'olá',
        'world': 'mundo',
        'good': 'bom',
        'morning': 'manhã',
        'afternoon': 'tarde',
        'evening': 'noite',
        'night': 'noite',
        'thank': 'obrigado',
        'you': 'você',
        'please': 'por favor',
        'yes': 'sim',
        'no': 'não',
        'water': 'água',
        'food': 'comida',
        'house': 'casa',
        'car': 'carro',
        'book': 'livro',
        'computer': 'computador',
        'phone': 'telefone',
        'love': 'amor',
        'friend': 'amigo',
        'family': 'família',
        'work': 'trabalho',
        'school': 'escola',
        'university': 'universidade',
        'student': 'estudante',
        'teacher': 'professor',
        'doctor': 'médico',
        'hospital': 'hospital',
        'restaurant': 'restaurante',
        'hotel': 'hotel',
        'airport': 'aeroporto',
        'train': 'trem',
        'bus': 'ônibus',
        'time': 'tempo',
        'money': 'dinheiro',
        'happy': 'feliz',
        'sad': 'triste',
        'beautiful': 'bonito',
        'ugly': 'feio',
        'big': 'grande',
        'small': 'pequeno',
        'hot': 'quente',
        'cold': 'frio',
        'new': 'novo',
        'old': 'velho',
        'how are you': 'como você está',
        'good morning': 'bom dia',
        'good afternoon': 'boa tarde',
        'good evening': 'boa noite',
        'thank you': 'obrigado',
        'excuse me': 'com licença',
        'i love you': 'eu te amo'
      },
      'pt-en': {
        'olá': 'hello',
        'mundo': 'world',
        'bom': 'good',
        'manhã': 'morning',
        'tarde': 'afternoon',
        'noite': 'night',
        'obrigado': 'thank you',
        'você': 'you',
        'por favor': 'please',
        'sim': 'yes',
        'não': 'no',
        'água': 'water',
        'comida': 'food',
        'casa': 'house',
        'carro': 'car',
        'livro': 'book',
        'computador': 'computer',
        'telefone': 'phone',
        'amor': 'love',
        'amigo': 'friend',
        'família': 'family',
        'trabalho': 'work',
        'escola': 'school',
        'universidade': 'university',
        'estudante': 'student',
        'professor': 'teacher',
        'médico': 'doctor',
        'hospital': 'hospital',
        'restaurante': 'restaurant',
        'hotel': 'hotel',
        'aeroporto': 'airport',
        'trem': 'train',
        'ônibus': 'bus',
        'tempo': 'time',
        'dinheiro': 'money',
        'feliz': 'happy',
        'triste': 'sad',
        'bonito': 'beautiful',
        'feio': 'ugly',
        'grande': 'big',
        'pequeno': 'small',
        'quente': 'hot',
        'frio': 'cold',
        'novo': 'new',
        'velho': 'old',
        'como você está': 'how are you',
        'bom dia': 'good morning',
        'boa tarde': 'good afternoon',
        'boa noite': 'good evening',
        'com licença': 'excuse me',
        'eu te amo': 'i love you'
      },
      'en-es': {
        'hello': 'hola',
        'world': 'mundo',
        'good': 'bueno',
        'morning': 'mañana',
        'afternoon': 'tarde',
        'evening': 'noche',
        'thank': 'gracias',
        'you': 'tú',
        'please': 'por favor',
        'yes': 'sí',
        'no': 'no',
        'water': 'agua',
        'food': 'comida',
        'house': 'casa',
        'car': 'coche',
        'book': 'libro',
        'computer': 'computadora',
        'phone': 'teléfono',
        'love': 'amor',
        'friend': 'amigo',
        'family': 'familia',
        'work': 'trabajo',
        'school': 'escuela',
        'student': 'estudiante',
        'teacher': 'profesor',
        'doctor': 'doctor',
        'hospital': 'hospital',
        'restaurant': 'restaurante',
        'hotel': 'hotel',
        'airport': 'aeropuerto',
        'time': 'tiempo',
        'money': 'dinero',
        'happy': 'feliz',
        'beautiful': 'hermoso',
        'big': 'grande',
        'small': 'pequeño',
        'new': 'nuevo',
        'old': 'viejo',
        'good morning': 'buenos días',
        'good afternoon': 'buenas tardes',
        'good evening': 'buenas noches',
        'thank you': 'gracias',
        'excuse me': 'disculpe'
      },
      'es-en': {
        'hola': 'hello',
        'mundo': 'world',
        'bueno': 'good',
        'mañana': 'morning',
        'tarde': 'afternoon',
        'noche': 'night',
        'gracias': 'thank you',
        'tú': 'you',
        'por favor': 'please',
        'sí': 'yes',
        'no': 'no',
        'agua': 'water',
        'comida': 'food',
        'casa': 'house',
        'coche': 'car',
        'libro': 'book',
        'computadora': 'computer',
        'teléfono': 'phone',
        'amor': 'love',
        'amigo': 'friend',
        'familia': 'family',
        'trabajo': 'work',
        'escuela': 'school',
        'estudiante': 'student',
        'profesor': 'teacher',
        'doctor': 'doctor',
        'hospital': 'hospital',
        'restaurante': 'restaurant',
        'hotel': 'hotel',
        'aeropuerto': 'airport',
        'tiempo': 'time',
        'dinero': 'money',
        'feliz': 'happy',
        'hermoso': 'beautiful',
        'grande': 'big',
        'pequeño': 'small',
        'nuevo': 'new',
        'viejo': 'old',
        'buenos días': 'good morning',
        'buenas tardes': 'good afternoon',
        'buenas noches': 'good evening',
        'disculpe': 'excuse me'
      }
    };
  }

  async translateText(text, sourceLanguage, targetLanguage) {
    // Tentar primeiro com a API do Gemini se estiver configurada
    if (this.isGeminiConfigured()) {
      console.log(`Tentando tradução com Gemini: ${sourceLanguage} → ${targetLanguage}`);
      const geminiResult = await this.translateWithGemini(text, sourceLanguage, targetLanguage);
      
      if (geminiResult.success) {
        return geminiResult;
      } else {
        console.warn(`Falha no Gemini, usando fallback mockado: ${geminiResult.error}`);
      }
    }

    // Fallback para dicionário mockado
    console.log(`Usando tradução mockada: ${sourceLanguage} → ${targetLanguage}`);
    return await this.translateWithMock(text, sourceLanguage, targetLanguage);
  }

  async translateWithGemini(text, sourceLanguage, targetLanguage) {
    try {
      // Mapear códigos de idioma para nomes completos
      const languageNames = {
        'en': 'English',
        'pt': 'Portuguese',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ru': 'Russian',
        'ar': 'Arabic'
      };

      const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      // Construir prompt para o Gemini
      const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
Return only the translated text, without any explanations or additional content.

Text to translate: "${text}"

Translation:`;

      // Fazer requisição para a API do Gemini
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 segundos de timeout
        }
      );

      // Extrair texto traduzido da resposta
      if (response.data && 
          response.data.candidates && 
          response.data.candidates.length > 0 && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts && 
          response.data.candidates[0].content.parts.length > 0) {
        
        const translatedText = response.data.candidates[0].content.parts[0].text.trim();
        
        // Remover aspas se estiverem presentes no início e fim
        const cleanedText = translatedText.replace(/^["']|["']$/g, '');
        
        return {
          success: true,
          translatedText: cleanedText,
          sourceLanguage,
          targetLanguage,
          method: 'gemini_ai',
          model: 'gemini-2.0-flash'
        };
      } else {
        throw new Error('Resposta inválida da API do Gemini');
      }

    } catch (error) {
      console.error('Erro na tradução com Gemini:', error);
      
      let errorMessage = 'Erro desconhecido na tradução';
      
      if (error.response) {
        // Erro da API do Gemini
        if (error.response.status === 400) {
          errorMessage = 'Requisição inválida para a API do Gemini';
        } else if (error.response.status === 401) {
          errorMessage = 'Chave da API do Gemini inválida ou expirada';
        } else if (error.response.status === 403) {
          errorMessage = 'Acesso negado à API do Gemini';
        } else if (error.response.status === 429) {
          errorMessage = 'Limite de requisições da API do Gemini excedido';
        } else if (error.response.status >= 500) {
          errorMessage = 'Erro interno da API do Gemini';
        } else {
          errorMessage = `Erro da API do Gemini: ${error.response.status}`;
        }
      } else if (error.request) {
        // Erro de rede
        errorMessage = 'Erro de conexão com a API do Gemini';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        sourceLanguage,
        targetLanguage
      };
    }
  }

  async translateWithMock(text, sourceLanguage, targetLanguage) {
    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const languagePair = `${sourceLanguage}-${targetLanguage}`;
      const dictionary = this.mockDictionary[languagePair];

      if (!dictionary) {
        throw new Error(`Par de idiomas não suportado no modo mockado: ${languagePair}`);
      }

      // Tradução palavra por palavra e frase por frase (melhorada)
      let translatedText = text.toLowerCase();
      
      // Primeiro, tentar traduzir frases completas
      for (const [original, translation] of Object.entries(dictionary)) {
        if (original.includes(' ')) { // É uma frase
          const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          translatedText = translatedText.replace(regex, translation);
        }
      }
      
      // Depois, traduzir palavras individuais
      const words = translatedText.split(/(\s+|[^\w\s])/);
      const translatedWords = words.map(word => {
        if (/^\s*$/.test(word) || /^[^\w\s]$/.test(word)) {
          return word; // Manter espaços e pontuação
        }
        
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        const translation = dictionary[cleanWord];
        
        if (translation) {
          return word.replace(cleanWord, translation);
        } else {
          return word; // Manter palavra original se não encontrar tradução
        }
      });

      const finalTranslation = translatedWords.join('');
      
      // Capitalizar primeira letra
      const capitalizedTranslation = finalTranslation.charAt(0).toUpperCase() + finalTranslation.slice(1);

      return {
        success: true,
        translatedText: capitalizedTranslation,
        sourceLanguage,
        targetLanguage,
        method: 'mock_dictionary',
        note: 'Tradução realizada com dicionário mockado (fallback)'
      };

    } catch (error) {
      console.error('Erro na tradução mockada:', error);
      return {
        success: false,
        error: error.message,
        sourceLanguage,
        targetLanguage
      };
    }
  }

  // Método para verificar se a API do Gemini está configurada
  isGeminiConfigured() {
    return !!this.apiKey && this.apiKey !== 'your_gemini_api_key_here';
  }

  // Método para verificar se está configurado (qualquer método)
  isConfigured() {
    return true; // Sempre configurado pois tem fallback
  }

  // Método para testar a conexão com a API
  async testConnection() {
    try {
      if (!this.isGeminiConfigured()) {
        return {
          success: true,
          message: 'Sistema configurado com dicionário mockado (Gemini não configurado)',
          method: 'mock_dictionary'
        };
      }

      const testResult = await this.translateWithGemini('Hello', 'en', 'pt');
      
      if (testResult.success) {
        return {
          success: true,
          message: 'Conexão com API do Gemini OK',
          method: 'gemini_ai'
        };
      } else {
        return {
          success: true,
          message: `Gemini falhou, usando fallback mockado: ${testResult.error}`,
          method: 'mock_dictionary'
        };
      }
    } catch (error) {
      return {
        success: true,
        message: `Erro no Gemini, usando fallback mockado: ${error.message}`,
        method: 'mock_dictionary'
      };
    }
  }

  // Método para obter idiomas suportados
  getSupportedLanguages() {
    if (this.isGeminiConfigured()) {
      // Idiomas suportados pelo Gemini
      return [
        { code: 'en', name: 'English' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ar', name: 'Arabic' }
      ];
    } else {
      // Idiomas suportados pelo dicionário mockado
      return [
        { code: 'en', name: 'English' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'es', name: 'Spanish' }
      ];
    }
  }

  // Método para verificar se um par de idiomas é suportado
  isLanguagePairSupported(sourceLanguage, targetLanguage) {
    if (this.isGeminiConfigured()) {
      // Com Gemini, suporta qualquer combinação dos idiomas listados
      const supportedCodes = this.getSupportedLanguages().map(lang => lang.code);
      return supportedCodes.includes(sourceLanguage) && supportedCodes.includes(targetLanguage);
    } else {
      // Com mock, apenas pares específicos
      const languagePair = `${sourceLanguage}-${targetLanguage}`;
      return this.mockDictionary.hasOwnProperty(languagePair);
    }
  }

  // Método para obter pares de idiomas suportados (para o frontend)
  getSupportedLanguagePairs() {
    if (this.isGeminiConfigured()) {
      // Com Gemini, gerar todas as combinações possíveis
      const languages = this.getSupportedLanguages();
      const pairs = [];
      
      for (const source of languages) {
        for (const target of languages) {
          if (source.code !== target.code) {
            pairs.push({
              source: source.code,
              target: target.code,
              label: `${source.name} → ${target.name}`
            });
          }
        }
      }
      
      return pairs;
    } else {
      // Com mock, apenas pares específicos
      return [
        { source: 'en', target: 'pt', label: 'English → Portuguese' },
        { source: 'pt', target: 'en', label: 'Portuguese → English' },
        { source: 'en', target: 'es', label: 'English → Spanish' },
        { source: 'es', target: 'en', label: 'Spanish → English' }
      ];
    }
  }

  // Método para obter estatísticas de uso
  getUsageStats() {
    return {
      totalTranslations: 0,
      successfulTranslations: 0,
      failedTranslations: 0,
      averageResponseTime: 0,
      geminiConfigured: this.isGeminiConfigured(),
      fallbackAvailable: true
    };
  }

  // Método para obter informações sobre o método de tradução atual
  getTranslationMethod() {
    return {
      primary: this.isGeminiConfigured() ? 'gemini_ai' : 'mock_dictionary',
      fallback: this.isGeminiConfigured() ? 'mock_dictionary' : null,
      geminiConfigured: this.isGeminiConfigured()
    };
  }
}

module.exports = new HybridTranslationService();

