/**
 * CHAT ASSISTANT - SYSTÈME DE CONVERSATION INTELLIGENTE
 *
 * Permet à l'utilisateur de poser des questions à l'assistant
 * et d'obtenir des réponses intelligentes contextuelles
 */

/**
 * Initialise le système de chat
 */
export function initChatAssistant(aiEngine, textAssistant, dataAnalyzer) {
    console.log('[CHAT] Initialisation du système de chat...');

    const input = document.getElementById('assistant-input');
    const sendBtn = document.getElementById('assistant-send');

    if (!input || !sendBtn) {
        console.error('[CHAT] Éléments de chat non trouvés');
        return;
    }

    // Gérer l'envoi de messages
    const handleSend = async () => {
        const message = input.value.trim();
        if (!message) return;

        // Afficher le message de l'utilisateur
        addMessage('user', message);
        input.value = '';

        // Afficher un indicateur de saisie
        showTypingIndicator();

        // Attendre un peu pour simuler la réflexion
        await new Promise(resolve => setTimeout(resolve, 800));

        // Obtenir et afficher la réponse
        const response = await getAssistantResponse(message, aiEngine, textAssistant, dataAnalyzer);
        hideTypingIndicator();
        addMessage('bot', response.text, response.actions);
    };

    // Événements
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    console.log('[CHAT] ✅ Système de chat actif');
}

/**
 * Obtient une réponse intelligente basée sur le message
 */
