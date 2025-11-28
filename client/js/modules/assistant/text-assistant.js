/**
 * Assistant de Rédaction Intelligent
 * @module assistant/text-assistant
 *
 * Aide à rédiger et compléter des documents
 */

export class TextAssistant {
    constructor() {
        this.suggestions = new Map();
        this.history = [];
        this.templates = new Map();
        this.loadTemplates();
    }

    /**
     * Charge les templates de texte
     */
    loadTemplates() {
        // Template: Description de tâche
        this.templates.set('task-description', `
Cette tâche concerne {action} dans le cadre de l'arrêt annuel 2026.

Objectif:
{objective}

Prérequis:
- {prerequisite1}
- {prerequisite2}

Durée estimée: {duration}
Équipement requis: {equipment}
Sécurité: {safety_requirements}

Notes supplémentaires:
{additional_notes}
        `.trim());

        // Template: Compte rendu de réunion
        this.templates.set('meeting-notes', `
COMPTE RENDU DE RÉUNION

Date: {date}
Heure: {time}
Lieu: {location}
Participants: {participants}

ORDRE DU JOUR:
{agenda}

POINTS DISCUTÉS:
{discussion_points}

DÉCISIONS PRISES:
{decisions}

ACTIONS À SUIVRE:
{action_items}

PROCHAINE RÉUNION:
{next_meeting}

Rédigé par: {author}
        `.trim());

        // Template: Rapport d'avancement
        this.templates.set('progress-report', `
RAPPORT D'AVANCEMENT

Période: {period}
Phase: {phase}

RÉSUMÉ:
{summary}

TÂCHES COMPLÉTÉES:
{completed_tasks}

TÂCHES EN COURS:
{in_progress_tasks}

DIFFICULTÉS RENCONTRÉES:
{issues}

SOLUTIONS MISES EN ŒUVRE:
{solutions}

PROCHAINES ÉTAPES:
{next_steps}

RESSOURCES NÉCESSAIRES:
{resources_needed}

Taux d'avancement global: {completion_rate}%

Rédigé le {date}
        `.trim());

        // Template: Email professionnel
        this.templates.set('professional-email', `
Bonjour {recipient},

{opening}

{main_content}

{closing}

Cordialement,
{sender}

{signature}
        `.trim());

        // Template: Analyse de risques
        this.templates.set('risk-analysis', `
ANALYSE DE RISQUES

Tâche/Activité: {task_name}
Date d'évaluation: {date}
Évaluateur: {evaluator}

DESCRIPTION DE L'ACTIVITÉ:
{activity_description}

RISQUES IDENTIFIÉS:

1. {risk1_name}
   - Probabilité: {risk1_probability}
   - Impact: {risk1_impact}
   - Mesures de prévention: {risk1_prevention}

2. {risk2_name}
   - Probabilité: {risk2_probability}
   - Impact: {risk2_impact}
   - Mesures de prévention: {risk2_prevention}

NIVEAU DE RISQUE GLOBAL: {overall_risk_level}

RECOMMANDATIONS:
{recommendations}
        `.trim());

        console.log(`[TEXT ASSIST] ${this.templates.size} templates chargés`);
    }

    /**
     * Suggère du texte pour un champ
     */
    suggestText(fieldName, context = {}) {
        const suggestions = this.getSuggestions(fieldName, context);

        // Sauvegarder dans l'historique
        this.history.push({
            fieldName,
            context,
            suggestions,
            timestamp: new Date()
        });

        return suggestions;
    }

