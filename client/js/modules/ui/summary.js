/**
 * @fileoverview Module UI pour la page Préparation (Summary)
 * @module ui/summary
 */

import { switchPage } from '../navigation.js';
import { arretData } from '../data/arret-data.js';
import { updateTaskResponsable, updateTaskProgress, updateTask } from '../data/task-manager.js';
import { openResponsibleModalForTask } from './responsable-modal.js';
import { getStartDate } from '../data/settings.js';

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
 * Calcule la date d'une phase en fonction de la date de début de l'arrêt et du nombre de semaines
 * @param {string} startDate - Date de début de l'arrêt (format ISO: YYYY-MM-DD)
 * @param {number} weeks - Nombre de semaines (négatif pour avant l'arrêt)
 * @returns {string} Date calculée au format YYYY-MM-DD
 */
function calculatePhaseDate(startDate, weeks) {
    if (!startDate) {
        return '';
    }

    try {
        const date = new Date(startDate);
        // Ajouter le nombre de semaines (négatif = soustraire)
        date.setDate(date.getDate() + (weeks * 7));

        // Retourner au format YYYY-MM-DD
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('[SUMMARY] Erreur calcul date phase:', error);
        return '';
    }
}

/**
 * Rendre le tableau des phases de préparation
 */
export async function renderSummaryTable() {
    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) {
        console.warn('[SUMMARY] Tableau summaryTableBody non trouvé');
        return;
    }

    // Données des phases (temporairement en dur, sera chargé du localStorage plus tard)
    const phases = await getPreparationPhases();

    tbody.innerHTML = '';

    const today = new Date();

    phases.forEach(phase => {
        // Filtrer les réunions (elles sont affichées dans "Bilan des Réunions")
        // et les tâches t31 et t32 (remplacées par la page combinée detail-suivi-pieces-delai)
        // et les tâches t5 et t23 (affichées uniquement dans "Bilan des Réunions")
        // et la tâche t66 (supprimée du menu à la demande)
        // et les tâches t46, t47, t48 (regroupées dans t45 - Espaces Clos)
        // et la tâche t49 (Commandes 60J - supprimée)
        const tachesNonReunions = phase.taches.filter(tache => {
            const titre = tache.titre || '';
            const isReunion = titre.toUpperCase().includes('RENCONTRE') ||
                              titre.toUpperCase().includes('RÉUNION') ||
                              titre.toUpperCase().includes('REUNION');
            const isT5 = tache.id === 't5'; // CONVOQUER RENCONTRE DE DÉFINITION (affichée dans Bilan des Réunions)
            const isT23 = tache.id === 't23'; // RENCONTRE DE DÉFINITION D'ARRÊT (affichée dans Bilan des Réunions)
            const isT31 = tache.id === 't31'; // SORTIR LISTE DES PIÈCES À LONG DÉLAI LIVRAISON
            const isT32 = tache.id === 't32'; // SUIVI DES LOTS MAGASIN SUIVI 1 (-90 J)
            const isT66 = tache.id === 't66'; // VALIDER AVEC MAGASIN CAPACITÉ DE TRAITEMENTS DES LOTS (supprimée)
            const isT46 = tache.id === 't46'; // FAIRE LA TOURNÉE DES ESPACE CLOS (regroupée dans t45)
            const isT47 = tache.id === 't47'; // INSCRIRE LES NUMÉRO D'ESPACE CLOS (regroupée dans t45)
            const isT48 = tache.id === 't48'; // FAIRE DEMANDE D'ÉTUDIANT POUR SURVEILLANCE (regroupée dans t45)
            const isT49 = tache.id === 't49'; // FAIRE LES COMMANDES À LONG DÉLAI 60J (supprimée)
            return !isReunion && !isT31 && !isT32 && !isT5 && !isT23 && !isT66 && !isT46 && !isT47 && !isT48 && !isT49;
        });

        // Si toutes les tâches sont des réunions, ne pas afficher la phase
        if (tachesNonReunions.length === 0) {
            return; // Passer à la phase suivante
        }

        // Ligne de phase (en-tête groupé)
        const phaseRow = document.createElement('tr');
        phaseRow.className = 'summary-phase-row';
        phaseRow.style.background = '#ecf0f3';
        phaseRow.innerHTML = `
            <td colspan="6" style="font-weight: bold; font-size: 1.05em; padding: 15px; color: #000; text-align: center !important;">
                ${phase.nom} (${phase.semaines} semaines) - ${phase.date} - ${tachesNonReunions.length} tâches
            </td>
        `;
        tbody.appendChild(phaseRow);

        // Lignes de tâches (sans les réunions)
        tachesNonReunions.forEach(tache => {
            const taskRow = document.createElement('tr');
            taskRow.className = 'summary-task-row';

            if (tache.statut === 'cancelled') {
                taskRow.classList.add('cancelled');
                taskRow.style.opacity = '0.6';
            }

            // Calculer l'état
            const etatInfo = getEtatInfo(tache, phase.date, today);

            // Personnalisation pour certaines tâches
            let displayTitre = tache.titre;
            let displayPage = tache.page;

            // t30: Renommer et rediriger vers la page regroupée
            if (tache.id === 't30') {
                displayTitre = 'COMMANDE LONG DÉLAI';
                displayPage = 'detail-suivi-pieces-delai';
            }

            // t45: Renommer pour regrouper toutes les tâches d'espaces clos
            if (tache.id === 't45') {
                displayTitre = 'ÉTABLIR LA LISTE DES ESPACES CLOS';
            }

            // Gérer le style des tâches cliquables (seulement sur le titre, pas toute la ligne)
            const isClickable = tache.clickable && displayPage;
            const clickableStyle = isClickable ? 'cursor: pointer; color: #667eea; text-decoration: underline;' : '';
            const clickableAction = isClickable ? `onclick="window.switchToPage('${displayPage}')"` : '';

            // Afficher les responsables (peut être un array ou une string)
            const responsablesDisplay = Array.isArray(tache.responsables) && tache.responsables.length > 0
                ? tache.responsables.join('<br>')
                : (tache.responsable || 'Sélectionner');

            taskRow.innerHTML = `
                <td class="summary-task-title" style="width: 30%; padding: 10px; border: 1px solid #ddd; ${clickableStyle}" ${clickableAction}>
                    ${displayTitre}
                </td>
                <td style="width: 15%; padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <button class="responsable-button" data-task-id="${tache.id}"
                            style="padding: 6px 10px; border: none; border-radius: 12px; background: #ecf0f3; color: #000000; cursor: pointer; font-weight: 600; font-size: 0.95em; min-width: 80px; line-height: 1.4; box-shadow: 5px 5px 10px rgba(163, 177, 198, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.7); transition: all 0.3s ease;">
                        ${responsablesDisplay}
                    </button>
                </td>
                <td style="width: 5%; padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <span class="status-badge" style="padding: 8px; border-radius: 8px; font-size: 0.95em; background: ${getStatusColor(tache.statut)}; color: white; display: block; width: 100%;">
                        ${getStatusText(tache.statut)}
                    </span>
                </td>
                <td class="summary-progress-cell" style="width: 8%; padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <select data-task-id="${tache.id}" class="progress-select"
                            style="padding: 6px 8px; border: none; border-radius: 12px; font-weight: 600; text-align: center; background: #ecf0f3; color: #000000; cursor: pointer; box-shadow: 5px 5px 10px rgba(163, 177, 198, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.7); transition: all 0.3s ease; width: 90px;">
                        <option value="0" ${tache.avancement === 0 ? 'selected' : ''}>0%</option>
                        <option value="25" ${tache.avancement === 25 ? 'selected' : ''}>25%</option>
                        <option value="50" ${tache.avancement === 50 ? 'selected' : ''}>50%</option>
                        <option value="75" ${tache.avancement === 75 ? 'selected' : ''}>75%</option>
                        <option value="100" ${tache.avancement === 100 ? 'selected' : ''}>100%</option>
                    </select>
                </td>
                <td style="width: 5%; padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <span style="padding: 8px; border-radius: 12px; font-size: 0.95em; font-weight: 600; background: ${etatInfo.bgColor}; color: ${etatInfo.color}; display: block; width: 100%; box-shadow: 3px 3px 6px rgba(163, 177, 198, 0.4);">
                        ${etatInfo.texte}
                    </span>
                </td>
                <td style="width: 37%; padding: 10px; border: 1px solid #ddd;">
                    <input type="text" value="${tache.commentaire || ''}" placeholder="Ajouter un commentaire..."
                           class="commentaire-input" data-task-id="${tache.id}"
                           style="width: 100%; padding: 8px 10px; border: none; border-radius: 12px; background: #ecf0f3; color: #000000; box-shadow: inset 3px 3px 6px rgba(163, 177, 198, 0.5), inset -3px -3px 6px rgba(255, 255, 255, 0.5);">
                </td>
            `;

            tbody.appendChild(taskRow);
        });
    });

    // Ajouter les événements de changement pour les selects d'avancement
    const progressSelects = tbody.querySelectorAll('.progress-select');
    progressSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const taskId = e.currentTarget.dataset.taskId;
            const newProgress = parseInt(e.currentTarget.value);

            console.log(`[SUMMARY] Changement avancement pour ${taskId}: ${newProgress}%`);

            // Mettre à jour l'avancement
            const success = updateTaskProgress(taskId, newProgress);

            if (success) {
                console.log(`[SUMMARY] Avancement mis à jour avec succès`);
                // Rafraîchir le tableau pour montrer les changements de statut
                renderSummaryTable();
            } else {
                console.error(`[SUMMARY] Échec de mise à jour de l'avancement`);
                renderSummaryTable();
            }
        });
    });

    // Ajouter les événements pour les inputs de commentaire
    const commentaireInputs = tbody.querySelectorAll('.commentaire-input');
    commentaireInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const taskId = e.currentTarget.dataset.taskId;
            const newCommentaire = e.currentTarget.value;

            console.log(`[SUMMARY] Changement commentaire pour ${taskId}: ${newCommentaire}`);

            // Mettre à jour le commentaire
            const success = updateTask(taskId, { commentaire: newCommentaire });

            if (success) {
                console.log(`[SUMMARY] Commentaire mis à jour avec succès`);
            } else {
                console.error(`[SUMMARY] Échec de mise à jour du commentaire`);
            }
        });
    });

    // Ajouter les événements pour les boutons responsable (ouverture d'une modale)
    const responsableButtons = tbody.querySelectorAll('.responsable-button');
    responsableButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Utiliser currentTarget pour toujours obtenir le bouton, même si on clique sur le texte
            const taskId = e.currentTarget.dataset.taskId;
            console.log(`[SUMMARY] Ouverture sélection responsable pour ${taskId}`);
            openResponsibleModalForTask(taskId);
        });
    });

    console.log(`[OK] Tableau de préparation rendu: ${phases.length} phases`);
}

