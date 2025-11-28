// socket/dataHandler.js - Gestionnaire des événements Socket.io pour les données

import * as dataService from '../services/dataService.js';
import { genererAvisSyndical } from '../services/avisService.js';
import { envoyerAvisSyndical } from '../services/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getModuleSchema,
    updateModuleSchema,
    updateMultipleSchema,
    resetDataSchema,
    avisSyndicalSchema,
    emailSchema,
    validateSocketData,
    sanitizeObject
} from '../middleware/validation.js';
import { logSocketEvent, logDataOperation, logValidationError } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enregistre les gestionnaires d'événements pour la synchronisation des données
 * @param {object} io - Instance Socket.io serveur
 * @param {object} socket - Socket client
 */
export function registerDataHandlers(io, socket) {
    /**
     * Événement : Client demande toutes les données
     */
    socket.on('data:getAll', async (callback) => {
        try {
            console.log('📥 Client demande toutes les données...');
            const data = await dataService.getAllData();

            // Log du nombre de lignes pour chaque module
            const iw37nCount = Array.isArray(data.iw37nData) ? data.iw37nData.length : 0;
            const iw38Count = Array.isArray(data.iw38Data) ? data.iw38Data.length : 0;
            const revisionCount = Array.isArray(data.revisionTravauxData) ? data.revisionTravauxData.length : 0;
            const hasSettings = data.settingsData ? 'OUI' : 'NON';

            console.log(`📤 Envoi des données au client:`);
            console.log(`   - IW37N: ${iw37nCount} lignes`);
            console.log(`   - IW38: ${iw38Count} lignes`);
            console.log(`   - Révision Travaux: ${revisionCount} travaux`);
            console.log(`   - Settings: ${hasSettings}`);
            if (data.settingsData) {
                console.log(`   - Settings data:`, JSON.stringify(data.settingsData));
            }

            callback({ success: true, data });
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des données:', error);
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Événement : Client demande les données d'un module spécifique
     */
    socket.on('data:getModule', async ({ moduleName }, callback) => {
        try {
            // Validation des données reçues
            const validated = validateSocketData(getModuleSchema)({ moduleName });

            const data = await dataService.getModuleData(validated.moduleName);
            callback({ success: true, data });
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération de ${moduleName}:`, error);
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Événement : Client met à jour un module de données
     */
    socket.on('data:updateModule', async ({ moduleName, data, userName }, callback) => {
        try {
            // Validation et nettoyage des données
            const validated = validateSocketData(updateModuleSchema)({ moduleName, data, userName });
            const sanitizedData = sanitizeObject(validated.data);

            console.log(`📝 Mise à jour de ${validated.moduleName} par ${validated.userName}`);

            const updatedData = await dataService.updateModuleData(
                validated.moduleName,
                sanitizedData,
                validated.userName
            );

            // Logger l'opération réussie
            logDataOperation('updateModule', validated.moduleName, validated.userName, true);

            // Diffuser la mise à jour à tous les clients SAUF l'émetteur
            socket.broadcast.emit('data:moduleUpdated', {
                moduleName: validated.moduleName,
                data: sanitizedData,
                updatedBy: validated.userName,
                timestamp: new Date().toISOString()
            });

            if (callback) {
                callback({ success: true, data: updatedData });
            }
        } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour de ${moduleName}:`, error);

            // Logger l'erreur
            if (error.message.includes('Validation échouée')) {
                logValidationError('data:updateModule', error.message, { moduleName, userName });
            } else {
                logDataOperation('updateModule', moduleName, userName, false, error);
            }

            if (callback) {
                callback({ success: false, error: error.message });
            }
        }
    });

    /**
     * Événement : Client met à jour plusieurs modules
     */
    socket.on('data:updateMultiple', async ({ updates, userName }, callback) => {
        try {
            // Validation et nettoyage des données
            const validated = validateSocketData(updateMultipleSchema)({ updates, userName });
            const sanitizedUpdates = validated.updates.map(update => ({
                moduleName: update.moduleName,
                data: sanitizeObject(update.data)
            }));

            console.log(`📝 Mise à jour multiple par ${validated.userName}`);

            const updatedData = await dataService.updateMultipleModules(sanitizedUpdates, validated.userName);

            // Diffuser la mise à jour à tous les clients SAUF l'émetteur
            socket.broadcast.emit('data:multipleUpdated', {
                updates: sanitizedUpdates,
                updatedBy: validated.userName,
                timestamp: new Date().toISOString()
            });

            if (callback) {
                callback({ success: true, data: updatedData });
            }
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour multiple:', error);
            if (callback) {
                callback({ success: false, error: error.message });
            }
        }
    });

    /**
     * Événement : Client réinitialise toutes les données
     */
    socket.on('data:reset', async ({ userName }, callback) => {
        try {
            // Validation des données
            const validated = validateSocketData(resetDataSchema)({ userName });

            console.log(`🔄 Réinitialisation des données par ${validated.userName}`);

            const resetData = await dataService.resetAllData();

            // Diffuser la réinitialisation à tous les clients
            io.emit('data:resetComplete', {
                resetBy: validated.userName,
                timestamp: new Date().toISOString()
            });

            if (callback) {
                callback({ success: true, data: resetData });
            }
        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation:', error);
            if (callback) {
                callback({ success: false, error: error.message });
            }
        }
    });

    /**
     * Événement : Client demande les données (alias pour compatibilité)
     */
    socket.on('get-data', async () => {
        try {
            console.log('📥 get-data appelé - envoi des données...');
            const data = await dataService.getAllData();
            socket.emit('data-update', data);
        } catch (error) {
            console.error('❌ Erreur lors de get-data:', error);
            socket.emit('error', { message: error.message });
        }
    });

    /**
     * Événement : Client met à jour des données (alias pour compatibilité)
     */
    socket.on('update-data', async ({ module, data }) => {
        try {
            console.log(`📝 update-data appelé pour module: ${module}`);
            await dataService.updateModuleData(module, data);

            // Confirmer la sauvegarde
            socket.emit('data-saved');

            // Diffuser la mise à jour aux autres clients
            socket.broadcast.emit('data-update', await dataService.getAllData());

            console.log(`✅ Données sauvegardées pour ${module}`);
        } catch (error) {
            console.error(`❌ Erreur lors de update-data pour ${module}:`, error);
            socket.emit('error', { message: error.message });
        }
    });

    /**
     * Événement : Générer un avis syndical
     */
    socket.on('generer-avis-syndical', async (avisData, avisSyndicauxData) => {
        try {
            // Validation et nettoyage des données
            const validated = validateSocketData(avisSyndicalSchema)(avisData);
            const sanitizedAvis = sanitizeObject(validated);

            console.log('📢 Génération d\'un avis syndical...');
            console.log('Données validées:', sanitizedAvis);

            // Sauvegarder l'historique si fourni
            if (avisSyndicauxData) {
                const sanitizedHistorique = sanitizeObject(avisSyndicauxData);
                console.log('💾 Sauvegarde de l\'historique:', sanitizedHistorique.historique?.length || 0, 'avis');
                await dataService.updateModuleData('avisSyndicauxData', sanitizedHistorique, 'User');
            }

            // Générer le document Word avec docxtemplater
            const result = await genererAvisSyndical(sanitizedAvis);

            socket.emit('avis-syndical-genere', result);

            console.log(`✅ Avis syndical "${sanitizedAvis.nomEntrepreneur}" généré avec succès`);
        } catch (error) {
            console.error('❌ Erreur lors de la génération de l\'avis syndical:', error);
            socket.emit('avis-syndical-genere', {
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Événement : Envoyer un avis syndical par email
     */
    socket.on('envoyer-avis-email', async ({ avisData, emailDestinataire }) => {
        try {
            // Validation et nettoyage des données
            const validated = validateSocketData(emailSchema)({ avisData, emailDestinataire });
            const sanitizedAvis = sanitizeObject(validated.avisData);

            console.log('📧 Envoi d\'un avis syndical par email...');
            console.log('Destinataire:', validated.emailDestinataire);
            console.log('Avis:', sanitizedAvis.nomEntrepreneur);

            // Construire le chemin complet vers le fichier
            const filePath = path.join(__dirname, '..', '..', 'generated-docs', sanitizedAvis.fileName);

            // Envoyer l'email
            const result = await envoyerAvisSyndical({
                to: validated.emailDestinataire,
                filePath: filePath,
                fileName: sanitizedAvis.fileName,
                avisData: sanitizedAvis
            });

            socket.emit('avis-email-envoye', result);

            if (result.success) {
                console.log(`✅ Email envoyé avec succès à ${validated.emailDestinataire}`);
            } else {
                console.error('❌ Erreur lors de l\'envoi de l\'email:', result.error);
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
            socket.emit('avis-email-envoye', {
                success: false,
                error: error.message
            });
        }
    });
}
