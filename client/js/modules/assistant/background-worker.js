/**
 * Travailleur en Arrière-plan
 * @module assistant/background-worker
 *
 * Exécute des tâches automatiquement sans bloquer l'interface
 */

export class BackgroundWorker {
    constructor() {
        this.tasks = new Map();
        this.isRunning = false;
        this.interval = null;
        this.checkInterval = 30000; // 30 secondes
        this.results = new Map();
    }

    /**
     * Démarre le travailleur
     */
    start() {
        if (this.isRunning) {
            console.log('[WORKER] Déjà en cours d\'exécution');
            return;
        }

        this.isRunning = true;
        console.log('[WORKER] Démarré');

        // Vérifier les tâches périodiquement
        this.interval = setInterval(() => {
            this.processTasks();
        }, this.checkInterval);

        // Exécuter immédiatement une première fois
        this.processTasks();
    }

    /**
     * Arrête le travailleur
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        console.log('[WORKER] Arrêté');
    }

    /**
     * Ajoute une tâche en arrière-plan
     */
    addTask(name, fn, options = {}) {
        const task = {
            name,
            fn,
            priority: options.priority || 'normal',
            interval: options.interval || null,
            runOnce: options.runOnce || false,
            lastRun: null,
            nextRun: options.runAt || null,
            status: 'pending',
            retries: 0,
            maxRetries: options.maxRetries || 3,
            silent: options.silent || false,
            onSuccess: options.onSuccess || null,
            onError: options.onError || null
        };

        this.tasks.set(name, task);

        if (!task.silent) {
            console.log(`[WORKER] Tâche ajoutée: ${name}`);
        }

        return task;
    }

    /**
     * Supprime une tâche
     */
    removeTask(name) {
        const removed = this.tasks.delete(name);
        if (removed) {
            console.log(`[WORKER] Tâche supprimée: ${name}`);
        }
        return removed;
    }

    /**
     * Obtient le statut d'une tâche
     */
    getTaskStatus(name) {
        const task = this.tasks.get(name);
        if (!task) return null;

        return {
            name: task.name,
            status: task.status,
            lastRun: task.lastRun,
            nextRun: task.nextRun,
            retries: task.retries
        };
    }

    /**
     * Obtient le résultat d'une tâche
     */
    getTaskResult(name) {
        return this.results.get(name);
    }

    /**
     * Traite toutes les tâches en attente
     */
    async processTasks() {
        const tasksToRun = [];

        // Collecter les tâches à exécuter
        for (const [name, task] of this.tasks) {
            if (this.shouldRun(task)) {
                tasksToRun.push({ name, task });
            }
        }

        if (tasksToRun.length === 0) return;

        // Trier par priorité
        tasksToRun.sort((a, b) => {
            const priorities = { critical: 4, high: 3, normal: 2, low: 1 };
            return priorities[b.task.priority] - priorities[a.task.priority];
        });

        // Exécuter les tâches
        for (const { name, task } of tasksToRun) {
            await this.runTask(name, task);
        }
    }

    /**
     * Vérifie si une tâche doit être exécutée
     */
    shouldRun(task) {
        // Tâche déjà en cours
        if (task.status === 'running') return false;

        // Tâche unique déjà exécutée
        if (task.runOnce && task.lastRun) return false;

        // Tâche planifiée pour une date/heure spécifique
        if (task.nextRun) {
            const now = new Date();
            return now >= task.nextRun;
        }

        // Tâche avec interval
        if (task.interval) {
            if (!task.lastRun) return true;

            const elapsed = Date.now() - task.lastRun.getTime();
            return elapsed >= task.interval;
        }

        // Tâche en attente sans interval (exécuter une seule fois)
        return task.status === 'pending' && !task.lastRun;
    }

    /**
     * Exécute une tâche
     */
    async runTask(name, task) {
        try {
            task.status = 'running';

            if (!task.silent) {
                console.log(`[WORKER] Exécution: ${name}`);
            }

            // Exécuter la fonction de la tâche
            const result = await task.fn();

            // Succès
            task.status = task.runOnce ? 'completed' : 'pending';
            task.lastRun = new Date();
            task.retries = 0;

            // Calculer la prochaine exécution si interval
            if (task.interval && !task.runOnce) {
                task.nextRun = new Date(Date.now() + task.interval);
            }

            // Sauvegarder le résultat
            this.results.set(name, {
                success: true,
                result,
                timestamp: new Date()
            });

            // Callback de succès
            if (task.onSuccess) {
                task.onSuccess(result);
            }

            if (!task.silent) {
                console.log(`[WORKER] ✅ Terminé: ${name}`);
            }

        } catch (error) {
            task.retries++;

            console.error(`[WORKER] ❌ Erreur dans ${name}:`, error.message);

            // Réessayer si possible
            if (task.retries < task.maxRetries) {
                task.status = 'pending';
                console.log(`[WORKER] Nouvelle tentative (${task.retries}/${task.maxRetries})`);
            } else {
                task.status = 'error';
                console.error(`[WORKER] Échec définitif de ${name} après ${task.retries} tentatives`);
            }

            // Sauvegarder l'erreur
            this.results.set(name, {
                success: false,
                error: error.message,
                timestamp: new Date()
            });

            // Callback d'erreur
            if (task.onError) {
                task.onError(error);
            }
        }
    }

