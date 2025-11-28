/******************************************************************************
 *
 *  🚨 ATTENTION IA: CE FICHIER EST 100% SERVEUR 🚨
 *
 *  Malgré le nom "storage-wrapper", ce module N'UTILISE PAS localStorage!
 *
 *  ✅ saveToStorage()  → Envoie au SERVEUR (pas localStorage)
 *  ✅ loadFromStorage() → Charge du SERVEUR (pas localStorage)
 *
 *  Toutes les données vont sur le serveur via Socket.IO
 *  et sont sauvegardées dans server/data/application-data.json
 *
 *  ❌ AUCUNE donnée métier en localStorage
 *  ✅ TOUT sur le serveur (80+ modules)
 *
 *  Voir: ARCHITECTURE-STOCKAGE.md et POUR-LES-IA.md
 *
 *****************************************************************************/

/**
 * @fileoverview Wrapper pour sauvegarde serveur UNIQUEMENT - 100% serveur, 0% localStorage
 * @module sync/storage-wrapper
 * @version 2.0
 * @important Ce module ne touche JAMAIS au localStorage. Tout est sur le serveur.
 */

import { syncModuleToServer, getModuleDataFromServer } from './server-sync.js';

/**
 * Mapping des clés de stockage vers les noms de modules serveur
 */
