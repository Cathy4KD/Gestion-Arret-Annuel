/**
 * @fileoverview IW38 data management module
 * Gestion des données IW38 (chargement, sauvegarde, affichage)
 * Source: lignes 6605-6687
 * @module iw38-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Global IW38 data array
 * Tableau global des données IW38
 * @type {Array<Object>}
 */
export let iw38Data = [];

/**
 * Set IW38 data
 * Définit les données IW38
 *
 * @param {Array<Object>} data - New data / Nouvelles données
 *
 * @example
 * setIw38Data([{Ordre: 'PSV001', ...}]);
 */
export function setIw38Data(data) {
    iw38Data = data;
}

// Exposer les fonctions globalement dès le chargement du module
// pour garantir qu'elles sont disponibles pour server-sync.js
if (typeof window !== 'undefined') {
    window.setIw38Data = setIw38Data;
    console.log('[IW38] ✅ window.setIw38Data exposée');
}

/**
 * Load IW38 data from server
 * Charge les données IW38 depuis le serveur
 * Source: lignes 6513-6543
 *
 * @async
 * @param {string} fileName - File name to load / Nom du fichier à charger
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await loadIw38DataFromServer('iw38_2025.xlsx');
 */
export async function loadIw38DataFromServer(fileName) {
    if (!fileName) {
        alert('Veuillez sélectionner un fichier IW38.');
        return false;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[IW38] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return false;
    }

    try {
        const response = await fetch(`/api/donnees_serveur/files/${fileName}`);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement du fichier: ${response.statusText}`);
        }

        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        iw38Data = jsonData;
        console.log(`[OK] ${iw38Data.length} lignes IW38 chargées`);
        renderIw38Table();
        saveIw38Data();
        alert(`[OK] Fichier ${fileName} chargé avec succès!`);
        return true;

    } catch (error) {
        console.error('[ERROR] Erreur lors de la lecture du fichier IW38:', error);
        alert('Erreur lors de la lecture du fichier. Veuillez vérifier le format.');
        return false;
    }
}

/**
 * Handle IW38 file upload
 * Gère l'upload d'un fichier Excel IW38
 * Source: lignes 6608-6630
 *
 * @async
 * @param {Event} event - File input change event / Événement de changement du fichier
 * @returns {Promise<void>}
 *
 * @example
 * inputElement.addEventListener('change', handleIw38Upload);
 */
export async function handleIw38Upload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[IW38] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            iw38Data = jsonData;
            console.log(`[OK] ${iw38Data.length} lignes IW38 chargées`);
            renderIw38Table();
            saveIw38Data();
        } catch (error) {
            console.error('[ERROR] Erreur lors de la lecture du fichier IW38:', error);
            alert('Erreur lors de la lecture du fichier. Veuillez vérifier le format.');
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Render IW38 table
 * Affiche le tableau IW38 dans le DOM
 * Source: lignes 6633-6663
 *
 * @example
 * renderIw38Table();
 */
export function renderIw38Table() {
    const tbody = document.getElementById('iw38TableBody');

    if (!tbody) {
        console.warn('[WARNING] Element iw38TableBody non trouvé');
        return;
    }

    if (!iw38Data || iw38Data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="39" style="padding: 30px; text-align: center; color: #666;">
                    Aucune donnée importée. Veuillez importer un fichier Excel.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    iw38Data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        tr.style.height = '28px';

        const columns = [
            'Groupe de gest.','Opération','Désign. opér.','Post.trav.opér.','Ordre','Poste technique','Unité productve','Code ABC','Révision','Type d\'ordre','Priorité','PosteTravPrinc.','Désignation','Clé de commande','Nombre','Durée normale','Travail','Travail réel','Etat','ImmobilOpér','Date début +tôt','Heure déb.+tôt','Date fin + tôt','Heure fin + tôt','StatUtilisOpér','Statut util.','Stat.syst.opér.','Statut système','TotalCoûtsBudg.','Fournisseur','Demande d\'achat','Prix','Grpe de gammes','Cpteur gr.gamm.','Poste d\'entret.','Plan d\'entret.','Confirmation','Réceptionnaire','Clé de réf.'
        ];

        let cells = '';
        columns.forEach(col => {
            cells += `<td style="padding: 2px 4px; border: 1px solid #dee2e6; white-space: nowrap; font-size: 12px;">${row[col] || ''}</td>`;
        });
        tr.innerHTML = cells;
        tbody.appendChild(tr);
    });
}

// Exposer renderIw38Table globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.renderIw38Table = renderIw38Table;
    console.log('[IW38] ✅ window.renderIw38Table exposée');
}

/**
 * Save IW38 data to localStorage
 * Sauvegarde les données IW38 dans le localStorage
 * Source: lignes 6666-6673
 *
 * @returns {boolean} Success status / Statut de succès
 *
 * @example
 * saveIw38Data();
 */
export function saveIw38Data() {
    return saveToStorage('iw38Data', iw38Data);
}

/**
 * Load IW38 data from localStorage
 * Charge les données IW38 depuis le localStorage
 * Source: lignes 6676-6687
 *
 * @returns {boolean} Success status / Statut de succès
 *
 * @example
 * loadIw38Data();
 */
export function loadIw38Data() {
    const saved = loadFromStorage('iw38Data', []);
    if (saved && saved.length > 0) {
        iw38Data = saved;
        console.log(`[OK] ${iw38Data.length} lignes IW38 chargées depuis localStorage`);
        renderIw38Table();
        return true;
    }
    return false;
}

/**
 * Get IW38 data
 * Obtient les données IW38
 *
 * @returns {Array<Object>} IW38 data / Données IW38
 *
 * @example
 * const data = getIw38Data();
 */
export function getIw38Data() {
    return iw38Data;
}

/**
 * Filter IW38 data by criteria
 * Filtre les données IW38 selon des critères
 *
 * @param {Function} filterFn - Filter function / Fonction de filtrage
 * @returns {Array<Object>} Filtered data / Données filtrées
 *
 * @example
 * const psvItems = filterIw38Data(row => row['Désign. opér.']?.includes('PSV'));
 */
export function filterIw38Data(filterFn) {
    return iw38Data.filter(filterFn);
}

/**
 * Clear IW38 data
 * Efface toutes les données IW38
 *
 * @example
 * clearIw38Data();
 */
export function clearIw38Data() {
    iw38Data = [];
    saveIw38Data();
    renderIw38Table();
}
