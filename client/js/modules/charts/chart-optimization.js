/**
 * Module d'optimisation des graphiques Chart.js
 * Réduit le nombre de points affichés et améliore les performances
 */

/**
 * Réduit le nombre de points d'un dataset en échantillonnant
 * @param {Array} data - Données originales
 * @param {number} maxPoints - Nombre maximum de points
 * @param {string} method - Méthode ('average', 'min', 'max', 'first', 'last')
 * @returns {Array} - Données réduites
 */
export function downsampleData(data, maxPoints = 100, method = 'average') {
  if (data.length <= maxPoints) {
    return data;
  }

  const bucketSize = Math.ceil(data.length / maxPoints);
  const downsampled = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);

    let value;
    switch (method) {
      case 'average':
        value = bucket.reduce((sum, item) => sum + (typeof item === 'number' ? item : item.y), 0) / bucket.length;
        break;
      case 'min':
        value = Math.min(...bucket.map(item => typeof item === 'number' ? item : item.y));
        break;
      case 'max':
        value = Math.max(...bucket.map(item => typeof item === 'number' ? item : item.y));
        break;
      case 'first':
        value = bucket[0];
        break;
      case 'last':
        value = bucket[bucket.length - 1];
        break;
      default:
        value = bucket[0];
    }

    downsampled.push(typeof data[0] === 'number' ? value : { ...bucket[0], y: value });
  }

  return downsampled;
}

/**
 * Crée une configuration Chart.js optimisée pour les performances
 * @param {Object} baseConfig - Configuration de base
 * @returns {Object} - Configuration optimisée
 */
export function getOptimizedChartConfig(baseConfig = {}) {
  return {
    ...baseConfig,
    options: {
      ...baseConfig.options,
      // Désactiver les animations pour les gros datasets
      animation: {
        duration: baseConfig.datasets?.[0]?.data?.length > 50 ? 0 : 400
      },
      // Optimisations de performance
      responsive: true,
      maintainAspectRatio: false,
      // Désactiver les interactions coûteuses
      hover: {
        mode: 'nearest',
        intersect: false,
        animationDuration: 0
      },
      // Optimiser les tooltips
      plugins: {
        ...baseConfig.options?.plugins,
        tooltip: {
          ...baseConfig.options?.plugins?.tooltip,
          enabled: true,
          mode: 'nearest',
          intersect: false,
          // Calculer les tooltips seulement quand nécessaire
          callbacks: baseConfig.options?.plugins?.tooltip?.callbacks || {}
        },
        legend: {
          ...baseConfig.options?.plugins?.legend,
          // Désactiver les clics sur la légende si pas nécessaire
          onClick: baseConfig.options?.plugins?.legend?.onClick || null
        }
      },
      // Échelles optimisées
      scales: {
        ...baseConfig.options?.scales,
        x: {
          ...baseConfig.options?.scales?.x,
          // Limiter le nombre de ticks affichés
          ticks: {
            ...baseConfig.options?.scales?.x?.ticks,
            maxTicksLimit: 10,
            autoSkip: true,
            autoSkipPadding: 15
          }
        },
        y: {
          ...baseConfig.options?.scales?.y,
          ticks: {
            ...baseConfig.options?.scales?.y?.ticks,
            maxTicksLimit: 8
          }
        }
      },
      // Désactiver le resize observer si pas nécessaire
      resizeDelay: 50
    }
  };
}

/**
 * Lazy loading de graphique - Ne rend que quand visible
 */
export class LazyChart {
  constructor(canvasId, config) {
    this.canvasId = canvasId;
    this.config = config;
    this.chart = null;
    this.observer = null;
  }

