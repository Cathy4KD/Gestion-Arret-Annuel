/**
 * @fileoverview Module de gestion des données du protocole d'arrêt et drainage
 * @module data/protocole-arret-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

// Données du protocole d'arrêt
let protocoleArretData = {
    etapes: [],
    dateDebutArret: null,  // Date de début de l'arrêt
    dateFinArret: null     // Date de fin de l'arrêt
};

/**
 * Structure d'une étape:
 * {
 *   id: 'etape-1234567890',
 *   nom: 'Drainage circuit principal',
 *   description: 'Description détaillée de l\'étape',
 *   dateDebut: '2025-03-15',
 *   dateFin: '2025-03-16',
 *   dureeJours: 1,
 *   duree: 1,                    // Durée dans l'unité spécifiée
 *   uniteTemps: 'jours',         // 'jours', 'heures', 'minutes'
 *   responsable: 'Équipe mécanique',
 *   statut: 'nondemarre', // nondemarre, enCours, termine, enRetard
 *   couleur: '#3b82f6',
 *   dependances: ['etape-1234567889'], // IDs des étapes qui doivent être terminées avant
 *   ordre: 1,
 *   posteTechnique: 'T001',
 *   commentaire: ''
 * }
 */

/**
 * Convertit une durée en jours (fractionnaire)
 * @param {number} duree - Durée dans l'unité spécifiée
 * @param {string} unite - Unité de temps ('jours', 'heures', 'minutes')
 * @returns {number} Durée en jours (fractionnaire)
 */
export function convertirEnJours(duree, unite) {
    if (!duree) return 0;

    switch (unite) {
        case 'minutes':
            return duree / (60 * 24); // Minutes -> jours
        case 'heures':
            return duree / 24; // Heures -> jours
        case 'jours':
        default:
            return duree;
    }
}

/**
 * Obtient les données du protocole
 * @returns {Object} Données du protocole
 */
export function getProtocoleArretData() {
    return protocoleArretData;
}

/**
 * Charge les données du protocole depuis le serveur
 * @returns {Promise<void>}
 */
export async function loadProtocoleArretData() {
    console.log('[PROTOCOLE-ARRET] 📥 Chargement des données...');

    const saved = await loadFromStorage('protocoleArretData');

    if (saved) {
        protocoleArretData = saved;
        console.log(`[PROTOCOLE-ARRET] ✅ ${protocoleArretData.etapes.length} étape(s) chargée(s)`);

        // Migrer les anciennes étapes qui n'ont pas les nouveaux champs
        let migrationNeeded = false;
        protocoleArretData.etapes.forEach(etape => {
            if (!etape.duree) {
                etape.duree = etape.dureeJours || 1;
                migrationNeeded = true;
            }
            if (!etape.uniteTemps) {
                etape.uniteTemps = 'jours';
                migrationNeeded = true;
            }
        });

        if (migrationNeeded) {
            console.log('[PROTOCOLE-ARRET] 🔄 Migration des données vers nouvelle structure...');
            await saveProtocoleArretData();
        }

        // Mettre à jour les statuts basés sur les dates
        updateAllStatuts();
    } else {
        console.log('[PROTOCOLE-ARRET] ℹ️ Aucune donnée trouvée, initialisation...');
        protocoleArretData = {
            etapes: [],
            dateDebutArret: null,
            dateFinArret: null
        };
    }

    return protocoleArretData;
}

/**
 * Sauvegarde les données sur le serveur
 * @returns {Promise<boolean>}
 */
export async function saveProtocoleArretData() {
    try {
        await saveToStorage('protocoleArretData', protocoleArretData);
        console.log('[PROTOCOLE-ARRET] ✅ Données sauvegardées sur le serveur');
        return true;
    } catch (error) {
        console.error('[PROTOCOLE-ARRET] ❌ Erreur de sauvegarde:', error);
        return false;
    }
}

/**
 * Ajoute une nouvelle étape
 * @param {Object} etapeData - Données de l'étape
 * @returns {Promise<Object>} L'étape créée
 */
