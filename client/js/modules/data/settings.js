/**
 * @fileoverview Gestion des Paramètres de l'Arrêt Annuel
 * @module data/settings
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les paramètres
 * @const {string}
 */
const SETTINGS_KEY = 'arretAnnuelSettings';

/**
 * Structure des paramètres par défaut
 * @type {Object}
 */
const defaultSettings = {
    startDate: '',
    endDate: '',
    budget: 0,
    lastUpdated: null
};

/**
 * Cache des paramètres en mémoire
 * @type {Object}
 */
let settingsCache = null;

/**
 * Set settings data (utilisé par server-sync pour injecter les données)
 * @param {Object} data - Données à définir
 */
export function setSettings(data) {
    settingsCache = data || { ...defaultSettings };
    console.log(`[SETTINGS] ✅ Données injectées depuis le serveur:`, settingsCache);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setSettings = setSettings;
    console.log('[SETTINGS] ✅ window.setSettings exposée');
}

/**
 * Invalide le cache des paramètres pour forcer un rechargement
 * @returns {void}
 */
export function invalidateSettingsCache() {
    console.log('[SETTINGS] Cache invalidé');
    settingsCache = null;
}

/**
 * Charge les paramètres depuis le serveur
 * Les données sont chargées depuis le serveur via storage-wrapper
 * @param {boolean} forceReload - Forcer le rechargement même si le cache existe
 * @returns {Promise<Object>} Les paramètres chargés ou par défaut
 */
export async function loadSettings(forceReload = false) {
    console.log(`[SETTINGS] 🔍 loadSettings appelé (forceReload=${forceReload})`);

    // Si forceReload est demandé, invalider le cache
    if (forceReload) {
        console.log('[SETTINGS] ♻️ Cache invalidé (forceReload=true)');
        settingsCache = null;
    }

    // Si on a déjà le cache (injecté par server-sync), le retourner
    if (settingsCache && !forceReload) {
        console.log('[SETTINGS] Utilisation du cache (depuis serveur):', settingsCache);
        return settingsCache;
    }

    // Charger depuis le serveur via storage-wrapper
    console.log(`[SETTINGS] 📡 Appel loadFromStorage avec clé: ${SETTINGS_KEY}`);
    const saved = await loadFromStorage(SETTINGS_KEY);
    console.log('[SETTINGS] 📦 Réponse de loadFromStorage:', saved);

    if (saved) {
        settingsCache = saved;
        console.log('[SETTINGS] ✅ Paramètres chargés depuis le serveur:', saved);
        return settingsCache;
    }

    console.warn('[SETTINGS] ⚠️ Aucun paramètre trouvé, utilisation des valeurs par défaut');
    console.warn('[SETTINGS] defaultSettings:', defaultSettings);
    settingsCache = { ...defaultSettings };
    return settingsCache;
}

/**
 * Sauvegarde les paramètres sur le serveur
 * @param {Object} settings - Les paramètres à sauvegarder
 * @returns {Promise<boolean>} True si succès, false sinon
 */
export async function saveSettings(settings) {
    try {
        console.log('[SETTINGS] 💾 Tentative de sauvegarde:', settings);
        settings.lastUpdated = new Date().toISOString();

        // Mettre à jour le cache
        settingsCache = settings;

        // Sauvegarder via storage-wrapper (serveur uniquement)
        console.log('[SETTINGS] Appel saveToStorage avec clé:', SETTINGS_KEY);
        const success = await saveToStorage(SETTINGS_KEY, settings, false);
        
        if (success) {
            console.log('[SETTINGS] ✅ Paramètres sauvegardés sur le serveur');
        } else {
            console.error('[SETTINGS] ❌ Échec de la sauvegarde sur le serveur');
            console.error('[SETTINGS] settings:', settings);
            console.error('[SETTINGS] SETTINGS_KEY:', SETTINGS_KEY);
        }

        return success;
    } catch (error) {
        console.error('[SETTINGS] Erreur lors de la sauvegarde:', error);
        console.error('[SETTINGS] Stack trace:', error.stack);
        return false;
    }
}

