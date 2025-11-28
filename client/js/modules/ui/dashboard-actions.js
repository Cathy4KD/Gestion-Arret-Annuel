/**
 * Module des actions du Dashboard
 * Gère l'interactivité des cartes de tâches importantes
 * @module ui/dashboard-actions
 */

import { showModal } from './dashboard-modals.js';

/**
 * Affiche les détails d'une tâche importante dans une modale
 * @param {string} type - Type de tâche ('encours', 'prochaine', 'retard')
 */
export function showTaskDetails(type) {
    const taskData = getTaskData(type);

    let content = `
        <div style="background: linear-gradient(135deg, ${taskData.bgColor1}, ${taskData.bgColor2}); padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid ${taskData.borderColor}; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <div style="background: ${taskData.iconBg}; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                    ${taskData.icon}
                </div>
                <div>
                    <div style="font-size: 0.9em; color: #666; font-weight: 500;">${taskData.label}</div>
                    <div style="font-size: 1.8em; font-weight: bold; color: #333; margin-top: 5px;">${taskData.title}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                <div style="background: rgba(255,255,255,0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">Phase</div>
                    <div style="font-size: 1.2em; font-weight: bold; color: #333;">${taskData.phase}</div>
                </div>
                <div style="background: rgba(255,255,255,0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">Responsable(s)</div>
                    <div style="font-size: 1.2em; font-weight: bold; color: #333;">${taskData.responsable}</div>
                </div>
                <div style="background: rgba(255,255,255,0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">Échéance</div>
                    <div style="font-size: 1.2em; font-weight: bold; color: ${taskData.echeanceColor};">${taskData.echeance}</div>
                </div>
            </div>

            ${taskData.avancement ? `
                <div style="margin-top: 20px; background: rgba(255,255,255,0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Avancement</div>
                    <div style="background: #e0e0e0; height: 12px; border-radius: 6px; overflow: hidden;">
                        <div style="background: ${taskData.borderColor}; height: 100%; width: ${taskData.avancement}%; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="font-size: 1.1em; font-weight: bold; margin-top: 8px; color: ${taskData.borderColor};">${taskData.avancement}%</div>
                </div>
            ` : ''}
        </div>

        <h4 style="margin: 25px 0 15px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
            📋 Description détaillée
        </h4>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid ${taskData.borderColor};">
            <p style="margin: 0; line-height: 1.6; color: #555;">
                ${taskData.description}
            </p>
        </div>

        ${taskData.actions && taskData.actions.length > 0 ? `
            <h4 style="margin: 25px 0 15px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                ✓ Actions requises
            </h4>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <ul style="margin: 0; padding-left: 20px;">
                    ${taskData.actions.map(action => `
                        <li style="margin-bottom: 10px; line-height: 1.6; color: #555;">
                            <strong style="color: #333;">${action.titre}</strong>
                            ${action.description ? `<br><span style="font-size: 0.9em; color: #666;">${action.description}</span>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}

        ${taskData.documents && taskData.documents.length > 0 ? `
            <h4 style="margin: 25px 0 15px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                📄 Documents associés
            </h4>
            <div style="display: grid; gap: 10px;">
                ${taskData.documents.map(doc => `
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#667eea';" onmouseout="this.style.background='white'; this.style.borderColor='#dee2e6';">
                        <div style="font-size: 24px;">📎</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #333;">${doc.nom}</div>
                            <div style="font-size: 0.85em; color: #666;">${doc.type} • Modifié: ${doc.date}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="alert('Fonction à venir')" class="btn" style="background: linear-gradient(145deg, #667eea, #764ba2); color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Modifier la tâche
            </button>
        </div>
    `;

    showModal(taskData.title, content, 'large');
}

/**
 * Retourne les données d'une tâche selon son type
 * @param {string} type - Type de tâche
 * @returns {Object} Données de la tâche
 */
function getTaskData(type) {
    const tasks = {
        encours: {
            label: 'Tâche En Cours',
            title: 'ÉTABLIR DATES ET DURÉE DE L\'ARRÊT',
            phase: 'Phase -26 Semaines',
            responsable: 'CE/SE',
            echeance: '30/09/2025',
            echeanceColor: '#ffc107',
            avancement: 75,
            icon: '⚙️',
            iconBg: '#fff3cd',
            borderColor: '#ffc107',
            bgColor1: 'rgba(255, 193, 7, 0.1)',
            bgColor2: 'rgba(255, 193, 7, 0.05)',
            description: `
                Cette tâche consiste à définir précisément les dates de début et de fin de l'arrêt annuel 2026,
                ainsi que sa durée totale. Il est crucial d'établir ces paramètres le plus tôt possible car ils
                influencent toute la planification des travaux, la mobilisation des ressources et la coordination
                avec les différents intervenants.
                <br><br>
                <strong>Objectifs:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li>Confirmer la période optimale pour l'arrêt</li>
                    <li>Établir la durée nécessaire pour tous les travaux</li>
                    <li>Coordonner avec les équipes de production</li>
                    <li>Valider avec la direction</li>
                </ul>
            `,
            actions: [
                {
                    titre: 'Analyser l\'historique des arrêts précédents',
                    description: 'Examiner les durées et périodes des 3 derniers arrêts annuels'
                },
                {
                    titre: 'Consulter les équipes de maintenance',
                    description: 'Recueillir les besoins en temps pour les différents travaux planifiés'
                },
                {
                    titre: 'Coordonner avec la production',
                    description: 'Identifier la période la moins impactante pour la production'
                },
                {
                    titre: 'Obtenir l\'approbation de la direction',
                    description: 'Présenter la proposition et obtenir la validation finale'
                }
            ],
            documents: [
                { nom: 'Calendrier prévisionnel 2026', type: 'Excel', date: '15/09/2025' },
                { nom: 'Historique arrêts 2023-2025', type: 'PDF', date: '10/09/2025' },
                { nom: 'Proposition dates arrêt', type: 'Word', date: '20/09/2025' }
            ]
        },
        prochaine: {
            label: 'Prochaine Tâche',
            title: 'SCOPE PAR SECTEURS DES TRAVAUX - CONVERTISSEUR',
            phase: 'Phase -24 Semaines',
            responsable: 'PL',
            echeance: '14/10/2025',
            echeanceColor: '#667eea',
            avancement: 0,
            icon: '📋',
            iconBg: '#e7f0ff',
            borderColor: '#667eea',
            bgColor1: 'rgba(102, 126, 234, 0.1)',
            bgColor2: 'rgba(118, 75, 162, 0.05)',
            description: `
                Cette tâche vise à établir le périmètre (scope) complet des travaux à réaliser sur le secteur
                du convertisseur durant l'arrêt annuel. Il s'agit d'identifier, de documenter et de planifier
                l'ensemble des interventions nécessaires sur cet équipement critique.
                <br><br>
                <strong>Points clés:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li>Inspection et évaluation de l'état du convertisseur</li>
                    <li>Liste des pièces à remplacer ou réparer</li>
                    <li>Ressources humaines et matérielles nécessaires</li>
                    <li>Estimation des durées d'intervention</li>
                </ul>
            `,
            actions: [
                {
                    titre: 'Réunion avec l\'équipe maintenance convertisseur',
                    description: 'Discuter des travaux identifiés et des priorités'
                },
                {
                    titre: 'Inspection préliminaire du convertisseur',
                    description: 'Effectuer un diagnostic de l\'état actuel de l\'équipement'
                },
                {
                    titre: 'Rédiger le document de scope',
                    description: 'Compiler toutes les interventions dans un document structuré'
                },
                {
                    titre: 'Validation par l\'ingénierie',
                    description: 'Faire approuver le scope par les responsables techniques'
                }
            ],
            documents: [
                { nom: 'Template scope secteur', type: 'Excel', date: '01/10/2025' },
                { nom: 'Rapports inspection 2025', type: 'PDF', date: '05/10/2025' },
                { nom: 'Liste pièces convertisseur', type: 'Excel', date: '08/10/2025' }
            ]
        },
        retard: {
            label: 'Tâches En Retard',
            title: 'RÉVISION DE LA LISTE DES TRAVAUX',
            phase: 'Phase -24 Semaines',
            responsable: 'PL',
            echeance: '14/10/2025',
            echeanceColor: '#c5554a',
            avancement: 0,
            icon: '⚠️',
            iconBg: '#ffe0dd',
            borderColor: '#c5554a',
            bgColor1: 'rgba(197, 85, 74, 0.1)',
            bgColor2: 'rgba(197, 85, 74, 0.05)',
            description: `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #c5554a; margin-bottom: 15px;">
                    <strong style="color: #c5554a;">⚠️ ATTENTION: Cette tâche est en retard!</strong><br>
                    <span style="color: #856404;">Échéance dépassée. Action immédiate requise.</span>
                </div>
                Cette tâche consiste à réviser et mettre à jour la liste complète des travaux prévus pour l'arrêt
                annuel. Cela inclut l'examen des avis et ordres de travaux dans SAP (IW37N/IW38), l'ajout de nouveaux
                travaux identifiés, et la suppression ou report de travaux non pertinents.
                <br><br>
                <strong>Impacts du retard:</strong>
                <ul style="margin-top: 10px; padding-left: 20px; color: #c5554a;">
                    <li>Retard dans la planification détaillée</li>
                    <li>Risque de manquer des travaux critiques</li>
                    <li>Impact sur les commandes de matériel</li>
                    <li>Délais serrés pour les étapes suivantes</li>
                </ul>
            `,
            actions: [
                {
                    titre: '🔥 URGENT: Extraire les données SAP IW37N',
                    description: 'Obtenir la liste actualisée de tous les ordres de travaux'
                },
                {
                    titre: '🔥 URGENT: Réviser avec les secteurs',
                    description: 'Organiser des réunions rapides avec chaque secteur pour valider les travaux'
                },
                {
                    titre: 'Identifier les nouveaux travaux',
                    description: 'Ajouter les travaux identifiés depuis la dernière révision'
                },
                {
                    titre: 'Prioriser les interventions',
                    description: 'Classer les travaux par criticité et faisabilité'
                },
                {
                    titre: 'Mettre à jour le planning',
                    description: 'Intégrer les changements dans le planning master'
                }
            ],
            documents: [
                { nom: 'Liste travaux v2.1', type: 'Excel', date: '01/10/2025' },
                { nom: 'Export IW37N complet', type: 'Excel', date: '28/09/2025' },
                { nom: 'Travaux ajoutés secteur A', type: 'Word', date: '05/10/2025' },
                { nom: 'Matrice priorisation', type: 'Excel', date: '03/10/2025' }
            ]
        }
    };

    return tasks[type] || tasks.encours;
}
