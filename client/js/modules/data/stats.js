/**
 * @fileoverview Statistics calculation module
 * Module de calcul des statistiques pour le dashboard et les KPI
 * Source: lignes 14276-14400, 20101-20500
 * @module stats
 */

/**
 * Update main dashboard statistics
 * Met à jour les statistiques du tableau de bord principal
 * Source: lignes 14276-14400
 *
 * @param {Object} arretData - Shutdown data / Données d'arrêt
 *
 * @example
 * updateStats(arretData);
 */
export function updateStats(arretData) {
    let totalTasks = 0;
    let completedTasks = 0;
    let cancelledTasks = 0;
    let totalAvancement = 0;
    let totalPlanifie = 0;

    const today = new Date(arretData.today);
    const lateTasks = [];
    let currentTask = null;
    let nextTask = null;

    arretData.phases.forEach(phase => {
        phase.taches.forEach(tache => {
            if (tache.statut !== 'cancelled') {
                totalTasks++;
                totalAvancement += tache.avancement;
                totalPlanifie += tache.planifie;
                if (tache.avancement === 100) completedTasks++;

                // Trouver la tâche en cours
                if (tache.statut === 'inprogress' && !currentTask) {
                    currentTask = { ...tache, phaseName: phase.nom, phaseDate: phase.date, phaseId: phase.id };
                }

                // Trouver les tâches en retard
                const taskDate = new Date(tache.dateButoir || tache.dateFin || phase.date);
                if (taskDate < today && tache.statut !== 'completed') {
                    lateTasks.push({ ...tache, phaseName: phase.nom, taskDate: taskDate, phaseId: phase.id });
                }

                // Trouver la prochaine tâche (non démarrée, date la plus proche)
                if (tache.statut === 'notstarted') {
                    const taskDate = new Date(tache.dateButoir || tache.dateFin || phase.date);
                    if (!nextTask || taskDate < new Date(nextTask.taskDate)) {
                        nextTask = { ...tache, phaseName: phase.nom, taskDate: taskDate, phaseId: phase.id };
                    }
                }
            } else {
                cancelledTasks++;
            }
        });
    });

    const avgAvancement = totalTasks > 0 ? Math.round(totalAvancement / totalTasks) : 0;
    const avgPlanifie = totalTasks > 0 ? Math.round(totalPlanifie / totalTasks) : 0;

    // Update DOM elements
    const realProgressEl = document.getElementById('realProgress');
    const plannedProgressEl = document.getElementById('plannedProgress');
    const tasksCompletedEl = document.getElementById('tasksCompleted');
    const daysRemainingEl = document.getElementById('daysRemaining');
    const globalStatusEl = document.getElementById('globalStatus');
    const lateTasksEl = document.getElementById('lateTasks');
    const currentTaskEl = document.getElementById('currentTask');
    const nextTaskEl = document.getElementById('nextTask');
    const lateTasksListEl = document.getElementById('lateTasksList');

    if (realProgressEl) realProgressEl.textContent = avgAvancement + '%';
    if (plannedProgressEl) plannedProgressEl.textContent = avgPlanifie + '%';
    if (tasksCompletedEl) tasksCompletedEl.textContent = `${completedTasks}/${totalTasks}`;

    const debutArret = new Date(arretData.dateDebut);
    const diffTime = debutArret - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemainingEl) daysRemainingEl.textContent = diffDays;

    if (globalStatusEl) {
        if (avgAvancement >= avgPlanifie) {
            globalStatusEl.innerHTML = '[OK] Dans les temps';
        } else if (avgAvancement >= avgPlanifie * 0.8) {
            globalStatusEl.innerHTML = '[WARNING] Attention';
        } else {
            globalStatusEl.innerHTML = '[ERROR] En retard';
        }
    }

    // Mettre à jour le compteur de tâches en retard
    if (lateTasksEl) lateTasksEl.textContent = lateTasks.length;

    // Afficher la tâche en cours
    if (currentTaskEl) {
        if (currentTask) {
            const respDisplay = Array.isArray(currentTask.responsables) && currentTask.responsables.length > 0
                ? currentTask.responsables.join(', ')
                : currentTask.responsable;
            currentTaskEl.innerHTML = `
                <div class="important-task-clickable" onclick="openTaskDetailsModal('${currentTask.phaseId}', '${currentTask.id}')">
                    <strong>${currentTask.titre}</strong><br>
                    <span style="color: #000000; font-size: 0.85em;">${currentTask.phaseName}</span><br>
                    <span style="color: #667eea; font-weight: bold;">Responsable(s): ${respDisplay}</span><br>
                    <div style="margin-top: 10px; background: #e0e0e0; border-radius: 10px; height: 8px; overflow: hidden;">
                        <div style="background: #c9941a; height: 100%; width: ${currentTask.avancement}%; border-radius: 10px;"></div>
                    </div>
                    <span style="font-size: 0.85em; color: #666;">Avancement: ${currentTask.avancement}%</span>
                </div>
            `;
        } else {
            currentTaskEl.innerHTML = '<em style="color: #000000;">Aucune tâche en cours</em>';
        }
    }

    // Afficher la prochaine tâche
    if (nextTaskEl) {
        if (nextTask) {
            const dateStr = new Date(nextTask.taskDate).toLocaleDateString('fr-FR');
            const respDisplay = Array.isArray(nextTask.responsables) && nextTask.responsables.length > 0
                ? nextTask.responsables.join(', ')
                : nextTask.responsable;
            nextTaskEl.innerHTML = `
                <div class="important-task-clickable" onclick="openTaskDetailsModal('${nextTask.phaseId}', '${nextTask.id}')">
                    <strong>${nextTask.titre}</strong><br>
                    <span style="color: #000000; font-size: 0.85em;">${nextTask.phaseName}</span><br>
                    <span style="color: #667eea; font-weight: bold;">Responsable(s): ${respDisplay}</span><br>
                    <span style="color: #c5554a; font-size: 0.85em;">[DATE] Date: ${dateStr}</span>
                </div>
            `;
        } else {
            nextTaskEl.innerHTML = '<em style="color: #000000;">Aucune tâche planifiée</em>';
        }
    }

    // Afficher les tâches en retard
    if (lateTasksListEl) {
        if (lateTasks.length > 0) {
            const lateTasksHtml = lateTasks.map(task => {
                const dateStr = new Date(task.taskDate).toLocaleDateString('fr-FR');
                const respDisplay = Array.isArray(task.responsables) && task.responsables.length > 0
                    ? task.responsables.join(', ')
                    : task.responsable;
                return `
                    <div class="late-task-clickable" style="padding: 10px; margin-bottom: 10px; background: #fff3cd; border-radius: 8px; border-left: 3px solid #c5554a;" onclick="openTaskDetailsModal('${task.phaseId}', '${task.id}')">
                        <strong style="color: #000000;">${task.titre}</strong><br>
                        <span style="color: #000000; font-size: 0.8em;">${task.phaseName}</span><br>
                        <span style="color: #c5554a; font-size: 0.8em; font-weight: bold;">[DATE] ${dateStr} | ${respDisplay}</span>
                    </div>
                `;
            }).join('');
            lateTasksListEl.innerHTML = lateTasksHtml;
        } else {
            lateTasksListEl.innerHTML = '<em style="color: #4a7c59;">[OK] Aucune tâche en retard</em>';
        }
    }
}

