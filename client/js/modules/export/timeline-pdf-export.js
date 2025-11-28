/**
 * @fileoverview Module d'export PDF pour la Timeline
 * @module export/timeline-pdf-export
 */

import { getPreparationPhases } from '../ui/summary.js';
import { getStartDate } from '../data/settings.js';

/**
 * Toggle le menu d'export PDF
 */
export function toggleExportMenu() {
    const menu = document.getElementById('timelinePDFMenu');
    if (menu) {
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';

        // Fermer le menu si on clique ailleurs
        if (!isVisible) {
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    const btn = document.getElementById('btnExportTimelinePDF');
                    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
                        menu.style.display = 'none';
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 10);
        }
    }
}

/**
 * Obtient la couleur de statut
 * @param {string} statut - Statut de la tâche
 * @returns {Array<number>} Couleur RGB [r, g, b]
 */
function getStatusColorRGB(statut) {
    const colors = {
        'notstarted': [231, 76, 60],    // Rouge
        'inprogress': [243, 156, 18],   // Orange
        'completed': [39, 174, 96],     // Vert
        'cancelled': [149, 165, 166]    // Gris
    };
    return colors[statut] || [149, 165, 166];
}

/**
 * Obtient le texte du statut
 * @param {string} statut - Statut de la tâche
 * @returns {string} Texte du statut
 */
function getStatusText(statut) {
    const texts = {
        'notstarted': 'Non Demarré',
        'inprogress': 'En Cours',
        'completed': 'Completé',
        'cancelled': 'Annulé'
    };
    return texts[statut] || 'Inconnu';
}

/**
 * Génère un PDF global avec toutes les phases
 * @returns {Promise<void>}
 */