const STORAGE_TO_MODULE_MAP = {
    // Clés principales
    'arretData': 'arretData',
    'arretAnnuelData': 'arretData', // Alias pour arret-data.js
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
    'rencontreDefinitionData': 'rencontreData', // Alias pour rencontre-data.js
    'revisionListeData': 'revisionTravauxData',
    'revisionTravauxData': 'revisionTravauxData', // Clé directe
    'strategieData': 'strategieData',
    'entrepreneurData': 'entrepreneurData',
    // Clés supplémentaires
    'ingqData': 'ingqData',
    'espaceClosData': 'espaceClosData',
    't51SoumissionsData': 't51Data', // Le serveur utilise 't51Data' pas 't51SoumissionsData'
    'pointPresseData': 'pointPresseData',
    'approvisionnementData': 'approvisionnementData',
    'consommablesData': 'consommablesData',
    'piecesData': 'piecesData',
    'contactsData': 'contactsData',
    // Plans et suivis journaliers
    'planSuivisJournaliersData': 'planSuivisJournaliersData',
    // Plans d'entretien modifications
    'plansModificationsData': 'plansModificationsData',
    // Paramètres et settings
    'arretAnnuelSettings': 'settingsData',
    'externalContractors': 'externalsData',
    'datesLimites': 'datesLimitesData',
    // Entrepreneurs
    'entrepreneurAllData': 'entrepreneurAllData',
    'entrepreneurPostesTrav': 'entrepreneurPostesTrav',
    // Équipe
    'teamData': 'teamData',
    // Demandes diverses
    'demandesEchafaudages': 'demandesEchafaudages',
    'demandesGruesNacelles': 'demandesGruesNacelles',
    'demandesVerrouillage': 'demandesVerrouillage',
    // Données manuelles TPAA/PW
    'tpaaPwManualData': 'tpaaPwManualData',
    // Données TPAA/PW filtrées (cache)
    'tpaaPwCachedData': 'tpaaPwCachedData',
    // Ressources planification
    'ressourcesPlanificationData': 'ressourcesPlanificationData',
    // Avis
    'avisData': 'avisData',
    // T30 Commandes Long Délai
    't30LongDelaiPieces': 't30LongDelaiPieces',
    't30CommandeData': 't30CommandeData',
    // T33 Priorisation
    't33PriorisationData': 't33PriorisationData',
    // T40 Entrepreneurs
    't40EntrepreneursData': 't40EntrepreneursData',
    // T60 Commandes Long Délai 60-89j
    't60LongDelaiPieces': 't60LongDelaiPieces',
    't60CommandeData': 't60CommandeData',
    // T88 Commandes Long Délai 30-59j
    't88LongDelaiPieces': 't88LongDelaiPieces',
    't88CommandeData': 't88CommandeData',
    // T55 Devis et Corrections
    't55Data': 't55Data',
    't55EntrepreneursList': 't55EntrepreneursList',
    't55PdfTemplate': 't55PdfTemplate',
    't55DocxTemplate': 't55DocxTemplate',
    't55HistoriqueData': 't55HistoriqueData',
    // T63 Zones Entreposage
    'zonesEntreposageData': 'zonesEntreposageData',
    'zonesPlanData': 'zonesPlanData',
    // T65 Plans de levage
    'planLevageData': 'planLevageData',
    // Aménagement
    'amenagementData': 'amenagementData',
    // Tours de refroidissement
    'toursRefroidissementData': 'toursRefroidissementData',
    // Rencontres hebdo de préparation d'arrêt
    'rencontresHebdoData': 'rencontresHebdoData',
    // T57 Équipements de travail en hauteur
    't57EquipementsData': 't57EquipementsData',
    'travailHauteurData': 'travailHauteurData',
    // T70 Équipements de levage / Échafaudages
    'equipementLevageData': 'equipementLevageData',
    'equipementLevageFiles': 'equipementLevageFiles',
    // Suivi de coût
    'suiviCoutData': 'suiviCoutData',
    // T25 - Demandes d'achat (DA)
    't25Data': 't25Data',
    // T21 Données manuelles (photos, commentaires Service Incendie)
    't21ManualData': 't21ManualData',
    // Données manuelles soumissions (montants entrepreneurs)
    'soumissionsManualData': 'soumissionsManualData',
    // Filtres SCOPE (postes techniques par page)
    'scopeFilters': 'scopeFilters',
    // Allocations postes SCOPE
    'posteAllocations': 'posteAllocations',
    // Filtres DATA-PAGES (postes techniques par page de données)
    'dataPageFilters': 'dataPageFilters',
    // Filtre Dashboard (responsable sélectionné)
    'dashboardCurrentFilter': 'dashboardCurrentFilter',
    // T79 Équipements en location (roulottes, génératrices, etc.)
    'equipLocationData': 'equipLocationData',
    'equipLocationPlanData': 'equipLocationPlanData',
    // T64 Protocole d'arrêt et drainage
    'protocoleArretData': 'protocoleArretData',
    // T63 Zones plan editor
    'zonesPlanData': 'zonesPlanData',
    // T57 Nacelles et travail en hauteur
    'nacellesData': 'nacellesData',
    'travailHauteurData': 'travailHauteurData',
    // T87 SMED Analysis
    'smedData': 'smedData',
    // T82 AMDEC Analysis
    'amdecData': 'amdecData',
    // Archives et backups
    'archivesData': 'archivesData',
    // Réunions de préparation
    'reunionsData': 'reunionsData',
    // Besoins électriques arrêt (prises de soudure)
    'besoinElectriquesData': 'besoinElectriquesData',
    // Compte-rendu purges gaz CO
    'purgesGazCompteRenduData': 'purgesGazCompteRenduData',
    // Commande des consommables d'arrêt
    'consommablesCommandeData': 'consommablesCommandeData'
};

/**
 * 🚨 ATTENTION: Cette fonction envoie au SERVEUR, PAS localStorage!
 *
 * Sauvegarde les données sur le SERVEUR via Socket.IO.
 * Malgré le nom "saveToStorage", cette fonction N'UTILISE PAS localStorage.
 *
 * Les données sont:
 * 1. Envoyées au serveur via Socket.IO
 * 2. Sauvegardées dans server/data/application-data.json
 * 3. Broadcastées aux autres clients (temps réel)
 * 4. Backupées automatiquement (5 min + quotidien)
 *
 * @param {string} key - Clé du module (ex: 'taches', 'equipements')
 * @param {any} data - Données à sauvegarder sur le SERVEUR
 * @param {boolean} silent - Ne pas afficher de message (défaut: true)
 * @returns {Promise<boolean>} - true si la sauvegarde SERVEUR a réussi
 *
 * @important Ce n'est PAS du localStorage! Les données vont sur le serveur.
 * @see ARCHITECTURE-STOCKAGE.md pour comprendre l'architecture
 * @see POUR-LES-IA.md pour les bonnes pratiques
 *
 * @example
 * // ❌ NE PAS faire:
 * localStorage.setItem('taches', JSON.stringify(taches));
 *
 * // ✅ FAIRE:
 * await saveToStorage('taches', taches);
 */
