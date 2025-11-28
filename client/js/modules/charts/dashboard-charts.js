/**
 * Module de gestion des graphiques du Tableau de Bord
 * @module charts/dashboard-charts
 */

import {
    getPhaseChartData,
    getResponsableChartData,
    getStatutChartData
} from '../ui/dashboard-filters.js';
import { showModal } from '../ui/dashboard-modals.js';
import { getPreparationPhases } from '../ui/summary.js';
import { switchPage } from '../navigation.js';
import { getBudget, loadSettings } from '../data/settings.js';
import { getIw37nData } from '../data/iw37n-data.js';

// Instances des graphiques du dashboard
let dashboardChartInstances = {
    avancementPhase: null,
    responsables: null,
    statutTaches: null,
    budgetTracking: null,
    budgetRepartition: null,
    reunions: null
};

/**
 * Initialise tous les graphiques du Dashboard
 * @returns {Promise<void>}
 */
export async function initDashboardCharts() {
    console.log('[CHARTS] Initialisation des graphiques du Dashboard...');

    // Vérifier que Chart.js est chargé
    if (typeof Chart === 'undefined') {
        console.error('[ERROR] Chart.js n\'est pas chargé! Veuillez vérifier votre connexion internet.');
        return;
    }

    // Détruire les graphiques existants
    destroyDashboardCharts();

    // Créer les graphiques
    await createAvancementPhaseChart();
    await createResponsablesChart();
    await createStatutTachesChart();
    await createBudgetTrackingChart();
    await createReunionsChart();
    await createBudgetRepartitionChart();

    console.log('[OK] Graphiques du Dashboard créés');
}

/**
 * Crée le graphique d'avancement par phase (barres)
 * @returns {void}
 */
