/**
 * @fileoverview Gestion des besoins électriques arrêt (prises de soudure)
 * @module data/besoin-electriques-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage
 * @const {string}
 */
const STORAGE_KEY = 'besoinElectriquesData';

/**
 * Données des besoins électriques
 * @type {Array}
 */
let besoinElectriquesData = [];

/**
 * Initialise le module
 */
export function initBesoinElectriquesModule() {
    loadBesoinElectriquesData();
}

/**
 * Charge les données depuis le serveur
 * @returns {Promise<void>}
 */
export async function loadBesoinElectriquesData() {
    const savedData = await loadFromStorage(STORAGE_KEY);
    if (savedData && Array.isArray(savedData)) {
        besoinElectriquesData = savedData;
        console.log(`[BESOIN-ELECTRIQUES] ${besoinElectriquesData.length} entrées chargées depuis le serveur`);
    }
    renderTable();
}

/**
 * Sauvegarde les données sur le serveur
 * @returns {Promise<void>}
 */
async function saveBesoinElectriquesData() {
    await saveToStorage(STORAGE_KEY, besoinElectriquesData);
    console.log('[BESOIN-ELECTRIQUES] Données sauvegardées sur le serveur');
}

/**
 * Ajoute une nouvelle ligne vide
 */
function addItem() {
    const newItem = {
        id: `besoin-elec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        equipement: '',
        secteur: '',
        type: '', // 'interne' ou 'externe'
        mainOeuvre: '',
        commentaire: ''
    };
    besoinElectriquesData.push(newItem);
    saveBesoinElectriquesData();
    renderTable();
}

/**
 * Met à jour un champ d'un item
 * @param {string} id - ID de l'item
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 */
function updateField(id, field, value) {
    const item = besoinElectriquesData.find(i => i.id === id);
    if (item) {
        item[field] = value;
        saveBesoinElectriquesData();
    }
}

/**
 * Supprime un item
 * @param {string} id - ID de l'item à supprimer
 */
function deleteItem(id) {
    if (confirm('Voulez-vous vraiment supprimer cette ligne ?')) {
        besoinElectriquesData = besoinElectriquesData.filter(i => i.id !== id);
        saveBesoinElectriquesData();
        renderTable();
    }
}

/**
 * Affiche le tableau
 */
function renderTable() {
    const tbody = document.getElementById('besoin-electriques-tbody');
    const countSpan = document.getElementById('besoin-electriques-count');

    if (!tbody) return;

    // Mise à jour du compteur
    if (countSpan) {
        countSpan.textContent = besoinElectriquesData.length;
    }

    // Si aucune donnée
    if (besoinElectriquesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #666;">Aucune donnée. Cliquez sur "Ajouter une ligne" pour commencer.</td></tr>';
        return;
    }

    // Afficher les données
    tbody.innerHTML = besoinElectriquesData.map(item => `
        <tr>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${item.equipement || ''}"
                       onchange="window.besoinElectriquesActions.updateField('${item.id}', 'equipement', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${item.secteur || ''}"
                       onchange="window.besoinElectriquesActions.updateField('${item.id}', 'secteur', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <input type="radio" name="type-${item.id}" value="interne"
                       ${item.type === 'interne' ? 'checked' : ''}
                       onchange="window.besoinElectriquesActions.updateField('${item.id}', 'type', 'interne')"
                       style="cursor: pointer; width: 18px; height: 18px;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <input type="radio" name="type-${item.id}" value="externe"
                       ${item.type === 'externe' ? 'checked' : ''}
                       onchange="window.besoinElectriquesActions.updateField('${item.id}', 'type', 'externe')"
                       style="cursor: pointer; width: 18px; height: 18px;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${item.mainOeuvre || ''}"
                       onchange="window.besoinElectriquesActions.updateField('${item.id}', 'mainOeuvre', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <textarea onchange="window.besoinElectriquesActions.updateField('${item.id}', 'commentaire', this.value)"
                          class="auto-resize"
                          style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; resize: none; overflow: hidden; font-size: 0.9em; line-height: 1.4;">${item.commentaire || ''}</textarea>
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.besoinElectriquesActions.deleteItem('${item.id}')"
                        class="btn" style="background: #dc3545; color: white; padding: 4px 8px; font-size: 0.85em;">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');

    // Activer le système de redimensionnement auto des textareas
    if (window.textareaResizeManager) {
        window.textareaResizeManager.initialize();
    }
}

/**
 * Exporte les données en Excel
 */
async function exportExcel() {
    if (!window.XLSX) {
        alert('La bibliothèque XLSX n\'est pas chargée.');
        return;
    }

    if (besoinElectriquesData.length === 0) {
        alert('Aucune donnée à exporter.');
        return;
    }

    // Préparer les données pour l'export
    const exportData = besoinElectriquesData.map(item => ({
        'Équipement': item.equipement || '',
        'Secteur': item.secteur || '',
        'Type': item.type === 'interne' ? 'Interne' : item.type === 'externe' ? 'Externe' : '',
        'Main d\'œuvre': item.mainOeuvre || '',
        'Commentaire': item.commentaire || ''
    }));

    // Créer le workbook
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(exportData);

    // Auto-dimensionnement des colonnes
    autoSizeColumns(exportData, ws);

    // Ajouter la feuille au workbook
    window.XLSX.utils.book_append_sheet(wb, ws, 'Besoins Électriques');

    // Télécharger le fichier
    const fileName = `Besoins_Electriques_${new Date().toISOString().split('T')[0]}.xlsx`;
    window.XLSX.writeFile(wb, fileName);

    console.log('[BESOIN-ELECTRIQUES] Export Excel réussi:', fileName);
}

/**
 * Exporte les données en PDF
 */
async function exportPDF() {
    if (!window.jspdf) {
        alert('La bibliothèque jsPDF n\'est pas chargée.');
        return;
    }

    if (besoinElectriquesData.length === 0) {
        alert('Aucune donnée à exporter.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Titre
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('ÉVALUER BESOIN ÉLECTRIQUES ARRÊT (PRISE DE SOUDURE)', 14, 15);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('fr-FR');
    doc.text(`Date: ${dateStr}`, 14, 22);

    // Préparer les données du tableau
    const tableData = besoinElectriquesData.map(item => [
        item.equipement || '',
        item.secteur || '',
        item.type === 'interne' ? 'Interne' : item.type === 'externe' ? 'Externe' : '',
        item.mainOeuvre || '',
        item.commentaire || ''
    ]);

    // Créer le tableau
    doc.autoTable({
        startY: 28,
        head: [['Équipement', 'Secteur', 'Type', 'Main d\'œuvre', 'Commentaire']],
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: 'auto' }
        }
    });

    // Télécharger le PDF
    const fileName = `Besoins_Electriques_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    console.log('[BESOIN-ELECTRIQUES] Export PDF réussi:', fileName);
}

// Export des actions publiques
window.besoinElectriquesActions = {
    addItem,
    updateField,
    deleteItem,
    exportExcel,
    exportPDF
};
