// inspection-levage-data.js
// Gestion des données d'inspection des équipements de levage (T41)

let inspectionData = [];

/**
 * Charge les données d'inspection depuis le localStorage
 */
export async function loadInspectionData() {
    try {
        const savedData = localStorage.getItem('inspectionLevageData');
        if (savedData) {
            inspectionData = JSON.parse(savedData);
            console.log('[OK] Données d\'inspection chargées:', inspectionData.length, 'inspection(s)');
        } else {
            inspectionData = [];
            console.log('[INFO] Aucune donnée d\'inspection sauvegardée');
        }

        renderInspectionTable();
        updateInspectionCount();
    } catch (error) {
        console.error('[ERROR] Erreur lors du chargement des données d\'inspection:', error);
        inspectionData = [];
    }
}

/**
 * Sauvegarde les données d'inspection dans le localStorage
 */
function saveInspectionData() {
    try {
        localStorage.setItem('inspectionLevageData', JSON.stringify(inspectionData));
        console.log('[OK] Données d\'inspection sauvegardées');
    } catch (error) {
        console.error('[ERROR] Erreur lors de la sauvegarde:', error);
        alert('⚠ Erreur lors de la sauvegarde des données');
    }
}

/**
 * Ajoute une nouvelle ligne d'inspection
 */
export function addInspectionRow() {
    const newInspection = {
        id: Date.now().toString(),
        equipement: '',
        numeroSerie: '',
        localisation: '',
        datePrevue: '',
        dateRealisee: '',
        statut: 'A planifier',
        inspecteur: '',
        remarques: ''
    };

    inspectionData.push(newInspection);
    saveInspectionData();
    renderInspectionTable();
    updateInspectionCount();

    console.log('[OK] Nouvelle inspection ajoutée');
}

/**
 * Supprime une inspection
 */
export function deleteInspection(id) {
    if (!confirm('⚠ Voulez-vous vraiment supprimer cette inspection ?')) {
        return;
    }

    inspectionData = inspectionData.filter(item => item.id !== id);
    saveInspectionData();
    renderInspectionTable();
    updateInspectionCount();

    console.log('[OK] Inspection supprimée');
}

/**
 * Met à jour un champ d'inspection
 */
export function updateInspectionField(id, field, value) {
    const inspection = inspectionData.find(item => item.id === id);
    if (inspection) {
        inspection[field] = value;
        saveInspectionData();
        console.log(`[OK] Champ ${field} mis à jour pour inspection ${id}`);
    }
}

/**
 * Rendu du tableau d'inspection
 */
