/**
 * @fileoverview IW37N data management module
 * Gestion des données IW37N (chargement, sauvegarde, affichage)
 * Source: lignes 6476-6687
 * @module iw37n-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Global IW37N data array
 * Tableau global des données IW37N
 * @type {Array<Object>}
 */
export let iw37nData = [];

/**
 * Currently selected IW37N row
 * Ligne IW37N actuellement sélectionnée
 * @type {Object|null}
 */
let selectedIw37nRow = null;

/**
 * Set IW37N data
 * Définit les données IW37N
 *
 * @param {Array<Object>} data - New data / Nouvelles données
 *
 * @example
 * setIw37nData([{Ordre: 'PSV001', ...}]);
 */
export function setIw37nData(data) {
    iw37nData = data;
}

// Exposer les fonctions globalement dès le chargement du module
// pour garantir qu'elles sont disponibles pour server-sync.js
if (typeof window !== 'undefined') {
    window.setIw37nData = setIw37nData;
    console.log('[IW37N] ✅ window.setIw37nData exposée');
}

/**
 * Load IW37N data from server
 * Charge les données IW37N depuis le serveur
 * Source: lignes 6480-6510
 *
 * @async
 * @param {string} fileName - File name to load / Nom du fichier à charger
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await loadIw37nDataFromServer('iw37n_2025.xlsx');
 */
