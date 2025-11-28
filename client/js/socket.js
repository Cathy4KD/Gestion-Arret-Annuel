// socket.js - Logique client Socket.io (connexion, écouteurs)

import { setState } from './store.js';

/**
 * L'instance Socket.io client.
 * Connecté automatiquement au serveur.
 */
export const socket = io();

/**
 * Exposer le socket globalement pour les pages chargées dynamiquement
 */
window.socket = socket;

/**
 * Initialise les écouteurs d'événements Socket.io.
 * À appeler une seule fois au démarrage de l'application.
 */
export function initSocketListeners() {
  /**
   * Événement : Connexion réussie au serveur
   */
  socket.on('connect', () => {
    console.log('[OK] Connecté au serveur - ID:', socket.id);
  });

  /**
   * Événement : Déconnexion du serveur
   */
  socket.on('disconnect', () => {
    console.log('[ERROR] Déconnecté du serveur');
  });

  /**
   * Événement : Mise à jour de l'état global
   * C'est l'événement principal qui synchronise l'état client avec le serveur
   */
  socket.on('state:update', (newState) => {
    console.log('[PACKAGE] État mis à jour depuis le serveur:', newState);
    setState(newState);
  });

  /**
   * Événement : Notification d'erreur
   */
  socket.on('notification:error', (error) => {
    console.error('[ERROR] Erreur:', error.message);
    // Afficher une notification d'erreur à l'utilisateur
    showNotification('error', error.message);
  });

  /**
   * Événement : Notification de succès
   */
  socket.on('notification:success', (message) => {
    console.log('[OK] Succès:', message);
    // Afficher une notification de succès à l'utilisateur
    showNotification('success', message);
  });

  /**
   * Événement : Les données ont été rechargées sur le serveur
   * FORCE LE RECHARGEMENT AUTOMATIQUE DE LA PAGE
   */
  socket.on('data-reloaded', (info) => {
    console.log('[RELOAD] 🔄 Les données ont été mises à jour sur le serveur');
    console.log('[RELOAD] Rechargement automatique de la page dans 1 seconde...');

    // Afficher une notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      z-index: 99999;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    notification.textContent = '🔄 Données mises à jour! Rechargement automatique...';
    document.body.appendChild(notification);

    // Recharger la page après 1 seconde
    setTimeout(() => {
      location.reload(true);
    }, 1000);
  });
}

/**
 * Affiche une notification à l'utilisateur.
 * @param {string} type - Le type de notification ('error', 'success', 'info')
 * @param {string} message - Le message à afficher
 */
function showNotification(type, message) {
  // TODO: Implémenter l'affichage visuel des notifications
  const prefix = type === 'error' ? '[ERROR]' : type === 'success' ? '[OK]' : '[INFO]';
  alert(`${prefix} ${message}`);
}
