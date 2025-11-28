/**
 * @fileoverview Module de gestion des projets INGQ
 * @module entities/ingq
 *
 * @description
 * Gère les projets INGQ (Ingénierie et Qualité) pour l'arrêt annuel
 *
 * @exports {Function} loadINGQData
 * @exports {Function} saveINGQData
 * @exports {Function} addProjet
 * @exports {Function} deleteProjet
 * @exports {Function} updateField
 * @exports {Function} renderTable
 * @exports {Function} exportToExcel
 */

import { autoSizeColumns } from '../import-export/excel-export.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

let ingqData = [];

/**
 * Définit les données INGQ (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setIngqData(data) {
    ingqData = data || [];
    console.log(`[INGQ] ✅ Données injectées: ${ingqData.length} projets`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setIngqData = setIngqData;
    console.log('[INGQ] ✅ window.setIngqData exposée');
}

/**
 * Charge les données INGQ depuis le serveur (avec fallback localStorage)
 */
export function loadINGQData() {
    console.log('[INGQ] Chargement des données...');

    // Si les données ont déjà été injectées par le serveur, on les affiche
    if (ingqData.length > 0) {
        console.log('[INGQ] ✅ Données déjà en mémoire:', ingqData.length, 'projets');
        renderTable();
        return;
    }

    // Sinon, fallback sur localStorage
    try {
        const saved = loadFromStorage('ingqData');
        if (saved) {
            ingqData = saved;
            console.log('[INGQ] ✅ Données chargées depuis localStorage:', ingqData.length, 'projets');
            renderTable();
        }
    } catch (error) {
        console.error('[INGQ] ❌ Erreur chargement:', error);
    }
}

/**
 * Sauvegarde les données INGQ sur le serveur
 * @returns {Promise<boolean>}
 */
export async function saveINGQData() {
    console.log('[INGQ] 💾 Sauvegarde de', ingqData.length, 'projets sur le serveur...');

    const success = await saveToStorage('ingqData', ingqData);

    if (success) {
        console.log('[INGQ] ✅ Données sauvegardées sur le serveur avec succès');
    } else {
        console.error('[INGQ] ❌ Échec de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Ajoute un nouveau projet INGQ
 */
export function addProjet() {
    const newProjet = {
        id: `ingq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nom: '',
        responsable: '',
        budget: '',
        dateDebut: '',
        dateFin: '',
        statut: 'En planification',
        description: ''
    };

    ingqData.push(newProjet);
    saveINGQData();
    renderTable();
}

/**
 * Supprime un projet INGQ
 * @param {string} id - ID du projet à supprimer
 */
export function deleteProjet(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
        ingqData = ingqData.filter(projet => projet.id !== id);
        saveINGQData();
        renderTable();
    }
}

/**
 * Met à jour un champ d'un projet
 * @param {string} id - ID du projet
 * @param {string} field - Nom du champ
 * @param {any} value - Nouvelle valeur
 */
export function updateField(id, field, value) {
    const projet = ingqData.find(p => p.id === id);
    if (projet) {
        projet[field] = value;
        saveINGQData();
    }
}

/**
 * Rend le tableau des projets INGQ
 */
export function renderTable() {
    const tbody = document.getElementById('ingq-tbody');
    const countSpan = document.getElementById('ingq-count');

    if (!tbody) return;

    if (!ingqData || ingqData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 30px; text-align: center; color: #666;">
                    Aucun projet INGQ. Cliquez sur "Ajouter un projet" pour commencer.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = ingqData.length;

    ingqData.forEach((projet, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        const budgetFormatted = projet.budget ? parseFloat(projet.budget).toLocaleString('fr-CA', {style: 'currency', currency: 'CAD'}) : '';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${projet.nom || ''}"
                       placeholder="Nom du projet"
                       onchange="window.ingqActions.updateField('${projet.id}', 'nom', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${projet.responsable || ''}"
                       placeholder="Responsable"
                       onchange="window.ingqActions.updateField('${projet.id}', 'responsable', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="number"
                       value="${projet.budget || ''}"
                       placeholder="0"
                       onchange="window.ingqActions.updateField('${projet.id}', 'budget', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="date"
                       value="${projet.dateDebut || ''}"
                       onchange="window.ingqActions.updateField('${projet.id}', 'dateDebut', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="date"
                       value="${projet.dateFin || ''}"
                       onchange="window.ingqActions.updateField('${projet.id}', 'dateFin', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <select onchange="window.ingqActions.updateField('${projet.id}', 'statut', this.value)"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="En planification" ${projet.statut === 'En planification' ? 'selected' : ''}>En planification</option>
                    <option value="En cours" ${projet.statut === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Terminé" ${projet.statut === 'Terminé' ? 'selected' : ''}>Terminé</option>
                    <option value="En attente" ${projet.statut === 'En attente' ? 'selected' : ''}>En attente</option>
                    <option value="Annulé" ${projet.statut === 'Annulé' ? 'selected' : ''}>Annulé</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea rows="2"
                          placeholder="Description du projet"
                          onchange="window.ingqActions.updateField('${projet.id}', 'description', this.value)"
                          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;">${projet.description || ''}</textarea>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.ingqActions.deleteProjet('${projet.id}')"
                        class="btn"
                        style="background: linear-gradient(145deg, #dc3545, #c82333); color: white; padding: 6px 12px; font-size: 0.9em;">
                    🗑️ Supprimer
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });

    console.log(`[INGQ] Tableau rendu: ${ingqData.length} projets`);
}

/**
 * Exporte les données INGQ vers Excel
 */
export function exportToExcel() {
    if (!ingqData || ingqData.length === 0) {
        alert('Aucune donnée à exporter.');
        return;
    }

    const exportData = ingqData.map(projet => ({
        'Nom du Projet': projet.nom,
        'Responsable': projet.responsable,
        'Budget ($)': projet.budget,
        'Date Début': projet.dateDebut,
        'Date Fin': projet.dateFin,
        'Statut': projet.statut,
        'Description': projet.description
    }));

    if (typeof XLSX === 'undefined') {
        alert('Bibliothèque XLSX non chargée. Export impossible.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Projets INGQ');

    const fileName = `Projets_INGQ_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`[EXPORT] Fichier exporté: ${fileName}`);
}

/**
 * Obtient les données INGQ
 * @returns {Array} Les projets INGQ
 */
export function getINGQData() {
    return ingqData;
}

export default {
    loadINGQData,
    saveINGQData,
    addProjet,
    deleteProjet,
    updateField,
    renderTable,
    exportToExcel,
    getINGQData
};
