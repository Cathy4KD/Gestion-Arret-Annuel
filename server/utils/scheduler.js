// utils/scheduler.js - Tâches planifiées avec node-cron
import cron from 'node-cron';
import { createDailyBackup } from '../services/dataService.js';
import logger, { logSystemEvent } from './logger.js';

/**
 * Initialise toutes les tâches planifiées
 */
export function initializeScheduler() {
    logger.info('Initialisation du scheduler de tâches planifiées');

    // Tâche quotidienne : Sauvegarde à 2h00 du matin
    const dailyBackupTask = cron.schedule('0 2 * * *', async () => {
        try {
            logSystemEvent('Début de la sauvegarde quotidienne automatique', 'info');
            console.log('🔄 Sauvegarde quotidienne automatique en cours...');

            await createDailyBackup();

            logSystemEvent('Sauvegarde quotidienne automatique réussie', 'info');
            console.log('✅ Sauvegarde quotidienne terminée avec succès');
        } catch (error) {
            logSystemEvent('Échec de la sauvegarde quotidienne automatique', 'error', {
                error: error.message
            });
            console.error('❌ Erreur lors de la sauvegarde quotidienne:', error);
        }
    }, {
        scheduled: true,
        timezone: 'America/Toronto' // Fuseau horaire du Québec
    });

    // Optionnel : Nettoyage des anciens logs tous les dimanches à 3h00
    const logCleanupTask = cron.schedule('0 3 * * 0', () => {
        try {
            logSystemEvent('Nettoyage hebdomadaire des logs', 'info');
            console.log('🧹 Nettoyage hebdomadaire des logs (géré par winston-daily-rotate-file)');
            // Winston gère automatiquement la rotation, pas besoin de code supplémentaire
        } catch (error) {
            logSystemEvent('Échec du nettoyage des logs', 'error', {
                error: error.message
            });
            console.error('❌ Erreur lors du nettoyage des logs:', error);
        }
    }, {
        scheduled: true,
        timezone: 'America/Toronto'
    });

    logger.info('Tâches planifiées configurées:', {
        dailyBackup: '2h00 tous les jours',
        logCleanup: '3h00 tous les dimanches'
    });

    console.log('⏰ Tâches planifiées configurées:');
    console.log('   - Sauvegarde quotidienne: 2h00 tous les jours');
    console.log('   - Nettoyage des logs: 3h00 tous les dimanches');

    return {
        dailyBackupTask,
        logCleanupTask
    };
}

/**
 * Arrête toutes les tâches planifiées
 * @param {Object} tasks - Objet contenant toutes les tâches
 */
export function stopAllTasks(tasks) {
    if (tasks && tasks.dailyBackupTask) {
        tasks.dailyBackupTask.stop();
    }
    if (tasks && tasks.logCleanupTask) {
        tasks.logCleanupTask.stop();
    }
    logSystemEvent('Toutes les tâches planifiées ont été arrêtées', 'info');
    console.log('⏸️  Toutes les tâches planifiées ont été arrêtées');
}

export default {
    initializeScheduler,
    stopAllTasks
};
