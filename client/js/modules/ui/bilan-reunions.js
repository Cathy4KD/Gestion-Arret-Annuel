/**
 * @fileoverview Module UI pour le bilan des réunions de préparation
 * @module ui/bilan-reunions
 */

import { arretData } from '../data/arret-data.js';
import { getStartDate } from '../data/settings.js';
import { updateTaskStatus } from '../data/task-manager.js';

/**
 * Calcule la date d'une réunion en fonction des semaines avant l'arrêt
 * @param {string} startDate - Date de début de l'arrêt (format ISO: YYYY-MM-DD)
 * @param {number} weeks - Nombre de semaines (négatif pour avant l'arrêt)
 * @returns {string} Date calculée au format YYYY-MM-DD
 */
function calculateReunionDate(startDate, weeks) {
    if (!startDate) {
        return 'N/A';
    }

    try {
        const date = new Date(startDate);

        // Vérifier que la date est valide
        if (isNaN(date.getTime())) {
            console.warn(`[REUNIONS] Date invalide: ${startDate}`);
            return 'N/A';
        }

        date.setDate(date.getDate() + (weeks * 7));

        // Vérifier à nouveau après le calcul
        if (isNaN(date.getTime())) {
            console.warn(`[REUNIONS] Date calculée invalide pour ${startDate} + ${weeks} semaines`);
            return 'N/A';
        }

        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('[REUNIONS] Erreur calcul date:', error);
        return 'N/A';
    }
}

/**
 * Détermine si une réunion est récurrente
 * @param {string} titre - Titre de la tâche
 * @returns {Object} {isRecurrent: boolean, type: string, count: number}
 */
function detectRecurrence(titre) {
    const titreUpper = titre.toUpperCase();

    if (titreUpper.includes('HEBDO') || titreUpper.includes('HEBDOMADAIRE')) {
        return { isRecurrent: true, type: 'Hebdomadaire', count: 'Multiple', frequency: 'hebdo' };
    }

    if (titreUpper.includes('MENSUEL') || titreUpper.includes('MENSUELLE')) {
        return { isRecurrent: true, type: 'Mensuel', count: 'Multiple', frequency: 'mensuel' };
    }

    if (titreUpper.includes('QUOTIDIEN') || titreUpper.includes('JOURNALIER')) {
        return { isRecurrent: true, type: 'Quotidien', count: 'Multiple', frequency: 'quotidien' };
    }

    return { isRecurrent: false, type: 'Unique', count: 1, frequency: 'unique' };
}

/**
 * Détermine la catégorie d'une réunion
 * @param {string} titre - Titre de la réunion
 * @returns {string} Catégorie
 */
function getCategorieReunion(titre) {
    const titreUpper = titre.toUpperCase();

    if (titreUpper.includes('MAGASIN') || titreUpper.includes('APPROVISIONNEMENT') ||
        titreUpper.includes('INVENTAIRE') || titreUpper.includes('STOCK')) {
        return 'magasin';
    }

    if (titreUpper.includes('ENTREPRENEUR') || titreUpper.includes('SOUS-TRAITANCE') ||
        titreUpper.includes('EXTERNE')) {
        return 'entrepreneurs';
    }

    if (titreUpper.includes('SÉCURITÉ') || titreUpper.includes('SSE') || titreUpper.includes('SST')) {
        return 'securite';
    }

    if (titreUpper.includes('SYNDICAT') || titreUpper.includes('SYNDICAL')) {
        return 'syndicale';
    }

    if (titreUpper.includes('DÉFINITION') || titreUpper.includes('CONCERTATION') ||
        titreUpper.includes('PRÉ-ARRÊT') || titreUpper.includes('SIMULATION')) {
        return 'strategique';
    }

    if (titreUpper.includes('TECHNIQUE') || titreUpper.includes('TRAVAUX') ||
        titreUpper.includes('ÉQUIPE')) {
        return 'technique';
    }

    return 'generale';
}

/**
 * Extrait toutes les tâches de réunion depuis les phases
 * @returns {Array<Object>} Liste des réunions
 */
