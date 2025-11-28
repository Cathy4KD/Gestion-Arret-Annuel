/**
 * @fileoverview Module de gestion des sauvegardes et archives
 * @module backup/backup-manager
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Données des archives
 * @type {Array}
 */
let archivesData = [];

/**
 * Charger les archives depuis le serveur (JAMAIS localStorage)
 */
export function loadArchives() {
    const saved = loadFromStorage('archivesData', []);
    if (saved) {
        archivesData = saved;
        console.log('[BACKUP] Archives chargées:', archivesData.length);
    }
}

/**
 * Sauvegarder les archives sur le serveur (JAMAIS localStorage)
 */
function saveArchives() {
    saveToStorage('archivesData', archivesData);
}

/**
 * Créer une archive complète
 */
export function createArchive() {
    const archiveName = prompt('Nom de l\'archive:', `Arrêt Annuel ${new Date().toLocaleDateString('fr-CA')}`);
    if (!archiveName) return;

    const confirmMsg = 'Créer une archive complète de toutes les données actuelles?\n\nCeci inclura:\n- Données d\'arrêt (phases, tâches, commentaires, responsables)\n- IW37N et IW38\n- Tous les tableaux PSV, TPAA, PW\n- Projets et Maintenances Capitalisables\n- Plans SCOPE avec marqueurs\n- Plans PSV avec marqueurs\n- Révision des travaux\n- Stratégie et entrepreneurs';

    if (!confirm(confirmMsg)) return;

    try {
        // Collecter toutes les données
        const archive = {
            id: `archive-${Date.now()}`,
            nom: archiveName,
            dateCreation: new Date().toISOString(),
            dateCreationFormatted: new Date().toLocaleString('fr-CA'),
            donnees: {
                arretData: loadFromStorage('arretData', null),
                iw37nData: loadFromStorage('iw37nData', []),
                iw38Data: loadFromStorage('iw38Data', []),
                psvData: loadFromStorage('psvData', []),
                psvPlans: loadFromStorage('psvPlans', null),
                tpaaListeData: loadFromStorage('tpaaListeData', []),
                pwData: loadFromStorage('pwData', []),
                projetsData: loadFromStorage('projetsData', []),
                maintenancesCapitalisablesData: loadFromStorage('maintenancesCapitalisablesData', []),
                revisionListeData: loadFromStorage('revisionListeData', []),
                scopeMarkers: loadFromStorage('scopeMarkers', {}),
                strategieData: loadFromStorage('strategieData', []),
                entrepreneurData: loadFromStorage('entrepreneurData', []),
                plansData: loadFromStorage('plansData', []),
                rencontreData: loadFromStorage('rencontreData', null)
            }
        };

        // Ajouter aux archives
        archivesData.push(archive);
        saveArchives();

        console.log('[BACKUP] Archive créée:', archive);
        alert(`✅ Archive "${archiveName}" créée avec succès!\n\nDate: ${archive.dateCreationFormatted}`);
    } catch (error) {
        console.error('[BACKUP] Erreur lors de la création de l\'archive:', error);
        alert('❌ Erreur lors de la création de l\'archive. Vérifiez la console pour plus de détails.');
    }
}

/**
 * Télécharger une sauvegarde complète en fichier JSON
 */
export function downloadBackup() {
    try {
        const backup = {
            version: '2.0',
            dateCreation: new Date().toISOString(),
            dateCreationFormatted: new Date().toLocaleString('fr-CA'),
            donnees: {
                arretData: loadFromStorage('arretData', null),
                iw37nData: loadFromStorage('iw37nData', []),
                iw38Data: loadFromStorage('iw38Data', []),
                psvData: loadFromStorage('psvData', []),
                psvPlans: loadFromStorage('psvPlans', null),
                tpaaListeData: loadFromStorage('tpaaListeData', []),
                pwData: loadFromStorage('pwData', []),
                projetsData: loadFromStorage('projetsData', []),
                maintenancesCapitalisablesData: loadFromStorage('maintenancesCapitalisablesData', []),
                revisionListeData: loadFromStorage('revisionListeData', []),
                scopeMarkers: loadFromStorage('scopeMarkers', {}),
                strategieData: loadFromStorage('strategieData', []),
                entrepreneurData: loadFromStorage('entrepreneurData', []),
                plansData: loadFromStorage('plansData', []),
                rencontreData: loadFromStorage('rencontreData', null),
                archivesData: archivesData
            }
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Arret_Annuel_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('[BACKUP] Sauvegarde téléchargée');
        alert('✅ Sauvegarde téléchargée avec succès!');
    } catch (error) {
        console.error('[BACKUP] Erreur lors du téléchargement:', error);
        alert('❌ Erreur lors du téléchargement de la sauvegarde.');
    }
}

/**
 * Restaurer depuis un fichier JSON
 * @param {Event} event - File input change event
 */
export function restoreFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);

            if (!backup.donnees) {
                alert('❌ Format de fichier invalide.');
                return;
            }

            if (!confirm('⚠️ ATTENTION: Cette action va remplacer toutes vos données actuelles par celles du fichier de sauvegarde.\n\nVoulez-vous continuer?')) {
                return;
            }

            // ❌ DÉSACTIVÉ - localStorage n'est plus utilisé
            console.error('[BACKUP] ❌ ERREUR: Restauration localStorage désactivée');
            alert('❌ ERREUR: La restauration de backups localStorage est désactivée.\n\nToutes les données sont maintenant sur le serveur.\n\nUtilisez les backups serveur dans server/data/backups/');
        } catch (error) {
            console.error('[BACKUP] Erreur lors de la restauration:', error);
            alert('❌ Erreur lors de la restauration des données. Vérifiez le format du fichier.');
        }
    };
    reader.readAsText(file);
}

