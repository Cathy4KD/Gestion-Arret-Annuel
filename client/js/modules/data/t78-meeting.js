/**
 * @fileoverview Gestion des rencontres pré-arrêt (t78)
 * @module data/t78-meeting
 */

import { MeetingManager } from './generic-meeting-manager.js';

// Créer l'instance pour les rencontres pré-arrêt
const t78Manager = new MeetingManager(
    't78RencontresData',
    'rencontresListContainer-t78',
    't78TableBody',
    't78DocumentsList'
);

/**
 * Charge les données
 */
export async function loadT78Data() {
    await t78Manager.loadData();
}

/**
 * Setter pour injection depuis le serveur
 */
export function setT78Data(data) {
    if (data && Array.isArray(data)) {
        t78Manager.rencontres = data;
        console.log(`[T78] Données injectées: ${data.length} rencontre(s)`);
    }

    if (document.getElementById('rencontresListContainer-t78')) {
        t78Manager.renderRencontresList();
        if (t78Manager.rencontres.length > 0 && !t78Manager.currentRencontreId) {
            t78Manager.selectRencontre(t78Manager.rencontres[0].id);
        }
    }
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.setT78Data = setT78Data;

    window.t78Actions = {
        addNewRencontre: () => t78Manager.addNewRencontre(),
        selectRencontre: (id) => t78Manager.selectRencontre(id),
        deleteRencontre: (id) => t78Manager.deleteRencontre(id),
        updateRencontreTitre: (titre) => t78Manager.updateRencontreTitre(titre),
        saveData: () => t78Manager.saveCurrentRencontre(),
        addTravail: () => t78Manager.addTravail(),
        updateTravailField: (id, field, value) => t78Manager.updateTravailField(id, field, value),
        deleteTravail: (id) => t78Manager.deleteTravail(id),
        addDocument: () => t78Manager.addDocument(),
        deleteDocument: (id) => t78Manager.deleteDocument(id)
    };

    // Pour compatibilité avec le système générique
    window.meetingActions = window.meetingActions || {};
    window.meetingActions['t78RencontresData'] = window.t78Actions;
}
