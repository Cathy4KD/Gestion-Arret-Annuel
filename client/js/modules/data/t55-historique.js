/**
 * @fileoverview Gestion de l'historique des devis et corrections T55
 * @module data/t55-historique
 *
 * @description
 * Gere l'historique complet des devis et corrections avec 12 colonnes:
 * Occ., Revision, Item, Equipement, Ordre, Description des travaux,
 * Materiel fournis par RTFT, Materiel fournis par Entrepreneur,
 * Dessins - References, Gammes, CptrGrpGam, Poste Technique
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Cle de stockage pour l'historique T55
 * @const {string}
 */
const STORAGE_KEY = 't55HistoriqueData';

/**
 * Donnees de l'historique
 * @type {Array}
 */
let historiqueData = [];

/**
 * Pagination
 */
const ROWS_PER_PAGE = 100; // Afficher seulement 100 lignes a la fois
let currentPage = 1;

/**
 * Retourne les donnees de l'historique actuellement en memoire
 * Si les donnees ne sont pas chargees, les charge depuis le serveur
 * @returns {Promise<Array>} Les donnees de l'historique
 */
export async function getHistoriqueData() {
    // Si les donnees ne sont pas encore chargees, les charger
    if (!historiqueData || historiqueData.length === 0) {
        console.log('[T55-HISTORIQUE] Donnees non chargees, chargement depuis le serveur...');
        const saved = await loadFromStorage(STORAGE_KEY);
        if (saved && Array.isArray(saved)) {
            historiqueData = saved;
        } else {
            historiqueData = [];
        }
    }
    return historiqueData;
}

/**
 * Charge les donnees depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadT55HistoriqueData() {
    console.log('[T55-HISTORIQUE] Chargement des donnees depuis le serveur...');
    console.log('[T55-HISTORIQUE] STORAGE_KEY utilisee:', STORAGE_KEY);

    try {
        const saved = await loadFromStorage(STORAGE_KEY);
        console.log('[T55-HISTORIQUE] Donnees recues du serveur:', saved ? `Array de ${saved.length} elements` : 'NULL ou UNDEFINED');

        if (saved && Array.isArray(saved)) {
            historiqueData = saved;
            console.log(`[T55-HISTORIQUE] ${historiqueData.length} entrees chargees depuis le serveur`);
        } else {
            historiqueData = [];
            console.log('[T55-HISTORIQUE] Aucune donnee trouvee, initialisation vide');
        }

        // Attendre que le tbody existe dans le DOM (avec retry)
        let tbody = document.getElementById('t55HistoriqueStandaloneTableBody');
        let retries = 0;
        const maxRetries = 10;

        while (!tbody && retries < maxRetries) {
            console.log(`[T55-HISTORIQUE] Attente du tbody... (tentative ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 50));
            tbody = document.getElementById('t55HistoriqueStandaloneTableBody');
            retries++;
        }

        if (tbody) {
            console.log('[T55-HISTORIQUE] Tableau trouve dans le DOM, rendu...');
            renderHistoriqueTable();
        } else {
            console.warn('[T55-HISTORIQUE] Tableau non trouve apres 10 tentatives - donnees chargees mais pas affichees');
        }
    } catch (error) {
        console.error('[T55-HISTORIQUE] Erreur lors du chargement:', error);
        historiqueData = [];

        // Tenter de rendre uniquement si le tableau existe
        const tbody = document.getElementById('t55HistoriqueStandaloneTableBody');
        if (tbody) {
            renderHistoriqueTable();
        }
    }
}

/**
 * Sauvegarde les donnees sur le SERVEUR uniquement (AUCUN localStorage)
 * @returns {Promise<void>}
 */
async function saveHistoriqueData() {
    await saveToStorage(STORAGE_KEY, historiqueData);
    console.log('[T55-HISTORIQUE] Donnees sauvegardees sur le serveur');
}

/**
 * Upload et parse un fichier Excel
 * @param {Event} event - Event du input file
 * @returns {void}
 */