export async function loadIw37nDataFromServer(fileName) {
    if (!fileName) {
        alert('Veuillez sélectionner un fichier IW37N.');
        return false;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[IW37N] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return false;
    }

    try {
        const response = await fetch(`/api/donnees_serveur/files/${fileName}`);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement du fichier: ${response.statusText}`);
        }

        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        iw37nData = jsonData;
        console.log(`[OK] ${iw37nData.length} lignes iw37N chargées`);
        renderIw37nTable();

        // Attendre la sauvegarde sur le serveur
        const saveSuccess = await saveIw37nData();

        if (saveSuccess) {
            alert(`✅ Fichier ${fileName} chargé avec succès!\n\n${iw37nData.length} lignes sauvegardées sur le serveur.`);
        } else {
            alert(`⚠️ Fichier ${fileName} chargé MAIS non sauvegardé sur le serveur!\n\nLes données seront perdues au rafraîchissement.\n\nVérifiez que le serveur est démarré.`);
        }

        return saveSuccess;

    } catch (error) {
        console.error('[ERROR] Erreur lors de la lecture du fichier iw37N:', error);
        alert('Erreur lors de la lecture du fichier. Veuillez vérifier le format.');
        return false;
    }
}

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

/**
 * Apply filters to IW37N data
 * Applique les filtres aux données IW37N
 *
 * @returns {Array} Filtered data
 *
 * @example
 * const filtered = applyFilters();
 */
function applyFilters() {
    const ordreFilter = (document.getElementById('iw37n-filter-ordre')?.value || '').toLowerCase();
    const designFilter = (document.getElementById('iw37n-filter-design')?.value || '').toLowerCase();
    const posteFilter = (document.getElementById('iw37n-filter-poste')?.value || '').toLowerCase();

    // Si aucun filtre n'est défini, retourner toutes les données
    if (!ordreFilter && !designFilter && !posteFilter) {
        return iw37nData;
    }

    return iw37nData.filter(row => {
        // Filtre Ordre
        if (ordreFilter) {
            const ordre = (row['Ordre'] || '').toString().toLowerCase();
            if (!ordre.includes(ordreFilter)) {
                return false;
            }
        }

        // Filtre Désign. Opér.
        if (designFilter) {
            const design = (row['Désign. opér.'] || row['Design. oper.'] || row['Designation'] || '').toString().toLowerCase();
            if (!design.includes(designFilter)) {
                return false;
            }
        }

        // Filtre Poste technique
        if (posteFilter) {
            const poste = (row['Poste technique'] || row['PosteTechnique'] || '').toString().toLowerCase();
            if (!poste.includes(posteFilter)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Render IW37N table
 * Affiche le tableau IW37N dans le DOM
 * Source: lignes 6546-6576
 *
 * @example
 * renderIw37nTable();
 */
export function renderIw37nTable() {
    const tbody = document.getElementById('iw37nTableBody');

    if (!tbody) {
        // L'élément n'existe pas encore (page IW37N pas chargée)
        // C'est normal, le tableau sera rendu quand l'utilisateur ouvrira la page
        console.log('[IW37N] ℹ️ Page IW37N non chargée - rendu reporté');
        return;
    }

    if (!iw37nData || iw37nData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="39" style="padding: 30px; text-align: center; color: #666;">
                    Aucune donnée importée. Veuillez importer un fichier Excel.
                </td>
            </tr>
        `;
        return;
    }

    // Appliquer les filtres de recherche
    const filteredData = applyFilters();

    // Mettre à jour les stats
    const statsDiv = document.getElementById('iw37n-stats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <p><strong>${filteredData.length}</strong> travaux affichés</p>
        `;
    }

    tbody.innerHTML = '';

    // Obtenir dynamiquement les noms de colonnes depuis la première ligne
    const columns = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];
    console.log('[IW37N] Colonnes détectées:', columns);

    // Colonnes de dates à convertir (par nom partiel pour plus de flexibilité)
    const isDateColumn = (colName) => {
        const lowerCol = colName.toLowerCase();
        return lowerCol.includes('date') && !lowerCol.includes('heure');
    };

    filteredData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        tr.style.cursor = 'pointer';
        tr.style.transition = 'background-color 0.2s ease';
        tr.style.height = '28px';

        // Ajouter l'effet hover et la sélection
        tr.addEventListener('mouseenter', () => {
            if (!tr.classList.contains('iw37n-selected')) {
                tr.style.background = '#e3f2fd';
            }
        });

        tr.addEventListener('mouseleave', () => {
            if (!tr.classList.contains('iw37n-selected')) {
                tr.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
            }
        });

        tr.addEventListener('click', () => {
            // Désélectionner toutes les autres lignes
            const allRows = tbody.querySelectorAll('tr');
            allRows.forEach(r => {
                r.classList.remove('iw37n-selected');
                const idx = Array.from(allRows).indexOf(r);
                r.style.background = idx % 2 === 0 ? '#f8f9fa' : 'white';
                // Remettre la couleur normale du texte
                const cells = r.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.style.color = '';
                    cell.style.borderColor = '#dee2e6';
                });
            });

            // Sélectionner cette ligne
            tr.classList.add('iw37n-selected');
            tr.style.background = '#4a7c59';

            // Appliquer le style aux cellules
            const cells = tr.querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.color = 'white';
                cell.style.borderColor = '#4a7c59';
            });

            // Stocker la ligne sélectionnée
            selectedIw37nRow = row;

            console.log('[IW37N] Ligne sélectionnée:', row);
        });

        let cells = '';
        columns.forEach(col => {
            let value = row[col] || '';

            // Convertir les dates Excel en format DD.MM.YYYY
            if (isDateColumn(col)) {
                value = convertExcelDate(value);
            }

            cells += `<td style="padding: 2px 4px; border: 1px solid #dee2e6; white-space: nowrap; font-size: 12px;">${value}</td>`;
        });
        tr.innerHTML = cells;
        tbody.appendChild(tr);
    });
}

// Exposer renderIw37nTable globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.renderIw37nTable = renderIw37nTable;
    console.log('[IW37N] ✅ window.renderIw37nTable exposée');
}

/**
 * Save IW37N data to server (NO localStorage)
 * Sauvegarde les données IW37N sur le serveur uniquement
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await saveIw37nData();
 */
export async function saveIw37nData() {
    console.log('[IW37N] 💾 Sauvegarde de', iw37nData.length, 'lignes sur le serveur...');

    try {
        // Importer la fonction de synchronisation serveur
        const { syncModuleToServer } = await import('../sync/server-sync.js');

        // Sauvegarder uniquement sur le serveur (pas de localStorage)
        const result = await syncModuleToServer('iw37nData', iw37nData, false);

        if (result) {
            console.log('[IW37N] ✅ Sauvegarde serveur réussie:', iw37nData.length, 'lignes');
        } else {
            console.error('[IW37N] ❌ Échec sauvegarde serveur');
        }

        return result;
    } catch (error) {
        console.error('[IW37N] ❌ Erreur sauvegarde:', error);
        return false;
    }
}

/**
 * Load IW37N data from server (memory)
 * Charge les données IW37N depuis le serveur (mémoire)
 * NE PAS utiliser localStorage - UNIQUEMENT serveur
 * Source: lignes 6589-6600
 *
 * @returns {boolean} Success status / Statut de succès
 *
 * @example
 * loadIw37nData();
 */
export function loadIw37nData() {
    console.log('[IW37N] 📡 Chargement des données depuis le serveur...');

    // NE PAS utiliser localStorage pour IW37N
    // Les données sont chargées depuis le serveur via initSync() et injectées en mémoire

    if (iw37nData && iw37nData.length > 0) {
        console.log(`[IW37N] ✅ ${iw37nData.length} lignes chargées depuis le serveur`);
        console.log(`[IW37N] ℹ️ Le tableau se rendra automatiquement quand vous ouvrirez la page IW37N`);
        return true;
    }

    console.log('[IW37N] ℹ️ En attente du chargement des données depuis le serveur...');
    return false;
}

/**
 * Get IW37N data
 * Obtient les données IW37N
 *
 * @returns {Array<Object>} IW37N data / Données IW37N
 *
 * @example
 * const data = getIw37nData();
 */
export function getIw37nData() {
    return iw37nData;
}

/**
 * Filter IW37N data by criteria
 * Filtre les données IW37N selon des critères
 *
 * @param {Function} filterFn - Filter function / Fonction de filtrage
 * @returns {Array<Object>} Filtered data / Données filtrées
 *
 * @example
 * const psvItems = filterIw37nData(row => row['Désign. opér.']?.includes('PSV'));
 */
export function filterIw37nData(filterFn) {
    return iw37nData.filter(filterFn);
}

/**
 * Get unique technical positions (Postes techniques) from IW37N data
 * Obtient la liste unique des postes techniques depuis les données IW37N
 *
 * @returns {Array<string>} Unique technical positions sorted alphabetically / Postes techniques uniques triés alphabétiquement
 *
 * @example
 * const positions = getUniquePostesTechniques();
 * // Returns: ['AC-101', 'AC-102', 'CC-201', ...]
 */
export function getUniquePostesTechniques() {
    if (!iw37nData || iw37nData.length === 0) {
        console.warn('[IW37N] Aucune donnée disponible pour extraire les postes techniques');
        return [];
    }

    // Utiliser toutes les données sans filtrage
    const filteredData = iw37nData;

    // Extraire les postes techniques uniques
    const postesSet = new Set();

    filteredData.forEach(row => {
        const poste = row['Poste technique'];
        if (poste && poste.trim() !== '') {
            postesSet.add(poste.trim());
        }
    });

    // Convertir en tableau et trier alphabétiquement
    const postesArray = Array.from(postesSet).sort();

    console.log(`[IW37N] ${postesArray.length} postes techniques uniques trouvés`);
    return postesArray;
}

/**
 * Convertit une date Excel en objet Date JavaScript
 * @param {number|string} excelDate - Date au format Excel
 * @returns {Date|null} Date JavaScript ou null si non convertible
 */
function excelDateToJSDate(excelDate) {
    if (!excelDate) return null;

    // Si c'est déjà une chaîne au format date DD.MM.YYYY
    if (typeof excelDate === 'string' && excelDate.includes('.')) {
        const [day, month, year] = excelDate.split('.');
        return new Date(year, month - 1, day);
    }

    // Si c'est un nombre Excel
    if (typeof excelDate === 'number' || (typeof excelDate === 'string' && !isNaN(excelDate))) {
        const num = typeof excelDate === 'number' ? excelDate : parseFloat(excelDate);
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + num * 86400000);
    }

    return null;
}

/**
 * Get active work for a technical position at a specific date/time
 * Obtient les travaux actifs pour un poste technique à une date/heure spécifique
 *
 * @param {string} posteTechnique - Technical position / Poste technique
 * @param {Date} dateTime - Date and time to check / Date et heure à vérifier
 * @returns {Array<Object>} Active work items / Travaux actifs
 *
 * @example
 * const activeWork = getActiveWorkForPoste('AC-101', new Date('2026-04-05T14:00'));
 * // Returns: [{Ordre: 'PSV001', 'Désign. opér.': 'Maintenance...', ...}]
 */
export function getActiveWorkForPoste(posteTechnique, dateTime) {
    if (!iw37nData || iw37nData.length === 0) {
        console.warn('[IW37N] Aucune donnée disponible pour rechercher les travaux actifs');
        return [];
    }

    if (!posteTechnique || !dateTime) {
        return [];
    }

    // Filtrer les travaux pour ce poste technique
    const workForPoste = iw37nData.filter(row => {
        return row['Poste technique'] === posteTechnique;
    });

    // Filtrer les travaux actifs à cette date/heure
    const activeWork = workForPoste.filter(row => {
        // Récupérer les dates de début et fin
        const dateDebutValue = row['Date début +tôt'];
        const heureDebutStr = row['Heure déb.+tôt'];
        const dateFinValue = row['Date fin + tôt'];
        const heureFinStr = row['Heure fin + tôt'];

        if (!dateDebutValue || !dateFinValue) {
            return false;
        }

        try {
            // Convertir les dates Excel en objets Date
            const dateDebutBase = excelDateToJSDate(dateDebutValue);
            const dateFinBase = excelDateToJSDate(dateFinValue);

            if (!dateDebutBase || !dateFinBase) {
                return false;
            }

            // Parser les heures (format: HH:MM:SS)
            const [hourDebut, minDebut] = (heureDebutStr || '00:00:00').split(':');
            const [hourFin, minFin] = (heureFinStr || '23:59:59').split(':');

            // Créer les objets Date avec les heures
            const dateDebut = new Date(
                dateDebutBase.getFullYear(),
                dateDebutBase.getMonth(),
                dateDebutBase.getDate(),
                parseInt(hourDebut) || 0,
                parseInt(minDebut) || 0
            );

            const dateFin = new Date(
                dateFinBase.getFullYear(),
                dateFinBase.getMonth(),
                dateFinBase.getDate(),
                parseInt(hourFin) || 23,
                parseInt(minFin) || 59
            );

            // Vérifier si le travail est actif
            return dateTime >= dateDebut && dateTime <= dateFin;
        } catch (error) {
            console.warn('[IW37N] Erreur parsing date pour:', row['Ordre'], error);
            return false;
        }
    });

    return activeWork;
}

/**
 * Clear IW37N data
 * Efface toutes les données IW37N
 *
 * @example
 * clearIw37nData();
 */
export function clearIw37nData() {
    iw37nData = [];
    selectedIw37nRow = null;
    saveIw37nData();
    renderIw37nTable();
}

/**
 * Get the currently selected IW37N row
 * Obtient la ligne IW37N actuellement sélectionnée
 *
 * @returns {Object|null} Selected row data or null if none selected
 *
 * @example
 * const selected = getSelectedIw37nRow();
 * if (selected) {
 *   console.log('Ordre:', selected.Ordre);
 * }
 */
export function getSelectedIw37nRow() {
    return selectedIw37nRow;
}

/**
 * Filter table based on search inputs
 * Filtre le tableau selon les champs de recherche
 *
 * @returns {void}
 *
 * @example
 * filterTable();
 */
export function filterTable() {
    renderIw37nTable();
}

/**
 * Reset all filter inputs
 * Réinitialise tous les filtres
 *
 * @returns {void}
 *
 * @example
 * resetFilters();
 */
export function resetFilters() {
    const ordreInput = document.getElementById('iw37n-filter-ordre');
    const designInput = document.getElementById('iw37n-filter-design');
    const posteInput = document.getElementById('iw37n-filter-poste');

    if (ordreInput) ordreInput.value = '';
    if (designInput) designInput.value = '';
    if (posteInput) posteInput.value = '';

    renderIw37nTable();
}

// Exposer les fonctions globalement pour les appels depuis HTML
if (typeof window !== 'undefined') {
    window.iw37nActions = {
        filterTable,
        resetFilters
    };
    console.log('[IW37N] ✅ window.iw37nActions exposé globalement');
}
