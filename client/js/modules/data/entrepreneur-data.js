/**
 * @fileoverview Gestion des Travaux à Faire par l'Entrepreneur
 * @module data/entrepreneur-data
 */

import { loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Données filtrées des travaux
 * @type {Array}
 */
let filteredData = [];

/**
 * Toutes les données IW37N
 * @type {Array}
 */
let allIw37nData = [];

/**
 * Synchronise et charge les données depuis IW37N
 * @returns {void}
 */
export async function syncEntrepreneurFromIw37n() {
    console.log('[ENTREPRENEUR] Fonction syncEntrepreneurFromIw37n appelée');

    const iw37nData = await loadFromStorage('iw37nData');
    console.log('[ENTREPRENEUR] iw37nData exists:', !!iw37nData);

    if (!iw37nData) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord importer les données IW37N.');
        return;
    }

    try {
        allIw37nData = iw37nData;

        if (!Array.isArray(allIw37nData) || allIw37nData.length === 0) {
            alert('⚠️ Les données IW37N sont vides.');
            return;
        }

        console.log(`[ENTREPRENEUR] ${allIw37nData.length} lignes IW37N chargées`);

        // Remplir le menu déroulant avec les valeurs uniques de Post.trav.opér.
        populatePosteFilter();

        // Afficher tous les travaux par défaut
        filterByPoste('');

        alert(`✅ ${allIw37nData.length} travaux synchronisés depuis IW37N !`);

    } catch (error) {
        console.error('[ENTREPRENEUR] Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec IW37N.');
    }
}

/**
 * Remplit le menu déroulant avec les valeurs uniques de Post.trav.opér.
 * @returns {void}
 */
function populatePosteFilter() {
    const select = document.getElementById('entrepreneurPosteFilter');
    if (!select) {
        console.error('[ENTREPRENEUR] Element entrepreneurPosteFilter non trouvé');
        return;
    }

    console.log('[ENTREPRENEUR] Remplissage du menu déroulant...');

    // Récupérer toutes les valeurs uniques de Post.trav.opér.
    const postesSet = new Set();

    allIw37nData.forEach(row => {
        // Chercher la colonne (différentes variations possibles)
        const posteTrav = row['Post.trav.opér.'] ||
                         row['Post.trav.oper.'] ||
                         row['PosteTravOper'] ||
                         row['Post. Trav.'] ||
                         row['Post.trav.'] ||
                         row['Post trav'] ||
                         row['Poste Trav.'] ||
                         '';

        if (posteTrav && posteTrav.trim() !== '') {
            postesSet.add(posteTrav.trim());
        }
    });

    // Convertir en tableau et trier
    const postesArray = Array.from(postesSet).sort();

    console.log(`[ENTREPRENEUR] ${postesArray.length} valeurs uniques trouvées pour Post.trav.opér.`);

    // Remplir le dropdown
    select.innerHTML = '<option value="">-- Tous les postes --</option>';

    postesArray.forEach(poste => {
        const option = document.createElement('option');
        option.value = poste;
        option.textContent = poste;
        select.appendChild(option);
    });

    console.log(`[ENTREPRENEUR] ✅ Menu déroulant rempli avec ${postesArray.length} options`);
}

/**
 * Filtre les travaux par valeur de Post.trav.opér.
 * @param {string} poste - Valeur à filtrer (vide = tous)
 * @returns {void}
 */
export function filterByPoste(poste) {
    console.log(`[ENTREPRENEUR] Filtrage par poste: "${poste}"`);

    if (!poste || poste === '') {
        // Afficher tous les travaux
        filteredData = [...allIw37nData];
    } else {
        // Filtrer par poste
        filteredData = allIw37nData.filter(row => {
            const posteTrav = row['Post.trav.opér.'] ||
                             row['Post.trav.oper.'] ||
                             row['PosteTravOper'] ||
                             row['Post. Trav.'] ||
                             row['Post.trav.'] ||
                             row['Post trav'] ||
                             row['Poste Trav.'] ||
                             '';
            return posteTrav.trim() === poste;
        });
    }

    renderTable();
    updateCount();

    console.log(`[ENTREPRENEUR] ${filteredData.length} travaux affichés`);
}

/**
 * Affiche le tableau des travaux
 * @returns {void}
 */
function renderTable() {
    const tbody = document.getElementById('entrepreneurTableBody');
    if (!tbody) {
        console.error('[ENTREPRENEUR] Element entrepreneurTableBody non trouvé');
        return;
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    ${allIw37nData.length === 0
                        ? 'Aucune donnée. Cliquez sur "Synchroniser avec IW37N" pour charger les données.'
                        : 'Aucun travail trouvé pour ce filtre.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">${row['Ordre'] || row['ordre'] || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${row['Opération'] || row['operation'] || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${row['Poste technique'] || row['PosteTechnique'] || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || row['Post.trav.'] || ''}</td>
        `;
        tbody.appendChild(tr);
    });

    console.log(`[ENTREPRENEUR] Tableau rendu avec ${filteredData.length} lignes`);
}

/**
 * Met à jour le compteur de travaux
 * @returns {void}
 */
function updateCount() {
    const countElement = document.getElementById('entrepreneurCount');
    if (countElement) {
        countElement.textContent = filteredData.length;
    }
}

/**
 * Exporte les données vers Excel
 * @returns {void}
 */
export function exportToExcel() {
    if (filteredData.length === 0) {
        alert('⚠️ Aucune donnée à exporter.');
        return;
    }

    try {
        const exportData = filteredData.map(row => ({
            'Ordre': row['Ordre'] || row['ordre'] || '',
            'Opération': row['Opération'] || row['operation'] || '',
            'Désign. opér.': row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '',
            'Poste technique': row['Poste technique'] || row['PosteTechnique'] || '',
            'Post.trav.opér.': row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Travaux Entrepreneur');

        const date = new Date().toISOString().split('T')[0];
        const filename = `travaux-entrepreneur-${date}.xlsx`;

        XLSX.writeFile(wb, filename);

        console.log(`[ENTREPRENEUR] Export Excel réussi: ${filename}`);
        alert(`✅ Export Excel réussi: ${filteredData.length} travaux exportés !`);
    } catch (error) {
        console.error('[ENTREPRENEUR] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Initialise la page
 * @returns {void}
 */
export async function initEntrepreneurPage() {
    console.log('[ENTREPRENEUR] ========== INITIALISATION DE LA PAGE ==========');

    // Essayer de charger les données IW37N existantes
    const iw37nData = await loadFromStorage('iw37nData');

    if (iw37nData && Array.isArray(iw37nData) && iw37nData.length > 0) {
        console.log(`[ENTREPRENEUR] ${iw37nData.length} lignes IW37N trouvées en mémoire`);
        allIw37nData = iw37nData;

        // Remplir le menu déroulant automatiquement
        populatePosteFilter();

        // Afficher tous les travaux
        filterByPoste('');

        console.log('[ENTREPRENEUR] ✅ Données chargées automatiquement depuis la mémoire');
    } else {
        // Afficher un message par défaut
        const tbody = document.getElementById('entrepreneurTableBody');
        console.log('[ENTREPRENEUR] Element entrepreneurTableBody trouvé:', !!tbody);

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                        Cliquez sur "Synchroniser avec IW37N" pour charger les données.
                    </td>
                </tr>
            `;
        }

        updateCount();
    }
}

