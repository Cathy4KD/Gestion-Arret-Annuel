/**
 * @fileoverview Gestion de la Révision de la Liste des Travaux (SAP)
 * @module data/revision-travaux-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les données de révision
 * @const {string}
 */
const STORAGE_KEY = 'revisionTravauxData';

/**
 * Données de révision des travaux
 * @type {Array}
 */
let revisionData = [];

/**
 * Set revision data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setRevisionData(data) {
    revisionData = data || [];
    console.log(`[REVISION] ✅ Données injectées: ${revisionData.length} travaux`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setRevisionData = setRevisionData;
    console.log('[REVISION] ✅ window.setRevisionData exposée');
}

/**
 * Charge les données de révision
 * Les données sont injectées depuis le serveur via initSync()
 * Cette fonction rend simplement le tableau si des données existent
 * @returns {void}
 */
export async function loadRevisionListeData() {
    // Les données sont injectées par server-sync.js via setRevisionData()
    // On vérifie juste si des données existent et on rend le tableau
    if (revisionData && revisionData.length > 0) {
        console.log(`[REVISION] ✅ ${revisionData.length} travaux chargés depuis le serveur`);
        renderRevisionListeTable();
        updateRevisionCount();
    } else {
        // Fallback: essayer localStorage si le serveur n'a pas de données
        const saved = await loadFromStorage(STORAGE_KEY);
        if (saved) {
            revisionData = saved;
            console.log(`[REVISION] ${revisionData.length} travaux chargés depuis localStorage (fallback)`);
            renderRevisionListeTable();
            updateRevisionCount();
        } else {
            console.log(`[REVISION] ℹ️ Aucune donnée de révision disponible`);
        }
    }
}

/**
 * Sauvegarde les données de révision sur le serveur
 * @returns {Promise<boolean>} true si la sauvegarde a réussi
 */
async function saveRevisionData() {
    console.log('[REVISION] 💾 Sauvegarde de', revisionData.length, 'travaux sur le serveur...');

    const success = await saveToStorage(STORAGE_KEY, revisionData);

    if (success) {
        console.log('[REVISION] ✅ Données sauvegardées sur le serveur avec succès');
    } else {
        console.error('[REVISION] ❌ Échec de la sauvegarde sur le serveur');
    }

    return success;
}

/**
 * Synchronise les données avec IW37N
 * Exclut UNIQUEMENT les lignes où Désignation contient PSV, TPAA, PW ou NOTE
 * Importe TOUTES les autres lignes (sans gestion de doublons)
 * Mapping des colonnes:
 *   - Désignation → Design. Opération
 *   - Opération → Opération
 *   - Ordre → Ordre
 *   - Post.trav.opér. → Post. Trav.
 *   - Poste technique → Poste Technique
 * @returns {void}
 */
