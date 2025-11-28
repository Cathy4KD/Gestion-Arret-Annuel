/**
 * @fileoverview Module d'export PDF complet de l'arrêt annuel
 * @module export/pdf-export
 */

import { arretData } from '../data/arret-data.js';
import { getIw37nData } from '../data/iw37n-data.js';
import { getIw38Data } from '../data/iw38-data.js';
import { getStartDate, getEndDate } from '../data/settings.js';

/**
 * Génère un PDF complet de l'arrêt annuel
 */
export async function exportCompletePDF() {
    console.log('[PDF-EXPORT] Début de la génération du PDF...');

    // Vérifier que jsPDF est chargé
    if (typeof window.jspdf === 'undefined') {
        alert('Erreur: La bibliothèque jsPDF n\'est pas chargée.\nVeuillez recharger la page.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    let currentY = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // ==================== PAGE DE GARDE ====================
    addPageDeGarde(doc, pageWidth, pageHeight);
    doc.addPage();
    currentY = 20;

    // ==================== TABLE DES MATIÈRES ====================
    currentY = addTableOfContents(doc, currentY, margin, pageWidth);
    doc.addPage();
    currentY = 20;

    // ==================== INFORMATIONS GÉNÉRALES ====================
    currentY = addInformationsGenerales(doc, currentY, margin, pageWidth, pageHeight);

    // ==================== STATISTIQUES ====================
    currentY = addStatistiques(doc, currentY, margin, pageWidth, pageHeight);

    // ==================== PHASES DE PRÉPARATION ====================
    currentY = addPhasesPreparation(doc, currentY, margin, pageWidth, pageHeight);

    // ==================== RÉUNIONS ====================
    currentY = addReunions(doc, currentY, margin, pageWidth, pageHeight);

    // ==================== DONNÉES IW37N ====================
    currentY = addIW37NData(doc, currentY, margin, pageWidth, pageHeight);

    // ==================== DONNÉES IW38 ====================
    currentY = addIW38Data(doc, currentY, margin, pageWidth, pageHeight);

    // ==================== FOOTER SUR TOUTES LES PAGES ====================
    addFooters(doc);

    // ==================== AFFICHER LE PDF ====================
    const fileName = `Arret_Annuel_2026_Export_Complet_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);

    console.log('[PDF-EXPORT] ✅ PDF généré:', fileName);
}

/**
 * Ajoute la page de garde
 */
function addPageDeGarde(doc, pageWidth, pageHeight) {
    // Fond gradient (simulé avec rectangles)
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, pageHeight / 3, 'F');

    doc.setFillColor(118, 75, 162);
    doc.rect(0, pageHeight / 3, pageWidth, pageHeight / 3, 'F');

    doc.setFillColor(236, 240, 243);
    doc.rect(0, (pageHeight / 3) * 2, pageWidth, pageHeight / 3, 'F');

    // Titre principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('ARRÊT ANNUEL 2026', pageWidth / 2, 60, { align: 'center' });

    doc.setFontSize(18);
    doc.text('Archive Complète de Préparation', pageWidth / 2, 75, { align: 'center' });

    // Informations
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    const startDate = getStartDate() || '2026-03-31';
    const endDate = getEndDate() || '2026-04-14';
    doc.text(`Date: ${startDate} au ${endDate}`, pageWidth / 2, 120, { align: 'center' });

    // Date de génération
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const dateGeneration = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Document généré le ${dateGeneration}`, pageWidth / 2, 250, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Système de Gestion d\'Arrêt Annuel v2.0', pageWidth / 2, 270, { align: 'center' });
}

/**
 * Ajoute la table des matières
 */
function addTableOfContents(doc, y, margin, pageWidth) {
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('TABLE DES MATIÈRES', margin, y);
    y += 15;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    const contents = [
        '1. Informations Générales',
        '2. Statistiques et Tableau de Bord',
        '3. Phases de Préparation (détaillées)',
        '4. Bilan des Réunions',
        '5. Données IW37N (Ordres de Travail)',
        '6. Données IW38 (Suivi)',
        '7. Annexes'
    ];

    contents.forEach((item, index) => {
        doc.text(`${item}`, margin + 5, y);
        y += 8;
    });

    return y + 10;
}

/**
 * Ajoute les informations générales
 */
function addInformationsGenerales(doc, y, margin, pageWidth, pageHeight) {
    // Titre de section
    y = addSectionTitle(doc, 'INFORMATIONS GÉNÉRALES', y, margin, pageWidth, pageHeight);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const startDate = getStartDate() || '2026-03-31';
    const endDate = getEndDate() || '2026-04-14';
    const duree = arretData.duree || 14;

    const infos = [
        ['Date de début:', startDate],
        ['Date de fin:', endDate],
        ['Durée totale:', `${duree} jours`],
        ['Nombre de phases:', `${arretData.phases?.length || 0} phases`],
        ['Budget total:', `${arretData.budgetTotal || 0} $`]
    ];

    infos.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(value, margin + 50, y);
        y += 7;
    });

    return y + 10;
}

/**
 * Ajoute les statistiques
 */
