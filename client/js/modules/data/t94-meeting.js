/**
 * @fileoverview Gestion des rencontres GAZ CO (t94)
 * @module data/t94-meeting
 */

import { MeetingManager } from './generic-meeting-manager.js';

const t94Manager = new MeetingManager(
    't94RencontresData',
    'rencontresListContainer-t94',
    't94TableBody',
    't94DocumentsList'
);

export async function loadT94Data() {
    await t94Manager.loadData();
}

export function setT94Data(data) {
    if (data && Array.isArray(data)) {
        t94Manager.rencontres = data;
        console.log(`[T94] Données injectées: ${data.length} rencontre(s)`);
    }

    if (document.getElementById('rencontresListContainer-t94')) {
        t94Manager.renderRencontresList();
        if (t94Manager.rencontres.length > 0 && !t94Manager.currentRencontreId) {
            t94Manager.selectRencontre(t94Manager.rencontres[0].id);
        }
    }
}

if (typeof window !== 'undefined') {
    window.setT94Data = setT94Data;

    window.t94Actions = {
        addNewRencontre: () => t94Manager.addNewRencontre(),
        selectRencontre: (id) => t94Manager.selectRencontre(id),
        deleteRencontre: (id) => t94Manager.deleteRencontre(id),
        updateRencontreTitre: (titre) => t94Manager.updateRencontreTitre(titre),
        saveData: () => t94Manager.saveCurrentRencontre(),
        addTravail: () => t94Manager.addTravail(),
        updateTravailField: (id, field, value) => t94Manager.updateTravailField(id, field, value),
        deleteTravail: (id) => t94Manager.deleteTravail(id),
        addDocument: () => t94Manager.addDocument(),
        deleteDocument: (id) => t94Manager.deleteDocument(id)
    };

    window.meetingActions = window.meetingActions || {};
    window.meetingActions['t94RencontresData'] = window.t94Actions;
}