/**
 * Obtenir les phases de préparation depuis arretData
 * IMPORTANT: Retourne les données depuis le localStorage pour avoir les mises à jour en temps réel
 *
 * Note: arretData.phases est maintenant toujours complet grâce à ensureCompletePhases()
 * appelé au démarrage dans init.js
 */
export async function getPreparationPhases() {
    // Charger les données depuis arretData (qui est déjà synchronisé avec localStorage)
    const allPhases = arretData.phases;

    // Fallback au cas où arretData serait vide
    if (!allPhases || allPhases.length === 0) {
        console.warn('[SUMMARY] ⚠️ arretData.phases est vide!');
        console.warn('[SUMMARY] Cela peut arriver si le localStorage a été nettoyé.');
        console.warn('[SUMMARY] Rechargez la page (Ctrl+F5) pour synchroniser avec le serveur.');

        // Retourner les données par défaut pour éviter les erreurs
        return await getDefaultPreparationPhases();
    }

    // Vérifier si on a toutes les phases (devrait avoir 15 phases complètes)
    if (allPhases.length < 10) {
        console.warn(`[SUMMARY] ⚠️ Seulement ${allPhases.length} phases chargées (attendu: 15)`);
        console.warn('[SUMMARY] 💡 Astuce: Rechargez la page pour synchroniser avec le serveur.');
    }

    // Récupérer la date de début de l'arrêt depuis les paramètres
    const startDate = await getStartDate();

    // Calculer les dates pour chaque phase en fonction de la date de début et du nombre de semaines
    allPhases.forEach(phase => {
        // Calculer la date de la phase
        if (phase.semaines !== undefined) {
            phase.date = calculatePhaseDate(startDate, phase.semaines);
        }

        // CORRECTIFS: S'assurer que les tâches pointent vers les bonnes pages
        if (phase.taches) {
            phase.taches.forEach(tache => {
                // T35: TRAITER LES TRAVAUX D'ENTREPRENEUR EN RÉV TRAVAUX
                if (tache.id === 't35') {
                    tache.clickable = true;
                    tache.page = 'detail-travaux-entrepreneur';
                    console.log('[SUMMARY] ✅ Correctif appliqué pour t35: page = detail-travaux-entrepreneur');
                }

                // T28: PRÉPARER PLANIFICATIONS DES TPAA → CONNAITRE LA LISTES DES TPAA
                if (tache.id === 't28') {
                    tache.clickable = true;
                    tache.page = 'detail-t20-t21';
                    console.log('[SUMMARY] ✅ Correctif appliqué pour t28: page = detail-t20-t21');
                }

                // T33: PRIORISATION DES DEMANDES GÉNÉRÉES → page de priorisation
                if (tache.id === 't33') {
                    tache.clickable = true;
                    tache.page = 'detail-t33';
                    console.log('[SUMMARY] ✅ Correctif appliqué pour t33: page = detail-t33');
                }

                // T40: PRÉSENTATION AUX ENTREPRENEURS → page de présentation
                if (tache.id === 't40') {
                    tache.clickable = true;
                    tache.page = 'detail-t40';
                    console.log('[SUMMARY] ✅ Correctif appliqué pour t40: page = detail-t40');
                }

                // T73: FOURNIR LISTE DES PO POUR SUIVI DE COÛTS → même page que CRÉATION DE LA DA
                if (tache.id === 't73') {
                    tache.clickable = true;
                    tache.page = 'detail-t25';
                    console.log('[SUMMARY] ✅ Correctif appliqué pour t73: page = detail-t25');
                }

                // T82: SÉLECTIONNER QUELS TRAVAUX DOIT AVOIR UN AMDEC → même page que ÉTABLIR CHEMIN CRITIQUE
                if (tache.id === 't82') {
                    tache.clickable = true;
                    tache.page = 'detail-t71';
                    console.log('[SUMMARY] ✅ Correctif appliqué pour t82: page = detail-t71');
                }
            });
        }
    });

    // Retourner toutes les phases avec les statuts à jour
    console.log(`[SUMMARY] Chargement de ${allPhases.length} phases depuis arretData`);
    return allPhases;
}

