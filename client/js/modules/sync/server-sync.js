/**
 * @fileoverview Module de synchronisation des données avec le serveur
 * @module sync/server-sync
 */

import { socket } from '../../socket.js';

/**
 * Retourne l'instance du socket
 * @returns {object|null} Instance du socket ou null si non disponible
 */
export function getSocket() {
    return socket;
}

/**
 * Indicateur si le socket est initialisé
 * @type {boolean}
 */
let isSocketInitialized = false;

/**
 * Nom d'utilisateur pour la synchronisation
 * @type {string}
 */
let userName = 'User';

/**
 * État de connexion
 * @type {boolean}
 */
let isConnected = false;

/**
 * Initialise la connexion Socket.IO et charge les données du serveur
 * @param {string} user - Nom d'utilisateur
 * @returns {Promise<boolean>} Résout quand les données sont chargées
 */
export function initSync(user = 'User') {
    if (isSocketInitialized) {
        console.log('[SYNC] Déjà initialisé');
        return Promise.resolve(true);
    }

    if (!socket) {
        console.error('[SYNC] Socket.IO non disponible');
        return Promise.resolve(false);
    }

    console.log('[SYNC] Initialisation - 100% serveur, AUCUN localStorage');

    userName = user;
    isSocketInitialized = true;

    return new Promise((resolve) => {
        // Le socket est déjà connecté via socket.js
        // On ajoute juste nos gestionnaires spécifiques

        socket.on('connect', () => {
            isConnected = true;
            console.log('[SYNC] ✅ Connecté au serveur');

            // Charger les données initiales depuis le serveur
            loadInitialDataFromServer().then(() => {
                resolve(true);
            });
        });

        socket.on('disconnect', () => {
            isConnected = false;
            console.log('[SYNC] ❌ Déconnecté du serveur');
        });

        // Écouter les mises à jour des autres clients
        socket.on('data:moduleUpdated', handleRemoteUpdate);
        socket.on('data:multipleUpdated', handleRemoteMultipleUpdate);
        socket.on('data:resetComplete', handleRemoteReset);

        // Écouter les données initiales
        socket.on('data:initial', handleInitialData);

        // Si déjà connecté, charger les données immédiatement
        if (socket.connected) {
            isConnected = true;
            console.log('[SYNC] Chargement des données depuis le serveur...');
            loadInitialDataFromServer().then(() => {
                resolve(true);
            });
        } else {
            // Si pas encore connecté, attendre maximum 5 secondes
            console.log('[SYNC] En attente de connexion au serveur...');
            setTimeout(() => {
                if (!isConnected) {
                    console.warn('[SYNC] ⚠️ Timeout connexion serveur - utilisation données locales');
                    resolve(false);
                }
            }, 5000);
        }

        console.log('[SYNC] Initialisation de la synchronisation');
    });
}

/**
 * Charge les données initiales depuis le serveur
 * @returns {Promise<void>}
 */
function loadInitialDataFromServer() {
    if (!socket) {
        console.error('[SYNC] ❌ Socket non disponible, impossible de charger les données');
        return Promise.resolve();
    }

    console.log('[SYNC] 📥 Demande des données au serveur...');

    return new Promise((resolve) => {
        socket.emit('data:getAll', (response) => {
            if (response.success && response.data) {
                console.log('[SYNC] ✅ Réponse du serveur reçue');

                // Log du nombre de lignes reçues
                const iw37nCount = Array.isArray(response.data.iw37nData) ? response.data.iw37nData.length : 0;
                const iw38Count = Array.isArray(response.data.iw38Data) ? response.data.iw38Data.length : 0;
                const revisionCount = Array.isArray(response.data.revisionTravauxData) ? response.data.revisionTravauxData.length : 0;

                console.log(`[SYNC] 📊 Données reçues:`);
                console.log(`   - IW37N: ${iw37nCount} lignes`);
                console.log(`   - IW38: ${iw38Count} lignes`);
                console.log(`   - Révision Travaux: ${revisionCount} travaux`);

                applyServerData(response.data);
                console.log('[SYNC] ✅ Données initiales chargées depuis le serveur');
            } else {
                console.error('[SYNC] ❌ Erreur chargement données serveur:', response.error);
                console.error('[SYNC] ⚠️ Impossible de charger les données - serveur non disponible');
            }
            resolve();
        });
    });
}