    /**
     * Exécute une tâche immédiatement
     */
    async runTaskNow(name) {
        const task = this.tasks.get(name);
        if (!task) {
            console.error(`[WORKER] Tâche introuvable: ${name}`);
            return false;
        }

        await this.runTask(name, task);
        return true;
    }

    /**
     * Obtient les statistiques du travailleur
     */
    getStats() {
        const stats = {
            totalTasks: this.tasks.size,
            pending: 0,
            running: 0,
            completed: 0,
            error: 0,
            tasksRun: 0,
            successRate: 0
        };

        for (const task of this.tasks.values()) {
            stats[task.status]++;
            if (task.lastRun) {
                stats.tasksRun++;
            }
        }

        if (stats.tasksRun > 0) {
            stats.successRate = Math.round(
                ((stats.tasksRun - stats.error) / stats.tasksRun) * 100
            );
        }

        return stats;
    }

    /**
     * Liste toutes les tâches
     */
    listTasks() {
        const tasks = [];

        for (const [name, task] of this.tasks) {
            tasks.push({
                name,
                status: task.status,
                priority: task.priority,
                lastRun: task.lastRun,
                nextRun: task.nextRun,
                retries: task.retries
            });
        }

        return tasks;
    }
}

/**
 * Configure les tâches automatiques prédéfinies
 */
export function setupAutomaticTasks(worker, aiEngine) {
    console.log('[WORKER] Configuration des tâches automatiques...');

    // 1. Analyser les liens de données (toutes les 5 minutes)
    worker.addTask('analyzeDataLinks', async () => {
        const analysis = await aiEngine.analyzeSituation();
        const links = analysis.dataLinks;

        if (links.missing.length > 0 || links.conflicts.length > 0) {
            const total = links.missing.length + links.conflicts.length;
            window.assistantSuggest(
                `🔍 J'ai détecté ${total} problème(s) de liens de données pendant mon analyse en arrière-plan.`
            );
        }

        return { missing: links.missing.length, conflicts: links.conflicts.length };
    }, {
        interval: 5 * 60 * 1000, // 5 minutes
        priority: 'normal',
        silent: true
    });

    // 2. Vérifier les tâches urgentes (toutes les 2 minutes)
    worker.addTask('checkUrgentTasks', async () => {
        const urgent = await aiEngine.getUrgentTasks();
        const critical = urgent.filter(t => t.urgencyScore >= 100);

        if (critical.length > 0) {
            const newCritical = critical.filter(t => !t._notified);

            if (newCritical.length > 0) {
                window.assistantSuggest(
                    `⚠️ ${newCritical.length} tâche(s) critique(s) nécessitent votre attention immédiate!`
                );

                // Marquer comme notifié
                newCritical.forEach(t => t._notified = true);
            }
        }

        return { total: urgent.length, critical: critical.length };
    }, {
        interval: 2 * 60 * 1000, // 2 minutes
        priority: 'high',
        silent: true
    });

    // 3. Sauvegarder l'état de l'assistant (toutes les 10 minutes)
    worker.addTask('saveAssistantState', async () => {
        const state = {
            lastUpdate: new Date().toISOString(),
            memory: Array.from(aiEngine.memory.entries()),
            context: aiEngine.context
        };

        // localStorage désactivé - ne sauvegarde plus l'état
        // localStorage.setItem('assistantState', JSON.stringify(state));

        return { saved: false };
    }, {
        interval: 10 * 60 * 1000, // 10 minutes
        priority: 'low',
        silent: true
    });

    // 4. Vérifier l'état de santé du projet (toutes les heures)
    worker.addTask('checkProjectHealth', async () => {
        const status = await aiEngine.getProjectStatus();

        if (status.health === 'critical' || status.health === 'poor') {
            window.assistantSuggest(
                `🏥 État du projet: ${status.health}. Taux de complétion: ${status.completionRate}%`
            );
        }

        return status;
    }, {
        interval: 60 * 60 * 1000, // 1 heure
        priority: 'normal',
        silent: true
    });

    // 5. Nettoyer les anciens résultats (une fois par jour)
    worker.addTask('cleanupOldResults', async () => {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        let cleaned = 0;

        for (const [name, result] of worker.results) {
            if (result.timestamp.getTime() < oneDayAgo) {
                worker.results.delete(name);
                cleaned++;
            }
        }

        return { cleaned };
    }, {
        interval: 24 * 60 * 60 * 1000, // 24 heures
        priority: 'low',
        silent: true
    });

    console.log(`[WORKER] ${worker.tasks.size} tâches automatiques configurées`);
}

/**
 * Crée des tâches personnalisées pour l'utilisateur
 */
export function createCustomTask(worker, name, config) {
    return worker.addTask(name, config.fn, {
        interval: config.interval,
        priority: config.priority || 'normal',
        runOnce: config.runOnce || false,
        onSuccess: config.onSuccess,
        onError: config.onError
    });
}
