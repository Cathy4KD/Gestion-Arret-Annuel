/**
 * @fileoverview Gestion des données des PW (Planned Work)
 * @module data/pw-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getIw37nData } from './iw37n-data.js';

/**
 * Clé de stockage
 * @const {string}
 */
const STORAGE_KEY_PW = 'pwData';

/**
 * Données des PW
 * @type {Array}
 */
let pwData = [];

/**
 * Set PW data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setPwData(data) {
    pwData = data || [];
    console.log(`[PW] ✅ Données injectées: ${pwData.length} PW`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setPwData = setPwData;
    console.log('[PW] ✅ window.setPwData exposée');
}

/**
 * Charge les données des PW depuis le serveur
 * Les données sont injectées depuis le serveur via initSync()
 * Cette fonction rend simplement le tableau si des données existent
 * @returns {void}
 */
export async function loadPWData() {
    // Les données sont injectées par server-sync.js via setPwData()
    // On vérifie juste si des données existent et on rend le tableau
    if (pwData && pwData.length > 0) {
        console.log(`[PW] ✅ ${pwData.length} PW chargés depuis le serveur`);
        renderPWTable();
        updatePWCount();
    } else {
        // Fallback: essayer localStorage si le serveur n'a pas de données
        const saved = await loadFromStorage(STORAGE_KEY_PW);
        if (saved) {
            pwData = saved;
            console.log(`[PW] ${pwData.length} PW chargés depuis localStorage (fallback)`);
            renderPWTable();
            updatePWCount();
        } else {
            console.log(`[PW] ℹ️ Aucune donnée PW disponible`);
        }
    }
}

/**
 * Sauvegarde les données des PW sur le serveur
 * @returns {Promise<boolean>}
 */
async function savePWData() {
    console.log('[PW] 💾 Sauvegarde de', pwData.length, 'PW sur le serveur...');

    const success = await saveToStorage(STORAGE_KEY_PW, pwData);

    if (success) {
        console.log('[PW] ✅ Données sauvegardées sur le serveur avec succès');
    } else {
        console.error('[PW] ❌ Échec de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Synchronise les PW depuis IW37N
 * Extrait les travaux dont Design. Opération contient "PW" ou commence par "PLANNED WORK"
 * @returns {Promise<void>}
 */
export async function syncPWFromIw37n() {
    const parsedData = getIw37nData();

    if (!parsedData || parsedData.length === 0) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord importer les données IW37N.');
        return;
    }

    try {
        // Filtrer les PW
        const newPWData = [];

        parsedData.forEach(row => {
            const ordre = row['Ordre'] || row['ordre'] || '';
            const operation = row['Opération'] || row['operation'] || '';
            const designOperation = row['Désign. opér.'] || row['Design operation'] || row['Design. Opération'] || '';
            const nbrSem = row['Nbr sem'] || row['NbrSem'] || '';
            const date = row['Date'] || row['date'] || '';

            // Vérifier si la désignation contient "PW" ou commence par "PLANNED WORK"
            const designUpper = designOperation.toUpperCase();
            if (designUpper.includes(' PW ') || designUpper.includes('PW-') ||
                designUpper.startsWith('PW ') || designUpper.startsWith('PLANNED WORK')) {

                const planEntretien = row['Plan d\'entret.'] || row['Plan entretien'] || row['PlanEntretien'] || '';
                const textePlanEntretien = row['Txt.poste entr.'] || row['Texte poste entretien'] || row['TextePosteEntretien'] || '';
                const interval = row['Interval'] || row['Intervalle'] || '';
                const uniteInterval = row['Un.interv.'] || row['Unite intervalle'] || row['UniteIntervalle'] || '';
                const secteur = row['Poste technique(secteur)'] || row['PosteTechnique'] || row['Poste Technique'] || '';

                newPWData.push({
                    id: 'pw-' + Date.now() + '-' + Math.random(),
                    ordre: ordre,
                    operation: operation,
                    designOperation: designOperation,
                    planEntretien: planEntretien,
                    textePlanEntretien: textePlanEntretien,
                    interval: interval,
                    uniteInterval: uniteInterval,
                    secteur: secteur,
                    nbrSem: nbrSem,
                    date: date,
                    statut: 'En cours',
                    joursSupp: '',
                    commentaire: ''
                });
            }
        });

        pwData = newPWData;

        // Sauvegarder sur le serveur et attendre la confirmation
        const saveSuccess = await savePWData();

        renderPWTable();
        updatePWCount();

        if (saveSuccess) {
            alert(`✅ ${newPWData.length} travaux PW synchronisés depuis IW37N et sauvegardés sur le serveur !\n\nLes données sont maintenant persistantes et resteront après un rafraîchissement.`);
            console.log(`[PW] ${newPWData.length} PW importés et sauvegardés`);
        } else {
            alert(`⚠️ ${newPWData.length} travaux PW synchronisés MAIS non sauvegardés sur le serveur !\n\n⚠️ ATTENTION: Les données seront perdues au rafraîchissement.\nVérifiez que le serveur est démarré.`);
            console.error(`[PW] ${newPWData.length} PW importés mais non sauvegardés sur le serveur !`);
        }
    } catch (error) {
        console.error('[PW] Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec IW37N.');
    }
}

/**
 * Met à jour le statut d'un PW
 * @param {string} pwId - ID du PW
 * @param {string} newStatut - Nouveau statut
 * @returns {void}
 */
export function updatePWStatut(pwId, newStatut) {
    const pw = pwData.find(p => p.id === pwId);
    if (pw) {
        pw.statut = newStatut;
        savePWData().catch(err => {
            console.error('[PW] Erreur lors de la sauvegarde du statut:', err);
        });
        console.log(`[PW] Statut mis à jour pour ${pwId}: ${newStatut}`);
    }
}

/**
 * Met à jour les jours supplémentaires d'un PW
 * @param {string} pwId - ID du PW
 * @param {string} joursSupp - Jours supplémentaires
 * @returns {void}
 */
export function updatePWJoursSupp(pwId, joursSupp) {
    const pw = pwData.find(p => p.id === pwId);
    if (pw) {
        pw.joursSupp = joursSupp;
        savePWData().catch(err => {
            console.error('[PW] Erreur lors de la sauvegarde des jours supp:', err);
        });
        console.log(`[PW] Jours supp. mis à jour pour ${pwId}: ${joursSupp}`);
    }
}

/**
 * Met à jour le commentaire d'un PW
 * @param {string} pwId - ID du PW
 * @param {string} commentaire - Commentaire
 * @returns {void}
 */
export function updatePWCommentaire(pwId, commentaire) {
    const pw = pwData.find(p => p.id === pwId);
    if (pw) {
        pw.commentaire = commentaire;
        savePWData().catch(err => {
            console.error('[PW] Erreur lors de la sauvegarde du commentaire:', err);
        });
        console.log(`[PW] Commentaire mis à jour pour ${pwId}`);
    }
}

/**
 * Trie les PW par date
 * @param {string} order - Ordre de tri ('asc' ou 'desc')
 * @returns {void}
 */
export function sortPWByDate(order = 'asc') {
    pwData.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);

        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });

    savePWData().catch(err => {
        console.error('[PW] Erreur lors de la sauvegarde après tri:', err);
    });
    renderPWTable();
    console.log(`[PW] Données triées par date (${order})`);
}

