/**
 * @fileoverview Module Drag & Drop - Système générique de drag and drop
 * @module ui/drag-drop
 *
 * Ce module fournit un système générique et réutilisable pour gérer
 * les opérations de drag & drop dans l'application. Il peut être utilisé
 * pour le Kanban, les fichiers, ou tout autre élément draggable.
 *
 * Source: arret-annuel-avec-liste.html lignes 13987-14031, 9465-9493
 */

/**
 * État global du drag & drop
 * @type {Object}
 */
const dragDropState = {
    draggedElement: null,
    draggedData: null,
    dragOverElement: null,
    isDragging: false
};

/**
 * Configuration des callbacks de drag & drop
 * @type {Object}
 */
const dragDropCallbacks = {
    onDragStart: null,
    onDragEnd: null,
    onDragOver: null,
    onDrop: null,
    onDragEnter: null,
    onDragLeave: null
};

/**
 * Initialise le système de drag & drop avec des callbacks personnalisés
 *
 * @param {Object} callbacks - Callbacks pour les événements de drag & drop
 * @param {Function} [callbacks.onDragStart] - Appelé au début du drag
 * @param {Function} [callbacks.onDragEnd] - Appelé à la fin du drag
 * @param {Function} [callbacks.onDragOver] - Appelé pendant le survol
 * @param {Function} [callbacks.onDrop] - Appelé lors du drop
 * @param {Function} [callbacks.onDragEnter] - Appelé lors de l'entrée dans une zone
 * @param {Function} [callbacks.onDragLeave] - Appelé lors de la sortie d'une zone
 * @returns {void}
 *
 * @example
 * initDragDrop({
 *   onDragStart: (e, element) => console.log('Drag started'),
 *   onDrop: (e, element, data) => console.log('Dropped', data)
 * });
 */
export function initDragDrop(callbacks = {}) {
    Object.assign(dragDropCallbacks, callbacks);
}

/**
 * Gestionnaire d'événement au début du drag
 *
 * @param {DragEvent} e - Événement drag
 * @returns {void}
 *
 * @example
 * element.addEventListener('dragstart', handleDragStart);
 */
export function handleDragStart(e) {
    dragDropState.draggedElement = e.currentTarget;
    dragDropState.isDragging = true;

    // Extraire les données depuis les data attributes
    const element = e.currentTarget;
    dragDropState.draggedData = {
        id: element.dataset.id,
        type: element.dataset.type,
        status: element.dataset.status,
        phaseId: element.dataset.phaseId,
        taskId: element.dataset.taskId
    };

    element.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', element.dataset.id || '');

    // Callback personnalisé
    if (dragDropCallbacks.onDragStart) {
        dragDropCallbacks.onDragStart(e, element, dragDropState.draggedData);
    }
}

/**
 * Gestionnaire d'événement à la fin du drag
 *
 * @param {DragEvent} e - Événement drag
 * @returns {void}
 *
 * @example
 * element.addEventListener('dragend', handleDragEnd);
 */
export function handleDragEnd(e) {
    const element = e.currentTarget;
    element.classList.remove('dragging');

    dragDropState.isDragging = false;

    // Callback personnalisé
    if (dragDropCallbacks.onDragEnd) {
        dragDropCallbacks.onDragEnd(e, element, dragDropState.draggedData);
    }

    // Réinitialiser l'état
    dragDropState.draggedElement = null;
    dragDropState.draggedData = null;
}

/**
 * Gestionnaire d'événement pendant le survol lors du drag
 *
 * @param {DragEvent} e - Événement drag
 * @returns {boolean} false pour permettre le drop
 *
 * @example
 * dropzone.addEventListener('dragover', handleDragOver);
 */
export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';

    // Callback personnalisé
    if (dragDropCallbacks.onDragOver) {
        dragDropCallbacks.onDragOver(e, e.currentTarget, dragDropState.draggedData);
    }

    return false;
}

/**
 * Gestionnaire d'événement lors de l'entrée dans une zone de drop
 *
 * @param {DragEvent} e - Événement drag
 * @returns {void}
 *
 * @example
 * dropzone.addEventListener('dragenter', handleDragEnter);
 */
