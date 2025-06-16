const redis = require('redis');

class RedisConsumer {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server recusou a conexão');
            return new Error('Redis server recusou a conexão');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Tempo limite de retry excedido');
            return new Error('Tempo limite de retry excedido');
          }
          if (options.attempt > 10) {
            console.error('Número máximo de tentativas excedido');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      await this.client.connect();

      console.log('Redis conectado com sucesso (Consumer)');

      // Event listeners
      this.client.on('error', (err) => {
        console.error('Erro no Redis:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis conectado (Consumer)');
      });

      this.client.on('disconnect', () => {
        console.log('Redis desconectado (Consumer)');
      });

    } catch (error) {
      console.error('Erro ao conectar ao Redis:', error);
      throw error;
    }
  }

  async consumeMessage(queueName, timeout = 0) {
    try {
      // Usar BRPOP para consumo bloqueante
      const result = await this.client.brPop(
        redis.commandOptions({ isolated: true }),
        queueName,
        timeout
      );

      if (result) {
        const message = JSON.parse(result.element);
        console.log(`Mensagem consumida da fila ${queueName}:`, message);
        return message;
      }

      return null;
    } catch (error) {
      console.error('Erro ao consumir mensagem:', error);
      throw error;
    }
  }

  async startConsuming(queueName, messageHandler) {
    console.log(`Iniciando consumo da fila: ${queueName}`);
    
    while (true) {
      try {
        const message = await this.consumeMessage(queueName, 5); // timeout de 5 segundos
        
        if (message) {
          await messageHandler(message);
        }
      } catch (error) {
        console.error('Erro durante o consumo:', error);
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
      }
      console.log('Redis desconectado (Consumer)');
    } catch (error) {
      console.error('Erro ao desconectar Redis:', error);
    }
  }
}

module.exports = new RedisConsumer();

