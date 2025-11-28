/**
 * @fileoverview Gestion des données pour les rencontres Tours de Refroidissement
 * @module data/tours-refroidissement-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les rencontres tours de refroidissement
 * @const {string}
 */
const STORAGE_KEY = 'toursRefroidissementData';

/**
 * Structure de données pour les rencontres
 * @type {Array<Object>}
 */
let rencontres = [];

/**
 * ID de la rencontre actuellement sélectionnée
 * @type {string|null}
 */
let currentRencontreId = null;

/**
 * Fonction setter pour injection des données depuis le serveur
 * @param {Array} data - Données des rencontres
 */
export function setToursRefroidissementData(data) {
    if (data && Array.isArray(data)) {
        rencontres = data;
        console.log(`[TOURS] ✅ Données rencontres injectées: ${data.length} rencontre(s)`);
    } else {
        rencontres = [];
        console.log('[TOURS] ℹ️ Aucune rencontre depuis le serveur');
    }

    // Rendre la liste si l'élément existe dans le DOM (page déjà chargée)
    if (document.getElementById('rencontresListContainer')) {
        console.log('[TOURS] 🎨 Rendu de la liste des rencontres (données du serveur)');
        renderRencontresList();

        // Sélectionner la première rencontre si elle existe
        if (rencontres.length > 0 && !currentRencontreId) {
            selectRencontre(rencontres[0].id);
        }
    }
}

// Exposer globalement pour server-sync.js
window.setToursRefroidissementData = setToursRefroidissementData;

/**
 * Charge les données depuis le serveur
 * @returns {Promise<void>}
 */
export async function loadToursRefroidissementData() {
    // Charger uniquement si pas déjà en mémoire
    if (rencontres.length === 0) {
        console.log('[TOURS] 📥 Chargement des rencontres depuis le serveur...');
        const saved = await loadFromStorage(STORAGE_KEY);
        console.log('[TOURS] Résultat du chargement:', saved ? 'Données reçues' : 'Aucune donnée');

        if (saved && Array.isArray(saved)) {
            rencontres = saved;
            console.log(`[TOURS] ✅ ${rencontres.length} rencontre(s) chargée(s)`);
            console.log('[TOURS] Données chargées:', JSON.stringify(rencontres));
        } else {
            console.log('[TOURS] ⚠️ Aucune rencontre trouvée - initialisation tableau vide');
        }
    } else {
        console.log(`[TOURS] ✅ Utilisation des données déjà en mémoire: ${rencontres.length} rencontre(s)`);
    }

    renderRencontresList();

    // Sélectionner la première rencontre si elle existe
    if (rencontres.length > 0 && !currentRencontreId) {
        selectRencontre(rencontres[0].id);
    } else if (rencontres.length === 0) {
        // Créer une première rencontre par défaut
        console.log('[TOURS] Création d\'une première rencontre par défaut...');
        addNewRencontre();
    }
}

/**
 * Timer pour le debounce de sauvegarde
 */
let saveTimer = null;

/**
 * Sauvegarde différée (debounced) pour éviter trop de requêtes serveur
 */
function scheduleSave() {
    if (saveTimer) {
        clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
        saveData();
    }, 1000); // Attendre 1 seconde après la dernière modification
}

/**
 * Sauvegarde les données sur le serveur
 * @returns {Promise<void>}
 */
async function saveData() {
    console.log('[TOURS] Sauvegarde de', rencontres.length, 'rencontre(s)...');

    const success = await saveToStorage(STORAGE_KEY, rencontres, false); // false = afficher les logs

    if (success) {
        console.log('[TOURS] ✅ Données sauvegardées et synchronisées avec le serveur');
    } else {
        console.error('[TOURS] ❌ ÉCHEC de la sauvegarde des rencontres');
    }

    return success;
}

/**
 * Ajoute une nouvelle rencontre
 * @returns {void}
 */
export function addNewRencontre() {
    const newRencontre = {
        id: 'rencontre-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        titre: `Rencontre ${rencontres.length + 1}`,
        dateRencontre: '',
        participants: '',
        compteRendu: '',
        travaux: [],
        documents: [],
        dateCreation: new Date().toISOString()
    };

    rencontres.unshift(newRencontre);
    renderRencontresList();
    selectRencontre(newRencontre.id);
    scheduleSave(); // Sauvegarder en arrière-plan
}

