// Setup para testes
require('dotenv').config({ path: '.env.test' });

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/translation_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.QUEUE_NAME = 'translation_queue_test';

// Aumentar timeout para operações de banco
jest.setTimeout(30000);

// Mock console.log para testes mais limpos
global.console = {
  ...console,
  log: jest.fn(),
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