/**
 * Calculate task statistics
 * Calcule les statistiques des tâches
 *
 * @param {Array<Object>} tasks - Array of tasks / Tableau de tâches
 * @returns {Object} Statistics object / Objet de statistiques
 *
 * @example
 * const stats = calculateTaskStats(tasks);
 * // Returns: {total: 10, completed: 5, inProgress: 3, notStarted: 2, ...}
 */
export function calculateTaskStats(tasks) {
    const stats = {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        cancelled: 0,
        avgProgress: 0,
        avgPlanned: 0
    };

    let totalProgress = 0;
    let totalPlanned = 0;

    tasks.forEach(task => {
        if (task.statut === 'cancelled') {
            stats.cancelled++;
            return;
        }

        stats.total++;
        totalProgress += task.avancement || 0;
        totalPlanned += task.planifie || 0;

        if (task.avancement === 100 || task.statut === 'completed') {
            stats.completed++;
        } else if (task.statut === 'inprogress') {
            stats.inProgress++;
        } else if (task.statut === 'notstarted') {
            stats.notStarted++;
        }
    });

    if (stats.total > 0) {
        stats.avgProgress = Math.round(totalProgress / stats.total);
        stats.avgPlanned = Math.round(totalPlanned / stats.total);
    }

    return stats;
}

