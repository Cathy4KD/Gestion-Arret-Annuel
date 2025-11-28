/**
 * @fileoverview Module de gestion des Contacts
 * @module data/contacts-manager
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

let contactsData = {
    contacts: [],
    codesExternes: []
};

/**
 * Charge les données des contacts
 */
export async function loadContactsData() {
    const saved = await loadFromStorage('contactsData');
    if (saved) {
        contactsData = saved;
        console.log('[CONTACTS] Données chargées');
    } else {
        contactsData = { contacts: [], codesExternes: [] };
    }

    renderContactsTable();
    renderCodesExternesTable();
}

/**
 * Sauvegarde les données des contacts
 */
async function saveContactsData() {
    await saveToStorage('contactsData', contactsData);
    console.log('[CONTACTS] Données sauvegardées');
}

/**
 * Rend le tableau des contacts
 * @param {string} searchTerm - Terme de recherche (optionnel)
 */
function renderContactsTable(searchTerm = '') {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;

    if (contactsData.contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #999;">Aucun contact. Cliquez sur "Ajouter un contact".</td></tr>';
        return;
    }

    // Filtrer les contacts si un terme de recherche est fourni
    const filteredContacts = searchTerm
        ? contactsData.contacts.filter(contact => {
            const search = searchTerm.toLowerCase();
            return (contact.nom || '').toLowerCase().includes(search) ||
                   (contact.code || '').toLowerCase().includes(search) ||
                   (contact.entreprise || '').toLowerCase().includes(search);
        })
        : contactsData.contacts;

    tbody.innerHTML = '';

    if (filteredContacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #999;">Aucun résultat pour "' + searchTerm + '".</td></tr>';
        return;
    }

    filteredContacts.forEach((contact, displayIndex) => {
        // Trouver l'index réel dans le tableau complet
        const realIndex = contactsData.contacts.indexOf(contact);
        const row = document.createElement('tr');
        row.style.background = displayIndex % 2 === 0 ? 'white' : '#f8f9fa';
        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${contact.nom || ''}" onchange="updateContactField(${realIndex}, 'nom', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${contact.adresse || ''}" onchange="updateContactField(${realIndex}, 'adresse', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${contact.code || ''}" onchange="updateContactField(${realIndex}, 'code', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${contact.entreprise || ''}" onchange="updateContactField(${realIndex}, 'entreprise', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${contact.cas || ''}" onchange="updateContactField(${realIndex}, 'cas', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="deleteContact(${realIndex})" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Rend le tableau des codes externes
 * @param {string} searchTerm - Terme de recherche (optionnel)
 */
function renderCodesExternesTable(searchTerm = '') {
    const tbody = document.getElementById('codeExterneTableBody');
    if (!tbody) return;

    if (contactsData.codesExternes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">Aucun code. Cliquez sur "Ajouter".</td></tr>';
        return;
    }

    // Filtrer les codes externes si un terme de recherche est fourni
    const filteredCodes = searchTerm
        ? contactsData.codesExternes.filter(code => {
            const search = searchTerm.toLowerCase();
            return (code.code || '').toLowerCase().includes(search) ||
                   (code.nom || '').toLowerCase().includes(search);
        })
        : contactsData.codesExternes;

    tbody.innerHTML = '';

    if (filteredCodes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">Aucun résultat pour "' + searchTerm + '".</td></tr>';
        return;
    }

    filteredCodes.forEach((code, displayIndex) => {
        // Trouver l'index réel dans le tableau complet
        const realIndex = contactsData.codesExternes.indexOf(code);
        const row = document.createElement('tr');
        row.style.background = displayIndex % 2 === 0 ? 'white' : '#f8f9fa';
        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${code.code || ''}" onchange="updateCodeExterneField(${realIndex}, 'code', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${code.nom || ''}" onchange="updateCodeExterneField(${realIndex}, 'nom', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="deleteCodeExterne(${realIndex})" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Ajoute un contact (ligne vide)
 */
export function addContact() {
    contactsData.contacts.push({
        nom: '',
        adresse: '',
        code: '',
        entreprise: '',
        cas: ''
    });

    renderContactsTable();
    saveContactsData();
}

/**
 * Met à jour un champ d'un contact
 */
export function updateContactField(index, field, value) {
    if (contactsData.contacts[index]) {
        contactsData.contacts[index][field] = value;
        saveContactsData();
    }
}

/**
 * Supprime un contact
 */
export function deleteContact(index) {
    if (confirm('Supprimer ce contact ?')) {
        contactsData.contacts.splice(index, 1);
        saveContactsData();
        renderContactsTable();
    }
}

/**
 * Ajoute un code externe (ligne vide)
 */
export function addCodeExterne() {
    contactsData.codesExternes.push({
        code: '',
        nom: ''
    });
    renderCodesExternesTable();
    saveContactsData();
}

/**
 * Met à jour un champ d'un code externe
 */
export function updateCodeExterneField(index, field, value) {
    if (contactsData.codesExternes[index]) {
        contactsData.codesExternes[index][field] = value;
        saveContactsData();
    }
}

/**
 * Supprime un code externe
 */
export function deleteCodeExterne(index) {
    if (confirm('Supprimer ce code ?')) {
        contactsData.codesExternes.splice(index, 1);
        saveContactsData();
        renderCodesExternesTable();
    }
}

/**
 * Injecte les données contacts depuis le serveur
 * Appelé par server-sync.js lors de la synchronisation
 * @param {Object} data - Données des contacts
 */
export function setContactsData(data) {
    if (data) {
        contactsData = data;
        console.log('[CONTACTS] Données injectées depuis le serveur:',
            (data.contacts ? data.contacts.length : 0), 'contacts,',
            (data.codesExternes ? data.codesExternes.length : 0), 'codes externes');

        // Rafraîchir l'affichage si on est sur la page contacts
        renderContactsTable();
        renderCodesExternesTable();
    } else {
        contactsData = { contacts: [], codesExternes: [] };
        console.log('[CONTACTS] Aucune donnée reçue du serveur');
    }
}

/**
 * Récupère les codes externes
 * @returns {Array} Liste des codes externes
 */
export function getCodesExternes() {
    return contactsData.codesExternes || [];
}

/**
 * Filtre le tableau des contacts selon la recherche
 */
export function filterContactsTable() {
    const searchInput = document.getElementById('contactsSearchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();
    renderContactsTable(searchTerm);
}

/**
 * Filtre le tableau des codes externes selon la recherche
 */
export function filterCodesExternesTable() {
    const searchInput = document.getElementById('codesExternesSearchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();
    renderCodesExternesTable(searchTerm);
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.loadContactsData = loadContactsData;
    window.addContact = addContact;
    window.updateContactField = updateContactField;
    window.deleteContact = deleteContact;
    window.addCodeExterne = addCodeExterne;
    window.updateCodeExterneField = updateCodeExterneField;
    window.deleteCodeExterne = deleteCodeExterne;
    window.setContactsData = setContactsData;
    window.getCodesExternes = getCodesExternes;
    window.filterContactsTable = filterContactsTable;
    window.filterCodesExternesTable = filterCodesExternesTable;
}

console.log('[CONTACTS] Module chargé');
