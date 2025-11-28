/**
 * @fileoverview Module de gestion des tableaux TPAA et PW
 * @module data/tpaa-pw-data
 *
 * @description
 * Filtre et affiche les travaux TPAA et PW depuis IW37N
 * - TPAA: "Désign. opér." commence par "TPAA"
 * - PW: "Désign. opér." commence par "PW"
 */

import { getIw37nData } from './iw37n-data.js';
import { getStartDate } from './settings.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Stockage des données manuelles (statut, commentaire, +?)
 * @type {Object}
 */
let manualData = {};

/**
 * Cache des données TPAA et PW filtrées depuis IW37N
 * @type {Object}
 */
let cachedData = {
    tpaaData: [],
    pwData: []
};

/**
 * Set TPAA-PW data (utilisé par server-sync pour injecter les données)
 * @param {Object} data - Données à définir {tpaaData: [], pwData: []}
 */
export function setTpaaPwCachedData(data) {
    cachedData = data || { tpaaData: [], pwData: [] };
    console.log(`[TPAA-PW] ✅ Données injectées: ${cachedData.tpaaData.length} TPAA, ${cachedData.pwData.length} PW`);
}

/**
 * Set TPAA-PW manual data (utilisé par server-sync pour injecter les données manuelles)
 * @param {Object} data - Données manuelles (commentaires, statuts, etc.)
 */