/**
 * Rend le tableau des PW
 * @returns {void}
 */
export function renderPWTable() {
    const tbody = document.getElementById('pwTableBody');
    if (!tbody) {
        console.warn('[PW] Element pwTableBody non trouvé');
        return;
    }

    if (!Array.isArray(pwData) || pwData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail PW dans la liste. Cliquez sur "Synchroniser avec IW37N" pour extraire les PW.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    pwData.forEach(pw => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">${pw.ordre || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${pw.operation || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${pw.designOperation || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${pw.planEntretien || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${pw.textePlanEntretien || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${pw.interval || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${pw.uniteInterval || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${pw.secteur || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${pw.nbrSem || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${pw.date || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updatePWStatut('${pw.id}', this.value)"
                        style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                    <option value="En cours" ${pw.statut === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Complété" ${pw.statut === 'Complété' ? 'selected' : ''}>Complété</option>
                    <option value="En retard" ${pw.statut === 'En retard' ? 'selected' : ''}>En retard</option>
                    <option value="Annulé" ${pw.statut === 'Annulé' ? 'selected' : ''}>Annulé</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${pw.joursSupp || ''}"
                       onchange="updatePWJoursSupp('${pw.id}', this.value)"
                       placeholder="ex: +5"
                       style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea onchange="updatePWCommentaire('${pw.id}', this.value)"
                          style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; min-height: 40px;">${pw.commentaire || ''}</textarea>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[PW] Tableau rendu: ${pwData.length} PW`);
}

// Exposer renderPWTable globalement pour server-sync.js et page-loader.js
if (typeof window !== 'undefined') {
    window.renderPWTable = renderPWTable;
    console.log('[PW] ✅ window.renderPWTable exposée');
}

/**
 * Met à jour le compteur de PW
 * @returns {void}
 */
function updatePWCount() {
    const countElement = document.getElementById('pwCount');
    if (countElement) {
        countElement.textContent = pwData.length;
    }
}

/**
 * Exporte les données PW vers Excel
 * @returns {void}
 */
export function exportPWToExcel() {
    if (!Array.isArray(pwData) || pwData.length === 0) {
        alert('⚠️ Aucune donnée à exporter.');
        return;
    }

    try {
        const exportData = pwData.map(pw => ({
            'Ordre': pw.ordre,
            'Operation': pw.operation,
            'Design. oper.': pw.designOperation,
            'Plan d ent': pw.planEntretien || '',
            'Texte PlanEntr.': pw.textePlanEntretien || '',
            'Interval': pw.interval || '',
            'Un.interv.': pw.uniteInterval || '',
            'Secteur': pw.secteur || '',
            'Nbr sem': pw.nbrSem,
            'Date': pw.date,
            'Statut': pw.statut,
            '+? jours': pw.joursSupp,
            'Commentaire': pw.commentaire
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PW');

        const date = new Date().toISOString().split('T')[0];
        const filename = `liste-pw-${date}.xlsx`;

        XLSX.writeFile(wb, filename);

        console.log(`[PW] Export Excel réussi: ${filename}`);
        alert(`✅ Export Excel réussi: ${pwData.length} PW exportés !`);
    } catch (error) {
        console.error('[PW] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données des PW
 * @returns {Array}
 */
export function getPWData() {
    return pwData;
}

