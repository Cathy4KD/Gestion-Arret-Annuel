/**
 * Module d'optimisation des performances
 * Fournit des utilitaires pour améliorer les performances de l'application
 */

/**
 * Throttle - Limite l'exécution d'une fonction à une fois par période
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Délai minimum entre les appels (ms)
 * @returns {Function} - Fonction throttled
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce - Retarde l'exécution d'une fonction jusqu'à ce qu'elle cesse d'être appelée
 * @param {Function} func - Fonction à debouncer
 * @param {number} delay - Délai d'attente (ms)
 * @returns {Function} - Fonction debounced
 */
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * RequestAnimationFrame throttle - Limite à un appel par frame
 * @param {Function} func - Fonction à throttler
 * @returns {Function} - Fonction throttled
 */
export function rafThrottle(func) {
  let requestId = null;
  return function(...args) {
    if (requestId === null) {
      requestId = requestAnimationFrame(() => {
        func.apply(this, args);
        requestId = null;
      });
    }
  };
}

/**
 * Lazy load d'un module
 * @param {string} path - Chemin du module
 * @returns {Promise} - Module chargé
 */
export async function lazyLoadModule(path) {
  try {
    const module = await import(path);
    return module.default || module;
  } catch (error) {
    console.error(`Erreur chargement module ${path}:`, error);
    throw error;
  }
}

/**
 * Intersection Observer pour lazy loading d'éléments
 * @param {Array} elements - Éléments à observer
 * @param {Function} callback - Callback quand visible
 * @param {Object} options - Options IntersectionObserver
 */
export function observeIntersection(elements, callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { ...defaultOptions, ...options });

  elements.forEach(el => observer.observe(el));

  return observer;
}

/**
 * Virtualisation de liste - Affiche seulement les éléments visibles
 */
export class VirtualList {
  constructor(container, items, renderItem, options = {}) {
    this.container = container;
    this.items = items;
    this.renderItem = renderItem;
    this.itemHeight = options.itemHeight || 50;
    this.buffer = options.buffer || 5;
    this.visibleItems = [];
    this.scrollTop = 0;

    this.init();
  }

  init() {
    // Créer le conteneur scrollable
    this.container.style.overflowY = 'auto';
    this.container.style.position = 'relative';

    // Créer l'espaceur pour la hauteur totale
    this.spacer = document.createElement('div');
    this.spacer.style.height = `${this.items.length * this.itemHeight}px`;
    this.spacer.style.position = 'relative';
    this.container.appendChild(this.spacer);

    // Créer le conteneur des items visibles
    this.viewport = document.createElement('div');
    this.viewport.style.position = 'absolute';
    this.viewport.style.top = '0';
    this.viewport.style.left = '0';
    this.viewport.style.right = '0';
    this.spacer.appendChild(this.viewport);

    // Écouter le scroll
    this.container.addEventListener('scroll', throttle(() => this.onScroll(), 16));

    // Rendu initial
    this.render();
  }

  onScroll() {
    this.scrollTop = this.container.scrollTop;
    this.render();
  }

  render() {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(
      this.items.length,
      Math.ceil((this.scrollTop + this.container.clientHeight) / this.itemHeight) + this.buffer
    );

    // Vider le viewport
    this.viewport.innerHTML = '';
    this.viewport.style.transform = `translateY(${startIndex * this.itemHeight}px)`;

    // Rendre les items visibles
    for (let i = startIndex; i < endIndex; i++) {
      const itemEl = this.renderItem(this.items[i], i);
      itemEl.style.height = `${this.itemHeight}px`;
      this.viewport.appendChild(itemEl);
    }
  }

  update(newItems) {
    this.items = newItems;
    this.spacer.style.height = `${this.items.length * this.itemHeight}px`;
    this.render();
  }
}

/**
 * Pagination de tableau
 */
export class TablePagination {
  constructor(data, pageSize = 50) {
    this.data = data;
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(data.length / pageSize);
  }

  getPage(page) {
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.data.slice(start, end);
  }

  getCurrentPage() {
    return this.getPage(this.currentPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      return this.getCurrentPage();
    }
    return null;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      return this.getCurrentPage();
    }
    return null;
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      return this.getCurrentPage();
    }
    return null;
  }

  updateData(newData) {
    this.data = newData;
    this.totalPages = Math.ceil(newData.length / this.pageSize);
    this.currentPage = 1;
  }

  getInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      pageSize: this.pageSize,
      totalItems: this.data.length,
      showing: {
        from: (this.currentPage - 1) * this.pageSize + 1,
        to: Math.min(this.currentPage * this.pageSize, this.data.length)
      }
    };
  }
}

/**
 * Mesure de performance
 */
