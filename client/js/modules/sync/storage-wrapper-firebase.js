/******************************************************************************
 *
 *  VERSION FIREBASE du storage-wrapper
 *  Utilise firebase-sync.js au lieu de server-sync.js
 *
 *****************************************************************************/

/**
 * @fileoverview Wrapper pour sauvegarde Firebase - Version GitHub Pages
 * @module sync/storage-wrapper-firebase
 * @version 2.0
 */

import { syncModuleToServer, getModuleDataFromServer } from './firebase-sync.js';

/**
 * Mapping des clés de stockage vers les noms de modules serveur
 */
const STORAGE_TO_MODULE_MAP = {
    // Clés principales
    'arretData': 'arretData',
    'arretAnnuelData': 'arretData',
    'scopeMarkers': 'scopeMarkers',
    'iw37nData': 'iw37nData',
    'iw38Data': 'iw38Data',
    'tpaaListeData': 'tpaaData',
    'pwData': 'pwData',
    'psvData': 'psvData',
    'psvPlans': 'psvPlans',
    'maintenancesCapitalisablesData': 'maintenancesCapitalisablesData',
    'projetsData': 'projetsData',
    'plansData': 'plansEntretienData',
    'rencontreData': 'rencontreData',
    'rencontreDefinitionData': 'rencontreData',
    'revisionListeData': 'revisionTravauxData',
    'revisionTravauxData': 'revisionTravauxData',
    'strategieData': 'strategieData',
    'entrepreneurData': 'entrepreneurData',
    'ingqData': 'ingqData',
    'espaceClosData': 'espaceClosData',
    't51SoumissionsData': 't51Data',
    'pointPresseData': 'pointPresseData',
    'approvisionnementData': 'approvisionnementData',
    'consommablesData': 'consommablesData',
    'piecesData': 'piecesData',
    'contactsData': 'contactsData',
    'planSuivisJournaliersData': 'planSuivisJournaliersData',
    'plansModificationsData': 'plansModificationsData',
    'arretAnnuelSettings': 'settingsData',
    'externalContractors': 'externalsData',
    'datesLimites': 'datesLimitesData',
    'entrepreneurAllData': 'entrepreneurAllData',
    'entrepreneurPostesTrav': 'entrepreneurPostesTrav',
    'teamData': 'teamData',
    'demandesEchafaudages': 'demandesEchafaudages',
    'demandesGruesNacelles': 'demandesGruesNacelles',
    'demandesVerrouillage': 'demandesVerrouillage',
    'tpaaPwManualData': 'tpaaPwManualData',
    'tpaaPwCachedData': 'tpaaPwCachedData',
    'ressourcesPlanificationData': 'ressourcesPlanificationData',
    'avisData': 'avisData',
    't30LongDelaiPieces': 't30LongDelaiPieces',
    't30CommandeData': 't30CommandeData',
    't33PriorisationData': 't33PriorisationData',
    't40EntrepreneursData': 't40EntrepreneursData',
    't60LongDelaiPieces': 't60LongDelaiPieces',
    't60CommandeData': 't60CommandeData',
    't88LongDelaiPieces': 't88LongDelaiPieces',
    't88CommandeData': 't88CommandeData',
    't55Data': 't55Data',
    't55EntrepreneursList': 't55EntrepreneursList',
    't55PdfTemplate': 't55PdfTemplate',
    't55DocxTemplate': 't55DocxTemplate',
    't55HistoriqueData': 't55HistoriqueData',
    'zonesEntreposageData': 'zonesEntreposageData',
    'zonesPlanData': 'zonesPlanData',
    'planLevageData': 'planLevageData',
    'amenagementData': 'amenagementData',
    'toursRefroidissementData': 'toursRefroidissementData',
    'rencontresHebdoData': 'rencontresHebdoData',
    't57EquipementsData': 't57EquipementsData',
    'travailHauteurData': 'travailHauteurData',
    'equipementLevageData': 'equipementLevageData',
    'equipementLevageFiles': 'equipementLevageFiles',
    'suiviCoutData': 'suiviCoutData',
    't25Data': 't25Data',
    't21ManualData': 't21ManualData',
    'soumissionsManualData': 'soumissionsManualData',
    'scopeFilters': 'scopeFilters',
    'posteAllocations': 'posteAllocations',
    'dataPageFilters': 'dataPageFilters',
    'dashboardCurrentFilter': 'dashboardCurrentFilter',
    'equipLocationData': 'equipLocationData',
    'equipLocationPlanData': 'equipLocationPlanData',
    'protocoleArretData': 'protocoleArretData',
    'nacellesData': 'nacellesData',
    'smedData': 'smedData',
    'amdecData': 'amdecData',
    'archivesData': 'archivesData',
    'reunionsData': 'reunionsData',
    'besoinElectriquesData': 'besoinElectriquesData',
    'purgesGazCompteRenduData': 'purgesGazCompteRenduData',
    'consommablesCommandeData': 'consommablesCommandeData',
    // Clés génériques pour les pages de détail
    'detail-t22Data': 'detail-t22Data',
    'detail-t24Data': 'detail-t24Data',
    'detail-t27Data': 'detail-t27Data',
    'detail-t29Data': 'detail-t29Data',
    'detail-t30Data': 'detail-t30Data',
    'detail-t33Data': 'detail-t33Data',
    'detail-t43Data': 'detail-t43Data',
    'detail-t45Data': 'detail-t45Data',
    'detail-t50Data': 'detail-t50Data',
    'detail-t51Data': 'detail-t51Data',
    'detail-t55Data': 'detail-t55Data',
    'detail-t56Data': 'detail-t56Data',
    'detail-t57Data': 'detail-t57Data',
    'detail-t58Data': 'detail-t58Data',
    'detail-t60Data': 'detail-t60Data',
    'detail-t62Data': 'detail-t62Data',
    'detail-t63Data': 'detail-t63Data',
    'detail-t64Data': 'detail-t64Data',
    'detail-t65Data': 'detail-t65Data',
    'detail-t66Data': 'detail-t66Data',
    'detail-t67Data': 'detail-t67Data',
    'detail-t68Data': 'detail-t68Data',
    'detail-t69Data': 'detail-t69Data',
    'detail-t70Data': 'detail-t70Data',
    'detail-t71Data': 'detail-t71Data',
    'detail-t72Data': 'detail-t72Data',
    'detail-t75Data': 'detail-t75Data',
    'detail-t90Data': 'detail-t90Data',
    'detail-t91Data': 'detail-t91Data',
    'detail-t93Data': 'detail-t93Data',
    'detail-t94Data': 'detail-t94Data',
    'detail-t95Data': 'detail-t95Data',
    'detail-t99Data': 'detail-t99Data',
    'detail-t100Data': 'detail-t100Data',
    'detail-t109Data': 'detail-t109Data',
    'detail-t110Data': 'detail-t110Data',
    'detail-t128Data': 'detail-t128Data',
    'detail-t131Data': 'detail-t131Data',
    'detail-t132Data': 'detail-t132Data',
    'detail-t136Data': 'detail-t136Data',
    'detail-t139Data': 'detail-t139Data'
};

