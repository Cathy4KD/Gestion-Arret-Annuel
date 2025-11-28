/**
 * Assistant Virtuel Intelligent - VERSION 2.0 ULTRA-AVANCÉE
 * @module assistant/virtual-assistant
 *
 * Moteur d'intelligence contextuelle qui analyse le comportement de l'utilisateur
 * et propose des actions proactives
 *
 * VERSION 2.0 - NOUVELLES CAPACITÉS:
 * - Intelligence artificielle avec AI Engine
 * - Briefing quotidien automatique
 * - Travailleur en arrière-plan 24/7
 * - Génération de documents (PDF, emails)
 * - Assistance à la rédaction
 * - Analyse complète des liens de données
 */

import { arretData } from '../data/arret-data.js';
import { getStartDate } from '../data/settings.js';
import { loadFromStorage } from '../sync/storage-wrapper.js';

// ===== IMPORTS DES NOUVEAUX MODULES v2.4.1 (avec cache-buster) =====
import { aiEngine } from './ai-engine.js?v=2.4.1';
import { DailyBriefing } from './daily-briefing.js?v=2.4.1';
import { BackgroundWorker, setupAutomaticTasks } from './background-worker.js?v=2.4.1';
import { DocumentGenerator } from './document-generator.js?v=2.4.1';
import { TextAssistant } from './text-assistant.js?v=2.4.1';
import { DataAnalyzer } from './data-analyzer.js?v=2.4.1';
import { initInteractiveAssistant } from './interactive-assistant.js?v=2.4.1';
import { initChatAssistant, addMessage } from './chat-assistant.js?v=2.4.1';

// ===== INSTANCES DES MODULES v2.0 =====
let dailyBriefing = null;
let backgroundWorker = null;
let documentGenerator = null;
let textAssistant = null;
let dataAnalyzer = null;

/**
 * État de l'assistant
 */
let assistantState = {
    isOpen: false,
    messages: [],
    currentPage: null,
    lastInteraction: null,
    notifications: [],
    userActivity: [],
    suggestions: [],
    taskReminders: new Map(),
    // Mémoire contextuelle
    contextMemory: {
        importantDates: new Map(),
        pageAnalysis: new Map(),
        detectedIssues: [],
        autoSuggestions: []
    },
    // Données de contexte
    projectContext: {
        startDate: null,
        currentPhase: null,
        criticalTasks: [],
        lastAnalysis: null
    },
    // v2.0: État des modules avancés
    modules: {
        aiEngineReady: false,
        briefingShown: false,
        workerRunning: false,
        graphBuilt: false
    }
};

/**
 * Initialise l'assistant virtuel - VERSION 2.0 COMPLÈTE
 */
export async function initAssistant() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🤖 ASSISTANT VIRTUEL v2.0 - INITIALISATION');
    console.log('═══════════════════════════════════════════════════');

    try {
        // ===== PHASE 1: INITIALISATION DU MOTEUR D'IA =====
        console.log('[1/7] 🧠 Initialisation du moteur d\'IA...');
        await aiEngine.initialize();
        assistantState.modules.aiEngineReady = true;
        console.log('      ✅ AI Engine prêt');

        // ===== PHASE 2: CRÉATION DES INSTANCES =====
        console.log('[2/7] 🔧 Création des instances des modules...');

        dailyBriefing = new DailyBriefing(aiEngine);
        console.log('      ✅ Daily Briefing créé');

        backgroundWorker = new BackgroundWorker();
        console.log('      ✅ Background Worker créé');

        documentGenerator = new DocumentGenerator();
        console.log('      ✅ Document Generator créé');

        textAssistant = new TextAssistant();
        console.log('      ✅ Text Assistant créé');

        dataAnalyzer = new DataAnalyzer(aiEngine);
        console.log('      ✅ Data Analyzer créé');

        // ===== PHASE 3: CONFIGURATION DU WORKER =====
        console.log('[3/7] ⚙️  Configuration des tâches automatiques...');
        setupAutomaticTasks(backgroundWorker, aiEngine);
        backgroundWorker.start();
        assistantState.modules.workerRunning = true;
        console.log('      ✅ Worker démarré - 5 tâches automatiques actives');

        // ===== PHASE 4: CONSTRUCTION DU GRAPHE DE DONNÉES =====
        console.log('[4/7] 🔍 Construction du graphe de données...');
        await dataAnalyzer.buildDataGraph();
        assistantState.modules.graphBuilt = true;
        const graphStats = dataAnalyzer.getGraphStats();
        console.log(`      ✅ Graphe construit: ${graphStats.totalNodes} nœuds, ${graphStats.totalEdges} relations`);

        // ===== PHASE 5: INJECTION DU WIDGET =====
        console.log('[5/7] 📱 Injection du widget...');
        await injectWidget();
        initEventListeners();
        startMonitoring();
        initInteractiveAssistant(); // Nouveau: Système interactif
        initChatAssistant(aiEngine, textAssistant, dataAnalyzer); // Nouveau: Chat intelligent
        console.log('      ✅ Widget injecté et événements liés');
        console.log('      ✅ Système interactif activé');
        console.log('      ✅ Chat intelligent activé');

        // ===== PHASE 6: AFFICHAGE DU BRIEFING QUOTIDIEN =====
        console.log('[6/7] 📅 Vérification du briefing quotidien...');
        if (dailyBriefing.shouldShowBriefing()) {
            setTimeout(async () => {
                await showDailyBriefing();
                assistantState.modules.briefingShown = true;
            }, 1500);
            console.log('      ✅ Briefing programmé pour affichage');
        } else {
            console.log('      ℹ️  Briefing déjà affiché aujourd\'hui');
        }

        // ===== PHASE 7: EXPOSITION GLOBALE =====
        console.log('[7/7] 🌐 Exposition des modules globalement...');
        window.assistantModules = {
            aiEngine,
            dailyBriefing,
            backgroundWorker,
            documentGenerator,
            textAssistant,
            dataAnalyzer,
            state: assistantState
        };
        console.log('      ✅ Modules accessibles via window.assistantModules');

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ ASSISTANT VIRTUEL v2.0 - PLEINEMENT OPÉRATIONNEL');
        console.log('═══════════════════════════════════════════════════');
        console.log('💡 Tapez: window.assistantModules pour accéder aux modules');
        console.log('💡 Tapez: window.assistantModules.aiEngine.analyzeSituation() pour une analyse');

    } catch (error) {
        console.error('❌ ERREUR lors de l\'initialisation de l\'assistant:', error);
        console.error(error.stack);
    }
}