/**
 * Sélectionne une rencontre
 * @param {string} rencontreId - ID de la rencontre
 * @returns {void}
 */
export function selectRencontre(rencontreId) {
    currentRencontreId = rencontreId;
    renderRencontresList();
    loadCurrentRencontre();
}

/**
 * Charge les données de la rencontre actuelle dans le formulaire
 * @returns {void}
 */
function loadCurrentRencontre() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) return;

    // Remplir les champs du formulaire
    const titreInput = document.getElementById('toursRencontreTitre');
    const dateInput = document.getElementById('toursDateRencontre');
    const participantsInput = document.getElementById('toursParticipants');
    const compteRenduInput = document.getElementById('toursCompteRendu');

    if (titreInput) titreInput.value = rencontre.titre || '';
    if (dateInput) dateInput.value = rencontre.dateRencontre || '';
    if (participantsInput) participantsInput.value = rencontre.participants || '';
    if (compteRenduInput) compteRenduInput.value = rencontre.compteRendu || '';

    renderTravauxTable();
    renderDocumentsList();
}

/**
 * Sauvegarde les modifications de la rencontre actuelle
 * @returns {Promise<void>}
 */
export function saveToursRefroidissementData() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) return;

    const dateInput = document.getElementById('toursDateRencontre');
    const participantsInput = document.getElementById('toursParticipants');
    const compteRenduInput = document.getElementById('toursCompteRendu');

    rencontre.dateRencontre = dateInput ? dateInput.value : '';
    rencontre.participants = participantsInput ? participantsInput.value : '';
    rencontre.compteRendu = compteRenduInput ? compteRenduInput.value : '';

    scheduleSave(); // Sauvegarde différée
}

/**
 * Met à jour le titre de la rencontre actuelle
 * @param {string} newTitre - Nouveau titre
 * @returns {void}
 */
export function updateRencontreTitre(newTitre) {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) return;

    rencontre.titre = newTitre;
    renderRencontresList(); // Mettre à jour la sidebar
    scheduleSave(); // Sauvegarder en arrière-plan
}

/**
 * Ajoute un travail directement dans le tableau
 * @returns {Promise<void>}
 */
export function addToursRefroidissementTravail() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) return;

    const newTravail = {
        id: 'travail-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        description: '',
        responsable: '',
        priorite: 'Moyenne',
        commentaires: ''
    };

    rencontre.travaux.unshift(newTravail);
    renderTravauxTable();
    scheduleSave(); // Sauvegarder en arrière-plan
}

/**
 * Met à jour un champ d'un travail
 * @param {string} travailId - ID du travail
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateTravailField(travailId, field, value) {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) return;

    const travail = rencontre.travaux.find(t => t.id === travailId);
    if (travail) {
        travail[field] = value;
        scheduleSave(); // Sauvegarde différée
    }
}

/**
 * Supprime un travail
 * @param {string} travailId - ID du travail
 * @returns {void}
 */
export function deleteTravail(travailId) {
    if (!confirm('Voulez-vous vraiment supprimer ce travail ?')) return;

    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) return;

    rencontre.travaux = rencontre.travaux.filter(t => t.id !== travailId);
    renderTravauxTable();
    scheduleSave(); // Sauvegarder en arrière-plan
}

/**
 * Affiche la liste des rencontres
 * @returns {void}
 */
