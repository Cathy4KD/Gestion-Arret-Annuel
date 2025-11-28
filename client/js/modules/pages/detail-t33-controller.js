/**
 * Controller pour la page Detail T33
 * @module pages/detail-t33-controller
 *
 * Cette page gère la PRIORISATION DES DEMANDES GENEREES
 */

import { loadT33Data, renderT33Table } from '../data/t33-priorisation-data.js';

/**
 * Etat local de la page
 */
let pageState = {
    isInitialized: false
};

/**
 * Initialise la page et charge les donnees
 * Cette fonction est appelee automatiquement par page-loader.js
 */
export async function init() {
    console.log('[DETAIL-T33] Initialisation de la page...');

    try {
        // Charger les donnees de priorisation depuis le serveur
        await loadT33Data();

        // Rendre le tableau
        renderT33Table();

        pageState.isInitialized = true;
        console.log('[DETAIL-T33] Page initialisee avec succes');

    } catch (error) {
        console.error('[DETAIL-T33] Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de la page');
    }
}

/**
 * Nettoyage avant de quitter la page
 * Cette fonction est appelee automatiquement par page-loader.js
 */
export function cleanup() {
    console.log('[DETAIL-T33] Nettoyage de la page...');
    pageState.isInitialized = false;
}

/**
 * Force un rafraichissement de la page
 * Utile pour les mises a jour en temps reel via Socket.io
 */
export async function refresh() {
    console.log('[DETAIL-T33] Rafraichissement de la page...');
    await loadT33Data();
    renderT33Table();
}