export function handleDragEnter(e) {
    e.currentTarget.classList.add('drag-over');
    dragDropState.dragOverElement = e.currentTarget;

    // Callback personnalisé
    if (dragDropCallbacks.onDragEnter) {
        dragDropCallbacks.onDragEnter(e, e.currentTarget, dragDropState.draggedData);
    }
}

/**
 * Gestionnaire d'événement lors de la sortie d'une zone de drop
 *
 * @param {DragEvent} e - Événement drag
 * @returns {void}
 *
 * @example
 * dropzone.addEventListener('dragleave', handleDragLeave);
 */
export function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');

    // Callback personnalisé
    if (dragDropCallbacks.onDragLeave) {
        dragDropCallbacks.onDragLeave(e, e.currentTarget, dragDropState.draggedData);
    }
}

/**
 * Gestionnaire d'événement lors du drop
 *
 * @param {DragEvent} e - Événement drop
 * @returns {boolean} false pour stopper la propagation
 *
 * @example
 * dropzone.addEventListener('drop', handleDrop);
 */
export function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.currentTarget.classList.remove('drag-over');

    // Callback personnalisé
    if (dragDropCallbacks.onDrop && dragDropState.draggedElement) {
        dragDropCallbacks.onDrop(
            e,
            e.currentTarget,
            dragDropState.draggedData,
            dragDropState.draggedElement
        );
    }

    return false;
}

/**
 * Gestionnaire spécifique pour le drop de fichiers
 *
 * Extrait les fichiers de l'événement de drop et appelle un callback
 * pour traiter chaque fichier.
 *
 * @param {DragEvent} event - Événement drop
 * @param {Function} onFilesDropped - Callback appelé avec les fichiers droppés
 * @returns {void}
 *
 * @example
 * handleFileDrop(event, (files) => {
 *   console.log('Files dropped:', files);
 * });
 */
export function handleFileDrop(event, onFilesDropped) {
    event.preventDefault();
    event.stopPropagation();

    const dropzone = event.currentTarget;
    if (dropzone) {
        dropzone.style.background = '#f8f9fa';
        dropzone.style.borderColor = '#4299e1';
    }

    const files = event.dataTransfer.files;
    if (files.length > 0 && onFilesDropped) {
        onFilesDropped(Array.from(files));
    }
}

/**
 * Gestionnaire pour le dragover de fichiers (styling)
 *
 * @param {DragEvent} event - Événement dragover
 * @param {Object} [styles] - Styles personnalisés à appliquer
 * @returns {void}
 *
 * @example
 * dropzone.addEventListener('dragover', (e) => handleFilesDragOver(e));
 */
export function handleFilesDragOver(event, styles = {}) {
    event.preventDefault();

    const dropzone = event.currentTarget;
    if (dropzone) {
        dropzone.style.background = styles.background || '#e3f2fd';
        dropzone.style.borderColor = styles.borderColor || '#2196f3';
    }
}

/**
 * Gestionnaire pour la sortie de la zone de drop de fichiers (styling)
 *
 * @param {DragEvent} event - Événement dragleave
 * @returns {void}
 *
 * @example
 * dropzone.addEventListener('dragleave', handleFilesDragLeave);
 */
export function handleFilesDragLeave(event) {
    const dropzone = event.currentTarget;
    if (dropzone) {
        dropzone.style.background = '#f8f9fa';
        dropzone.style.borderColor = '#4299e1';
    }
}

/**
 * Rend un élément draggable
 *
 * @param {HTMLElement} element - Élément à rendre draggable
 * @param {Object} [data] - Données à associer à l'élément
 * @returns {void}
 *
 * @example
 * makeDraggable(card, { id: 'task-1', type: 'task' });
 */
export function makeDraggable(element, data = {}) {
    element.draggable = true;

    // Stocker les données dans les data attributes
    Object.keys(data).forEach(key => {
        element.dataset[key] = data[key];
    });

    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);
}

/**
 * Rend une zone droppable
 *
 * @param {HTMLElement} element - Élément qui accepte les drops
 * @param {Object} [options] - Options de configuration
 * @param {boolean} [options.highlight] - Activer le highlighting au survol
 * @returns {void}
 *
 * @example
 * makeDroppable(column, { highlight: true });
 */
