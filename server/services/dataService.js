// services/dataService.js - Service de gestion des données de l'application
import { writeFile, readFile, mkdir, readdir, unlink, copyFile, rename } from 'fs/promises';
import { existsSync, watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chemin vers le dossier de données
const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'application-data.json');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const DAILY_BACKUP_DIR = join(DATA_DIR, 'backups-daily');
const MAX_BACKUPS = 25; // Nombre maximum de sauvegardes automatiques à conserver (toutes les 5 min)
const MAX_DAILY_BACKUPS = 30; // Nombre de sauvegardes quotidiennes à conserver (30 jours)

/**
 * Nettoie les caractères de contrôle invalides dans les chaînes de caractères
 * pour éviter les erreurs "Bad control character in string literal" lors du JSON.parse
 * @param {*} obj - Objet à nettoyer (peut être un objet, tableau, string, etc.)
 * @returns {*} Objet nettoyé
 */
function cleanControlCharacters(obj) {
    if (typeof obj === 'string') {
        // Remplacer les caractères de contrôle invalides (sauf \n, \r, \t qui sont valides)
        // Garde: newline (\n = 0x0A), carriage return (\r = 0x0D), tab (\t = 0x09)
        return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    } else if (Array.isArray(obj)) {
        return obj.map(item => cleanControlCharacters(item));
    } else if (obj !== null && typeof obj === 'object') {
        const cleaned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cleaned[key] = cleanControlCharacters(obj[key]);
            }
        }
        return cleaned;
    }
    return obj;
}

/**
 * Structure des données de l'application
 *
 * MODULES PAR CATÉGORIE:
 *
 * 📊 Données de base:
 * - arretData, scopeMarkers, iw37nData, iw38Data, tpaaData, pwData
 *
 * 🔧 PSV et maintenance:
 * - psvData, psvPlans, maintenancesCapitalisablesData, plansEntretienData
 *
 * 👥 Équipes et contacts:
 * - teamData, contactsData, entrepreneurData, entrepreneurAllData, entrepreneurPostesTrav
 *
 * 📝 Projets et travaux:
 * - projetsData, revisionTravauxData, strategieData, rencontreData, rencontresHebdoData, reunionsData
 *
 * 📋 Demandes et formulaires:
 * - demandesEchafaudages, demandesGruesNacelles, demandesVerrouillage
 * - ingqData, espaceClosData, t51Data (soumissions)
 *
 * 📦 Approvisionnement et pièces:
 * - approvisionnementData, consommablesData, piecesData
 * - t30LongDelaiPieces, t30CommandeData, t60LongDelaiPieces, t60CommandeData
 *
 * 🏗️ Équipements et plans:
 * - equipementLevageData, equipementLevageFiles, planLevageData
 * - nacellesData, travailHauteurData, equipLocationData, equipLocationPlanData
 * - t57EquipementsData, zonesPlanData, zonesEntreposageData
 * - besoinElectriquesData, purgesGazCompteRenduData, consommablesCommandeData
 *
 * 📄 Avis et communication:
 * - avisData, avisSyndicauxData, pointPresseData
 *
 * 🔍 Analyses et suivi:
 * - smedData, amdecData, suiviCoutData, t33PriorisationData, t40EntrepreneursData
 * - t55Data, t55EntrepreneursList, t55PdfTemplate, t55DocxTemplate, t55HistoriqueData
 *
 * 🛠️ Configuration et filtres:
 * - settingsData, scopeFilters, posteAllocations, dataPageFilters, dashboardCurrentFilter
 * - datesLimitesData, planSuivisJournaliersData, plansModificationsData
 *
 * 🏭 Sections spécifiques:
 * - hydrauliqueSectionData, nettoyageSectionData, ndtSectionData
 * - amenagementData, toursRefroidissementData, protocoleArretData
 *
 * 📚 Données manuelles et cache:
 * - tpaaPwManualData, tpaaPwCachedData, soumissionsManualData, t21ManualData
 *
 * 🗄️ Ressources et archives:
 * - ressourcesPlanificationData, externalsData, archivesData, t25Data
 *
 * 📝 Post-Mortem:
 * - notesProchainArret
 *
 * 🔄 Système de synchronisation:
 * - syncStatus
 *
 * 📅 Métadonnées:
 * - lastUpdated, lastUpdatedBy
 */