/**
 * Sauvegarde les données sur Firebase
 * @param {string} key - Clé du module
 * @param {any} data - Données à sauvegarder
 * @param {boolean} silent - Ne pas afficher de message
 * @returns {Promise<boolean>}
 */
export async function saveToStorage(key, data, silent = true) {
    try {
        let moduleName = STORAGE_TO_MODULE_MAP[key];

        // Si pas de mapping, utiliser la clé directement
        if (!moduleName) {
            moduleName = key;
            console.log(`[STORAGE-FIREBASE] ℹ️ Pas de mapping pour ${key}, utilisation directe`);
        }

        console.log(`[STORAGE-FIREBASE] 📤 Sauvegarde ${key} (module: ${moduleName})...`);

        const syncSuccess = await syncModuleToServer(moduleName, data, silent);

        if (syncSuccess) {
            console.log(`[STORAGE-FIREBASE] ✅ ${key} synchronisé avec Firebase`);
            return true;
        } else {
            console.error(`[STORAGE-FIREBASE] ❌ Échec sauvegarde ${key}`);
            return false;
        }
    } catch (error) {
        console.error(`[STORAGE-FIREBASE] ❌ Erreur sauvegarde ${key}:`, error);
        return false;
    }
}

/**
 * Charge les données depuis Firebase
 * @param {string} key - Clé du module
 * @returns {Promise<any>}
 */
export async function loadFromStorage(key) {
    try {
        let moduleName = STORAGE_TO_MODULE_MAP[key];

        // Si pas de mapping, utiliser la clé directement
        if (!moduleName) {
            moduleName = key;
        }

        console.log(`[STORAGE-FIREBASE] 📥 Chargement ${key} (module: ${moduleName})...`);
        const data = await getModuleDataFromServer(moduleName);

        if (data !== null && data !== undefined) {
            console.log(`[STORAGE-FIREBASE] ✅ ${key} chargé depuis Firebase`);
            return data;
        }

        console.log(`[STORAGE-FIREBASE] ℹ️ Aucune donnée pour ${key}`);
        return null;
    } catch (error) {
        console.error(`[STORAGE-FIREBASE] ❌ Erreur chargement ${key}:`, error);
        return null;
    }
}

/**
 * Supprime une clé sur Firebase
 * @param {string} key - Clé à supprimer
 * @returns {Promise<void>}
 */
export async function removeFromStorage(key) {
    try {
        const moduleName = STORAGE_TO_MODULE_MAP[key] || key;
        await syncModuleToServer(moduleName, null, true);
    } catch (error) {
        console.error(`[STORAGE-FIREBASE] Erreur suppression ${key}:`, error);
    }
}
