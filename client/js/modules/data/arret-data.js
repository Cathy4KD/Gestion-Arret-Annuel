/**
 * @fileoverview Gestion des données de l'arrêt annuel
 * @module data/arret-data
 *
 * Contient toutes les données liées à l'arrêt annuel : phases, tâches, dates
 * Source: arret-annuel-avec-liste.html lignes 12160-12700
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les données de l'arrêt
 * @const {string}
 */
const STORAGE_KEY = 'arretAnnuelData';

/**
 * Données complètes de l'arrêt annuel
 * @type {Object}
 */
export let arretData = {
    dateDebut: '2026-04-01',
    dateFin: '2026-04-15',
    duree: 14,
    budgetTotal: 0,
    today: new Date().toISOString().split('T')[0],
    contacts: [],
    phases: []
};

/**
 * Initialise les données par défaut de l'arrêt
 * @returns {void}
 */
function initDefaultData() {
    arretData = {
        dateDebut: '2026-04-01',
        dateFin: '2026-04-15',
        duree: 14,
        budgetTotal: 0,
        today: new Date().toISOString().split('T')[0],
        contacts: [],
        phases: [
            {
                id: 'phase-26sem',
                nom: '-26 SEMAINES AVANT ARRET',
                date: '2025-10-01',
                semaines: -26,
                taches: [
                    { id: 't1', titre: "CREER DOSSIER DANS LE U POUR L'ARRET DE L'ANNEE", avancement: 100, planifie: 100, responsable: 'PL', statut: 'completed', dateFin: '2025-10-01' },
                    { id: 't2', titre: "MISE A JOUR DES GAMMES ET PLANS D'ENTRETIEN APRES L'ARRET ANNUEL PRECEDENT", avancement: 100, planifie: 100, responsable: 'PL', statut: 'completed', dateFin: '2025-10-01', clickable: true, page: 'detail-t3' },
                    { id: 't3', titre: "VALIDATION DES PLANS D'ENTRETIEN A LONG DELAI", avancement: 0, planifie: 0, responsable: 'PL', statut: 'notstarted', dateFin: '2025-10-01', clickable: true, page: 'detail-t3' },
                    { id: 't4', titre: "AVOIR LA LISTE DES PROJETS / TRAVAUX MAJEURS ENTRETIEN QUI SERONT FAIT A L'ARRET", avancement: 0, planifie: 0, responsable: 'CE', statut: 'notstarted', dateFin: '2025-10-01', clickable: true, page: 'detail-t4' },
                    { id: 't5', titre: "CONVOQUER RENCONTRE DE DEFINITION ET CONCERTATION DE L'ARRET", avancement: 0, planifie: 0, responsable: 'PL', statut: 'notstarted', dateFin: '2025-10-01', clickable: true, page: 'detail-t5' }
                ]
            },
            {
                id: 'phase-24sem',
                nom: '-24 SEMAINES AVANT ARRET',
                date: '2025-10-15',
                semaines: -24,
                taches: [
                    { id: 't8', titre: "REVISION DE LA LISTE DES TRAVAUX (AVIS / ORDRE RELATIFS AUX TRAVAUX (SAP))", avancement: 0, planifie: 0, responsable: 'PL', statut: 'notstarted', dateFin: '2025-10-15', clickable: true, page: 'detail-t8' },
                    { id: 't9', titre: "OBTENIR LA LISTE DES MAINTENANCES CAPITALISABLES", avancement: 0, planifie: 0, responsable: 'PL', statut: 'notstarted', dateFin: '2025-10-15', clickable: true, page: 'detail-t9' }
                ]
            }
        ]
    };
}

/**
 * Définit les données de l'arrêt (injection depuis le serveur)
 * @param {Object} data - Données à injecter
 * @returns {void}
 */
export function setArretData(data) {
    if (data) {
        arretData = data;
        console.log('[ARRET-DATA] Données injectées depuis le serveur:', arretData.phases?.length || 0, 'phases');
    } else {
        initDefaultData();
        console.log('[ARRET-DATA] Données initialisées par défaut');
    }

    // Exposer aussi sur window pour accès direct (nécessaire pour summary-timeline.js)
    if (typeof window !== 'undefined') {
        window.arretData = arretData;
    }
}

/**
 * Récupère les données de l'arrêt
 * @returns {Object} Données de l'arrêt
 */
export function getArretData() {
    return arretData;
}

/**
 * Charge les données de l'arrêt (appel initial au démarrage)
 * Les données seront injectées par server-sync.js depuis le serveur
 * @returns {void}
 */
export async function loadArretData() {
    // Les données sont maintenant injectées par server-sync.js
    // On initialise juste les données par défaut si rien n'est encore chargé
    if (!arretData.phases || arretData.phases.length === 0) {
        initDefaultData();
        console.log('[ARRET-DATA] Données par défaut initialisées (en attente du serveur)');
    }

    // Exposer sur window pour accès global
    if (typeof window !== 'undefined') {
        window.arretData = arretData;
        console.log('[ARRET-DATA] ✅ arretData exposé sur window');
    }
}

/**
 * S'assure que arretData contient toutes les phases
 * Cette fonction doit être appelée après le chargement pour synchroniser avec les données complètes
 * @param {Array} completePhases - Les phases complètes depuis summary.js
 */
