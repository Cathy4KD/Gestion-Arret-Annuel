/**
 * @fileoverview Module pour la vue Timeline de la page Préparation
 * @module ui/summary-timeline
 */

import { exportTimelineGlobalPDF, exportTimelineIndividualPDF } from '../export/timeline-pdf-export.js';

// État actuel de la vue
let currentView = 'table';

/**
 * Bascule entre la vue tableau et la vue timeline
 * @param {string} view - 'table' ou 'timeline'
 */
export function switchView(view) {
    console.log('[TIMELINE] 🔄 Basculement vers vue:', view);
    currentView = view;

    const tableView = document.getElementById('summary-table-view');
    const timelineView = document.getElementById('summary-timeline-view');
    const btnTable = document.getElementById('btnViewTable');
    const btnTimeline = document.getElementById('btnViewTimeline');

    console.log('[TIMELINE] Éléments trouvés:', {
        tableView: !!tableView,
        timelineView: !!timelineView,
        btnTable: !!btnTable,
        btnTimeline: !!btnTimeline
    });

    if (!tableView || !timelineView || !btnTable || !btnTimeline) {
        console.error('[TIMELINE] ❌ Éléments manquants dans le DOM');
        return;
    }

    if (view === 'table') {
        // Afficher la vue tableau
        tableView.style.display = 'block';
        timelineView.style.display = 'none';

        // Mettre à jour les boutons
        btnTable.style.background = 'linear-gradient(145deg, #667eea, #764ba2)';
        btnTable.style.color = 'white';
        btnTimeline.style.background = 'transparent';
        btnTimeline.style.color = '#667eea';

        console.log('[TIMELINE] ✅ Vue tableau affichée');
    } else {
        // Afficher la vue timeline
        tableView.style.display = 'none';
        timelineView.style.display = 'block';

        // Mettre à jour les boutons
        btnTable.style.background = 'transparent';
        btnTable.style.color = '#667eea';
        btnTimeline.style.background = 'linear-gradient(145deg, #667eea, #764ba2)';
        btnTimeline.style.color = 'white';

        console.log('[TIMELINE] ✅ Vue timeline affichée, génération en cours...');

        // Générer la timeline
        renderTimeline();
    }
}

/**
 * Génère et affiche la vue timeline en flux de processus horizontal
 */
