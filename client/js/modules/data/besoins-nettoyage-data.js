/**
 * @fileoverview Module de gestion des besoins de nettoyage (T68)
 * Filtre les données IW37N pour les postes ORTEC, AEROVAC, VEOLIA
 * @module data/besoins-nettoyage-data
 */

import { iw37nData } from './iw37n-data.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Liste des postes de travail pour le nettoyage
 */
const POSTES_NETTOYAGE = ['ORTEC', 'AEROVAC', 'VEOLIA'];

/**
 * Stockage des commentaires par ordre
 */
let commentairesNettoyage = {};

/**
 * Charge les commentaires depuis le storage
 */
async function loadCommentaires() {
    const saved = await loadFromStorage('besoinsNettoyageCommentaires');
    if (saved) {
        commentairesNettoyage = saved;
        console.log('[BESOINS-NETTOYAGE] Commentaires chargés');
    }
}

/**
 * Sauvegarde les commentaires
 */
async function saveCommentaires() {
    await saveToStorage('besoinsNettoyageCommentaires', commentairesNettoyage);
    console.log('[BESOINS-NETTOYAGE] Commentaires sauvegardés');
}

/**
 * Met à jour un commentaire
 */
function updateCommentaire(ordre, commentaire) {
    commentairesNettoyage[ordre] = commentaire;
    saveCommentaires();
}

/**
 * Récupère les lignes IW37N filtrées pour les besoins de nettoyage
 * @returns {Array} Lignes filtrées
 */
export function getBesoinsNettoyage() {
    if (!iw37nData || iw37nData.length === 0) {
        return [];
    }

    return iw37nData.filter(row => {
        const poste = row['Post.trav.opér.'] || '';
        return POSTES_NETTOYAGE.includes(poste.trim().toUpperCase());
    });
}

/**
 * Rend le tableau des besoins de nettoyage
 */
export function renderBesoinsNettoyageTable() {
    const tbody = document.getElementById('besoinsNettoyageTableBody');
    const countSpan = document.getElementById('besoinsNettoyageCount');

    if (!tbody) {
        console.warn('[BESOINS-NETTOYAGE] Element besoinsNettoyageTableBody non trouvé');
        return;
    }

    const besoins = getBesoinsNettoyage();
    const totalCount = besoins.length;

    if (countSpan) {
        countSpan.textContent = totalCount;
    }

    if (besoins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucune donnée de nettoyage disponible. Veuillez charger des données IW37N contenant des postes ORTEC, AEROVAC ou VEOLIA.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    besoins.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        // Extraire les données
        const ordre = row['Ordre'] || '-';
        const designOper = row['Désign. opér.'] || '-';
        const operation = row['Opération'] || '-';
        const posteTechnique = row['Poste technique'] || '-';
        const posteTravail = row['Post.trav.opér.'] || '-';

        // Badge de couleur selon le poste
        let badgeColor = '#667eea';
        if (posteTravail === 'ORTEC') badgeColor = '#3b82f6';
        else if (posteTravail === 'AEROVAC') badgeColor = '#10b981';
        else if (posteTravail === 'VEOLIA') badgeColor = '#f59e0b';

        const commentaire = commentairesNettoyage[ordre] || '';

        tr.innerHTML = `
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-weight: 600; text-align: center; font-size: 0.9em;">
                ${ordre}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-size: 0.9em;">
                ${designOper}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center; font-size: 0.9em;">
                ${operation}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <span style="display: inline-block; padding: 3px 10px; background: ${badgeColor}; color: white; border-radius: 12px; font-size: 0.8em; font-weight: 600;">
                    ${posteTravail}
                </span>
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-size: 0.9em;">
                ${posteTechnique}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <textarea onchange="window.besoinsNettoyageActions.updateCommentaire('${ordre}', this.value)"
                          class="auto-resize"
                          placeholder="Ajoutez un commentaire..."
                          style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; resize: none; overflow: hidden; font-size: 0.9em; line-height: 1.4;">${commentaire}</textarea>
            </td>
        `;
        tbody.appendChild(tr);
    });

    console.log(`[BESOINS-NETTOYAGE] ✅ ${besoins.length} ligne(s) affichée(s)`);
}

/**
 * Initialise le module
 */
