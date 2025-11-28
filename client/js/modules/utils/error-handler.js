/**
 * Module de gestion centralisée des erreurs côté client
 * Capture, formate et affiche les erreurs de manière cohérente
 */

export default class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Garder les 100 dernières erreurs
    this.initialized = false;
    this.notificationContainer = null;
  }

  /**
   * Initialise le gestionnaire d'erreurs
   */
  init() {
    if (this.initialized) return;

    // Créer le conteneur de notifications
    this.createNotificationContainer();

    // Capturer les erreurs non gérées
    this.setupGlobalErrorHandlers();

    // Capturer les erreurs Socket.IO
    this.setupSocketErrorHandlers();

    this.initialized = true;
    console.info('[ErrorHandler] Gestionnaire d\'erreurs initialisé');
  }

  /**
   * Crée le conteneur HTML pour les notifications
   */
  createNotificationContainer() {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'error-notifications';
    this.notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(this.notificationContainer);
  }

  /**
   * Configure la capture des erreurs globales
   */
  setupGlobalErrorHandlers() {
    // Erreurs JavaScript non gérées
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'JavaScript Error',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Configure la capture des erreurs Socket.IO
   */
  setupSocketErrorHandlers() {
    if (window.socket) {
      window.socket.on('error', (error) => {
        this.handleSocketError(error);
      });

      window.socket.on('connect_error', (error) => {
        this.handleError({
          type: 'Socket.IO Connection Error',
          message: error.message,
          timestamp: new Date().toISOString()
        }, 'error');
      });

      window.socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect' || reason === 'transport close') {
          this.showNotification('Déconnexion du serveur', 'warning');
        }
      });

      window.socket.on('reconnect', () => {
        this.showNotification('Reconnexion réussie', 'success');
      });
    }
  }

  /**
   * Gère une erreur Socket.IO
   */
  handleSocketError(error) {
    this.handleError({
      type: 'Socket.IO Error',
      message: error.message || error,
      timestamp: new Date().toISOString()
    }, 'error');
  }

  /**
   * Gère une erreur
   * @param {Object} errorInfo - Informations sur l'erreur
   * @param {string} level - Niveau de sévérité (error, warning, info)
   */
  handleError(errorInfo, level = 'error') {
    // Stocker l'erreur
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Supprimer la plus ancienne
    }

    // Logger dans la console avec format clair
    this.logError(errorInfo, level);

    // Afficher notification utilisateur
    this.showNotification(errorInfo.message, level);
  }

  /**
   * Log l'erreur dans la console avec un format clair
   */
  logError(errorInfo, level) {
    const style = {
      error: 'color: #e74c3c; font-weight: bold;',
      warning: 'color: #f39c12; font-weight: bold;',
      info: 'color: #3498db; font-weight: bold;'
    }[level] || 'color: #333;';

    console.group(`%c[${errorInfo.type}] ${new Date().toLocaleTimeString()}`, style);
    console.error('Message:', errorInfo.message);
    if (errorInfo.source) {
      console.error('Source:', `${errorInfo.source}:${errorInfo.line}:${errorInfo.column}`);
    }
    if (errorInfo.stack) {
      console.error('Stack:', errorInfo.stack);
    }
    console.groupEnd();
  }

  /**
   * Affiche une notification à l'utilisateur
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, warning, info)
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db'
    };

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    notification.style.cssText = `
      background: ${colors[type]};
      color: white;
      padding: 15px 20px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
    `;

    notification.innerHTML = `
      <span style="font-size: 20px; margin-right: 10px;">${icons[type]}</span>
      <span style="flex: 1;">${this.escapeHtml(message)}</span>
      <span style="margin-left: 10px; opacity: 0.7;">×</span>
    `;

    // Ajouter l'animation
    if (!document.getElementById('error-handler-styles')) {
      const style = document.createElement('style');
      style.id = 'error-handler-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Fermer au clic
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    });

    // Auto-fermeture après 5 secondes (10 pour les erreurs)
    const duration = type === 'error' ? 10000 : 5000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);

    this.notificationContainer.appendChild(notification);
  }

  /**
   * Échappe le HTML pour éviter les injections XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Gère une erreur de validation de formulaire
   * @param {string} fieldName - Nom du champ
   * @param {string} message - Message d'erreur
   */
  handleValidationError(fieldName, message) {
    this.showNotification(`${fieldName}: ${message}`, 'warning');
  }

  /**
   * Gère une erreur réseau
   * @param {Error} error - Erreur réseau
   */
  handleNetworkError(error) {
    this.handleError({
      type: 'Network Error',
      message: error.message || 'Erreur de connexion au serveur',
      timestamp: new Date().toISOString()
    }, 'error');
  }

  /**
   * Gère une erreur de chargement de données
   * @param {string} module - Nom du module
   * @param {Error} error - Erreur
   */
  handleDataLoadError(module, error) {
    this.handleError({
      type: 'Data Load Error',
      message: `Impossible de charger ${module}: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 'error');
  }

  /**
   * Gère une erreur de sauvegarde de données
   * @param {string} module - Nom du module
   * @param {Error} error - Erreur
   */
  handleDataSaveError(module, error) {
    this.handleError({
      type: 'Data Save Error',
      message: `Impossible de sauvegarder ${module}: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 'error');
  }

  /**
   * Retourne toutes les erreurs enregistrées
   */
  getAllErrors() {
    return [...this.errors];
  }

  /**
   * Retourne les erreurs récentes (dernières 10)
   */
  getRecentErrors() {
    return this.errors.slice(-10);
  }

  /**
   * Efface toutes les erreurs enregistrées
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Exporte les erreurs au format JSON
   */
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }

  /**
   * Télécharge les erreurs dans un fichier
   */
  downloadErrors() {
    const blob = new Blob([this.exportErrors()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Instance singleton
export const errorHandler = new ErrorHandler();

// Export des fonctions utilitaires
export function showSuccess(message) {
  errorHandler.showNotification(message, 'success');
}

export function showError(message) {
  errorHandler.showNotification(message, 'error');
}

export function showWarning(message) {
  errorHandler.showNotification(message, 'warning');
}

export function showInfo(message) {
  errorHandler.showNotification(message, 'info');
}
