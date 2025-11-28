/**
 * @fileoverview Gestion des Projets INGQ
 * @module data/ingq-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { uploadFiles, deleteFile, getFileUrl } from '../sync/upload-service.js';

/**
 * Clé de stockage pour les données des projets INGQ
 * @const {string}
 */
const STORAGE_KEY = 'ingqData';

/**
 * Données des projets INGQ
 * @type {Array}
 */
let ingqData = [];

/**
 * Charge les données des projets INGQ depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadINGQData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        ingqData = saved;
        console.log(`[INGQ] ✅ ${ingqData.length} projets INGQ chargés depuis le serveur`);
        renderINGQTable();
    } else {
        console.log('[INGQ] ℹ️ Aucun projet INGQ sur le serveur');
    }
}

/**
 * Sauvegarde les données des projets INGQ sur le SERVEUR uniquement
 * @returns {Promise<void>}
 */
async function saveINGQData() {
    await saveToStorage(STORAGE_KEY, ingqData);
    console.log('[INGQ] ✅ Données sauvegardées sur le serveur');
}

/**
 * Ajoute un nouveau projet INGQ
 * @returns {void}
 */
export function addINGQProjet() {
    const newProjet = {
        id: 'ingq-' + Date.now(),
        ordre: '',
        designOper: '',
        posteTechnique: '',
        commentaire: '',
        commentaireWidth: null, // Largeur du champ commentaire
        contrainte: '',
        documents: [] // Tableau pour stocker les documents
    };

    ingqData.push(newProjet);
    saveINGQData();
    renderINGQTable();
}

/**
 * Supprime un projet INGQ
 * @param {string} projetId - ID du projet à supprimer
 * @returns {void}
 */
export function deleteINGQProjet(projetId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet INGQ ?')) {
        ingqData = ingqData.filter(p => p.id !== projetId);
        saveINGQData();
        renderINGQTable();
        console.log('[INGQ] Projet INGQ supprimé:', projetId);
    }
}

/**
 * Met à jour un champ d'un projet INGQ
 * @param {string} projetId - ID du projet
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateINGQField(projetId, field, value) {
    const projet = ingqData.find(p => p.id === projetId);
    if (projet) {
        projet[field] = value;
        saveINGQData();
        console.log(`[INGQ] Champ ${field} mis à jour pour projet ${projetId}`);
    }
}

/**
 * Sauvegarde la largeur du champ commentaire
 * @param {string} projetId - ID du projet
 * @param {number} width - Largeur en pixels
 * @returns {void}
 */
export function saveCommentaireWidth(projetId, width) {
    const projet = ingqData.find(p => p.id === projetId);
    if (projet) {
        projet.commentaireWidth = width;
        saveINGQData();
        console.log(`[INGQ] Largeur du commentaire sauvegardée: ${width}px pour projet ${projetId}`);
    }
}

/**
 * Ajuste automatiquement la hauteur d'un textarea en fonction de son contenu
 * @param {HTMLTextAreaElement} textarea - L'élément textarea
 * @returns {void}
 */
export function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

/**
 * Gère l'upload de documents pour un projet INGQ
 * @param {string} projetId - ID du projet
 * @param {FileList} files - Liste des fichiers
 * @returns {Promise<void>}
 */
export async function handleINGQDocumentUpload(projetId, files) {
    const projet = ingqData.find(p => p.id === projetId);
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

            saveINGQData();
            renderINGQTable();
            console.log(`[INGQ] ${result.files.length} documents uploadés au serveur pour projet ${projetId}`);
            alert(`✅ ${result.files.length} document(s) uploadé(s) avec succès !`);
        }
    } catch (error) {
        console.error('[INGQ] Erreur lors de l\'upload:', error);
        alert('❌ Erreur lors de l\'upload des documents');
    }
}

/**
 * Supprime un document d'un projet INGQ
 * @param {string} projetId - ID du projet
 * @param {number} docIndex - Index du document à supprimer
 * @returns {Promise<void>}
 */
export async function deleteINGQDocument(projetId, docIndex) {
    const projet = ingqData.find(p => p.id === projetId);
    if (!projet || !projet.documents) return;

    if (confirm('Voulez-vous supprimer ce document ?')) {
        const doc = projet.documents[docIndex];

        try {
            // Supprimer du serveur si le document a un filename
            if (doc.filename) {
                await deleteFile(doc.filename);
                console.log(`[INGQ] Document supprimé du serveur: ${doc.filename}`);
            }
        } catch (error) {
            console.error('[INGQ] Erreur lors de la suppression du fichier du serveur:', error);
        }

        // Supprimer de la liste locale
        projet.documents.splice(docIndex, 1);
        saveINGQData();
        renderINGQTable();
    }
}

