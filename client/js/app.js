/**
 * @fileoverview Point d'entrée principal de l'application Arrêt Annuel
 * @module app
 * @version 2.0.0
 * @date 2025-10-22
 */

// ==================== IMPORTS DES MODULES ====================

// Phase 0a: Import direct des modules de données critiques pour garantir l'exposition des fonctions
// Ces imports doivent se faire AVANT global-functions pour que les fonctions window soient disponibles
import './modules/data/arret-data.js'; // CRITIQUE: Exposer window.setArretData pour server-sync
import './modules/data/iw37n-data.js';
import './modules/data/iw38-data.js';
import './modules/data/pieces-data.js'; // Ajouté pour assurer l'exposition précoce de window.setPiecesData
import './modules/data/t51-soumissions.js'; // Exposer window.setT51SoumissionsData pour server-sync

// Phase 0b: Fonctions globales (pour les onclick dans le HTML)
import { exposeGlobalFunctions } from './global-functions.js';

// Phase 1: Core - Modules de base dans modules/
import { switchToPage as switchPage } from './modules/ui/page-loader.js';
import { changeTheme, loadSavedTheme, getCurrentTheme, resetTheme } from './modules/theme.js';
import {
    getUserInfo,
    getOrCreateSessionId,
    formatDate,
    formatDateISO,
    formatDateTime,
    daysBetween,
    generateId,
    isEmpty,
    copyToClipboard,
    downloadJSON,
    escapeHTML,
    sortByProperty,
    debounce
} from './modules/utils.js';
import { loadAllData, initApp as initModulesApp, resetApp, checkAppHealth, showVersionInfo } from './modules/init.js';
import { initSync } from './modules/sync/server-sync.js';

// Phase 2: Données - modules/data/
import * as dataModules from './modules/data/index.js';

// Phase 3: UI - modules/ui/
import * as uiModules from './modules/ui/index.js';
import './modules/ui/summary-timeline.js'; // Import direct pour exposer window.summaryActions
// [ARCHIVÉ 2025-11-15] localStorage-recovery.js → Migration localStorage→Serveur terminée
// Fichier archivé dans: archives/2025-11-15-investigation-localStorage/

// Phase 4: Graphiques - modules/charts/
import * as chartModules from './modules/charts/index.js';

// Phase 5: Import/Export - modules/import-export/
import * as importExportModules from './modules/import-export/index.js';
import { exportCompletePDF } from './modules/export/pdf-export.js';

// Phase 6: Autres modules
import * as demandesModules from './modules/demandes/index.js';
import * as entitiesModules from './modules/entities/index.js';
import * as plansModules from './modules/plans/index.js';

// Phase 7: Assistant virtuel
import { initAssistant } from './modules/assistant/virtual-assistant.js?v=2.4.1';

// ==================== CONFIGURATION DE L'APPLICATION ====================

const appConfig = {
    version: '2.0.0',
    appName: 'Gestion Arrêt Annuel 2026',
    autoSave: true,
    autoSaveInterval: 60000, // 1 minute en millisecondes
    debug: true
};

// ==================== FONCTIONS PRINCIPALES ====================

/**
 * Initialise l'application complète
 * @async
 * @returns {Promise<void>}
 */
export async function initApp() {
    try {
        console.log('Initialisation de ' + appConfig.appName + ' v' + appConfig.version);

        // 0. Exposer les fonctions globales pour les onclick
        exposeGlobalFunctions();
        console.log('[OK] Fonctions globales exposees');

        // 1. Charger le thème sauvegardé
        loadSavedTheme();
        console.log('[OK] Theme charge');

        // 1.5. Initialiser la synchronisation avec le serveur
        console.log('[SYNC] Initialisation de la connexion serveur...');
        const syncSuccess = await initSync('User');
        if (syncSuccess) {
            console.log('[OK] Synchronisation serveur reussie - donnees chargees');
        } else {
            console.warn('[WARNING] Synchronisation serveur echouee - utilisation localStorage');
        }

        // 2. Charger toutes les données depuis localStorage
        if (typeof loadAllData === 'function') {
            await loadAllData();
            console.log('[OK] Donnees chargees');
        }

        // 3. Initialiser les modules de données
        if (dataModules && typeof dataModules.initializeDataModules === 'function') {
            dataModules.initializeDataModules();
            console.log('[OK] Modules de donnees initialises');
        }

        // 4. Initialiser l'UI
        if (uiModules && typeof uiModules.initUI === 'function') {
            uiModules.initUI();
            console.log('[OK] UI initialisee');
        }

        // 5. Charger la page HTML complète
        // DÉSACTIVÉ: loadAppContent() n'est plus nécessaire car tout le contenu est dans index.html
        // await loadAppContent();

        // 6. Afficher la page par défaut (chargée dynamiquement)
        await switchPage('dashboard');
        console.log('[OK] Page dashboard chargee et affichee');

        // 6.5. Initialiser l'assistant virtuel
        await initAssistant();
        console.log('[OK] Assistant virtuel initialise');

        // 7. Configurer la sauvegarde automatique si activée
        if (appConfig.autoSave) {
            setupAutoSave();
            console.log('[OK] Sauvegarde automatique activee');
        }

        // 8. Configurer les écouteurs d'événements globaux
        setupEventListeners();
        console.log('[OK] Ecouteurs configures');

        console.log('[OK] Application initialisee avec succes !');

    } catch (error) {
        console.error('[ERREUR] Lors de l\'initialisation:', error);
        throw error;
    }
}