export class PerformanceMonitor {
  constructor(name) {
    this.name = name;
    this.marks = new Map();
  }

  start(label = 'default') {
    const markName = `${this.name}-${label}-start`;
    performance.mark(markName);
    this.marks.set(label, markName);
  }

  end(label = 'default') {
    const startMark = this.marks.get(label);
    if (!startMark) {
      console.warn(`Aucun mark trouvé pour ${label}`);
      return;
    }

    const endMark = `${this.name}-${label}-end`;
    performance.mark(endMark);

    const measureName = `${this.name}-${label}`;
    performance.measure(measureName, startMark, endMark);

    const measure = performance.getEntriesByName(measureName)[0];
    console.info(`⏱️ ${measureName}: ${measure.duration.toFixed(2)}ms`);

    return measure.duration;
  }

  clear() {
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

/**
 * Calcul de delta pour envoi Socket.IO optimisé
 * @param {Object} oldData - Anciennes données
 * @param {Object} newData - Nouvelles données
 * @returns {Object} - Delta
 */
export function calculateDelta(oldData, newData) {
  const delta = {
    added: [],
    modified: [],
    removed: []
  };

  // Si pas d'anciennes données, tout est ajouté
  if (!oldData || !Array.isArray(oldData)) {
    delta.added = newData;
    return delta;
  }

  const oldMap = new Map(oldData.map(item => [item.id, item]));
  const newMap = new Map(newData.map(item => [item.id, item]));

  // Trouver les ajouts et modifications
  newData.forEach(newItem => {
    const oldItem = oldMap.get(newItem.id);
    if (!oldItem) {
      delta.added.push(newItem);
    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      delta.modified.push(newItem);
    }
  });

  // Trouver les suppressions
  oldData.forEach(oldItem => {
    if (!newMap.has(oldItem.id)) {
      delta.removed.push({ id: oldItem.id });
    }
  });

  return delta;
}

/**
 * Applique un delta sur des données
 * @param {Array} data - Données actuelles
 * @param {Object} delta - Delta à appliquer
 * @returns {Array} - Nouvelles données
 */
export function applyDelta(data, delta) {
  let result = [...data];

  // Supprimer les éléments
  if (delta.removed && delta.removed.length > 0) {
    const removedIds = new Set(delta.removed.map(r => r.id));
    result = result.filter(item => !removedIds.has(item.id));
  }

  // Modifier les éléments
  if (delta.modified && delta.modified.length > 0) {
    const modifiedMap = new Map(delta.modified.map(m => [m.id, m]));
    result = result.map(item => modifiedMap.get(item.id) || item);
  }

  // Ajouter les nouveaux éléments
  if (delta.added && delta.added.length > 0) {
    result = [...result, ...delta.added];
  }

  return result;
}

/**
 * Compression de données pour Socket.IO (simple)
 * @param {Object} data - Données à compresser
 * @returns {Object} - Données optimisées
 */
export function compressSocketData(data) {
  // Supprimer les champs null/undefined
  const compressed = JSON.parse(JSON.stringify(data, (key, value) => {
    if (value === null || value === undefined) {
      return undefined;
    }
    return value;
  }));

  return compressed;
}

/**
 * Barre de progression
 */
export class ProgressBar {
  constructor(container) {
    this.container = container;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.className = 'progress-bar';
    this.element.style.cssText = `
      width: 100%;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
      margin: 10px 0;
    `;

    this.bar = document.createElement('div');
    this.bar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    `;

    this.element.appendChild(this.bar);
    this.container.appendChild(this.element);
  }

  setProgress(percent) {
    this.bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  complete() {
    this.setProgress(100);
    setTimeout(() => this.remove(), 500);
  }

  remove() {
    this.element.remove();
  }
}

/**
 * Batch processing - Traite les éléments par lots
 * @param {Array} items - Éléments à traiter
 * @param {Function} processor - Fonction de traitement
 * @param {number} batchSize - Taille des lots
 * @param {number} delay - Délai entre les lots (ms)
 */
export async function batchProcess(items, processor, batchSize = 100, delay = 10) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results = [];
  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Petite pause pour ne pas bloquer l'UI
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Memoization - Cache les résultats de fonction
 * @param {Function} fn - Fonction à mémoiser
 * @returns {Function} - Fonction mémorisée
 */
export function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Détecte si un élément est visible dans le viewport
 * @param {HTMLElement} element - Élément à vérifier
 * @returns {boolean} - True si visible
 */
export function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export default {
  throttle,
  debounce,
  rafThrottle,
  lazyLoadModule,
  observeIntersection,
  VirtualList,
  TablePagination,
  PerformanceMonitor,
  calculateDelta,
  applyDelta,
  compressSocketData,
  ProgressBar,
  batchProcess,
  memoize,
  isElementVisible
};
