/**
 * Moteur d'Intelligence de l'Assistant Virtuel
 * @module assistant/ai-engine
 *
 * Cerveau de l'assistant qui coordonne toutes les actions intelligentes
 */

import { arretData } from '../data/arret-data.js';
import { getStartDate } from '../data/settings.js';
import { loadFromStorage } from '../sync/storage-wrapper.js';

export class AIEngine {
    constructor() {
        this.capabilities = {
            analyze: true,
            suggest: true,
            generate: true,
            learn: true,
            predict: true
        };

        this.memory = new Map(); // Mémoire à long terme
        this.context = null;     // Contexte actuel
        this.tasks = [];         // Tâches en cours
        this.projectData = null; // Données du projet
    }

    /**
     * Initialise le moteur d'IA
     */
    async initialize() {
        console.log('[AI ENGINE] Initialisation...');

        // Charger les données du projet
        await this.loadProjectData();

        // Initialiser la mémoire
        await this.initializeMemory();

        console.log('[AI ENGINE] Initialisé avec succès');
    }

    /**
     * Charge toutes les données du projet
     */
    async loadProjectData() {
        this.projectData = {
            tasks: await this.getAllTasks(),
            equipments: await this.getEquipments(),
            pieces: await this.getPieces(),
            teams: await this.getTeams(),
            meetings: await this.getMeetings(),
            startDate: await getStartDate()
        };

        console.log(`[AI ENGINE] Données chargées: ${this.projectData.tasks.length} tâches`);
    }

    /**
     * Initialise la mémoire avec les dates importantes
     */
    async initializeMemory() {
        const startDate = await getStartDate();

        if (startDate) {
            this.memory.set('arret_start_date', {
                date: startDate,
                label: 'Début arrêt annuel 2026',
                type: 'critical',
                timestamp: new Date()
            });
        }

        // Calculer des dates dérivées
        if (startDate) {
            const start = new Date(startDate);

            // 1 semaine avant
            const oneWeekBefore = new Date(start);
            oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
            this.memory.set('preparation_deadline', {
                date: oneWeekBefore.toISOString().split('T')[0],
                label: 'Deadline préparation finale',
                type: 'important',
                timestamp: new Date()
            });

            // 1 mois avant
            const oneMonthBefore = new Date(start);
            oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
            this.memory.set('planning_review', {
                date: oneMonthBefore.toISOString().split('T')[0],
                label: 'Revue du planning',
                type: 'important',
                timestamp: new Date()
            });
        }

        console.log(`[AI ENGINE] Mémoire initialisée: ${this.memory.size} entrées`);
    }

    /**
     * Met à jour le contexte actuel
     */
    updateContext(pageId, data = {}) {
        this.context = {
            pageId,
            timestamp: new Date(),
            data,
            previousContext: this.context
        };
    }

    /**
     * Analyse intelligente de la situation actuelle
     */
    async analyzeSituation() {
        console.log('[AI ENGINE] Analyse de la situation...');

        const analysis = {
            timestamp: new Date(),
            currentPage: this.context?.pageId || 'unknown',
            userActivity: this.getUserActivity(),
            projectStatus: await this.getProjectStatus(),
            urgentTasks: await this.getUrgentTasks(),
            dataLinks: await this.analyzeDataLinks(),
            recommendations: [],
            alerts: []
        };

        // Générer des recommandations intelligentes
        analysis.recommendations = this.generateRecommendations(analysis);

        // Générer des alertes si nécessaire
        analysis.alerts = this.generateAlerts(analysis);

        return analysis;
    }

    /**
     * Récupère l'activité de l'utilisateur
     */
    getUserActivity() {
        const activity = {
            lastPageVisit: this.context?.timestamp || new Date(),
            currentPage: this.context?.pageId || null,
            sessionDuration: this.getSessionDuration(),
            pagesVisited: this.getPagesVisitedToday()
        };

        return activity;
    }

