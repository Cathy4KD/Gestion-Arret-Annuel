/**
 * @fileoverview Gestionnaire SMED (Single Minute Exchange of Die) pour optimiser le chemin critique
 * @module smed-manager
 * @version 1.0.0
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

// Variables globales pour les données SMED
let smedTasks = [];
let smedActions = [];
let smedCharts = {
    distribution: null,
    timeGains: null
};

/**
 * Initialise le module SMED
 */
async function initSMED() {
    console.log('📊 Initialisation du module SMED...');

    // Charger les données depuis le serveur
    await loadSMEDData();

    // Initialiser les événements
    initSMEDEvents();

    // Rendre l'interface
    renderSMEDTasks();
    renderSMEDActions();
    updateSMEDStatistics();
    initSMEDCharts();
}

/**
 * Charge les données SMED depuis le serveur (JAMAIS localStorage)
 */
async function loadSMEDData() {
    try {
        console.log('[SMED] 📥 Chargement depuis le serveur...');
        const saved = await loadFromStorage('smedData');
        if (saved) {
            smedTasks = saved.tasks || [];
            smedActions = saved.actions || [];
            console.log(`[SMED] ✅ Données chargées: ${smedTasks.length} tâches, ${smedActions.length} actions`);
        } else {
            console.log('[SMED] ℹ️ Aucune donnée SMED sur le serveur');
        }
    } catch (e) {
        console.error('[SMED] ❌ Erreur lors du chargement des données SMED:', e);
    }
}

/**
 * Sauvegarde les données SMED sur le serveur (JAMAIS localStorage)
 */
async function saveSMEDData() {
    try {
        const data = {
            tasks: smedTasks,
            actions: smedActions
        };

        console.log('[SMED] 💾 Sauvegarde sur le serveur...');
        const success = await saveToStorage('smedData', data);

        if (success) {
            console.log('[SMED] ✅ Données sauvegardées sur le serveur');
        } else {
            console.error('[SMED] ❌ Échec de la sauvegarde sur le serveur');
        }

        return success;
    } catch (e) {
        console.error('[SMED] ❌ Erreur lors de la sauvegarde des données SMED:', e);
        return false;
    }
}

/**
 * Initialise les événements SMED
 */
function initSMEDEvents() {
    // Calculer automatiquement le gain de temps dans le modal
    const tempsActuel = document.getElementById('smedTempsActuel');
    const tempsCible = document.getElementById('smedTempsCibleInput');
    const gainTemps = document.getElementById('smedGainTemps');

    if (tempsActuel && tempsCible && gainTemps) {
        const calculateGain = () => {
            const actuel = parseFloat(tempsActuel.value) || 0;
            const cible = parseFloat(tempsCible.value) || 0;
            const gain = actuel - cible;
            gainTemps.value = gain > 0 ? `${gain.toFixed(1)}h (${((gain / actuel) * 100).toFixed(0)}%)` : '0h';
        };

        tempsActuel.addEventListener('input', calculateGain);
        tempsCible.addEventListener('input', calculateGain);
    }

    // Recherche dans la liste des tâches
    const searchInput = document.getElementById('smedTaskSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterSMEDTasks(e.target.value);
        });
    }
}

/**
 * Affiche le modal de sélection des tâches
 */
function showTaskSelection() {
    const modal = document.getElementById('smedTaskSelectionModal');
    if (modal) {
        modal.style.display = 'flex';
        loadAvailableTasks();
    }
}

/**
 * Charge les tâches disponibles depuis IW37N
 */
