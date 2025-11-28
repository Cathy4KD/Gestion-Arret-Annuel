// Service de données Firebase - Remplace le dataService du serveur
// Toutes les opérations de données passent maintenant par Firestore

import { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, writeBatch } from '../firebase-config.js';

// Nom de la collection principale
const MAIN_COLLECTION = 'applicationData';
const MAIN_DOC = 'mainData';

// Cache local des données
let localCache = null;
let unsubscribeListener = null;

/**
 * Structure des données de l'application (identique au serveur)
 */
const defaultData = {
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
    t51Data: null,

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
    besoinElectriquesData: null,
    purgesGazCompteRenduData: null,
    consommablesCommandeData: null,

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
    t55EntrepreneursList: null,
    t55PdfTemplate: null,
    t55DocxTemplate: null,
    t55HistoriqueData: null,

    // Configuration et filtres
    settingsData: null,
    scopeFilters: null,
    scopeStatuts: null,
    posteAllocations: null,
    dataPageFilters: null,
    dashboardCurrentFilter: null,
    datesLimitesData: null,
    planSuivisJournaliersData: null,
    plansModificationsData: null,
    ganttPontRoulantData: null,

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
    notesProchainArret: null,

    // Système de synchronisation
    syncStatus: null,

    // Métadonnées
    lastUpdated: null,
    lastUpdatedBy: null
};

/**
 * Initialise le service Firebase et charge les données
 */
export async function initializeFirebaseDataService() {
    try {
        console.log('🔥 Initialisation du service Firebase...');

        // Vérifier si les données existent déjà dans Firestore
        const docRef = doc(db, MAIN_COLLECTION, MAIN_DOC);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            localCache = { ...defaultData, ...docSnap.data() };
            console.log('✅ Données chargées depuis Firestore');
        } else {
            // Première utilisation - créer le document avec les données par défaut
            localCache = { ...defaultData, lastUpdated: new Date().toISOString() };
            await setDoc(docRef, localCache);
            console.log('✅ Document Firestore initialisé');
        }

        // Configurer l'écoute en temps réel
        setupRealtimeListener();

        return localCache;
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Firebase:', error);
        // Fallback sur le cache local vide
        localCache = { ...defaultData };
        return localCache;
    }
}

/**
 * Configure l'écoute en temps réel des changements Firestore
 */
function setupRealtimeListener() {
    if (unsubscribeListener) {
        unsubscribeListener();
    }

    const docRef = doc(db, MAIN_COLLECTION, MAIN_DOC);

    unsubscribeListener = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const newData = docSnap.data();

            // Vérifier si les données ont changé (par un autre utilisateur)
            if (newData.lastUpdated !== localCache?.lastUpdated) {
                localCache = { ...defaultData, ...newData };
                console.log('🔄 Données mises à jour en temps réel');

                // Émettre un événement pour notifier l'UI
                window.dispatchEvent(new CustomEvent('firebase-data-updated', {
                    detail: localCache
                }));
            }
        }
    }, (error) => {
        console.error('❌ Erreur listener Firestore:', error);
    });
}

/**
 * Récupère toutes les données
 */
export async function getAllData() {
    if (!localCache) {
        await initializeFirebaseDataService();
    }
    return localCache;
}

/**
 * Récupère les données d'un module spécifique
 */
export async function getModuleData(moduleName) {
    if (!localCache) {
        await initializeFirebaseDataService();
    }

    if (!localCache.hasOwnProperty(moduleName)) {
        throw new Error(`Module inconnu: ${moduleName}`);
    }

    return localCache[moduleName];
}

/**
 * Met à jour les données d'un module spécifique
 */
export async function updateModuleData(moduleName, data, updatedBy = 'anonymous') {
    if (!localCache) {
        await initializeFirebaseDataService();
    }

    if (!defaultData.hasOwnProperty(moduleName)) {
        throw new Error(`Module inconnu: ${moduleName}`);
    }

    try {
        // Mettre à jour le cache local
        localCache[moduleName] = data;
        localCache.lastUpdated = new Date().toISOString();
        localCache.lastUpdatedBy = updatedBy;

        // Mettre à jour Firestore
        const docRef = doc(db, MAIN_COLLECTION, MAIN_DOC);
        await updateDoc(docRef, {
            [moduleName]: data,
            lastUpdated: localCache.lastUpdated,
            lastUpdatedBy: updatedBy
        });

        console.log(`💾 Module ${moduleName} sauvegardé dans Firestore`);
        return localCache;
    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de ${moduleName}:`, error);
        throw error;
    }
}

/**
 * Met à jour plusieurs modules en une seule opération
 */
export async function updateMultipleModules(updates, updatedBy = 'anonymous') {
    if (!localCache) {
        await initializeFirebaseDataService();
    }

    try {
        const timestamp = new Date().toISOString();
        const updatePayload = {
            lastUpdated: timestamp,
            lastUpdatedBy: updatedBy
        };

        // Mettre à jour le cache local et préparer le payload
        for (const [moduleName, data] of Object.entries(updates)) {
            if (defaultData.hasOwnProperty(moduleName)) {
                localCache[moduleName] = data;
                updatePayload[moduleName] = data;
            }
        }

        localCache.lastUpdated = timestamp;
        localCache.lastUpdatedBy = updatedBy;

        // Mettre à jour Firestore
        const docRef = doc(db, MAIN_COLLECTION, MAIN_DOC);
        await updateDoc(docRef, updatePayload);

        console.log(`💾 ${Object.keys(updates).length} modules sauvegardés dans Firestore`);
        return localCache;
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour multiple:', error);
        throw error;
    }
}

/**
 * Sauvegarde toutes les données (utilisé pour la migration initiale)
 */
export async function saveAllData(data) {
    try {
        const timestamp = new Date().toISOString();
        const dataToSave = {
            ...defaultData,
            ...data,
            lastUpdated: timestamp
        };

        const docRef = doc(db, MAIN_COLLECTION, MAIN_DOC);
        await setDoc(docRef, dataToSave);

        localCache = dataToSave;
        console.log('💾 Toutes les données sauvegardées dans Firestore');
        return localCache;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde complète:', error);
        throw error;
    }
}

/**
 * Exporte les données pour backup local
 */
export function exportDataForBackup() {
    return JSON.stringify(localCache, null, 2);
}

/**
 * Importe des données depuis un backup local
 */
export async function importDataFromBackup(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        await saveAllData(data);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        return false;
    }
}

/**
 * Arrête l'écoute en temps réel (nettoyage)
 */
export function cleanup() {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }
}

// Exporter le service global
window.FirebaseDataService = {
    initialize: initializeFirebaseDataService,
    getAllData,
    getModuleData,
    updateModuleData,
    updateMultipleModules,
    saveAllData,
    exportDataForBackup,
    importDataFromBackup,
    cleanup
};

export default {
    initialize: initializeFirebaseDataService,
    getAllData,
    getModuleData,
    updateModuleData,
    updateMultipleModules,
    saveAllData,
    exportDataForBackup,
    importDataFromBackup,
    cleanup
};
