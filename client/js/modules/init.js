/**
 * Module d'initialisation de l'application d'arrêt annuel
 *
 * Ce module contient les fonctions d'initialisation de l'application,
 * incluant le chargement de toutes les données au démarrage.
 *
 * @module init
 * @source Lignes 13740-13784 du fichier source arret-annuel-avec-liste.html
 */

// Définir le nombre total d'étapes d'initialisation
const TOTAL_STEPS = 6;
let currentStep = 0;

/**
 * Met à jour l'écran de chargement avec la progression
 * @param {string} stepName - Nom de l'étape en cours
 */
function updateLoadingProgress(stepName) {
    currentStep++;
    const percentage = Math.round((currentStep / TOTAL_STEPS) * 100);

    const stepElement = document.getElementById('loader-step');
    const percentageElement = document.getElementById('loader-percentage');

    if (stepElement) {
        stepElement.textContent = stepName;
    }

    if (percentageElement) {
        percentageElement.textContent = `${percentage}%`;
    }

    console.log(`[INIT] ${percentage}% - ${stepName}`);
}

// Exposer la fonction globalement
window.updateLoadingProgress = updateLoadingProgress;

// Imports des fonctions nécessaires
import { loadSavedTheme } from './theme.js';
import { initModals } from './modals/index.js';
import { initDataPages } from './data/data-pages.js';
import { enableFileDropOnAllUploads } from './ui/drag-drop.js';
import {
    loadArretData,
    loadIw37nData,
    loadIw38Data,
    loadPSVData,
    loadTPAAListeData,
    loadPWData,
    loadApprovisionnementData,
    loadConsommablesData
} from './data/index.js';
import { loadPSVCharsData } from './data/psv-data.js';
import { loadTpaaPwCachedData } from './data/tpaa-pw-data.js';
import { ensureCompletePhases } from './data/arret-data.js';
import { getDefaultPreparationPhases } from './ui/summary.js';
import { loadProjetsData } from './data/projets-data.js';
import { loadMaintenancesCapitalisablesData } from './data/maintenances-capitalisables-data.js';
import { loadRevisionListeData } from './data/revision-travaux-data.js';
import { loadScopeMarkers } from './scope/scope-markers.js';
import { loadPSVPlans } from './psv/psv-plan-markers.js';
import { initSync } from './sync/server-sync.js';
import { initAutoRefresh } from './sync/auto-refresh.js';
import { loadArchives, startAutoBackup, checkBackupReminder } from './backup/backup-manager.js';
import * as ingqModule from './data/ingq-data.js';
import { loadTeamData } from './entities/team.js';
import { loadEspaceClosData } from './data/espace-clos-data.js';
import { loadAmenagementData } from './data/amenagement-data.js';
import { loadT40Data } from './data/t40-entrepreneurs-data.js';
import { loadT33Data } from './data/t33-priorisation-data.js';
import { loadT30Data } from './data/t30-long-delai.js';
import { initDevisManager } from './ui/devis-manager.js';
import { loadCogniboxTasks } from './data/cognibox-tasks.js';
import { loadEquipementLevageData } from './data/equipement-levage-data.js';
import { loadRencontresHebdoData } from './data/rencontres-hebdo-data.js';
import { loadTravailHauteurData } from './data/travail-hauteur-data.js';
import { loadT55HistoriqueData } from './data/t55-historique.js';
import { loadZonesData } from './data/t63-zones.js';
import { loadZonesPlanData } from './data/zones-plan-editor.js';
import { loadProtocoleArretData } from './data/protocole-arret-data.js';
import { loadNacellesData } from './data/nacelles-data.js';
import { loadPlanLevageData } from './data/plan-levage-data.js';
import { initOrderMetadata } from './data/order-metadata.js';

/**
 * Charge toutes les données de l'application au démarrage
 *
 * Cette fonction d'initialisation principale:
 * - Charge le thème sauvegardé
 * - Charge toutes les données depuis le SERVEUR uniquement
 * - Configure les systèmes automatiques (auto-save, backup)
 * - Vérifie les rappels de sauvegarde
 *
 * Ordre de chargement:
 * 1. Thème utilisateur
 * 2. Données IW37N et IW38
 * 3. Données PSV et caractéristiques PSV
 * 4. Données TPAA et PW
 * 5. Données d'équipement de levage
 * 6. Données INGQ
 * 7. Données d'équipe
 * 8. Données VPO
 * 9. Données d'espace clos
 * 10. Données entrepreneurs
 * 11. Données T51, T55, T58, T72, T91
 * 12. Fichiers et plans SCOPE
 * 13. Données de planification
 * 14. Données tours de refroidissement
 * 15. Données zones d'entreposage
 * 16. Données d'aménagement
 * 17. Archives
 * 18. Données d'exécution
 *
 * @returns {void}
 *
 * @example
 * // Au chargement de la page
 * window.addEventListener('DOMContentLoaded', loadAllData);
 *
 * @dependencies
 * - loadSavedTheme() depuis le module theme
 * - Nombreuses fonctions de chargement de données spécifiques
 * - setupExecutionAutoSave() pour l'auto-sauvegarde
 * - startAutoBackup() pour les backups automatiques
 * - checkBackupReminder() pour les rappels
 *
 * @source Lignes 13740-13783 du fichier source
 */