function loadAvailableTasks() {
    const tbody = document.getElementById('smedTaskSelectionTableBody');
    if (!tbody) return;

    // Récupérer les données IW37N
    const iw37nData = window.getIW37NData ? window.getIW37NData() : [];

    if (!iw37nData || iw37nData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 30px; text-align: center; color: #666;">Aucune donnée IW37N disponible. Veuillez d\'abord importer les données.</td></tr>';
        return;
    }

    // Filtrer pour ne garder que les tâches du chemin critique
    const criticalTasks = iw37nData.filter(task => {
        // Vous pouvez ajuster ce filtre selon vos critères
        return task.ordre && task.designation;
    });

    if (criticalTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 30px; text-align: center; color: #666;">Aucune tâche critique trouvée.</td></tr>';
        return;
    }

    // Rendre les tâches
    tbody.innerHTML = criticalTasks.map((task, index) => {
        const isSelected = smedTasks.some(t => t.ordre === task.ordre && t.operation === task.operation);

        return `
            <tr>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <input type="checkbox" class="smed-task-checkbox" data-index="${index}" ${isSelected ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;">
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${task.ordre || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${task.operation || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${task.designation || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${task.posteTechnique || 'N/A'}</td>
            </tr>
        `;
    }).join('');

    // Stocker les tâches pour référence
    window._smedAvailableTasks = criticalTasks;
}

/**
 * Toggle sélection de toutes les tâches
 */
function toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll('.smed-task-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
}

/**
 * Filtre les tâches selon le texte de recherche
 */