/**
 * Injecte le widget HTML dans la page
 */
async function injectWidget() {
    try {
        const response = await fetch('/components/layout/assistant-widget.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);

        // Mettre à jour l'heure du message de bienvenue
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('welcomeTime').textContent = timeStr;

    } catch (error) {
        console.error('[ASSISTANT] Erreur injection widget:', error);
    }
}

/**
 * Initialise les événements du widget
 */
function initEventListeners() {
    // Toggle du panel
    const toggle = document.getElementById('assistant-toggle');
    if (toggle) {
        toggle.addEventListener('click', togglePanel);
    }

    // Minimize
    const minimize = document.getElementById('assistant-minimize');
    if (minimize) {
        minimize.addEventListener('click', togglePanel);
    }

    // NOTE: Les événements de chat (input/send) sont maintenant gérés par chat-assistant.js
}

/**
 * Toggle du panel de l'assistant
 */
function togglePanel() {
    const widget = document.getElementById('assistant-widget');
    if (!widget) return;

    assistantState.isOpen = !assistantState.isOpen;

    if (assistantState.isOpen) {
        widget.classList.remove('minimized');
        // Reset badge
        const badge = document.getElementById('assistantBadge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
            assistantState.notifications = [];
        }
    } else {
        widget.classList.add('minimized');
    }
}

/**
 * Message de bienvenue
 */
function showWelcomeMessage() {
    analyzeAndSuggest();
}

/**
 * Démarre le monitoring de l'activité
 */
function startMonitoring() {
    // Surveiller les changements de page
    window.addEventListener('pageChanged', (e) => {
        handlePageChange(e.detail.pageId);
    });

    // Analyse périodique (toutes les 5 minutes)
    setInterval(() => {
        analyzeAndSuggest();
    }, 5 * 60 * 1000);

    // Analyse à chaque heure pour les rappels de tâches
    setInterval(() => {
        checkTaskReminders();
    }, 60 * 60 * 1000);
}

/**
 * Gère le changement de page
 */
function handlePageChange(pageId) {
    assistantState.currentPage = pageId;
    console.log('[ASSISTANT] Page changée:', pageId);

    // Analyser le contexte et proposer des actions
    setTimeout(() => {
        analyzePageContext(pageId);
    }, 1000);
}

/**
 * Analyse le contexte de la page actuelle - VERSION AMÉLIORÉE
 */
async function analyzePageContext(pageId) {
    console.log('[ASSISTANT] Analyse du contexte:', pageId);

    // Mettre à jour le contexte du projet
    await updateProjectContext();

    // Suggestions contextuelles selon la page
    const suggestions = [];

    // NOUVEAU: Détecter si c'est une page de détail (detail-t3, detail-t4, etc.)
    if (pageId.startsWith('detail-t')) {
        const taskNumber = pageId.replace('detail-t', '');
        await analyzeTaskDetailPage(taskNumber, suggestions);
    } else {
        // Analyse des autres pages
        switch (pageId) {
            case 'summary':
            case 'preparation':
                suggestions.push({
                    text: "📊 Voir les tâches en retard",
                    action: () => {
                        if (!assistantState.isOpen) togglePanel();
                        addMessage('bot', "Analysons vos tâches en retard...");
                        setTimeout(() => showTasksInDelay(), 1000);
                    }
                });
                suggestions.push({
                    text: "📅 Tâches de cette semaine",
                    action: () => {
                        if (!assistantState.isOpen) togglePanel();
                        addMessage('bot', "Voici vos tâches pour cette semaine...");
                        setTimeout(() => showWeekTasks(), 1000);
                    }
                });
                break;

            case 'dashboard':
                suggestions.push({
                    text: "🚨 Alertes prioritaires",
                    action: () => {
                        if (!assistantState.isOpen) togglePanel();
                        addMessage('bot', "Analysons les alertes urgentes...");
                        setTimeout(() => showTasksInDelay(), 1000);
                    }
                });
                suggestions.push({
                    text: "📈 Résumé d'avancement",
                    action: () => {
                        if (!assistantState.isOpen) togglePanel();
                        showProgressSummary();
                    }
                });
                break;

            case 'bilan-reunions':
                suggestions.push({
                    text: "📅 Prochaines réunions",
                    action: () => showUpcomingMeetings()
                });
                suggestions.push({
                    text: "✅ Comptes rendus manquants",
                    action: () => showMissingReports()
                });
                break;

            default:
                // NOUVEAU: Analyse générique améliorée
                await analyzeGenericPage(pageId, suggestions);
        }
    }

    // Mettre à jour les suggestions
    updateSuggestions(suggestions);

    // NOUVEAU: Enregistrer l'analyse de la page
    assistantState.contextMemory.pageAnalysis.set(pageId, {
        timestamp: new Date(),
        suggestions: suggestions.length,
        analyzed: true
    });
}

/**
 * Met à jour les suggestions rapides
 */
function updateSuggestions(suggestions) {
    const container = document.getElementById('assistant-suggestions');
    if (!container) return;

    assistantState.suggestions = suggestions;

    container.innerHTML = suggestions.map((sug, index) => `
        <div class="suggestion-chip" data-suggestion="${index}">
            ${sug.text}
        </div>
    `).join('');

    // Ajouter les événements
    container.querySelectorAll('.suggestion-chip').forEach((chip, index) => {
        chip.addEventListener('click', () => {
            if (suggestions[index].action) {
                suggestions[index].action();
            }
        });
    });
}

/**
 * Analyse et suggère des actions proactives - VERSION AMÉLIORÉE
 */
async function analyzeAndSuggest() {
    console.log('[ASSISTANT] Analyse proactive...');

    const phases = arretData.phases || [];
    const startDate = await getStartDate();
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    let tachesRetard = 0;
    let tachesAujourdhui = 0;
    let tachesCritiques = [];

    // Analyser toutes les tâches
    for (const phase of phases) {
        const phaseDate = calculatePhaseDate(startDate, phase.semaines);

        if (phase.taches) {
            phase.taches.forEach(tache => {
                if (tache.statut === 'cancelled') return;

                const tacheDate = new Date(phaseDate);
                tacheDate.setHours(0, 0, 0, 0);

                // Tâches en retard
                if (tacheDate < aujourdhui && tache.statut !== 'completed') {
                    tachesRetard++;
                }

                // Tâches aujourd'hui
                if (tacheDate.getTime() === aujourdhui.getTime() && tache.statut !== 'completed') {
                    tachesAujourdhui++;
                    tachesCritiques.push(tache);
                }
            });
        }
    }

    // NOUVEAU: Détecter les incohérences automatiquement
    const inconsistencies = await detectInconsistencies();
    if (inconsistencies.length > 0) {
        const message = `⚠️ J'ai détecté ${inconsistencies.length} incohérence(s) dans votre projet. Voulez-vous les examiner?`;
        const actions = [
            {
                label: "Voir les problèmes",
                primary: true,
                action: () => {
                    if (!assistantState.isOpen) togglePanel();
                    setTimeout(() => showInconsistencies(inconsistencies), 500);
                }
            },
            {
                label: "Plus tard",
                primary: false,
                action: () => {}
            }
        ];
        addMessageWithActions('bot', message, actions);
        incrementBadge();
        return; // Priorité aux incohérences
    }

    // Générer des suggestions proactives
    if (tachesAujourdhui > 0) {
        const message = `Vous avez ${tachesAujourdhui} tâche(s) prévue(s) aujourd'hui. Voulez-vous que je vous aide à les organiser?`;
        const actions = [
            {
                label: "Oui, montrez-moi",
                primary: true,
                action: () => {
                    if (!assistantState.isOpen) togglePanel();
                    setTimeout(() => showWeekTasks(), 500);
                }
            },
            {
                label: "Plus tard",
                primary: false,
                action: () => {}
            }
        ];
        addMessageWithActions('bot', message, actions);
        incrementBadge();
    } else if (tachesRetard > 5) {
        const message = `Attention! ${tachesRetard} tâches sont en retard. Souhaitez-vous revoir votre planning?`;
        const actions = [
            {
                label: "Voir les retards",
                primary: true,
                action: () => {
                    if (!assistantState.isOpen) togglePanel();
                    setTimeout(() => showTasksInDelay(), 500);
                }
            },
            {
                label: "Ignorer",
                primary: false,
                action: () => {}
            }
        ];
        addMessageWithActions('bot', message, actions);
        incrementBadge();
    }

    // Vérifier les réunions proches
    await checkUpcomingMeetings();
}

/**
 * NOUVEAU: Détecte automatiquement les incohérences dans le projet
 */
async function detectInconsistencies() {
    const issues = [];

    // 1. Vérifier les dates incohérentes
    const startDate = await getStartDate();
    if (!startDate) {
        issues.push({
            type: 'missing_data',
            severity: 'high',
            message: 'Date de début d\'arrêt non définie',
            suggestion: 'Définir la date dans les paramètres',
            action: () => window.switchToPage('parametres')
        });
    }

    // 2. Vérifier les tâches sans responsable
    const phases = arretData.phases || [];
    let tachesSansResponsable = 0;
    for (const phase of phases) {
        if (phase.taches) {
            phase.taches.forEach(tache => {
                if (!tache.responsable || tache.responsable.trim() === '') {
                    tachesSansResponsable++;
                }
            });
        }
    }
    if (tachesSansResponsable > 0) {
        issues.push({
            type: 'missing_data',
            severity: 'medium',
            message: `${tachesSansResponsable} tâche(s) sans responsable assigné`,
            suggestion: 'Assigner un responsable à chaque tâche',
            action: () => window.switchToPage('summary')
        });
    }

    // 3. Vérifier les doublons potentiels
    const taskTitles = new Map();
    for (const phase of phases) {
        if (phase.taches) {
            phase.taches.forEach(tache => {
                if (tache.titre) {
                    const titre = tache.titre.toLowerCase().trim();
                    if (taskTitles.has(titre)) {
                        taskTitles.get(titre).push(phase.nom);
                    } else {
                        taskTitles.set(titre, [phase.nom]);
                    }
                }
            });
        }
    }
    const duplicates = Array.from(taskTitles.entries()).filter(([_, phases]) => phases.length > 1);
    if (duplicates.length > 0) {
        issues.push({
            type: 'duplicate',
            severity: 'low',
            message: `${duplicates.length} titre(s) de tâche(s) potentiellement dupliqué(s)`,
            suggestion: 'Vérifier si ces tâches sont réellement différentes',
            action: () => {
                if (!assistantState.isOpen) togglePanel();
                let msg = 'Tâches potentiellement dupliquées:\n\n';
                duplicates.slice(0, 3).forEach(([titre, phases]) => {
                    msg += `• "${titre}" dans: ${phases.join(', ')}\n`;
                });
                addMessage('bot', msg);
            }
        });
    }

    // Sauvegarder les incohérences détectées
    assistantState.contextMemory.detectedIssues = issues;

    return issues;
}

/**
 * NOUVEAU: Affiche les incohérences détectées
 */
function showInconsistencies(inconsistencies) {
    if (inconsistencies.length === 0) {
        addMessage('bot', "Aucune incohérence détectée. Votre projet semble bien configuré! ✅");
        return;
    }

    let message = `J'ai détecté ${inconsistencies.length} problème(s):\n\n`;

    inconsistencies.forEach((issue, i) => {
        const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        message += `${icon} ${i + 1}. ${issue.message}\n`;
        message += `   💡 ${issue.suggestion}\n\n`;
    });

    message += 'Voulez-vous corriger ces problèmes?';

    const actions = inconsistencies.slice(0, 2).map(issue => ({
        label: issue.message.substring(0, 30) + '...',
        primary: false,
        action: issue.action
    }));

    addMessageWithActions('bot', message, actions);
}

/**
 * Vérifie les réunions à venir
 */
async function checkUpcomingMeetings() {
    try {
        const reunionsData = await loadFromStorage('reunionsData') || [];
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);

        const demain = new Date(aujourdhui);
        demain.setDate(demain.getDate() + 1);

        const reunionsDemain = reunionsData.filter(r => {
            if (!r.date) return false;
            const rDate = new Date(r.date);
            rDate.setHours(0, 0, 0, 0);
            return rDate.getTime() === demain.getTime();
        });

        if (reunionsDemain.length > 0) {
            const message = `Rappel: Vous avez ${reunionsDemain.length} réunion(s) prévue(s) demain. Avez-vous préparé l'ordre du jour?`;
            const actions = [
                {
                    label: "Voir les détails",
                    primary: true,
                    action: () => window.switchToPage('bilan-reunions')
                },
                {
                    label: "OK, merci",
                    primary: false,
                    action: () => {}
                }
            ];
            addMessageWithActions('bot', message, actions);
            incrementBadge();
        }
    } catch (error) {
        console.error('[ASSISTANT] Erreur vérification réunions:', error);
    }
}