export function uploadHistoriqueExcel(event) {
    console.log('[T55-HISTORIQUE] Fonction uploadHistoriqueExcel() appelee');
    const file = event.target.files[0];
    if (!file) {
        console.warn('[T55-HISTORIQUE] Aucun fichier selectionne');
        return;
    }

    console.log('[T55-HISTORIQUE] Fichier selectionne:', file.name);

    if (typeof XLSX === 'undefined') {
        alert('Bibliotheque XLSX non chargee');
        console.error('[T55-HISTORIQUE] Bibliotheque XLSX non disponible');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            console.log('[T55-HISTORIQUE] Lecture du fichier en cours...');
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            console.log('[T55-HISTORIQUE] Donnees extraites:', jsonData.length, 'lignes');

            if (jsonData.length === 0) {
                alert('Le fichier Excel est vide');
                return;
            }

            // Demander confirmation si des donnees existent deja
            if (historiqueData.length > 0) {
                const confirm = window.confirm(
                    `Vous avez deja ${historiqueData.length} entree(s) enregistree(s).\n\n` +
                    `Cette importation va ajouter ${jsonData.length} nouvelles entrees.\n\n` +
                    `Continuer?`
                );
                if (!confirm) {
                    console.log('[T55-HISTORIQUE] Import annule par l\'utilisateur');
                    return;
                }
            }

            // Mapper les donnees Excel vers notre structure
            const newEntries = jsonData.map(row => ({
                id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                occ: row['Occ.'] || row['Occ'] || row['OCC'] || row['OCC.'] || '',
                revision: row['Revison'] || row['Revision'] || row['REVISION'] || '',
                item: row['Item'] || row['ITEM'] || row['item'] || '',
                equipement: row['Equipement'] || row['EQUIPEMENT'] || '',
                ordre: row['ordre'] || row['Ordre'] || row['ORDRE'] || row['# Ordre'] || row['#Ordre'] || '',
                descriptionTravaux: row['Description des travaux'] || row['Description'] || row['DESCRIPTION DES TRAVAUX'] || '',
                materielRTFT: row['Materiel fournis par RTFT'] || row['Materiel RTFT'] || row['MATERIEL FOURNI PAR RTFT'] || '',
                materielEntrepreneur: row['Materiel fournis par Entrepreneur'] || row['Materiel Entr.'] || row['MATERIEL FOURNI PAR ENTREPRENEUR'] || '',
                dessinsReferences: row['Dessins - References'] || row['Dessins - Ref.'] || row['Dessins/ref.'] || row['DESSINS/REFERENCES'] || row['Dessins'] || '',
                gammes: row['Gammes'] || row['GAMMES'] || row['gammes'] || '',
                cptrGrpGam: row['CptrGrpGam'] || row['CPTRGRPGAM'] || '',
                posteTechnique: row['Poste Technique'] || row['POSTE TECHNIQUE'] || ''
            }));

            // Ajouter aux donnees existantes
            console.log('[T55-HISTORIQUE] Ajout de', newEntries.length, 'nouvelles entrees');

            historiqueData = [...historiqueData, ...newEntries];
            console.log('[T55-HISTORIQUE] Nouveau total:', historiqueData.length, 'entrees');

            // Aller a la premiere page pour voir les donnees
            currentPage = 1;

            // Rendre le tableau IMMEDIATEMENT (avant la sauvegarde)
            renderHistoriqueTable();

            // Sauvegarder en arriere-plan
            await saveHistoriqueData();

            alert(`${newEntries.length} entree(s) importee(s) depuis Excel\n\nAffichage des 100 premieres lignes (utilisez la pagination pour voir plus)`);
            console.log('[T55-HISTORIQUE] Import Excel reussi');

            // Reinitialiser l'input pour permettre de recharger le meme fichier
            event.target.value = '';

        } catch (error) {
            console.error('[T55-HISTORIQUE] Erreur lors de l\'import Excel:', error);
            alert('Erreur lors de l\'import du fichier Excel');
        }
    };

    reader.onerror = () => {
        console.error('[T55-HISTORIQUE] Erreur de lecture du fichier');
        alert('Erreur lors de la lecture du fichier');
    };

    reader.readAsArrayBuffer(file);
}

/**
 * Ajoute manuellement une nouvelle entree (ligne vide)
 * @returns {void}
 */
export async function addHistoriqueRow() {
    console.log('[T55-HISTORIQUE] Fonction addHistoriqueRow() appelee');

    const newEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        occ: '',
        revision: '',
        item: '',
        equipement: '',
        ordre: '',
        descriptionTravaux: '',
        materielRTFT: '',
        materielEntrepreneur: '',
        dessinsReferences: '',
        gammes: '',
        cptrGrpGam: '',
        posteTechnique: ''
    };

    console.log('[T55-HISTORIQUE] Ajout de la nouvelle entree avec ID:', newEntry.id);
    historiqueData.push(newEntry);
    console.log('[T55-HISTORIQUE] Nouveau nombre total d\'entrees:', historiqueData.length);

    // Aller a la derniere page pour voir la nouvelle ligne
    const totalPages = Math.ceil(historiqueData.length / ROWS_PER_PAGE);
    currentPage = totalPages;
    console.log('[T55-HISTORIQUE] Navigation vers la derniere page:', currentPage);

    // Rendre le tableau IMMEDIATEMENT (avant la sauvegarde)
    renderHistoriqueTable();

    // Sauvegarder en arriere-plan
    await saveHistoriqueData();

    console.log('[T55-HISTORIQUE] Nouvelle ligne vide ajoutee et affichee dans le tableau');
}