/**
 * Obtenir les phases de préparation par défaut (fallback)
 * EXPORTÉ pour être utilisé par arret-data.js lors de l'initialisation
 *
 * IMPORTANT: Cette fonction contient les 148 tâches exactes du vieux HTML
 * avec les titres complets et les propriétés clickable/page correctes.
 */
export async function getDefaultPreparationPhases() {
    const taskDetailsPages = {
        't3': 'detail-t3',
        't4': 'detail-t4',
        't5': 'detail-t5',
        't8': 'detail-t8',
        't9': 'detail-t9',
        't10': 'detail-t10',
        't11': 'detail-t11',
        't12': 'detail-t12',
        't13': 'detail-t13',
        't14': 'detail-t14',
        't15': 'detail-t15',
        't16': 'detail-t16',
        't17': 'detail-t17',
        't18': 'detail-t18',
        't19': 'detail-t19',
        't21': 'detail-t21',
        't22': 'detail-t22',
        't23': 'detail-t23',
        't24': 'detail-t24',
        't25': 'detail-t25',
        't26': 'detail-t26',
        't27': 'detail-t27',
        't29': 'detail-t29',
        't30': 'detail-suivi-pieces-delai',
        't35': 'detail-t35',
        't49': 'detail-suivi-pieces-delai',
        't88': 'detail-suivi-pieces-delai',
        't43': 'detail-t43',
        't45': 'detail-t45',
        't50': 'detail-t50',
        't51': 'detail-t51',
        't55': 'detail-t55',
        't57': 'detail-t57',
        't58': 'detail-t58',
        't62': 'detail-t62',
        't63': 'detail-t63',
        't64': 'detail-t64',
        't65': 'detail-t65',
        't66': 'detail-t66',
        't67': 'detail-t67',
        't69': 'detail-t69',
        't70': 'detail-t70',
        't71': 'detail-t71',
        't72': 'detail-t72',
        't73': 'detail-t25',
        't75': 'detail-t75',
        't79': 'detail-t79',
        't82': 'detail-t71',
        't87': 'detail-t87',
        't90': 'detail-t90',
        't91': 'detail-t91',
        't93': 'detail-t93',
        't94': 'detail-t94',
        't95': 'detail-t95',
        't99': 'detail-t99',
        't100': 'detail-t100',
        't109': 'detail-t109',
        't110': 'detail-t110',
        't128': 'detail-t128',
        't131': 'detail-t131',
        't132': 'detail-t132',
        't136': 'detail-t136',
        't139': 'detail-t139'
    };

    const phases = [
        {
            id: 'phase-1',
            nom: '-26 SEMAINES AVANT ARRÊT',
            semaines: -26,
            taches: [
                { id: 't1', titre: "CRÉER DOSSIER DANS LE U POUR L\'ARRET DE L\'ANNÉE", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted', commentaire: "U:\\Acierie\\entretien\\Arrêts Annuels\\1. Années\\AAA2026" },
                { id: 't2', titre: "MISE À JOUR DES GAMMES ET PLANS D\'ENTRETIEN APRÈS L\'ARRÊT ANNUEL PRÉCÉDENT", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't3', titre: "VALIDATION DES PLANS D\'ENTRETIEN À LONG DÉLAI", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't4', titre: "AVOIR LA LISTE DES PROJETS / TRAVAUX MAJEURS ENTRETIEN QUI SERONT FAIT À L\'ARRÊT", avancement: 0, planifie: 1, responsable: 'CE', statut: 'notstarted' },
                { id: 't5', titre: "CONVOQUER RENCONTRE DE DÉFINITION ET CONCERTATION DE L\'ARRÊT", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't6', titre: "ÉTABLIR DATES ET DURÉE DE L\'ARRÊT", avancement: 0, planifie: 1, responsable: 'CE', statut: 'notstarted' },
                { id: 't7', titre: "ÉTABLIR QUANTITÉ DE RESSOURCES PLANIFICATIONS REQUISE", avancement: 0, planifie: 1, responsable: 'CE', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-8',
            nom: '-24 SEMAINES AVANT ARRÊT',
            semaines: -24,
            taches: [
                { id: 't8', titre: "RÉVISION DE LA LISTE DES TRAVAUX (AVIS / ORDRE RELATIFS AUX TRAVAUX (SAP)", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't9', titre: "OBTENIR LA LISTE DES MAINTENANCES CAPITALISABLES", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't10', titre: "SCOPE PAR SECTEURS DES TRAVAUX - CONVERTISSEUR", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't11', titre: "SCOPE PAR SECTEURS DES TRAVAUX - FOSSE", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't12', titre: "SCOPE PAR SECTEURS DES TRAVAUX - HALLE 1", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't13', titre: "SCOPE PAR SECTEURS DES TRAVAUX - HALLE 2", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't14', titre: "SCOPE PAR SECTEURS DES TRAVAUX - PONT ROULANT", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't15', titre: "SCOPE PAR SECTEURS DES TRAVAUX - TOURELLE ET MACC NIV 24", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't16', titre: "SCOPE PAR SECTEURS DES TRAVAUX - COULÉE CONTINUE - ARC DE COULÉE", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't17', titre: "SCOPE PAR SECTEURS DES TRAVAUX - EXPÉDITION", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't18', titre: "SCOPE PAR SECTEURS DES TRAVAUX - TOURS D'EAU", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' },
                { id: 't19', titre: "LISTE DES PSV", avancement: 0, planifie: 1, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-20',
            nom: '-20 SEMAINES AVANT ARRÊT',
            semaines: -20,
            taches: [
                { id: 't20', titre: "DÉFINIR LE BUDGET DE L\'ARRÊT ANNUEL", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't21', titre: "CONNAITRE L\'IMPLICATION DU SERVICE INCENDIE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't22', titre: "PROJET(S) INGQ A INCLURES DANS CALENDRIER", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't23', titre: "RENCONTRE DE DÉFINITION D\'ARRÊT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t23' },
                { id: 't24', titre: "NOMMER L\'ÉQUIPE DE GESTION D\'ARRÊTS (D6.0)", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't25', titre: "CRÉATION DE LA DA (ACHETEUR 653)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t25' },
                { id: 't26', titre: "CONNAITRE LA LISTES DES TPAA", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-27',
            nom: '-18 SEMAINES AVANT ARRÊT',
            semaines: -18,
            taches: [
                { id: 't27', titre: "ÉTABLIR UNE STRATÉGIE D\'APPROVISIONNEMENT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't28', titre: "PRÉPARER PLANIFICATIONS DES TPAA", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t20-t21' },
                { id: 't29', titre: "DEMANDER LISTE OFFICIELS DES VPO À LA PRODUCTION", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't30', titre: "COMMANDE LONG DÉLAI", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-suivi-pieces-delai' }
            ]
        },
        {
            id: 'phase-32',
            nom: '-16 SEMAINES AVANT ARRÊT',
            semaines: -16,
            taches: [
                { id: 't33', titre: "PRIORISATION DES DEMANDES GÉNÉRÉES.", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t33' },
                { id: 't34', titre: "PLANIFICATION DÉTAILLÉE DES TRAVAUX", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't35', titre: "DÉTERMINER LES TRAVAUX À FAIRE PAR L\'ENTREPRENEUR", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-travaux-entrepreneur' },
                { id: 't36', titre: "VALIDATION DU REGISTRE D\'INSPECTION DES ÉQUIPEMENT DE LEVAGE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t36' },
                { id: 't37', titre: "RENCONTRE DE CONCERTATION D\'ARRÊT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t37' },
                { id: 't38', titre: "INFORMER LES EMPLOYES ENTRETIEN ET OPERATION DE LA DATE D\'ARRET (MEMOS OFFICIELS)", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't39', titre: "DIFFUSER AU COORDONATEUR DES SURVEILLANTS DE CHANTIER LES DATES DE L\'ARRÊT", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't40', titre: "PRÉSENTATION AUX ENTREPRENEURS DU SCOPE POUR SOUMISSIONS (DÉLAI 2 SEM.)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t40' },
                { id: 't41', titre: "PLANIFIER L\'INSPECTION DES EQUIPEMENTS DE LEVAGE REQUIS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t41' },
                { id: 't42', titre: "DÉBUT DES TPAA", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t26' }
            ]
        },
        {
            id: 'phase-43',
            nom: '-14 SEMAINES AVANT ARRÊT',
            semaines: -14,
            taches: [
                { id: 't43', titre: "ÉTABLIR LA DATE DE L\'ARRÊT ÉLECTRIQUE (MEMOS OFFICIELS)", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't44', titre: "ÉMETTRE MÉMO POUR L\'ARRÊT ÉLECTRIQUE", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't45', titre: "ÉTABLIR LA LISTE DES TRAVAUX EN ESPACE CLOS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't46', titre: "FAIRE LA TOURNÉE DES ESPACE CLOS, RECLASSIFIER SI NÉCESSAIRE, ÉTABLIR MATÉRIEL NÉCESSAIRE.", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't47', titre: "INSCRIRE LES NUMÉRO D\'ESPACE CLOS POUR LES TRAVAUX CONCERNÉ DANS L\'ÉCHÉANCIER", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't48', titre: "FAIRE DEMANDE D\'ÉTUDIANT POUR SURVEILLANCE DES ESPACES CLOS", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't49', titre: "FAIRE LES COMMANDES À LONG DÉLAI 60J", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-suivi-pieces-delai' },
                { id: 't50', titre: "FAIRE RENCONTRE POUR LES TRAVAUX DES TOURS DE REFROIDISSEMENT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t50' },
                { id: 't51', titre: "DÉPÔT DES SOUMISSIONS DES ENTREPRENEURS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t51' }
            ]
        },
        {
            id: 'phase-52',
            nom: '-12 SEMAINES AVANT ARRÊT',
            semaines: -12,
            taches: [
                { id: 't52', titre: "FAIRE APPROUVER UNE STRATÉGIE D\'APPROVISIONNEMENT", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't54', titre: "LANCER LA DA AVEC PRIX SOUMISSIONNÉS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't55', titre: "FAIRE DEVIS ET CORRECTION", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t55' },
                { id: 't56', titre: "ÉTABLIR LA LISTE DES INSPECTIONS NDT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t56' },
                { id: 't57', titre: "ÉTABLIR LES BESOIN EN ÉQUIPEMENTS DE TRAVAIL EN HAUTEUR", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-equipements-hauteur' },
                { id: 't58', titre: "PLANIFIER LES RENCONTRES DE PRÉPARATION ARRÊT HEBDO", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-rencontres-hebdo' },
                { id: 't59', titre: "METTRE À JOUR LE MODÈLE MS PROJECT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't60', titre: "DEMANDER ÉCHÉANCIER DÉTAILLÉ AUX CHARGÉS DE PROJETS (DÉLAI 2 SEM.)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't61', titre: "RENCONTRE AVEC GROUPE TECHNIQUE ENTRETIEN POUR DÉFINIR LISTE DE TRAVAUX", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't62', titre: "ÉVALUER BESOIN ÉLECTRIQUES ARRÊT (PRISE DE SOUDURE)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't63', titre: "ZONES ENTREPOSAGES & PLAN DE LOCALISATION", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-zones-entreposage' },
                { id: 't64', titre: "REVISER PROTOCOLE D\'ARRÊT ET DRAINAGE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-65',
            nom: '-10 SEMAINES AVANT ARRÊT',
            semaines: -10,
            taches: [
                { id: 't65', titre: "DEMANDER PLAN DE LEVAGE POUR LES LEVAGES IMPORTANTS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't66', titre: "VALIDER AVEC MAGASIN CAPACITÉ DE TRAITEMENTS DES LOTS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't67', titre: "FOURNIR LA LISTE DES GROSSE PIÈCE AU MAGASIN", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't68', titre: "ÉTABLIR LES BESOINS DE NETTOYAGE POUR CHACUNE DES JOBS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t68' },
                { id: 't69', titre: "FOURNIR LES ECHÉANCIERS FINALES DES PROJETS (INCLUANT PLAN VPO)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't70', titre: "ÉTABLIR LES BESOINS EN ÉCHAFAUD", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't71', titre: "ÉTABLIR CHEMIN CRITIQUE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-72',
            nom: '-8 SEMAINES AVANT ARRÊT',
            semaines: -8,
            taches: [
                { id: 't72', titre: "ÉTABLIR LE PROCESSUS DE SUIVI DE COÛT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't73', titre: "FOURNIR LISTE DES PO POUR SUIVI DE COÛTS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t25' },
                { id: 't75', titre: "VALIDATION LIVRAISON DES OSCILLATEURS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't76', titre: "ENVOI DES DEVIS AUX ENTREPRENEURS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t55' },
                { id: 't77', titre: "ÉMETTRE MÉMO POUR TRAVAUX DANS TUNNEL DE TRANSFERT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't78', titre: "RENCONTRE PRÉ-ARRÊT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t78' },
                { id: 't79', titre: "RÉSERVATION ÉQUIPEMENTS EN LOCATION (EX: ROULOTTES, GÉNÉRATRICE, ETC)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't80', titre: "S\'ASSURER D\'AVOIR ET D\'INSPECTER LES EQUIPEMENTS DE LEVAGE REQUIS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't81', titre: "MISE EN COMMUN DES ÉCHÉANCIERS (GANTT)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't82', titre: "SÉLECTIONNER QUELS TRAVAUX DOIT AVOIR UN AMDEC", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't83', titre: "PRÉPARER ADJUDICATION SYNDICALE SI REQUIS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-t83' },
                { id: 't84', titre: "DONNER LA LISTE DES TRAVAUX AUX RESPONSABLES DU VERROUILLAGE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't85', titre: "PRÉPARATION DES ANALYSES DE RISQUES POUR TOUS LES TRAVAUX ENTRETIEN", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't86', titre: "VALIDATION DES DEMANDES DE VERROUILLAGES VIA COURRIEL DE SUIVI.", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-87',
            nom: '-7 SEMAINES AVANT ARRÊT',
            semaines: -7,
            taches: [
                { id: 't87', titre: "SMED ARRÊT SUR CHEMIN CRITIQUES", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't88', titre: "FAIRE LES COMMANDES À LONG DÉLAI 30J", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted', clickable: true, page: 'detail-suivi-pieces-delai' }
            ]
        },
        {
            id: 'phase-89',
            nom: '-6 SEMAINES AVANT ARRÊT',
            semaines: -6,
            taches: [
                { id: 't90', titre: "COMMANDE DES CONSOMMABLES D\'ARRÊT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't91', titre: "FAIRE VISITE DES SOUMISSIONNAIRES ( CHANGEMENT DE CONVERTISSEUR)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't92', titre: "FOURNIR LE PLAN DE LIVRAISON POUR LA LIVRAISON DES GROSSES PIÈCES", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't93', titre: "VALIDATION DE POINTS DE PURGES GAZ CO", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't94', titre: "RENCONTRE AVEC L\'ÉQUIPE DU GAZ CO ( POUR L\'ARRÊT DU GAZ CO)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't95', titre: "ÉTABLIR LES ZONES DE VERROUILLAGE", avancement: 0, planifie: 0.0001, responsable: 'VER', statut: 'notstarted' },
                { id: 't96', titre: "ÉCRIRE LES ZONES DE VERROUILLAGE DE CHAQUE TRAVAUX DANS LES ÉCHÉANCIERS", avancement: 0, planifie: 0.0001, responsable: 'VER', statut: 'notstarted' },
                { id: 't97', titre: "FAIRE LE REPÉRAGE DE CHAQUE FICHE", avancement: 0, planifie: 0.0001, responsable: 'VER', statut: 'notstarted' },
                { id: 't98', titre: "FAIRE PLAN DE LOCALISATION DES ZONES DE VERROUILLAGE", avancement: 0, planifie: 0.0001, responsable: 'VER', statut: 'notstarted' },
                { id: 't99', titre: "RÉALISER LES AMDEC SUR LES TÂCHES CRITIQUES (ONGLET PL-10)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't100', titre: "CONCEVOIR LE PLAN D\'AMÉNAGEMENT (CHANTIER ET ROULOTTE)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't101', titre: "INTÉGRER LES PLANS VPO DE TOUS LES TRAVAUX", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't102', titre: "GEL DES TRAVAUX GELER L\'ENVERGURE DE L\'ARRÊT (UTLISER PROCEDURE POUR AJOUT)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-104',
            nom: '-4 SEMAINES AVANT ARRÊT',
            semaines: -4,
            taches: [
                { id: 't105', titre: "LIVRAISON DES LOTS MÉCAN.: 3 SEMAINE AVANT TÂCHE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't106', titre: "LIVRAISON DES LOTS ÉLECT.: 3 SEMAINE AVANT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't107', titre: "LIVRAISON DES LOTS TPAA.: 3 SEMAINE AVANT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't108', titre: "FAIRE ENTENTE AVEC LE MAGASIN (CHARIOT ÉLÉVATEUR, COMMIS, BOOMTRUCK)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't109', titre: "RÉDACTION DES TÂCHES COGNIBOX", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't111', titre: "RENCONTRE SYNDICALE POUR PRÉSENTATION TRAVAUX SOUS-TRAITANCE", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't112', titre: "ÉTABLIR HORAIRE DES RENCONTRES (N3) DE SHUT DOWN", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't113', titre: "ÉTABLIR QUANTITÉ DE RESSOURCES SUPERVISIONS REQUISE", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't114', titre: "ÉTABLIR PLAN DE MITIGATION EN CAS DE MANQUE DE MAIN D\'OEUVRE CADRE", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't115', titre: "ÉTABLIR UN PLAN DE MITIGATION EN CAS DE MANQUE DE MAIN D\'OEUVRE SYNDIQUÉ ( FORCER LES EMPLOYÉS À TRAVAILLER OU DÉROGATION AU ENTREPRENEUR)", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't116', titre: "REVUE ÉCHÉANCIER AVEC LES ENTREPRENEURS PRINCIPAUX", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't118', titre: "PRÉSENTATION À LA DIRECTION DES GRANDES LIGNES DE L\'ARRÊT - DOCUMENT SHAREPOINT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-119',
            nom: '-2 SEMAINES AVANT ARRÊT',
            semaines: -2,
            taches: [
                { id: 't119', titre: "DETERMINER LA DATE EXACTE DE L\'ARRÊT - Dernier Tap", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't121', titre: "FAIRE HORAIRE DE TRAVAIL POUR L\'ÉQUIPE DE GESTION DE L\'ARRÊT (Gestion de la fatigue)", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't122', titre: "VALIDATION DES PIECES MANQUANTES", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't123', titre: "PRÉSENTATION DES TRAVAUX A L\'ÉQUIPE D\'ENTRETIEN (MEC/ELE)", avancement: 0, planifie: 0.0001, responsable: 'SPM', statut: 'notstarted' },
                { id: 't124', titre: "FOURNIR PLAN DE COMMUNICATION PROJET", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't125', titre: "VÉRIFIER COGNIBOX ENTREPRENEURS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't127', titre: "APPROBATION DES TRAVAUX", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't128', titre: "FOURNIR LA LISTE DES TRAVAUX NON ÉLECTRIQUE FAIT PENDANT L\'ARRÊT ÉLECTRIQUE AU SERVICE INCENDIE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't129', titre: "DIFFUSION GÉNÉRAL DES ÉCHÉANCIERS AVEC TOUS LES INTERVENANTS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-130',
            nom: '-1 SEMAINE AVANT ARRÊT',
            semaines: -1,
            taches: [
                { id: 't137', titre: "SUIVI -TOUTE LES SEMAINE A PARTIR DE -60J", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't137', titre: "SUIVI -TOUTE LES SEMAINE A PARTIR DE -60J", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't130', titre: "PLANIFIER RENCONTRE SÉCURITÉ POUR EMPLOYÉS (3 TABLEAUX DE BORD) + POOL", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't131', titre: "REVUE SÉCURITÉ", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't132', titre: "INFORMER LES BESOINS DE PERMIS DE FEU", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't133', titre: "DIFFUSION DES DIRECTIVES SSE ENTREPRENEURS", avancement: 0, planifie: 0.0001, responsable: 'CE', statut: 'notstarted' },
                { id: 't134', titre: "MOBILISATION (ROULOTTES, COMPRESSEUR, ENTREPRNEURS, ETC)", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' },
                { id: 't135', titre: "ENVOYER CONVOCATION POUR RENCONTRE DE SUIVI DE L\'ARRÊT (EXÉCUTION)", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't136', titre: "RÉVISION FINALE DU PROTOCOLE D\'ARRÊT ET DÉMARRAGE", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't137', titre: "SUIVI -TOUTE LES SEMAINE A PARTIR DE -60J", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't138', titre: "FAIRE ENTRER LES ROULOTTES SUR LE SITE", avancement: 0, planifie: 0.0001, responsable: 'SE', statut: 'notstarted' }
            ]
        },
        {
            id: 'phase-140',
            nom: 'PENDANT ARRÊT',
            semaines: 0,
            taches: [
                { id: 't140', titre: "FAIRE RENCONTRE GÉNÉRAL POUR LES ENTREPRENEURS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't141', titre: "REVUE DE LA SÉQUENCE DE L\'ÉCHÉANCIER POUR LES 3 PREMIERS JOURS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't142', titre: "RÉVISION DES SÉQUENCES DE PRÉPARATION ET DE REMISE OPÉRATIONELLE DES ÉQUIPEMENTS.", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't143', titre: "PRÉSENTATION DES TRAVAUX À L\'ÉQUIPE D\'OPÉRATION", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't144', titre: "SIMULATION D\'UNE RENCONTRE DE SHUTDOWN", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't145', titre: "PREPARER LES TABLEAUX DE SUIVI DE L\'ARRÊT", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't146', titre: "PREPARER FICHIER DU POINT DE PRESSE JOURNALIERS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' },
                { id: 't147', titre: "JOUR -1: CONFIRMER L\'HEURE FINALE D\'ARRÊT VS SÉQUENCE DES FOURS", avancement: 0, planifie: 0.0001, responsable: 'PL', statut: 'notstarted' }
            ]
        }
    ];

    // Récupérer la date de début de l'arrêt depuis les paramètres
    const startDate = await getStartDate();

    // Add clickable and commentaire properties, et calculer les dates
    phases.forEach(phase => {
        // Calculer la date de la phase
        if (phase.semaines !== undefined) {
            phase.date = calculatePhaseDate(startDate, phase.semaines);
        }

        phase.taches.forEach(task => {
            if (taskDetailsPages[task.id]) {
                task.clickable = true;
                task.page = taskDetailsPages[task.id];
            }
            if (!task.commentaire) {
                task.commentaire = '';
            }
        });
    });

    return phases;
}

/**
 * Obtenir le texte du statut
 */
function getStatusText(status) {
    const map = {
        'notstarted': 'Non démarré',
        'inprogress': 'En cours',
        'completed': 'Terminé',
        'cancelled': 'Annulé'
    };
    return map[status] || status;
}

/**
 * Obtenir la couleur du statut
 * Aligné avec les couleurs du Kanban pour cohérence visuelle
 */
function getStatusColor(status) {
    const map = {
        'notstarted': '#dc3545',  // Rouge (même que Kanban)
        'inprogress': '#ffc107',  // Jaune/Orange (même que Kanban)
        'completed': '#28a745',   // Vert (même que Kanban)
        'cancelled': '#e83e8c'    // Rose (même que Kanban)
    };
    return map[status] || '#dc3545';
}

/**
 * Obtenir la couleur de la barre de progression
 */
function getProgressColor(percent) {
    if (percent >= 100) return '#4a7c59';
    if (percent >= 75) return '#667eea';
    if (percent >= 50) return '#ffc107';
    return '#f5576c';
}

/**
 * Obtenir l'info de l'état selon la date
 */
function getEtatInfo(tache, phaseDate, today) {
    const taskDate = new Date(phaseDate);
    const todayDate = today;

    if (tache.statut === 'completed') {
        return { texte: 'Complété', color: 'white', bgColor: '#4a7c59' };
    }

    if (tache.statut === 'cancelled') {
        return { texte: 'Annulé', color: 'white', bgColor: '#999' };
    }

    if (taskDate < todayDate) {
        return { texte: 'En retard', color: 'white', bgColor: '#c5554a' };
    } else if (taskDate.toDateString() === todayDate.toDateString()) {
        return { texte: 'Aujourd\'hui', color: 'white', bgColor: '#f093fb' };
    } else {
        return { texte: 'À venir', color: '#000', bgColor: '#ffc107' };
    }
}



