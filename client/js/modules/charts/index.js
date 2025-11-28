/**
 * @fileoverview Point d'entrée du module Charts
 * @module charts
 *
 * @description
 * Module centralisé pour tous les graphiques de l'application
 * Utilise Chart.js pour les visualisations
 *
 * @requires ./charts
 */

import * as charts from './charts.js';
import * as dashboardCharts from './dashboard-charts.js';

export function initCharts(arretData) {
    console.log('[STATS] Initialisation des graphiques...');
    charts.createCharts(arretData);
    console.log('[OK] Graphiques initialisés');
}

// Ré-exporter
export {
    charts,
    dashboardCharts
};

export { initDashboardCharts, updateDashboardCharts, destroyDashboardCharts } from './dashboard-charts.js';

export default {
    init: initCharts,
    ...charts,
    ...dashboardCharts
};
