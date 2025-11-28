/**
 * @fileoverview Gestion des données de la Rencontre de Définition
 * @module data/rencontre-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les données de la rencontre
 * @const {string}
 */
const STORAGE_KEY = 'rencontreDefinitionData';

/**
 * Données de la rencontre
 * @type {Object}
 */
let rencontreData = {
    date: '',
    participants: '',
    incendie: '',
    agenda: '',
    notes: ''
};

/**
 * Charge les données de la rencontre depuis localStorage
 * @returns {void}
 */
export async function loadRencontreData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        rencontreData = saved;
        console.log('[RENCONTRE] Données chargées depuis localStorage');

        // Remplir les champs du formulaire
        const dateInput = document.getElementById('rencontre-date');
        const participantsInput = document.getElementById('rencontre-participants');
        const incendieInput = document.getElementById('rencontre-incendie');
        const agendaInput = document.getElementById('rencontre-agenda');
        const notesInput = document.getElementById('rencontre-notes');

        if (dateInput) dateInput.value = rencontreData.date || '';
        if (participantsInput) participantsInput.value = rencontreData.participants || '';
        if (incendieInput) incendieInput.value = rencontreData.incendie || '';
        if (agendaInput) agendaInput.value = rencontreData.agenda || '';
        if (notesInput) notesInput.value = rencontreData.notes || '';
    }
}

/**
 * Sauvegarde les données de la rencontre dans localStorage
 * @returns {void}
 */
export async function saveRencontreData() {
    // Récupérer les valeurs des champs
    const dateInput = document.getElementById('rencontre-date');
    const participantsInput = document.getElementById('rencontre-participants');
    const incendieInput = document.getElementById('rencontre-incendie');
    const agendaInput = document.getElementById('rencontre-agenda');
    const notesInput = document.getElementById('rencontre-notes');

    rencontreData = {
        date: dateInput ? dateInput.value : '',
        participants: participantsInput ? participantsInput.value : '',
        incendie: incendieInput ? incendieInput.value : '',
        agenda: agendaInput ? agendaInput.value : '',
        notes: notesInput ? notesInput.value : ''
    };

    await saveToStorage(STORAGE_KEY, rencontreData);
    console.log('[RENCONTRE] Données sauvegardées et synchronisées avec le serveur');
    alert('✅ Données de la rencontre sauvegardées avec succès !');
}

/**
 * Récupère les données de la rencontre
 * @returns {Object}
 */
export function getRencontreData() {
    return rencontreData;
}
