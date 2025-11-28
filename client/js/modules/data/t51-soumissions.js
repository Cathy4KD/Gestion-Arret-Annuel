/**
 * @fileoverview Gestion des Soumissions des Entrepreneurs (T51)
 * @module data/t51-soumissions
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { uploadFiles, deleteFile, getFileUrl } from '../sync/upload-service.js';

/**
 * Cle de stockage
 * @const {string}
 */
const STORAGE_KEY = 't51SoumissionsData'; // Mapping vers t51Data cote serveur via storage-wrapper

/**
 * Donnees des soumissions
 * @type {Array}
 */
let soumissionsData = [];

/**
 * Definit les donnees des soumissions (injection depuis le serveur)
 * @param {Array} data - Donnees a injecter
 * @returns {void}
 */
export function setT51SoumissionsData(data) {
    if (data && Array.isArray(data)) {
        soumissionsData = data;
        console.log(`[T51] ${soumissionsData.length} soumissions injectees depuis le serveur`);

        // Rendre le tableau automatiquement si la page est active
        if (document.getElementById('t51SoumissionsTableBody')) {
            console.log('[T51] Rendu automatique du tableau apres injection');
            renderT51Table();
            updateT51Stats();
        } else {
            console.log('[T51] Page non active, le tableau sera rendu lors du chargement de la page');
        }
    }
}

/**
 * Charge les donnees depuis le serveur
 * @returns {Promise<void>}
 */
export async function loadT51Data() {
    // Les donnees sont injectees par server-sync.js via setT51SoumissionsData()
    // On verifie juste si des donnees existent et on rend le tableau
    if (soumissionsData && soumissionsData.length > 0) {
        console.log(`[T51] ${soumissionsData.length} soumissions chargees depuis le serveur`);
    } else {
        // Essayer de charger depuis le serveur via storage-wrapper
        const saved = await loadFromStorage(STORAGE_KEY);
        if (saved && Array.isArray(saved)) {
            soumissionsData = saved;
            console.log(`[T51] ${soumissionsData.length} soumissions chargees depuis le serveur`);
        } else {
            console.log('[T51] Aucune soumission sur le serveur - tableau vide');
        }
    }
    renderT51Table();
    updateT51Stats();
}

/**
 * Sauvegarde les donnees dans localStorage
 * @returns {void}
 */
function saveT51Data() {
    saveToStorage(STORAGE_KEY, soumissionsData);
    console.log('[T51] Donnees sauvegardees et synchronisees avec le serveur');
}

/**
 * Ajoute une nouvelle soumission
 * @returns {void}
 */
export function addT51Soumission() {
    const dateDemande = new Date().toISOString().split('T')[0];
    const relances = calculateRelances(dateDemande);

    const newSoumission = {
        id: 't51-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        entrepreneur: '',
        codeSAP: '',
        commentaires: '',
        dateDemande: dateDemande,
        relance1: relances.relance1,
        relance2: relances.relance2,
        relance3: relances.relance3,
        dateReception: '',
        numeroSoumission: '',
        documents: []
    };

    soumissionsData.unshift(newSoumission); // Ajouter au debut du tableau
    saveT51Data();
    renderT51Table();
    updateT51Stats();

    console.log('[T51] Nouvelle ligne de soumission ajoutee avec relances calculees');
}

/**
 * Synchronise les entrepreneurs depuis IW37N
 * @returns {void}
 */
export function syncT51Entrepreneurs() {
    const iw37nData = loadFromStorage('iw37nData');

    if (!iw37nData) {
        alert('Aucune donnee IW37N trouvee. Veuillez d\'abord importer les donnees IW37N.');
        return;
    }

    try {
        const parsedData = iw37nData;

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            alert('Les donnees IW37N sont vides.');
            return;
        }

        // Extraire les entrepreneurs uniques (ceux avec Post.trav.oper. commencant par autre chose que "A" sauf A91CS)
        const entrepreneursSet = new Set();

        parsedData.forEach(row => {
            const posteTrav = row['Post.trav.oper.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || '';
            if (posteTrav) {
                const posteUpper = posteTrav.trim().toUpperCase();
                // Inclure A91CS ou ne commence pas par A
                if (posteUpper === 'A91CS' || !posteUpper.startsWith('A')) {
                    entrepreneursSet.add(posteTrav.trim());
                }
            }
        });

        // Creer des soumissions pour les entrepreneurs qui n'existent pas deja
        const existingEntrepreneurs = new Set(soumissionsData.map(s => s.entrepreneur));
        let addedCount = 0;

        entrepreneursSet.forEach(entrepreneur => {
            if (!existingEntrepreneurs.has(entrepreneur)) {
                const dateDemande = new Date().toISOString().split('T')[0];
                const relances = calculateRelances(dateDemande);

                soumissionsData.push({
                    id: 't51-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    entrepreneur: entrepreneur,
                    codeSAP: '',
                    commentaires: '',
                    dateDemande: dateDemande,
                    relance1: relances.relance1,
                    relance2: relances.relance2,
                    relance3: relances.relance3,
                    dateReception: '',
                    numeroSoumission: '',
                    documents: []
                });
                addedCount++;
            }
        });

        saveT51Data();
        renderT51Table();
        updateT51Stats();

        alert(`${addedCount} nouveau(x) entrepreneur(s) synchronise(s) depuis IW37N!`);
        console.log(`[T51] ${addedCount} entrepreneurs ajoutes`);
    } catch (error) {
        console.error('[T51] Erreur lors de la synchronisation:', error);
        alert('Erreur lors de la synchronisation avec IW37N.');
    }
}

