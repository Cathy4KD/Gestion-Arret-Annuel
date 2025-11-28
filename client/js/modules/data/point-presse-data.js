/**
 * @fileoverview Gestion des Points de Presse (Journal de Bord)
 * @module data/point-presse-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les données de point de presse
 * @const {string}
 */
const STORAGE_KEY = 'pointPresseData';

/**
 * Données des points de presse
 * @type {Array}
 */
let pointPresseData = [];

/**
 * Charge les données depuis localStorage
 * @returns {void}
 */
export async function loadPointPresseData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved && Array.isArray(saved)) {
        pointPresseData = saved;
        console.log(`[POINT-PRESSE] ${pointPresseData.length} points de presse chargés depuis localStorage`);
    } else {
        // S'assurer que pointPresseData est toujours un tableau
        pointPresseData = [];
        console.log('[POINT-PRESSE] Aucune donnée valide, initialisation à tableau vide');
    }
}

/**
 * Sauvegarde les données dans localStorage ET serveur
 * @returns {void}
 */
async function savePointPresseData() {
    await saveToStorage(STORAGE_KEY, pointPresseData);
    console.log('[POINT-PRESSE] Données sauvegardées et synchronisées avec le serveur');
}

/**
 * Ajoute un nouveau point de presse
 * @param {Object} pointPresse - Données du point de presse
 * @returns {string} ID du point de presse créé
 */
export function addPointPresse(pointPresse) {
    const id = 'pp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const newPointPresse = {
        id: id,
        dateCreation: new Date().toISOString(),

        // Informations générales
        jour: pointPresse.jour || '',
        date: pointPresse.date || new Date().toISOString().split('T')[0],
        duree: pointPresse.duree || '',
        nbTravailleurs: pointPresse.nbTravailleurs || 0,

        // Arrêt/Départ
        arretPrevu: pointPresse.arretPrevu || '',
        arretReel: pointPresse.arretReel || '',
        departPrevu: pointPresse.departPrevu || '',
        departReel: pointPresse.departReel || '',

        // Indicateurs SSE (24H et Total)
        indicateurs: {
            arreterDemanderAide: { h24: pointPresse.arreterAide24 || 0, total: pointPresse.arreterAideTotal || 0 },
            incidentBlessure: { h24: pointPresse.incidentBlessure24 || 0, total: pointPresse.incidentBlessureTotal || 0 },
            incidentAutre: { h24: pointPresse.incidentAutre24 || 0, total: pointPresse.incidentAutreTotal || 0 },
            problemeQualiteMin: { h24: pointPresse.qualiteMin24 || 0, total: pointPresse.qualiteMinTotal || 0 },
            problemeQualiteMaj: { h24: pointPresse.qualiteMaj24 || 0, total: pointPresse.qualiteMajTotal || 0 },
            reelVsCible: { h24: pointPresse.reelVsCible24 || 0, total: pointPresse.reelVsCibleTotal || 0 }
        },

        // SSE/PBO
        ssePBO: pointPresse.ssePBO || '',

        // Avancement des travaux
        travauxEntretien: {
            avancement: pointPresse.entretienAvancement || '',
            completes: pointPresse.entretienCompletes || ''
        },
        travauxCorrectifs: {
            avancement: pointPresse.correctifsAvancement || '',
            completes: pointPresse.correctifsCompletes || ''
        },
        travauxProjets: {
            avancement: pointPresse.projetsAvancement || '',
            completes: pointPresse.projetsCompletes || ''
        },

        // Sections textuelles
        enjeuPrincipal: pointPresse.enjeuPrincipal || '',
        problemesImprevus: pointPresse.problemesImprevus || '',
        bonCoup: pointPresse.bonCoup || '',
        aVenir: pointPresse.aVenir || '',

        // Upside/Downside (du PDF)
        upside: pointPresse.upside || [],
        downside: pointPresse.downside || [],

        // Statut suivi coûts
        statutCouts: pointPresse.statutCouts || '',

        // État des chemins critiques
        cheminsCritiques: pointPresse.cheminsCritiques || [],

        // Incidents détaillés
        incidents: pointPresse.incidents || [],

        // Photos/Images
        photos: pointPresse.photos || []
    };

    pointPresseData.push(newPointPresse);
    savePointPresseData();

    console.log('[POINT-PRESSE] Nouveau point de presse ajouté:', id);
    return id;
}

