// socket/taskHandler.js - Gestion des événements Socket.io liés aux tâches

import * as taskService from '../services/taskService.js';

/**
 * Enregistre tous les gestionnaires d'événements liés aux tâches.
 * @param {object} io - L'instance Socket.io serveur.
 * @param {object} socket - Le socket d'un client spécifique.
 */
export function registerTaskHandlers(io, socket) {
  /**
   * Événement : Créer une nouvelle tâche
   */
  socket.on('task:create', async (taskData) => {
    try {
      console.log('📝 Création de tâche:', taskData);

      // Créer la tâche via le service
      const newTask = await taskService.createTask(taskData);

      // Récupérer l'état global mis à jour
      const newState = await taskService.getGlobalState();

      // Diffuser le nouvel état à TOUS les clients
      io.emit('state:update', newState);

      console.log('✅ Tâche créée avec succès:', newTask.id);
    } catch (error) {
      console.error('❌ Erreur lors de la création de la tâche:', error);

      // Envoyer une notification d'erreur au client
      socket.emit('notification:error', {
        message: error.message || 'Erreur lors de la création de la tâche'
      });
    }
  });

  /**
   * Événement : Mettre à jour une tâche
   */
  socket.on('task:update', async ({ taskId, updates }) => {
    try {
      console.log('🔄 Mise à jour de tâche:', taskId, updates);

      // Mettre à jour la tâche via le service
      const updatedTask = await taskService.updateTask(taskId, updates);

      // Récupérer l'état global mis à jour
      const newState = await taskService.getGlobalState();

      // Diffuser le nouvel état à TOUS les clients
      io.emit('state:update', newState);

      console.log('✅ Tâche mise à jour avec succès:', updatedTask.id);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la tâche:', error);

      socket.emit('notification:error', {
        message: error.message || 'Erreur lors de la mise à jour de la tâche'
      });
    }
  });

  /**
   * Événement : Supprimer une tâche
   */
  socket.on('task:delete', async ({ taskId }) => {
    try {
      console.log('🗑️ Suppression de tâche:', taskId);

      // Supprimer la tâche via le service
      const deleted = await taskService.deleteTask(taskId);

      if (!deleted) {
        throw new Error('Tâche non trouvée');
      }

      // Récupérer l'état global mis à jour
      const newState = await taskService.getGlobalState();

      // Diffuser le nouvel état à TOUS les clients
      io.emit('state:update', newState);

      console.log('✅ Tâche supprimée avec succès:', taskId);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la tâche:', error);

      socket.emit('notification:error', {
        message: error.message || 'Erreur lors de la suppression de la tâche'
      });
    }
  });
}