export function extractReunions() {
    const reunions = [];
    const startDate = getStartDate();

    if (!arretData.phases || arretData.phases.length === 0) {
        console.warn('[REUNIONS] Aucune phase trouvée');
        return reunions;
    }

    arretData.phases.forEach(phase => {
        if (!phase.taches) return;

        phase.taches.forEach(tache => {
            // Filtrer les tâches qui contiennent "RENCONTRE" ou "RÉUNION"
            const titre = tache.titre || '';
            if (titre.toUpperCase().includes('RENCONTRE') ||
                titre.toUpperCase().includes('RÉUNION') ||
                titre.toUpperCase().includes('REUNION')) {

                const recurrence = detectRecurrence(titre);
                const categorie = getCategorieReunion(titre);

                // Déterminer si la réunion a une page de détail
                let clickable = tache.clickable || false;
                let page = tache.page || null;

                // Ajouter les pages de détail pour les réunions spécifiques
                if (tache.id === 't78') {
                    clickable = true;
                    page = 'detail-t78';
                } else if (tache.id === 't111') {
                    clickable = true;
                    page = 'detail-t111';
                } else if (tache.id === 't144') {
                    clickable = true;
                    page = 'detail-t144';
                }

                reunions.push({
                    id: tache.id,
                    titre: titre,
                    phase: phase.nom,
                    semaines: phase.semaines || 0,
                    datePrevue: calculateReunionDate(startDate, phase.semaines || 0),
                    responsable: tache.responsable || 'N/A',
                    avancement: tache.avancement || 0,
                    statut: tache.statut || 'notstarted',
                    commentaire: tache.commentaire || '',
                    isRecurrent: recurrence.isRecurrent,
                    typeRecurrence: recurrence.type,
                    countRecurrence: recurrence.count,
                    frequency: recurrence.frequency,
                    categorie: categorie,
                    clickable: clickable,
                    page: page
                });
            }
        });
    });

    // Trier par nombre de semaines (du plus loin au plus proche)
    reunions.sort((a, b) => a.semaines - b.semaines);

    return reunions;
}

/**
 * Obtient le badge HTML pour le statut
 * @param {string} statut - Statut de la tâche
 * @returns {string} HTML du badge
 */
function getStatutBadge(statut) {
    const badges = {
        'completed': '<span style="background: #4caf50; color: white; padding: 5px 10px; border-radius: 5px; font-weight: 600;">✓ Complété</span>',
        'inprogress': '<span style="background: #ffc107; color: white; padding: 5px 10px; border-radius: 5px; font-weight: 600;">⏳ En cours</span>',
        'notstarted': '<span style="background: #f44336; color: white; padding: 5px 10px; border-radius: 5px; font-weight: 600;">● Non commencé</span>',
        'cancelled': '<span style="background: #9e9e9e; color: white; padding: 5px 10px; border-radius: 5px; font-weight: 600;">✕ Annulé</span>'
    };

    return badges[statut] || badges['notstarted'];
}

/**
 * Change le statut d'une réunion
 * @param {string} taskId - ID de la tâche
 */
function toggleReunionStatus(taskId) {
    // Trouver la tâche dans arretData
    let task = null;
    let phase = null;

    for (const p of arretData.phases) {
        const t = p.taches.find(t => t.id === taskId);
        if (t) {
            task = t;
            phase = p;
            break;
        }
    }

    if (!task) {
        console.error('[REUNIONS] Tâche non trouvée:', taskId);
        return;
    }

    // Cycle de statut: notstarted -> inprogress -> completed -> notstarted
    const statusCycle = {
        'notstarted': 'inprogress',
        'inprogress': 'completed',
        'completed': 'notstarted',
        'cancelled': 'notstarted'
    };

    const newStatus = statusCycle[task.statut] || 'inprogress';

    // Mettre à jour le statut
    updateTaskStatus(taskId, newStatus);

    // Si complété, mettre l'avancement à 100
    if (newStatus === 'completed') {
        task.avancement = 100;
    }

    // Re-rendre le tableau
    renderReunionsTable();
}

/**
 * Rend le tableau des réunions
 */
