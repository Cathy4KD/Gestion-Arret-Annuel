/**
 * @fileoverview Gestion des zones d'entreposage avec documents/plans
 * @module data/zones-entreposage-editor
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

let zonesData = [];

/**
 * Set zones entreposage data (utilisé par server-sync pour injecter les données)
 */
export function setZonesEntreposageData(data) {
    zonesData = data || [];
    console.log(`[ZONES-ENTREPOSAGE] ✅ ${zonesData.length} zones injectées depuis le serveur`);
    if (document.getElementById('zonesTableBody')) {
        renderZonesTable();
    }
}

// Exposer globalement pour server-sync.js
window.setZonesEntreposageData = setZonesEntreposageData;

/**
 * Charge les données
 */
export async function loadZonesData() {
    console.log('[ZONES-ENTREPOSAGE] 🔄 Chargement des données...');

    const saved = await loadFromStorage('zonesEntreposageData');

    if (saved && Array.isArray(saved)) {
        zonesData = saved;
        console.log(`[ZONES-ENTREPOSAGE] ✅ ${zonesData.length} zones chargées`);
    } else {
        console.log('[ZONES-ENTREPOSAGE] ⚠️ Aucune zone sauvegardée');
        zonesData = [];
    }

    renderZonesTable();
    console.log('[ZONES-ENTREPOSAGE] ✅ Module initialisé');
}

/**
 * Ajoute une nouvelle zone
 */
export async function addZone() {
    const newZone = {
        id: 'zone-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        ordre: '',
        designation: '',
        commentaire: '',
        documents: [],
        dateCreation: new Date().toISOString()
    };

    zonesData.push(newZone);
    await saveData();
    renderZonesTable();
}

/**
 * Met à jour un champ de zone
 */
export async function updateZoneField(zoneId, field, value) {
    const zone = zonesData.find(z => z.id === zoneId);
    if (zone) {
        zone[field] = value;
        await saveData();
    }
}

/**
 * Supprime une zone
 */
export async function deleteZone(zoneId) {
    if (confirm('Supprimer cette zone ?')) {
        zonesData = zonesData.filter(z => z.id !== zoneId);
        await saveData();
        renderZonesTable();
    }
}

/**
 * Upload un document/plan pour une zone
 */
export function uploadDocument(zoneId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.multiple = true;

    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const zone = zonesData.find(z => z.id === zoneId);
        if (!zone) return;

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const doc = {
                    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    nom: file.name,
                    type: file.type,
                    data: event.target.result,
                    dateAjout: new Date().toISOString()
                };

                zone.documents.push(doc);
                await saveData();
                renderZonesTable();
            };
            reader.readAsDataURL(file);
        }
    };

    input.click();
}

/**
 * Affiche un document en modal
 */
export function viewDocument(zoneId, docId) {
    const zone = zonesData.find(z => z.id === zoneId);
    if (!zone) return;

    const doc = zone.documents.find(d => d.id === docId);
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
    }

    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
}

/**
 * Supprime un document
 */
export async function deleteDocument(zoneId, docId) {
    if (confirm('Supprimer ce document ?')) {
        const zone = zonesData.find(z => z.id === zoneId);
        if (zone) {
            zone.documents = zone.documents.filter(d => d.id !== docId);
            await saveData();
            renderZonesTable();
        }
    }
}

/**
 * Sauvegarde les données
 */
async function saveData() {
    console.log('[ZONES-ENTREPOSAGE] Sauvegarde de', zonesData.length, 'zones...');
    await saveToStorage('zonesEntreposageData', zonesData);
}

/**
 * Affiche le tableau des zones
 */
