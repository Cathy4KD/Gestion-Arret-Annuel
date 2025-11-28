// socket/index.js - Gestion des connexions Socket.io

import { registerTaskHandlers } from './taskHandler.js';
import { registerDataHandlers } from './dataHandler.js';
import * as taskService from '../services/taskService.js';
import * as dataService from '../services/dataService.js';

/**
 * Initialise Socket.io et enregistre tous les gestionnaires d'événements.
 * @param {object} io - L'instance Socket.io serveur.
 */
export function initializeSocketHandlers(io) {
  console.log('🔌 Initialisation des gestionnaires Socket.io');

  /**
   * Événement : Nouvelle connexion client
   */
  io.on('connection', async (socket) => {
    console.log(`✅ Nouveau client connecté: ${socket.id}`);

    // Envoyer l'état global initial au nouveau client
    const initialState = await taskService.getGlobalState();
    socket.emit('state:update', initialState);

    // Envoyer les données de l'application au nouveau client
    const appData = await dataService.getAllData();
    socket.emit('data:initial', appData);

    // Enregistrer les gestionnaires d'événements pour les tâches
    registerTaskHandlers(io, socket);

    // Enregistrer les gestionnaires d'événements pour les données
    registerDataHandlers(io, socket);

    // Enregistrer les gestionnaires d'événements pour les utilisateurs
    registerUserHandlers(io, socket);

    /**
     * Événement : Déconnexion du client
     */
    socket.on('disconnect', async () => {
      console.log(`❌ Client déconnecté: ${socket.id}`);

      // Retirer l'utilisateur de la liste
      await taskService.removeUser(socket.id);

      // Diffuser le nouvel état à tous les clients
      const newState = await taskService.getGlobalState();
      io.emit('state:update', newState);
    });
  });
}

/**
 * Enregistre les gestionnaires d'événements liés aux utilisateurs.
 * @param {object} io - L'instance Socket.io serveur.
 * @param {object} socket - Le socket d'un client spécifique.
 */
function registerUserHandlers(io, socket) {
  /**
   * Événement : Un utilisateur rejoint la session
   */
  socket.on('user:join', async ({ userName }) => {
    try {
      console.log(`👤 Utilisateur rejoint: ${userName} (${socket.id})`);

      // Ajouter l'utilisateur
      await taskService.addUser(socket.id, userName);

      // Récupérer et diffuser le nouvel état
      const newState = await taskService.getGlobalState();
      io.emit('state:update', newState);

      // Notification de succès
      socket.emit('notification:success', `Bienvenue ${userName} !`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'utilisateur:', error);

      socket.emit('notification:error', {
        message: error.message || 'Erreur lors de la connexion'
      });
    }
  });
}