/**
 * Récupère la date de début de l'arrêt
 * @returns {Promise<string>} La date de début (format ISO)
 */
export async function getStartDate() {
    const settings = await loadSettings();
    return settings.startDate || '';
}

/**
 * Récupère la date de fin de l'arrêt
 * @returns {Promise<string>} La date de fin (format ISO)
 */
export async function getEndDate() {
    const settings = await loadSettings();
    return settings.endDate || '';
}

/**
 * Récupère le budget de l'arrêt
 * @returns {Promise<number>} Le budget
 */
export async function getBudget() {
    const settings = await loadSettings();
    return settings.budget || 0;
}

/**
 * Calcule la durée de l'arrêt en jours
 * @returns {Promise<number>} La durée en jours, ou 0 si dates invalides
 */
export async function getArretDuration() {
    const settings = await loadSettings();
    if (!settings.startDate || !settings.endDate) {
        return 0;
    }

    try {
        const start = new Date(settings.startDate);
        const end = new Date(settings.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch (error) {
        console.error('[SETTINGS] Erreur lors du calcul de la durée:', error);
        return 0;
    }
}

/**
 * Initialise la page des paramètres
 * Charge les valeurs dans les champs du formulaire
 * @returns {void}
 */
export async function initSettingsPage() {
    console.log('[SETTINGS] Initialisation de la page Paramètres...');

    // Forcer le rechargement depuis le serveur pour s'assurer d'avoir les données à jour
    const settings = await loadSettings(true);

    console.log('[SETTINGS] 📊 Données chargées:', settings);
    console.log('[SETTINGS] - startDate:', settings.startDate);
    console.log('[SETTINGS] - endDate:', settings.endDate);
    console.log('[SETTINGS] - budget:', settings.budget);

    // Charger les dates et budget
    const startDateInput = document.getElementById('settingsStartDate');
    const endDateInput = document.getElementById('settingsEndDate');
    const durationInput = document.getElementById('settingsDuration');
    const budgetInput = document.getElementById('settingsBudget');

    console.log('[SETTINGS] 🔍 Éléments DOM:', {
        startDateInput: !!startDateInput,
        endDateInput: !!endDateInput,
        budgetInput: !!budgetInput
    });

    // Charger les valeurs même si elles sont vides ou 0
    if (startDateInput) {
        startDateInput.value = settings.startDate || '';
        console.log('[SETTINGS] ✅ Date début définie:', startDateInput.value);
    }

    if (endDateInput) {
        endDateInput.value = settings.endDate || '';
        console.log('[SETTINGS] ✅ Date fin définie:', endDateInput.value);
    }

    if (budgetInput) {
        budgetInput.value = settings.budget !== undefined && settings.budget !== null ? settings.budget : '';
        console.log('[SETTINGS] ✅ Budget défini:', budgetInput.value);
    }

    // Mettre à jour l'affichage du résumé et des jours fériés
    updateSummaryDisplay();
    calculateAndDisplayHolidays();

    // Charger le tableau des dates limites
    await loadDatesLimitesPage();

    console.log('[SETTINGS] Page initialisée avec les paramètres existants');
}

/**
 * Met à jour l'affichage de la durée de l'arrêt
 * @returns {void}
 */
function updateDurationDisplay() {
    const startDateInput = document.getElementById('settingsStartDate');
    const endDateInput = document.getElementById('settingsEndDate');
    const durationSpan = document.getElementById('arretDuration');

    if (!startDateInput || !endDateInput || !durationSpan) {
        return;
    }

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
        durationSpan.textContent = '-- jours';
        return;
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationSpan.textContent = `${diffDays} jours`;
    } catch (error) {
        console.error('[SETTINGS] Erreur lors du calcul de la durée:', error);
        durationSpan.textContent = 'Erreur';
    }
}

/**
 * Sauvegarde les paramètres depuis le formulaire
 * @returns {void}
 */
export async function saveSettingsFromForm() {
    const startDateInput = document.getElementById('settingsStartDate');
    const endDateInput = document.getElementById('settingsEndDate');
    const budgetInput = document.getElementById('settingsBudget');

    if (!startDateInput || !endDateInput || !budgetInput) {
        alert('❌ Erreur: formulaire non trouvé');
        return;
    }

    // Validation
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const budget = parseFloat(budgetInput.value) || 0;

    if (!startDate) {
        alert('⚠️ Veuillez saisir une date de début');
        startDateInput.focus();
        return;
    }

    if (!endDate) {
        alert('⚠️ Veuillez saisir une date de fin');
        endDateInput.focus();
        return;
    }

    // Vérifier que la date de fin est après la date de début
    if (new Date(endDate) < new Date(startDate)) {
        alert('⚠️ La date de fin doit être après la date de début');
        endDateInput.focus();
        return;
    }

    if (budget <= 0) {
        alert('⚠️ Veuillez saisir un budget valide (supérieur à 0)');
        budgetInput.focus();
        return;
    }

    // Sauvegarder
    const settings = {
        startDate,
        endDate,
        budget
    };

    const success = await saveSettings(settings);

    if (success) {
        // Synchroniser le budget avec arretAnnuelData
        console.log('[SETTINGS] 🔄 Synchronisation du budget avec arretAnnuelData...');
        const arretData = await loadFromStorage('arretAnnuelData') || {};
        arretData.budgetTotal = budget;
        arretData.dateDebut = startDate;
        arretData.dateFin = endDate;

        const syncSuccess = await saveToStorage('arretAnnuelData', arretData, false);
        if (syncSuccess) {
            console.log('[SETTINGS] ✅ Budget synchronisé avec arretAnnuelData:', budget);
        } else {
            console.warn('[SETTINGS] ⚠️ Échec de la synchronisation du budget');
        }

        const duration = await getArretDuration();
        alert(`✅ Paramètres enregistrés avec succès!\n\nDurée de l'arrêt: ${duration} jours\nBudget: ${budget.toLocaleString('fr-CA')} CAD $`);
        console.log('[SETTINGS] Paramètres sauvegardés:', settings);

        // Retourner à la page précédente ou au sommaire
        if (window.appActions && window.switchToPage) {
            window.switchToPage('summary');
        }
    } else {
        alert('❌ Erreur lors de la sauvegarde des paramètres');
    }
}

/**
 * Annule les modifications et retourne à la page précédente
 * @returns {void}
 */
export function cancelSettings() {
    if (confirm('⚠️ Voulez-vous annuler les modifications?')) {
        // Retourner à la page précédente ou au sommaire
        if (window.appActions && window.switchToPage) {
            window.switchToPage('summary');
        }
    }
}

/**
 * Gère le changement de la date de début
 * Recalcule la date de fin si la durée est définie
 * @returns {void}
 */
export function handleStartDateChange() {
    const startDateInput = document.getElementById('settingsStartDate');
    const durationInput = document.getElementById('settingsDuration');
    const endDateInput = document.getElementById('settingsEndDate');

    if (!startDateInput || !durationInput || !endDateInput) return;

    const startDate = startDateInput.value;
    const duration = parseInt(durationInput.value);

    // Si une durée est définie, recalculer la date de fin
    if (startDate && duration > 0) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + duration);
        endDateInput.value = start.toISOString().split('T')[0];
    }

    updateSummaryDisplay();
    calculateAndDisplayHolidays();
    // Recalculer les dates limites car la date de début a changé
    renderDatesLimitesTable();
}

