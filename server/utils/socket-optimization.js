/**
 * Utilitaires d'optimisation Socket.IO
 * Throttling, debouncing et compression des messages
 */

/**
 * Throttle pour les événements Socket.IO
 * Limite la fréquence d'émission d'un événement spécifique
 */
export class SocketThrottler {
  constructor(interval = 1000) {
    this.interval = interval; // ms
    this.lastEmit = new Map(); // eventName -> timestamp
  }

  /**
   * Vérifie si on peut émettre un événement
   * @param {string} eventName - Nom de l'événement
   * @param {string} socketId - ID du socket (optionnel)
   * @returns {boolean} - True si peut émettre
   */
  canEmit(eventName, socketId = '') {
    const key = socketId ? `${eventName}:${socketId}` : eventName;
    const now = Date.now();
    const lastTime = this.lastEmit.get(key) || 0;

    if (now - lastTime >= this.interval) {
      this.lastEmit.set(key, now);
      return true;
    }

    return false;
  }

  /**
   * Réinitialise le throttle pour un événement
   * @param {string} eventName - Nom de l'événement
   * @param {string} socketId - ID du socket (optionnel)
   */
  reset(eventName, socketId = '') {
    const key = socketId ? `${eventName}:${socketId}` : eventName;
    this.lastEmit.delete(key);
  }

  /**
   * Nettoie les entrées anciennes
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.lastEmit.entries()) {
      if (now - timestamp > this.interval * 10) {
        this.lastEmit.delete(key);
      }
    }
  }
}

/**
 * Debouncer pour les événements Socket.IO
 * Retarde l'émission jusqu'à ce que l'événement cesse d'être déclenché
 */
export class SocketDebouncer {
  constructor(delay = 500) {
    this.delay = delay; // ms
    this.timers = new Map(); // eventName -> timeoutId
    this.pendingData = new Map(); // eventName -> data
  }

  /**
   * Ajoute un événement au debouncer
   * @param {string} eventName - Nom de l'événement
   * @param {*} data - Données à émettre
   * @param {Function} callback - Fonction à appeler après le délai
   * @param {string} socketId - ID du socket (optionnel)
   */
  debounce(eventName, data, callback, socketId = '') {
    const key = socketId ? `${eventName}:${socketId}` : eventName;

    // Annuler le timer précédent
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Stocker les données
    this.pendingData.set(key, data);

    // Créer un nouveau timer
    const timer = setTimeout(() => {
      const pendingData = this.pendingData.get(key);
      callback(pendingData);
      this.timers.delete(key);
      this.pendingData.delete(key);
    }, this.delay);

    this.timers.set(key, timer);
  }

  /**
   * Force l'émission immédiate d'un événement
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction à appeler
   * @param {string} socketId - ID du socket (optionnel)
   */
  flush(eventName, callback, socketId = '') {
    const key = socketId ? `${eventName}:${socketId}` : eventName;

    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);

      const data = this.pendingData.get(key);
      if (data) {
        callback(data);
        this.pendingData.delete(key);
      }
    }
  }

  /**
   * Annule tous les timers
   */
  cancelAll() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.pendingData.clear();
  }
}

/**
 * Calcule le delta entre deux états pour n'envoyer que les changements
 * @param {Array} oldData - Anciennes données
 * @param {Array} newData - Nouvelles données
 * @returns {Object} - Delta {added, modified, removed}
 */
export function calculateDelta(oldData, newData) {
  const delta = {
    added: [],
    modified: [],
    removed: []
  };

  if (!oldData || !Array.isArray(oldData)) {
    delta.added = newData;
    return delta;
  }

  const oldMap = new Map(oldData.map(item => [item.id, item]));
  const newMap = new Map(newData.map(item => [item.id, item]));

  // Ajouts et modifications
  for (const newItem of newData) {
    const oldItem = oldMap.get(newItem.id);
    if (!oldItem) {
      delta.added.push(newItem);
    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      delta.modified.push(newItem);
    }
  }

  // Suppressions
  for (const oldItem of oldData) {
    if (!newMap.has(oldItem.id)) {
      delta.removed.push({ id: oldItem.id });
    }
  }

  return delta;
}

