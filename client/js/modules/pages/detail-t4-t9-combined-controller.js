/**
 * Controller pour la page Detail T4 T9 Combined
 * @module pages/detail-t4-t9-combined-controller
 *
 * Cette page gère les PROJETS / TRAVAUX MAJEURS et les MAINTENANCES CAPITALISABLES
 */

import { loadProjetsData, renderProjetsTable } from '../data/projets-data.js';
import { loadMaintenancesCapitalisablesData, renderMaintenancesCapitalisablesTable } from '../data/maintenances-capitalisables-data.js';

/**
 * État local de la page
 */
let pageState = {
    isInitialized: false
};

/**
 * Initialise la page et charge les données
 * Cette fonction est appelée automatiquement par page-loader.js
 */
export async function init() {
    console.log('[DETAIL-T4-T9-COMBINED] Initialisation de la page...');

    try {
        // Charger les données des projets et maintenances capitalisables depuis le serveur
        await loadProjetsData();
        await loadMaintenancesCapitalisablesData();

        // Rendre les tableaux
        renderProjetsTable();
        renderMaintenancesCapitalisablesTable();

        pageState.isInitialized = true;
        console.log('[DETAIL-T4-T9-COMBINED] Page initialisee avec succes');

    } catch (error) {
        console.error('[DETAIL-T4-T9-COMBINED] Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de la page');
    }
}

/**
 * Nettoyage avant de quitter la page
 * Cette fonction est appelée automatiquement par page-loader.js
 */
export function cleanup() {
    console.log('[DETAIL-T4-T9-COMBINED] Nettoyage de la page...');
    pageState.isInitialized = false;
}

/**
 * Force un rafraîchissement de la page
 * Utile pour les mises à jour en temps réel via Socket.io
 */
export async function refresh() {
    console.log('[DETAIL-T4-T9-COMBINED] Rafraîchissement de la page...');
    await loadProjetsData();
    await loadMaintenancesCapitalisablesData();
    renderProjetsTable();
    renderMaintenancesCapitalisablesTable();
}