    /**
     * Génère des suggestions basées sur le contexte
     */
    getSuggestions(fieldName, context) {
        const suggestions = [];
        const field = fieldName.toLowerCase();

        // Suggestions pour les descriptions
        if (field.includes('description') || field.includes('notes') || field.includes('commentaire')) {
            suggestions.push(
                `Tâche liée à l'arrêt annuel ${context.year || '2026'}. Cette opération nécessite une coordination avec l'équipe ${context.team || 'maintenance'}.`,
                `Cette intervention fait partie de la phase "${context.phase || 'préparation'}" et requiert une attention particulière aux aspects sécurité.`,
                `Durée estimée: ${context.duration || '1-2 jours'}. Équipement requis: ${context.equipment || 'à définir selon le protocole standard'}.`,
                `Point d'attention: Vérifier la disponibilité des ressources et coordonner avec les autres équipes intervenant sur le site.`
            );
        }

        // Suggestions pour les objectifs
        if (field.includes('objectif') || field.includes('goal') || field.includes('but')) {
            suggestions.push(
                `Assurer la ${context.action || 'maintenance préventive'} dans les délais impartis tout en respectant les normes de sécurité`,
                `Garantir la qualité des interventions et minimiser les risques d'incidents`,
                `Optimiser l'utilisation des ressources et réduire les temps d'arrêt`,
                `Respecter le budget alloué et les contraintes environnementales`
            );
        }

        // Suggestions pour les risques
        if (field.includes('risque') || field.includes('risk') || field.includes('danger')) {
            suggestions.push(
                `Risque de dépassement de délai si les équipements ne sont pas disponibles à temps`,
                `Risque de sécurité lié aux travaux en hauteur et aux interventions sur équipements sous tension`,
                `Risque de conflit de ressources avec d'autres tâches planifiées simultanément`,
                `Risque météorologique pouvant impacter les travaux extérieurs`,
                `Risque de découverte de problèmes additionnels nécessitant des interventions non planifiées`
            );
        }

        // Suggestions pour les actions correctives
        if (field.includes('action') || field.includes('mesure') || field.includes('correction')) {
            suggestions.push(
                `Mettre en place un système de suivi quotidien avec points de contrôle réguliers`,
                `Renforcer la communication entre les équipes et organiser des briefings quotidiens`,
                `Prévoir des ressources de backup pour faire face aux imprévus`,
                `Documenter toutes les interventions et mettre à jour le planning en temps réel`,
                `Former les équipes aux procédures spécifiques et aux protocoles de sécurité`
            );
        }

        // Suggestions pour les recommandations
        if (field.includes('recommand') || field.includes('conseil') || field.includes('suggestion')) {
            suggestions.push(
                `Planifier une revue de planning hebdomadaire pour ajuster si nécessaire`,
                `Prévoir des marges de sécurité dans l'estimation des durées`,
                `Maintenir une communication transparente avec toutes les parties prenantes`,
                `Documenter les leçons apprises pour les futurs arrêts`,
                `Anticiper les besoins en ressources et équipements spécifiques`
            );
        }

        // Suggestions pour les conclusions
        if (field.includes('conclusion') || field.includes('synthes') || field.includes('resume')) {
            suggestions.push(
                `En synthèse, cette phase se déroule conformément au planning avec un taux d'avancement satisfaisant`,
                `Les objectifs fixés sont en cours de réalisation malgré quelques ajustements nécessaires`,
                `La coordination entre les équipes fonctionne de manière efficace`,
                `Les mesures de sécurité sont respectées et aucun incident majeur n'est à déplorer`
            );
        }

        return suggestions;
    }