export async function loadAllData() {
    console.log('[INIT] Chargement de toutes les donnees...');

    // 0. Initialiser la synchronisation serveur (NE PAS ATTENDRE - lancer en arrière-plan)
    updateLoadingProgress('Synchronisation avec le serveur...');
    initSync('User').then(serverSyncSuccess => {
        if (serverSyncSuccess) {
            console.log('[INIT] ✅ Données serveur chargées');
        } else {
            console.warn('[INIT] ⚠️ Impossible de charger les données depuis le serveur');
        }
    }).catch(err => {
        console.error('[INIT] ❌ Erreur de synchronisation:', err);
    });

    // 0.1 Initialiser le système d'auto-refresh
    updateLoadingProgress('Initialisation de l\'interface...');
    initAutoRefresh();

    // 1. Charger le thème et initialiser l'interface (rapide)
    loadSavedTheme();
    initModals();
    await initDataPages();
    await initDevisManager();

    // 1.1 Activer le drag & drop sur tous les uploads (interface interactive)
    setTimeout(() => {
        const count = enableFileDropOnAllUploads();
        if (count > 0) {
            console.log(`[INIT] ✅ Drag & drop activé sur ${count} zones d'upload`);
        }
    }, 500);

    // 2. Charger les données critiques de l'arrêt annuel
    updateLoadingProgress('Chargement des données essentielles...');
    loadArretData();
    const completePhases = await getDefaultPreparationPhases();
    ensureCompletePhases(completePhases);

    // 2.1 Sauvegarder arretData en arrière-plan (ne pas attendre)
    import('./data/arret-data.js').then(({ arretData }) => {
        if (arretData && arretData.phases && arretData.phases.length > 0) {
            import('./sync/server-sync.js').then(({ syncModuleToServer }) => {
                syncModuleToServer('arretData', arretData, false).then(success => {
                    if (success) {
                        console.log('[INIT] ✅ arretData sauvegardé sur le serveur');
                    }
                });
            });
        }
    });

    // 3. Charger les données principales en PARALLÈLE (beaucoup plus rapide)
    updateLoadingProgress('Chargement des données principales...');

    // Initialiser le système de métadonnées d'ordres (commentaires, statuts, documents)
    initOrderMetadata();

    // Lancer tous les chargements en parallèle
    loadIw37nData();
    loadIw38Data();
    loadPSVData();
    loadPSVCharsData();
    // Note: loadTpaaPwCachedData() est géré par initSync() via window.setTpaaPwCachedData()
    // Ne pas appeler ici pour éviter les conflits
    loadTPAAListeData();
    loadPWData();

    updateLoadingProgress('Chargement des données secondaires...');

    // Charger les données secondaires
    loadApprovisionnementData();
    loadConsommablesData();
    loadProjetsData();
    ingqModule.loadINGQData();
    loadMaintenancesCapitalisablesData();
    loadRevisionListeData();

    // 4. Charger les données additionnelles en parallèle
    updateLoadingProgress('Chargement des ressources...');
    window.ingqModule = ingqModule;
    loadTeamData();
    loadEspaceClosData();
    loadAmenagementData();
    // T40 sera chargé via page-loader.js quand on navigue vers la page
    // loadT40Data();
    // T33 sera chargé via page-loader.js quand on navigue vers la page
    // loadT33Data();
    loadT30Data();
    loadCogniboxTasks();
    loadEquipementLevageData();
    loadTravailHauteurData(); // Charger les équipements de travail en hauteur (T57)
    loadNacellesData(); // Charger les demandes de nacelles (T57)
    loadRencontresHebdoData(); // Charger les rencontres hebdo (T58)
    loadT55HistoriqueData(); // Charger l'historique T55
    loadZonesData(); // Charger les zones d'entreposage (T63)
    loadZonesPlanData(); // Charger les données du plan de zones (T63)
    loadProtocoleArretData(); // Charger les données du protocole d'arrêt (T64)
    loadPlanLevageData(); // Charger les plans de levage (T65)
    loadScopeMarkers();
    loadPSVPlans();
    loadArchives();

    import('./data/equip-location-data.js').then(() => {
        console.log('[INIT] ✅ Module equip-location-data chargé et disponible globalement');
    }).catch(err => {
        console.error('[INIT] ❌ Erreur lors du chargement du module equip-location-data:', err);
    });

    // Charger le module Gantt pour exposer les fonctions globalement
    import('./data/protocole-gantt.js').then(() => {
        console.log('[INIT] ✅ Module protocole-gantt chargé et disponible globalement');
    }).catch(err => {
        console.error('[INIT] ❌ Erreur lors du chargement du module protocole-gantt:', err);
    });

    // 5. Systèmes automatiques en arrière-plan (ne pas attendre)
    updateLoadingProgress('Configuration des systèmes automatiques...');
    setTimeout(() => {
        startAutoBackup();
        checkBackupReminder();
        console.log('[SYNC] Systèmes automatiques activés');
    }, 1000);

    // 6. Finalisation
    updateLoadingProgress('Finalisation...');
    console.log('[OK] Toutes les donnees ont ete chargees avec succes');
}

