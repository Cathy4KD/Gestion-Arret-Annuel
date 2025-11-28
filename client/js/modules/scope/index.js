/**
 * @fileoverview Module SCOPE - Gestion des pages SCOPE par secteurs
 * @module scope
 *
 * @description
 * Module pour gérer les pages SCOPE (CONVERTISSEUR, FOSSE, HALLE 1, HALLE 2, etc.)
 * Inclut le filtrage par Poste Technique et l'affichage des opérations depuis IW37N
 */

import { getIw37nData } from '../data/iw37n-data.js';
import { renderWorkSelector } from './scope-markers.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Filtres de Poste Technique par page SCOPE
 * Sauvegardé dans sessionStorage
 * @type {Object<string, Array<string>>}
 */
let scopeFilters = {};

/**
 * Allocation des postes techniques par page SCOPE
 * Permet de savoir quel poste est assigné à quelle page
 * Un poste ne peut être assigné qu'à UNE SEULE page à la fois
 * Format: { "poste1": "t10", "poste2": "t11", ... }
 * @type {Object<string, string>}
 */
let posteAllocations = {};

/**
 * Fonction helper pour extraire le poste technique d'une ligne
 * Gère plusieurs variantes de nom de colonne et détecte automatiquement la bonne colonne
 * @param {Object} row - Ligne de données
 * @returns {string} Poste technique ou chaîne vide
 */
function getPosteTechnique(row) {
    // Liste de variantes connues (ordre de priorité)
    const knownVariants = [
        'POSTE TECHNIQUE',        // Ajouté en priorité
        'Poste technique',
        'PosteTechnique',
        'Poste Technique',
        'poste technique',
        'postetechnique',
        'Post. Tech.',
        'Post.Tech.',
        'Poste tech',
        'Poste Tech'
    ];

    // Chercher d'abord dans les variantes connues
    for (const variant of knownVariants) {
        if (row[variant]) {
            return row[variant].toString().trim();
        }
    }

    // Si aucune variante connue n'est trouvée, chercher une colonne qui contient "poste" ET "tech"
    const keys = Object.keys(row);
    const foundKey = keys.find(key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('poste') && lowerKey.includes('tech');
    });

    if (foundKey && row[foundKey]) {
        return row[foundKey].toString().trim();
    }

    return '';
}

/**
 * Mapping des IDs de page vers les noms de secteurs
 * @type {Object<string, string>}
 */
const scopePages = {
    't10': 'CONVERTISSEUR',
    't11': 'FOSSE',
    't12': 'HALLE 1',
    't13': 'HALLE 2',
    't14': 'PONT ROULANT',
    't15': 'TOURELLE ET MACC NIV 24',
    't16': 'COULÉE CONTINUE',
    't17': 'EXPÉDITION',
    't18': "TOURS D'EAU"
};

/**
 * Charge les filtres SCOPE depuis le SERVEUR (persistant)
 * Ne recharge PAS si les données ont déjà été injectées par server-sync
 */
async function loadScopeFilters() {
    // Si les données ont déjà été injectées par server-sync, ne pas recharger
    if (Object.keys(scopeFilters).length > 0) {
        console.log('[SCOPE] ℹ️ Filtres déjà injectés par server-sync, pas de rechargement');
        return;
    }

    try {
        const saved = await loadFromStorage('scopeFilters');
        if (saved && typeof saved === 'object') {
            scopeFilters = saved;
            console.log('[SCOPE] ✅ Filtres chargés depuis le serveur');
        } else {
            scopeFilters = {};
            console.log('[SCOPE] ℹ️ Aucun filtre SCOPE sur le serveur');
        }
    } catch (error) {
        console.error('[SCOPE] ❌ Erreur lors du chargement des filtres:', error);
        scopeFilters = {};
    }
}

/**
 * Charge les allocations de postes techniques depuis le SERVEUR (persistant)
 * Ne recharge PAS si les données ont déjà été injectées par server-sync
 */
