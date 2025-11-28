/**
 * @fileoverview Gestion de la Strat�gie d'Approvisionnement
 * @module data/strategie-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Cl� de stockage
 * @const {string}
 */
const STORAGE_KEY = 'strategieData';

/**
 * Donn�es de strat�gie
 * @type {Array}
 */
let strategieData = [];

/**
 * �tat de visibilit� des colonnes historiques
 * @type {boolean}
 */
let historiqueVisible = true;

/**
 * Charge les donn�es de strat�gie depuis localStorage
 * @returns {void}
 */
export async function loadStrategieData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        strategieData = saved;
        console.log(`[STRATEGIE] ${strategieData.length} strat�gies charg�es depuis localStorage`);
        renderStrategieTable();
    }
}

/**
 * Sauvegarde les donn�es de strat�gie dans localStorage
 * @returns {void}
 */
async function saveStrategieData() {
    await saveToStorage(STORAGE_KEY, strategieData);
    console.log('[STRATEGIE] Donn�es sauvegard�es et synchronis�es avec le serveur');
}

/**
 * Ajoute une nouvelle ligne de strat�gie
 * @returns {void}
 */
export function addStrategieRow() {
    const newStrategie = {
        id: 'strategie-' + Date.now(),
        fournisseur: '',
        typeTravaux: '',
        justification: '',
        estime: '',
        estime2021: '',
        estime2022: '',
        estime2023: '',
        estime2024: '',
        estime2025: ''
    };

    strategieData.push(newStrategie);
    saveStrategieData();
    renderStrategieTable();
    console.log('[STRATEGIE] Nouvelle strat�gie ajout�e');
}

/**
 * Supprime une strat�gie
 * @param {string} strategieId - ID de la strat�gie � supprimer
 * @returns {void}
 */
export function deleteStrategie(strategieId) {
    if (confirm('�tes-vous s�r de vouloir supprimer cette strat�gie ?')) {
        strategieData = strategieData.filter(s => s.id !== strategieId);
        saveStrategieData();
        renderStrategieTable();
        console.log('[STRATEGIE] Strat�gie supprim�e:', strategieId);
    }
}

/**
 * Met � jour un champ d'une strat�gie
 * @param {string} strategieId - ID de la strat�gie
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateStrategieField(strategieId, field, value) {
    const strategie = strategieData.find(s => s.id === strategieId);
    if (strategie) {
        strategie[field] = value;
        saveStrategieData();
        console.log(`[STRATEGIE] Champ ${field} mis � jour pour ${strategieId}`);
    }
}

/**
 * Bascule la visibilit� des colonnes historiques
 * @returns {void}
 */
export function toggleHistoriqueColumns() {
    historiqueVisible = !historiqueVisible;

    // R�cup�rer toutes les colonnes historiques (th et td)
    const historiqueCols = document.querySelectorAll('.historique-col');

    historiqueCols.forEach(col => {
        if (historiqueVisible) {
            col.style.display = '';
        } else {
            col.style.display = 'none';
        }
    });

    console.log(`[STRATEGIE] Colonnes historiques ${historiqueVisible ? 'affich�es' : 'cach�es'}`);
}

/**
 * Rend le tableau de strat�gie
 * @returns {void}
 */
