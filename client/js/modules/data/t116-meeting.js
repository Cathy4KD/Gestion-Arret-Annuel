/**
 * @fileoverview Gestion des revues échéancier entrepreneurs (t116)
 * @module data/t116-meeting
 */

import { MeetingManager } from './generic-meeting-manager.js';

const t116Manager = new MeetingManager(
    't116RencontresData',
    'rencontresListContainer-t116',
    't116TableBody',
    't116DocumentsList'
);

export async function loadT116Data() {
    await t116Manager.loadData();
}

export function setT116Data(data) {
    if (data && Array.isArray(data)) {
        t116Manager.rencontres = data;
        console.log(`[T116] Données injectées: ${data.length} rencontre(s)`);
    }

    if (document.getElementById('rencontresListContainer-t116')) {
        t116Manager.renderRencontresList();
        if (t116Manager.rencontres.length > 0 && !t116Manager.currentRencontreId) {
            t116Manager.selectRencontre(t116Manager.rencontres[0].id);
        }
    }
}

if (typeof window !== 'undefined') {
    window.setT116Data = setT116Data;

    window.t116Actions = {
        addNewRencontre: () => t116Manager.addNewRencontre(),
        selectRencontre: (id) => t116Manager.selectRencontre(id),
        deleteRencontre: (id) => t116Manager.deleteRencontre(id),
        updateRencontreTitre: (titre) => t116Manager.updateRencontreTitre(titre),
        saveData: () => t116Manager.saveCurrentRencontre(),
        addTravail: () => t116Manager.addTravail(),
        updateTravailField: (id, field, value) => t116Manager.updateTravailField(id, field, value),
        deleteTravail: (id) => t116Manager.deleteTravail(id),
        addDocument: () => t116Manager.addDocument(),
        deleteDocument: (id) => t116Manager.deleteDocument(id)
    };

    window.meetingActions = window.meetingActions || {};
    window.meetingActions['t116RencontresData'] = window.t116Actions;
}
