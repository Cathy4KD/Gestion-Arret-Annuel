/**
 * Gestionnaire de Briefing Quotidien
 * @module assistant/daily-briefing
 *
 * Présente un résumé intelligent au démarrage de l'application
 */

export class DailyBriefing {
    constructor(aiEngine) {
        this.ai = aiEngine;
        this.briefingData = null;
        this.lastBriefingDate = null;
    }

    /**
     * Génère le briefing quotidien complet
     */
    async generate() {
        console.log('[BRIEFING] Génération du briefing quotidien...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.briefingData = {
            date: today,
            greeting: this.getGreeting(),
            summary: await this.generateSummary(),
            todayTasks: await this.getTodayTasks(),
            urgentItems: await this.getUrgentItems(),
            recommendations: await this.getRecommendations(),
            metrics: await this.getMetrics(),
            quickActions: this.getQuickActions()
        };

        this.lastBriefingDate = today;

        console.log('[BRIEFING] Briefing généré avec succès');
        return this.briefingData;
    }

    /**
     * Salutation personnalisée selon l'heure
     */
    getGreeting() {
        const hour = new Date().getHours();

        if (hour < 6) return { emoji: '🌙', text: 'Bonne nuit' };
        if (hour < 12) return { emoji: '☀️', text: 'Bonjour' };
        if (hour < 18) return { emoji: '🌤️', text: 'Bon après-midi' };
        if (hour < 22) return { emoji: '🌆', text: 'Bonsoir' };
        return { emoji: '🌙', text: 'Bonne soirée' };
    }

