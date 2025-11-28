/**
 * @fileoverview PSV data management module
 * Gestion des données PSV (Pressure Safety Valves)
 * Source: lignes 6894-7188
 * @module psv-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getIw37nData } from './iw37n-data.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Global PSV data array
 * Tableau global des données PSV
 * @type {Array<Object>}
 */
export let psvData = [];

/**
 * PSV characteristics data
 * Données des caractéristiques PSV
 * @type {Array<Object>}
 */
export let psvCharsData = [];

/**
 * Selected PSV number for filtering
 * Numéro PSV sélectionné pour le filtrage
 * @type {string|null}
 */
export let selectedPSVNumber = null;

/**
 * Set PSV data (utilisé par server-sync pour injecter les données)
 * Définit les données PSV
 *
 * @param {Array<Object>} data - New data / Nouvelles données
 *
 * @example
 * setPsvData([{ordre: 'PSV001', ...}]);
 */
export function setPsvData(data) {
    psvData = data || [];
    console.log(`[PSV] ✅ Données injectées: ${psvData.length} PSV`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setPsvData = setPsvData;
    console.log('[PSV] ✅ window.setPsvData exposée');
}

/**
 * Load PSV data from server
 * Charge les données PSV depuis le serveur
 * Les données sont injectées depuis le serveur via initSync()
 * Cette fonction rend simplement le tableau si des données existent
 *
 * @returns {void}
 *
 * @example
 * loadPSVData();
 */
export async function loadPSVData() {
    // Les données sont injectées par server-sync.js via setPsvData()
    // On vérifie juste si des données existent et on rend le tableau
    if (psvData && psvData.length > 0) {
        console.log(`[PSV] ✅ ${psvData.length} PSV chargés depuis le serveur`);
        renderPSVTable();
        renderUniquePSVTable();  // Extraire automatiquement la liste unique
    } else {
        // Fallback: essayer localStorage si le serveur n'a pas de données
        const saved = await loadFromStorage('psvData');
        if (saved) {
            psvData = saved;
            console.log(`[PSV] ${psvData.length} PSV chargés depuis localStorage (fallback)`);
            renderPSVTable();
            renderUniquePSVTable();  // Extraire automatiquement la liste unique
        } else {
            console.log(`[PSV] ℹ️ Aucune donnée PSV disponible`);
        }
    }
}

/**
 * Save PSV data to server
 * Sauvegarde les données PSV sur le serveur
 * Source: lignes 6911-6918
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await savePSVData();
 */
export async function savePSVData() {
    console.log('[PSV] 💾 Sauvegarde de', psvData.length, 'PSV sur le serveur...');

    const success = await saveToStorage('psvData', psvData);

    if (success) {
        console.log('[PSV] ✅ Données sauvegardées sur le serveur avec succès');
    } else {
        console.error('[PSV] ❌ Échec de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Sync PSV from IW37N data
 * Synchronise les PSV depuis les données IW37N
 * Source: lignes 6921-6954
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await syncPSVFromIw37n();
 */
export async function syncPSVFromIw37n() {
    console.log('[PSV] 🔄 Synchronisation des PSV depuis IW37N...');
    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N disponible. Veuillez d\'abord importer un fichier IW37N.');
        return false;
    }

    console.log(`[PSV] 📊 ${iw37nData.length} lignes IW37N à analyser`);

    // Afficher les colonnes disponibles pour diagnostic
    if (iw37nData.length > 0) {
        const columns = Object.keys(iw37nData[0]);
        console.log('[PSV] Colonnes disponibles:', columns);
    }

    // Vider la liste actuelle pour recréer une liste fraîche
    psvData = [];

    // Filtrer les lignes qui contiennent "PSV" dans Design. opér.
    iw37nData.forEach(row => {
        // Gérer les variantes de noms de colonnes
        const designOperation = (
            row['Désign. opér.'] ||
            row['Désign.opération'] ||
            row['Design operation'] ||
            row['Désignation'] ||
            row['Designation'] ||
            ''
        ).toString().trim().toUpperCase();

        const posteTechnique = (
            row['POSTE TECHNIQUE'] ||
            row['Poste technique'] ||
            row['PosteTechnique'] ||
            ''
        ).toString().trim();

        // Vérifier si "PSV" est présent dans Design. opér.
        if (designOperation.includes('PSV')) {
            const ordre = row['Ordre'] || row['ordre'] || '';
            const psvItem = {
                ordre: ordre,
                operation: row['Opération'] || row['Operation'] || '',
                designOperation: row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || row['Désignation'] || row['Designation'] || '',
                posteTechnique: posteTechnique,
                photos: []
            };
            psvData.push(psvItem);

            // Log les PSV trouvés pour diagnostic
            if (psvData.length <= 5) {
                console.log(`[PSV] ✅ PSV trouvé #${psvData.length}: Ordre=${ordre}, Design=${psvItem.designOperation}`);
            }
        }
    });

    console.log(`[PSV] 🎯 ${psvData.length} PSV extraits (lignes contenant "PSV" dans Design. opér.)`);

    // Sauvegarder sur le serveur et attendre la confirmation
    const saveSuccess = await savePSVData();

    renderPSVTable();
    renderUniquePSVTable();  // Extraire automatiquement la liste unique des PSV

    if (saveSuccess) {
        if (psvData.length > 0) {
            alert(`✅ ${psvData.length} PSV extraits depuis IW37N et sauvegardés sur le serveur !\n\nLes données sont maintenant persistantes et resteront après un rafraîchissement.`);
            console.log(`[PSV] ${psvData.length} PSV extraits et sauvegardés`);
        } else {
            alert('ℹ️ Aucun PSV trouvé dans les données IW37N.');
            console.log('[PSV] Aucun PSV trouvé dans les données IW37N.');
        }
        return true;
    } else {
        alert(`⚠️ ${psvData.length} PSV extraits MAIS non sauvegardés sur le serveur !\n\n⚠️ ATTENTION: Les données seront perdues au rafraîchissement.\nVérifiez que le serveur est démarré.`);
        console.error(`[PSV] ${psvData.length} PSV extraits mais non sauvegardés sur le serveur !`);
        return false;
    }
}

/**
 * Render PSV table
 * Affiche le tableau des PSV
 * Source: lignes 6957-6988
 *
 * @example
 * renderPSVTable();
 */
export function renderPSVTable() {
    const tbody = document.getElementById('psvTableBody');
    const countSpan = document.getElementById('psvCount');

    if (!tbody) {
        console.warn('[WARNING] Element psvTableBody non trouvé');
        return;
    }

    if (!psvData || psvData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucun PSV dans la liste. Cliquez sur "Synchroniser avec IW37N" pour extraire les PSV.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = psvData.length;

    psvData.forEach((item, index) => {
        // Ensure photos array exists
        if (!item.photos) {
            item.photos = [];
        }

        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        row.style.height = '28px';

        // Build photos display
        let photosHtml = '';
        if (item.photos && item.photos.length > 0) {
            photosHtml = item.photos.map(photo => `
                <div style="display: inline-block; margin: 2px; position: relative;">
                    <img src="${photo.dataUrl}"
                         onclick="viewPSVPhoto('${item.ordre}', '${photo.id}')"
                         style="width: 40px; height: 40px; object-fit: cover; cursor: pointer; border-radius: 3px; border: 1px solid #ddd;"
                         title="${photo.name}">
                    <button onclick="deletePSVPhoto('${item.ordre}', '${photo.id}')"
                            style="position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; font-size: 10px; padding: 0; line-height: 1;">×</button>
                </div>
            `).join('');
        }

        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-weight: bold; font-size: 12px; background: #e9ecef;">${item.ordre}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${item.operation}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px; background: #e9ecef;">${item.designOperation}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px; background: #e9ecef;">${item.posteTechnique}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; min-width: 120px;">
                <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                    ${photosHtml}
                    <label style="cursor: pointer; padding: 2px 6px; background: #667eea; color: white; border-radius: 3px; font-size: 10px; display: inline-block;">
                        📷 +
                        <input type="file"
                               accept="image/*"
                               onchange="handlePSVPhotoUpload(event, '${item.ordre}')"
                               style="display: none;">
                    </label>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Exposer renderPSVTable globalement pour server-sync.js et page-loader.js
if (typeof window !== 'undefined') {
    window.renderPSVTable = renderPSVTable;
    console.log('[PSV] ✅ window.renderPSVTable exposée');
}

/**
 * Export PSV list to Excel
 * Exporte la liste PSV vers Excel
 * Source: lignes 6991-7023
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * exportPSVToExcel();
 */
export function exportPSVToExcel() {
    if (!psvData || psvData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return false;
    }

    // Préparer les données pour l'export
    const exportData = psvData.map(item => ({
        'Ordre': item.ordre,
        'Opération': item.operation,
        'Design. Opération': item.designOperation,
        'Poste Technique': item.posteTechnique
    }));

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Liste PSV');

    // Télécharger le fichier
    const fileName = `Liste_PSV_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(` Fichier exporté: ${fileName}`);
    return true;
}

/**
 * Handle PSV characteristics file upload
 * Gère l'upload du fichier de caractéristiques PSV
 * Source: lignes 7030-7054
 *
 * @param {Event} event - File input change event / Événement de changement
 *
 * @example
 * inputElement.addEventListener('change', handlePSVCharsUpload);
 */
export function handlePSVCharsUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[PSV] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            psvCharsData = jsonData;
            savePSVCharsData();

            alert(`[OK] ${jsonData.length} lignes de caractéristiques PSV importées.`);
            if (typeof switchPage === 'function') {
                switchPage('psv_caracteristiques');
            }

        } catch (error) {
            console.error('[ERROR] Erreur import caractéristiques PSV:', error);
            alert('Erreur lors de la lecture du fichier.');
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Save PSV characteristics data
 * Sauvegarde les données de caractéristiques PSV
 * Source: lignes 7056-7058
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * savePSVCharsData();
 */
export async function savePSVCharsData() {
    return await saveToStorage('psvCharsData', psvCharsData);
}

/**
 * Load PSV characteristics data
 * Charge les données de caractéristiques PSV
 * Source: lignes 7060-7065
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * loadPSVCharsData();
 */
export async function loadPSVCharsData() {
    const saved = await loadFromStorage('psvCharsData', []);
    if (saved) {
        psvCharsData = saved;
        return true;
    }
    return false;
}

/**
 * Render PSV characteristics table
 * Affiche le tableau des caractéristiques PSV
 * Source: lignes 7067-7114
 *
 * @example
 * renderPSVCharsTable();
 */
export function renderPSVCharsTable() {
    const table = document.getElementById('psvCharsTable');
    if (!table) return;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    const title = document.querySelector('#psv_caracteristiques h2');

    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';

    let dataToRender = psvCharsData;
    let pageTitle = "Caractéristiques des PSV";

    if (selectedPSVNumber) {
        pageTitle = `Caractéristiques pour ${selectedPSVNumber}`;
        dataToRender = psvCharsData.filter(row => {
            const tag = row['TAG'] || row['PSV'] || row['Numéro'] || row['Numero'] || row['Tag'];
            return tag && tag.toUpperCase().includes(selectedPSVNumber.toUpperCase());
        });
    }

    if (title) title.textContent = pageTitle;

    if (dataToRender.length === 0) {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px;">
                ${selectedPSVNumber ? `Aucune caractéristique trouvée pour ${selectedPSVNumber}` : 'Aucune donnée importée.'}
            </td></tr>`;
        }
        return;
    }

    const headers = Object.keys(dataToRender[0]);
    if (thead) {
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
    }

    if (tbody) {
        dataToRender.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }
}

/**
 * Render unique PSV table
 * Affiche le tableau des PSV uniques
 * Source: lignes 7116-7150
 *
 * @example
 * renderUniquePSVTable();
 */
export function renderUniquePSVTable() {
    console.log('[PSV] 🔍 Extraction de la liste unique des PSV...');
    console.log('[PSV] Nombre total de PSV avant filtrage:', psvData.length);

    const uniquePsvNumbers = new Set();
    let excludedCount = 0;

    psvData.forEach(item => {
        const designOperation = (item.designOperation || '').trim();

        // Exclure les lignes qui commencent par "C/O"
        if (designOperation.toUpperCase().startsWith('C/O')) {
            excludedCount++;
            console.log('[PSV] ❌ Exclu (C/O):', designOperation);
            return; // Ignorer cette ligne
        }

        // Extraire uniquement les PSV suivis d'un NUMÉRO
        // ✅ Accepte: PSV-1234, PSV1234, PSV 1234, PSV-1234A, PSV1234-A
        // ❌ Rejette: PSV APR, PSV ABC (pas de numéro)
        const match = designOperation.match(/PSV[-\s]?\d+[A-Z]*/i);
        if (match) {
            const psvNumber = match[0].toUpperCase().trim();
            uniquePsvNumbers.add(psvNumber);
            console.log('[PSV] ✅ PSV trouvé:', psvNumber, 'dans', designOperation);
        } else if (designOperation.includes('PSV')) {
            // Log les PSV sans numéro qui sont ignorés
            console.log('[PSV] ⚠️ PSV sans numéro ignoré:', designOperation);
        }
    });

    console.log(`[PSV] 📊 Résultat: ${uniquePsvNumbers.size} PSV uniques trouvés (${excludedCount} lignes C/O exclues)`);

    const tbody = document.getElementById('uniquePSVTableBody');
    const countSpan = document.getElementById('uniquePSVCount');

    if (countSpan) {
        countSpan.textContent = uniquePsvNumbers.size;
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (uniquePsvNumbers.size === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" style="text-align: center; padding: 30px; color: #666;">
                    <div style="font-size: 1.2em; margin-bottom: 10px;">ℹ️</div>
                    <strong>Aucun numéro de PSV trouvé</strong><br>
                    <small style="color: #999;">Vérifiez que le tableau "Liste Complète" contient des PSV</small>
                </td>
            </tr>
        `;
        return;
    }

    // Trier et afficher
    Array.from(uniquePsvNumbers).sort().forEach((psvNumber, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        const tr = document.createElement('tr');
        tr.style.background = bgColor;
        tr.innerHTML = `
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; font-size: 1.05em; color: #333;">${psvNumber}</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="viewPSVCharacteristics('${psvNumber}')" style="padding: 8px 20px; background: linear-gradient(145deg, #667eea, #764ba2); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔍 Voir Caractéristiques
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    console.log('[PSV] ✅ Tableau "Liste Unique" rendu avec', uniquePsvNumbers.size, 'PSV');
}

/**
 * View PSV characteristics
 * Affiche les caractéristiques d'un PSV spécifique
 * Source: lignes 7152-7155
 *
 * @param {string} psvNumber - PSV number / Numéro PSV
 *
 * @example
 * viewPSVCharacteristics('PSV-001');
 */
export function viewPSVCharacteristics(psvNumber) {
    selectedPSVNumber = psvNumber;
    if (typeof switchPage === 'function') {
        switchPage('psv_caracteristiques');
    }
}

/**
 * Export and email unique PSV list
 * Exporte et envoie par email la liste des PSV uniques
 * Source: lignes 7157-7188
 *
 * @example
 * exportAndEmailUniquePSV();
 */
export function exportAndEmailUniquePSV() {
    const uniquePsvNumbers = new Set();
    psvData.forEach(item => {
        const designOperation = (item.designOperation || '').trim();

        // Exclure les lignes qui commencent par "C/O"
        if (designOperation.toUpperCase().startsWith('C/O')) {
            return; // Ignorer cette ligne
        }

        // Extraire tous les termes qui commencent par "PSV"
        const match = designOperation.match(/PSV-?\d+/i);
        if (match) {
            uniquePsvNumbers.add(match[0].toUpperCase());
        }
    });

    if (uniquePsvNumbers.size === 0) {
        alert('Aucun PSV à exporter.');
        return;
    }

    const dataToExport = Array.from(uniquePsvNumbers).sort().map(psv => ({ 'Numéro PSV': psv }));

    // Create Excel file
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PSV Uniques');
    const fileName = `Liste_PSV_Uniques_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    // Create and open mailto link
    const subject = "Liste des PSV Uniques";
    const body = `Bonjour,\n\nVeuillez trouver ci-joint la liste des PSV uniques, exportée le ${new Date().toLocaleDateString('fr-CA')}.\n\nLe fichier à joindre est : ${fileName}\n\nCordialement,`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    alert(`L'exportation est terminée.\n\nN'oubliez pas de joindre le fichier "${fileName}" à votre email.`);
}

/**
 * Handle PSV photo upload
 * Gère l'upload d'une photo pour un PSV
 *
 * @param {Event} event - File input change event / Événement de changement
 * @param {string} psvOrdre - PSV ordre number / Numéro d'ordre PSV
 *
 * @example
 * handlePSVPhotoUpload(event, 'PSV001');
 */
export function handlePSVPhotoUpload(event, psvOrdre) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        console.error('[ERROR] Fichier trop volumineux (max 5MB)');
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        console.error('[ERROR] Le fichier doit être une image');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const psv = psvData.find(p => p.ordre === psvOrdre);
        if (!psv) {
            console.error('[ERROR] PSV non trouvé:', psvOrdre);
            return;
        }

        if (!psv.photos) {
            psv.photos = [];
        }

        psv.photos.push({
            id: 'photo-' + Date.now(),
            name: file.name,
            type: file.type,
            dataUrl: e.target.result,
            uploadDate: new Date().toISOString()
        });

        savePSVData();
        renderPSVTable();
        console.log('[OK] Photo ajoutée pour', psvOrdre);
    };

    reader.readAsDataURL(file);
}

/**
 * Delete PSV photo
 * Supprime une photo d'un PSV
 *
 * @param {string} psvOrdre - PSV ordre number / Numéro d'ordre PSV
 * @param {string} photoId - Photo ID / ID de la photo
 *
 * @example
 * deletePSVPhoto('PSV001', 'photo-123456');
 */
export function deletePSVPhoto(psvOrdre, photoId) {
    const psv = psvData.find(p => p.ordre === psvOrdre);
    if (!psv || !psv.photos) return;

    psv.photos = psv.photos.filter(photo => photo.id !== photoId);

    savePSVData();
    renderPSVTable();
    console.log('[OK] Photo supprimée pour', psvOrdre);
}

/**
 * View PSV photo in modal
 * Affiche une photo PSV dans une modale
 *
 * @param {string} psvOrdre - PSV ordre number / Numéro d'ordre PSV
 * @param {string} photoId - Photo ID / ID de la photo
 *
 * @example
 * viewPSVPhoto('PSV001', 'photo-123456');
 */
export function viewPSVPhoto(psvOrdre, photoId) {
    const psv = psvData.find(p => p.ordre === psvOrdre);
    if (!psv || !psv.photos) return;

    const photo = psv.photos.find(p => p.id === photoId);
    if (!photo) return;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%; display: flex; flex-direction: column; align-items: center;">
            <div style="margin-bottom: 10px; color: white; text-align: center;">
                <h3 style="margin: 0 0 5px 0;">${psvOrdre}</h3>
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">${photo.name}</p>
            </div>
            <img src="${photo.dataUrl}" style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 5px;">
            <button onclick="this.closest('[style*=\\'position: fixed\\']').remove()"
                    style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">×</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Get PSV data
 * Obtient les données PSV
 *
 * @returns {Array<Object>} PSV data / Données PSV
 *
 * @example
 * const data = getPsvData();
 */
export function getPsvData() {
    return psvData;
}

/**
 * Export PSV characteristics to Excel
 * Exporte les caractéristiques PSV vers Excel
 *
 * @returns {boolean} Success status / Statut de succès
 *
 * @example
 * exportPSVCharsToExcel();
 */
export function exportPSVCharsToExcel() {
    if (!psvCharsData || psvCharsData.length === 0) {
        alert('⚠️ Aucune donnée de caractéristiques PSV à exporter.');
        return false;
    }

    try {
        // Créer le workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(psvCharsData);

        // Ajuster automatiquement la largeur des colonnes
        ws['!cols'] = autoSizeColumns(ws, psvCharsData);

        XLSX.utils.book_append_sheet(wb, ws, 'Caractéristiques PSV');

        // Télécharger le fichier
        const fileName = `Caracteristiques_PSV_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        console.log(`✅ Fichier exporté: ${fileName}`);

        alert(`✅ Exportation réussie!\n\nFichier: ${fileName}\n${psvCharsData.length} lignes exportées.`);
        return true;
    } catch (error) {
        console.error('[ERROR] Erreur lors de l\'exportation:', error);
        alert('❌ Erreur lors de l\'exportation. Vérifiez la console.');
        return false;
    }
}