async function getAssistantResponse(message, aiEngine, textAssistant, dataAnalyzer) {
    const msg = message.toLowerCase();

    // QUESTIONS SUR LE PROJET
    if (msg.includes('combien') && (msg.includes('tâche') || msg.includes('tache'))) {
        const status = await aiEngine.getProjectStatus();
        return {
            text: `📊 **État du projet:**

• Total de tâches: ${status.totalTasks}
• Tâches complétées: ${status.completedTasks}
• Tâches en cours: ${status.inProgressTasks}
• Tâches en retard: ${status.overdueTasks}
• Taux de complétion: ${status.completionRate}%

${status.overdueTasks > 0 ? '⚠️ Vous avez des tâches en retard. Voulez-vous les voir?' : '✅ Vous êtes à jour!'}`,
            actions: status.overdueTasks > 0 ? [{
                label: 'Voir les retards',
                action: () => showOverdueTasks()
            }] : []
        };
    }

    // QUESTIONS SUR LES TÂCHES URGENTES
    if (msg.includes('urgent') || msg.includes('priorit')) {
        const urgent = await aiEngine.getUrgentTasks();
        if (urgent.length === 0) {
            return {
                text: '✅ Aucune tâche urgente pour le moment! Tout va bien.',
                actions: []
            };
        }

        return {
            text: `⚠️ **${urgent.length} tâche(s) urgente(s) détectée(s):**

${urgent.slice(0, 3).map((t, i) =>
    `${i + 1}. **${t.title}**
   Priorité: ${t.priority}
   ${t.reason}`
).join('\n\n')}

${urgent.length > 3 ? `\n... et ${urgent.length - 3} autre(s)` : ''}`,
            actions: [{
                label: 'Voir toutes les urgences',
                action: () => showAllUrgent(urgent)
            }]
        };
    }

    // QUESTIONS SUR LES DATES
    if (msg.includes('date') || msg.includes('quand') || msg.includes('2026')) {
        return {
            text: `📅 **Dates importantes de l'arrêt annuel 2026:**

• Date de début: 15 janvier 2026
• Phase de préparation: Décembre 2025 - Janvier 2026
• Durée prévue: 4-6 semaines
• Retour en production: Février 2026

Je garde toujours ces dates en mémoire pour vous rappeler les échéances!`,
            actions: [{
                label: 'Voir le planning complet',
                action: () => navigateTo('planning')
            }]
        };
    }

    // AIDE À LA RÉDACTION
    if (msg.includes('rédiger') || msg.includes('rediger') || msg.includes('écrire') || msg.includes('ecrire') || msg.includes('texte')) {
        return {
            text: `✍️ **Je peux vous aider à rédiger:**

• Descriptions de tâches
• Comptes-rendus de réunion
• Emails professionnels
• Rapports d'avancement

Dites-moi ce que vous voulez rédiger et je vous proposerai des suggestions!`,
            actions: [
                {
                    label: 'Description de tâche',
                    action: () => helpWithTaskDescription()
                },
                {
                    label: 'Compte-rendu',
                    action: () => helpWithReport()
                }
            ]
        };
    }

    // QUESTIONS SUR LES LIENS/RELATIONS
    if (msg.includes('lien') || msg.includes('relation') || msg.includes('connecté') || msg.includes('lie')) {
        const stats = dataAnalyzer.getGraphStats();
        return {
            text: `🔗 **Analyse des liens dans votre projet:**

• Total de connexions: ${stats.totalEdges}
• Éléments analysés: ${stats.totalNodes}
• Tâches liées à des équipements: ${stats.taskEquipmentLinks || 0}
• Tâches liées à des équipes: ${stats.taskTeamLinks || 0}

Je peux analyser les liens pour n'importe quelle tâche spécifique!`,
            actions: [{
                label: 'Analyser une tâche',
                action: () => promptForTaskAnalysis()
            }]
        };
    }

    // GÉNÉRER UN RAPPORT/PDF
    if (msg.includes('rapport') || msg.includes('pdf') || msg.includes('document') || msg.includes('genere') || msg.includes('génère')) {
        return {
            text: `📄 **Je peux générer ces documents:**

• Rapport quotidien (PDF)
• Rapport d'avancement
• Liste des tâches urgentes
• Compte-rendu de réunion
• Email de rappel

Quel document voulez-vous générer?`,
            actions: [
                {
                    label: 'Rapport quotidien',
                    action: () => generateDailyReport()
                },
                {
                    label: 'Liste urgences',
                    action: () => generateUrgentList()
                }
            ]
        };
    }

    // AIDE / COMMANDES
    if (msg.includes('aide') || msg.includes('help') || msg.includes('commande') || msg.includes('que peux') || msg.includes('quoi faire')) {
        return {
            text: `🤖 **Voici ce que je peux faire pour vous:**

**📊 Analyses:**
• "Combien de tâches?"
• "Quelles sont les tâches urgentes?"
• "Analyser les liens"

**✍️ Rédaction:**
• "Aide-moi à rédiger..."
• "Améliore ce texte..."
• "Suggère une description"

**📄 Documents:**
• "Génère un rapport"
• "Crée un PDF"

**📅 Planning:**
• "Quelles sont les dates importantes?"
• "Tâches de cette semaine"

**🔍 Recherche:**
• "Trouve la tâche T10"
• "Montre les équipements"

Posez-moi n'importe quelle question!`,
            actions: []
        };
    }

    // RECHERCHE DE TÂCHE SPÉCIFIQUE
    const taskMatch = msg.match(/t\s?(\d+)/i);
    if (taskMatch) {
        const taskNum = taskMatch[1];
        return {
            text: `🔍 Recherche de la tâche T${taskNum}...

Je vais analyser cette tâche pour vous:
• Statut actuel
• Relations avec d'autres éléments
• Équipements liés
• Équipe responsable`,
            actions: [{
                label: `Voir tâche T${taskNum}`,
                action: () => navigateTo(`detail-t${taskNum}`)
            }]
        };
    }

    // AMÉLIORER/CORRIGER UN TEXTE
    if (msg.includes('améliore') || msg.includes('ameliore') || msg.includes('corrige') || msg.includes('mieux')) {
        return {
            text: `✨ **Amélioration de texte:**

Pour améliorer un texte:
1. Allez dans le champ que vous voulez améliorer
2. Tapez votre texte
3. Je vous proposerai automatiquement des améliorations

Ou donnez-moi le texte ici et je l'améliorerai pour vous!`,
            actions: []
        };
    }

    // RÉPONSE PAR DÉFAUT - ANALYSE DU MESSAGE
    return {
        text: `Je vous ai bien compris. Vous demandez: "${message}"

📌 **Voici comment je peux vous aider:**

Je peux analyser votre projet, trouver des tâches, générer des rapports, vous aider à rédiger, et bien plus!

Essayez:
• "Quelles sont les tâches urgentes?"
• "Aide-moi à rédiger"
• "Génère un rapport PDF"
• "Combien de tâches?"
• "Quelles sont les dates importantes?"`,
        actions: [{
            label: 'Voir toutes les commandes',
            action: () => showAllCommands()
        }]
    };
}