/**
 * Met à jour un point de presse existant
 * @param {string} id - ID du point de presse
 * @param {Object} updates - Données à mettre à jour
 * @returns {boolean} Succès de la mise à jour
 */
export function updatePointPresse(id, updates) {
    const index = pointPresseData.findIndex(pp => pp.id === id);
    if (index !== -1) {
        pointPresseData[index] = { ...pointPresseData[index], ...updates };
        savePointPresseData();
        console.log('[POINT-PRESSE] Point de presse mis à jour:', id);
        return true;
    }
    return false;
}

/**
 * Supprime un point de presse
 * @param {string} id - ID du point de presse à supprimer
 * @returns {boolean} Succès de la suppression
 */
export function deletePointPresse(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce point de presse ?')) {
        const index = pointPresseData.findIndex(pp => pp.id === id);
        if (index !== -1) {
            pointPresseData.splice(index, 1);
            savePointPresseData();
            console.log('[POINT-PRESSE] Point de presse supprimé:', id);
            return true;
        }
    }
    return false;
}

/**
 * Récupère un point de presse par ID
 * @param {string} id - ID du point de presse
 * @returns {Object|null} Point de presse ou null si non trouvé
 */
export function getPointPresseById(id) {
    return pointPresseData.find(pp => pp.id === id) || null;
}

/**
 * Récupère tous les points de presse
 * @returns {Array} Liste des points de presse
 */
export function getAllPointsPresse() {
    // S'assurer que pointPresseData est un tableau
    if (!Array.isArray(pointPresseData)) {
        console.warn('[POINT-PRESSE] pointPresseData n\'est pas un tableau, initialisation à []');
        pointPresseData = [];
        return [];
    }
    return [...pointPresseData].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Récupère les points de presse par date
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Array} Points de presse pour cette date
 */
export function getPointPresseByDate(date) {
    return pointPresseData.filter(pp => pp.date === date);
}

/**
 * Exporte les données vers Excel
 * @returns {void}
 */
