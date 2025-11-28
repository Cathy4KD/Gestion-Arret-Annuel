/**
 * @fileoverview Module de gestion du Chemin Critique
 * @module data/chemin-critique
 *
 * @description
 * Gère les tâches du chemin critique de l'arrêt
 *
 * @exports {Function} loadCheminCritiqueData
 * @exports {Function} saveCheminCritiqueData
 * @exports {Function} addCheminCritiqueTask
 * @exports {Function} deleteCheminCritiqueTask
 * @exports {Function} updateCheminCritiqueField
 * @exports {Function} renderCheminCritiqueTable
 * @exports {Function} exportCheminCritiqueToExcel
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

let cheminCritiqueData = [];

/**
 * Set Chemin Critique data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setCheminCritiqueData(data) {
    cheminCritiqueData = Array.isArray(data) ? data : [];
    console.log(`[CHEMIN-CRITIQUE] ✅ Données injectées: ${cheminCritiqueData.length} tâches`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setCheminCritiqueData = setCheminCritiqueData;
}

export async function loadCheminCritiqueData() {
    const saved = await loadFromStorage('cheminCritiqueData');
    if (saved && Array.isArray(saved)) {
        cheminCritiqueData = saved;
        console.log('[OK] Données Chemin Critique chargées:', cheminCritiqueData.length, 'tâches');
        renderCheminCritiqueTable();
        updateStatistics();
    } else {
        cheminCritiqueData = [];
        renderCheminCritiqueTable();
        updateStatistics();
    }
}

export async function saveCheminCritiqueData() {
    await saveToStorage('cheminCritiqueData', cheminCritiqueData);
    console.log('[OK] Données Chemin Critique sauvegardées et synchronisées avec le serveur');
}

export function addCheminCritiqueTask() {
    const newTask = {
        id: `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ordre: cheminCritiqueData.length + 1,
        nom: '',
        responsable: '',
        duree: 0,
        dateDebut: '',
        dateFin: '',
        marge: 0,
        statut: 'Non démarré'
    };

    cheminCritiqueData.push(newTask);
    saveCheminCritiqueData();
    renderCheminCritiqueTable();
    updateStatistics();
}

export function deleteCheminCritiqueTask(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        cheminCritiqueData = cheminCritiqueData.filter(task => task.id !== id);

        // Réorganiser les ordres
        cheminCritiqueData.forEach((task, index) => {
            task.ordre = index + 1;
        });

        saveCheminCritiqueData();
        renderCheminCritiqueTable();
        updateStatistics();
    }
}

export function updateCheminCritiqueField(id, field, value) {
    const task = cheminCritiqueData.find(t => t.id === id);
    if (task) {
        // Conversion des types
        if (field === 'duree' || field === 'marge') {
            task[field] = parseFloat(value) || 0;
        } else if (field === 'ordre') {
            task[field] = parseInt(value) || 1;
        } else {
            task[field] = value;
        }

        // Recalculer la date de fin si durée ou date de début change
        if ((field === 'duree' || field === 'dateDebut') && task.dateDebut && task.duree > 0) {
            const debut = new Date(task.dateDebut);
            const heures = task.duree;
            debut.setHours(debut.getHours() + heures);
            task.dateFin = debut.toISOString().split('T')[0] + 'T' + debut.toTimeString().split(' ')[0].substring(0, 5);
        }

        saveCheminCritiqueData();
        updateStatistics();
    }
}

export function moveTaskUp(id) {
    const index = cheminCritiqueData.findIndex(t => t.id === id);
    if (index > 0) {
        // Échanger avec la tâche précédente
        [cheminCritiqueData[index], cheminCritiqueData[index - 1]] =
        [cheminCritiqueData[index - 1], cheminCritiqueData[index]];

        // Mettre à jour les ordres
        cheminCritiqueData.forEach((task, idx) => {
            task.ordre = idx + 1;
        });

        saveCheminCritiqueData();
        renderCheminCritiqueTable();
    }
}

export function moveTaskDown(id) {
    const index = cheminCritiqueData.findIndex(t => t.id === id);
    if (index < cheminCritiqueData.length - 1) {
        // Échanger avec la tâche suivante
        [cheminCritiqueData[index], cheminCritiqueData[index + 1]] =
        [cheminCritiqueData[index + 1], cheminCritiqueData[index]];

        // Mettre à jour les ordres
        cheminCritiqueData.forEach((task, idx) => {
            task.ordre = idx + 1;
        });

        saveCheminCritiqueData();
        renderCheminCritiqueTable();
    }
}

export function renderCheminCritiqueTable() {
    const tbody = document.getElementById('cheminCritiqueTableBody');

    if (!tbody) return;

    if (!Array.isArray(cheminCritiqueData) || cheminCritiqueData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #999; padding: 20px;">
                    Aucune tâche sur le chemin critique
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    cheminCritiqueData.forEach((task, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        // Colorier selon le statut
        let statutColor = '#6c757d';
        if (task.statut === 'En cours') statutColor = '#ffc107';
        if (task.statut === 'Complété') statutColor = '#28a745';
        if (task.statut === 'En retard') statutColor = '#dc3545';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <div style="display: flex; flex-direction: column; gap: 3px; align-items: center;">
                    <strong>${task.ordre}</strong>
                    <div style="display: flex; gap: 2px;">
                        <button onclick="window.cheminCritiqueActions.moveUp('${task.id}')"
                                ${index === 0 ? 'disabled' : ''}
                                style="padding: 2px 5px; font-size: 0.8em; cursor: ${index === 0 ? 'not-allowed' : 'pointer'}; opacity: ${index === 0 ? '0.5' : '1'};">▲</button>
                        <button onclick="window.cheminCritiqueActions.moveDown('${task.id}')"
                                ${index === cheminCritiqueData.length - 1 ? 'disabled' : ''}
                                style="padding: 2px 5px; font-size: 0.8em; cursor: ${index === cheminCritiqueData.length - 1 ? 'not-allowed' : 'pointer'}; opacity: ${index === cheminCritiqueData.length - 1 ? '0.5' : '1'};">▼</button>
                    </div>
                </div>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${task.nom || ''}"
                       placeholder="Nom de la tâche"
                       onchange="window.cheminCritiqueActions.updateField('${task.id}', 'nom', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${task.responsable || ''}"
                       placeholder="Responsable"
                       onchange="window.cheminCritiqueActions.updateField('${task.id}', 'responsable', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="number"
                       value="${task.duree || 0}"
                       placeholder="0"
                       step="0.5"
                       onchange="window.cheminCritiqueActions.updateField('${task.id}', 'duree', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="datetime-local"
                       value="${task.dateDebut || ''}"
                       onchange="window.cheminCritiqueActions.updateField('${task.id}', 'dateDebut', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="datetime-local"
                       value="${task.dateFin || ''}"
                       onchange="window.cheminCritiqueActions.updateField('${task.id}', 'dateFin', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="number"
                       value="${task.marge || 0}"
                       placeholder="0"
                       step="0.5"
                       onchange="window.cheminCritiqueActions.updateField('${task.id}', 'marge', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <select onchange="window.cheminCritiqueActions.updateField('${task.id}', 'statut', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; background: ${statutColor}; color: white; font-weight: bold;">
                    <option value="Non démarré" ${task.statut === 'Non démarré' ? 'selected' : ''}>Non démarré</option>
                    <option value="En cours" ${task.statut === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Complété" ${task.statut === 'Complété' ? 'selected' : ''}>Complété</option>
                    <option value="En retard" ${task.statut === 'En retard' ? 'selected' : ''}>En retard</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.cheminCritiqueActions.deleteTask('${task.id}')"
                        style="background: #dc3545; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateStatistics() {
    // Durée totale
    const dureeTotal = cheminCritiqueData.reduce((sum, task) => sum + (parseFloat(task.duree) || 0), 0);
    const dureeElement = document.getElementById('cheminCritiqueDureeTotal');
    if (dureeElement) dureeElement.textContent = `${dureeTotal.toFixed(1)}h`;

    // Tâches en retard
    const tachesEnRetard = cheminCritiqueData.filter(task => task.statut === 'En retard').length;
    const retardElement = document.getElementById('cheminCritiqueTachesEnRetard');
    if (retardElement) retardElement.textContent = tachesEnRetard;

    // Tâches complétées
    const tachesCompletes = cheminCritiqueData.filter(task => task.statut === 'Complété').length;
    const completElement = document.getElementById('cheminCritiqueTachesCompletes');
    if (completElement) completElement.textContent = tachesCompletes;

    // Marge minimale
    const marges = cheminCritiqueData.map(task => parseFloat(task.marge) || 0);
    const margeMin = marges.length > 0 ? Math.min(...marges) : 0;
    const margeElement = document.getElementById('cheminCritiqueMargeMin');
    if (margeElement) margeElement.textContent = `${margeMin.toFixed(1)}h`;
}

export function exportCheminCritiqueToExcel() {
    if (!cheminCritiqueData || cheminCritiqueData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    const exportData = cheminCritiqueData.map(task => ({
        'Ordre': task.ordre,
        'Nom de la Tâche': task.nom,
        'Responsable': task.responsable,
        'Durée (h)': task.duree,
        'Date Début': task.dateDebut,
        'Date Fin': task.dateFin,
        'Marge (h)': task.marge,
        'Statut': task.statut
    }));

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Chemin Critique');

    const fileName = `Chemin_Critique_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`✅ Fichier exporté: ${fileName}`);
}

export function getCheminCritiqueData() {
    return cheminCritiqueData;
}