  init() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      console.error(`Canvas ${this.canvasId} non trouvé`);
      return;
    }

    // Observer l'intersection
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.chart) {
          this.render();
          this.observer.disconnect();
        }
      });
    }, {
      rootMargin: '50px' // Charger 50px avant d'être visible
    });

    this.observer.observe(canvas);
  }

  render() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas || this.chart) return;

    // Charger Chart.js dynamiquement si pas déjà chargé
    if (typeof Chart === 'undefined') {
      console.error('Chart.js pas chargé');
      return;
    }

    // Créer le graphique
    const optimizedConfig = getOptimizedChartConfig(this.config);
    this.chart = new Chart(canvas, optimizedConfig);

    console.log(`📊 Graphique ${this.canvasId} rendu`);
  }

  update(newData) {
    if (this.chart) {
      this.chart.data = newData;
      this.chart.update('none'); // Update sans animation
    }
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Gestionnaire de graphiques avec limitation de points
 */
export class ChartManager {
  constructor(maxPoints = 100) {
    this.maxPoints = maxPoints;
    this.charts = new Map();
  }

  /**
   * Crée un graphique avec données optimisées
   */
  createChart(canvasId, config, lazy = false) {
    // Optimiser les datasets
    if (config.data && config.data.datasets) {
      config.data.datasets = config.data.datasets.map(dataset => ({
        ...dataset,
        data: downsampleData(dataset.data, this.maxPoints, 'average')
      }));
    }

    if (lazy) {
      const lazyChart = new LazyChart(canvasId, config);
      lazyChart.init();
      this.charts.set(canvasId, lazyChart);
      return lazyChart;
    } else {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return null;

      const optimizedConfig = getOptimizedChartConfig(config);
      const chart = new Chart(canvas, optimizedConfig);
      this.charts.set(canvasId, chart);
      return chart;
    }
  }

  /**
   * Met à jour un graphique existant
   */
  updateChart(canvasId, newData) {
    const chart = this.charts.get(canvasId);
    if (!chart) return;

    if (chart instanceof LazyChart) {
      chart.update(newData);
    } else {
      // Optimiser les données
      if (newData.datasets) {
        newData.datasets = newData.datasets.map(dataset => ({
          ...dataset,
          data: downsampleData(dataset.data, this.maxPoints, 'average')
        }));
      }

      chart.data = newData;
      chart.update('none');
    }
  }

  /**
   * Détruit un graphique
   */
  destroyChart(canvasId) {
    const chart = this.charts.get(canvasId);
    if (chart) {
      if (chart instanceof LazyChart) {
        chart.destroy();
      } else {
        chart.destroy();
      }
      this.charts.delete(canvasId);
    }
  }

  /**
   * Détruit tous les graphiques
   */
  destroyAll() {
    this.charts.forEach((chart, canvasId) => {
      this.destroyChart(canvasId);
    });
  }
}

/**
 * Algorithme LTTB (Largest Triangle Three Buckets)
 * Downsampling intelligent pour les séries temporelles
 * @param {Array} data - Données [{x, y}]
 * @param {number} threshold - Nombre de points souhaités
 * @returns {Array} - Données downsampled
 */
export function lttbDownsample(data, threshold) {
  if (data.length <= threshold) {
    return data;
  }

  const sampled = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Toujours garder le premier point
  sampled.push(data[0]);

  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    let avgX = 0;
    let avgY = 0;

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }

    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

    const pointAX = data[sampled.length - 1].x;
    const pointAY = data[sampled.length - 1].y;

    let maxArea = -1;
    let maxAreaPoint;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const area = Math.abs(
        (pointAX - avgX) * (data[j].y - pointAY) -
        (pointAX - data[j].x) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[j];
      }
    }

    sampled.push(maxAreaPoint);
  }

  // Toujours garder le dernier point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Crée un graphique responsive avec auto-resize
 */
export function createResponsiveChart(containerId, config) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  // Créer le canvas
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  // Observer les changements de taille
  const resizeObserver = new ResizeObserver(() => {
    if (chart) {
      chart.resize();
    }
  });

  resizeObserver.observe(container);

  // Créer le graphique
  const optimizedConfig = getOptimizedChartConfig(config);
  const chart = new Chart(canvas, optimizedConfig);

  // Nettoyer lors de la destruction
  chart._resizeObserver = resizeObserver;
  const originalDestroy = chart.destroy.bind(chart);
  chart.destroy = function() {
    resizeObserver.disconnect();
    originalDestroy();
  };

  return chart;
}

export default {
  downsampleData,
  getOptimizedChartConfig,
  LazyChart,
  ChartManager,
  lttbDownsample,
  createResponsiveChart
};
