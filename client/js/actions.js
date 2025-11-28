// actions.js - Fonctions qui émettent des événements au serveur

import { socket } from './socket.js';

/**
 * Crée une nouvelle tâche et l'émet au serveur.
 * @param {object} taskData - Les données de la tâche.
 * @param {string} taskData.title - Le titre de la tâche.
 * @param {string} [taskData.description] - La description de la tâche (optionnel).
 * @param {string} [taskData.assignee] - La personne assignée (optionnel).
 * @param {string} [taskData.status] - Le statut de la tâche (optionnel, défaut: 'pending').
 */
export function createTask(taskData) {
  socket.emit('task:create', taskData);
}

/**
 * Met à jour une tâche existante.
 * @param {string} taskId - L'identifiant de la tâche.
 * @param {object} updates - Les données à mettre à jour.
 */
export function updateTask(taskId, updates) {
  socket.emit('task:update', { taskId, updates });
}

/**
 * Supprime une tâche.
 * @param {string} taskId - L'identifiant de la tâche à supprimer.
 */
export function deleteTask(taskId) {
  socket.emit('task:delete', { taskId });
}

/**
 * Change le statut d'une tâche (pending, in_progress, completed).
 * @param {string} taskId - L'identifiant de la tâche.
 * @param {string} newStatus - Le nouveau statut.
 */
export function changeTaskStatus(taskId, newStatus) {
  socket.emit('task:update', {
    taskId,
    updates: { status: newStatus }
  });
}

/**
 * Rejoindre la session en tant qu'utilisateur.
 * @param {string} userName - Le nom de l'utilisateur.
 */
export function joinSession(userName) {
  socket.emit('user:join', { userName });
}
