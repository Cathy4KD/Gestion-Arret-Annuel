/**
 * @fileoverview Module de synchronisation Firebase - Remplace server-sync.js
 * Ce module gère la synchronisation en temps réel avec Firestore
 * @module sync/firebase-sync
 */

import FirebaseDataService from '../../services/firebase-data-service.js';

/**
 * Indicateur si le service est initialisé
 * @type {boolean}
 */
let isInitialized = false;

/**
 * Nom d'utilisateur pour la synchronisation
 * @type {string}
 */
let userName = 'User';

/**
 * Cache des données locales
 * @type {object|null}
 */
let dataCache = null;

/**
 * Initialise la synchronisation Firebase et charge les données
 * @param {string} user - Nom d'utilisateur
 * @returns {Promise<boolean>} Résout quand les données sont chargées
 */
export async function initSync(user = 'User') {
    if (isInitialized) {
        console.log('[FIREBASE-SYNC] Déjà initialisé');
        return true;
    }

    console.log('[FIREBASE-SYNC] Initialisation - Mode Firebase (pas de serveur local)');
    userName = user;

    try {
        // Initialiser le service Firebase
        dataCache = await FirebaseDataService.initialize();

        if (dataCache) {
            console.log('[FIREBASE-SYNC] ✅ Données chargées depuis Firestore');

            // Appliquer les données aux modules
            applyFirebaseData(dataCache);

            // Écouter les mises à jour en temps réel
            setupRealtimeUpdates();

            isInitialized = true;
            return true;
        } else {
            console.error('[FIREBASE-SYNC] ❌ Échec du chargement des données');
            return false;
        }
    } catch (error) {
        console.error('[FIREBASE-SYNC] ❌ Erreur initialisation:', error);
        return false;
    }
}

/**
 * Configure l'écoute des mises à jour en temps réel
 */
function setupRealtimeUpdates() {
    window.addEventListener('firebase-data-updated', (event) => {
        const newData = event.detail;
        console.log('[FIREBASE-SYNC] 🔄 Données mises à jour en temps réel');

        // Mettre à jour le cache
        dataCache = newData;

        // Ré-appliquer les données aux modules
        applyFirebaseData(newData);

        // Notifier l'UI
        window.dispatchEvent(new CustomEvent('data:reloaded', {
            detail: { source: 'firebase', timestamp: new Date().toISOString() }
        }));
    });
}

/**
 * Applique les données Firebase aux modules de l'application
 * @param {object} data - Données de Firestore
 */
function applyFirebaseData(data) {
    const modules = [
        'arretData', 'scopeMarkers', 'iw37nData', 'iw38Data', 'tpaaData', 'pwData',
        'psvData', 'psvPlans', 'maintenancesCapitalisablesData', 'plansEntretienData',
        'projetsData', 'plansModificationsData', 'rencontreData', 'revisionTravauxData',
        'strategieData', 'entrepreneurData', 'ingqData', 'espaceClosData', 't51Data',
        'pointPresseData', 'approvisionnementData', 'consommablesData', 'piecesData',
        'planSuivisJournaliersData', 'settingsData', 'externalsData', 'datesLimitesData',
        't55Data', 't55EntrepreneursList', 't55DocxTemplate', 't55PdfTemplate',
        't55HistoriqueData', 'contactsData', 'tpaaPwCachedData', 'tpaaPwManualData',
        'ressourcesPlanificationData', 'toursRefroidissementData', 'rencontresHebdoData',
        't57EquipementsData', 'zonesEntreposageData', 'suiviCoutData',
        't30LongDelaiPieces', 't30CommandeData', 't60LongDelaiPieces', 't60CommandeData',
        'scopeFilters', 'posteAllocations', 'dataPageFilters', 'dashboardCurrentFilter'
    ];

    modules.forEach(moduleName => {
        if (data[moduleName] !== null && data[moduleName] !== undefined) {
            injectDataIntoModule(moduleName, data[moduleName]);
        }
    });
}

/**
 * Injecte les données dans un module spécifique
 * @param {string} moduleName - Nom du module
 * @param {any} data - Données à injecter
 */