async function loadPosteAllocations() {
    // Si les données ont déjà été injectées par server-sync, ne pas recharger
    if (Object.keys(posteAllocations).length > 0) {
        console.log('[SCOPE] ℹ️ Allocations déjà injectées par server-sync, pas de rechargement');
        return;
    }

    try {
        const saved = await loadFromStorage('posteAllocations');
        if (saved && typeof saved === 'object') {
            posteAllocations = saved;
            console.log('[SCOPE] ✅ Allocations de postes chargées depuis le serveur:', Object.keys(posteAllocations).length, 'postes assignés');
        } else {
            posteAllocations = {};
            console.log('[SCOPE] ℹ️ Aucune allocation sur le serveur');
        }
    } catch (error) {
        console.error('[SCOPE] ❌ Erreur lors du chargement des allocations:', error);
        posteAllocations = {};
    }
}

/**
 * Sauvegarde les allocations de postes techniques sur le SERVEUR (persistant)
 */
async function savePosteAllocations() {
    try {
        const success = await saveToStorage('posteAllocations', posteAllocations);
        if (success) {
            console.log('[SCOPE] ✅ Allocations de postes sauvegardées sur le serveur');
        } else {
            console.error('[SCOPE] ❌ Échec sauvegarde allocations sur le serveur');
        }
        return success;
    } catch (error) {
        console.error('[SCOPE] ❌ Erreur lors de la sauvegarde des allocations:', error);
        return false;
    }
}

/**
 * Obtient les filtres actifs pour une page SCOPE
 * @param {string} pageId - ID de la page
 * @returns {Promise<Array<string>>} Liste des postes techniques sélectionnés
 */
export async function getScopeFilters(pageId) {
    await loadScopeFilters();
    return scopeFilters[pageId] || [];
}

/**
 * Sauvegarde les filtres SCOPE sur le SERVEUR (persistant)
 */
async function saveScopeFilters() {
    try {
        const success = await saveToStorage('scopeFilters', scopeFilters);
        if (success) {
            console.log('[SCOPE] ✅ Filtres sauvegardés sur le serveur');
        } else {
            console.error('[SCOPE] ❌ Échec sauvegarde filtres sur le serveur');
        }
        return success;
    } catch (error) {
        console.error('[SCOPE] ❌ Erreur lors de la sauvegarde des filtres:', error);
        return false;
    }
}

/**
 * Charge et affiche les données pour une page SCOPE
 *
 * @param {string} pageId - ID de la page (ex: 't10', 't11', etc.)
 */