export async function addEtape(etapeData) {
    const uniteTemps = etapeData.uniteTemps || 'jours';
    const duree = etapeData.duree || etapeData.dureeJours || 1;
    const dureeEnJours = convertirEnJours(duree, uniteTemps);

    const nouvelleEtape = {
        id: 'etape-' + Date.now(),
        nom: etapeData.nom || 'Nouvelle étape',
        description: etapeData.description || '',
        dateDebut: etapeData.dateDebut || new Date().toISOString().split('T')[0],
        dateFin: etapeData.dateFin || new Date().toISOString().split('T')[0],
        dureeJours: dureeEnJours,  // Calculé en jours pour compatibilité
        duree: duree,
        uniteTemps: uniteTemps,
        responsable: etapeData.responsable || '',
        statut: 'nondemarre',
        couleur: etapeData.couleur || '#3b82f6',
        dependances: etapeData.dependances || [],
        ordre: protocoleArretData.etapes.length + 1,
        posteTechnique: etapeData.posteTechnique || '',
        commentaire: etapeData.commentaire || ''
    };

    protocoleArretData.etapes.push(nouvelleEtape);
    await saveProtocoleArretData();

    console.log('[PROTOCOLE-ARRET] ✅ Étape ajoutée:', nouvelleEtape.nom);
    return nouvelleEtape;
}

/**
 * Met à jour une étape existante
 * @param {string} etapeId - ID de l'étape
 * @param {Object} updates - Modifications à appliquer
 * @returns {Promise<boolean>}
 */
export async function updateEtape(etapeId, updates) {
    const etape = protocoleArretData.etapes.find(e => e.id === etapeId);

    if (!etape) {
        console.error('[PROTOCOLE-ARRET] ❌ Étape non trouvée:', etapeId);
        return false;
    }

    // Appliquer les modifications
    Object.assign(etape, updates);

    // Si unité ou durée ont changé, recalculer dureeJours
    if (updates.duree !== undefined || updates.uniteTemps !== undefined) {
        const duree = etape.duree || etape.dureeJours || 1;
        const unite = etape.uniteTemps || 'jours';
        etape.dureeJours = convertirEnJours(duree, unite);
    }

    // Recalculer la durée si les dates ont changé
    if (updates.dateDebut || updates.dateFin) {
        const debut = new Date(etape.dateDebut);
        const fin = new Date(etape.dateFin);
        etape.dureeJours = Math.max(1, Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1);
    }

    // Recalculer la date de fin si la durée a changé
    if ((updates.duree !== undefined || updates.dureeJours !== undefined) && !updates.dateFin) {
        const debut = new Date(etape.dateDebut);
        const dureeEnJours = etape.dureeJours;
        const fin = new Date(debut.getTime() + dureeEnJours * 24 * 60 * 60 * 1000);
        etape.dateFin = fin.toISOString().split('T')[0];
    }

    await saveProtocoleArretData();
    console.log('[PROTOCOLE-ARRET] ✅ Étape mise à jour:', etape.nom);

    return true;
}

/**
 * Supprime une étape
 * @param {string} etapeId - ID de l'étape à supprimer
 * @returns {Promise<boolean>}
 */
export async function deleteEtape(etapeId) {
    const index = protocoleArretData.etapes.findIndex(e => e.id === etapeId);

    if (index === -1) {
        console.error('[PROTOCOLE-ARRET] ❌ Étape non trouvée:', etapeId);
        return false;
    }

    const etape = protocoleArretData.etapes[index];

    // Supprimer les dépendances vers cette étape dans les autres étapes
    protocoleArretData.etapes.forEach(e => {
        if (e.dependances.includes(etapeId)) {
            e.dependances = e.dependances.filter(dep => dep !== etapeId);
        }
    });

    protocoleArretData.etapes.splice(index, 1);
    await saveProtocoleArretData();

    console.log('[PROTOCOLE-ARRET] ✅ Étape supprimée:', etape.nom);
    return true;
}

/**
 * Définit les dates de l'arrêt
 * @param {string} dateDebut - Date de début
 * @param {string} dateFin - Date de fin
 * @returns {Promise<boolean>}
 */
export async function setDatesArret(dateDebut, dateFin) {
    protocoleArretData.dateDebutArret = dateDebut;
    protocoleArretData.dateFinArret = dateFin;

    await saveProtocoleArretData();
    console.log('[PROTOCOLE-ARRET] ✅ Dates d\'arrêt définies:', dateDebut, 'à', dateFin);

    return true;
}