export async function initBesoinsNettoyage() {
    console.log('[BESOINS-NETTOYAGE] Initialisation...');
    await loadCommentaires();
    renderBesoinsNettoyageTable();
}

/**
 * Exporte les besoins de nettoyage en Excel
 */
export function exportToExcel() {
    const besoins = getBesoinsNettoyage();

    if (besoins.length === 0) {
        alert('⚠️ Aucune donnée à exporter.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('❌ Bibliothèque XLSX non chargée');
        return;
    }

    const exportData = besoins.map(row => ({
        'Ordre': row['Ordre'] || '',
        'Désignation Opération': row['Désign. opér.'] || '',
        'Opération': row['Opération'] || '',
        'Poste Travail': row['Post.trav.opér.'] || '',
        'Poste Technique': row['Poste technique'] || '',
        'Commentaire': commentairesNettoyage[row['Ordre']] || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Besoins Nettoyage');

    const fileName = `Besoins_Nettoyage_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log('[BESOINS-NETTOYAGE] ✅ Excel exporté:', fileName);
}

/**
 * Exporte les besoins de nettoyage en PDF
 */
export function exportToPDF() {
    const besoins = getBesoinsNettoyage();

    if (besoins.length === 0) {
        alert('⚠️ Aucune donnée à exporter.');
        return;
    }

    if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
        alert('❌ Bibliothèque jsPDF non chargée');
        return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Format paysage

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Titre
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('BESOINS DE NETTOYAGE POUR CHACUNE DES JOBS', pageWidth / 2, 20, { align: 'center' });

    // Date d'export
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 27, { align: 'center' });

    // Tableau
    let yPos = 40;
    const colWidths = [25, 60, 20, 30, 45, 50];
    const colX = [
        margin,
        margin + colWidths[0],
        margin + colWidths[0] + colWidths[1],
        margin + colWidths[0] + colWidths[1] + colWidths[2],
        margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4]
    ];

    // En-tête du tableau
    doc.setFillColor(102, 126, 234);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');

    doc.text('Ordre', colX[0] + 2, yPos + 7);
    doc.text('Désignation Opération', colX[1] + 2, yPos + 7);
    doc.text('Opération', colX[2] + 2, yPos + 7);
    doc.text('Poste Travail', colX[3] + 2, yPos + 7);
    doc.text('Poste Technique', colX[4] + 2, yPos + 7);
    doc.text('Commentaire', colX[5] + 2, yPos + 7);

    yPos += 10;

    // Lignes du tableau
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);

    besoins.forEach((row, index) => {
        // Vérifier si on doit changer de page
        if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
        }

        // Alternance de couleur
        if (index % 2 === 0) {
            doc.setFillColor(249, 249, 249);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        }

        // Ordre
        doc.text((row['Ordre'] || '').toString(), colX[0] + 2, yPos + 6);

        // Désignation (tronquée si trop longue)
        const designText = doc.splitTextToSize(row['Désign. opér.'] || '', colWidths[1] - 4);
        doc.text(designText[0], colX[1] + 2, yPos + 6);

        // Opération
        doc.text((row['Opération'] || '').toString(), colX[2] + 2, yPos + 6);

        // Poste Travail
        doc.text(row['Post.trav.opér.'] || '', colX[3] + 2, yPos + 6);

        // Poste Technique
        const posteTechText = doc.splitTextToSize(row['Poste technique'] || '', colWidths[4] - 4);
        doc.text(posteTechText[0], colX[4] + 2, yPos + 6);

        // Commentaire
        const commentaire = commentairesNettoyage[row['Ordre']] || '';
        const commentaireText = doc.splitTextToSize(commentaire, colWidths[5] - 4);
        doc.text(commentaireText[0] || '', colX[5] + 2, yPos + 6);

        yPos += 8;
    });

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Total: ${besoins.length} ligne(s)`, margin, pageHeight - 10);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    // Afficher le PDF dans un nouvel onglet
    const filename = `Besoins_Nettoyage_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, filename);

    console.log('[BESOINS-NETTOYAGE] ✅ PDF exporté:', filename);
}

// Exposer globalement
window.besoinsNettoyageActions = {
    renderBesoinsNettoyageTable,
    exportToExcel,
    exportToPDF,
    initBesoinsNettoyage,
    updateCommentaire
};

console.log('[BESOINS-NETTOYAGE] ✅ Module chargé');
