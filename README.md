# Sistema de Tradução de Textos

Sistema de tradução assíncrona desenvolvido para a disciplina de Tecnologias Emergentes do curso de Análise e Desenvolvimento de Sistemas (5º período).

## Visão Geral

Este projeto implementa um sistema de tradução de textos composto por dois serviços que se comunicam de forma assíncrona através de uma fila de mensagens:

1. **translation-api**: API REST que recebe solicitações de tradução
2. **translation-worker**: Serviço consumidor que processa as traduções

## Arquitetura

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Cliente   │───▶│     API     │───▶│    Redis    │───▶│   Worker    │
│             │    │   (REST)    │    │   (Fila)    │    │ (Consumidor)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                                      │
                           ▼                                      ▼
                   ┌─────────────┐                        ┌─────────────┐
                   │   MongoDB   │◀───────────────────────│   MongoDB   │
                   │ (Persistência)                       │ (Atualização)│
                   └─────────────┘                        └─────────────┘
```

### Fluxo de Funcionamento

1. Cliente envia texto para tradução via POST `/translations`
2. API gera UUID único e salva solicitação no MongoDB
3. Mensagem é enviada para fila Redis
4. API responde imediatamente com requestId e status "queued"
5. Worker consome mensagem da fila
6. Worker atualiza status para "processing"
7. Worker realiza tradução (usando API do Gemini ou dicionário mockado como fallback)
8. Worker atualiza status para "completed" ou "failed"
9. Cliente consulta resultado via GET `/translations/:requestId`

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web para API REST
- **React** - Framework frontend
- **MongoDB** - Banco de dados NoSQL
- **RabbitMQ** - Sistema de mensageria (broker de filas)
- **Redis** - Cache e armazenamento em memória (opcional)
- **Docker** - Containerização
- **Jest** - Framework de testes
- **Google Gemini AI** - API de tradução com IA

## Sistema de Tradução Híbrido

Este sistema implementa uma abordagem híbrida para tradução:

### 🤖 **Modo Primário: Google Gemini AI**
- Tradução com inteligência artificial de alta qualidade
- Suporte a 11+ idiomas
- Requer chave de API (gratuita)

### 📖 **Modo Fallback: Dicionário Mockado**
- Funciona sem configuração externa
- Suporte a pares básicos: EN↔PT, EN↔ES
- Tradução palavra-por-palavra para demonstração

### 🔄 **Funcionamento Automático**
1. **Com Gemini configurado**: Usa IA primeiro, fallback se falhar
2. **Sem Gemini**: Usa dicionário mockado diretamente
3. **Sistema sempre funcional**: Nunca falha por falta de configuração

## Configuração da API do Gemini (Opcional)

Para habilitar traduções com IA:

1. **Obter chave da API**:
   - Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crie uma nova chave de API (gratuita)
   - Copie a chave gerada

2. **Configurar no projeto**:
   ```bash
   # No arquivo translation-worker/.env
   GEMINI_API_KEY=sua_chave_aqui
   
   # Para Docker Compose, crie docker/.env
   GEMINI_API_KEY=sua_chave_aqui
   ```

3. **Verificar configuração**:
   - O worker exibirá o método ativo ao iniciar
   - Teste de conexão é realizado automaticamente

**Nota**: O sistema funciona perfeitamente sem a chave do Gemini, usando o dicionário mockado.

## Novas Funcionalidades

### 🐰 **RabbitMQ como Sistema de Mensageria**
- Substituiu o Redis como broker de mensagens
- Maior confiabilidade e recursos avançados
- Interface de gerenciamento web em http://localhost:15672
- Filas persistentes e confirmação de mensagens (ACK)
- Reconexão automática em caso de falhas

### 🌐 **Lista de Idiomas Dinâmica**
- Frontend carrega idiomas automaticamente da API
- Adapta-se ao método de tradução ativo (Gemini/Mock)
- Novos endpoints:
  - `GET /translations/languages` - Lista de idiomas suportados
  - `GET /translations/language-pairs` - Pares de idiomas disponíveis
  - `GET /translations/method` - Método de tradução ativo
- Interface mostra status do sistema (IA Gemini ou Mock)
- Botão de recarregar idiomas em tempo real

## Pré-requisitos

- Node.js 18+ 
- Docker e Docker Compose
- Git

## Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd translation-system
```

### 2. Instalar Dependências

```bash
# API
cd translation-api
npm install

# Worker
cd ../translation-worker
npm install

# Frontend
cd ../translation-frontend
npm install
```

### 3. Configurar Banco de Dados e Redis

```bash
# Subir MongoDB e Redis com Docker
cd docker
docker-compose up -d mongodb redis

# Verificar se os serviços estão rodando
docker-compose ps
```

### 4. Configurar Variáveis de Ambiente

Os arquivos `.env` já estão configurados com valores padrão. Para produção, ajuste conforme necessário:

**translation-api/.env:**
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://translation_user:translation_pass@localhost:27017/translation_db
RABBITMQ_URL=amqp://localhost:5672
QUEUE_NAME=translation_queue
API_RATE_LIMIT=100
```

**translation-worker/.env:**
```env
NODE_ENV=development
MONGODB_URI=mongodb://translation_user:translation_pass@localhost:27017/translation_db
RABBITMQ_URL=amqp://localhost:5672
QUEUE_NAME=translation_queue
POLL_INTERVAL=1000
GEMINI_API_KEY=your_gemini_api_key_here
```

**docker/.env (opcional - para usar Gemini com Docker):**
```env
GEMINI_API_KEY=sua_chave_aqui
```

## Execução

### Opção 1: Modo Desenvolvimento (Recomendado)

Abra **3 terminais** e execute os comandos em cada um:

**Terminal 1 - API:**
```bash
cd translation-api
npm run dev
```

**Terminal 2 - Worker:**
```bash
cd translation-worker
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd translation-frontend
npm run dev
```

### Opção 2: Modo Produção

**Terminal 1 - API:**
```bash
cd translation-api
npm start
```

**Terminal 2 - Worker:**
```bash
cd translation-worker
npm start
```

**Terminal 3 - Frontend:**
```bash
cd translation-frontend
npm run build
npm run preview
```

### Opção 3: Docker Compose (Tudo junto)

```bash
# Subir todos os serviços
cd docker
docker-compose up --build

# Para rodar em background
docker-compose up -d --build

# Para parar todos os serviços
docker-compose down
```

### URLs de Acesso

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **Documentação da API**: http://localhost:3000
## Uso da API

### Criar Tradução

```bash
curl -X POST http://localhost:3000/translations \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "sourceLanguage": "en",
    "targetLanguage": "pt"
  }'
```

**Resposta:**
```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "queued",
  "message": "Solicitação de tradução recebida e está sendo processada",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Consultar Status

```bash
curl http://localhost:3000/translations/123e4567-e89b-12d3-a456-426614174000
```

**Resposta (tradução concluída):**
```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "sourceLanguage": "en",
  "targetLanguage": "pt",
  "originalText": "Hello world",
  "translatedText": "Olá mundo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:15.000Z"
}
```

## Idiomas Suportados

### 🤖 **Com Gemini AI (Recomendado)**
O sistema suporta tradução entre os seguintes idiomas:

- **Inglês** (en) - **Português** (pt) - **Espanhol** (es)
- **Francês** (fr) - **Alemão** (de) - **Italiano** (it)
- **Japonês** (ja) - **Coreano** (ko) - **Chinês** (zh)
- **Russo** (ru) - **Árabe** (ar)

**Qualquer combinação entre estes idiomas é suportada.**

### 📖 **Com Dicionário Mockado (Fallback)**
Pares básicos para demonstração:

- **Inglês ↔ Português** (en-pt, pt-en)
- **Inglês ↔ Espanhol** (en-es, es-en)

**Nota**: Configure a API do Gemini para acesso completo a todos os idiomas.

## Testes

### Executar Testes da API

```bash
cd translation-api
npm test
```

### Executar Testes com Coverage

```bash
cd translation-api
npm test -- --coverage
```

### Teste Manual da API

**1. Criar uma tradução:**
```bash
curl -X POST http://localhost:3000/translations ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Hello world\", \"sourceLanguage\": \"en\", \"targetLanguage\": \"pt\"}"
```

**2. Consultar status (substitua o requestId retornado):**
```bash
curl http://localhost:3000/translations/SEU_REQUEST_ID_AQUI
```

**3. Verificar saúde da API:**
```bash
curl http://localhost:3000/health
```

**Nota para Windows**: Use `^` para quebra de linha no cmd, ou execute em uma linha só.

## Status de Tradução

- **queued**: Aguardando na fila
- **processing**: Sendo traduzida
- **completed**: Tradução concluída
- **failed**: Falha no processamento

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/translations` | Criar nova tradução |
| GET | `/translations/:requestId` | Consultar status |
| GET | `/translations` | Listar traduções |
| GET | `/health` | Status da API |
| GET | `/` | Informações da API |

## Estrutura do Projeto

```
translation-system/
├── translation-api/          # API REST
│   ├── config/               # Configurações
│   ├── controllers/          # Controladores
│   ├── middleware/           # Middlewares
│   ├── models/               # Modelos de dados
│   ├── routes/               # Rotas
│   ├── tests/                # Testes
│   ├── .env                  # Variáveis de ambiente
│   ├── package.json          # Dependências
│   └── server.js             # Servidor principal
├── translation-worker/       # Serviço Worker
│   ├── config/               # Configurações
│   ├── models/               # Modelos de dados
│   ├── processors/           # Processadores
│   ├── services/             # Serviços
│   ├── .env                  # Variáveis de ambiente
│   ├── package.json          # Dependências
│   └── worker.js             # Worker principal
├── docker/                   # Configuração Docker
│   ├── docker-compose.yml    # Serviços (MongoDB, Redis)
│   └── init-mongo.js         # Script de inicialização
├── API_DOCUMENTATION.md      # Documentação da API
└── README.md                 # Este arquivo
```