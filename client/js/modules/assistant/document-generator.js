/**
 * Générateur Automatique de Documents
 * @module assistant/document-generator
 *
 * Crée automatiquement des PDF, emails, rapports, etc.
 */

export class DocumentGenerator {
    constructor() {
        this.templates = new Map();
        this.generatedDocs = [];
        this.loadTemplates();
    }

    /**
     * Charge les templates de documents
     */
    loadTemplates() {
        // Template Email: Rappel de tâche
        this.templates.set('email-task-reminder', {
            type: 'email',
            subject: 'Rappel: {taskTitle}',
            body: `Bonjour,

Ceci est un rappel automatique concernant la tâche suivante:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TÂCHE: {taskTitle}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date d'échéance: {dueDate}
⚡ Priorité: {priority}
👤 Responsable: {responsible}
📊 Phase: {phase}

📝 Description:
{description}

⏰ État: {status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{urgencyMessage}

Veuillez prendre les mesures nécessaires dans les meilleurs délais.

Cordialement,
Assistant Virtuel - Gestion Arrêt Annuel 2026

---
Ceci est un email automatique généré par l'assistant virtuel.
            `
        });

        // Template Email: Résumé quotidien
        this.templates.set('email-daily-summary', {
            type: 'email',
            subject: 'Résumé Quotidien - {date}',
            body: `Bonjour,

Voici votre résumé quotidien pour le {date}:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VUE D'ENSEMBLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Tâches complétées: {completedTasks}
📋 Tâches en cours: {inProgressTasks}
⏰ Tâches du jour: {todayTasks}
🚨 Tâches en retard: {overdueTasks}

Taux de complétion global: {completionRate}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 POINTS D'ATTENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{urgentItems}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMANDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{recommendations}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bonne journée!

Assistant Virtuel - Gestion Arrêt Annuel 2026
            `
        });

        // Template Email: Alerte Urgente
        this.templates.set('email-urgent-alert', {
            type: 'email',
            subject: '🚨 ALERTE URGENTE: {alertTitle}',
            body: `ALERTE URGENTE

{alertMessage}

Niveau de criticité: {severity}
Date/Heure: {timestamp}

Action requise: {requiredAction}

Détails:
{details}

Cette alerte a été générée automatiquement par le système de surveillance.

Assistant Virtuel - Gestion Arrêt Annuel 2026
            `
        });

        // Template PDF: Rapport Quotidien
        this.templates.set('pdf-daily-report', {
            type: 'pdf',
            title: 'Rapport Quotidien - {date}',
            sections: [
                {
                    id: 'header',
                    title: 'Informations Générales',
                    fields: ['date', 'generated_by', 'project_name']
                },
                {
                    id: 'summary',
                    title: 'Résumé Exécutif',
                    fields: ['total_tasks', 'completed_tasks', 'completion_rate', 'project_health']
                },
                {
                    id: 'today_tasks',
                    title: 'Tâches du Jour',
                    type: 'list',
                    fields: ['task_list']
                },
                {
                    id: 'overdue',
                    title: 'Tâches en Retard',
                    type: 'list',
                    fields: ['overdue_list']
                },
                {
                    id: 'issues',
                    title: 'Problèmes Détectés',
                    type: 'list',
                    fields: ['issues_list']
                },
                {
                    id: 'recommendations',
                    title: 'Recommandations',
                    type: 'list',
                    fields: ['recommendations_list']
                },
                {
                    id: 'metrics',
                    title: 'Indicateurs Clés',
                    type: 'metrics',
                    fields: ['metrics_data']
                }
            ]
        });

        // Template PDF: Rapport de Réunion
        this.templates.set('pdf-meeting-report', {
            type: 'pdf',
            title: 'Compte Rendu de Réunion - {meetingTitle}',
            sections: [
                {
                    id: 'header',
                    title: 'Informations',
                    fields: ['date', 'time', 'location', 'participants']
                },
                {
                    id: 'agenda',
                    title: 'Ordre du Jour',
                    type: 'list',
                    fields: ['agenda_items']
                },
                {
                    id: 'discussions',
                    title: 'Points Discutés',
                    type: 'text',
                    fields: ['discussion_notes']
                },
                {
                    id: 'decisions',
                    title: 'Décisions Prises',
                    type: 'list',
                    fields: ['decisions_list']
                },
                {
                    id: 'actions',
                    title: 'Actions à Suivre',
                    type: 'list',
                    fields: ['action_items']
                },
                {
                    id: 'next_meeting',
                    title: 'Prochaine Réunion',
                    fields: ['next_date', 'next_agenda']
                }
            ]
        });

        console.log(`[DOC GEN] ${this.templates.size} templates chargés`);
    }

