/**
 * Point d'entrée central pour tous les modules de l'application
 *
 * Ce fichier réexporte toutes les fonctions des différents modules
 * pour faciliter leur importation.
 *
 * @module index
 * @version 1.0.0 - Phase 1
 */

// Navigation
export {
    switchPage,
    getStatusClass
} from './navigation.js';

// Thème
export {
    changeTheme,
    loadSavedTheme,
    getCurrentTheme,
    resetTheme,
    AVAILABLE_THEMES
} from './theme.js';

// Utilitaires
export {
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
} from './utils.js';

// Initialisation
export {
    loadAllData,
    initApp,
    resetApp,
    checkAppHealth,
    showVersionInfo
} from './init.js';

// Modales
export {
    openModal,
    closeModal,
    closeAllModals,
    createModal,
    updateModalContent,
    showConfirmModal,
    showAlertModal,
    initModals
} from './modals/index.js';

// Métadonnées d'ordres (commentaires, statuts, documents)
export {
    initOrderMetadata,
    getOrderMetadata,
    getAllMetadata,
    addComment,
    deleteComment,
    setStatus,
    addDocument,
    deleteDocument,
    setCustomField,
    getCustomField,
    subscribe as subscribeToMetadata,
    exportMetadataToExcel,
    importMetadata,
    clearAllMetadata
} from './data/order-metadata.js';

// UI pour les métadonnées d'ordres
export {
    renderOrderMetadataUI
} from './ui/order-metadata-ui.js';

/**
 * Informations sur les modules
 */
export const MODULE_INFO = {
    version: '1.0.0',
    phase: 'Phase 1 - Core et Navigation',
    date: '2025-10-22',
    modules: {
        navigation: {
            file: 'navigation.js',
            functions: 2,
            description: 'Gestion de la navigation entre pages'
        },
        theme: {
            file: 'theme.js',
            functions: 4,
            description: 'Gestion des thèmes visuels'
        },
        utils: {
            file: 'utils.js',
            functions: 15,
            description: 'Fonctions utilitaires générales'
        },
        init: {
            file: 'init.js',
            functions: 5,
            description: 'Initialisation de l\'application'
        }
    },
    totalFunctions: 26,
    totalLines: 859
};

/**
 * Affiche les informations sur les modules dans la console
 */
export function showModuleInfo() {
    console.log('[PACKAGE] Modules JavaScript - Phase 1');
    console.log('================================');
    console.table(MODULE_INFO.modules);
    console.log(`\n[OK] Total: ${MODULE_INFO.totalFunctions} fonctions | ${MODULE_INFO.totalLines} lignes de code`);
}