/**
 * Ajoute un message dans le chat
 */
function addMessage(type, text, actions = []) {
    const messagesContainer = document.getElementById('assistant-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `assistant-message assistant-${type}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Convertir les markdown en HTML basique
    const formattedText = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-avatar">${type === 'bot' ? '🤖' : '👤'}</div>
        <div class="message-content">
            <div class="message-text">
                ${formattedText}
            </div>
            ${actions && actions.length > 0 ? `
                <div class="message-action-card">
                    <div class="message-action-buttons">
                        ${actions.map((action, i) => `
                            <button class="message-action-btn primary" data-action="${i}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="message-time">${timeStr}</div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);

    // Ajouter les événements aux boutons d'action
    if (actions && actions.length > 0) {
        actions.forEach((action, i) => {
            const btn = messageDiv.querySelector(`[data-action="${i}"]`);
            if (btn && action.action) {
                btn.addEventListener('click', action.action);
            }
        });
    }

    // Scroll vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Affiche l'indicateur de saisie
 */
function showTypingIndicator() {
    const messagesContainer = document.getElementById('assistant-messages');
    if (!messagesContainer) return;

    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'assistant-message assistant-bot';
    indicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="message-text">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;

    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Cache l'indicateur de saisie
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Actions spécifiques
 */
function showOverdueTasks() {
    console.log('[CHAT] Affichage des tâches en retard');
    addMessage('bot', '📋 Chargement des tâches en retard...');
    // Implémenter l'affichage réel
}

function showAllUrgent(urgent) {
    console.log('[CHAT] Affichage de toutes les urgences:', urgent);
}

function navigateTo(pageId) {
    console.log('[CHAT] Navigation vers:', pageId);
    // Utiliser le système de navigation existant
    if (window.loadPage) {
        window.loadPage(pageId);
    }
}

function helpWithTaskDescription() {
    const suggestions = [
        "Tâche de maintenance préventive dans le cadre de l'arrêt annuel 2026",
        "Intervention technique nécessaire pour assurer la sécurité et le bon fonctionnement",
        "Opération planifiée visant à optimiser les performances de l'équipement"
    ];

    addMessage('bot', `✍️ **Suggestions pour description de tâche:**

${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}

Cliquez dans un champ "Description" et ces suggestions apparaîtront automatiquement!`);
}

function helpWithReport() {
    addMessage('bot', `📝 **Template de compte-rendu:**

**Réunion du [DATE]**

**Participants:**
-

**Points abordés:**
1.
2.
3.

**Décisions prises:**
-

**Actions à mener:**
-

**Prochaine réunion:** [DATE]`);
}

function promptForTaskAnalysis() {
    addMessage('bot', '🔍 Tapez le numéro de la tâche à analyser (ex: "T10" ou "Tâche 10")');
}

function generateDailyReport() {
    console.log('[CHAT] Génération rapport quotidien');
    if (window.assistantGenerateDailyReport) {
        window.assistantGenerateDailyReport();
        addMessage('bot', '✅ Rapport quotidien généré! Le PDF devrait se télécharger automatiquement.');
    }
}

function generateUrgentList() {
    addMessage('bot', '📋 Génération de la liste des urgences en cours...');
}

function showAllCommands() {
    addMessage('bot', `🤖 **Liste complète des commandes:**

**PROJET:**
• Combien de tâches?
• État du projet
• Tâches complétées

**URGENCES:**
• Tâches urgentes
• Tâches prioritaires
• Tâches en retard

**RÉDACTION:**
• Aide-moi à rédiger
• Améliore ce texte
• Suggère une description

**DOCUMENTS:**
• Génère un rapport
• Crée un PDF
• Liste des urgences

**DATES:**
• Dates importantes
• Planning 2026
• Tâches de la semaine

**RECHERCHE:**
• Trouve tâche T10
• Analyser les liens
• Voir équipements

Essayez n'importe laquelle!`);
}

// Export pour accès global
export { addMessage };
