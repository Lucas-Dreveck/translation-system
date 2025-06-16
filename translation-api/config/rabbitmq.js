const amqp = require('amqplib');

class RabbitMQPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.queueName = process.env.QUEUE_NAME || 'translation_queue';
  }

  async connect() {
    try {
      console.log('Conectando ao RabbitMQ...');
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Declarar a fila (cria se não existir)
      await this.channel.assertQueue(this.queueName, {
        durable: true // Fila persistente
      });
      
      console.log(`✅ Conectado ao RabbitMQ. Fila: ${this.queueName}`);
      
      // Handlers para reconexão
      this.connection.on('error', (err) => {
        console.error('Erro na conexão RabbitMQ:', err);
      });
      
      this.connection.on('close', () => {
        console.warn('Conexão RabbitMQ fechada');
      });
      
    } catch (error) {
      console.error('Erro ao conectar ao RabbitMQ:', error);
      throw error;
    }
  }

  async publishMessage(message) {
    try {
      if (!this.channel) {
        throw new Error('Canal RabbitMQ não está conectado');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const sent = this.channel.sendToQueue(this.queueName, messageBuffer, {
        persistent: true // Mensagem persistente
      });

      if (sent) {
        console.log(`Mensagem enviada para fila: ${message.requestId}`);
        return true;
      } else {
        console.warn('Fila cheia, mensagem não enviada');
        return false;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('Desconectado do RabbitMQ');
    } catch (error) {
      console.error('Erro ao desconectar do RabbitMQ:', error);
    }
  }

  // Método para verificar se está conectado
  isConnected() {
    return this.connection && !this.connection.connection.destroyed && this.channel;
  }

  // Método para obter estatísticas da fila
  async getQueueStats() {
    try {
      if (!this.channel) {
        throw new Error('Canal RabbitMQ não está conectado');
      }

      const queueInfo = await this.channel.checkQueue(this.queueName);
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas da fila:', error);
      return null;
    }
  }
}

// Criar instância singleton
const rabbitMQPublisher = new RabbitMQPublisher();

module.exports = rabbitMQPublisher;