/**
 * Gère le changement de la date de fin
 * Calcule automatiquement la durée et efface le champ durée
 * @returns {void}
 */
export function handleEndDateChange() {
    const startDateInput = document.getElementById('settingsStartDate');
    const endDateInput = document.getElementById('settingsEndDate');
    const durationInput = document.getElementById('settingsDuration');

    if (!startDateInput || !endDateInput || !durationInput) return;

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate && endDate) {
        // Effacer le champ durée pour indiquer que c'est la date de fin qui est utilisée
        durationInput.value = '';

        // Calculer la durée pour affichage
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Mettre à jour l'affichage
        updateSummaryDisplay();
        calculateAndDisplayHolidays();
    }
}

/**
 * Gère le changement de la durée
 * Calcule automatiquement la date de fin et efface le champ date de fin
 * @returns {void}
 */
export function handleDurationChange() {
    const startDateInput = document.getElementById('settingsStartDate');
    const durationInput = document.getElementById('settingsDuration');
    const endDateInput = document.getElementById('settingsEndDate');

    if (!startDateInput || !durationInput || !endDateInput) return;

    const startDate = startDateInput.value;
    const duration = parseInt(durationInput.value);

    if (!startDate) {
        alert('⚠️ Veuillez d\'abord saisir une date de début');
        durationInput.value = '';
        return;
    }

    if (duration > 0) {
        // Calculer la date de fin
        const start = new Date(startDate);
        start.setDate(start.getDate() + duration);
        endDateInput.value = start.toISOString().split('T')[0];

        // Mettre à jour l'affichage
        updateSummaryDisplay();
        calculateAndDisplayHolidays();
    }
}