export function exportPointPresseToExcel() {
    if (!Array.isArray(pointPresseData) || pointPresseData.length === 0) {
        alert('⚠️ Aucune donnée à exporter.');
        return;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[POINT-PRESSE] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    try {
        // Préparer les données pour l'export
        const exportData = pointPresseData.map(pp => ({
            'Date': pp.date,
            'Jour': pp.jour,
            'Durée': pp.duree,
            'Nb. Travailleurs': pp.nbTravailleurs,
            'Arrêt Prévu': pp.arretPrevu,
            'Arrêt Réel': pp.arretReel,
            'Départ Prévu': pp.departPrevu,
            'Départ Réel': pp.departReel,
            'Incidents Blessure (24H)': pp.indicateurs.incidentBlessure.h24,
            'Incidents Blessure (Total)': pp.indicateurs.incidentBlessure.total,
            'SSE/PBO': pp.ssePBO,
            'Enjeu Principal': pp.enjeuPrincipal,
            'Problèmes/Imprévus': pp.problemesImprevus,
            'Bon Coup': pp.bonCoup,
            'À Venir': pp.aVenir
        }));

        // Créer le workbook et la feuille
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Points de Presse');

        // Générer le nom de fichier avec la date
        const date = new Date().toISOString().split('T')[0];
        const filename = `points-de-presse-${date}.xlsx`;

        // Télécharger le fichier
        XLSX.writeFile(wb, filename);

        console.log(`[POINT-PRESSE] Export Excel réussi: ${filename}`);
        alert(`✅ Export Excel réussi: ${pointPresseData.length} points de presse exportés !`);
    } catch (error) {
        console.error('[POINT-PRESSE] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Génère un rapport PDF pour un point de presse
 * @param {string} id - ID du point de presse
 * @returns {void}
 */
export function generatePointPressePDF(id) {
    const pp = getPointPresseById(id);
    if (!pp) {
        alert('⚠️ Point de presse non trouvé.');
        return;
    }

    try {
        // Créer une nouvelle instance jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configuration
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        let yPos = 20;

        // Fonction helper pour ajouter du texte avec retour à la ligne
        const addText = (text, x, y, maxWidth, fontSize = 10, isBold = false) => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            const lines = doc.splitTextToSize(text || '-', maxWidth);
            doc.text(lines, x, y);
            return y + (lines.length * (fontSize * 0.4)); // Retourne la nouvelle position Y
        };

        // Fonction pour vérifier et ajouter une nouvelle page si nécessaire
        const checkPageBreak = (neededSpace) => {
            if (yPos + neededSpace > pageHeight - margin) {
                doc.addPage();
                yPos = 20;
                return true;
            }
            return false;
        };

        // ==================== EN-TÊTE ====================
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('POINT DE PRESSE JOURNALIER', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`${pp.jour || 'N/A'} - ${pp.date || 'N/A'}`, pageWidth / 2, 25, { align: 'center' });

        yPos = 45;
        doc.setTextColor(0, 0, 0);

        // ==================== INFORMATIONS GÉNÉRALES ====================
        checkPageBreak(40);

        doc.setFillColor(230, 230, 250);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📅 INFORMATIONS GÉNÉRALES', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Durée de l'arrêt: ${pp.duree || '-'}`, margin + 5, yPos);
        doc.text(`Nombre de travailleurs: ${pp.nbTravailleurs || '0'}`, pageWidth / 2, yPos);
        yPos += 7;

        doc.text(`Arrêt prévu: ${pp.arretPrevu || '-'}`, margin + 5, yPos);
        doc.text(`Arrêt réel: ${pp.arretReel || '-'}`, pageWidth / 2, yPos);
        yPos += 7;

        doc.text(`Départ prévu: ${pp.departPrevu || '-'}`, margin + 5, yPos);
        doc.text(`Départ réel: ${pp.departReel || '-'}`, pageWidth / 2, yPos);
        yPos += 12;

        // ==================== INDICATEURS SSE ====================
        checkPageBreak(60);

        doc.setFillColor(255, 235, 205);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('🚨 INDICATEURS SSE', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont('helvetica', 'normal');
        const indicateurs = [
            { label: 'Arrêter/Demander Aide', data: pp.indicateurs.arreterDemanderAide },
            { label: 'Incident avec blessure', data: pp.indicateurs.incidentBlessure },
            { label: 'Incident autre', data: pp.indicateurs.incidentAutre },
            { label: 'Problème qualité mineur', data: pp.indicateurs.problemeQualiteMin },
            { label: 'Problème qualité majeur', data: pp.indicateurs.problemeQualiteMaj },
            { label: 'Réel vs Cible', data: pp.indicateurs.reelVsCible }
        ];

        indicateurs.forEach(ind => {
            checkPageBreak(7);
            doc.text(`${ind.label}: 24H = ${ind.data.h24}, Total = ${ind.data.total}`, margin + 5, yPos);
            yPos += 6;
        });
        yPos += 6;

        // ==================== SSE/PBO ====================
        if (pp.ssePBO) {
            checkPageBreak(30);
            doc.setFillColor(230, 250, 230);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('🛡️ SSE/PBO', margin + 2, yPos + 5);
            yPos += 12;

            doc.setFont('helvetica', 'normal');
            yPos = addText(pp.ssePBO, margin + 5, yPos, pageWidth - 2 * margin - 10, 10);
            yPos += 8;
        }

        // ==================== AVANCEMENT DES TRAVAUX ====================
        checkPageBreak(50);

        doc.setFillColor(255, 250, 205);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('🔧 AVANCEMENT DES TRAVAUX', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont('helvetica', 'normal');
        doc.text('Entretien:', margin + 5, yPos);
        yPos += 5;
        doc.text(`  Avancement: ${pp.travauxEntretien.avancement || '-'}`, margin + 8, yPos);
        yPos += 5;
        doc.text(`  Complétés: ${pp.travauxEntretien.completes || '-'}`, margin + 8, yPos);
        yPos += 7;

        doc.text('Correctifs:', margin + 5, yPos);
        yPos += 5;
        doc.text(`  Avancement: ${pp.travauxCorrectifs.avancement || '-'}`, margin + 8, yPos);
        yPos += 5;
        doc.text(`  Complétés: ${pp.travauxCorrectifs.completes || '-'}`, margin + 8, yPos);
        yPos += 7;

        doc.text('Projets:', margin + 5, yPos);
        yPos += 5;
        doc.text(`  Avancement: ${pp.travauxProjets.avancement || '-'}`, margin + 8, yPos);
        yPos += 5;
        doc.text(`  Complétés: ${pp.travauxProjets.completes || '-'}`, margin + 8, yPos);
        yPos += 10;

        // ==================== SECTIONS TEXTUELLES ====================
        const sections = [
            { title: '🎯 ENJEU PRINCIPAL', content: pp.enjeuPrincipal, color: [255, 230, 230] },
            { title: '⚠️ PROBLÈMES/IMPRÉVUS', content: pp.problemesImprevus, color: [255, 240, 230] },
            { title: '✅ BON COUP', content: pp.bonCoup, color: [230, 255, 230] },
            { title: '📅 À VENIR', content: pp.aVenir, color: [230, 240, 255] }
        ];

        sections.forEach(section => {
            if (section.content) {
                checkPageBreak(30);
                doc.setFillColor(...section.color);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.text(section.title, margin + 2, yPos + 5);
                yPos += 12;

                doc.setFont('helvetica', 'normal');
                yPos = addText(section.content, margin + 5, yPos, pageWidth - 2 * margin - 10, 10);
                yPos += 8;
            }
        });

        // ==================== UPSIDE/DOWNSIDE ====================
        if (pp.upside && pp.upside.length > 0) {
            checkPageBreak(30);
            doc.setFillColor(200, 255, 200);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('⬆️ UPSIDE', margin + 2, yPos + 5);
            yPos += 12;

            doc.setFont('helvetica', 'normal');
            pp.upside.forEach(item => {
                checkPageBreak(6);
                doc.text(`• ${item}`, margin + 5, yPos);
                yPos += 5;
            });
            yPos += 5;
        }

        if (pp.downside && pp.downside.length > 0) {
            checkPageBreak(30);
            doc.setFillColor(255, 200, 200);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('⬇️ DOWNSIDE', margin + 2, yPos + 5);
            yPos += 12;

            doc.setFont('helvetica', 'normal');
            pp.downside.forEach(item => {
                checkPageBreak(6);
                doc.text(`• ${item}`, margin + 5, yPos);
                yPos += 5;
            });
            yPos += 5;
        }

        // ==================== STATUT DES COÛTS ====================
        if (pp.statutCouts) {
            checkPageBreak(30);
            doc.setFillColor(255, 255, 200);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('💰 STATUT SUIVI DES COÛTS', margin + 2, yPos + 5);
            yPos += 12;

            doc.setFont('helvetica', 'normal');
            yPos = addText(pp.statutCouts, margin + 5, yPos, pageWidth - 2 * margin - 10, 10);
            yPos += 8;
        }

        // ==================== PIED DE PAGE ====================
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Page ${i} / ${totalPages} - Généré le ${new Date().toLocaleDateString('fr-CA')} à ${new Date().toLocaleTimeString('fr-CA')}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        // ==================== AFFICHAGE ====================
        const filename = `point-presse-${pp.jour || 'jour'}-${pp.date || 'date'}.pdf`;
        window.libLoader.displayPDF(doc, filename);

        console.log(`[POINT-PRESSE] PDF généré avec succès: ${filename}`);

    } catch (error) {
        console.error('[POINT-PRESSE] Erreur lors de la génération du PDF:', error);
        alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    }
}