export async function loadScopeData(pageId) {
    console.log(`[SCOPE] Chargement des données pour ${pageId}`);

    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        console.warn(`[SCOPE] ⚠️ Aucune donnée IW37N disponible`);
        document.getElementById(`${pageId}-tbody`).innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666;">
                    Aucune donnée IW37N disponible. Veuillez d'abord importer les données IW37N depuis la page IW37N.
                </td>
            </tr>
        `;
        return;
    }

    console.log(`[SCOPE] ${iw37nData.length} lignes de données IW37N disponibles`);

    // Afficher les colonnes disponibles dans la première ligne pour déboguer
    if (iw37nData.length > 0) {
        const firstRowKeys = Object.keys(iw37nData[0]);
        console.log(`[SCOPE] Colonnes disponibles dans IW37N:`, firstRowKeys);

        // Chercher les colonnes qui pourraient contenir le poste technique
        const posteCandidates = firstRowKeys.filter(key => {
            const lowerKey = key.toLowerCase();
            return lowerKey.includes('poste') || lowerKey.includes('tech');
        });
        console.log(`[SCOPE] Colonnes candidates pour "Poste technique":`, posteCandidates);
    }

    // Extraire tous les Postes Techniques uniques
    const allPostesTechniques = new Set();
    iw37nData.forEach(row => {
        const posteTech = getPosteTechnique(row);
        if (posteTech) {
            allPostesTechniques.add(posteTech);
        }
    });

    console.log(`[SCOPE] ${allPostesTechniques.size} postes techniques uniques trouvés:`, Array.from(allPostesTechniques));

    // Charger les filtres et allocations sauvegardés (IMPORTANT: await pour s'assurer que les données sont chargées)
    await loadScopeFilters();
    await loadPosteAllocations();

    // Générer les filtres (checkboxes)
    if (allPostesTechniques.size > 0) {
        console.log(`[SCOPE] ✅ ${allPostesTechniques.size} postes techniques trouvés, génération des filtres...`);
        await renderPosteFilters(pageId, Array.from(allPostesTechniques).sort());
    } else {
        console.error(`[SCOPE] ❌ Aucun poste technique trouvé dans les données IW37N`);
        console.error(`[SCOPE] Vérifiez que votre fichier IW37N contient une colonne nommée "Poste technique" (ou variante similaire)`);
        const filterContainer = document.getElementById(`${pageId}-poste-filters`);
        if (filterContainer) {
            // Obtenir les noms de colonnes pour aider au diagnostic
            let availableColumns = '';
            if (iw37nData.length > 0) {
                const columns = Object.keys(iw37nData[0]);
                availableColumns = `<br><br><div style="background: #fff; padding: 10px; border-radius: 5px; margin-top: 10px; text-align: left;"><strong>Colonnes détectées dans votre fichier:</strong><br><code style="font-size: 11px; color: #d32f2f;">${columns.join('<br>')}</code></div>`;
            }
            filterContainer.innerHTML = `
                <div style="padding: 20px; color: #dc3545; text-align: center; background: #ffebee; border-radius: 8px; border: 2px solid #ef5350;">
                    <div style="font-size: 2em; margin-bottom: 10px;">⚠️</div>
                    <strong style="font-size: 1.1em;">Aucun poste technique trouvé dans les données IW37N</strong>
                    <p style="margin: 15px 0; color: #666;">
                        Vérifiez que votre fichier Excel/CSV contient une colonne nommée:<br>
                        <strong style="color: #000;">"Poste technique"</strong> (ou variante: PosteTechnique, Post.Tech., etc.)
                    </p>
                    ${availableColumns}
                </div>
            `;
        }

        // Mettre à jour le compteur pour indiquer 0
        updatePosteFilterDisplay(pageId, 0);
    }

    // Afficher le tableau
    renderScopeTable(pageId);

    console.log(`[OK] Données SCOPE chargées pour ${pageId}: ${Array.from(allPostesTechniques).length} postes techniques`);
}

/**
 * Génère les checkboxes de filtre par Poste Technique
 *
 * @param {string} pageId - ID de la page
 * @param {Array<string>} postesTechniques - Liste des postes techniques uniques
 */
async function renderPosteFilters(pageId, postesTechniques) {
    const filterContainer = document.getElementById(`${pageId}-poste-filters`);
    if (!filterContainer) {
        console.warn(`[SCOPE] Container de filtres ${pageId}-poste-filters non trouvé`);
        return;
    }

    // Si des filtres existent déjà pour cette page, afficher TOUS les postes qui y sont (même s'ils sont assignés ailleurs)
    let availablePostes;
    if (scopeFilters[pageId] && scopeFilters[pageId].length > 0) {
        // Afficher tous les postes qui sont dans les filtres sauvegardés
        availablePostes = postesTechniques.filter(poste => scopeFilters[pageId].includes(poste));
        console.log(`[SCOPE] 📋 Page ${pageId}: ${availablePostes.length} postes depuis les filtres sauvegardés`);
    } else {
        // Première visite: filtrer les postes disponibles (non assignés à d'autres pages)
        availablePostes = postesTechniques.filter(poste => {
            const assignedTo = posteAllocations[poste];
            return !assignedTo || assignedTo === pageId;
        });
        console.log(`[SCOPE] 📋 Page ${pageId}: ${availablePostes.length}/${postesTechniques.length} postes disponibles (première visite)`);

        // Initialiser avec les postes disponibles
        scopeFilters[pageId] = [...availablePostes];
        await saveScopeFilters();
    }

    // Générer les checkboxes pour TOUS les postes à afficher
    const checkboxesHTML = availablePostes.map(poste => {
        const isChecked = scopeFilters[pageId] && scopeFilters[pageId].includes(poste);
        const assignedTo = posteAllocations[poste];
        const isAssignedElsewhere = assignedTo && assignedTo !== pageId;

        const escapedPoste = String(poste).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const checkboxId = `checkbox-${pageId}-${escapedPoste.replace(/\s+/g, '-')}`;

        // Style spécial si assigné ailleurs
        const warningIcon = isAssignedElsewhere ? `<span style="color: #ff9800; font-size: 0.9em; margin-left: 5px;" title="Assigné à ${assignedTo}">⚠️</span>` : '';

        return `
            <label for="${checkboxId}" style="display: flex; align-items: center; padding: 12px 15px; cursor: pointer; user-select: none; border-radius: 6px; transition: all 0.2s; min-height: 45px; background: ${isChecked ? '#e3f2fd' : '#ffffff'}; margin-bottom: 6px; border: 2px solid ${isChecked ? '#4299e1' : '#e0e0e0'}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <input type="checkbox"
                       id="${checkboxId}"
                       class="poste-filter-checkbox"
                       data-page-id="${pageId}"
                       data-poste="${escapedPoste}"
                       ${isChecked ? 'checked' : ''}
                       style="margin-right: 15px; cursor: pointer; width: 22px; height: 22px; flex-shrink: 0; accent-color: #4299e1;">
                <span style="font-size: 1em; flex: 1; color: ${isChecked ? '#0277bd' : '#333'}; font-weight: ${isChecked ? '600' : '500'}; line-height: 1.5;">${poste}${warningIcon}</span>
                ${isChecked ? '<span style="color: #28a745; font-size: 1.2em; font-weight: bold;">✓</span>' : ''}
            </label>
        `;
    }).join('');

    let blockedMessage = '';

    filterContainer.innerHTML = blockedMessage + checkboxesHTML;
    console.log(`[SCOPE] ✅ ${availablePostes.length} checkboxes générées pour ${pageId}`);

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

        // Ajouter l'effet de survol sur les labels pour une meilleure UX
        document.querySelectorAll(`#${pageId}-poste-filters label`).forEach(label => {
            const checkbox = label.querySelector('input[type="checkbox"]');
            const isChecked = checkbox && checkbox.checked;

            // Sauvegarder les couleurs d'origine
            const originalBg = isChecked ? '#e3f2fd' : '#ffffff';
            const originalBorder = isChecked ? '#4299e1' : '#e0e0e0';

            label.addEventListener('mouseenter', function() {
                this.style.background = '#e3f2fd';
                this.style.borderColor = '#4299e1';
                this.style.transform = 'translateX(5px)';
                this.style.boxShadow = '0 4px 8px rgba(66, 153, 225, 0.3)';
            });
            label.addEventListener('mouseleave', function() {
                const isNowChecked = checkbox && checkbox.checked;
                this.style.background = isNowChecked ? '#e3f2fd' : '#ffffff';
                this.style.borderColor = isNowChecked ? '#4299e1' : '#e0e0e0';
                this.style.transform = 'translateX(0)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            });
        });

        console.log(`[SCOPE] ${postesTechniques.length} postes techniques affichés dans le menu déroulant`);
    }, 0);

    // Mettre à jour l'affichage du filtre
    updatePosteFilterDisplay(pageId, availablePostes.length);
}