/**
 * Echappe les caracteres HTML pour eviter les problemes d'affichage
 * @param {string} str - Chaine a echapper
 * @returns {string} - Chaine echappee
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Met a jour un champ d'une entree
 * @param {string} entryId - ID de l'entree
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 */
async function updateHistoriqueField(entryId, field, value) {
    const entry = historiqueData.find(e => e.id === entryId);
    if (entry) {
        entry[field] = value;
        await saveHistoriqueData();
        console.log(`[T55-HISTORIQUE] Champ ${field} mis a jour pour l'entree ${entryId}`);
    }
}

/**
 * Supprime une entree
 * @param {string} entryId - ID de l'entree
 */
async function deleteHistoriqueEntry(entryId) {
    const entry = historiqueData.find(e => e.id === entryId);
    if (!entry) return;

    historiqueData = historiqueData.filter(e => e.id !== entryId);
    await saveHistoriqueData();
    renderHistoriqueTable();

    console.log('[T55-HISTORIQUE] Entree supprimee:', entry.occ);
}

/**
 * Rend le tableau de l'historique avec pagination
 * @returns {void}
 */
function renderHistoriqueTable() {
    console.log('[T55-HISTORIQUE] Debut du rendu du tableau...');

    const tbody = document.getElementById('t55HistoriqueStandaloneTableBody');
    const countSpan = document.getElementById('t55HistoriqueCount');
    const paginationDiv = document.getElementById('t55HistoriquePagination');

    // Si les elements n'existent pas, la page n'est pas affichee - sortir silencieusement
    if (!tbody) {
        console.error('[T55-HISTORIQUE] TBODY INTROUVABLE! Sortie sans rendu.');
        return;
    }

    const totalCount = historiqueData.length;
    const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE);

    // S'assurer que currentPage est valide
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    if (countSpan) {
        countSpan.textContent = totalCount;
    }

    if (historiqueData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" style="padding: 20px; text-align: center; color: #666; border: 1px solid #dee2e6; font-size: 11px;">
                    Aucune entree dans l'historique. Cliquez sur "Upload Excel" ou "Ajouter Ligne".
                </td>
            </tr>
        `;
        if (paginationDiv) paginationDiv.innerHTML = '';
        return;
    }

    // Calculer les indices de debut et fin pour la page courante
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalCount);
    const pageData = historiqueData.slice(startIndex, endIndex);

    console.log(`[T55-HISTORIQUE] Affichage page ${currentPage}/${totalPages} (lignes ${startIndex + 1}-${endIndex} sur ${totalCount})`);

    try {
        // Vider le tbody
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        // Creer les lignes UNE PAR UNE avec createElement (plus fiable)
        pageData.forEach((entry, index) => {
            const actualIndex = startIndex + index;
            const bgColor = actualIndex % 2 === 0 ? 'white' : '#f9f9f9';

            // Creer la ligne
            const row = document.createElement('tr');
            row.style.cssText = `
                background: ${bgColor} !important;
                height: 22px;
            `;

            // Creer chaque cellule
            const cells = [
                { field: 'occ', type: 'input' },
                { field: 'revision', type: 'input' },
                { field: 'item', type: 'input' },
                { field: 'equipement', type: 'input' },
                { field: 'ordre', type: 'input' },
                { field: 'descriptionTravaux', type: 'textarea' },
                { field: 'materielRTFT', type: 'textarea' },
                { field: 'materielEntrepreneur', type: 'textarea' },
                { field: 'dessinsReferences', type: 'input' },
                { field: 'gammes', type: 'input' },
                { field: 'cptrGrpGam', type: 'input' },
                { field: 'posteTechnique', type: 'input' }
            ];

            cells.forEach(({ field, type }) => {
                const td = document.createElement('td');
                td.style.cssText = `
                    padding: 2px 4px !important;
                    border: 1px solid #dee2e6 !important;
                    font-size: 11px !important;
                    line-height: 1.2 !important;
                    vertical-align: middle !important;
                `;

                if (type === 'input') {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = entry[field] || '';
                    input.style.cssText = `
                        width: 100% !important;
                        padding: 2px 3px !important;
                        font-size: 10px !important;
                        line-height: 1.2 !important;
                        height: 18px !important;
                        border: 1px solid #ddd !important;
                        box-sizing: border-box !important;
                    `;
                    input.addEventListener('change', () => {
                        updateHistoriqueField(entry.id, field, input.value);
                    });
                    td.appendChild(input);
                } else if (type === 'textarea') {
                    const textarea = document.createElement('textarea');
                    textarea.value = entry[field] || '';
                    textarea.style.cssText = `
                        width: 100% !important;
                        padding: 2px 3px !important;
                        font-size: 10px !important;
                        line-height: 1.2 !important;
                        min-height: 18px !important;
                        resize: vertical !important;
                        border: 1px solid #ddd !important;
                        box-sizing: border-box !important;
                    `;
                    textarea.addEventListener('change', () => {
                        updateHistoriqueField(entry.id, field, textarea.value);
                    });
                    td.appendChild(textarea);
                }

                row.appendChild(td);
            });

            // Ajouter la cellule d'action (bouton supprimer)
            const actionTd = document.createElement('td');
            actionTd.style.cssText = `
                padding: 2px 4px !important;
                border: 1px solid #dee2e6 !important;
                text-align: center !important;
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.style.cssText = `
                padding: 2px 5px !important;
                font-size: 10px !important;
                line-height: 1.2 !important;
                background: #dc3545 !important;
                color: white !important;
                border: none !important;
                cursor: pointer !important;
            `;
            deleteBtn.addEventListener('click', () => {
                deleteHistoriqueEntry(entry.id);
            });

            actionTd.appendChild(deleteBtn);
            row.appendChild(actionTd);

            // Ajouter la ligne au tbody
            tbody.appendChild(row);
        });

        console.log(`[T55-HISTORIQUE] ${pageData.length} lignes ajoutees au tbody`);

        // Forcer un repaint/reflow du DOM
        tbody.style.display = 'none';
        tbody.offsetHeight; // Force reflow
        tbody.style.display = '';

        // Afficher les controles de pagination
        if (paginationDiv && totalPages > 1) {
            let paginationHTML = `
                <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 20px;">
                    <button onclick="window.t55Historique.goToPage(1)"
                            ${currentPage === 1 ? 'disabled' : ''}
                            style="padding: 8px 12px; background: ${currentPage === 1 ? '#ccc' : '#667eea'}; color: white; border: none; border-radius: 4px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
                        Premiere
                    </button>
                    <button onclick="window.t55Historique.goToPage(${currentPage - 1})"
                            ${currentPage === 1 ? 'disabled' : ''}
                            style="padding: 8px 12px; background: ${currentPage === 1 ? '#ccc' : '#667eea'}; color: white; border: none; border-radius: 4px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
                        Precedent
                    </button>
                    <span style="padding: 8px 16px; background: #f0f0f0; border-radius: 4px; font-weight: bold;">
                        Page ${currentPage} / ${totalPages}
                    </span>
                    <button onclick="window.t55Historique.goToPage(${currentPage + 1})"
                            ${currentPage === totalPages ? 'disabled' : ''}
                            style="padding: 8px 12px; background: ${currentPage === totalPages ? '#ccc' : '#667eea'}; color: white; border: none; border-radius: 4px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
                        Suivant
                    </button>
                    <button onclick="window.t55Historique.goToPage(${totalPages})"
                            ${currentPage === totalPages ? 'disabled' : ''}
                            style="padding: 8px 12px; background: ${currentPage === totalPages ? '#ccc' : '#667eea'}; color: white; border: none; border-radius: 4px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
                        Derniere
                    </button>
                    <span style="color: #666; margin-left: 20px;">
                        (Lignes ${startIndex + 1}-${endIndex} sur ${totalCount})
                    </span>
                </div>
            `;
            paginationDiv.innerHTML = paginationHTML;
        } else if (paginationDiv) {
            paginationDiv.innerHTML = '';
        }

    } catch (error) {
        console.error('[T55-HISTORIQUE] ERREUR lors du rendu du tableau:', error);

        // Afficher un message d'erreur dans le tableau
        tbody.innerHTML = `
            <tr>
                <td colspan="13" style="padding: 30px; text-align: center; color: #dc3545; border: 1px solid #dee2e6;">
                    Erreur lors de l'affichage des donnees. Consultez la console (F12) pour plus de details.
                </td>
            </tr>
        `;
    }
}

