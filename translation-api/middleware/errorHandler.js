// Middleware para tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error('Error stack:', err.stack);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Erro de validação',
      details: errors
    });
  }

  // Erro de duplicação (chave única)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Recurso já existe'
    });
  }

  // Erro de cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido'
    });
  }

  // Erro padrão
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
};

// Middleware para rotas não encontradas
const notFound = (req, res, next) => {
  res.status(404).json({
    error: 'Rota não encontrada'
  });
};

// Middleware de validação de JSON
const validateJSON = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido'
    });
  }
  next();
};

module.exports = {
  errorHandler,
  notFound,
  validateJSON
};

