/**
 * INTERACTIVE ASSISTANT - MODULE D'INTERACTION EN TEMPS RÉEL
 *
 * Ce module rend l'assistant VRAIMENT interactif:
 * - Notifications toast quand l'utilisateur change de page
 * - Suggestions automatiques basées sur ce que vous tapez
 * - Surveillance des formulaires et aide contextuelle
 * - Réactions visuelles aux actions de l'utilisateur
 */

/**
 * État de l'assistant interactif
 */
const interactiveState = {
    currentPage: null,
    watchedInputs: new Map(),
    activeToasts: [],
    suggestionQueue: [],
    userActivity: {
        lastAction: null,
        lastInput: null,
        actionCount: 0
    }
};

/**
 * Initialise le système interactif
 */
export function initInteractiveAssistant() {
    console.log('[INTERACTIVE] Initialisation du système interactif...');

    // Surveiller les changements de page
    setupPageChangeNotifications();

    // Surveiller les formulaires
    setupFormMonitoring();

    // Surveiller les clics
    setupClickMonitoring();

    // Démarrer les suggestions proactives
    startProactiveSuggestions();

    console.log('[INTERACTIVE] ✅ Système interactif actif');
}

/**
 * Configure les notifications de changement de page
 */
function setupPageChangeNotifications() {
    window.addEventListener('pageChanged', (e) => {
        const pageId = e.detail.pageId;
        interactiveState.currentPage = pageId;

        // Notification visuelle
        showToast({
            title: '📄 Page changée',
            message: `Analyse de la page ${getPageTitle(pageId)}...`,
            type: 'info',
            duration: 3000
        });

        // Analyser la nouvelle page
        setTimeout(() => {
            analyzeNewPage(pageId);
        }, 500);
    });
}

/**
 * Configure la surveillance des formulaires
 */
function setupFormMonitoring() {
    // Surveiller tous les inputs, textareas et selects
    document.addEventListener('focus', (e) => {
        if (e.target.matches('input, textarea, select')) {
            handleInputFocus(e.target);
        }
    }, true);

    document.addEventListener('input', (e) => {
        if (e.target.matches('input, textarea')) {
            handleInputChange(e.target);
        }
    }, true);

    // Surveiller les soumissions de formulaires
    document.addEventListener('submit', (e) => {
        if (e.target.tagName === 'FORM') {
            handleFormSubmit(e);
        }
    }, true);
}

/**
 * Configure la surveillance des clics
 */
function setupClickMonitoring() {
    document.addEventListener('click', (e) => {
        interactiveState.userActivity.lastAction = {
            type: 'click',
            element: e.target.tagName,
            timestamp: new Date()
        };
        interactiveState.userActivity.actionCount++;

        // Détecter les actions importantes
        if (e.target.closest('button[type="submit"]')) {
            console.log('[INTERACTIVE] Soumission de formulaire détectée');
        }
    });
}

/**
 * Gère le focus sur un input
 */
function handleInputFocus(input) {
    const fieldName = input.name || input.id || input.placeholder;
    const fieldType = input.type || 'text';

    console.log(`[INTERACTIVE] Focus sur: ${fieldName} (${fieldType})`);

    // Obtenir des suggestions contextuelles
    const suggestions = getInputSuggestions(input);

    if (suggestions.length > 0) {
        // Afficher une notification avec suggestions
        showToast({
            title: '💡 Suggestions disponibles',
            message: `J'ai ${suggestions.length} suggestion(s) pour ce champ`,
            type: 'info',
            duration: 4000,
            actions: [{
                label: 'Voir',
                callback: () => showInputSuggestions(input, suggestions)
            }]
        });
    }
}

/**
 * Gère les changements dans un input
 */
function handleInputChange(input) {
    const value = input.value;
    interactiveState.userActivity.lastInput = {
        field: input.name || input.id,
        value: value,
        timestamp: new Date()
    };

    // Surveiller ce input
    if (!interactiveState.watchedInputs.has(input)) {
        interactiveState.watchedInputs.set(input, {
            initialValue: value,
            changes: 0
        });
    } else {
        const watched = interactiveState.watchedInputs.get(input);
        watched.changes++;
    }

    // Suggestions en temps réel basées sur la valeur
    if (value.length > 3) {
        provideLiveAssistance(input, value);
    }
}

