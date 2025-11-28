/**
 * @fileoverview Module Kanban - Gestion du tableau Kanban pour les tâches
 * @module ui/kanban
 *
 * Ce module gère l'affichage et l'interaction avec le tableau Kanban
 * qui organise les tâches par statut (non démarré, en cours, complété, annulé).
 *
 * Source: arret-annuel-avec-liste.html lignes 13915-14031
 */

import { arretData } from '../data/arret-data.js';
import { updateTaskStatus } from '../data/task-manager.js';
import { getPreparationPhases } from './summary.js';
import { switchPage } from '../navigation.js';

/**
 * Element HTML en cours de drag
 * @type {HTMLElement|null}
 */
let draggedElement = null;

/**
 * Récupère toutes les tâches clickables depuis les données de préparation
 * @returns {Object} Map des tâches clickables {id: page}
 */
async function getClickableTasks() {
    const clickableTasks = {};
    const phases = await getPreparationPhases();

    phases.forEach(phase => {
        phase.taches.forEach(tache => {
            if (tache.clickable && tache.page) {
                clickableTasks[tache.id] = tache.page;
            }
        });
    });

    return clickableTasks;
}

/**
 * Vérifie si une tâche possède une page de détail
 * @param {string} taskId - ID de la tâche
 * @returns {boolean} true si la tâche a une page de détail
 */
function hasDetailPage(taskId) {
    const clickableTasks = getClickableTasks();
    return clickableTasks.hasOwnProperty(taskId);
}

/**
 * Ouvre la page de détail d'une tâche
 * @param {string} taskId - ID de la tâche
 */
function openTaskDetail(taskId) {
    const clickableTasks = getClickableTasks();
    const page = clickableTasks[taskId];

    if (page) {
        console.log(`[KANBAN] Ouverture de la page: ${page}`);
        switchPage(page);
    } else {
        console.warn(`[KANBAN] Aucune page de détail pour la tâche ${taskId}`);
    }
}

/**
 * Rend le tableau Kanban avec toutes les tâches organisées par statut
 *
 * Parcourt toutes les phases et tâches de arretData et les affiche
 * dans les colonnes correspondantes (notstarted, inprogress, completed, cancelled).
 *
 * Chaque carte affiche:
 * - Nom de la phase
 * - Titre de la tâche (cliquable si page de détail disponible)
 * - Responsable(s)
 * - Date de fin
 * - Barre de progression
 *
 * @returns {void}
 *
 * @example
 * renderKanban();
 */
export async function renderKanban() {
    // Réinitialiser toutes les colonnes
    const statuses = ['notstarted', 'inprogress', 'completed', 'cancelled'];
    statuses.forEach(status => {
        const column = document.getElementById(`kanban-${status}`);
        if (!column) {
            console.warn(`Colonne kanban-${status} introuvable`);
            return;
        }
        column.innerHTML = '';
    });

    const counts = { notstarted: 0, inprogress: 0, completed: 0, cancelled: 0 };

    // Utiliser les données de préparation pour obtenir TOUTES les tâches
    const phases = await getPreparationPhases();

    // Parcourir toutes les tâches et les placer dans la bonne colonne
    phases.forEach(phase => {
        phase.taches.forEach(tache => {
            counts[tache.statut]++;

            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.draggable = true;
            card.dataset.phaseId = phase.id;
            card.dataset.taskId = tache.id;
            card.dataset.status = tache.statut;

            // Gérer l'affichage des responsables
            const respDisplay = Array.isArray(tache.responsables) && tache.responsables.length > 0
                ? (tache.responsables.length > 1
                    ? `${tache.responsables[0]} +${tache.responsables.length - 1}`
                    : tache.responsables[0])
                : (tache.responsable || 'N/A');

            // Vérifier si la tâche est cliquable
            const isClickable = hasDetailPage(tache.id);
            const clickableStyle = isClickable ? 'text-decoration: underline;' : '';

            card.innerHTML = `
                <div class="kanban-card-phase">${phase.nom}</div>
                <div class="kanban-card-title" style="${clickableStyle}">${tache.titre}</div>
                <div class="kanban-card-meta">
                    <span class="kanban-card-responsible" title="${Array.isArray(tache.responsables) ? tache.responsables.join(', ') : tache.responsable}">${respDisplay}</span>
                    <span class="kanban-card-date">${tache.dateFin || phase.date}</span>
                </div>
                <div class="kanban-card-progress">
                    <div class="kanban-card-progress-fill" style="width: ${tache.avancement}%"></div>
                </div>
            `;

            // Ajouter les événements de drag and drop
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);

            // Ajouter le clic pour ouvrir les détails si cliquable
            if (isClickable) {
                let isDragging = false;

                card.addEventListener('mousedown', () => {
                    isDragging = false;
                });

                card.addEventListener('dragstart', () => {
                    isDragging = true;
                });

                card.addEventListener('click', (e) => {
                    // Ne pas ouvrir si on vient de drag
                    if (!isDragging) {
                        openTaskDetail(tache.id);
                    }
                    isDragging = false;
                });

                card.style.cursor = 'move';

                // Rendre le titre cliquable visuellement
                const titleElement = card.querySelector('.kanban-card-title');
                if (titleElement) {
                    titleElement.style.cursor = 'pointer';
                }
            } else {
                card.style.cursor = 'move';
            }

            const column = document.getElementById(`kanban-${tache.statut}`);
            if (column) {
                column.appendChild(card);
            }
        });
    });

    // Mettre à jour les compteurs
    statuses.forEach(status => {
        const countElement = document.getElementById(`count-${status}`);
        if (countElement) {
            countElement.textContent = counts[status];
        }
    });
}

