/**
 * @fileoverview Point d'entrée du module Demandes
 * @module demandes
 *
 * @description
 * Module centralisé pour gérer toutes les demandes liées à l'arrêt annuel:
 * - Demandes de verrouillage (électrique, mécanique)
 * - Demandes de grues et nacelles
 * - Demandes d'échafaudages
 *
 * Chaque sous-module gère son propre cycle de vie (CRUD + export Excel)
 *
 * @requires ./verrouillage
 * @requires ./grues-nacelles
 * @requires ./echafaudages
 */

// Imports des sous-modules
import * as verrouillage from './verrouillage.js';
import * as gruesNacelles from './grues-nacelles.js';
import * as echafaudages from './echafaudages.js';

/**
 * Initialise tous les modules de demandes
 * @returns {void}
 */
export function initDemandes() {
    console.log('[DEMANDES] Initialisation des modules Demandes...');

    // Charger toutes les demandes
    verrouillage.loadDemandesVerrouillage();
    gruesNacelles.loadDemandesGruesNacelles();
    echafaudages.loadDemandesEchafaudages();

    console.log('[OK] Modules Demandes initialises');
}

// Ré-exporter toutes les fonctions pour faciliter l'accès
export {
    // Verrouillage
    verrouillage,

    // Grues et Nacelles
    gruesNacelles,

    // Échafaudages
    echafaudages
};

/**
 * Exporte toutes les demandes vers Excel (fichier consolidé)
 * @returns {void}
 */
export function exportAllDemandesToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliotheque XLSX non chargee');
        return;
    }

    const wb = XLSX.utils.book_new();

    // Exporter verrouillage
    const verrData = verrouillage.getDemandesVerrouillageData();
    if (verrData.length > 0) {
        const verrSheet = XLSX.utils.json_to_sheet(verrData);
        XLSX.utils.book_append_sheet(wb, verrSheet, 'Verrouillage');
    }

    // Exporter grues/nacelles
    const gruesData = gruesNacelles.getDemandesGruesNacellesData();
    if (gruesData.length > 0) {
        const gruesSheet = XLSX.utils.json_to_sheet(gruesData);
        XLSX.utils.book_append_sheet(wb, gruesSheet, 'Grues-Nacelles');
    }

    // Exporter échafaudages
    const echData = echafaudages.getDemandesEchafaudagesData();
    if (echData.length > 0) {
        const echSheet = XLSX.utils.json_to_sheet(echData);
        XLSX.utils.book_append_sheet(wb, echSheet, 'Echafaudages');
    }

    // Télécharger
    const fileName = 'Toutes_Demandes_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    console.log('[EXPORT] Fichier consolide exporte: ' + fileName);
}

/**
 * Obtient les statistiques globales de toutes les demandes
 * @returns {Object} Statistiques consolidées
 */
export function getGlobalStats() {
    const verrData = verrouillage.getDemandesVerrouillageData();
    const gruesData = gruesNacelles.getDemandesGruesNacellesData();
    const echData = echafaudages.getDemandesEchafaudagesData();

    return {
        totalDemandes: verrData.length + gruesData.length + echData.length,
        verrouillage: verrData.length,
        gruesNacelles: gruesData.length,
        echafaudages: echData.length,
        byStatut: {
            enAttente:
                verrData.filter(d => d.statut === 'En attente').length +
                gruesData.filter(d => d.statut === 'En attente').length +
                echData.filter(d => d.statut === 'En attente').length,
            approuvees:
                verrData.filter(d => d.statut === 'Approuvee').length +
                gruesData.filter(d => d.statut === 'Approuvee').length +
                echData.filter(d => d.statut === 'Approuvee').length
        }
    };
}

// Export par défaut
export default {
    init: initDemandes,
    verrouillage,
    gruesNacelles,
    echafaudages,
    exportAllDemandesToExcel,
    getGlobalStats
};
