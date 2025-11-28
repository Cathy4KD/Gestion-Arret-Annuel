// ui.js - Fonctions de manipulation du DOM (render, etc.)

import { subscribe, getState } from './store.js';
import { createTask, updateTask, deleteTask, changeTaskStatus } from './actions.js';

/**
 * Initialise tous les écouteurs d'événements de l'UI.
 * À appeler une seule fois au démarrage de l'application.
 */
export function initUI() {
  // S'abonner aux changements de l'état des tâches
  subscribe(
    (state) => state.tasks || [],
    (tasks) => {
      renderTaskList(tasks);
    }
  );

  // S'abonner aux changements des utilisateurs connectés
  subscribe(
    (state) => state.users || [],
    (users) => {
      renderUserList(users);
    }
  );

  // Écouteur pour le formulaire d'ajout de tâche
  setupTaskForm();
}

/**
 * Configure le formulaire d'ajout de tâche.
 */
function setupTaskForm() {
  const form = document.getElementById('task-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const assigneeInput = document.getElementById('task-assignee');

    if (!titleInput.value.trim()) {
      alert('Le titre de la tâche est requis');
      return;
    }

    // Créer la tâche via actions.js
    createTask({
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      assignee: assigneeInput.value.trim(),
      status: 'pending'
    });

    // Réinitialiser le formulaire
    form.reset();
  });
}

/**
 * Affiche la liste des tâches dans le DOM.
 * @param {Array<object>} tasks - La liste des tâches à afficher.
 */
function renderTaskList(tasks) {
  const container = document.getElementById('task-list');
  if (!container) return;

  // Si aucune tâche, afficher un message
  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<p class="task-list__empty">Aucune tâche pour le moment.</p>';
    return;
  }

  // Générer le HTML pour chaque tâche
  container.innerHTML = tasks.map(task => `
    <div class="task-list__item task-list__item--${task.status}" data-task-id="${task.id}">
      <div class="task-list__header">
        <h3 class="task-list__title">${escapeHtml(task.title)}</h3>
        <span class="task-list__status task-list__status--${task.status}">${getStatusLabel(task.status)}</span>
      </div>
      ${task.description ? `<p class="task-list__description">${escapeHtml(task.description)}</p>` : ''}
      ${task.assignee ? `<p class="task-list__assignee">Assigné à: ${escapeHtml(task.assignee)}</p>` : ''}
      <div class="task-list__actions">
        <button class="btn btn--small" onclick="window.handleTaskStatusChange('${task.id}', 'pending')">En attente</button>
        <button class="btn btn--small" onclick="window.handleTaskStatusChange('${task.id}', 'in_progress')">En cours</button>
        <button class="btn btn--small" onclick="window.handleTaskStatusChange('${task.id}', 'completed')">Terminé</button>
        <button class="btn btn--small btn--danger" onclick="window.handleTaskDelete('${task.id}')">Supprimer</button>
      </div>
    </div>
  `).join('');
}

/**
 * Affiche la liste des utilisateurs connectés.
 * @param {Array<object>} users - La liste des utilisateurs connectés.
 */
function renderUserList(users) {
  const container = document.getElementById('user-list');
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = '<p>Aucun utilisateur connecté</p>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="user-list__item">
      <span class="user-list__name">${escapeHtml(user.name)}</span>
      <span class="user-list__status">●</span>
    </div>
  `).join('');
}

/**
 * Retourne le libellé français pour un statut de tâche.
 * @param {string} status - Le statut de la tâche.
 * @returns {string} Le libellé traduit.
 */
function getStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé'
  };
  return labels[status] || status;
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS.
 * @param {string} text - Le texte à échapper.
 * @returns {string} Le texte échappé.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fonctions globales pour les événements onclick (accessibles depuis le HTML)
window.handleTaskStatusChange = (taskId, newStatus) => {
  changeTaskStatus(taskId, newStatus);
};

window.handleTaskDelete = (taskId) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
    deleteTask(taskId);
  }
};