export function renderReunionsTable() {
    const tbody = document.getElementById('reunionsTableBody');
    if (!tbody) {
        console.warn('[REUNIONS] Tableau non trouvé');
        return;
    }

    const reunions = extractReunions();

    // Calculer les statistiques
    const stats = {
        total: reunions.length,
        completed: reunions.filter(r => r.statut === 'completed').length,
        inprogress: reunions.filter(r => r.statut === 'inprogress').length,
        notstarted: reunions.filter(r => r.statut === 'notstarted' || !r.statut).length
    };

    // Mettre à jour les statistiques
    const totalEl = document.getElementById('totalReunions');
    const completedEl = document.getElementById('reunionsCompleted');
    const enCoursEl = document.getElementById('reunionsEnCours');
    const nonCommenceesEl = document.getElementById('reunionsNonCommencees');

    if (totalEl) totalEl.textContent = stats.total;
    if (completedEl) completedEl.textContent = stats.completed;
    if (enCoursEl) enCoursEl.textContent = stats.inprogress;
    if (nonCommenceesEl) nonCommenceesEl.textContent = stats.notstarted;

    // Remplir le tableau
    tbody.innerHTML = '';

    if (reunions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    Aucune réunion trouvée dans les phases de préparation.
                </td>
            </tr>
        `;
        return;
    }

    // Grouper par catégorie
    const categories = {
        'strategique': { titre: '🎯 Réunions Stratégiques', color: '#667eea', reunions: [] },
        'magasin': { titre: '📦 Réunions Magasin & Approvisionnement', color: '#d9a72e', reunions: [] },
        'entrepreneurs': { titre: '🏗️ Réunions Entrepreneurs', color: '#4a7c59', reunions: [] },
        'securite': { titre: '🛡️ Réunions Sécurité', color: '#f06292', reunions: [] },
        'syndicale': { titre: '👥 Réunions Syndicales', color: '#9c27b0', reunions: [] },
        'technique': { titre: '🔧 Réunions Techniques', color: '#00bcd4', reunions: [] },
        'generale': { titre: '📋 Autres Réunions', color: '#607d8b', reunions: [] }
    };

    // Répartir les réunions par catégorie
    reunions.forEach(reunion => {
        if (categories[reunion.categorie]) {
            categories[reunion.categorie].reunions.push(reunion);
        }
    });

    // Afficher chaque catégorie
    Object.keys(categories).forEach(catKey => {
        const cat = categories[catKey];
        if (cat.reunions.length === 0) return; // Ignorer les catégories vides

        // En-tête de catégorie
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <td colspan="8" style="background: linear-gradient(145deg, ${cat.color}, ${cat.color}dd); color: white; font-weight: bold; padding: 12px; font-size: 1.05em;">
                ${cat.titre} (${cat.reunions.length})
            </td>
        `;
        tbody.appendChild(headerRow);

        // Lignes de réunions
        cat.reunions.forEach(reunion => {
            const row = document.createElement('tr');

            // Appliquer un style si complété
            if (reunion.statut === 'completed') {
                row.style.background = '#f1f8f4';
            }

            // Badge récurrence
            let recurrenceBadge = '';
            if (reunion.isRecurrent) {
                recurrenceBadge = `<span style="background: #ff9800; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75em; margin-left: 8px;">♻️ ${reunion.typeRecurrence}</span>`;
            }

            // Rendre le titre cliquable si la réunion a une page de détail
            const titreHTML = reunion.clickable && reunion.page
                ? `<span onclick="window.switchToPage('${reunion.page}')" style="cursor: pointer; color: #667eea; text-decoration: underline; font-weight: 500;" title="Voir le compte rendu">${reunion.titre}</span>`
                : reunion.titre;

            row.innerHTML = `
                <td style="text-align: center; font-size: 0.85em; color: #666;">${reunion.semaines}sem</td>
                <td>${titreHTML}${recurrenceBadge}</td>
                <td style="text-align: center; font-weight: 600;">${reunion.semaines}</td>
                <td style="text-align: center;">${reunion.datePrevue}</td>
                <td style="text-align: center; font-weight: 600;">${reunion.responsable}</td>
                <td style="text-align: center;">
                    <div style="background: #e0e0e0; height: 25px; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="background: linear-gradient(90deg, ${cat.color} 0%, ${cat.color}cc 100%); height: 100%; width: ${reunion.avancement}%; transition: width 0.3s ease;"></div>
                        <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.85em; font-weight: 600; color: #333;">${reunion.avancement}%</span>
                    </div>
                </td>
                <td style="text-align: center;">
                    <button onclick="window.toggleReunionStatus('${reunion.id}')" style="border: none; background: none; cursor: pointer; padding: 0;">
                        ${getStatutBadge(reunion.statut)}
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    });

    console.log(`[REUNIONS] ${reunions.length} réunions affichées`);
}

/**
 * Obtient les statistiques des réunions pour le dashboard
 * @returns {Object} Statistiques : total, complétées, en cours, non commencées, par catégorie
 */
export function getReunionsStats() {
    const reunions = extractReunions();

    const stats = {
        total: reunions.length,
        completed: reunions.filter(r => r.statut === 'completed').length,
        inprogress: reunions.filter(r => r.statut === 'inprogress').length,
        notstarted: reunions.filter(r => r.statut === 'notstarted' || !r.statut).length,
        cancelled: reunions.filter(r => r.statut === 'cancelled').length,

        // Par catégorie
        byCategory: {},

        // Par type de récurrence
        byType: {
            unique: reunions.filter(r => !r.isRecurrent).length,
            recurrent: reunions.filter(r => r.isRecurrent).length,
            hebdo: reunions.filter(r => r.frequency === 'hebdo').length,
            mensuel: reunions.filter(r => r.frequency === 'mensuel').length,
            quotidien: reunions.filter(r => r.frequency === 'quotidien').length
        }
    };

    // Compter par catégorie
    const categories = ['strategique', 'magasin', 'entrepreneurs', 'securite', 'syndicale', 'technique', 'generale'];
    categories.forEach(cat => {
        stats.byCategory[cat] = reunions.filter(r => r.categorie === cat).length;
    });

    return stats;
}

/**
 * Expose les fonctions globalement
 */
if (typeof window !== 'undefined') {
    window.toggleReunionStatus = toggleReunionStatus;
}

console.log('[REUNIONS] Module initialisé');