function filterSMEDTasks(searchText) {
    const tbody = document.getElementById('smedTaskSelectionTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    const search = searchText.toLowerCase();

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

/**
 * Confirme la sélection des tâches
 */
function confirmTaskSelection() {
    const checkboxes = document.querySelectorAll('.smed-task-checkbox:checked');
    const availableTasks = window._smedAvailableTasks || [];

    checkboxes.forEach(cb => {
        const index = parseInt(cb.dataset.index);
        const task = availableTasks[index];

        if (task && !smedTasks.some(t => t.ordre === task.ordre && t.operation === task.operation)) {
            smedTasks.push({
                id: generateId(),
                ordre: task.ordre,
                operation: task.operation,
                description: task.designation,
                posteTechnique: task.posteTechnique,
                typeActuel: 'interne', // Par défaut
                typeCible: '',
                tempsActuel: 0,
                tempsCible: 0,
                gain: 0,
                dateAjout: new Date().toISOString()
            });
        }
    });

    saveSMEDData();
    renderSMEDTasks();
    updateSMEDStatistics();
    cancelTaskSelection();

    // Notification
    if (checkboxes.length > 0) {
        alert(`${checkboxes.length} tâche(s) ajoutée(s) avec succès !`);
    }
}

/**
 * Annule la sélection des tâches
 */
function cancelTaskSelection() {
    const modal = document.getElementById('smedTaskSelectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Affiche le modal d'analyse SMED pour une tâche
 */
function analyzeSMEDTask(taskId) {
    const task = smedTasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('smedAnalysisModal');
    if (!modal) return;

    // Remplir les informations de la tâche
    document.getElementById('smedModalWorkOrder').textContent = task.ordre || 'N/A';
    document.getElementById('smedModalOperation').textContent = task.operation || 'N/A';
    document.getElementById('smedModalDescription').textContent = task.description || 'N/A';

    // Remplir les champs du formulaire
    document.getElementById('smedTypeActuel').value = task.typeActuel || 'interne';
    document.getElementById('smedTypeCible').value = task.typeCible || '';
    document.getElementById('smedTempsActuel').value = task.tempsActuel || 0;
    document.getElementById('smedTempsCibleInput').value = task.tempsCible || 0;

    // Stocker l'ID de la tâche en cours d'analyse
    window._currentSMEDTaskId = taskId;

    modal.style.display = 'flex';
}

/**
 * Sauvegarde l'analyse SMED
 */
function saveAnalysis() {
    const taskId = window._currentSMEDTaskId;
    if (!taskId) return;

    const task = smedTasks.find(t => t.id === taskId);
    if (!task) return;

    // Récupérer les valeurs du formulaire
    const typeActuel = document.getElementById('smedTypeActuel').value;
    const typeCible = document.getElementById('smedTypeCible').value || typeActuel;
    const tempsActuel = parseFloat(document.getElementById('smedTempsActuel').value) || 0;
    const tempsCible = parseFloat(document.getElementById('smedTempsCibleInput').value) || 0;
    const actionProposee = document.getElementById('smedActionProposee').value.trim();
    const priorite = document.getElementById('smedPriorite').value;
    const responsable = document.getElementById('smedResponsable').value.trim();
    const statut = document.getElementById('smedStatut').value;

    // Validation
    if (!actionProposee) {
        alert('Veuillez saisir une action proposée.');
        return;
    }

    // Mettre à jour la tâche
    task.typeActuel = typeActuel;
    task.typeCible = typeCible;
    task.tempsActuel = tempsActuel;
    task.tempsCible = tempsCible;
    task.gain = tempsActuel - tempsCible;

    // Créer ou mettre à jour l'action d'amélioration
    const existingAction = smedActions.find(a => a.taskId === taskId);
    if (existingAction) {
        existingAction.typeActuel = typeActuel;
        existingAction.typeCible = typeCible;
        existingAction.actionProposee = actionProposee;
        existingAction.priorite = priorite;
        existingAction.gainTemps = task.gain;
        existingAction.responsable = responsable;
        existingAction.statut = statut;
        existingAction.dateModification = new Date().toISOString();
    } else {
        smedActions.push({
            id: generateId(),
            taskId: taskId,
            tache: `${task.ordre} - ${task.operation}`,
            typeActuel: typeActuel,
            typeCible: typeCible,
            actionProposee: actionProposee,
            priorite: priorite,
            gainTemps: task.gain,
            responsable: responsable,
            statut: statut,
            dateCreation: new Date().toISOString()
        });
    }

    saveSMEDData();
    renderSMEDTasks();
    renderSMEDActions();
    updateSMEDStatistics();
    updateSMEDCharts();
    cancelAnalysis();

    alert('Analyse SMED enregistrée avec succès !');
}

/**
 * Annule l'analyse SMED
 */
function cancelAnalysis() {
    const modal = document.getElementById('smedAnalysisModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window._currentSMEDTaskId = null;
}

/**
 * Rend les tâches SMED sélectionnées
 */
function renderSMEDTasks() {
    const tbody = document.getElementById('smedSelectedTasksTableBody');
    if (!tbody) return;

    if (smedTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #666;">Aucune tâche sélectionnée. Cliquez sur "Sélectionner Tâches" pour commencer.</td></tr>';
        return;
    }

    tbody.innerHTML = smedTasks.map(task => {
        const typeActuelBadge = task.typeActuel === 'externe' ?
            '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">🟢 Externe</span>' :
            '<span style="background: #ffc107; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">🟡 Interne</span>';

        const gainStyle = task.gain > 0 ? 'color: #28a745; font-weight: 600;' : 'color: #666;';

        return `
            <tr>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${task.ordre || 'N/A'} / ${task.operation || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${task.description || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${typeActuelBadge}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${task.tempsActuel || 0}h</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${task.tempsCible || 0}h</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center; ${gainStyle}">${task.gain > 0 ? '+' : ''}${task.gain.toFixed(1)}h</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <button onclick="window.smedActions.analyzeSMEDTask('${task.id}')" class="btn" style="background: #667eea; color: white; padding: 5px 10px; margin-right: 5px;">
                        ✏️ Analyser
                    </button>
                    <button onclick="window.smedActions.deleteSMEDTask('${task.id}')" class="btn" style="background: #dc3545; color: white; padding: 5px 10px;">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Rend les actions d'amélioration SMED
 */
function renderSMEDActions() {
    const tbody = document.getElementById('smedActionsTableBody');
    if (!tbody) return;

    if (smedActions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="padding: 30px; text-align: center; color: #666;">Aucune action d\'amélioration. Sélectionnez des tâches et cliquez sur "Analyser" pour identifier les opportunités SMED.</td></tr>';
        return;
    }

    tbody.innerHTML = smedActions.map(action => {
        const typeActuelBadge = action.typeActuel === 'externe' ? '🟢 Externe' : '🟡 Interne';
        const typeCibleBadge = action.typeCible === 'externe' ? '🟢 Externe' : '🟡 Interne';

        let prioriteBadge = '';
        switch (action.priorite) {
            case 'haute':
                prioriteBadge = '<span style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">🔴 Haute</span>';
                break;
            case 'moyenne':
                prioriteBadge = '<span style="background: #ffc107; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">🟡 Moyenne</span>';
                break;
            case 'basse':
                prioriteBadge = '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">🟢 Basse</span>';
                break;
        }

        let statutBadge = '';
        switch (action.statut) {
            case 'planifie':
                statutBadge = '📋 Planifié';
                break;
            case 'en_cours':
                statutBadge = '⚙️ En cours';
                break;
            case 'complete':
                statutBadge = '✅ Complété';
                break;
            case 'en_attente':
                statutBadge = '⏸️ En attente';
                break;
        }

        return `
            <tr>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${action.tache || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${typeActuelBadge}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${action.actionProposee || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${typeCibleBadge}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${prioriteBadge}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center; color: #28a745; font-weight: 600;">${action.gainTemps > 0 ? '+' : ''}${action.gainTemps.toFixed(1)}h</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${action.responsable || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${statutBadge}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <button onclick="window.smedActions.editSMEDAction('${action.id}')" class="btn" style="background: #667eea; color: white; padding: 5px 10px; margin-right: 5px;">
                        ✏️
                    </button>
                    <button onclick="window.smedActions.deleteSMEDAction('${action.id}')" class="btn" style="background: #dc3545; color: white; padding: 5px 10px;">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Met à jour les statistiques SMED
 */
function updateSMEDStatistics() {
    // Calculs
    const totalTaches = smedTasks.length;
    const tachesExternes = smedTasks.filter(t => t.typeActuel === 'externe').length;
    const tachesInternes = smedTasks.filter(t => t.typeActuel === 'interne').length;
    const tempsTotal = smedTasks.reduce((sum, t) => sum + (t.tempsActuel || 0), 0);
    const tempsCible = smedTasks.reduce((sum, t) => sum + (t.tempsCible || 0), 0);
    const gainPotentiel = tempsTotal - tempsCible;

    // Mise à jour de l'interface
    document.getElementById('smedTotalTaches').textContent = totalTaches;
    document.getElementById('smedTachesExternes').textContent = tachesExternes;
    document.getElementById('smedTachesInternes').textContent = tachesInternes;
    document.getElementById('smedTempsTotal').textContent = tempsTotal.toFixed(1) + 'h';
    document.getElementById('smedTempsCible').textContent = tempsCible.toFixed(1) + 'h';
    document.getElementById('smedGainPotentiel').textContent = gainPotentiel > 0 ? '+' + gainPotentiel.toFixed(1) + 'h' : '0h';
}

/**
 * Initialise les graphiques SMED
 */
function initSMEDCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js non disponible');
        return;
    }

    updateSMEDCharts();
}

/**
 * Met à jour les graphiques SMED
 */
function updateSMEDCharts() {
    if (typeof Chart === 'undefined') return;

    // Graphique de répartition
    const distributionCtx = document.getElementById('smedTaskDistributionChart');
    if (distributionCtx) {
        const externes = smedTasks.filter(t => t.typeActuel === 'externe').length;
        const internes = smedTasks.filter(t => t.typeActuel === 'interne').length;

        if (smedCharts.distribution) {
            smedCharts.distribution.destroy();
        }

        smedCharts.distribution = new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Externes', 'Internes'],
                datasets: [{
                    data: [externes, internes],
                    backgroundColor: ['#28a745', '#ffc107']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Graphique des gains de temps
    const timeGainsCtx = document.getElementById('smedTimeGainsChart');
    if (timeGainsCtx) {
        const tempsTotal = smedTasks.reduce((sum, t) => sum + (t.tempsActuel || 0), 0);
        const tempsCible = smedTasks.reduce((sum, t) => sum + (t.tempsCible || 0), 0);
        const gain = tempsTotal - tempsCible;

        if (smedCharts.timeGains) {
            smedCharts.timeGains.destroy();
        }

        smedCharts.timeGains = new Chart(timeGainsCtx, {
            type: 'bar',
            data: {
                labels: ['Temps Actuel', 'Temps Cible', 'Gain'],
                datasets: [{
                    label: 'Heures',
                    data: [tempsTotal, tempsCible, gain],
                    backgroundColor: ['#17a2b8', '#dc3545', '#28a745']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Heures'
                        }
                    }
                }
            }
        });
    }
}

/**
 * Supprime une tâche SMED
 */
function deleteSMEDTask(taskId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    smedTasks = smedTasks.filter(t => t.id !== taskId);
    smedActions = smedActions.filter(a => a.taskId !== taskId);

    saveSMEDData();
    renderSMEDTasks();
    renderSMEDActions();
    updateSMEDStatistics();
    updateSMEDCharts();
}

/**
 * Supprime une action SMED
 */
function deleteSMEDAction(actionId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) return;

    smedActions = smedActions.filter(a => a.id !== actionId);

    saveSMEDData();
    renderSMEDActions();
}

/**
 * Édite une action SMED
 */
function editSMEDAction(actionId) {
    const action = smedActions.find(a => a.id === actionId);
    if (!action) return;

    const task = smedTasks.find(t => t.id === action.taskId);
    if (task) {
        analyzeSMEDTask(task.id);
    }
}

/**
 * Exporte les données SMED vers Excel
 */
function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('La bibliothèque d\'export Excel n\'est pas disponible.');
        return;
    }

    // Préparer les données pour l'export
    const data = smedActions.map(action => ({
        'Tâche': action.tache,
        'Type Actuel': action.typeActuel === 'externe' ? 'Externe' : 'Interne',
        'Type Cible': action.typeCible === 'externe' ? 'Externe' : 'Interne',
        'Action Proposée': action.actionProposee,
        'Priorité': action.priorite,
        'Gain de Temps (h)': action.gainTemps.toFixed(1),
        'Responsable': action.responsable || '',
        'Statut': action.statut
    }));

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Actions SMED');

    // Télécharger
    XLSX.writeFile(wb, `SMED_Chemin_Critique_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporte les données SMED vers PDF
 */
function exportToPDF() {
    if (typeof jspdf === 'undefined') {
        alert('La bibliothèque d\'export PDF n\'est pas disponible.');
        return;
    }

    alert('Export PDF en cours de développement...');
}

/**
 * Génère un ID unique
 */
function generateId() {
    return 'smed_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Charge les données SMED pour la page t87 (appelé depuis navigation.js)
 */
function loadSMEDDataForPage() {
    loadSMEDData();
    initSMED();
}

/**
 * Charge la sélection des tâches SMED (appelé depuis navigation.js)
 */
function loadSMEDTasksSelection() {
    // Cette fonction est déjà gérée par initSMED
    console.log('📋 Tâches SMED prêtes pour la sélection');
}

// Exposer les fonctions globalement
window.smedActions = {
    init: initSMED,
    showTaskSelection,
    toggleSelectAll,
    confirmTaskSelection,
    cancelTaskSelection,
    analyzeSMEDTask,
    saveAnalysis,
    cancelAnalysis,
    deleteSMEDTask,
    deleteSMEDAction,
    editSMEDAction,
    exportToExcel,
    exportToPDF
};

// Exposer les fonctions pour navigation.js
window.loadSMEDData = loadSMEDDataForPage;
window.loadSMEDTasksSelection = loadSMEDTasksSelection;

// Auto-initialisation si sur la page SMED
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('detail-t87')) {
            initSMED();
        }
    });
} else {
    if (document.getElementById('detail-t87')) {
        initSMED();
    }
}

console.log('✅ Module SMED chargé');

// Exports pour les modules ES6
export { initSMED, loadSMEDDataForPage as loadSMEDData, loadSMEDTasksSelection };