export function ensureCompletePhases(completePhases) {
    if (!completePhases || completePhases.length === 0) return;

    // Si arretData a moins de phases que completePhases, on fusionne
    if (arretData.phases.length < completePhases.length) {
        console.log(`[ARRET] Fusion de ${arretData.phases.length} phases existantes avec ${completePhases.length} phases complètes`);

        // Créer un map des phases existantes pour un accès rapide
        const existingPhasesMap = new Map();
        arretData.phases.forEach(phase => {
            existingPhasesMap.set(phase.id, phase);
        });

        // Fusionner en préservant les modifications (mais PAS les titres)
        const mergedPhases = completePhases.map(completePhase => {
            const existingPhase = existingPhasesMap.get(completePhase.id);
            if (existingPhase) {
                // Fusionner les tâches - TOUJOURS garder le titre de completeTache
                const mergedTaches = completePhase.taches.map(completeTache => {
                    const existingTache = existingPhase.taches?.find(t => t.id === completeTache.id);
                    if (existingTache) {
                        // Préserver UNIQUEMENT les données modifiables, PAS le titre
                        return {
                            ...completeTache, // Titre et structure de base (TOUJOURS du code)
                            avancement: existingTache.avancement !== undefined ? existingTache.avancement : completeTache.avancement,
                            statut: existingTache.statut || completeTache.statut,
                            responsable: existingTache.responsable || completeTache.responsable,
                            responsables: existingTache.responsables || completeTache.responsables,
                            commentaire: existingTache.commentaire || completeTache.commentaire,
                            clickable: completeTache.clickable, // TOUJOURS du code
                            page: completeTache.page // TOUJOURS du code
                        };
                    }
                    return completeTache;
                });
                return { ...completePhase, taches: mergedTaches };
            }
            return completePhase;
        });

        arretData.phases = mergedPhases;
        saveArretData();
        console.log(`[OK] Phases fusionnées et sauvegardées: ${arretData.phases.length} phases`);

        // Mettre à jour window.arretData
        if (typeof window !== 'undefined') {
            window.arretData = arretData;
        }
    }
}

/**
 * Sauvegarde les données de l'arrêt dans localStorage
 * @returns {boolean} true si sauvegarde réussie
 */
export async function saveArretData() {
    return await saveToStorage(STORAGE_KEY, arretData);
}

/**
 * Récupère toutes les phases
 * @returns {Array} Liste des phases
 */
export function getPhases() {
    return arretData.phases || [];
}

/**
 * Récupère une phase par son ID
 * @param {string} phaseId - ID de la phase
 * @returns {Object|null} La phase ou null
 */
export function getPhaseById(phaseId) {
    return arretData.phases.find(p => p.id === phaseId) || null;
}

/**
 * Récupère toutes les tâches de toutes les phases
 * @returns {Array} Liste de toutes les tâches
 */
export function getAllTasks() {
    const allTasks = [];
    arretData.phases.forEach(phase => {
        if (phase.taches) {
            phase.taches.forEach(tache => {
                allTasks.push({
                    ...tache,
                    phaseId: phase.id,
                    phaseNom: phase.nom
                });
            });
        }
    });
    return allTasks;
}

/**
 * Récupère une tâche par son ID
 * @param {string} taskId - ID de la tâche
 * @returns {Object|null} La tâche ou null
 */
export function getTaskById(taskId) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                return {
                    ...task,
                    phaseId: phase.id,
                    phaseNom: phase.nom
                };
            }
        }
    }
    return null;
}

/**
 * Récupère les tâches par statut
 * @param {string} statut - Le statut ('notstarted', 'inprogress', 'completed', 'cancelled')
 * @returns {Array} Liste des tâches avec ce statut
 */
export function getTasksByStatus(statut) {
    return getAllTasks().filter(t => t.statut === statut);
}

/**
 * Met à jour les informations générales de l'arrêt
 * @param {Object} updates - Propriétés à mettre à jour
 * @returns {void}
 */
export function updateArretInfo(updates) {
    Object.assign(arretData, updates);
    saveArretData();
}

/**
 * Ajoute une nouvelle phase
 * @param {Object} phase - Nouvelle phase à ajouter
 * @returns {void}
 */
export function addPhase(phase) {
    arretData.phases.push(phase);
    saveArretData();
}

/**
 * Supprime une phase par ID
 * @param {string} phaseId - ID de la phase à supprimer
 * @returns {boolean} true si suppression réussie
 */
export function deletePhase(phaseId) {
    const index = arretData.phases.findIndex(p => p.id === phaseId);
    if (index !== -1) {
        arretData.phases.splice(index, 1);
        saveArretData();
        return true;
    }
    return false;
}

/**
 * Calcule les statistiques de l'arrêt
 * @returns {Object} Statistiques
 */
export function getArretStats() {
    const allTasks = getAllTasks();

    return {
        totalPhases: arretData.phases.length,
        totalTaches: allTasks.length,
        tachesCompleted: allTasks.filter(t => t.statut === 'completed').length,
        tachesInProgress: allTasks.filter(t => t.statut === 'inprogress').length,
        tachesNotStarted: allTasks.filter(t => t.statut === 'notstarted').length,
        tachesCancelled: allTasks.filter(t => t.statut === 'cancelled').length,
        avancementMoyen: Math.round(allTasks.reduce((sum, t) => sum + (t.avancement || 0), 0) / allTasks.length || 0)
    };
}

// Exposer les fonctions globalement pour l'injection depuis server-sync.js
window.setArretData = setArretData;
window.getArretData = getArretData;
window.arretData = arretData; // Exposer aussi la variable directement

// Charger les données au démarrage (initialisation par défaut)
loadArretData();
