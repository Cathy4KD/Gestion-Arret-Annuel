/**
 * @fileoverview Gestion des simulations shutdown (t144)
 * @module data/t144-meeting
 */

import { MeetingManager } from './generic-meeting-manager.js';

const t144Manager = new MeetingManager(
    't144RencontresData',
    'rencontresListContainer-t144',
    't144TableBody',
    't144DocumentsList'
);

export async function loadT144Data() {
    await t144Manager.loadData();
}

export function setT144Data(data) {
    if (data && Array.isArray(data)) {
        t144Manager.rencontres = data;
        console.log(`[T144] Données injectées: ${data.length} rencontre(s)`);
    }

    if (document.getElementById('rencontresListContainer-t144')) {
        t144Manager.renderRencontresList();
        if (t144Manager.rencontres.length > 0 && !t144Manager.currentRencontreId) {
            t144Manager.selectRencontre(t144Manager.rencontres[0].id);
        }
    }
}

if (typeof window !== 'undefined') {
    window.setT144Data = setT144Data;

    window.t144Actions = {
        addNewRencontre: () => t144Manager.addNewRencontre(),
        selectRencontre: (id) => t144Manager.selectRencontre(id),
        deleteRencontre: (id) => t144Manager.deleteRencontre(id),
        updateRencontreTitre: (titre) => t144Manager.updateRencontreTitre(titre),
        saveData: () => t144Manager.saveCurrentRencontre(),
        addTravail: () => t144Manager.addTravail(),
        updateTravailField: (id, field, value) => t144Manager.updateTravailField(id, field, value),
        deleteTravail: (id) => t144Manager.deleteTravail(id),
        addDocument: () => t144Manager.addDocument(),
        deleteDocument: (id) => t144Manager.deleteDocument(id)
    };

    window.meetingActions = window.meetingActions || {};
    window.meetingActions['t144RencontresData'] = window.t144Actions;
}