export async function renderTimeline() {
    console.log('[TIMELINE] 🎨 NOUVELLE VERSION - Rendu de la timeline avec carrés colorés');
    const container = document.getElementById('summaryTimelineContainer');
    if (!container) {
        console.warn('[TIMELINE] ❌ Container summaryTimelineContainer non trouvé');
        return;
    }

    console.log('[TIMELINE] ✅ Container trouvé, génération du HTML...');

    // Version simple avec carrés colorés - STYLES INLINE POUR GARANTIR L'AFFICHAGE
    let html = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #C41E3A; margin: 0; font-size: 24px; font-weight: 800;">Gestion des arrêts d'exploitation sur une page</h2>
        </div>

        <div style="display: flex; flex-direction: column; gap: 30px; padding: 20px; background: #f5f5f5; min-height: 600px;">

            <!-- Rangée du haut: 3 carrés -->
            <div style="display: flex; gap: 20px; justify-content: center;">
                <div style="flex: 1; min-height: 180px; border-radius: 12px; padding: 30px; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); background: #8BC34A; transition: all 0.3s ease;">
                    <div style="font-size: 20px; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px;">DÉFINIR</div>
                    <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">T-14 à T-12 semaines</div>
                    <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">Élaboration et fixation de l'ampleur</div>
                </div>
                <div style="flex: 1; min-height: 180px; border-radius: 12px; padding: 30px; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); background: #2196F3; transition: all 0.3s ease;">
                    <div style="font-size: 20px; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px;">PLANIFIER</div>
                    <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">T-11 à T-4 semaines</div>
                    <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">Programmation de l'arrêt</div>
                </div>
                <div style="flex: 1; min-height: 180px; border-radius: 12px; padding: 30px; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); background: #9E9E9E; transition: all 0.3s ease;">
                    <div style="font-size: 20px; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px;">PRÉPARER</div>
                    <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">T-3 à T-1 semaines</div>
                    <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">Élaboration de l'arrêt<br>Optimisation du calendrier</div>
                </div>
            </div>

            <!-- Timeline horizontale centrale -->
            <div style="display: flex; align-items: center; background: white; border-radius: 12px; padding: 25px; box-shadow: 0 6px 16px rgba(0,0,0,0.15); border: 4px solid #4CAF50;">
                <div style="flex: 2; color: white; padding: 25px 15px; border-radius: 8px; text-align: center; background: #8BC34A;">
                    <div style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">Définir</div>
                    <div style="font-size: 13px; font-weight: 700;">T-14 à T-12</div>
                </div>
                <div style="font-size: 28px; color: #666; margin: 0 15px; font-weight: bold;">→</div>
                <div style="flex: 7; color: white; padding: 25px 15px; border-radius: 8px; text-align: center; background: #2196F3;">
                    <div style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">Planifier</div>
                    <div style="font-size: 13px; font-weight: 700;">T-11 à T-4</div>
                </div>
                <div style="font-size: 28px; color: #666; margin: 0 15px; font-weight: bold;">→</div>
                <div style="flex: 3; color: white; padding: 25px 15px; border-radius: 8px; text-align: center; background: #9E9E9E;">
                    <div style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">Préparer</div>
                    <div style="font-size: 13px; font-weight: 700;">T-3 à T-1</div>
                </div>
                <div style="font-size: 28px; color: #666; margin: 0 15px; font-weight: bold;">→</div>
                <div style="flex: 2; color: white; padding: 25px 15px; border-radius: 8px; text-align: center; background: #FF9800;">
                    <div style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">Exécuter</div>
                    <div style="font-size: 13px; font-weight: 700;">T-0</div>
                </div>
                <div style="font-size: 28px; color: #666; margin: 0 15px; font-weight: bold;">→</div>
                <div style="flex: 2; color: white; padding: 25px 15px; border-radius: 8px; text-align: center; background: #00BCD4;">
                    <div style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">Analyser</div>
                    <div style="font-size: 13px; font-weight: 700;">T+2</div>
                </div>
            </div>

            <!-- Jalons clés -->
            <div style="display: flex; gap: 10px; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="flex: 2;">
                    <div style="background: #f8f9fa; border-left: 4px solid #8BC34A; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.6;">
                        <strong style="color: #1976D2; font-weight: 800; font-size: 13px; display: block;">T-14 à T-12</strong>
                        Réunion visant à définir l'arrêt (D5.0)
                    </div>
                </div>
                <div style="flex: 7;">
                    <div style="background: #f8f9fa; border-left: 4px solid #2196F3; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.6;">
                        <strong style="color: #1976D2; font-weight: 800;">T-10</strong> - Version préliminaire du calendrier (PL2.0)<br>
                        <strong style="color: #1976D2; font-weight: 800;">T-7</strong> - Réévaluation de l'ampleur (PL3.0)<br>
                        <strong style="color: #1976D2; font-weight: 800;">T-6</strong> - Fixation de l'ampleur (PL5.0)<br>
                        <strong style="color: #1976D2; font-weight: 800;">T-5</strong> - Évaluation des risques (PL10.0)
                    </div>
                </div>
                <div style="flex: 3;">
                    <div style="background: #f8f9fa; border-left: 4px solid #9E9E9E; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.6;">
                        <strong style="color: #1976D2; font-weight: 800;">T-3</strong> - Explication des tâches (PR1.0)<br>
                        <strong style="color: #1976D2; font-weight: 800;">T-3</strong> - Calendrier définitif (PR2.0)<br>
                        <strong style="color: #1976D2; font-weight: 800;">T-2</strong> - Examen préparation (PR3.0)
                    </div>
                </div>
                <div style="flex: 2;">
                    <div style="background: #f8f9fa; border-left: 4px solid #FF9800; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.6;">
                        <strong style="color: #1976D2; font-weight: 800; display: block;">Date prévue</strong>
                        Réunion gestion de l'arrêt (PE5.0)
                    </div>
                </div>
                <div style="flex: 2;">
                    <div style="background: #f8f9fa; border-left: 4px solid #00BCD4; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.6;">
                        <strong style="color: #1976D2; font-weight: 800; display: block;">T+2</strong>
                        Réunion de revue (A2.0)
                    </div>
                </div>
            </div>

            <!-- Rangée du bas: 3 carrés -->
            <div style="display: flex; gap: 20px; justify-content: center;">
                <div style="flex: 1; min-height: 180px; border-radius: 12px; padding: 30px; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); background: #FF9800; transition: all 0.3s ease;">
                    <div style="font-size: 20px; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px;">EXÉCUTER</div>
                    <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">T-0</div>
                    <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">Exécution de l'arrêt</div>
                </div>
                <div style="flex: 1; min-height: 180px; border-radius: 12px; padding: 30px; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); background: #795548; transition: all 0.3s ease;">
                    <div style="font-size: 20px; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px;">CONSIGNER</div>
                    <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">Retour</div>
                    <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">Consignation des travaux</div>
                </div>
                <div style="flex: 1; min-height: 180px; border-radius: 12px; padding: 30px; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); background: #00BCD4; transition: all 0.3s ease;">
                    <div style="font-size: 20px; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px;">ANALYSER POUR AMÉLIORER</div>
                    <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">T+2 semaines</div>
                    <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">Revue de l'arrêt</div>
                </div>
            </div>

        </div>
    `;

    container.innerHTML = html;
    console.log('[TIMELINE] ✅ Flux de processus horizontal généré');
}

/**
 * Retourne l'icône appropriée pour un statut
 * @param {string} status - Statut de la tâche
 * @returns {string} Icône emoji
 */
function getStatusIcon(status) {
    switch (status) {
        case 'completed': return '✅';
        case 'inprogress': return '⚙️';
        case 'cancelled': return '🚫';
        case 'notstarted':
        default: return '❌';
    }
}

/**
 * Retourne la couleur appropriée pour un statut
 * @param {string} status - Statut de la tâche
 * @returns {string} Code couleur hexadécimal
 */
function getStatusColor(status) {
    switch (status) {
        case 'completed': return '#28a745';
        case 'inprogress': return '#ffc107';
        case 'cancelled': return '#e83e8c';
        case 'notstarted':
        default: return '#dc3545';
    }
}

/**
 * Génère une carte de tâche pour la timeline
 * @param {Object} tache - La tâche à afficher
 * @param {Object} phase - La phase contenant la tâche
 * @returns {string} HTML de la carte
 */
function generateTaskCard(tache, phase) {
    const statusClass = tache.statut || 'notstarted';
    const avancement = tache.avancement || 0;

    // Badges de statut
    let statusBadge = '';
    let statusText = '';
    switch (statusClass) {
        case 'completed':
            statusBadge = 'status-completed';
            statusText = '✅ Complété';
            break;
        case 'inprogress':
            statusBadge = 'status-inprogress';
            statusText = '⚙️ En cours';
            break;
        default:
            statusBadge = 'status-notstarted';
            statusText = '⏸️ Non démarré';
    }

    // Rendre la tâche cliquable si elle a une page
    const titleClickable = tache.clickable && tache.page ?
        `onclick="window.switchToPage('${tache.page}')" style="cursor: pointer;"` : '';

    return `
        <div class="timeline-task ${statusClass}">
            <div class="timeline-task-dot ${statusClass}"></div>

            <div class="timeline-task-header">
                <h3 class="timeline-task-title" ${titleClickable}>
                    ${tache.titre}
                </h3>
                <div class="timeline-task-badges">
                    <span class="timeline-badge ${statusBadge}">${statusText}</span>
                </div>
            </div>

            <div class="timeline-task-body">
                <div class="timeline-task-info">
                    <span class="timeline-task-info-icon">👤</span>
                    <span>${tache.responsable || 'Non assigné'}</span>
                </div>
                ${tache.clickable ? `
                <div class="timeline-task-info">
                    <span class="timeline-task-info-icon">🔗</span>
                    <span style="color: #667eea; font-weight: 600;">Détails disponibles</span>
                </div>
                ` : ''}
            </div>

            <div class="timeline-task-progress">
                <div class="timeline-progress-label">
                    <span>Progression</span>
                    <span><strong>${avancement}%</strong></span>
                </div>
                <div class="timeline-progress-bar-container">
                    <div class="timeline-progress-bar ${statusClass}" style="width: ${avancement}%"></div>
                </div>
            </div>

            ${tache.commentaire ? `
            <div class="timeline-task-comment">
                💬 ${tache.commentaire}
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Récupère les phases de préparation depuis arretData
 * @returns {Array} Liste des phases
 */
function getPreparationPhases() {
    // Lire directement depuis window.arretData (données chargées depuis le serveur)
    const arretData = window.arretData;

    console.log('[TIMELINE] 🔍 Vérification arretData:', {
        exists: !!arretData,
        hasPhases: arretData?.phases ? true : false,
        phasesCount: arretData?.phases?.length || 0
    });

    if (!arretData || !arretData.phases || arretData.phases.length === 0) {
        console.warn('[TIMELINE] ❌ Aucune phase trouvée dans arretData');
        console.warn('[TIMELINE] window.arretData:', window.arretData);
        return [];
    }

    console.log(`[TIMELINE] ✅ ${arretData.phases.length} phases trouvées`);

    const startDate = arretData.dateDebut || '2026-04-01';

    return arretData.phases.map(phase => {
        const phaseDate = calculatePhaseDate(startDate, phase.semaines);
        return {
            ...phase,
            date: formatDate(phaseDate)
        };
    });
}

/**
 * Calcule la date d'une phase
 * @param {string} startDate - Date de début
 * @param {number} weeks - Nombre de semaines
 * @returns {string} Date calculée
 */
function calculatePhaseDate(startDate, weeks) {
    if (!startDate) return '';

    try {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (weeks * 7));
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('[TIMELINE] Erreur calcul date:', error);
        return '';
    }
}

/**
 * Formate une date
 * @param {string} dateStr - Date au format ISO
 * @returns {string} Date formatée
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Date non définie';

    try {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
        return dateStr;
    }
}

/**
 * Retourne l'icône appropriée pour une phase
 * @param {number} phaseIndex - Index de la phase
 * @param {number} weeks - Nombre de semaines
 * @returns {string} Icône emoji
 */
function getPhaseIcon(phaseIndex, weeks) {
    const icons = [
        '🎯', // Phase 1
        '📋', // Phase 2
        '🔧', // Phase 3
        '⚙️', // Phase 4
        '🏗️', // Phase 5
        '🔍', // Phase 6
        '📊', // Phase 7
        '✅', // Phase 8
        '🚀', // Phase 9
        '🎉'  // Phase 10
    ];

    return icons[phaseIndex % icons.length] || '📌';
}

// Exposer les fonctions globalement de manière immédiate
if (typeof window !== 'undefined') {
    window.summaryActions = window.summaryActions || {};
    window.summaryActions.switchView = switchView;
    window.summaryActions.renderTimeline = renderTimeline;

    // Exposer les fonctions d'export PDF pour la timeline
    window.timelineExportActions = {
        exportGlobal: exportTimelineGlobalPDF,
        exportIndividual: exportTimelineIndividualPDF
    };

    console.log('✅ Module Summary Timeline chargé et exposé');
    console.log('📌 window.summaryActions:', window.summaryActions);
    console.log('📌 window.timelineExportActions:', window.timelineExportActions);
}

// Initialiser les événements quand la page summary est chargée
function initSummaryEvents() {
    console.log('[TIMELINE] 🔍 Initialisation des événements...');

    // Méthode 1: Event Delegation sur le body (plus robuste)
    // Retirer l'ancien listener s'il existe
    if (window._summaryDelegateListener) {
        document.body.removeEventListener('click', window._summaryDelegateListener);
        console.log('[TIMELINE] 🗑️ Ancien listener délégué supprimé');
    }

    // Créer le nouveau listener délégué
    const delegateListener = (e) => {
        // Vérifier si l'élément cliqué ou un de ses parents est un bouton de vue
        const btn = e.target.closest('.summary-view-btn');
        if (btn) {
            const view = btn.getAttribute('data-view');
            console.log('[TIMELINE] 🖱️ Clic détecté via delegation, vue:', view);
            if (view) {
                switchView(view);
            }
        }
    };

    // Attacher le listener au body
    document.body.addEventListener('click', delegateListener);
    window._summaryDelegateListener = delegateListener;
    console.log('[TIMELINE] ✅ Event delegation activé sur body');

    // Méthode 2: Attacher aussi directement aux boutons s'ils existent (backup)
    const viewButtons = document.querySelectorAll('.summary-view-btn');
    console.log('[TIMELINE] 🔍 Recherche des boutons de vue...', viewButtons.length, 'trouvé(s)');

    if (viewButtons.length > 0) {
        viewButtons.forEach(btn => {
            // Supprimer les anciens listeners pour éviter les doublons
            const oldListener = btn._timelineListener;
            if (oldListener) {
                btn.removeEventListener('click', oldListener);
            }

            // Créer le nouveau listener
            const listener = () => {
                const view = btn.getAttribute('data-view');
                console.log('[TIMELINE] 🖱️ Clic direct sur bouton, vue:', view);
                if (view) {
                    switchView(view);
                }
            };

            // Attacher le listener
            btn.addEventListener('click', listener);
            btn._timelineListener = listener;

            console.log('[TIMELINE] ✅ Événement direct attaché au bouton:', btn.id);
        });
        console.log('[TIMELINE] ✅ Tous les événements directs attachés');
    } else {
        console.warn('[TIMELINE] ⚠️ Aucun bouton de vue trouvé (event delegation actif)');
    }
}

// Fonction pour forcer l'initialisation (appelable depuis la console)
window.forceInitSummaryTimeline = function() {
    console.log('[TIMELINE] 🔧 Initialisation forcée...');
    initSummaryEvents();
};

// Fonction de diagnostic (appelable depuis la console)
window.diagnoseTimelineButtons = function() {
    console.log('='.repeat(60));
    console.log('[TIMELINE] 🔍 DIAGNOSTIC COMPLET');
    console.log('='.repeat(60));

    const summaryPage = document.getElementById('summary');
    console.log('1. Page summary existe:', !!summaryPage);

    const tableView = document.getElementById('summary-table-view');
    const timelineView = document.getElementById('summary-timeline-view');
    console.log('2. Vue tableau existe:', !!tableView);
    console.log('3. Vue timeline existe:', !!timelineView);

    const btnTable = document.getElementById('btnViewTable');
    const btnTimeline = document.getElementById('btnViewTimeline');
    console.log('4. Bouton tableau existe:', !!btnTable);
    console.log('5. Bouton timeline existe:', !!btnTimeline);

    const allButtons = document.querySelectorAll('.summary-view-btn');
    console.log('6. Nombre de boutons .summary-view-btn:', allButtons.length);

    if (allButtons.length > 0) {
        allButtons.forEach((btn, i) => {
            console.log(`   Bouton ${i + 1}:`, {
                id: btn.id,
                'data-view': btn.getAttribute('data-view'),
                visible: btn.offsetParent !== null
            });
        });
    }

    console.log('7. Event delegation actif:', !!window._summaryDelegateListener);
    console.log('8. window.summaryActions:', window.summaryActions);

    // NOUVEAU: Diagnostic des données
    console.log('9. window.arretData existe:', !!window.arretData);
    if (window.arretData) {
        console.log('   - dateDebut:', window.arretData.dateDebut);
        console.log('   - phases:', window.arretData.phases?.length || 0);
        if (window.arretData.phases && window.arretData.phases.length > 0) {
            console.log('   - Première phase:', window.arretData.phases[0].nom);
            console.log('   - Tâches dans première phase:', window.arretData.phases[0].taches?.length || 0);
        }
    }

    console.log('='.repeat(60));

    if (btnTimeline) {
        console.log('💡 Essayez de cliquer sur le bouton Timeline maintenant');
    } else {
        console.warn('⚠️ Le bouton Timeline n\'existe pas dans le DOM');
        console.log('💡 Assurez-vous d\'être sur la page Préparation');
    }
};

// S'assurer que les fonctions sont disponibles dès le chargement
document.addEventListener('DOMContentLoaded', () => {
    // Réexposer au cas où
    if (!window.summaryActions || !window.summaryActions.switchView) {
        window.summaryActions = window.summaryActions || {};
        window.summaryActions.switchView = switchView;
        window.summaryActions.renderTimeline = renderTimeline;
        console.log('✅ Summary actions réexposées après DOMContentLoaded');
    }

    // Attacher les événements
    initSummaryEvents();
});

// Observer les changements du DOM pour détecter quand la page summary est chargée
const summaryObserver = new MutationObserver((mutations) => {
    let needsInit = false;

    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                // Vérifier si c'est le conteneur summary ou s'il contient les boutons
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.id === 'summary' ||
                        node.querySelector && node.querySelector('.summary-view-btn') ||
                        node.classList && node.classList.contains('summary-view-btn')) {
                        needsInit = true;
                        console.log('[TIMELINE] 🔍 Page summary détectée dans le DOM');
                    }
                }
            });
        }
    });

    if (needsInit) {
        // Petit délai pour s'assurer que tout est chargé
        setTimeout(() => {
            initSummaryEvents();
        }, 100);
    }
});

// Observer le body pour détecter l'ajout de la page summary
if (document.body) {
    summaryObserver.observe(document.body, { childList: true, subtree: true });
    console.log('[TIMELINE] 👀 MutationObserver activé');
}

// Également écouter l'événement personnalisé de changement de page
window.addEventListener('page-changed', (e) => {
    console.log('[TIMELINE] 📄 Page changed event:', e.detail);
    if (e.detail && e.detail.page === 'summary') {
        setTimeout(() => {
            initSummaryEvents();
        }, 200);
    }
});