/**
 * Gestionnaire d'événement au début du drag
 * @param {DragEvent} e - Événement drag
 * @returns {void}
 *
 * @private
 */
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

/**
 * Gestionnaire d'événement à la fin du drag
 * @param {DragEvent} e - Événement drag
 * @returns {void}
 *
 * @private
 */
function handleDragEnd(e) {
    this.classList.remove('dragging');
}

/**
 * Gestionnaire d'événement pendant le survol lors du drag
 * @param {DragEvent} e - Événement drag
 * @returns {boolean} false pour permettre le drop
 *
 * @private
 */
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Gestionnaire d'événement lors du drop d'une carte
 *
 * Récupère le nouveau statut depuis la colonne cible et met à jour
 * le statut de la tâche via updateTaskStatus, puis rafraîchit le Kanban.
 *
 * @param {DragEvent} e - Événement drop
 * @returns {boolean} false pour stopper la propagation
 *
 * @private
 */
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedElement) {
        const newStatus = this.dataset.status;
        const taskId = draggedElement.dataset.taskId;

        console.log(`[KANBAN] Drop de ${taskId} vers statut ${newStatus}`);

        // Mettre à jour le statut (cela sauvegarde automatiquement)
        const success = updateTaskStatus(taskId, newStatus);

        if (success) {
            // Rafraîchir le Kanban pour afficher les changements
            renderKanban();

            // Réinitialiser le drag & drop après le rafraîchissement
            setTimeout(() => {
                initKanbanDragDrop();
                console.log('[KANBAN] Kanban rafraîchi et drag & drop réinitialisé');
            }, 50);

            // Rafraîchir aussi le tableau Préparation si besoin
            import('./summary.js').then(module => {
                // Vérifier si le tableau Préparation est visible
                const summaryTable = document.getElementById('summaryTableBody');
                if (summaryTable && summaryTable.offsetParent !== null) {
                    module.renderSummaryTable();
                    console.log('[KANBAN] Tableau Préparation rafraîchi');
                }
            }).catch(err => {
                console.warn('[KANBAN] Impossible de rafraîchir le tableau Préparation:', err);
            });
        }
    }

    return false;
}

/**
 * Initialise les événements de drag & drop pour toutes les colonnes du Kanban
 *
 * Attache les gestionnaires dragover et drop à chaque colonne (.kanban-cards).
 * Doit être appelé après le rendu initial du Kanban.
 *
 * @returns {void}
 *
 * @example
 * renderKanban();
 * initKanbanDragDrop();
 */