/**
 * Toggle l'affichage du menu déroulant
 *
 * @param {string} pageId - ID de la page
 */
export function togglePosteDropdown(pageId) {
    const menu = document.getElementById(`${pageId}-dropdown-menu`);
    if (menu) {
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';

        // Si on ouvre le menu, ajouter un gestionnaire pour le fermer en cliquant en dehors
        if (!isVisible) {
            // Retirer les anciens gestionnaires pour éviter les doublons
            document.removeEventListener('click', window[`_closeDropdown_${pageId}`]);

            // Créer un nouveau gestionnaire
            const closeHandler = function(e) {
                const dropdownBtn = document.getElementById(`${pageId}-dropdown-btn`);
                const dropdownMenu = document.getElementById(`${pageId}-dropdown-menu`);

                // Ne pas fermer si on clique sur le bouton ou à l'intérieur du menu
                if (dropdownBtn && !dropdownBtn.contains(e.target) &&
                    dropdownMenu && !dropdownMenu.contains(e.target)) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeHandler);
                    delete window[`_closeDropdown_${pageId}`];
                }
            };

            // Sauvegarder le gestionnaire pour pouvoir le retirer plus tard
            window[`_closeDropdown_${pageId}`] = closeHandler;

            // Ajouter le gestionnaire après un délai pour éviter de fermer immédiatement
            setTimeout(() => {
                document.addEventListener('click', closeHandler);
            }, 10);
        }
    }
}

