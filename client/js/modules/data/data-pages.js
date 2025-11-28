/**
 * @fileoverview Module DATA-PAGES - Gestion des pages de données génériques
 * @module data-pages
 *
 * @description
 * Module pour gérer toutes les pages de données avec filtrage par Poste Technique
 * Utilisé pour: Liste des PSV, Projets INGQ, Équipe, TPAA, etc.
 */

import { getIw37nData } from './iw37n-data.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Filtres de Poste Technique par page
 * Sauvegardé dans sessionStorage (temporaire, se vide à la fermeture du navigateur)
 * @type {Object<string, Array<string>>}
 */
let dataPageFilters = {};

/**
 * Charge les filtres depuis le SERVEUR (persistant)
 */
async function loadDataPageFilters() {
    try {
        const saved = await loadFromStorage('dataPageFilters');
        if (saved && typeof saved === 'object') {
            dataPageFilters = saved;
            console.log('[DATA-PAGES] ✅ Filtres chargés depuis le serveur');
        } else {
            dataPageFilters = {};
            console.log('[DATA-PAGES] ℹ️ Aucun filtre DATA sur le serveur');
        }
    } catch (error) {
        console.error('[DATA-PAGES] ❌ Erreur lors du chargement des filtres:', error);
        dataPageFilters = {};
    }
}

/**
 * Sauvegarde les filtres sur le SERVEUR (persistant)
 */
async function saveDataPageFilters() {
    try {
        const success = await saveToStorage('dataPageFilters', dataPageFilters);
        if (success) {
            console.log('[DATA-PAGES] ✅ Filtres sauvegardés sur le serveur');
        } else {
            console.error('[DATA-PAGES] ❌ Échec sauvegarde filtres sur le serveur');
        }
        return success;
    } catch (error) {
        console.error('[DATA-PAGES] ❌ Erreur lors de la sauvegarde des filtres:', error);
        return false;
    }
}

/**
 * Données manuelles pour la page t21 (Service Incendie)
 * Structure: { [ordre]: { photos: [], commentaire: '' } }
 * @type {Object}
 */
let t21ManualData = {};

/**
 * Charge les données manuelles t21 depuis le SERVEUR (persistant)
 * Données: photos, commentaires, informations manuelles pour Service Incendie
 */
async function loadT21ManualData() {
    try {
        const saved = await loadFromStorage('t21ManualData');
        if (saved && typeof saved === 'object') {
            t21ManualData = saved;
            console.log('[DATA-PAGES] ✅ Données manuelles t21 chargées depuis le serveur');
        } else {
            t21ManualData = {};
            console.log('[DATA-PAGES] ℹ️ Aucune donnée manuelle t21 sur le serveur');
        }
    } catch (error) {
        console.error('[DATA-PAGES] ❌ Erreur chargement données t21:', error);
        t21ManualData = {};
    }
}

/**
 * Sauvegarde les données manuelles t21 sur le SERVEUR (persistant)
 * Données: photos, commentaires, informations manuelles pour Service Incendie
 */
async function saveT21ManualData() {
    try {
        const success = await saveToStorage('t21ManualData', t21ManualData);
        if (success) {
            console.log('[DATA-PAGES] ✅ Données manuelles t21 sauvegardées sur le serveur');
        } else {
            console.error('[DATA-PAGES] ❌ Échec de la sauvegarde t21 sur le serveur');
        }
        return success;
    } catch (error) {
        console.error('[DATA-PAGES] ❌ Erreur sauvegarde données t21:', error);
        return false;
    }
}

/**
 * Données manuelles pour la page soumissions (Montants des entrepreneurs)
 * Structure: { [ordre]: { montant: 0 } }
 * @type {Object}
 */
let soumissionsManualData = {};

/**
 * Charge les données manuelles soumissions depuis le SERVEUR (persistant)
 * Données: montants soumissionnés par les entrepreneurs
 */
async function loadSoumissionsManualData() {
    try {
        const saved = await loadFromStorage('soumissionsManualData');
        if (saved && typeof saved === 'object') {
            soumissionsManualData = saved;
            console.log('[DATA-PAGES] ✅ Données manuelles soumissions chargées depuis le serveur');
        } else {
            soumissionsManualData = {};
            console.log('[DATA-PAGES] ℹ️ Aucune donnée manuelle soumissions sur le serveur');
        }
    } catch (error) {
        console.error('[DATA-PAGES] ❌ Erreur chargement données soumissions:', error);
        soumissionsManualData = {};
    }
}

