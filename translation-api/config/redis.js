const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.publisher = null;
  }

  async connect() {
    try {
      // Cliente principal
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

      // Cliente para publicação
      this.publisher = this.client.duplicate();

      await this.client.connect();
      await this.publisher.connect();

      console.log('Redis conectado com sucesso');

      // Event listeners
      this.client.on('error', (err) => {
        console.error('Erro no Redis:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis conectado');
      });

      this.client.on('disconnect', () => {
        console.log('Redis desconectado');
      });

    } catch (error) {
      console.error('Erro ao conectar ao Redis:', error);
      throw error;
    }
  }

  async publishMessage(queueName, message) {
    try {
      const messageString = JSON.stringify(message);
      await this.publisher.lPush(queueName, messageString);
      console.log(`Mensagem publicada na fila ${queueName}:`, message);
    } catch (error) {
      console.error('Erro ao publicar mensagem:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
      }
      if (this.publisher) {
        await this.publisher.disconnect();
      }
      console.log('Redis desconectado');
    } catch (error) {
      console.error('Erro ao desconectar Redis:', error);
    }
  }
}

module.exports = new RedisClient();