    /**
     * Remplit automatiquement un template
     */
    async fillTemplate(templateName, data) {
        const template = this.templates.get(templateName);

        if (!template) {
            throw new Error(`Template ${templateName} introuvable`);
        }

        let filled = template;

        // Remplacer les variables connues
        Object.keys(data).forEach(key => {
            const value = data[key] || this.suggestValue(key, data);
            filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        // Compléter les sections manquantes
        filled = await this.completeMissingSections(filled, data);

        // Nettoyer les placeholders restants
        filled = filled.replace(/\{[^}]+\}/g, '[À compléter]');

        return filled;
    }

    /**
     * Suggère une valeur pour une variable manquante
     */
    suggestValue(key, context) {
        const suggestions = {
            'date': new Date().toLocaleDateString('fr-FR'),
            'time': new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            'responsable': context.team || 'À définir',
            'responsible': context.team || 'À définir',
            'priorite': context.urgent ? 'Haute' : 'Normale',
            'priority': context.urgent ? 'Haute' : 'Normale',
            'statut': 'En cours',
            'status': 'En cours',
            'duree': context.complexity === 'high' ? '2-3 jours' : '1 jour',
            'duration': context.complexity === 'high' ? '2-3 jours' : '1 jour',
            'author': 'Assistant Virtuel',
            'sender': 'Assistant Virtuel',
            'year': '2026'
        };

        return suggestions[key.toLowerCase()] || `[${key} à compléter]`;
    }

    /**
     * Complète les sections manquantes d'un document
     */
    async completeMissingSections(text, context) {
        // Analyser le texte pour détecter les sections vides
        // Cette fonction peut être étendue avec plus d'intelligence

        return text;
    }

    /**
     * Améliore un texte existant
     */
    improveText(text, options = {}) {
        let improved = text;

        // Corriger la ponctuation
        if (options.fixPunctuation !== false) {
            improved = this.fixPunctuation(improved);
        }

        // Améliorer la formulation
        if (options.improvePhrasing) {
            improved = this.improvePhrasing(improved);
        }

        // Ajouter des détails
        if (options.addDetails && options.context) {
            improved = this.addDetails(improved, options.context);
        }

        // Formater professionnellement
        if (options.professionalFormat) {
            improved = this.formatProfessionally(improved);
        }

        return improved;
    }

    /**
     * Corrige la ponctuation
     */
    fixPunctuation(text) {
        let fixed = text;

        // Espaces avant ponctuation forte (français)
        fixed = fixed.replace(/\s*([!?:;])/g, ' $1');

        // Espaces après ponctuation
        fixed = fixed.replace(/([.,!?:;])(?!\s)/g, '$1 ');

        // Majuscules après point
        fixed = fixed.replace(/\.\s+([a-z])/g, (match, letter) => '. ' + letter.toUpperCase());

        // Majuscule en début de texte
        if (fixed.length > 0) {
            fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
        }

        // Nettoyer les espaces multiples
        fixed = fixed.replace(/\s+/g, ' ');

        return fixed.trim();
    }

    /**
     * Améliore la formulation
     */
    improvePhrasing(text) {
        let improved = text;

        // Remplacements courants pour un style plus professionnel
        const replacements = {
            'faire': 'réaliser',
            'très important': 'essentiel',
            'beaucoup de': 'nombreux',
            'il faut': 'il convient de',
            'on doit': 'il est nécessaire de',
            'problème': 'difficulté',
            'marche pas': 'ne fonctionne pas',
            'ok': 'conforme',
            'pas terrible': 'insuffisant'
        };

        Object.keys(replacements).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            improved = improved.replace(regex, replacements[key]);
        });