/**
 * DÉSACTIVÉ - Les backups localStorage ne sont plus utilisés
 */
export function showBackupsList() {
    console.error('[BACKUP] ❌ Backups localStorage désactivés');
    alert('ℹ️ Les backups localStorage sont désactivés.\n\nToutes les sauvegardes sont maintenant sur le serveur:\n- server/data/backups/ (horodatés)\n- server/data/backups-daily/ (quotidiens)\n\nContactez l\'administrateur système pour restaurer un backup.');
}

/**
 * Créer un backup automatique
 * ⚠️ DÉSACTIVÉ: Les backups localStorage ont été désactivés pour économiser l'espace
 * Le serveur sauvegarde déjà toutes les données dans server/data/application-data.json
 */
function createAutoBackup() {
    // ✅ Backups désactivés - Le serveur est la source de vérité
    console.log('[BACKUP] ℹ️ Backups localStorage désactivés (données sauvegardées sur le serveur)');
    return;

    /* CODE DÉSACTIVÉ
    try {
        const dateKey = new Date().toISOString().split('T')[0];
        const backupKey = `arretData_backup_${dateKey}`;

        // Ne créer qu'un backup par jour
        if (localStorage.getItem(backupKey)) {
            console.log('[BACKUP] Backup automatique déjà existant pour aujourd\'hui');
            return;
        }

        const arretData = loadFromStorage('arretData', null);
        if (arretData) {
            localStorage.setItem(backupKey, JSON.stringify(arretData));
            console.log(`[BACKUP] Backup automatique créé: ${dateKey}`);
        }
    } catch (error) {
        console.error('[BACKUP] Erreur lors du backup automatique:', error);
    }
    */
}

/**
 * Nettoyer les anciens backups localStorage pour libérer de l'espace
 * DÉSACTIVÉ - localStorage n'est plus utilisé
 */
export function cleanOldBackups() {
    console.log('[BACKUP] localStorage désactivé - les backups sont gérés uniquement sur le serveur');
    /* CODE DÉSACTIVÉ
    try {
        let cleanedCount = 0;
        const keysToRemove = [];

        // Parcourir tous les éléments du localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Identifier les clés de backup automatique
            if (key && key.startsWith('arretData_backup_')) {
                keysToRemove.push(key);
            }
        }

        // Supprimer tous les backups
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            cleanedCount++;
        });

        if (cleanedCount > 0) {
            console.log(`[BACKUP] 🧹 ${cleanedCount} ancien(s) backup(s) localStorage supprimé(s)`);
            console.log(`[BACKUP] ✅ Espace libéré! Les données sont sauvegardées sur le serveur.`);
        } else {
            console.log('[BACKUP] ℹ️ Aucun ancien backup à nettoyer');
        }

        return cleanedCount;
    } catch (error) {
        console.error('[BACKUP] ❌ Erreur lors du nettoyage des backups:', error);
        return 0;
    }
    */
    return 0;
}

/**
 * Démarrer le système de backup automatique
 */
export function startAutoBackup() {
    // Nettoyer les anciens backups localStorage au démarrage
    cleanOldBackups();

    // ⚠️ Les backups automatiques sont désactivés
    // Le serveur sauvegarde déjà toutes les données
    console.log('[BACKUP] ℹ️ Backups automatiques désactivés - Les données sont sur le serveur');

    /* CODE DÉSACTIVÉ
    // Créer un backup immédiatement
    createAutoBackup();

    // Puis créer un backup toutes les heures
    setInterval(() => {
        createAutoBackup();
    }, 60 * 60 * 1000); // 1 heure

    console.log('[BACKUP] Système de backup automatique démarré');
    */
}

/**
 * Vérifier et afficher un rappel de sauvegarde si nécessaire
 * DÉSACTIVÉ - localStorage n'est plus utilisé
 */
export function checkBackupReminder() {
    // Ne fait rien - localStorage désactivé
    /* CODE DÉSACTIVÉ
    const lastReminder = localStorage.getItem('lastBackupReminder');
    const now = new Date().getTime();

    // Rappel tous les 7 jours
    if (!lastReminder || (now - parseInt(lastReminder)) > 7 * 24 * 60 * 60 * 1000) {
        localStorage.setItem('lastBackupReminder', now.toString());
        setTimeout(() => {
            if (confirm('💾 Rappel: Il est recommandé de télécharger une sauvegarde complète régulièrement.\n\nVoulez-vous télécharger une sauvegarde maintenant?')) {
                downloadBackup();
            }
        }, 5000);
    }
    */
}
