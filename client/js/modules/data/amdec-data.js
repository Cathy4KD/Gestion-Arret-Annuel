/**
 * @fileoverview Module de gestion des analyses AMDEC
 * @module data/amdec-data
 */

import { loadFromStorage, saveToStorage } from '../sync/storage-wrapper.js';

// XLSX est chargé via CDN dans index.html et disponible globalement

// Données AMDEC en mémoire
let amdecData = {
    selectedWorks: [],      // Travaux sélectionnés pour analyse
    analyses: [],           // Analyses AMDEC complétées
    lastModified: null
};

// Travaux IW37N disponibles (chargés depuis le module IW37N)
let availableWorks = [];

// État du modal d'analyse
let currentAnalysisWorkId = null;
let currentAnalysisId = null;

/**
 * Charge les données AMDEC depuis le stockage
 */
async function loadAmdecData() {
    try {
        const stored = await loadFromStorage('amdecData');
        if (stored) {
            amdecData = stored;
            console.log('[AMDEC] Données chargées:', amdecData);
        }
    } catch (error) {
        console.error('[AMDEC] Erreur chargement données:', error);
    }
}

/**
 * Sauvegarde les données AMDEC
 */
async function saveAmdecData() {
    try {
        amdecData.lastModified = new Date().toISOString();
        const success = await saveToStorage('amdecData', amdecData);
        if (success) {
            console.log('[AMDEC] Données sauvegardées');
        }
        return success;
    } catch (error) {
        console.error('[AMDEC] Erreur sauvegarde:', error);
        return false;
    }
}

/**
 * Charge les travaux IW37N disponibles
 */
async function loadAvailableWorks() {
    try {
        const iw37nData = await loadFromStorage('iw37nData');
        if (iw37nData && iw37nData.travaux) {
            availableWorks = iw37nData.travaux.map(t => ({
                id: t.id,
                ordre: t.ordre || 'N/A',
                operation: t.operation || 'N/A',
                description: t.description || '',
                type: t.type || 'Standard'
            }));
            console.log('[AMDEC] Travaux IW37N chargés:', availableWorks.length);
        }
    } catch (error) {
        console.error('[AMDEC] Erreur chargement travaux IW37N:', error);
    }
}

/**
 * Calcule le niveau de criticité
 * @param {number} criticite - Score de criticité (G × O × D)
 * @returns {Object} {level: string, color: string, label: string}
 */
function getCriticalityLevel(criticite) {
    if (criticite >= 300) {
        return { level: 'elevee', color: '#dc3545', label: 'Élevée', bgColor: '#fff5f5' };
    } else if (criticite >= 100) {
        return { level: 'moyenne', color: '#ffc107', label: 'Moyenne', bgColor: '#fffef7' };
    } else {
        return { level: 'faible', color: '#28a745', label: 'Faible', bgColor: '#f1f8f4' };
    }
}

/**
 * Affiche le modal de sélection des travaux
 */
export function showWorkSelection() {
    const modal = document.getElementById('amdecWorkSelectionModal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Remplir le tableau avec les travaux disponibles
    renderWorkSelectionTable();

    // Ajouter l'événement de recherche
    const searchInput = document.getElementById('amdecWorkSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderWorkSelectionTable(e.target.value);
        });
    }
}

/**
 * Rend le tableau de sélection des travaux
 * @param {string} searchTerm - Terme de recherche
 */
