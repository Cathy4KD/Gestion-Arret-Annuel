/**
 * @fileoverview Gestionnaire de redimensionnement automatique des textareas
 * @module textarea-resize-manager
 */

(function() {
    'use strict';

    /**
     * Ajuste automatiquement la hauteur d'un textarea en fonction de son contenu
     * @param {HTMLTextAreaElement} textarea - Le textarea a redimensionner
     */
    function autoResize(textarea) {
        if (!textarea || textarea.tagName !== 'TEXTAREA') return;

        // Sauvegarder la position du scroll
        const scrollTop = window.scrollY;

        // Reset height to recalculate
        textarea.style.height = 'auto';

        // Set new height based on scrollHeight
        const newHeight = Math.max(textarea.scrollHeight, 60);
        textarea.style.height = newHeight + 'px';

        // Restaurer la position du scroll
        window.scrollTo(0, scrollTop);
    }

    /**
     * Initialise le gestionnaire de redimensionnement pour tous les textareas
     */
    function initTextareaResizeManager() {
        // Trouver tous les textareas avec la classe auto-resize
        const textareas = document.querySelectorAll('textarea.auto-resize, textarea[data-auto-resize]');

        textareas.forEach(textarea => {
            // Appliquer le style de base
            textarea.style.overflow = 'hidden';
            textarea.style.resize = 'none';

            // Attacher les evenements
            textarea.addEventListener('input', function() {
                autoResize(this);
            });

            textarea.addEventListener('focus', function() {
                autoResize(this);
            });

            // Redimensionner au chargement si du contenu existe
            if (textarea.value) {
                autoResize(textarea);
            }
        });

        console.log(`[TEXTAREA-RESIZE] ${textareas.length} textareas initialises`);
    }

    /**
     * Observe les nouveaux textareas ajoutes dynamiquement
     */
    function observeNewTextareas() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Verifier si c'est un textarea auto-resize
                        if (node.tagName === 'TEXTAREA' &&
                            (node.classList.contains('auto-resize') || node.hasAttribute('data-auto-resize'))) {
                            node.style.overflow = 'hidden';
                            node.style.resize = 'none';
                            node.addEventListener('input', function() {
                                autoResize(this);
                            });
                            if (node.value) {
                                autoResize(node);
                            }
                        }

                        // Verifier les textareas enfants
                        const childTextareas = node.querySelectorAll ?
                            node.querySelectorAll('textarea.auto-resize, textarea[data-auto-resize]') : [];
                        childTextareas.forEach(textarea => {
                            textarea.style.overflow = 'hidden';
                            textarea.style.resize = 'none';
                            textarea.addEventListener('input', function() {
                                autoResize(this);
                            });
                            if (textarea.value) {
                                autoResize(textarea);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Exposer les fonctions globalement
    window.textareaResizeManager = {
        autoResize: autoResize,
        init: initTextareaResizeManager
    };

    // Initialiser au chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initTextareaResizeManager();
            observeNewTextareas();
        });
    } else {
        initTextareaResizeManager();
        observeNewTextareas();
    }

    console.log('[OK] Textarea Resize Manager charge');
})();
