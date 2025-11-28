// utils/logger.js - Système de logging centralisé avec Winston
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Créer le dossier logs s'il n'existe pas
const LOG_DIR = join(__dirname, '..', '..', 'logs');
if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Format personnalisé pour les logs
 */
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        // Ajouter les métadonnées si présentes
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }

        // Ajouter la stack trace pour les erreurs
        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

/**
 * Transport pour les logs combinés (tous les niveaux)
 */
const combinedTransport = new DailyRotateFile({
    filename: join(LOG_DIR, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Conserver 14 jours
    format: customFormat,
    level: 'info'
});

/**
 * Transport pour les erreurs seulement
 */
const errorTransport = new DailyRotateFile({
    filename: join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d', // Conserver 30 jours pour les erreurs
    format: customFormat,
    level: 'error'
});

/**
 * Transport pour la console (développement)
 */
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    level: 'debug'
});

/**
 * Créer le logger Winston
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        combinedTransport,
        errorTransport,
        consoleTransport
    ],
    // Gérer les exceptions non capturées
    exceptionHandlers: [
        new DailyRotateFile({
            filename: join(LOG_DIR, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            format: customFormat
        })
    ],
    // Gérer les rejections de promesses non capturées
    rejectionHandlers: [
        new DailyRotateFile({
            filename: join(LOG_DIR, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            format: customFormat
        })
    ]
});

/**
 * Wrapper pour logger les événements Socket.IO
 */
export function logSocketEvent(event, data = {}, socket = null) {
    const meta = {
        event,
        socketId: socket?.id || 'unknown',
        ...data
    };
    logger.info(`Socket.IO: ${event}`, meta);
}

/**
 * Wrapper pour logger les requêtes HTTP
 */
export function logHttpRequest(req, res, duration) {
    const meta = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`HTTP ${req.method} ${req.originalUrl || req.url}`, meta);
}

/**
 * Wrapper pour logger les erreurs de validation
 */
export function logValidationError(context, errors, data = {}) {
    logger.warn('Erreur de validation', {
        context,
        errors,
        ...data
    });
}

/**
 * Wrapper pour logger les opérations de données
 */
export function logDataOperation(operation, moduleName, userName, success = true, error = null) {
    const meta = {
        operation,
        moduleName,
        userName,
        success
    };

    if (error) {
        meta.error = error.message;
        logger.error(`Opération de données échouée: ${operation}`, meta);
    } else {
        logger.info(`Opération de données: ${operation}`, meta);
    }
}

/**
 * Wrapper pour logger les événements système
 */
export function logSystemEvent(message, level = 'info', meta = {}) {
    logger[level](message, meta);
}

/**
 * Middleware Express pour logger automatiquement les requêtes HTTP
 */
export function httpLoggerMiddleware() {
    return (req, res, next) => {
        const start = Date.now();

        // Logger après l'envoi de la réponse
        res.on('finish', () => {
            const duration = Date.now() - start;
            logHttpRequest(req, res, duration);
        });

        next();
    };
}

// Exporter le logger principal
export default logger;