export async function saveToStorage(key, data, silent = true) {
    try {
        // SERVEUR UNIQUEMENT - AUCUN localStorage
        const moduleName = STORAGE_TO_MODULE_MAP[key];
        if (!moduleName) {
            console.error(`[STORAGE] ❌ Aucun mapping serveur pour la clé: ${key}`);
            console.error(`[STORAGE] Clés disponibles:`, Object.keys(STORAGE_TO_MODULE_MAP));
            return false;
        }

        console.log(`[STORAGE] 📤 Tentative d'envoi de ${key} (module: ${moduleName}) au serveur...`);
        console.log(`[STORAGE] Taille des données:`, JSON.stringify(data).length, 'caractères');

        const syncSuccess = await syncModuleToServer(moduleName, data, false);

        if (syncSuccess) {
            console.log(`[STORAGE] ✅ ${key} synchronisé avec le serveur avec succès`);
            return true;
        } else {
            console.error(`[STORAGE] ❌ ÉCHEC de la sauvegarde serveur pour ${key}`);
            console.error(`[STORAGE] Les données NE SONT PAS sauvegardées!`);
            return false;
        }
    } catch (error) {
        console.error(`[STORAGE] ❌ Erreur sauvegarde ${key}:`, error);
        console.error(`[STORAGE] Stack:`, error.stack);
        return false;
    }
}

/**
 * 🚨 ATTENTION: Cette fonction charge du SERVEUR, PAS localStorage!
 *
 * Charge les données depuis le SERVEUR via Socket.IO.
 * Malgré le nom "loadFromStorage", cette fonction N'UTILISE PAS localStorage.
 *
 * Les données sont:
 * 1. Demandées au serveur via Socket.IO
 * 2. Chargées depuis server/data/application-data.json
 * 3. Retournées au client
 *
 * @param {string} key - Clé du module (ex: 'taches', 'equipements')
 * @returns {Promise<any>} - Données chargées du SERVEUR ou null si absent
 *
 * @important Ce n'est PAS du localStorage! Les données viennent du serveur.
 * @see ARCHITECTURE-STOCKAGE.md pour comprendre l'architecture
 * @see POUR-LES-IA.md pour les bonnes pratiques
 *
 * @example
 * // ❌ NE PAS faire:
 * const taches = JSON.parse(localStorage.getItem('taches') || '[]');
 *
 * // ✅ FAIRE:
 * const taches = await loadFromStorage('taches') || [];
 */
export async function loadFromStorage(key) {
    try {
        // SERVEUR UNIQUEMENT - AUCUN localStorage
        const moduleName = STORAGE_TO_MODULE_MAP[key];
        if (!moduleName) {
            console.error(`[STORAGE] ❌ Aucun mapping serveur pour la clé: ${key}`);
            return null;
        }

        console.log(`[STORAGE] 📥 Chargement de ${key} (module: ${moduleName}) depuis le serveur...`);
        const data = await getModuleDataFromServer(moduleName);

        if (data !== null && data !== undefined) {
            console.log(`[STORAGE] ✅ ${key} chargé depuis le serveur`);
            console.log(`[STORAGE] Type de données:`, Array.isArray(data) ? `Array (${data.length} éléments)` : typeof data);
            return data;
        }

        console.log(`[STORAGE] ℹ️ Aucune donnée serveur pour ${key}`);
        return null;
    } catch (error) {
        console.error(`[STORAGE] ❌ Erreur lors du chargement de ${key}:`, error);
        console.error(`[STORAGE] Stack:`, error.stack);
        return null;
    }
}

/**
 * Supprime une clé (sur le serveur uniquement)
 * @param {string} key - Clé à supprimer
 * @returns {Promise<void>}
 */
export async function removeFromStorage(key) {
    try {
        // Synchroniser la suppression (envoyer null)
        const moduleName = STORAGE_TO_MODULE_MAP[key];
        if (moduleName) {
            await syncModuleToServer(moduleName, null, true);
        }
    } catch (error) {
        console.error(`[STORAGE] Erreur lors de la suppression de ${key}:`, error);
    }
}
