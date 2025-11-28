// server.js - Point d'entrée principal du serveur

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';
import { existsSync } from 'fs';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config, getServerUrl } from './config/index.js';
import { initializeSocketHandlers } from './socket/index.js';
import { initializeDataService } from './services/dataService.js';
import { loadIw37nAtStartup } from './scripts/loadIw37nAtStartup.js';
import logger, { httpLoggerMiddleware, logSystemEvent } from './utils/logger.js';
import { initializeScheduler, stopAllTasks } from './utils/scheduler.js';
import {
  errorHandlerMiddleware,
  notFoundHandler,
  setupProcessErrorHandlers
} from './middleware/errorHandler.js';
import { setupSecurity } from './middleware/security.js';

// Pour obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Obtient l'adresse IP locale de la machine
 * @returns {string} L'adresse IP locale
 */
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4 et pas une adresse interne (127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Initialise et démarre le serveur.
 */
async function startServer() {
  // 0. Configurer les gestionnaires d'erreurs globaux
  setupProcessErrorHandlers();

  // 0.1. Initialiser le service de données
  await initializeDataService();

  // 0.1. Charger automatiquement IW37N.xlsx si présent
  await loadIw37nAtStartup();

  // 1. Créer l'application Express
  const app = express();

  // 2. Créer le serveur HTTP
  const httpServer = createServer(app);

  // 3. Créer l'instance Socket.io
  const io = new Server(httpServer, config.SOCKET_OPTIONS);

  // 3.1. Rendre io accessible globalement pour les routes admin
  global.io = io;

  // 4. Middleware pour parser JSON et form-data
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 4.2. Middleware de logging HTTP
  app.use(httpLoggerMiddleware());

  // 4.3. Middleware de compression GZIP
  app.use(compression({
    filter: (req, res) => {
      // Compresser tout sauf si explicitement demandé de ne pas compresser
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Niveau de compression (0-9, 6 = bon compromis vitesse/taux)
    threshold: 1024 // Compresser seulement si > 1KB
  }));

  // 4.3.5. Middleware de sécurité (headers, sanitization, détection d'attaques)
  setupSecurity(app, {
    enableCsrf: false, // Désactivé pour usage local
    enableCors: true,
    enableAttackDetection: true,
    enableSanitization: true
  });

  // 4.4. Rate Limiting pour protéger contre les abus
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requêtes par IP par fenêtre
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    standardHeaders: true, // Retourne les infos de rate limit dans les headers `RateLimit-*`
    legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  });

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Max 2000 requêtes par IP par fenêtre (très permissif pour développement local)
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Ne pas rate limiter les fichiers statiques .js, .css, .html
      return req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.html');
    }
  });

  // Appliquer le rate limiting strict aux APIs
  app.use('/api/', apiLimiter);

  // Appliquer le rate limiting général à toutes les autres routes
  app.use(generalLimiter);

  // 4.5. Middleware de CACHE - DÉSACTIVÉ COMPLÈTEMENT
  app.use((req, res, next) => {
    // AUCUN CACHE NULLE PART - JAMAIS
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    next();
  });

  // 5. Routes API pour les fichiers (AVANT les fichiers statiques)
  const filesRouter = await import('./routes/files.js');
  app.use('/api/files', filesRouter.default);

  // 5.2. Routes API d'administration (monitoring, logs, santé)
  const adminRouter = await import('./routes/admin.js');
  app.use('/api/admin', adminRouter.default);

  // 5.3. Routes API pour T55 DOCX (templates et génération)
  const t55DocxRouter = await import('./routes/t55-docx.js');
  app.use('/api/t55', t55DocxRouter.default);

  // 5.5. Middleware pour forcer le Content-Type pour les fichiers JS
  app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
      res.type('application/javascript; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    next();
  });

  // 6. Route pour télécharger les avis syndicaux générés
  app.get('/download-avis/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = join(__dirname, '..', 'generated-docs', fileName);

    // Vérifier que le fichier existe
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Envoyer le fichier avec le bon Content-Type
    res.download(filePath, fileName);
  });

  // 6.1. Route pour télécharger les devis T55 générés
  app.get('/download-devis/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = join(__dirname, '..', 'generated-docs', fileName);

    // Vérifier que le fichier existe
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Envoyer le fichier avec le bon Content-Type
    res.download(filePath, fileName);
  });

  // 7. Middleware pour servir les fichiers statiques
  const rootPath = join(__dirname, '..');
  const clientPath = join(rootPath, 'client');
  app.use(express.static(clientPath)); // Priorité au dossier client
  app.use(express.static(rootPath));   // Fallback sur la racine du projet

  // 7.5. Route de santé (health check)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      version: '1.0.0'
    });
  });

  // 8. Route principale (fallback vers index.html)
  app.get('*', (req, res) => {
    res.sendFile(join(clientPath, 'index.html'));
  });

  // 9. Middleware de gestion d'erreurs (DOIT être en dernier)
  app.use(notFoundHandler);
  app.use(errorHandlerMiddleware);

  // 8. Initialiser les gestionnaires Socket.io
  initializeSocketHandlers(io);

  // 9. Initialiser les tâches planifiées
  const scheduledTasks = initializeScheduler();

  // 10. Démarrer le serveur
  httpServer.listen(config.PORT, config.HOST, () => {
    const localIP = getLocalIP();
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   🏭 Gestionnaire d\'Arrêt d\'Aciérie           ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Serveur démarré sur: ${getServerUrl()}`);
    console.log(`📁 Fichiers client: ${clientPath}`);
    console.log(`🌍 Environnement: ${config.NODE_ENV}`);
    console.log('');
    console.log('📡 Accès réseau:');
    console.log(`   Local:  http://localhost:${config.PORT}`);
    console.log(`   Réseau: http://${localIP}:${config.PORT}`);
    console.log('');
    console.log('Appuyez sur Ctrl+C pour arrêter le serveur');
    console.log('');

    // Logger le démarrage
    logSystemEvent('Serveur démarré avec succès', 'info', {
      port: config.PORT,
      host: config.HOST,
      environment: config.NODE_ENV,
      localIP,
      clientPath
    });
  });

  // Gestion propre de l'arrêt du serveur
  process.on('SIGTERM', () => {
    console.log('📴 Arrêt du serveur...');
    logSystemEvent('Signal SIGTERM reçu, arrêt du serveur', 'warn');

    // Arrêter les tâches planifiées
    stopAllTasks(scheduledTasks);

    httpServer.close(() => {
      console.log('✅ Serveur arrêté proprement');
      logSystemEvent('Serveur arrêté proprement', 'info');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📴 Arrêt du serveur...');
    logSystemEvent('Signal SIGINT reçu, arrêt du serveur', 'warn');

    // Arrêter les tâches planifiées
    stopAllTasks(scheduledTasks);

    httpServer.close(() => {
      console.log('✅ Serveur arrêté proprement');
      logSystemEvent('Serveur arrêté proprement', 'info');
      process.exit(0);
    });
  });
}

// Démarrer le serveur
startServer();