    /**
     * Récupère le statut du projet
     */
    async getProjectStatus() {
        const tasks = this.projectData?.tasks || await this.getAllTasks();

        const total = tasks.length;
        const completed = tasks.filter(t => t.statut === 'completed').length;
        const inProgress = tasks.filter(t => t.statut === 'in_progress').length;
        const pending = tasks.filter(t => !t.statut || t.statut === 'pending').length;
        const cancelled = tasks.filter(t => t.statut === 'cancelled').length;

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            inProgress,
            pending,
            cancelled,
            completionRate,
            health: this.calculateProjectHealth(completionRate, inProgress, pending)
        };
    }

    /**
     * Calcule la santé du projet
     */
    calculateProjectHealth(completionRate, inProgress, pending) {
        if (completionRate >= 80) return 'excellent';
        if (completionRate >= 60) return 'good';
        if (completionRate >= 40) return 'average';
        if (completionRate >= 20) return 'poor';
        return 'critical';
    }

    /**
     * Récupère les tâches urgentes
     */
    async getUrgentTasks() {
        const tasks = this.projectData?.tasks || await this.getAllTasks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const urgent = [];

        tasks.forEach(task => {
            if (task.statut === 'completed' || task.statut === 'cancelled') return;

            // Tâches en retard
            if (task.date) {
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0);

                const daysLate = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24));

                if (daysLate > 0) {
                    urgent.push({
                        ...task,
                        urgencyType: 'overdue',
                        daysLate,
                        urgencyScore: 100 + daysLate * 10
                    });
                }
                // Tâches dues aujourd'hui
                else if (daysLate === 0) {
                    urgent.push({
                        ...task,
                        urgencyType: 'today',
                        daysLate: 0,
                        urgencyScore: 80
                    });
                }
                // Tâches dues dans les 3 prochains jours
                else if (daysLate > -3) {
                    urgent.push({
                        ...task,
                        urgencyType: 'soon',
                        daysUntil: Math.abs(daysLate),
                        urgencyScore: 60 - (Math.abs(daysLate) * 10)
                    });
                }
            }

            // Tâches marquées comme prioritaires
            if (task.priorite === 'haute' || task.priorite === 'critique') {
                const existingIndex = urgent.findIndex(t => t.id === task.id);
                if (existingIndex >= 0) {
                    urgent[existingIndex].urgencyScore += 30;
                } else {
                    urgent.push({
                        ...task,
                        urgencyType: 'high_priority',
                        urgencyScore: 70
                    });
                }
            }
        });

        // Trier par score d'urgence décroissant
        urgent.sort((a, b) => b.urgencyScore - a.urgencyScore);

        return urgent;
    }

    /**
     * Analyse les liens entre les données
     */
    async analyzeDataLinks() {
        const links = {
            found: [],
            missing: [],
            conflicts: [],
            suggestions: []
        };

        const tasks = this.projectData?.tasks || await this.getAllTasks();
        const equipments = this.projectData?.equipments || await this.getEquipments();

        // Analyser les liens tâches-équipements
        tasks.forEach(task => {
            if (task.equipementId) {
                const equipment = equipments.find(e => e.id === task.equipementId);

                if (equipment) {
                    links.found.push({
                        type: 'task-equipment',
                        from: task.id,
                        to: equipment.id,
                        fromTitle: task.titre,
                        toTitle: equipment.nom,
                        status: 'ok'
                    });
                } else {
                    links.missing.push({
                        type: 'task-equipment',
                        taskId: task.id,
                        taskTitle: task.titre,
                        missingEquipmentId: task.equipementId,
                        recommendation: 'Créer l\'équipement manquant ou corriger l\'ID de référence'
                    });
                }
            } else {
                // Suggérer des liens potentiels basés sur les noms
                const potentialEquipment = this.findPotentialEquipmentForTask(task, equipments);
                if (potentialEquipment) {
                    links.suggestions.push({
                        type: 'task-equipment',
                        taskId: task.id,
                        taskTitle: task.titre,
                        suggestedEquipment: potentialEquipment,
                        confidence: 0.7,
                        reason: 'Correspondance du nom détectée'
                    });
                }
            }
        });

        return links;
    }

    /**
     * Trouve un équipement potentiel pour une tâche
     */
    findPotentialEquipmentForTask(task, equipments) {
        if (!task.titre) return null;

        const taskTitle = task.titre.toLowerCase();

        for (const equipment of equipments) {
            if (!equipment.nom) continue;

            const equipmentName = equipment.nom.toLowerCase();

            // Vérifier si le nom de l'équipement est dans le titre de la tâche
            if (taskTitle.includes(equipmentName) || equipmentName.includes(taskTitle)) {
                return equipment;
            }
        }

        return null;
    }

    /**
     * Génère des recommandations intelligentes
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Recommandations basées sur les tâches urgentes
        if (analysis.urgentTasks.length > 0) {
            const overdue = analysis.urgentTasks.filter(t => t.urgencyType === 'overdue');
            const today = analysis.urgentTasks.filter(t => t.urgencyType === 'today');

            if (overdue.length > 0) {
                recommendations.push({
                    id: 'urgent_overdue',
                    type: 'urgent',
                    priority: 'critical',
                    icon: '🚨',
                    title: 'Tâches en retard',
                    message: `Vous avez ${overdue.length} tâche(s) en retard`,
                    details: overdue.slice(0, 3).map(t => `${t.titre} (${t.daysLate} jour(s) de retard)`),
                    actions: [
                        {
                            label: 'Voir toutes les tâches en retard',
                            action: 'showOverdueTasks'
                        },
                        {
                            label: 'Replanifier',
                            action: 'rescheduleOverdueTasks'
                        }
                    ]
                });
            }

            if (today.length > 0) {
                recommendations.push({
                    id: 'urgent_today',
                    type: 'reminder',
                    priority: 'high',
                    icon: '📅',
                    title: 'Tâches d\'aujourd\'hui',
                    message: `${today.length} tâche(s) prévue(s) aujourd'hui`,
                    details: today.map(t => t.titre),
                    actions: [
                        {
                            label: 'Commencer maintenant',
                            action: 'startTodayTasks'
                        }
                    ]
                });
            }
        }

        // Recommandations basées sur le statut du projet
        if (analysis.projectStatus.completionRate < 50) {
            const daysToStart = this.getDaysUntilStart();

            if (daysToStart < 30 && daysToStart > 0) {
                recommendations.push({
                    id: 'project_behind',
                    type: 'warning',
                    priority: 'high',
                    icon: '⚠️',
                    title: 'Projet en retard',
                    message: `Seulement ${analysis.projectStatus.completionRate}% complété avec ${daysToStart} jours restants`,
                    details: ['Considérez augmenter les ressources', 'Prioriser les tâches critiques'],
                    actions: [
                        {
                            label: 'Revoir le planning',
                            action: 'reviewPlanning'
                        }
                    ]
                });
            }
        }

        // Recommandations basées sur les liens de données
        if (analysis.dataLinks.missing.length > 0) {
            recommendations.push({
                id: 'missing_data_links',
                type: 'data_quality',
                priority: 'medium',
                icon: '🔗',
                title: 'Liens de données manquants',
                message: `${analysis.dataLinks.missing.length} lien(s) de données à corriger`,
                details: analysis.dataLinks.missing.slice(0, 3).map(m => m.recommendation),
                actions: [
                    {
                        label: 'Voir les détails',
                        action: 'showMissingLinks'
                    }
                ]
            });
        }

        // Recommandations basées sur les suggestions
        if (analysis.dataLinks.suggestions.length > 0) {
            recommendations.push({
                id: 'data_link_suggestions',
                type: 'suggestion',
                priority: 'low',
                icon: '💡',
                title: 'Suggestions de liens',
                message: `${analysis.dataLinks.suggestions.length} lien(s) potentiel(s) détecté(s)`,
                details: analysis.dataLinks.suggestions.slice(0, 3).map(s =>
                    `Lier "${s.taskTitle}" à "${s.suggestedEquipment.nom}"`
                ),
                actions: [
                    {
                        label: 'Appliquer les suggestions',
                        action: 'applySuggestedLinks'
                    }
                ]
            });
        }

        return recommendations;
    }

    /**
     * Génère des alertes
     */
    generateAlerts(analysis) {
        const alerts = [];

        // Alerte si trop de tâches en retard
        const overdueTasks = analysis.urgentTasks.filter(t => t.urgencyType === 'overdue');
        if (overdueTasks.length > 10) {
            alerts.push({
                type: 'critical',
                message: `⚠️ ALERTE: ${overdueTasks.length} tâches en retard!`,
                action: 'showOverdueTasks'
            });
        }

        // Alerte si projet très en retard
        if (analysis.projectStatus.health === 'critical') {
            alerts.push({
                type: 'critical',
                message: '🚨 URGENT: Le projet est en état critique!',
                action: 'emergencyReview'
            });
        }

        return alerts;
    }

    /**
     * Récupère toutes les tâches du projet
     */
    async getAllTasks() {
        const tasks = [];
        const phases = arretData.phases || [];

        for (const phase of phases) {
            if (phase.taches && Array.isArray(phase.taches)) {
                phase.taches.forEach(tache => {
                    tasks.push({
                        ...tache,
                        phase: phase.nom,
                        phaseId: phase.id,
                        phaseDate: this.calculatePhaseDate(phase.semaines)
                    });
                });
            }
        }

        return tasks;
    }

    /**
     * Calcule la date d'une phase
     */
    calculatePhaseDate(weeks) {
        const startDate = this.projectData?.startDate || this.memory.get('arret_start_date')?.date;
        if (!startDate) return null;

        try {
            const date = new Date(startDate);
            date.setDate(date.getDate() + (weeks * 7));
            return date.toISOString().split('T')[0];
        } catch (error) {
            return null;
        }
    }

    /**
     * Récupère les équipements
     */
    async getEquipments() {
        try {
            const data = await loadFromStorage('equipmentsData');
            return data || [];
        } catch (error) {
            console.error('[AI ENGINE] Erreur chargement équipements:', error);
            return [];
        }
    }

    /**
     * Récupère les pièces
     */
    async getPieces() {
        try {
            const data = await loadFromStorage('piecesData');
            return data || [];
        } catch (error) {
            console.error('[AI ENGINE] Erreur chargement pièces:', error);
            return [];
        }
    }

    /**
     * Récupère les équipes
     */
    async getTeams() {
        try {
            const data = await loadFromStorage('teamsData');
            return data || [];
        } catch (error) {
            console.error('[AI ENGINE] Erreur chargement équipes:', error);
            return [];
        }
    }

    /**
     * Récupère les réunions
     */
    async getMeetings() {
        try {
            const data = await loadFromStorage('reunionsData');
            return data || [];
        } catch (error) {
            console.error('[AI ENGINE] Erreur chargement réunions:', error);
            return [];
        }
    }

    /**
     * Calcule le nombre de jours jusqu'au début de l'arrêt
     */
    getDaysUntilStart() {
        const startDate = this.memory.get('arret_start_date')?.date;
        if (!startDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const diff = start - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Obtient la durée de la session
     */
    getSessionDuration() {
        // À implémenter: tracker le temps de session
        return 0;
    }

    /**
     * Obtient les pages visitées aujourd'hui
     */
    getPagesVisitedToday() {
        // À implémenter: tracker les pages visitées
        return [];
    }
}

// Instance globale
export const aiEngine = new AIEngine();