let applicationData = {
    // Données de base
    arretData: null,
    scopeMarkers: null,
    iw37nData: null,
    iw38Data: null,
    tpaaData: null,
    pwData: null,

    // PSV et maintenance
    psvData: null,
    psvPlans: null,
    maintenancesCapitalisablesData: null,
    plansEntretienData: null,

    // Équipes et contacts
    teamData: null,
    contactsData: null,
    entrepreneurData: null,
    entrepreneurAllData: null,
    entrepreneurPostesTrav: null,

    // Projets et travaux
    projetsData: null,
    revisionTravauxData: null,
    strategieData: null,
    rencontreData: null,
    rencontresHebdoData: null,
    reunionsData: null,

    // Demandes et formulaires
    demandesEchafaudages: null,
    demandesGruesNacelles: null,
    demandesVerrouillage: null,
    ingqData: null,
    espaceClosData: null,
    t51Data: null,  // Soumissions (renommé de t51SoumissionsData)

    // Approvisionnement et pièces
    approvisionnementData: null,
    consommablesData: null,
    piecesData: null,
    t30LongDelaiPieces: null,
    t30CommandeData: null,
    t60LongDelaiPieces: null,
    t60CommandeData: null,

    // Équipements et plans
    equipementLevageData: null,
    equipementLevageFiles: null,
    planLevageData: null,
    nacellesData: null,
    travailHauteurData: null,
    equipLocationData: null,
    equipLocationPlanData: null,
    t57EquipementsData: null,
    zonesPlanData: null,
    zonesEntreposageData: null,
    besoinElectriquesData: null,  // Besoins électriques arrêt (prises de soudure)
    purgesGazCompteRenduData: null,  // Compte-rendu validation purges gaz CO
    consommablesCommandeData: null,  // Commande des consommables d'arrêt

    // Avis et communication
    avisData: null,
    avisSyndicauxData: null,
    pointPresseData: null,

    // Analyses et suivi
    smedData: null,
    amdecData: null,
    suiviCoutData: null,
    t33PriorisationData: null,
    t40EntrepreneursData: null,
    t55Data: null,
    t55EntrepreneursList: null,  // Liste des entrepreneurs depuis IW37N
    t55PdfTemplate: null,
    t55DocxTemplate: null,  // Template DOCX pour génération devis
    t55HistoriqueData: null,

    // Configuration et filtres
    settingsData: null,
    scopeFilters: null,
    scopeStatuts: null,  // Statuts des opérations dans les pages SCOPE
    posteAllocations: null,
    dataPageFilters: null,
    dashboardCurrentFilter: null,
    datesLimitesData: null,
    planSuivisJournaliersData: null,
    plansModificationsData: null,
    ganttPontRoulantData: null,  // Données du Gantt Pont Roulant (T14)

    // Sections spécifiques
    hydrauliqueSectionData: null,
    nettoyageSectionData: null,
    ndtSectionData: null,
    amenagementData: null,
    toursRefroidissementData: null,
    protocoleArretData: null,

    // Données manuelles et cache
    tpaaPwManualData: null,
    tpaaPwCachedData: null,
    soumissionsManualData: null,
    t21ManualData: null,

    // Ressources et archives
    ressourcesPlanificationData: null,
    externalsData: null,
    archivesData: null,
    t25Data: null,

    // Post-Mortem
    notesProchainArret: null,  // Notes et commentaires pour le prochain arrêt annuel

    // Système de synchronisation
    syncStatus: null,  // Tracking des versions et statuts de synchronisation

    // Métadonnées
    lastUpdated: null,
    lastUpdatedBy: null
};

/**
 * Crée une sauvegarde horodatée du fichier de données
 * OPTIMISÉ: Ne crée une sauvegarde que si la dernière a plus de 5 minutes
 */
let lastBackupTime = 0;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let isBackingUp = false;

