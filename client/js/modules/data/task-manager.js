/**
 * @fileoverview Gestionnaire des tâches de l'arrêt annuel
 * @module data/task-manager
 *
 * Gère les opérations CRUD sur les tâches : création, modification, suppression
 * Source: arret-annuel-avec-liste.html lignes 13100-13350
 */

import { arretData, saveArretData, getPhaseById } from './arret-data.js';

/**
 * Met à jour le statut d'une tâche
 * @param {string} phaseId - ID de la phase (optionnel si taskId est unique)
 * @param {string} taskId - ID de la tâche
 * @param {string} newStatus - Nouveau statut ('notstarted', 'inprogress', 'completed', 'cancelled')
 * @returns {boolean} true si mise à jour réussie
 */
export function updateTaskStatus(phaseId, taskId, newStatus) {
    // Si seulement 2 paramètres, considérer que c'est (taskId, newStatus)
    if (arguments.length === 2) {
        newStatus = taskId;
        taskId = phaseId;
        phaseId = null;
    }

    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                task.statut = newStatus;

                // Mettre à jour l'avancement selon le statut
                if (newStatus === 'completed') {
                    task.avancement = 100;
                } else if (newStatus === 'notstarted' || newStatus === 'cancelled') {
                    task.avancement = 0;
                }

                saveArretData();
                console.log('[OK] Tache ' + taskId + ' mise a jour: ' + newStatus);
                return true;
            }
        }
    }

    console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
    return false;
}

/**
 * Met à jour l'avancement d'une tâche
 * @param {string} taskId - ID de la tâche
 * @param {number} avancement - Nouvel avancement (0-100)
 * @returns {boolean} true si mise à jour réussie
 */
export function updateTaskProgress(taskId, avancement) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                task.avancement = Math.max(0, Math.min(100, avancement));

                // Mettre à jour le statut automatiquement
                if (task.avancement === 0) {
                    task.statut = 'notstarted';
                } else if (task.avancement === 100) {
                    task.statut = 'completed';
                } else if (task.statut === 'notstarted') {
                    task.statut = 'inprogress';
                }

                saveArretData();
                console.log('[OK] Avancement tache ' + taskId + ': ' + task.avancement + '%');
                return true;
            }
        }
    }

    console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
    return false;
}

/**
 * Met à jour le responsable d'une tâche
 * @param {string} taskId - ID de la tâche
 * @param {string} responsable - Nouveau responsable
 * @returns {boolean} true si mise à jour réussie
 */
export function updateTaskResponsable(taskId, responsable) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                task.responsable = responsable;
                saveArretData();
                console.log('[OK] Responsable tache ' + taskId + ': ' + responsable);
                return true;
            }
        }
    }

    console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
    return false;
}

/**
 * Met à jour la date de fin d'une tâche
 * @param {string} taskId - ID de la tâche
 * @param {string} dateFin - Nouvelle date de fin (format ISO)
 * @returns {boolean} true si mise à jour réussie
 */
export function updateTaskDateFin(taskId, dateFin) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                task.dateFin = dateFin;
                saveArretData();
                console.log('[OK] Date fin tache ' + taskId + ': ' + dateFin);
                return true;
            }
        }
    }

    console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
    return false;
}

/**
 * Met à jour plusieurs propriétés d'une tâche
 * @param {string} taskId - ID de la tâche
 * @param {Object} updates - Propriétés à mettre à jour
 * @returns {boolean} true si mise à jour réussie
 */
export function updateTask(taskId, updates) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, updates);
                saveArretData();
                console.log('[OK] Tache ' + taskId + ' mise a jour');
                return true;
            }
        }
    }

    console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
    return false;
}

/**
 * Ajoute une nouvelle tâche à une phase
 * @param {string} phaseId - ID de la phase
 * @param {Object} task - Nouvelle tâche
 * @returns {boolean} true si ajout réussi
 */
export function addTask(phaseId, task) {
    const phase = getPhaseById(phaseId);

    if (phase) {
        if (!phase.taches) {
            phase.taches = [];
        }

        // Générer un ID si non fourni
        if (!task.id) {
            const maxId = Math.max(0, ...phase.taches.map(t => {
                const num = parseInt(t.id.replace('t', ''));
                return isNaN(num) ? 0 : num;
            }));
            task.id = 't' + (maxId + 1);
        }

        // Valeurs par défaut
        task.avancement = task.avancement || 0;
        task.planifie = task.planifie || 0;
        task.statut = task.statut || 'notstarted';

        phase.taches.push(task);
        saveArretData();
        console.log('[OK] Tache ajoutee: ' + task.id);
        return true;
    }

    console.warn('[WARNING] Phase ' + phaseId + ' non trouvee');
    return false;
}

/**
 * Supprime une tâche
 * @param {string} taskId - ID de la tâche à supprimer
 * @returns {boolean} true si suppression réussie
 */
export function deleteTask(taskId) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const index = phase.taches.findIndex(t => t.id === taskId);
            if (index !== -1) {
                phase.taches.splice(index, 1);
                saveArretData();
                console.log('[OK] Tache supprimee: ' + taskId);
                return true;
            }
        }
    }

    console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
    return false;
}

/**
 * Déplace une tâche d'une phase à une autre
 * @param {string} taskId - ID de la tâche
 * @param {string} targetPhaseId - ID de la phase de destination
 * @returns {boolean} true si déplacement réussi
 */
export function moveTask(taskId, targetPhaseId) {
    let task = null;
    let sourcePhase = null;

    // Trouver la tâche et la phase source
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const index = phase.taches.findIndex(t => t.id === taskId);
            if (index !== -1) {
                task = phase.taches[index];
                sourcePhase = phase;
                break;
            }
        }
    }

    if (!task) {
        console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
        return false;
    }

    // Trouver la phase cible
    const targetPhase = getPhaseById(targetPhaseId);
    if (!targetPhase) {
        console.warn('[WARNING] Phase cible ' + targetPhaseId + ' non trouvee');
        return false;
    }

    // Supprimer de la source
    const index = sourcePhase.taches.findIndex(t => t.id === taskId);
    sourcePhase.taches.splice(index, 1);

    // Ajouter à la cible
    if (!targetPhase.taches) {
        targetPhase.taches = [];
    }
    targetPhase.taches.push(task);

    saveArretData();
    console.log('[OK] Tache ' + taskId + ' deplacee vers ' + targetPhaseId);
    return true;
}

/**
 * Duplique une tâche
 * @param {string} taskId - ID de la tâche à dupliquer
 * @returns {Object|null} La nouvelle tâche ou null
 */
export function duplicateTask(taskId) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                // Trouver un nouvel ID
                const maxId = Math.max(0, ...phase.taches.map(t => {
                    const num = parseInt(t.id.replace('t', ''));
                    return isNaN(num) ? 0 : num;
                }));

                const newTask = {
                    ...task,
                    id: 't' + (maxId + 1),
                    titre: task.titre + ' (copie)',
                    avancement: 0,
                    statut: 'notstarted'
                };

                phase.taches.push(newTask);
                saveArretData();
                console.log('[OK] Tache dupliquee: ' + newTask.id);
                return newTask;
            }
        }
    }

    console.warn('[WARNING] Tache ' + taskId + ' non trouvee');
    return null;
}
