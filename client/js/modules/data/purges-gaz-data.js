/**
 * @fileoverview Module de gestion des comptes-rendus de validation purges gaz CO
 * @module data/purges-gaz-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage
 * @const {string}
 */
const STORAGE_KEY = 'purgesGazCompteRenduData';

/**
 * Données du compte-rendu
 * @type {Object}
 */
let compteRenduData = {
    date: '',
    participants: '',
    commentaires: '',
    actionsSuivre: '',
    documents: []
};

/**
 * Initialise le module
 */
export async function initPurgesGazModule() {
    console.log('[PURGES-GAZ] 🔵 Initialisation du module...');
    console.log('[PURGES-GAZ] Recherche des éléments DOM...');

    const dateInput = document.getElementById('purgesGazDate');
    const participantsInput = document.getElementById('purgesGazParticipants');
    const commentairesTextarea = document.getElementById('purgesGazCommentaires');
    const actionsTextarea = document.getElementById('purgesGazActions');
    const docsList = document.getElementById('purgesGazDocumentsList');

    console.log('[PURGES-GAZ] Éléments trouvés:', {
        date: !!dateInput,
        participants: !!participantsInput,
        commentaires: !!commentairesTextarea,
        actions: !!actionsTextarea,
        docsList: !!docsList
    });

    await loadCompteRenduData();
    renderCompteRendu();

    console.log('[PURGES-GAZ] ✅ Module initialisé avec succès');
}

/**
 * Charge les données du compte-rendu depuis le serveur
 */
async function loadCompteRenduData() {
    const savedData = await loadFromStorage(STORAGE_KEY);
    if (savedData) {
        compteRenduData = savedData;
        console.log('[PURGES-GAZ] Compte-rendu chargé depuis le serveur');
    }
}

/**
 * Sauvegarde les données sur le serveur
 */
async function saveCompteRenduData() {
    await saveToStorage(STORAGE_KEY, compteRenduData);
    console.log('[PURGES-GAZ] Compte-rendu sauvegardé sur le serveur');
}

/**
 * Affiche les données dans le formulaire
 */
function renderCompteRendu() {
    const dateInput = document.getElementById('purgesGazDate');
    const participantsInput = document.getElementById('purgesGazParticipants');
    const commentairesTextarea = document.getElementById('purgesGazCommentaires');
    const actionsTextarea = document.getElementById('purgesGazActions');

    if (dateInput) dateInput.value = compteRenduData.date || '';
    if (participantsInput) participantsInput.value = compteRenduData.participants || '';
    if (commentairesTextarea) commentairesTextarea.value = compteRenduData.commentaires || '';
    if (actionsTextarea) actionsTextarea.value = compteRenduData.actionsSuivre || '';

    renderDocumentsList();
}

/**
 * Met à jour un champ du compte-rendu
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 */
function updateField(field, value) {
    compteRenduData[field] = value;
    saveCompteRenduData();
    console.log(`[PURGES-GAZ] ${field} mis à jour`);
}

/**
 * Ajoute un document
 * @param {Event} event - Événement de changement du input file
 */
async function addDocument(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('⚠️ Le fichier est trop volumineux (max 10MB)');
        return;
    }

    // Lire le fichier en Base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const document = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nom: file.name,
            type: file.type,
            taille: file.size,
            data: e.target.result,
            dateAjout: new Date().toISOString()
        };

        compteRenduData.documents.push(document);
        await saveCompteRenduData();
        renderDocumentsList();
        console.log(`[PURGES-GAZ] Document ajouté: ${file.name}`);

        // Réinitialiser l'input pour permettre d'ajouter le même fichier
        event.target.value = '';
    };

    reader.onerror = function() {
        alert('❌ Erreur lors de la lecture du fichier');
    };

    reader.readAsDataURL(file);
}

/**
 * Supprime un document
 * @param {string} docId - ID du document
 */
async function deleteDocument(docId) {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;

    compteRenduData.documents = compteRenduData.documents.filter(doc => doc.id !== docId);
    await saveCompteRenduData();
    renderDocumentsList();
    console.log('[PURGES-GAZ] Document supprimé');
}

/**
 * Télécharge un document
 * @param {string} docId - ID du document
 */
function downloadDocument(docId) {
    const doc = compteRenduData.documents.find(d => d.id === docId);
    if (!doc) return;

    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.nom;
    link.click();
    console.log('[PURGES-GAZ] Document téléchargé:', doc.nom);
}

