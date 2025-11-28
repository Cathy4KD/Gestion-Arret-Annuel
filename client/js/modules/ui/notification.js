/**
 * @fileoverview Module de notifications utilisateur
 * @module ui/notification
 */

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification ('success', 'error', 'warning', 'info')
 */
export function showNotification(message, type = 'info') {
    // Pour l'instant, utilisons une simple alerte
    // TODO: Implémenter un système de notifications plus élaboré
    if (type === 'error') {
        console.error('[NOTIFICATION]', message);
        alert('❌ ' + message);
    } else if (type === 'success') {
        console.log('[NOTIFICATION]', message);
        alert('✅ ' + message);
    } else if (type === 'warning') {
        console.warn('[NOTIFICATION]', message);
        alert('⚠️ ' + message);
    } else {
        console.info('[NOTIFICATION]', message);
        alert('ℹ️ ' + message);
    }
}

/**
 * Affiche une notification de succès
 * @param {string} message - Message de succès
 */
export function showSuccess(message) {
    showNotification(message, 'success');
}

/**
 * Affiche une notification d'erreur
 * @param {string} message - Message d'erreur
 */
export function showError(message) {
    showNotification(message, 'error');
}

/**
 * Affiche une notification d'avertissement
 * @param {string} message - Message d'avertissement
 */
export function showWarning(message) {
    showNotification(message, 'warning');
}

/**
 * Affiche une notification d'information
 * @param {string} message - Message d'information
 */
export function showInfo(message) {
    showNotification(message, 'info');
}

console.log('[NOTIFICATION] ✅ Module chargé');
