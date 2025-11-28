/**
 * @fileoverview Gestion des Projets / Travaux Majeurs Entretien
 * @module data/projets-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { uploadFiles, deleteFile, getFileUrl } from '../sync/upload-service.js';

/**
 * Clé de stockage pour les données des projets
 * @const {string}
 */
const STORAGE_KEY = 'projetsData';

/**
 * Données des projets
 * @type {Array}
 */
let projetsData = [];

/**
 * Options de décision
 * @const {Array<string>}
 */
const DECISION_OPTIONS = [
    '-- Sélectionné --',
    'Approuvé',
    'En attente',
    'Refusé',
    'À réviser'
];

/**
 * Charge les données des projets depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadProjetsData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        projetsData = saved;
        console.log(`[PROJETS] ✅ ${projetsData.length} projets chargés depuis le serveur`);
        renderProjetsTable();
    } else {
        console.log('[PROJETS] ℹ️ Aucun projet sur le serveur');
    }
}

/**
 * Sauvegarde les données des projets sur le serveur
 * @returns {Promise<void>}
 */
async function saveProjetsData() {
    await saveToStorage(STORAGE_KEY, projetsData);
    console.log('[PROJETS] Données sauvegardées et synchronisées avec le serveur');
}

/**
 * Ajoute une nouvelle ligne de projet
 * @returns {void}
 */
export function addProjetRow() {
    const newProjet = {
        id: 'projet-' + Date.now(),
        posteResponsable: '',
        ordre: '',
        avis: '',
        posteTechnique: '',
        description: '',
        creePar: '',
        decision: '-- Sélectionné --',
        date: '',
        commentaire: '',
        documents: []
    };

    projetsData.push(newProjet);
    saveProjetsData();
    renderProjetsTable();
}

/**
 * Supprime un projet
 * @param {string} projetId - ID du projet à supprimer
 * @returns {void}
 */
export function deleteProjet(projetId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
        projetsData = projetsData.filter(p => p.id !== projetId);
        saveProjetsData();
        renderProjetsTable();
        console.log('[PROJETS] Projet supprimé:', projetId);
    }
}

/**
 * Met à jour un champ d'un projet
 * @param {string} projetId - ID du projet
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateProjetField(projetId, field, value) {
    const projet = projetsData.find(p => p.id === projetId);
    if (projet) {
        projet[field] = value;
        saveProjetsData();
        console.log(`[PROJETS] Champ ${field} mis à jour pour projet ${projetId}`);
    }
}

/**
 * Gère l'upload de documents pour un projet
 * @param {string} projetId - ID du projet
 * @param {FileList} files - Liste des fichiers
 * @returns {Promise<void>}
 */
export async function uploadProjetDocument(projetId, files) {
    const projet = projetsData.find(p => p.id === projetId);
    if (!projet) return;

    if (!projet.documents) {
        projet.documents = [];
    }

    try {
        // Upload les fichiers vers le serveur
        const result = await uploadFiles(files);

        if (result.success && result.files) {
            // Ajouter les métadonnées des fichiers uploadés
            result.files.forEach(fileData => {
                projet.documents.push({
                    id: fileData.id,
                    name: fileData.originalName,
                    filename: fileData.filename,
                    size: fileData.size,
                    type: fileData.mimetype,
                    uploadDate: fileData.uploadDate,
                    url: fileData.url
                });
            });

            saveProjetsData();
            renderProjetsTable();
            console.log(`[PROJETS] ${result.files.length} documents uploadés au serveur pour projet ${projetId}`);
            alert(`✅ ${result.files.length} document(s) uploadé(s) avec succès !`);
        }
    } catch (error) {
        console.error('[PROJETS] Erreur lors de l\'upload:', error);
        alert('❌ Erreur lors de l\'upload des documents');
    }
}

/**
 * Supprime un document d'un projet
 * @param {string} projetId - ID du projet
 * @param {number} docIndex - Index du document à supprimer
 * @returns {Promise<void>}
 */
export async function deleteProjetDocument(projetId, docIndex) {
    const projet = projetsData.find(p => p.id === projetId);
    if (!projet || !projet.documents) return;

    if (confirm('Voulez-vous supprimer ce document ?')) {
        const doc = projet.documents[docIndex];

        try {
            // Supprimer du serveur si le document a un filename
            if (doc.filename) {
                await deleteFile(doc.filename);
                console.log(`[PROJETS] Document supprimé du serveur: ${doc.filename}`);
            }
        } catch (error) {
            console.error('[PROJETS] Erreur lors de la suppression du fichier du serveur:', error);
        }

        // Supprimer de la liste locale
        projet.documents.splice(docIndex, 1);
        saveProjetsData();
        renderProjetsTable();
    }
}

/**
 * Rend le tableau des projets
 * @returns {void}
 */
