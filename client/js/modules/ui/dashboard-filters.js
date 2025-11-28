/**
 * Module de gestion des filtres du Dashboard
 * @module ui/dashboard-filters
 */

import { getPreparationPhases } from './summary.js';
import { initDashboardCharts } from '../charts/dashboard-charts.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

// État du filtre actuel
let currentFilter = {
    responsable: null // null = tous les responsables
};

/**
 * Charge le filtre Dashboard depuis le SERVEUR (persistant)
 */
async function loadDashboardFilter() {
    try {
        const saved = await loadFromStorage('dashboardCurrentFilter');
        if (saved && typeof saved === 'object') {
            currentFilter = saved;
            console.log('[FILTERS] ✅ Filtre Dashboard chargé depuis le serveur');
            return currentFilter;
        }
    } catch (error) {
        console.error('[FILTERS] ❌ Erreur chargement filtre Dashboard:', error);
    }
    return { responsable: null };
}

/**
 * Sauvegarde le filtre Dashboard sur le SERVEUR (persistant)
 */
async function saveDashboardFilter() {
    try {
        const success = await saveToStorage('dashboardCurrentFilter', currentFilter);
        if (success) {
            console.log('[FILTERS] ✅ Filtre Dashboard sauvegardé sur le serveur');
        } else {
            console.error('[FILTERS] ❌ Échec sauvegarde filtre Dashboard');
        }
        return success;
    } catch (error) {
        console.error('[FILTERS] ❌ Erreur sauvegarde filtre Dashboard:', error);
        return false;
    }
}

/**
 * Initialise le système de filtres du Dashboard
 */
export async function initDashboardFilters() {
    console.log('[FILTERS] Initialisation des filtres Dashboard...');

    // Charger le filtre sauvegardé
    await loadDashboardFilter();

    // Remplir le dropdown des responsables
    await populateResponsableDropdown();

    // Restaurer la sélection du filtre
    const filterSelect = document.getElementById('dashboardFilterResponsable');
    if (filterSelect && currentFilter.responsable) {
        filterSelect.value = currentFilter.responsable;
        // Appliquer le filtre restauré
        await applyFilter(currentFilter.responsable);
    }

    // Attacher les événements
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const responsable = e.target.value === 'all' ? null : e.target.value;
            applyFilter(responsable);
        });
    }

    console.log('[OK] Filtres Dashboard initialisés');
}

/**
 * Remplit le menu déroulant avec tous les responsables
 */
async function populateResponsableDropdown() {
    const select = document.getElementById('dashboardFilterResponsable');
    if (!select) {
        console.warn('[FILTERS] Dropdown dashboardFilterResponsable non trouvé');
        return;
    }

    // Extraire tous les responsables uniques
    const responsables = await getAllResponsables();

    // Vider et remplir le dropdown
    select.innerHTML = '<option value="all">Tous les responsables</option>';

    responsables.forEach(resp => {
        const option = document.createElement('option');
        option.value = resp;
        option.textContent = resp;
        select.appendChild(option);
    });

    console.log(`[OK] ${responsables.length} responsables chargés dans le filtre`);
}

/**
 * Extrait tous les responsables uniques des phases de préparation
 * @returns {Array<string>} Liste des responsables uniques triés
 */
async function getAllResponsables() {
    const phases = await getPreparationPhases();
    const responsablesSet = new Set();

    phases.forEach(phase => {
        phase.taches.forEach(tache => {
            if (tache.responsable) {
                // Gérer les responsables multiples séparés par /
                const resps = tache.responsable.split('/').map(r => r.trim());
                resps.forEach(r => responsablesSet.add(r));
            }
        });
    });

    return Array.from(responsablesSet).sort();
}

/**
 * Applique un filtre par responsable
 * @param {string|null} responsable - Code du responsable ou null pour tous
 */
export async function applyFilter(responsable) {
    console.log('[FILTERS] Application du filtre:', responsable || 'Tous');

    currentFilter.responsable = responsable;

    // Sauvegarder le filtre sur le serveur
    await saveDashboardFilter();

    // Mettre à jour les KPIs
    updateDashboardKPIs();

    // Recréer les graphiques avec les données filtrées
    await initDashboardCharts();
}

/**
 * Met à jour les KPIs du Dashboard selon le filtre actuel
 */
function updateDashboardKPIs() {
    const stats = calculateFilteredStats();

    // Mettre à jour les éléments du DOM
    const avancementReelEl = document.getElementById('dashAvancementReel');
    const avancementPlanifieEl = document.getElementById('dashAvancementPlanifie');
    const tachesCompleteesEl = document.getElementById('dashTachesCompletees');
    const tachesRetardEl = document.getElementById('dashTachesRetard');
    const statutGlobalEl = document.getElementById('dashStatutGlobal');

    if (avancementReelEl) avancementReelEl.textContent = stats.avancementReel + '%';
    if (avancementPlanifieEl) avancementPlanifieEl.textContent = stats.avancementPlanifie + '%';
    if (tachesCompleteesEl) tachesCompleteesEl.textContent = `${stats.tachesCompletes}/${stats.totalTaches}`;
    if (tachesRetardEl) tachesRetardEl.textContent = stats.tachesEnRetard;
    if (statutGlobalEl) {
        statutGlobalEl.textContent = stats.statutGlobal;
        statutGlobalEl.style.color = stats.statutGlobal === 'En retard' ? '#c5554a' : '#4a7c59';
    }

    console.log('[OK] KPIs mis à jour:', stats);
}