/**
 * Charge le contenu HTML de l'application
 * @async
 * @returns {Promise<void>}
 */
async function loadAppContent() {
    try {
        console.log('[INFO] Chargement du contenu depuis index-acierie.html...');

        const response = await fetch('/index-acierie.html');
        if (!response.ok) {
            throw new Error('Erreur HTTP: ' + response.status);
        }

        const htmlContent = await response.text();
        console.log('[OK] Fichier HTML charge (' + (htmlContent.length / 1024).toFixed(2) + ' KB)');

        // Parser le HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Extraire le contenu des pages
        const pagesContainer = document.getElementById('pages-container');
        if (pagesContainer && doc.body) {
            // Vérifier si des pages sont déjà présentes
            const existingPages = pagesContainer.querySelectorAll('.page');
            if (existingPages.length > 1) {
                console.log('[INFO] Pages deja presentes, chargement ignore');
                return;
            }

            // Copier toutes les pages (divs avec class="page")
            const pages = doc.querySelectorAll('.page');
            if (pages.length === 0) {
                console.warn('[WARNING] Aucune page trouvee dans le fichier HTML');
                return;
            }

            pages.forEach(page => {
                // Ne pas dupliquer le dashboard qui existe déjà
                if (page.id !== 'dashboard') {
                    pagesContainer.appendChild(page.cloneNode(true));
                }
            });

            console.log('[OK] ' + (pages.length - 1) + ' pages supplementaires chargees');
        } else {
            console.warn('[WARNING] Container de pages non trouve');
        }
    } catch (error) {
        console.error('[ERROR] Impossible de charger le contenu HTML:', error);
        console.error('  Message:', error.message);
        console.warn('[INFO] L\'application va continuer avec le contenu par defaut');
        // L'application continue de fonctionner sans le contenu HTML complet
    }
}

/**
 * Sauvegarde toutes les données
 * @returns {void}
 */
export function saveAllData() {
    try {
        console.log('[SAVE] Sauvegarde de toutes les donnees...');

        if (dataModules && typeof dataModules.saveAllData === 'function') {
            dataModules.saveAllData();
        }

        showNotification('success', 'Données sauvegardées avec succès');
        console.log('[OK] Sauvegarde terminee');
    } catch (error) {
        console.error('[ERREUR] Lors de la sauvegarde:', error);
        showNotification('error', 'Erreur lors de la sauvegarde');
    }
}

/**
 * Exporte toutes les données en Excel
 * @returns {void}
 */
export function exportAllData() {
    try {
        console.log('[EXPORT] Export de toutes les donnees...');

        if (importExportModules && typeof importExportModules.exportToExcel === 'function') {
            importExportModules.exportToExcel();
        }

        showNotification('success', 'Export termine');
        console.log('[OK] Export termine');
    } catch (error) {
        console.error('[ERREUR] Lors de l\'export:', error);
        showNotification('error', 'Erreur lors de l\'export');
    }
}

/**
 * Configure la sauvegarde automatique
 * @returns {void}
 */
function setupAutoSave() {
    setInterval(() => {
        if (appConfig.debug) {
            console.log('[AUTO-SAVE] Sauvegarde automatique...');
        }
        saveAllData();
    }, appConfig.autoSaveInterval);
}

/**
 * Configure les écouteurs d'événements globaux
 * @returns {void}
 */
function setupEventListeners() {
    // Déjà géré dans index.html, mais on peut ajouter d'autres écouteurs ici
    console.log('[OK] Ecouteurs d\'evenements configures');
}

/**
 * Affiche une notification à l'utilisateur
 * @param {string} type - Type de notification ('success', 'error', 'info', 'warning')
 * @param {string} message - Message à afficher
 * @returns {void}
 */
export function showNotification(type, message) {
    const prefix = {
        success: '[OK]',
        error: '[ERROR]',
        info: '[INFO]',
        warning: '[WARNING]'
    }[type] || '[INFO]';

    console.log(prefix + ' ' + message);

    // TODO: Implémenter une vraie notification visuelle
    // Pour l'instant, on utilise console.log
}

// ==================== EXPORTS GLOBAUX ====================

// Exposer les fonctions principales pour l'utilisation dans l'application
export {
    switchPage,
    changeTheme,
    saveAllData as save,
    exportAllData as exportData,
    appConfig
};

// Exposer les modules pour un accès avancé si nécessaire
export {
    dataModules,
    uiModules,
    chartModules,
    importExportModules,
    demandesModules,
    entitiesModules,
    plansModules
};

// ==================== VERSION INFO ====================

console.log('%c' + appConfig.appName + ' %cv' + appConfig.version,
    'background: #4a7c59; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;',
    'background: #ecf0f3; color: #000; padding: 5px 10px; font-weight: bold;');
