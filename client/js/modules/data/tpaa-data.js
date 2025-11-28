/**
 * @fileoverview TPAA data management module
 * Gestion des données TPAA (Travaux Préparatoires Avant Arrêt)
 * Source: lignes 7336-7675
 * @module tpaa-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getIw37nData } from './iw37n-data.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Global TPAA data array
 * Tableau global des données TPAA
 * @type {Array<Object>}
 */
export let tpaaListeData = [];

/**
 * Set TPAA data (utilisé par server-sync pour injecter les données)
 * Définit les données TPAA
 *
 * @param {Array<Object>} data - New data / Nouvelles données
 *
 * @example
 * setTpaaListeData([{id: 'tpaa-001', ...}]);
 */
export function setTpaaListeData(data) {
    tpaaListeData = data || [];
    console.log(`[TPAA] ✅ Données injectées: ${tpaaListeData.length} TPAA`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setTpaaListeData = setTpaaListeData;
    console.log('[TPAA] ✅ window.setTpaaListeData exposée');
}

/**
 * Load TPAA data from server
 * Charge les données TPAA depuis le serveur
 * Les données sont injectées depuis le serveur via initSync()
 * Cette fonction rend simplement le tableau si des données existent
 *
 * @returns {void}
 *
 * @example
 * loadTPAAListeData();
 */
export async function loadTPAAListeData() {
    // Les données sont injectées par server-sync.js via setTpaaListeData()
    // On vérifie juste si des données existent et on rend le tableau
    if (tpaaListeData && tpaaListeData.length > 0) {
        console.log(`[TPAA] ✅ ${tpaaListeData.length} TPAA chargés depuis le serveur`);
        renderTPAATable();
        if (typeof renderTPAAPWCalendar === 'function') {
            renderTPAAPWCalendar();
        }
    } else {
        // Essayer de charger depuis le serveur via storage-wrapper (PAS de localStorage)
        const saved = await loadFromStorage('tpaaListeData');
        if (saved && Array.isArray(saved)) {
            tpaaListeData = saved;
            console.log(`[TPAA] ✅ ${tpaaListeData.length} TPAA chargés depuis le serveur`);
            renderTPAATable();
            if (typeof renderTPAAPWCalendar === 'function') {
                renderTPAAPWCalendar();
            }
        } else {
            console.log(`[TPAA] ℹ️ Aucune donnée TPAA sur le serveur - tableau vide`);
        }
    }
}

/**
 * Save TPAA data to server
 * Sauvegarde les données TPAA sur le serveur
 * Source: lignes 7351-7358
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * await saveTPAAListeData();
 */
export async function saveTPAAListeData() {
    console.log('[TPAA] 💾 Sauvegarde de', tpaaListeData.length, 'TPAA sur le serveur...');

    const success = await saveToStorage('tpaaListeData', tpaaListeData);

    if (success) {
        console.log('[TPAA] ✅ Données sauvegardées sur le serveur avec succès');
    } else {
        console.error('[TPAA] ❌ Échec de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Sync TPAA from IW37N data
 * Synchronise les TPAA depuis les données IW37N
 * Source: lignes 7361-7431
 *
 * @param {Date} dateDebutArret - Shutdown start date / Date de début de l'arrêt
 * @returns {Promise<number>} Number of items added / Nombre d'éléments ajoutés
 *
 * @example
 * await syncTPAAFromIw37n(new Date('2025-06-01'));
 */
export async function syncTPAAFromIw37n(dateDebutArret) {
    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        alert('[WARNING] Aucune donnée IW37N disponible. Veuillez d\'abord importer un fichier IW37N.');
        return 0;
    }

    // Date de début de l'arrêt
    const dateDebut = new Date(dateDebutArret);

    // Filtrer les lignes qui commencent par "TPAA" dans Désign. opér.
    const newItems = [];
    iw37nData.forEach(row => {
        const designOperation = (row['Désign. opér.'] || '').toString();
        const designOperationUpper = designOperation.toUpperCase();

        // Vérifier si Désign. opér. commence par "TPAA"
        if (designOperationUpper.startsWith('TPAA')) {
            // Extraire le nombre de semaines après "TPAA"
            // Format attendu: "TPAA-12" ou "TPAA -12" ou "TPAA-2"
            const match = designOperation.match(/TPAA\s*-?\s*(\d+)/i);
            let nbrSem = '';
            let calculatedDate = '';

            if (match && match[1]) {
                // Le nombre de semaines est dans match[1]
                const weeks = parseInt(match[1], 10);
                nbrSem = `-${weeks}`;

                // Calculer la date: dateDebutArret - weeks semaines
                const targetDate = new Date(dateDebut);
                targetDate.setDate(targetDate.getDate() - (weeks * 7));

                // Formater la date en YYYY-MM-DD
                const year = targetDate.getFullYear();
                const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                const day = String(targetDate.getDate()).padStart(2, '0');
                calculatedDate = `${year}-${month}-${day}`;
            }

            const id = `tpaa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            newItems.push({
                id: id,
                ordre: row['Ordre'] || '',
                operation: row['Opération'] || '',
                designOperation: row['Désign. opér.'] || '',
                posteTrav: row['Post.trav.'] || row['Post trav'] || row['Poste Trav.'] || '',
                posteTechnique: row['PosteTechnique'] || row['Poste Technique'] || '',
                nbrSem: nbrSem,
                date: calculatedDate,
                statut: 'Nvx Travaux',
                joursSupp: '0',
                commentaire: ''
            });
        }
    });

    // Ajouter les nouveaux items qui n'existent pas déjà
    const existingKeys = new Set(tpaaListeData.map(item => `${item.ordre}-${item.operation}`));
    const itemsToAdd = newItems.filter(item => !existingKeys.has(`${item.ordre}-${item.operation}`));

    tpaaListeData.push(...itemsToAdd);

    // Sauvegarder sur le serveur et attendre la confirmation
    const saveSuccess = await saveTPAAListeData();

    renderTPAATable();
    if (typeof renderTPAAPWCalendar === 'function') {
        renderTPAAPWCalendar();
    }

    if (saveSuccess) {
        if (itemsToAdd.length > 0) {
            alert(`✅ ${itemsToAdd.length} TPAA ajoutés depuis IW37N et sauvegardés sur le serveur !\n\nLes données sont maintenant persistantes et resteront après un rafraîchissement.`);
            console.log(`[TPAA] ${itemsToAdd.length} TPAA ajoutés et sauvegardés`);
        } else {
            alert('ℹ️ Aucun nouveau travail TPAA à ajouter.');
            console.log('[TPAA] Aucun nouveau travail TPAA à ajouter.');
        }
    } else {
        alert(`⚠️ ${itemsToAdd.length} TPAA ajoutés MAIS non sauvegardés sur le serveur !\n\n⚠️ ATTENTION: Les données seront perdues au rafraîchissement.\nVérifiez que le serveur est démarré.`);
        console.error(`[TPAA] ${itemsToAdd.length} TPAA ajoutés mais non sauvegardés sur le serveur !`);
    }

    return itemsToAdd.length;
}

/**
 * Render TPAA table
 * Affiche le tableau des TPAA
 * Source: lignes 7434-7505
 *
 * @example
 * renderTPAATable();
 */
export function renderTPAATable() {
    const tbody = document.getElementById('tpaaTableBody');
    const countSpan = document.getElementById('tpaaCount');

    if (!tbody) {
        console.warn('[WARNING] Element tpaaTableBody non trouvé');
        return;
    }

    if (!tpaaListeData || tpaaListeData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail TPAA dans la liste. Cliquez sur "Synchroniser avec IW37N" pour extraire les TPAA.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = tpaaListeData.length;

    tpaaListeData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        row.style.height = '28px';

        // Générer les options pour le menu déroulant de jours (+?)
        let joursOptions = '<option value="0">0</option>';
        for (let i = 7; i <= 49; i += 7) {
            const selected = item.joursSupp === i.toString() ? 'selected' : '';
            joursOptions += `<option value="${i}" ${selected}>${i}</option>`;
        }

        // Définir les couleurs de statut
        const statutColors = {
            'Nvx Travaux': '#28a745',
            'Planifié': '#4299e1',
            'Complété': '#48bb78',
            'Annulé': '#6c757d',
            'Cloturé': '#48bb78'
        };
        const currentColor = statutColors[item.statut] || '#000';

        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-weight: bold; font-size: 12px;">${item.ordre}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px;">${item.operation}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px;">${item.designOperation}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px;">${item.posteTrav || ''}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px;">${item.posteTechnique || ''}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${item.nbrSem}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${item.date}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <select onchange="updateTPAAStatut('${item.id}', this.value)" style="width: 100%; padding: 2px 4px; border: none; font-size: 11px; background-color: ${currentColor}; color: white; font-weight: bold;">
                    <option value="Nvx Travaux" ${item.statut === 'Nvx Travaux' ? 'selected' : ''} style="background-color: #28a745; color: white;">Nvx Travaux</option>
                    <option value="Planifié" ${item.statut === 'Planifié' ? 'selected' : ''} style="background-color: #4299e1; color: white;">Planifié</option>
                    <option value="Complété" ${item.statut === 'Complété' ? 'selected' : ''} style="background-color: #48bb78; color: white;">Complété</option>
                    <option value="Annulé" ${item.statut === 'Annulé' ? 'selected' : ''} style="background-color: #6c757d; color: white;">Annulé</option>
                    <option value="Cloturé" ${item.statut === 'Cloturé' ? 'selected' : ''} style="background-color: #48bb78; color: white;">Cloturé</option>
                </select>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <select onchange="updateTPAAJoursSupp('${item.id}', this.value)" style="width: 100%; padding: 2px 4px; border: none; font-size: 11px;">
                    ${joursOptions}
                </select>
            </td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6;">
                <input type="text" value="${item.commentaire}"
                       onchange="updateTPAACommentaire('${item.id}', this.value)"
                       style="width: 100%; padding: 2px 4px; border: none; font-size: 12px;">
            </td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour les KPI
    updateTPAAKPI();
}

// Exposer renderTPAATable globalement pour server-sync.js et page-loader.js
if (typeof window !== 'undefined') {
    window.renderTPAATable = renderTPAATable;
    console.log('[TPAA] ✅ window.renderTPAATable exposée');
}

/**
 * Update TPAA KPI display
 * Met à jour l'affichage des KPI TPAA
 * Source: lignes 7508-7577
 *
 * @example
 * updateTPAAKPI();
 */
export function updateTPAAKPI() {
    const container = document.getElementById('tpaaKPI');

    if (!container) {
        return;
    }

    if (!tpaaListeData || tpaaListeData.length === 0) {
        container.innerHTML = '';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculer les statistiques
    const stats = {
        total: tpaaListeData.length,
        nvxTravaux: tpaaListeData.filter(t => t.statut === 'Nvx Travaux').length,
        planifie: tpaaListeData.filter(t => t.statut === 'Planifié').length,
        complete: tpaaListeData.filter(t => t.statut === 'Complété').length,
        annule: tpaaListeData.filter(t => t.statut === 'Annulé').length,
        cloture: tpaaListeData.filter(t => t.statut === 'Cloturé').length,
        enRetard: 0
    };

    // Calculer les tâches en retard (date passée et statut != Complété et != Cloturé et != Annulé)
    tpaaListeData.forEach(item => {
        if (item.date) {
            const itemDate = new Date(item.date);
            if (itemDate < today && item.statut !== 'Complété' && item.statut !== 'Cloturé' && item.statut !== 'Annulé') {
                stats.enRetard++;
            }
        }
    });

    // Calculer le pourcentage d'avancement
    const completed = stats.complete + stats.cloture;
    const percentage = stats.total > 0 ? Math.round((completed / stats.total) * 100) : 0;

    // Générer le HTML des KPI
    container.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px 12px; border-radius: 8px; color: white; text-align: center;">
            <div style="font-size: 0.7em; opacity: 0.9; margin-bottom: 2px;">Avancement</div>
            <div style="font-size: 1.3em; font-weight: bold;">${percentage}%</div>
            <div style="font-size: 0.65em; opacity: 0.8;">${completed}/${stats.total}</div>
        </div>

        <div style="background: #28a745; padding: 8px 12px; border-radius: 8px; color: white; text-align: center;">
            <div style="font-size: 0.7em; opacity: 0.9; margin-bottom: 2px;">Nvx Travaux</div>
            <div style="font-size: 1.3em; font-weight: bold;">${stats.nvxTravaux}</div>
        </div>

        <div style="background: #4299e1; padding: 8px 12px; border-radius: 8px; color: white; text-align: center;">
            <div style="font-size: 0.7em; opacity: 0.9; margin-bottom: 2px;">Planifiés</div>
            <div style="font-size: 1.3em; font-weight: bold;">${stats.planifie}</div>
        </div>

        <div style="background: #48bb78; padding: 8px 12px; border-radius: 8px; color: white; text-align: center;">
            <div style="font-size: 0.7em; opacity: 0.9; margin-bottom: 2px;">Complétés</div>
            <div style="font-size: 1.3em; font-weight: bold;">${stats.complete}</div>
        </div>

        <div style="background: #dc3545; padding: 8px 12px; border-radius: 8px; color: white; text-align: center;">
            <div style="font-size: 0.7em; opacity: 0.9; margin-bottom: 2px;">En Retard</div>
            <div style="font-size: 1.3em; font-weight: bold;">${stats.enRetard}</div>
        </div>

        <div style="background: #6c757d; padding: 8px 12px; border-radius: 8px; color: white; text-align: center;">
            <div style="font-size: 0.7em; opacity: 0.9; margin-bottom: 2px;">Annulés</div>
            <div style="font-size: 1.3em; font-weight: bold;">${stats.annule}</div>
        </div>
    `;
}

/**
 * Update TPAA status
 * Met à jour le statut d'un TPAA
 * Source: lignes 7580-7587
 *
 * @param {string} itemId - Item ID / ID de l'élément
 * @param {string} newStatut - New status / Nouveau statut
 *
 * @example
 * updateTPAAStatut('tpaa-001', 'Complété');
 */
export function updateTPAAStatut(itemId, newStatut) {
    const item = tpaaListeData.find(t => t.id === itemId);
    if (item) {
        item.statut = newStatut;
        saveTPAAListeData();
        renderTPAATable();
    }
}

/**
 * Update TPAA additional days
 * Met à jour les jours supplémentaires d'un TPAA
 * Source: lignes 7590-7596
 *
 * @param {string} itemId - Item ID / ID de l'élément
 * @param {string} newJours - New days value / Nouvelle valeur de jours
 *
 * @example
 * updateTPAAJoursSupp('tpaa-001', '7');
 */
export function updateTPAAJoursSupp(itemId, newJours) {
    const item = tpaaListeData.find(t => t.id === itemId);
    if (item) {
        item.joursSupp = newJours;
        saveTPAAListeData();
    }
}

/**
 * Update TPAA comment
 * Met à jour le commentaire d'un TPAA
 * Source: lignes 7599-7605
 *
 * @param {string} itemId - Item ID / ID de l'élément
 * @param {string} newCommentaire - New comment / Nouveau commentaire
 *
 * @example
 * updateTPAACommentaire('tpaa-001', 'Travail urgent');
 */
export function updateTPAACommentaire(itemId, newCommentaire) {
    const item = tpaaListeData.find(t => t.id === itemId);
    if (item) {
        item.commentaire = newCommentaire;
        saveTPAAListeData();
    }
}

/**
 * Sort TPAA by date
 * Trie les TPAA par date
 * Source: lignes 7608-7632
 *
 * @param {string} order - Sort order ('asc' or 'desc') / Ordre de tri
 *
 * @example
 * sortTPAAByDate('asc');
 */
export function sortTPAAByDate(order) {
    if (!tpaaListeData || tpaaListeData.length === 0) {
        return;
    }

    tpaaListeData.sort((a, b) => {
        // Gérer les dates vides (les mettre à la fin)
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;

        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (order === 'asc') {
            // Plus récente → Ancienne (dates décroissantes)
            return dateB - dateA;
        } else {
            // Plus ancienne → Récente (dates croissantes)
            return dateA - dateB;
        }
    });

    renderTPAATable();
}

/**
 * Export TPAA list to Excel
 * Exporte la liste TPAA vers Excel
 * Source: lignes 7635-7675
 *
 * @returns {Promise<boolean>} Success status / Statut de succès
 *
 * @example
 * exportTPAAToExcel();
 */
export function exportTPAAToExcel() {
    if (!tpaaListeData || tpaaListeData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return false;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[TPAA] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return false;
    }

    // Préparer les données pour l'export
    const exportData = tpaaListeData.map(item => ({
        'Ordre': item.ordre,
        'Opération': item.operation,
        'Design. Opération': item.designOperation,
        'Post. Trav.': item.posteTrav || '',
        'Poste Technique': item.posteTechnique || '',
        'Nbr sem': item.nbrSem,
        'Date': item.date,
        'Statut': item.statut,
        '+? jours': item.joursSupp,
        'Commentaire': item.commentaire
    }));

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Liste TPAA');

    // Télécharger le fichier
    const fileName = `Liste_TPAA_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(` Fichier exporté: ${fileName}`);
    return true;
}

/**
 * Get TPAA data
 * Obtient les données TPAA
 *
 * @returns {Array<Object>} TPAA data / Données TPAA
 *
 * @example
 * const data = getTpaaData();
 */
export function getTpaaData() {
    return tpaaListeData;
}


