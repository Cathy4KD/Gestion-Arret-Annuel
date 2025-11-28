/**
 * @fileoverview Module de gestion de l'équipe de gestion
 * @module entities/team
 *
 * @description
 * Gère l'équipe de gestion de l'arrêt annuel avec organigramme
 * Source: lignes 10241-10495 du fichier HTML original
 *
 * @exports {Function} loadTeamData
 * @exports {Function} saveTeamData
 * @exports {Function} addTeamMember
 * @exports {Function} deleteTeamMember
 * @exports {Function} updateTeamField
 * @exports {Function} renderTeamTable
 * @exports {Function} renderOrganigramme
 * @exports {Function} exportTeamToExcel
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

let teamData = [];

/**
 * Set team data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setTeamData(data) {
    teamData = Array.isArray(data) ? data : [];
    console.log(`[TEAM] ✅ Données injectées: ${teamData.length} membres`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setTeamData = setTeamData;
}

export async function loadTeamData() {
    const saved = await loadFromStorage('teamData');
    if (saved && Array.isArray(saved)) {
        teamData = saved;
        console.log('[OK] Données équipe chargées:', teamData.length, 'membres');
        renderTeamTable();
        renderOrganigramme();
    } else {
        teamData = [];
        renderTeamTable();
        renderOrganigramme();
    }
}

export async function saveTeamData() {
    await saveToStorage('teamData', teamData);
    console.log('[OK] Données équipe sauvegardées et synchronisées avec le serveur');
}

export function addTeamMember() {
    const newMember = {
        id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nom: '',
        role: '',
        telephone: '',
        email: '',
        niveau: 1
    };

    teamData.push(newMember);
    saveTeamData();
    renderTeamTable();
    renderOrganigramme();
}

export function deleteTeamMember(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
        teamData = teamData.filter(member => member.id !== id);
        saveTeamData();
        renderTeamTable();
        renderOrganigramme();
    }
}

export function updateTeamField(id, field, value) {
    const member = teamData.find(m => m.id === id);
    if (member) {
        member[field] = value;
        saveTeamData();
        renderOrganigramme();
    }
}

export function renderTeamTable() {
    const tbody = document.getElementById('teamTableBody');
    const countSpan = document.getElementById('teamCount');

    if (!tbody) return;

    if (!Array.isArray(teamData) || teamData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666;">
                    Aucun membre dans l'équipe. Cliquez sur "Ajouter un membre" pour commencer.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = teamData.length;

    teamData.forEach((member, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${member.nom || ''}"
                       placeholder="Nom complet"
                       onchange="window.teamActions.updateField('${member.id}', 'nom', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${member.role || ''}"
                       placeholder="Rôle"
                       onchange="window.teamActions.updateField('${member.id}', 'role', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="window.teamActions.updateField('${member.id}', 'niveau', parseInt(this.value))"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; text-align: center; font-weight: bold;">
                    <option value="1" ${(member.niveau === 1 || !member.niveau) ? 'selected' : ''}>Niveau 1 - Direction</option>
                    <option value="2" ${member.niveau === 2 ? 'selected' : ''}>Niveau 2 - Coordinateurs</option>
                    <option value="3" ${member.niveau === 3 ? 'selected' : ''}>Niveau 3 - Responsables</option>
                    <option value="4" ${member.niveau === 4 ? 'selected' : ''}>Niveau 4 - Équipe</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="tel"
                       value="${member.telephone || ''}"
                       placeholder="(123) 456-7890"
                       onchange="window.teamActions.updateField('${member.id}', 'telephone', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="email"
                       value="${member.email || ''}"
                       placeholder="nom@example.com"
                       onchange="window.teamActions.updateField('${member.id}', 'email', this.value)"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.teamActions.deleteMember('${member.id}')"
                        class="btn"
                        style="background: linear-gradient(145deg, #dc3545, #c82333); color: white; padding: 6px 12px; font-size: 0.9em;">
                    🗑️ Supprimer
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

export function renderOrganigramme() {
    const container = document.getElementById('organigramme');
    if (!container) return;

    if (!teamData || teamData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <p>Aucun membre dans l'équipe. Ajoutez des membres pour afficher l'organigramme.</p>
            </div>
        `;
        return;
    }

    // Grouper par niveau hiérarchique
    const niveau1 = teamData.filter(m => (m.niveau === 1 || !m.niveau));
    const niveau2 = teamData.filter(m => m.niveau === 2);
    const niveau3 = teamData.filter(m => m.niveau === 3);
    const niveau4 = teamData.filter(m => m.niveau === 4);

    // Couleurs par niveau
    const colors = {
        1: '#667eea',  // Violet - Direction
        2: '#48bb78',  // Vert - Coordinateurs
        3: '#f6ad55',  // Orange - Responsables
        4: '#4299e1'   // Bleu - Équipe
    };

    let html = '<div style="display: flex; flex-direction: column; align-items: center; gap: 30px;">';

    let previousLevelHasMembers = false;

    // Niveau 1: Direction
    if (niveau1.length > 0) {
        html += '<div style="text-align: center; margin-bottom: 10px;"><strong style="color: #667eea; font-size: 1.1em;">Niveau 1 - Direction</strong></div>';
        html += '<div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">';
        niveau1.forEach(member => {
            html += createOrgCard(member, colors[1]);
        });
        html += '</div>';
        previousLevelHasMembers = true;
    }

    // Niveau 2: Coordinateurs
    if (niveau2.length > 0) {
        if (previousLevelHasMembers) {
            html += '<div style="width: 2px; height: 30px; background: #cbd5e0;"></div>';
        }
        html += '<div style="text-align: center; margin-bottom: 10px;"><strong style="color: #48bb78; font-size: 1.1em;">Niveau 2 - Coordinateurs</strong></div>';
        html += '<div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">';
        niveau2.forEach(member => {
            html += createOrgCard(member, colors[2]);
        });
        html += '</div>';
        previousLevelHasMembers = true;
    }

    // Niveau 3: Responsables
    if (niveau3.length > 0) {
        if (previousLevelHasMembers) {
            html += '<div style="width: 2px; height: 30px; background: #cbd5e0;"></div>';
        }
        html += '<div style="text-align: center; margin-bottom: 10px;"><strong style="color: #f6ad55; font-size: 1.1em;">Niveau 3 - Responsables</strong></div>';
        html += '<div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">';
        niveau3.forEach(member => {
            html += createOrgCard(member, colors[3]);
        });
        html += '</div>';
        previousLevelHasMembers = true;
    }

    // Niveau 4: Équipe
    if (niveau4.length > 0) {
        if (previousLevelHasMembers) {
            html += '<div style="width: 2px; height: 30px; background: #cbd5e0;"></div>';
        }
        html += '<div style="text-align: center; margin-bottom: 10px;"><strong style="color: #4299e1; font-size: 1.1em;">Niveau 4 - Équipe</strong></div>';
        html += '<div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">';
        niveau4.forEach(member => {
            html += createOrgCard(member, colors[4]);
        });
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

function createOrgCard(member, color) {
    return `
        <div style="border: 3px solid ${color}; border-radius: 10px; padding: 15px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 200px; max-width: 250px; text-align: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: ${color}; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                ${member.nom ? member.nom.substring(0, 2).toUpperCase() : '??'}
            </div>
            <div style="font-weight: bold; font-size: 1.1em; color: #2d3748; margin-bottom: 5px;">
                ${member.nom || 'Sans nom'}
            </div>
            <div style="color: white; background: ${color}; padding: 4px 8px; border-radius: 5px; font-size: 0.85em; font-weight: bold; margin-bottom: 8px;">
                ${member.role || 'Sans rôle'}
            </div>
            ${member.telephone ? `<div style="color: #718096; font-size: 0.9em;"> ${member.telephone}</div>` : ''}
            ${member.email ? `<div style="color: #718096; font-size: 0.85em; word-break: break-all;"> ${member.email}</div>` : ''}
        </div>
    `;
}

export function exportTeamToExcel() {
    if (!teamData || teamData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    const exportData = teamData.map(member => {
        let niveauLabel = 'Niveau 1 - Direction';
        if (member.niveau === 2) niveauLabel = 'Niveau 2 - Coordinateurs';
        else if (member.niveau === 3) niveauLabel = 'Niveau 3 - Responsables';
        else if (member.niveau === 4) niveauLabel = 'Niveau 4 - Équipe';

        return {
            'Nom': member.nom,
            'Rôle': member.role,
            'Niveau': niveauLabel,
            'Téléphone': member.telephone,
            'Adresse mail': member.email
        };
    });

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Équipe de Gestion');

    const fileName = `Equipe_Gestion_Arrets_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(` Fichier exporté: ${fileName}`);
}

export function getTeamData() {
    return teamData;
}
