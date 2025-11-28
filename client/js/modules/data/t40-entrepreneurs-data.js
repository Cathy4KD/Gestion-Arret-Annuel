/**
 * @fileoverview Gestion de la présentation aux entrepreneurs (T40)
 * @module data/t40-entrepreneurs-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage pour les données T40
 * @const {string}
 */
const STORAGE_KEY = 't40EntrepreneursData';

/**
 * Données des entrepreneurs T40
 * @type {Array}
 */
let t40Data = [];

/**
 * Charge les données T40 depuis localStorage
 * @returns {Promise<void>}
 */
export async function loadT40Data() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        t40Data = saved;
        console.log(`[T40] ${t40Data.length} entrepreneurs chargés depuis localStorage`);
        renderT40Table();
    }
}

/**
 * Sauvegarde les données T40
 * @returns {Promise<void>}
 */
async function saveT40Data() {
    await saveToStorage(STORAGE_KEY, t40Data);
    console.log('[T40] Données sauvegardées et synchronisées');
}

/**
 * Synchronise les entrepreneurs depuis IW37N
 * Filtre les POST.TRAV.OPÉR. uniques en excluant ceux qui commencent par A ou E
 * @returns {Promise<void>}
 */
export async function syncEntrepreneursFromIw37n() {
    // Récupérer les données IW37N depuis localStorage
    const iw37nData = await loadFromStorage('iw37nData');

    if (!iw37nData) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord charger les données IW37N.');
        console.warn('[T40] Aucune donnée IW37N disponible');
        return;
    }

    try {
        console.log('[T40] Données IW37N chargées:', iw37nData.length, 'lignes');

        // Extraire les POST.TRAV.OPÉR. uniques
        const posteTravSet = new Set();
        iw37nData.forEach(row => {
            const posteTrav = row['Post.Trav.Opér.']
                || row['Post.Trav.Oper.']
                || row['Post.trav.opér.']
                || row['Post.trav.oper.']
                || row['PosteTravOper']
                || row['Post Trav']
                || '';

            if (posteTrav && posteTrav.trim() !== '') {
                const trimmed = posteTrav.trim();
                const firstChar = trimmed.charAt(0).toUpperCase();

                // Filtrer: exclure ceux qui commencent par A ou E
                if (firstChar !== 'A' && firstChar !== 'E') {
                    posteTravSet.add(trimmed);
                }
            }
        });

        console.log(`[T40] ${posteTravSet.size} entrepreneurs uniques trouvés (après filtre)`);

        // Créer les données pour le tableau
        const existingData = new Map(t40Data.map(item => [item.entrepreneur, item]));

        t40Data = Array.from(posteTravSet).sort().map(entrepreneur => {
            // Garder les données existantes si elles existent déjà
            const existing = existingData.get(entrepreneur);
            if (existing) {
                return existing;
            }

            // Sinon créer une nouvelle ligne
            return {
                id: `t40-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entrepreneur: entrepreneur,
                date: '',
                commentaire: '',
                statut: ''
            };
        });

        saveT40Data();
        renderT40Table();

        alert(`✅ ${t40Data.length} entrepreneur(s) synchronisé(s) depuis IW37N`);
    } catch (error) {
        console.error('[T40] Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec IW37N');
    }
}

/**
 * Met à jour un champ d'une ligne
 * @param {number} index - Index de la ligne
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
function updateT40Field(index, field, value) {
    if (t40Data[index]) {
        t40Data[index][field] = value;
        saveT40Data();
    }
}

// Exposer globalement pour les événements onclick
if (typeof window !== 'undefined') {
    window.updateT40Field = updateT40Field;
}

/**
 * Rend le tableau des entrepreneurs
 * @returns {void}
 */
export function renderT40Table() {
    const tbody = document.getElementById('t40EntrepreneursTableBody');
    const countSpan = document.getElementById('t40EntrepreneursCount');

    if (!tbody) {
        console.warn('[T40] Element t40EntrepreneursTableBody non trouvé');
        return;
    }

    if (!Array.isArray(t40Data) || t40Data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucun entrepreneur dans la liste. Cliquez sur "Synchroniser avec IW37N" pour importer les données.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    t40Data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${item.entrepreneur || ''}"
                       onchange="window.updateT40Field(${index}, 'entrepreneur', this.value)"
                       placeholder="Nom de l'entrepreneur"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-weight: bold; color: #667eea;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <input type="date"
                       value="${item.date || ''}"
                       onchange="window.updateT40Field(${index}, 'date', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.updateT40Field(${index}, 'commentaire', this.value)"
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; resize: vertical;">${item.commentaire || ''}</textarea>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="window.updateT40Field(${index}, 'statut', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="" ${item.statut === '' ? 'selected' : ''}>--</option>
                    <option value="En attente" ${item.statut === 'En attente' ? 'selected' : ''}>En attente</option>
                    <option value="Présenté" ${item.statut === 'Présenté' ? 'selected' : ''}>Présenté</option>
                    <option value="Soumission reçue" ${item.statut === 'Soumission reçue' ? 'selected' : ''}>Soumission reçue</option>
                    <option value="Accepté" ${item.statut === 'Accepté' ? 'selected' : ''}>Accepté</option>
                    <option value="Refusé" ${item.statut === 'Refusé' ? 'selected' : ''}>Refusé</option>
                </select>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour le compteur
    if (countSpan) {
        countSpan.textContent = t40Data.length;
    }

    console.log(`[T40] Tableau rendu: ${t40Data.length} entrepreneurs`);
}

/**
 * Exporte les données vers Excel
 * @returns {void}
 */
export function exportToExcel() {
    if (!Array.isArray(t40Data) || t40Data.length === 0) {
        alert('⚠️ Aucun entrepreneur à exporter.');
        return;
    }

    try {
        const exportData = t40Data.map(item => ({
            'Entrepreneur (Post. Trav.)': item.entrepreneur,
            'Date Présentation': item.date || '',
            'Commentaire': item.commentaire || '',
            'Statut': item.statut || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Entrepreneurs T40');

        // Ajuster automatiquement la largeur des colonnes
        ws['!cols'] = autoSizeColumns(ws, exportData);

        const fileName = `T40_Entrepreneurs_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[T40] Export Excel réussi:', fileName);
    } catch (error) {
        console.error('[T40] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données T40
 * @returns {Array}
 */
export function getT40Data() {
    return t40Data;
}

/**
 * Set T40 data (utilisé par server-sync pour injecter les données)
 */
export function setT40Data(data) {
    t40Data = data || [];
    console.log('[T40] ✅ Données injectées');
    renderT40Table();
}

/**
 * Ajoute une ligne vide manuelle au tableau
 * @returns {Promise<void>}
 */
export async function addManualEntrepreneur() {
    const newRow = {
        id: `t40-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entrepreneur: '',
        date: '',
        commentaire: '',
        statut: ''
    };

    t40Data.push(newRow);
    await saveT40Data();
    renderT40Table();

    console.log('[T40] ✅ Ligne manuelle ajoutée');
    alert('✅ Ligne vide ajoutée au tableau');
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.t40Actions = {
        syncEntrepreneursFromIw37n,
        exportToExcel,
        loadT40Data,
        renderT40Table,
        addManualEntrepreneur
    };
    window.setT40Data = setT40Data;
}

console.log('[T40] Module chargé');