function renderRencontresList() {
    const container = document.getElementById('rencontresListContainer');
    if (!container) return;

    if (rencontres.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">Aucune rencontre</p>';
        return;
    }

    container.innerHTML = rencontres.map(rencontre => {
        const isSelected = rencontre.id === currentRencontreId;
        const dateStr = rencontre.dateRencontre ? new Date(rencontre.dateRencontre).toLocaleDateString('fr-FR') : 'Date non définie';

        return `
            <div onclick="window.toursActions.selectRencontre('${rencontre.id}')"
                 style="padding: 12px; background: ${isSelected ? '#e3f2fd' : 'white'}; border: 2px solid ${isSelected ? '#667eea' : '#dee2e6'}; border-radius: 8px; cursor: pointer; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${rencontre.titre}</div>
                        <div style="font-size: 0.85em; color: #666;">📅 ${dateStr}</div>
                        <div style="font-size: 0.85em; color: #666;">📋 ${rencontre.travaux.length} travau(x)</div>
                    </div>
                    <button onclick="event.stopPropagation(); window.toursActions.deleteRencontre('${rencontre.id}')"
                            style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Supprime une rencontre
 * @param {string} rencontreId - ID de la rencontre
 * @returns {Promise<void>}
 */
export function deleteRencontre(rencontreId) {
    if (!confirm('Voulez-vous vraiment supprimer cette rencontre ?')) return;

    rencontres = rencontres.filter(r => r.id !== rencontreId);

    if (currentRencontreId === rencontreId) {
        currentRencontreId = rencontres.length > 0 ? rencontres[0].id : null;
    }

    renderRencontresList();

    if (currentRencontreId) {
        loadCurrentRencontre();
    }

    scheduleSave(); // Sauvegarder en arrière-plan
}

/**
 * Affiche le tableau des travaux
 * @returns {void}
 */
function renderTravauxTable() {
    const tbody = document.getElementById('toursRefroidissementTableBody');
    if (!tbody) return;

    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre || !rencontre.travaux || rencontre.travaux.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail ajouté. Cliquez sur "Ajouter un Travail" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    rencontre.travaux.forEach((travail, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea
                    placeholder="Description du travail..."
                    onchange="window.toursActions.updateTravailField('${travail.id}', 'description', this.value)"
                    style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; min-height: 60px; resize: vertical; ${!travail.description ? 'background: #fffbcc;' : ''}">${travail.description || ''}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${travail.responsable || ''}"
                       placeholder="Nom du responsable"
                       onchange="window.toursActions.updateTravailField('${travail.id}', 'responsable', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; ${!travail.responsable ? 'background: #fffbcc;' : ''}">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="window.toursActions.updateTravailField('${travail.id}', 'priorite', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="Basse" ${travail.priorite === 'Basse' ? 'selected' : ''}>Basse</option>
                    <option value="Moyenne" ${travail.priorite === 'Moyenne' ? 'selected' : ''}>Moyenne</option>
                    <option value="Haute" ${travail.priorite === 'Haute' ? 'selected' : ''}>Haute</option>
                    <option value="Urgente" ${travail.priorite === 'Urgente' ? 'selected' : ''}>Urgente</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${travail.commentaires || ''}"
                       placeholder="Commentaires..."
                       onchange="window.toursActions.updateTravailField('${travail.id}', 'commentaires', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.toursActions.deleteTravail('${travail.id}')"
                        style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Ajoute un document
 * @returns {void}
 */
export function addToursDocument() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
    input.multiple = true;

    input.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const rencontre = rencontres.find(r => r.id === currentRencontreId);
        if (!rencontre) return;

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const doc = {
                    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    dataUrl: event.target.result,
                    type: file.type,
                    size: file.size,
                    dateAjout: new Date().toISOString()
                };

                rencontre.documents.push(doc);
                renderDocumentsList();
                scheduleSave(); // Sauvegarder en arrière-plan
            };
            reader.readAsDataURL(file);
        }
    };

    input.click();
}

/**
 * Supprime un document
 * @param {string} docId - ID du document
 * @returns {Promise<void>}
 */
export function deleteToursDocument(docId) {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;

    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) return;

    rencontre.documents = rencontre.documents.filter(d => d.id !== docId);
    renderDocumentsList();
    scheduleSave(); // Sauvegarder en arrière-plan
}

/**
 * Affiche la liste des documents
 * @returns {void}
 */
function renderDocumentsList() {
    const container = document.getElementById('toursDocumentsList');
    if (!container) return;

    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre || !rencontre.documents || rencontre.documents.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Aucun document ajouté.</p>';
        return;
    }

    container.innerHTML = rencontre.documents.map(doc => {
        const sizeKB = (doc.size / 1024).toFixed(1);
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span style="font-size: 1.5em;">📄</span>
                    <div>
                        <div style="font-weight: bold; color: #333;">${doc.name}</div>
                        <div style="font-size: 0.85em; color: #666;">${sizeKB} KB</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <a href="${doc.dataUrl}" download="${doc.name}"
                       style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; font-size: 0.85em;">
                        ⬇️ Télécharger
                    </a>
                    <button onclick="window.toursActions.deleteToursDocument('${doc.id}')"
                            style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Exporte tout le contenu de la rencontre actuelle (compte rendu + tableau + documents)
 * @returns {void}
 */
export function exportToursRefroidissementComplet() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) {
        alert('Aucune rencontre sélectionnée');
        return;
    }

    // Créer le contenu HTML du rapport
    const dateStr = rencontre.dateRencontre ? new Date(rencontre.dateRencontre).toLocaleDateString('fr-FR') : 'Date non définie';

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rencontre Tours de Refroidissement - ${dateStr}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
        h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; border-bottom: 2px solid #dee2e6; padding-bottom: 8px; }
        .info-section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-label { font-weight: bold; color: #555; }
        .compte-rendu { background: white; padding: 15px; border: 1px solid #dee2e6; border-radius: 8px; white-space: pre-wrap; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; border: 1px solid #dee2e6; text-align: left; }
        th { background: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background: #f8f9fa; }
        .doc-list { list-style: none; padding: 0; }
        .doc-item { padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 5px; }
        .priorite-haute { background: #ffebee; }
        .priorite-urgente { background: #ffcdd2; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🏭 Rencontre Tours de Refroidissement</h1>

    <div class="info-section">
        <div><span class="info-label">Titre:</span> ${rencontre.titre}</div>
        <div><span class="info-label">Date:</span> ${dateStr}</div>
        <div><span class="info-label">Participants:</span> ${rencontre.participants || 'Non spécifié'}</div>
    </div>

    <h2>📝 Compte Rendu</h2>
    <div class="compte-rendu">${rencontre.compteRendu || 'Aucun compte rendu rédigé.'}</div>

    <h2>📋 Liste des Travaux (${rencontre.travaux.length})</h2>
    <table>
        <thead>
            <tr>
                <th>Description du travail</th>
                <th>Responsable</th>
                <th>Priorité</th>
                <th>Commentaires</th>
            </tr>
        </thead>
        <tbody>
`;

    if (rencontre.travaux.length === 0) {
        html += '<tr><td colspan="4" style="text-align: center; color: #666;">Aucun travail enregistré</td></tr>';
    } else {
        rencontre.travaux.forEach(travail => {
            const rowClass = travail.priorite === 'Haute' ? 'priorite-haute' : (travail.priorite === 'Urgente' ? 'priorite-urgente' : '');
            html += `
            <tr class="${rowClass}">
                <td>${travail.description || '-'}</td>
                <td>${travail.responsable || '-'}</td>
                <td>${travail.priorite || 'Moyenne'}</td>
                <td>${travail.commentaires || '-'}</td>
            </tr>
            `;
        });
    }

    html += `
        </tbody>
    </table>

    <h2>📎 Documents Joints (${rencontre.documents.length})</h2>
`;

    if (rencontre.documents.length === 0) {
        html += '<p style="color: #666;">Aucun document joint.</p>';
    } else {
        html += '<ul class="doc-list">';
        rencontre.documents.forEach(doc => {
            const sizeKB = (doc.size / 1024).toFixed(1);
            html += `<li class="doc-item">📄 ${doc.name} (${sizeKB} KB)</li>`;
        });
        html += '</ul>';
        html += '<p style="color: #666; font-style: italic;">Note: Les documents ne sont pas inclus dans ce rapport HTML. Utilisez l\'export Excel pour obtenir les liens de téléchargement.</p>';
    }

    html += `
</body>
</html>
    `;

    // Créer un blob et télécharger
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rencontre_ToursRefroidissement_${dateStr.replace(/\//g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);

    alert('✅ Rapport exporté avec succès !');
}

/**
 * Exporte le tableau des travaux vers Excel
 * @returns {void}
 */
export function exportToursRefroidissementToExcel() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) {
        alert('Aucune rencontre sélectionnée');
        return;
    }

    if (!rencontre.travaux || rencontre.travaux.length === 0) {
        alert('Aucun travail à exporter');
        return;
    }

    // Préparer les données pour Excel
    const data = rencontre.travaux.map(travail => ({
        'Description du travail': travail.description || '',
        'Responsable': travail.responsable || '',
        'Priorité': travail.priorite || 'Moyenne',
        'Commentaires': travail.commentaires || ''
    }));

    // Créer le workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Travaux');

    // Télécharger
    const dateStr = rencontre.dateRencontre ? rencontre.dateRencontre.replace(/\//g, '-') : 'sans-date';
    XLSX.writeFile(wb, `Tours_Refroidissement_${dateStr}.xlsx`);

    console.log('[TOURS] Exportation Excel réussie');
}

console.log('[TOURS] ✅ Module Tours de Refroidissement chargé');