/**
 * Determine la couleur de fond pour une date de relance
 * @param {string} relanceDate - Date de relance
 * @param {string} dateReception - Date de reception
 * @returns {string} - Couleur de fond CSS
 */
function getRelanceColor(relanceDate, dateReception) {
    // Si on a recu la soumission, couleur verte
    if (dateReception) {
        return '#d4edda'; // Vert clair
    }

    // Si pas de date de relance, pas de couleur speciale
    if (!relanceDate) {
        return 'white';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const relance = new Date(relanceDate + 'T00:00:00');

    const diffTime = relance - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Date depassee (rouge)
    if (diffDays < 0) {
        return '#f8d7da'; // Rouge clair
    }

    // Date approche (dans les 3 jours) (orange)
    if (diffDays <= 3) {
        return '#fff3cd'; // Orange clair
    }

    // Sinon, couleur normale
    return 'white';
}

/**
 * Rend le tableau des soumissions
 * @returns {void}
 */
export function renderT51Table() {
    const tbody = document.getElementById('t51SoumissionsTableBody');
    if (!tbody) {
        console.warn('[T51] Element t51SoumissionsTableBody non trouve');
        return;
    }

    if (soumissionsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px; color: #999;">
                    Aucune soumission enregistree.<br>
                    Cliquez sur "Nouvelle Soumission" ou "Synchroniser IW37N" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = soumissionsData.map((soum, index) => {
        const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';

        // Calculer les couleurs pour chaque relance
        const relance1Color = getRelanceColor(soum.relance1, soum.dateReception);
        const relance2Color = getRelanceColor(soum.relance2, soum.dateReception);
        const relance3Color = getRelanceColor(soum.relance3, soum.dateReception);

        // Afficher les documents
        let documentsHTML = '';
        if (soum.documents && soum.documents.length > 0) {
            documentsHTML = soum.documents.map((doc, idx) => `
                <div style="display: flex; align-items: center; gap: 3px; margin-bottom: 2px;">
                    ${doc.url
                        ? `<a href="${doc.url}" target="_blank" style="font-size: 0.75em; color: #667eea; text-decoration: none; cursor: pointer;" title="Ouvrir ${doc.name}">
                            ${doc.name}
                           </a>`
                        : `<span style="font-size: 0.75em; color: #999;">${doc.name}</span>`
                    }
                    <button onclick="window.t51Actions.deleteDocument('${soum.id}', ${idx})"
                            style="padding: 1px 4px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 0.7em;">
                        X
                    </button>
                </div>
            `).join('');
        }

        const commonInputStyle = 'width: 100%; padding: 2px 4px; border: none; font-size: 12px; font-family: inherit;';
        const editableStyle = `${commonInputStyle} background: white;`;
        const readonlyStyle = `${commonInputStyle} background: #e9ecef; cursor: default; color: #495057;`;

        return `
            <tr style="background: ${bgColor}; height: 28px;">
                <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                    <input type="text" value="${soum.entrepreneur || ''}" placeholder="Entrepreneur"
                           onchange="window.t51Actions.updateField('${soum.id}', 'entrepreneur', this.value)"
                           style="${editableStyle}">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                    <input type="text" value="${soum.codeSAP || ''}" placeholder="Code"
                           onchange="window.t51Actions.updateField('${soum.id}', 'codeSAP', this.value)"
                           style="${editableStyle}">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                    <textarea onchange="window.t51Actions.updateField('${soum.id}', 'commentaires', this.value)"
                              style="${editableStyle} min-height: 24px; resize: vertical;">${soum.commentaires || ''}</textarea>
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                    <input type="date" value="${soum.dateDemande || ''}"
                           onchange="window.t51Actions.updateField('${soum.id}', 'dateDemande', this.value)"
                           style="${editableStyle}">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${relance1Color};">
                    <input type="date" value="${soum.relance1 || ''}" readonly
                           style="${readonlyStyle} background: ${relance1Color};">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${relance2Color};">
                    <input type="date" value="${soum.relance2 || ''}" readonly
                           style="${readonlyStyle} background: ${relance2Color};">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; background: ${relance3Color};">
                    <input type="date" value="${soum.relance3 || ''}" readonly
                           style="${readonlyStyle} background: ${relance3Color};">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                    <input type="date" value="${soum.dateReception || ''}"
                           onchange="window.t51Actions.updateField('${soum.id}', 'dateReception', this.value)"
                           style="${editableStyle}">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                    <input type="text" value="${soum.numeroSoumission || ''}"
                           onchange="window.t51Actions.updateField('${soum.id}', 'numeroSoumission', this.value)"
                           style="${editableStyle}">
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                    <div style="margin-bottom: 3px; font-size: 0.75em;">${documentsHTML}</div>
                    <input type="file" id="doc-input-${soum.id}" multiple
                           onchange="window.t51Actions.uploadDocument('${soum.id}', this.files)"
                           style="display: none;">
                    <div id="dropzone-${soum.id}"
                         style="border: 1px dashed #aaa; padding: 4px; text-align: center; background: white; cursor: pointer; font-size: 0.7em;"
                         onclick="document.getElementById('doc-input-${soum.id}').click()"
                         ondragover="event.preventDefault(); event.currentTarget.style.borderColor='#667eea'; event.currentTarget.style.background='#e3f2fd';"
                         ondragleave="event.currentTarget.style.borderColor='#aaa'; event.currentTarget.style.background='white';"
                         ondrop="event.preventDefault(); event.currentTarget.style.borderColor='#aaa'; event.currentTarget.style.background='white'; window.t51Actions.uploadDocument('${soum.id}', event.dataTransfer.files);">
                        Glisser/Cliquer
                    </div>
                </td>
                <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; background: #f8f9fa;">
                    <button onclick="window.t51Actions.deleteSoumission('${soum.id}')"
                            style="padding: 2px 6px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 0.75em;">
                        Supprimer
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    console.log(`[T51] Tableau rendu: ${soumissionsData.length} soumissions`);
}

/**
 * Calcule les dates de relance automatiquement
 * @param {string} dateDemande - Date de demande au format YYYY-MM-DD
 * @returns {Object} - Objet contenant relance1, relance2, relance3
 */
function calculateRelances(dateDemande) {
    if (!dateDemande) return { relance1: '', relance2: '', relance3: '' };

    const dateDemandeObj = new Date(dateDemande + 'T00:00:00');

    // Relance 1: +2 semaines (14 jours)
    const relance1Date = new Date(dateDemandeObj);
    relance1Date.setDate(relance1Date.getDate() + 14);

    // Relance 2: +4 semaines (28 jours)
    const relance2Date = new Date(dateDemandeObj);
    relance2Date.setDate(relance2Date.getDate() + 28);

    // Relance 3: +6 semaines (42 jours)
    const relance3Date = new Date(dateDemandeObj);
    relance3Date.setDate(relance3Date.getDate() + 42);

    return {
        relance1: relance1Date.toISOString().split('T')[0],
        relance2: relance2Date.toISOString().split('T')[0],
        relance3: relance3Date.toISOString().split('T')[0]
    };
}

/**
 * Met a jour un champ d'une soumission
 * @param {string} id - ID de la soumission
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateT51Field(id, field, value) {
    const soumission = soumissionsData.find(s => s.id === id);
    if (soumission) {
        soumission[field] = value;

        // Si on modifie la date de demande, recalculer automatiquement les relances
        if (field === 'dateDemande' && value) {
            const relances = calculateRelances(value);
            soumission.relance1 = relances.relance1;
            soumission.relance2 = relances.relance2;
            soumission.relance3 = relances.relance3;
            console.log(`[T51] Relances calculees automatiquement pour ${id}`);
        }

        saveT51Data();
        updateT51Stats();
        renderT51Table(); // Re-render pour mettre a jour les couleurs
        console.log(`[T51] Champ ${field} mis a jour pour ${id}`);
    }
}

/**
 * Supprime une soumission
 * @param {string} id - ID de la soumission
 * @returns {void}
 */
export function deleteT51Soumission(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette soumission?')) {
        return;
    }

    const index = soumissionsData.findIndex(s => s.id === id);
    if (index !== -1) {
        soumissionsData.splice(index, 1);
        saveT51Data();
        renderT51Table();
        updateT51Stats();
        console.log(`[T51] Soumission ${id} supprimee`);
    }
}

/**
 * Upload un document
 * @param {string} id - ID de la soumission
 * @param {FileList} files - Fichiers a uploader
 * @returns {Promise<void>}
 */
export async function uploadT51Document(id, files) {
    const soumission = soumissionsData.find(s => s.id === id);
    if (!soumission) return;

    if (!soumission.documents) {
        soumission.documents = [];
    }

    try {
        // Upload les fichiers vers le serveur
        const result = await uploadFiles(files);

        if (result.success && result.files) {
            // Ajouter les metadonnees des fichiers uploades
            result.files.forEach(fileData => {
                soumission.documents.push({
                    id: fileData.id,
                    name: fileData.originalName,
                    filename: fileData.filename,
                    size: fileData.size,
                    type: fileData.mimetype,
                    uploadDate: fileData.uploadDate,
                    url: fileData.url
                });
            });

            saveT51Data();
            renderT51Table();
            console.log(`[T51] ${result.files.length} document(s) uploade(s) au serveur pour ${id}`);
            alert(`${result.files.length} document(s) uploade(s) avec succes !`);
        }
    } catch (error) {
        console.error('[T51] Erreur lors de l\'upload:', error);
        alert('Erreur lors de l\'upload des documents');
    }
}

/**
 * Supprime un document
 * @param {string} id - ID de la soumission
 * @param {number} docIndex - Index du document
 * @returns {Promise<void>}
 */
export async function deleteT51Document(id, docIndex) {
    if (!confirm('Voulez-vous vraiment supprimer ce document?')) {
        return;
    }

    const soumission = soumissionsData.find(s => s.id === id);
    if (!soumission || !soumission.documents) return;

    const doc = soumission.documents[docIndex];

    try {
        // Supprimer du serveur si le document a un filename
        if (doc.filename) {
            await deleteFile(doc.filename);
            console.log(`[T51] Document supprime du serveur: ${doc.filename}`);
        }
    } catch (error) {
        console.error('[T51] Erreur lors de la suppression du fichier du serveur:', error);
    }

    // Supprimer de la liste locale
    soumission.documents.splice(docIndex, 1);
    saveT51Data();
    renderT51Table();
    console.log(`[T51] Document supprime pour ${id}`);
}

/**
 * Met a jour les statistiques
 * @returns {void}
 */
export function updateT51Stats() {
    const totalElement = document.getElementById('t51TotalSoumissions');
    const enAttenteElement = document.getElementById('t51EnAttente');
    const recuesElement = document.getElementById('t51Recues');
    const relancesElement = document.getElementById('t51Relances');

    if (!totalElement) return;

    const total = soumissionsData.length;
    const recues = soumissionsData.filter(s => s.dateReception && s.dateReception !== '').length;
    const enAttente = total - recues;

    // Relances requises: pas de date de reception et au moins une relance envoyee
    const relances = soumissionsData.filter(s => {
        return !s.dateReception && (s.relance1 || s.relance2 || s.relance3);
    }).length;

    totalElement.textContent = total;
    enAttenteElement.textContent = enAttente;
    recuesElement.textContent = recues;
    relancesElement.textContent = relances;
}

/**
 * Exporte vers Excel
 * @returns {void}
 */
export function exportT51ToExcel() {
    if (soumissionsData.length === 0) {
        alert('Aucune donnee a exporter.');
        return;
    }

    try {
        const exportData = soumissionsData.map(soum => ({
            'Entrepreneur': soum.entrepreneur,
            'Code SAP': soum.codeSAP || '',
            'Commentaires': soum.commentaires || '',
            'Date Demande': soum.dateDemande || '',
            'Relance 1': soum.relance1 || '',
            'Relance 2': soum.relance2 || '',
            'Relance 3': soum.relance3 || '',
            'Date Reception': soum.dateReception || '',
            'N Soumission': soum.numeroSoumission || '',
            'Nb Documents': soum.documents ? soum.documents.length : 0
        }));

        if (typeof XLSX === 'undefined') {
            alert('Bibliotheque XLSX non chargee');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Soumissions');

        const fileName = `Soumissions_Entrepreneurs_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[T51] Export Excel reussi:', fileName);
        alert(`Export Excel reussi: ${soumissionsData.length} soumissions exportees!`);
    } catch (error) {
        console.error('[T51] Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export Excel.');
    }
}

/**
 * Recupere les donnees
 * @returns {Array}
 */
export function getT51Data() {
    return soumissionsData;
}

// Exposer globalement pour l'injection depuis server-sync.js
if (typeof window !== 'undefined') {
    window.setT51SoumissionsData = setT51SoumissionsData;
    console.log('[T51] window.setT51SoumissionsData exposee');
}
