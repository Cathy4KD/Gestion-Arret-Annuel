/**
 * @fileoverview Module de gestion des graphiques Chart.js
 * @module charts/charts
 *
 * @description
 * Gère tous les graphiques de l'application avec Chart.js
 * Source: lignes 14840-15016 du fichier HTML original
 *
 * @requires Chart.js (bibliothèque externe)
 * @exports {Function} createCharts
 * @exports {Function} updateCharts
 * @exports {Function} updateChartsWithFilter
 */

// Instances des graphiques
let chartInstances = {
    phaseRepartition: null,
    tasksStatus: null,
    responsablesWorkload: null,
    budgetOverview: null,
    timeline: null
};

/**
 * Crée tous les graphiques de l'application
 * @param {Object} arretData - Données de l'arrêt annuel
 * @returns {void}
 * @source Ligne 14852
 */
export function createCharts(arretData) {
    // Vérifier que Chart.js est chargé
    if (typeof Chart === 'undefined') {
        console.error('[ERROR] Chart.js n\'est pas chargé! Veuillez vérifier votre connexion internet.');
        return;
    }

    if (!arretData || !arretData.phases) {
        console.warn('[WARNING] Aucune donnée pour créer les graphiques');
        return;
    }

    console.log('[STATS] Création des graphiques...');

    // Détruire les graphiques existants
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });

    // Graphique 1: Répartition des phases
    createPhaseRepartitionChart(arretData);

    // Graphique 2: Statut des tâches
    createTasksStatusChart(arretData);

    // Graphique 3: Charge de travail par responsable
    createResponsablesWorkloadChart(arretData);

    // Graphique 4: Aperçu budget
    createBudgetOverviewChart(arretData);

    // Graphique 5: Timeline
    createTimelineChart(arretData);

    console.log('[OK] Graphiques créés');
}

/**
 * Crée le graphique de répartition des phases
 * @param {Object} arretData - Données de l'arrêt
 * @returns {void}
 */
function createPhaseRepartitionChart(arretData) {
    const ctx = document.getElementById('chartPhaseRepartition');
    if (!ctx) return;

    const labels = arretData.phases.map(phase => phase.nom);
    const data = arretData.phases.map(phase => phase.taches.length);

    chartInstances.phaseRepartition = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre de tâches',
                data: data,
                backgroundColor: [
                    '#667eea', '#f093fb', '#4facfe', '#43e97b',
                    '#fa709a', '#fee140', '#30cfd0', '#a8edea'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Répartition des tâches par phase'
                }
            }
        }
    });
}

/**
 * Crée le graphique de statut des tâches
 * @param {Object} arretData - Données de l'arrêt
 * @returns {void}
 */
function createTasksStatusChart(arretData) {
    const ctx = document.getElementById('chartTasksStatus');
    if (!ctx) return;

    let aPlanifier = 0, enCours = 0, terminee = 0;

    arretData.phases.forEach(phase => {
        phase.taches.forEach(tache => {
            switch (tache.statut) {
                case 'A planifier':
                    aPlanifier++;
                    break;
                case 'En cours':
                    enCours++;
                    break;
                case 'Terminée':
                    terminee++;
                    break;
            }
        });
    });

    chartInstances.tasksStatus = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['A planifier', 'En cours', 'Terminée'],
            datasets: [{
                label: 'Nombre de tâches',
                data: [aPlanifier, enCours, terminee],
                backgroundColor: ['#ffc107', '#17a2b8', '#28a745'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Statut des tâches'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Crée le graphique de charge de travail par responsable
 * @param {Object} arretData - Données de l'arrêt
 * @returns {void}
 */
function createResponsablesWorkloadChart(arretData) {
    const ctx = document.getElementById('chartResponsablesWorkload');
    if (!ctx) return;

    const workload = {};

    arretData.phases.forEach(phase => {
        phase.taches.forEach(tache => {
            const resp = tache.responsable || 'Non assigné';
            workload[resp] = (workload[resp] || 0) + 1;
        });
    });

    const sortedWorkload = Object.entries(workload)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10

    chartInstances.responsablesWorkload = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedWorkload.map(w => w[0]),
            datasets: [{
                label: 'Nombre de tâches',
                data: sortedWorkload.map(w => w[1]),
                backgroundColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Charge de travail par responsable (Top 10)'
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Crée le graphique d'aperçu budget
 * @param {Object} arretData - Données de l'arrêt
 * @returns {void}
 */
function createBudgetOverviewChart(arretData) {
    const ctx = document.getElementById('chartBudgetOverview');
    if (!ctx) return;

    let budgetTotal = 0;
    arretData.phases.forEach(phase => {
        const budget = parseFloat(phase.budget) || 0;
        budgetTotal += budget;
    });

    chartInstances.budgetOverview = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: arretData.phases.map(phase => phase.nom),
            datasets: [{
                data: arretData.phases.map(phase => parseFloat(phase.budget) || 0),
                backgroundColor: [
                    '#667eea', '#f093fb', '#4facfe', '#43e97b',
                    '#fa709a', '#fee140', '#30cfd0', '#a8edea'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: `Répartition du budget (Total: ${budgetTotal.toLocaleString()}€)`
                }
            }
        }
    });
}

/**
 * Crée le graphique timeline
 * @param {Object} arretData - Données de l'arrêt
 * @returns {void}
 */
function createTimelineChart(arretData) {
    const ctx = document.getElementById('chartTimeline');
    if (!ctx) return;

    const datasets = arretData.phases.map((phase, index) => {
        const dateDebut = new Date(phase.dateDebut || Date.now());
        const dateFin = new Date(phase.dateFin || Date.now());

        return {
            label: phase.nom,
            data: [{
                x: dateDebut,
                y: index,
                x2: dateFin
            }],
            backgroundColor: `rgba(102, 126, 234, ${0.3 + (index * 0.1)})`,
            borderColor: '#667eea',
            borderWidth: 2
        };
    });

    chartInstances.timeline = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                title: {
                    display: true,
                    text: 'Timeline des phases'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        }
    });
}

/**
 * Met à jour tous les graphiques
 * @param {Object} arretData - Données de l'arrêt
 * @returns {void}
 * @source Ligne 15013
 */
export function updateCharts(arretData) {
    console.log('[SYNC] Mise à jour des graphiques...');
    createCharts(arretData);
}

/**
 * Met à jour les graphiques avec filtre
 * @param {Object} arretData - Données de l'arrêt
 * @param {string} filterType - Type de filtre
 * @param {string} filterValue - Valeur du filtre
 * @returns {void}
 * @source Ligne 14840
 */
export function updateChartsWithFilter(arretData, filterType, filterValue) {
    // Appliquer le filtre sur les données
    const filteredData = { ...arretData };

    if (filterType === 'responsable' && filterValue) {
        filteredData.phases = arretData.phases.map(phase => ({
            ...phase,
            taches: phase.taches.filter(tache => tache.responsable === filterValue)
        }));
    }

    updateCharts(filteredData);
}

/**
 * Détruit tous les graphiques
 * @returns {void}
 */
export function destroyCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
    chartInstances = {
        phaseRepartition: null,
        tasksStatus: null,
        responsablesWorkload: null,
        budgetOverview: null,
        timeline: null
    };
    console.log('[DELETE] Graphiques détruits');
}
