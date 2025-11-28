/**
 * Controller pour la page Detail T45
 * @module pages/detail-t45-controller
 *
 * Cette page gère la liste des TRAVAUX EN ESPACE CLOS
 */

import { loadEspaceClosData, renderEspaceClosTable } from '../data/espace-clos-data.js';

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
    console.log('[DETAIL-T45] Initialisation de la page...');

    try {
        // Charger les données d'espace clos depuis le serveur
        await loadEspaceClosData();

        // Rendre le tableau
        renderEspaceClosTable();

        pageState.isInitialized = true;
        console.log('[DETAIL-T45] Page initialisee avec succes');

    } catch (error) {
        console.error('[DETAIL-T45] Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de la page');
    }
}

/**
 * Nettoyage avant de quitter la page
 * Cette fonction est appelée automatiquement par page-loader.js
 */
export function cleanup() {
    console.log('[DETAIL-T45] Nettoyage de la page...');
    pageState.isInitialized = false;
}

/**
 * Force un rafraîchissement de la page
 * Utile pour les mises à jour en temps réel via Socket.io
 */
export async function refresh() {
    console.log('[DETAIL-T45] Rafraîchissement de la page...');
    await loadEspaceClosData();
    renderEspaceClosTable();
}