/**
 * Sauvegarde les données manuelles soumissions sur le SERVEUR (persistant)
 * Données: montants soumissionnés par les entrepreneurs
 */
async function saveSoumissionsManualData() {
    try {
        const success = await saveToStorage('soumissionsManualData', soumissionsManualData);
        if (success) {
            console.log('[DATA-PAGES] ✅ Données manuelles soumissions sauvegardées sur le serveur');
        } else {
            console.error('[DATA-PAGES] ❌ Échec de la sauvegarde soumissions sur le serveur');
        }
        return success;
    } catch (error) {
        console.error('[DATA-PAGES] ❌ Erreur sauvegarde données soumissions:', error);
        return false;
    }
}

/**
 * Met à jour le montant d'une soumission
 * @param {string} ordre - Numéro d'ordre
 * @param {string|number} montant - Montant soumissionné
 */
export function updateSoumissionMontant(ordre, montant) {
    if (!soumissionsManualData[ordre]) {
        soumissionsManualData[ordre] = {};
    }
    soumissionsManualData[ordre].montant = parseFloat(montant) || 0;
    saveSoumissionsManualData();
    console.log(`[DATA-PAGES] Montant mis à jour pour ordre ${ordre}: ${montant} $`);
}

/**
 * Récupère les données de montants des soumissions
 * @returns {Object} Données de montants
 */
export function getSoumissionsManualData() {
    return soumissionsManualData;
}

/**
 * Charge et affiche les données pour une page de données
 *
 * @param {string} pageId - ID de la page (ex: 't19', 'ingq', etc.)
 */