function renderZonesTable() {
    const tbody = document.getElementById('zonesTableBody');
    const countSpan = document.getElementById('zonesCount');

    if (!tbody) return;

    if (!Array.isArray(zonesData) || zonesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucune zone. Cliquez sur "➕ Ajouter une Zone" pour commencer.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = zonesData.length;

    zonesData.forEach((zone, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" value="${zone.ordre || ''}" placeholder="Ex: Z-01"
                       onchange="window.zonesActions.updateZoneField('${zone.id}', 'ordre', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" value="${zone.designation || ''}" placeholder="Zone de stockage..."
                       onchange="window.zonesActions.updateZoneField('${zone.id}', 'designation', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.zonesActions.updateZoneField('${zone.id}', 'commentaire', this.value)"
                          placeholder="Commentaires..."
                          style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px; min-height: 60px; resize: vertical;">${zone.commentaire || ''}</textarea>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button onclick="window.zonesActions.uploadDocument('${zone.id}')"
                            style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        📎 Ajouter Document/Plan
                    </button>
                    ${renderDocumentsList(zone)}
                </div>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.zonesActions.deleteZone('${zone.id}')"
                        style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Rend la liste des documents pour une zone
 */
function renderDocumentsList(zone) {
    if (!zone.documents || zone.documents.length === 0) {
        return '<div style="color: #999; font-size: 0.85em; font-style: italic;">Aucun document</div>';
    }

    return zone.documents.map(doc => {
        const isImage = doc.type.startsWith('image/');
        const icon = isImage ? '🖼️' : '📄';

        return `
            <div style="display: flex; align-items: center; gap: 5px; background: #e3f2fd; padding: 6px 8px; border-radius: 4px; font-size: 0.85em;">
                <span style="cursor: pointer; flex: 1; color: #1976d2; text-decoration: underline;"
                      onclick="window.zonesActions.viewDocument('${zone.id}', '${doc.id}')">
                    ${icon} ${doc.nom}
                </span>
                <button onclick="event.stopPropagation(); window.zonesActions.deleteDocument('${zone.id}', '${doc.id}')"
                        style="padding: 2px 6px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75em;">
                    ✕
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Exporte vers Excel
 */
export function exportToExcel() {
    if (!zonesData || zonesData.length === 0) {
        alert('Aucune zone à exporter.');
        return;
    }

    const exportData = zonesData.map(zone => ({
        'Ordre': zone.ordre || '',
        'Désignation': zone.designation || '',
        'Commentaire': zone.commentaire || '',
        'Nombre Documents': zone.documents.length
    }));

    if (typeof XLSX === 'undefined') {
        alert('Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Zones Entreposage');

    const fileName = `Zones_Entreposage_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

/**
 * Exporte vers PDF avec images intégrées
 */
export async function exportToPDF() {
    if (!zonesData || zonesData.length === 0) {
        alert('Aucune zone à exporter.');
        return;
    }

    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
        alert('Bibliothèque jsPDF non chargée');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;

    // Titre
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('ZONES ENTREPOSAGES & PLAN DE LOCALISATION', 105, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString('fr-CA')}`, 20, yPosition);
    yPosition += 10;

    // Pour chaque zone
    for (let i = 0; i < zonesData.length; i++) {
        const zone = zonesData[i];

        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > pageHeight - marginBottom - 50) {
            doc.addPage();
            yPosition = 20;
        }

        // En-tête de zone
        doc.setFillColor(102, 126, 234);
        doc.rect(20, yPosition, 170, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Zone ${i + 1}: ${zone.ordre || 'Sans ordre'}`, 25, yPosition + 7);
        yPosition += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        // Désignation
        doc.setFont(undefined, 'bold');
        doc.text('Désignation:', 20, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(zone.designation || 'Non spécifiée', 55, yPosition);
        yPosition += 7;

        // Commentaire
        if (zone.commentaire) {
            doc.setFont(undefined, 'bold');
            doc.text('Commentaire:', 20, yPosition);
            doc.setFont(undefined, 'normal');

            const commentLines = doc.splitTextToSize(zone.commentaire, 150);
            doc.text(commentLines, 20, yPosition + 5);
            yPosition += (commentLines.length * 5) + 5;
        }

        // Documents/Plans
        if (zone.documents && zone.documents.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text(`Documents/Plans (${zone.documents.length}):`, 20, yPosition);
            yPosition += 7;
            doc.setFont(undefined, 'normal');

            for (const docItem of zone.documents) {
                // Vérifier si on a besoin d'une nouvelle page
                if (yPosition > pageHeight - marginBottom - 100) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Nom du document
                doc.setFontSize(9);
                doc.text(`• ${docItem.nom}`, 25, yPosition);
                yPosition += 7;

                // Si c'est une image, l'intégrer dans le PDF
                if (docItem.type.startsWith('image/')) {
                    try {
                        const imgWidth = 150;
                        const imgHeight = 100;

                        // Vérifier si on a assez d'espace
                        if (yPosition + imgHeight > pageHeight - marginBottom) {
                            doc.addPage();
                            yPosition = 20;
                        }

                        doc.addImage(docItem.data, 'JPEG', 30, yPosition, imgWidth, imgHeight);
                        yPosition += imgHeight + 10;
                    } catch (error) {
                        console.error('Erreur lors de l\'ajout de l\'image:', error);
                        doc.text('  [Erreur lors du chargement de l\'image]', 30, yPosition);
                        yPosition += 7;
                    }
                }
            }
        }

        yPosition += 10; // Espace entre les zones
    }

    // Afficher le PDF dans un nouvel onglet
    const fileName = `Zones_Entreposage_Complet_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);
    console.log('[ZONES-ENTREPOSAGE] ✅ PDF exporté:', fileName);
}

// Exposer globalement
window.zonesActions = {
    loadZonesData,
    addZone,
    updateZoneField,
    deleteZone,
    uploadDocument,
    viewDocument,
    deleteDocument,
    exportToExcel,
    exportToPDF
};

console.log('[ZONES-ENTREPOSAGE] Module chargé');