/**
 * Met à jour l'affichage du résumé (dates et durée)
 * @returns {void}
 */
function updateSummaryDisplay() {
    console.log('[SETTINGS] 📊 updateSummaryDisplay appelée');

    const startDateInput = document.getElementById('settingsStartDate');
    const endDateInput = document.getElementById('settingsEndDate');

    const summaryStart = document.getElementById('summaryStartDate');
    const summaryEnd = document.getElementById('summaryEndDate');
    const summaryDuration = document.getElementById('summaryDuration');

    console.log('[SETTINGS] 🔍 Éléments résumé trouvés:', {
        summaryStart: !!summaryStart,
        summaryEnd: !!summaryEnd,
        summaryDuration: !!summaryDuration
    });

    if (!summaryStart || !summaryEnd || !summaryDuration) {
        console.warn('[SETTINGS] ⚠️ Éléments du résumé manquants!');
        return;
    }

    const startDate = startDateInput?.value;
    const endDate = endDateInput?.value;

    console.log('[SETTINGS] 📅 Valeurs pour calcul durée:', {
        startDate,
        endDate
    });

    // Afficher les dates
    summaryStart.textContent = startDate ? new Date(startDate).toLocaleDateString('fr-CA') : '--';
    summaryEnd.textContent = endDate ? new Date(endDate).toLocaleDateString('fr-CA') : '--';

    // Calculer et afficher la durée
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        summaryDuration.textContent = `${diffDays} jours`;
        console.log('[SETTINGS] ✅ Durée calculée et affichée:', diffDays, 'jours');
    } else {
        summaryDuration.textContent = '-- jours';
        console.warn('[SETTINGS] ⚠️ Dates manquantes pour calculer la durée');
    }
}

/**
 * Calcule les jours fériés du Québec pour une période donnée
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {Array<Object>} Liste des jours fériés {date, name}
 */