/**
 * Compresse les données en supprimant les champs null/undefined
 * @param {Object} data - Données à compresser
 * @returns {Object} - Données compressées
 */
export function compressData(data) {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === null || value === undefined ? undefined : value;
  }));
}

/**
 * Rate limiter pour Socket.IO
 * Limite le nombre de messages par socket par intervalle de temps
 */
export class SocketRateLimiter {
  constructor(maxMessages = 100, interval = 60000) {
    this.maxMessages = maxMessages; // Nombre max de messages
    this.interval = interval; // Intervalle en ms (défaut: 1 minute)
    this.messageCount = new Map(); // socketId -> count
    this.resetTimers = new Map(); // socketId -> timeoutId
  }

  /**
   * Vérifie si un socket peut envoyer un message
   * @param {string} socketId - ID du socket
   * @returns {boolean} - True si autorisé
   */
  canSendMessage(socketId) {
    const count = this.messageCount.get(socketId) || 0;

    if (count >= this.maxMessages) {
      return false;
    }

    // Incrémenter le compteur
    this.messageCount.set(socketId, count + 1);

    // Créer un timer de reset si pas déjà existant
    if (!this.resetTimers.has(socketId)) {
      const timer = setTimeout(() => {
        this.messageCount.delete(socketId);
        this.resetTimers.delete(socketId);
      }, this.interval);

      this.resetTimers.set(socketId, timer);
    }

    return true;
  }

  /**
   * Obtient le nombre de messages envoyés
   * @param {string} socketId - ID du socket
   * @returns {number} - Nombre de messages
   */
  getMessageCount(socketId) {
    return this.messageCount.get(socketId) || 0;
  }

  /**
   * Réinitialise le compteur pour un socket
   * @param {string} socketId - ID du socket
   */
  reset(socketId) {
    const timer = this.resetTimers.get(socketId);
    if (timer) {
      clearTimeout(timer);
      this.resetTimers.delete(socketId);
    }
    this.messageCount.delete(socketId);
  }

  /**
   * Nettoie un socket déconnecté
   * @param {string} socketId - ID du socket
   */
  cleanup(socketId) {
    this.reset(socketId);
  }
}

/**
 * Mesure la taille d'un message Socket.IO
 * @param {*} data - Données à mesurer
 * @returns {number} - Taille en bytes
 */
export function getMessageSize(data) {
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf-8');
  } catch (error) {
    return 0;
  }
}

/**
 * Middleware Socket.IO pour logger les gros messages
 * @param {number} threshold - Seuil en bytes (défaut: 100KB)
 * @returns {Function} - Middleware
 */
export function logLargeMessages(threshold = 100 * 1024) {
  return ([event, ...args], next) => {
    if (args.length > 0) {
      const size = getMessageSize(args[0]);
      if (size > threshold) {
        console.warn(`⚠️  Gros message Socket.IO: ${event} (${(size / 1024).toFixed(2)}KB)`);
      }
    }
    next();
  };
}

/**
 * Batch des événements Socket.IO
 * Regroupe plusieurs petits événements en un seul
 */
export class SocketBatcher {
  constructor(maxBatchSize = 10, maxWaitTime = 100) {
    this.maxBatchSize = maxBatchSize;
    this.maxWaitTime = maxWaitTime; // ms
    this.batches = new Map(); // eventName -> {items: [], timer: timeoutId}
  }

