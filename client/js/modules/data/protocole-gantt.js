/**
 * @fileoverview Module de visualisation et édition du diagramme de Gantt
 * @module data/protocole-gantt
 */

import {
    getProtocoleArretData,
    loadProtocoleArretData,
    saveProtocoleArretData,
    addEtape,
    updateEtape,
    deleteEtape,
    setStatutEtape,
    getEtapesSortedByDate,
    genererEtapesExemple,
    convertirEnJours
} from './protocole-arret-data.js';

// Configuration du Gantt
const GANTT_CONFIG = {
    dayWidth: 40,              // Largeur d'un jour en pixels
    rowHeight: 50,             // Hauteur d'une ligne
    headerHeight: 80,          // Hauteur de l'en-tête
    leftPanelWidth: 300,       // Largeur du panneau gauche (noms des tâches)
    minVisibleDays: 30,        // Nombre minimum de jours visibles
    colors: {
        nondemarre: '#94a3b8',
        enCours: '#3b82f6',
        termine: '#10b981',
        enRetard: '#ef4444'
    }
};

// État du Gantt
let ganttContainer = null;
let currentDraggedTask = null;
let dragStartX = 0;
let dragStartDate = null;

/**
 * Initialise le diagramme de Gantt
 */
export async function initGantt() {
    console.log('[GANTT] 🎨 Initialisation du Gantt...');

    ganttContainer = document.getElementById('ganttContainer');
    if (!ganttContainer) {
        console.error('[GANTT] ❌ Container ganttContainer non trouvé');
        return;
    }

    // Charger les données
    await loadProtocoleArretData();

    // Rendre le Gantt
    renderGantt();

    console.log('[GANTT] ✅ Gantt initialisé');
}

/**
 * Rend le diagramme de Gantt complet
 */
export function renderGantt() {
    const data = getProtocoleArretData();
    const etapes = getEtapesSortedByDate();

    // Essayer de récupérer le container si pas déjà fait
    if (!ganttContainer) {
        ganttContainer = document.getElementById('ganttContainer');
    }

    if (!ganttContainer) {
        console.warn('[GANTT] ⚠️ Container non disponible (page non affichée), rendu différé');
        return;
    }

    // Si aucune étape, afficher un message
    if (etapes.length === 0) {
        ganttContainer.innerHTML = `
            <div style="padding: 60px; text-align: center; background: white; border-radius: 8px;">
                <h3 style="color: #64748b; margin-bottom: 20px;">📋 Aucune étape définie</h3>
                <p style="color: #94a3b8; margin-bottom: 30px;">
                    Créez votre première étape ou générez des exemples pour commencer.
                </p>
                <button onclick="window.protocoleGantt.genererExemples()"
                        style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    🔄 Générer des étapes d'exemple
                </button>
            </div>
        `;
        return;
    }

    // Calculer la plage de dates
    const dateRange = calculateDateRange(etapes);
    const totalDays = dateRange.days;
    const ganttWidth = Math.max(totalDays * GANTT_CONFIG.dayWidth, ganttContainer.clientWidth - GANTT_CONFIG.leftPanelWidth);

    // Générer le HTML du Gantt
    ganttContainer.innerHTML = `
        <div class="gantt-wrapper" style="display: flex; overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Panneau gauche: Liste des tâches -->
            <div class="gantt-left-panel" style="width: ${GANTT_CONFIG.leftPanelWidth}px; flex-shrink: 0; border-right: 2px solid #e2e8f0;">
                ${renderTaskList(etapes)}
            </div>

            <!-- Panneau droit: Diagramme de Gantt -->
            <div class="gantt-chart-panel" style="flex: 1; overflow-x: auto; position: relative;">
                <div style="width: ${ganttWidth}px;">
                    ${renderTimeline(dateRange)}
                    ${renderGanttBars(etapes, dateRange)}
                    ${renderDependencyArrows(etapes, dateRange)}
                </div>
            </div>
        </div>
    `;

    // Attacher les événements
    attachGanttEvents();
}

/**
 * Calcule la plage de dates du Gantt
 */