export async function syncRevisionListeFromIw37n() {
    // Récupérer les données IW37N depuis le module iw37n-data
    const { getIw37nData } = await import('./iw37n-data.js');
    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord importer les données IW37N.');
        console.error('[REVISION] Aucune donnée IW37N disponible');
        return;
    }

    console.log(`[REVISION] 📊 Données IW37N récupérées: ${iw37nData.length} lignes`);

    try {
        const parsedData = iw37nData;

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            alert('⚠️ Les données IW37N sont vides.');
            return;
        }

        // Filtrer et mapper les données IW37N
        // Exclure: PSV, TPAA, PW, NOTE (dans la colonne Désignation)
        const excludedTerms = ['PSV', 'TPAA', 'PW', 'NOTE'];

        // IMPORTANT: Vider la liste existante et recréer à partir de IW37N
        revisionData = [];

        let totalRows = 0;
        let skippedNoOrdre = 0;
        let skippedExcluded = 0;
        let imported = 0;

        parsedData.forEach(row => {
            totalRows++;

            // Mapping des colonnes IW37N vers structure Révision:
            // Désign. opér. → Design. Opération
            const designation = row['Désign. opér.'] || row['Désignation'] || row['Designation'] || row['designation'] || '';

            // Opération → Opération
            const operation = row['Opération'] || row['Operation'] || row['operation'] || '';

            // Ordre → Ordre
            const ordre = row['Ordre'] || row['ordre'] || '';

            // Post.trav.opér. → Post. Trav.
            const posteTravOper = row['Post.trav.opér.'] || row['Post.trav.oper.'] ||
                                  row['PosteTravOper'] || row['Post trav oper'] || '';

            // Poste technique → Poste Technique
            const posteTechnique = row['Poste technique'] || row['PosteTechnique'] ||
                                  row['Poste Technique'] || row['poste_technique'] || '';

            // Vérifier si ordre est vide
            if (!ordre || String(ordre).trim() === '') {
                skippedNoOrdre++;
                return;
            }

            // Vérifier si la désignation contient l'un des termes exclus
            const shouldExclude = excludedTerms.some(term =>
                designation.toUpperCase().includes(term)
            );

            if (shouldExclude) {
                skippedExcluded++;
                return;
            }

            // Importer le travail (sans vérification de doublons)
            const newWork = {
                id: 'revision-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                statut: 'Nvx Travaux', // Statut par défaut pour nouveaux travaux
                ordre: ordre,                       // Ordre → Ordre
                designOperation: designation,       // Désignation → Design. Opération
                operation: operation,               // Opération → Opération
                posteTrav: posteTravOper,           // Post.trav.opér. → Post. Trav.
                posteTechnique: posteTechnique,     // Poste technique → Poste Technique
                // Nouveaux champs éditables
                infos: '',
                commentaire: '',
                avisSynd: '',
                dapo: '',
                nacelle: '',
                echaf: '',
                grue: '',
                tacheCognibox: '',
                dateDebut: '',
                dateFin: '',
                dateDebutAvisSynd: '',
                dateFinAvisSynd: ''
            };
            revisionData.push(newWork);
            imported++;
        });

        console.log(`[REVISION] Statistiques d'import:`);
        console.log(`  - Total lignes IW37N: ${totalRows}`);
        console.log(`  - Sans Ordre: ${skippedNoOrdre}`);
        console.log(`  - Exclues (PSV/TPAA/PW/NOTE): ${skippedExcluded}`);
        console.log(`  - Importées: ${imported}`);

        // Sauvegarder sur le serveur et attendre la confirmation
        const saveSuccess = await saveRevisionData();

        renderRevisionListeTable();
        updateRevisionCount();

        if (saveSuccess) {
            alert(`✅ Liste complète importée depuis IW37N et sauvegardée sur le serveur !\n\n` +
                  `📊 Statistiques d'import:\n` +
                  `• Total lignes IW37N: ${totalRows}\n` +
                  `• Sans Ordre: ${skippedNoOrdre}\n` +
                  `• Exclues (PSV/TPAA/PW/NOTE): ${skippedExcluded}\n` +
                  `• Importées: ${imported}\n\n` +
                  `Total dans la liste de révision: ${revisionData.length} travaux\n\n` +
                  `Les données sont maintenant persistantes et resteront après un rafraîchissement.`);
            console.log(`[REVISION] ${imported} travaux importés et sauvegardés (${revisionData.length} total)`);
        } else {
            alert(`⚠️ Liste importée depuis IW37N MAIS non sauvegardée sur le serveur !\n\n` +
                  `📊 Statistiques d'import:\n` +
                  `• Total lignes IW37N: ${totalRows}\n` +
                  `• Importées: ${imported}\n\n` +
                  `⚠️ ATTENTION: Les données seront perdues au rafraîchissement.\n` +
                  `Vérifiez que le serveur est démarré.`);
            console.error(`[REVISION] ${imported} travaux importés mais non sauvegardés sur le serveur !`);
        }
    } catch (error) {
        console.error('[REVISION] Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec IW37N.');
    }
}

/**
 * Met à jour le statut d'un travail
 * @param {string} revisionId - ID du travail
 * @param {string} newStatut - Nouveau statut
 * @returns {void}
 */
export function updateRevisionStatut(revisionId, newStatut) {
    const revision = revisionData.find(r => r.id === revisionId);
    if (revision) {
        revision.statut = newStatut;
        saveRevisionData().catch(err => {
            console.error('[REVISION] Erreur lors de la sauvegarde du statut:', err);
        });
        console.log(`[REVISION] Statut mis à jour pour ${revisionId}: ${newStatut}`);
    }
}

