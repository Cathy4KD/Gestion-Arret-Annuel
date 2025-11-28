/**
 * Module de résilience Socket.IO
 * Gère la reconnexion, la détection de déconnexion et la resynchronisation
 */

import { showInfo, showWarning, showError, showSuccess } from '../utils/error-handler.js';

export default class SocketResilience {
  constructor(socket) {
    this.socket = socket;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Délai initial: 1 seconde
    this.maxReconnectDelay = 30000; // Délai max: 30 secondes
    this.pendingOperations = [];
    this.connectionStatusElement = null;
    this.onReconnectCallbacks = [];
    this.lastDataSnapshot = {};
  }

  /**
   * Initialise le système de résilience
   */
  init() {
    this.createStatusIndicator();
    this.setupSocketListeners();
    this.startHeartbeat();
    console.info('[SocketResilience] Système de résilience initialisé');
  }

  /**
   * Crée l'indicateur visuel de connexion
   */
  createStatusIndicator() {
    this.connectionStatusElement = document.createElement('div');
    this.connectionStatusElement.id = 'connection-status';
    this.connectionStatusElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      display: none;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.connectionStatusElement);
  }

  /**
   * Met à jour l'indicateur de statut
   */
  updateStatusIndicator(status, message) {
    const colors = {
      connected: { bg: '#27ae60', color: '#fff', icon: '✓' },
      disconnected: { bg: '#e74c3c', color: '#fff', icon: '✕' },
      reconnecting: { bg: '#f39c12', color: '#fff', icon: '⟳' }
    };

    const style = colors[status];
    if (!style) return;

    this.connectionStatusElement.style.backgroundColor = style.bg;
    this.connectionStatusElement.style.color = style.color;
    this.connectionStatusElement.innerHTML = `
      <span style="font-size: 16px;">${style.icon}</span>
      <span>${message}</span>
    `;

    if (status === 'connected') {
      // Masquer après 3 secondes si connecté
      this.connectionStatusElement.style.display = 'flex';
      setTimeout(() => {
        this.connectionStatusElement.style.display = 'none';
      }, 3000);
    } else {
      // Afficher tant que pas connecté
      this.connectionStatusElement.style.display = 'flex';
    }
  }

  /**
   * Configure les listeners Socket.IO
   */
  setupSocketListeners() {
    // Connexion établie
    this.socket.on('connect', () => {
      this.handleConnect();
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      this.handleDisconnect(reason);
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      this.handleConnectError(error);
    });

    // Tentative de reconnexion
    this.socket.io.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
      this.updateStatusIndicator('reconnecting', `Reconnexion (${attempt}/${this.maxReconnectAttempts})...`);
    });

    // Reconnexion réussie
    this.socket.io.on('reconnect', (attempt) => {
      this.handleReconnect(attempt);
    });

    // Échec de reconnexion
    this.socket.io.on('reconnect_failed', () => {
      this.handleReconnectFailed();
    });
  }

  /**
   * Gère la connexion initiale
   */
  handleConnect() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.updateStatusIndicator('connected', 'Connecté au serveur');
    showSuccess('Connexion établie');

    console.info('[SocketResilience] Connexion établie');

    // Traiter les opérations en attente
    this.processPendingOperations();
  }

  /**
   * Gère la déconnexion
   */
  handleDisconnect(reason) {
    this.isConnected = false;

    console.warn('[SocketResilience] Déconnexion:', reason);

    if (reason === 'io server disconnect') {
      // Serveur a forcé la déconnexion
      this.updateStatusIndicator('disconnected', 'Déconnecté du serveur');
      showError('Le serveur a fermé la connexion');

      // Tenter de se reconnecter manuellement
      setTimeout(() => {
        if (!this.isConnected) {
          this.socket.connect();
        }
      }, 1000);

    } else if (reason === 'transport close' || reason === 'transport error') {
      // Problème réseau
      this.updateStatusIndicator('disconnected', 'Connexion perdue');
      showWarning('Connexion au serveur perdue, reconnexion automatique...');

    } else {
      // Autre raison
      this.updateStatusIndicator('disconnected', 'Déconnecté');
      showInfo('Déconnexion du serveur');
    }
  }

  /**
   * Gère les erreurs de connexion
   */
  handleConnectError(error) {
    console.error('[SocketResilience] Erreur de connexion:', error.message);

    // Calculer le délai de reconnexion exponentiel
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.updateStatusIndicator('reconnecting', `Nouvelle tentative dans ${Math.round(delay/1000)}s...`);
  }

  /**
   * Gère une reconnexion réussie
   */
  handleReconnect(attempt) {
    this.isConnected = true;
    this.reconnectAttempts = 0;

    console.info(`[SocketResilience] Reconnexion réussie après ${attempt} tentative(s)`);

    this.updateStatusIndicator('connected', 'Reconnecté au serveur');
    showSuccess('Reconnexion réussie !');

    // Resynchroniser les données
    this.resyncData();

    // Appeler les callbacks de reconnexion
    this.onReconnectCallbacks.forEach(callback => callback());
  }

  /**
   * Gère l'échec de reconnexion
   */
  handleReconnectFailed() {
    console.error('[SocketResilience] Échec de reconnexion après plusieurs tentatives');

    this.updateStatusIndicator('disconnected', 'Impossible de se reconnecter');
    showError('Impossible de se reconnecter au serveur. Veuillez rafraîchir la page.');
  }

  /**
   * Démarre le heartbeat pour détecter les déconnexions
   */
  startHeartbeat() {
    setInterval(() => {
      if (this.socket.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping toutes les 30 secondes

    this.socket.on('pong', () => {
      // Connexion active
      this.isConnected = true;
    });
  }

  /**
   * Ajoute une opération en attente
   */
  addPendingOperation(operation) {
    this.pendingOperations.push({
      ...operation,
      timestamp: Date.now()
    });

    console.info('[SocketResilience] Opération mise en attente:', operation.type);
  }

  /**
   * Traite les opérations en attente après reconnexion
   */
  processPendingOperations() {
    if (this.pendingOperations.length === 0) return;

    console.info(`[SocketResilience] Traitement de ${this.pendingOperations.length} opération(s) en attente`);

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    operations.forEach(operation => {
      try {
        this.socket.emit(operation.event, operation.data);
        console.info('[SocketResilience] Opération rejouée:', operation.type);
      } catch (error) {
        console.error('[SocketResilience] Erreur lors de la relecture de l\'opération:', error);
        this.pendingOperations.push(operation); // Remettre en attente
      }
    });
  }

  /**
   * Sauvegarde un snapshot des données pour resynchronisation
   */
  saveDataSnapshot(moduleName, data) {
    this.lastDataSnapshot[moduleName] = {
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      timestamp: Date.now()
    };
  }

  /**
   * Resynchronise les données après reconnexion
   */
  async resyncData() {
    console.info('[SocketResilience] Resynchronisation des données...');

    // Recharger tous les modules qui ont un snapshot
    for (const [moduleName, snapshot] of Object.entries(this.lastDataSnapshot)) {
      try {
        console.info(`[SocketResilience] Resynchronisation de ${moduleName}...`);
        this.socket.emit(`load:${moduleName}`);
      } catch (error) {
        console.error(`[SocketResilience] Erreur resynchronisation ${moduleName}:`, error);
      }
    }
  }

  /**
   * Enregistre un callback à appeler lors de la reconnexion
   */
  onReconnect(callback) {
    this.onReconnectCallbacks.push(callback);
  }

  /**
   * Vérifie si la connexion est active
   */
  isConnectionActive() {
    return this.socket.connected && this.isConnected;
  }

  /**
   * Émet un événement avec gestion de résilience
   */
  emit(event, data, options = {}) {
    if (this.isConnectionActive()) {
      // Connexion active, émettre directement
      this.socket.emit(event, data);
      return Promise.resolve();
    } else {
      // Connexion inactive
      if (options.queueIfOffline) {
        // Mettre en attente
        this.addPendingOperation({
          event,
          data,
          type: options.type || event
        });
        showWarning('Opération mise en attente (hors ligne)');
        return Promise.reject(new Error('Offline - operation queued'));
      } else {
        // Rejeter immédiatement
        showError('Impossible d\'effectuer l\'opération (hors ligne)');
        return Promise.reject(new Error('Not connected'));
      }
    }
  }

  /**
   * Reconnexion manuelle
   */
  reconnectManually() {
    if (!this.isConnectionActive()) {
      console.info('[SocketResilience] Reconnexion manuelle demandée');
      this.socket.connect();
    }
  }

  /**
   * Obtient les statistiques de connexion
   */
  getStats() {
    return {
      connected: this.isConnectionActive(),
      reconnectAttempts: this.reconnectAttempts,
      pendingOperations: this.pendingOperations.length,
      snapshotModules: Object.keys(this.lastDataSnapshot).length
    };
  }
}

// Instance singleton (sera initialisée dans main.js)
let socketResilienceInstance = null;

export function initSocketResilience(socket) {
  socketResilienceInstance = new SocketResilience(socket);
  socketResilienceInstance.init();
  return socketResilienceInstance;
}

export function getSocketResilience() {
  return socketResilienceInstance;
}
