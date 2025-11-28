/**
 * @fileoverview Consommables data management module
 * Gestion des données de consommables / Consumables management (T90)
 * Source: lignes 21577-21650
 * @module consommables-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Global consommables data array
 * Tableau global des données de consommables
 * @type {Array<Object>}
 */
export let consommablesData = [];

/**
 * Set consommables data
 * Définit les données de consommables
 *
 * @param {Array<Object>} data - New data / Nouvelles données
 *
 * @example
 * setConsommablesData([{item: 'Gants', ...}]);
 */
export function setConsommablesData(data) {
    consommablesData = Array.isArray(data) ? data : [];
    console.log(`[CONSOMMABLES] ✅ Données injectées: ${consommablesData.length} éléments`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setConsommablesData = setConsommablesData;
}

/**
 * Load consommables data from server
 * Charge les données de consommables depuis le serveur
 * Source: lignes 21579-21590
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await loadConsommablesData();
 */
export async function loadConsommablesData() {
    const saved = await loadFromStorage('consommablesData');
    if (saved && Array.isArray(saved)) {
        consommablesData = saved;
        console.log('[OK] Données Consommables chargées');
        renderConsommablesTable();
        return true;
    }
    consommablesData = [];
    renderConsommablesTable();
    return false;
}

/**
 * Save consommables data to server
 * Sauvegarde les données de consommables sur le serveur
 * Source: lignes 21592-21599
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await saveConsommablesData();
 */
export async function saveConsommablesData() {
    const success = await saveToStorage('consommablesData', consommablesData);
    if (success) {
        console.log('[SAVE] Données Consommables sauvegardées');
    }
    return success;
}

/**
 * Render consommables table
 * Affiche le tableau des consommables
 * Source: lignes 21601-21632
 *
 * @example
 * renderConsommablesTable();
 */
export function renderConsommablesTable() {
    const tbody = document.getElementById('consommablesTableBody');
    if (!tbody) {
        console.warn('[WARNING] Element consommablesTableBody non trouvé');
        return;
    }

    tbody.innerHTML = '';

    if (!Array.isArray(consommablesData) || consommablesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">Aucun consommable défini.</td></tr>';
        return;
    }

    consommablesData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${row.item || ''}" onchange="updateConsommableField(${index}, 'item', this.value)" style="width:100%;"></td>
            <td><input type="number" value="${row.quantite || ''}" onchange="updateConsommableField(${index}, 'quantite', this.value)" style="width:100%;"></td>
            <td><input type="text" value="${row.fournisseur || ''}" onchange="updateConsommableField(${index}, 'fournisseur', this.value)" style="width:100%;"></td>
            <td><input type="date" value="${row.dateCommande || ''}" onchange="updateConsommableField(${index}, 'dateCommande', this.value)" style="width:100%;"></td>
            <td><input type="date" value="${row.dateLivraison || ''}" onchange="updateConsommableField(${index}, 'dateLivraison', this.value)" style="width:100%;"></td>
            <td>
                <select onchange="updateConsommableField(${index}, 'statut', this.value)" style="width:100%;">
                    <option value="À commander" ${row.statut === 'À commander' ? 'selected' : ''}>À commander</option>
                    <option value="Commandé" ${row.statut === 'Commandé' ? 'selected' : ''}>Commandé</option>
                    <option value="Reçu" ${row.statut === 'Reçu' ? 'selected' : ''}>Reçu</option>
                    <option value="En retard" ${row.statut === 'En retard' ? 'selected' : ''}>En retard</option>
                </select>
            </td>
            <td><button onclick="deleteConsommableRow(${index})" style="padding: 5px 10px; background: #c5554a; color: white; border: none; border-radius: 5px; cursor: pointer;">[DELETE]</button></td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Add new consommable row
 * Ajoute une nouvelle ligne de consommable
 * Source: lignes 21634-21638
 *
 * @example
 * addConsommableRow();
 */
export function addConsommableRow() {
    consommablesData.push({});
    renderConsommablesTable();
    saveConsommablesData();
}

/**
 * Delete consommable row
 * Supprime une ligne de consommable
 * Source: lignes 21640-21646
 *
 * @param {number} index - Row index / Index de la ligne
 *
 * @example
 * deleteConsommableRow(0);
 */
export function deleteConsommableRow(index) {
    if (confirm('Supprimer cette ligne ?')) {
        consommablesData.splice(index, 1);
        renderConsommablesTable();
        saveConsommablesData();
    }
}

/**
 * Update consommable field
 * Met à jour un champ de consommable
 * Source: lignes 21648-21650
 *
 * @param {number} index - Row index / Index de la ligne
 * @param {string} field - Field name / Nom du champ
 * @param {*} value - New value / Nouvelle valeur
 *
 * @example
 * updateConsommableField(0, 'item', 'Gants de protection');
 */
export function updateConsommableField(index, field, value) {
    consommablesData[index][field] = value;
    saveConsommablesData();
}

/**
 * Get consommables data
 * Obtient les données de consommables
 *
 * @returns {Array<Object>} Consommables data / Données de consommables
 *
 * @example
 * const data = getConsommablesData();
 */
export function getConsommablesData() {
    return consommablesData;
}

/**
 * Clear consommables data
 * Efface toutes les données de consommables
 *
 * @example
 * clearConsommablesData();
 */
export function clearConsommablesData() {
    consommablesData = [];
    saveConsommablesData();
    renderConsommablesTable();
}

/**
 * Get consommables by status
 * Obtient les consommables par statut
 *
 * @param {string} statut - Status to filter / Statut à filtrer
 * @returns {Array<Object>} Filtered consommables / Consommables filtrés
 *
 * @example
 * const enRetard = getConsommablesByStatus('En retard');
 */
export function getConsommablesByStatus(statut) {
    return consommablesData.filter(item => item.statut === statut);
}

/**
 * Get late deliveries
 * Obtient les livraisons en retard
 *
 * @returns {Array<Object>} Late deliveries / Livraisons en retard
 *
 * @example
 * const retards = getLateDeliveries();
 */
export function getLateDeliveries() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return consommablesData.filter(item => {
        if (!item.dateLivraison || item.statut === 'Reçu') return false;
        const deliveryDate = new Date(item.dateLivraison);
        return deliveryDate < today;
    });
}