function calculateDateRange(etapes) {
    if (etapes.length === 0) {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);
        return {
            start: today,
            end: endDate,
            days: 30
        };
    }

    let minDate = new Date(etapes[0].dateDebut);
    let maxDate = new Date(etapes[0].dateFin);

    etapes.forEach(etape => {
        const debut = new Date(etape.dateDebut);
        const fin = new Date(etape.dateFin);

        if (debut < minDate) minDate = debut;
        if (fin > maxDate) maxDate = fin;
    });

    // Ajouter une marge
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    const days = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

    return {
        start: minDate,
        end: maxDate,
        days: Math.max(days, GANTT_CONFIG.minVisibleDays)
    };
}

/**
 * Rend la liste des tâches (panneau gauche)
 */
function renderTaskList(etapes) {
    const header = `
        <div style="height: ${GANTT_CONFIG.headerHeight}px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; padding: 0 15px; font-weight: 600; color: #334155;">
            Étapes du protocole
        </div>
    `;

    const rows = etapes.map(etape => {
        const statusColors = {
            nondemarre: '#94a3b8',
            enCours: '#3b82f6',
            termine: '#10b981',
            enRetard: '#ef4444'
        };

        const statusLabels = {
            nondemarre: 'Non démarré',
            enCours: 'En cours',
            termine: 'Terminé',
            enRetard: 'En retard'
        };

        const statusColor = statusColors[etape.statut] || '#94a3b8';
        const statusLabel = statusLabels[etape.statut] || 'Non démarré';

        return `
            <div class="gantt-task-row" data-task-id="${etape.id}"
                 style="height: ${GANTT_CONFIG.rowHeight}px; border-bottom: 1px solid #e2e8f0; padding: 8px 15px; display: flex; align-items: center; cursor: pointer; transition: background 0.2s;"
                 onmouseenter="this.style.background='#f8fafc'"
                 onmouseleave="this.style.background='white'">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></div>
                        <span style="font-weight: 500; color: #1e293b;">${etape.nom}</span>
                    </div>
                    <div style="font-size: 12px; color: #64748b;">
                        ${etape.responsable || 'Non assigné'}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="window.protocoleGantt.editEtape('${etape.id}')"
                            style="padding: 4px 8px; background: #e0e7ff; color: #4338ca; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                            title="Éditer">
                        ✏️
                    </button>
                    <button onclick="window.protocoleGantt.deleteEtapeConfirm('${etape.id}')"
                            style="padding: 4px 8px; background: #fee2e2; color: #dc2626; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                            title="Supprimer">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');

    return header + rows;
}

/**
 * Rend la timeline (en-tête avec les dates)
 */
function renderTimeline(dateRange) {
    const { start, days } = dateRange;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysHTML = '';
    for (let i = 0; i < days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        const isToday = currentDate.getTime() === today.getTime();
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

        const dayNum = currentDate.getDate();
        const monthShort = currentDate.toLocaleDateString('fr-FR', { month: 'short' });

        daysHTML += `
            <div style="width: ${GANTT_CONFIG.dayWidth}px; text-align: center; border-right: 1px solid #e2e8f0; background: ${isWeekend ? '#f1f5f9' : 'white'}; ${isToday ? 'border: 2px solid #3b82f6; background: #dbeafe;' : ''}">
                <div style="padding: 5px 0; font-size: 11px; color: #64748b; font-weight: 500;">
                    ${monthShort}
                </div>
                <div style="padding: 5px 0; font-size: 14px; font-weight: 600; color: ${isToday ? '#1e40af' : '#1e293b'};">
                    ${dayNum}
                </div>
                <div style="padding: 5px 0; font-size: 10px; color: #94a3b8;">
                    ${currentDate.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
            </div>
        `;
    }

    return `
        <div style="height: ${GANTT_CONFIG.headerHeight}px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; display: flex; position: sticky; top: 0; z-index: 10;">
            ${daysHTML}
        </div>
    `;
}

/**
 * Rend les barres du Gantt
 */
function renderGanttBars(etapes, dateRange) {
    const { start } = dateRange;

    const rows = etapes.map(etape => {
        const etapeStart = new Date(etape.dateDebut);
        const etapeDays = etape.dureeJours;

        // Calculer la position
        const offsetDays = Math.floor((etapeStart - start) / (1000 * 60 * 60 * 24));
        const leftPos = offsetDays * GANTT_CONFIG.dayWidth;
        const barWidth = etapeDays * GANTT_CONFIG.dayWidth;

        const statusColor = GANTT_CONFIG.colors[etape.statut] || GANTT_CONFIG.colors.nondemarre;

        // Formater la durée pour l'affichage
        const duree = etape.duree || etape.dureeJours;
        const unite = etape.uniteTemps || 'jours';
        const uniteLabel = unite === 'jours' ? (duree > 1 ? 'jours' : 'jour') :
                          unite === 'heures' ? (duree > 1 ? 'heures' : 'heure') :
                          'minutes';
        const dureeText = `${duree} ${uniteLabel}`;

        return `
            <div class="gantt-bar-row"
                 style="height: ${GANTT_CONFIG.rowHeight}px; border-bottom: 1px solid #e2e8f0; position: relative; background: repeating-linear-gradient(90deg, #fafafa 0px, #fafafa ${GANTT_CONFIG.dayWidth - 1}px, #e2e8f0 ${GANTT_CONFIG.dayWidth - 1}px, #e2e8f0 ${GANTT_CONFIG.dayWidth}px);">
                <div class="gantt-bar"
                     data-task-id="${etape.id}"
                     draggable="true"
                     style="position: absolute; left: ${leftPos}px; top: 8px; width: ${barWidth}px; height: 34px; background: ${statusColor}; border-radius: 6px; cursor: move; display: flex; align-items: center; padding: 0 10px; color: white; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s;"
                     onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
                     onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.15)'"
                     title="${etape.nom} (${dureeText})">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${etape.nom}</span>
                </div>
            </div>
        `;
    }).join('');

    return `<div>${rows}</div>`;
}

/**
 * Rend les flèches de dépendance entre les tâches
 */
function renderDependencyArrows(etapes, dateRange) {
    const { start } = dateRange;
    let arrows = [];

    etapes.forEach((etape, targetIndex) => {
        if (!etape.dependances || etape.dependances.length === 0) return;

        etape.dependances.forEach(depId => {
            const sourceEtape = etapes.find(e => e.id === depId);
            if (!sourceEtape) return;

            const sourceIndex = etapes.indexOf(sourceEtape);

            // Position de la tâche source (prédécesseur)
            const sourceStart = new Date(sourceEtape.dateDebut);
            const sourceOffsetDays = Math.floor((sourceStart - start) / (1000 * 60 * 60 * 24));
            const sourceLeftPos = sourceOffsetDays * GANTT_CONFIG.dayWidth;
            const sourceWidth = sourceEtape.dureeJours * GANTT_CONFIG.dayWidth;
            const sourceY = GANTT_CONFIG.headerHeight + (sourceIndex * GANTT_CONFIG.rowHeight) + (GANTT_CONFIG.rowHeight / 2);
            const sourceX = sourceLeftPos + sourceWidth; // Fin de la barre source

            // Position de la tâche cible (successeur)
            const targetStart = new Date(etape.dateDebut);
            const targetOffsetDays = Math.floor((targetStart - start) / (1000 * 60 * 60 * 24));
            const targetLeftPos = targetOffsetDays * GANTT_CONFIG.dayWidth;
            const targetY = GANTT_CONFIG.headerHeight + (targetIndex * GANTT_CONFIG.rowHeight) + (GANTT_CONFIG.rowHeight / 2);
            const targetX = targetLeftPos; // Début de la barre cible

            // Dessiner une flèche: source (fin) -> target (début)
            // Chemin: droite du source -> bas/haut -> gauche du target
            const midX = (sourceX + targetX) / 2;
            const pathData = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;

            arrows.push(`
                <path d="${pathData}"
                      fill="none"
                      stroke="#6366f1"
                      stroke-width="2"
                      stroke-dasharray="5,5"
                      marker-end="url(#arrowhead)" />
            `);
        });
    });

    if (arrows.length === 0) return '';

    const svgHeight = GANTT_CONFIG.headerHeight + (etapes.length * GANTT_CONFIG.rowHeight);
    const ganttWidth = calculateDateRange(etapes).days * GANTT_CONFIG.dayWidth;

    return `
        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: ${svgHeight}px; pointer-events: none; z-index: 1;">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
                </marker>
            </defs>
            ${arrows.join('')}
        </svg>
    `;
}

/**
 * Attache les événements du Gantt
 */
function attachGanttEvents() {
    const ganttBars = document.querySelectorAll('.gantt-bar');

    ganttBars.forEach(bar => {
        bar.addEventListener('dragstart', handleDragStart);
        bar.addEventListener('dragend', handleDragEnd);
        bar.addEventListener('click', handleBarClick);
    });

    // Permettre le drop sur les lignes
    const barRows = document.querySelectorAll('.gantt-bar-row');
    barRows.forEach(row => {
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
    });
}

/**
 * Gère le début du drag
 */
function handleDragStart(e) {
    currentDraggedTask = e.target.dataset.taskId;
    dragStartX = e.clientX;

    const data = getProtocoleArretData();
    const etape = data.etapes.find(et => et.id === currentDraggedTask);
    if (etape) {
        dragStartDate = new Date(etape.dateDebut);
    }

    e.target.style.opacity = '0.5';
}

/**
 * Gère la fin du drag
 */
function handleDragEnd(e) {
    e.target.style.opacity = '1';
    currentDraggedTask = null;
    dragStartDate = null;
}

/**
 * Gère le drag over
 */
function handleDragOver(e) {
    e.preventDefault();
}

/**
 * Gère le drop
 */
async function handleDrop(e) {
    e.preventDefault();

    if (!currentDraggedTask || !dragStartDate) return;

    // Calculer le déplacement en jours
    const deltaX = e.clientX - dragStartX;
    const deltaDays = Math.round(deltaX / GANTT_CONFIG.dayWidth);

    if (deltaDays === 0) return;

    // Calculer la nouvelle date
    const newStartDate = new Date(dragStartDate);
    newStartDate.setDate(dragStartDate.getDate() + deltaDays);

    const data = getProtocoleArretData();
    const etape = data.etapes.find(et => et.id === currentDraggedTask);

    if (!etape) return;

    // Calculer la nouvelle date de fin
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + etape.dureeJours - 1);

    // Mettre à jour l'étape
    await updateEtape(currentDraggedTask, {
        dateDebut: newStartDate.toISOString().split('T')[0],
        dateFin: newEndDate.toISOString().split('T')[0]
    });

    // Re-rendre le Gantt
    renderGantt();

    console.log('[GANTT] ✅ Étape déplacée:', etape.nom);
}

/**
 * Gère le clic sur une barre
 */
function handleBarClick(e) {
    e.stopPropagation();
    const taskId = e.currentTarget.dataset.taskId;
    editEtape(taskId);
}

/**
 * Ouvre le modal d'édition d'une étape
 */
export function editEtape(etapeId) {
    const data = getProtocoleArretData();
    const etape = data.etapes.find(e => e.id === etapeId);

    if (!etape) {
        console.error('[GANTT] ❌ Étape non trouvée:', etapeId);
        return;
    }

    // Créer le modal
    const modal = document.createElement('div');
    modal.id = 'ganttEditModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

    const autresEtapes = data.etapes.filter(e => e.id !== etapeId);
    const dependancesOptions = autresEtapes.map(e => `
        <option value="${e.id}" ${etape.dependances.includes(e.id) ? 'selected' : ''}>${e.nom}</option>
    `).join('');

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #1e293b;">✏️ Éditer l'étape</h2>
                <button onclick="document.getElementById('ganttEditModal').remove()"
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b;">×</button>
            </div>

            <form id="editEtapeForm" style="display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Nom de l'étape *</label>
                    <input type="text" id="edit_nom" value="${etape.nom}" required
                           style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Description</label>
                    <textarea id="edit_description" rows="3"
                              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">${etape.description}</textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Date début *</label>
                        <input type="date" id="edit_dateDebut" value="${etape.dateDebut}" required
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Date fin *</label>
                        <input type="date" id="edit_dateFin" value="${etape.dateFin}" required
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Durée *</label>
                        <input type="number" id="edit_duree" value="${etape.duree || etape.dureeJours}" min="0.01" step="0.01" required
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Unité de temps *</label>
                        <select id="edit_uniteTemps"
                                style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                            <option value="jours" ${(etape.uniteTemps || 'jours') === 'jours' ? 'selected' : ''}>Jours</option>
                            <option value="heures" ${etape.uniteTemps === 'heures' ? 'selected' : ''}>Heures</option>
                            <option value="minutes" ${etape.uniteTemps === 'minutes' ? 'selected' : ''}>Minutes</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Responsable</label>
                        <input type="text" id="edit_responsable" value="${etape.responsable}"
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Poste Technique</label>
                        <input type="text" id="edit_posteTechnique" value="${etape.posteTechnique}"
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Statut</label>
                        <select id="edit_statut"
                                style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                            <option value="nondemarre" ${etape.statut === 'nondemarre' ? 'selected' : ''}>Non démarré</option>
                            <option value="enCours" ${etape.statut === 'enCours' ? 'selected' : ''}>En cours</option>
                            <option value="termine" ${etape.statut === 'termine' ? 'selected' : ''}>Terminé</option>
                            <option value="enRetard" ${etape.statut === 'enRetard' ? 'selected' : ''}>En retard</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Couleur</label>
                        <input type="color" id="edit_couleur" value="${etape.couleur}"
                               style="width: 100%; height: 42px; padding: 3px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer;">
                    </div>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Prédécesseurs (Dépendances)</label>
                    <select id="edit_dependances" multiple
                            style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                        ${dependancesOptions}
                    </select>
                    <small style="color: #64748b; display: block; margin-top: 4px;">Maintenir Ctrl/Cmd pour sélectionner plusieurs tâches. Cette tâche ne pourra démarrer qu'une fois les prédécesseurs terminés.</small>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Commentaire</label>
                    <textarea id="edit_commentaire" rows="2"
                              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">${etape.commentaire}</textarea>
                </div>

                <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="document.getElementById('ganttEditModal').remove()"
                            style="padding: 10px 24px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        Annuler
                    </button>
                    <button type="submit"
                            style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        💾 Enregistrer
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Gérer la soumission du formulaire
    document.getElementById('editEtapeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Récupérer les dépendances sélectionnées
        const dependancesSelect = document.getElementById('edit_dependances');
        const selectedDependances = Array.from(dependancesSelect.selectedOptions).map(opt => opt.value);

        const updates = {
            nom: document.getElementById('edit_nom').value,
            description: document.getElementById('edit_description').value,
            dateDebut: document.getElementById('edit_dateDebut').value,
            dateFin: document.getElementById('edit_dateFin').value,
            duree: parseFloat(document.getElementById('edit_duree').value),
            uniteTemps: document.getElementById('edit_uniteTemps').value,
            responsable: document.getElementById('edit_responsable').value,
            posteTechnique: document.getElementById('edit_posteTechnique').value,
            statut: document.getElementById('edit_statut').value,
            couleur: document.getElementById('edit_couleur').value,
            commentaire: document.getElementById('edit_commentaire').value,
            dependances: selectedDependances
        };

        await updateEtape(etapeId, updates);
        renderGantt();
        modal.remove();
    });
}

/**
 * Ouvre le modal pour ajouter une nouvelle étape
 */
export function addNewEtape() {
    const modal = document.createElement('div');
    modal.id = 'ganttAddModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

    const today = new Date().toISOString().split('T')[0];

    // Générer la liste des étapes existantes pour les dépendances
    const data = getProtocoleArretData();
    const dependancesOptions = data.etapes.map(e => `
        <option value="${e.id}">${e.nom}</option>
    `).join('');

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #1e293b;">➕ Nouvelle étape</h2>
                <button onclick="document.getElementById('ganttAddModal').remove()"
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b;">×</button>
            </div>

            <form id="addEtapeForm" style="display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Nom de l'étape *</label>
                    <input type="text" id="add_nom" required placeholder="Ex: Drainage circuit principal"
                           style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Description</label>
                    <textarea id="add_description" rows="3" placeholder="Description détaillée de l'étape..."
                              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;"></textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Date début *</label>
                        <input type="date" id="add_dateDebut" value="${today}" required
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Date fin *</label>
                        <input type="date" id="add_dateFin" value="${today}" required
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Durée *</label>
                        <input type="number" id="add_duree" value="1" min="0.01" step="0.01" required
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Unité de temps *</label>
                        <select id="add_uniteTemps"
                                style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                            <option value="jours" selected>Jours</option>
                            <option value="heures">Heures</option>
                            <option value="minutes">Minutes</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Responsable</label>
                        <input type="text" id="add_responsable" placeholder="Ex: Équipe mécanique"
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Poste Technique</label>
                        <input type="text" id="add_posteTechnique" placeholder="Ex: MECA"
                               style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Couleur</label>
                    <input type="color" id="add_couleur" value="#3b82f6"
                           style="width: 100%; height: 42px; padding: 3px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Prédécesseurs (Dépendances)</label>
                    <select id="add_dependances" multiple
                            style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                        ${dependancesOptions}
                    </select>
                    <small style="color: #64748b; display: block; margin-top: 4px;">Maintenir Ctrl/Cmd pour sélectionner plusieurs tâches. Cette tâche ne pourra démarrer qu'une fois les prédécesseurs terminés.</small>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Commentaire</label>
                    <textarea id="add_commentaire" rows="2" placeholder="Notes additionnelles..."
                              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;"></textarea>
                </div>

                <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="document.getElementById('ganttAddModal').remove()"
                            style="padding: 10px 24px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        Annuler
                    </button>
                    <button type="submit"
                            style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        ➕ Créer
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Gérer la soumission
    document.getElementById('addEtapeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Récupérer les dépendances sélectionnées
        const dependancesSelect = document.getElementById('add_dependances');
        const selectedDependances = Array.from(dependancesSelect.selectedOptions).map(opt => opt.value);

        const etapeData = {
            nom: document.getElementById('add_nom').value,
            description: document.getElementById('add_description').value,
            dateDebut: document.getElementById('add_dateDebut').value,
            dateFin: document.getElementById('add_dateFin').value,
            duree: parseFloat(document.getElementById('add_duree').value),
            uniteTemps: document.getElementById('add_uniteTemps').value,
            responsable: document.getElementById('add_responsable').value,
            posteTechnique: document.getElementById('add_posteTechnique').value,
            couleur: document.getElementById('add_couleur').value,
            commentaire: document.getElementById('add_commentaire').value,
            dependances: selectedDependances
        };

        await addEtape(etapeData);
        renderGantt();
        modal.remove();
    });
}

/**
 * Supprime une étape avec confirmation
 */
export async function deleteEtapeConfirm(etapeId) {
    const data = getProtocoleArretData();
    const etape = data.etapes.find(e => e.id === etapeId);

    if (!etape) return;

    if (confirm(`Voulez-vous vraiment supprimer l'étape "${etape.nom}" ?`)) {
        await deleteEtape(etapeId);
        renderGantt();
    }
}

/**
 * Génère des étapes d'exemple
 */
export async function genererExemples() {
    await genererEtapesExemple();
    renderGantt();
}

/**
 * Exporte le Gantt en PDF
 */
export function exportToPDF() {
    console.log('[GANTT] 📄 Export PDF...');

    const data = getProtocoleArretData();
    const etapes = getEtapesSortedByDate();

    if (etapes.length === 0) {
        alert('⚠️ Aucune étape à exporter');
        return;
    }

    try {
        if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
            alert('❌ Bibliothèque jsPDF non chargée');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Format paysage

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;

        // Titre
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text('Protocole d\'Arrêt et Drainage - Gantt', pageWidth / 2, 20, { align: 'center' });

        // Date d'export
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 27, { align: 'center' });

        // Tableau des étapes
        let yPos = 40;
        const colWidths = [50, 25, 25, 25, 30, 55, 25];
        const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1],
                      margin + colWidths[0] + colWidths[1] + colWidths[2],
                      margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
                      margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
                      margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5]];

        // En-tête du tableau
        doc.setFillColor(102, 126, 234);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');

        doc.text('Nom de l\'étape', colX[0] + 2, yPos + 7);
        doc.text('Début', colX[1] + 2, yPos + 7);
        doc.text('Fin', colX[2] + 2, yPos + 7);
        doc.text('Durée', colX[3] + 2, yPos + 7);
        doc.text('Responsable', colX[4] + 2, yPos + 7);
        doc.text('Prédécesseurs', colX[5] + 2, yPos + 7);
        doc.text('Statut', colX[6] + 2, yPos + 7);

        yPos += 10;

        // Lignes des étapes
        doc.setFont(undefined, 'normal');
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);

        const statusLabels = {
            nondemarre: 'Non démarré',
            enCours: 'En cours',
            termine: 'Terminé',
            enRetard: 'En retard'
        };

        etapes.forEach((etape, index) => {
            // Vérifier si on doit changer de page
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
            }

            // Alternance de couleur
            if (index % 2 === 0) {
                doc.setFillColor(249, 249, 249);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
            }

            // Nom (tronqué si trop long)
            const nomText = doc.splitTextToSize(etape.nom, colWidths[0] - 4);
            doc.text(nomText[0], colX[0] + 2, yPos + 6);

            // Dates
            doc.text(new Date(etape.dateDebut).toLocaleDateString('fr-FR'), colX[1] + 2, yPos + 6);
            doc.text(new Date(etape.dateFin).toLocaleDateString('fr-FR'), colX[2] + 2, yPos + 6);

            // Durée avec unité
            const duree = etape.duree || etape.dureeJours;
            const unite = etape.uniteTemps || 'jours';
            const uniteShort = unite === 'jours' ? 'j' : unite === 'heures' ? 'h' : 'min';
            doc.text(`${duree}${uniteShort}`, colX[3] + 2, yPos + 6);

            // Responsable
            const respText = doc.splitTextToSize(etape.responsable || 'N/A', colWidths[4] - 4);
            doc.text(respText[0], colX[4] + 2, yPos + 6);

            // Prédécesseurs
            if (etape.dependances && etape.dependances.length > 0) {
                const predNoms = etape.dependances.map(depId => {
                    const predEtape = data.etapes.find(e => e.id === depId);
                    return predEtape ? predEtape.nom : '?';
                }).join(', ');
                const predText = doc.splitTextToSize(predNoms, colWidths[5] - 4);
                doc.text(predText[0], colX[5] + 2, yPos + 6);
            } else {
                doc.text('-', colX[5] + 2, yPos + 6);
            }

            // Statut
            doc.text(statusLabels[etape.statut] || 'N/A', colX[6] + 2, yPos + 6);

            yPos += 8;
        });

        // Pied de page
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Total: ${etapes.length} étape(s)`, margin, pageHeight - 10);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

        // Afficher le PDF dans un nouvel onglet
        const filename = `Protocole_Arret_Gantt_${new Date().toISOString().split('T')[0]}.pdf`;
        window.libLoader.displayPDF(doc, filename);

        console.log('[GANTT] ✅ PDF exporté:', filename);

    } catch (error) {
        console.error('[GANTT] ❌ Erreur export PDF:', error);
        alert('❌ Erreur lors de l\'export PDF. Vérifiez la console.');
    }
}

// Exposer globalement
window.protocoleGantt = {
    initGantt,
    renderGantt,
    addNewEtape,
    editEtape,
    deleteEtapeConfirm,
    genererExemples,
    exportToPDF
};

console.log('[GANTT] ✅ Module Gantt chargé');
