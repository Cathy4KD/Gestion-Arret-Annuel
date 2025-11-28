/**
 * @fileoverview Module Calendar - Gestion du calendrier mensuel des tâches
 * @module ui/calendar
 *
 * Ce module gère l'affichage du calendrier mensuel qui affiche les tâches
 * organisées par date. Supporte la navigation entre les mois et l'affichage
 * des tâches avec leurs statuts.
 *
 * Source: arret-annuel-avec-liste.html lignes 14033-14140, 11869-12037
 */

import { arretData } from '../data/arret-data.js';
import { getPreparationPhases } from './summary.js';
import { switchPage } from '../navigation.js';

/**
 * Date actuelle affichée dans le calendrier principal
 * @type {Date}
 */
let currentCalendarDate = new Date();

/**
 * Date actuelle affichée dans le calendrier TPAA/PW
 * @type {Date}
 */
let currentTPAAPWDate = new Date();

/**
 * Noms des mois en français
 * @constant {string[]}
 */
const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Noms des jours en abrégé
 * @constant {string[]}
 */
const DAY_HEADERS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/**
 * Récupère toutes les tâches clickables depuis les données de préparation
 * @returns {Object} Map des tâches clickables {id: page}
 */
async function getClickableTasks() {
    const clickableTasks = {};
    const phases = await getPreparationPhases();

    phases.forEach(phase => {
        phase.taches.forEach(tache => {
            if (tache.clickable && tache.page) {
                clickableTasks[tache.id] = tache.page;
            }
        });
    });

    return clickableTasks;
}

/**
 * Vérifie si une tâche possède une page de détail
 * @param {string} taskId - ID de la tâche
 * @returns {boolean} true si la tâche a une page de détail
 */
function hasDetailPage(taskId) {
    const clickableTasks = getClickableTasks();
    return clickableTasks.hasOwnProperty(taskId);
}

/**
 * Ouvre la page de détail d'une tâche
 * @param {string} taskId - ID de la tâche
 */
function openTaskDetail(taskId) {
    const clickableTasks = getClickableTasks();
    const page = clickableTasks[taskId];

    if (page) {
        console.log(`[CALENDAR] Ouverture de la page: ${page}`);
        switchPage(page);
    } else {
        console.warn(`[CALENDAR] Aucune page de détail pour la tâche ${taskId}`);
    }
}

/**
 * Change le mois du calendrier principal
 *
 * @param {number} offset - Décalage en mois (-1 pour mois précédent, +1 pour mois suivant, 0 pour aujourd'hui)
 * @returns {void}
 *
 * @example
 * changeCalendarMonth(-1); // Mois précédent
 * changeCalendarMonth(1);  // Mois suivant
 * changeCalendarMonth(0);  // Aujourd'hui
 */
export async function changeCalendarMonth(offset) {
    if (offset === 0) {
        currentCalendarDate = new Date();
    } else {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    }
    await renderCalendar();
}

/**
 * Rend le calendrier mensuel principal avec les tâches
 *
 * Affiche un calendrier complet du mois en cours avec:
 * - En-têtes des jours de la semaine
 * - Jours du mois précédent/suivant pour compléter la grille
 * - Jusqu'à 3 tâches par jour
 * - Indicateur du nombre de tâches supplémentaires
 *
 * @returns {void}
 *
 * @example
 * await renderCalendar();
 */
