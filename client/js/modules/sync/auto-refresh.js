/**
 * @fileoverview Système d'auto-refresh de l'interface lors des mises à jour serveur
 * @module sync/auto-refresh
 */

// Import des fonctions de chargement des données
import { loadArretData } from '../data/arret-data.js';
import { loadIw37nData } from '../data/iw37n-data.js';
import { loadIw38Data } from '../data/iw38-data.js';
import { loadTPAAListeData } from '../data/tpaa-data.js';
import { loadPWData } from '../data/pw-data.js';
import { loadPSVData } from '../data/psv-data.js';
import { loadProjetsData } from '../data/projets-data.js';
import { loadMaintenancesCapitalisablesData } from '../data/maintenances-capitalisables-data.js';
import { loadRevisionListeData } from '../data/revision-travaux-data.js';
import { loadStrategieData } from '../data/strategie-data.js';
import { loadPlansData } from '../data/plans-entretien.js';
import { loadPlanSuivisData } from '../plans/plan-suivis-journaliers.js';

// Import des fonctions de rendu UI
import { renderKanban } from '../ui/kanban.js';

/**
 * Initialise les listeners pour rafraîchir automatiquement l'UI
 * @returns {void}
 */
export function initAutoRefresh() {
    console.log('[AUTO-REFRESH] ✅ Initialisation du système d\'auto-refresh');

    // Écouter l'événement de mise à jour des données
    window.addEventListener('data:updated', (event) => {
        console.log(`[AUTO-REFRESH] 📥 Événement 'data:updated' reçu!`, event);
        console.log(`[AUTO-REFRESH] 📋 Détails:`, event.detail);

        const { moduleName } = event.detail;
        console.log(`[AUTO-REFRESH] 🔄 Rafraîchissement pour ${moduleName}`);

        // Rafraîchir l'UI selon le module
        refreshUIForModule(moduleName);
    });

    console.log('[AUTO-REFRESH] 👂 Listener installé pour événement "data:updated"');
}

/**
 * Rafraîchit l'interface pour un module spécifique
 * @param {string} moduleName - Nom du module
 * @returns {void}
 */
