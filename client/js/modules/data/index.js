/**
 * @fileoverview Data modules entry point
 * Point d'entrée pour tous les modules de gestion des données
 * Centralise les exports de tous les modules data
 * @module data
 */

// Storage module - Generic localStorage management
// DÉSACTIVÉ: Utiliser storage-wrapper.js au lieu de storage.js
// export * from './storage.js';

// Arret data module - Arret annuel main data structure
export * from './arret-data.js';

// Task manager module - CRUD operations on tasks
export * from './task-manager.js';

// IW37N data module - SAP IW37N data management
export * from './iw37n-data.js';

// IW38 data module - SAP IW38 data management
export * from './iw38-data.js';

// PSV data module - Pressure Safety Valves management
export * from './psv-data.js';

// TPAA data module - Travaux Préparatoires Avant Arrêt
export * from './tpaa-data.js';

// PW data module - Pre-Work / Travaux Préalables
export * from './pw-data.js';

// Approvisionnement data module - Supply strategy management
export * from './approvisionnement-data.js';

// Consommables data module - Consumables management
export * from './consommables-data.js';

// Pieces data module - Parts management
export * from './pieces-data.js';

// Contacts data module - Contacts management
export * from './contacts-manager.js';

// Besoins nettoyage data module - Cleaning needs management (T68)
export * from './besoins-nettoyage-data.js';

// T72 Suivi Cout data module - Cost tracking management (T72)
export * from './t72-suivi-cout.js';

// AMDEC data module - Risk analysis management (FMEA)
export * from './amdec-data.js';

// SMED data module - SMED analysis for critical path (Single Minute Exchange of Die)
export * from './smed-manager.js';

// Stats module - Statistics calculation functions
export * from './stats.js';

// T55 Historique data module - Devis et corrections history
import './t55-historique.js';

// T55 Devis data module - Devis et corrections management
import './t55-devis.js';

// Besoin Electriques data module - Electrical needs management (prises de soudure)
export * from './besoin-electriques-data.js';

/**
 * Initialize all data modules
 * Initialise tous les modules de données
 *
 * @example
 * import { initializeDataModules } from './modules/data/index.js';
 * initializeDataModules();
 */
export function initializeDataModules() {
    console.log('[DATA] Initialisation des modules de donnees...');

    // Import and call load functions for each module
    import('./arret-data.js').then(module => {
        if (module.loadArretData) module.loadArretData();
    }).catch(err => console.error('[ERROR] Arret Data:', err));

    import('./iw37n-data.js').then(module => {
        if (module.loadIw37nData) module.loadIw37nData();
    }).catch(err => console.error('[ERROR] IW37N:', err));

    import('./iw38-data.js').then(module => {
        if (module.loadIw38Data) module.loadIw38Data();
    }).catch(err => console.error('[ERROR] IW38:', err));

    import('./psv-data.js').then(module => {
        if (module.loadPsvData) module.loadPsvData();
    }).catch(err => console.error('[ERROR] PSV:', err));

    import('./tpaa-data.js').then(module => {
        if (module.loadTpaaData) module.loadTpaaData();
    }).catch(err => console.error('[ERROR] TPAA:', err));

    import('./pw-data.js').then(module => {
        if (module.loadPwData) module.loadPwData();
    }).catch(err => console.error('[ERROR] PW:', err));

    import('./approvisionnement-data.js').then(module => {
        if (module.loadApprovisionnementData) module.loadApprovisionnementData();
    }).catch(err => console.error('[ERROR] Approvisionnement:', err));

    import('./consommables-data.js').then(module => {
        if (module.loadConsommablesData) module.loadConsommablesData();
    }).catch(err => console.error('[ERROR] Consommables:', err));

    import('./contacts-manager.js').then(module => {
        if (module.loadContactsData) module.loadContactsData();
    }).catch(err => console.error('[ERROR] Contacts:', err));

    import('./t55-historique.js').then(module => {
        if (module.loadT55HistoriqueData) module.loadT55HistoriqueData();
    }).catch(err => console.error('[ERROR] T55 Historique:', err));

    import('./besoin-electriques-data.js').then(module => {
        if (module.initBesoinElectriquesModule) module.initBesoinElectriquesModule();
    }).catch(err => console.error('[ERROR] Besoin Electriques:', err));

    console.log('[OK] Tous les modules de donnees ont ete initialises');
}