export async function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Obtenir le premier jour du mois et le dernier jour
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Obtenir le jour de la semaine du premier jour (0 = dimanche)
    const firstDayOfWeek = firstDay.getDay();

    // Obtenir le dernier jour du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Charger les phases UNE SEULE FOIS avant les boucles
    const phases = await getPreparationPhases();

    let html = `<h4 style="text-align: center; color: #667eea; margin-bottom: 15px; font-size: 1.2em;">
        ${MONTH_NAMES[month]} ${year}</h4>`;

    html += '<div class="calendar-grid">';

    // En-têtes des jours
    DAY_HEADERS.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Jours du mois précédent
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month">
            <div class="calendar-day-number">${day}</div>
        </div>`;
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateString = currentDate.toISOString().split('T')[0];

        // Trouver les tâches pour cette date depuis les données de préparation
        const tasksForDay = [];

        phases.forEach(phase => {
            // Calculer la date de la phase si elle n'existe pas
            let phaseDate = phase.date;
            if (!phaseDate && phase.semaines !== undefined && arretData.dateDebut) {
                // Calculer la date en fonction des semaines avant l'arrêt
                const shutdownDate = new Date(arretData.dateDebut);
                const phaseCalculatedDate = new Date(shutdownDate);
                phaseCalculatedDate.setDate(shutdownDate.getDate() + (phase.semaines * 7));
                phaseDate = phaseCalculatedDate.toISOString().split('T')[0];
            }

            phase.taches.forEach(tache => {
                // Utiliser la date de la phase ou la date de la tâche si elle existe
                const taskDate = tache.date || phaseDate;
                if (taskDate === dateString) {
                    tasksForDay.push({
                        ...tache,
                        phaseName: phase.nom
                    });
                }
            });
        });

        html += `<div class="calendar-day">
            <div class="calendar-day-number">${day}</div>`;

        // Afficher jusqu'à 3 tâches
        const displayTasks = tasksForDay.slice(0, 3);
        displayTasks.forEach(task => {
            const isClickable = hasDetailPage(task.id);
            const clickableStyle = isClickable ? 'cursor: pointer; text-decoration: underline;' : '';
            const clickableAction = isClickable ? `onclick="openTaskDetail('${task.id}')"` : '';
            html += `<div class="calendar-task ${task.statut}" title="${task.titre} - ${task.phaseName}"
                          style="${clickableStyle}" ${clickableAction}>
                ${task.titre.substring(0, 20)}${task.titre.length > 20 ? '...' : ''}
            </div>`;
        });

        // Si plus de 3 tâches, afficher un compteur
        if (tasksForDay.length > 3) {
            html += `<div class="calendar-task-count">+${tasksForDay.length - 3} autres</div>`;
        }

        html += '</div>';
    }

    // Jours du mois suivant pour compléter la grille
    const totalCells = firstDayOfWeek + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">
                <div class="calendar-day-number">${day}</div>
            </div>`;
        }
    }

    html += '</div>';

    const calendarView = document.getElementById('calendarView');
    if (calendarView) {
        calendarView.innerHTML = html;
    }
}

/**
 * Change le mois du calendrier TPAA/PW
 *
 * @param {number} delta - Décalage en mois (-1 pour précédent, +1 pour suivant)
 * @returns {void}
 *
 * @example
 * changeTPAAPWMonth(-1); // Mois précédent
 * changeTPAAPWMonth(1);  // Mois suivant
 */
export function changeTPAAPWMonth(delta) {
    currentTPAAPWDate.setMonth(currentTPAAPWDate.getMonth() + delta);
    renderTPAAPWCalendar();
}

/**
 * Rend le calendrier TPAA/PW
 *
 * Affiche un calendrier combinant les données TPAA et PW.
 * Les items sont groupés par date et affichés dans le calendrier.
 *
 * @param {Array} tpaaListeData - Données TPAA
 * @param {Array} pwListeData - Données PW
 * @returns {void}
 *
 * @example
 * renderTPAAPWCalendar(tpaaData, pwData);
 */
