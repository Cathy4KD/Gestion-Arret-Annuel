/**
 * @fileoverview Gestion des équipements de travail en hauteur
 * @module data/travail-hauteur-data
 *
 * @description
 * Gère les besoins en équipements de travail en hauteur depuis IW37N
 * Filtre: Désign.Opér. contient "NAC" ET Post.Trav.Opér contient "BOOMTRK"
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage pour les équipements de travail en hauteur
 * @const {string}
 */
const STORAGE_KEY = 'travailHauteurData';

/**
 * Données des équipements de travail en hauteur
 * @type {Array}
 */
let travailHauteurData = [];

/**
 * Charge les données des équipements de travail en hauteur depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadTravailHauteurData() {
    console.log('[TRAVAIL-HAUTEUR] 🔄 loadTravailHauteurData() appelée, clé:', STORAGE_KEY);

    const saved = await loadFromStorage(STORAGE_KEY);

    console.log('[TRAVAIL-HAUTEUR] 📦 Données reçues du serveur:', saved ? 'OUI' : 'NON');
    console.log('[TRAVAIL-HAUTEUR] 📊 Type des données:', typeof saved);
    console.log('[TRAVAIL-HAUTEUR] 📊 Contenu:', saved);

    if (saved) {
        travailHauteurData = saved;
        console.log(`[TRAVAIL-HAUTEUR] ✅ ${travailHauteurData.length} équipement(s) chargé(s) depuis le serveur`);
    } else {
        console.log('[TRAVAIL-HAUTEUR] ⚠️ Aucune donnée sauvegardée trouvée sur le serveur');
        travailHauteurData = [];
    }

    // Ne rendre le tableau que si l'élément existe dans le DOM (page déjà affichée)
    const tbody = document.getElementById('travailHauteurTableBody');
    if (tbody) {
        console.log('[TRAVAIL-HAUTEUR] ✅ Tableau trouvé dans le DOM, rendu...');
        renderTravailHauteurTable();
    } else {
        console.log('[TRAVAIL-HAUTEUR] ⚠️ Tableau non trouvé (page non affichée), rendu différé');
    }
}

/**
 * Sauvegarde les données sur le SERVEUR uniquement (AUCUN localStorage)
 * @returns {Promise<boolean>}
 */