/**
 * Vérifie les rappels de tâches
 */
function checkTaskReminders() {
    // À implémenter: système de rappels personnalisés
    console.log('[ASSISTANT] Vérification des rappels...');
}

/**
 * Affiche les tâches en retard
 */
async function showTasksInDelay() {
    const phases = arretData.phases || [];
    const startDate = await getStartDate();
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    let retards = [];

    for (const phase of phases) {
        const phaseDate = calculatePhaseDate(startDate, phase.semaines);

        if (phase.taches) {
            phase.taches.forEach(tache => {
                if (tache.statut === 'cancelled' || tache.statut === 'completed') return;

                const tacheDate = new Date(phaseDate);
                tacheDate.setHours(0, 0, 0, 0);

                if (tacheDate < aujourdhui) {
                    const jours = Math.floor((aujourdhui - tacheDate) / (1000 * 60 * 60 * 24));
                    retards.push({ tache, jours, phase: phase.nom });
                }
            });
        }
    }

    retards.sort((a, b) => b.jours - a.jours);

    if (retards.length === 0) {
        addMessage('bot', "Excellente nouvelle! Aucune tâche n'est en retard. Vous êtes à jour! 🎉");
    } else {
        const top3 = retards.slice(0, 3);
        let message = `J'ai trouvé ${retards.length} tâche(s) en retard. Voici les 3 plus urgentes:\n\n`;
        top3.forEach((r, i) => {
            message += `${i + 1}. ${r.tache.titre}\n   • En retard de ${r.jours} jour(s)\n   • Phase: ${r.phase}\n\n`;
        });
        message += "Voulez-vous voir toutes les tâches en retard?";

        const actions = [
            {
                label: "Aller à Préparation",
                primary: true,
                action: () => window.switchToPage('summary')
            },
            {
                label: "Fermer",
                primary: false,
                action: () => {}
            }
        ];

        addMessageWithActions('bot', message, actions);
    }
}