export function renderProjetsTable() {
    const tbody = document.getElementById('projetsTableBody');
    if (!tbody) {
        console.warn('[PROJETS] Element projetsTableBody non trouvé');
        return;
    }

    if (!Array.isArray(projetsData) || projetsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 30px; text-align: center; color: #666;">
                    Aucun projet ajouté. Cliquez sur "Ajouter un Projet" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    projetsData.forEach((projet, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        row.style.height = '28px';

        // Liste des documents
        const documentsHTML = (projet.documents && projet.documents.length > 0) ?
            projet.documents.map((doc, index) => {
                const fileUrl = doc.url || `/api/files/${doc.filename}`;
                return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 5px; background: #f0f0f0; border-radius: 4px; margin-bottom: 5px;">
                    <a href="${fileUrl}" target="_blank" style="font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: none; color: #4299e1;" title="${doc.name}">📄 ${doc.name}</a>
                    <button onclick="window.deleteProjetDocument('${projet.id}', ${index})"
                            style="padding: 3px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; margin-left: 5px;">
                        ✕
                    </button>
                </div>
            `;
            }).join('') :
            '';

        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text" value="${projet.ordre || ''}"
                       onchange="updateProjetField('${projet.id}', 'ordre', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text" value="${projet.avis || ''}"
                       onchange="updateProjetField('${projet.id}', 'avis', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text" value="${projet.posteTechnique || ''}"
                       onchange="updateProjetField('${projet.id}', 'posteTechnique', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <textarea onchange="updateProjetField('${projet.id}', 'description', this.value)"
                          style="width: 100%; padding: 2px 4px; border: none; font-size: 12px; min-height: 24px; resize: vertical;">${projet.description || ''}</textarea>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="updateProjetField('${projet.id}', 'decision', this.value)"
                        style="padding: 2px 4px; border: none; font-size: 11px; width: 100%;">
                    ${DECISION_OPTIONS.map(opt =>
                        `<option value="${opt}" ${projet.decision === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                </select>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; background: #e9ecef;">
                <input type="date" value="${projet.date || ''}"
                       onchange="updateProjetField('${projet.id}', 'date', this.value)"
                       style="padding: 2px 4px; border: none; font-size: 11px; background: #e9ecef;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <textarea onchange="updateProjetField('${projet.id}', 'commentaire', this.value)"
                          style="width: 100%; padding: 2px 4px; border: none; font-size: 12px; min-height: 40px; resize: vertical;">${projet.commentaire || ''}</textarea>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; vertical-align: top;">
                <div id="dropzone-${projet.id}"
                     style="margin-bottom: 4px; max-height: 100px; overflow-y: auto; border: 1px dashed #aaa; padding: 4px; background: #f9f9f9; font-size: 11px;"
                     ondragover="event.preventDefault(); event.currentTarget.style.borderColor='#4299e1'; event.currentTarget.style.background='#e3f2fd';"
                     ondragleave="event.currentTarget.style.borderColor='#aaa'; event.currentTarget.style.background='#f9f9f9';"
                     ondrop="event.preventDefault(); event.currentTarget.style.borderColor='#aaa'; event.currentTarget.style.background='#f9f9f9'; window.uploadProjetDocument('${projet.id}', event.dataTransfer.files);">
                    ${documentsHTML || '<span style="color: #999; font-size: 10px;">📁 Glisser ou cliquer</span>'}
                </div>
                <input type="file" id="doc-input-${projet.id}" multiple
                       onchange="window.uploadProjetDocument('${projet.id}', this.files)"
                       style="display: none;">
                <div style="display: flex; gap: 3px;">
                    <button onclick="document.getElementById('doc-input-${projet.id}').click()"
                            style="padding: 3px 6px; background: #4299e1; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; flex: 1;">
                        📎 +
                    </button>
                    <button onclick="deleteProjet('${projet.id}')"
                            style="padding: 3px 6px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[PROJETS] Tableau rendu: ${projetsData.length} projets`);
}

/**
 * Gère l'upload du fichier Excel/CSV des projets
 * @param {Event} event - Événement de changement du fichier
 * @returns {Promise<void>}
 */
export async function handleProjetsUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[PROJETS] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Mapper les données
            const newProjets = jsonData.map(row => ({
                id: 'projet-' + Date.now() + '-' + Math.random(),
                posteResponsable: row['Poste Responsable'] || '',
                ordre: row['Ordre'] || '',
                avis: row['Avis'] || '',
                posteTechnique: row['Poste Technique'] || '',
                description: row['Description'] || '',
                creePar: row['Créé par'] || '',
                decision: row['Décision'] || '-- Sélectionné --',
                date: row['Date'] || '',
                commentaire: row['Commentaire'] || ''
            }));

            projetsData = projetsData.concat(newProjets);
            saveProjetsData();
            renderProjetsTable();

            alert(`✅ ${newProjets.length} projets importés avec succès !`);
        } catch (error) {
            console.error('[PROJETS] Erreur lors de la lecture du fichier:', error);
            alert('Erreur lors de la lecture du fichier. Veuillez vérifier le format.');
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Récupère les données des projets
 * @returns {Array}
 */
export function getProjetsData() {
    return projetsData;
}