/**
 * Gère la réception des données initiales
 * @param {object} data - Données du serveur
 * @returns {void}
 */
function handleInitialData(data) {
    if (data) {
        applyServerData(data);
        console.log('[SYNC] ✅ Données initiales reçues');
    }
}

/**
 * Applique les données du serveur (injection directe en mémoire UNIQUEMENT - plus de localStorage)
 * @param {object} data - Données du serveur
 * @returns {void}
 */
function applyServerData(data) {
    // Appliquer chaque module s'il existe
    const modules = [
        'arretData',
        'scopeMarkers',
        'iw37nData',
        'iw38Data',
        'tpaaData',
        'pwData',
        'psvData',
        'psvPlans',
        'maintenancesCapitalisablesData',
        'projetsData',
        'plansEntretienData',
        'plansModificationsData',
        'rencontreData',
        'revisionTravauxData',
        'strategieData',
        'entrepreneurData',
        'ingqData',
        'espaceClosData',
        't51Data',
        'pointPresseData',
        'approvisionnementData',
        'consommablesData',
        'piecesData',
        'planSuivisJournaliersData',
        'settingsData',
        'externalsData',
        'datesLimitesData',
        't55Data',
        't55EntrepreneursList',
        't55DocxTemplate',
        't55PdfTemplate',
        't55HistoriqueData',
        't55EntrepreneursData',
        'contactsData',
        'tpaaPwCachedData',
        'tpaaPwManualData',
        'ressourcesPlanificationData',
        'toursRefroidissementData',
        'rencontresHebdoData',
        't57EquipementsData',
        'zonesEntreposageData',
        'suiviCoutData',
        't30LongDelaiPieces',
        't30CommandeData',
        't60LongDelaiPieces',
        't60CommandeData',
        't88LongDelaiPieces',
        't88CommandeData',
        'scopeFilters',
        'posteAllocations',
        'dataPageFilters',
        'dashboardCurrentFilter'
    ];

    modules.forEach(moduleName => {
        if (data[moduleName] !== null && data[moduleName] !== undefined) {
            // Injection directe en mémoire pour TOUS les modules (plus de localStorage)
            console.log(`[SYNC] 📡 ${moduleName}: injection en mémoire (serveur uniquement)`);
            injectDataIntoModule(moduleName, data[moduleName]);
        }
    });
}

/**
 * Injecte les données directement dans le module (contournement localStorage)
 * @param {string} moduleName - Nom du module
 * @param {any} data - Données à injecter
 */