function renderWorkSelectionTable(searchTerm = '') {
    const tbody = document.getElementById('amdecWorkSelectionTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Filtrer les travaux selon la recherche
    let filteredWorks = availableWorks;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredWorks = availableWorks.filter(w =>
            w.ordre.toLowerCase().includes(term) ||
            w.operation.toLowerCase().includes(term) ||
            w.description.toLowerCase().includes(term)
        );
    }

    if (filteredWorks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 30px; text-align: center; color: #666;">Aucun travail trouvé</td></tr>';
        return;
    }

    filteredWorks.forEach(work => {
        const isSelected = amdecData.selectedWorks.some(sw => sw.id === work.id);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center; padding: 10px; border: 1px solid #dee2e6;">
                <input type="checkbox" ${isSelected ? 'checked' : ''} data-work-id="${work.id}" style="cursor: pointer; width: 18px; height: 18px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${work.ordre}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${work.operation}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${work.description}</td>
            <td style="text-align: center; padding: 10px; border: 1px solid #dee2e6;">${work.type}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Toggle sélection de tous les travaux
 * @param {boolean} checked - État de la case à cocher
 */
export function toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll('#amdecWorkSelectionTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
}

/**
 * Confirme la sélection des travaux
 */
export async function confirmWorkSelection() {
    const checkboxes = document.querySelectorAll('#amdecWorkSelectionTableBody input[type="checkbox"]:checked');

    // Construire la liste des travaux sélectionnés
    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.workId);

    amdecData.selectedWorks = availableWorks.filter(w => selectedIds.includes(w.id));

    console.log('[AMDEC] Travaux sélectionnés:', amdecData.selectedWorks.length);

    await saveAmdecData();
    renderSelectedWorksTable();
    renderAnalysesTable();
    updateStatistics();

    // Fermer le modal
    cancelWorkSelection();
}

/**
 * Annule la sélection des travaux
 */
export function cancelWorkSelection() {
    const modal = document.getElementById('amdecWorkSelectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Rend le tableau des travaux sélectionnés
 */
function renderSelectedWorksTable() {
    const tbody = document.getElementById('amdecSelectedWorksTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (amdecData.selectedWorks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding: 30px; text-align: center; color: #666;">Aucun travail sélectionné. Cliquez sur "Sélectionner Travaux" pour commencer.</td></tr>';
        return;
    }

    amdecData.selectedWorks.forEach(work => {
        // Trouver les analyses pour ce travail
        const workAnalyses = amdecData.analyses.filter(a => a.workId === work.id);
        const hasAnalysis = workAnalyses.length > 0;

        // Calculer la criticité maximale pour ce travail
        let maxCriticite = 0;
        if (hasAnalysis) {
            maxCriticite = Math.max(...workAnalyses.map(a => a.criticite));
        }

        const critLevel = getCriticalityLevel(maxCriticite);

        const statutBadge = hasAnalysis
            ? `<span style="background: ${critLevel.color}; color: white; padding: 5px 12px; border-radius: 5px; font-weight: 600;">Analysé</span>`
            : '<span style="background: #6c757d; color: white; padding: 5px 12px; border-radius: 5px; font-weight: 600;">Non analysé</span>';

        const criticityBadge = hasAnalysis
            ? `<span style="background: ${critLevel.color}; color: white; padding: 8px 12px; border-radius: 5px; font-weight: 600; font-size: 1.1em;">${maxCriticite}</span>`
            : '<span style="color: #999;">-</span>';

        const row = document.createElement('tr');
        if (hasAnalysis) {
            row.style.background = critLevel.bgColor;
        }
        row.style.height = '28px';

        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-weight: 600; font-size: 12px; background: #e9ecef;">${work.ordre}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px; background: #e9ecef;">${work.operation}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px; background: #e9ecef;">${work.description}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6;">${statutBadge}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6;">${criticityBadge}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; background: #f8f9fa;">
                <button onclick="window.amdecActions.analyzeWork('${work.id}')" style="background: #667eea; color: white; padding: 2px 8px; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
                    ${hasAnalysis ? '✏️' : '🔍'}
                </button>
                <button onclick="window.amdecActions.removeWork('${work.id}')" style="background: #dc3545; color: white; padding: 2px 8px; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; margin-left: 3px;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Supprime un travail de la sélection
 * @param {string} workId - ID du travail
 */
export async function removeWork(workId) {
    if (!confirm('Supprimer ce travail et toutes ses analyses AMDEC ?')) {
        return;
    }

    // Supprimer le travail
    amdecData.selectedWorks = amdecData.selectedWorks.filter(w => w.id !== workId);

    // Supprimer les analyses associées
    amdecData.analyses = amdecData.analyses.filter(a => a.workId !== workId);

    await saveAmdecData();
    renderSelectedWorksTable();
    renderAnalysesTable();
    updateStatistics();
}

/**
 * Ouvre le modal d'analyse pour un travail
 * @param {string} workId - ID du travail
 */
export function analyzeWork(workId) {
    currentAnalysisWorkId = workId;

    const work = amdecData.selectedWorks.find(w => w.id === workId);
    if (!work) return;

    // Remplir les informations du travail
    document.getElementById('amdecModalWorkOrder').textContent = work.ordre;
    document.getElementById('amdecModalOperation').textContent = work.operation;
    document.getElementById('amdecModalDescription').textContent = work.description;

    // Vérifier si une analyse existe déjà
    const existingAnalysis = amdecData.analyses.find(a => a.workId === workId);

    if (existingAnalysis) {
        currentAnalysisId = existingAnalysis.id;
        // Pré-remplir le formulaire
        document.getElementById('amdecModeDefaillance').value = existingAnalysis.modeDefaillance || '';
        document.getElementById('amdecCause').value = existingAnalysis.cause || '';
        document.getElementById('amdecEffet').value = existingAnalysis.effet || '';
        document.getElementById('amdecGravite').value = existingAnalysis.gravite || 5;
        document.getElementById('amdecOccurrence').value = existingAnalysis.occurrence || 5;
        document.getElementById('amdecDetection').value = existingAnalysis.detection || 5;
        document.getElementById('amdecActionsCorrectives').value = existingAnalysis.actionsCorrectives || '';
        document.getElementById('amdecResponsable').value = existingAnalysis.responsable || '';
        document.getElementById('amdecStatut').value = existingAnalysis.statut || 'en_cours';
    } else {
        currentAnalysisId = null;
        // Réinitialiser le formulaire
        document.getElementById('amdecModeDefaillance').value = '';
        document.getElementById('amdecCause').value = '';
        document.getElementById('amdecEffet').value = '';
        document.getElementById('amdecGravite').value = 5;
        document.getElementById('amdecOccurrence').value = 5;
        document.getElementById('amdecDetection').value = 5;
        document.getElementById('amdecActionsCorrectives').value = '';
        document.getElementById('amdecResponsable').value = '';
        document.getElementById('amdecStatut').value = 'en_cours';
    }

    // Calculer et afficher la criticité initiale
    updateCriticalityCalculation();

    // Ajouter les événements de calcul en temps réel
    ['amdecGravite', 'amdecOccurrence', 'amdecDetection'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateCriticalityCalculation);
        }
    });

    // Afficher le modal
    const modal = document.getElementById('amdecAnalysisModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Met à jour le calcul de criticité dans le modal
 */
function updateCriticalityCalculation() {
    const g = parseInt(document.getElementById('amdecGravite').value) || 5;
    const o = parseInt(document.getElementById('amdecOccurrence').value) || 5;
    const d = parseInt(document.getElementById('amdecDetection').value) || 5;

    const criticite = g * o * d;
    const critLevel = getCriticalityLevel(criticite);

    const critDisplay = document.getElementById('amdecCalculatedCriticality');
    const critLevelDisplay = document.getElementById('amdecCriticalityLevel');

    if (critDisplay) {
        critDisplay.textContent = criticite;
        critDisplay.style.color = critLevel.color;
    }

    if (critLevelDisplay) {
        critLevelDisplay.innerHTML = `Niveau: <strong style="color: ${critLevel.color};">${critLevel.label}</strong>`;
    }
}

/**
 * Sauvegarde l'analyse AMDEC
 */
export async function saveAnalysis() {
    // Récupérer les valeurs
    const modeDefaillance = document.getElementById('amdecModeDefaillance').value.trim();
    const cause = document.getElementById('amdecCause').value.trim();
    const effet = document.getElementById('amdecEffet').value.trim();
    const gravite = parseInt(document.getElementById('amdecGravite').value);
    const occurrence = parseInt(document.getElementById('amdecOccurrence').value);
    const detection = parseInt(document.getElementById('amdecDetection').value);
    const actionsCorrectives = document.getElementById('amdecActionsCorrectives').value.trim();
    const responsable = document.getElementById('amdecResponsable').value.trim();
    const statut = document.getElementById('amdecStatut').value;

    // Validation
    if (!modeDefaillance || !cause || !effet || !actionsCorrectives) {
        alert('Veuillez remplir tous les champs obligatoires (*)');
        return;
    }

    const criticite = gravite * occurrence * detection;

    const analysis = {
        id: currentAnalysisId || `amdec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workId: currentAnalysisWorkId,
        modeDefaillance,
        cause,
        effet,
        gravite,
        occurrence,
        detection,
        criticite,
        actionsCorrectives,
        responsable,
        statut,
        dateCreation: currentAnalysisId ? amdecData.analyses.find(a => a.id === currentAnalysisId)?.dateCreation : new Date().toISOString(),
        dateModification: new Date().toISOString()
    };

    if (currentAnalysisId) {
        // Modifier l'analyse existante
        const index = amdecData.analyses.findIndex(a => a.id === currentAnalysisId);
        if (index !== -1) {
            amdecData.analyses[index] = analysis;
        }
    } else {
        // Ajouter une nouvelle analyse
        amdecData.analyses.push(analysis);
    }

    await saveAmdecData();
    renderSelectedWorksTable();
    renderAnalysesTable();
    updateStatistics();
    drawCriticalityMatrix();

    // Fermer le modal
    cancelAnalysis();

    console.log('[AMDEC] Analyse sauvegardée:', analysis);
}

/**
 * Annule l'analyse en cours
 */
export function cancelAnalysis() {
    const modal = document.getElementById('amdecAnalysisModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentAnalysisWorkId = null;
    currentAnalysisId = null;
}

/**
 * Rend le tableau des analyses AMDEC
 */
function renderAnalysesTable() {
    const tbody = document.getElementById('amdecAnalysesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (amdecData.analyses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="padding: 30px; text-align: center; color: #666;">Aucune analyse AMDEC. Sélectionnez des travaux et cliquez sur "Analyser" pour commencer.</td></tr>';
        return;
    }

    // Trier par criticité décroissante
    const sortedAnalyses = [...amdecData.analyses].sort((a, b) => b.criticite - a.criticite);

    sortedAnalyses.forEach(analysis => {
        const work = amdecData.selectedWorks.find(w => w.id === analysis.workId);
        if (!work) return;

        const critLevel = getCriticalityLevel(analysis.criticite);

        const statutBadges = {
            'en_cours': '<span style="background: #ffc107; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.85em;">⏳ En cours</span>',
            'complete': '<span style="background: #28a745; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.85em;">✓ Complété</span>',
            'en_attente': '<span style="background: #dc3545; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.85em;">⏸️ En attente</span>'
        };

        const row = document.createElement('tr');
        row.style.background = critLevel.bgColor;
        row.style.height = '28px';

        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 11px;">
                <div style="font-weight: 600;">${work.ordre}</div>
                <div style="color: #666; font-size: 10px;">${work.operation}</div>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 11px;">${analysis.modeDefaillance}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 11px;">${analysis.cause}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 11px;">${analysis.effet}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; font-weight: 600; font-size: 11px; background: #e9ecef;">${analysis.gravite}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; font-weight: 600; font-size: 11px; background: #e9ecef;">${analysis.occurrence}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; font-weight: 600; font-size: 11px; background: #e9ecef;">${analysis.detection}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; background: #e9ecef;">
                <div style="background: ${critLevel.color}; color: white; padding: 3px 6px; border-radius: 3px; font-weight: bold; font-size: 11px;">
                    ${analysis.criticite}
                </div>
                <div style="font-size: 9px; margin-top: 1px; color: ${critLevel.color}; font-weight: 600;">
                    ${critLevel.label}
                </div>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 11px;">${analysis.actionsCorrectives}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; font-size: 11px;">${analysis.responsable || '-'}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; font-size: 10px;">${statutBadges[analysis.statut] || statutBadges['en_cours']}</td>
            <td style="text-align: center; padding: 2px 4px; border: 1px solid #dee2e6; background: #f8f9fa;">
                <button onclick="window.amdecActions.editAnalysis('${analysis.id}')" style="background: #667eea; color: white; padding: 2px 6px; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; margin-bottom: 2px;">
                    ✏️
                </button>
                <button onclick="window.amdecActions.deleteAnalysis('${analysis.id}')" style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Modifie une analyse existante
 * @param {string} analysisId - ID de l'analyse
 */
export function editAnalysis(analysisId) {
    const analysis = amdecData.analyses.find(a => a.id === analysisId);
    if (!analysis) return;

    analyzeWork(analysis.workId);
}

/**
 * Supprime une analyse AMDEC
 * @param {string} analysisId - ID de l'analyse
 */
export async function deleteAnalysis(analysisId) {
    if (!confirm('Supprimer cette analyse AMDEC ?')) {
        return;
    }

    amdecData.analyses = amdecData.analyses.filter(a => a.id !== analysisId);

    await saveAmdecData();
    renderSelectedWorksTable();
    renderAnalysesTable();
    updateStatistics();
    drawCriticalityMatrix();
}

/**
 * Met à jour les statistiques globales
 */
function updateStatistics() {
    const stats = {
        total: amdecData.selectedWorks.length,
        elevee: 0,
        moyenne: 0,
        faible: 0,
        actions: amdecData.analyses.length
    };

    amdecData.analyses.forEach(analysis => {
        const level = getCriticalityLevel(analysis.criticite);
        if (level.level === 'elevee') stats.elevee++;
        else if (level.level === 'moyenne') stats.moyenne++;
        else stats.faible++;
    });

    // Mettre à jour l'affichage
    const totalEl = document.getElementById('amdecTotalTravaux');
    const eleveeEl = document.getElementById('amdecCriticiteElevee');
    const moyenneEl = document.getElementById('amdecCriticiteMoyenne');
    const faibleEl = document.getElementById('amdecCriticiteFaible');
    const actionsEl = document.getElementById('amdecActionsTotal');

    if (totalEl) totalEl.textContent = stats.total;
    if (eleveeEl) eleveeEl.textContent = stats.elevee;
    if (moyenneEl) moyenneEl.textContent = stats.moyenne;
    if (faibleEl) faibleEl.textContent = stats.faible;
    if (actionsEl) actionsEl.textContent = stats.actions;
}

/**
 * Dessine la matrice de criticité sur le canvas
 */
function drawCriticalityMatrix() {
    const canvas = document.getElementById('amdecCriticalityMatrix');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);

    // Marges
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Zones de criticité (fond)
    // Zone verte (faible): G*O < 10
    ctx.fillStyle = 'rgba(40, 167, 69, 0.15)';
    ctx.fillRect(margin.left, margin.top + plotHeight * 0.7, plotWidth * 0.3, plotHeight * 0.3);

    // Zone jaune (moyenne): 10 <= G*O < 30
    ctx.fillStyle = 'rgba(255, 193, 7, 0.15)';
    ctx.fillRect(margin.left, margin.top + plotHeight * 0.3, plotWidth * 0.7, plotHeight * 0.4);
    ctx.fillRect(margin.left + plotWidth * 0.3, margin.top + plotHeight * 0.7, plotWidth * 0.4, plotHeight * 0.3);

    // Zone rouge (élevée): G*O >= 30
    ctx.fillStyle = 'rgba(220, 53, 69, 0.15)';
    ctx.fillRect(margin.left, margin.top, plotWidth, plotHeight * 0.3);
    ctx.fillRect(margin.left + plotWidth * 0.7, margin.top + plotHeight * 0.3, plotWidth * 0.3, plotHeight * 0.7);

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();

    // Labels des axes
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Gravité × Occurrence', margin.left + plotWidth / 2, height - 20);

    ctx.save();
    ctx.translate(20, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Détection', 0, 0);
    ctx.restore();

    // Graduations
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';

    // Axe X (Gravité × Occurrence: 1 à 100)
    for (let i = 0; i <= 10; i++) {
        const x = margin.left + (i / 10) * plotWidth;
        const value = i * 10;
        ctx.fillText(value, x, margin.top + plotHeight + 20);

        // Trait de graduation
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, margin.top + plotHeight);
        ctx.lineTo(x, margin.top + plotHeight + 5);
        ctx.stroke();
    }

    // Axe Y (Détection: 1 à 10)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
        const y = margin.top + plotHeight - (i / 10) * plotHeight;
        ctx.fillText(i, margin.left - 10, y + 4);

        // Trait de graduation
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left - 5, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
    }

    // Tracer les analyses
    amdecData.analyses.forEach(analysis => {
        const gxo = analysis.gravite * analysis.occurrence;
        const d = analysis.detection;

        const x = margin.left + (gxo / 100) * plotWidth;
        const y = margin.top + plotHeight - (d / 10) * plotHeight;

        const critLevel = getCriticalityLevel(analysis.criticite);

        // Point
        ctx.fillStyle = critLevel.color;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Bordure
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Légende
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';

    const legendY = margin.top + 15;
    const legendItems = [
        { label: 'Faible (1-99)', color: '#28a745' },
        { label: 'Moyenne (100-299)', color: '#ffc107' },
        { label: 'Élevée (300-1000)', color: '#dc3545' }
    ];

    let legendX = margin.left + plotWidth - 250;
    legendItems.forEach((item, idx) => {
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY + idx * 20, 12, 12);

        ctx.fillStyle = '#333';
        ctx.fillText(item.label, legendX + 20, legendY + idx * 20 + 10);
    });
}

/**
 * Exporte les données AMDEC vers Excel
 */
export async function exportToExcel() {
    if (amdecData.analyses.length === 0) {
        alert('Aucune analyse AMDEC à exporter.');
        return;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[AMDEC] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    try {
        // Préparer les données pour l'export
        const exportData = amdecData.analyses.map(analysis => {
            const work = amdecData.selectedWorks.find(w => w.id === analysis.workId);
            const critLevel = getCriticalityLevel(analysis.criticite);

            return {
                'Ordre de Travail': work?.ordre || 'N/A',
                'Opération': work?.operation || 'N/A',
                'Description': work?.description || 'N/A',
                'Mode de Défaillance': analysis.modeDefaillance,
                'Cause': analysis.cause,
                'Effet': analysis.effet,
                'Gravité (G)': analysis.gravite,
                'Occurrence (O)': analysis.occurrence,
                'Détection (D)': analysis.detection,
                'Criticité (C)': analysis.criticite,
                'Niveau de Criticité': critLevel.label,
                'Actions Correctives': analysis.actionsCorrectives,
                'Responsable': analysis.responsable || '-',
                'Statut': analysis.statut === 'en_cours' ? 'En cours' : analysis.statut === 'complete' ? 'Complété' : 'En attente',
                'Date Création': new Date(analysis.dateCreation).toLocaleDateString('fr-FR'),
                'Date Modification': new Date(analysis.dateModification).toLocaleDateString('fr-FR')
            };
        });

        // Créer le workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Ajuster les largeurs de colonnes
        const colWidths = [
            { wch: 15 }, // Ordre
            { wch: 20 }, // Opération
            { wch: 30 }, // Description
            { wch: 30 }, // Mode de Défaillance
            { wch: 30 }, // Cause
            { wch: 30 }, // Effet
            { wch: 12 }, // G
            { wch: 12 }, // O
            { wch: 12 }, // D
            { wch: 12 }, // C
            { wch: 18 }, // Niveau
            { wch: 40 }, // Actions
            { wch: 15 }, // Responsable
            { wch: 12 }, // Statut
            { wch: 12 }, // Date création
            { wch: 12 }  // Date modification
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Analyses AMDEC');

        // Télécharger
        const filename = `AMDEC_Analyses_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);

        console.log('[AMDEC] Export Excel réussi:', filename);
    } catch (error) {
        console.error('[AMDEC] Erreur export Excel:', error);
        alert('Erreur lors de l\'export Excel.');
    }
}

/**
 * Exporte les analyses AMDEC vers PDF
 */
export async function exportToPDF() {
    alert('Export PDF - Fonctionnalité à venir.\n\nUtilisez l\'export Excel pour le moment, ou imprimez cette page (Ctrl+P).');
}

/**
 * Initialise le module AMDEC
 */
export async function initAmdec() {
    console.log('[AMDEC] Initialisation du module...');

    await loadAmdecData();
    await loadAvailableWorks();

    renderSelectedWorksTable();
    renderAnalysesTable();
    updateStatistics();
    drawCriticalityMatrix();

    console.log('[AMDEC] Module initialisé');
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.amdecActions = {
        showWorkSelection,
        toggleSelectAll,
        confirmWorkSelection,
        cancelWorkSelection,
        analyzeWork,
        removeWork,
        saveAnalysis,
        cancelAnalysis,
        editAnalysis,
        deleteAnalysis,
        exportToExcel,
        exportToPDF
    };
}

console.log('[AMDEC] Module chargé');