/**
 * Initialise l'application au chargement du DOM
 *
 * Cette fonction attache les event listeners nécessaires et
 * déclenche le chargement initial des données.
 *
 * @returns {void}
 *
 * @example
 * // Appel automatique
 * initApp();
 */
export function initApp() {
    console.log('[START] Initialisation de l\'application...');

    // Attacher l'event listener pour le chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllData);
    } else {
        // Le DOM est déjà chargé, exécuter immédiatement
        loadAllData();
    }
}

/**
 * Réinitialise l'application à son état initial
 *
 * ATTENTION: Cette fonction efface toutes les données!
 *
 * @param {boolean} confirm - Doit être true pour confirmer la réinitialisation
 * @returns {boolean} true si la réinitialisation a été effectuée
 *
 * @example
 * // Demander confirmation avant de réinitialiser
 * if (window.confirm('Voulez-vous vraiment réinitialiser l\'application?')) {
 *   resetApp(true);
 * }
 */
export function resetApp(confirm = false) {
    if (!confirm) {
        console.error('[ERROR] Réinitialisation annulée: confirmation requise');
        return false;
    }

    console.warn('[WARNING] Réinitialisation de l\'application...');

    // AVERTISSEMENT: Cette fonction ne fait plus rien car toutes les données sont sur le serveur
    // Pour réinitialiser l'application, il faut réinitialiser les données serveur
    console.error('[ERROR] La réinitialisation de l\'application doit être faite côté serveur!');
    console.error('[ERROR] localStorage n\'est plus utilisé pour les données d\'application');

    alert('⚠️ ERREUR: Cette fonction n\'est plus supportée.\n\n' +
          'Toutes les données sont maintenant sur le serveur.\n' +
          'Pour réinitialiser l\'application, contactez l\'administrateur serveur.');

    return false;
}

/**
 * Vérifie l'état de santé de l'application
 *
 * @returns {Object} Objet contenant l'état de santé de l'application
 * @returns {boolean} returns.healthy - true si l'application est en bonne santé
 * @returns {Array<string>} returns.warnings - Liste des avertissements
 * @returns {Array<string>} returns.errors - Liste des erreurs
 *
 * @example
 * const health = checkAppHealth();
 * if (!health.healthy) {
 *   console.error('Problèmes détectés:', health.errors);
 * }
 */
export function checkAppHealth() {
    const warnings = [];
    const errors = [];

    // Vérifier la disponibilité du serveur
    if (!window.socket || !window.socket.connected) {
        errors.push('Serveur non connecté - les données ne peuvent pas être sauvegardées');
    } else {
        console.log('[HEALTH] ✅ Serveur connecté');
    }

    // Vérifier la présence de données critiques EN MÉMOIRE (pas localStorage!)
    const criticalData = [
        { name: 'arretData', check: () => window.arretData && window.arretData.phases },
        { name: 'iw37nData', check: () => window.iw37nData && Array.isArray(window.iw37nData) },
        { name: 'iw38Data', check: () => window.iw38Data && Array.isArray(window.iw38Data) }
    ];

    criticalData.forEach(({ name, check }) => {
        if (!check()) {
            warnings.push(`Données ${name} manquantes ou vides en mémoire`);
        } else {
            console.log(`[HEALTH] ✅ ${name} présent en mémoire`);
        }
    });

    // localStorage et sessionStorage désactivés intentionnellement
    // L'application ne persiste plus les préférences UI côté client

    try {
        sessionStorage.setItem('healthCheck', 'test');
        sessionStorage.removeItem('healthCheck');
    } catch (e) {
        warnings.push('sessionStorage non disponible');
    }

    return {
        healthy: errors.length === 0,
        warnings,
        errors
    };
}

/**
 * Affiche les informations de version de l'application
 *
 * @returns {void}
 */
export function showVersionInfo() {
    const versionInfo = {
        application: 'Gestion Arrêt Annuel',
        version: '1.0.0',
        build: 'Phase 1 - Core et Navigation',
        date: '2025-10-22',
        modules: [
            'navigation.js',
            'theme.js',
            'utils.js',
            'init.js'
        ]
    };

    console.log('[INFO] Informations de version:');
    console.table(versionInfo);

    return versionInfo;
}
