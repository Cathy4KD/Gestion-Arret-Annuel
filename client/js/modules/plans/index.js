/**
 * @fileoverview Point d'entrée du module Plans
 * @module plans
 *
 * @description
 * Module centralisé pour gérer les plans d'usine interactifs
 * Permet de placer des équipements sur des plans et de visualiser
 * l'évolution dans le temps
 *
 * @requires ./plan-renderer
 */

import * as planRenderer from './plan-renderer.js';

export function initPlans() {
    console.log(' Initialisation des plans...');
    planRenderer.loadPlanData();
    console.log('[OK] Plans initialisés');
}

// Ré-exporter
export {
    planRenderer
};

export default {
    init: initPlans,
    ...planRenderer
};
