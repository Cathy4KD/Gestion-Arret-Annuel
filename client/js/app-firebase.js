/**
 * @fileoverview Point d'entrée principal de l'application Arrêt Annuel - VERSION FIREBASE
 * Cette version utilise Firebase Firestore au lieu du serveur Node.js local
 * @module app-firebase
 * @version 2.0.0-firebase
 * @date 2025-11-28
 */

// ==================== IMPORTS DES MODULES ====================

// Phase 0a: Import direct des modules de données critiques pour garantir l'exposition des fonctions
import './modules/data/arret-data.js';
import './modules/data/iw37n-data.js';
import './modules/data/iw38-data.js';
import './modules/data/pieces-data.js';
import './modules/data/t51-soumissions.js';

// Phase 0b: Fonctions globales (pour les onclick dans le HTML)
import { exposeGlobalFunctions } from './global-functions.js';

// Phase 1: Core - Modules de base
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

// ***** FIREBASE SYNC au lieu de server-sync *****
import { initSync } from './modules/sync/firebase-sync.js';

// Phase 2: Données
import * as dataModules from './modules/data/index.js';

// Phase 3: UI
import * as uiModules from './modules/ui/index.js';
import './modules/ui/summary-timeline.js';

// Phase 4: Graphiques
import * as chartModules from './modules/charts/index.js';

// Phase 5: Import/Export
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
    version: '2.0.0-firebase',
    appName: 'Gestion Arrêt Annuel 2026 (Firebase)',
    autoSave: true,
    autoSaveInterval: 120000, // 2 minutes (moins fréquent car Firebase sauvegarde en temps réel)
    debug: true,
    mode: 'firebase' // Indique qu'on utilise Firebase
};

// ==================== FONCTIONS PRINCIPALES ====================

/**
 * Initialise l'application complète avec Firebase
 * @async
 * @returns {Promise<void>}
 */
export async function initApp() {
    try {
        console.log('🔥 Initialisation de ' + appConfig.appName + ' v' + appConfig.version);

        // 0. Exposer les fonctions globales pour les onclick
        exposeGlobalFunctions();
        console.log('[OK] Fonctions globales exposées');

        // 1. Charger le thème sauvegardé
        loadSavedTheme();
        console.log('[OK] Thème chargé');

        // 1.5. Initialiser la synchronisation avec Firebase
        console.log('[FIREBASE] Initialisation de la connexion Firebase...');
        const syncSuccess = await initSync('User');
        if (syncSuccess) {
            console.log('[OK] Synchronisation Firebase réussie - données chargées');
        } else {
            console.warn('[WARNING] Synchronisation Firebase échouée');
        }

        // 2. Charger toutes les données (déjà fait par initSync pour Firebase)
        if (typeof loadAllData === 'function') {
            await loadAllData();
            console.log('[OK] Données chargées');
        }

        // 3. Initialiser les modules de données
        if (dataModules && typeof dataModules.initializeDataModules === 'function') {
            dataModules.initializeDataModules();
            console.log('[OK] Modules de données initialisés');
        }

        // 4. Initialiser l'UI
        if (uiModules && typeof uiModules.initUI === 'function') {
            uiModules.initUI();
            console.log('[OK] UI initialisée');
        }

        // 6. Afficher la page par défaut
        await switchPage('dashboard');
        console.log('[OK] Page dashboard chargée');

        // 6.5. Initialiser l'assistant virtuel
        try {
            await initAssistant();
            console.log('[OK] Assistant virtuel initialisé');
        } catch (e) {
            console.warn('[WARNING] Assistant virtuel non disponible:', e.message);
        }

        // 7. Configurer la sauvegarde automatique (moins fréquente car Firebase sauvegarde en temps réel)
        if (appConfig.autoSave) {
            setupAutoSave();
            console.log('[OK] Sauvegarde automatique activée');
        }

        // 8. Configurer les écouteurs d'événements globaux
        setupEventListeners();
        console.log('[OK] Écouteurs configurés');

        // Afficher le mode Firebase
        showFirebaseStatus();

        console.log('[OK] Application initialisée avec succès !');

    } catch (error) {
        console.error('[ERREUR] Lors de l\'initialisation:', error);
        throw error;
    }
}

/**
 * Affiche le statut Firebase dans l'interface
 */
function showFirebaseStatus() {
    // Ajouter un indicateur Firebase dans le header
    const header = document.querySelector('.header-title, .app-title, h1');
    if (header) {
        const badge = document.createElement('span');
        badge.innerHTML = ' 🔥';
        badge.title = 'Mode Firebase - Données synchronisées en temps réel';
        badge.style.cssText = 'font-size: 0.8em; cursor: help;';
        header.appendChild(badge);
    }
}

/**
 * Sauvegarde toutes les données
 * @returns {void}
 */
export function saveAllData() {
    try {
        console.log('[SAVE] Sauvegarde de toutes les données...');

        if (dataModules && typeof dataModules.saveAllData === 'function') {
            dataModules.saveAllData();
        }

        showNotification('success', 'Données sauvegardées');
        console.log('[OK] Sauvegarde terminée');
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
        console.log('[EXPORT] Export de toutes les données...');

        if (importExportModules && typeof importExportModules.exportToExcel === 'function') {
            importExportModules.exportToExcel();
        }

        showNotification('success', 'Export terminé');
        console.log('[OK] Export terminé');
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
            console.log('[AUTO-SAVE] Sauvegarde automatique Firebase...');
        }
        saveAllData();
    }, appConfig.autoSaveInterval);
}

/**
 * Configure les écouteurs d'événements globaux
 * @returns {void}
 */
function setupEventListeners() {
    // Écouter les mises à jour Firebase en temps réel
    window.addEventListener('firebase-data-updated', (event) => {
        console.log('[FIREBASE] Données mises à jour en temps réel');
        showNotification('info', 'Données synchronisées');
    });

    console.log('[OK] Écouteurs d\'événements configurés');
}

/**
 * Affiche une notification à l'utilisateur
 * @param {string} type - Type de notification ('success', 'error', 'info', 'warning')
 * @param {string} message - Message à afficher
 * @returns {void}
 */
export function showNotification(type, message) {
    const prefix = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    }[type] || 'ℹ️';

    console.log(prefix + ' ' + message);

    // Créer une notification visuelle simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    notification.textContent = prefix + ' ' + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== EXPORTS GLOBAUX ====================

export {
    switchPage,
    changeTheme,
    saveAllData as save,
    exportAllData as exportData,
    appConfig
};

export {
    dataModules,
    uiModules,
    chartModules,
    importExportModules,
    demandesModules,
    entitiesModules,
    plansModules
};

// Exposer les actions pour l'application
window.appActions = {
    saveAllData,
    exportAllData
};

// ==================== VERSION INFO ====================

console.log('%c' + appConfig.appName + ' %cv' + appConfig.version,
    'background: #f97316; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;',
    'background: #ecf0f3; color: #000; padding: 5px 10px; font-weight: bold;');