/**
 * Affiche les tâches de la semaine
 */
async function showWeekTasks() {
    const phases = arretData.phases || [];
    const startDate = await getStartDate();
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const dans7Jours = new Date(aujourdhui);
    dans7Jours.setDate(dans7Jours.getDate() + 7);

    let tachesSemaine = [];

    for (const phase of phases) {
        const phaseDate = calculatePhaseDate(startDate, phase.semaines);

        if (phase.taches) {
            phase.taches.forEach(tache => {
                if (tache.statut === 'cancelled' || tache.statut === 'completed') return;

                const tacheDate = new Date(phaseDate);
                tacheDate.setHours(0, 0, 0, 0);

                if (tacheDate >= aujourdhui && tacheDate <= dans7Jours) {
                    const jours = Math.ceil((tacheDate - aujourdhui) / (1000 * 60 * 60 * 24));
                    tachesSemaine.push({ tache, jours, phase: phase.nom });
                }
            });
        }
    }

    tachesSemaine.sort((a, b) => a.jours - b.jours);

    if (tachesSemaine.length === 0) {
        addMessage('bot', "Aucune tâche prévue dans les 7 prochains jours. Profitez-en pour avancer sur d'autres aspects du projet!");
    } else {
        let message = `Vous avez ${tachesSemaine.length} tâche(s) prévue(s) cette semaine:\n\n`;
        tachesSemaine.slice(0, 5).forEach((t, i) => {
            const jour = t.jours === 0 ? "Aujourd'hui" : t.jours === 1 ? "Demain" : `Dans ${t.jours} jours`;
            message += `• ${t.tache.titre}\n  ${jour} - ${t.tache.avancement || 0}% complété\n\n`;
        });

        addMessage('bot', message);
    }
}