export function makeDroppable(element, options = {}) {
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    if (options.highlight) {
        element.addEventListener('dragenter', handleDragEnter);
        element.addEventListener('dragleave', handleDragLeave);
    }
}

/**
 * Supprime les événements de drag & drop d'un élément
 *
 * @param {HTMLElement} element - Élément à nettoyer
 * @returns {void}
 *
 * @example
 * removeDragDrop(element);
 */
export function removeDragDrop(element) {
    element.draggable = false;
    element.removeEventListener('dragstart', handleDragStart);
    element.removeEventListener('dragend', handleDragEnd);
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('drop', handleDrop);
    element.removeEventListener('dragenter', handleDragEnter);
    element.removeEventListener('dragleave', handleDragLeave);
}

/**
 * Obtient l'état actuel du drag & drop
 *
 * @returns {Object} État actuel
 * @property {HTMLElement|null} draggedElement - Élément en cours de drag
 * @property {Object|null} draggedData - Données de l'élément draggé
 * @property {HTMLElement|null} dragOverElement - Élément survolé
 * @property {boolean} isDragging - Indique si un drag est en cours
 */
export function getDragDropState() {
    return { ...dragDropState };
}

/**
 * Réinitialise l'état du drag & drop
 * @returns {void}
 */
export function resetDragDropState() {
    dragDropState.draggedElement = null;
    dragDropState.draggedData = null;
    dragDropState.dragOverElement = null;
    dragDropState.isDragging = false;
}

/**
 * Active le drag & drop sur une zone d'upload de fichiers
 *
 * Cette fonction transforme n'importe quelle zone HTML en une zone de drop pour les fichiers.
 * Elle peut être utilisée avec un input file existant ou créer sa propre gestion.
 *
 * @param {HTMLElement|string} dropZoneElement - L'élément ou le sélecteur CSS de la zone de drop
 * @param {HTMLInputElement|string} [fileInput] - L'input file associé ou son ID (optionnel)
 * @param {Object} [options] - Options de configuration
 * @param {string} [options.highlightColor] - Couleur de surbrillance (#hex)
 * @param {string} [options.borderColor] - Couleur de la bordure pendant le drag (#hex)
 * @param {string} [options.message] - Message à afficher dans la zone
 * @param {Function} [options.onDrop] - Callback personnalisé appelé avec les fichiers droppés
 * @param {boolean} [options.showIcon] - Afficher une icône de fichier (défaut: true)
 * @returns {void}
 *
 * @example
 * // Avec un input file existant
 * enableFileDropZone('#myDropZone', '#myFileInput');
 *
 * @example
 * // Avec callback personnalisé
 * enableFileDropZone(element, null, {
 *   onDrop: (files) => console.log('Files:', files)
 * });
 */
