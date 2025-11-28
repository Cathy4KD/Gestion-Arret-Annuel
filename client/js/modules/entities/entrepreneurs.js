/**
 * @fileoverview Module de gestion des entrepreneurs
 * @module entities/entrepreneurs
 *
 * @description
 * Gère les travaux entrepreneur filtrés depuis IW37N
 * Source: lignes 10839-11036 du fichier HTML original
 *
 * @exports {Function} syncEntrepreneurFromIw37n
 * @exports {Function} filterEntrepreneurByPoste
 * @exports {Function} renderEntrepreneurTable
 * @exports {Function} exportEntrepreneurToExcel
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

let entrepreneurData = [];
let entrepreneurAllData = [];
let entrepreneurPostesTrav = [];

export function syncEntrepreneurFromIw37n(iw37nData) {
    if (!iw37nData || iw37nData.length === 0) {
        alert('[WARNING] Aucune donnée IW37N disponible.');
        return;
    }

    entrepreneurAllData = [];
    const postesSet = new Set();

    iw37nData.forEach(row => {
        const posteTravOper = row['Post.trav.opér.'] || '';
        const ordre = row['Ordre'] || '';
        const operation = row['Opération'] || '';
        const designOperation = row['Désign. opér.'] || '';
        const posteTechnique = row['Poste technique'] || '';

        // Filtrer: exclure postes commençant par "A" SAUF "A91CS"
        const shouldInclude = posteTravOper === 'A91CS' || !posteTravOper.startsWith('A');

        if (shouldInclude && posteTravOper) {
            const key = `${ordre}-${operation}`;
            if (!entrepreneurAllData.some(item => `${item.ordre}-${item.operation}` === key)) {
                entrepreneurAllData.push({
                    id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    ordre: ordre,
                    operation: operation,
                    designOperation: designOperation,
                    posteTechnique: posteTechnique,
                    posteTravOper: posteTravOper
                });
                postesSet.add(posteTravOper);
            }
        }
    });

    entrepreneurPostesTrav = Array.from(postesSet).sort();
    entrepreneurData = [...entrepreneurAllData];

    console.log(`[OK] ${entrepreneurData.length} travaux entrepreneur extraits`);
    populateEntrepreneurPosteFilter();
    renderEntrepreneurTable();
    saveEntrepreneurData();
}

function populateEntrepreneurPosteFilter() {
    const select = document.getElementById('entrepreneurPosteTravFilter');
    if (!select) return;

    select.innerHTML = '<option value="">-- Tous les postes --</option>';
    entrepreneurPostesTrav.forEach(poste => {
        const option = document.createElement('option');
        option.value = poste;
        option.textContent = poste;
        select.appendChild(option);
    });
}

export function filterEntrepreneurByPoste() {
    const select = document.getElementById('entrepreneurPosteTravFilter');
    if (!select) return;

    const selectedPoste = select.value;

    if (selectedPoste === '') {
        entrepreneurData = [...entrepreneurAllData];
    } else {
        entrepreneurData = entrepreneurAllData.filter(item => item.posteTravOper === selectedPoste);
    }

    renderEntrepreneurTable();
    console.log(`[OK] Filtrage: ${entrepreneurData.length} travaux affichés`);
}

export function renderEntrepreneurTable() {
    const tbody = document.getElementById('entrepreneurTableBody');
    const countSpan = document.getElementById('entrepreneurCount');

    if (!tbody) return;

    if (!entrepreneurData || entrepreneurData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail. Cliquez sur "Synchroniser avec IW37N".
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    if (countSpan) countSpan.textContent = entrepreneurData.length;
    tbody.innerHTML = '';

    entrepreneurData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        tr.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">${item.ordre}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${item.operation}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${item.designOperation}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${item.posteTechnique}</td>
        `;
        tbody.appendChild(tr);
    });
}

function saveEntrepreneurData() {
    saveToStorage('entrepreneurAllData', entrepreneurAllData);
    saveToStorage('entrepreneurPostesTrav', entrepreneurPostesTrav);
    console.log('[SAVE] Données Entrepreneur sauvegardées et synchronisées avec le serveur');
}

export function loadEntrepreneurData() {
    const savedData = loadFromStorage('entrepreneurAllData');
    const savedPostes = loadFromStorage('entrepreneurPostesTrav');

    if (savedData) {
        entrepreneurAllData = savedData;
        entrepreneurData = [...entrepreneurAllData];
        console.log(`[OK] ${entrepreneurAllData.length} travaux entrepreneur chargés`);
    }

    if (savedPostes) {
        entrepreneurPostesTrav = savedPostes;
        populateEntrepreneurPosteFilter();
    }

    if (savedData) {
        renderEntrepreneurTable();
    }
}

export function exportEntrepreneurToExcel() {
    if (!entrepreneurData || entrepreneurData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    const exportData = entrepreneurData.map(item => ({
        'Ordre': item.ordre,
        'Opération': item.operation,
        'Désign. opér.': item.designOperation,
        'Poste technique': item.posteTechnique
    }));

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Travaux Entrepreneur');

    const fileName = `Travaux_Entrepreneur_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(` Fichier exporté: ${fileName}`);
}

export function getEntrepreneurData() {
    return entrepreneurData;
}
