const amqp = require('amqplib');

class RabbitMQConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.queueName = process.env.QUEUE_NAME || 'translation_queue';
    this.isConsuming = false;
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
      
      // Configurar prefetch para processar uma mensagem por vez
      await this.channel.prefetch(1);
      
      console.log(`✅ Conectado ao RabbitMQ. Fila: ${this.queueName}`);
      
      // Handlers para reconexão
      this.connection.on('error', (err) => {
        console.error('Erro na conexão RabbitMQ:', err);
        this.isConsuming = false;
      });
      
      this.connection.on('close', () => {
        console.warn('Conexão RabbitMQ fechada');
        this.isConsuming = false;
      });
      
    } catch (error) {
      console.error('Erro ao conectar ao RabbitMQ:', error);
      throw error;
    }
  }

  async startConsuming(messageHandler) {
    try {
      if (!this.channel) {
        throw new Error('Canal RabbitMQ não está conectado');
      }

      if (this.isConsuming) {
        console.warn('Já está consumindo mensagens');
        return;
      }

      console.log(`Iniciando consumo da fila: ${this.queueName}`);
      this.isConsuming = true;

      await this.channel.consume(this.queueName, async (msg) => {
        if (msg !== null) {
          try {
            const messageContent = JSON.parse(msg.content.toString());
            console.log(`Mensagem recebida: ${messageContent.requestId}`);
            
            // Processar mensagem
            await messageHandler(messageContent);
            
            // Confirmar processamento (ACK)
            this.channel.ack(msg);
            console.log(`Mensagem processada e confirmada: ${messageContent.requestId}`);
            
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            
            // Rejeitar mensagem e reenviar para a fila
            this.channel.nack(msg, false, true);
            console.log('Mensagem rejeitada e reenviada para a fila');
          }
        }
      }, {
        noAck: false // Requer confirmação manual
      });

      console.log('Aguardando mensagens...');
      
    } catch (error) {
      console.error('Erro ao iniciar consumo:', error);
      this.isConsuming = false;
      throw error;
    }
  }

  async stopConsuming() {
    try {
      if (this.channel && this.isConsuming) {
        await this.channel.cancel();
        this.isConsuming = false;
        console.log('Parou de consumir mensagens');
      }
    } catch (error) {
      console.error('Erro ao parar consumo:', error);
    }
  }

  async disconnect() {
    try {
      await this.stopConsuming();
      
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

  // Método para purgar a fila (limpar todas as mensagens)
  async purgeQueue() {
    try {
      if (!this.channel) {
        throw new Error('Canal RabbitMQ não está conectado');
      }

      const result = await this.channel.purgeQueue(this.queueName);
      console.log(`Fila purgada. ${result.messageCount} mensagens removidas`);
      return result.messageCount;
    } catch (error) {
      console.error('Erro ao purgar fila:', error);
      throw error;
    }
  }
}

// Criar instância singleton
const rabbitMQConsumer = new RabbitMQConsumer();

module.exports = rabbitMQConsumer;

