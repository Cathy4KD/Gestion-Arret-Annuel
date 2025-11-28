/**
 * @fileoverview Module de gestion des données Pièces avec synchronisation serveur
 * @module data/pieces-data
 */

import { saveToStorage } from '../sync/storage-wrapper.js';

/**
 * Convertit une date Excel (nombre) en format DD.MM.YYYY
 * @param {number|string} excelDate - Date au format Excel (nombre de jours depuis 1900)
 * @returns {string} Date formatée DD.MM.YYYY ou valeur originale si non convertible
 */
function convertExcelDate(excelDate) {
    // Si c'est déjà une chaîne au format date, la retourner
    if (typeof excelDate === 'string' && excelDate.includes('.')) {
        return excelDate;
    }

    // Si c'est un nombre, convertir depuis le format Excel
    if (typeof excelDate === 'number' || (typeof excelDate === 'string' && !isNaN(excelDate))) {
        const num = typeof excelDate === 'number' ? excelDate : parseFloat(excelDate);

        // Les dates Excel sont le nombre de jours depuis le 1er janvier 1900
        // Mais il y a un bug dans Excel : il considère 1900 comme une année bissextile
        const excelEpoch = new Date(1899, 11, 30); // 30 décembre 1899
        const date = new Date(excelEpoch.getTime() + num * 86400000);

        if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        }
    }

    return excelDate || '';
}

const PIECES_KEY = 'piecesData';

/**
 * Données Pièces (en mémoire uniquement)
 */
let piecesData = [];

/**
 * Définit les données Pièces (appelé par server-sync lors de l'injection)
 * @param {Array} data - Données à injecter
 */
export function setPiecesData(data) {
    piecesData = data || [];
    console.log(`[PIECES-DATA] Données injectées: ${piecesData.length} lignes`);
}

/**
 * Récupère les données Pièces
 * @returns {Array} Données Pièces
 */
export function getPiecesData() {
    return piecesData;
}

/**
 * Sauvegarde les données Pièces sur le serveur
 * @param {Array} data - Données à sauvegarder
 * @returns {Promise<boolean>} Succès de la sauvegarde
 */