export async function loadDataPage(pageId) {
    console.log(`[DATA-PAGES] Chargement des données pour ${pageId}`);

    // Pour la page soumissions, charger les données de montants
    if (pageId === 'soumissions') {
        await loadSoumissionsManualData();
    }

    // Pour la page t21, charger les données manuelles
    if (pageId === 't21') {
        await loadT21ManualData();
    }

    // Pour la page devis, recharger la liste des entrepreneurs depuis le serveur
    if (pageId === 'devis') {
        console.log('[DATA-PAGES] 🔄 Rechargement de la liste des entrepreneurs pour la page Devis...');
        try {
            const devisManagerModule = await import('../ui/devis-manager.js');
            // Réinitialiser le gestionnaire de devis pour recharger les données depuis le serveur
            await devisManagerModule.initDevisManager();
            console.log('[DATA-PAGES] ✅ Liste des entrepreneurs rechargée pour la page Devis');
        } catch (error) {
            console.error('[DATA-PAGES] ❌ Erreur lors du rechargement de la liste des entrepreneurs:', error);
        }
    }

    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        const tbody = document.getElementById(`${pageId}-tbody`);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 30px; text-align: center; color: #666;">
                        Aucune donnée IW37N disponible. Veuillez d'abord importer les données IW37N depuis la page IW37N.
                    </td>
                </tr>
            `;
        }
        return;
    }

    // Pour la page t21 (SERVICE INCENDIE), afficher UNIQUEMENT les travaux INC sans filtre par Poste technique
    if (pageId === 't21') {
        // Filtrer uniquement par INC
        const incData = iw37nData.filter(row => {
            const posteTravOper = (row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '').toString().trim().toUpperCase();
            return posteTravOper.startsWith('INC');
        });

        console.log(`[DATA-PAGES] t21: ${incData.length} lignes avec POST.TRAV.OPÉR commençant par INC`);

        // Mettre à jour le compteur dans l'interface
        const countInfo = document.getElementById('t21-count-info');
        if (countInfo) {
            countInfo.textContent = `${incData.length} travaux trouvés`;
        }

        // Afficher directement le tableau sans passer par le système de filtrage
        renderT21Table(incData);

        console.log(`[OK] Données t21 chargées: ${incData.length} lignes INC affichées automatiquement`);
    } else if (pageId === 'besoins-echafaud') {
        // Pour la page BESOINS EN ÉCHAFAUDAGES, afficher UNIQUEMENT les travaux MECEXT02
        const echafaudData = iw37nData.filter(row => {
            const posteTravOper = (row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '').toString().trim().toUpperCase();
            return posteTravOper === 'MECEXT02';
        });

        console.log(`[DATA-PAGES] besoins-echafaud: ${echafaudData.length} lignes avec POST.TRAV.OPÉR = MECEXT02`);

        // Extraire les postes techniques pour les données filtrées
        const allPostesTechniques = new Set();
        echafaudData.forEach(row => {
            const posteTech = (row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
            if (posteTech) {
                allPostesTechniques.add(posteTech);
            }
        });

        // Charger les filtres sauvegardés
        loadDataPageFilters();

        // Générer les filtres (checkboxes) uniquement pour les postes techniques présents dans MECEXT02
        renderPosteFilters(pageId, Array.from(allPostesTechniques).sort());

        // Afficher le tableau avec les données pré-filtrées
        renderDataTable(pageId, echafaudData);

        console.log(`[OK] Données besoins-echafaud chargées: ${echafaudData.length} lignes MECEXT02 affichées`);
    } else if (pageId === 'espace-clos') {
        // Pour la page ESPACE CLOS, afficher UNIQUEMENT les travaux contenant EP- ou EC- dans Désign. opér.
        const espaceClosData = iw37nData.filter(row => {
            const designOper = (row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || '').toString().trim();
            return designOper.includes('EP-') || designOper.includes('EC-');
        });

        console.log(`[DATA-PAGES] espace-clos: ${espaceClosData.length} lignes avec EP- ou EC- dans Désign. opér.`);

        // Extraire les postes techniques pour les données filtrées
        const allPostesTechniques = new Set();
        espaceClosData.forEach(row => {
            const posteTech = (row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
            if (posteTech) {
                allPostesTechniques.add(posteTech);
            }
        });

        // Charger les filtres sauvegardés
        loadDataPageFilters();

        // Générer les filtres (checkboxes) uniquement pour les postes techniques des espaces clos
        renderPosteFilters(pageId, Array.from(allPostesTechniques).sort());

        // Afficher le tableau avec les données pré-filtrées
        renderDataTable(pageId, espaceClosData);

        console.log(`[OK] Données espace-clos chargées: ${espaceClosData.length} lignes EP-/EC- affichées`);
    } else {
        // Comportement normal pour les autres pages
        // Extraire tous les Postes Techniques uniques
        const allPostesTechniques = new Set();
        iw37nData.forEach(row => {
            const posteTech = (row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
            if (posteTech) {
                allPostesTechniques.add(posteTech);
            }
        });

        // Charger les filtres sauvegardés
        loadDataPageFilters();

        // Générer les filtres (checkboxes)
        renderPosteFilters(pageId, Array.from(allPostesTechniques).sort());

        // Afficher le tableau
        renderDataTable(pageId);

        console.log(`[OK] Données chargées pour ${pageId}: ${Array.from(allPostesTechniques).length} postes techniques`);
    }
}

/**
 * Génère les checkboxes de filtre par Poste Technique
 *
 * @param {string} pageId - ID de la page
 * @param {Array<string>} postesTechniques - Liste des postes techniques uniques
 */
function renderPosteFilters(pageId, postesTechniques) {
    const filterContainer = document.getElementById(`${pageId}-poste-filters`);
    if (!filterContainer) {
        console.warn(`[DATA-PAGES] Container de filtres ${pageId}-poste-filters non trouvé`);
        return;
    }

    // Initialiser les filtres pour cette page si nécessaire
    if (!dataPageFilters[pageId]) {
        // Première visite: sélectionner tous les postes par défaut
        dataPageFilters[pageId] = [...postesTechniques];
        saveDataPageFilters();
    }

    // Générer les checkboxes
    filterContainer.innerHTML = postesTechniques.map(poste => {
        const isChecked = dataPageFilters[pageId].includes(poste);
        const escapedPoste = poste.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return `
            <label style="display: flex; align-items: center; padding: 8px 10px; cursor: pointer; user-select: none; border-radius: 5px; transition: background 0.2s;">
                <input type="checkbox"
                       class="poste-filter-checkbox"
                       data-page-id="${pageId}"
                       data-poste="${escapedPoste}"
                       ${isChecked ? 'checked' : ''}
                       style="margin-right: 10px; cursor: pointer; width: 18px; height: 18px;">
                <span style="font-size: 0.95em; flex: 1;">${poste}</span>
            </label>
        `;
    }).join('');

    // Attacher les événements après création du HTML
    setTimeout(() => {
        document.querySelectorAll(`#${pageId}-poste-filters .poste-filter-checkbox`).forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const pageId = this.getAttribute('data-page-id');
                const poste = this.getAttribute('data-poste');
                const decodedPoste = poste.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                togglePosteFilter(pageId, decodedPoste);
            });
        });
    }, 0);

    // Mettre à jour l'affichage du filtre
    updatePosteFilterDisplay(pageId, postesTechniques.length);
}