export async function exportTimelineGlobalPDF() {
    console.log('[PDF] Génération du PDF global Timeline...');

    try {
        // Fermer le menu
        const menu = document.getElementById('timelinePDFMenu');
        if (menu) menu.style.display = 'none';

        // Récupérer les phases
        const phases = await getPreparationPhases();

        if (!phases || phases.length === 0) {
            alert('⚠️ Aucune phase disponible pour l\'export.');
            return;
        }

        // Trier par semaines
        const sortedPhases = [...phases].sort((a, b) => a.semaines - b.semaines);

        // Créer le document PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;

        // ========== PAGE DE GARDE ==========

        // Titre principal
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 50, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Processus de Gestion', pageWidth / 2, 20, { align: 'center' });
        doc.text('de l\'Arrêt Annuel', pageWidth / 2, 32, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Vue Chronologique des Phases', pageWidth / 2, 42, { align: 'center' });

        // Informations générales
        yPos = 65;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        const startDate = getStartDate();
        const dateExport = new Date().toLocaleDateString('fr-FR');

        doc.text(`Date de début de l'arrêt : ${startDate || 'Non définie'}`, margin, yPos);
        yPos += 8;
        doc.text(`Date d'export : ${dateExport}`, margin, yPos);
        yPos += 8;
        doc.text(`Nombre de phases : ${sortedPhases.length}`, margin, yPos);
        yPos += 15;

        // Statistiques globales
        let totalTaches = 0;
        let totalCompleted = 0;
        let totalInProgress = 0;
        let totalNotStarted = 0;

        sortedPhases.forEach(phase => {
            totalTaches += phase.taches.length;
            totalCompleted += phase.taches.filter(t => t.statut === 'completed').length;
            totalInProgress += phase.taches.filter(t => t.statut === 'inprogress').length;
            totalNotStarted += phase.taches.filter(t => t.statut === 'notstarted').length;
        });

        const progressGlobal = totalTaches > 0 ? Math.round((totalCompleted / totalTaches) * 100) : 0;

        // Bloc statistiques
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');

        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistiques Globales', margin + 5, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de tâches : ${totalTaches}`, margin + 5, yPos);

        yPos += 6;
        doc.setTextColor(39, 174, 96);
        doc.text(`✓ Complétées : ${totalCompleted} (${progressGlobal}%)`, margin + 5, yPos);

        doc.setTextColor(243, 156, 18);
        doc.text(`⏳ En cours : ${totalInProgress}`, pageWidth / 2, yPos);

        yPos += 6;
        doc.setTextColor(231, 76, 60);
        doc.text(`● Non démarrées : ${totalNotStarted}`, margin + 5, yPos);

        // Barre de progression globale
        yPos += 10;
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(224, 224, 224);
        doc.setFillColor(224, 224, 224);
        doc.roundedRect(margin + 5, yPos, pageWidth - 2 * margin - 10, 6, 2, 2, 'FD');

        if (progressGlobal > 0) {
            doc.setFillColor(39, 174, 96);
            const progressWidth = ((pageWidth - 2 * margin - 10) * progressGlobal) / 100;
            doc.roundedRect(margin + 5, yPos, progressWidth, 6, 2, 2, 'F');
        }

        // ========== DÉTAIL DES PHASES ==========

        for (let phaseIndex = 0; phaseIndex < sortedPhases.length; phaseIndex++) {
            const phase = sortedPhases[phaseIndex];

            // Nouvelle page pour chaque phase (sauf la première qui est sur la page de garde)
            if (phaseIndex > 0 || yPos > 150) {
                doc.addPage();
                yPos = margin;
            } else {
                yPos += 25;
            }

            // Calculer les stats de la phase
            const stats = {
                total: phase.taches.length,
                completed: phase.taches.filter(t => t.statut === 'completed').length,
                inprogress: phase.taches.filter(t => t.statut === 'inprogress').length,
                notstarted: phase.taches.filter(t => t.statut === 'notstarted').length
            };
            stats.progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

            // Couleur de la phase
            const phaseColor = stats.progress === 100 ? [39, 174, 96] :
                              stats.inprogress > 0 ? [243, 156, 18] : [52, 152, 219];

            // En-tête de phase
            doc.setFillColor(...phaseColor);
            doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 3, 3, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            const semText = `T${phase.semaines >= 0 ? '+' : ''}${phase.semaines} sem`;
            doc.text(semText, margin + 5, yPos + 7);

            doc.setFontSize(13);
            doc.text(phase.nom, margin + 35, yPos + 7);

            doc.setFontSize(11);
            doc.text(`${stats.progress}%`, pageWidth - margin - 20, yPos + 7);

            yPos += 20;

            // Stats de la phase
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`${stats.total} tâches`, margin, yPos);
            doc.setTextColor(39, 174, 96);
            doc.text(`${stats.completed} complétées`, margin + 25, yPos);
            doc.setTextColor(243, 156, 18);
            doc.text(`${stats.inprogress} en cours`, margin + 60, yPos);
            doc.setTextColor(231, 76, 60);
            doc.text(`${stats.notstarted} non démarrées`, margin + 90, yPos);

            yPos += 8;

            // Tableau des tâches
            doc.setTextColor(0, 0, 0);
            const colWidths = {
                statut: 20,
                titre: 90,
                responsable: 30,
                avancement: 20
            };

            // En-tête du tableau
            doc.setFillColor(52, 73, 94);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            let xPos = margin + 2;
            doc.text('Statut', xPos, yPos + 5);
            xPos += colWidths.statut;
            doc.text('Titre de la tâche', xPos, yPos + 5);
            xPos += colWidths.titre;
            doc.text('Responsable', xPos, yPos + 5);
            xPos += colWidths.responsable;
            doc.text('Avancement', xPos, yPos + 5);

            yPos += 8;

            // Lignes du tableau
            for (let i = 0; i < phase.taches.length; i++) {
                const tache = phase.taches[i];

                // Vérifier si on doit ajouter une page
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;

                    // Répéter l'en-tête
                    doc.setFillColor(52, 73, 94);
                    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    xPos = margin + 2;
                    doc.text('Statut', xPos, yPos + 5);
                    xPos += colWidths.statut;
                    doc.text('Titre de la tâche', xPos, yPos + 5);
                    xPos += colWidths.titre;
                    doc.text('Responsable', xPos, yPos + 5);
                    xPos += colWidths.responsable;
                    doc.text('Avancement', xPos, yPos + 5);
                    yPos += 8;
                }

                // Fond alterné
                if (i % 2 === 0) {
                    doc.setFillColor(248, 249, 250);
                    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
                }

                // Bordure
                doc.setDrawColor(220, 220, 220);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 10);

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');

                xPos = margin + 2;

                // Statut
                const statusColor = getStatusColorRGB(tache.statut);
                doc.setFillColor(...statusColor);
                doc.circle(xPos + 2, yPos + 5, 1.5, 'F');
                doc.setTextColor(0, 0, 0);
                doc.text(getStatusText(tache.statut).substring(0, 8), xPos + 5, yPos + 6);

                xPos += colWidths.statut;

                // Titre (avec wrap si trop long)
                const titreText = tache.titre.length > 50 ? tache.titre.substring(0, 50) + '...' : tache.titre;
                doc.text(titreText, xPos, yPos + 6);

                xPos += colWidths.titre;

                // Responsable
                doc.text(tache.responsable || 'N/A', xPos, yPos + 6);

                xPos += colWidths.responsable;

                // Avancement
                doc.text(`${tache.avancement}%`, xPos, yPos + 6);

                yPos += 10;
            }

            yPos += 5;

            // Vérifier s'il y a des documents attachés aux tâches
            const tasksWithDocs = phase.taches.filter(t =>
                (t.documents && t.documents.length > 0) ||
                (t.attachments && t.attachments.length > 0)
            );

            if (tasksWithDocs.length > 0) {
                yPos += 5;

                if (yPos > pageHeight - 40) {
                    doc.addPage();
                    yPos = margin;
                }

                doc.setFillColor(255, 243, 205);
                doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
                doc.setTextColor(133, 100, 4);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`📎 ${tasksWithDocs.length} tâche(s) avec documents annexes`, margin + 3, yPos + 6);

                yPos += 12;

                // Lister les documents
                tasksWithDocs.forEach(tache => {
                    const docs = tache.documents || tache.attachments || [];
                    docs.forEach(doc_item => {
                        if (yPos > pageHeight - 20) {
                            doc.addPage();
                            yPos = margin;
                        }

                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        const docName = doc_item.nom || doc_item.name || doc_item.filename || 'Document sans nom';
                        doc.text(`  • ${docName}`, margin + 5, yPos);
                        yPos += 5;
                    });
                });

                yPos += 5;
            }
        }

        // Pied de page sur chaque page
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text(`Page ${i}/${totalPages}`, pageWidth - margin - 15, pageHeight - 10);
            doc.text('Généré avec Claude Code', margin, pageHeight - 10);
        }

        // Afficher le PDF dans un nouvel onglet
        const fileName = `timeline-processus-arret-${new Date().toISOString().split('T')[0]}.pdf`;
        window.libLoader.displayPDF(doc, fileName);

        console.log('[PDF] Export global réussi:', fileName);

    } catch (error) {
        console.error('[PDF] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export PDF. Consultez la console pour plus de détails.');
    }
}

