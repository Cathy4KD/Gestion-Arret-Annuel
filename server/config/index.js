// config/index.js - Configuration du serveur

/**
 * Configuration de l'application
 */
export const config = {
  // Port du serveur
  PORT: process.env.PORT || 3000,

  // Hôte du serveur (0.0.0.0 pour être accessible sur le réseau)
  HOST: process.env.HOST || '0.0.0.0',

  // Environnement (development, production)
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Options Socket.io
  SOCKET_OPTIONS: {
    cors: {
      origin: '*', // En production, spécifier les domaines autorisés
      methods: ['GET', 'POST']
    },
    // Augmenter la taille maximale des messages pour permettre l'envoi de gros fichiers Excel
    maxHttpBufferSize: 10 * 1024 * 1024, // 10 MB (par défaut: 1 MB)
    pingTimeout: 60000, // 60 secondes (par défaut: 20s)
    pingInterval: 25000 // 25 secondes (par défaut: 25s)
  }
};

/**
 * Retourne l'URL complète du serveur
 * @returns {string} L'URL du serveur
 */
export function getServerUrl() {
  return `http://${config.HOST}:${config.PORT}`;
}