/**
 * Affiche le résumé d'avancement
 */
function showProgressSummary() {
    // À implémenter
    addMessage('bot', "Fonctionnalité en cours de développement...");
}

/**
 * Affiche les réunions à venir
 */
function showUpcomingMeetings() {
    addMessage('bot', "Redirection vers la page Bilan des Réunions...");
    setTimeout(() => window.switchToPage('bilan-reunions'), 1000);
}

/**
 * Affiche les comptes rendus manquants
 */
function showMissingReports() {
    // À implémenter
    addMessage('bot', "Fonctionnalité en cours de développement...");
}

/**
 * Affiche les capacités de l'assistant - VERSION AMÉLIORÉE
 */
function showCapabilities() {
    const message = `🤖 Assistant Virtuel Amélioré v2.0\n\n` +
        `Je peux maintenant vous aider avec:\n\n` +
        `🔍 ANALYSE CONTEXTUELLE:\n` +
        `• Analyse détaillée de chaque page que vous visitez\n` +
        `• Détection automatique des champs vides\n` +
        `• Vérification des dates et des incohérences\n\n` +
        `🚨 DÉTECTION PROACTIVE:\n` +
        `• Alertes sur les tâches en retard\n` +
        `• Détection de doublons et d'incohérences\n` +
        `• Tâches sans responsable\n` +
        `• Dates critiques manquantes\n\n` +
        `📊 SUIVI INTELLIGENT:\n` +
        `• Recherche de tâches liées\n` +
        `• Analyse d'avancement\n` +
        `• Gestion des réunions\n\n` +
        `💡 SUGGESTIONS AUTOMATIQUES:\n` +
        `• Recommandations basées sur votre contexte\n` +
        `• Actions proposées pour corriger les problèmes\n` +
        `• Navigation intelligente entre les pages\n\n` +
        `📅 MÉMOIRE DES DATES:\n` +
        `• Je garde en mémoire toutes les dates importantes\n` +
        `• Arrêt annuel 2026 et dates critiques\n\n` +
        `Je surveille en permanence votre projet et vous notifie des actions importantes!`;

    addMessage('bot', message);
}

/**
 * Calcule la date d'une phase
 */
function calculatePhaseDate(startDate, weeks) {
    if (!startDate) return '';
    try {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (weeks * 7));
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
}

/**
 * SUPPRIMÉ - La fonction addMessage est maintenant importée de chat-assistant.js
 * Elle gère le formatage markdown et les actions
 */

/**
 * SUPPRIMÉ - Utilisez addMessage() importée de chat-assistant.js
 * Elle gère automatiquement les actions si vous les passez en paramètre
 */
function addMessageWithActions(sender, text, actions) {
    // Rediriger vers la nouvelle fonction addMessage qui gère les actions
    addMessage(sender, text, actions);
}

/**
 * Incrémente le badge de notifications
 */
function incrementBadge() {
    if (assistantState.isOpen) return; // Ne pas notifier si ouvert

    const badge = document.getElementById('assistantBadge');
    if (!badge) return;

    assistantState.notifications.push(new Date());
    const count = assistantState.notifications.length;

    badge.textContent = count;
    badge.style.display = 'flex';
    badge.classList.add('new');

    setTimeout(() => {
        badge.classList.remove('new');
    }, 500);
}

/**
 * NOUVEAU: Met à jour le contexte du projet
 */
async function updateProjectContext() {
    try {
        const startDate = await getStartDate();
        assistantState.projectContext.startDate = startDate;
        assistantState.projectContext.lastAnalysis = new Date();

        // Mémoriser les dates importantes
        if (startDate) {
            assistantState.contextMemory.importantDates.set('arret_start', {
                date: startDate,
                label: 'Début arrêt annuel 2026',
                type: 'critical'
            });
        }
    } catch (error) {
        console.error('[ASSISTANT] Erreur mise à jour contexte:', error);
    }
}

/**
 * NOUVEAU: Analyse une page de détail de tâche (detail-t3, detail-t4, etc.)
 */
