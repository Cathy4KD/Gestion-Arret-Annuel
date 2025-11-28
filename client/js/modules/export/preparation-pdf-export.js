/**
 * @fileoverview Module d'export PDF pour la Préparation et le Bilan des Réunions
 * @module export/preparation-pdf-export
 */

import { arretData } from '../data/arret-data.js';
import { getStartDate, getEndDate } from '../data/settings.js';
import { extractReunions } from '../ui/bilan-reunions.js';

console.log('[PDF-EXPORT] ✅ Module preparation-pdf-export.js chargé');

/**
 * Toggle le menu d'export PDF pour les réunions
 */
export function toggleReunionsMenu() {
    const menu = document.getElementById('reunionsPDFMenu');
    if (menu) {
        if (menu.style.display === 'none') {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    }

    // Fermer le menu si on clique ailleurs
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!e.target.closest('#btnExportReunionsPDF') && !e.target.closest('#reunionsPDFMenu')) {
                if (menu) menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

/**
 * Exporte l'écran de Préparation (Timeline/Tableau) en PDF
 */
export async function exportPreparationPDF() {
    console.log('[PDF-EXPORT] Début export Préparation...');

    // Vérifier que jsPDF est chargé
    if (typeof window.jspdf === 'undefined') {
        alert('❌ Erreur: La bibliothèque jsPDF n\'est pas chargée.\nVeuillez recharger la page.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 6;
    let currentY = margin;

    // En-tête minimal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PRÉPARATION ARRÊT 2026', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    // Informations en ligne ultra-compacte
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    const startDate = getStartDate();
    const endDate = getEndDate();
    doc.text(`${formatDate(startDate)} - ${formatDate(endDate)} | Impression: ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3;

    // Définir les colonnes du tableau style Excel strict
    const colWidths = {
        phase: 18,      // Phase
        tache: 100,     // Tâche (maximisée)
        responsable: 18, // Responsable
        avancement: 12,  // Avancement
        statut: 22      // Statut
    };

    // En-tête du tableau style Excel avec bordures épaisses
    const headerHeight = 5;
    doc.setFillColor(79, 129, 189); // Bleu Excel
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    let colX = margin;

    // Dessiner les cellules d'en-tête
    doc.rect(colX, currentY, colWidths.phase, headerHeight, 'FD');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Phase', colX + 0.5, currentY + 3.5);
    colX += colWidths.phase;

    doc.rect(colX, currentY, colWidths.tache, headerHeight, 'FD');
    doc.text('Tâche', colX + 0.5, currentY + 3.5);
    colX += colWidths.tache;

    doc.rect(colX, currentY, colWidths.responsable, headerHeight, 'FD');
    doc.text('Resp.', colX + 0.5, currentY + 3.5);
    colX += colWidths.responsable;

    doc.rect(colX, currentY, colWidths.avancement, headerHeight, 'FD');
    doc.text('Avanc.', colX + 0.5, currentY + 3.5);
    colX += colWidths.avancement;

    doc.rect(colX, currentY, colWidths.statut, headerHeight, 'FD');
    doc.text('Statut', colX + 0.5, currentY + 3.5);

    currentY += headerHeight;
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.2);

    // Parcourir les phases et créer les lignes du tableau
    arretData.phases.forEach((phase, phaseIndex) => {
        phase.taches.forEach((tache, tacheIndex) => {
            // Calculer la hauteur nécessaire pour cette ligne (ultra-compact)
            const maxTacheWidth = colWidths.tache - 2;
            const tacheLines = doc.splitTextToSize(tache.titre, maxTacheWidth);
            const lineHeight = Math.max(5, tacheLines.length * 2.2 + 1);

            // Vérifier si on a besoin d'une nouvelle page
            if (currentY + lineHeight > pageHeight - margin - 3) {
                doc.addPage();
                currentY = margin;

                // Redessiner l'en-tête du tableau style Excel
                doc.setFillColor(79, 129, 189);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.3);

                colX = margin;

                doc.rect(colX, currentY, colWidths.phase, headerHeight, 'FD');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(5.5);
                doc.setFont('helvetica', 'bold');
                doc.text('Phase', colX + 0.5, currentY + 3.5);
                colX += colWidths.phase;

                doc.rect(colX, currentY, colWidths.tache, headerHeight, 'FD');
                doc.text('Tâche', colX + 0.5, currentY + 3.5);
                colX += colWidths.tache;

                doc.rect(colX, currentY, colWidths.responsable, headerHeight, 'FD');
                doc.text('Resp.', colX + 0.5, currentY + 3.5);
                colX += colWidths.responsable;

                doc.rect(colX, currentY, colWidths.avancement, headerHeight, 'FD');
                doc.text('Avanc.', colX + 0.5, currentY + 3.5);
                colX += colWidths.avancement;

                doc.rect(colX, currentY, colWidths.statut, headerHeight, 'FD');
                doc.text('Statut', colX + 0.5, currentY + 3.5);

                currentY += headerHeight;
                doc.setTextColor(0, 0, 0);
                doc.setLineWidth(0.2);
            }

            // Dessiner la ligne du tableau style Excel strict
            const rowY = currentY;

            // Fond blanc ou gris alterné (style Excel)
            if ((phaseIndex + tacheIndex) % 2 === 0) {
                doc.setFillColor(245, 245, 245);
            } else {
                doc.setFillColor(255, 255, 255);
            }
            doc.rect(margin, rowY, pageWidth - (2 * margin), lineHeight, 'F');

            // Bordures de grille noires
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);

            colX = margin;

            // ===== PHASE =====
            doc.rect(colX, rowY, colWidths.phase, lineHeight, 'D');
            if (tacheIndex === 0) {
                doc.setFontSize(5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                const phaseLines = doc.splitTextToSize(phase.nom, colWidths.phase - 1.5);
                doc.text(phaseLines, colX + 0.5, rowY + 2);
            }
            colX += colWidths.phase;

            // ===== TÂCHE =====
            doc.rect(colX, rowY, colWidths.tache, lineHeight, 'D');
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(tacheLines, colX + 0.5, rowY + 2);
            colX += colWidths.tache;

            // ===== RESPONSABLE =====
            doc.rect(colX, rowY, colWidths.responsable, lineHeight, 'D');
            doc.setFontSize(5);
            doc.setFont('helvetica', 'normal');
            const respText = tache.responsable || 'N/A';
            const respLines = doc.splitTextToSize(respText, colWidths.responsable - 1);
            doc.text(respLines, colX + 0.5, rowY + lineHeight / 2);
            colX += colWidths.responsable;

            // ===== AVANCEMENT =====
            doc.rect(colX, rowY, colWidths.avancement, lineHeight, 'D');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            doc.text(`${tache.avancement || 0}%`, colX + colWidths.avancement / 2, rowY + lineHeight / 2, { align: 'center' });
            colX += colWidths.avancement;

            // ===== STATUT =====
            doc.rect(colX, rowY, colWidths.statut, lineHeight, 'D');
            const statusColor = getStatusColor(tache.statut);
            doc.setFontSize(5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
            const statutText = getStatutLabel(tache.statut);
            const statutLines = doc.splitTextToSize(statutText, colWidths.statut - 1);
            doc.text(statutLines, colX + 0.5, rowY + lineHeight / 2);

            doc.setTextColor(0, 0, 0);
            currentY += lineHeight;
        });
    });

    // Ligne de séparation double avant les statistiques
    currentY += 1;
    if (currentY > pageHeight - 10) {
        doc.addPage();
        currentY = margin;
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 0.5;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2.5;

    // Statistiques finales en style Excel compact
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    let totalTaches = 0;
    let completees = 0;
    let enCours = 0;
    arretData.phases.forEach(phase => {
        totalTaches += phase.taches.length;
        completees += phase.taches.filter(t => t.statut === 'completed').length;
        enCours += phase.taches.filter(t => t.statut === 'inprogress').length;
    });

    const nonCommencees = totalTaches - completees - enCours;
    const tauxCompletion = totalTaches > 0 ? Math.round((completees / totalTaches) * 100) : 0;

    // Créer un mini-tableau pour les statistiques
    const statsY = currentY;
    const statsHeight = 4;
    const statsColWidth = (pageWidth - 2 * margin) / 5;

    doc.setFillColor(220, 220, 220);
    doc.setLineWidth(0.2);

    for (let i = 0; i < 5; i++) {
        doc.rect(margin + i * statsColWidth, statsY, statsColWidth, statsHeight, 'FD');
    }

    doc.setTextColor(0, 0, 0);
    doc.text(`Total: ${totalTaches}`, margin + 1, statsY + 2.8);
    doc.text(`OK: ${completees}`, margin + statsColWidth + 1, statsY + 2.8);
    doc.text(`En cours: ${enCours}`, margin + 2 * statsColWidth + 1, statsY + 2.8);
    doc.text(`Reste: ${nonCommencees}`, margin + 3 * statsColWidth + 1, statsY + 2.8);
    doc.text(`Taux: ${tauxCompletion}%`, margin + 4 * statsColWidth + 1, statsY + 2.8);

    // Afficher le PDF dans un nouvel onglet
    const fileName = `Preparation_Arret_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);
    console.log('[PDF-EXPORT] ✅ PDF Préparation généré:', fileName);
}

/**
 * Exporte le résumé des réunions (nom + dates uniquement)
 */
export async function exportReunionsSummaryPDF() {
    console.log('[PDF-EXPORT] Début export Résumé Réunions...');

    // Fermer le menu
    const menu = document.getElementById('reunionsPDFMenu');
    if (menu) menu.style.display = 'none';

    // Vérifier que jsPDF est chargé
    if (typeof window.jspdf === 'undefined') {
        alert('❌ Erreur: La bibliothèque jsPDF n\'est pas chargée.\nVeuillez recharger la page.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    let currentY = margin;

    // En-tête
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 RÉSUMÉ DES RÉUNIONS DE PRÉPARATION', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Info date
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'impression: ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Ligne de séparation
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // Extraire les réunions
    const reunions = extractReunions();

    if (reunions.length === 0) {
        doc.setFontSize(10);
        doc.text('Aucune réunion trouvée.', pageWidth / 2, currentY, { align: 'center' });
    } else {
        // Statistiques compactes
        const completees = reunions.filter(r => r.statut === 'completed').length;
        const enCours = reunions.filter(r => r.statut === 'inprogress').length;
        const nonCommencees = reunions.filter(r => r.statut === 'notstarted').length;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${reunions.length}`, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Complétées: ${completees}`, margin + 35, currentY);
        doc.text(`En cours: ${enCours}`, margin + 80, currentY);
        doc.text(`Non commencées: ${nonCommencees}`, margin + 120, currentY);
        currentY += 7;

        // Ligne de séparation
        doc.setLineWidth(0.2);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 5;

        // Liste des réunions groupées par phase
        const phases = {};
        reunions.forEach(reunion => {
            if (!phases[reunion.phase]) {
                phases[reunion.phase] = [];
            }
            phases[reunion.phase].push(reunion);
        });

        Object.keys(phases).sort().forEach(phaseNom => {
            if (currentY > pageHeight - 25) {
                doc.addPage();
                currentY = margin;
            }

            // Nom de la phase (plus compact)
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(102, 126, 234);
            doc.setTextColor(255, 255, 255);
            doc.rect(margin, currentY - 3, pageWidth - (2 * margin), 5, 'F');
            doc.text(phaseNom, margin + 2, currentY);
            currentY += 6;
            doc.setTextColor(0, 0, 0);

            // Réunions de la phase
            phases[phaseNom].forEach(reunion => {
                if (currentY > pageHeight - 15) {
                    doc.addPage();
                    currentY = margin;
                }

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');

                // Bullet point avec couleur de statut
                const statusColor = getStatusColor(reunion.statut);
                doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
                doc.circle(margin + 2, currentY - 0.5, 1, 'F');

                // Titre de la réunion (plus compact)
                const maxWidth = pageWidth - margin - 45;
                const reunionText = doc.splitTextToSize(reunion.titre, maxWidth);
                doc.text(reunionText, margin + 5, currentY);

                // Date et responsable sur la même ligne
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(80, 80, 80);
                doc.text(`${reunion.datePrevue}`, pageWidth - margin - 30, currentY);

                const lineHeight = Math.max(3, reunionText.length * 3);
                currentY += lineHeight;
            });

            currentY += 2;
        });
    }

    // Afficher le PDF dans un nouvel onglet
    const fileName = `Resume_Reunions_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);
    console.log('[PDF-EXPORT] ✅ PDF Résumé Réunions généré:', fileName);
}

/**
 * Exporte le bilan complet des réunions avec comptes rendus
 */
export async function exportReunionsCompletePDF() {
    console.log('[PDF-EXPORT] Début export Complet Réunions...');

    // Fermer le menu
    const menu = document.getElementById('reunionsPDFMenu');
    if (menu) menu.style.display = 'none';

    // Vérifier que jsPDF est chargé
    if (typeof window.jspdf === 'undefined') {
        alert('❌ Erreur: La bibliothèque jsPDF n\'est pas chargée.\nVeuillez recharger la page.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    let currentY = margin;

    // En-tête
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📄 BILAN COMPLET DES RÉUNIONS', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Info date
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'impression: ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Ligne de séparation
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // Extraire les réunions
    const reunions = extractReunions();

    if (reunions.length === 0) {
        doc.setFontSize(10);
        doc.text('Aucune réunion trouvée.', pageWidth / 2, currentY, { align: 'center' });
    } else {
        // Grouper par phase
        const phases = {};
        reunions.forEach(reunion => {
            if (!phases[reunion.phase]) {
                phases[reunion.phase] = [];
            }
            phases[reunion.phase].push(reunion);
        });

        let reunionNumber = 1;

        Object.keys(phases).sort().forEach(phaseNom => {
            phases[phaseNom].forEach(reunion => {
                if (currentY > pageHeight - 50) {
                    doc.addPage();
                    currentY = margin;
                }

                // Encadré compact de la réunion
                doc.setFillColor(245, 245, 245);
                const headerHeight = 20;
                doc.rect(margin, currentY, pageWidth - (2 * margin), headerHeight, 'F');
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.rect(margin, currentY, pageWidth - (2 * margin), headerHeight);

                // Numéro et titre compacts
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(102, 126, 234);
                doc.text(`#${reunionNumber}`, margin + 2, currentY + 4);

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
                const maxTitleWidth = pageWidth - (2 * margin) - 15;
                const titreLines = doc.splitTextToSize(reunion.titre, maxTitleWidth);
                doc.text(titreLines, margin + 10, currentY + 4);

                const titleHeight = Math.min(titreLines.length * 3.5, 12);
                let infoY = currentY + 4 + titleHeight;

                // Informations compactes sur une ligne
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80, 80, 80);
                doc.text(`Date: ${reunion.datePrevue}`, margin + 2, infoY);
                doc.text(`Resp: ${reunion.responsable || 'N/A'}`, margin + 50, infoY);

                // Statut avec couleur
                const statusColor = getStatusColor(reunion.statut);
                doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
                doc.setFont('helvetica', 'bold');
                doc.text(`${getStatutLabel(reunion.statut)}`, margin + 95, infoY);

                // Avancement
                doc.setTextColor(80, 80, 80);
                doc.setFont('helvetica', 'normal');
                doc.text(`${reunion.avancement || 0}%`, margin + 135, infoY);

                currentY += headerHeight + 2;

                // Compte rendu compact
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Compte Rendu:', margin + 2, currentY);
                currentY += 4;

                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');

                if (reunion.commentaire && reunion.commentaire.trim() !== '') {
                    const commentaireLines = doc.splitTextToSize(reunion.commentaire, pageWidth - (2 * margin) - 6);
                    doc.setFillColor(255, 255, 255);
                    const boxHeight = Math.min(commentaireLines.length * 3 + 3, 40);
                    doc.rect(margin, currentY, pageWidth - (2 * margin), boxHeight, 'F');
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.1);
                    doc.rect(margin, currentY, pageWidth - (2 * margin), boxHeight);
                    doc.text(commentaireLines, margin + 2, currentY + 3);
                    currentY += boxHeight + 2;
                } else {
                    doc.setTextColor(130, 130, 130);
                    doc.setFontSize(7);
                    doc.text('Aucun compte rendu disponible.', margin + 2, currentY);
                    doc.setTextColor(0, 0, 0);
                    currentY += 4;
                }

                currentY += 5;
                reunionNumber++;
            });
        });
    }

    // Sauvegarder le PDF
    const fileName = `Bilan_Complet_Reunions_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);
    console.log('[PDF-EXPORT] ✅ PDF Bilan Complet Réunions généré:', fileName);
}

/**
 * Formate une date ISO en format lisible
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {string} Date formatée
 */
function formatDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
        return dateStr;
    }
}

/**
 * Retourne la couleur RGB selon le statut
 * @param {string} statut - Statut de la tâche
 * @returns {Object} {r, g, b}
 */
function getStatusColor(statut) {
    switch (statut) {
        case 'completed':
            return { r: 40, g: 167, b: 69 }; // Vert
        case 'inprogress':
            return { r: 255, g: 193, b: 7 }; // Orange
        case 'notstarted':
        default:
            return { r: 220, g: 53, b: 69 }; // Rouge
    }
}

/**
 * Retourne le label du statut
 * @param {string} statut - Statut de la tâche
 * @returns {string} Label
 */
function getStatutLabel(statut) {
    switch (statut) {
        case 'completed':
            return 'Complétée';
        case 'inprogress':
            return 'En cours';
        case 'notstarted':
        default:
            return 'Non commencée';
    }
}