    /**
     * Résumé de la journée
     */
    async generateSummary() {
        const tasks = await this.getTodayTasks();
        const overdueTasks = await this.getOverdueTasks();
        const meetings = await this.getTodayMeetings();

        const summary = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.statut === 'completed').length,
            pendingTasks: tasks.filter(t => t.statut !== 'completed' && t.statut !== 'cancelled').length,
            overdueTasks: overdueTasks.length,
            meetings: meetings.length,
            urgentAlerts: null,
            mood: 'neutral'
        };

        // Déterminer le mood
        if (summary.overdueTasks > 10) {
            summary.mood = 'critical';
            summary.urgentAlerts = `⚠️ ATTENTION: ${summary.overdueTasks} tâches en retard!`;
        } else if (summary.overdueTasks > 5) {
            summary.mood = 'warning';
            summary.urgentAlerts = `⚡ ${summary.overdueTasks} tâches nécessitent votre attention`;
        } else if (summary.totalTasks === 0 && summary.overdueTasks === 0) {
            summary.mood = 'calm';
        } else {
            summary.mood = 'good';
        }

        return summary;
    }

    /**
     * Tâches du jour
     */
    async getTodayTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allTasks = await this.ai.getAllTasks();

        return allTasks.filter(task => {
            if (task.statut === 'cancelled') return false;
            if (!task.date && !task.phaseDate) return false;

            const taskDate = new Date(task.date || task.phaseDate);
            taskDate.setHours(0, 0, 0, 0);

            return taskDate.getTime() === today.getTime();
        });
    }

    /**
     * Tâches en retard
     */
    async getOverdueTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allTasks = await this.ai.getAllTasks();

        return allTasks.filter(task => {
            if (task.statut === 'completed' || task.statut === 'cancelled') return false;
            if (!task.date && !task.phaseDate) return false;

            const taskDate = new Date(task.date || task.phaseDate);
            taskDate.setHours(0, 0, 0, 0);

            return taskDate < today;
        });
    }

    /**
     * Réunions du jour
     */
    async getTodayMeetings() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const meetings = await this.ai.getMeetings();

        return meetings.filter(meeting => {
            if (!meeting.date) return false;

            const meetingDate = new Date(meeting.date);
            meetingDate.setHours(0, 0, 0, 0);

            return meetingDate.getTime() === today.getTime();
        });
    }

    /**
     * Éléments urgents
     */
    async getUrgentItems() {
        const urgent = [];

        // 1. Tâches en retard
        const overdue = await this.getOverdueTasks();
        if (overdue.length > 0) {
            urgent.push({
                type: 'overdue_tasks',
                severity: overdue.length > 10 ? 'critical' : overdue.length > 5 ? 'high' : 'medium',
                count: overdue.length,
                icon: '🚨',
                message: `${overdue.length} tâche(s) en retard`,
                details: overdue.slice(0, 5).map(t => ({
                    title: t.titre,
                    daysLate: this.calculateDaysLate(t),
                    pageId: this.getTaskPageId(t)
                })),
                action: {
                    label: 'Voir toutes les tâches en retard',
                    handler: 'showOverdueTasks'
                }
            });
        }

        // 2. Tâches d'aujourd'hui
        const today = await this.getTodayTasks();
        if (today.length > 0) {
            urgent.push({
                type: 'today_tasks',
                severity: 'medium',
                count: today.length,
                icon: '📅',
                message: `${today.length} tâche(s) prévue(s) aujourd'hui`,
                details: today.map(t => ({
                    title: t.titre,
                    priority: t.priorite || 'normale',
                    pageId: this.getTaskPageId(t)
                })),
                action: {
                    label: 'Commencer',
                    handler: 'startTodayTasks'
                }
            });
        }

        // 3. Réunions d'aujourd'hui
        const meetings = await this.getTodayMeetings();
        if (meetings.length > 0) {
            urgent.push({
                type: 'today_meetings',
                severity: 'medium',
                count: meetings.length,
                icon: '👥',
                message: `${meetings.length} réunion(s) aujourd'hui`,
                details: meetings.map(m => ({
                    title: m.titre || m.sujet,
                    time: m.heure,
                    participants: m.participants?.length || 0
                })),
                action: {
                    label: 'Voir l\'agenda',
                    handler: () => window.switchToPage('bilan-reunions')
                }
            });
        }

        // 4. Données manquantes critiques
        const missingData = await this.checkCriticalData();
        if (missingData.length > 0) {
            urgent.push({
                type: 'missing_critical_data',
                severity: 'high',
                count: missingData.length,
                icon: '⚠️',
                message: `${missingData.length} donnée(s) critique(s) manquante(s)`,
                details: missingData.slice(0, 5),
                action: {
                    label: 'Corriger',
                    handler: 'fixMissingData'
                }
            });
        }

        // 5. Alertes système
        const systemAlerts = await this.getSystemAlerts();
        if (systemAlerts.length > 0) {
            systemAlerts.forEach(alert => urgent.push(alert));
        }

        return urgent;
    }

    /**
     * Calcule le nombre de jours de retard
     */
    calculateDaysLate(task) {
        if (!task.date && !task.phaseDate) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const taskDate = new Date(task.date || task.phaseDate);
        taskDate.setHours(0, 0, 0, 0);

        const diff = today - taskDate;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Obtient l'ID de la page pour une tâche
     */
    getTaskPageId(task) {
        // Si la tâche a un ID de page spécifique
        if (task.pageId) return task.pageId;

        // Sinon, essayer de déduire de l'ID de la tâche
        if (task.id) {
            return `detail-${task.id}`;
        }

        return 'summary';
    }

    /**
     * Vérifie les données critiques manquantes
     */
    async checkCriticalData() {
        const missing = [];

        // Vérifier la date de début
        const startDate = this.ai.memory.get('arret_start_date');
        if (!startDate || !startDate.date) {
            missing.push({
                type: 'missing_start_date',
                field: 'Date de début d\'arrêt',
                location: 'Paramètres',
                action: () => window.switchToPage('parametres')
            });
        }

        // Vérifier les tâches sans responsable
        const tasks = await this.ai.getAllTasks();
        const tasksWithoutResponsible = tasks.filter(t =>
            t.statut !== 'cancelled' && (!t.responsable || t.responsable.trim() === '')
        );

        if (tasksWithoutResponsible.length > 10) {
            missing.push({
                type: 'tasks_without_responsible',
                field: 'Responsables de tâches',
                count: tasksWithoutResponsible.length,
                location: 'Planning',
                action: () => window.switchToPage('summary')
            });
        }

        return missing;
    }

    /**
     * Obtient les alertes système
     */
    async getSystemAlerts() {
        const alerts = [];

        // Vérifier si le projet est en retard critique
        const projectStatus = await this.ai.getProjectStatus();
        const daysToStart = this.ai.getDaysUntilStart();

        if (daysToStart !== null && daysToStart < 30 && projectStatus.completionRate < 50) {
            alerts.push({
                type: 'project_critical',
                severity: 'critical',
                icon: '🚨',
                message: 'Projet en état critique!',
                details: [
                    {
                        text: `Seulement ${projectStatus.completionRate}% complété`,
                        value: projectStatus.completionRate
                    },
                    {
                        text: `${daysToStart} jours avant le début`,
                        value: daysToStart
                    }
                ],
                action: {
                    label: 'Plan d\'urgence',
                    handler: 'emergencyPlan'
                }
            });
        }

        return alerts;
    }

    /**
     * Recommandations intelligentes
     */
    async getRecommendations() {
        const recommendations = [];

        // Analyser les tendances
        const trends = await this.analyzeTrends();

        // Recommandation basée sur le taux de complétion
        if (trends.completionRate < 70) {
            const daysToStart = this.ai.getDaysUntilStart();

            if (daysToStart && daysToStart < 60) {
                recommendations.push({
                    type: 'planning',
                    priority: 'high',
                    icon: '📊',
                    title: 'Ajustement du planning recommandé',
                    message: `Taux de complétion à ${trends.completionRate}% avec ${daysToStart} jours restants`,
                    suggestion: 'Prioriser les tâches critiques et augmenter les ressources',
                    actions: [
                        {
                            label: 'Revoir le planning',
                            handler: () => window.switchToPage('timeline')
                        },
                        {
                            label: 'Voir les tâches critiques',
                            handler: () => window.switchToPage('summary')
                        }
                    ]
                });
            }
        }

        // Recommandation basée sur les retards
        if (trends.delayTrend === 'increasing') {
            recommendations.push({
                type: 'warning',
                priority: 'high',
                icon: '⚠️',
                title: 'Tendance aux retards',
                message: 'Les retards augmentent progressivement',
                suggestion: 'Identifier les goulots d\'étranglement et redistribuer les ressources',
                actions: [
                    {
                        label: 'Analyser les causes',
                        handler: 'analyzeDelays'
                    }
                ]
            });
        }

        // Recommandation pour les réunions
        const upcomingMeetings = await this.getUpcomingMeetings(7);
        if (upcomingMeetings.length > 0) {
            const meetingsWithoutAgenda = upcomingMeetings.filter(m => !m.agenda || m.agenda.trim() === '');

            if (meetingsWithoutAgenda.length > 0) {
                recommendations.push({
                    type: 'meeting_prep',
                    priority: 'medium',
                    icon: '📝',
                    title: 'Préparation de réunions',
                    message: `${meetingsWithoutAgenda.length} réunion(s) sans ordre du jour`,
                    suggestion: 'Préparer les ordres du jour pour optimiser les réunions',
                    actions: [
                        {
                            label: 'Préparer maintenant',
                            handler: () => window.switchToPage('bilan-reunions')
                        }
                    ]
                });
            }
        }

        // Recommandation pour la documentation
        const docRecommendation = await this.checkDocumentation();
        if (docRecommendation) {
            recommendations.push(docRecommendation);
        }

        return recommendations;
    }

    /**
     * Analyse les tendances du projet
     */
    async analyzeTrends() {
        const tasks = await this.ai.getAllTasks();
        const completed = tasks.filter(t => t.statut === 'completed').length;
        const total = tasks.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Analyser la tendance des retards (simplifié)
        const overdue = await this.getOverdueTasks();
        const delayTrend = overdue.length > 10 ? 'increasing' : overdue.length > 5 ? 'stable' : 'decreasing';

        return {
            completionRate,
            delayTrend,
            velocity: this.calculateVelocity(tasks)
        };
    }

    /**
     * Calcule la vélocité du projet
     */
    calculateVelocity(tasks) {
        // Simplifié: nombre de tâches complétées dans les 7 derniers jours
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentlyCompleted = tasks.filter(t => {
            if (t.statut !== 'completed' || !t.dateCompletion) return false;
            const completionDate = new Date(t.dateCompletion);
            return completionDate >= sevenDaysAgo;
        });

        return recentlyCompleted.length;
    }

    /**
     * Obtient les réunions à venir
     */
    async getUpcomingMeetings(days = 7) {
        const meetings = await this.ai.getMeetings();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);

        return meetings.filter(m => {
            if (!m.date) return false;
            const meetingDate = new Date(m.date);
            meetingDate.setHours(0, 0, 0, 0);

            return meetingDate >= today && meetingDate <= futureDate;
        });
    }

    /**
     * Vérifie l'état de la documentation
     */
    async checkDocumentation() {
        // À implémenter: vérifier si la documentation est à jour
        return null;
    }

    /**
     * Métriques du projet
     */
    async getMetrics() {
        const projectStatus = await this.ai.getProjectStatus();
        const daysToStart = this.ai.getDaysUntilStart();

        return {
            totalTasks: projectStatus.total,
            completedTasks: projectStatus.completed,
            inProgressTasks: projectStatus.inProgress,
            pendingTasks: projectStatus.pending,
            completionRate: projectStatus.completionRate,
            projectHealth: projectStatus.health,
            daysToStart: daysToStart,
            budgetStatus: await this.getBudgetStatus(),
            teamEfficiency: await this.getTeamEfficiency()
        };
    }

    /**
     * Obtient le statut du budget
     */
    async getBudgetStatus() {
        // À implémenter: calculer le statut du budget
        return {
            allocated: 1000000,
            spent: 450000,
            remaining: 550000,
            percentSpent: 45,
            status: 'on_track'
        };
    }

    /**
     * Calcule l'efficacité des équipes
     */
    async getTeamEfficiency() {
        const velocity = this.calculateVelocity(await this.ai.getAllTasks());

        return {
            tasksPerWeek: velocity,
            efficiency: velocity > 10 ? 'excellent' : velocity > 5 ? 'good' : 'needs_improvement'
        };
    }

    /**
     * Obtient les actions rapides
     */
    getQuickActions() {
        return [
            {
                id: 'view_today',
                icon: '📅',
                label: 'Tâches du jour',
                action: 'viewTodayTasks'
            },
            {
                id: 'view_overdue',
                icon: '🚨',
                label: 'Tâches en retard',
                action: 'viewOverdueTasks'
            },
            {
                id: 'view_planning',
                icon: '📊',
                label: 'Planning',
                action: () => window.switchToPage('timeline')
            },
            {
                id: 'view_meetings',
                icon: '👥',
                label: 'Réunions',
                action: () => window.switchToPage('bilan-reunions')
            }
        ];
    }

    /**
     * Formate une date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Détermine si le briefing doit être affiché
     */
    shouldShowBriefing() {
        if (!this.lastBriefingDate) return true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.lastBriefingDate.getTime() !== today.getTime();
    }
}