/**
 * Met à jour un champ d'un travail
 * @param {string} revisionId - ID du travail
 * @param {string} fieldName - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateRevisionField(revisionId, fieldName, value) {
    const revision = revisionData.find(r => r.id === revisionId);
    if (revision) {
        revision[fieldName] = value;
        saveRevisionData().catch(err => {
            console.error('[REVISION] Erreur lors de la sauvegarde du champ:', err);
        });
        console.log(`[REVISION] ${fieldName} mis à jour pour ${revisionId}: ${value}`);
    }
}

/**
 * Supprime un travail de la liste
 * @param {string} revisionId - ID du travail à supprimer
 * @returns {void}
 */
export function deleteRevisionItem(revisionId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce travail de la liste ?')) {
        revisionData = revisionData.filter(r => r.id !== revisionId);
        saveRevisionData().catch(err => {
            console.error('[REVISION] Erreur lors de la sauvegarde après suppression:', err);
        });
        renderRevisionListeTable();
        updateRevisionCount();
        console.log('[REVISION] Travail supprimé:', revisionId);
    }
}

/**
 * Rend le tableau de révision
 * @returns {void}
 */
export function renderRevisionListeTable() {
    const tbody = document.getElementById('revisionListeTableBody');
    if (!tbody) {
        console.warn('[REVISION] Element revisionListeTableBody non trouvé');
        return;
    }

    if (revisionData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="19" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail en révision. Cliquez sur "Synchroniser avec IW37N" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    revisionData.forEach(revision => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="updateRevisionStatut('${revision.id}', this.value)"
                        style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                    <option value="Nvx Travaux" ${revision.statut === 'Nvx Travaux' ? 'selected' : ''}>Nvx Travaux</option>
                    <option value="Préparation" ${revision.statut === 'Préparation' ? 'selected' : ''}>Préparation</option>
                    <option value="Attente" ${revision.statut === 'Attente' ? 'selected' : ''}>Attente</option>
                    <option value="Exécution" ${revision.statut === 'Exécution' ? 'selected' : ''}>Exécution</option>
                    <option value="Terminé" ${revision.statut === 'Terminé' ? 'selected' : ''}>Terminé</option>
                    <option value="N/A" ${revision.statut === 'N/A' ? 'selected' : ''}>N/A</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${revision.operation || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${revision.designOperation || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${revision.posteTrav || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${revision.ordre || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${revision.posteTechnique || ''}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${revision.infos || ''}"
                       onchange="updateRevisionField('${revision.id}', 'infos', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea onchange="updateRevisionField('${revision.id}', 'commentaire', this.value)"
                          style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px; resize: vertical; min-height: 60px;">${revision.commentaire || ''}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateRevisionField('${revision.id}', 'avisSynd', this.value)"
                        style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                    <option value="">-</option>
                    <option value="Oui" ${revision.avisSynd === 'Oui' ? 'selected' : ''}>Oui</option>
                    <option value="Non" ${revision.avisSynd === 'Non' ? 'selected' : ''}>Non</option>
                    <option value="En cours" ${revision.avisSynd === 'En cours' ? 'selected' : ''}>En cours</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateRevisionField('${revision.id}', 'dapo', this.value)"
                        style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                    <option value="">-</option>
                    <option value="Oui" ${revision.dapo === 'Oui' ? 'selected' : ''}>Oui</option>
                    <option value="Non" ${revision.dapo === 'Non' ? 'selected' : ''}>Non</option>
                    <option value="En cours" ${revision.dapo === 'En cours' ? 'selected' : ''}>En cours</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateRevisionField('${revision.id}', 'nacelle', this.value)"
                        style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                    <option value="">-</option>
                    <option value="Oui" ${revision.nacelle === 'Oui' ? 'selected' : ''}>Oui</option>
                    <option value="Non" ${revision.nacelle === 'Non' ? 'selected' : ''}>Non</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateRevisionField('${revision.id}', 'echaf', this.value)"
                        style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                    <option value="">-</option>
                    <option value="Oui" ${revision.echaf === 'Oui' ? 'selected' : ''}>Oui</option>
                    <option value="Non" ${revision.echaf === 'Non' ? 'selected' : ''}>Non</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateRevisionField('${revision.id}', 'grue', this.value)"
                        style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                    <option value="">-</option>
                    <option value="Oui" ${revision.grue === 'Oui' ? 'selected' : ''}>Oui</option>
                    <option value="Non" ${revision.grue === 'Non' ? 'selected' : ''}>Non</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${revision.tacheCognibox || ''}"
                       onchange="updateRevisionField('${revision.id}', 'tacheCognibox', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${revision.dateDebut || ''}"
                       onchange="updateRevisionField('${revision.id}', 'dateDebut', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${revision.dateFin || ''}"
                       onchange="updateRevisionField('${revision.id}', 'dateFin', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${revision.dateDebutAvisSynd || ''}"
                       onchange="updateRevisionField('${revision.id}', 'dateDebutAvisSynd', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${revision.dateFinAvisSynd || ''}"
                       onchange="updateRevisionField('${revision.id}', 'dateFinAvisSynd', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="deleteRevisionItem('${revision.id}')"
                        style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Supprimer
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[REVISION] Tableau rendu: ${revisionData.length} travaux`);
}

// Exposer renderRevisionListeTable globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.renderRevisionListeTable = renderRevisionListeTable;
    console.log('[REVISION] ✅ window.renderRevisionListeTable exposée');
}

/**
 * Met à jour le compteur de travaux
 * @returns {void}
 */
function updateRevisionCount() {
    const countElement = document.getElementById('revisionListeCount');
    if (countElement) {
        countElement.textContent = revisionData.length;
    }
}

/**
 * Exporte les données vers Excel
 * @returns {void}
 */
export function exportRevisionListeToExcel() {
    if (revisionData.length === 0) {
        alert('⚠️ Aucune donnée à exporter.');
        return;
    }

    try {
        // Préparer les données pour l'export
        const exportData = revisionData.map(revision => ({
            'Statut': revision.statut,
            'Opération': revision.operation,
            'Désign. opér.': revision.designOperation,
            'Post.trav.opér.': revision.posteTrav,
            'Ordre': revision.ordre,
            'Poste Technique': revision.posteTechnique,
            'Infos': revision.infos || '',
            'Commentaire': revision.commentaire || '',
            'Avis Synd.': revision.avisSynd || '',
            'DA-PO': revision.dapo || '',
            'Nacelle': revision.nacelle || '',
            'Echaf.': revision.echaf || '',
            'Grue': revision.grue || '',
            'Tache Cognibox': revision.tacheCognibox || '',
            'Date de début': revision.dateDebut || '',
            'Date de fin': revision.dateFin || '',
            'Date début Avis synd.': revision.dateDebutAvisSynd || '',
            'Date fin Avis synd.': revision.dateFinAvisSynd || ''
        }));

        // Créer le workbook et la feuille
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Révision Travaux');

        // Générer le nom de fichier avec la date
        const date = new Date().toISOString().split('T')[0];
        const filename = `revision-liste-travaux-${date}.xlsx`;

        // Télécharger le fichier
        XLSX.writeFile(wb, filename);

        console.log(`[REVISION] Export Excel réussi: ${filename}`);
        alert(`✅ Export Excel réussi: ${revisionData.length} travaux exportés !`);
    } catch (error) {
        console.error('[REVISION] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données de révision
 * @returns {Array}
 */
export function getRevisionData() {
    return revisionData;
}

/**
 * Supprime toutes les données de révision
 * @returns {void}
 */
export function clearAllRevisionData() {
    if (confirm('⚠️ ATTENTION: Êtes-vous sûr de vouloir supprimer TOUTE la liste de révision ?\n\nCette action est irréversible et supprimera tous les travaux enregistrés.')) {
        if (confirm('🚨 CONFIRMATION FINALE: Cliquez sur OK pour confirmer la suppression complète de la liste.')) {
            revisionData = [];
            saveRevisionData().catch(err => {
                console.error('[REVISION] Erreur lors de la sauvegarde après suppression complète:', err);
            });
            renderRevisionListeTable();
            updateRevisionCount();
            console.log('[REVISION] Toute la liste a été supprimée');
            alert('✅ Liste de révision complètement supprimée.');
        } else {
            console.log('[REVISION] Suppression annulée par l\'utilisateur (2e confirmation)');
        }
    } else {
        console.log('[REVISION] Suppression annulée par l\'utilisateur (1re confirmation)');
    }
}

