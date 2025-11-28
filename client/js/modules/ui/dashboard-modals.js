/**
 * Module de gestion des modales du Dashboard
 * Utilise le système de modales réutilisables
 * @module ui/dashboard-modals
 */

import { createModal, openModal } from '../modals/index.js';

/**
 * Affiche une modale avec du contenu personnalisé
 * @param {string} title - Titre de la modale
 * @param {string} content - Contenu HTML
 * @param {string} size - Taille de la modale ('small', 'medium', 'large', 'xlarge')
 */
export function showModal(title, content, size = 'medium') {
    const modalId = 'dashboardModal_' + Date.now();

    createModal({
        id: modalId,
        title: title,
        content: content,
        size: size,
        buttons: [
            {
                text: 'Fermer',
                class: 'modal-btn-secondary',
                onClick: () => {
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                }
            }
        ]
    });

    openModal(modalId);
}
