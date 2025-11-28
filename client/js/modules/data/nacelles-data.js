/**
 * @fileoverview Gestion des demandes standard de nacelles
 * @module data/nacelles-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage pour les demandes de nacelles
 * @const {string}
 */
const STORAGE_KEY = 'nacellesData';

/**
 * Données des demandes de nacelles
 * @type {Array}
 */
let nacellesData = [];

/**
 * Charge les données des nacelles depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadNacellesData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        nacellesData = saved;
        console.log(`[NACELLES] ${nacellesData.length} demande(s) chargée(s) depuis le serveur`);
    } else {
        console.log('[NACELLES] Aucune donnée sauvegardée trouvée');
    }

    // Ne rendre le tableau que si l'élément existe dans le DOM (page déjà affichée)
    const tbody = document.getElementById('nacellesTableBody');
    if (tbody) {
        console.log('[NACELLES] Tableau trouvé dans le DOM, rendu...');
        renderNacellesTable();
    } else {
        console.log('[NACELLES] Tableau non trouvé (page non affichée), rendu différé');
    }
}

/**
 * Sauvegarde les données sur le SERVEUR uniquement (AUCUN localStorage)
 * @returns {Promise<boolean>}
 */
async function saveNacellesData() {
    const success = await saveToStorage(STORAGE_KEY, nacellesData);
    if (success) {
        console.log('[NACELLES] ✅ Données sauvegardées sur le serveur');
    } else {
        console.error('[NACELLES] ❌ Échec de la sauvegarde sur le serveur');
    }
    return success;
}

/**
 * Ajoute une nouvelle demande de nacelle (ligne vide)
 * @returns {Promise<void>}
 */