async function createBackup() {
    try {
        // OPTIMISATION: Éviter de créer trop de backups
        const now = Date.now();
        if (now - lastBackupTime < BACKUP_INTERVAL_MS) {
            return; // Ignorer si backup récent
        }
        
        // Éviter les backups simultanés
        if (isBackingUp) {
            console.log('[BACKUP] Backup déjà en cours, ignoré');
            return;
        }
        
        isBackingUp = true;
        
        // Créer le dossier de backups s'il n'existe pas
        if (!existsSync(BACKUP_DIR)) {
            await mkdir(BACKUP_DIR, { recursive: true });
        }

        // Vérifier si le fichier principal existe
        if (!existsSync(DATA_FILE)) {
            isBackingUp = false;
            return; // Pas de fichier à sauvegarder
        }

        // Créer le nom du fichier de backup avec timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const backupFile = join(BACKUP_DIR, `application-data-${timestamp}.json`);

        // Copier le fichier (en utilisant readFile/writeFile pour éviter les locks)
        const data = await readFile(DATA_FILE, 'utf-8');
        await writeFile(backupFile, data, 'utf-8');

        // Nettoyer les anciennes sauvegardes (garder seulement les MAX_BACKUPS plus récentes)
        await cleanOldBackups();
        
        lastBackupTime = now;
        console.log(`💾 Sauvegarde créée: ${timestamp}`);
    } catch (error) {
        console.error('❌ Erreur lors de la création de la sauvegarde:', error);
    } finally {
        isBackingUp = false;
    }
}

/**
 * Nettoie les anciennes sauvegardes pour ne garder que les MAX_BACKUPS plus récentes
 */