/**
 * Save all data to localStorage
 * Sauvegarde toutes les données dans le localStorage
 *
 * @returns {Promise<Object>} Object with save results for each module
 *
 * @example
 * const results = await saveAllData();
 * console.log(results);
 */
export async function saveAllData() {
    console.log('[SAVE] Sauvegarde de toutes les donnees...');

    const results = {};
    const modules = [
        { name: 'iw37n', module: './iw37n-data.js', fn: 'saveIw37nData' },
        { name: 'iw38', module: './iw38-data.js', fn: 'saveIw38Data' },
        { name: 'psv', module: './psv-data.js', fn: 'savePsvData' },
        { name: 'tpaa', module: './tpaa-data.js', fn: 'saveTpaaData' },
        { name: 'pw', module: './pw-data.js', fn: 'savePwData' },
        { name: 'appro', module: './approvisionnement-data.js', fn: 'saveApprovisionnementData' },
        { name: 'conso', module: './consommables-data.js', fn: 'saveConsommablesData' }
    ];

    for (const mod of modules) {
        try {
            const module = await import(mod.module);
            if (module[mod.fn]) {
                results[mod.name] = module[mod.fn]();
            }
        } catch (error) {
            console.error('[ERROR] Sauvegarde ' + mod.name + ':', error);
            results[mod.name] = false;
        }
    }

    console.log('[OK] Sauvegarde terminee');
    return results;
}

/**
 * Clear all data from localStorage
 * Efface toutes les données du localStorage
 *
 * @returns {Promise<boolean>} Success status
 *
 * @example
 * await clearAllData();
 */
export async function clearAllData() {
    const modules = [
        { module: './iw37n-data.js', fn: 'clearIw37nData' },
        { module: './iw38-data.js', fn: 'clearIw38Data' },
        { module: './approvisionnement-data.js', fn: 'clearApprovisionnementData' },
        { module: './consommables-data.js', fn: 'clearConsommablesData' }
    ];

    try {
        for (const mod of modules) {
            const module = await import(mod.module);
            if (module[mod.fn]) {
                module[mod.fn]();
            }
        }
        console.log('[OK] Toutes les donnees ont ete effacees');
        return true;
    } catch (error) {
        console.error('[ERROR] Effacement des donnees:', error);
        return false;
    }
}

/**
 * Get summary of all stored data
 * Obtient un résumé de toutes les données stockées
 *
 * @returns {Promise<Object>} Summary object with data counts
 *
 * @example
 * const summary = await getDataSummary();
 * console.log(summary);
 */
export async function getDataSummary() {
    const summary = {};

    try {
        const iw37n = await import('./iw37n-data.js');
        summary.iw37n = iw37n.iw37nData ? iw37n.iw37nData.length : 0;

        const iw38 = await import('./iw38-data.js');
        summary.iw38 = iw38.iw38Data ? iw38.iw38Data.length : 0;

        const psv = await import('./psv-data.js');
        summary.psv = psv.psvData ? psv.psvData.length : 0;

        const tpaa = await import('./tpaa-data.js');
        summary.tpaa = tpaa.tpaaListeData ? tpaa.tpaaListeData.length : 0;

        const pw = await import('./pw-data.js');
        summary.pw = pw.pwListeData ? pw.pwListeData.length : 0;

        const appro = await import('./approvisionnement-data.js');
        summary.approvisionnement = appro.approvisionnementData ? appro.approvisionnementData.length : 0;

        const conso = await import('./consommables-data.js');
        summary.consommables = conso.consommablesData ? conso.consommablesData.length : 0;

        return summary;
    } catch (error) {
        console.error('[ERROR] Recuperation du resume:', error);
        return {};
    }
}
