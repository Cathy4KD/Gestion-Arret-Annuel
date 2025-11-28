/**
 * @fileoverview Point d'entrée du module Modals
 * @module modals
 *
 * @description
 * Module centralisé pour gérer toutes les modales de l'application
 * - Ouverture/fermeture de modales
 * - Gestion du contenu dynamique
 * - Gestion des overlays
 *
 * Source: Diverses sections du fichier HTML original
 */

/**
 * Ouvre une modale par son ID
 *
 * @param {string} modalId - L'ID de la modale à ouvrir
 * @returns {HTMLElement|null} L'élément de la modale ou null si non trouvé
 *
 * @example
 * openModal('taskDetailsModal');
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`[MODAL] Modale non trouvée: ${modalId}`);
        return null;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Empêcher le scroll du body

    console.log(`[MODAL] Ouverture: ${modalId}`);
    return modal;
}

/**
 * Ferme une modale par son ID
 *
 * @param {string} modalId - L'ID de la modale à fermer
 * @returns {boolean} true si fermée avec succès, false sinon
 *
 * @example
 * closeModal('taskDetailsModal');
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`[MODAL] Modale non trouvée: ${modalId}`);
        return false;
    }

    modal.style.display = 'none';

    // Vérifier s'il reste des modales ouvertes avant de réactiver le scroll
    const openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
    if (openModals.length === 0) {
        document.body.style.overflow = '';
    }

    console.log(`[MODAL] Fermeture: ${modalId}`);
    return true;
}

/**
 * Ferme toutes les modales ouvertes
 *
 * @returns {number} Nombre de modales fermées
 *
 * @example
 * closeAllModals();
 */
export function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });

    document.body.style.overflow = '';

    console.log(`[MODAL] ${modals.length} modale(s) fermée(s)`);
    return modals.length;
}

/**
 * Crée une modale dynamique avec contenu personnalisé
 *
 * @param {Object} config - Configuration de la modale
 * @param {string} config.id - ID unique de la modale
 * @param {string} config.title - Titre de la modale
 * @param {string} config.content - Contenu HTML de la modale
 * @param {Array<Object>} [config.buttons] - Liste des boutons à afficher
 * @param {string} [config.size='medium'] - Taille de la modale ('small', 'medium', 'large', 'xlarge')
 * @returns {HTMLElement} L'élément de la modale créé
 *
 * @example
 * createModal({
 *   id: 'confirmDelete',
 *   title: 'Confirmer la suppression',
 *   content: '<p>Êtes-vous sûr de vouloir supprimer cet élément?</p>',
 *   buttons: [
 *     { text: 'Annuler', class: 'modal-btn-secondary', onClick: () => closeModal('confirmDelete') },
 *     { text: 'Supprimer', class: 'modal-btn-danger', onClick: handleDelete }
 *   ],
 *   size: 'small'
 * });
 */
export function createModal(config) {
    const {
        id,
        title,
        content,
        buttons = [],
        size = 'medium'
    } = config;

    // Vérifier si la modale existe déjà
    let modal = document.getElementById(id);
    if (modal) {
        console.warn(`[MODAL] Modale ${id} existe déjà, mise à jour du contenu`);
        modal.remove();
    }

    // Classes de taille
    const sizeClasses = {
        'small': 'modal-small',
        'medium': 'modal-medium',
        'large': 'modal-large',
        'xlarge': 'modal-xlarge'
    };

    // Créer la structure de la modale
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal-overlay';
    modal.style.display = 'none';

    // Générer les boutons
    const buttonsHTML = buttons.map((btn, index) => {
        const btnClass = btn.class || 'modal-btn-secondary';
        return `<button class="modal-btn ${btnClass}" data-btn-index="${index}">${btn.text}</button>`;
    }).join('');

    modal.innerHTML = `
        <div class="modal-content ${sizeClasses[size] || 'modal-medium'}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${buttons.length > 0 ? `
            <div class="modal-footer">
                ${buttonsHTML}
            </div>
            ` : ''}
        </div>
    `;

    // Attacher les événements aux boutons
    document.body.appendChild(modal);

    buttons.forEach((btn, index) => {
        const btnElement = modal.querySelector(`[data-btn-index="${index}"]`);
        if (btnElement && btn.onClick) {
            btnElement.addEventListener('click', btn.onClick);
        }
    });

    // Fermer au clic sur l'overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(id);
        }
    });

    console.log(`[MODAL] Modale créée: ${id}`);
    return modal;
}