/**
 * Change de page
 * @param {number} page - Numero de page
 */
function goToPage(page) {
    console.log('[T55-HISTORIQUE] Navigation vers la page:', page);
    currentPage = page;
    renderHistoriqueTable();
}

/**
 * Exporte l'historique vers Excel
 */
export function exportHistoriqueToExcel() {
    console.log('[T55-HISTORIQUE] Fonction exportHistoriqueToExcel() appelee');
    if (historiqueData.length === 0) {
        alert('Aucune entree a exporter.');
        return;
    }

    try {
        const exportData = historiqueData.map(entry => ({
            'Occ.': entry.occ || '',
            'Revision': entry.revision || '',
            'Item': entry.item || '',
            'Equipement': entry.equipement || '',
            'Ordre': entry.ordre || '',
            'Description des travaux': entry.descriptionTravaux || '',
            'Materiel fournis par RTFT': entry.materielRTFT || '',
            'Materiel fournis par Entrepreneur': entry.materielEntrepreneur || '',
            'Dessins - References': entry.dessinsReferences || '',
            'Gammes': entry.gammes || '',
            'CptrGrpGam': entry.cptrGrpGam || '',
            'Poste Technique': entry.posteTechnique || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('Bibliotheque XLSX non chargee');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Historique T55');

        ws['!cols'] = autoSizeColumns(ws, exportData);

        const fileName = `Historique_T55_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[T55-HISTORIQUE] Export Excel reussi');
    } catch (error) {
        console.error('[T55-HISTORIQUE] Erreur export Excel:', error);
        alert('Erreur lors de l\'export Excel.');
    }
}

/**
 * Efface toutes les donnees du tableau
 */
export async function clearAllHistoriqueData() {
    console.log('[T55-HISTORIQUE] Fonction clearAllHistoriqueData() appelee');

    if (!confirm('Etes-vous sur de vouloir supprimer TOUTES les donnees de l\'historique?\n\nCette action est irreversible!')) {
        console.log('[T55-HISTORIQUE] Suppression annulee par l\'utilisateur');
        return;
    }

    historiqueData = [];
    await saveHistoriqueData();
    currentPage = 1;
    renderHistoriqueTable();

    console.log('[T55-HISTORIQUE] Toutes les donnees ont ete supprimees');
    alert('Toutes les donnees ont ete supprimees avec succes.');
}

/**
 * Fonction de diagnostic pour deboguer les problemes d'affichage
 */
function diagnoseHistoriqueTable() {
    console.log('=== DIAGNOSTIC T55 HISTORIQUE ===');
    console.log('1. Nombre total d\'entrees dans historiqueData:', historiqueData.length);
    console.log('2. Page courante:', currentPage);
    console.log('3. Lignes par page:', ROWS_PER_PAGE);
    console.log('4. Nombre total de pages:', Math.ceil(historiqueData.length / ROWS_PER_PAGE));
    console.log('5. Echantillon des 3 premieres entrees:', historiqueData.slice(0, 3));

    const tbody = document.getElementById('t55HistoriqueStandaloneTableBody');
    console.log('6. Element tbody trouve:', !!tbody);

    if (tbody) {
        console.log('7. Nombre de lignes <tr> dans tbody:', tbody.querySelectorAll('tr').length);
        console.log('8. InnerHTML du tbody (200 premiers caracteres):', tbody.innerHTML.substring(0, 200));
        console.log('9. Tbody offsetHeight (hauteur visible):', tbody.offsetHeight, 'px');
        console.log('10. Tbody offsetWidth (largeur visible):', tbody.offsetWidth, 'px');
    }

    const countSpan = document.getElementById('t55HistoriqueCount');
    console.log('11. Compteur affiche:', countSpan?.textContent);

    console.log('12. Tentative de re-rendu...');
    renderHistoriqueTable();

    console.log('=== FIN DIAGNOSTIC ===');
}

// Exposer les fonctions globalement
console.log('[T55-HISTORIQUE] Exposition des fonctions globales...');
if (typeof window !== 'undefined') {
    // Exposer dans l'objet window.t55Historique pour correspondre au HTML
    window.t55Historique = {
        uploadFromExcel: uploadHistoriqueExcel,
        addRow: addHistoriqueRow,
        exportToExcel: exportHistoriqueToExcel,
        loadData: loadT55HistoriqueData,
        diagnose: diagnoseHistoriqueTable,
        goToPage: goToPage,
        clearAll: clearAllHistoriqueData,
        forceRender: renderHistoriqueTable,
        getData: () => historiqueData
    };

    // Exposer aussi loadT55HistoriqueData directement pour navigation.js
    window.loadT55HistoriqueData = loadT55HistoriqueData;

    window.t55HistoriqueActions = {
        updateField: updateHistoriqueField,
        deleteEntry: deleteHistoriqueEntry
    };

    console.log('[T55-HISTORIQUE] Module charge - Fonctions exposees globalement');
}