export function renderStrategieTable() {
    const tbody = document.getElementById('strategieTableBody');
    if (!tbody) {
        console.warn('[STRATEGIE] Element strategieTableBody non trouv�');
        return;
    }

    if (!Array.isArray(strategieData) || strategieData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="padding: 30px; text-align: center; color: #666;">
                    Aucune strat�gie ajout�e. Cliquez sur "Ajouter" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    strategieData.forEach(strategie => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${strategie.fournisseur || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'fournisseur', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${strategie.typeTravaux || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'typeTravaux', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea onchange="updateStrategieField('${strategie.id}', 'justification', this.value)"
                          style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; min-height: 40px;">${strategie.justification || ''}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${strategie.estime || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'estime', this.value)"
                       placeholder="Ex: 50000$"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td class="historique-col" style="padding: 8px; border: 1px solid #dee2e6; ${historiqueVisible ? '' : 'display: none;'}">
                <input type="text" value="${strategie.estime2021 || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'estime2021', this.value)"
                       placeholder="Ex: 45000$"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td class="historique-col" style="padding: 8px; border: 1px solid #dee2e6; ${historiqueVisible ? '' : 'display: none;'}">
                <input type="text" value="${strategie.estime2022 || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'estime2022', this.value)"
                       placeholder="Ex: 47000$"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td class="historique-col" style="padding: 8px; border: 1px solid #dee2e6; ${historiqueVisible ? '' : 'display: none;'}">
                <input type="text" value="${strategie.estime2023 || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'estime2023', this.value)"
                       placeholder="Ex: 48000$"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td class="historique-col" style="padding: 8px; border: 1px solid #dee2e6; ${historiqueVisible ? '' : 'display: none;'}">
                <input type="text" value="${strategie.estime2024 || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'estime2024', this.value)"
                       placeholder="Ex: 49000$"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td class="historique-col" style="padding: 8px; border: 1px solid #dee2e6; ${historiqueVisible ? '' : 'display: none;'}">
                <input type="text" value="${strategie.estime2025 || ''}"
                       onchange="updateStrategieField('${strategie.id}', 'estime2025', this.value)"
                       placeholder="Ex: 50000$"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="deleteStrategie('${strategie.id}')"
                        style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    =�
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[STRATEGIE] Tableau rendu: ${strategieData.length} strat�gies`);
}

/**
 * Exporte les donn�es vers Excel
 * @returns {void}
 */
export function exportStrategieToExcel() {
    if (!Array.isArray(strategieData) || strategieData.length === 0) {
        alert('� Aucune donn�e � exporter.');
        return;
    }

    try {
        const exportData = strategieData.map(strategie => ({
            'Fournisseur': strategie.fournisseur,
            'Type de travaux': strategie.typeTravaux,
            'Justification': strategie.justification,
            'Estim�': strategie.estime,
            'Estim� 2021': strategie.estime2021,
            'Estim� 2022': strategie.estime2022,
            'Estim� 2023': strategie.estime2023,
            'Estim� 2024': strategie.estime2024,
            'Estim� 2025': strategie.estime2025
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Strat�gie');

        const date = new Date().toISOString().split('T')[0];
        const filename = `strategie-approvisionnement-${date}.xlsx`;

        XLSX.writeFile(wb, filename);

        console.log(`[STRATEGIE] Export Excel r�ussi: ${filename}`);
        alert(` Export Excel r�ussi: ${strategieData.length} strat�gies export�es !`);
    } catch (error) {
        console.error('[STRATEGIE] Erreur lors de l\'export:', error);
        alert('L Erreur lors de l\'export Excel.');
    }
}

/**
 * Exporte les donn�es vers PDF
 * @returns {void}
 */
export function exportApprovisionnementToPDF() {
    if (!Array.isArray(strategieData) || strategieData.length === 0) {
        alert('� Aucune donn�e � exporter.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(16);
        doc.text('Strategie d\'Approvisionnement', 14, 15);

        doc.setFontSize(10);
        const date = new Date().toLocaleDateString('fr-FR');
        doc.text(`Genere le ${date}`, 14, 22);

        const headers = [['Fournisseur', 'Type travaux', 'Justification', 'Estime', '2021', '2022', '2023', '2024', '2025']];
        const data = strategieData.map(s => [
            s.fournisseur || '',
            s.typeTravaux || '',
            s.justification || '',
            s.estime || '',
            s.estime2021 || '',
            s.estime2022 || '',
            s.estime2023 || '',
            s.estime2024 || '',
            s.estime2025 || ''
        ]);

        doc.autoTable({
            head: headers,
            body: data,
            startY: 28,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [102, 126, 234], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 28, right: 14, bottom: 14, left: 14 }
        });

        const filename = `strategie-approvisionnement-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

        console.log(`[STRATEGIE] Export PDF reussi: ${filename}`);
        alert(` Export PDF reussi: ${strategieData.length} strategies exportees !`);
    } catch (error) {
        console.error('[STRATEGIE] Erreur lors de l\'export PDF:', error);
        alert('L Erreur lors de l\'export PDF.');
    }
}

/**
 * Exporte les donn�es vers DOCX
 * @returns {void}
 */
export async function exportApprovisionnementToDocx() {
    if (!Array.isArray(strategieData) || strategieData.length === 0) {
        alert('� Aucune donn�e � exporter.');
        return;
    }

    try {
        // Cr�er un document Word simple avec du XML
        const date = new Date().toLocaleDateString('fr-FR');

        // Construire le contenu XML du document Word
        let tableRows = '';
        strategieData.forEach(strategie => {
            tableRows += `
                <w:tr>
                    <w:tc><w:p><w:r><w:t>${strategie.fournisseur || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.typeTravaux || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.justification || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.estime || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.estime2021 || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.estime2022 || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.estime2023 || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.estime2024 || ''}</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>${strategie.estime2025 || ''}</w:t></w:r></w:p></w:tc>
                </w:tr>`;
        });

        const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
                <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
                <w:t>Strategie d'Approvisionnement</w:t>
            </w:r>
        </w:p>
        <w:p>
            <w:r><w:t>Genere le ${date}</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t></w:t></w:r></w:p>
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="5000" w:type="pct"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                    <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                    <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Fournisseur</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Type de travaux</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Justification</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Estime</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2021</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2022</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2023</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2024</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2025</w:t></w:r></w:p></w:tc>
            </w:tr>
            ${tableRows}
        </w:tbl>
    </w:body>
</w:document>`;

        // Cr�er un fichier ZIP contenant le document Word
        if (!window.JSZip) {
            throw new Error('JSZip non disponible. Assurez-vous que la bibliotheque est chargee.');
        }

        const zip = new window.JSZip();

        // Structure minimale d'un fichier DOCX
        zip.file('word/document.xml', docXml);
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

        // G�n�rer le fichier
        const blob = await zip.generateAsync({ type: 'blob' });

        // T�l�charger le fichier
        const filename = `strategie-approvisionnement-${new Date().toISOString().split('T')[0]}.docx`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log(`[STRATEGIE] Export DOCX reussi: ${filename}`);
        alert(` Export DOCX reussi: ${strategieData.length} strategies exportees !`);
    } catch (error) {
        console.error('[STRATEGIE] Erreur lors de l\'export DOCX:', error);
        alert('L Erreur lors de l\'export DOCX: ' + error.message);
    }
}

/**
 * Alias pour exportStrategieToExcel
 * @returns {void}
 */
export function exportApprovisionnementToExcel() {
    exportStrategieToExcel();
}

/**
 * R�cup�re les donn�es de strat�gie
 * @returns {Array}
 */
export function getStrategieData() {
    return strategieData;
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.addStrategieRow = addStrategieRow;
    window.deleteStrategie = deleteStrategie;
    window.updateStrategieField = updateStrategieField;
    window.toggleHistoriqueColumns = toggleHistoriqueColumns;
    window.exportApprovisionnementToPDF = exportApprovisionnementToPDF;
    window.exportApprovisionnementToExcel = exportApprovisionnementToExcel;
    window.exportApprovisionnementToDocx = exportApprovisionnementToDocx;
    window.loadStrategieData = loadStrategieData;
}

