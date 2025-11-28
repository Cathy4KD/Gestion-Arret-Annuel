// main.js - Point d'entrée principal de l'application client

import { initializeState } from './store.js';
import { initSocketListeners } from './socket.js';
import { initUI } from './ui.js';
import { joinSession } from './actions.js';

/**
 * Fonction principale d'initialisation de l'application.
 * Appelée automatiquement au chargement de la page.
 */
function init() {
  console.log('[START] Initialisation de l\'application...');

  // 1. Initialiser l'état avec des valeurs par défaut
  initializeState({
    tasks: [],
    users: [],
    currentUser: null
  });

  // 2. Initialiser les écouteurs Socket.io
  initSocketListeners();

  // 3. Initialiser l'interface utilisateur
  initUI();

  // 4. Demander le nom de l'utilisateur (optionnel)
  promptUserName();

  console.log('[OK] Application initialisée avec succès');
}

/**
 * Demande le nom de l'utilisateur et l'enregistre dans la session.
 */
function promptUserName() {
  const userName = prompt('Quel est votre nom ?');
  if (userName && userName.trim()) {
    joinSession(userName.trim());
  }
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Le DOM est déjà chargé
  init();
}