export function renderTPAAPWCalendar(tpaaListeData = [], pwListeData = []) {
    const container = document.getElementById('calendarContainer');
    if (!container) {
        console.warn('Element calendarContainer introuvable');
        return;
    }

    // Combiner TPAA et PW
    const allItems = [];

    if (Array.isArray(tpaaListeData)) {
        tpaaListeData.forEach(item => {
            if (item.date) {
                allItems.push({
                    ...item,
                    type: 'TPAA',
                    typeColor: '#667eea'
                });
            }
        });
    }

    if (Array.isArray(pwListeData)) {
        pwListeData.forEach(item => {
            if (item.date) {
                allItems.push({
                    ...item,
                    type: 'PW',
                    typeColor: '#48bb78'
                });
            }
        });
    }

    if (allItems.length === 0) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #666;">
                Aucun travail TPAA ou PW avec date disponible pour afficher le calendrier.
            </div>
        `;
        return;
    }

    // Grouper les items par date
    const itemsByDate = {};
    allItems.forEach(item => {
        if (!itemsByDate[item.date]) {
            itemsByDate[item.date] = [];
        }
        itemsByDate[item.date].push(item);
    });

    // Générer le HTML avec navigation
    const year = currentTPAAPWDate.getFullYear();
    const month = currentTPAAPWDate.getMonth();

    let html = `
        <div style="margin-bottom: 20px; display: flex; justify-content: center; align-items: center; gap: 20px;">
            <button onclick="changeTPAAPWMonth(-1)" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                ◀ Mois précédent
            </button>
            <button onclick="changeTPAAPWMonth(1)" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                Mois suivant ▶
            </button>
        </div>
    `;

    html += '<div style="max-width: 1400px; margin: 0 auto;">';
    html += renderMonthCalendar(year, month, itemsByDate);
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Rend un calendrier mensuel générique avec des items par date
 *
 * Fonction utilitaire pour générer le HTML d'un calendrier mensuel
 * avec des items personnalisés pour chaque jour.
 *
 * @param {number} year - Année
 * @param {number} month - Mois (0-11)
 * @param {Object.<string, Array>} itemsByDate - Items groupés par date (format ISO)
 * @returns {string} HTML du calendrier
 *
 * @example
 * const html = renderMonthCalendar(2026, 0, {'2026-01-15': [item1, item2]});
 */
export function renderMonthCalendar(year, month, itemsByDate) {
    // Obtenir le premier jour du mois et le dernier jour
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Obtenir le jour de la semaine du premier jour (0 = dimanche)
    const firstDayOfWeek = firstDay.getDay();

    // Obtenir le dernier jour du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    let html = `
        <div style="border: 2px solid #e2e8f0; border-radius: 10px; padding: 15px; background: #f8f9fa;">
            <h4 style="text-align: center; color: #667eea; margin-bottom: 15px; font-size: 1.2em;">
                ${MONTH_NAMES[month]} ${year}
            </h4>
            <div class="calendar-grid">
    `;

    // En-têtes des jours
    DAY_HEADERS.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Jours du mois précédent
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month">
            <div class="calendar-day-number">${day}</div>
        </div>`;
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateString = currentDate.toISOString().split('T')[0];

        // Récupérer les items pour cette date
        const itemsForDay = itemsByDate[dateString] || [];

        html += `<div class="calendar-day" style="min-height: 100px;">
            <div class="calendar-day-number">${day}</div>`;

        // Afficher jusqu'à 2 items
        const displayItems = itemsForDay.slice(0, 2);
        displayItems.forEach(item => {
            const statusColors = {
                'Complété': '#48bb78',
                'Planifié': '#4299e1',
                'Annulé': '#f56565',
                'Cloturé': '#9f7aea'
            };
            const statusColor = statusColors[item.statut] || '#718096';

            html += `
                <div style="background: ${item.typeColor}; color: white; padding: 3px 5px; margin: 2px 0; border-radius: 3px; font-size: 0.7em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;"
                     title="${item.type} - ${item.ordre}: ${item.designOperation} (${item.statut})"
                     onclick="showDayDetailsModal('${dateString}')">
                    <strong>${item.type}:</strong> ${item.designOperation.substring(0, 25)}${item.designOperation.length > 25 ? '...' : ''}
                </div>
            `;
        });

        // Si plus de 2 items, afficher un compteur
        if (itemsForDay.length > 2) {
            html += `<div style="font-size: 0.7em; color: #666; margin-top: 2px; cursor: pointer; text-decoration: underline;"
                          onclick="showDayDetailsModal('${dateString}')">+${itemsForDay.length - 2} autre(s)</div>`;
        }

        html += '</div>';
    }

    // Jours du mois suivant pour compléter la grille
    const totalCells = firstDayOfWeek + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">
                <div class="calendar-day-number">${day}</div>
            </div>`;
        }
    }

    html += '</div></div>';

    return html;
}

/**
 * Obtient la date actuelle du calendrier principal
 * @returns {Date} Date actuelle du calendrier
 */
export function getCurrentCalendarDate() {
    return currentCalendarDate;
}

/**
 * Définit la date actuelle du calendrier principal
 * @param {Date} date - Nouvelle date
 * @returns {void}
 */
export function setCurrentCalendarDate(date) {
    currentCalendarDate = date;
}

/**
 * Obtient la date actuelle du calendrier TPAA/PW
 * @returns {Date} Date actuelle du calendrier TPAA/PW
 */
export function getCurrentTPAAPWDate() {
    return currentTPAAPWDate;
}

/**
 * Définit la date actuelle du calendrier TPAA/PW
 * @param {Date} date - Nouvelle date
 * @returns {void}
 */
export function setCurrentTPAAPWDate(date) {
    currentTPAAPWDate = date;
}