        return improved;
    }

    /**
     * Ajoute des détails contextuels
     */
    addDetails(text, context) {
        let detailed = text;

        // Ajouter le contexte du projet si manquant
        if (!detailed.toLowerCase().includes('arrêt') && !detailed.toLowerCase().includes('2026')) {
            detailed = `Dans le cadre de l'arrêt annuel 2026, ${detailed}`;
        }

        // Ajouter la date si pertinent
        if (context.includeDate && !detailed.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            detailed += ` (${new Date().toLocaleDateString('fr-FR')})`;
        }

        return detailed;
    }

    /**
     * Formate de manière professionnelle
     */
    formatProfessionally(text) {
        let formatted = text;

        // Structurer en paragraphes si c'est un long texte
        if (formatted.length > 200 && !formatted.includes('\n\n')) {
            const sentences = formatted.split(/\.\s+/);
            const paragraphs = [];
            let currentParagraph = [];

            sentences.forEach((sentence, index) => {
                currentParagraph.push(sentence);

                // Nouveau paragraphe tous les 3-4 phrases
                if (currentParagraph.length >= 3 || index === sentences.length - 1) {
                    paragraphs.push(currentParagraph.join('. ') + '.');
                    currentParagraph = [];
                }
            });

            formatted = paragraphs.join('\n\n');
        }

        return formatted;
    }

    /**
     * Génère un résumé
     */
    generateSummary(text, maxLength = 200) {
        if (text.length <= maxLength) {
            return text;
        }

        // Prendre les premières phrases jusqu'à atteindre la longueur max
        const sentences = text.split(/[.!?]+\s+/);
        let summary = '';

        for (const sentence of sentences) {
            if ((summary + sentence).length > maxLength) break;
            summary += sentence + '. ';
        }

        return summary.trim();
    }

    /**
     * Analyse un texte et suggère des améliorations
     */
    analyzeText(text) {
        const analysis = {
            length: text.length,
            wordCount: text.split(/\s+/).length,
            sentenceCount: text.split(/[.!?]+/).filter(s => s.trim()).length,
            readability: this.calculateReadability(text),
            suggestions: []
        };

        // Vérifier la longueur
        if (analysis.wordCount < 10) {
            analysis.suggestions.push({
                type: 'length',
                message: 'Le texte est très court. Considérez ajouter plus de détails.',
                severity: 'medium'
            });
        } else if (analysis.wordCount > 300) {
            analysis.suggestions.push({
                type: 'length',
                message: 'Le texte est assez long. Considérez le résumer ou le structurer en sections.',
                severity: 'low'
            });
        }

        // Vérifier la ponctuation
        if (!text.includes('.') && text.length > 50) {
            analysis.suggestions.push({
                type: 'punctuation',
                message: 'Manque de ponctuation. Ajoutez des points pour faciliter la lecture.',
                severity: 'high'
            });
        }

        // Vérifier la structure
        if (!text.includes('\n') && analysis.wordCount > 100) {
            analysis.suggestions.push({
                type: 'structure',
                message: 'Considérez structurer le texte en paragraphes.',
                severity: 'medium'
            });
        }

        return analysis;
    }

    /**
     * Calcule un score de lisibilité simplifié
     */
    calculateReadability(text) {
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;

        if (sentences === 0) return 0;

        const avgWordsPerSentence = words / sentences;

        // Score simplifié (plus c'est bas, mieux c'est)
        let score = 'good';
        if (avgWordsPerSentence > 25) score = 'difficult';
        else if (avgWordsPerSentence > 20) score = 'moderate';
        else if (avgWordsPerSentence > 15) score = 'good';
        else score = 'easy';

        return {
            score,
            avgWordsPerSentence: Math.round(avgWordsPerSentence)
        };
    }

    /**
     * Extrait les mots-clés d'un texte
     */
    extractKeywords(text, limit = 10) {
        // Mots vides français courants
        const stopWords = new Set([
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'aux',
            'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'ce', 'qui', 'que',
            'quoi', 'dont', 'où', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
            'je', 'tu', 'se', 'sa', 'ses', 'son', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
            'est', 'sont', 'était', 'étaient', 'être', 'avoir', 'a', 'ont', 'avait',
            'pour', 'dans', 'sur', 'avec', 'sans', 'sous', 'par', 'en'
        ]);

        // Extraire et compter les mots
        const words = text.toLowerCase()
            .replace(/[.,!?;:()]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));

        const wordCount = new Map();

        words.forEach(word => {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });

        // Trier par fréquence
        const keywords = Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));

        return keywords;
    }

    /**
     * Obtient l'historique des suggestions
     */
    getHistory(limit = 10) {
        return this.history.slice(-limit);
    }

    /**
     * Nettoie l'historique
     */
    clearHistory() {
        this.history = [];
    }
}
