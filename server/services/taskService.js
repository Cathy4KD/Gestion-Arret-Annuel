// services/taskService.js - Logique métier pour la gestion des tâches

import { randomUUID } from 'crypto';

/**
 * Base de données en mémoire pour les tâches
 * En production, ceci serait remplacé par une vraie base de données
 */
let tasks = [];

/**
 * Base de données en mémoire pour les utilisateurs connectés
 */
let users = [];

/**
 * Récupère toutes les tâches.
 * @returns {Promise<Array>} La liste de toutes les tâches.
 */
export async function getAllTasks() {
  return tasks;
}

/**
 * Récupère une tâche par son ID.
 * @param {string} taskId - L'identifiant de la tâche.
 * @returns {Promise<object|null>} La tâche trouvée ou null.
 */
export async function getTaskById(taskId) {
  return tasks.find(task => task.id === taskId) || null;
}

/**
 * Crée une nouvelle tâche.
 * @param {object} taskData - Les données de la tâche.
 * @param {string} taskData.title - Le titre de la tâche.
 * @param {string} [taskData.description] - La description (optionnel).
 * @param {string} [taskData.assignee] - La personne assignée (optionnel).
 * @param {string} [taskData.status] - Le statut (défaut: 'pending').
 * @returns {Promise<object>} La tâche créée.
 */
export async function createTask(taskData) {
  // Validation
  if (!taskData.title || taskData.title.trim() === '') {
    throw new Error('Le titre de la tâche est requis');
  }

  const newTask = {
    id: randomUUID(),
    title: taskData.title.trim(),
    description: taskData.description?.trim() || '',
    assignee: taskData.assignee?.trim() || '',
    status: taskData.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.push(newTask);
  return newTask;
}

/**
 * Met à jour une tâche existante.
 * @param {string} taskId - L'identifiant de la tâche.
 * @param {object} updates - Les données à mettre à jour.
 * @returns {Promise<object|null>} La tâche mise à jour ou null si non trouvée.
 */
export async function updateTask(taskId, updates) {
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  if (taskIndex === -1) {
    throw new Error('Tâche non trouvée');
  }

  // Mise à jour immutable
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
    id: taskId, // On ne peut pas changer l'ID
    updatedAt: new Date().toISOString()
  };

  return tasks[taskIndex];
}

/**
 * Supprime une tâche.
 * @param {string} taskId - L'identifiant de la tâche à supprimer.
 * @returns {Promise<boolean>} true si supprimée, false si non trouvée.
 */
export async function deleteTask(taskId) {
  const initialLength = tasks.length;
  tasks = tasks.filter(task => task.id !== taskId);

  return tasks.length < initialLength;
}

/**
 * Récupère l'état complet (tâches + utilisateurs).
 * @returns {Promise<object>} L'état global.
 */
export async function getGlobalState() {
  return {
    tasks: tasks,
    users: users
  };
}

/**
 * Ajoute un utilisateur à la liste des connectés.
 * @param {string} socketId - L'ID du socket.
 * @param {string} userName - Le nom de l'utilisateur.
 * @returns {Promise<object>} L'utilisateur ajouté.
 */
export async function addUser(socketId, userName) {
  const user = {
    id: socketId,
    name: userName,
    connectedAt: new Date().toISOString()
  };

  users.push(user);
  return user;
}

/**
 * Retire un utilisateur de la liste des connectés.
 * @param {string} socketId - L'ID du socket.
 * @returns {Promise<boolean>} true si retiré, false si non trouvé.
 */
export async function removeUser(socketId) {
  const initialLength = users.length;
  users = users.filter(user => user.id !== socketId);

  return users.length < initialLength;
}

/**
 * Récupère tous les utilisateurs connectés.
 * @returns {Promise<Array>} La liste des utilisateurs.
 */
export async function getAllUsers() {
  return users;
}
