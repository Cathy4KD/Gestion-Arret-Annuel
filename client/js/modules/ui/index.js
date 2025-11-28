/**
 * @fileoverview Point d'entrée du package UI - Réexporte tous les modules UI
 * @module ui
 *
 * Ce module centralise l'accès à tous les composants d'interface utilisateur
 * de l'application. Il permet d'importer facilement tous les modules UI
 * depuis un seul point d'entrée.
 *
 * @example
 * // Importer tous les modules UI
 * import * as UI from './modules/ui/index.js';
 * UI.renderKanban();
 * UI.renderCalendar();
 *
 * @example
 * // Importer des modules spécifiques
 * import { renderKanban, initKanbanDragDrop } from './modules/ui/index.js';
 */

// ============================================================================
// MODULE KANBAN
// ============================================================================

/**
 * @see module:ui/kanban
 */
export {
    renderKanban,
    initKanbanDragDrop,
    initStaticKanban,
    getDraggedElement,
    setDraggedElement
} from './kanban.js';

// ============================================================================
// MODULE CALENDAR
// ============================================================================

/**
 * @see module:ui/calendar
 */
export {
    changeCalendarMonth,
    renderCalendar,
    changeTPAAPWMonth,
    renderTPAAPWCalendar,
    renderMonthCalendar,
    getCurrentCalendarDate,
    setCurrentCalendarDate,
    getCurrentTPAAPWDate,
    setCurrentTPAAPWDate
} from './calendar.js';

// ============================================================================
// MODULE TIMELINE
// ============================================================================

/**
 * @see module:ui/timeline
 */
export {
    initTimeline,
    playTimeline,
    pauseTimeline,
    stopTimeline,
    stepBackward,
    stepForward,
    closeModeLecture,
    getTimelineState,
    setTimeScale,
    setCurrentTime
} from './timeline.js';

// ============================================================================
// MODULE DRAG & DROP
// ============================================================================

/**
 * @see module:ui/drag-drop
 */
export {
    initDragDrop,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFileDrop,
    handleFilesDragOver,
    handleFilesDragLeave,
    makeDraggable,
    makeDroppable,
    removeDragDrop,
    getDragDropState,
    resetDragDropState
} from './drag-drop.js';

// ============================================================================
// MODULE SUMMARY (PRÉPARATION)
// ============================================================================

/**
 * @see module:ui/summary
 */
export {
    renderSummaryTable
} from './summary.js';

/**
 * @see module:ui/summary-timeline
 */
export {
    switchView,
    renderTimeline
} from './summary-timeline.js';

// ============================================================================
// MODULE POINT DE PRESSE
// ============================================================================

/**
 * @see module:ui/point-presse-ui
 */
export {
    initPointPresseUI,
    showAddForm,
    showEditForm,
    renderPointPresseList,
    deletePointPresseUI,
    exportToExcelUI
} from './point-presse-ui.js';

// ============================================================================
// UTILITAIRES ET HELPERS
// ============================================================================

/**
 * Initialise tous les modules UI
 *
 * Cette fonction initialise les composants UI principaux de l'application
 * dans le bon ordre et avec les bonnes dépendances.
 *
 * @param {Object} config - Configuration globale
 * @param {Object} config.timelineData - Données pour la timeline
 * @param {Object} config.dragDropCallbacks - Callbacks pour drag & drop
 * @returns {Promise<void>}
 *
 * @example
 * initUI({
 *   timelineData: planData,
 *   dragDropCallbacks: {
 *     onDrop: (e, target, data) => console.log('Dropped')
 *   }
 * });
 */
export async function initUI(config = {}) {
    // Initialiser la timeline si des données sont fournies
    if (config.timelineData) {
        const { initTimeline } = await import('./timeline.js');
        initTimeline(config.timelineData);
    }

    // Initialiser le drag & drop si des callbacks sont fournis
    if (config.dragDropCallbacks) {
        const { initDragDrop } = await import('./drag-drop.js');
        initDragDrop(config.dragDropCallbacks);
    }

    // Initialiser le module Point de Presse
    const { initPointPresseUI } = await import('./point-presse-ui.js');
    initPointPresseUI();

    console.log('[OK] Modules UI initialises');
}

/**
 * Rafraîchit tous les composants UI visibles
 *
 * Cette fonction est utile après une mise à jour de données
 * pour rafraîchir tous les composants affichés.
 *
 * @returns {Promise<void>}
 *
 * @example
 * // Après mise à jour des données
 * updateArretData(newData);
 * refreshAllUI();
 */
export async function refreshAllUI() {
    // Rafraîchir le Kanban s'il est visible
    const kanbanView = document.getElementById('kanban-notstarted');
    if (kanbanView && kanbanView.offsetParent !== null) {
        const { renderKanban } = await import('./kanban.js');
        renderKanban();
    }

    // Rafraîchir le calendrier s'il est visible
    const calendarView = document.getElementById('calendarView');
    if (calendarView && calendarView.offsetParent !== null) {
        const { renderCalendar } = await import('./calendar.js');
        renderCalendar();
    }

    console.log('[OK] UI rafraichi');
}

/**
 * Nettoie tous les événements et états des modules UI
 *
 * Utile lors de la destruction de composants ou du changement de page.
 *
 * @returns {Promise<void>}
 *
 * @example
 * cleanupUI();
 */
export async function cleanupUI() {
    const { resetDragDropState } = await import('./drag-drop.js');
    resetDragDropState();

    const { pauseTimeline } = await import('./timeline.js');
    pauseTimeline();

    console.log('[OK] UI nettoye');
}

// ============================================================================
// MÉTADONNÉES DU PACKAGE
// ============================================================================

/**
 * Version du package UI
 * @constant {string}
 */
export const VERSION = '1.0.0';

/**
 * Liste des modules disponibles
 * @constant {string[]}
 */
export const MODULES = [
    'kanban',
    'calendar',
    'timeline',
    'drag-drop',
    'summary',
    'summary-timeline',
    'point-presse'
];

/**
 * Informations sur le package
 * @constant {Object}
 */
export const INFO = {
    name: 'UI Modules',
    version: VERSION,
    modules: MODULES,
    description: 'Modules d\'interface utilisateur pour l\'application Arrêt Annuel',
    author: 'Generated by Claude Code'
};