async function createAvancementPhaseChart() {
    const ctx = document.getElementById('chartAvancementPhase');
    if (!ctx) {
        console.warn('[WARNING] Canvas chartAvancementPhase non trouvé');
        return;
    }

    // Récupérer les données filtrées
    const chartData = await getPhaseChartData();
    const phases = chartData.labels;
    const avancementReel = chartData.avancementReel;
    const avancementPlanifie = chartData.avancementPlanifie;

    dashboardChartInstances.avancementPhase = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: phases,
            datasets: [
                {
                    label: 'Avancement Réel',
                    data: avancementReel,
                    backgroundColor: 'rgba(74, 124, 89, 0.8)',
                    borderColor: 'rgba(74, 124, 89, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Avancement Planifié',
                    data: avancementPlanifie,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const phase = phases[index];
                    showPhaseDetails(phase, avancementReel[index], avancementPlanifie[index]);
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            events: ['click', 'mousemove'],
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crée le graphique de distribution des responsables (donut)
 * @returns {void}
 */
async function createResponsablesChart() {
    const ctx = document.getElementById('chartResponsables');
    if (!ctx) {
        console.warn('[WARNING] Canvas chartResponsables non trouvé');
        return;
    }

    // Récupérer les données filtrées
    const chartData = await getResponsableChartData();
    const responsables = chartData.labels;
    const tachesParResponsable = chartData.counts;

    // Générer des couleurs dynamiquement
    const colors = generateColors(responsables.length);

    dashboardChartInstances.responsables = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: responsables,
            datasets: [{
                data: tachesParResponsable,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const responsable = responsables[index];
                    const nbTaches = tachesParResponsable[index];
                    showResponsableDetails(responsable, nbTaches);
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            events: ['click', 'mousemove'],
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} tâches (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crée le graphique de statut des tâches (donut)
 * @returns {void}
 */
async function createStatutTachesChart() {
    const ctx = document.getElementById('chartStatutTaches');
    if (!ctx) {
        console.warn('[WARNING] Canvas chartStatutTaches non trouvé');
        return;
    }

    // Récupérer les données filtrées
    const chartData = await getStatutChartData();
    const statuts = chartData.labels;
    const tachesParStatut = chartData.counts;

    const colors = [
        'rgba(67, 233, 123, 0.9)',   // Vert pour complétée
        'rgba(255, 193, 7, 0.9)',    // Jaune pour en cours
        'rgba(220, 53, 69, 0.9)',    // Rouge pour non commencé
        'rgba(108, 117, 125, 0.9)'   // Gris pour annulé
    ];

    dashboardChartInstances.statutTaches = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statuts,
            datasets: [{
                data: tachesParStatut,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const statut = statuts[index];
                    const nbTaches = tachesParStatut[index];
                    showStatutDetails(statut, nbTaches);
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            events: ['click', 'mousemove'],
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} tâches (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crée le graphique de suivi du budget (T72)
 * @returns {Promise<void>}
 */
async function createBudgetTrackingChart() {
    const ctx = document.getElementById('chartBudgetTracking');
    if (!ctx) {
        console.warn('[WARNING] Canvas chartBudgetTracking non trouvé');
        return;
    }

    try {
        // Importer le module T72 pour utiliser les mêmes calculs
        const t72Module = await import('../data/t72-suivi-cout.js');
        const { loadFromStorage } = await import('../sync/storage-wrapper.js');

        // Charger le budget total autorisé depuis arretAnnuelData
        let arretData = await loadFromStorage('arretAnnuelData');

        // Si pas de budgetTotal, essayer de synchroniser depuis settingsData
        if (!arretData || !arretData.budgetTotal) {
            const settingsData = await loadFromStorage('arretAnnuelSettings');
            if (settingsData && settingsData.budget) {
                arretData = arretData || {};
                arretData.budgetTotal = settingsData.budget;
            }
        }

        const budgetTotal = arretData?.budgetTotal || 0;
        console.log('[BUDGET-CHART] Budget Total Autorisé:', budgetTotal);

        if (budgetTotal === 0) {
            console.warn('[BUDGET-CHART] ⚠️ Budget = 0! Vérifiez que le budget est défini dans les Paramètres');
            // Afficher un message d'erreur dans le canvas
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
            context.font = '16px Arial';
            context.fillStyle = '#dc3545';
            context.textAlign = 'center';
            context.fillText('⚠️ Budget non défini!', ctx.width / 2, ctx.height / 2 - 20);
            context.font = '14px Arial';
            context.fillStyle = '#666';
            context.fillText('Allez dans Paramètres pour définir le budget', ctx.width / 2, ctx.height / 2 + 10);
            return;
        }

        // Calculer les coûts automatiques comme dans T72
        const piecesResult = await t72Module.calculateTotalPiecesFromGestion();
        const totalPieces = piecesResult.total;
        const totalDA = await t72Module.calculateTotalDA();

        console.log('[BUDGET-CHART] Pièces (Auto):', totalPieces);
        console.log('[BUDGET-CHART] DA (Auto):', totalDA);

        // Total des dépenses
        const totalDepenses = totalPieces + totalDA;

        // Budget restant
        const budgetRestant = Math.max(0, budgetTotal - totalDepenses);
        const pourcentageUtilise = budgetTotal > 0 ? ((totalDepenses / budgetTotal) * 100).toFixed(1) : 0;

        console.log('[BUDGET-CHART] Total dépenses:', totalDepenses);
        console.log('[BUDGET-CHART] Budget restant:', budgetRestant);
        console.log('[BUDGET-CHART] Pourcentage utilisé:', pourcentageUtilise + '%');

        // Déterminer la couleur en fonction du pourcentage utilisé
        let couleurDepenses;
        if (pourcentageUtilise <= 70) {
            couleurDepenses = 'rgba(67, 233, 123, 0.9)'; // Vert - OK
        } else if (pourcentageUtilise <= 90) {
            couleurDepenses = 'rgba(255, 193, 7, 0.9)'; // Jaune - Attention
        } else {
            couleurDepenses = 'rgba(220, 53, 69, 0.9)'; // Rouge - Critique
        }

        dashboardChartInstances.budgetTracking = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Budget T72'],
                datasets: [
                    {
                        label: 'Pièces (Auto)',
                        data: [totalPieces],
                        backgroundColor: 'rgba(102, 126, 234, 0.9)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'DA (Auto)',
                        data: [totalDA],
                        backgroundColor: 'rgba(240, 147, 251, 0.9)',
                        borderColor: 'rgba(240, 147, 251, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Budget Restant',
                        data: [budgetRestant],
                        backgroundColor: 'rgba(74, 124, 89, 0.5)',
                        borderColor: 'rgba(74, 124, 89, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                onClick: (event, elements) => {
                    // Rediriger vers la page T72 au clic
                    switchPage('detail-t72');
                },
                interaction: {
                    mode: 'nearest',
                    intersect: true
                },
                events: ['click', 'mousemove'],
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.x || 0;
                                return `${label}: ${value.toLocaleString('fr-CA')} €`;
                            },
                            footer: function(tooltipItems) {
                                return `\nCliquez pour voir les détails T72`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        max: budgetTotal,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-CA') + ' €';
                            }
                        }
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('[BUDGET-CHART] ❌ Erreur lors de la création du graphique:', error);
        console.error('[BUDGET-CHART] Stack:', error.stack);
    }
}

/**
 * Crée le graphique de suivi des réunions
 * @returns {Promise<void>}
 */
async function createReunionsChart() {
    const ctx = document.getElementById('chartReunions');
    if (!ctx) {
        console.warn('[WARNING] Canvas chartReunions non trouvé');
        return;
    }

    try {
        // Importer le module des réunions
        const reunionsModule = await import('../ui/bilan-reunions.js');
        const stats = reunionsModule.getReunionsStats();

        console.log('[REUNIONS-CHART] Statistiques réunions:', stats);

        // Données pour le graphique donut par statut
        const labels = ['Complétées', 'En cours', 'Non commencées', 'Annulées'];
        const data = [stats.completed, stats.inprogress, stats.notstarted, stats.cancelled];
        const colors = [
            'rgba(67, 233, 123, 0.9)',   // Vert - Complétées
            'rgba(255, 193, 7, 0.9)',    // Jaune - En cours
            'rgba(220, 53, 69, 0.9)',    // Rouge - Non commencées
            'rgba(158, 158, 158, 0.9)'   // Gris - Annulées
        ];

        dashboardChartInstances.reunions = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} réunions (${percentage}%)`;
                            },
                            footer: function(tooltipItems) {
                                return `\nTotal: ${stats.total} réunions`;
                            }
                        }
                    }
                }
            }
        });

        console.log('[REUNIONS-CHART] ✅ Graphique créé');
    } catch (error) {
        console.error('[REUNIONS-CHART] ❌ Erreur lors de la création du graphique:', error);
        console.error('[REUNIONS-CHART] Stack:', error.stack);
    }
}

/**
 * Affiche les détails du budget dans une modale
 * @param {number} budgetTotal - Budget total défini
 * @param {number} depensesReelles - Dépenses réelles
 * @param {number} budgetRestant - Budget restant
 * @param {number} pourcentageUtilise - Pourcentage du budget utilisé
 */
function showBudgetDetails(budgetTotal, depensesReelles, budgetRestant, pourcentageUtilise) {
    const statutColor = pourcentageUtilise <= 70 ? '#43e97b' :
                       pourcentageUtilise <= 90 ? '#ffc107' : '#dc3545';

    const content = `
        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid ${statutColor};">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">Utilisation du Budget</div>
            <div style="font-size: 2.5em; font-weight: bold; color: ${statutColor}; margin-bottom: 5px;">
                ${pourcentageUtilise}%
            </div>
            <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 15px;">
                <div style="background: ${statutColor}; height: 100%; width: ${Math.min(100, pourcentageUtilise)}%; transition: width 0.5s ease;"></div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: #f7f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; text-align: center;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Budget Total</div>
                <div style="font-size: 1.6em; font-weight: bold; color: #667eea;">
                    ${budgetTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </div>
            </div>
            <div style="background: #f7f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid ${statutColor}; text-align: center;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Dépenses Réelles</div>
                <div style="font-size: 1.6em; font-weight: bold; color: ${statutColor};">
                    ${depensesReelles.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </div>
            </div>
            <div style="background: #f7f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4a7c59; text-align: center;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Budget Restant</div>
                <div style="font-size: 1.6em; font-weight: bold; color: #4a7c59;">
                    ${budgetRestant.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </div>
            </div>
        </div>

        <div style="background: ${pourcentageUtilise > 90 ? '#f8d7da' : pourcentageUtilise > 70 ? '#fff3cd' : '#d4edda'};
                    padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid ${statutColor};">
            <div style="color: ${pourcentageUtilise > 90 ? '#721c24' : pourcentageUtilise > 70 ? '#856404' : '#155724'}; font-weight: 600;">
                ${pourcentageUtilise <= 70 ? '✅ Utilisation du budget dans les limites normales' :
                  pourcentageUtilise <= 90 ? '⚠️ Attention: Le budget approche de sa limite' :
                  '❌ ALERTE: Le budget est dépassé ou critique!'}
            </div>
        </div>

        <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">💡 Informations</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                <li>Les dépenses sont calculées à partir des données IW37N</li>
                <li>Le budget total est défini dans les Paramètres</li>
                <li>Cliquez sur "Paramètres" pour modifier le budget</li>
            </ul>
        </div>
    `;

    showModal('📊 Détails du Suivi du Budget', content, 'large');
}

/**
 * Affiche les statistiques TPAA et PW par statut
 * @returns {Promise<void>}
 */
async function createBudgetRepartitionChart() {
    console.log('[TPAA-PW-STATS] Affichage des statistiques TPAA/PW...');

    // Importer le module TPAA/PW pour accéder aux données
    try {
        const tpaaPwModule = await import('../data/tpaa-pw-data.js');
        const tpaaData = tpaaPwModule.getTPAAData();
        const pwData = tpaaPwModule.getPWData();
        const manualData = tpaaPwModule.getManualData();

        // Calculer les statistiques TPAA
        const tpaaStats = calculateStats(tpaaData, manualData, 'tpaa');

        // Calculer les statistiques PW
        const pwStats = calculateStats(pwData, manualData, 'pw');

        // Rendre les statistiques
        renderStats('tpaa-stats-container', tpaaStats);
        renderStats('pw-stats-container', pwStats);

        console.log('[TPAA-PW-STATS] ✅ Statistiques affichées');
    } catch (error) {
        console.error('[TPAA-PW-STATS] ❌ Erreur lors du chargement des statistiques:', error);
    }
}

/**
 * Calcule les statistiques par statut
 * @param {Array} data - Données TPAA ou PW
 * @param {Object} manualData - Données manuelles avec statuts
 * @param {string} type - 'tpaa' ou 'pw'
 * @returns {Object} Statistiques par statut
 */
function calculateStats(data, manualData, type) {
    const stats = {
        'À faire': 0,
        'Planifié': 0,
        'Terminé': 0,
        'Annulé': 0,
        'Non défini': 0
    };

    const total = data.length;

    data.forEach((row, index) => {
        const key = `${type}-${index}`;
        const manual = manualData[key] || {};
        const statut = manual.statut || 'Non défini';

        if (stats.hasOwnProperty(statut)) {
            stats[statut]++;
        } else {
            stats['Non défini']++;
        }
    });

    // Ajouter le total
    stats.total = total;

    return stats;
}

/**
 * Rend les statistiques dans un conteneur
 * @param {string} containerId - ID du conteneur HTML
 * @param {Object} stats - Statistiques à afficher
 */
function renderStats(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`[TPAA-PW-STATS] Conteneur ${containerId} non trouvé`);
        return;
    }

    // Déterminer le type (TPAA ou PW) depuis l'ID du conteneur
    const type = containerId.includes('tpaa') ? 'TPAA' : 'PW';

    // Définir les couleurs par statut (mêmes que TPAA/PW)
    const colors = {
        'À faire': { bg: '#ffe0e0', text: '#c62828' },
        'Planifié': { bg: '#e3f2fd', text: '#1565c0' },
        'Terminé': { bg: '#e8f5e9', text: '#2e7d32' },
        'Annulé': { bg: '#e0e0e0', text: '#616161' },
        'Non défini': { bg: '#f5f5f5', text: '#757575' }
    };

    // Créer les cartes de statistiques
    let html = '';

    for (const [statut, count] of Object.entries(stats)) {
        if (statut === 'total') continue;

        const color = colors[statut] || colors['Non défini'];
        const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;

        html += `
            <div onclick="window.showTPAAPWStatutDetails('${type}', '${statut}', ${count})"
                 style="background: ${color.bg}; padding: 15px; border-radius: 8px; border-left: 4px solid ${color.text}; cursor: pointer; transition: all 0.3s ease;"
                 onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <div style="font-size: 0.85em; color: ${color.text}; font-weight: 600; margin-bottom: 5px;">${statut}</div>
                <div style="font-size: 1.8em; font-weight: bold; color: ${color.text};">${count}</div>
                <div style="font-size: 0.8em; color: ${color.text}; margin-top: 3px;">${percentage}%</div>
            </div>
        `;
    }

    // Ajouter une carte pour le total
    html += `
        <div onclick="window.showTPAAPWStatutDetails('${type}', 'Total', ${stats.total})"
             style="background: linear-gradient(145deg, #667eea, #764ba2); padding: 15px; border-radius: 8px; color: white; cursor: pointer; transition: all 0.3s ease;"
             onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div style="font-size: 0.85em; font-weight: 600; margin-bottom: 5px;">Total</div>
            <div style="font-size: 1.8em; font-weight: bold;">${stats.total}</div>
            <div style="font-size: 0.8em; margin-top: 3px;">tâches</div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Affiche les détails de la répartition du budget pour une phase
 * @param {Object} phaseData - Données de la phase
 * @param {number} budgetTotal - Budget total
 */
function showBudgetRepartitionDetails(phaseData, budgetTotal) {
    const content = `
        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Phase</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #333; margin-bottom: 10px;">${phaseData.nom}</div>
            <div style="font-size: 1.2em; color: #667eea;">
                ${phaseData.pourcentage}% du budget total
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: #f7f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; text-align: center;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Budget Alloué</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #667eea;">
                    ${phaseData.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </div>
            </div>
            <div style="background: #f7f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4a7c59; text-align: center;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Nombre de Tâches</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #4a7c59;">
                    ${phaseData.nbTaches}
                </div>
            </div>
        </div>

        <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #0c5460;">
            <div style="color: #0c5460; font-weight: 600;">
                ℹ️ Calcul de la Répartition
            </div>
            <div style="color: #0c5460; margin-top: 8px; font-size: 0.95em;">
                Le budget est réparti proportionnellement au nombre de tâches dans chaque phase.
                <br><br>
                <strong>Formule:</strong> Budget de la phase = (Nb tâches phase ÷ Total tâches) × Budget total
            </div>
        </div>

        <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">💡 Informations</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                <li>Budget total défini: ${budgetTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</li>
                <li>La répartition est calculée automatiquement</li>
                <li>Basée sur le nombre de tâches par phase</li>
            </ul>
        </div>
    `;

    showModal(`💰 Budget - ${phaseData.nom}`, content, 'large');
}

/**
 * Extrait le numéro depuis une chaîne
 * @param {string} str - Chaîne contenant un nombre
 * @returns {number} Nombre extrait ou 0
 */
function extractNumber(str) {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

/**
 * Calcule la date pour TPAA (date début - semaines)
 * @param {number} weeks - Nombre de semaines
 * @param {string} startDateStr - Date de début
 * @returns {string} Date calculée
 */
function calculateTPAADate(weeks, startDateStr) {
    if (!startDateStr || !weeks) return '';
    try {
        const date = new Date(startDateStr);
        date.setDate(date.getDate() - (weeks * 7));
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
}

/**
 * Calcule la date pour PW (date début - jours)
 * @param {number} days - Nombre de jours
 * @param {string} startDateStr - Date de début
 * @returns {string} Date calculée
 */
function calculatePWDate(days, startDateStr) {
    if (!startDateStr || !days) return '';
    try {
        const date = new Date(startDateStr);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
}

/**
 * Affiche les détails des tâches TPAA ou PW par statut
 * @param {string} type - Type de données ('TPAA' ou 'PW')
 * @param {string} statut - Statut à filtrer
 * @param {number} count - Nombre de tâches
 */
async function showTPAAPWStatutDetails(type, statut, count) {
    console.log(`[TPAA-PW-DETAILS] Affichage des détails ${type} - ${statut}`);

    try {
        // Importer le module TPAA/PW pour accéder aux données
        const tpaaPwModule = await import('../data/tpaa-pw-data.js');
        const settingsModule = await import('../data/settings.js');

        const tpaaData = tpaaPwModule.getTPAAData();
        const pwData = tpaaPwModule.getPWData();
        const manualData = tpaaPwModule.getManualData();
        const startDate = await settingsModule.getStartDate();

        // Sélectionner les bonnes données
        const data = type === 'TPAA' ? tpaaData : pwData;
        const dataType = type === 'TPAA' ? 'tpaa' : 'pw';

        // Filtrer les données par statut
        const filteredData = [];
        data.forEach((row, index) => {
            const key = `${dataType}-${index}`;
            const manual = manualData[key] || {};
            const rowStatut = manual.statut || 'Non défini';

            // Si on demande le total ou si le statut correspond
            if (statut === 'Total' || rowStatut === statut) {
                // Calculer la date selon le type
                const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '';
                let calculatedDate = '';

                if (type === 'TPAA') {
                    const weeks = extractNumber(designOper);
                    calculatedDate = calculateTPAADate(weeks, startDate);
                } else {
                    const days = extractNumber(designOper);
                    calculatedDate = calculatePWDate(days, startDate);
                }

                filteredData.push({
                    ...row,
                    statut: rowStatut,
                    commentaire: manual.commentaire || '',
                    calculatedDate: calculatedDate,
                    index: index
                });
            }
        });

        // Générer le tableau HTML
        let tableHTML = `
            <div style="max-height: 500px; overflow-y: auto; margin-top: 15px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead style="position: sticky; top: 0; z-index: 1;">
                        <tr style="background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Ordre</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Désignation</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Opération</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Date</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Statut</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Commentaire</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Couleurs par statut
        const statutColors = {
            'À faire': { bg: '#ffe0e0', text: '#c62828' },
            'Planifié': { bg: '#e3f2fd', text: '#1565c0' },
            'Terminé': { bg: '#e8f5e9', text: '#2e7d32' },
            'Annulé': { bg: '#e0e0e0', text: '#616161' },
            'Non défini': { bg: '#f5f5f5', text: '#757575' }
        };

        filteredData.forEach(row => {
            const color = statutColors[row.statut] || statutColors['Non défini'];
            const ordre = row['Ordre'] || row['ordre'] || '-';
            const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '-';
            const operation = row['Opération'] || row['Operation'] || '-';
            const date = row.calculatedDate || '-';

            tableHTML += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${ordre}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${designOper}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${operation}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${date}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <span style="background: ${color.bg}; color: ${color.text}; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">
                            ${row.statut}
                        </span>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${row.commentaire}</td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        // Couleur du titre selon le statut
        const titleColor = statut === 'Total' ? '#667eea' : (statutColors[statut]?.text || '#667eea');
        const titleBg = statut === 'Total' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' :
                        (statutColors[statut] ? `rgba(${statutColors[statut].text.replace('#', '')}, 0.1)` : 'rgba(102, 126, 234, 0.1)');

        const content = `
            <div style="background: ${titleBg}; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid ${titleColor};">
                <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Type: ${type}</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #333; margin-bottom: 10px;">
                    ${statut === 'Total' ? 'Toutes les tâches' : statut}
                </div>
                <div style="font-size: 1.2em; color: ${titleColor};">
                    <strong>${filteredData.length}</strong> tâche${filteredData.length > 1 ? 's' : ''}
                </div>
            </div>

            ${filteredData.length > 0 ? `
                <h4 style="margin: 20px 0 10px 0;">Liste des tâches</h4>
                ${tableHTML}
            ` : `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3em; margin-bottom: 10px;">📋</div>
                    <div>Aucune tâche avec ce statut</div>
                </div>
            `}

            <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">💡 Informations</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                    <li>Les données proviennent de l'import IW37N</li>
                    <li>Les statuts et commentaires peuvent être modifiés dans la page ${type}</li>
                    <li>Cliquez sur "CONNAITRE LA LISTE DES TPAA" pour gérer ces tâches</li>
                </ul>
            </div>
        `;

        showModal(`${type} - ${statut}`, content, 'large');
    } catch (error) {
        console.error('[TPAA-PW-DETAILS] ❌ Erreur:', error);
        showModal('Erreur', `
            <div style="text-align: center; padding: 40px; color: #dc3545;">
                <div style="font-size: 3em; margin-bottom: 10px;">⚠️</div>
                <div>Impossible de charger les détails des tâches ${type}</div>
                <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    ${error.message}
                </div>
            </div>
        `, 'medium');
    }
}

// Exposer la fonction globalement pour qu'elle soit accessible depuis le HTML
window.showTPAAPWStatutDetails = showTPAAPWStatutDetails;

/**
 * Détruit tous les graphiques du Dashboard
 * @returns {void}
 */
export function destroyDashboardCharts() {
    Object.values(dashboardChartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    dashboardChartInstances = {
        avancementPhase: null,
        responsables: null,
        statutTaches: null,
        budgetTracking: null,
        budgetRepartition: null,
        reunions: null
    };
}

/**
 * Met à jour les graphiques du Dashboard avec de nouvelles données
 * @param {Object} data - Nouvelles données
 * @returns {Promise<void>}
 */
export async function updateDashboardCharts(data) {
    console.log('[SYNC] Mise à jour des graphiques du Dashboard...');
    // Pour l'instant, on recrée les graphiques
    await initDashboardCharts();
}

/**
 * Affiche les détails d'une phase dans une modale
 * @param {string} phase - Nom de la phase
 * @param {number} avancementReel - Avancement réel en %
 * @param {number} avancementPlanifie - Avancement planifié en %
 */
async function showPhaseDetails(phase, avancementReel, avancementPlanifie) {
    // Récupérer les vraies tâches depuis les données de préparation
    const phases = await getPreparationPhases();
    const phaseData = phases.find(p => p.nom === phase);

    const taches = phaseData ? phaseData.taches : [];

    // Mapper les statuts
    const getStatutLabel = (statut) => {
        const map = {
            'completed': 'Complétée',
            'inprogress': 'En cours',
            'notstarted': 'Non commencé',
            'cancelled': 'Annulé'
        };
        return map[statut] || statut;
    };

    const getStatutColor = (statut) => {
        const map = {
            'completed': '#43e97b',
            'inprogress': '#ffc107',
            'notstarted': '#dc3545',
            'cancelled': '#6c757d'
        };
        return map[statut] || '#6c757d';
    };

    let tableHTML = `
        <div style="max-height: 500px; overflow-y: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="position: sticky; top: 0; z-index: 1;">
                    <tr style="background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Tâche</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Responsable</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Statut</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Avancement</th>
                    </tr>
                </thead>
                <tbody>
    `;

    taches.forEach(tache => {
        const statutLabel = getStatutLabel(tache.statut);
        const statutColor = getStatutColor(tache.statut);
        const responsable = Array.isArray(tache.responsables) && tache.responsables.length > 0
            ? (tache.responsables.length > 1 ? `${tache.responsables[0]} +${tache.responsables.length - 1}` : tache.responsables[0])
            : (tache.responsable || 'N/A');

        const isClickable = tache.clickable && tache.page;
        const clickableStyle = isClickable ? 'cursor: pointer; text-decoration: underline; color: #667eea;' : '';
        const clickableAttr = isClickable ? `onclick="window.openTaskFromChart('${tache.page}')"` : '';

        tableHTML += `
            <tr style="border-bottom: 1px solid #dee2e6; ${isClickable ? 'background: white;' : ''}" ${isClickable ? 'onmouseover="this.style.background=\'#f8f9fa\'" onmouseout="this.style.background=\'white\'"' : ''}>
                <td style="padding: 10px; border: 1px solid #dee2e6; ${clickableStyle}" ${clickableAttr}>${tache.titre}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${responsable}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <span style="background: ${statutColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em;">
                        ${statutLabel}
                    </span>
                </td>
                <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">
                    <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden; margin: 0 auto; max-width: 100px;">
                        <div style="background: ${statutColor}; height: 100%; width: ${tache.avancement}%;"></div>
                    </div>
                    <div style="font-size: 0.85em; margin-top: 3px;">${tache.avancement}%</div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    const content = `
        <div style="margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div style="background: #f7f8ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4a7c59;">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">Avancement Réel</div>
                    <div style="font-size: 2em; font-weight: bold; color: #4a7c59;">${avancementReel}%</div>
                </div>
                <div style="background: #f7f8ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">Avancement Planifié</div>
                    <div style="font-size: 2em; font-weight: bold; color: #667eea;">${avancementPlanifie}%</div>
                </div>
            </div>
        </div>
        <h4 style="margin: 20px 0 10px 0;">Liste des tâches (${taches.length})</h4>
        ${tableHTML}
    `;

    showModal(`Détails - ${phase}`, content, 'large');
}

/**
 * Affiche les détails d'un responsable dans une modale
 * @param {string} responsable - Code du responsable
 * @param {number} nbTaches - Nombre de tâches
 */
async function showResponsableDetails(responsable, nbTaches) {
    // Récupérer toutes les tâches de toutes les phases
    const phases = await getPreparationPhases();
    const tachesFiltered = [];

    phases.forEach(phase => {
        phase.taches.forEach(tache => {
            // Vérifier si le responsable correspond
            const tacheResponsables = Array.isArray(tache.responsables) ? tache.responsables : [tache.responsable];
            if (tacheResponsables.includes(responsable)) {
                tachesFiltered.push({
                    ...tache,
                    phaseName: phase.nom,
                    phaseDate: phase.date
                });
            }
        });
    });

    // Mapper les statuts
    const getStatutLabel = (statut) => {
        const map = {
            'completed': 'Complétée',
            'inprogress': 'En cours',
            'notstarted': 'Non commencé',
            'cancelled': 'Annulé'
        };
        return map[statut] || statut;
    };

    const getStatutColor = (statut) => {
        const map = {
            'completed': '#43e97b',
            'inprogress': '#ffc107',
            'notstarted': '#dc3545',
            'cancelled': '#6c757d'
        };
        return map[statut] || '#6c757d';
    };

    let tableHTML = `
        <div style="max-height: 500px; overflow-y: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="position: sticky; top: 0; z-index: 1;">
                    <tr style="background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Tâche</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Phase</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Échéance</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Statut</th>
                    </tr>
                </thead>
                <tbody>
    `;

    tachesFiltered.forEach(tache => {
        const statutLabel = getStatutLabel(tache.statut);
        const statutColor = getStatutColor(tache.statut);
        const echeance = tache.dateFin || tache.phaseDate || 'N/A';

        const isClickable = tache.clickable && tache.page;
        const clickableStyle = isClickable ? 'cursor: pointer; text-decoration: underline; color: #667eea;' : '';
        const clickableAttr = isClickable ? `onclick="window.openTaskFromChart('${tache.page}')"` : '';

        tableHTML += `
            <tr style="border-bottom: 1px solid #dee2e6; ${isClickable ? 'background: white;' : ''}" ${isClickable ? 'onmouseover="this.style.background=\'#f8f9fa\'" onmouseout="this.style.background=\'white\'"' : ''}>
                <td style="padding: 10px; border: 1px solid #dee2e6; ${clickableStyle}" ${clickableAttr}>${tache.titre}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${tache.phaseName}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${echeance}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <span style="background: ${statutColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em;">
                        ${statutLabel}
                    </span>
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    const content = `
        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Responsable</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #333; margin-bottom: 10px;">${responsable}</div>
            <div style="font-size: 1.2em; color: #667eea;">
                <strong>${tachesFiltered.length}</strong> tâches assignées
            </div>
        </div>
        <h4 style="margin: 20px 0 10px 0;">Liste des tâches</h4>
        ${tableHTML}
    `;

    showModal(`Tâches de ${responsable}`, content, 'large');
}

/**
 * Génère un tableau de couleurs pour les graphiques
 * @param {number} count - Nombre de couleurs nécessaires
 * @returns {Array<string>} Tableau de couleurs en rgba
 */
function generateColors(count) {
    const baseColors = [
        'rgba(102, 126, 234, 0.9)',  // Bleu violet
        'rgba(240, 147, 251, 0.9)',  // Rose
        'rgba(79, 172, 254, 0.9)',   // Bleu clair
        'rgba(67, 233, 123, 0.9)',   // Vert
        'rgba(250, 112, 154, 0.9)',  // Rose foncé
        'rgba(254, 225, 64, 0.9)',   // Jaune
        'rgba(48, 207, 208, 0.9)',   // Cyan
        'rgba(168, 237, 234, 0.9)',  // Cyan clair
        'rgba(255, 159, 64, 0.9)',   // Orange
        'rgba(153, 102, 255, 0.9)'   // Violet
    ];

    // Si on a besoin de plus de couleurs, répéter le tableau
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }

    return colors;
}

/**
 * Affiche les détails d'un statut dans une modale
 * @param {string} statut - Statut des tâches (label en français)
 * @param {number} nbTaches - Nombre de tâches
 */
async function showStatutDetails(statut, nbTaches) {
    // Mapper le label français vers le code
    const statutCodeMap = {
        'Complétée': 'completed',
        'En cours': 'inprogress',
        'Non commencé': 'notstarted',
        'Annulé': 'cancelled'
    };
    const statutCode = statutCodeMap[statut] || statut;

    // Récupérer toutes les tâches de toutes les phases
    const phases = await getPreparationPhases();
    const tachesFiltered = [];

    phases.forEach(phase => {
        phase.taches.forEach(tache => {
            if (tache.statut === statutCode) {
                tachesFiltered.push({
                    ...tache,
                    phaseName: phase.nom,
                    phaseDate: phase.date
                });
            }
        });
    });

    let tableHTML = `
        <div style="max-height: 500px; overflow-y: auto; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="position: sticky; top: 0; z-index: 1;">
                    <tr style="background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Tâche</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Responsable</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Phase</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Échéance</th>
                    </tr>
                </thead>
                <tbody>
    `;

    tachesFiltered.forEach(tache => {
        const responsable = Array.isArray(tache.responsables) && tache.responsables.length > 0
            ? (tache.responsables.length > 1 ? `${tache.responsables[0]} +${tache.responsables.length - 1}` : tache.responsables[0])
            : (tache.responsable || 'N/A');
        const echeance = tache.dateFin || tache.phaseDate || 'N/A';

        const isClickable = tache.clickable && tache.page;
        const clickableStyle = isClickable ? 'cursor: pointer; text-decoration: underline; color: #667eea;' : '';
        const clickableAttr = isClickable ? `onclick="window.openTaskFromChart('${tache.page}')"` : '';

        tableHTML += `
            <tr style="border-bottom: 1px solid #dee2e6; ${isClickable ? 'background: white;' : ''}" ${isClickable ? 'onmouseover="this.style.background=\'#f8f9fa\'" onmouseout="this.style.background=\'white\'"' : ''}>
                <td style="padding: 10px; border: 1px solid #dee2e6; ${clickableStyle}" ${clickableAttr}>${tache.titre}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${responsable}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${tache.phaseName}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${echeance}</td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    const statutColor = statut === 'Complétée' ? '#43e97b' :
                       statut === 'En cours' ? '#ffc107' :
                       statut === 'Non commencé' ? '#dc3545' : '#6c757d';

    const content = `
        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid ${statutColor};">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Statut</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #333; margin-bottom: 10px;">
                <span style="background: ${statutColor}; color: white; padding: 6px 16px; border-radius: 12px;">
                    ${statut}
                </span>
            </div>
            <div style="font-size: 1.2em; color: #667eea;">
                <strong>${tachesFiltered.length}</strong> tâches avec ce statut
            </div>
        </div>
        <h4 style="margin: 20px 0 10px 0;">Liste des tâches</h4>
        ${tableHTML}
    `;

    showModal(`Tâches - ${statut}`, content, 'large');
}

