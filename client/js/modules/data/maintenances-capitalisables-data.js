/**
 * @fileoverview Gestion des Maintenances Capitalisables
 * @module data/maintenances-capitalisables-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { uploadFiles, deleteFile, getFileUrl } from '../sync/upload-service.js';

/**
 * Clé de stockage pour les données des maintenances capitalisables
 * @const {string}
 */
const STORAGE_KEY = 'maintenancesCapitalisablesData';

/**
 * Données des maintenances capitalisables
 * @type {Array}
 */
let maintenancesData = [];

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
 * Charge les données des maintenances depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadMaintenancesCapitalisablesData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        maintenancesData = saved;
        console.log(`[MAINTENANCES-CAP] ✅ ${maintenancesData.length} maintenances chargées depuis le serveur`);
        renderMaintenancesCapitalisablesTable();
    } else {
        console.log('[MAINTENANCES-CAP] ℹ️ Aucune maintenance sur le serveur');
    }
}

/**
 * Sauvegarde les données des maintenances sur le SERVEUR uniquement
 * @returns {Promise<void>}
 */
async function saveMaintenancesData() {
    await saveToStorage(STORAGE_KEY, maintenancesData);
    console.log('[MAINTENANCES-CAP] ✅ Données sauvegardées sur le serveur');
}

/**
 * Ajoute une nouvelle ligne de maintenance
 * @returns {void}
 */
export function addMaintenanceCapitalisableRow() {
    const newMaintenance = {
        id: 'maintenance-cap-' + Date.now(),
        posteResponsable: '',
        ordre: '',
        avis: '',
        posteTechnique: '',
        description: '',
        creePar: '',
        decision: '-- Sélectionné --',
        date: '',
        commentaire: '',
        attachments: [] // Tableau pour stocker les documents/photos
    };

    maintenancesData.push(newMaintenance);
    saveMaintenancesData();
    renderMaintenancesCapitalisablesTable();
}

/**
 * Supprime une maintenance
 * @param {string} maintenanceId - ID de la maintenance à supprimer
 * @returns {void}
 */
export function deleteMaintenanceCapitalisable(maintenanceId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
        maintenancesData = maintenancesData.filter(m => m.id !== maintenanceId);
        saveMaintenancesData();
        renderMaintenancesCapitalisablesTable();
        console.log('[MAINTENANCES-CAP] Maintenance supprimée:', maintenanceId);
    }
}

/**
 * Met à jour un champ d'une maintenance
 * @param {string} maintenanceId - ID de la maintenance
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateMaintenanceCapitalisableField(maintenanceId, field, value) {
    const maintenance = maintenancesData.find(m => m.id === maintenanceId);
    if (maintenance) {
        maintenance[field] = value;
        saveMaintenancesData();
        console.log(`[MAINTENANCES-CAP] Champ ${field} mis à jour pour maintenance ${maintenanceId}`);
    }
}

/**
 * Rend le tableau des maintenances
 * @returns {void}
 */