/**
 * Met à jour le contenu d'une modale existante
 *
 * @param {string} modalId - ID de la modale
 * @param {Object} updates - Objets contenant les mises à jour
 * @param {string} [updates.title] - Nouveau titre
 * @param {string} [updates.content] - Nouveau contenu
 * @returns {boolean} true si mise à jour réussie
 *
 * @example
 * updateModalContent('taskDetailsModal', {
 *   title: 'Nouveau titre',
 *   content: '<p>Nouveau contenu</p>'
 * });
 */
export function updateModalContent(modalId, updates) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`[MODAL] Modale non trouvée: ${modalId}`);
        return false;
    }

    if (updates.title) {
        const titleElement = modal.querySelector('.modal-header h3');
        if (titleElement) {
            titleElement.textContent = updates.title;
        }
    }

    if (updates.content) {
        const bodyElement = modal.querySelector('.modal-body');
        if (bodyElement) {
            bodyElement.innerHTML = updates.content;
        }
    }

    console.log(`[MODAL] Contenu mis à jour: ${modalId}`);
    return true;
}

/**
 * Affiche une modale de confirmation simple
 *
 * @param {string} message - Message à afficher
 * @param {Function} onConfirm - Callback appelé si confirmé
 * @param {Function} [onCancel] - Callback appelé si annulé
 * @returns {HTMLElement} L'élément de la modale
 *
 * @example
 * showConfirmModal(
 *   'Voulez-vous vraiment supprimer cette tâche?',
 *   () => { deleteTask(); },
 *   () => { console.log('Annulé'); }
 * );
 */
export function showConfirmModal(message, onConfirm, onCancel = null) {
    const modalId = 'confirmModal_' + Date.now();

    createModal({
        id: modalId,
        title: 'Confirmation',
        content: `<p style="font-size: 14px; line-height: 1.6;">${message}</p>`,
        size: 'small',
        buttons: [
            {
                text: 'Annuler',
                class: 'modal-btn-secondary',
                onClick: () => {
                    closeModal(modalId);
                    if (onCancel) onCancel();
                }
            },
            {
                text: 'Confirmer',
                class: 'modal-btn-primary',
                onClick: () => {
                    closeModal(modalId);
                    onConfirm();
                }
            }
        ]
    });

    openModal(modalId);
    return document.getElementById(modalId);
}

/**
 * Affiche une modale d'alerte simple
 *
 * @param {string} title - Titre de l'alerte
 * @param {string} message - Message à afficher
 * @param {string} [type='info'] - Type d'alerte ('info', 'success', 'warning', 'error')
 * @returns {HTMLElement} L'élément de la modale
 *
 * @example
 * showAlertModal('Succès', 'La tâche a été sauvegardée avec succès!', 'success');
 */
export function showAlertModal(title, message, type = 'info') {
    const modalId = 'alertModal_' + Date.now();

    const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };

    const colors = {
        'info': '#3498db',
        'success': '#4a7c59',
        'warning': '#c9941a',
        'error': '#c5554a'
    };

    createModal({
        id: modalId,
        title: `${icons[type] || ''} ${title}`,
        content: `<p style="font-size: 14px; line-height: 1.6; color: ${colors[type] || '#000000'};">${message}</p>`,
        size: 'small',
        buttons: [
            {
                text: 'OK',
                class: 'modal-btn-primary',
                onClick: () => closeModal(modalId)
            }
        ]
    });

    openModal(modalId);
    return document.getElementById(modalId);
}

/**
 * Initialise le système de modales
 * Attache les événements globaux (ESC pour fermer, etc.)
 *
 * @returns {void}
 */
export function initModals() {
    // Fermer toutes les modales avec la touche ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Attacher les événements aux boutons de fermeture existants
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                modal.style.display = 'none';

                // Vérifier s'il reste des modales ouvertes
                const openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
                if (openModals.length === 0) {
                    document.body.style.overflow = '';
                }
            }
        });
    });

    // Fermer au clic sur l'overlay (toutes les modales existantes)
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';

                const openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
                if (openModals.length === 0) {
                    document.body.style.overflow = '';
                }
            }
        });
    });

    console.log('[OK] Module Modals initialisé');
}

export default {
    init: initModals,
    open: openModal,
    close: closeModal,
    closeAll: closeAllModals,
    create: createModal,
    update: updateModalContent,
    confirm: showConfirmModal,
    alert: showAlertModal
};
