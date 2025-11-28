/**
 * @fileoverview Gestion de la priorisation des demandes générées (T33)
 * @module data/t33-priorisation-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage pour les données T33
 * @const {string}
 */
const STORAGE_KEY = 't33PriorisationData';

/**
 * Données de priorisation T33
 * @type {Array}
 */
let t33Data = [];

/**
 * Charge les données T33 depuis localStorage
 * @returns {Promise<void>}
 */
export async function loadT33Data() {
    console.log('[T33] 🔄 Chargement des données T33...');

    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved && Array.isArray(saved)) {
        t33Data = saved;
        console.log(`[T33] ✅ ${t33Data.length} demandes chargées depuis localStorage`);
    } else {
        console.log('[T33] ⚠️ Aucune donnée sauvegardée trouvée');
        t33Data = [];
    }

    // Toujours afficher le tableau (vide ou avec données)
    renderT33Table();
    console.log('[T33] ✅ Module T33 initialisé');
}

/**
 * Sauvegarde les données T33
 * @returns {Promise<void>}
 */
async function saveT33Data() {
    await saveToStorage(STORAGE_KEY, t33Data);
    console.log('[T33] Données sauvegardées et synchronisées');
}

/**
 * Synchronise depuis le tableau AVIS (seulement les lignes où Ordre est vide)
 * @returns {Promise<void>}
 */
