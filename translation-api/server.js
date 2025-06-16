require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const redisClient = require('./config/redis');

const connectDB = require('./config/database');
const rabbitMQPublisher = require('./config/rabbitmq');
const translationRoutes = require('./routes/translations');
const { errorHandler, validateJSON } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao banco de dados
connectDB();

// Conectar ao Redis
redisClient.connect().catch(console.error);

// Middlewares de segurança
app.use(helmet());

// CORS - permitir todas as origens para desenvolvimento
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.API_RATE_LIMIT || 100, // limite de requests por IP
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para validação de JSON
app.use(validateJSON);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas principais
app.use('/translations', translationRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Tradução - Sistema de Tecnologias Emergentes',
    version: '1.0.0',
    endpoints: {
      'POST /translations': 'Criar nova solicitação de tradução',
      'GET /translations/:requestId': 'Consultar status da tradução',
      'GET /translations': 'Listar todas as traduções',
      'GET /health': 'Verificar saúde da API'
    },
    documentation: 'Consulte o README.md para mais informações'
  });
});

// Middlewares de tratamento de erros (devem vir por último)
app.use(errorHandler);

// Função de inicialização
async function startServer() {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Conectar ao RabbitMQ
    await rabbitMQPublisher.connect();
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  await rabbitMQPublisher.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido, encerrando servidor...');
  await rabbitMQPublisher.disconnect();
  process.exit(0);
});

// Iniciar aplicação
startServer();

module.exports = app;

