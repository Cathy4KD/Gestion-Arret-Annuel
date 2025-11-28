/**
 * @fileoverview Point d'entrée du module Entities
 * @module entities
 *
 * @description
 * Module centralisé pour gérer toutes les entités de l'arrêt annuel:
 * - Équipe de gestion (team)
 * - Entrepreneurs
 * - VPO (Verrouillage Points Opérationnels)
 * - Espaces Clos
 * - Tours de Refroidissement
 * - Contacts
 *
 * @requires ./team
 * @requires ./entrepreneurs
 */

import * as team from './team.js';
import * as entrepreneurs from './entrepreneurs.js';

/**
 * Initialise tous les modules d'entités
 * @returns {void}
 */
export function initEntities() {
    console.log(' Initialisation des modules Entities...');

    // Charger toutes les entités
    team.loadTeamData();
    entrepreneurs.loadEntrepreneurData();

    console.log('[OK] Modules Entities initialisés');
}

// Ré-exporter tous les modules
export {
    team,
    entrepreneurs
};

/**
 * Exporte toutes les entités vers Excel (fichier consolidé)
 * @returns {void}
 */
export function exportAllEntitiesToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();

    // Exporter équipe
    const teamData = team.getTeamData();
    if (teamData && teamData.length > 0) {
        const teamSheet = XLSX.utils.json_to_sheet(teamData);
        XLSX.utils.book_append_sheet(wb, teamSheet, 'Équipe');
    }

    // Exporter entrepreneurs
    const entData = entrepreneurs.getEntrepreneurData();
    if (entData && entData.length > 0) {
        const entSheet = XLSX.utils.json_to_sheet(entData);
        XLSX.utils.book_append_sheet(wb, entSheet, 'Entrepreneurs');
    }

    const fileName = `Toutes_Entites_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(` Fichier consolidé exporté: ${fileName}`);
}

// Export par défaut
export default {
    init: initEntities,
    team,
    entrepreneurs,
    exportAllEntitiesToExcel
};