/**
 * Rend le tableau des projets INGQ
 * @returns {void}
 */
export function renderINGQTable() {
    const tbody = document.getElementById('ingqTableBody');
    const countSpan = document.getElementById('ingqCount');

    if (!tbody) {
        console.warn('[INGQ] Element ingqTableBody non trouvé');
        return;
    }

    if (!Array.isArray(ingqData) || ingqData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucun projet INGQ dans la liste. Cliquez sur "Ajouter un projet" pour en créer un.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    ingqData.forEach(projet => {
        const row = document.createElement('tr');
        row.style.background = '#ffffff';

        // Liste des documents
        const documentsHTML = (projet.documents && projet.documents.length > 0) ?
            projet.documents.map((doc, index) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 3px; background: #f0f0f0; border-radius: 3px; margin-bottom: 3px;">
                    <span style="font-size: 11px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${doc.name}">📄 ${doc.name}</span>
                    <button onclick="window.ingqModule.deleteINGQDocument('${projet.id}', ${index})"
                            style="padding: 2px 5px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; margin-left: 5px;">
                        ✕
                    </button>
                </div>
            `).join('') :
            '<span style="color: #999; font-size: 12px;">Aucun document</span>';

        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${projet.ordre || ''}"
                       onchange="window.ingqModule.updateINGQField('${projet.id}', 'ordre', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea onchange="window.ingqModule.updateINGQField('${projet.id}', 'designOper', this.value)"
                          style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; min-height: 50px;">${projet.designOper || ''}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${projet.posteTechnique || ''}"
                       onchange="window.ingqModule.updateINGQField('${projet.id}', 'posteTechnique', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea id="commentaire-${projet.id}"
                          onchange="window.ingqModule.updateINGQField('${projet.id}', 'commentaire', this.value)"
                          oninput="window.ingqModule.autoResizeTextarea(this)"
                          style="width: ${projet.commentaireWidth ? projet.commentaireWidth + 'px' : '100%'}; padding: 5px; border: 1px solid #ddd; border-radius: 3px; min-height: 50px; resize: horizontal; overflow-y: hidden; box-sizing: border-box;">${projet.commentaire || ''}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${projet.contrainte || ''}"
                       onchange="window.ingqModule.updateINGQField('${projet.id}', 'contrainte', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <div style="margin-bottom: 5px;">
                    ${documentsHTML}
                </div>
                <input type="file" id="doc-input-${projet.id}" multiple
                       onchange="window.ingqModule.handleINGQDocumentUpload('${projet.id}', this.files)"
                       style="display: none;">
                <button onclick="document.getElementById('doc-input-${projet.id}').click()"
                        style="padding: 5px 10px; background: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">
                    📎 Ajouter document
                </button>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.ingqModule.deleteINGQProjet('${projet.id}')"
                        style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    if (countSpan) {
        countSpan.textContent = ingqData.length;
    }

    // Initialiser les hauteurs des textareas et ajouter les observers pour la largeur
    ingqData.forEach(projet => {
        const textarea = document.getElementById(`commentaire-${projet.id}`);
        if (textarea) {
            // Auto-resize initial
            autoResizeTextarea(textarea);

            // Observer pour détecter les changements de largeur (resize manuel)
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const newWidth = entry.contentRect.width;
                    // Sauvegarder uniquement si la largeur a changé de manière significative (> 5px)
                    if (Math.abs(newWidth - (projet.commentaireWidth || 0)) > 5) {
                        saveCommentaireWidth(projet.id, Math.round(newWidth));
                    }
                }
            });

            resizeObserver.observe(textarea);
        }
    });

    console.log(`[INGQ] Tableau rendu: ${ingqData.length} projets INGQ`);
}

/**
 * Exporte les données INGQ vers Excel
 * @returns {void}
 */
export function exportINGQToExcel() {
    if (!Array.isArray(ingqData) || ingqData.length === 0) {
        alert('⚠️ Aucun projet INGQ à exporter.');
        return;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[INGQ] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    try {
        const exportData = ingqData.map(projet => ({
            'Ordre': projet.ordre || '',
            'Désign. opér.': projet.designOper || '',
            'Poste technique': projet.posteTechnique || '',
            'Commentaire': projet.commentaire || '',
            'Contrainte': projet.contrainte || '',
            'Nombre de documents': (projet.documents || []).length,
            'Documents': (projet.documents || []).map(d => d.name).join(', ')
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Projets INGQ');

        const fileName = `Projets_INGQ_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[INGQ] Export Excel réussi:', fileName);
    } catch (error) {
        console.error('[INGQ] Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données des projets INGQ
 * @returns {Array}
 */
export function getINGQData() {
    return ingqData;
}