/**
 * Affiche la liste des documents
 */
function renderDocumentsList() {
    const container = document.getElementById('purgesGazDocumentsList');
    if (!container) return;

    if (compteRenduData.documents.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; font-size: 0.95em;">Aucun document attaché</div>';
        return;
    }

    container.innerHTML = compteRenduData.documents.map(doc => {
        const sizeKB = (doc.taille / 1024).toFixed(2);
        const icon = getFileIcon(doc.type);
        const dateAjout = new Date(doc.dateAjout).toLocaleDateString('fr-FR');

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: white; border-radius: 6px; margin-bottom: 10px; border: 1px solid #ddd;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <span style="font-size: 24px;">${icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 3px;">${doc.nom}</div>
                        <div style="font-size: 0.85em; color: #666;">
                            ${sizeKB} KB • Ajouté le ${dateAjout}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="window.purgesGazActions.downloadDocument('${doc.id}')"
                            class="btn" style="background: #007bff; color: white; padding: 6px 12px; font-size: 0.85em;">
                        ⬇️ Télécharger
                    </button>
                    <button onclick="window.purgesGazActions.deleteDocument('${doc.id}')"
                            class="btn" style="background: #dc3545; color: white; padding: 6px 12px; font-size: 0.85em;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Retourne l'icône appropriée selon le type de fichier
 * @param {string} type - Type MIME du fichier
 * @returns {string} Emoji d'icône
 */
function getFileIcon(type) {
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('document')) return '📘';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
    if (type.includes('image')) return '🖼️';
    return '📄';
}

/**
 * Sauvegarde le brouillon avec message de confirmation
 */
async function saveDraft() {
    await saveCompteRenduData();
    alert('✅ Brouillon sauvegardé avec succès !');
}

/**
 * Exporte le compte-rendu en PDF
 */
async function exportCompteRenduPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('❌ Bibliothèque jsPDF non chargée');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Titre
    doc.setFontSize(18);
    doc.setTextColor(102, 126, 234);
    doc.setFont(undefined, 'bold');
    doc.text('VALIDATION DE POINTS DE PURGES GAZ CO', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.text('Compte-Rendu de Visite / Réunion', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Ligne de séparation
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Date et participants
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Date:', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(compteRenduData.date || 'Non renseignée', margin + 30, yPos);
    yPos += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Participants:', margin, yPos);
    doc.setFont(undefined, 'normal');
    const participants = doc.splitTextToSize(compteRenduData.participants || 'Non renseignés', pageWidth - margin - 40);
    doc.text(participants, margin + 30, yPos);
    yPos += (participants.length * 6) + 8;

    // Observations
    if (compteRenduData.commentaires) {
        doc.setFont(undefined, 'bold');
        doc.text('Observations / Commentaires:', margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        const observations = doc.splitTextToSize(compteRenduData.commentaires, pageWidth - 2 * margin);
        doc.text(observations, margin, yPos);
        yPos += (observations.length * 5) + 10;
    }

    // Actions à suivre
    if (compteRenduData.actionsSuivre) {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }

        doc.setFont(undefined, 'bold');
        doc.text('Actions à suivre:', margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        const actions = doc.splitTextToSize(compteRenduData.actionsSuivre, pageWidth - 2 * margin);
        doc.text(actions, margin, yPos);
        yPos += (actions.length * 5) + 10;
    }

    // Documents
    if (compteRenduData.documents.length > 0) {
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = margin;
        }

        doc.setFont(undefined, 'bold');
        doc.text('Documents Attachés:', margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);

        compteRenduData.documents.forEach((docItem, index) => {
            if (yPos > pageHeight - margin - 10) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(`${index + 1}. ${docItem.nom} (${(docItem.taille / 1024).toFixed(2)} KB)`, margin + 5, yPos);
            yPos += 6;
        });
    }

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
             margin, pageHeight - 10);

    // Télécharger
    const fileName = `Compte_Rendu_Purges_Gaz_${compteRenduData.date || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    console.log('[PURGES-GAZ] ✅ PDF exporté:', fileName);
}

// Exposer les actions globalement
window.purgesGazActions = {
    updateField,
    addDocument,
    deleteDocument,
    downloadDocument,
    saveDraft,
    exportCompteRenduPDF,
    initPurgesGazModule
};

console.log('[PURGES-GAZ] ✅ Module chargé');
