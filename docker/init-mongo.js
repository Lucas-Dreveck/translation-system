// Script de inicialização do MongoDB
db = db.getSiblingDB('translation_db');

// Criar usuário para a aplicação
db.createUser({
  user: 'translation_user',
  pwd: 'translation_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'translation_db'
    }
  ]
});

// Criar coleção de traduções com índices
db.createCollection('translations');

// Criar índices para melhor performance
db.translations.createIndex({ "requestId": 1 }, { unique: true });
db.translations.createIndex({ "status": 1 });
db.translations.createIndex({ "createdAt": 1 });

print('Database initialized successfully!');