export function renderMaintenancesCapitalisablesTable() {
    const tbody = document.getElementById('maintenancesCapitalisablesTableBody');
    if (!tbody) {
        console.warn('[MAINTENANCES-CAP] Element maintenancesCapitalisablesTableBody non trouvé');
        return;
    }

    if (maintenancesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 30px; text-align: center; color: #666;">
                    Aucune maintenance ajoutée. Cliquez sur "Ajouter une Maintenance" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    maintenancesData.forEach((maintenance, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        row.style.height = '28px';
        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text" value="${maintenance.ordre || ''}"
                       onchange="updateMaintenanceCapitalisableField('${maintenance.id}', 'ordre', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text" value="${maintenance.avis || ''}"
                       onchange="updateMaintenanceCapitalisableField('${maintenance.id}', 'avis', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text" value="${maintenance.posteTechnique || ''}"
                       onchange="updateMaintenanceCapitalisableField('${maintenance.id}', 'posteTechnique', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <textarea onchange="updateMaintenanceCapitalisableField('${maintenance.id}', 'description', this.value)"
                          style="width: 100%; padding: 2px 4px; border: none; font-size: 12px; min-height: 24px; resize: vertical;">${maintenance.description || ''}</textarea>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="updateMaintenanceCapitalisableField('${maintenance.id}', 'decision', this.value)"
                        style="padding: 2px 4px; border: none; font-size: 11px; width: 100%;">
                    ${DECISION_OPTIONS.map(opt =>
                        `<option value="${opt}" ${maintenance.decision === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                </select>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; background: #e9ecef;">
                <input type="date" value="${maintenance.date || ''}"
                       onchange="updateMaintenanceCapitalisableField('${maintenance.id}', 'date', this.value)"
                       style="padding: 2px 4px; border: none; font-size: 11px; background: #e9ecef;">
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <textarea onchange="updateMaintenanceCapitalisableField('${maintenance.id}', 'commentaire', this.value)"
                          style="width: 100%; padding: 2px 4px; border: none; font-size: 12px; min-height: 24px; resize: vertical;">${maintenance.commentaire || ''}</textarea>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <input type="file" id="file-${maintenance.id}" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                           onchange="handleMaintenanceAttachmentUpload(event, '${maintenance.id}')" style="display: none;">
                    <button onclick="document.getElementById('file-${maintenance.id}').click()"
                            style="padding: 6px 12px; background: #4a7c59; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em; white-space: nowrap;">
                        📎 Ajouter fichier
                    </button>
                    ${(maintenance.attachments && maintenance.attachments.length > 0) ?
                        maintenance.attachments.map(file => `
                            <div style="display: flex; align-items: center; gap: 5px; background: #f8f9fa; padding: 4px 8px; border-radius: 3px;">
                                <span style="flex: 1; font-size: 0.8em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                      title="${file.name}">${file.name}</span>
                                <button onclick="viewMaintenanceAttachment('${maintenance.id}', '${file.id}')"
                                        style="padding: 2px 6px; background: #667eea; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75em;">
                                    👁️
                                </button>
                                <button onclick="deleteMaintenanceAttachment('${maintenance.id}', '${file.id}')"
                                        style="padding: 2px 6px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75em;">
                                    🗑️
                                </button>
                            </div>
                        `).join('')
                        : '<span style="font-size: 0.8em; color: #999;">Aucun fichier</span>'
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[MAINTENANCES-CAP] Tableau rendu: ${maintenancesData.length} maintenances`);
}

/**
 * Gère l'upload du fichier Excel/CSV des maintenances
 * @param {Event} event - Événement de changement du fichier
 * @returns {Promise<void>}
 */
export async function handleMaintenancesCapitalisablesUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[MAINTENANCES-CAP] ❌ XLSX non chargé');
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
            const newMaintenances = jsonData.map(row => ({
                id: 'maintenance-cap-' + Date.now() + '-' + Math.random(),
                posteResponsable: row['Poste Responsable'] || '',
                ordre: row['Ordre'] || '',
                avis: row['Avis'] || '',
                posteTechnique: row['Poste Technique'] || '',
                description: row['Description'] || '',
                creePar: row['Créé par'] || '',
                decision: row['Décision'] || '-- Sélectionné --',
                date: row['Date'] || '',
                commentaire: row['Commentaire'] || '',
                attachments: []
            }));

            maintenancesData = maintenancesData.concat(newMaintenances);
            saveMaintenancesData();
            renderMaintenancesCapitalisablesTable();

            alert(`✅ ${newMaintenances.length} maintenances importées avec succès !`);
        } catch (error) {
            console.error('[MAINTENANCES-CAP] Erreur lors de la lecture du fichier:', error);
            alert('Erreur lors de la lecture du fichier. Veuillez vérifier le format.');
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Gère l'upload d'un fichier (document/photo) pour une maintenance
 * @param {Event} event - Événement de changement du fichier
 * @param {string} maintenanceId - ID de la maintenance
 * @returns {Promise<void>}
 */
export async function handleMaintenanceAttachmentUpload(event, maintenanceId) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier la taille (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        alert('❌ Le fichier est trop volumineux (max 50MB)');
        return;
    }

    const maintenance = maintenancesData.find(m => m.id === maintenanceId);
    if (!maintenance) {
        console.error('[MAINTENANCES-CAP] Maintenance non trouvée:', maintenanceId);
        return;
    }

    // Initialiser attachments si nécessaire
    if (!maintenance.attachments) {
        maintenance.attachments = [];
    }

    try {
        // Upload le fichier vers le serveur
        const result = await uploadFiles(file);

        if (result.success && result.files && result.files.length > 0) {
            const fileData = result.files[0];

            // Ajouter les métadonnées du fichier uploadé
            maintenance.attachments.push({
                id: fileData.id,
                name: fileData.originalName,
                filename: fileData.filename,
                type: fileData.mimetype,
                size: fileData.size,
                uploadDate: fileData.uploadDate,
                url: fileData.url
            });

            saveMaintenancesData();
            renderMaintenancesCapitalisablesTable();

            console.log(`[MAINTENANCES-CAP] Fichier uploadé au serveur pour maintenance ${maintenanceId}:`, fileData.originalName);
            alert(`✅ Fichier "${fileData.originalName}" uploadé avec succès !`);
        }
    } catch (error) {
        console.error('[MAINTENANCES-CAP] Erreur lors de l\'upload:', error);
        alert('❌ Erreur lors de l\'upload du fichier');
    }
}

/**
 * Supprime un fichier attaché à une maintenance
 * @param {string} maintenanceId - ID de la maintenance
 * @param {string} fileId - ID du fichier à supprimer
 * @returns {Promise<void>}
 */
export async function deleteMaintenanceAttachment(maintenanceId, fileId) {
    const maintenance = maintenancesData.find(m => m.id === maintenanceId);
    if (!maintenance || !maintenance.attachments) return;

    const file = maintenance.attachments.find(f => f.id === fileId);
    if (!file) return;

    if (!confirm(`Voulez-vous supprimer le fichier "${file.name}" ?`)) return;

    try {
        // Supprimer du serveur si le fichier a un filename
        if (file.filename) {
            await deleteFile(file.filename);
            console.log(`[MAINTENANCES-CAP] Fichier supprimé du serveur: ${file.filename}`);
        }
    } catch (error) {
        console.error('[MAINTENANCES-CAP] Erreur lors de la suppression du fichier du serveur:', error);
    }

    // Supprimer de la liste locale
    maintenance.attachments = maintenance.attachments.filter(f => f.id !== fileId);
    saveMaintenancesData();
    renderMaintenancesCapitalisablesTable();
    console.log(`[MAINTENANCES-CAP] Fichier supprimé de la maintenance ${maintenanceId}`);
}

/**
 * Visualise un fichier attaché
 * @param {string} maintenanceId - ID de la maintenance
 * @param {string} fileId - ID du fichier à visualiser
 * @returns {void}
 */
export function viewMaintenanceAttachment(maintenanceId, fileId) {
    const maintenance = maintenancesData.find(m => m.id === maintenanceId);
    if (!maintenance || !maintenance.attachments) return;

    const file = maintenance.attachments.find(f => f.id === fileId);
    if (!file) return;

    // Obtenir l'URL du fichier depuis le serveur
    const fileUrl = file.url || getFileUrl(file.filename);

    // Ouvrir le fichier dans une nouvelle fenêtre
    if (file.type.startsWith('image/')) {
        // Pour les images, afficher dans une nouvelle fenêtre
        const win = window.open();
        if (win) {
            win.document.write(`
                <html>
                    <head><title>${file.name}</title></head>
                    <body style="margin: 0; display: flex; justify-content: center; align-items: center; background: #000;">
                        <img src="${fileUrl}" style="max-width: 100%; max-height: 100vh;" alt="${file.name}">
                    </body>
                </html>
            `);
        }
    } else {
        // Pour les autres fichiers, déclencher le téléchargement
        window.open(fileUrl, '_blank');
    }
}

/**
 * Récupère les données des maintenances
 * @returns {Array}
 */
export function getMaintenancesCapitalisablesData() {
    return maintenancesData;
}
