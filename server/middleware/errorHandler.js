/**
 * Middleware de gestion centralisée des erreurs côté serveur
 * Standardise les réponses d'erreur et le logging
 */

import logger from '../utils/logger.js';

/**
 * Codes d'erreur standardisés
 */
export const ERROR_CODES = {
  // Erreurs client (4xx)
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  CONFLICT: { code: 'CONFLICT', status: 409 },
  INVALID_INPUT: { code: 'INVALID_INPUT', status: 422 },
  TOO_MANY_REQUESTS: { code: 'TOO_MANY_REQUESTS', status: 429 },

  // Erreurs serveur (5xx)
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', status: 503 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', status: 500 },
  FILE_OPERATION_ERROR: { code: 'FILE_OPERATION_ERROR', status: 500 },
  SOCKET_ERROR: { code: 'SOCKET_ERROR', status: 500 }
};

/**
 * Classe d'erreur personnalisée avec code et contexte
 */
export class AppError extends Error {
  constructor(message, errorCode = ERROR_CODES.INTERNAL_ERROR, context = {}) {
    super(message);
    this.name = 'AppError';
    this.code = errorCode.code;
    this.status = errorCode.status;
    this.context = context;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion d'erreurs Express
 * Doit être ajouté après toutes les routes
 */
export function errorHandlerMiddleware(err, req, res, next) {
  // Si les headers ont déjà été envoyés, déléguer à Express
  if (res.headersSent) {
    return next(err);
  }

  // Déterminer le statut HTTP
  const status = err.status || err.statusCode || 500;

  // Déterminer le code d'erreur
  const code = err.code || ERROR_CODES.INTERNAL_ERROR.code;

  // Préparer la réponse d'erreur
  const errorResponse = {
    success: false,
    error: {
      code: code,
      message: err.message || 'Une erreur est survenue',
      timestamp: err.timestamp || new Date().toISOString()
    }
  };

  // Ajouter le contexte en développement
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.context = err.context;
  }

  // Logger l'erreur
  const logLevel = status >= 500 ? 'error' : 'warn';
  logger[logLevel]('Erreur HTTP', {
    method: req.method,
    url: req.url,
    status: status,
    code: code,
    message: err.message,
    stack: err.stack,
    context: err.context,
    userAgent: req.get('user-agent'),
    ip: req.ip
  });

  // Envoyer la réponse
  res.status(status).json(errorResponse);
}

/**
 * Middleware pour les routes non trouvées (404)
 */
export function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route non trouvée: ${req.method} ${req.url}`,
    ERROR_CODES.NOT_FOUND,
    { method: req.method, url: req.url }
  );
  next(error);
}

/**
 * Gestionnaire d'erreurs non gérées (process)
 */
export function setupProcessErrorHandlers() {
  // Erreurs non gérées
  process.on('uncaughtException', (error) => {
    console.error('❌ ERREUR NON GÉRÉE:', error.message);
    console.error('Stack:', error.stack);
    logger.error('Erreur non gérée (uncaughtException)', {
      error: error.message,
      stack: error.stack
    });

    // En production, on pourrait vouloir arrêter le serveur
    // process.exit(1);
  });

  // Promesses rejetées non gérées
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesse rejetée non gérée (unhandledRejection)', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise
    });

    // En production, on pourrait vouloir arrêter le serveur
    // process.exit(1);
  });

  // Arrêt gracieux
  process.on('SIGTERM', () => {
    logger.info('Signal SIGTERM reçu, arrêt du serveur...');
    // Fermer les connexions proprement
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('Signal SIGINT reçu, arrêt du serveur...');
    // Fermer les connexions proprement
    process.exit(0);
  });
}

/**
 * Wrapper pour les fonctions async dans les routes Express
 * Capture automatiquement les erreurs et les passe à next()
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Wrapper pour les gestionnaires Socket.IO
 * Capture et logue les erreurs
 */
export function socketAsyncHandler(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      logger.error('Erreur Socket.IO', {
        error: error.message,
        stack: error.stack,
        handler: fn.name
      });

      // Émettre l'erreur au client
      const socket = args[0];
      if (socket && typeof socket.emit === 'function') {
        socket.emit('error', {
          code: error.code || ERROR_CODES.SOCKET_ERROR.code,
          message: error.message || 'Une erreur est survenue',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}

/**
 * Validation des données avec gestion d'erreur cohérente
 */
export function validateData(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // Retourner toutes les erreurs
    stripUnknown: true // Supprimer les champs inconnus
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    throw new AppError(
      'Erreur de validation des données',
      ERROR_CODES.VALIDATION_ERROR,
      { errors }
    );
  }

  return value;
}

/**
 * Gestion d'erreur pour les opérations fichier
 */
export function handleFileError(error, operation, filename) {
  logger.error('Erreur opération fichier', {
    operation,
    filename,
    error: error.message,
    stack: error.stack
  });

  throw new AppError(
    `Erreur lors de ${operation} du fichier ${filename}`,
    ERROR_CODES.FILE_OPERATION_ERROR,
    { operation, filename, originalError: error.message }
  );
}

/**
 * Gestion d'erreur pour les opérations base de données (JSON)
 */
export function handleDatabaseError(error, operation, module) {
  logger.error('Erreur opération base de données', {
    operation,
    module,
    error: error.message,
    stack: error.stack
  });

  throw new AppError(
    `Erreur lors de ${operation} du module ${module}`,
    ERROR_CODES.DATABASE_ERROR,
    { operation, module, originalError: error.message }
  );
}

/**
 * Créer une réponse de succès standardisée
 */
export function successResponse(data, message = 'Opération réussie') {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Créer une réponse d'erreur standardisée
 */
export function errorResponse(message, code = ERROR_CODES.INTERNAL_ERROR.code, context = {}) {
  return {
    success: false,
    error: {
      code: code,
      message: message,
      context: process.env.NODE_ENV === 'development' ? context : undefined,
      timestamp: new Date().toISOString()
    }
  };
}

export default {
  ERROR_CODES,
  AppError,
  errorHandlerMiddleware,
  notFoundHandler,
  setupProcessErrorHandlers,
  asyncHandler,
  socketAsyncHandler,
  validateData,
  handleFileError,
  handleDatabaseError,
  successResponse,
  errorResponse
};
