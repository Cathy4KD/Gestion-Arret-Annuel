/**
 * @fileoverview Gestion des tâches Cognibox
 * @module data/cognibox-tasks
 *
 * @description
 * Gère l'ajout, la modification et la suppression des tâches Cognibox
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les tâches Cognibox
 * @const {string}
 */
const STORAGE_KEY = 'cogniboxTasks';

/**
 * Données des tâches Cognibox
 * @type {Array}
 */
let cogniboxTasks = [];

/**
 * Charge les tâches Cognibox depuis localStorage
 * @returns {void}
 */
export async function loadCogniboxTasks() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        cogniboxTasks = saved;
        console.log(`[COGNIBOX-TASKS] ${cogniboxTasks.length} tâches chargées depuis localStorage`);
    }
    renderCogniboxTasksTable();
}

/**
 * Sauvegarde les tâches Cognibox dans localStorage ET serveur
 * @returns {void}
 */
async function saveCogniboxTasks() {
    await saveToStorage(STORAGE_KEY, cogniboxTasks);
    console.log('[COGNIBOX-TASKS] Données sauvegardées et synchronisées avec le serveur');
}

/**
 * Affiche le formulaire d'ajout de tâche
 * @returns {void}
 */
export function showAddTaskCognibox() {
    const form = document.getElementById('cognibox-taskForm');
    if (form) {
        form.style.display = 'block';

        // Réinitialiser le formulaire
        document.getElementById('cognibox-externe').value = '';
        document.getElementById('cognibox-numero').value = '';
        document.getElementById('cognibox-dateDebut').value = '';
        document.getElementById('cognibox-dateFin').value = '';
        document.getElementById('cognibox-commentaire').value = '';

        // Mettre le focus sur le premier champ
        document.getElementById('cognibox-externe').focus();
    }
}

/**
 * Annule l'ajout/modification d'une tâche
 * @returns {void}
 */
export function cancelTaskCognibox() {
    const form = document.getElementById('cognibox-taskForm');
    if (form) {
        form.style.display = 'none';
    }
}

/**
 * Sauvegarde une nouvelle tâche Cognibox
 * @returns {void}
 */
export async function saveTaskCognibox() {
    const externe = document.getElementById('cognibox-externe').value.trim();
    const numero = document.getElementById('cognibox-numero').value.trim();
    const dateDebut = document.getElementById('cognibox-dateDebut').value;
    const dateFin = document.getElementById('cognibox-dateFin').value;
    const commentaire = document.getElementById('cognibox-commentaire').value.trim();

    // Validation
    if (!externe) {
        alert('⚠️ Veuillez saisir le nom de l\'externe');
        document.getElementById('cognibox-externe').focus();
        return;
    }

    if (!numero) {
        alert('⚠️ Veuillez saisir le numéro de la tâche');
        document.getElementById('cognibox-numero').focus();
        return;
    }

    // Créer la nouvelle tâche
    const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externe: externe,
        numero: numero,
        dateDebut: dateDebut || '',
        dateFin: dateFin || '',
        commentaire: commentaire
    };

    // Ajouter la tâche à la liste
    cogniboxTasks.push(newTask);

    // Sauvegarder et rafraîchir
    await saveCogniboxTasks();
    renderCogniboxTasksTable();
    cancelTaskCognibox();

    console.log('[COGNIBOX-TASKS] Nouvelle tâche ajoutée:', newTask.numero);
}

/**
 * Supprime une tâche Cognibox
 * @param {string} taskId - ID de la tâche à supprimer
 * @returns {void}
 */
export async function deleteTaskCognibox(taskId) {
    const task = cogniboxTasks.find(t => t.id === taskId);
    if (!task) {
        console.warn('[COGNIBOX-TASKS] Tâche non trouvée:', taskId);
        return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer la tâche "${task.numero}" pour ${task.externe} ?`)) {
        return;
    }

    // Supprimer la tâche
    cogniboxTasks = cogniboxTasks.filter(t => t.id !== taskId);

    // Sauvegarder et rafraîchir
    await saveCogniboxTasks();
    renderCogniboxTasksTable();

    console.log('[COGNIBOX-TASKS] Tâche supprimée:', task.numero);
}

/**
 * Rend le tableau des tâches Cognibox
 * @returns {void}
 */
export function renderCogniboxTasksTable() {
    const tbody = document.getElementById('cognibox-tasksTableBody');

    if (!tbody) {
        console.warn('[COGNIBOX-TASKS] Element cognibox-tasksTableBody non trouvé');
        return;
    }

    if (!Array.isArray(cogniboxTasks) || cogniboxTasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 20px; text-align: center; color: #999; border: 1px solid #ddd;">
                    Aucune tâche Cognibox enregistrée
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    cogniboxTasks.forEach((task, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        // Formater les dates
        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('fr-CA');
            } catch (e) {
                return dateStr;
            }
        };

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                ${index + 1}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd;">
                ${task.externe || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: 600; color: #667eea;">
                ${task.numero || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                ${formatDate(task.dateDebut)}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                ${formatDate(task.dateFin)}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd;">
                ${task.commentaire || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <button onclick="window.cogniboxTasksActions.deleteTask('${task.id}')"
                        style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    🗑️ Supprimer
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[COGNIBOX-TASKS] Tableau rendu: ${cogniboxTasks.length} tâches affichées`);
}

/**
 * Récupère les données des tâches Cognibox
 * @returns {Array}
 */
export function getCogniboxTasks() {
    return cogniboxTasks;
}

// Exposer les fonctions globalement pour les événements onclick
if (typeof window !== 'undefined') {
    window.showAddTaskCognibox = showAddTaskCognibox;
    window.saveTaskCognibox = saveTaskCognibox;
    window.cancelTaskCognibox = cancelTaskCognibox;

    window.cogniboxTasksActions = {
        deleteTask: deleteTaskCognibox
    };
}

console.log('[COGNIBOX-TASKS] Module chargé');