function refreshUIForModule(moduleName) {
    console.log(`[AUTO-REFRESH] 🎯 refreshUIForModule(${moduleName})`);
    console.log(`[AUTO-REFRESH] 🔄 Rafraîchissement de TOUTES les vues pour ${moduleName}`);

    switch (moduleName) {
        case 'arretData':
            console.log(`[AUTO-REFRESH] 🔄 Cas arretData`);
            // RECHARGER les données depuis localStorage
            console.log(`[AUTO-REFRESH] 📥 Rechargement arretData depuis localStorage`);
            loadArretData();
            console.log(`[AUTO-REFRESH] ✅ arretData rechargé`);

            // Rafraîchir TOUTES les vues liées à arretData
            if (typeof window.renderSummaryTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderSummaryTable()`);
                try {
                    window.renderSummaryTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderSummaryTable:`, error);
                }
            }

            // Rafraîchir le Kanban pour réinitialiser le drag and drop
            console.log(`[AUTO-REFRESH] ✅ Appel renderKanban() pour drag and drop`);
            try {
                renderKanban();
            } catch (error) {
                console.error(`[AUTO-REFRESH] ❌ Erreur renderKanban:`, error);
            }

            // Rafraîchir le dashboard
            if (typeof window.updateDashboardStats === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.updateDashboardStats()`);
                try {
                    window.updateDashboardStats();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur updateDashboardStats:`, error);
                }
            }
            break;

        case 'iw37nData':
            console.log(`[AUTO-REFRESH] 🔄 Cas iw37nData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement iw37nData depuis localStorage`);
            loadIw37nData();
            if (typeof window.renderIw37nTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderIw37nTable()`);
                try {
                    window.renderIw37nTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderIw37nTable:`, error);
                }
            }
            break;

        case 'iw38Data':
            console.log(`[AUTO-REFRESH] 🔄 Cas iw38Data`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement iw38Data depuis localStorage`);
            loadIw38Data();
            if (typeof window.renderIw38Table === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderIw38Table()`);
                try {
                    window.renderIw38Table();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderIw38Table:`, error);
                }
            }
            break;

        case 'tpaaData':
            console.log(`[AUTO-REFRESH] 🔄 Cas tpaaData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement tpaaData depuis localStorage`);
            loadTPAAListeData();
            if (typeof window.renderTPAATable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderTPAATable()`);
                try {
                    window.renderTPAATable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderTPAATable:`, error);
                }
            }
            break;

        case 'pwData':
            console.log(`[AUTO-REFRESH] 🔄 Cas pwData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement pwData depuis localStorage`);
            loadPWData();
            if (typeof window.renderPWTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderPWTable()`);
                try {
                    window.renderPWTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderPWTable:`, error);
                }
            }
            break;

        case 'psvData':
            console.log(`[AUTO-REFRESH] 🔄 Cas psvData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement psvData depuis localStorage`);
            loadPSVData();
            if (typeof window.renderPSVTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderPSVTable()`);
                try {
                    window.renderPSVTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderPSVTable:`, error);
                }
            }
            break;

        case 'projetsData':
            console.log(`[AUTO-REFRESH] 🔄 Cas projetsData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement projetsData depuis localStorage`);
            loadProjetsData();
            if (typeof window.renderProjetsTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderProjetsTable()`);
                try {
                    window.renderProjetsTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderProjetsTable:`, error);
                }
            }
            break;

        case 'maintenancesCapitalisablesData':
            console.log(`[AUTO-REFRESH] 🔄 Cas maintenancesCapitalisablesData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement maintenancesCapitalisablesData depuis localStorage`);
            loadMaintenancesCapitalisablesData();
            if (typeof window.renderMaintenancesCapitalisablesTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderMaintenancesCapitalisablesTable()`);
                try {
                    window.renderMaintenancesCapitalisablesTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderMaintenancesCapitalisablesTable:`, error);
                }
            }
            break;

        case 'revisionTravauxData':
            console.log(`[AUTO-REFRESH] 🔄 Cas revisionTravauxData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement revisionTravauxData depuis localStorage`);
            loadRevisionListeData();
            if (typeof window.renderRevisionListeTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderRevisionListeTable()`);
                try {
                    window.renderRevisionListeTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderRevisionListeTable:`, error);
                }
            }
            break;

        case 'scopeMarkers':
            console.log(`[AUTO-REFRESH] 🔄 Cas scopeMarkers`);
            if (typeof window.renderScopePlans === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderScopePlans()`);
                try {
                    window.renderScopePlans();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderScopePlans:`, error);
                }
            }
            break;

        case 'ingqData':
            console.log(`[AUTO-REFRESH] 🔄 Cas ingqData`);
            if (typeof window.renderINGQTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderINGQTable()`);
                try {
                    window.renderINGQTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderINGQTable:`, error);
                }
            }
            break;

        case 'espaceClosData':
            console.log(`[AUTO-REFRESH] 🔄 Cas espaceClosData`);
            if (typeof window.renderEspaceClosTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderEspaceClosTable()`);
                try {
                    window.renderEspaceClosTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderEspaceClosTable:`, error);
                }
            }
            break;

        case 'strategieData':
            console.log(`[AUTO-REFRESH] 🔄 Cas strategieData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement strategieData depuis localStorage`);
            loadStrategieData();
            if (typeof window.renderStrategieTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderStrategieTable()`);
                try {
                    window.renderStrategieTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderStrategieTable:`, error);
                }
            }
            break;

        case 'entrepreneurData':
            console.log(`[AUTO-REFRESH] 🔄 Cas entrepreneurData`);
            if (typeof window.renderEntrepreneurTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderEntrepreneurTable()`);
                try {
                    window.renderEntrepreneurTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderEntrepreneurTable:`, error);
                }
            }
            break;

        case 'plansEntretienData':
            console.log(`[AUTO-REFRESH] 🔄 Cas plansEntretienData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement plansEntretienData depuis localStorage`);
            loadPlansData();
            if (typeof window.renderPlansTable === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderPlansTable()`);
                try {
                    window.renderPlansTable();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderPlansTable:`, error);
                }
            }
            break;

        case 'planSuivisJournaliersData':
            console.log(`[AUTO-REFRESH] 🔄 Cas planSuivisJournaliersData`);
            console.log(`[AUTO-REFRESH] 📥 Rechargement planSuivisJournaliersData depuis localStorage`);
            loadPlanSuivisData();
            if (typeof window.renderPlansList === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderPlansList()`);
                try {
                    window.renderPlansList();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderPlansList:`, error);
                }
            }
            if (typeof window.renderMSProjectFilesList === 'function') {
                console.log(`[AUTO-REFRESH] ✅ Appel window.renderMSProjectFilesList()`);
                try {
                    window.renderMSProjectFilesList();
                } catch (error) {
                    console.error(`[AUTO-REFRESH] ❌ Erreur renderMSProjectFilesList:`, error);
                }
            }
            break;

        default:
            console.log(`[AUTO-REFRESH] ℹ️ Pas de refresh spécifique pour ${moduleName}`);
    }
}

/**
 * Obtient la page actuellement visible
 * @returns {string} ID de la page actuelle
 */
function getCurrentPage() {
    const pages = document.querySelectorAll('.page');
    for (const page of pages) {
        if (page.classList.contains('active')) {
            return page.id;
        }
    }
    return null;
}

/**
 * Rafraîchit le dashboard
 * @returns {void}
 */
function refreshDashboard() {
    // Rafraîchir les statistiques du dashboard
    if (typeof window.updateDashboardStats === 'function') {
        window.updateDashboardStats();
    }
}

/**
 * Rafraîchit la page actuelle
 * @returns {void}
 */
function refreshCurrentPage() {
    const currentPage = getCurrentPage();

    if (!currentPage) return;

    console.log(`[AUTO-REFRESH] Rafraîchissement de la page ${currentPage}`);

    // Selon la page, appeler la fonction de refresh appropriée
    switch (currentPage) {
        case 'dashboard':
            refreshDashboard();
            break;
        case 'iw37n':
            if (typeof window.afficherTableauIw37n === 'function') {
                window.afficherTableauIw37n();
            }
            break;
        case 'iw38':
            if (typeof window.afficherTableauIw38 === 'function') {
                window.afficherTableauIw38();
            }
            break;
        case 'tpaa':
            if (typeof window.afficherTableauTPAA === 'function') {
                window.afficherTableauTPAA();
            }
            break;
        case 'pw':
            if (typeof window.afficherTableauPW === 'function') {
                window.afficherTableauPW();
            }
            break;
        case 'psv':
            if (typeof window.afficherTableauPSV === 'function') {
                window.afficherTableauPSV();
            }
            break;
        case 'preparation':
            if (typeof window.renderSummaryTable === 'function') {
                window.renderSummaryTable();
            }
            break;
        default:
            console.log(`[AUTO-REFRESH] Pas de refresh défini pour la page ${currentPage}`);
    }
}

/**
 * Force le rafraîchissement de toutes les vues
 * @returns {void}
 */
export function forceRefreshAll() {
    console.log('[AUTO-REFRESH] 🔄 Rafraîchissement complet forcé');

    // Rafraîchir toutes les fonctions disponibles
    const refreshFunctions = [
        'renderSummaryTable',
        'afficherTableauIw37n',
        'afficherTableauIw38',
        'afficherTableauTPAA',
        'afficherTableauPW',
        'afficherTableauPSV',
        'renderProjetsTable',
        'renderMaintenancesCapitalisablesTable',
        'renderRevisionTravauxTable',
        'updateDashboardStats'
    ];

    refreshFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            try {
                window[funcName]();
            } catch (error) {
                console.warn(`[AUTO-REFRESH] Erreur lors du refresh de ${funcName}:`, error);
            }
        }
    });
}