    /**
     * Génère un email à partir d'un template
     */
    generateEmail(templateName, data) {
        const template = this.templates.get(templateName);

        if (!template || template.type !== 'email') {
            throw new Error(`Template email ${templateName} introuvable`);
        }

        let subject = template.subject;
        let body = template.body;

        // Remplacer les variables
        Object.keys(data).forEach(key => {
            const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
            const placeholder = `{${key}}`;

            subject = subject.replace(new RegExp(placeholder, 'g'), value);
            body = body.replace(new RegExp(placeholder, 'g'), value);
        });

        const email = {
            subject,
            body,
            generatedAt: new Date(),
            template: templateName,
            data
        };

        this.generatedDocs.push({
            type: 'email',
            template: templateName,
            timestamp: new Date()
        });

        console.log(`[DOC GEN] Email généré: ${subject}`);

        return email;
    }

    /**
     * Génère un PDF de rapport - MODE ONE PAGER PAYSAGE
     */
    async generatePDFReport(templateName, data) {
        const template = this.templates.get(templateName);

        if (!template || template.type !== 'pdf') {
            throw new Error(`Template PDF ${templateName} introuvable`);
        }

        // Vérifier que jsPDF est disponible
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF n\'est pas chargé');
        }

        // Si c'est un rapport quotidien, utiliser la version améliorée
        if (templateName === 'pdf-daily-report') {
            return this.generateOnePagerDailyReport(data);
        }

        // Sinon utiliser la génération standard
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yPos = 20;

        // Titre principal
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        const title = this.replacePlaceholders(template.title, data);
        doc.text(title, 20, yPos);
        yPos += 15;

        // Ligne de séparation
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;

        // Générer chaque section
        for (const section of template.sections) {
            yPos = this.addPDFSection(doc, section, data, yPos);

            // Nouvelle page si nécessaire
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
        }

        // Footer sur chaque page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(
                `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
                105,
                285,
                { align: 'center' }
            );
        }

        this.generatedDocs.push({
            type: 'pdf',
            template: templateName,
            timestamp: new Date()
        });

        console.log(`[DOC GEN] PDF généré: ${title}`);

        return doc;
    }

    /**
     * Génère un rapport quotidien ONE PAGER en mode PAYSAGE
     * ✨ VERSION PROFESSIONNELLE ULTRA-DÉTAILLÉE v2.4.1
     */
    generateOnePagerDailyReport(data) {
        const { jsPDF } = window.jspdf;

        // MODE PAYSAGE (landscape) - 297x210mm
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // FIX ENCODAGE - Support des accents français
        doc.setLanguage("fr");
        doc.setCharSpace(0);

        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 10;
        const colWidth = (pageWidth - (margin * 3)) / 2; // 2 colonnes

        // ═══════════════════════════════════════════════════════
        // EN-TÊTE PROFESSIONNEL
        // ═══════════════════════════════════════════════════════

        // Fond d'en-tête
        doc.setFillColor(26, 115, 232); // Bleu professionnel
        doc.rect(0, 0, pageWidth, 30, 'F');

        // Logo/Icône (simulé)
        doc.setFillColor(255, 255, 255);
        doc.circle(20, 15, 8, 'F');
        doc.setFontSize(14);
        doc.setTextColor(26, 115, 232);
        doc.text('📊', 16, 18);

        // Titre principal
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        const titre = 'RAPPORT QUOTIDIEN - ARRET ANNUEL 2026';
        doc.text(titre, 35, 13);

        // Date et heure de génération
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const now = new Date();
        const dateStr = this.formatDateFR(now);
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        doc.text(`${dateStr} a ${timeStr}`, 35, 21);

        // Badge de statut
        const mood = data.metrics_data?.mood || 'good';
        const moodColors = {
            critical: [220, 38, 38],
            warning: [234, 88, 12],
            good: [22, 163, 74],
            calm: [2, 132, 199]
        };
        const moodLabels = {
            critical: 'CRITIQUE',
            warning: 'ATTENTION',
            good: 'BON',
            calm: 'EXCELLENT'
        };
        const [r, g, b] = moodColors[mood] || moodColors.good;
        doc.setFillColor(r, g, b);
        doc.roundedRect(pageWidth - 65, 8, 50, 14, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(moodLabels[mood], pageWidth - 40, 17, { align: 'center' });

        // ═══════════════════════════════════════════════════════
        // SECTION 1: INDICATEURS CLÉS (KPI) - Haut de page
        // ═══════════════════════════════════════════════════════

        let yPos = 38;

        // Titre section
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text('📈 INDICATEURS CLÉS', margin, yPos);

        yPos += 8;

        // Cartes KPI (4 cartes horizontales)
        const kpis = [
            {
                label: 'Tâches du jour',
                value: data.todayTasks || data.task_list?.length || 0,
                color: [59, 130, 246],
                icon: '📋'
            },
            {
                label: 'Complétées',
                value: data.completedTasks || 0,
                color: [34, 197, 94],
                icon: '✅'
            },
            {
                label: 'En retard',
                value: data.overdueTasks || 0,
                color: [239, 68, 68],
                icon: '⚠️'
            },
            {
                label: 'Taux complétion',
                value: `${data.completionRate || 0}%`,
                color: [168, 85, 247],
                icon: '📊'
            }
        ];

        const kpiWidth = (pageWidth - (margin * 5)) / 4;
        kpis.forEach((kpi, i) => {
            const x = margin + (i * (kpiWidth + margin));

            // Fond de carte
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(x, yPos, kpiWidth, 22, 2, 2, 'F');

            // Bordure gauche colorée
            doc.setFillColor(...kpi.color);
            doc.rect(x, yPos, 3, 22, 'F');

            // Icône
            doc.setFontSize(14);
            doc.text(kpi.icon, x + 8, yPos + 10);

            // Valeur
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...kpi.color);
            doc.text(String(kpi.value), x + 20, yPos + 11);

            // Label
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(kpi.label, x + 20, yPos + 18);
        });

        yPos += 28;

        // ═══════════════════════════════════════════════════════
        // LAYOUT À 2 COLONNES
        // ═══════════════════════════════════════════════════════

        const col1X = margin;
        const col2X = margin + colWidth + margin;
        let col1Y = yPos;
        let col2Y = yPos;

        // ───────────────────────────────────────────────────────
        // COLONNE 1 GAUCHE
        // ───────────────────────────────────────────────────────

        // === TÂCHES DU JOUR ===
        this.addSectionBox(doc, col1X, col1Y, colWidth, '  TACHES DU JOUR', [59, 130, 246]);
        col1Y += 12;

        const taskList = data.task_list || [];
        if (taskList.length > 0) {
            doc.setFontSize(7);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(60, 60, 60);

            const maxTasks = 10; // Maximum 10 tâches affichées
            taskList.slice(0, maxTasks).forEach((task, i) => {
                const taskObj = typeof task === 'string' ? { titre: task } : task;
                const taskText = taskObj.titre || taskObj.title || 'Tache sans titre';
                const shortTask = taskText.length > 50 ? taskText.substring(0, 50) + '...' : taskText;

                // Puce
                doc.setFillColor(59, 130, 246);
                doc.circle(col1X + 3, col1Y + 2, 0.8, 'F');

                // Texte de la tâche (nettoyé)
                doc.text(this.cleanText(shortTask), col1X + 6, col1Y + 3);

                // Informations additionnelles si disponibles
                if (taskObj.responsable || taskObj.avancement) {
                    const details = [];
                    if (taskObj.responsable) details.push(`Resp: ${this.cleanText(taskObj.responsable)}`);
                    if (taskObj.avancement !== undefined) details.push(`${taskObj.avancement}%`);

                    doc.setFontSize(6);
                    doc.setTextColor(120, 120, 120);
                    doc.text(details.join(' | '), col1X + 8, col1Y + 6);
                    doc.setFontSize(7);
                    doc.setTextColor(60, 60, 60);
                    col1Y += 7;
                } else {
                    col1Y += 4.5;
                }
            });

            if (taskList.length > maxTasks) {
                doc.setFont(undefined, 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(`+ ${taskList.length - maxTasks} autre(s) tache(s)`, col1X + 6, col1Y + 3);
                col1Y += 4.5;
            }
        } else {
            doc.setFontSize(7);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('Aucune tache prevue pour aujourd\'hui', col1X + 6, col1Y + 3);
            col1Y += 4.5;
        }

        col1Y += 5;

        // === TÂCHES EN RETARD ===
        this.addSectionBox(doc, col1X, col1Y, colWidth, '  TACHES EN RETARD', [239, 68, 68]);
        col1Y += 12;

        const overdueList = data.overdue_list || [];
        if (overdueList.length > 0) {
            doc.setFontSize(7);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(60, 60, 60);

            const maxOverdue = 8;
            overdueList.slice(0, maxOverdue).forEach((task, i) => {
                const taskObj = typeof task === 'string' ? { title: task } : task;
                const taskText = taskObj.title || taskObj.titre || 'Tache sans titre';
                const shortTask = taskText.length > 48 ? taskText.substring(0, 48) + '...' : taskText;

                // Puce rouge
                doc.setFillColor(239, 68, 68);
                doc.circle(col1X + 3, col1Y + 2, 0.8, 'F');

                // Texte (nettoyé)
                doc.text(this.cleanText(shortTask), col1X + 6, col1Y + 3);

                // Détails du retard si disponible
                if (taskObj.daysLate) {
                    doc.setFontSize(6);
                    doc.setTextColor(239, 68, 68);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${taskObj.daysLate} jour(s) de retard`, col1X + 8, col1Y + 6);
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(60, 60, 60);
                    col1Y += 7;
                } else {
                    col1Y += 4.5;
                }
            });

            if (overdueList.length > maxOverdue) {
                doc.setFont(undefined, 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(`+ ${overdueList.length - maxOverdue} autre(s) en retard`, col1X + 6, col1Y + 3);
                col1Y += 4.5;
            }
        } else {
            doc.setFontSize(7);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(34, 197, 94);
            doc.text('Aucune tache en retard - Excellent!', col1X + 6, col1Y + 3);
            col1Y += 4.5;
        }

        col1Y += 5;

        // === BARRE DE PROGRESSION ===
        this.addSectionBox(doc, col1X, col1Y, colWidth, '📊 PROGRESSION GLOBALE', [168, 85, 247]);
        col1Y += 12;

        const completionRate = parseFloat(data.completionRate) || 0;

        // Barre de fond
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(col1X + 5, col1Y, colWidth - 10, 8, 2, 2, 'F');

        // Barre de progression
        const progressColor = completionRate >= 75 ? [34, 197, 94] :
                              completionRate >= 50 ? [234, 179, 8] :
                              [239, 68, 68];
        doc.setFillColor(...progressColor);
        const progressWidth = ((colWidth - 10) * completionRate) / 100;
        if (progressWidth > 0) {
            doc.roundedRect(col1X + 5, col1Y, progressWidth, 8, 2, 2, 'F');
        }

        // Texte pourcentage
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        if (progressWidth > 15) {
            doc.text(`${completionRate}%`, col1X + 10, col1Y + 5.5);
        } else {
            doc.setTextColor(60, 60, 60);
            doc.text(`${completionRate}%`, col1X + 10, col1Y + 5.5);
        }

        col1Y += 12;

        // === MÉTRIQUES DÉTAILLÉES ===
        this.addSectionBox(doc, col1X, col1Y, colWidth, '📈 MÉTRIQUES DÉTAILLÉES', [14, 165, 233]);
        col1Y += 12;

        const metricsData = data.metrics_data || {};
        const metrics = [
            { label: 'Jours avant l\'arrêt', value: metricsData.daysToStart ?? 'N/A' },
            { label: 'Tâches totales', value: metricsData.totalTasks ?? 'N/A' },
            { label: 'Tâches en cours', value: metricsData.inProgressTasks ?? 'N/A' },
            { label: 'Réunions prévues', value: metricsData.upcomingMeetings ?? 0 }
        ];

        doc.setFontSize(8);
        metrics.forEach(metric => {
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(metric.label, col1X + 5, col1Y + 3);

            doc.setFont(undefined, 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text(String(metric.value), col1X + colWidth - 15, col1Y + 3, { align: 'right' });

            col1Y += 6;
        });

        // ───────────────────────────────────────────────────────
        // COLONNE 2 DROITE
        // ───────────────────────────────────────────────────────

        // === PROBLÈMES DÉTECTÉS ===
        this.addSectionBox(doc, col2X, col2Y, colWidth, '  PROBLEMES DETECTES', [234, 88, 12]);
        col2Y += 12;

        const issuesList = data.issues_list || [];
        if (issuesList.length > 0) {
            doc.setFontSize(7);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(60, 60, 60);

            const maxIssues = 7;
            issuesList.slice(0, maxIssues).forEach((issue, i) => {
                const issueObj = typeof issue === 'string' ? { message: issue } : issue;
                const issueText = issueObj.message || issueObj.text || 'Probleme';
                const shortIssue = issueText.length > 55 ? issueText.substring(0, 55) + '...' : issueText;

                // Puce orange
                doc.setFillColor(234, 88, 12);
                doc.circle(col2X + 3, col2Y + 2, 0.8, 'F');

                // Texte (nettoyé)
                const lines = doc.splitTextToSize(this.cleanText(shortIssue), colWidth - 10);
                doc.text(lines, col2X + 6, col2Y + 3);

                // Gravité si disponible
                if (issueObj.severity) {
                    doc.setFontSize(6);
                    doc.setTextColor(234, 88, 12);
                    const severityText = issueObj.severity === 'critical' ? 'CRITIQUE' :
                                       issueObj.severity === 'high' ? 'ELEVE' : 'MOYEN';
                    doc.text(severityText, col2X + 8, col2Y + 3 + (lines.length * 3.5));
                    doc.setFontSize(7);
                    doc.setTextColor(60, 60, 60);
                    col2Y += lines.length * 3.5 + 4;
                } else {
                    col2Y += lines.length * 3.5 + 1;
                }
            });

            if (issuesList.length > maxIssues) {
                doc.setFont(undefined, 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(`+ ${issuesList.length - maxIssues} autre(s) probleme(s)`, col2X + 6, col2Y + 3);
                col2Y += 4.5;
            }
        } else {
            doc.setFontSize(7);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(34, 197, 94);
            doc.text('Aucun probleme detecte - Tout va bien!', col2X + 6, col2Y + 3);
            col2Y += 4.5;
        }

        col2Y += 5;

        // === RECOMMANDATIONS ===
        this.addSectionBox(doc, col2X, col2Y, colWidth, '  RECOMMANDATIONS', [16, 185, 129]);
        col2Y += 12;

        const recList = data.recommendations_list || [];
        if (recList.length > 0) {
            doc.setFontSize(7);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(60, 60, 60);

            const maxRecs = 8;
            recList.slice(0, maxRecs).forEach((rec, i) => {
                const recObj = typeof rec === 'string' ? { message: rec } : rec;
                const recText = recObj.message || recObj.title || recObj.text || 'Recommandation';
                const shortRec = recText.length > 58 ? recText.substring(0, 58) + '...' : recText;

                // Puce verte
                doc.setFillColor(16, 185, 129);
                doc.circle(col2X + 3, col2Y + 2, 0.8, 'F');

                // Texte (nettoyé)
                const lines = doc.splitTextToSize(this.cleanText(shortRec), colWidth - 10);
                doc.text(lines, col2X + 6, col2Y + 3);

                // Priorité si disponible
                if (recObj.priority) {
                    doc.setFontSize(6);
                    doc.setTextColor(16, 185, 129);
                    const priorityText = recObj.priority === 'high' ? 'PRIORITE HAUTE' : 'Normal';
                    doc.text(priorityText, col2X + 8, col2Y + 3 + (lines.length * 3.5));
                    doc.setFontSize(7);
                    doc.setTextColor(60, 60, 60);
                    col2Y += lines.length * 3.5 + 4;
                } else {
                    col2Y += lines.length * 3.5 + 1;
                }
            });

            if (recList.length > maxRecs) {
                doc.setFont(undefined, 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(`+ ${recList.length - maxRecs} autre(s) recommandation(s)`, col2X + 6, col2Y + 3);
                col2Y += 4.5;
            }
        } else {
            doc.setFontSize(7);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('Aucune recommandation pour le moment', col2X + 6, col2Y + 3);
            col2Y += 4.5;
        }

        col2Y += 6;

        // === ACTIONS RAPIDES ===
        this.addSectionBox(doc, col2X, col2Y, colWidth, '⚡ ACTIONS RAPIDES', [147, 51, 234]);
        col2Y += 12;

        const actions = [
            '→ Consulter le planning complet',
            '→ Mettre à jour les tâches en retard',
            '→ Préparer les réunions à venir',
            '→ Vérifier les ressources disponibles'
        ];

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);

        actions.forEach(action => {
            doc.text(action, col2X + 6, col2Y + 3);
            col2Y += 5;
        });

        // ═══════════════════════════════════════════════════════
        // PIED DE PAGE
        // ═══════════════════════════════════════════════════════

        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);

        // Gauche: Info génération
        doc.text(
            `Généré automatiquement par l'Assistant Virtuel - ${new Date().toLocaleString('fr-FR')}`,
            margin,
            pageHeight - 8
        );

        // Droite: Logo/Nom
        doc.setFont(undefined, 'bold');
        doc.text(
            'Arrêt Annuel 2026 - Rapport Quotidien',
            pageWidth - margin,
            pageHeight - 8,
            { align: 'right' }
        );

        this.generatedDocs.push({
            type: 'pdf',
            template: 'pdf-daily-report-onepager',
            timestamp: new Date()
        });

        console.log('[DOC GEN] ✨ PDF ONE PAGER généré en mode paysage');

        return doc;
    }

    /**
     * Ajoute une boîte de section avec titre
     */
    addSectionBox(doc, x, y, width, title, color) {
        // Barre de couleur à gauche
        doc.setFillColor(...color);
        doc.rect(x, y, 2, 8, 'F');

        // Titre - encoder proprement pour éviter les problèmes d'accents
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...color);
        doc.text(this.cleanText(title), x + 5, y + 6);

        // Ligne de séparation
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(x, y + 9, x + width, y + 9);
    }

    /**
     * Nettoie le texte pour éviter les problèmes d'encodage
     */
    cleanText(text) {
        if (!text) return '';
        return String(text)
            .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
            .replace(/à/g, 'a').replace(/â/g, 'a')
            .replace(/ô/g, 'o').replace(/ù/g, 'u').replace(/û/g, 'u')
            .replace(/ç/g, 'c').replace(/î/g, 'i').replace(/ï/g, 'i')
            .replace(/É/g, 'E').replace(/È/g, 'E').replace(/Ê/g, 'E')
            .replace(/À/g, 'A').replace(/Ô/g, 'O').replace(/Ç/g, 'C');
    }

    /**
     * Formate une date en français sans accents
     */
    formatDateFR(date) {
        const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const mois = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
                      'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

        const d = new Date(date);
        return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
    }

    /**
     * Ajoute une section au PDF
     */
    addPDFSection(doc, section, data, yPos) {
        // Titre de section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(section.title, 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        // Contenu selon le type de section
        switch (section.type) {
            case 'list':
                yPos = this.addListSection(doc, section, data, yPos);
                break;

            case 'metrics':
                yPos = this.addMetricsSection(doc, section, data, yPos);
                break;

            case 'text':
                yPos = this.addTextSection(doc, section, data, yPos);
                break;

            default:
                yPos = this.addFieldsSection(doc, section, data, yPos);
        }

        yPos += 10;

        return yPos;
    }

    /**
     * Ajoute une section de liste
     */
    addListSection(doc, section, data, yPos) {
        for (const fieldName of section.fields) {
            const list = data[fieldName];

            if (Array.isArray(list) && list.length > 0) {
                list.forEach((item, index) => {
                    const text = typeof item === 'string' ? item : item.text || item.title || JSON.stringify(item);
                    const lines = doc.splitTextToSize(`${index + 1}. ${text}`, 170);

                    doc.text(lines, 25, yPos);
                    yPos += lines.length * 7;

                    // Nouvelle page si nécessaire
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                });
            } else {
                doc.text('Aucun élément', 25, yPos);
                yPos += 7;
            }
        }

        return yPos;
    }

    /**
     * Ajoute une section de métriques
     */
    addMetricsSection(doc, section, data, yPos) {
        for (const fieldName of section.fields) {
            const metrics = data[fieldName];

            if (metrics && typeof metrics === 'object') {
                Object.keys(metrics).forEach(key => {
                    const value = metrics[key];
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    doc.text(`${label}: ${value}`, 25, yPos);
                    yPos += 7;
                });
            }
        }

        return yPos;
    }

    /**
     * Ajoute une section de texte
     */
    addTextSection(doc, section, data, yPos) {
        for (const fieldName of section.fields) {
            const text = data[fieldName] || '';
            const lines = doc.splitTextToSize(text, 170);

            doc.text(lines, 25, yPos);
            yPos += lines.length * 7;
        }

        return yPos;
    }

    /**
     * Ajoute une section avec des champs
     */
    addFieldsSection(doc, section, data, yPos) {
        for (const fieldName of section.fields) {
            const value = data[fieldName] || 'N/A';
            const label = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            doc.text(`${label}: ${value}`, 25, yPos);
            yPos += 7;
        }

        return yPos;
    }

    /**
     * Remplace les placeholders dans un texte
     */
    replacePlaceholders(text, data) {
        let result = text;

        Object.keys(data).forEach(key => {
            const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        return result;
    }

    /**
     * Télécharge un PDF
     */
    downloadPDF(doc, filename) {
        if (!filename.endsWith('.pdf')) {
            filename += '.pdf';
        }

        window.libLoader.displayPDF(doc, filename);
        console.log(`[DOC GEN] PDF affiché: ${filename}`);
    }

    /**
     * Affiche un preview d'email
     */
    showEmailPreview(email) {
        const preview = `
            <div class="email-preview-container">
                <div class="email-preview-header">
                    <h3>Aperçu de l'email</h3>
                    <button class="close-preview" onclick="this.closest('.email-preview-container').remove()">✕</button>
                </div>

                <div class="email-preview-content">
                    <div class="email-field">
                        <strong>Sujet:</strong>
                        <div class="email-subject">${email.subject}</div>
                    </div>

                    <div class="email-field">
                        <strong>Corps du message:</strong>
                        <div class="email-body"><pre>${email.body}</pre></div>
                    </div>
                </div>

                <div class="email-preview-actions">
                    <button class="btn-action" onclick="copyEmailToClipboard(${JSON.stringify(email.body).replace(/"/g, '&quot;')})">
                        📋 Copier
                    </button>
                    <button class="btn-action" onclick="openInEmailClient('${encodeURIComponent(email.subject)}', '${encodeURIComponent(email.body)}')">
                        ✉️ Ouvrir dans le client email
                    </button>
                    <button class="btn-action secondary" onclick="this.closest('.email-preview-container').remove()">
                        Fermer
                    </button>
                </div>
            </div>
        `;

        return preview;
    }

    /**
     * Génère un rapport quotidien automatique
     */
    async generateDailyReport(briefingData) {
        // Email
        const emailData = {
            date: new Date().toLocaleDateString('fr-FR'),
            completedTasks: briefingData.summary.completedTasks,
            inProgressTasks: briefingData.metrics.inProgressTasks,
            todayTasks: briefingData.summary.totalTasks,
            overdueTasks: briefingData.summary.overdueTasks,
            completionRate: briefingData.metrics.completionRate,
            urgentItems: briefingData.urgentItems.map(item => `• ${item.message}`).join('\n'),
            recommendations: briefingData.recommendations.map(rec => `• ${rec.message}`).join('\n')
        };

        const email = this.generateEmail('email-daily-summary', emailData);

        // PDF
        const pdfData = {
            date: emailData.date,
            generated_by: 'Assistant Virtuel',
            project_name: 'Arrêt Annuel 2026',
            ...emailData,
            task_list: briefingData.todayTasks.map(t => t.titre),
            overdue_list: briefingData.urgentItems
                .filter(item => item.type === 'overdue_tasks')
                .flatMap(item => item.details.map(d => `${d.title} (${d.daysLate} jours de retard)`)),
            issues_list: briefingData.urgentItems
                .filter(item => item.severity === 'critical')
                .map(item => item.message),
            recommendations_list: briefingData.recommendations.map(rec => rec.message),
            metrics_data: briefingData.metrics
        };

        const pdf = await this.generatePDFReport('pdf-daily-report', pdfData);

        return { email, pdf };
    }

    /**
     * Obtient les statistiques de génération
     */
    getStats() {
        return {
            total: this.generatedDocs.length,
            byType: this.generatedDocs.reduce((acc, doc) => {
                acc[doc.type] = (acc[doc.type] || 0) + 1;
                return acc;
            }, {}),
            recent: this.generatedDocs.slice(-10)
        };
    }
}

// Fonctions globales pour les actions d'email
window.copyEmailToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Email copié dans le presse-papiers!');
    });
};

window.openInEmailClient = function(subject, body) {
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
};