async function analyzeTaskDetailPage(taskNumber, suggestions) {
    console.log('[ASSISTANT] Analyse détaillée de la tâche T' + taskNumber);

    // Analyser le DOM de la page pour détecter les champs vides, dates, etc.
    const pageAnalysis = {
        emptyFields: [],
        dates: [],
        inconsistencies: [],
        recommendations: []
    };

    // Détecter les champs de formulaire vides
    const inputs = document.querySelectorAll('input[type="text"], input[type="date"], textarea');
    inputs.forEach(input => {
        if (!input.value || input.value.trim() === '') {
            pageAnalysis.emptyFields.push(input.name || input.id || 'Champ sans nom');
        }
    });

    // Détecter les dates
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (input.value) {
            pageAnalysis.dates.push({
                field: input.name || input.id,
                value: input.value
            });
        }
    });

    // Générer des suggestions intelligentes
    if (pageAnalysis.emptyFields.length > 0) {
        suggestions.push({
            text: `⚠️ ${pageAnalysis.emptyFields.length} champ(s) vide(s) détecté(s)`,
            action: () => {
                if (!assistantState.isOpen) togglePanel();
                const message = `J'ai détecté ${pageAnalysis.emptyFields.length} champ(s) vide(s) dans cette page:\n\n` +
                    pageAnalysis.emptyFields.slice(0, 5).map((f, i) => `${i + 1}. ${f}`).join('\n') +
                    (pageAnalysis.emptyFields.length > 5 ? `\n\n...et ${pageAnalysis.emptyFields.length - 5} autres.` : '') +
                    '\n\nVoulez-vous que je vous aide à les remplir?';
                addMessage('bot', message);
            }
        });
    }

    if (pageAnalysis.dates.length > 0) {
        suggestions.push({
            text: `📅 Vérifier les ${pageAnalysis.dates.length} date(s)`,
            action: () => {
                if (!assistantState.isOpen) togglePanel();
                const message = `Cette tâche contient ${pageAnalysis.dates.length} date(s):\n\n` +
                    pageAnalysis.dates.map((d, i) => `${i + 1}. ${d.field}: ${formatDateFr(d.value)}`).join('\n');
                addMessage('bot', message);
            }
        });
    }

    // Suggestion de navigation vers tâches liées
    suggestions.push({
        text: "🔗 Voir tâches liées",
        action: () => {
            if (!assistantState.isOpen) togglePanel();
            addMessage('bot', `Recherche des tâches liées à T${taskNumber}...`);
            setTimeout(() => findRelatedTasks(taskNumber), 500);
        }
    });

    // Suggestion d'analyse d'avancement
    suggestions.push({
        text: "📊 Analyser l'avancement",
        action: () => {
            if (!assistantState.isOpen) togglePanel();
            analyzeTaskProgress(taskNumber);
        }
    });

    // Sauvegarder l'analyse
    assistantState.contextMemory.pageAnalysis.set('detail-t' + taskNumber, pageAnalysis);
}

/**
 * NOUVEAU: Analyse une page générique
 */
async function analyzeGenericPage(pageId, suggestions) {
    // Analyse de base pour les pages non-tâches
    suggestions.push({
        text: "🤖 Que puis-je faire?",
        action: () => showCapabilities()
    });

    // Ajouter suggestion contextuelle selon le type de page
    if (pageId.includes('demande')) {
        suggestions.push({
            text: "📋 Vérifier les demandes en attente",
            action: () => {
                if (!assistantState.isOpen) togglePanel();
                addMessage('bot', "Analyse des demandes en cours...");
            }
        });
    }

    if (pageId.includes('equipement') || pageId.includes('pieces')) {
        suggestions.push({
            text: "🔧 Vérifier la disponibilité",
            action: () => {
                if (!assistantState.isOpen) togglePanel();
                addMessage('bot', "Vérification de la disponibilité des équipements...");
            }
        });
    }
}

/**
 * NOUVEAU: Recherche des tâches liées
 */
function findRelatedTasks(taskNumber) {
    const relatedTasks = [];

    // Logique simplifiée - peut être améliorée
    const phases = arretData.phases || [];
    for (const phase of phases) {
        if (phase.taches) {
            phase.taches.forEach(tache => {
                if (tache.titre && tache.titre.toLowerCase().includes('t' + taskNumber)) {
                    relatedTasks.push({
                        phase: phase.nom,
                        tache: tache.titre,
                        statut: tache.statut
                    });
                }
            });
        }
    }

    if (relatedTasks.length === 0) {
        addMessage('bot', `Aucune tâche directement liée à T${taskNumber} n'a été trouvée dans les données.`);
    } else {
        let message = `Tâches potentiellement liées à T${taskNumber}:\n\n`;
        relatedTasks.forEach((t, i) => {
            message += `${i + 1}. ${t.tache}\n   Phase: ${t.phase} | Statut: ${t.statut}\n\n`;
        });
        addMessage('bot', message);
    }
}

/**
 * NOUVEAU: Analyse l'avancement d'une tâche
 */
function analyzeTaskProgress(taskNumber) {
    // Chercher les éléments d'avancement dans la page
    const progressElements = document.querySelectorAll('[data-progress], .progress, input[type="range"]');

    if (progressElements.length === 0) {
        addMessage('bot', `Aucun indicateur d'avancement trouvé pour T${taskNumber}. Voulez-vous ajouter un système de suivi?`);
    } else {
        let message = `Analyse de l'avancement de T${taskNumber}:\n\n`;
        progressElements.forEach((el, i) => {
            const value = el.value || el.textContent || '0';
            message += `• Indicateur ${i + 1}: ${value}%\n`;
        });
        addMessage('bot', message);
    }
}

/**
 * NOUVEAU: Formate une date en français
 */
function formatDateFr(dateStr) {
    if (!dateStr) return 'Non définie';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateStr;
    }
}

/**
 * SUPPRIMÉ - Maintenant géré par chat-assistant.js
 * La fonction sendMessage est gérée par le module chat-assistant
 */

/**
 * ===== FONCTIONS v2.0: BRIEFING QUOTIDIEN =====
 */

/**
 * Affiche le briefing quotidien
 */