function getQuebecHolidays(startDate, endDate) {
    const holidays = [];
    const year = startDate.getFullYear();
    const nextYear = endDate.getFullYear();

    // Fonction pour calculer Pâques (algorithme de Meeus/Jones/Butcher)
    function getEasterDate(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    // Jours fériés fixes et variables pour chaque année concernée
    for (let y = year; y <= nextYear; y++) {
        const allHolidays = [
            { date: new Date(y, 0, 1), name: 'Jour de l\'an' },
            { date: new Date(y, 6, 1), name: 'Fête du Canada (déplacée si weekend)' }, // 1er juillet
            { date: new Date(y, 8, 1), name: 'Fête du Travail' }, // Premier lundi de septembre
            { date: new Date(y, 9, 1), name: 'Action de grâce' }, // Deuxième lundi d'octobre
            { date: new Date(y, 11, 25), name: 'Noël' }
        ];

        // Vendredi Saint (2 jours avant Pâques)
        const easter = getEasterDate(y);
        const goodFriday = new Date(easter);
        goodFriday.setDate(easter.getDate() - 2);
        allHolidays.push({ date: goodFriday, name: 'Vendredi Saint' });

        // Fête de la Saint-Jean-Baptiste (24 juin)
        allHolidays.push({ date: new Date(y, 5, 24), name: 'Saint-Jean-Baptiste' });

        // Ajuster les jours fériés qui tombent le weekend
        allHolidays.forEach(holiday => {
            const dayOfWeek = holiday.date.getDay();
            if (holiday.name === 'Fête du Canada (déplacée si weekend)') {
                // Si le 1er juillet tombe un dimanche, déplacé au lundi
                if (dayOfWeek === 0) {
                    holiday.date.setDate(holiday.date.getDate() + 1);
                }
            }
        });

        // Fête du Travail: premier lundi de septembre
        const laborDay = new Date(y, 8, 1);
        while (laborDay.getDay() !== 1) {
            laborDay.setDate(laborDay.getDate() + 1);
        }
        allHolidays.find(h => h.name === 'Fête du Travail').date = laborDay;

        // Action de grâce: deuxième lundi d'octobre
        const thanksgiving = new Date(y, 9, 1);
        while (thanksgiving.getDay() !== 1) {
            thanksgiving.setDate(thanksgiving.getDate() + 1);
        }
        thanksgiving.setDate(thanksgiving.getDate() + 7); // Deuxième lundi
        allHolidays.find(h => h.name === 'Action de grâce').date = thanksgiving;

        // Filtrer les jours fériés dans la période
        allHolidays.forEach(holiday => {
            if (holiday.date >= startDate && holiday.date <= endDate) {
                holidays.push({
                    date: holiday.date.toISOString().split('T')[0],
                    name: holiday.name,
                    dayOfWeek: holiday.date.toLocaleDateString('fr-CA', { weekday: 'long' })
                });
            }
        });
    }

    // Trier par date
    holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

    return holidays;
}

/**
 * Calcule et affiche les jours fériés du Québec
 * @returns {void}
 */
function calculateAndDisplayHolidays() {
    const startDateInput = document.getElementById('settingsStartDate');
    const endDateInput = document.getElementById('settingsEndDate');
    const holidaysContainer = document.getElementById('holidaysContainer');

    if (!startDateInput || !endDateInput || !holidaysContainer) return;

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
        holidaysContainer.innerHTML = '<p style="color: #666; font-style: italic;">Les jours fériés seront affichés une fois les dates configurées.</p>';
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const holidays = getQuebecHolidays(start, end);

    if (holidays.length === 0) {
        holidaysContainer.innerHTML = `
            <div style="background: #d4edda; padding: 10px; border-radius: 4px; border-left: 3px solid #28a745;">
                <p style="margin: 0; color: #155724; font-size: 0.9em;">
                    ✅ Aucun jour férié du Québec durant cette période.
                </p>
            </div>
        `;
    } else {
        let html = `
            <div style="background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 3px solid #ffc107; margin-bottom: 10px;">
                <p style="margin: 0; color: #856404; font-weight: 600; font-size: 0.9em;">
                    ⚠️ ${holidays.length} jour${holidays.length > 1 ? 's' : ''} férié${holidays.length > 1 ? 's' : ''} durant la période
                </p>
            </div>
            <div style="display: grid; gap: 8px;">
        `;

        holidays.forEach(holiday => {
            const dateObj = new Date(holiday.date);
            const formattedDate = dateObj.toLocaleDateString('fr-CA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            html += `
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 3px solid #dc3545;">
                    <div style="font-weight: 600; color: #dc3545; margin-bottom: 2px; font-size: 0.9em;">
                        🎉 ${holiday.name}
                    </div>
                    <div style="color: #666; font-size: 0.85em;">
                        ${formattedDate}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        holidaysContainer.innerHTML = html;
    }
}

// ============================================================================
// GESTION DES EXTERNES (Post.trav.opér.)
// ============================================================================

/**
 * Clé de stockage pour les externes
 * @const {string}
 */
const EXTERNALS_KEY = 'externalContractors';

/**
 * Données des externes avec leurs descriptions
 * @type {Array<{code: string, description: string}>}
 */
let externalsData = [];

/**
 * Set externals data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setExternalsData(data) {
    externalsData = data || [];
    console.log(`[EXTERNALS] ✅ Données injectées depuis le serveur: ${externalsData.length} externes`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setExternalsData = setExternalsData;
    console.log('[EXTERNALS] ✅ window.setExternalsData exposée');
}

/**
 * Récupère les données des externes (pour l'export)
 * @returns {Array} Données des externes
 */
export function getExternalsData() {
    return externalsData;
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.getExternalsData = getExternalsData;
}

/**
 * Charge les données des externes depuis le serveur
 * @returns {Promise<void>}
 */
async function loadExternalsData() {
    const saved = await loadFromStorage(EXTERNALS_KEY);
    if (saved) {
        externalsData = saved;
        console.log(`[EXTERNALS] ${externalsData.length} externes chargés depuis le serveur`);
    } else {
        externalsData = [];
    }
}

/**
 * Sauvegarde les données des externes sur le serveur
 * @returns {Promise<void>}
 */
async function saveExternalsData() {
    await saveToStorage(EXTERNALS_KEY, externalsData);
    console.log(`[EXTERNALS] ${externalsData.length} externes sauvegardés sur le serveur`);
}

/**
 * Extrait les valeurs uniques de Post.trav.opér. depuis IW37N
 * @returns {void}
 */
export async function extractExternals() {
    console.log('[EXTERNALS] Extraction des externes depuis IW37N...');

    // Récupérer les données IW37N depuis le module
    const { getIw37nData } = await import('./iw37n-data.js');
    const parsedData = getIw37nData();

    if (!parsedData || parsedData.length === 0) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord importer les données IW37N.');
        console.error('[EXTERNALS] Aucune donnée IW37N disponible');
        return;
    }

    console.log(`[EXTERNALS] 📊 Données IW37N récupérées: ${parsedData.length} lignes`);

    try {

        // Extraire les valeurs uniques de Post.trav.opér.
        const codesSet = new Set();

        parsedData.forEach(row => {
            const code = row['Post.trav.opér.'] ||
                        row['Post.trav.oper.'] ||
                        row['PosteTravOper'] ||
                        row['Post. Trav.'] ||
                        row['Post.trav.'] ||
                        row['Post trav'] ||
                        row['Poste Trav.'] ||
                        '';

            if (code && code.trim() !== '') {
                codesSet.add(code.trim());
            }
        });

        const codes = Array.from(codesSet).sort();

        console.log(`[EXTERNALS] ${codes.length} codes uniques trouvés`);

        // Charger les descriptions existantes
        loadExternalsData();

        // Créer un map des descriptions existantes
        const existingDescriptions = new Map();
        externalsData.forEach(ext => {
            existingDescriptions.set(ext.code, ext.description);
        });

        // Créer ou mettre à jour la liste
        externalsData = codes.map(code => ({
            code: code,
            description: existingDescriptions.get(code) || '' // Garder la description existante ou vide
        }));

        await saveExternalsData();
        await renderExternalsTable();

        alert(`✅ ${codes.length} codes externes extraits avec succès !`);

    } catch (error) {
        console.error('[EXTERNALS] Erreur lors de l\'extraction:', error);
        alert('❌ Erreur lors de l\'extraction des externes.');
    }
}

/**
 * Affiche le tableau des externes
 * @returns {Promise<void>}
 */
async function renderExternalsTable() {
    const tbody = document.getElementById('externalsTableBody');
    if (!tbody) {
        console.error('[EXTERNALS] Element externalsTableBody non trouvé');
        return;
    }

    if (externalsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" style="padding: 30px; text-align: center; color: #666;">
                    Cliquez sur "Extraire les Externes depuis IW37N" pour charger les codes.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    externalsData.forEach((external, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 600; background: #f8f9fa;">
                ${external.code}
            </td>
            <td style="padding: 5px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${external.description || ''}"
                       placeholder="Entrez la description..."
                       onchange="window.settingsActions.updateExternalDescription(${index}, this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95em;">
            </td>
        `;
        tbody.appendChild(tr);
    });

    console.log(`[EXTERNALS] Tableau rendu avec ${externalsData.length} lignes`);
}

/**
 * Met à jour la description d'un externe
 * @param {number} index - Index dans externalsData
 * @param {string} description - Nouvelle description
 * @returns {Promise<void>}
 */
export async function updateExternalDescription(index, description) {
    if (index >= 0 && index < externalsData.length) {
        externalsData[index].description = description;
        await saveExternalsData();
        console.log(`[EXTERNALS] Description mise à jour pour ${externalsData[index].code}`);
    }
}

/**
 * Charge et affiche les externes existants
 * @returns {Promise<void>}
 */
export async function loadExternalsPage() {
    await loadExternalsData();
    await renderExternalsTable();
}

/**
 * Récupère la description d'un code externe
 * @param {string} code - Code externe
 * @returns {string} Description ou chaîne vide
 */
export function getExternalDescription(code) {
    const external = externalsData.find(ext => ext.code === code);
    return external ? external.description : '';
}

/**
 * Récupère toutes les données des externes
 * @returns {Array} Tableau des externes avec codes et descriptions
 */
export function getAllExternals() {
    return externalsData;
}

// ============================================================================
// GESTION DES DATES LIMITES
// ============================================================================

/**
 * Clé de stockage pour les dates limites
 * @const {string}
 */
const DATES_LIMITES_KEY = 'datesLimites';

/**
 * Données des dates limites
 * @type {Array<{dateLimite: string, debutSem: string, valeur: string}>}
 */
let datesLimitesData = [];

/**
 * Set dates limites data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setDatesLimitesData(data) {
    datesLimitesData = data || [];
    console.log(`[DATES-LIMITES] ✅ Données injectées depuis le serveur: ${datesLimitesData.length} dates limites`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setDatesLimitesData = setDatesLimitesData;
    console.log('[DATES-LIMITES] ✅ window.setDatesLimitesData exposée');
}

/**
 * Charge les données des dates limites depuis le serveur
 * @returns {Promise<void>}
 */
async function loadDatesLimitesData() {
    const saved = await loadFromStorage(DATES_LIMITES_KEY);
    if (saved) {
        datesLimitesData = saved;
        console.log(`[DATES-LIMITES] ${datesLimitesData.length} dates limites chargées depuis le serveur`);
    } else {
        datesLimitesData = [];
    }
}

/**
 * Sauvegarde les données des dates limites sur le serveur
 * @returns {Promise<void>}
 */
async function saveDatesLimitesData() {
    await saveToStorage(DATES_LIMITES_KEY, datesLimitesData);
    console.log(`[DATES-LIMITES] ${datesLimitesData.length} dates limites sauvegardées sur le serveur`);
}

/**
 * Affiche le tableau des dates limites
 * @returns {Promise<void>}
 */
async function renderDatesLimitesTable() {
    const tbody = document.getElementById('datesLimitesTableBody');
    if (!tbody) {
        console.error('[DATES-LIMITES] Element datesLimitesTableBody non trouvé');
        return;
    }

    if (datesLimitesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 30px; text-align: center; color: #9ca3af;">
                    Aucune date limite. Cliquez sur "Ajouter".
                </td>
            </tr>
        `;
        return;
    }

    // Récupérer la date de début de l'arrêt pour calculer les dates limites
    const settings = await loadSettings();
    const startDate = settings.startDate;

    tbody.innerHTML = '';
    datesLimitesData.forEach((item, index) => {
        // Calculer la date limite = Date début arrêt - Valeur (jours)
        let calculatedDate = '';
        let formattedDate = '';
        if (startDate && item.valeur && !isNaN(item.valeur)) {
            const start = new Date(startDate);
            const daysToSubtract = parseInt(item.valeur);
            const limitDate = new Date(start);
            limitDate.setDate(start.getDate() - daysToSubtract);
            calculatedDate = limitDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
            formattedDate = limitDate.toLocaleDateString('fr-CA');
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">
                <input type="text"
                       value="${item.description || ''}"
                       placeholder="Cliquez pour ajouter une description"
                       onchange="window.settingsActions.updateDateLimiteField(${index}, 'description', this.value)"
                       style="width: 100%; padding: 6px; border: none; background: transparent; font-size: 1em; outline: none; transition: all 0.2s;"
                       onfocus="this.style.background='#f9fafb'; this.style.border='1px solid #d1d5db'; this.style.borderRadius='4px';"
                       onblur="this.style.background='transparent'; this.style.border='none';">
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: center;">
                <input type="number"
                       value="${item.valeur || ''}"
                       min="0"
                       placeholder="0"
                       onchange="window.settingsActions.updateDateLimiteField(${index}, 'valeur', this.value)"
                       style="width: 80px; padding: 6px; border: none; background: transparent; font-size: 1em; text-align: center; outline: none; transition: all 0.2s;"
                       onfocus="this.style.background='#f9fafb'; this.style.border='1px solid #d1d5db'; this.style.borderRadius='4px';"
                       onblur="this.style.background='transparent'; this.style.border='none';">
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: center; color: ${calculatedDate ? '#1e40af' : '#9ca3af'}; font-weight: 500;">
                ${formattedDate || '—'}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: center;">
                <button onclick="window.settingsActions.deleteDateLimite(${index})"
                        style="padding: 4px 10px; background: transparent; color: #ef4444; border: 1px solid #fca5a5; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: all 0.2s;"
                        onmouseover="this.style.background='#fef2f2'; this.style.borderColor='#ef4444';"
                        onmouseout="this.style.background='transparent'; this.style.borderColor='#fca5a5';">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    console.log(`[DATES-LIMITES] Tableau rendu avec ${datesLimitesData.length} lignes`);
}

/**
 * Ajoute une nouvelle date limite
 * @returns {Promise<void>}
 */
export async function addDateLimite() {
    datesLimitesData.push({
        description: '',
        valeur: 0  // Nombre de jours
    });
    await saveDatesLimitesData();
    await renderDatesLimitesTable();
    console.log('[DATES-LIMITES] Nouvelle date limite ajoutée');
}

/**
 * Met à jour un champ d'une date limite
 * @param {number} index - Index dans datesLimitesData
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {Promise<void>}
 */
export async function updateDateLimiteField(index, field, value) {
    if (index >= 0 && index < datesLimitesData.length) {
        // Convertir en nombre si c'est le champ valeur
        if (field === 'valeur') {
            datesLimitesData[index][field] = parseInt(value) || 0;
        } else {
            datesLimitesData[index][field] = value;
        }
        await saveDatesLimitesData();
        // Re-rendre le tableau pour recalculer les dates limites
        await renderDatesLimitesTable();
        console.log(`[DATES-LIMITES] Champ ${field} mis à jour pour l'index ${index}`);
    }
}

/**
 * Supprime une date limite
 * @param {number} index - Index dans datesLimitesData
 * @returns {Promise<void>}
 */
export async function deleteDateLimite(index) {
    if (confirm('⚠️ Supprimer cette date limite ?')) {
        datesLimitesData.splice(index, 1);
        await saveDatesLimitesData();
        await renderDatesLimitesTable();
        console.log(`[DATES-LIMITES] Date limite supprimée à l'index ${index}`);
    }
}

/**
 * Charge et affiche les dates limites existantes
 * @returns {Promise<void>}
 */
export async function loadDatesLimitesPage() {
    await loadDatesLimitesData();
    await renderDatesLimitesTable();
}

/**
 * Récupère toutes les dates limites
 * @returns {Array} Tableau des dates limites
 */
export function getDatesLimites() {
    return datesLimitesData;
}

// Note: window.settingsActions est défini dans global-functions.js
// Les fonctions addDateLimite, updateDateLimiteField et deleteDateLimite
// sont exposées via des imports dynamiques dans global-functions.js
console.log('[SETTINGS] ✅ Module dates limites chargé');
