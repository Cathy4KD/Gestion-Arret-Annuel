/**
 * @fileoverview Gestion des équipements de levage et échafaudages
 * @module data/equipement-levage-data
 *
 * @description
 * Gère les besoins en échafaudages et équipements de levage depuis IW37N
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getIw37nData } from './iw37n-data.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage pour les équipements de levage
 * @const {string}
 */
const STORAGE_KEY = 'equipementLevageData';

/**
 * Clé de stockage pour les fichiers
 * @const {string}
 */
const FILES_STORAGE_KEY = 'equipementLevageFiles';

/**
 * Données des équipements de levage
 * @type {Array}
 */
let equipementLevageData = [];

/**
 * Fichiers attachés
 * @type {Array}
 */
let attachedFiles = [];

/**
 * Filtre actuel (tous, recurrent, non-recurrent)
 * @type {string}
 */
let currentFilter = '';

/**
 * Charge les données des équipements de levage depuis localStorage
 * @returns {void}
 */
export async function loadEquipementLevageData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        equipementLevageData = saved;
        console.log(`[EQUIPEMENT-LEVAGE] ${equipementLevageData.length} équipements chargés`);
    }

    const savedFiles = await loadFromStorage(FILES_STORAGE_KEY);
    if (savedFiles) {
        attachedFiles = savedFiles;
        console.log(`[EQUIPEMENT-LEVAGE] ${attachedFiles.length} fichiers chargés`);
    }

    renderEquipementLevageTable();
    renderFilesList();
}

/**
 * Sauvegarde les données dans localStorage ET serveur
 * @returns {void}
 */
async function saveEquipementLevageData() {
    await saveToStorage(STORAGE_KEY, equipementLevageData);
    console.log('[EQUIPEMENT-LEVAGE] Données sauvegardées');
}

/**
 * Sauvegarde les fichiers dans localStorage ET serveur
 * @returns {void}
 */
async function saveFiles() {
    await saveToStorage(FILES_STORAGE_KEY, attachedFiles);
    console.log('[EQUIPEMENT-LEVAGE] Fichiers sauvegardés');
}

/**
 * Synchronise les équipements depuis IW37N
 * Filtre les travaux avec POST.TRAV.OPÉR. = MECEXT02
 * @returns {void}
 */
export async function syncEquipementFromIw37n() {
    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord charger les données IW37N.');
        console.warn('[EQUIPEMENT-LEVAGE] Aucune donnée IW37N disponible');
        return;
    }

    try {
        console.log('[EQUIPEMENT-LEVAGE] Synchronisation depuis IW37N...');

        // Filtrer les travaux avec POST.TRAV.OPÉR. = MECEXT02
        const filtered = iw37nData.filter(row => {
            const posteTravOper = (row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '').toString().trim().toUpperCase();
            return posteTravOper === 'MECEXT02';
        });

        console.log(`[EQUIPEMENT-LEVAGE] ${filtered.length} équipements trouvés (MECEXT02)`);

        if (filtered.length === 0) {
            alert('⚠️ Aucun équipement trouvé avec POST.TRAV.OPÉR. = MECEXT02');
            return;
        }

        // Demander confirmation avant d'écraser les données existantes
        if (equipementLevageData.length > 0) {
            const confirm = window.confirm(
                `Vous avez déjà ${equipementLevageData.length} équipement(s) enregistré(s).\n\n` +
                `Cette synchronisation va ajouter ${filtered.length} nouveaux équipements depuis IW37N.\n\n` +
                `Continuer?`
            );
            if (!confirm) {
                return;
            }
        }

        // Mapper les données pour le tableau
        const newEquipements = filtered.map(row => {
            const ordre = row['Ordre'] || row['ordre'] || '';
            const operation = row['Opération'] || row['Operation'] || '';
            const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '';

            return {
                id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ordre: ordre,
                operation: operation,
                designOper: designOper,
                recurrent: false,
                commentaire: '',
                photos: []
            };
        });

        // Ajouter aux données existantes (pas écraser)
        equipementLevageData = [...equipementLevageData, ...newEquipements];

        await saveEquipementLevageData();
        renderEquipementLevageTable();

        alert(`✅ ${newEquipements.length} équipement(s) synchronisé(s) depuis IW37N`);
    } catch (error) {
        console.error('[EQUIPEMENT-LEVAGE] Erreur synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec IW37N');
    }
}

/**
 * Ajoute manuellement un équipement
 * @returns {void}
 */
export function addEquipementLevage() {
    const ordre = prompt('Numéro d\'ordre:');
    if (!ordre) return;

    const operation = prompt('Opération:') || '';
    const designOper = prompt('Désignation opération:') || '';

    const newEquipement = {
        id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ordre: ordre,
        operation: operation,
        designOper: designOper,
        recurrent: false,
        commentaire: '',
        photos: []
    };

    equipementLevageData.push(newEquipement);
    saveEquipementLevageData();
    renderEquipementLevageTable();

    console.log('[EQUIPEMENT-LEVAGE] Équipement ajouté:', ordre);
}