/**
 * Gère la soumission de formulaire
 */
function handleFormSubmit(e) {
    const form = e.target;
    console.log('[INTERACTIVE] Formulaire soumis:', form.id || form.name);

    showToast({
        title: '✅ Formulaire envoyé',
        message: 'Je surveille les modifications...',
        type: 'success',
        duration: 3000
    });
}

/**
 * Analyse une nouvelle page
 */
function analyzeNewPage(pageId) {
    console.log(`[INTERACTIVE] Analyse de la page: ${pageId}`);

    const analysis = {
        hasForm: document.querySelector('form') !== null,
        inputCount: document.querySelectorAll('input, textarea').length,
        buttonCount: document.querySelectorAll('button').length,
        tables: document.querySelectorAll('table').length
    };

    // Suggestions basées sur la page
    const suggestions = [];

    if (pageId.startsWith('detail-t')) {
        const taskId = pageId.replace('detail-t', '');
        suggestions.push({
            icon: '🔍',
            text: `Analyser les liens de la tâche T${taskId}`,
            action: () => analyzeTaskLinks(taskId)
        });
        suggestions.push({
            icon: '📝',
            text: `Aide à la rédaction pour cette tâche`,
            action: () => showWritingHelp(taskId)
        });
    }

    if (analysis.hasForm) {
        suggestions.push({
            icon: '✍️',
            text: `Activer l'assistance à la saisie`,
            action: () => enableFormAssistance()
        });
    }

    // Afficher les suggestions
    if (suggestions.length > 0) {
        setTimeout(() => {
            showSuggestionsToast(suggestions);
        }, 1500);
    }
}

/**
 * Obtient des suggestions pour un input
 */
function getInputSuggestions(input) {
    const suggestions = [];
    const fieldName = (input.name || input.id || '').toLowerCase();
    const fieldType = input.type;

    // Suggestions basées sur le nom du champ
    if (fieldName.includes('description') || fieldName.includes('desc')) {
        suggestions.push({
            text: 'Tâche liée à l\'arrêt annuel 2026',
            value: 'Cette tâche fait partie des travaux prévus pour l\'arrêt annuel 2026.'
        });
        suggestions.push({
            text: 'Intervention de maintenance',
            value: 'Intervention de maintenance préventive nécessaire pour assurer le bon fonctionnement.'
        });
    }

    if (fieldName.includes('responsable') || fieldName.includes('resp')) {
        suggestions.push({
            text: 'Chef de projet',
            value: 'Chef de projet'
        });
        suggestions.push({
            text: 'Équipe technique',
            value: 'Équipe technique'
        });
    }

    if (fieldName.includes('objectif') || fieldName.includes('goal')) {
        suggestions.push({
            text: 'Objectif de sécurité',
            value: 'Garantir la sécurité et la conformité des équipements'
        });
        suggestions.push({
            text: 'Objectif de performance',
            value: 'Optimiser les performances et réduire les temps d\'arrêt'
        });
    }

    if (fieldType === 'date') {
        suggestions.push({
            text: 'Date de l\'arrêt',
            value: '2026-01-15'
        });
    }

    return suggestions;
}

/**
 * Fournit une assistance en temps réel
 */
function provideLiveAssistance(input, value) {
    const fieldName = (input.name || input.id || '').toLowerCase();

    // Détecter si c'est une description et proposer d'améliorer
    if (fieldName.includes('description') && value.length > 20) {
        // Vérifier la qualité du texte
        const hasCapital = /^[A-Z]/.test(value);
        const hasPunctuation = /[.!?]$/.test(value);

        if (!hasCapital || !hasPunctuation) {
            showToast({
                title: '✍️ Amélioration suggérée',
                message: 'Je peux améliorer ce texte pour vous',
                type: 'info',
                duration: 5000,
                actions: [{
                    label: 'Améliorer',
                    callback: () => improveText(input)
                }]
            });
        }
    }

    // Détecter les dates importantes
    if (value.includes('2026')) {
        console.log('[INTERACTIVE] Date importante détectée: 2026');
    }
}