/**
 * Calcule les statistiques selon le filtre actuel
 * @returns {Object} Statistiques calculées
 */
function calculateFilteredStats() {
    const taches = getFilteredTasks();

    const totalTaches = taches.length;
    const tachesCompletes = taches.filter(t => t.statut === 'completed').length;
    const tachesEnCours = taches.filter(t => t.statut === 'inprogress').length;
    const tachesNonCommence = taches.filter(t => t.statut === 'notstarted').length;
    const tachesEnRetard = 0; // À calculer selon les dates

    // Calculer avancement réel (moyenne des avancements)
    const avancementReel = totalTaches > 0
        ? Math.round(taches.reduce((sum, t) => sum + t.avancement, 0) / totalTaches)
        : 0;

    // Avancement planifié (basé sur la date actuelle)
    const avancementPlanifie = 19; // À calculer dynamiquement

    const statutGlobal = avancementReel < avancementPlanifie ? 'En retard' : 'Dans les temps';

    return {
        totalTaches,
        tachesCompletes,
        tachesEnCours,
        tachesNonCommence,
        tachesEnRetard,
        avancementReel,
        avancementPlanifie,
        statutGlobal
    };
}

/**
 * Retourne les tâches filtrées selon le responsable actuel
 * @returns {Array} Liste des tâches filtrées
 */
export async function getFilteredTasks() {
    const phases = await getPreparationPhases();
    const allTasks = [];

    phases.forEach(phase => {
        phase.taches.forEach(tache => {
            // Ajouter la phase à la tâche pour référence
            allTasks.push({
                ...tache,
                phase: phase.nom,
                phaseId: phase.id,
                phaseDate: phase.date,
                phaseSemaines: phase.semaines
            });
        });
    });

    // Appliquer le filtre si nécessaire
    if (currentFilter.responsable) {
        return allTasks.filter(tache => {
            // Gérer les responsables multiples (ex: "CE/SE")
            const responsables = tache.responsable.split('/').map(r => r.trim());
            return responsables.includes(currentFilter.responsable);
        });
    }

    return allTasks;
}

/**
 * Retourne les données pour le graphique d'avancement par phase
 * @returns {Object} Données du graphique
 */
export async function getPhaseChartData() {
    const phases = await getPreparationPhases();
    const data = {
        labels: [],
        avancementReel: [],
        avancementPlanifie: []
    };

    phases.forEach(phase => {
        let phaseTasks = phase.taches;

        // Filtrer si nécessaire
        if (currentFilter.responsable) {
            phaseTasks = phaseTasks.filter(tache => {
                const responsables = tache.responsable.split('/').map(r => r.trim());
                return responsables.includes(currentFilter.responsable);
            });
        }

        // Ne pas afficher la phase si aucune tâche après filtrage
        if (phaseTasks.length === 0) return;

        // Calculer l'avancement réel de la phase
        const avancement = phaseTasks.length > 0
            ? Math.round(phaseTasks.reduce((sum, t) => sum + t.avancement, 0) / phaseTasks.length)
            : 0;

        data.labels.push(phase.nom.replace(' SEMAINES AVANT ARRÊT', 'S'));
        data.avancementReel.push(avancement);
        data.avancementPlanifie.push(100); // Toutes les phases passées devraient être à 100%
    });

    return data;
}

/**
 * Retourne les données pour le graphique de distribution des responsables
 * @returns {Object} Données du graphique
 */
export async function getResponsableChartData() {
    const tasks = await getFilteredTasks();
    const responsableCounts = {};

    tasks.forEach(task => {
        const responsables = task.responsable.split('/').map(r => r.trim());
        responsables.forEach(resp => {
            responsableCounts[resp] = (responsableCounts[resp] || 0) + 1;
        });
    });

    // Trier par nombre de tâches (décroissant)
    const sorted = Object.entries(responsableCounts)
        .sort((a, b) => b[1] - a[1]);

    return {
        labels: sorted.map(([resp]) => resp),
        counts: sorted.map(([, count]) => count)
    };
}

/**
 * Retourne les données pour le graphique de statut des tâches
 * @returns {Object} Données du graphique
 */
export async function getStatutChartData() {
    const tasks = await getFilteredTasks();

    const statuts = {
        'Complétée': tasks.filter(t => t.statut === 'completed').length,
        'En cours': tasks.filter(t => t.statut === 'inprogress').length,
        'Non commencé': tasks.filter(t => t.statut === 'notstarted').length,
        'Annulé': tasks.filter(t => t.statut === 'cancelled').length
    };

    return {
        labels: Object.keys(statuts),
        counts: Object.values(statuts)
    };
}

/**
 * Retourne le filtre actuel
 * @returns {Object} Filtre actuel
 */
export function getCurrentFilter() {
    return { ...currentFilter };
}

/**
 * Réinitialise tous les filtres
 */
export function resetFilters() {
    currentFilter.responsable = null;

    const select = document.getElementById('dashboardFilterResponsable');
    if (select) {
        select.value = 'all';
    }

    applyFilter(null);
}