/**
 * Génère un PDF individuel pour chaque phase
 * @returns {Promise<void>}
 */
export async function exportTimelineIndividualPDF() {
    console.log('[PDF] Génération des PDFs individuels...');

    try {
        // Fermer le menu
        const menu = document.getElementById('timelinePDFMenu');
        if (menu) menu.style.display = 'none';

        // Récupérer les phases
        const phases = await getPreparationPhases();

        if (!phases || phases.length === 0) {
            alert('⚠️ Aucune phase disponible pour l\'export.');
            return;
        }

        // Trier par semaines
        const sortedPhases = [...phases].sort((a, b) => a.semaines - b.semaines);

        // Générer un PDF pour chaque phase
        for (const phase of sortedPhases) {
            await generatePhasePDF(phase);
        }

        alert(`✅ Export réussi !\n\n${sortedPhases.length} fichiers PDF générés`);

    } catch (error) {
        console.error('[PDF] Erreur lors de l\'export individuel:', error);
        alert('❌ Erreur lors de l\'export PDF. Consultez la console pour plus de détails.');
    }
}

/**
 * Génère un PDF pour une phase spécifique
 * @param {Object} phase - Phase à exporter
 * @returns {Promise<void>}
 */
async function generatePhasePDF(phase) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Calculer les stats
    const stats = {
        total: phase.taches.length,
        completed: phase.taches.filter(t => t.statut === 'completed').length,
        inprogress: phase.taches.filter(t => t.statut === 'inprogress').length,
        notstarted: phase.taches.filter(t => t.statut === 'notstarted').length
    };
    stats.progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    // Couleur de la phase
    const phaseColor = stats.progress === 100 ? [39, 174, 96] :
                      stats.inprogress > 0 ? [243, 156, 18] : [52, 152, 219];

    // En-tête
    doc.setFillColor(...phaseColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(phase.nom, pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`T${phase.semaines >= 0 ? '+' : ''}${phase.semaines} semaines avant/après l'arrêt`, pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Progression: ${stats.progress}%`, pageWidth / 2, 33, { align: 'center' });

    yPos = 50;

    // Statistiques
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de tâches : ${stats.total}`, margin, yPos);

    yPos += 6;
    doc.setTextColor(39, 174, 96);
    doc.text(`✓ Complétées : ${stats.completed}`, margin, yPos);

    doc.setTextColor(243, 156, 18);
    doc.text(`⏳ En cours : ${stats.inprogress}`, pageWidth / 2, yPos);

    yPos += 6;
    doc.setTextColor(231, 76, 60);
    doc.text(`● Non démarrées : ${stats.notstarted}`, margin, yPos);

    yPos += 10;

    // Tableau des tâches
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Liste des tâches', margin, yPos);

    yPos += 8;

    const colWidths = {
        statut: 20,
        titre: 90,
        responsable: 30,
        avancement: 20
    };

    // En-tête du tableau
    doc.setFillColor(52, 73, 94);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin + 2;
    doc.text('Statut', xPos, yPos + 5);
    xPos += colWidths.statut;
    doc.text('Titre de la tâche', xPos, yPos + 5);
    xPos += colWidths.titre;
    doc.text('Responsable', xPos, yPos + 5);
    xPos += colWidths.responsable;
    doc.text('Avancement', xPos, yPos + 5);

    yPos += 8;

    // Lignes du tableau
    for (let i = 0; i < phase.taches.length; i++) {
        const tache = phase.taches[i];

        if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;

            // Répéter l'en-tête
            doc.setFillColor(52, 73, 94);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            xPos = margin + 2;
            doc.text('Statut', xPos, yPos + 5);
            xPos += colWidths.statut;
            doc.text('Titre de la tâche', xPos, yPos + 5);
            xPos += colWidths.titre;
            doc.text('Responsable', xPos, yPos + 5);
            xPos += colWidths.responsable;
            doc.text('Avancement', xPos, yPos + 5);
            yPos += 8;
        }

        if (i % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
        }

        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        xPos = margin + 2;

        const statusColor = getStatusColorRGB(tache.statut);
        doc.setFillColor(...statusColor);
        doc.circle(xPos + 2, yPos + 5, 1.5, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text(getStatusText(tache.statut).substring(0, 8), xPos + 5, yPos + 6);

        xPos += colWidths.statut;

        const titreText = tache.titre.length > 50 ? tache.titre.substring(0, 50) + '...' : tache.titre;
        doc.text(titreText, xPos, yPos + 6);

        xPos += colWidths.titre;
        doc.text(tache.responsable || 'N/A', xPos, yPos + 6);

        xPos += colWidths.responsable;
        doc.text(`${tache.avancement}%`, xPos, yPos + 6);

        yPos += 10;
    }

    // Documents annexes
    const tasksWithDocs = phase.taches.filter(t =>
        (t.documents && t.documents.length > 0) ||
        (t.attachments && t.attachments.length > 0)
    );

    if (tasksWithDocs.length > 0) {
        yPos += 10;

        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = margin;
        }

        doc.setFillColor(255, 243, 205);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
        doc.setTextColor(133, 100, 4);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('📎 Documents Annexes', margin + 3, yPos + 6);

        yPos += 12;

        tasksWithDocs.forEach(tache => {
            const docs = tache.documents || tache.attachments || [];

            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = margin;
            }

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${tache.titre}:`, margin + 3, yPos);
            yPos += 5;

            docs.forEach(doc_item => {
                if (yPos > pageHeight - 15) {
                    doc.addPage();
                    yPos = margin;
                }

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                const docName = doc_item.nom || doc_item.name || doc_item.filename || 'Document sans nom';
                const docType = doc_item.type || doc_item.mimetype || '';
                doc.text(`  • ${docName}${docType ? ` (${docType})` : ''}`, margin + 8, yPos);
                yPos += 5;
            });

            yPos += 3;
        });
    }

    // Pied de page
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i}/${totalPages}`, pageWidth - margin - 15, pageHeight - 10);
        doc.text('Généré avec Claude Code', margin, pageHeight - 10);
    }

    // Afficher le PDF dans un nouvel onglet
    const phaseName = phase.nom.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fileName = `phase-${phaseName}-t${phase.semaines}.pdf`;
    window.libLoader.displayPDF(doc, fileName);

    console.log('[PDF] Phase exportée:', fileName);
}