async function showDailyBriefing() {
    try {
        console.log('[BRIEFING] Génération et affichage du briefing...');

        // Générer le briefing
        const briefingData = await dailyBriefing.generate();

        // Créer l'HTML du briefing
        const briefingHTML = createBriefingHTML(briefingData);

        // Afficher dans une modale
        showBriefingModal(briefingHTML, briefingData);

        console.log('[BRIEFING] Briefing affiché avec succès');
    } catch (error) {
        console.error('[BRIEFING] Erreur lors de l\'affichage du briefing:', error);
    }
}

/**
 * Crée le HTML du briefing
 */
function createBriefingHTML(data) {
    const { greeting, summary, todayTasks, urgentItems, recommendations, metrics } = data;

    // Déterminer la couleur du mood
    const moodColors = {
        critical: '#dc2626',
        warning: '#ea580c',
        good: '#16a34a',
        calm: '#0284c7'
    };
    const moodColor = moodColors[summary.mood] || '#64748b';

    return `
        <div class="daily-briefing-content">
            <!-- En-tête -->
            <div class="briefing-header">
                <div class="briefing-greeting">
                    <span class="greeting-emoji">${greeting.emoji}</span>
                    <h2>${greeting.text}!</h2>
                </div>
                <p class="briefing-date">${dailyBriefing.formatDate(data.date)}</p>
            </div>

            ${summary.urgentAlerts ? `
                <div class="briefing-alert">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-message">${summary.urgentAlerts}</div>
                </div>
            ` : ''}

            <!-- Résumé -->
            <div class="briefing-summary">
                <h3><span class="section-icon">📊</span> Résumé du jour</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${summary.totalTasks}</div>
                        <div class="metric-label">Tâches du jour</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" style="color: #16a34a">${summary.completedTasks}</div>
                        <div class="metric-label">Complétées</div>
                    </div>
                    <div class="metric-card ${summary.overdueTasks > 0 ? 'metric-warning' : ''}">
                        <div class="metric-value" style="color: ${summary.overdueTasks > 0 ? '#dc2626' : '#64748b'}">${summary.overdueTasks}</div>
                        <div class="metric-label">En retard</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.meetings}</div>
                        <div class="metric-label">Réunions</div>
                    </div>
                </div>
            </div>

            <!-- Éléments urgents -->
            ${urgentItems.length > 0 ? `
                <div class="briefing-urgent">
                    <h3><span class="section-icon">🚨</span> Éléments urgents</h3>
                    <div class="urgent-list">
                        ${urgentItems.slice(0, 3).map(item => `
                            <div class="urgent-item severity-${item.severity}">
                                <div class="urgent-icon">${item.icon}</div>
                                <div class="urgent-content">
                                    <div class="urgent-message">${item.message}</div>
                                    ${item.details ? `
                                        <div class="urgent-details">
                                            ${item.details.slice(0, 3).map(d => `
                                                <div class="detail-item">• ${d.title || d.text || d}</div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Tâches d'aujourd'hui -->
            ${todayTasks.length > 0 ? `
                <div class="briefing-tasks">
                    <h3><span class="section-icon">📅</span> Vos tâches d'aujourd'hui</h3>
                    <div class="task-list">
                        ${todayTasks.slice(0, 5).map(task => `
                            <div class="task-item">
                                <input type="checkbox" ${task.statut === 'completed' ? 'checked disabled' : ''}>
                                <span class="task-title">${task.titre}</span>
                                ${task.priorite ? `<span class="task-priority priority-${task.priorite}">${task.priorite}</span>` : ''}
                            </div>
                        `).join('')}
                        ${todayTasks.length > 5 ? `
                            <div class="task-more">...et ${todayTasks.length - 5} autre(s)</div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Recommandations -->
            ${recommendations.length > 0 ? `
                <div class="briefing-recommendations">
                    <h3><span class="section-icon">💡</span> Recommandations</h3>
                    <div class="recommendation-list">
                        ${recommendations.slice(0, 3).map(rec => `
                            <div class="recommendation-item">
                                <div class="rec-icon">${rec.icon || '💡'}</div>
                                <div class="rec-content">
                                    <div class="rec-title">${rec.title || rec.message}</div>
                                    ${rec.suggestion ? `<div class="rec-suggestion">${rec.suggestion}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Métriques du projet -->
            <div class="briefing-metrics">
                <h3><span class="section-icon">📈</span> État du projet</h3>
                <div class="progress-section">
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${metrics.completionRate}%; background: ${moodColor}"></div>
                        </div>
                        <div class="progress-label">${metrics.completionRate}% complété</div>
                    </div>
                    ${metrics.daysToStart !== null ? `
                        <div class="days-remaining">
                            <span class="days-number">${metrics.daysToStart}</span>
                            <span class="days-label">jours avant le début de l'arrêt</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Actions rapides -->
            <div class="briefing-actions">
                <h3><span class="section-icon">⚡</span> Actions rapides</h3>
                <div class="quick-actions-grid">
                    ${data.quickActions.map(action => `
                        <button class="quick-action-btn" onclick="window.assistantQuickAction('${action.id}')">
                            <span class="action-icon">${action.icon}</span>
                            <span class="action-label">${action.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Affiche le briefing dans une modale
 */
function showBriefingModal(html, data) {
    // Créer la modale
    const modal = document.createElement('div');
    modal.className = 'daily-briefing-modal';
    modal.innerHTML = `
        <div class="briefing-overlay" onclick="this.parentElement.remove()"></div>
        <div class="briefing-modal-content">
            <div class="briefing-modal-header">
                <h2>📋 Briefing Quotidien</h2>
                <button class="briefing-close" onclick="this.closest('.daily-briefing-modal').remove()">✕</button>
            </div>
            <div class="briefing-modal-body">
                ${html}
            </div>
            <div class="briefing-modal-footer">
                <button class="btn-primary" onclick="this.closest('.daily-briefing-modal').remove()">
                    Commencer la journée
                </button>
                <button class="btn-secondary" onclick="window.assistantGenerateDailyReport()">
                    📄 Générer un rapport PDF
                </button>
            </div>
        </div>
    `;

    // Ajouter au DOM
    document.body.appendChild(modal);

    // Animation d'entrée
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

/**
 * Action rapide du briefing
 */
window.assistantQuickAction = function(actionId) {
    const actions = {
        'view_today': () => window.switchToPage('summary'),
        'view_overdue': () => window.switchToPage('summary'),
        'view_planning': () => window.switchToPage('timeline'),
        'view_meetings': () => window.switchToPage('bilan-reunions')
    };

    if (actions[actionId]) {
        actions[actionId]();
        // Fermer le briefing
        document.querySelector('.daily-briefing-modal')?.remove();
    }
};

/**
 * Génère un rapport quotidien PDF
 */
window.assistantGenerateDailyReport = async function() {
    try {
        console.log('[ASSISTANT] Génération du rapport quotidien...');

        const briefingData = dailyBriefing.briefingData;
        const { email, pdf } = await documentGenerator.generateDailyReport(briefingData);

        // Télécharger le PDF
        const filename = `rapport-quotidien-${new Date().toISOString().split('T')[0]}.pdf`;
        documentGenerator.downloadPDF(pdf, filename);

        console.log('[ASSISTANT] Rapport généré et téléchargé:', filename);

        // Notification
        addMessage('bot', `✅ Rapport quotidien généré et téléchargé: ${filename}`);
        if (!assistantState.isOpen) togglePanel();
    } catch (error) {
        console.error('[ASSISTANT] Erreur génération rapport:', error);
        addMessage('bot', `❌ Erreur lors de la génération du rapport: ${error.message}`);
        if (!assistantState.isOpen) togglePanel();
    }
};

/**
 * ===== ACTIONS D'INTERVENTION AUTOMATIQUE =====
 */

/**
 * Propose de corriger automatiquement les champs vides
 */
window.assistantAutoFill = function(pageId, fieldName, suggestedValue) {
    const message = `Je peux remplir automatiquement le champ "${fieldName}" avec la valeur suggérée: "${suggestedValue}". Voulez-vous que je le fasse?`;
    const actions = [
        {
            label: "Oui, remplir",
            primary: true,
            action: () => {
                const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
                if (field) {
                    field.value = suggestedValue;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    addMessage('bot', `✅ Champ "${fieldName}" rempli avec succès!`);
                } else {
                    addMessage('bot', `❌ Impossible de trouver le champ "${fieldName}".`);
                }
            }
        },
        {
            label: "Non, merci",
            primary: false,
            action: () => addMessage('bot', "D'accord, je n'ai rien modifié.")
        }
    ];

    if (!assistantState.isOpen) togglePanel();
    addMessageWithActions('bot', message, actions);
};

/**
 * Propose de naviguer vers une autre page pour copier une valeur
 */
window.assistantSuggestValueFrom = function(currentPage, targetPage, fieldName) {
    const message = `Le champ "${fieldName}" pourrait être lié à des données de la page "${targetPage}". Voulez-vous y aller pour vérifier?`;
    const actions = [
        {
            label: "Aller à " + targetPage,
            primary: true,
            action: () => {
                addMessage('bot', `Navigation vers ${targetPage}...`);
                setTimeout(() => window.switchToPage(targetPage), 500);
            }
        },
        {
            label: "Rester ici",
            primary: false,
            action: () => {}
        }
    ];

    if (!assistantState.isOpen) togglePanel();
    addMessageWithActions('bot', message, actions);
};

/**
 * Détecte et propose de corriger une date incohérente
 */
window.assistantFixDate = function(fieldName, currentDate, suggestedDate, reason) {
    const message = `⚠️ La date "${currentDate}" dans "${fieldName}" semble incohérente.\n\n` +
        `Raison: ${reason}\n\n` +
        `Je suggère: ${suggestedDate}\n\n` +
        `Voulez-vous que je corrige?`;

    const actions = [
        {
            label: "Corriger",
            primary: true,
            action: () => {
                const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
                if (field) {
                    field.value = suggestedDate;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    addMessage('bot', `✅ Date corrigée: ${suggestedDate}`);
                } else {
                    addMessage('bot', `❌ Impossible de trouver le champ.`);
                }
            }
        },
        {
            label: "Garder la date actuelle",
            primary: false,
            action: () => addMessage('bot', "D'accord, date conservée.")
        }
    ];

    if (!assistantState.isOpen) togglePanel();
    addMessageWithActions('bot', message, actions);
};

/**
 * Expose une fonction globale pour que l'assistant puisse suggérer des améliorations depuis le HTML
 */
window.assistantSuggest = function(suggestion) {
    if (!assistantState.isOpen) togglePanel();
    addMessage('bot', suggestion);
    incrementBadge();
};

/**
 * Fonction pour forcer une analyse de la page actuelle
 */
window.assistantAnalyzePage = function() {
    const currentPage = assistantState.currentPage;
    if (currentPage) {
        analyzePageContext(currentPage);
        if (!assistantState.isOpen) togglePanel();
        addMessage('bot', `Analyse de la page "${currentPage}" en cours...`);
    }
};

// Exporter les fonctions publiques
export {
    togglePanel,
    addMessage,
    addMessageWithActions,
    analyzeAndSuggest
};