/**
 * Met à jour le statut d'une étape basé sur les dates
 * @param {Object} etape - L'étape à vérifier
 * @returns {string} Le nouveau statut
 */
function calculerStatutEtape(etape) {
    // Si déjà terminée, garder ce statut
    if (etape.statut === 'termine') {
        return 'termine';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateDebut = new Date(etape.dateDebut);
    const dateFin = new Date(etape.dateFin);

    // Si la date de fin est dépassée et pas terminée
    if (dateFin < today) {
        return 'enRetard';
    }

    // Si entre le début et la fin
    if (dateDebut <= today && dateFin >= today) {
        return 'enCours';
    }

    // Sinon, pas encore démarrée
    return 'nondemarre';
}

/**
 * Met à jour tous les statuts des étapes
 */
function updateAllStatuts() {
    protocoleArretData.etapes.forEach(etape => {
        const nouveauStatut = calculerStatutEtape(etape);
        if (etape.statut !== nouveauStatut && etape.statut !== 'termine') {
            etape.statut = nouveauStatut;
        }
    });
}

/**
 * Change le statut d'une étape manuellement
 * @param {string} etapeId - ID de l'étape
 * @param {string} nouveauStatut - Nouveau statut
 * @returns {Promise<boolean>}
 */
export async function setStatutEtape(etapeId, nouveauStatut) {
    const etape = protocoleArretData.etapes.find(e => e.id === etapeId);

    if (!etape) {
        console.error('[PROTOCOLE-ARRET] ❌ Étape non trouvée:', etapeId);
        return false;
    }

    etape.statut = nouveauStatut;
    await saveProtocoleArretData();

    console.log('[PROTOCOLE-ARRET] ✅ Statut changé:', etape.nom, '→', nouveauStatut);
    return true;
}

/**
 * Réordonne les étapes
 * @param {Array<string>} nouvelOrdre - Tableau des IDs dans le nouvel ordre
 * @returns {Promise<boolean>}
 */
export async function reorderEtapes(nouvelOrdre) {
    const nouvellesEtapes = [];

    nouvelOrdre.forEach((id, index) => {
        const etape = protocoleArretData.etapes.find(e => e.id === id);
        if (etape) {
            etape.ordre = index + 1;
            nouvellesEtapes.push(etape);
        }
    });

    protocoleArretData.etapes = nouvellesEtapes;
    await saveProtocoleArretData();

    console.log('[PROTOCOLE-ARRET] ✅ Étapes réordonnées');
    return true;
}

/**
 * Obtient les étapes triées par ordre
 * @returns {Array} Étapes triées
 */
export function getEtapesSortedByOrder() {
    return [...protocoleArretData.etapes].sort((a, b) => a.ordre - b.ordre);
}

/**
 * Obtient les étapes triées par date de début
 * @returns {Array} Étapes triées
 */
export function getEtapesSortedByDate() {
    return [...protocoleArretData.etapes].sort((a, b) => {
        const dateA = new Date(a.dateDebut);
        const dateB = new Date(b.dateDebut);
        return dateA - dateB;
    });
}

/**
 * Vérifie si une étape peut démarrer (dépendances satisfaites)
 * @param {string} etapeId - ID de l'étape
 * @returns {boolean}
 */
export function canEtapeStart(etapeId) {
    const etape = protocoleArretData.etapes.find(e => e.id === etapeId);

    if (!etape || etape.dependances.length === 0) {
        return true;
    }

    // Vérifier que toutes les dépendances sont terminées
    return etape.dependances.every(depId => {
        const depEtape = protocoleArretData.etapes.find(e => e.id === depId);
        return depEtape && depEtape.statut === 'termine';
    });
}

/**
 * Génère des étapes d'exemple pour démonstration
 * @returns {Promise<void>}
 */
export async function genererEtapesExemple() {
    if (protocoleArretData.etapes.length > 0) {
        if (!confirm('Des étapes existent déjà. Voulez-vous les remplacer par des exemples ?')) {
            return;
        }
    }

    const today = new Date();
    const dateDebut = new Date(today);
    dateDebut.setDate(today.getDate() + 7); // Commence dans 7 jours

    const etapesExemple = [
        {
            nom: 'Préparation et sécurisation',
            description: 'Mise en place des équipements de sécurité et préparation de la zone',
            duree: 2,
            uniteTemps: 'jours',
            responsable: 'Équipe sécurité',
            couleur: '#10b981',
            posteTechnique: 'SECU'
        },
        {
            nom: 'Arrêt des équipements',
            description: 'Arrêt progressif de tous les équipements concernés',
            duree: 4,
            uniteTemps: 'heures',
            responsable: 'Opérateurs',
            couleur: '#f59e0b',
            posteTechnique: 'OPS'
        },
        {
            nom: 'Purge et drainage circuit principal',
            description: 'Purge complète et drainage du circuit principal',
            duree: 3,
            uniteTemps: 'jours',
            responsable: 'Équipe mécanique',
            couleur: '#3b82f6',
            posteTechnique: 'MECA'
        },
        {
            nom: 'Drainage circuits secondaires',
            description: 'Drainage de tous les circuits secondaires',
            duree: 8,
            uniteTemps: 'heures',
            responsable: 'Équipe mécanique',
            couleur: '#6366f1',
            posteTechnique: 'MECA'
        },
        {
            nom: 'Isolation électrique',
            description: 'Isolation et consignation électrique',
            duree: 45,
            uniteTemps: 'minutes',
            responsable: 'Électriciens',
            couleur: '#eab308',
            posteTechnique: 'ELEC'
        },
        {
            nom: 'Inspection et nettoyage',
            description: 'Inspection visuelle et nettoyage des équipements',
            duree: 2,
            uniteTemps: 'jours',
            responsable: 'Équipe maintenance',
            couleur: '#8b5cf6',
            posteTechnique: 'MAIN'
        },
        {
            nom: 'Réparations et modifications',
            description: 'Exécution des travaux de réparation et modifications',
            duree: 5,
            uniteTemps: 'jours',
            responsable: 'Équipe maintenance',
            couleur: '#ec4899',
            posteTechnique: 'MAIN'
        },
        {
            nom: 'Tests et essais',
            description: 'Tests de bon fonctionnement et essais',
            duree: 12,
            uniteTemps: 'heures',
            responsable: 'Ingénieurs',
            couleur: '#14b8a6',
            posteTechnique: 'ING'
        },
        {
            nom: 'Remise en service',
            description: 'Redémarrage progressif des équipements',
            duree: 2,
            uniteTemps: 'jours',
            responsable: 'Opérateurs',
            couleur: '#10b981',
            posteTechnique: 'OPS'
        }
    ];

    protocoleArretData.etapes = [];
    let currentDate = new Date(dateDebut);

    for (let i = 0; i < etapesExemple.length; i++) {
        const exemple = etapesExemple[i];
        const dureeEnJours = convertirEnJours(exemple.duree, exemple.uniteTemps);
        const dateFin = new Date(currentDate.getTime() + dureeEnJours * 24 * 60 * 60 * 1000);

        // Définir les dépendances (chaque étape dépend de la précédente)
        const dependances = i > 0 ? [protocoleArretData.etapes[i - 1].id] : [];

        await addEtape({
            nom: exemple.nom,
            description: exemple.description,
            dateDebut: currentDate.toISOString().split('T')[0],
            dateFin: dateFin.toISOString().split('T')[0],
            duree: exemple.duree,
            uniteTemps: exemple.uniteTemps,
            responsable: exemple.responsable,
            couleur: exemple.couleur,
            dependances: dependances,
            posteTechnique: exemple.posteTechnique,
            commentaire: ''
        });

        // Avancer à la date de la prochaine étape
        currentDate = new Date(dateFin);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Définir les dates de l'arrêt
    const dateFinArret = new Date(currentDate);
    dateFinArret.setDate(dateFinArret.getDate() - 1);
    await setDatesArret(
        dateDebut.toISOString().split('T')[0],
        dateFinArret.toISOString().split('T')[0]
    );

    console.log('[PROTOCOLE-ARRET] ✅ Étapes d\'exemple générées');
}

// Exposer globalement pour les boutons HTML
window.protocoleArretData = {
    addEtape,
    updateEtape,
    deleteEtape,
    setStatutEtape,
    setDatesArret,
    reorderEtapes,
    genererEtapesExemple,
    getProtocoleArretData,
    loadProtocoleArretData,
    saveProtocoleArretData
};

console.log('[PROTOCOLE-ARRET] ✅ Module chargé');