function injectDataIntoModule(moduleName, data) {
    try {
        const dataLength = Array.isArray(data) ? data.length : 'N/A';

        switch (moduleName) {
            case 'iw37nData':
                if (window.setIw37nData) {
                    window.setIw37nData(data);
                    console.log(`[SYNC] ✅ IW37N injecté: ${dataLength} lignes (mémoire serveur)`);
                    console.log(`[SYNC] ℹ️ Le tableau sera rendu automatiquement quand vous ouvrirez la page IW37N`);

                    // Ne pas rendre le tableau ici - le rendu se fera automatiquement
                    // quand l'utilisateur navigue vers la page IW37N (voir page-loader.js)
                } else {
                    console.error('[SYNC] ❌ window.setIw37nData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module iw37n-data.js est bien chargé');
                }
                break;

            case 'iw38Data':
                if (window.setIw38Data) {
                    window.setIw38Data(data);
                    console.log(`[SYNC] ✅ IW38 injecté: ${dataLength} lignes (mémoire serveur)`);
                    console.log(`[SYNC] ℹ️ Le tableau sera rendu par loadIw38Data() lors de l'initialisation`);

                    // Note: Le rendu du tableau est géré par loadIw38Data() dans init.js
                    // Cela évite les doubles rendus et garantit que le DOM est prêt
                } else {
                    console.error('[SYNC] ❌ window.setIw38Data non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module iw38-data.js est bien chargé');
                }
                break;

            case 'revisionTravauxData':
                if (window.setRevisionData) {
                    window.setRevisionData(data);
                    console.log(`[SYNC] ✅ Révision Travaux injecté: ${dataLength} travaux (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setRevisionData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module revision-travaux-data.js est bien chargé');
                }
                break;

            case 'psvData':
                if (window.setPsvData) {
                    window.setPsvData(data);
                    console.log(`[SYNC] ✅ PSV injecté: ${dataLength} PSV (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setPsvData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module psv-data.js est bien chargé');
                }
                break;

            case 'tpaaData':
                if (window.setTpaaListeData) {
                    window.setTpaaListeData(data);
                    console.log(`[SYNC] ✅ TPAA injecté: ${dataLength} TPAA (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setTpaaListeData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module tpaa-data.js est bien chargé');
                }
                break;

            case 'pwData':
                if (window.setPwData) {
                    window.setPwData(data);
                    console.log(`[SYNC] ✅ PW injecté: ${dataLength} PW (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setPwData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module pw-data.js est bien chargé');
                }
                break;

            case 'settingsData':
                if (window.setSettings) {
                    window.setSettings(data);
                    console.log(`[SYNC] ✅ Settings injecté depuis le serveur`);
                } else {
                    console.error('[SYNC] ❌ window.setSettings non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module settings.js est bien chargé');
                }
                break;

            case 'externalsData':
                if (window.setExternalsData) {
                    window.setExternalsData(data);
                    console.log(`[SYNC] ✅ Externals injecté depuis le serveur: ${dataLength} codes`);
                } else {
                    console.error('[SYNC] ❌ window.setExternalsData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module settings.js est bien chargé');
                }
                break;

            case 'datesLimitesData':
                if (window.setDatesLimitesData) {
                    window.setDatesLimitesData(data);
                    console.log(`[SYNC] ✅ Dates Limites injecté depuis le serveur: ${dataLength} dates`);
                } else {
                    console.error('[SYNC] ❌ window.setDatesLimitesData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module settings.js est bien chargé');
                }
                break;

            case 'ingqData':
                if (window.setIngqData) {
                    window.setIngqData(data);
                    console.log(`[SYNC] ✅ INGQ injecté: ${dataLength} projets (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setIngqData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module ingq.js est bien chargé');
                }
                break;

            case 'tpaaPwCachedData':
                if (window.setTpaaPwCachedData) {
                    window.setTpaaPwCachedData(data);
                    const tpaaCount = data && data.tpaaData ? data.tpaaData.length : 0;
                    const pwCount = data && data.pwData ? data.pwData.length : 0;
                    console.log(`[SYNC] ✅ TPAA/PW Cache injecté: ${tpaaCount} TPAA, ${pwCount} PW (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setTpaaPwCachedData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module tpaa-pw-data.js est bien chargé');
                }
                break;

            case 'tpaaPwManualData':
                if (window.setTpaaPwManualData) {
                    window.setTpaaPwManualData(data);
                    const manualCount = data ? Object.keys(data).length : 0;
                    console.log(`[SYNC] ✅ TPAA/PW Données manuelles injectées: ${manualCount} entrées (commentaires, statuts)`);
                } else {
                    console.error('[SYNC] ❌ window.setTpaaPwManualData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module tpaa-pw-data.js est bien chargé');
                }
                break;

            case 'piecesData':
                if (window.setPiecesData) {
                    window.setPiecesData(data);
                    console.log(`[SYNC] ✅ Pièces injecté: ${dataLength} lignes (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setPiecesData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module pieces-data.js est bien chargé');
                }
                break;

            case 'ressourcesPlanificationData':
                if (window.setRessourcesPlanificationData) {
                    window.setRessourcesPlanificationData(data);
                    console.log(`[SYNC] ✅ Ressources Planification injecté: ${dataLength} lignes (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setRessourcesPlanificationData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module ressources-planification.js est bien chargé');
                }
                break;

            case 'arretData':
                if (window.setArretData) {
                    window.setArretData(data);
                    const phasesCount = data && data.phases ? data.phases.length : 0;
                    console.log(`[SYNC] ✅ Arrêt Data injecté: ${phasesCount} phases (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setArretData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module arret-data.js est bien chargé');
                }
                break;

            case 'scopeMarkers':
                if (window.setScopeMarkers) {
                    window.setScopeMarkers(data);
                    console.log(`[SYNC] ✅ Scope Markers injecté: ${dataLength} items (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setScopeMarkers non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module scope est bien chargé');
                }
                break;

            case 'plansModificationsData':
                if (window.setPlansModificationsData) {
                    window.setPlansModificationsData(data);
                    console.log(`[SYNC] ✅ Plans Modifications injecté: ${dataLength} modifications (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setPlansModificationsData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module plans-entretien.js est bien chargé');
                }
                break;

            case 'toursRefroidissementData':
                if (window.setToursRefroidissementData) {
                    window.setToursRefroidissementData(data);
                    console.log(`[SYNC] ✅ Tours Refroidissement injecté: ${dataLength} rencontres (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setToursRefroidissementData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module tours-refroidissement-data.js est bien chargé');
                }
                break;

            case 'rencontresHebdoData':
                if (window.setRencontresHebdoData) {
                    window.setRencontresHebdoData(data);
                    console.log(`[SYNC] ✅ Rencontres Hebdo injecté: ${dataLength} rencontres (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setRencontresHebdoData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module rencontres-hebdo-data.js est bien chargé');
                }
                break;

            case 't57EquipementsData':
                if (window.setT57EquipementsData) {
                    window.setT57EquipementsData(data);
                    console.log(`[SYNC] ✅ T57 Équipements Hauteur injecté: ${dataLength} équipements (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT57EquipementsData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t57-equipements-hauteur.js est bien chargé');
                }
                break;

            case 'zonesEntreposageData':
                if (window.setZonesEntreposageData) {
                    window.setZonesEntreposageData(data);
                    console.log(`[SYNC] ✅ Zones Entreposage injecté: ${dataLength} plans (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setZonesEntreposageData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module zones-entreposage-editor.js est bien chargé');
                }
                break;

            case 'suiviCoutData':
                if (window.setSuiviCoutData) {
                    window.setSuiviCoutData(data);
                    console.log(`[SYNC] ✅ Suivi de Coût injecté (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setSuiviCoutData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module suivi-cout-data.js est bien chargé');
                }
                break;

            case 't55Data':
                if (window.setT55Data) {
                    window.setT55Data(data);
                    console.log(`[SYNC] ✅ Devis T55 injecté: ${dataLength} devis (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT55Data non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module devis-manager.js est bien chargé');
                }
                break;

            case 'contactsData':
                if (window.setContactsData) {
                    window.setContactsData(data);
                    const contactsCount = data && data.contacts ? data.contacts.length : 0;
                    const codesCount = data && data.codesExternes ? data.codesExternes.length : 0;
                    console.log(`[SYNC] ✅ Contacts injecté: ${contactsCount} contacts, ${codesCount} codes externes (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setContactsData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module contacts-manager.js est bien chargé');
                }
                break;

            case 't55EntrepreneursList':
                if (window.setT55EntrepreneursList) {
                    window.setT55EntrepreneursList(data);
                    console.log(`[SYNC] ✅ Liste entrepreneurs T55 injecté: ${dataLength} entrepreneurs (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT55EntrepreneursList non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module devis-manager.js est bien chargé');
                }
                break;

            case 't55EntrepreneursData':
                if (window.setT55EntrepreneursData) {
                    window.setT55EntrepreneursData(data);
                    const count = data && typeof data === 'object' ? Object.keys(data).length : 0;
                    console.log(`[SYNC] ✅ Données entrepreneurs T55 injecté: ${count} entrepreneurs (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT55EntrepreneursData non disponible!');
                }
                break;

            case 't51Data':
                if (window.setT51SoumissionsData) {
                    window.setT51SoumissionsData(data);
                    console.log(`[SYNC] ✅ T51 Soumissions injecté: ${dataLength} soumissions (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT51SoumissionsData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t51-soumissions.js est bien chargé');
                }
                break;

            case 't30LongDelaiPieces':
                if (window.setT30LongDelaiPieces) {
                    window.setT30LongDelaiPieces(data);
                    console.log(`[SYNC] ✅ T30 Pièces long délai injecté: ${dataLength} pièces (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT30LongDelaiPieces non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t30-long-delai.js est bien chargé');
                }
                break;

            case 't30CommandeData':
                if (window.setT30CommandeData) {
                    window.setT30CommandeData(data);
                    const t30CommandeCount = data && typeof data === 'object' ? Object.keys(data).length : 0;
                    console.log(`[SYNC] ✅ T30 Données commandes injecté: ${t30CommandeCount} commandes (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT30CommandeData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t30-long-delai.js est bien chargé');
                }
                break;

            case 't60LongDelaiPieces':
                if (window.setT60LongDelaiPieces) {
                    window.setT60LongDelaiPieces(data);
                    console.log(`[SYNC] ✅ T60 Pièces long délai injecté: ${dataLength} pièces (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT60LongDelaiPieces non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t60-long-delai.js est bien chargé');
                }
                break;

            case 't60CommandeData':
                if (window.setT60CommandeData) {
                    window.setT60CommandeData(data);
                    const t60CommandeCount = data && typeof data === 'object' ? Object.keys(data).length : 0;
                    console.log(`[SYNC] ✅ T60 Données commandes injecté: ${t60CommandeCount} commandes (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT60CommandeData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t60-long-delai.js est bien chargé');
                }
                break;

            case 't88LongDelaiPieces':
                if (window.setT88LongDelaiPieces) {
                    window.setT88LongDelaiPieces(data);
                    console.log(`[SYNC] ✅ T88 Pièces long délai injecté: ${dataLength} pièces (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT88LongDelaiPieces non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t88-long-delai.js est bien chargé');
                }
                break;

            case 't88CommandeData':
                if (window.setT88CommandeData) {
                    window.setT88CommandeData(data);
                    const t88CommandeCount = data && typeof data === 'object' ? Object.keys(data).length : 0;
                    console.log(`[SYNC] ✅ T88 Données commandes injecté: ${t88CommandeCount} commandes (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setT88CommandeData non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module t88-long-delai.js est bien chargé');
                }
                break;

            case 'scopeFilters':
                if (window.setScopeFilters) {
                    window.setScopeFilters(data);
                    const scopePages = data && typeof data === 'object' ? Object.keys(data).length : 0;
                    console.log(`[SYNC] ✅ SCOPE Filters injecté: ${scopePages} pages (mémoire serveur)`);
                    if (scopePages > 0) {
                        console.log(`[SYNC] 📋 Pages SCOPE configurées: ${Object.keys(data).join(', ')}`);
                    }
                } else {
                    console.error('[SYNC] ❌ window.setScopeFilters non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module SCOPE est bien chargé');
                }
                break;

            case 'posteAllocations':
                if (window.setPosteAllocations) {
                    window.setPosteAllocations(data);
                    const allocationsCount = data && typeof data === 'object' ? Object.keys(data).length : 0;
                    console.log(`[SYNC] ✅ Allocations de postes SCOPE injecté: ${allocationsCount} postes assignés (mémoire serveur)`);
                } else {
                    console.error('[SYNC] ❌ window.setPosteAllocations non disponible!');
                    console.error('[SYNC] ⚠️ Vérifiez que le module SCOPE est bien chargé');
                }
                break;

            case 'dataPageFilters':
                // Les filtres de pages de données
                const dataPages = data && typeof data === 'object' ? Object.keys(data).length : 0;
                console.log(`[SYNC] ✅ Filtres de pages de données disponibles: ${dataPages} pages (mémoire serveur)`);
                break;

            case 'dashboardCurrentFilter':
                // Filtre actuel du dashboard
                console.log(`[SYNC] ✅ Filtre Dashboard disponible: ${data || 'Aucun'} (mémoire serveur)`);
                break;

            default:
                console.warn(`[SYNC] ⚠️ Pas de fonction d'injection pour ${moduleName}`);
        }
    } catch (error) {
        console.error(`[SYNC] ❌ Erreur injection ${moduleName}:`, error);
    }
}

/**
 * Obtient la clé localStorage pour un module
 * @param {string} moduleName - Nom du module
 * @returns {string} Clé localStorage
 */
function getStorageKey(moduleName) {
    const mapping = {
        'arretData': 'arretAnnuelData', // Utilise la clé correcte utilisée par arret-data.js
        'scopeMarkers': 'scopeMarkers',
        'iw37nData': 'iw37nData',
        'iw38Data': 'iw38Data',
        'tpaaData': 'tpaaListeData',
        'pwData': 'pwData',
        'psvData': 'psvData',
        'psvPlans': 'psvPlans',
        'maintenancesCapitalisablesData': 'maintenancesCapitalisablesData',
        'projetsData': 'projetsData',
        'plansEntretienData': 'plansData',
        'rencontreData': 'rencontreDefinitionData', // Utilise la clé correcte utilisée par rencontre-data.js
        'revisionTravauxData': 'revisionTravauxData',
        'strategieData': 'strategieData',
        'entrepreneurData': 'entrepreneurData',
        'ingqData': 'ingqData',
        'espaceClosData': 'espaceClosData',
        't51SoumissionsData': 't51SoumissionsData',
        'pointPresseData': 'pointPresseData',
        'approvisionnementData': 'approvisionnementData',
        'consommablesData': 'consommablesData',
        'planSuivisJournaliersData': 'planSuivisJournaliersData',
        'settingsData': 'arretAnnuelSettings',
        'externalsData': 'externalContractors',
        'tpaaPwCachedData': 'tpaaPwCachedData',
        'tpaaPwManualData': 'tpaaPwManualData'
    };

    return mapping[moduleName] || moduleName;
}

/**
 * Synchronise un module de données avec le serveur
 * @param {string} moduleName - Nom du module
 * @param {any} data - Données à synchroniser
 * @param {boolean} silent - Ne pas afficher de message (défaut: true)
 * @returns {Promise<boolean>} Succès de la synchronisation
 */
export async function syncModuleToServer(moduleName, data, silent = true) {
    console.log(`[SYNC] syncModuleToServer appelé pour ${moduleName}`);
    console.log(`[SYNC] Socket existe:`, !!socket);
    console.log(`[SYNC] Socket connecté:`, isConnected);
    console.log(`[SYNC] Socket.connected:`, socket ? socket.connected : 'N/A');

    if (!socket) {
        console.error('[SYNC] ❌ Socket non disponible!');
        return false;
    }

    if (!isConnected && !socket.connected) {
        console.error('[SYNC] ❌ Socket non connecté au serveur!');
        console.error('[SYNC] État du socket:', socket);
        return false;
    }

    console.log(`[SYNC] 📤 Envoi de ${moduleName} au serveur...`);
    console.log(`[SYNC] Taille:`, JSON.stringify(data).length, 'caractères');

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.error(`[SYNC] ⏱️ Timeout (10s) - pas de réponse du serveur pour ${moduleName}`);
            resolve(false);
        }, 10000); // 10 secondes

        socket.emit('data:updateModule', {
            moduleName,
            data,
            userName
        }, (response) => {
            clearTimeout(timeout);

            console.log(`[SYNC] Réponse reçue pour ${moduleName}:`, response);

            if (response && response.success) {
                console.log(`[SYNC] ✅ ${moduleName} synchronisé avec succès`);
                resolve(true);
            } else {
                console.error(`[SYNC] ❌ Erreur sync ${moduleName}:`, response ? response.error : 'Pas de réponse');
                resolve(false);
            }
        });
    });
}

/**
 * Récupère les données d'un module depuis le serveur
 * @param {string} moduleName - Nom du module
 * @returns {Promise<any>} Données du module
 */
export async function getModuleDataFromServer(moduleName) {
    console.log(`[SYNC] getModuleDataFromServer appelé pour ${moduleName}`);
    console.log(`[SYNC] Socket existe:`, !!socket);
    console.log(`[SYNC] Socket connecté:`, isConnected);

    if (!socket) {
        console.error('[SYNC] ❌ Socket non disponible!');
        return null;
    }

    if (!isConnected && !socket.connected) {
        console.error('[SYNC] ❌ Socket non connecté au serveur!');
        return null;
    }

    console.log(`[SYNC] 📥 Demande de ${moduleName} au serveur...`);

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.error(`[SYNC] ⏱️ Timeout (10s) - pas de réponse du serveur pour ${moduleName}`);
            resolve(null);
        }, 10000);

        socket.emit('data:getModule', { moduleName }, (response) => {
            clearTimeout(timeout);

            console.log(`[SYNC] Réponse reçue pour ${moduleName}:`, response ? 'OK' : 'NULL');

            if (response && response.success) {
                console.log(`[SYNC] ✅ ${moduleName} récupéré avec succès`);
                resolve(response.data);
            } else {
                console.error(`[SYNC] ❌ Erreur récupération ${moduleName}:`, response ? response.error : 'Pas de réponse');
                resolve(null);
            }
        });
    });
}

/**
 * Gère la mise à jour depuis un autre client
 * @param {object} update - Mise à jour reçue
 * @returns {void}
 */
function handleRemoteUpdate(update) {
    const { moduleName, data } = update;

    console.log(`[SYNC] 📥 Mise à jour reçue:`, update);
    console.log(`[SYNC] - Module: ${moduleName}`);
    console.log(`[SYNC] - Mis à jour par: ${update.updatedBy}`);

    // Injecter directement en mémoire (plus de localStorage)
    injectDataIntoModule(moduleName, data);

    console.log(`[SYNC] ✅ Données injectées en mémoire pour ${moduleName}`);
    console.log(`[SYNC] 🔄 Appel refreshUIForModule(${moduleName})`);

    // Rafraîchir l'interface si nécessaire
    refreshUIForModule(moduleName);
}

/**
 * Gère les mises à jour multiples depuis un autre client
 * @param {object} update - Mises à jour reçues
 * @returns {void}
 */
function handleRemoteMultipleUpdate(update) {
    const { updates } = update;

    Object.entries(updates).forEach(([moduleName, data]) => {
        // Injecter directement en mémoire (plus de localStorage)
        injectDataIntoModule(moduleName, data);
        refreshUIForModule(moduleName);
    });

    console.log(`[SYNC] 🔄 Mises à jour multiples par ${update.updatedBy}`);
}

/**
 * Gère la réinitialisation depuis un autre client
 * @param {object} reset - Information de réinitialisation
 * @returns {void}
 */
function handleRemoteReset(reset) {
    console.log(`[SYNC] 🔄 Réinitialisation par ${reset.resetBy}`);

    // Recharger la page (les données seront rechargées depuis le serveur)
    window.location.reload();
}

/**
 * Rafraîchit l'interface pour un module spécifique
 * @param {string} moduleName - Nom du module
 * @returns {void}
 */
function refreshUIForModule(moduleName) {
    console.log(`[SYNC] 🎯 refreshUIForModule appelé pour: ${moduleName}`);

    // Dispatcher un événement personnalisé pour que les modules puissent s'écouter
    const event = new CustomEvent('data:updated', {
        detail: { moduleName }
    });
    console.log(`[SYNC] 📡 Dispatch événement 'data:updated' pour ${moduleName}`);
    window.dispatchEvent(event);

    // Rafraîchir les tableaux/vues spécifiques selon le module
    switch (moduleName) {
        case 'arretData':
            console.log(`[SYNC] 🔄 Tentative refresh arretData`);
            // Rafraîchir le tableau de préparation si visible
            if (typeof window.renderSummaryTable === 'function') {
                console.log(`[SYNC] ✅ Appel window.renderSummaryTable()`);
                window.renderSummaryTable();
            } else {
                console.warn(`[SYNC] ⚠️ window.renderSummaryTable n'est pas une fonction!`);
            }
            break;
        case 'scopeMarkers':
            console.log(`[SYNC] 🔄 Refresh scopeMarkers (automatique)`);
            // Rafraîchir les plans SCOPE si visibles
            // Les plans se rafraîchiront automatiquement au prochain affichage
            break;
        default:
            console.log(`[SYNC] ℹ️ Pas de refresh spécifique pour ${moduleName}, événement dispatché`);
        // Ajouter d'autres cas selon les besoins
    }
}

/**
 * Vérifie si la synchronisation est active
 * @returns {boolean} État de la connexion
 */
export function isSyncActive() {
    return isConnected;
}

/**
 * Obtient le nom d'utilisateur actuel
 * @returns {string} Nom d'utilisateur
 */
export function getUserName() {
    return userName;
}