/**
 * Get late tasks
 * Obtient les tâches en retard
 *
 * @param {Array<Object>} tasks - Array of tasks / Tableau de tâches
 * @param {Date} today - Current date / Date actuelle
 * @returns {Array<Object>} Late tasks / Tâches en retard
 *
 * @example
 * const lateTasks = getLateTasks(allTasks, new Date());
 */
export function getLateTasks(tasks, today) {
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);

    return tasks.filter(task => {
        if (task.statut === 'completed' || task.statut === 'cancelled') {
            return false;
        }

        const taskDate = new Date(task.dateButoir || task.dateFin);
        return taskDate < todayDate;
    });
}

/**
 * Calculate phase progress
 * Calcule la progression d'une phase
 *
 * @param {Object} phase - Phase object / Objet phase
 * @returns {number} Progress percentage / Pourcentage de progression
 *
 * @example
 * const progress = calculatePhaseProgress(phase);
 * // Returns: 75
 */
export function calculatePhaseProgress(phase) {
    if (!phase.taches || phase.taches.length === 0) {
        return 0;
    }

    const activeTasks = phase.taches.filter(t => t.statut !== 'cancelled');
    if (activeTasks.length === 0) {
        return 0;
    }

    const totalProgress = activeTasks.reduce((sum, t) => sum + (t.avancement || 0), 0);
    return Math.round(totalProgress / activeTasks.length);
}

/**
 * Calculate global statistics
 * Calcule les statistiques globales
 *
 * @param {Object} arretData - Shutdown data / Données d'arrêt
 * @returns {Object} Global statistics / Statistiques globales
 *
 * @example
 * const globalStats = calculateGlobalStats(arretData);
 */
export function calculateGlobalStats(arretData) {
    const stats = {
        totalPhases: arretData.phases.length,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        notStartedTasks: 0,
        cancelledTasks: 0,
        lateTasks: 0,
        avgProgress: 0,
        avgPlanned: 0,
        daysRemaining: 0
    };

    let totalProgress = 0;
    let totalPlanned = 0;
    const today = new Date(arretData.today);
    today.setHours(0, 0, 0, 0);

    arretData.phases.forEach(phase => {
        phase.taches.forEach(task => {
            if (task.statut === 'cancelled') {
                stats.cancelledTasks++;
                return;
            }

            stats.totalTasks++;
            totalProgress += task.avancement || 0;
            totalPlanned += task.planifie || 0;

            if (task.avancement === 100 || task.statut === 'completed') {
                stats.completedTasks++;
            } else if (task.statut === 'inprogress') {
                stats.inProgressTasks++;
            } else if (task.statut === 'notstarted') {
                stats.notStartedTasks++;
            }

            // Check if late
            const taskDate = new Date(task.dateButoir || task.dateFin || phase.date);
            if (taskDate < today && task.statut !== 'completed') {
                stats.lateTasks++;
            }
        });
    });

    if (stats.totalTasks > 0) {
        stats.avgProgress = Math.round(totalProgress / stats.totalTasks);
        stats.avgPlanned = Math.round(totalPlanned / stats.totalTasks);
    }

    // Calculate days remaining
    const debutArret = new Date(arretData.dateDebut);
    const diffTime = debutArret - today;
    stats.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return stats;
}

/**
 * Get task status color
 * Obtient la couleur du statut de tâche
 *
 * @param {string} status - Task status / Statut de tâche
 * @returns {string} Color code / Code couleur
 *
 * @example
 * const color = getTaskStatusColor('completed');
 * // Returns: '#4a7c59'
 */
export function getTaskStatusColor(status) {
    const colors = {
        'notstarted': '#6c757d',
        'inprogress': '#c9941a',
        'completed': '#4a7c59',
        'cancelled': '#999999'
    };
    return colors[status] || '#000000';
}

/**
 * Format date for display
 * Formate une date pour l'affichage
 *
 * @param {Date|string} date - Date to format / Date à formater
 * @param {string} [locale='fr-FR'] - Locale / Locale
 * @returns {string} Formatted date / Date formatée
 *
 * @example
 * const formatted = formatDate(new Date());
 * // Returns: '22/10/2025'
 */
export function formatDate(date, locale = 'fr-FR') {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale);
}

/**
 * Calculate completion percentage
 * Calcule le pourcentage de complétion
 *
 * @param {number} completed - Completed count / Nombre complété
 * @param {number} total - Total count / Nombre total
 * @returns {number} Percentage / Pourcentage
 *
 * @example
 * const percentage = calculateCompletionPercentage(5, 10);
 * // Returns: 50
 */
export function calculateCompletionPercentage(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}
