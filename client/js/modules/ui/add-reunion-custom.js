/**
 * @fileoverview Module pour ajouter des réunions personnalisées
 * @module ui/add-reunion-custom
 */

import { arretData } from '../data/arret-data.js';
import { saveArretData } from '../data/arret-data.js';

/**
 * Ajoute une réunion personnalisée avec le magasin si elle n'existe pas
 */
export function addReunionMagasinIfNotExists() {
    // Chercher la phase -16 semaines
    const phase16 = arretData.phases.find(p => p.semaines === -16);

    if (!phase16) {
        console.warn('[REUNION-CUSTOM] Phase -16 semaines non trouvée');
        return false;
    }

    // Vérifier si la réunion existe déjà
    const reunionExists = phase16.taches.some(t =>
        t.titre && t.titre.toUpperCase().includes('RENCONTRE') &&
        t.titre.toUpperCase().includes('MAGASIN')
    );

    if (reunionExists) {
        console.log('[REUNION-CUSTOM] Réunion magasin existe déjà');
        return false;
    }

    // Trouver le dernier ID de tâche dans cette phase
    const lastTaskId = phase16.taches[phase16.taches.length - 1]?.id || 't40';
    const nextIdNumber = parseInt(lastTaskId.substring(1)) + 1;
    const newId = `t${nextIdNumber}`;

    // Ajouter la nouvelle tâche
    const newTask = {
        id: newId,
        titre: "RENCONTRE GÉNÉRALE AVEC LE MAGASIN POUR COORDINATION ARRÊT",
        avancement: 0,
        planifie: 0.0001,
        responsable: 'PL',
        statut: 'notstarted',
        clickable: false
    };

    phase16.taches.push(newTask);

    console.log('[REUNION-CUSTOM] ✅ Réunion magasin ajoutée:', newId);

    // Sauvegarder
    saveArretData();

    return true;
}

/**
 * Ajoute des réunions hebdomadaires de suivi magasin
 */
export function addReunionsHebdoMagasin() {
    // Chercher les phases de -12 à -1 semaine
    const phasesToUpdate = arretData.phases.filter(p =>
        p.semaines >= -12 && p.semaines <= -1
    );

    if (phasesToUpdate.length === 0) {
        console.warn('[REUNION-CUSTOM] Aucune phase trouvée pour les réunions hebdo');
        return false;
    }

    let addedCount = 0;

    phasesToUpdate.forEach(phase => {
        // Vérifier si la réunion existe déjà
        const reunionExists = phase.taches.some(t =>
            t.titre && t.titre.toUpperCase().includes('RENCONTRE') &&
            t.titre.toUpperCase().includes('MAGASIN') &&
            t.titre.toUpperCase().includes('HEBDO')
        );

        if (!reunionExists) {
            const lastTaskId = phase.taches[phase.taches.length - 1]?.id || 't1';
            const nextIdNumber = parseInt(lastTaskId.substring(1)) + 1;
            const newId = `t${nextIdNumber}`;

            const newTask = {
                id: newId,
                titre: `RENCONTRE HEBDOMADAIRE MAGASIN - SUIVI APPROVISIONNEMENT (Semaine ${phase.semaines})`,
                avancement: 0,
                planifie: 0.0001,
                responsable: 'PL',
                statut: 'notstarted',
                clickable: false
            };

            phase.taches.push(newTask);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        console.log(`[REUNION-CUSTOM] ✅ ${addedCount} réunions hebdo magasin ajoutées`);
        saveArretData();
    }

    return addedCount > 0;
}

/**
 * Initialise les réunions magasin manquantes
 */
export function initReunionsMagasin() {
    console.log('[REUNION-CUSTOM] Vérification des réunions magasin...');

    const added1 = addReunionMagasinIfNotExists();
    const added2 = addReunionsHebdoMagasin();

    if (added1 || added2) {
        console.log('[REUNION-CUSTOM] ✅ Réunions magasin initialisées');
        return true;
    } else {
        console.log('[REUNION-CUSTOM] Toutes les réunions magasin existent déjà');
        return false;
    }
}