/**
 * Met à jour le champ récurrent d'un équipement
 * @param {string} equipementId - ID de l'équipement
 * @param {boolean} value - Nouvelle valeur
 */
function updateRecurrent(equipementId, value) {
    const equipement = equipementLevageData.find(e => e.id === equipementId);
    if (equipement) {
        equipement.recurrent = value;
        saveEquipementLevageData();
        renderEquipementLevageTable();
    }
}

/**
 * Met à jour le commentaire d'un équipement
 * @param {string} equipementId - ID de l'équipement
 * @param {string} value - Nouveau commentaire
 */
function updateCommentaire(equipementId, value) {
    const equipement = equipementLevageData.find(e => e.id === equipementId);
    if (equipement) {
        equipement.commentaire = value;
        saveEquipementLevageData();
    }
}

/**
 * Supprime un équipement
 * @param {string} equipementId - ID de l'équipement
 */
function deleteEquipement(equipementId) {
    const equipement = equipementLevageData.find(e => e.id === equipementId);
    if (!equipement) return;

    if (!confirm(`Voulez-vous vraiment supprimer l'équipement "${equipement.ordre}" ?`)) {
        return;
    }

    equipementLevageData = equipementLevageData.filter(e => e.id !== equipementId);
    saveEquipementLevageData();
    renderEquipementLevageTable();

    console.log('[EQUIPEMENT-LEVAGE] Équipement supprimé:', equipement.ordre);
}

/**
 * Gère l'upload de photos pour un équipement
 * @param {string} equipementId - ID de l'équipement
 * @param {FileList} files - Fichiers uploadés
 */
async function handlePhotoUpload(equipementId, files) {
    const equipement = equipementLevageData.find(e => e.id === equipementId);
    if (!equipement) return;

    if (!equipement.photos) {
        equipement.photos = [];
    }

    for (const file of files) {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                equipement.photos.push({
                    name: file.name,
                    data: e.target.result,
                    date: new Date().toISOString()
                });

                await saveEquipementLevageData();
                renderEquipementLevageTable();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('[EQUIPEMENT-LEVAGE] Erreur upload photo:', error);
        }
    }
}

/**
 * Supprime une photo d'un équipement
 * @param {string} equipementId - ID de l'équipement
 * @param {number} photoIndex - Index de la photo
 */
async function deletePhoto(equipementId, photoIndex) {
    const equipement = equipementLevageData.find(e => e.id === equipementId);
    if (!equipement || !equipement.photos) return;

    equipement.photos.splice(photoIndex, 1);
    await saveEquipementLevageData();
    renderEquipementLevageTable();
}

/**
 * Filtre les équipements par récurrence
 * @returns {void}
 */
export function filterEquipementLevage() {
    const select = document.getElementById('filterRecurrent');
    if (select) {
        currentFilter = select.value;
        renderEquipementLevageTable();
    }
}

/**
 * Rend le tableau des équipements
 * @returns {void}
 */
function renderEquipementLevageTable() {
    const tbody = document.getElementById('equipementLevageTableBody');
    const countSpan = document.getElementById('equipementLevageCount');
    const echafaudageCountSpan = document.getElementById('echafaudageCount');
    const recurrentCountSpan = document.getElementById('recurrentCount');

    if (!tbody) {
        console.warn('[EQUIPEMENT-LEVAGE] Element equipementLevageTableBody non trouvé');
        return;
    }

    // Filtrer selon la sélection
    let filteredData = equipementLevageData;
    if (currentFilter === 'recurrent') {
        filteredData = equipementLevageData.filter(e => e.recurrent);
    } else if (currentFilter === 'non-recurrent') {
        filteredData = equipementLevageData.filter(e => !e.recurrent);
    }

    // Calculer les statistiques
    const totalCount = equipementLevageData.length;
    const echafaudageCount = totalCount; // Tous sont des échafaudages dans ce contexte
    const recurrentCount = equipementLevageData.filter(e => e.recurrent).length;

    if (countSpan) countSpan.textContent = totalCount;
    if (echafaudageCountSpan) echafaudageCountSpan.textContent = echafaudageCount;
    if (recurrentCountSpan) recurrentCountSpan.textContent = recurrentCount;

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    ${equipementLevageData.length === 0
                        ? 'Aucun équipement de levage enregistré. Cliquez sur "Synchroniser avec IW37N" ou "Ajouter Équipement".'
                        : 'Aucun équipement ne correspond au filtre sélectionné.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    filteredData.forEach((equipement, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        // Photos HTML
        let photosHTML = '';
        if (equipement.photos && equipement.photos.length > 0) {
            photosHTML = equipement.photos.map((photo, idx) => `
                <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px; background: #f0f0f0; padding: 3px; border-radius: 3px;">
                    <span style="font-size: 11px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${photo.name}">📄 ${photo.name}</span>
                    <button onclick="window.equipementLevageActions.deletePhoto('${equipement.id}', ${idx})" style="padding: 2px 5px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">✕</button>
                </div>
            `).join('');
        }

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 600;">
                ${equipement.ordre || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                ${equipement.operation || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${equipement.designOper || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <input type="checkbox" ${equipement.recurrent ? 'checked' : ''}
                       onchange="window.equipementLevageActions.updateRecurrent('${equipement.id}', this.checked)"
                       style="cursor: pointer; width: 18px; height: 18px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.equipementLevageActions.updateCommentaire('${equipement.id}', this.value)"
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; resize: vertical;">${equipement.commentaire || ''}</textarea>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <div style="margin-bottom: 5px;">${photosHTML || '<span style="color: #999; font-size: 12px;">Aucun document</span>'}</div>
                <input type="file" id="photo-input-${equipement.id}" multiple style="display: none;" onchange="window.equipementLevageActions.handlePhotoUpload('${equipement.id}', this.files)">
                <button onclick="document.getElementById('photo-input-${equipement.id}').click()" style="padding: 5px 10px; background: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%; margin-bottom: 5px;">📎 Ajouter</button>
                <button onclick="window.equipementLevageActions.deleteEquipement('${equipement.id}')" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">🗑️ Supprimer</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[EQUIPEMENT-LEVAGE] Tableau rendu: ${filteredData.length} équipements affichés`);
}

/**
 * Gère l'upload de fichiers généraux
 * @param {Event} event - Event de l'input file
 */
export async function handleEquipementLevageFile(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                attachedFiles.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    data: e.target.result,
                    date: new Date().toISOString()
                });

                await saveFiles();
                renderFilesList();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('[EQUIPEMENT-LEVAGE] Erreur upload fichier:', error);
        }
    }

    // Réinitialiser l'input
    event.target.value = '';
}

