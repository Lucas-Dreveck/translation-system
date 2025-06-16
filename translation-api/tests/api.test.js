const request = require('supertest');
const app = require('../server');
const Translation = require('../models/Translation');
const mongoose = require('mongoose');

// Mock do Redis para testes
jest.mock('../config/redis', () => ({
  connect: jest.fn(),
  publishMessage: jest.fn(),
  disconnect: jest.fn()
}));

describe('Translation API', () => {
  beforeAll(async () => {
    // Conectar ao banco de teste
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/translation_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Limpar e fechar conexão
    await Translation.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpar dados antes de cada teste
    await Translation.deleteMany({});
  });

  describe('GET /', () => {
    it('deve retornar informações da API', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /health', () => {
    it('deve retornar status de saúde da API', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('POST /translations', () => {
    it('deve criar uma nova solicitação de tradução', async () => {
      const translationData = {
        text: 'Hello world',
        sourceLanguage: 'en',
        targetLanguage: 'pt'
      };

      const response = await request(app)
        .post('/translations')
        .send(translationData)
        .expect(202);

      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('status', 'queued');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('createdAt');

      // Verificar se foi salvo no banco
      const translation = await Translation.findOne({ requestId: response.body.requestId });
      expect(translation).toBeTruthy();
      expect(translation.originalText).toBe(translationData.text);
      expect(translation.sourceLanguage).toBe(translationData.sourceLanguage);
      expect(translation.targetLanguage).toBe(translationData.targetLanguage);
    });

    it('deve retornar erro para dados inválidos', async () => {
      const response = await request(app)
        .post('/translations')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para texto vazio', async () => {
      const response = await request(app)
        .post('/translations')
        .send({
          text: '',
          sourceLanguage: 'en',
          targetLanguage: 'pt'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para texto muito longo', async () => {
      const longText = 'a'.repeat(5001);
      
      const response = await request(app)
        .post('/translations')
        .send({
          text: longText,
          sourceLanguage: 'en',
          targetLanguage: 'pt'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /translations/:requestId', () => {
    let translation;

    beforeEach(async () => {
      translation = new Translation({
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        originalText: 'Hello world',
        sourceLanguage: 'en',
        targetLanguage: 'pt',
        status: 'queued'
      });
      await translation.save();
    });

    it('deve retornar status da tradução', async () => {
      const response = await request(app)
        .get(`/translations/${translation.requestId}`)
        .expect(200);

      expect(response.body).toHaveProperty('requestId', translation.requestId);
      expect(response.body).toHaveProperty('status', 'queued');
      expect(response.body).toHaveProperty('sourceLanguage', 'en');
      expect(response.body).toHaveProperty('targetLanguage', 'pt');
    });

    it('deve retornar erro para requestId inválido', async () => {
      const response = await request(app)
        .get('/translations/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para tradução não encontrada', async () => {
      const response = await request(app)
        .get('/translations/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('deve incluir texto traduzido quando status for completed', async () => {
      // Atualizar tradução para completed
      translation.status = 'completed';
      translation.translatedText = 'Olá mundo';
      await translation.save();

      const response = await request(app)
        .get(`/translations/${translation.requestId}`)
        .expect(200);

      expect(response.body).toHaveProperty('originalText', 'Hello world');
      expect(response.body).toHaveProperty('translatedText', 'Olá mundo');
    });

    it('deve incluir mensagem de erro quando status for failed', async () => {
      // Atualizar tradução para failed
      translation.status = 'failed';
      translation.errorMessage = 'Erro de tradução';
      await translation.save();

      const response = await request(app)
        .get(`/translations/${translation.requestId}`)
        .expect(200);

      expect(response.body).toHaveProperty('errorMessage', 'Erro de tradução');
    });
  });

  describe('GET /translations', () => {
    beforeEach(async () => {
      // Criar algumas traduções de teste
      const translations = [
        {
          requestId: '123e4567-e89b-12d3-a456-426614174001',
          originalText: 'Hello',
          sourceLanguage: 'en',
          targetLanguage: 'pt',
          status: 'completed'
        },
        {
          requestId: '123e4567-e89b-12d3-a456-426614174002',
          originalText: 'World',
          sourceLanguage: 'en',
          targetLanguage: 'pt',
          status: 'queued'
        }
      ];

      await Translation.insertMany(translations);
    });

    it('deve listar todas as traduções', async () => {
      const response = await request(app)
        .get('/translations')
        .expect(200);

      expect(response.body).toHaveProperty('translations');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.translations).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      const response = await request(app)
        .get('/translations?status=completed')
        .expect(200);

      expect(response.body.translations).toHaveLength(1);
      expect(response.body.translations[0].status).toBe('completed');
    });

    it('deve respeitar limite e offset', async () => {
      const response = await request(app)
        .get('/translations?limit=1&offset=0')
        .expect(200);

      expect(response.body.translations).toHaveLength(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(0);
    });
  });

  describe('Rate Limiting', () => {
    it('deve aplicar rate limiting após muitas requisições', async () => {
      // Fazer muitas requisições rapidamente
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      
      // Algumas requisições devem ser bloqueadas
      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });
});