/**
 * Affiche une notification toast
 */
function showToast(options) {
    const {
        title,
        message,
        type = 'info', // info, success, warning, error
        duration = 4000,
        actions = []
    } = options;

    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `assistant-toast type-${type}`;
    toast.innerHTML = `
        <div class="assistant-toast-icon">${getToastIcon(type)}</div>
        <div class="assistant-toast-content">
            <div class="assistant-toast-title">${title}</div>
            <div class="assistant-toast-message">${message}</div>
            ${actions.length > 0 ? `
                <div class="assistant-toast-actions">
                    ${actions.map((action, i) => `
                        <button class="assistant-toast-action-btn" data-action="${i}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
        <button class="assistant-toast-close">×</button>
    `;

    // Ajouter au DOM
    document.body.appendChild(toast);
    interactiveState.activeToasts.push(toast);

    // Événements
    toast.querySelector('.assistant-toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    actions.forEach((action, i) => {
        const btn = toast.querySelector(`[data-action="${i}"]`);
        if (btn) {
            btn.addEventListener('click', () => {
                action.callback();
                removeToast(toast);
            });
        }
    });

    // Auto-remove après duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
}

/**
 * Retire un toast
 */
function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        const index = interactiveState.activeToasts.indexOf(toast);
        if (index > -1) {
            interactiveState.activeToasts.splice(index, 1);
        }
    }, 300);
}

/**
 * Obtient l'icône pour un type de toast
 */
function getToastIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    return icons[type] || 'ℹ️';
}

/**
 * Obtient le titre d'une page
 */
function getPageTitle(pageId) {
    const titles = {
        'dashboard': 'Tableau de bord',
        'summary': 'Vue d\'ensemble',
        'preparation': 'Préparation',
        'bilan-reunions': 'Réunions'
    };

    if (pageId.startsWith('detail-t')) {
        const taskId = pageId.replace('detail-t', '');
        return `Tâche T${taskId}`;
    }

    return titles[pageId] || pageId;
}

/**
 * Affiche des suggestions dans un toast
 */
function showSuggestionsToast(suggestions) {
    const toast = document.createElement('div');
    toast.className = 'assistant-toast type-info suggestions-toast';
    toast.innerHTML = `
        <div class="assistant-toast-icon">💡</div>
        <div class="assistant-toast-content">
            <div class="assistant-toast-title">Suggestions disponibles</div>
            <div class="suggestions-list">
                ${suggestions.map((sug, i) => `
                    <button class="suggestion-btn" data-sug="${i}">
                        <span class="sug-icon">${sug.icon}</span>
                        <span class="sug-text">${sug.text}</span>
                    </button>
                `).join('')}
            </div>
        </div>
        <button class="assistant-toast-close">×</button>
    `;

    document.body.appendChild(toast);

    // Événements
    toast.querySelector('.assistant-toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    suggestions.forEach((sug, i) => {
        const btn = toast.querySelector(`[data-sug="${i}"]`);
        if (btn) {
            btn.addEventListener('click', () => {
                sug.action();
                removeToast(toast);
            });
        }
    });

    interactiveState.activeToasts.push(toast);
}

/**
 * Démarre les suggestions proactives
 */
function startProactiveSuggestions() {
    // Vérifier toutes les 30 secondes si l'utilisateur a besoin d'aide
    setInterval(() => {
        const timeSinceLastAction = Date.now() -
            (interactiveState.userActivity.lastAction?.timestamp?.getTime() || Date.now());

        // Si l'utilisateur est inactif depuis 2 minutes, proposer de l'aide
        if (timeSinceLastAction > 2 * 60 * 1000 && interactiveState.userActivity.actionCount > 0) {
            if (interactiveState.activeToasts.length === 0) {
                showToast({
                    title: '👋 Besoin d\'aide?',
                    message: 'Je suis là si vous avez besoin d\'assistance',
                    type: 'info',
                    duration: 5000
                });
            }
        }
    }, 30000);
}