function addStatistiques(doc, y, margin, pageWidth, pageHeight) {
    y = addSectionTitle(doc, 'STATISTIQUES', y, margin, pageWidth, pageHeight);

    const phases = arretData.phases || [];
    let totalTaches = 0;
    let tachesCompleted = 0;
    let tachesInProgress = 0;
    let tachesNotStarted = 0;

    phases.forEach(phase => {
        if (phase.taches) {
            totalTaches += phase.taches.length;
            phase.taches.forEach(tache => {
                if (tache.statut === 'completed') tachesCompleted++;
                else if (tache.statut === 'inprogress') tachesInProgress++;
                else tachesNotStarted++;
            });
        }
    });

    const stats = [
        ['Total des tâches:', totalTaches],
        ['Tâches complétées:', `${tachesCompleted} (${((tachesCompleted / totalTaches) * 100).toFixed(1)}%)`],
        ['Tâches en cours:', `${tachesInProgress} (${((tachesInProgress / totalTaches) * 100).toFixed(1)}%)`],
        ['Tâches non commencées:', `${tachesNotStarted} (${((tachesNotStarted / totalTaches) * 100).toFixed(1)}%)`]
    ];

    doc.setFontSize(10);
    stats.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(String(value), margin + 60, y);
        y += 7;
    });

    return y + 10;
}

/**
 * Ajoute les phases de préparation
 */
function addPhasesPreparation(doc, y, margin, pageWidth, pageHeight) {
    y = addSectionTitle(doc, 'PHASES DE PRÉPARATION', y, margin, pageWidth, pageHeight);

    const phases = arretData.phases || [];

    phases.forEach(phase => {
        // Vérifier l'espace disponible
        if (y > pageHeight - 60) {
            doc.addPage();
            y = 20;
        }

        // En-tête de phase
        doc.setFillColor(102, 126, 234);
        doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`${phase.nom} (${phase.semaines} semaines)`, margin + 2, y);
        y += 10;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');

        if (phase.taches && phase.taches.length > 0) {
            phase.taches.forEach((tache, idx) => {
                if (y > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }

                const statutSymbol = getStatutSymbol(tache.statut);
                doc.text(`${statutSymbol} ${tache.titre}`, margin + 5, y);
                y += 5;
            });
        }

        y += 5;
    });

    return y + 10;
}

/**
 * Ajoute les réunions
 */
function addReunions(doc, y, margin, pageWidth, pageHeight) {
    y = addSectionTitle(doc, 'BILAN DES RÉUNIONS', y, margin, pageWidth, pageHeight);

    const phases = arretData.phases || [];
    const reunions = [];

    phases.forEach(phase => {
        if (phase.taches) {
            phase.taches.forEach(tache => {
                const titre = tache.titre || '';
                if (titre.toUpperCase().includes('RENCONTRE') ||
                    titre.toUpperCase().includes('RÉUNION')) {
                    reunions.push({
                        titre: titre,
                        phase: phase.nom,
                        semaines: phase.semaines,
                        responsable: tache.responsable,
                        statut: tache.statut
                    });
                }
            });
        }
    });

    doc.setFontSize(10);
    doc.text(`Total: ${reunions.length} réunions planifiées`, margin, y);
    y += 10;

    doc.setFontSize(8);
    reunions.forEach(reunion => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }

        const statutSymbol = getStatutSymbol(reunion.statut);
        doc.text(`${statutSymbol} [${reunion.semaines}sem] ${reunion.titre.substring(0, 80)}`, margin + 2, y);
        y += 5;
    });

    return y + 10;
}

/**
 * Ajoute les données IW37N
 */
function addIW37NData(doc, y, margin, pageWidth, pageHeight) {
    y = addSectionTitle(doc, 'DONNÉES IW37N (Ordres de Travail)', y, margin, pageWidth, pageHeight);

    const iw37nData = getIw37nData();

    doc.setFontSize(10);
    doc.text(`Total: ${iw37nData.length} ordres de travail`, margin, y);
    y += 10;

    if (iw37nData.length > 0) {
        doc.setFontSize(8);
        doc.text('Échantillon des premiers ordres:', margin, y);
        y += 7;

        const sample = iw37nData.slice(0, 20);
        sample.forEach((ordre, idx) => {
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }

            const texte = `${ordre.Ordre || 'N/A'} - ${(ordre['Désign. opér.'] || 'N/A').substring(0, 60)}`;
            doc.text(texte, margin + 2, y);
            y += 5;
        });

        if (iw37nData.length > 20) {
            y += 3;
            doc.setFont(undefined, 'italic');
            doc.text(`... et ${iw37nData.length - 20} autres ordres`, margin + 2, y);
            doc.setFont(undefined, 'normal');
            y += 7;
        }
    }

    return y + 10;
}

/**
 * Ajoute les données IW38
 */
function addIW38Data(doc, y, margin, pageWidth, pageHeight) {
    y = addSectionTitle(doc, 'DONNÉES IW38 (Suivi)', y, margin, pageWidth, pageHeight);

    const iw38Data = getIw38Data();

    doc.setFontSize(10);
    doc.text(`Total: ${iw38Data.length} entrées de suivi`, margin, y);
    y += 10;

    return y + 10;
}

/**
 * Ajoute un titre de section
 */
function addSectionTitle(doc, title, y, margin, pageWidth, pageHeight) {
    if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
    }

    doc.setFillColor(236, 240, 243);
    doc.rect(0, y - 5, pageWidth, 12, 'F');

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text(title, margin, y + 3);

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    return y + 15;
}

/**
 * Obtient le symbole de statut
 */
function getStatutSymbol(statut) {
    const symbols = {
        'completed': '✓',
        'inprogress': '◐',
        'notstarted': '○',
        'cancelled': '✕'
    };
    return symbols[statut] || '○';
}

/**
 * Ajoute les footers sur toutes les pages
 */
function addFooters(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('Arrêt Annuel 2026 - Document Confidentiel', pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
}

/**
 * Expose la fonction globalement
 */
if (typeof window !== 'undefined') {
    window.exportCompletePDF = exportCompletePDF;
}

console.log('[PDF-EXPORT] Module initialisé');