async function cleanOldBackups() {
    try {
        if (!existsSync(BACKUP_DIR)) {
            return;
        }

        const files = await readdir(BACKUP_DIR);
        const backupFiles = files
            .filter(f => f.startsWith('application-data-') && f.endsWith('.json'))
            .map(f => ({
                name: f,
                path: join(BACKUP_DIR, f)
            }))
            .sort((a, b) => b.name.localeCompare(a.name)); // Tri décroissant (plus récent en premier)

        // Supprimer les fichiers au-delà de MAX_BACKUPS
        if (backupFiles.length > MAX_BACKUPS) {
            const filesToDelete = backupFiles.slice(MAX_BACKUPS);
            for (const file of filesToDelete) {
                await unlink(file.path);
                console.log(`🗑️ Ancienne sauvegarde supprimée: ${file.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage des sauvegardes:', error);
    }
}

/**
 * Crée une sauvegarde quotidienne (une seule par jour)
 */
export async function createDailyBackup() {
    try {
        // Créer le dossier de backups quotidiens s'il n'existe pas
        if (!existsSync(DAILY_BACKUP_DIR)) {
            await mkdir(DAILY_BACKUP_DIR, { recursive: true });
        }

        // Vérifier si le fichier principal existe
        if (!existsSync(DATA_FILE)) {
            return;
        }

        // Nom de fichier avec seulement la date (pas l'heure)
        const today = new Date().toISOString().split('T')[0]; // Format: 2025-10-29
        const dailyBackupFile = join(DAILY_BACKUP_DIR, `application-data-${today}.json`);

        // Ne créer la sauvegarde que si elle n'existe pas déjà aujourd'hui
        if (!existsSync(dailyBackupFile)) {
            await copyFile(DATA_FILE, dailyBackupFile);
            console.log(`📅 Sauvegarde quotidienne créée: ${today}`);
            
            // Nettoyer les anciennes sauvegardes quotidiennes
            await cleanOldDailyBackups();
        }
    } catch (error) {
        console.error('❌ Erreur lors de la création de la sauvegarde quotidienne:', error);
    }
}

/**
 * Nettoie les anciennes sauvegardes quotidiennes
 */
async function cleanOldDailyBackups() {
    try {
        if (!existsSync(DAILY_BACKUP_DIR)) {
            return;
        }

        const files = await readdir(DAILY_BACKUP_DIR);
        const backupFiles = files
            .filter(f => f.startsWith('application-data-') && f.endsWith('.json'))
            .map(f => ({
                name: f,
                path: join(DAILY_BACKUP_DIR, f)
            }))
            .sort((a, b) => b.name.localeCompare(a.name));

        // Supprimer les fichiers au-delà de MAX_DAILY_BACKUPS
        if (backupFiles.length > MAX_DAILY_BACKUPS) {
            const filesToDelete = backupFiles.slice(MAX_DAILY_BACKUPS);
            for (const file of filesToDelete) {
                await unlink(file.path);
                console.log(`🗑️ Ancienne sauvegarde quotidienne supprimée: ${file.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage des sauvegardes quotidiennes:', error);
    }
}

/**
 * Recharge les données depuis le fichier (sans notifier Socket.io)
 */
let isReloading = false;
async function reloadDataFromFile() {
    if (isReloading || isSaving) {
        return; // Éviter les rechargements simultanés ou pendant une sauvegarde
    }

    isReloading = true;
    try {
        if (existsSync(DATA_FILE)) {
            const fileData = await readFile(DATA_FILE, 'utf-8');
            const loadedData = JSON.parse(fileData);

            // Fusionner avec la structure par défaut
            applicationData = {
                ...applicationData,
                ...loadedData,
                lastUpdated: loadedData.lastUpdated,
                lastUpdatedBy: loadedData.lastUpdatedBy
            };

            console.log('🔄 Données rechargées automatiquement depuis le fichier');

            // Notifier tous les clients connectés via Socket.io
            if (global.io) {
                global.io.emit('data-reloaded', {
                    message: 'Les données ont été mises à jour, veuillez rafraîchir la page',
                    timestamp: new Date().toISOString()
                });
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors du rechargement des données:', error);
    } finally {
        isReloading = false;
    }
}

/**
 * Surveille le fichier de données et recharge automatiquement les changements
 */
let fileWatcher = null;
let watcherTimeout = null;
function setupFileWatcher() {
    if (!existsSync(DATA_FILE)) {
        return;
    }

    try {
        // Arrêter l'ancien watcher s'il existe
        if (fileWatcher) {
            fileWatcher.close();
        }

        fileWatcher = watch(DATA_FILE, (eventType, filename) => {
            // Ignorer les événements pendant qu'on sauvegarde
            if (isSaving) {
                return;
            }

            // Débounce: attendre 500ms sans changement avant de recharger
            if (watcherTimeout) {
                clearTimeout(watcherTimeout);
            }

            watcherTimeout = setTimeout(() => {
                console.log('📂 Changement détecté dans application-data.json');
                reloadDataFromFile();
            }, 500);
        });

        console.log('👁️  Surveillance automatique du fichier activée');
    } catch (error) {
        console.error('❌ Erreur lors de la configuration du watcher:', error);
    }
}

/**
 * Initialise le service de données
 */
export async function initializeDataService() {
    try {
        // Créer le dossier data s'il n'existe pas
        if (!existsSync(DATA_DIR)) {
            await mkdir(DATA_DIR, { recursive: true });
            console.log('📁 Dossier data créé');
        }

        // Créer le dossier de backups s'il n'existe pas
        if (!existsSync(BACKUP_DIR)) {
            await mkdir(BACKUP_DIR, { recursive: true });
            console.log('📁 Dossier backups créé');
        }

        // Créer le dossier de backups quotidiens s'il n'existe pas
        if (!existsSync(DAILY_BACKUP_DIR)) {
            await mkdir(DAILY_BACKUP_DIR, { recursive: true });
            console.log('📁 Dossier backups-daily créé');
        }

        // Charger les données existantes
        if (existsSync(DATA_FILE)) {
            // IMPORTANT: Créer une sauvegarde quotidienne AVANT de charger/modifier les données
            await createDailyBackup();

            const fileData = await readFile(DATA_FILE, 'utf-8');
            const loadedData = JSON.parse(fileData);

            // Fusionner avec la structure par défaut pour ajouter les nouveaux champs
            applicationData = {
                ...applicationData,  // Structure par défaut avec tous les champs
                ...loadedData,       // Données existantes
                lastUpdated: loadedData.lastUpdated,
                lastUpdatedBy: loadedData.lastUpdatedBy
            };

            // MIGRATION: Convertir l'ancienne clé t51SoumissionsData vers t51Data
            if (loadedData.t51SoumissionsData && !loadedData.t51Data) {
                applicationData.t51Data = loadedData.t51SoumissionsData;
                delete applicationData.t51SoumissionsData; // Supprimer l'ancienne clé
                console.log('✅ Migration: t51SoumissionsData → t51Data');
            }

            // NE PAS SAUVEGARDER au démarrage - cela écrase les données !
            // La sauvegarde se fera uniquement lors des mises à jour réelles
            console.log('✅ Données chargées depuis le fichier');

            // NOUVEAU: Activer la surveillance automatique du fichier
            setupFileWatcher();
        } else {
            // Créer un fichier vide
            await saveData();
            console.log('✅ Fichier de données initialisé');

            // Activer la surveillance après création du fichier
            setupFileWatcher();
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

/**
 * Sauvegarde les données dans le fichier avec retry en cas d'erreur EBUSY
 * @param {boolean} createBackupFirst - Si true, crée une sauvegarde avant d'écrire (défaut: false pour éviter trop de backups)
 */
let saveQueue = Promise.resolve();
let isSaving = false;

async function saveData(createBackupFirst = false) {
    // Ajouter à la queue pour éviter les conflits d'écriture simultanée
    saveQueue = saveQueue.then(async () => {
        if (isSaving) {
            console.log('[SAVE] Attente fin de sauvegarde précédente...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        isSaving = true;
        
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                // Créer un backup avant de sauvegarder si demandé
                if (createBackupFirst && existsSync(DATA_FILE)) {
                    await createBackup();
                }

                applicationData.lastUpdated = new Date().toISOString();

                // Nettoyer les caractères de contrôle invalides avant stringify
                const cleanData = cleanControlCharacters(applicationData);

                // Écrire dans un fichier temporaire d'abord
                const tempFile = DATA_FILE + '.tmp';
                await writeFile(tempFile, JSON.stringify(cleanData, null, 2), 'utf-8');
                
                // Attendre un peu pour s'assurer que l'écriture est terminée
                await new Promise(resolve => setTimeout(resolve, 50));

                // Remplacer l'ancien fichier par le nouveau (opération VRAIMENT atomique avec rename)
                // rename() est atomique même si le fichier destination existe
                await rename(tempFile, DATA_FILE);

                console.log(`💾 Données sauvegardées (${new Date().toLocaleTimeString()})`);
                break; // Succès, sortir de la boucle
                
            } catch (error) {
                attempts++;
                
                if (error.code === 'EBUSY' && attempts < maxAttempts) {
                    console.warn(`⚠️ Fichier occupé, tentative ${attempts}/${maxAttempts}...`);
                    await new Promise(resolve => setTimeout(resolve, 200 * attempts)); // Attendre de plus en plus longtemps
                } else {
                    console.error('❌ Erreur lors de la sauvegarde:', error);
                    throw error;
                }
            } finally {
                if (attempts >= maxAttempts || attempts === 0) {
                    isSaving = false;
                }
            }
        }
    }).catch(error => {
        console.error('❌ Erreur critique lors de la sauvegarde:', error);
        isSaving = false;
    });
    
    return saveQueue;
}

/**
 * Récupère toutes les données de l'application
 */
export async function getAllData() {
    return applicationData;
}

/**
 * Met à jour les données d'un module spécifique
 */
export async function updateModuleData(moduleName, data, updatedBy = 'anonymous') {
    if (!applicationData.hasOwnProperty(moduleName)) {
        throw new Error(`Module inconnu: ${moduleName}`);
    }

    // Créer un backup avant les mises à jour importantes (si le module contient des données)
    const shouldBackup = applicationData[moduleName] !== null &&
                         applicationData[moduleName] !== undefined &&
                         (Array.isArray(applicationData[moduleName]) ? applicationData[moduleName].length > 0 : true);

    applicationData[moduleName] = data;
    applicationData.lastUpdatedBy = updatedBy;
    await saveData(shouldBackup);

    return applicationData;
}

/**
 * Met à jour plusieurs modules en une seule opération
 */
export async function updateMultipleModules(updates, updatedBy = 'anonymous') {
    // Vérifier si on doit créer un backup (au moins un module modifié contient des données)
    let shouldBackup = false;
    for (const [moduleName, data] of Object.entries(updates)) {
        if (applicationData.hasOwnProperty(moduleName)) {
            const currentData = applicationData[moduleName];
            if (currentData !== null && currentData !== undefined &&
                (Array.isArray(currentData) ? currentData.length > 0 : true)) {
                shouldBackup = true;
                break;
            }
        }
    }

    for (const [moduleName, data] of Object.entries(updates)) {
        if (applicationData.hasOwnProperty(moduleName)) {
            applicationData[moduleName] = data;
        }
    }

    applicationData.lastUpdatedBy = updatedBy;
    await saveData(shouldBackup);

    return applicationData;
}

/**
 * Récupère les données d'un module spécifique
 */
export async function getModuleData(moduleName) {
    if (!applicationData.hasOwnProperty(moduleName)) {
        throw new Error(`Module inconnu: ${moduleName}`);
    }

    return applicationData[moduleName];
}

/**
 * Réinitialise toutes les données
 */
export async function resetAllData() {
    // Créer un backup avant de réinitialiser
    await createBackup();

    applicationData = {
        arretData: null,
        scopeMarkers: null,
        iw37nData: null,
        iw38Data: null,
        tpaaData: null,
        pwData: null,
        psvData: null,
        psvPlans: null,
        maintenancesCapitalisablesData: null,
        projetsData: null,
        plansEntretienData: null,
        rencontreData: null,
        revisionTravauxData: null,
        strategieData: null,
        entrepreneurData: null,
        ingqData: null,
        espaceClosData: null,
        t51Data: null,  // Renommé de t51SoumissionsData pour cohérence
        pointPresseData: null,
        approvisionnementData: null,
        consommablesData: null,
        piecesData: null,
        contactsData: null,
        avisData: null,
        avisSyndicauxData: null,
        externalsData: null,
        settingsData: null,
        datesLimitesData: null,
        planSuivisJournaliersData: null,
        plansModificationsData: null,
        entrepreneurAllData: null,
        entrepreneurPostesTrav: null,
        teamData: null,
        demandesEchafaudages: null,
        demandesGruesNacelles: null,
        demandesVerrouillage: null,
        tpaaPwManualData: null,
        tpaaPwCachedData: null,
        ressourcesPlanificationData: null,
        t25Data: null,
        hydrauliqueSectionData: null,
        nettoyageSectionData: null,
        ndtSectionData: null,
        t30LongDelaiPieces: null,
        t30CommandeData: null,
        t33PriorisationData: null,
        t40EntrepreneursData: null,
        t60LongDelaiPieces: null,
        t60CommandeData: null,
        t55Data: null,
        t55EntrepreneursList: null,
        t55PdfTemplate: null,
        t55HistoriqueData: null,
        zonesEntreposageData: null,
        amenagementData: null,
        toursRefroidissementData: null,
        rencontresHebdoData: null,
        t57EquipementsData: null,
        suiviCoutData: null,
        t21ManualData: null,
        scopeFilters: null,
        scopeStatuts: null,
        posteAllocations: null,
        dataPageFilters: null,
        dashboardCurrentFilter: null,
        ganttPontRoulantData: null,
        equipementLevageData: null,
        equipementLevageFiles: null,
        protocoleArretData: null,
        zonesPlanData: null,
        nacellesData: null,
        travailHauteurData: null,
        equipLocationData: null,
        equipLocationPlanData: null,
        planLevageData: null,
        soumissionsManualData: null,
        // Modules d'analyse et archives
        smedData: null,
        amdecData: null,
        archivesData: null,
        lastUpdated: null,
        lastUpdatedBy: null
    };

    await saveData();
    return applicationData;
}

/**
 * Liste toutes les sauvegardes disponibles
 * @returns {Promise<Array>} Liste des sauvegardes avec leurs infos
 */
export async function listBackups() {
    try {
        if (!existsSync(BACKUP_DIR)) {
            return [];
        }

        const files = await readdir(BACKUP_DIR);
        const backupFiles = files
            .filter(f => f.startsWith('application-data-') && f.endsWith('.json'))
            .map(f => {
                const match = f.match(/application-data-(.+)\.json/);
                const timestamp = match ? match[1] : '';
                return {
                    filename: f,
                    path: join(BACKUP_DIR, f),
                    timestamp: timestamp,
                    date: timestamp ? new Date(timestamp.replace(/-/g, ':').replace('T', ' T')) : null
                };
            })
            .sort((a, b) => b.filename.localeCompare(a.filename)); // Plus récent en premier

        return backupFiles;
    } catch (error) {
        console.error('❌ Erreur lors de la liste des sauvegardes:', error);
        return [];
    }
}

/**
 * Restaure une sauvegarde spécifique
 * @param {string} backupFilename - Nom du fichier de sauvegarde
 * @returns {Promise<boolean>} True si la restauration a réussi
 */
export async function restoreBackup(backupFilename) {
    try {
        const backupPath = join(BACKUP_DIR, backupFilename);

        if (!existsSync(backupPath)) {
            throw new Error(`Sauvegarde non trouvée: ${backupFilename}`);
        }

        // Créer un backup du fichier actuel avant de restaurer
        await createBackup();

        // Lire la sauvegarde
        const backupData = await readFile(backupPath, 'utf-8');
        const parsedData = JSON.parse(backupData);

        // Restaurer les données
        applicationData = {
            ...applicationData,
            ...parsedData
        };

        // MIGRATION: Convertir l'ancienne clé t51SoumissionsData vers t51Data
        if (parsedData.t51SoumissionsData && !parsedData.t51Data) {
            applicationData.t51Data = parsedData.t51SoumissionsData;
            delete applicationData.t51SoumissionsData; // Supprimer l'ancienne clé
            console.log('✅ Migration: t51SoumissionsData → t51Data');
        }

        // Sauvegarder
        await saveData();

        console.log(`✅ Sauvegarde restaurée: ${backupFilename}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la restauration:', error);
        return false;
    }
}

/**
 * Retourne la liste de tous les modules disponibles avec leurs statistiques
 * @returns {Promise<Array>} Liste des modules avec leur statut
 */
export async function getModulesList() {
    const modules = [];

    for (const [key, value] of Object.entries(applicationData)) {
        // Ignorer les métadonnées
        if (key === 'lastUpdated' || key === 'lastUpdatedBy') {
            continue;
        }

        let dataSize = 0;
        let itemCount = 0;
        let dataType = 'null';

        if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
                dataType = 'array';
                itemCount = value.length;
                dataSize = JSON.stringify(value).length;
            } else if (typeof value === 'object') {
                dataType = 'object';
                itemCount = Object.keys(value).length;
                dataSize = JSON.stringify(value).length;
            } else {
                dataType = typeof value;
                dataSize = String(value).length;
            }
        }

        modules.push({
            name: key,
            type: dataType,
            itemCount: itemCount,
            sizeBytes: dataSize,
            isEmpty: value === null || value === undefined ||
                     (Array.isArray(value) && value.length === 0) ||
                     (typeof value === 'object' && Object.keys(value).length === 0)
        });
    }

    return modules;
}

/**
 * Retourne des statistiques globales sur les modules
 * @returns {Promise<Object>} Statistiques globales
 */
export async function getModulesStats() {
    const modules = await getModulesList();

    const stats = {
        totalModules: modules.length,
        activeModules: modules.filter(m => !m.isEmpty).length,
        emptyModules: modules.filter(m => m.isEmpty).length,
        totalItems: modules.reduce((sum, m) => sum + m.itemCount, 0),
        totalSizeBytes: modules.reduce((sum, m) => sum + m.sizeBytes, 0),
        modulesByType: {
            array: modules.filter(m => m.type === 'array').length,
            object: modules.filter(m => m.type === 'object').length,
            null: modules.filter(m => m.type === 'null').length
        }
    };

    return stats;
}