async function saveTravailHauteurData() {
    console.log('[TRAVAIL-HAUTEUR] 💾 Tentative de sauvegarde, clé:', STORAGE_KEY);
    console.log('[TRAVAIL-HAUTEUR] 📊 Nombre d\'équipements à sauvegarder:', travailHauteurData.length);
    console.log('[TRAVAIL-HAUTEUR] 📊 Données à sauvegarder:', travailHauteurData);

    const success = await saveToStorage(STORAGE_KEY, travailHauteurData);

    if (success) {
        console.log('[TRAVAIL-HAUTEUR] ✅ Données sauvegardées sur le serveur avec succès');
    } else {
        console.error('[TRAVAIL-HAUTEUR] ❌ ÉCHEC de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Synchronise les équipements depuis IW37N
 * Filtre les travaux avec:
 * - Désign.Opér. contient "NAC" OU
 * - Post.Trav.Opér contient "BOOMTRK" ou "BOOMTCK"
 * @returns {void}
 */
export async function syncTravailHauteurFromIw37n() {
    console.log('[TRAVAIL-HAUTEUR] 🔄 Fonction syncTravailHauteurFromIw37n() appelée');

    // Import dynamique pour éviter les problèmes de dépendances
    let iw37nData;
    try {
        const iw37nModule = await import('./iw37n-data.js');
        iw37nData = iw37nModule.getIw37nData();
    } catch (error) {
        console.error('[TRAVAIL-HAUTEUR] Erreur lors du chargement du module IW37N:', error);
        alert('❌ Erreur lors du chargement des données IW37N.');
        return;
    }

    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord charger les données IW37N.');
        console.warn('[TRAVAIL-HAUTEUR] Aucune donnée IW37N disponible');
        return;
    }

    try {
        console.log('[TRAVAIL-HAUTEUR] Synchronisation depuis IW37N...');
        console.log('[TRAVAIL-HAUTEUR] Total lignes IW37N:', iw37nData.length);

        // Détection automatique des noms de colonnes
        const columnNames = iw37nData.length > 0 ? Object.keys(iw37nData[0]) : [];

        // Trouver la colonne "Désign. opér." (peut avoir différentes variantes)
        const designColumn = columnNames.find(col => {
            const lower = col.toLowerCase();
            return lower.includes('désign') && lower.includes('opér');
        });

        // Trouver la colonne "Post.trav.opér." (peut avoir différentes variantes)
        const posteTravColumn = columnNames.find(col => {
            const lower = col.toLowerCase();
            return lower.includes('post') && lower.includes('trav') && lower.includes('opér');
        });

        console.log('[TRAVAIL-HAUTEUR] Colonne Désign.Opér. détectée:', designColumn);
        console.log('[TRAVAIL-HAUTEUR] Colonne Post.Trav.Opér. détectée:', posteTravColumn);

        if (!designColumn || !posteTravColumn) {
            alert(`❌ Colonnes non trouvées!\n\nDésign.Opér.: ${designColumn || 'NON TROUVÉE'}\nPost.Trav.Opér.: ${posteTravColumn || 'NON TROUVÉE'}\n\nVérifiez la console pour plus de détails.`);
            return;
        }

        // Filtrer les travaux avec Désign.Opér. contient "NAC" OU Post.Trav.Opér contient "BOOMTRK" ou "BOOMTCK"
        const filtered = iw37nData.filter(row => {
            const designOper = (row[designColumn] || '').toString().trim().toUpperCase();
            const posteTravOper = (row[posteTravColumn] || '').toString().trim().toUpperCase();

            const hasNAC = designOper.includes('NAC');
            const hasBOOMTRK = posteTravOper.includes('BOOMTRK') || posteTravOper.includes('BOOMTCK');

            // Retourner true si au moins un des critères est rempli (OU logique)
            return hasNAC || hasBOOMTRK;
        });

        console.log(`[TRAVAIL-HAUTEUR] ${filtered.length} équipements trouvés (NAC OU BOOMTRK/BOOMTCK)`);

        if (filtered.length === 0) {
            // Compter combien de lignes ont NAC seul et BOOM* seul pour aider au débogage
            const withNAC = iw37nData.filter(row => {
                const designOper = (row[designColumn] || '').toString().trim().toUpperCase();
                return designOper.includes('NAC');
            }).length;

            const withBOOM = iw37nData.filter(row => {
                const posteTravOper = (row[posteTravColumn] || '').toString().trim().toUpperCase();
                return posteTravOper.includes('BOOM');
            }).length;

            alert(
                `⚠️ Aucun équipement trouvé avec les critères:\n\n` +
                `• Désign.Opér. contenant "NAC": ${withNAC} ligne(s)\n` +
                `• Post.Trav.Opér contenant "BOOM*": ${withBOOM} ligne(s)\n\n` +
                `Vérifiez la console (F12) pour voir les détails de chaque ligne.`
            );
            return;
        }

        // Demander confirmation avant d'écraser les données existantes
        if (travailHauteurData.length > 0) {
            const confirm = window.confirm(
                `Vous avez déjà ${travailHauteurData.length} équipement(s) enregistré(s).\n\n` +
                `Cette synchronisation va ajouter ${filtered.length} nouveaux équipements depuis IW37N.\n\n` +
                `Continuer?`
            );
            if (!confirm) {
                return;
            }
        }

        // Trouver les colonnes nécessaires
        const ordreColumn = columnNames.find(col => col.toLowerCase() === 'ordre') || 'Ordre';
        const posteTechniqueColumn = columnNames.find(col => {
            const lower = col.toLowerCase();
            return lower.includes('poste') && lower.includes('technique');
        }) || 'Poste technique';

        // Mapper les données pour le tableau
        const newEquipements = filtered.map(row => {
            const ordre = row[ordreColumn] || '';
            const designOper = row[designColumn] || '';
            const posteTechnique = row[posteTechniqueColumn] || '';

            return {
                id: `th-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ordre: ordre,
                designOper: designOper,
                posteTechnique: posteTechnique,
                commentaire: ''
            };
        });

        // Ajouter aux données existantes (pas écraser)
        travailHauteurData = [...travailHauteurData, ...newEquipements];

        console.log('[TRAVAIL-HAUTEUR] 📊 Total après ajout:', travailHauteurData.length, 'équipement(s)');

        const saveSuccess = await saveTravailHauteurData();

        if (saveSuccess) {
            console.log('[TRAVAIL-HAUTEUR] ✅ Synchronisation et sauvegarde réussies');
        } else {
            console.error('[TRAVAIL-HAUTEUR] ❌ La sauvegarde a échoué !');
            alert('⚠️ Attention: Les données ont été synchronisées mais la sauvegarde sur le serveur a échoué. Vérifiez que le serveur est lancé.');
        }

        renderTravailHauteurTable();

        alert(`✅ ${newEquipements.length} équipement(s) synchronisé(s) depuis IW37N`);
    } catch (error) {
        console.error('[TRAVAIL-HAUTEUR] Erreur synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec IW37N');
    }
}

/**
 * Ajoute manuellement un équipement
 * @returns {Promise<void>}
 */
export async function addTravailHauteur() {
    console.log('[TRAVAIL-HAUTEUR] ➕ Fonction addTravailHauteur() appelée');
    const ordre = prompt('Numéro d\'ordre:');
    if (!ordre) return;

    const designOper = prompt('Désignation opération:') || '';
    const posteTechnique = prompt('Poste technique:') || '';

    const newEquipement = {
        id: `th-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ordre: ordre,
        designOper: designOper,
        posteTechnique: posteTechnique,
        commentaire: ''
    };

    travailHauteurData.push(newEquipement);
    await saveTravailHauteurData();
    renderTravailHauteurTable();

    console.log('[TRAVAIL-HAUTEUR] Équipement ajouté:', ordre);
}

/**
 * Met à jour le commentaire d'un équipement
 * @param {string} equipementId - ID de l'équipement
 * @param {string} value - Nouveau commentaire
 * @returns {Promise<void>}
 */
async function updateCommentaire(equipementId, value) {
    const equipement = travailHauteurData.find(e => e.id === equipementId);
    if (equipement) {
        equipement.commentaire = value;
        await saveTravailHauteurData();
    }
}

/**
 * Supprime un équipement
 * @param {string} equipementId - ID de l'équipement
 * @returns {Promise<void>}
 */
async function deleteEquipement(equipementId) {
    const equipement = travailHauteurData.find(e => e.id === equipementId);
    if (!equipement) return;

    if (!confirm(`Voulez-vous vraiment supprimer l'équipement "${equipement.ordre}" ?`)) {
        return;
    }

    travailHauteurData = travailHauteurData.filter(e => e.id !== equipementId);
    await saveTravailHauteurData();
    renderTravailHauteurTable();

    console.log('[TRAVAIL-HAUTEUR] Équipement supprimé:', equipement.ordre);
}

/**
 * Rend le tableau des équipements
 * @returns {void}
 */
export function renderTravailHauteurTable() {
    const tbody = document.getElementById('travailHauteurTableBody');
    const countSpan = document.getElementById('travailHauteurCount');

    if (!tbody) {
        console.warn('[TRAVAIL-HAUTEUR] Element travailHauteurTableBody non trouvé');
        return;
    }

    // Calculer les statistiques
    const totalCount = travailHauteurData.length;

    if (countSpan) countSpan.textContent = totalCount;

    if (travailHauteurData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucun équipement de travail en hauteur enregistré. Cliquez sur "Synchroniser avec IW37N" ou "Ajouter Équipement".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    travailHauteurData.forEach((equipement, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        row.innerHTML = `
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-weight: 600;">
                ${equipement.ordre || '-'}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                ${equipement.designOper || '-'}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                ${equipement.posteTechnique || '-'}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <div style="display: flex; gap: 5px; align-items: flex-start;">
                    <textarea onchange="window.travailHauteurActions.updateCommentaire('${equipement.id}', this.value)"
                              class="auto-resize"
                              style="flex: 1; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; resize: none; line-height: 1.4; font-size: 0.95em; overflow: hidden;">${equipement.commentaire || ''}</textarea>
                    <button onclick="window.travailHauteurActions.deleteEquipement('${equipement.id}')"
                            style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap;">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Initialiser l'auto-resize pour toutes les textareas
    setTimeout(() => {
        document.querySelectorAll('#travailHauteurTableBody textarea.auto-resize').forEach(textarea => {
            if (window.initTextareaAutoResize) {
                window.initTextareaAutoResize(textarea);
            }
        });
    }, 100);

    console.log(`[TRAVAIL-HAUTEUR] Tableau rendu: ${travailHauteurData.length} équipements affichés`);
}

/**
 * Exporte les équipements vers Excel
 */
export function exportTravailHauteurToExcel() {
    console.log('[TRAVAIL-HAUTEUR] 📥 Fonction exportTravailHauteurToExcel() appelée');
    if (travailHauteurData.length === 0) {
        alert('⚠️ Aucun équipement à exporter.');
        return;
    }

    try {
        const exportData = travailHauteurData.map(eq => ({
            'Ordre': eq.ordre,
            'Désign. Opér.': eq.designOper,
            'Poste technique': eq.posteTechnique || '',
            'Commentaire': eq.commentaire || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Travail en Hauteur');

        ws['!cols'] = autoSizeColumns(ws, exportData);

        const fileName = `Equipements_Travail_Hauteur_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[TRAVAIL-HAUTEUR] Export Excel réussi');
    } catch (error) {
        console.error('[TRAVAIL-HAUTEUR] Erreur export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

// Exposer les fonctions globalement
console.log('[TRAVAIL-HAUTEUR] 📤 Exposition des fonctions globales...');
if (typeof window !== 'undefined') {
    // Fonctions internes pour les actions du tableau
    window.travailHauteurActions = {
        updateCommentaire,
        deleteEquipement
    };

    // Fonctions wrapper pour les boutons HTML (pour éviter les problèmes de chargement asynchrone)
    window.syncTravailHauteurFromIw37n = async function() {
        console.log('[TRAVAIL-HAUTEUR] Wrapper syncTravailHauteurFromIw37n() appelé');
        try {
            await syncTravailHauteurFromIw37n();
        } catch (error) {
            console.error('[TRAVAIL-HAUTEUR] Erreur:', error);
            alert('❌ Erreur lors de la synchronisation.');
        }
    };

    window.addTravailHauteur = async function() {
        console.log('[TRAVAIL-HAUTEUR] Wrapper addTravailHauteur() appelé');
        try {
            await addTravailHauteur();
        } catch (error) {
            console.error('[TRAVAIL-HAUTEUR] Erreur:', error);
            alert('❌ Erreur lors de l\'ajout d\'équipement.');
        }
    };

    window.exportTravailHauteurToExcel = function() {
        console.log('[TRAVAIL-HAUTEUR] Wrapper exportTravailHauteurToExcel() appelé');
        try {
            exportTravailHauteurToExcel();
        } catch (error) {
            console.error('[TRAVAIL-HAUTEUR] Erreur:', error);
            alert('❌ Erreur lors de l\'export Excel.');
        }
    };

    console.log('[TRAVAIL-HAUTEUR] ✅ Module chargé - Fonctions wrapper globales créées:');
    console.log('[TRAVAIL-HAUTEUR]   - window.syncTravailHauteurFromIw37n:', typeof window.syncTravailHauteurFromIw37n);
    console.log('[TRAVAIL-HAUTEUR]   - window.addTravailHauteur:', typeof window.addTravailHauteur);
    console.log('[TRAVAIL-HAUTEUR]   - window.exportTravailHauteurToExcel:', typeof window.exportTravailHauteurToExcel);
    console.log('[TRAVAIL-HAUTEUR]   - window.travailHauteurActions:', typeof window.travailHauteurActions);
}