/**
 * Supprime un fichier général
 * @param {string} fileId - ID du fichier
 */
async function deleteFile(fileId) {
    const file = attachedFiles.find(f => f.id === fileId);
    if (!file) return;

    if (!confirm(`Voulez-vous vraiment supprimer le fichier "${file.name}" ?`)) {
        return;
    }

    attachedFiles = attachedFiles.filter(f => f.id !== fileId);
    await saveFiles();
    renderFilesList();
}

/**
 * Rend la liste des fichiers
 */
function renderFilesList() {
    const container = document.getElementById('equipementLevageFilesList');
    if (!container) return;

    if (attachedFiles.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666; border: 2px dashed #ddd; border-radius: 8px;">
                Aucun fichier ajouté. Cliquez sur "Ajouter un Fichier" pour téléverser des documents.
            </div>
        `;
        return;
    }

    container.innerHTML = attachedFiles.map(file => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
            <div>
                <div style="font-weight: 600; color: #333;">📄 ${file.name}</div>
                <div style="font-size: 12px; color: #666; margin-top: 3px;">
                    Ajouté le ${new Date(file.date).toLocaleString('fr-CA')}
                </div>
            </div>
            <button onclick="window.equipementLevageActions.deleteFile('${file.id}')"
                    style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🗑️ Supprimer
            </button>
        </div>
    `).join('');
}

/**
 * Exporte les équipements vers Excel
 */
export function exportEquipementLevageToExcel() {
    if (equipementLevageData.length === 0) {
        alert('⚠️ Aucun équipement à exporter.');
        return;
    }

    try {
        const exportData = equipementLevageData.map(eq => ({
            'Ordre': eq.ordre,
            'Opération': eq.operation,
            'Désign. opér.': eq.designOper,
            'Récurrent': eq.recurrent ? 'Oui' : 'Non',
            'Commentaire': eq.commentaire || '',
            'Nb Photos': eq.photos ? eq.photos.length : 0
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Équipements Levage');

        ws['!cols'] = autoSizeColumns(ws, exportData);

        const fileName = `Equipements_Levage_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[EQUIPEMENT-LEVAGE] Export Excel réussi');
    } catch (error) {
        console.error('[EQUIPEMENT-LEVAGE] Erreur export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Exporte les équipements vers PowerPoint/PDF
 */
export function exportEquipementLevageToPowerPoint() {
    alert('Fonctionnalité d\'export PDF en cours de développement.\nVeuillez utiliser l\'export Excel pour l\'instant.');
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.syncEquipementFromIw37n = syncEquipementFromIw37n;
    window.addEquipementLevage = addEquipementLevage;
    window.filterEquipementLevage = filterEquipementLevage;
    window.exportEquipementLevageToExcel = exportEquipementLevageToExcel;
    window.exportEquipementLevageToPowerPoint = exportEquipementLevageToPowerPoint;
    window.handleEquipementLevageFile = handleEquipementLevageFile;

    window.equipementLevageActions = {
        updateRecurrent,
        updateCommentaire,
        deleteEquipement,
        handlePhotoUpload,
        deletePhoto,
        deleteFile
    };
}

console.log('[EQUIPEMENT-LEVAGE] Module chargé');