export async function addNacelle() {
    console.log('[NACELLES] ➕ Fonction addNacelle() appelée');

    // Créer une nouvelle ligne vide avec des valeurs par défaut
    const today = new Date().toISOString().split('T')[0];

    const nouvelleNacelle = {
        id: `nacelle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        equipement: '',
        quantite: 1,
        dateDebut: today,
        dateFin: today,
        justification: '',
        descriptionTravail: ''
    };

    nacellesData.push(nouvelleNacelle);
    await saveNacellesData();
    renderNacellesTable();

    console.log('[NACELLES] Nouvelle ligne ajoutée au tableau');
}

/**
 * Met à jour un champ d'une demande de nacelle
 * @param {string} nacelleId - ID de la nacelle
 * @param {string} field - Champ à mettre à jour
 * @param {string} value - Nouvelle valeur
 * @returns {Promise<void>}
 */
async function updateNacelle(nacelleId, field, value) {
    const nacelle = nacellesData.find(n => n.id === nacelleId);
    if (nacelle) {
        nacelle[field] = value;
        await saveNacellesData();
        console.log(`[NACELLES] Champ ${field} mis à jour pour nacelle ${nacelleId}`);
    }
}

/**
 * Supprime une demande de nacelle
 * @param {string} nacelleId - ID de la nacelle
 * @returns {Promise<void>}
 */
async function deleteNacelle(nacelleId) {
    const nacelle = nacellesData.find(n => n.id === nacelleId);
    if (!nacelle) return;

    if (!confirm(`Voulez-vous vraiment supprimer la demande "${nacelle.equipement}" ?`)) {
        return;
    }

    nacellesData = nacellesData.filter(n => n.id !== nacelleId);
    await saveNacellesData();
    renderNacellesTable();

    console.log('[NACELLES] Demande supprimée:', nacelle.equipement);
}

/**
 * Rend le tableau des demandes de nacelles
 * @returns {void}
 */
export function renderNacellesTable() {
    const tbody = document.getElementById('nacellesTableBody');
    const countSpan = document.getElementById('nacellesCount');

    if (!tbody) {
        console.warn('[NACELLES] Element nacellesTableBody non trouvé');
        return;
    }

    // Calculer les statistiques
    const totalCount = nacellesData.length;
    const totalQuantite = nacellesData.reduce((sum, n) => sum + (n.quantite || 0), 0);

    if (countSpan) countSpan.textContent = `${totalCount} (${totalQuantite} unités)`;

    if (nacellesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucune demande de nacelle enregistrée. Cliquez sur "➕ Ajouter Nacelle".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    nacellesData.forEach((nacelle, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        row.innerHTML = `
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${nacelle.equipement || ''}"
                       onchange="window.nacellesActions.updateNacelle('${nacelle.id}', 'equipement', this.value)"
                       style="width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <input type="number" value="${nacelle.quantite || 1}" min="1"
                       onchange="window.nacellesActions.updateNacelle('${nacelle.id}', 'quantite', this.value)"
                       style="width: 60px; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 0.95em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${nacelle.dateDebut || ''}"
                       onchange="window.nacellesActions.updateNacelle('${nacelle.id}', 'dateDebut', this.value)"
                       style="width: 130px; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${nacelle.dateFin || ''}"
                       onchange="window.nacellesActions.updateNacelle('${nacelle.id}', 'dateFin', this.value)"
                       style="width: 130px; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <textarea onchange="window.nacellesActions.updateNacelle('${nacelle.id}', 'justification', this.value)"
                          class="auto-resize"
                          placeholder="Justification..."
                          style="width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; resize: none; line-height: 1.4; font-size: 0.95em; overflow: hidden;">${nacelle.justification || ''}</textarea>
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <textarea onchange="window.nacellesActions.updateNacelle('${nacelle.id}', 'descriptionTravail', this.value)"
                          class="auto-resize"
                          placeholder="Description du travail..."
                          style="width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; resize: none; line-height: 1.4; font-size: 0.95em; overflow: hidden;">${nacelle.descriptionTravail || ''}</textarea>
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.nacellesActions.deleteNacelle('${nacelle.id}')"
                        style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Initialiser l'auto-resize pour toutes les textareas
    setTimeout(() => {
        document.querySelectorAll('#nacellesTableBody textarea.auto-resize').forEach(textarea => {
            if (window.initTextareaAutoResize) {
                window.initTextareaAutoResize(textarea);
            }
        });
    }, 100);

    console.log(`[NACELLES] Tableau rendu: ${nacellesData.length} demande(s) affichée(s)`);
}

/**
 * Exporte les demandes de nacelles vers Excel
 */
export function exportNacellesToExcel() {
    console.log('[NACELLES] 📥 Fonction exportNacellesToExcel() appelée');
    if (nacellesData.length === 0) {
        alert('⚠️ Aucune demande de nacelle à exporter.');
        return;
    }

    try {
        const exportData = nacellesData.map(nacelle => ({
            'Équipement mobile léger': nacelle.equipement,
            'Quantité': nacelle.quantite,
            'Date de début': nacelle.dateDebut,
            'Date de fin': nacelle.dateFin,
            'Justification': nacelle.justification || '',
            'Description du travail': nacelle.descriptionTravail || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Nacelles');

        // Auto-ajuster les colonnes
        autoSizeColumns(ws, exportData);

        const fileName = `Nacelles_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[NACELLES] Export Excel réussi');
    } catch (error) {
        console.error('[NACELLES] Erreur export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

// Exposer les fonctions globalement
console.log('[NACELLES] 📤 Exposition des fonctions globales...');
if (typeof window !== 'undefined') {
    // Fonctions internes pour les actions du tableau
    window.nacellesActions = {
        updateNacelle,
        deleteNacelle
    };

    // Fonctions wrapper pour les boutons HTML
    window.addNacelle = async function() {
        console.log('[NACELLES] Wrapper addNacelle() appelé');
        try {
            await addNacelle();
        } catch (error) {
            console.error('[NACELLES] Erreur:', error);
            alert('❌ Erreur lors de l\'ajout de nacelle.');
        }
    };

    window.exportNacellesToExcel = function() {
        console.log('[NACELLES] Wrapper exportNacellesToExcel() appelé');
        try {
            exportNacellesToExcel();
        } catch (error) {
            console.error('[NACELLES] Erreur:', error);
            alert('❌ Erreur lors de l\'export Excel.');
        }
    };

    console.log('[NACELLES] ✅ Module chargé - Fonctions wrapper globales créées:');
    console.log('[NACELLES]   - window.addNacelle:', typeof window.addNacelle);
    console.log('[NACELLES]   - window.exportNacellesToExcel:', typeof window.exportNacellesToExcel);
    console.log('[NACELLES]   - window.nacellesActions:', typeof window.nacellesActions);
}