/**
 * Toggle l'affichage du menu déroulant
 *
 * @param {string} pageId - ID de la page
 */
export function togglePosteDropdown(pageId) {
    const menu = document.getElementById(`${pageId}-dropdown-menu`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Sélectionne tous les postes techniques
 *
 * @param {string} pageId - ID de la page
 */
export function selectAllPostesTechniques(pageId) {
    const checkboxes = document.querySelectorAll(`#${pageId}-poste-filters .poste-filter-checkbox`);
    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        console.warn('[DATA-PAGES] Aucune donnée IW37N disponible');
        return;
    }

    // Extraire tous les postes techniques
    const allPostesTechniques = new Set();
    iw37nData.forEach(row => {
        const posteTech = (row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
        if (posteTech) {
            allPostesTechniques.add(posteTech);
        }
    });

    dataPageFilters[pageId] = Array.from(allPostesTechniques);
    saveDataPageFilters();

    // Cocher toutes les checkboxes
    checkboxes.forEach(cb => cb.checked = true);

    updatePosteFilterDisplay(pageId, allPostesTechniques.size);
    renderDataTable(pageId);
}

/**
 * Désélectionne tous les postes techniques
 *
 * @param {string} pageId - ID de la page
 */
export function deselectAllPostesTechniques(pageId) {
    const checkboxes = document.querySelectorAll(`#${pageId}-poste-filters .poste-filter-checkbox`);

    dataPageFilters[pageId] = [];
    saveDataPageFilters();

    // Décocher toutes les checkboxes
    checkboxes.forEach(cb => cb.checked = false);

    const iw37nData = getIw37nData();
    const allPostesTechniques = new Set();
    if (iw37nData) {
        iw37nData.forEach(row => {
            const posteTech = (row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
            if (posteTech) {
                allPostesTechniques.add(posteTech);
            }
        });
    }

    updatePosteFilterDisplay(pageId, allPostesTechniques.size);
    renderDataTable(pageId);
}

/**
 * Toggle un filtre de poste technique
 *
 * @param {string} pageId - ID de la page
 * @param {string} poste - Nom du poste technique
 */
function togglePosteFilter(pageId, poste) {
    if (!dataPageFilters[pageId]) {
        dataPageFilters[pageId] = [];
    }

    const index = dataPageFilters[pageId].indexOf(poste);
    if (index > -1) {
        dataPageFilters[pageId].splice(index, 1);
    } else {
        dataPageFilters[pageId].push(poste);
    }

    saveDataPageFilters();

    const iw37nData = getIw37nData();
    const allPostesTechniques = new Set();
    if (iw37nData) {
        iw37nData.forEach(row => {
            const posteTech = (row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
            if (posteTech) {
                allPostesTechniques.add(posteTech);
            }
        });
    }

    updatePosteFilterDisplay(pageId, allPostesTechniques.size);
    renderDataTable(pageId);
}

/**
 * Met à jour l'affichage du filtre (texte du bouton et compteur)
 *
 * @param {string} pageId - ID de la page
 * @param {number} totalPostes - Nombre total de postes techniques
 */
function updatePosteFilterDisplay(pageId, totalPostes) {
    if (!dataPageFilters[pageId]) {
        dataPageFilters[pageId] = [];
    }

    const selectedCount = dataPageFilters[pageId].length;
    const textSpan = document.getElementById(`${pageId}-selected-text`);
    const countSpan = document.getElementById(`${pageId}-filter-count`);

    if (textSpan) {
        if (selectedCount === 0) {
            textSpan.textContent = 'Aucun poste technique sélectionné';
            textSpan.style.color = '#dc3545';
        } else if (selectedCount === totalPostes) {
            textSpan.textContent = 'Tous les postes techniques sélectionnés';
            textSpan.style.color = '#28a745';
        } else {
            textSpan.textContent = `${selectedCount} poste(s) technique(s) sélectionné(s)`;
            textSpan.style.color = '#333';
        }
    }

    if (countSpan) {
        countSpan.textContent = `${selectedCount} / ${totalPostes} sélectionnés`;
    }
}

/**
 * Rend le tableau spécifique pour la page t21 (Service Incendie)
 * Affiche uniquement les travaux avec Post.trav.opér. commençant par "INC"
 *
 * @param {Array} incData - Données déjà filtrées par INC
 */
function renderT21Table(incData) {
    const tbody = document.getElementById('t21-tbody');
    const countSpan = document.getElementById('t21-count');

    if (!tbody) {
        console.warn('[DATA-PAGES] Tableau t21-tbody non trouvé');
        return;
    }

    if (!incData || incData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 30px; text-align: center; color: #666;">
                    Aucun travail Service Incendie (INC) trouvé dans les données IW37N.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    // Rendre les lignes directement
    tbody.innerHTML = incData.map((row, index) => {
        const ordre = row['Ordre'] || row['ordre'] || '-';
        const operation = row['Opération'] || row['Operation'] || '-';
        const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || row['Désignation'] || row['Designation'] || '-';
        const posteTrav = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || row['PostTrav'] || '-';
        const posteTech = row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '-';
        const etat = row['Etat'] || row['État'] || '-';

        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';

        // Récupérer les données manuelles pour cette ligne
        const manualData = t21ManualData[ordre] || { photos: [], commentaire: '' };

        // Générer l'affichage des photos
        let photosHTML = '';
        if (manualData.photos && manualData.photos.length > 0) {
            photosHTML = manualData.photos.map((photo, idx) => `
                <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px; background: #f0f0f0; padding: 3px; border-radius: 3px;">
                    <span style="font-size: 11px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${photo.name}">📄 ${photo.name}</span>
                    <button onclick="window.dataActions.deleteT21Photo('${ordre}', ${idx})" style="padding: 2px 5px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">✕</button>
                </div>
            `).join('');
        }

        return `
            <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #dee2e6;">${etat}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${ordre}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${designOper}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${operation}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 600; color: #e53935;">${posteTrav}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${posteTech}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <div style="margin-bottom: 5px;">${photosHTML || '<span style="color: #999; font-size: 12px;">Aucun document</span>'}</div>
                    <input type="file" id="photo-input-${ordre}" multiple style="display: none;" onchange="window.dataActions.handleT21PhotoUpload('${ordre}', this.files)">
                    <button onclick="document.getElementById('photo-input-${ordre}').click()" style="padding: 5px 10px; background: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">📎 Ajouter</button>
                </td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                    <textarea onchange="window.dataActions.updateT21Commentaire('${ordre}', this.value)" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; min-height: 50px; resize: vertical;">${manualData.commentaire || ''}</textarea>
                </td>
            </tr>
        `;
    }).join('');

    if (countSpan) {
        countSpan.textContent = incData.length;
    }

    console.log(`[DATA-PAGES] Tableau t21 rendu: ${incData.length} travaux Service Incendie affichés`);
}

/**
 * Rend le tableau des opérations filtrées
 *
 * @param {string} pageId - ID de la page
 * @param {Array} preFilteredData - Données pré-filtrées (optionnel)
 */
function renderDataTable(pageId, preFilteredData = null) {
    const tbody = document.getElementById(`${pageId}-tbody`);
    const countSpan = document.getElementById(`${pageId}-count`);

    if (!tbody) {
        console.warn(`[DATA-PAGES] Tableau ${pageId}-tbody non trouvé`);
        return;
    }

    // Utiliser les données pré-filtrées si fournies, sinon charger toutes les données
    const iw37nData = preFilteredData || getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        // Gérer le nombre de colonnes selon la page
        let colspan = '8';
        if (pageId === 'espace-clos') colspan = '9';
        if (pageId === 'soumissions') colspan = '7';

        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="padding: 30px; text-align: center; color: #666;">
                    Aucune donnée IW37N disponible.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';

        // Mettre à jour le compteur unique pour espace-clos
        if (pageId === 'espace-clos') {
            const uniqueCountSpan = document.getElementById('espace-clos-unique-count');
            if (uniqueCountSpan) uniqueCountSpan.textContent = '0';
        }
        return;
    }

    // Filtrer les données selon les filtres actifs
    let filteredData = iw37nData.filter(row => {
        const posteTech = (row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
        const posteOk = dataPageFilters[pageId] && dataPageFilters[pageId].includes(posteTech);

        // Pour la page devis, ajouter le filtre par entrepreneur (POST.TRAV.OPÉR.)
        if (pageId === 'devis' && window.devisManager && window.devisManager.passesEntrepreneurFilter) {
            const entrepreneur = (row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '').toString().trim();
            const entrepreneurOk = window.devisManager.passesEntrepreneurFilter(entrepreneur);
            return posteOk && entrepreneurOk;
        }

        return posteOk;
    });

    if (filteredData.length === 0) {
        // Gérer le nombre de colonnes selon la page
        let colspan = '8';
        if (pageId === 'espace-clos') colspan = '9';
        if (pageId === 'soumissions') colspan = '7';

        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="padding: 30px; text-align: center; color: #666;">
                    Aucune opération ne correspond aux filtres sélectionnés.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';

        // Mettre à jour le compteur unique pour espace-clos
        if (pageId === 'espace-clos') {
            const uniqueCountSpan = document.getElementById('espace-clos-unique-count');
            if (uniqueCountSpan) uniqueCountSpan.textContent = '0';
        }
        return;
    }

    // Rendre les lignes
    tbody.innerHTML = filteredData.map((row, index) => {
        const ordre = row['Ordre'] || row['ordre'] || '-';
        const operation = row['Opération'] || row['Operation'] || '-';
        // Utiliser Désign. opér. au lieu de Désignation
        const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || row['Désignation'] || row['Designation'] || '-';
        // Pour la colonne Post. Trav., afficher Post.trav.opér. du tableau IW37N
        const posteTrav = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || row['PostTrav'] || '-';
        const posteTech = row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '-';
        const etat = row['Etat'] || row['État'] || '-';

        // Extraire l'espace clos (EP- ou EC-) depuis designOper
        let espaceClos = '-';
        if (typeof designOper === 'string') {
            if (designOper.includes('EP-')) {
                const match = designOper.match(/EP-[^\s]*/);
                espaceClos = match ? match[0] : '-';
            } else if (designOper.includes('EC-')) {
                const match = designOper.match(/EC-[^\s]*/);
                espaceClos = match ? match[0] : '-';
            }
        }

        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';

        // Page soumissions: affichage simplifié avec colonne Montant
        if (pageId === 'soumissions') {
            const soumissionData = soumissionsManualData[ordre] || { montant: 0 };
            return `
                <tr style="background: ${bgColor};">
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${etat}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${ordre}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${designOper}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${operation}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-weight: 600; color: #e53935;">${posteTrav}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${posteTech}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                        <input type="number"
                               value="${soumissionData.montant || ''}"
                               placeholder="0"
                               onchange="window.dataActions.updateSoumissionMontant('${ordre}', this.value)"
                               style="width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95em; text-align: right;">
                    </td>
                </tr>
            `;
        }

        // Page besoins-echafaud: affichage simplifié sans colonnes Photos et Commentaires
        if (pageId === 'besoins-echafaud') {
            return `
                <tr style="background: ${bgColor};">
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${etat}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${ordre}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${designOper}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${operation}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${posteTrav}</td>
                    <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${posteTech}</td>
                </tr>
            `;
        }

        // Récupérer les données manuelles pour cette ligne (espace-clos)
        const manualData = t21ManualData[ordre] || { photos: [], commentaire: '' };

        // Générer l'affichage des photos - plus compact avec icônes
        let photosHTML = '';
        if (manualData.photos && manualData.photos.length > 0) {
            photosHTML = manualData.photos.map((photo, idx) => `
                <div style="display: inline-flex; align-items: center; gap: 3px; margin: 2px; background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">
                    <span style="font-size: 10px; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${photo.name}">📄${photo.name.substring(0,8)}</span>
                    <button onclick="window.dataActions.deleteT21Photo('${ordre}', ${idx})" style="padding: 1px 4px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 9px;">✕</button>
                </div>
            `).join('');
        }

        return `
            <tr style="background: ${bgColor};">
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${etat}</td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-weight: bold; color: #c9941a;">${espaceClos}</td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${ordre}</td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${designOper}</td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${operation}</td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${posteTrav}</td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${posteTech}</td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                    <div style="margin-bottom: 3px; min-height: 16px;">${photosHTML || '<span style="color: #999; font-size: 10px;">Aucun</span>'}</div>
                    <input type="file" id="photo-input-${ordre}" multiple style="display: none;" onchange="window.dataActions.handleT21PhotoUpload('${ordre}', this.files)">
                    <button onclick="document.getElementById('photo-input-${ordre}').click()" style="padding: 3px 6px; background: #4299e1; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; width: 100%;">📎 Ajouter</button>
                </td>
                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                    <textarea onchange="window.dataActions.updateT21Commentaire('${ordre}', this.value)" class="auto-resize" style="width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 3px; min-height: 28px; resize: none; line-height: 1.4; font-size: 0.95em; overflow: hidden;">${manualData.commentaire || ''}</textarea>
                </td>
            </tr>
        `;
    }).join('');

    // Initialiser l'auto-resize pour les textareas après le rendu
    setTimeout(() => {
        const textareas = document.querySelectorAll(`#${pageId}-tbody textarea.auto-resize`);
        textareas.forEach(textarea => {
            if (window.initTextareaAutoResize) {
                window.initTextareaAutoResize(textarea);
            }
        });
    }, 100);

    if (countSpan) {
        countSpan.textContent = filteredData.length;
    }

    // Pour la page espace-clos, calculer aussi le nombre d'espaces clos uniques
    if (pageId === 'espace-clos') {
        const uniqueCountSpan = document.getElementById('espace-clos-unique-count');
        if (uniqueCountSpan) {
            // Extraire les numéros EP- ou EC- depuis Désign. opér.
            const espacesClosSet = new Set();
            filteredData.forEach(row => {
                const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || row['Désignation'] || row['Designation'] || '';

                // Chercher EP- ou EC-
                let espaceClos = '';
                if (designOper.includes('EP-')) {
                    const match = designOper.match(/EP-[^\s]*/);
                    espaceClos = match ? match[0] : '';
                } else if (designOper.includes('EC-')) {
                    const match = designOper.match(/EC-[^\s]*/);
                    espaceClos = match ? match[0] : '';
                }

                if (espaceClos && espaceClos.trim()) {
                    espacesClosSet.add(espaceClos.trim());
                }
            });

            const uniqueCount = espacesClosSet.size;
            uniqueCountSpan.textContent = uniqueCount;
            console.log(`[DATA-PAGES] Espace clos: ${filteredData.length} opérations, ${uniqueCount} espaces clos uniques`);
        }
    }

    console.log(`[DATA-PAGES] Tableau rendu: ${filteredData.length} opérations affichées`);
}

/**
 * Exporte les données vers Excel
 *
 * @param {string} pageId - ID de la page
 * @param {string} pageName - Nom de la page
 */
export function exportToExcel(pageId, pageName) {
    console.log(`[DATA-PAGES] Export Excel pour ${pageName} (${pageId})`);

    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N disponible à exporter.');
        return;
    }

    let filteredData;

    // Traitement spécial pour la page t21 (SERVICE INCENDIE)
    // Exporter uniquement les lignes où Post.trav.opér. commence par "INC"
    if (pageId === 't21') {
        filteredData = iw37nData.filter(row => {
            const posteTravOper = (row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '').toString().trim().toUpperCase();
            return posteTravOper.startsWith('INC');
        });
        console.log(`[DATA-PAGES] Export t21: ${filteredData.length} lignes INC à exporter`);
    } else {
        // Pour les autres pages, filtrer selon les filtres actifs par Poste technique
        filteredData = iw37nData.filter(row => {
            const posteTech = (row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
            return dataPageFilters[pageId] && dataPageFilters[pageId].includes(posteTech);
        });
    }

    if (filteredData.length === 0) {
        alert('⚠️ Aucune donnée filtrée à exporter.');
        return;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[DATA-PAGES] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    try {
        // Préparer les données pour l'export
        const exportData = filteredData.map(row => {
            const ordre = row['Ordre'] || row['ordre'] || '';
            const manualData = t21ManualData[ordre] || { photos: [], commentaire: '' };
            const photosText = manualData.photos ? manualData.photos.map(p => p.name).join(', ') : '';

            const designOper = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || row['Désignation'] || row['Designation'] || '';

            // Pour la page espace-clos, extraire l'espace clos
            let espaceClos = '';
            if (pageId === 'espace-clos') {
                if (typeof designOper === 'string') {
                    if (designOper.includes('EP-')) {
                        const match = designOper.match(/EP-[^\s]*/);
                        espaceClos = match ? match[0] : '';
                    } else if (designOper.includes('EC-')) {
                        const match = designOper.match(/EC-[^\s]*/);
                        espaceClos = match ? match[0] : '';
                    }
                }
            }

            const exportRow = {
                'État': row['Etat'] || row['État'] || ''
            };

            // Ajouter la colonne Espace clos uniquement pour la page espace-clos
            if (pageId === 'espace-clos') {
                exportRow['Espace clos'] = espaceClos;
            }

            exportRow['Ordre'] = ordre;
            exportRow['Désign. opér.'] = designOper;
            exportRow['Opération'] = row['Opération'] || row['Operation'] || '';
            exportRow['Post. Trav.'] = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || row['Post. Trav.'] || row['PostTrav'] || '';
            exportRow['Poste technique'] = row['POSTE TECHNIQUE'] || row['Poste technique'] || row['PosteTechnique'] || '';
            exportRow['Photo'] = photosText;
            exportRow['Commentaire'] = manualData.commentaire || '';

            return exportRow;
        });

        // Créer le workbook et la feuille
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, pageName.substring(0, 31)); // Excel limite à 31 caractères

        // Générer le nom de fichier avec la date
        const date = new Date().toISOString().split('T')[0];
        const filename = `${pageId}-${pageName.replace(/\s+/g, '-')}-${date}.xlsx`;

        // Télécharger le fichier
        XLSX.writeFile(wb, filename);

        console.log(`[DATA-PAGES] Export Excel réussi: ${filename}`);
        alert(`✅ Export Excel réussi !\n\n${filteredData.length} opérations exportées pour ${pageName}`);
    } catch (error) {
        console.error('[DATA-PAGES] Erreur lors de l\'export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Gère l'upload de photos pour une ligne t21
 * @param {string} ordre - Numéro d'ordre de la ligne
 * @param {FileList} files - Liste des fichiers uploadés
 */
export function handleT21PhotoUpload(ordre, files) {
    if (!t21ManualData[ordre]) {
        t21ManualData[ordre] = { photos: [], commentaire: '' };
    }

    Array.from(files).forEach(file => {
        const photoInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toISOString()
        };

        t21ManualData[ordre].photos.push(photoInfo);
    });

    saveT21ManualData();
    loadDataPage('t21');
    console.log(`[DATA-PAGES] ${files.length} photo(s) ajoutée(s) pour ordre ${ordre}`);
}

/**
 * Supprime une photo d'une ligne t21
 * @param {string} ordre - Numéro d'ordre de la ligne
 * @param {number} index - Index de la photo à supprimer
 */
export function deleteT21Photo(ordre, index) {
    if (t21ManualData[ordre] && t21ManualData[ordre].photos) {
        if (confirm('Voulez-vous supprimer ce document ?')) {
            t21ManualData[ordre].photos.splice(index, 1);
            saveT21ManualData();
            loadDataPage('t21');
            console.log(`[DATA-PAGES] Photo supprimée pour ordre ${ordre}`);
        }
    }
}

/**
 * Met à jour le commentaire d'une ligne t21
 * @param {string} ordre - Numéro d'ordre de la ligne
 * @param {string} value - Nouveau commentaire
 */
export function updateT21Commentaire(ordre, value) {
    if (!t21ManualData[ordre]) {
        t21ManualData[ordre] = { photos: [], commentaire: '' };
    }

    t21ManualData[ordre].commentaire = value;
    saveT21ManualData();
    console.log(`[DATA-PAGES] Commentaire mis à jour pour ordre ${ordre}`);
}

/**
 * Initialise le module DATA-PAGES
 */
export async function initDataPages() {
    await loadDataPageFilters();
    await loadT21ManualData();
    console.log('[OK] Module DATA-PAGES initialisé');
}

/**
 * Filtre le tableau IW37N d'une page
 * @param {string} pageId - ID de la page
 */
export function filterIW37NTable(pageId) {
    renderDataTable(pageId);
}

export default {
    loadDataPage,
    togglePosteDropdown,
    selectAllPostesTechniques,
    deselectAllPostesTechniques,
    exportToExcel,
    initDataPages,
    handleT21PhotoUpload,
    deleteT21Photo,
    updateT21Commentaire,
    filterIW37NTable
};