/**
 * Actions spécifiques
 */
function analyzeTaskLinks(taskId) {
    console.log(`[INTERACTIVE] Analyse des liens pour T${taskId}`);
    if (window.assistantModules?.dataAnalyzer) {
        const related = window.assistantModules.dataAnalyzer.findRelatedData(`task:t${taskId}`);
        console.log('Relations trouvées:', related);

        showToast({
            title: '🔍 Analyse terminée',
            message: `Trouvé ${related.direct?.length || 0} relation(s) directe(s)`,
            type: 'success',
            duration: 5000
        });
    }
}

function showWritingHelp(taskId) {
    console.log(`[INTERACTIVE] Aide à la rédaction pour T${taskId}`);
    showToast({
        title: '✍️ Assistant de rédaction',
        message: 'Je peux vous aider à rédiger la description de cette tâche',
        type: 'info',
        duration: 6000,
        actions: [{
            label: 'Obtenir des suggestions',
            callback: () => {
                if (window.assistantModules?.textAssistant) {
                    const suggestions = window.assistantModules.textAssistant.suggestText('description');
                    console.log('Suggestions:', suggestions);
                }
            }
        }]
    });
}

function enableFormAssistance() {
    console.log('[INTERACTIVE] Assistance formulaire activée');
    showToast({
        title: '✅ Assistance activée',
        message: 'Je vais vous aider à remplir ce formulaire',
        type: 'success',
        duration: 3000
    });
}

function showInputSuggestions(input, suggestions) {
    console.log('[INTERACTIVE] Affichage des suggestions pour:', input.name);
    console.log('Suggestions:', suggestions);

    // Créer un popup de suggestions près de l'input
    const rect = input.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'input-suggestions-popup';
    popup.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 5}px;
        left: ${rect.left}px;
        background: white;
        border: 2px solid #667eea;
        border-radius: 12px;
        padding: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
    `;

    popup.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px; color: #667eea;">
            💡 Suggestions:
        </div>
        ${suggestions.map((sug, i) => `
            <button class="sug-option" data-index="${i}" style="
                display: block;
                width: 100%;
                padding: 8px;
                margin-bottom: 5px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#667eea'; this.style.color='white';"
               onmouseout="this.style.background='#f8f9fa'; this.style.color='black';">
                ${sug.text}
            </button>
        `).join('')}
    `;

    document.body.appendChild(popup);

    // Événements
    suggestions.forEach((sug, i) => {
        const btn = popup.querySelector(`[data-index="${i}"]`);
        if (btn) {
            btn.addEventListener('click', () => {
                input.value = sug.value || sug.text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                document.body.removeChild(popup);
            });
        }
    });

    // Fermer si on clique ailleurs
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!popup.contains(e.target) && e.target !== input) {
                if (popup.parentNode) {
                    document.body.removeChild(popup);
                }
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 100);
}

function improveText(input) {
    if (window.assistantModules?.textAssistant) {
        const improved = window.assistantModules.textAssistant.improveText(input.value, {
            fixPunctuation: true,
            improvePhrasing: true,
            professionalFormat: true
        });
        input.value = improved;
        input.dispatchEvent(new Event('input', { bubbles: true }));

        showToast({
            title: '✨ Texte amélioré',
            message: 'J\'ai amélioré votre texte',
            type: 'success',
            duration: 3000
        });
    }
}

// Animation CSS pour les toasts
const style = document.createElement('style');
style.textContent = `
@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

.assistant-toast-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.assistant-toast-action-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: #667eea;
    color: white;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 600;
    transition: all 0.2s ease;
}

.assistant-toast-action-btn:hover {
    background: #764ba2;
    transform: translateY(-1px);
}

.suggestions-toast {
    max-width: 400px !important;
}

.suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
}

.suggestion-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
}

.suggestion-btn:hover {
    background: #f8f9fa;
    border-color: #667eea;
    transform: translateX(3px);
}

.sug-icon {
    font-size: 1.2em;
}

.sug-text {
    flex: 1;
    font-size: 0.9em;
}
`;
document.head.appendChild(style);