export function enableFileDropZone(dropZoneElement, fileInput = null, options = {}) {
    // Résoudre l'élément de la zone de drop
    const dropZone = typeof dropZoneElement === 'string'
        ? document.querySelector(dropZoneElement)
        : dropZoneElement;

    if (!dropZone) {
        console.error('[DRAG-DROP] Zone de drop introuvable:', dropZoneElement);
        return;
    }

    // Résoudre l'input file si fourni
    let inputElement = null;
    if (fileInput) {
        inputElement = typeof fileInput === 'string'
            ? document.querySelector(fileInput)
            : fileInput;
    }

    // Options par défaut
    const config = {
        highlightColor: options.highlightColor || '#e3f2fd',
        borderColor: options.borderColor || '#2196f3',
        message: options.message || 'Glissez vos fichiers ici',
        showIcon: options.showIcon !== false,
        onDrop: options.onDrop || null
    };

    // Ajouter un style de base à la zone
    dropZone.style.position = 'relative';
    dropZone.style.transition = 'all 0.3s ease';

    // Créer un overlay pour le feedback visuel
    let overlay = dropZone.querySelector('.drag-drop-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'drag-drop-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${config.highlightColor};
            border: 3px dashed ${config.borderColor};
            border-radius: 10px;
            display: none;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 1000;
            font-size: 1.2em;
            font-weight: bold;
            color: ${config.borderColor};
        `;

        if (config.showIcon) {
            overlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 3em; margin-bottom: 10px;">📁</div>
                    <div>${config.message}</div>
                </div>
            `;
        } else {
            overlay.textContent = config.message;
        }

        dropZone.appendChild(overlay);
    }

    // Gestionnaire dragenter
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.style.display = 'flex';
    };

    // Gestionnaire dragover
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Gestionnaire dragleave
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Vérifier si on quitte vraiment la zone (pas juste un enfant)
        if (e.target === dropZone || !dropZone.contains(e.relatedTarget)) {
            overlay.style.display = 'none';
        }
    };

    // Gestionnaire drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        overlay.style.display = 'none';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Si un input file est fourni, lui transférer les fichiers
            if (inputElement) {
                // Créer un DataTransfer pour pouvoir assigner les fichiers à l'input
                const dataTransfer = new DataTransfer();
                Array.from(files).forEach(file => dataTransfer.items.add(file));
                inputElement.files = dataTransfer.files;

                // Déclencher l'événement change sur l'input
                const changeEvent = new Event('change', { bubbles: true });
                inputElement.dispatchEvent(changeEvent);
            }

            // Appeler le callback personnalisé si fourni
            if (config.onDrop) {
                config.onDrop(Array.from(files));
            }
        }
    };

    // Attacher les événements
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Stocker les handlers pour pouvoir les retirer plus tard si nécessaire
    dropZone.__dragDropHandlers = {
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
        handleDrop
    };

    console.log('[DRAG-DROP] Zone de drop activée sur:', dropZone);
}

/**
 * Active automatiquement le drag & drop sur tous les boutons d'upload de la page
 *
 * Cette fonction scanne la page pour tous les inputs de type file cachés et leurs boutons associés,
 * puis active le drag & drop sur les conteneurs de ces boutons.
 *
 * @param {Object} [options] - Options de configuration (voir enableFileDropZone)
 * @returns {number} Nombre de zones de drop activées
 *
 * @example
 * // Activer sur toute la page
 * enableFileDropOnAllUploads();
 *
 * @example
 * // Avec options personnalisées
 * enableFileDropOnAllUploads({
 *   highlightColor: '#fff3cd',
 *   borderColor: '#ffc107'
 * });
 */
export function enableFileDropOnAllUploads(options = {}) {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let count = 0;

    fileInputs.forEach(input => {
        // Trouver le bouton qui déclenche cet input
        const inputId = input.id;
        if (!inputId) return;

        // Chercher le bouton qui fait référence à cet input
        const button = document.querySelector(`button[onclick*="${inputId}"]`);
        if (!button) return;

        // Trouver le conteneur parent approprié (div parent du bouton)
        const container = button.closest('div');
        if (!container) return;

        // Activer le drag & drop sur ce conteneur
        enableFileDropZone(container, input, options);
        count++;
    });

    console.log(`[DRAG-DROP] ${count} zones de drop activées automatiquement`);
    return count;
}

/**
 * Désactive le drag & drop sur une zone
 *
 * @param {HTMLElement|string} dropZoneElement - L'élément ou le sélecteur CSS de la zone
 * @returns {void}
 */
export function disableFileDropZone(dropZoneElement) {
    const dropZone = typeof dropZoneElement === 'string'
        ? document.querySelector(dropZoneElement)
        : dropZoneElement;

    if (!dropZone || !dropZone.__dragDropHandlers) return;

    const handlers = dropZone.__dragDropHandlers;
    dropZone.removeEventListener('dragenter', handlers.handleDragEnter);
    dropZone.removeEventListener('dragover', handlers.handleDragOver);
    dropZone.removeEventListener('dragleave', handlers.handleDragLeave);
    dropZone.removeEventListener('drop', handlers.handleDrop);

    // Retirer l'overlay
    const overlay = dropZone.querySelector('.drag-drop-overlay');
    if (overlay) overlay.remove();

    delete dropZone.__dragDropHandlers;
    console.log('[DRAG-DROP] Zone de drop désactivée');
}