export async function savePiecesData(data) {
    piecesData = data;
    const success = await saveToStorage(PIECES_KEY, data, false);

    if (success) {
        console.log(`[PIECES-DATA] ✅ ${piecesData.length} lignes sauvegardées sur le serveur`);
    } else {
        console.error('[PIECES-DATA] ❌ Échec de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Rendu du tableau des Pièces avec filtrage
 * @param {string} tableBodyId - ID du tbody du tableau
 * @param {number} numberOfColumns - Nombre de colonnes du tableau
 */
export function renderPiecesTable(tableBodyId = 'pieces-table-body', numberOfColumns = 56) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.warn(`[PIECES-DATA] Élément ${tableBodyId} non trouvé`);
        return;
    }

    tableBody.innerHTML = ''; // Clear existing data

    if (!piecesData || piecesData.length < 2) {
        tableBody.innerHTML = `<tr><td colspan="${numberOfColumns}" style="text-align: center; padding: 40px; color: #999;">Aucune donnée. Cliquez sur "Importer depuis Excel" pour choisir un fichier à charger.</td></tr>`;
        updateFilterCount(0);
        return;
    }

    const headers = piecesData[0];
    const rows = piecesData.slice(1);

    // Appliquer les filtres
    const filteredRows = applyFilters(rows, headers);

    if (filteredRows.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${numberOfColumns}" style="text-align: center; padding: 40px; color: #999;">Aucun résultat trouvé. Essayez d'autres critères de recherche.</td></tr>`;
        updateFilterCount(0);
        return;
    }

    // Colonnes contenant des dates (indices basés sur l'ordre des colonnes)
    const dateColumnIndices = [6, 7]; // Date début plus tôt, Date du besoin

    filteredRows.forEach(rowData => {
        const tr = document.createElement('tr');
        for (let i = 0; i < numberOfColumns; i++) {
            let cellData = rowData[i] || '';

            // Formater les dates
            if (dateColumnIndices.includes(i) && cellData) {
                cellData = convertExcelDate(cellData);
            }

            const td = document.createElement('td');
            td.textContent = cellData;
            td.style.padding = '12px';
            td.style.border = '1px solid #dee2e6';
            tr.appendChild(td);
        }
        tableBody.appendChild(tr);
    });

    updateFilterCount(filteredRows.length);
    console.log(`[PIECES-DATA] Tableau rendu: ${filteredRows.length} lignes affichées sur ${rows.length} total`);
}

/**
 * Applique les filtres sur les données
 * @param {Array} rows - Lignes de données
 * @param {Array} headers - En-têtes des colonnes
 * @returns {Array} Lignes filtrées
 */
function applyFilters(rows, headers) {
    const ordreFilter = (document.getElementById('pieces-filter-ordre')?.value || '').toLowerCase().trim();
    const articleFilter = (document.getElementById('pieces-filter-article')?.value || '').toLowerCase().trim();
    const designationFilter = (document.getElementById('pieces-filter-designation')?.value || '').toLowerCase().trim();

    // Si aucun filtre, retourner toutes les lignes
    if (!ordreFilter && !articleFilter && !designationFilter) {
        return rows;
    }

    // Trouver les indices des colonnes
    const ordreIndex = headers.findIndex(h => h === 'Ordre');
    const articleIndex = headers.findIndex(h => h === 'Article');
    const designationIndex = headers.findIndex(h => h === 'Désignation article');

    return rows.filter(row => {
        let match = true;

        if (ordreFilter && ordreIndex >= 0) {
            const value = (row[ordreIndex] || '').toString().toLowerCase();
            match = match && value.includes(ordreFilter);
        }

        if (articleFilter && articleIndex >= 0) {
            const value = (row[articleIndex] || '').toString().toLowerCase();
            match = match && value.includes(articleFilter);
        }

        if (designationFilter && designationIndex >= 0) {
            const value = (row[designationIndex] || '').toString().toLowerCase();
            match = match && value.includes(designationFilter);
        }

        return match;
    });
}

/**
 * Met à jour le compteur de pièces affichées
 * @param {number} count - Nombre de pièces affichées
 */
function updateFilterCount(count) {
    const countElement = document.getElementById('pieces-filter-count');
    if (countElement) {
        countElement.textContent = `${count} pièce(s) affichée(s)`;
    }
}

/**
 * Filtre le tableau selon les critères de recherche
 */
export function filterTable() {
    renderPiecesTable();
}

/**
 * Réinitialise tous les filtres
 */
export function resetFilters() {
    const ordreInput = document.getElementById('pieces-filter-ordre');
    const articleInput = document.getElementById('pieces-filter-article');
    const designationInput = document.getElementById('pieces-filter-designation');

    if (ordreInput) ordreInput.value = '';
    if (articleInput) articleInput.value = '';
    if (designationInput) designationInput.value = '';

    renderPiecesTable();
}

/**
 * Exporte la liste des pièces avec colonnes spécifiques vers Excel
 */
export function exportPiecesListToExcel() {
    if (!piecesData || piecesData.length < 2) {
        alert('⚠️ Aucune donnée à exporter. Veuillez d\'abord importer des données.');
        return;
    }

    try {
        const headers = piecesData[0];
        const rows = piecesData.slice(1);

        // Mapper les noms de colonnes demandés aux indices
        const columnMapping = {
            'Lot': headers.findIndex(h => h && h.toLowerCase().includes('lot')),
            'Ordre': headers.findIndex(h => h === 'Ordre'),
            'Désignation OP.': headers.findIndex(h => h && (h.includes('Désign. synth. opér.') || h.includes('Désignation'))),
            'Désignation article': headers.findIndex(h => h === 'Désignation article'),
            'QTÉ': headers.findIndex(h => h === 'Quantité requise'),
            'UN': headers.findIndex(h => h === 'Unité de qté base'),
            'PO': headers.findIndex(h => h === 'Document d\'achat'),
            'Dem. achat': headers.findIndex(h => h === 'Demande d\'achat'),
            'Art. mag.': headers.findIndex(h => h === 'Article'),
            'Lieux Livraison': headers.findIndex(h => h === 'Point déchargement'),
            'Révision': headers.findIndex(h => h === 'Révision'),
            'Poste tech.': headers.findIndex(h => h === 'Poste technique'),
            'ETA': headers.findIndex(h => h === 'Date livraison réaliste' || h === 'Date de livraison de site prévue')
        };

        console.log('[PIECES] Mapping des colonnes:', columnMapping);

        // Créer les données d'export
        const exportData = rows.map(row => {
            const exportRow = {};

            for (const [colName, colIndex] of Object.entries(columnMapping)) {
                exportRow[colName] = colIndex >= 0 ? (row[colIndex] || '') : '';
            }

            // Ajouter les colonnes éditables (vides pour l'instant)
            exportRow['RECU'] = '';
            exportRow['Emplacement storé'] = '';

            return exportRow;
        });

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Liste des Pièces');

        // Ajuster la largeur des colonnes
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({
            wch: Math.max(key.length, 15)
        }));
        ws['!cols'] = colWidths;

        const fileName = `Liste_Pieces_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[PIECES] Export Excel réussi:', fileName);
        alert(`✅ Export réussi!\n\n${exportData.length} pièces exportées vers ${fileName}`);
    } catch (error) {
        console.error('[PIECES] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel: ' + error.message);
    }
}

// Exposer les fonctions globalement pour l'injection
window.setPiecesData = setPiecesData;
window.getPiecesData = getPiecesData;
window.renderPiecesTable = renderPiecesTable;

// Exposer les actions pour les boutons HTML
window.piecesActions = {
    filterTable,
    resetFilters,
    exportPiecesListToExcel
};

console.log('[PIECES-DATA] ✅ Module chargé avec filtres de recherche et export Excel');