export function setTpaaPwManualData(data) {
    manualData = data || {};
    const count = Object.keys(manualData).length;
    console.log(`[TPAA-PW] ✅ Données manuelles injectées: ${count} entrées (commentaires, statuts)`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setTpaaPwCachedData = setTpaaPwCachedData;
    window.setTpaaPwManualData = setTpaaPwManualData;
    console.log('[TPAA-PW] ✅ window.setTpaaPwCachedData et window.setTpaaPwManualData exposées');
}

/**
 * Charge les données manuelles depuis le serveur
 * @returns {Promise<void>}
 */
async function loadManualData() {
    const saved = await loadFromStorage('tpaaPwManualData');
    if (saved) {
        manualData = saved;
        console.log('[TPAA-PW] ✅ Données manuelles chargées depuis le serveur');
    }
}

/**
 * Sauvegarde les données manuelles sur le serveur
 * @returns {Promise<void>}
 */
async function saveManualData() {
    await saveToStorage('tpaaPwManualData', manualData);
    console.log('[TPAA-PW] ✅ Données manuelles sauvegardées sur le serveur');
}

/**
 * Charge les données TPAA/PW depuis le serveur (permanent)
 * @returns {Promise<boolean>}
 */
export async function loadTpaaPwCachedData() {
    const saved = await loadFromStorage('tpaaPwCachedData');
    if (saved && saved.tpaaData && saved.pwData) {
        cachedData = saved;
        console.log(`[TPAA-PW] ✅ ${cachedData.tpaaData.length} TPAA et ${cachedData.pwData.length} PW chargés depuis le serveur`);
        return true;
    }
    console.log('[TPAA-PW] ℹ️ Aucune donnée TPAA/PW sur le serveur');
    return false;
}

/**
 * Sauvegarde les données TPAA/PW filtrées sur le serveur (permanent)
 * @returns {Promise<boolean>}
 */
async function saveCachedData() {
    console.log('[TPAA-PW] 💾 Sauvegarde de', cachedData.tpaaData.length, 'TPAA et', cachedData.pwData.length, 'PW sur le serveur...');

    const success = await saveToStorage('tpaaPwCachedData', cachedData);

    if (success) {
        console.log('[TPAA-PW] ✅ Données sauvegardées sur le serveur avec succès');
    } else {
        console.error('[TPAA-PW] ❌ Échec de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Extrait le nombre après le tiret dans la désignation (ex: "TPAA-2" -> 2, "PW-10" -> 10)
 * @param {string} designation - La désignation (ex: "TPAA-2", "PW-10")
 * @returns {number} Le nombre extrait ou 0 si non trouvé
 */
function extractNumber(designation) {
    if (!designation) return 0;
    const match = designation.match(/-(\d{1,3})/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Calcule la date cible pour TPAA (date de début - nombre de SEMAINES)
 * @param {number} weeks - Nombre de semaines
 * @param {string} startDateStr - Date de début au format ISO (optionnel, si non fourni retourne '')
 * @returns {string} Date au format YYYY-MM-DD ou vide si pas de date de début
 */
function calculateTPAADate(weeks, startDateStr = '') {
    if (!startDateStr) return '';

    try {
        const date = new Date(startDateStr);
        // Vérifier que la date est valide
        if (isNaN(date.getTime())) {
            return '';
        }
        // Soustraire le nombre de semaines (1 semaine = 7 jours)
        date.setDate(date.getDate() - (weeks * 7));
        // Vérifier à nouveau que la date résultante est valide
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
}

/**
 * Calcule la date cible pour PW (date de début - nombre de JOURS)
 * @param {number} days - Nombre de jours
 * @param {string} startDateStr - Date de début au format ISO (optionnel, si non fourni retourne '')
 * @returns {string} Date au format YYYY-MM-DD ou vide si pas de date de début
 */
function calculatePWDate(days, startDateStr = '') {
    if (!startDateStr) return '';

    try {
        const date = new Date(startDateStr);
        // Vérifier que la date est valide
        if (isNaN(date.getTime())) {
            return '';
        }
        // Soustraire le nombre de jours
        date.setDate(date.getDate() - days);
        // Vérifier à nouveau que la date résultante est valide
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
}

/**
 * Rafraîchit les données depuis IW37N et sauvegarde
 * @returns {Promise<void>}
 */
export async function refreshFromIW37N() {
    console.log('[TPAA-PW] 🔄 Rafraîchissement depuis IW37N...');

    const iw37nData = getIw37nData();
    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N disponible. Veuillez d\'abord importer les données IW37N.');
        return;
    }

    // Filtrer TPAA
    cachedData.tpaaData = iw37nData.filter(row => {
        const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().trim().toUpperCase();
        return designOper.startsWith('TPAA');
    });

    // Filtrer PW
    cachedData.pwData = iw37nData.filter(row => {
        const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().trim().toUpperCase();
        return designOper.startsWith('PW');
    });

    console.log(`[TPAA-PW] Données filtrées: ${cachedData.tpaaData.length} TPAA, ${cachedData.pwData.length} PW`);

    // Sauvegarder sur le serveur (permanent)
    console.log('[TPAA-PW] 🔄 Tentative de sauvegarde sur le serveur...');
    console.log('[TPAA-PW] Données à sauvegarder:', {
        tpaaCount: cachedData.tpaaData.length,
        pwCount: cachedData.pwData.length
    });

    const success = await saveCachedData();

    console.log(`[TPAA-PW] Résultat de la sauvegarde: ${success ? 'SUCCÈS ✅' : 'ÉCHEC ❌'}`);

    // Rafraîchir l'affichage
    renderTPAATable();
    renderPWTable();
    await renderCalendar();

    if (success) {
        alert(`✅ Données rafraîchies et sauvegardées !\n\n${cachedData.tpaaData.length} TPAA et ${cachedData.pwData.length} PW\n\nLes données resteront après un rafraîchissement.`);
    } else {
        alert(`⚠️ Données rafraîchies MAIS non sauvegardées sur le serveur !\n\n⚠️ ATTENTION: Les données seront perdues au rafraîchissement.\nVérifiez que le serveur est démarré.`);
    }
}

/**
 * Charge et affiche les tableaux TPAA et PW depuis le cache ou IW37N
 * @returns {Promise<void>}
 */
export async function loadTPAAPW() {
    console.log('[TPAA-PW] 🔄 Chargement des tableaux TPAA et PW...');
    await loadManualData();
    await loadSortState();

    // Vérifier d'abord si les données sont déjà en mémoire (injectées par server-sync)
    if (cachedData.tpaaData.length > 0 || cachedData.pwData.length > 0) {
        console.log(`[TPAA-PW] ✅ Données déjà en mémoire: ${cachedData.tpaaData.length} TPAA, ${cachedData.pwData.length} PW`);
    } else {
        // Sinon, essayer de charger depuis le serveur
        console.log('[TPAA-PW] 📥 Aucune donnée en mémoire, chargement depuis le serveur...');
        const loaded = await loadTpaaPwCachedData();

        if (loaded) {
            console.log(`[TPAA-PW] ✅ Données chargées depuis le serveur: ${cachedData.tpaaData.length} TPAA, ${cachedData.pwData.length} PW`);
        } else {
            console.log('[TPAA-PW] ℹ️ Aucune donnée sur le serveur, tentative de filtrage depuis IW37N...');
        }
    }

    // Si toujours pas de cache, essayer de charger depuis IW37N
    if (cachedData.tpaaData.length === 0 && cachedData.pwData.length === 0) {
        const iw37nData = getIw37nData();
        console.log(`[TPAA-PW] IW37N disponible: ${iw37nData ? iw37nData.length : 0} lignes`);

        if (iw37nData && iw37nData.length > 0) {
            console.log('[TPAA-PW] 🔍 Filtrage depuis IW37N (cache vide)...');
            cachedData.tpaaData = iw37nData.filter(row => {
                const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().trim().toUpperCase();
                return designOper.startsWith('TPAA');
            });
            cachedData.pwData = iw37nData.filter(row => {
                const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().trim().toUpperCase();
                return designOper.startsWith('PW');
            });

            console.log(`[TPAA-PW] Filtrage terminé: ${cachedData.tpaaData.length} TPAA, ${cachedData.pwData.length} PW`);

            // Sauvegarder automatiquement sur le serveur pour persistance
            console.log('[TPAA-PW] 💾 Sauvegarde automatique des données filtrées...');
            const saveSuccess = await saveCachedData();
            console.log(`[TPAA-PW] Sauvegarde automatique: ${saveSuccess ? 'SUCCÈS ✅' : 'ÉCHEC ❌'}`);
        } else {
            console.log('[TPAA-PW] ⚠️ Aucune donnée IW37N disponible pour filtrage');
        }
    }

    console.log('[TPAA-PW] 🎨 Rendu des tableaux...');
    await renderTPAATable();
    await renderPWTable();
    await renderCalendar();

    // Afficher un message de confirmation (après le rendu)
    const tpaaCount = cachedData.tpaaData?.length || 0;
    const pwCount = cachedData.pwData?.length || 0;
    console.log(`[TPAA-PW] ✅ Tableaux chargés: ${tpaaCount} TPAA, ${pwCount} PW`);
}

/**
 * État du tri et filtrage pour TPAA et PW
 * @type {Object}
 */
let sortState = {
    tpaa: 'asc', // 'asc' | 'desc' | null - Par défaut: tri croissant (dates les plus proches en premier)
    pw: null,   // 'asc' | 'desc' | null
    tpaaSortBy: 'date', // 'date' | 'externe'
    pwSortBy: 'date'    // 'date' | 'externe'
};

/**
 * Sauvegarde l'état du tri sur le serveur
 * @returns {Promise<void>}
 */
async function saveSortState() {
    await saveToStorage('tpaaPwSortState', sortState);
    console.log('[TPAA-PW] ✅ État du tri sauvegardé');
}

/**
 * Charge l'état du tri depuis le serveur
 * @returns {Promise<void>}
 */
async function loadSortState() {
    const saved = await loadFromStorage('tpaaPwSortState');
    if (saved) {
        sortState = saved;
        // Si aucun tri n'était défini, appliquer le tri croissant par défaut pour TPAA (dates les plus proches en premier)
        if (!sortState.tpaa) {
            sortState.tpaa = 'asc';
        }
        console.log('[TPAA-PW] ✅ État du tri restauré:', sortState);
    }
}

/**
 * État des filtres pour TPAA et PW
 * @type {Object}
 */
let filterState = {
    tpaa: {
        designation: '',
        operation: '',
        poste: '',
        date: ''
    },
    pw: {
        designation: '',
        operation: '',
        poste: '',
        date: ''
    }
};

/**
 * Trie le tableau TPAA par date
 * @param {string} order - 'asc' pour croissant, 'desc' pour décroissant
 * @returns {void}
 */
export function sortTPAAByDate(order) {
    sortState.tpaa = order;
    renderTPAATable();
    console.log(`[TPAA-PW] TPAA trié par date: ${order}`);
}

/**
 * Trie le tableau PW par date
 * @param {string} order - 'asc' pour croissant, 'desc' pour décroissant
 * @returns {void}
 */
export function sortPWByDate(order) {
    sortState.pw = order;
    renderPWTable();
    console.log(`[TPAA-PW] PW trié par date: ${order}`);
}

/**
 * Rend le tableau TPAA
 * @returns {Promise<void>}
 */
async function renderTPAATable() {
    const tbody = document.getElementById('tpaa-tbody');
    const countSpan = document.getElementById('tpaa-count');

    if (!tbody) {
        console.warn('[TPAA-PW] Element tpaa-tbody non trouvé');
        return;
    }

    // Récupérer la date de début une seule fois (await)
    const startDate = await getStartDate();

    // Utiliser les données du cache
    let tpaaData = [...(cachedData.tpaaData || [])];

    if (tpaaData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="padding: 30px; text-align: center; color: #666;">
                    ⚠️ Aucune donnée TPAA disponible.<br>
                    <span style="font-size: 0.9em; color: #999;">Cliquez sur "🔄 Rafraîchir depuis IW37N" pour charger les données.</span>
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    // Appliquer les filtres
    if (filterState.tpaa.designation || filterState.tpaa.operation || filterState.tpaa.poste || filterState.tpaa.date) {
        tpaaData = tpaaData.filter(row => {
            const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().toLowerCase();
            const operation = (row['Opération'] || row['Operation'] || '').toString().toLowerCase();
            const posteTechnique = (row['Poste technique'] || row['PosteTechnique'] || row['Technical position'] || '').toString().toLowerCase();
            const weeks = extractNumber(row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '');
            const targetDate = calculateTPAADate(weeks, startDate);

            const matchDesignation = !filterState.tpaa.designation || designOper.includes(filterState.tpaa.designation);
            const matchOperation = !filterState.tpaa.operation || operation.includes(filterState.tpaa.operation);
            const matchPoste = !filterState.tpaa.poste || posteTechnique.includes(filterState.tpaa.poste);
            const matchDate = !filterState.tpaa.date || (targetDate && targetDate.includes(filterState.tpaa.date));

            return matchDesignation && matchOperation && matchPoste && matchDate;
        });
    }

    // Appliquer le tri si demandé
    if (sortState.tpaa) {
        tpaaData = tpaaData.sort((a, b) => {
            if (sortState.tpaaSortBy === 'externe') {
                // Tri par Post.trav.opér. (externe)
                const externeA = (a['Post.trav.opér.'] || a['Post.trav.oper.'] || a['PosteTravOper'] || a['Post. Trav.'] || '').toString().toUpperCase();
                const externeB = (b['Post.trav.opér.'] || b['Post.trav.oper.'] || b['PosteTravOper'] || b['Post. Trav.'] || '').toString().toUpperCase();

                const comparison = externeA.localeCompare(externeB);
                return sortState.tpaa === 'asc' ? comparison : -comparison;
            } else {
                // Tri par date
                const designA = a['Désign. opér.'] || a['Désign.opération'] || a['Design operation'] || '';
                const designB = b['Désign. opér.'] || b['Désign.opération'] || b['Design operation'] || '';

                const weeksA = extractNumber(designA);
                const weeksB = extractNumber(designB);

                const dateA = calculateTPAADate(weeksA, startDate);
                const dateB = calculateTPAADate(weeksB, startDate);

                // Les dates vides vont à la fin
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;

                const comparison = dateA.localeCompare(dateB);
                return sortState.tpaa === 'asc' ? comparison : -comparison;
            }
        });
    }

    console.log(`[TPAA-PW] ${tpaaData.length} travaux TPAA trouvés${sortState.tpaa ? ` (triés ${sortState.tpaa})` : ''}`);

    if (tpaaData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail TPAA trouvé.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    // Rendre les lignes
    tbody.innerHTML = tpaaData.map((row, index) => {
        const ordre = row['Ordre'] || row['ordre'] || '-';
        const operation = row['Opération'] || row['Operation'] || '-';
        const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '-';
        const posteTrav = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || '-';
        const posteTech = row['Poste technique'] || row['PosteTechnique'] || '-';
        const etat = row['Etat'] || row['État'] || '-';

        // Extraire le nombre de semaines et calculer la date (TPAA = date début - semaines)
        const weeks = extractNumber(designOper);
        const targetDate = calculateTPAADate(weeks, startDate);

        // Récupérer les données manuelles avec clé unique basée sur Ordre + Opération + Poste Technique (chaque ligne vraiment indépendante)
        const key = `tpaa-${ordre}-${operation}-${posteTech}`;
        const manual = getManualDataWithFallback(key, ordre, 'tpaa');

        // Calculer la date ajustée
        const adjustment = parseInt(manual.plusQuestion || 0);
        let finalDate = targetDate || '-';
        let dateDisplay = targetDate || '-';

        if (targetDate && adjustment !== 0) {
            const adjustedDate = new Date(targetDate);
            adjustedDate.setDate(adjustedDate.getDate() + adjustment);
            finalDate = adjustedDate.toISOString().split('T')[0];
            dateDisplay = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="font-size: 0.85em; color: #999; text-decoration: line-through;">${targetDate}</div>
                    <div style="font-weight: bold; color: #667eea;">${finalDate}</div>
                </div>
            `;
        } else if (targetDate) {
            dateDisplay = `<div style="font-weight: 600;">${targetDate}</div>`;
        }

        // Définir la couleur de fond et la couleur du texte du statut
        let bgColor, statutColor;
        switch (manual.statut) {
            case 'À faire':
                bgColor = '#ffe0e0'; // Rouge clair
                statutColor = '#c62828'; // Rouge foncé
                break;
            case 'Planifié':
                bgColor = '#e3f2fd'; // Bleu clair
                statutColor = '#1565c0'; // Bleu foncé
                break;
            case 'Terminé':
                bgColor = '#e8f5e9'; // Vert clair
                statutColor = '#2e7d32'; // Vert foncé
                break;
            case 'Annulé':
                bgColor = '#e0e0e0'; // Gris clair
                statutColor = '#616161'; // Gris foncé
                break;
            default:
                bgColor = index % 2 === 0 ? '#f9f9f9' : 'white'; // Alternance par défaut
                statutColor = '#333'; // Couleur par défaut
        }

        return `
            <tr data-key="${key}" style="background: ${bgColor} !important; height: 22px;">
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${ordre}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-weight: 600; color: #667eea; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${designOper}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${operation}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${posteTrav}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${posteTech}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: #667eea; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${weeks || '-'} sem.</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${dateDisplay}</td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; background: ${bgColor} !important;">
                    <div style="display: flex; gap: 2px; align-items: center; justify-content: center;">
                        <button onclick="window.tpaaActions.adjustDays('${key}', -7)"
                                style="padding: 2px 5px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; font-weight: bold;">-7</button>
                        <input type="number" value="${manual.plusQuestion || '0'}"
                               onchange="window.tpaaActions.updateManualField('${key}', 'plusQuestion', this.value)"
                               style="width: 45px; padding: 2px; border: 1px solid #ddd; border-radius: 2px; text-align: center; font-weight: bold; font-size: 10px; height: 18px;">
                        <button onclick="window.tpaaActions.adjustDays('${key}', 7)"
                                style="padding: 2px 5px; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; font-weight: bold;">+7</button>
                    </div>
                </td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; background: ${bgColor} !important;">
                    <select onchange="window.tpaaActions.updateManualField('${key}', 'statut', this.value)"
                            style="width: 100%; padding: 2px; border: 1px solid #ddd; border-radius: 2px; font-weight: bold; color: ${statutColor}; font-size: 10px; height: 20px;">
                        <option value="" ${manual.statut === '' ? 'selected' : ''}>-- Statut --</option>
                        <option value="À faire" ${manual.statut === 'À faire' ? 'selected' : ''}>À faire</option>
                        <option value="Planifié" ${manual.statut === 'Planifié' ? 'selected' : ''}>Planifié</option>
                        <option value="Terminé" ${manual.statut === 'Terminé' ? 'selected' : ''}>Terminé</option>
                        <option value="Annulé" ${manual.statut === 'Annulé' ? 'selected' : ''}>Annulé</option>
                    </select>
                </td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; text-align: center; background: ${bgColor} !important;">
                    <input type="checkbox" ${manual.dateSAP ? 'checked' : ''}
                           onchange="window.tpaaActions.updateManualField('${key}', 'dateSAP', this.checked)"
                           style="width: 15px; height: 15px; cursor: pointer;">
                </td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; background: ${bgColor} !important;">
                    <textarea onchange="window.tpaaActions.updateManualField('${key}', 'commentaire', this.value)"
                              style="width: 100%; padding: 2px; border: 1px solid #ddd; border-radius: 2px; min-height: 20px; font-size: 11px; line-height: 1.2; resize: vertical;">${manual.commentaire}</textarea>
                </td>
            </tr>
        `;
    }).join('');

    if (countSpan) {
        countSpan.textContent = tpaaData.length;
    }

    console.log(`[TPAA-PW] Tableau TPAA rendu: ${tpaaData.length} lignes`);
}

/**
 * Rend le tableau PW
 * @returns {Promise<void>}
 */
async function renderPWTable() {
    const tbody = document.getElementById('pw-tbody');
    const countSpan = document.getElementById('pw-count');

    if (!tbody) {
        console.warn('[TPAA-PW] Element pw-tbody non trouvé');
        return;
    }

    // Récupérer la date de début une seule fois (await)
    const startDate = await getStartDate();

    // Utiliser les données du cache
    let pwData = [...(cachedData.pwData || [])];

    if (pwData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="padding: 30px; text-align: center; color: #666;">
                    ⚠️ Aucune donnée PW disponible.<br>
                    <span style="font-size: 0.9em; color: #999;">Cliquez sur "🔄 Rafraîchir depuis IW37N" pour charger les données.</span>
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    // Appliquer les filtres
    if (filterState.pw.designation || filterState.pw.operation || filterState.pw.poste || filterState.pw.date) {
        pwData = pwData.filter(row => {
            const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().toLowerCase();
            const operation = (row['Opération'] || row['Operation'] || '').toString().toLowerCase();
            const posteTechnique = (row['Poste technique'] || row['PosteTechnique'] || row['Technical position'] || '').toString().toLowerCase();
            const days = extractNumber(row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '');
            const targetDate = calculatePWDate(days, startDate);

            const matchDesignation = !filterState.pw.designation || designOper.includes(filterState.pw.designation);
            const matchOperation = !filterState.pw.operation || operation.includes(filterState.pw.operation);
            const matchPoste = !filterState.pw.poste || posteTechnique.includes(filterState.pw.poste);
            const matchDate = !filterState.pw.date || (targetDate && targetDate.includes(filterState.pw.date));

            return matchDesignation && matchOperation && matchPoste && matchDate;
        });
    }

    // Appliquer le tri si demandé
    if (sortState.pw) {
        pwData = pwData.sort((a, b) => {
            if (sortState.pwSortBy === 'externe') {
                // Tri par Post.trav.opér. (externe)
                const externeA = (a['Post.trav.opér.'] || a['Post.trav.oper.'] || a['PosteTravOper'] || a['Post. Trav.'] || '').toString().toUpperCase();
                const externeB = (b['Post.trav.opér.'] || b['Post.trav.oper.'] || b['PosteTravOper'] || b['Post. Trav.'] || '').toString().toUpperCase();

                const comparison = externeA.localeCompare(externeB);
                return sortState.pw === 'asc' ? comparison : -comparison;
            } else {
                // Tri par date
                const designA = a['Désign. opér.'] || a['Désign.opération'] || a['Design operation'] || '';
                const designB = b['Désign. opér.'] || b['Désign.opération'] || b['Design operation'] || '';

                const daysA = extractNumber(designA);
                const daysB = extractNumber(designB);

                const dateA = calculatePWDate(daysA, startDate);
                const dateB = calculatePWDate(daysB, startDate);

                // Les dates vides vont à la fin
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;

                const comparison = dateA.localeCompare(dateB);
                return sortState.pw === 'asc' ? comparison : -comparison;
            }
        });
    }

    console.log(`[TPAA-PW] ${pwData.length} travaux PW trouvés${sortState.pw ? ` (triés ${sortState.pw})` : ''}`);

    if (pwData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail PW trouvé.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    // Rendre les lignes
    tbody.innerHTML = pwData.map((row, index) => {
        const ordre = row['Ordre'] || row['ordre'] || '-';
        const operation = row['Opération'] || row['Operation'] || '-';
        const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '-';
        const posteTrav = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || '-';
        const posteTech = row['Poste technique'] || row['PosteTechnique'] || '-';
        const etat = row['Etat'] || row['État'] || '-';

        // Extraire le nombre de jours et calculer la date (PW = date début - jours)
        const days = extractNumber(designOper);
        const targetDate = calculatePWDate(days, startDate);

        // Récupérer les données manuelles avec clé unique basée sur Ordre + Opération + Poste Technique (chaque ligne vraiment indépendante)
        const key = `pw-${ordre}-${operation}-${posteTech}`;
        const manual = getManualDataWithFallback(key, ordre, 'pw');

        // Calculer la date ajustée
        const adjustment = parseInt(manual.plusQuestion || 0);
        let finalDate = targetDate || '-';
        let dateDisplay = targetDate || '-';

        if (targetDate && adjustment !== 0) {
            const adjustedDate = new Date(targetDate);
            adjustedDate.setDate(adjustedDate.getDate() + adjustment);
            finalDate = adjustedDate.toISOString().split('T')[0];
            dateDisplay = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="font-size: 0.85em; color: #999; text-decoration: line-through;">${targetDate}</div>
                    <div style="font-weight: bold; color: #28a745;">${finalDate}</div>
                </div>
            `;
        } else if (targetDate) {
            dateDisplay = `<div style="font-weight: 600;">${targetDate}</div>`;
        }

        // Définir la couleur de fond et la couleur du texte du statut
        let bgColor, statutColor;
        switch (manual.statut) {
            case 'À faire':
                bgColor = '#ffe0e0'; // Rouge clair
                statutColor = '#c62828'; // Rouge foncé
                break;
            case 'Planifié':
                bgColor = '#e3f2fd'; // Bleu clair
                statutColor = '#1565c0'; // Bleu foncé
                break;
            case 'Terminé':
                bgColor = '#e8f5e9'; // Vert clair
                statutColor = '#2e7d32'; // Vert foncé
                break;
            case 'Annulé':
                bgColor = '#e0e0e0'; // Gris clair
                statutColor = '#616161'; // Gris foncé
                break;
            default:
                bgColor = index % 2 === 0 ? '#f9f9f9' : 'white'; // Alternance par défaut
                statutColor = '#333'; // Couleur par défaut
        }

        return `
            <tr data-key="${key}" style="background: ${bgColor} !important; height: 22px;">
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${ordre}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-weight: 600; color: #28a745; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${designOper}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${operation}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${posteTrav}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${posteTech}</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: #28a745; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${days || '-'} jours</td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${bgColor} !important; font-size: 11px; line-height: 1.2;">${dateDisplay}</td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; background: ${bgColor} !important;">
                    <div style="display: flex; gap: 2px; align-items: center; justify-content: center;">
                        <button onclick="window.tpaaActions.adjustDays('${key}', -7)"
                                style="padding: 2px 5px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; font-weight: bold;">-7</button>
                        <input type="number" value="${manual.plusQuestion || '0'}"
                               onchange="window.tpaaActions.updateManualField('${key}', 'plusQuestion', this.value)"
                               style="width: 45px; padding: 2px; border: 1px solid #ddd; border-radius: 2px; text-align: center; font-weight: bold; font-size: 10px; height: 18px;">
                        <button onclick="window.tpaaActions.adjustDays('${key}', 7)"
                                style="padding: 2px 5px; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; font-weight: bold;">+7</button>
                    </div>
                </td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; background: ${bgColor} !important;">
                    <select onchange="window.tpaaActions.updateManualField('${key}', 'statut', this.value)"
                            style="width: 100%; padding: 2px; border: 1px solid #ddd; border-radius: 2px; font-weight: bold; color: ${statutColor}; font-size: 10px; height: 20px;">
                        <option value="" ${manual.statut === '' ? 'selected' : ''}>-- Statut --</option>
                        <option value="À faire" ${manual.statut === 'À faire' ? 'selected' : ''}>À faire</option>
                        <option value="Planifié" ${manual.statut === 'Planifié' ? 'selected' : ''}>Planifié</option>
                        <option value="Terminé" ${manual.statut === 'Terminé' ? 'selected' : ''}>Terminé</option>
                        <option value="Annulé" ${manual.statut === 'Annulé' ? 'selected' : ''}>Annulé</option>
                    </select>
                </td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; text-align: center; background: ${bgColor} !important;">
                    <input type="checkbox" ${manual.dateSAP ? 'checked' : ''}
                           onchange="window.tpaaActions.updateManualField('${key}', 'dateSAP', this.checked)"
                           style="width: 15px; height: 15px; cursor: pointer;">
                </td>
                <td style="padding: 2px 3px; border: 1px solid #dee2e6; background: ${bgColor} !important;">
                    <textarea onchange="window.tpaaActions.updateManualField('${key}', 'commentaire', this.value)"
                              style="width: 100%; padding: 2px; border: 1px solid #ddd; border-radius: 2px; min-height: 20px; font-size: 11px; line-height: 1.2; resize: vertical;">${manual.commentaire}</textarea>
                </td>
            </tr>
        `;
    }).join('');

    if (countSpan) {
        countSpan.textContent = pwData.length;
    }

    console.log(`[TPAA-PW] Tableau PW rendu: ${pwData.length} lignes`);
}

/**
 * Exporte les données TPAA vers Excel
 * @returns {void}
 */
export function exportTPAAListToExcel() {
    const iw37nData = getIw37nData();
    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N disponible.');
        return;
    }

    // Filtrer les travaux TPAA
    const tpaaData = iw37nData.filter(row => {
        const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().trim().toUpperCase();
        return designOper.startsWith('TPAA');
    });

    if (tpaaData.length === 0) {
        alert('⚠️ Aucun travail TPAA à exporter.');
        return;
    }

    try {
        const exportData = tpaaData.map(row => ({
            'État': row['Etat'] || row['État'] || '',
            'Ordre': row['Ordre'] || row['ordre'] || '',
            'Désignation': row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '',
            'Opération': row['Opération'] || row['Operation'] || '',
            'Post. Trav.': row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || '',
            'Poste technique': row['Poste technique'] || row['PosteTechnique'] || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'TPAA');

        const fileName = `TPAA_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[TPAA-PW] Export TPAA réussi:', fileName);
    } catch (error) {
        console.error('[TPAA-PW] Erreur export TPAA:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Exporte les données PW vers Excel
 * @returns {void}
 */
export function exportPWListToExcel() {
    const iw37nData = getIw37nData();
    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N disponible.');
        return;
    }

    // Filtrer les travaux PW
    const pwData = iw37nData.filter(row => {
        const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().trim().toUpperCase();
        return designOper.startsWith('PW');
    });

    if (pwData.length === 0) {
        alert('⚠️ Aucun travail PW à exporter.');
        return;
    }

    try {
        const exportData = pwData.map(row => ({
            'État': row['Etat'] || row['État'] || '',
            'Ordre': row['Ordre'] || row['ordre'] || '',
            'Désignation': row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '',
            'Opération': row['Opération'] || row['Operation'] || '',
            'Post. Trav.': row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || '',
            'Poste technique': row['Poste technique'] || row['PosteTechnique'] || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PW');

        const fileName = `PW_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[TPAA-PW] Export PW réussi:', fileName);
    } catch (error) {
        console.error('[TPAA-PW] Erreur export PW:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données manuelles pour une clé, avec fallback sur l'ancien format
 * @param {string} newKey - Nouvelle clé (ex: "tpaa-113703848-0005-6500ABAS2202")
 * @param {string} ordre - Numéro d'ordre
 * @param {string} type - "tpaa" ou "pw"
 * @returns {Object} Données manuelles
 */
function getManualDataWithFallback(newKey, ordre, type) {
    // Essayer d'abord avec la nouvelle clé (spécifique à la ligne)
    if (manualData[newKey]) {
        return manualData[newKey];
    }

    // Fallback : essayer avec l'ancien format (basé seulement sur l'ordre)
    const oldKey = `${type}-${ordre}`;
    if (manualData[oldKey]) {
        // Migrer automatiquement vers le nouveau format
        console.log(`[TPAA-PW] Migration de ${oldKey} vers ${newKey}`);
        manualData[newKey] = {...manualData[oldKey]};
        // Supprimer l'ancienne clé pour éviter les doublons
        delete manualData[oldKey];
        // Sauvegarder immédiatement
        saveManualData().catch(err => console.error('[TPAA-PW] Erreur migration:', err));
        return manualData[newKey];
    }

    // Valeurs par défaut
    return { plusQuestion: '0', statut: '', commentaire: '', dateSAP: false };
}

/**
 * Met à jour un champ manuel (statut, commentaire, +?)
 * @param {string} key - Clé unique (ex: "tpaa-12345-0010-POSTE123" ou "pw-67890-0020-POSTE456")
 * @param {string} field - Nom du champ (plusQuestion, statut, commentaire)
 * @param {string} value - Nouvelle valeur
 * @returns {Promise<void>}
 */
export async function updateManualField(key, field, value) {
    if (!manualData[key]) {
        manualData[key] = { plusQuestion: '0', statut: '', commentaire: '', dateSAP: false };
    }
    manualData[key][field] = value;

    // Mise à jour optimiste pour le champ +? (sans re-rendre tout le tableau)
    if (field === 'plusQuestion') {
        const newValue = parseInt(value || 0);
        updateDateDisplayForRow(key, newValue);
        console.log(`[TPAA-PW] Champ ${field} mis à jour (optimiste) pour ${key}: ${newValue}`);
        // Mettre à jour le calendrier en arrière-plan
        console.log('[TPAA-PW] Rafraîchissement du calendrier (updateManualField)...');
        setTimeout(() => {
            renderCalendar().then(() => {
                console.log('[TPAA-PW] ✅ Calendrier rafraîchi (updateManualField)');
            }).catch(err => {
                console.error('[TPAA-PW] ❌ Erreur rafraîchissement calendrier:', err);
            });
        }, 100);
    } else if (field === 'statut') {
        // Quand on change le statut, re-rendre le tableau pour appliquer les couleurs
        if (key.startsWith('tpaa-')) {
            renderTPAATable();
        } else if (key.startsWith('pw-')) {
            renderPWTable();
        }
        console.log(`[TPAA-PW] Statut mis à jour pour ${key}: ${value}`);
    } else {
        console.log(`[TPAA-PW] Champ ${field} mis à jour pour ${key}`);
    }

    // Sauvegarder en arrière-plan (sans bloquer l'interface)
    saveManualData().catch(err => {
        console.error('[TPAA-PW] Erreur sauvegarde:', err);
    });
}

// ================================
// CALENDRIER MENSUEL
// ================================

/**
 * Date actuelle du calendrier
 * @type {Date}
 */
let currentCalendarDate = new Date();

/**
 * Rend le calendrier mensuel avec les TPAA et PW
 * @returns {void}
 */
export async function renderCalendar() {
    console.log('[TPAA-PW] 🔄 renderCalendar appelé');
    const container = document.getElementById('tpaaPWCalendar');
    if (!container) {
        console.warn('[TPAA-PW] ⚠️ Element tpaaPWCalendar non trouvé - calendrier ne peut pas être affiché');
        return;
    }
    console.log('[TPAA-PW] ✅ Container calendrier trouvé, génération en cours...');

    // Récupérer la date de début une seule fois (await)
    const startDate = await getStartDate();

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); // 0-11

    // Utiliser les données en cache (déjà filtrées et persistées)
    const tpaaData = cachedData.tpaaData || [];
    const pwData = cachedData.pwData || [];

    if (tpaaData.length === 0 && pwData.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                ⚠️ Aucune donnée TPAA/PW disponible pour afficher le calendrier.
            </div>
        `;
        return;
    }

    // Créer une map de dates -> travaux
    const dateMap = {};

    // Ajouter les TPAA (calcul en semaines avec ajustements manuels)
    tpaaData.forEach((row, index) => {
        const ordre = row['Ordre'] || row['ordre'] || '-';
        const operation = row['Opération'] || row['Operation'] || '-';
        const posteTech = row['Poste technique'] || row['PosteTechnique'] || '-';
        const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '';
        const weeks = extractNumber(designOper);
        let targetDate = calculateTPAADate(weeks, startDate);

        // Appliquer l'ajustement manuel si présent (clé basée sur Ordre + Opération + Poste Technique - chaque ligne vraiment indépendante)
        const key = `tpaa-${ordre}-${operation}-${posteTech}`;
        const manual = getManualDataWithFallback(key, ordre, 'tpaa');
        const adjustment = parseInt(manual.plusQuestion || 0);

        if (targetDate && adjustment !== 0) {
            const adjustedDate = new Date(targetDate);
            adjustedDate.setDate(adjustedDate.getDate() + adjustment);
            targetDate = adjustedDate.toISOString().split('T')[0];
        }

        if (targetDate) {
            if (!dateMap[targetDate]) {
                dateMap[targetDate] = { tpaa: [], pw: [] };
            }
            dateMap[targetDate].tpaa.push(row);
        }
    });

    // Ajouter les PW (calcul en jours avec ajustements manuels)
    pwData.forEach((row, index) => {
        const ordre = row['Ordre'] || row['ordre'] || '-';
        const operation = row['Opération'] || row['Operation'] || '-';
        const posteTech = row['Poste technique'] || row['PosteTechnique'] || '-';
        const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '';
        const days = extractNumber(designOper);
        let targetDate = calculatePWDate(days, startDate);

        // Appliquer l'ajustement manuel si présent (clé basée sur Ordre + Opération + Poste Technique - chaque ligne vraiment indépendante)
        const key = `pw-${ordre}-${operation}-${posteTech}`;
        const manual = getManualDataWithFallback(key, ordre, 'pw');
        const adjustment = parseInt(manual.plusQuestion || 0);

        if (targetDate && adjustment !== 0) {
            const adjustedDate = new Date(targetDate);
            adjustedDate.setDate(adjustedDate.getDate() + adjustment);
            targetDate = adjustedDate.toISOString().split('T')[0];
        }

        if (targetDate) {
            if (!dateMap[targetDate]) {
                dateMap[targetDate] = { tpaa: [], pw: [] };
            }
            dateMap[targetDate].pw.push(row);
        }
    });

    // Générer le calendrier HTML
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Premier jour du mois (0 = dimanche, 6 = samedi)
    const firstDay = new Date(year, month, 1).getDay();
    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `
        <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
            <button onclick="window.tpaaActions.previousMonth()"
                    style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                ◀ Mois Précédent
            </button>
            <h3 style="margin: 0; color: #667eea; font-size: 1.3em;">
                📅 ${monthNames[month]} ${year}
            </h3>
            <button onclick="window.tpaaActions.nextMonth()"
                    style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                Mois Suivant ▶
            </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;">
    `;

    // En-têtes des jours
    dayNames.forEach(day => {
        html += `
            <div style="padding: 10px; background: #667eea; color: white; text-align: center; font-weight: bold; border-radius: 4px;">
                ${day}
            </div>
        `;
    });

    // Cellules vides avant le premier jour
    for (let i = 0; i < firstDay; i++) {
        html += `<div style="padding: 10px; background: #f0f0f0; border-radius: 4px;"></div>`;
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const works = dateMap[dateStr] || { tpaa: [], pw: [] };

        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        const bgColor = isToday ? '#fffacd' : 'white';

        let cellContent = `
            <div style="padding: 8px; background: ${bgColor}; border: 1px solid #ddd; border-radius: 4px; min-height: 80px; position: relative;">
                <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${day}</div>
        `;

        // Afficher les TPAA
        if (works.tpaa.length > 0) {
            cellContent += `
                <div style="font-size: 0.75em; background: #667eea; color: white; padding: 2px 4px; border-radius: 3px; margin-bottom: 2px; cursor: help;"
                     title="${works.tpaa.map(w => w['Désign. opér.'] + ' - ' + (w['Ordre'] || '')).join('\n')}">
                    📋 ${works.tpaa.length} TPAA
                </div>
            `;
        }

        // Afficher les PW
        if (works.pw.length > 0) {
            cellContent += `
                <div style="font-size: 0.75em; background: #28a745; color: white; padding: 2px 4px; border-radius: 3px; cursor: help;"
                     title="${works.pw.map(w => w['Désign. opér.'] + ' - ' + (w['Ordre'] || '')).join('\n')}">
                    🔧 ${works.pw.length} PW
                </div>
            `;
        }

        cellContent += `</div>`;
        html += cellContent;
    }

    html += `</div>`;

    container.innerHTML = html;
    console.log(`[TPAA-PW] Calendrier rendu: ${monthNames[month]} ${year}`);
}

/**
 * Navigue vers le mois précédent
 * @returns {void}
 */
export async function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    await renderCalendar();
}

/**
 * Navigue vers le mois suivant
 * @returns {void}
 */
export async function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    await renderCalendar();
}

/**
 * Exporte les données TPAA vers Excel
 * @returns {boolean} Succès de l'export
 */
export function exportTPAAToExcel() {
    if (!cachedData.tpaaData || cachedData.tpaaData.length === 0) {
        alert('⚠️ Aucune donnée TPAA à exporter.');
        return false;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[TPAA-PW] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return false;
    }

    try {
        // Préparer les données pour l'export
        const exportData = cachedData.tpaaData.map(item => ({
            'Ordre': item['Ordre'] || '',
            'Opération': item['Opération'] || '',
            'Désign. opér.': item['Désign. opér.'] || '',
            'Post. Trav.': item['Post. trav.'] || '',
            'Poste Technique': item['Poste technique'] || '',
            'Nbr sem': item['Nbr sem'] || '',
            'Date': item['Date'] || '',
            'Statut': item['Statut'] || '',
            '+? jours': item['+? jours'] || '',
            'Commentaire': item['Commentaire'] || ''
        }));

        // Créer le workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        XLSX.utils.book_append_sheet(wb, ws, 'Liste TPAA');

        // Télécharger le fichier
        const fileName = `Liste_TPAA_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        console.log(`[TPAA-PW] ✅ Fichier exporté: ${fileName}`);
        alert(`✅ Export Excel réussi: ${cachedData.tpaaData.length} TPAA exportés !`);
        return true;
    } catch (error) {
        console.error('[TPAA-PW] ❌ Erreur lors de l\'export TPAA:', error);
        alert('❌ Erreur lors de l\'export Excel.');
        return false;
    }
}

/**
 * Exporte les données PW vers Excel
 * @returns {boolean} Succès de l'export
 */
export function exportPWToExcel() {
    if (!cachedData.pwData || cachedData.pwData.length === 0) {
        alert('⚠️ Aucune donnée PW à exporter.');
        return false;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[TPAA-PW] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return false;
    }

    try {
        const exportData = cachedData.pwData.map(pw => ({
            'Ordre': pw['Ordre'] || '',
            'Opération': pw['Opération'] || '',
            'Désign. opér.': pw['Désign. opér.'] || '',
            'Plan d ent': pw['Plan d ent'] || '',
            'Texte PlanEntr.': pw['Texte PlanEntr.'] || '',
            'Interval': pw['Interval'] || '',
            'Un.interv.': pw['Un.interv.'] || '',
            'Secteur': pw['Secteur'] || '',
            'Nbr sem': pw['Nbr sem'] || '',
            'Date': pw['Date'] || '',
            'Statut': pw['Statut'] || '',
            '+? jours': pw['+? jours'] || '',
            'Commentaire': pw['Commentaire'] || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PW');

        const date = new Date().toISOString().split('T')[0];
        const filename = `liste-pw-${date}.xlsx`;

        XLSX.writeFile(wb, filename);

        console.log(`[TPAA-PW] ✅ Export Excel réussi: ${filename}`);
        alert(`✅ Export Excel réussi: ${cachedData.pwData.length} PW exportés !`);
        return true;
    } catch (error) {
        console.error('[TPAA-PW] ❌ Erreur lors de l\'export PW:', error);
        alert('❌ Erreur lors de l\'export Excel.');
        return false;
    }
}

/**
 * Trie le tableau TPAA par un champ spécifique
 * @param {string} field - 'date' ou 'externe'
 * @param {string} order - 'asc' ou 'desc'
 * @returns {void}
 */
export async function sortTPAABy(field, order) {
    sortState.tpaa = order;
    sortState.tpaaSortBy = field;
    await saveSortState();
    renderTPAATable();
    console.log(`[TPAA-PW] TPAA trié par ${field}: ${order}`);
}

/**
 * Trie le tableau PW par un champ spécifique
 * @param {string} field - 'date' ou 'externe'
 * @param {string} order - 'asc' ou 'desc'
 * @returns {void}
 */
export async function sortPWBy(field, order) {
    sortState.pw = order;
    sortState.pwSortBy = field;
    await saveSortState();
    renderPWTable();
    console.log(`[TPAA-PW] PW trié par ${field}: ${order}`);
}

/**
 * Filtre le tableau TPAA selon les critères de recherche
 * @returns {void}
 */
export function filterTPAA() {
    const searchDesignation = document.getElementById('tpaa-search-designation')?.value || '';
    const searchOperation = document.getElementById('tpaa-search-operation')?.value || '';
    const searchPoste = document.getElementById('tpaa-search-poste')?.value || '';
    const searchDate = document.getElementById('tpaa-search-date')?.value || '';

    filterState.tpaa.designation = searchDesignation.toLowerCase();
    filterState.tpaa.operation = searchOperation.toLowerCase();
    filterState.tpaa.poste = searchPoste.toLowerCase();
    filterState.tpaa.date = searchDate.toLowerCase();

    renderTPAATable();
    console.log(`[TPAA-PW] Filtrage TPAA appliqué:`, filterState.tpaa);
}

/**
 * Filtre le tableau PW selon les critères de recherche
 * @returns {void}
 */
export function filterPW() {
    const searchDesignation = document.getElementById('pw-search-designation')?.value || '';
    const searchOperation = document.getElementById('pw-search-operation')?.value || '';
    const searchPoste = document.getElementById('pw-search-poste')?.value || '';
    const searchDate = document.getElementById('pw-search-date')?.value || '';

    filterState.pw.designation = searchDesignation.toLowerCase();
    filterState.pw.operation = searchOperation.toLowerCase();
    filterState.pw.poste = searchPoste.toLowerCase();
    filterState.pw.date = searchDate.toLowerCase();

    renderPWTable();
    console.log(`[TPAA-PW] Filtrage PW appliqué:`, filterState.pw);
}

/**
 * Efface tous les filtres TPAA
 * @returns {void}
 */
export async function clearTPAAFilters() {
    const searchDesignation = document.getElementById('tpaa-search-designation');
    const searchOperation = document.getElementById('tpaa-search-operation');
    const searchPoste = document.getElementById('tpaa-search-poste');
    const searchDate = document.getElementById('tpaa-search-date');

    if (searchDesignation) searchDesignation.value = '';
    if (searchOperation) searchOperation.value = '';
    if (searchPoste) searchPoste.value = '';
    if (searchDate) searchDate.value = '';

    filterState.tpaa = { designation: '', operation: '', poste: '', date: '' };
    sortState.tpaa = null;
    sortState.tpaaSortBy = 'date';

    await saveSortState();
    renderTPAATable();
    console.log('[TPAA-PW] Filtres TPAA effacés');
}

/**
 * Efface tous les filtres PW
 * @returns {void}
 */
export async function clearPWFilters() {
    const searchDesignation = document.getElementById('pw-search-designation');
    const searchOperation = document.getElementById('pw-search-operation');
    const searchPoste = document.getElementById('pw-search-poste');
    const searchDate = document.getElementById('pw-search-date');

    if (searchDesignation) searchDesignation.value = '';
    if (searchOperation) searchOperation.value = '';
    if (searchPoste) searchPoste.value = '';
    if (searchDate) searchDate.value = '';

    filterState.pw = { designation: '', operation: '', poste: '', date: '' };
    sortState.pw = null;
    sortState.pwSortBy = 'date';

    await saveSortState();
    renderPWTable();
    console.log('[TPAA-PW] Filtres PW effacés');
}

/**
 * Ajuste le nombre de jours dans la colonne +?
 * @param {string} key - Clé unique (ex: "tpaa-12345-0010-POSTE123" ou "pw-67890-0020-POSTE456")
 * @param {number} adjustment - Nombre de jours à ajouter/soustraire (ex: 7 ou -7)
 * @returns {Promise<void>}
 */
export async function adjustDays(key, adjustment) {
    if (!manualData[key]) {
        manualData[key] = { plusQuestion: '0', statut: '', commentaire: '', dateSAP: false };
    }

    // Récupérer la valeur actuelle et l'ajuster
    const currentValue = parseInt(manualData[key].plusQuestion || 0);
    const newValue = currentValue + adjustment;

    // Mettre à jour la valeur
    manualData[key].plusQuestion = newValue.toString();

    console.log(`[TPAA-PW] Ajustement de ${adjustment} jours pour ${key}: ${currentValue} → ${newValue}`);

    // Mise à jour optimiste : mettre à jour l'interface immédiatement
    updateDateDisplayForRow(key, newValue);

    // Mettre à jour le calendrier en arrière-plan
    console.log('[TPAA-PW] Rafraîchissement du calendrier...');
    setTimeout(() => {
        renderCalendar().then(() => {
            console.log('[TPAA-PW] ✅ Calendrier rafraîchi');
        }).catch(err => {
            console.error('[TPAA-PW] ❌ Erreur rafraîchissement calendrier:', err);
        });
    }, 100);

    // Sauvegarder en arrière-plan (sans bloquer l'interface)
    saveManualData().catch(err => {
        console.error('[TPAA-PW] Erreur sauvegarde:', err);
    });
}

/**
 * Met à jour l'affichage de la date pour une ligne spécifique (mise à jour optimiste)
 * @param {string} key - Clé unique (ex: "tpaa-12345-0010-POSTE123" ou "pw-67890-0020-POSTE456")
 * @param {number} adjustment - Nombre de jours d'ajustement
 * @returns {void}
 */
function updateDateDisplayForRow(key, adjustment) {
    // Trouver la ligne dans le tableau en utilisant l'attribut data-key
    const tbody = key.startsWith('tpaa-') ? document.getElementById('tpaa-tbody') : document.getElementById('pw-tbody');
    if (!tbody) {
        console.warn('[TPAA-PW] tbody non trouvé pour', key);
        return;
    }

    // Trouver la ligne spécifique par son attribut data-key
    const row = tbody.querySelector(`tr[data-key="${key}"]`);

    if (row) {
        // Mettre à jour la valeur du champ input
        const input = row.querySelector('input[type="number"]');
        if (input) {
            // Mettre à jour la valeur du champ input
            input.value = adjustment;

            // Trouver la cellule de date (colonne 7 pour TPAA et PW après suppression de la colonne État)
            const cells = row.querySelectorAll('td');
            const dateCell = cells[6]; // Index 6 = 7ème colonne (Date)

            if (dateCell) {
                // Extraire la date originale depuis les données
                const ordre = cells[0].textContent.trim(); // Colonne Ordre
                const operation = cells[2].textContent.trim(); // Colonne Opération
                const posteTech = cells[4].textContent.trim(); // Colonne Poste technique
                const isTpaa = key.startsWith('tpaa-');

                // Trouver les données correspondantes par Ordre + Opération + Poste Technique (ligne vraiment indépendante)
                const dataArray = isTpaa ? cachedData.tpaaData : cachedData.pwData;
                const rowData = dataArray.find(r =>
                    (r['Ordre'] || r['ordre']) === ordre &&
                    (r['Opération'] || r['Operation']) === operation &&
                    (r['Poste technique'] || r['PosteTechnique']) === posteTech
                );

                if (rowData) {
                    const designOper = rowData['Désign. opér.'] || rowData['Désign.opération'] || rowData['Design operation'] || '';
                    const number = extractNumber(designOper);

                    // Calculer la date de base
                    const startDate = getStartDate();

                    Promise.resolve(startDate).then(dateStr => {
                        const targetDate = isTpaa ? calculateTPAADate(number, dateStr) : calculatePWDate(number, dateStr);

                        if (targetDate && adjustment !== 0) {
                            const adjustedDate = new Date(targetDate);
                            adjustedDate.setDate(adjustedDate.getDate() + parseInt(adjustment));
                            const finalDate = adjustedDate.toISOString().split('T')[0];

                            const color = isTpaa ? '#667eea' : '#28a745';
                            dateCell.innerHTML = `
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <div style="font-size: 0.85em; color: #999; text-decoration: line-through;">${targetDate}</div>
                                    <div style="font-weight: bold; color: ${color};">${finalDate}</div>
                                </div>
                            `;
                        } else if (targetDate) {
                            dateCell.innerHTML = `<div style="font-weight: 600;">${targetDate}</div>`;
                        }
                    });
                }
            }
        }
    } else {
        console.warn('[TPAA-PW] Ligne non trouvée pour la clé:', key);
    }
}

// Exposer les fonctions globalement pour l'utilisation dans les boutons HTML
if (typeof window !== 'undefined') {
    window.tpaaPwActions = {
        loadTPAAPW,
        refreshFromIW37N,
        sortTPAAByDate,
        sortPWByDate,
        sortTPAABy,
        sortPWBy,
        filterTPAA,
        filterPW,
        clearTPAAFilters,
        clearPWFilters,
        exportTPAAToExcel,
        exportPWToExcel,
        updateManualField,
        adjustDays,
        previousMonth,
        nextMonth
    };

    // Alias pour compatibilité avec les anciens appels dans le HTML
    window.tpaaActions = window.tpaaPwActions; // Alias pour les boutons de recherche/tri
    window.syncTPAAFromIw37n = refreshFromIW37N;
    window.syncPWFromIw37n = refreshFromIW37N;
    window.sortTPAAByDate = sortTPAAByDate;
    window.sortPWByDate = sortPWByDate;
    window.exportTPAAToExcel = exportTPAAToExcel;
    window.exportPWToExcel = exportPWToExcel;

    console.log('[TPAA-PW] ✅ Actions exposées globalement (avec alias de compatibilité)');
}

/**
 * Récupère les données TPAA
 * @returns {Array} Données TPAA
 */
export function getTPAAData() {
    return cachedData.tpaaData || [];
}

/**
 * Récupère les données PW
 * @returns {Array} Données PW
 */
export function getPWData() {
    return cachedData.pwData || [];
}

/**
 * Récupère les données manuelles (statuts, commentaires, ajustements)
 * @returns {Object} Données manuelles
 */
export function getManualData() {
    return manualData || {};
}

