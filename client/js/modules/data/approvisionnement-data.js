/**
 * @fileoverview Approvisionnement data management module
 * Gestion des données d'approvisionnement / Supply strategy management
 * Source: lignes 21498-21575
 * @module approvisionnement-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Global approvisionnement data array
 * Tableau global des données d'approvisionnement
 * @type {Array<Object>}
 */
export let approvisionnementData = [];

/**
 * Set approvisionnement data
 * Définit les données d'approvisionnement
 *
 * @param {Array<Object>} data - New data / Nouvelles données
 *
 * @example
 * setApprovisionnementData([{fournisseur: 'ABC', ...}]);
 */
export function setApprovisionnementData(data) {
    // S'assurer que data est bien un tableau
    approvisionnementData = Array.isArray(data) ? data : [];
    console.log(`[APPROVISIONNEMENT] ✅ Données injectées: ${approvisionnementData.length} éléments`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setApprovisionnementData = setApprovisionnementData;
}

/**
 * Load approvisionnement data from server
 * Charge les données d'approvisionnement depuis le serveur
 * Source: lignes 21500-21511
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await loadApprovisionnementData();
 */
export async function loadApprovisionnementData() {
    const saved = await loadFromStorage('approvisionnementData');
    if (saved && Array.isArray(saved)) {
        approvisionnementData = saved;
        console.log('[OK] Données Approvisionnement chargées');
        renderApprovisionnementTable();
        return true;
    }
    // Initialiser comme tableau vide si pas de données
    approvisionnementData = [];
    renderApprovisionnementTable();
    return false;
}

/**
 * Save approvisionnement data to server
 * Sauvegarde les données d'approvisionnement sur le serveur
 * Source: lignes 21513-21520
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await saveApprovisionnementData();
 */
export async function saveApprovisionnementData() {
    const success = await saveToStorage('approvisionnementData', approvisionnementData);
    if (success) {
        console.log('[SAVE] Données Approvisionnement sauvegardées');
    }
    return success;
}

/**
 * Render approvisionnement table
 * Affiche le tableau d'approvisionnement
 * Source: lignes 21522-21549
 *
 * @example
 * renderApprovisionnementTable();
 */
export function renderApprovisionnementTable() {
    const tbody = document.getElementById('approvisionnementTableBody');
    if (!tbody) {
        console.warn('[WARNING] Element approvisionnementTableBody non trouvé');
        return;
    }

    tbody.innerHTML = '';

    // Vérification que approvisionnementData est bien un tableau
    if (!Array.isArray(approvisionnementData) || approvisionnementData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #999;">Aucune stratégie d\'approvisionnement définie.</td></tr>';
        return;
    }

    approvisionnementData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${row.fournisseur || ''}" onchange="updateApprovisionnementField(${index}, 'fournisseur', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td><input type="text" value="${row.typeTravaux || ''}" onchange="updateApprovisionnementField(${index}, 'typeTravaux', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td><textarea
                    id="justification-${index}"
                    onchange="updateApprovisionnementField(${index}, 'justification', this.value)"
                    oninput="window.autoResizeTextarea(this)"
                    style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 60px; resize: vertical; overflow: hidden; font-family: inherit;">${row.justification || ''}</textarea></td>
            <td><input type="number" value="${row.estime || ''}" onchange="updateApprovisionnementField(${index}, 'estime', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td class="history-col" style="display: none;"><input type="number" value="${row.estime2021 || ''}" onchange="updateApprovisionnementField(${index}, 'estime2021', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td class="history-col" style="display: none;"><input type="number" value="${row.estime2022 || ''}" onchange="updateApprovisionnementField(${index}, 'estime2022', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td class="history-col" style="display: none;"><input type="number" value="${row.estime2023 || ''}" onchange="updateApprovisionnementField(${index}, 'estime2023', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td class="history-col" style="display: none;"><input type="number" value="${row.estime2024 || ''}" onchange="updateApprovisionnementField(${index}, 'estime2024', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td class="history-col" style="display: none;"><input type="number" value="${row.estime2025 || ''}" onchange="updateApprovisionnementField(${index}, 'estime2025', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
            <td><button onclick="deleteApprovisionnementRow(${index})" style="padding: 5px 10px; background: #c5554a; color: white; border: none; border-radius: 5px; cursor: pointer;">[DELETE]</button></td>
        `;
        tbody.appendChild(tr);

        // Auto-resize le textarea après l'avoir ajouté au DOM
        setTimeout(() => {
            const textarea = document.getElementById(`justification-${index}`);
            if (textarea && window.autoResizeTextarea) {
                window.autoResizeTextarea(textarea);
            }
        }, 0);
    });
}

/**
 * Add new approvisionnement row
 * Ajoute une nouvelle ligne d'approvisionnement
 * Source: lignes 21551-21555
 *
 * @example
 * addApprovisionnementRow();
 */
export function addApprovisionnementRow() {
    approvisionnementData.push({});
    renderApprovisionnementTable();
    saveApprovisionnementData();
}

/**
 * Delete approvisionnement row
 * Supprime une ligne d'approvisionnement
 * Source: lignes 21557-21563
 *
 * @param {number} index - Row index / Index de la ligne
 *
 * @example
 * deleteApprovisionnementRow(0);
 */
export function deleteApprovisionnementRow(index) {
    if (confirm('Supprimer cette ligne ?')) {
        approvisionnementData.splice(index, 1);
        renderApprovisionnementTable();
        saveApprovisionnementData();
    }
}

/**
 * Update approvisionnement field
 * Met à jour un champ d'approvisionnement
 * Source: lignes 21565-21568
 *
 * @param {number} index - Row index / Index de la ligne
 * @param {string} field - Field name / Nom du champ
 * @param {*} value - New value / Nouvelle valeur
 *
 * @example
 * updateApprovisionnementField(0, 'fournisseur', 'ABC Corp');
 */
export function updateApprovisionnementField(index, field, value) {
    approvisionnementData[index][field] = value;
    saveApprovisionnementData();
}

/**
 * Toggle history columns visibility
 * Bascule la visibilité des colonnes historiques
 * Source: lignes 21570-21575
 *
 * @example
 * toggleHistoryColumns();
 */
export function toggleHistoryColumns() {
    const cols = document.querySelectorAll('#approvisionnementTable .history-col');
    cols.forEach(col => {
        col.style.display = col.style.display === 'none' ? '' : 'none';
    });
}

/**
 * Get approvisionnement data
 * Obtient les données d'approvisionnement
 *
 * @returns {Array<Object>} Approvisionnement data / Données d'approvisionnement
 *
 * @example
 * const data = getApprovisionnementData();
 */
export function getApprovisionnementData() {
    return approvisionnementData;
}

/**
 * Clear approvisionnement data
 * Efface toutes les données d'approvisionnement
 *
 * @example
 * clearApprovisionnementData();
 */
export function clearApprovisionnementData() {
    approvisionnementData = [];
    saveApprovisionnementData();
    renderApprovisionnementTable();
}

/**
 * Auto-resize textarea to fit content
 * Redimensionne automatiquement le textarea pour s'adapter au contenu
 *
 * @param {HTMLTextAreaElement} textarea - Le textarea à redimensionner
 *
 * @example
 * autoResizeTextarea(document.getElementById('myTextarea'));
 */
export function autoResizeTextarea(textarea) {
    if (!textarea) return;

    // Réinitialiser la hauteur pour obtenir la vraie hauteur du contenu
    textarea.style.height = 'auto';

    // Calculer la hauteur nécessaire
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 60; // Hauteur minimale en pixels

    // Appliquer la nouvelle hauteur (au moins la hauteur minimale)
    textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
}

// Exposer globalement pour utilisation dans les onclick/oninput/onchange
if (typeof window !== 'undefined') {
    window.autoResizeTextarea = autoResizeTextarea;
    window.addApprovisionnementRow = addApprovisionnementRow;
    window.deleteApprovisionnementRow = deleteApprovisionnementRow;
    window.updateApprovisionnementField = updateApprovisionnementField;
    window.toggleHistoryColumns = toggleHistoryColumns;
    console.log('[APPROVISIONNEMENT] ✅ Module chargé - Fonctions globales exposées');
}