/**
 * Sélectionne tous les postes techniques
 *
 * @param {string} pageId - ID de la page
 */
export async function selectAllPostesTechniques(pageId) {
    const checkboxes = document.querySelectorAll(`#${pageId}-poste-filters .poste-filter-checkbox`);
    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        console.warn('[SCOPE] Aucune donnée IW37N disponible');
        return;
    }

    // Extraire tous les postes techniques DISPONIBLES (affichés dans les checkboxes)
    const availablePostes = [];
    checkboxes.forEach(cb => {
        const poste = cb.getAttribute('data-poste');
        if (poste) {
            const decodedPoste = poste.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            availablePostes.push(decodedPoste);
            // Allouer ce poste à cette page
            posteAllocations[decodedPoste] = pageId;
        }
    });

    scopeFilters[pageId] = availablePostes;
    await saveScopeFilters();
    await savePosteAllocations();

    // Cocher toutes les checkboxes
    checkboxes.forEach(cb => cb.checked = true);

    console.log(`[SCOPE] 🔒 ${availablePostes.length} postes assignés à ${pageId}`);

    updatePosteFilterDisplay(pageId, availablePostes.length);
    renderScopeTable(pageId);
    await renderWorkSelector(pageId);
}

/**
 * Désélectionne tous les postes techniques
 *
 * @param {string} pageId - ID de la page
 */
export async function deselectAllPostesTechniques(pageId) {
    const checkboxes = document.querySelectorAll(`#${pageId}-poste-filters .poste-filter-checkbox`);

    // Libérer toutes les allocations de cette page
    checkboxes.forEach(cb => {
        const poste = cb.getAttribute('data-poste');
        if (poste) {
            const decodedPoste = poste.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            // Ne supprimer que si c'est bien assigné à cette page
            if (posteAllocations[decodedPoste] === pageId) {
                delete posteAllocations[decodedPoste];
            }
        }
    });

    scopeFilters[pageId] = [];
    await saveScopeFilters();
    await savePosteAllocations();

    // Décocher toutes les checkboxes
    checkboxes.forEach(cb => cb.checked = false);

    console.log(`[SCOPE] 🔓 Tous les postes de ${pageId} ont été libérés`);

    const iw37nData = getIw37nData();
    const allPostesTechniques = new Set();
    if (iw37nData) {
        iw37nData.forEach(row => {
            const posteTech = (row['Poste technique'] || row['PosteTechnique'] || '').toString().trim();
            if (posteTech) {
                allPostesTechniques.add(posteTech);
            }
        });
    }

    updatePosteFilterDisplay(pageId, allPostesTechniques.size);
    renderScopeTable(pageId);
    await renderWorkSelector(pageId);
}

/**
 * Toggle un filtre de poste technique
 *
 * @param {string} pageId - ID de la page
 * @param {string} poste - Nom du poste technique
 */
async function togglePosteFilter(pageId, poste) {
    if (!scopeFilters[pageId]) {
        scopeFilters[pageId] = [];
    }

    console.log(`[SCOPE] AVANT toggle - Filtres pour ${pageId}:`, [...scopeFilters[pageId]]);

    const index = scopeFilters[pageId].indexOf(poste);
    if (index > -1) {
        // Décocher: retirer du filtre ET libérer l'allocation
        scopeFilters[pageId].splice(index, 1);
        delete posteAllocations[poste];
        console.log(`[SCOPE] 🔓 Poste "${poste}" libéré de ${pageId}`);
    } else {
        // Cocher: ajouter au filtre ET allouer à cette page
        scopeFilters[pageId].push(poste);
        posteAllocations[poste] = pageId;
        console.log(`[SCOPE] 🔒 Poste "${poste}" assigné à ${pageId}`);
    }

    console.log(`[SCOPE] APRÈS toggle - Filtres pour ${pageId}:`, [...scopeFilters[pageId]]);

    await saveScopeFilters();
    await savePosteAllocations();

    const iw37nData = getIw37nData();
    const allPostesTechniques = new Set();
    if (iw37nData) {
        iw37nData.forEach(row => {
            // IMPORTANT: Utiliser la même méthode d'extraction que partout ailleurs
            const posteTech = getPosteTechnique(row);
            if (posteTech) {
                allPostesTechniques.add(posteTech);
            }
        });
    }

    updatePosteFilterDisplay(pageId, allPostesTechniques.size);
    renderScopeTable(pageId);
    await renderWorkSelector(pageId);
}