function renderInspectionTable() {
    const tbody = document.getElementById('inspectionTableBody');
    if (!tbody) {
        console.error('[ERROR] Element inspectionTableBody non trouvé');
        return;
    }

    if (!inspectionData || inspectionData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 30px; text-align: center; color: #666;">
                    Aucune inspection ajoutée. Cliquez sur "Ajouter" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = inspectionData.map(inspection => {
        // Déterminer la couleur de fond selon le statut
        let bgColor = '#fff';
        switch (inspection.statut) {
            case 'A planifier':
                bgColor = '#f8d7da';
                break;
            case 'Planifié':
                bgColor = '#fff3cd';
                break;
            case 'En cours':
                bgColor = '#cfe2ff';
                break;
            case 'Complété':
                bgColor = '#d4edda';
                break;
            case 'Non conforme':
                bgColor = '#e0e0e0';
                break;
        }

        return `
            <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <input type="text"
                           value="${inspection.equipement || ''}"
                           onchange="updateInspectionField('${inspection.id}', 'equipement', this.value)"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <input type="text"
                           value="${inspection.numeroSerie || ''}"
                           onchange="updateInspectionField('${inspection.id}', 'numeroSerie', this.value)"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <input type="text"
                           value="${inspection.localisation || ''}"
                           onchange="updateInspectionField('${inspection.id}', 'localisation', this.value)"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <input type="date"
                           value="${inspection.datePrevue || ''}"
                           onchange="updateInspectionField('${inspection.id}', 'datePrevue', this.value)"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <input type="date"
                           value="${inspection.dateRealisee || ''}"
                           onchange="updateInspectionField('${inspection.id}', 'dateRealisee', this.value)"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <select onchange="updateInspectionField('${inspection.id}', 'statut', this.value)"
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="A planifier" ${inspection.statut === 'A planifier' ? 'selected' : ''}>À planifier</option>
                        <option value="Planifié" ${inspection.statut === 'Planifié' ? 'selected' : ''}>Planifié</option>
                        <option value="En cours" ${inspection.statut === 'En cours' ? 'selected' : ''}>En cours</option>
                        <option value="Complété" ${inspection.statut === 'Complété' ? 'selected' : ''}>Complété</option>
                        <option value="Non conforme" ${inspection.statut === 'Non conforme' ? 'selected' : ''}>Non conforme</option>
                    </select>
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <input type="text"
                           value="${inspection.inspecteur || ''}"
                           onchange="updateInspectionField('${inspection.id}', 'inspecteur', this.value)"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <textarea onchange="updateInspectionField('${inspection.id}', 'remarques', this.value)"
                              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px;">${inspection.remarques || ''}</textarea>
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                    <button onclick="deleteInspection('${inspection.id}')"
                            class="btn"
                            style="background: linear-gradient(145deg, #dc3545, #c82333); color: white; padding: 8px 12px;">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Met à jour le compteur d'inspections
 */
function updateInspectionCount() {
    const countElement = document.getElementById('inspectionCount');
    if (countElement) {
        countElement.textContent = inspectionData.length;
    }
}

/**
 * Exporte les inspections en PDF
 */
export function exportInspectionToPDF() {
    if (!Array.isArray(inspectionData) || inspectionData.length === 0) {
        alert('⚠ Aucune donnée à exporter.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('⚠ Bibliothèque jsPDF non disponible. Veuillez recharger la page.');
            return;
        }

        const doc = new jsPDF('l', 'mm', 'a4'); // Format paysage

        // Titre
        doc.setFontSize(16);
        doc.text('Inspection des Équipements de Levage', 14, 15);

        // Date de génération
        doc.setFontSize(10);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 22);

        // Préparer les données pour le tableau
        const tableData = inspectionData.map(inspection => [
            inspection.equipement || '-',
            inspection.numeroSerie || '-',
            inspection.localisation || '-',
            inspection.datePrevue || '-',
            inspection.dateRealisee || '-',
            inspection.statut || '-',
            inspection.inspecteur || '-',
            inspection.remarques || '-'
        ]);

        // Créer le tableau avec autoTable
        doc.autoTable({
            head: [['Équipement', 'N° Série', 'Localisation', 'Date Prévue', 'Date Réalisée', 'Statut', 'Inspecteur', 'Remarques']],
            body: tableData,
            startY: 28,
            theme: 'striped',
            headStyles: {
                fillColor: [102, 126, 234],
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 25 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 25 },
                7: { cellWidth: 50 }
            },
            margin: { top: 28, left: 14, right: 14 }
        });

        // Sauvegarder le PDF
        const fileName = `inspection-levage-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        console.log('[OK] PDF exporté:', fileName);
        alert(`✅ PDF exporté avec succès: ${fileName}`);
    } catch (error) {
        console.error('[ERROR] Erreur lors de l\'export PDF:', error);
        alert('⚠ Erreur lors de l\'export PDF. Vérifiez la console.');
    }
}

/**
 * Exporte les inspections en Excel
 */
export function exportInspectionToExcel() {
    if (!Array.isArray(inspectionData) || inspectionData.length === 0) {
        alert('⚠ Aucune donnée à exporter.');
        return;
    }

    try {
        if (!window.XLSX) {
            alert('⚠ Bibliothèque XLSX non disponible. Veuillez recharger la page.');
            return;
        }

        // Préparer les données pour Excel
        const excelData = inspectionData.map(inspection => ({
            'Équipement': inspection.equipement || '',
            'Numéro de série / ID': inspection.numeroSerie || '',
            'Localisation': inspection.localisation || '',
            'Date prévue': inspection.datePrevue || '',
            'Date réalisée': inspection.dateRealisee || '',
            'Statut': inspection.statut || '',
            'Inspecteur': inspection.inspecteur || '',
            'Remarques': inspection.remarques || ''
        }));

        // Créer le workbook et la feuille
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Ajuster la largeur des colonnes
        const colWidths = [
            { wch: 25 }, // Équipement
            { wch: 20 }, // N° Série
            { wch: 20 }, // Localisation
            { wch: 15 }, // Date prévue
            { wch: 15 }, // Date réalisée
            { wch: 15 }, // Statut
            { wch: 20 }, // Inspecteur
            { wch: 40 }  // Remarques
        ];
        ws['!cols'] = colWidths;

        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Inspections');

        // Sauvegarder le fichier
        const fileName = `inspection-levage-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[OK] Excel exporté:', fileName);
        alert(`✅ Excel exporté avec succès: ${fileName}`);
    } catch (error) {
        console.error('[ERROR] Erreur lors de l\'export Excel:', error);
        alert('⚠ Erreur lors de l\'export Excel. Vérifiez la console.');
    }
}

// Exposer les fonctions globalement pour les boutons HTML
if (typeof window !== 'undefined') {
    window.addInspectionRow = addInspectionRow;
    window.deleteInspection = deleteInspection;
    window.updateInspectionField = updateInspectionField;
    window.exportInspectionToPDF = exportInspectionToPDF;
    window.exportInspectionToExcel = exportInspectionToExcel;
    window.loadInspectionData = loadInspectionData;
}

export default {
    loadInspectionData,
    addInspectionRow,
    deleteInspection,
    updateInspectionField,
    exportInspectionToPDF,
    exportInspectionToExcel
};
