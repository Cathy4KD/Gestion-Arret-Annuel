/**
 * @fileoverview Module de gestion de la modale de sélection des responsables
 * @module ui/responsable-modal
 *
 * Source: arret-annuel-avec-liste.html lignes 5607-6016
 */

import { arretData, saveArretData } from '../data/arret-data.js';

/**
 * Liste complète des responsables possibles
 * @const {string[]}
 */
const RESPONSABLES_LIST = [
    'Planificateur Long terme',
    'Surintendant entretien',
    'Coordonateur Entretien',
    'Chef de Service',
    'Superviseur Mécanique',
    'Superviseur Électrique',
    'Superviseur Production',
    'Planificateur Électrique',
    'Planificateur Mécanique',
    'Conseillère Santé Sécurité',
    'Responsable Verrouillage',
    'Fiabiliste',
    'Ingénierie',
    'Spécialiste'
];

/**
 * Variables pour suivre la tâche en cours d'édition
 */
let currentModalPhaseId = null;
let currentModalTaskId = null;

/**
 * Ouvre le modal de sélection des responsables
 * @param {string} phaseId - ID de la phase
 * @param {string} taskId - ID de la tâche
 * @returns {void}
 */
export function openResponsibleModal(phaseId, taskId) {
    currentModalPhaseId = phaseId;
    currentModalTaskId = taskId;

    // Trouver la tâche
    let task = null;
    arretData.phases.forEach(phase => {
        if (phase.id === phaseId) {
            phase.taches.forEach(tache => {
                if (tache.id === taskId) {
                    task = tache;
                }
            });
        }
    });

    if (!task) {
        console.warn(`[MODAL] Tâche non trouvée: ${taskId}`);
        return;
    }

    // Initialiser le tableau de responsables si nécessaire
    if (!task.responsables) {
        task.responsables = task.responsable ? [task.responsable] : [];
        // Sauvegarder cette initialisation
        saveArretData();
        console.log(`[MODAL] Champ responsables initialisé pour ${taskId}`);
    }

    // Créer la liste de checkboxes
    const checkboxList = document.getElementById('responsibleCheckboxList');
    if (!checkboxList) {
        console.error('[MODAL] Element responsibleCheckboxList non trouvé');
        return;
    }

    checkboxList.innerHTML = '';

    RESPONSABLES_LIST.forEach((resp, index) => {
        const isChecked = task.responsables.includes(resp);
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="resp-${index}" value="${resp}" ${isChecked ? 'checked' : ''}>
            <label for="resp-${index}">${resp}</label>
        `;
        checkboxList.appendChild(div);
    });

    // Afficher le modal
    const modal = document.getElementById('responsibleModal');
    if (modal) {
        // S'assurer que la classe active est présente et forcer l'affichage
        modal.classList.add('active');
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.zIndex = '99999';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        console.log(`[MODAL] Ouverture pour tâche ${taskId}, classList:`, modal.classList.toString());
        console.log(`[MODAL] Modal styles:`, {
            display: modal.style.display,
            position: modal.style.position,
            zIndex: modal.style.zIndex
        });
    } else {
        console.error('[MODAL] Element responsibleModal non trouvé dans le DOM');
    }
}

/**
 * Ferme le modal des responsables
 * @returns {void}
 */
export function closeResponsibleModal() {
    const modal = document.getElementById('responsibleModal');
    if (modal) {
        modal.classList.remove('active');
        // Force le display à none pour s'assurer que la modal est bien cachée
        modal.style.display = 'none';
        console.log('[MODAL] Fermeture de la modale responsables');
    }
    currentModalPhaseId = null;
    currentModalTaskId = null;
}

/**
 * Ferme le modal si on clique sur l'overlay
 * @param {Event} event - L'événement de clic
 * @returns {void}
 */
export function closeModalOnOverlay(event) {
    if (event.target.id === 'responsibleModal') {
        closeResponsibleModal();
    }
}

/**
 * Sauvegarde les responsables sélectionnés
 * @returns {void}
 */
export function saveResponsibles() {
    console.log(`[MODAL] Sauvegarde des responsables pour tâche ${currentModalTaskId}, phase ${currentModalPhaseId}`);

    const checkboxes = document.querySelectorAll('#responsibleCheckboxList input[type="checkbox"]:checked');
    const selectedResponsables = Array.from(checkboxes).map(cb => cb.value);

    console.log(`[MODAL] Responsables sélectionnés:`, selectedResponsables);

    // Mettre à jour la tâche
    let updated = false;
    arretData.phases.forEach(phase => {
        if (phase.id === currentModalPhaseId) {
            phase.taches.forEach(tache => {
                if (tache.id === currentModalTaskId) {
                    console.log(`[MODAL] Avant mise à jour - responsables:`, tache.responsables, 'responsable:', tache.responsable);

                    tache.responsables = selectedResponsables;
                    // Mettre à jour l'ancien champ pour compatibilité
                    tache.responsable = selectedResponsables.length > 0 ? selectedResponsables[0] : '';
                    updated = true;

                    console.log(`[MODAL] Après mise à jour - responsables:`, tache.responsables, 'responsable:', tache.responsable);
                }
            });
        }
    });

    if (updated) {
        // Sauvegarder dans localStorage AVANT de fermer
        saveArretData();
        console.log('[MODAL] Données sauvegardées dans localStorage');

        // Fermer le modal
        closeResponsibleModal();

        // Rafraîchir le tableau de préparation immédiatement
        // Utiliser un import avec then pour s'assurer que le rendu se fait après la fermeture
        setTimeout(() => {
            import('./summary.js').then(module => {
                console.log('[MODAL] Rafraîchissement du tableau avec les nouvelles données');
                module.renderSummaryTable();
            }).catch(err => {
                console.error('[MODAL] Erreur lors du rafraîchissement du tableau:', err);
            });
        }, 50);
    } else {
        console.warn('[MODAL] Aucune mise à jour effectuée');
    }
}

/**
 * Trouve la phase d'une tâche donnée
 * @param {string} taskId - ID de la tâche
 * @returns {string|null} ID de la phase ou null
 */
function findPhaseIdForTask(taskId) {
    for (const phase of arretData.phases) {
        if (phase.taches) {
            const task = phase.taches.find(t => t.id === taskId);
            if (task) {
                return phase.id;
            }
        }
    }
    return null;
}

/**
 * Ouvre la modale pour une tâche (en trouvant automatiquement la phase)
 * @param {string} taskId - ID de la tâche
 * @returns {void}
 */
export function openResponsibleModalForTask(taskId) {
    console.log(`[MODAL] Demande d'ouverture pour tâche ${taskId}`);

    // Fermer la modal d'abord si elle est déjà ouverte
    const modal = document.getElementById('responsibleModal');
    if (modal && modal.classList.contains('active')) {
        console.log('[MODAL] Modal déjà ouverte, fermeture avant réouverture');
        closeResponsibleModal();
        // Attendre un peu avant de rouvrir
        setTimeout(() => {
            const phaseId = findPhaseIdForTask(taskId);
            if (phaseId) {
                openResponsibleModal(phaseId, taskId);
            } else {
                console.warn(`[MODAL] Phase non trouvée pour la tâche ${taskId}`);
            }
        }, 150);
    } else {
        const phaseId = findPhaseIdForTask(taskId);
        if (phaseId) {
            openResponsibleModal(phaseId, taskId);
        } else {
            console.warn(`[MODAL] Phase non trouvée pour la tâche ${taskId}`);
        }
    }
}

/**
 * Obtient la liste des responsables disponibles
 * @returns {string[]} Liste des responsables
 */
export function getResponsablesList() {
    return [...RESPONSABLES_LIST];
}

// Exposer les fonctions globalement pour les boutons HTML
if (typeof window !== 'undefined') {
    window.openResponsibleModal = openResponsibleModal;
    window.openResponsibleModalForTask = openResponsibleModalForTask;
    window.closeResponsibleModal = closeResponsibleModal;
    window.closeModalOnOverlay = closeModalOnOverlay;
    window.saveResponsibles = saveResponsibles;
    console.log('[MODAL] Fonctions exposées globalement');
}
