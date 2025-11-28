/**
 * @fileoverview Gestion des plans de levage pour levages importants
 * @module data/plan-levage-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

const STORAGE_KEY = 'planLevageData';

let levagesData = [];

/**
 * Charge les données des levages
 */
export async function loadPlanLevageData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        levagesData = saved;
        console.log(`[PLAN-LEVAGE] ${levagesData.length} levages chargés`);
    }

    renderLevagesTable();
}

/**
 * Sauvegarde les données
 */
async function savePlanLevageData() {
    await saveToStorage(STORAGE_KEY, levagesData);
    console.log('[PLAN-LEVAGE] Données sauvegardées');
}

/**
 * Ajoute un nouveau levage
 */
export function addLevage() {
    const newLevage = {
        id: `levage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ordre: '',
        equipement: '',
        commentaire: '',
        documents: [],
        selected: false,
        dateCreation: new Date().toISOString()
    };

    levagesData.push(newLevage);
    savePlanLevageData();
    renderLevagesTable();

    console.log('[PLAN-LEVAGE] Nouveau levage ajouté - ID:', newLevage.id);

    // Focus sur le premier champ (ordre) de la nouvelle ligne après le rendu
    setTimeout(() => {
        const firstInput = document.querySelector(`input[data-levage-id="${newLevage.id}"][data-field="ordre"]`);
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    }, 100);
}

/**
 * Met à jour le commentaire d'un levage
 */
function updateCommentaire(levageId, value) {
    const levage = levagesData.find(l => l.id === levageId);
    if (levage) {
        levage.commentaire = value;
        savePlanLevageData();
    }
}

/**
 * Met à jour le numéro d'ordre d'un levage
 */
function updateOrdre(levageId, value) {
    const levage = levagesData.find(l => l.id === levageId);
    if (levage) {
        levage.ordre = value;
        savePlanLevageData();
    }
}

/**
 * Met à jour l'équipement d'un levage
 */
function updateEquipement(levageId, value) {
    const levage = levagesData.find(l => l.id === levageId);
    if (levage) {
        levage.equipement = value;
        savePlanLevageData();
    }
}

/**
 * Supprime un levage
 */
function deleteLevage(levageId) {
    const levage = levagesData.find(l => l.id === levageId);
    if (!levage) return;

    if (!confirm(`Voulez-vous vraiment supprimer le levage "${levage.equipement}" ?`)) {
        return;
    }

    levagesData = levagesData.filter(l => l.id !== levageId);
    savePlanLevageData();
    renderLevagesTable();

    console.log('[PLAN-LEVAGE] Levage supprimé:', levage.equipement);
}

/**
 * Toggle la sélection d'un levage
 */
function toggleLevageSelection(levageId) {
    const levage = levagesData.find(l => l.id === levageId);
    if (levage) {
        levage.selected = !levage.selected;
        renderLevagesTable();
    }
}

/**
 * Sélectionne/désélectionne tous les levages
 */
export function toggleSelectAll(checked) {
    levagesData.forEach(l => l.selected = checked);
    renderLevagesTable();
}

/**
 * Upload de documents pour un levage
 */
function uploadDocuments(levageId, files) {
    const levage = levagesData.find(l => l.id === levageId);
    if (!levage) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const doc = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                nom: file.name,
                type: file.type,
                data: e.target.result,
                size: file.size,
                dateAjout: new Date().toISOString()
            };

            levage.documents.push(doc);
            savePlanLevageData();
            renderLevagesTable();
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Ouvre un document
 */
function viewDocument(levageId, docId) {
    const levage = levagesData.find(l => l.id === levageId);
    if (!levage) return;

    const doc = levage.documents.find(d => d.id === docId);
    if (!doc) return;

    // Créer un modal pour afficher le document
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Fermer';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        z-index: 10001;
    `;
    closeBtn.onclick = () => document.body.removeChild(modal);

    if (doc.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = doc.data;
        img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;';
        modal.appendChild(img);
    } else if (doc.type === 'application/pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = doc.data;
        iframe.style.cssText = 'width: 90%; height: 90%; border: none;';
        modal.appendChild(iframe);
    } else {
        const info = document.createElement('div');
        info.style.cssText = 'color: white; text-align: center;';
        info.innerHTML = `
            <h2>${doc.nom}</h2>
            <p>Type: ${doc.type}</p>
            <p>Taille: ${(doc.size / 1024).toFixed(2)} KB</p>
            <a href="${doc.data}" download="${doc.nom}" style="color: #4a7c59; text-decoration: underline;">
                Télécharger le document
            </a>
        `;
        modal.appendChild(info);
    }

    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
}

/**
 * Supprime un document
 */
function deleteDocument(levageId, docId) {
    if (!confirm('Supprimer ce document ?')) return;

    const levage = levagesData.find(l => l.id === levageId);
    if (levage) {
        levage.documents = levage.documents.filter(d => d.id !== docId);
        savePlanLevageData();
        renderLevagesTable();
    }
}

/**
 * Rend le tableau des levages
 */
function renderLevagesTable() {
    const tbody = document.getElementById('planLevageTableBody');
    const countSpan = document.getElementById('planLevageCount');

    if (!tbody) {
        console.warn('[PLAN-LEVAGE] Element planLevageTableBody non trouvé');
        return;
    }

    const totalCount = levagesData.length;
    if (countSpan) countSpan.textContent = totalCount;

    if (levagesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucun levage enregistré. Cliquez sur "Ajouter un Levage" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    levagesData.forEach((levage, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <input type="checkbox" ${levage.selected ? 'checked' : ''}
                       onchange="window.planLevageActions.toggleLevageSelection('${levage.id}')"
                       style="width: 18px; height: 18px; cursor: pointer;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${levage.ordre || ''}"
                       onchange="window.planLevageActions.updateOrdre('${levage.id}', this.value)"
                       data-levage-id="${levage.id}"
                       data-field="ordre"
                       placeholder="N° ordre..."
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-weight: 600;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${levage.equipement || ''}"
                       onchange="window.planLevageActions.updateEquipement('${levage.id}', this.value)"
                       data-levage-id="${levage.id}"
                       data-field="equipement"
                       placeholder="Nom de l'équipement..."
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.planLevageActions.updateCommentaire('${levage.id}', this.value)"
                          placeholder="Commentaire..."
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; resize: vertical;">${levage.commentaire || ''}</textarea>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${renderDocumentsCell(levage)}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.planLevageActions.deleteLevage('${levage.id}')"
                        style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);

        // Activer le drag & drop sur la zone de documents
        setTimeout(() => {
            setupDragDrop(levage.id);
        }, 0);
    });

    console.log(`[PLAN-LEVAGE] Tableau rendu: ${levagesData.length} levages affichés`);
}

/**
 * Rend la cellule des documents
 */
function renderDocumentsCell(levage) {
    const dropZoneId = `drop-zone-${levage.id}`;
    const fileInputId = `file-input-${levage.id}`;

    let html = `
        <div id="${dropZoneId}" style="min-height: 80px; border: 2px dashed #ccc; border-radius: 8px; padding: 10px; background: #f9f9f9; cursor: pointer; transition: all 0.3s;">
            <input type="file" id="${fileInputId}" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                   style="display: none;"
                   onchange="window.planLevageActions.handleFileSelect('${levage.id}', this.files)">
            <div onclick="document.getElementById('${fileInputId}').click()" style="text-align: center; padding: 10px;">
                <div style="font-size: 2em; color: #667eea; margin-bottom: 5px;">📎</div>
                <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">
                    Glissez-déposez ou cliquez
                </div>
                <div style="font-size: 0.75em; color: #999;">
                    PDF, Images, Word, Excel
                </div>
            </div>
    `;

    if (levage.documents && levage.documents.length > 0) {
        html += `<div style="margin-top: 10px; border-top: 1px solid #dee2e6; padding-top: 10px;">`;
        levage.documents.forEach(doc => {
            const icon = getDocIcon(doc.type);
            const sizeKB = (doc.size / 1024).toFixed(1);
            html += `
                <div style="display: flex; align-items: center; gap: 8px; padding: 6px; background: white; border-radius: 4px; margin-bottom: 5px; border: 1px solid #e0e0e0;">
                    <span style="font-size: 1.5em;">${icon}</span>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 0.85em; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${doc.nom}">
                            ${doc.nom}
                        </div>
                        <div style="font-size: 0.7em; color: #999;">
                            ${sizeKB} KB
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); window.planLevageActions.viewDocument('${levage.id}', '${doc.id}')"
                            style="padding: 4px 8px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75em;">
                        👁️ Voir
                    </button>
                    <button onclick="event.stopPropagation(); window.planLevageActions.deleteDocument('${levage.id}', '${doc.id}')"
                            style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75em;">
                        ✕
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

/**
 * Retourne l'icône appropriée selon le type de fichier
 */
function getDocIcon(type) {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
}

/**
 * Configure le drag & drop pour une zone
 */
function setupDragDrop(levageId) {
    const dropZone = document.getElementById(`drop-zone-${levageId}`);
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = '#667eea';
            dropZone.style.background = '#e8f0fe';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = '#ccc';
            dropZone.style.background = '#f9f9f9';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        uploadDocuments(levageId, files);
    }, false);
}

/**
 * Gère la sélection de fichiers via input
 */
function handleFileSelect(levageId, files) {
    if (files.length > 0) {
        uploadDocuments(levageId, files);
    }
}

/**
 * Exporte la sélection en PDF
 */
export async function exportSelectedToPDF() {
    const selected = levagesData.filter(l => l.selected);

    if (selected.length === 0) {
        alert('⚠️ Veuillez sélectionner au moins un levage à exporter.');
        return;
    }

    await exportToPDF(selected, 'Plans_Levage_Selection');
}

/**
 * Exporte tous les levages en PDF
 */
export async function exportAllToPDF() {
    if (levagesData.length === 0) {
        alert('⚠️ Aucun levage à exporter.');
        return;
    }

    await exportToPDF(levagesData, 'Plans_Levage_Complet');
}

/**
 * Exporte des levages en PDF avec documents inclus
 */
async function exportToPDF(levages, baseFileName) {
    if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
        alert('❌ Bibliothèque jsPDF non chargée');
        return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const marginBottom = 20;

    // Titre principal
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('PLANS DE LEVAGE - LEVAGES IMPORTANTS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString('fr-CA')}`, 20, yPosition);
    doc.text(`Total: ${levages.length} levage(s)`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 15;

    // Pour chaque levage
    for (let i = 0; i < levages.length; i++) {
        const levage = levages[i];

        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > pageHeight - marginBottom - 60) {
            doc.addPage();
            yPosition = 20;
        }

        // En-tête du levage
        doc.setFillColor(102, 126, 234);
        doc.rect(20, yPosition, pageWidth - 40, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Levage ${i + 1}: ${levage.ordre}`, 25, yPosition + 7);
        yPosition += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        // Équipement
        doc.setFont(undefined, 'bold');
        doc.text('Équipement:', 20, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(levage.equipement || 'Non spécifié', 55, yPosition);
        yPosition += 7;

        // Commentaire
        if (levage.commentaire) {
            doc.setFont(undefined, 'bold');
            doc.text('Commentaire:', 20, yPosition);
            doc.setFont(undefined, 'normal');

            const commentLines = doc.splitTextToSize(levage.commentaire, pageWidth - 50);
            doc.text(commentLines, 20, yPosition + 5);
            yPosition += (commentLines.length * 5) + 7;
        }

        // Documents
        if (levage.documents && levage.documents.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text(`Documents (${levage.documents.length}):`, 20, yPosition);
            yPosition += 7;
            doc.setFont(undefined, 'normal');

            for (const docItem of levage.documents) {
                // Vérifier si on a besoin d'une nouvelle page
                if (yPosition > pageHeight - marginBottom - 120) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Nom du document
                doc.setFontSize(9);
                doc.text(`• ${docItem.nom} (${(docItem.size / 1024).toFixed(1)} KB)`, 25, yPosition);
                yPosition += 7;

                // Si c'est une image ou un PDF, l'intégrer
                if (docItem.type.startsWith('image/') || docItem.type === 'application/pdf') {
                    try {
                        const imgWidth = 160;
                        const imgHeight = 100;

                        // Vérifier si on a assez d'espace
                        if (yPosition + imgHeight > pageHeight - marginBottom) {
                            doc.addPage();
                            yPosition = 20;
                        }

                        if (docItem.type.startsWith('image/')) {
                            doc.addImage(docItem.data, 'JPEG', 25, yPosition, imgWidth, imgHeight);
                        } else if (docItem.type === 'application/pdf') {
                            // Pour les PDF, on affiche juste une indication
                            doc.setFillColor(240, 240, 240);
                            doc.rect(25, yPosition, imgWidth, 40, 'F');
                            doc.setFontSize(12);
                            doc.text('📄 Document PDF joint', 25 + imgWidth / 2, yPosition + 20, { align: 'center' });
                            doc.setFontSize(9);
                        }

                        yPosition += imgHeight + 10;
                    } catch (error) {
                        console.error('Erreur lors de l\'ajout du document:', error);
                        doc.text('  [Erreur lors du chargement du document]', 30, yPosition);
                        yPosition += 7;
                    }
                }
            }
        }

        yPosition += 10; // Espace entre les levages
    }

    // Afficher le PDF dans un nouvel onglet
    const fileName = `${baseFileName}_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);
    console.log('[PLAN-LEVAGE] ✅ PDF exporté:', fileName);
}

/**
 * Exporte vers Excel
 */
export function exportToExcel() {
    if (levagesData.length === 0) {
        alert('⚠️ Aucun levage à exporter.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('❌ Bibliothèque XLSX non chargée');
        return;
    }

    const exportData = levagesData.map(levage => ({
        'Ordre': levage.ordre,
        'Équipement': levage.equipement,
        'Commentaire': levage.commentaire || '',
        'Nombre de documents': levage.documents.length
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plans de Levage');

    const fileName = `Plans_Levage_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log('[PLAN-LEVAGE] ✅ Excel exporté:', fileName);
}

// Exposer les fonctions globalement
window.planLevageActions = {
    addLevage,
    updateCommentaire,
    updateOrdre,
    updateEquipement,
    deleteLevage,
    toggleLevageSelection,
    toggleSelectAll,
    handleFileSelect,
    viewDocument,
    deleteDocument,
    exportSelectedToPDF,
    exportAllToPDF,
    exportToExcel,
    loadPlanLevageData
};

console.log('[PLAN-LEVAGE] Module chargé');