export async function syncFromAvis() {
    // Récupérer les données AVIS depuis localStorage
    const avisStorageData = await loadFromStorage('avisData');

    console.log('[T33] Données brutes chargées:', avisStorageData);

    // Gérer les deux formats possibles: { avis: [...] } ou directement [...]
    let avisData = null;
    if (avisStorageData) {
        if (Array.isArray(avisStorageData)) {
            avisData = avisStorageData;
        } else if (avisStorageData.avis && Array.isArray(avisStorageData.avis)) {
            avisData = avisStorageData.avis;
        }
    }

    if (!avisData || !Array.isArray(avisData) || avisData.length === 0) {
        alert('⚠️ Aucune donnée AVIS trouvée. Veuillez d\'abord charger les données AVIS.\n\nAllez dans "AVIS" et importez vos données.');
        console.warn('[T33] Aucune donnée AVIS disponible');
        return;
    }

    try {
        console.log('[T33] Données AVIS chargées:', avisData.length, 'lignes');

        // Filtrer les avis où la colonne "Ordre" est vide
        const filtered = avisData.filter(row => {
            const ordre = row['Ordre'] || row['ordre'] || '';
            // Considérer comme vide: '', null, undefined, ou seulement des espaces
            const isEmpty = !ordre || ordre.toString().trim() === '';

            if (isEmpty) {
                console.log('[T33] Avis avec Ordre vide trouvé:', row['Avis'] || row['avis']);
            }

            return isEmpty;
        });

        console.log(`[T33] ${filtered.length} avis trouvés avec Ordre vide sur ${avisData.length} avis totaux`);

        if (filtered.length === 0) {
            alert(`⚠️ Aucun avis trouvé avec la colonne Ordre vide.\n\nTotal d'avis: ${avisData.length}\nAvis avec Ordre vide: 0\n\nTous les avis ont déjà un ordre assigné.`);
            return;
        }

        // Créer les données pour le tableau
        // Garder les données existantes pour préserver les statuts et commentaires saisis
        const existingData = new Map(t33Data.map(item => [item.avis, item]));

        t33Data = filtered.map(row => {
            const avisNum = row['Avis'] || row['avis'] || '';
            const existing = existingData.get(avisNum);

            // Si déjà existant, garder le statut et commentaire
            if (existing) {
                return {
                    ...existing,
                    // Mettre à jour les données de base depuis AVIS
                    ordre: row['Ordre'] || row['ordre'] || '',
                    creeLe: row['Créé le'] || row['creeLe'] || '',
                    avis: avisNum,
                    posteTechnique: row['Poste technique'] || row['posteTechnique'] || '',
                    description: row['Description'] || row['description'] || '',
                    creePar: row['Créé par'] || row['creePar'] || ''
                };
            }

            // Sinon créer une nouvelle ligne
            return {
                id: `t33-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ordre: row['Ordre'] || row['ordre'] || '',
                creeLe: row['Créé le'] || row['creeLe'] || '',
                avis: avisNum,
                posteTechnique: row['Poste technique'] || row['posteTechnique'] || '',
                description: row['Description'] || row['description'] || '',
                creePar: row['Créé par'] || row['creePar'] || '',
                statut: '',
                commentaire: ''
            };
        });

        saveT33Data();
        renderT33Table();

        alert(`✅ ${t33Data.length} demande(s) synchronisée(s) depuis AVIS\n\n(Avis avec colonne Ordre vide)`);
    } catch (error) {
        console.error('[T33] Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec AVIS');
    }
}

/**
 * Met à jour un champ d'une ligne
 * @param {number} index - Index de la ligne
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
function updateT33Field(index, field, value) {
    if (t33Data[index]) {
        t33Data[index][field] = value;
        saveT33Data();
    }
}

// Exposer globalement pour les événements onclick
if (typeof window !== 'undefined') {
    window.updateT33Field = updateT33Field;
}

/**
 * Rend le tableau de priorisation
 * @returns {void}
 */
export function renderT33Table() {
    const tbody = document.getElementById('t33TableBody');
    const countSpan = document.getElementById('t33Count');

    console.log('[T33] 🎨 renderT33Table appelé, t33Data.length =', t33Data.length);

    if (!tbody) {
        console.warn('[T33] ❌ Element t33TableBody non trouvé');
        return;
    }

    if (!Array.isArray(t33Data) || t33Data.length === 0) {
        console.log('[T33] ⚠️ Aucune donnée à afficher');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucune demande. Cliquez sur "Synchroniser depuis AVIS" pour charger les avis avec Ordre vide.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    console.log('[T33] ✅ Affichage de', t33Data.length, 'demandes');

    tbody.innerHTML = '';
    t33Data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.ordre || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.creeLe || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; color: #667eea;">
                ${item.avis || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.posteTechnique || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.description || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.creePar || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="window.updateT33Field(${index}, 'statut', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="" ${item.statut === '' ? 'selected' : ''}>--</option>
                    <option value="En cours" ${item.statut === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Accepté" ${item.statut === 'Accepté' ? 'selected' : ''}>✅ Accepté</option>
                    <option value="Refusé" ${item.statut === 'Refusé' ? 'selected' : ''}>❌ Refusé</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.updateT33Field(${index}, 'commentaire', this.value)"
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; resize: vertical;">${item.commentaire || ''}</textarea>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour le compteur
    if (countSpan) {
        countSpan.textContent = t33Data.length;
    }

    console.log(`[T33] Tableau rendu: ${t33Data.length} demandes`);
}

/**
 * Exporte les données vers Excel
 * @returns {void}
 */
export function exportToExcel() {
    if (!Array.isArray(t33Data) || t33Data.length === 0) {
        alert('⚠️ Aucune demande à exporter.');
        return;
    }

    try {
        const exportData = t33Data.map(item => ({
            'Ordre': item.ordre || '',
            'Créé le': item.creeLe || '',
            'Avis': item.avis || '',
            'Poste technique': item.posteTechnique || '',
            'Description': item.description || '',
            'Créé par': item.creePar || '',
            'Statut': item.statut || '',
            'Commentaire': item.commentaire || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Priorisation T33');

        // Ajuster automatiquement la largeur des colonnes
        ws['!cols'] = autoSizeColumns(ws, exportData);

        const fileName = `T33_Priorisation_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[T33] Export Excel réussi:', fileName);
    } catch (error) {
        console.error('[T33] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données T33
 * @returns {Array}
 */
export function getT33Data() {
    return t33Data;
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.t33Actions = {
        syncFromAvis,
        exportToExcel,
        loadT33Data,
        renderT33Table
    };
}

console.log('[T33] Module chargé');
