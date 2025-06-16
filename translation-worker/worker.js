require('dotenv').config();
const connectDB = require('./config/database');
const rabbitMQConsumer = require('./config/rabbitmq');
const MessageProcessor = require('./processors/messageProcessor');
const translationService = require('./services/translationService');

class TranslationWorker {
  constructor() {
    this.isRunning = false;
    this.queueName = process.env.QUEUE_NAME || 'translation_queue';
    this.messageProcessor = new MessageProcessor();
  }

  async start() {
    try {
      console.log('Iniciando Translation Worker...');
      
      // Conectar ao banco de dados
      await connectDB();
      
      // Conectar ao RabbitMQ
      await rabbitMQConsumer.connect();
      
      // Verificar configuração da API do Gemini
      await this.checkGeminiConfiguration();
      
      // Exibir estatísticas iniciais
      await this.showStats();
      
      // Marcar como rodando
      this.isRunning = true;
      
      console.log(`Worker iniciado com sucesso. Consumindo fila: ${this.queueName}`);
      console.log('Pressione Ctrl+C para parar o worker');
      
      // Iniciar consumo de mensagens
      await rabbitMQConsumer.startConsuming(this.handleMessage.bind(this));
      
    } catch (error) {
      console.error('Erro ao iniciar worker:', error);
      process.exit(1);
    }
  }

  async checkGeminiConfiguration() {
    try {
      console.log('=== Verificação do Sistema de Tradução ===');
      
      const translationMethod = translationService.getTranslationMethod();
      
      if (translationService.isGeminiConfigured()) {
        console.log('✅ API do Gemini configurada - Método principal');
        
        // Testar conexão com a API
        console.log('🔄 Testando conexão com a API do Gemini...');
        const testResult = await translationService.testConnection();
        
        if (testResult.success) {
          console.log(`✅ ${testResult.message}`);
        } else {
          console.warn(`⚠️  ${testResult.message}`);
        }
      } else {
        console.log('⚠️  API do Gemini não configurada');
        console.log('📖 Usando dicionário mockado como método principal');
        console.log('   Para usar IA, configure a variável GEMINI_API_KEY');
      }
      
      console.log('🔄 Fallback sempre disponível com dicionário mockado');
      
      // Exibir idiomas suportados
      const supportedLanguages = translationService.getSupportedLanguages();
      console.log('📋 Idiomas suportados:', supportedLanguages.map(lang => `${lang.code} (${lang.name})`).join(', '));
      
      // Exibir método atual
      console.log(`🎯 Método atual: ${translationMethod.primary}`);
      if (translationMethod.fallback) {
        console.log(`🛡️  Fallback: ${translationMethod.fallback}`);
      }
      
      console.log('==========================================');
      
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
    }
  }

  async handleMessage(message) {
    try {
      console.log(`Nova mensagem recebida: ${message.requestId}`);
      await this.messageProcessor.handleMessage(message); // Use this.messageProcessor

      // Exibir estatísticas após processamento
      await this.showStats();

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  async showStats() {
    try {
      const stats = await this.messageProcessor.getProcessorStats(); // Use this.messageProcessor
      if (stats) {
        console.log('=== Estatísticas do Worker ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Na fila: ${stats.queued}`);
        console.log(`Processando: ${stats.processing}`);
        console.log(`Concluídas: ${stats.completed}`);
        console.log(`Falharam: ${stats.failed}`);
        console.log('=============================');
      }
    } catch (error) {
      console.error('Erro ao exibir estatísticas:', error);
    }
  }

  async stop() {
    try {
      console.log('Parando Translation Worker...');
      this.isRunning = false;
      
      // Desconectar do RabbitMQ
      await rabbitMQConsumer.disconnect();
      
      console.log('Worker parado com sucesso');
      process.exit(0);
    } catch (error) {
      console.error('Erro ao parar worker:', error);
      process.exit(1);
    }
  }
}

// Criar instância do worker
const worker = new TranslationWorker();

// Handlers para graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, parando worker...');
  await worker.stop();
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido, parando worker...');
  await worker.stop();
});

// Handler para erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Iniciar worker
worker.start().catch((error) => {
  console.error('Erro fatal ao iniciar worker:', error);
  process.exit(1);
});

module.exports = worker;