function injectDataIntoModule(moduleName, data) {
    try {
        const dataLength = Array.isArray(data) ? data.length : 'N/A';

        // Map des fonctions d'injection
        const injectors = {
            'iw37nData': { fn: 'setIw37nData', label: 'IW37N' },
            'iw38Data': { fn: 'setIw38Data', label: 'IW38' },
            'revisionTravauxData': { fn: 'setRevisionData', label: 'Révision Travaux' },
            'psvData': { fn: 'setPsvData', label: 'PSV' },
            'tpaaData': { fn: 'setTpaaListeData', label: 'TPAA' },
            'pwData': { fn: 'setPwData', label: 'PW' },
            'settingsData': { fn: 'setSettings', label: 'Settings' },
            'externalsData': { fn: 'setExternalsData', label: 'Externals' },
            'datesLimitesData': { fn: 'setDatesLimitesData', label: 'Dates Limites' },
            'ingqData': { fn: 'setIngqData', label: 'INGQ' },
            'tpaaPwCachedData': { fn: 'setTpaaPwCachedData', label: 'TPAA/PW Cache' },
            'tpaaPwManualData': { fn: 'setTpaaPwManualData', label: 'TPAA/PW Manual' },
            'piecesData': { fn: 'setPiecesData', label: 'Pièces' },
            'ressourcesPlanificationData': { fn: 'setRessourcesPlanificationData', label: 'Ressources Planif' },
            'arretData': { fn: 'setArretData', label: 'Arrêt Data' },
            'scopeMarkers': { fn: 'setScopeMarkers', label: 'Scope Markers' },
            'plansModificationsData': { fn: 'setPlansModificationsData', label: 'Plans Modifications' },
            'toursRefroidissementData': { fn: 'setToursRefroidissementData', label: 'Tours Refroidissement' },
            'rencontresHebdoData': { fn: 'setRencontresHebdoData', label: 'Rencontres Hebdo' },
            't57EquipementsData': { fn: 'setT57EquipementsData', label: 'T57 Équipements' },
            'zonesEntreposageData': { fn: 'setZonesEntreposageData', label: 'Zones Entreposage' },
            'suiviCoutData': { fn: 'setSuiviCoutData', label: 'Suivi Coût' },
            't55Data': { fn: 'setT55Data', label: 'Devis T55' },
            'contactsData': { fn: 'setContactsData', label: 'Contacts' },
            't55EntrepreneursList': { fn: 'setT55EntrepreneursList', label: 'T55 Entrepreneurs' },
            't51Data': { fn: 'setT51SoumissionsData', label: 'T51 Soumissions' },
            't30LongDelaiPieces': { fn: 'setT30LongDelaiPieces', label: 'T30 Pièces' },
            't30CommandeData': { fn: 'setT30CommandeData', label: 'T30 Commandes' },
            't60LongDelaiPieces': { fn: 'setT60LongDelaiPieces', label: 'T60 Pièces' },
            't60CommandeData': { fn: 'setT60CommandeData', label: 'T60 Commandes' },
            'scopeFilters': { fn: 'setScopeFilters', label: 'SCOPE Filters' },
            'posteAllocations': { fn: 'setPosteAllocations', label: 'Poste Allocations' }
        };

        const injector = injectors[moduleName];
        if (injector && window[injector.fn]) {
            window[injector.fn](data);
            console.log(`[FIREBASE-SYNC] ✅ ${injector.label} injecté: ${dataLength} items`);
        }
    } catch (error) {
        console.error(`[FIREBASE-SYNC] ❌ Erreur injection ${moduleName}:`, error);
    }
}

/**
 * Synchronise un module avec Firebase
 * @param {string} moduleName - Nom du module
 * @param {any} data - Données à synchroniser
 * @param {boolean} silent - Ne pas afficher de message
 * @returns {Promise<boolean>} Succès de la synchronisation
 */
export async function syncModuleToServer(moduleName, data, silent = true) {
    console.log(`[FIREBASE-SYNC] 📤 Synchronisation ${moduleName}...`);

    try {
        await FirebaseDataService.updateModuleData(moduleName, data, userName);

        // Mettre à jour le cache local
        if (dataCache) {
            dataCache[moduleName] = data;
        }

        if (!silent) {
            console.log(`[FIREBASE-SYNC] ✅ ${moduleName} synchronisé avec Firebase`);
        }
        return true;
    } catch (error) {
        console.error(`[FIREBASE-SYNC] ❌ Erreur sync ${moduleName}:`, error);
        return false;
    }
}

/**
 * Récupère les données d'un module depuis Firebase
 * @param {string} moduleName - Nom du module
 * @returns {Promise<any>} Données du module
 */
export async function getModuleDataFromServer(moduleName) {
    console.log(`[FIREBASE-SYNC] 📥 Récupération ${moduleName}...`);

    try {
        const data = await FirebaseDataService.getModuleData(moduleName);
        return data;
    } catch (error) {
        console.error(`[FIREBASE-SYNC] ❌ Erreur récupération ${moduleName}:`, error);
        return null;
    }
}

/**
 * Vérifie si la synchronisation est active
 * @returns {boolean} État de la connexion
 */
export function isSyncActive() {
    return isInitialized;
}

/**
 * Obtient le nom d'utilisateur actuel
 * @returns {string} Nom d'utilisateur
 */
export function getUserName() {
    return userName;
}

/**
 * Retourne null car pas de socket avec Firebase
 * @returns {null}
 */
export function getSocket() {
    return null;
}

// Exporter globalement pour compatibilité
window.syncModuleToServer = syncModuleToServer;
window.getModuleDataFromServer = getModuleDataFromServer;