  /**
   * Ajoute un item au batch
   * @param {string} eventName - Nom de l'événement
   * @param {*} data - Données
   * @param {Function} emitFunction - Fonction d'émission
   */
  add(eventName, data, emitFunction) {
    let batch = this.batches.get(eventName);

    if (!batch) {
      batch = { items: [], timer: null };
      this.batches.set(eventName, batch);
    }

    batch.items.push(data);

    // Émettre immédiatement si batch plein
    if (batch.items.length >= this.maxBatchSize) {
      this.flush(eventName, emitFunction);
    } else {
      // Sinon, créer ou reset le timer
      if (batch.timer) {
        clearTimeout(batch.timer);
      }

      batch.timer = setTimeout(() => {
        this.flush(eventName, emitFunction);
      }, this.maxWaitTime);
    }
  }

  /**
   * Force l'émission d'un batch
   * @param {string} eventName - Nom de l'événement
   * @param {Function} emitFunction - Fonction d'émission
   */
  flush(eventName, emitFunction) {
    const batch = this.batches.get(eventName);

    if (batch && batch.items.length > 0) {
      if (batch.timer) {
        clearTimeout(batch.timer);
      }

      emitFunction(batch.items);
      this.batches.delete(eventName);
    }
  }

  /**
   * Force l'émission de tous les batchs
   * @param {Function} emitFunction - Fonction d'émission
   */
  flushAll(emitFunction) {
    for (const [eventName] of this.batches) {
      this.flush(eventName, emitFunction);
    }
  }
}

/**
 * Wrapper pour optimiser automatiquement les émissions Socket.IO
 */
export class OptimizedSocketEmitter {
  constructor(io, options = {}) {
    this.io = io;
    this.throttler = new SocketThrottler(options.throttleInterval || 1000);
    this.debouncer = new SocketDebouncer(options.debounceDelay || 500);
    this.rateLimiter = new SocketRateLimiter(
      options.maxMessages || 100,
      options.rateLimitInterval || 60000
    );
    this.enableDelta = options.enableDelta !== false;
    this.lastStates = new Map(); // eventName -> lastData
  }

  /**
   * Émet un événement avec optimisations
   * @param {string} eventName - Nom de l'événement
   * @param {*} data - Données
   * @param {Object} options - Options d'émission
   */
  emit(eventName, data, options = {}) {
    const {
      throttle = false,
      debounce = false,
      delta = this.enableDelta,
      compress = true
    } = options;

    let dataToSend = data;

    // Compression
    if (compress) {
      dataToSend = compressData(dataToSend);
    }

    // Delta
    if (delta && Array.isArray(dataToSend)) {
      const lastState = this.lastStates.get(eventName);
      if (lastState) {
        const deltaData = calculateDelta(lastState, dataToSend);
        // Si le delta est plus petit, l'utiliser
        const deltaSize = getMessageSize(deltaData);
        const fullSize = getMessageSize(dataToSend);

        if (deltaSize < fullSize * 0.7) {
          dataToSend = { isDelta: true, delta: deltaData };
        }
      }
      this.lastStates.set(eventName, data);
    }

    // Émission
    if (throttle) {
      if (this.throttler.canEmit(eventName)) {
        this.io.emit(eventName, dataToSend);
      }
    } else if (debounce) {
      this.debouncer.debounce(eventName, dataToSend, (finalData) => {
        this.io.emit(eventName, finalData);
      });
    } else {
      this.io.emit(eventName, dataToSend);
    }
  }

  /**
   * Émet vers un socket spécifique
   * @param {Object} socket - Socket
   * @param {string} eventName - Nom de l'événement
   * @param {*} data - Données
   * @param {Object} options - Options
   */
  emitToSocket(socket, eventName, data, options = {}) {
    // Vérifier le rate limit
    if (!this.rateLimiter.canSendMessage(socket.id)) {
      console.warn(`Rate limit atteint pour socket ${socket.id}`);
      socket.emit('error', {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Trop de messages envoyés'
      });
      return;
    }

    let dataToSend = options.compress !== false ? compressData(data) : data;
    socket.emit(eventName, dataToSend);
  }
}

export default {
  SocketThrottler,
  SocketDebouncer,
  SocketRateLimiter,
  SocketBatcher,
  OptimizedSocketEmitter,
  calculateDelta,
  compressData,
  getMessageSize,
  logLargeMessages
};