export function initKanbanDragDrop() {
    const columns = document.querySelectorAll('.kanban-cards');
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

/**
 * Sauvegarde le statut d'une tâche et synchronise avec les données de préparation
 */
function saveTaskStatus(taskId, newStatus) {
    // Utiliser updateTaskStatus pour synchroniser avec arretData
    const success = updateTaskStatus(taskId, newStatus);

    if (success) {
        console.log(`[KANBAN] Statut de ${taskId} mis à jour: ${newStatus}`);
    } else {
        console.warn(`[KANBAN] Échec de mise à jour du statut pour ${taskId}`);
    }

    return success;
}

/**
 * Initialise le Kanban HTML statique avec drag and drop
 * Pour les cartes déjà présentes dans le HTML
 */
export async function initStaticKanban() {
    console.log('[KANBAN] Initialisation du Kanban HTML statique...');

    // Récupérer toutes les cartes avec cursor: move
    const cards = document.querySelectorAll('#timeline .card[style*="cursor: move"]');
    const columns = document.querySelectorAll('#timeline [id^="kanban"]');

    console.log('[KANBAN] ' + cards.length + ' cartes trouvées');
    console.log('[KANBAN] ' + columns.length + ' colonnes trouvées');

    // Charger les phases AVANT le forEach
    const phases = await getPreparationPhases();

    // Rendre les cartes draggables ET cliquables
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');

        // Extraire l'ID de la tâche depuis le contenu de la carte
        const titleElement = card.querySelector('[style*="font-weight: bold"]');
        if (titleElement) {
            const taskTitle = titleElement.textContent.trim();

            // Trouver la tâche correspondante dans les données de préparation
            let matchingTask = null;

            phases.forEach(phase => {
                phase.taches.forEach(tache => {
                    if (tache.titre === taskTitle) {
                        matchingTask = tache;
                        card.dataset.taskId = tache.id;
                    }
                });
            });

            // Rendre cliquable si la tâche a une page de détail
            if (matchingTask && matchingTask.clickable && matchingTask.page) {
                card.style.cursor = 'pointer';
                titleElement.style.textDecoration = 'underline';
                titleElement.style.color = '#667eea';

                card.addEventListener('click', (e) => {
                    // Ne pas ouvrir si on est en train de drag
                    if (!card.classList.contains('dragging')) {
                        console.log(`[KANBAN] Clic sur carte: ${matchingTask.titre}`);
                        switchPage(matchingTask.page);
                    }
                });
            }
        }

        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            card.style.opacity = '0.4';
            card.classList.add('dragging');
            console.log('[KANBAN] Début du drag');
        });

        card.addEventListener('dragend', (e) => {
            card.style.opacity = '1';
            card.classList.remove('dragging');
            console.log('[KANBAN] Fin du drag');
        });
    });

    // Configurer les colonnes pour accepter les drops
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const afterElement = getDragAfterElement(column, e.clientY);
            const dragging = document.querySelector('.dragging');

            if (dragging && afterElement == null) {
                column.appendChild(dragging);
            } else if (dragging && afterElement) {
                column.insertBefore(dragging, afterElement);
            }
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');

            if (dragging) {
                const columnId = column.id;
                let borderColor = '#dc3545';
                let newStatus = 'notstarted';

                // Déterminer la couleur et le statut selon la colonne
                if (columnId === 'kanbanEnCours') {
                    borderColor = '#ffc107';
                    newStatus = 'inprogress';
                } else if (columnId === 'kanbanComplete') {
                    borderColor = '#28a745';
                    newStatus = 'completed';
                } else if (columnId === 'kanbanAnnule') {
                    borderColor = '#e83e8c';
                    newStatus = 'cancelled';
                } else if (columnId === 'kanbanNonDemarre') {
                    borderColor = '#dc3545';
                    newStatus = 'notstarted';
                }

                dragging.style.borderLeft = `4px solid ${borderColor}`;

                // Sauvegarder le nouveau statut
                const taskId = dragging.dataset.taskId;
                if (taskId) {
                    saveTaskStatus(taskId, newStatus);
                }

                // Mettre à jour les compteurs
                updateColumnCounts();

                console.log('[KANBAN] Carte déplacée vers ' + columnId + ' (statut: ' + newStatus + ')');
            }
        });
    });

    // Mettre à jour les compteurs initiaux
    updateColumnCounts();

    console.log('[OK] Kanban statique initialisé');
}

/**
 * Détermine l'élément après lequel insérer la carte
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Met à jour les compteurs de chaque colonne
 */
function updateColumnCounts() {
    const columns = [
        { id: 'kanbanNonDemarre', color: '#dc3545' },
        { id: 'kanbanEnCours', color: '#ffc107' },
        { id: 'kanbanComplete', color: '#28a745' },
        { id: 'kanbanAnnule', color: '#e83e8c' }
    ];

    columns.forEach(col => {
        const column = document.getElementById(col.id);
        if (column) {
            const count = column.querySelectorAll('.card').length;

            // Trouver le badge dans le header de la colonne parente
            const parentDiv = column.parentElement;
            const badge = parentDiv.querySelector(`[style*="background: ${col.color}"]`);

            if (badge) {
                badge.textContent = count;
            }
        }
    });
}

/**
 * Obtient l'élément actuellement en cours de drag
 * @returns {HTMLElement|null} L'élément draggé ou null
 */
export function getDraggedElement() {
    return draggedElement;
}

/**
 * Définit l'élément actuellement en cours de drag
 * @param {HTMLElement|null} element - L'élément à définir comme draggé
 * @returns {void}
 */
export function setDraggedElement(element) {
    draggedElement = element;
}

