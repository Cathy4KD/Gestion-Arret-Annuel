/**
 * @fileoverview Module de gestion des VPO (Vérifications Préalables à l'Ouverture)
 * @module data/vpo
 *
 * @description
 * Gère la liste des VPO à demander à la production
 *
 * @exports {Function} loadVPOData
 * @exports {Function} saveVPOData
 * @exports {Function} addVPO
 * @exports {Function} deleteVPO
 * @exports {Function} updateVPOField
 * @exports {Function} renderVPOTable
 * @exports {Function} exportVPOToExcel
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

let vpoData = [];

/**
 * Set VPO data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setVPOData(data) {
    vpoData = Array.isArray(data) ? data : [];
    console.log(`[VPO] ✅ Données injectées: ${vpoData.length} VPO`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setVPOData = setVPOData;
}

export async function loadVPOData() {
    const saved = await loadFromStorage('vpoData');
    if (saved && Array.isArray(saved)) {
        vpoData = saved;
        console.log('[OK] Données VPO chargées:', vpoData.length, 'VPO');
        renderVPOTable();
    } else {
        vpoData = [];
        renderVPOTable();
    }
}

export async function saveVPOData() {
    await saveToStorage('vpoData', vpoData);
    console.log('[OK] Données VPO sauvegardées et synchronisées avec le serveur');
}

export function addVPO() {
    const newVPO = {
        id: `vpo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nom: '',
        equipement: '',
        posteTechnique: '',
        description: '',
        contraintes: '',
        documents: [] // Liste des documents attachés
    };

    vpoData.push(newVPO);
    saveVPOData();
    renderVPOTable();
}

export function addVPODocument(vpoId) {
    const vpo = vpoData.find(v => v.id === vpoId);
    if (!vpo) return;

    const docName = prompt('Nom du document:');
    if (!docName) return;

    const docUrl = prompt('URL ou chemin du document:');
    if (!docUrl) return;

    if (!vpo.documents) {
        vpo.documents = [];
    }

    vpo.documents.push({
        id: `doc-${Date.now()}`,
        nom: docName,
        url: docUrl,
        dateAjout: new Date().toISOString()
    });

    saveVPOData();
    renderVPOTable();
}

export function removeVPODocument(vpoId, docId) {
    const vpo = vpoData.find(v => v.id === vpoId);
    if (!vpo) return;

    if (confirm('Supprimer ce document ?')) {
        vpo.documents = vpo.documents.filter(d => d.id !== docId);
        saveVPOData();
        renderVPOTable();
    }
}

export function deleteVPO(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce VPO ?')) {
        vpoData = vpoData.filter(vpo => vpo.id !== id);
        saveVPOData();
        renderVPOTable();
    }
}

export function updateVPOField(id, field, value) {
    const vpo = vpoData.find(v => v.id === id);
    if (vpo) {
        vpo[field] = value;
        saveVPOData();
    }
}

export function renderVPOTable() {
    const tbody = document.getElementById('vpoTableBody');
    const countSpan = document.getElementById('vpoCount');

    if (!tbody) return;

    if (!Array.isArray(vpoData) || vpoData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 30px; text-align: center; color: #666;">
                    Aucun VPO dans la liste. Cliquez sur "Ajouter un VPO" pour commencer.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = vpoData.length;

    vpoData.forEach((vpo, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        row.style.height = '28px';

        // Générer la liste des documents
        const documents = vpo.documents || [];
        let documentsHTML = '';
        if (documents.length > 0) {
            documentsHTML = documents.map(doc => `
                <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
                    <a href="${doc.url}" target="_blank" style="flex: 1; color: #667eea; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        📄 ${doc.nom}
                    </a>
                    <button onclick="window.vpoActions.removeDocument('${vpo.id}', '${doc.id}')"
                            style="background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 0.8em;">
                        ✕
                    </button>
                </div>
            `).join('');
        }

        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${vpo.nom || ''}"
                       placeholder="Nom"
                       onchange="window.vpoActions.updateField('${vpo.id}', 'nom', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${vpo.equipement || ''}"
                       placeholder="Équipement"
                       onchange="window.vpoActions.updateField('${vpo.id}', 'equipement', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${vpo.posteTechnique || ''}"
                       placeholder="Poste technique"
                       onchange="window.vpoActions.updateField('${vpo.id}', 'posteTechnique', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <textarea
                       placeholder="Description"
                       onchange="window.vpoActions.updateField('${vpo.id}', 'description', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px; min-height: 40px; resize: vertical;">${vpo.description || ''}</textarea>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <textarea
                       placeholder="Contraintes"
                       onchange="window.vpoActions.updateField('${vpo.id}', 'contraintes', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px; min-height: 40px; resize: vertical;">${vpo.contraintes || ''}</textarea>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <div style="max-height: 100px; overflow-y: auto; font-size: 11px;">
                    ${documentsHTML}
                    <button onclick="window.vpoActions.addDocument('${vpo.id}')"
                            style="width: 100%; margin-top: 3px; padding: 3px; background: #48bb78; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
                        ➕ +
                    </button>
                </div>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; background: #f8f9fa;">
                <button onclick="window.vpoActions.deleteVPO('${vpo.id}')"
                        style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

export function exportVPOToExcel() {
    if (!vpoData || vpoData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[VPO] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    const exportData = vpoData.map(vpo => ({
        'Nom du VPO': vpo.nom,
        'Équipement concerné': vpo.equipement,
        'Poste technique': vpo.posteTechnique,
        'Description du VPO': vpo.description,
        'Contraintes / Conditions': vpo.contraintes
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'VPO');

    const fileName = `VPO_Liste_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`✅ Fichier exporté: ${fileName}`);
}

export function getVPOData() {
    return vpoData;
}