/**
 * Met à jour l'affichage du filtre (texte du bouton et compteur)
 *
 * @param {string} pageId - ID de la page
 * @param {number} totalPostes - Nombre total de postes techniques
 */
function updatePosteFilterDisplay(pageId, totalPostes) {
    if (!scopeFilters[pageId]) {
        scopeFilters[pageId] = [];
    }

    const selectedCount = scopeFilters[pageId].length;
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
 * Rend le tableau des opérations filtrées
 *
 * @param {string} pageId - ID de la page
 */
function renderScopeTable(pageId) {
    const tbody = document.getElementById(`${pageId}-tbody`);
    const countSpan = document.getElementById(`${pageId}-count`);

    if (!tbody) {
        console.warn(`[SCOPE] Tableau ${pageId}-tbody non trouvé`);
        return;
    }

    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666;">
                    Aucune donnée IW37N disponible.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    // Filtrer les données selon les filtres actifs
    console.log(`[SCOPE] 🔍 Filtres actifs pour ${pageId}:`, scopeFilters[pageId]);
    console.log(`[SCOPE] 📊 Nombre de postes sélectionnés:`, scopeFilters[pageId] ? scopeFilters[pageId].length : 0);

    // Compter les opérations par poste pour le debug
    const operationsParPoste = {};
    iw37nData.forEach(row => {
        const posteTech = getPosteTechnique(row);
        if (posteTech) {
            operationsParPoste[posteTech] = (operationsParPoste[posteTech] || 0) + 1;
        }
    });
    console.log(`[SCOPE] 📋 Opérations disponibles par poste:`, operationsParPoste);

    const filteredData = iw37nData.filter(row => {
        const posteTech = getPosteTechnique(row);
        const isIncluded = scopeFilters[pageId] && scopeFilters[pageId].includes(posteTech);

        // Log détaillé pour les 3 premières lignes
        if (iw37nData.indexOf(row) < 3) {
            console.log(`[SCOPE] 🔬 Ligne ${iw37nData.indexOf(row)}: poste="${posteTech}", inclus=${isIncluded}, filtres=`, scopeFilters[pageId]);
        }

        return isIncluded;
    });

    console.log(`[SCOPE] ✅ ${filteredData.length} opérations correspondent aux ${scopeFilters[pageId] ? scopeFilters[pageId].length : 0} postes sélectionnés`);

    // Compter les opérations filtrées par poste
    const filteredParPoste = {};
    filteredData.forEach(row => {
        const posteTech = getPosteTechnique(row);
        if (posteTech) {
            filteredParPoste[posteTech] = (filteredParPoste[posteTech] || 0) + 1;
        }
    });
    console.log(`[SCOPE] 🎯 Opérations filtrées par poste:`, filteredParPoste);

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666;">
                    Aucune opération ne correspond aux filtres sélectionnés.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    // Rendre les lignes
    tbody.innerHTML = filteredData.map((row, index) => {
        const ordre = row['Ordre'] || row['ordre'] || '-';
        const operation = row['Opération'] || row['Operation'] || '-';
        const designation = row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || row['Désignation'] || row['Designation'] || '-';
        const posteTravOper = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '-';
        const posteTech = getPosteTechnique(row) || '-';

        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';

        // Créer un select pour le statut avec les mêmes valeurs que la Révision
        const statutSelect = `
            <select style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                <option value="">-</option>
                <option value="Nvx Travaux">Nvx Travaux</option>
                <option value="Préparation">Préparation</option>
                <option value="Attente">Attente</option>
                <option value="Exécution">Exécution</option>
                <option value="Terminé">Terminé</option>
                <option value="N/A">N/A</option>
            </select>
        `;

        return `
            <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #dee2e6;">${statutSelect}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${operation}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${designation}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${posteTravOper}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${ordre}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${posteTech}</td>
            </tr>
        `;
    }).join('');

    if (countSpan) {
        countSpan.textContent = filteredData.length;
    }

    console.log(`[SCOPE] Tableau rendu: ${filteredData.length} opérations affichées`);
}

/**
 * Exporte les données SCOPE vers Excel
 *
 * @param {string} pageId - ID de la page
 * @param {string} secteur - Nom du secteur
 */
export function exportScopeToExcel(pageId, secteur) {
    console.log(`[SCOPE] Export Excel pour ${secteur} (${pageId})`);

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[SCOPE] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    const iw37nData = getIw37nData();

    if (!iw37nData || iw37nData.length === 0) {
        alert('⚠️ Aucune donnée IW37N disponible à exporter.');
        return;
    }

    // Filtrer les données selon les filtres actifs
    const filteredData = iw37nData.filter(row => {
        const posteTech = getPosteTechnique(row);
        return scopeFilters[pageId] && scopeFilters[pageId].includes(posteTech);
    });

    if (filteredData.length === 0) {
        alert('⚠️ Aucune donnée filtrée à exporter.');
        return;
    }

    try {
        // Préparer les données pour l'export avec le bon ordre de colonnes
        const exportData = filteredData.map(row => ({
            'Statut': '', // Statut vide par défaut (à remplir manuellement)
            'Opération': row['Opération'] || row['Operation'] || '',
            'Désign. opér.': row['Désign. opér.'] || row['Désign.opération'] || row['Design operation'] || row['Désignation'] || row['Designation'] || '',
            'Post.trav.opér.': row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '',
            'Ordre': row['Ordre'] || row['ordre'] || '',
            'Poste technique': getPosteTechnique(row)
        }));

        // Créer le workbook et la feuille
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, secteur.substring(0, 31)); // Excel limite à 31 caractères

        // Générer le nom de fichier avec la date
        const date = new Date().toISOString().split('T')[0];
        const filename = `scope-${secteur.replace(/\s+/g, '-')}-${date}.xlsx`;

        // Télécharger le fichier
        XLSX.writeFile(wb, filename);

        console.log(`[SCOPE] Export Excel réussi: ${filename}`);
        alert(`✅ Export Excel réussi !\n\n${filteredData.length} opérations exportées pour ${secteur}`);
    } catch (error) {
        console.error('[SCOPE] Erreur lors de l\'export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Définit les filtres SCOPE (appelé par server-sync pour injection)
 * @param {Object} data - Filtres SCOPE depuis le serveur
 */
export function setScopeFilters(data) {
    if (data && typeof data === 'object') {
        scopeFilters = data;
        console.log(`[SCOPE] ✅ Filtres injectés: ${Object.keys(scopeFilters).length} page(s)`);
    }
}

/**
 * Définit les allocations de postes (appelé par server-sync pour injection)
 * @param {Object} data - Allocations depuis le serveur
 */
export function setPosteAllocations(data) {
    if (data && typeof data === 'object') {
        posteAllocations = data;
        console.log(`[SCOPE] ✅ Allocations injectées: ${Object.keys(posteAllocations).length} poste(s)`);
    }
}

/**
 * Initialise le module SCOPE
 */
export function initScope() {
    loadScopeFilters();
    console.log('[OK] Module SCOPE initialisé');
}

// Exposer les fonctions globalement pour server-sync
if (typeof window !== 'undefined') {
    window.setScopeFilters = setScopeFilters;
    window.setPosteAllocations = setPosteAllocations;
    console.log('[SCOPE] ✅ Fonctions setter exposées globalement');
}

export default {
    loadScopeData,
    togglePosteDropdown,
    selectAllPostesTechniques,
    deselectAllPostesTechniques,
    exportScopeToExcel,
    initScope,
    setScopeFilters,
    setPosteAllocations
};
