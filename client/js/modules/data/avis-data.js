/**
 * @fileoverview Gestion des données AVIS
 * @module data/avis-data
 *
 * Gère l'importation, l'affichage et l'export des avis
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getOrderMetadata, subscribe as subscribeToMetadata } from './order-metadata.js';
import { renderOrderMetadataUI } from '../ui/order-metadata-ui.js';

/**
 * Clé de stockage pour les données des avis
 * @const {string}
 */
const STORAGE_KEY = 'avisData';

/**
 * Données des avis
 * @type {Array<Object>}
 */
let avisData = [];

/**
 * Définit les données des avis (appelé par server-sync)
 * @param {Array<Object>} data - Nouvelles données
 */
export function setAvisData(data) {
    if (Array.isArray(data)) {
        avisData = data;
        console.log(`[AVIS] ✅ ${avisData.length} avis injectés depuis le serveur`);
    }
}

// Exposer setAvisData globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setAvisData = setAvisData;
    console.log('[AVIS] ✅ window.setAvisData exposée');
}

/**
 * Colonnes attendues dans le fichier Excel
 * @const {Array<string>}
 */
const EXPECTED_COLUMNS = [
    'PosteTravPrinc.',
    'Ordre',
    'Créé le',
    'Avis',
    'Poste technique',
    'Description',
    'Priorité',
    'Créé par',
    'Code ABC',
    'N° modèle',
    'Statut util.',
    'Statut système',
    'Pièce jointe',
    'Tém. stat.'
];

/**
 * Initialise la page des avis
 */
export function initAvisPage() {
    console.log('[AVIS] Initialisation de la page AVIS...');

    // Charger les données depuis le stockage
    loadAvisData().then(() => {
        console.log(`[AVIS] Données chargées: ${avisData.length} avis`);

        // Afficher le tableau
        renderAvisTable();

        // Mettre à jour les statistiques
        updateStatistics();

        // S'abonner aux changements de métadonnées pour rafraîchir le tableau
        subscribeToMetadata(() => {
            renderAvisTable();
        });

        console.log('[AVIS] ✅ Page AVIS initialisée');
    });
}

/**
 * Charge les données des avis depuis le stockage
 */
async function loadAvisData() {
    try {
        console.log('[AVIS] 📥 Chargement des données depuis le serveur...');
        const saved = await loadFromStorage(STORAGE_KEY);

        if (saved && saved.avis && Array.isArray(saved.avis)) {
            // Format: { avis: [...] }
            avisData = saved.avis;
            console.log(`[AVIS] ✅ ${avisData.length} avis chargés depuis le stockage`);
        } else if (saved && Array.isArray(saved)) {
            // Format direct: [...]
            avisData = saved;
            console.log(`[AVIS] ✅ ${avisData.length} avis chargés depuis le stockage`);
        } else {
            avisData = [];
            console.log('[AVIS] ℹ️ Aucune donnée sauvegardée');
        }
    } catch (error) {
        console.error('[AVIS] ❌ Erreur lors du chargement:', error);
        avisData = [];
    }
}

/**
 * Sauvegarde les données des avis
 */
async function saveAvisData() {
    try {
        // Sauvegarder dans le format attendu : { avis: [...] }
        const dataToSave = {
            avis: avisData,
            lastUpdated: new Date().toISOString()
        };
        
        await saveToStorage(STORAGE_KEY, dataToSave);
        console.log(`[AVIS] ✅ ${avisData.length} avis sauvegardés`);
        return true;
    } catch (error) {
        console.error('[AVIS] ❌ Erreur lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Gère l'import d'un fichier Excel
 * @param {Event} event - Event du input file
 */
export async function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('❌ Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
    }

    try {
        console.log(`[AVIS] 📤 Import du fichier: ${file.name}`);
        
        // Vérifier que XLSX est chargé
        if (typeof XLSX === 'undefined') {
            console.error('[AVIS] ❌ XLSX non chargé!');
            alert('❌ Erreur: La bibliothèque Excel n\'est pas chargée.\n\nRafraîchissez la page et réessayez.');
            return;
        }

        console.log('[AVIS] Lecture du fichier...');
        const data = await file.arrayBuffer();
        
        console.log('[AVIS] Parsing Excel...');
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        console.log(`[AVIS] ${jsonData.length} lignes lues`);

        if (jsonData.length === 0) {
            alert('❌ Le fichier est vide ou mal formaté');
            return;
        }

        // Vérifier que les colonnes essentielles existent
        const firstRow = jsonData[0];
        console.log('[AVIS] Colonnes trouvées:', Object.keys(firstRow));
        
        const hasRequiredColumns = ['Ordre', 'Avis'].some(col =>
            Object.keys(firstRow).some(key => key.includes(col))
        );

        if (!hasRequiredColumns) {
            alert('⚠️ Le fichier ne contient pas les colonnes attendues.\n\nColonnes trouvées: ' + Object.keys(firstRow).join(', '));
        }

        // Remplacer les données
        avisData = jsonData;
        console.log(`[AVIS] ${avisData.length} avis en mémoire`);

        // Sauvegarder
        console.log('[AVIS] Sauvegarde sur le serveur...');
        const saveSuccess = await saveAvisData();
        console.log(`[AVIS] Sauvegarde: ${saveSuccess ? 'OK' : 'ÉCHEC'}`);

        // Afficher le tableau
        console.log('[AVIS] Rendu du tableau...');
        renderAvisTable();
        updateStatistics();

        // Réinitialiser l'input file
        event.target.value = '';

        if (saveSuccess) {
            alert(`✅ Import réussi!\n\n${avisData.length} avis importés et sauvegardés.`);
        } else {
            alert(`⚠️ Import réussi MAIS non sauvegardé sur le serveur!\n\n${avisData.length} avis importés.\n\nVérifiez que le serveur est démarré.`);
        }

        console.log(`[AVIS] ✅ ${avisData.length} avis importés`);

    } catch (error) {
        console.error('[AVIS] ❌ Erreur lors de l\'import:', error);
        alert('❌ Erreur lors de la lecture du fichier.\n\nVérifiez que le fichier est un Excel valide.');
    }
}

/**
 * Affiche le tableau des avis
 */
function renderAvisTable() {
    console.log(`[AVIS] 📊 Rendu du tableau avec ${avisData.length} avis`);
    const tbody = document.getElementById('avis-tbody');

    if (!tbody) {
        console.error('[AVIS] ⚠️ Élément avis-tbody introuvable');
        return;
    }

    if (!Array.isArray(avisData) || avisData.length === 0) {
        console.log('[AVIS] Tableau vide - aucune donnée');
        tbody.innerHTML = `
            <tr>
                <td colspan="14" style="padding: 40px; text-align: center; color: #666;">
                    <div style="font-size: 1.2em; margin-bottom: 10px;">📋 Aucun avis importé</div>
                    <div style="font-size: 0.9em; color: #999;">Utilisez le bouton "Choisir un fichier Excel" pour importer vos avis</div>
                </td>
            </tr>
        `;
        return;
    }

    // Appliquer les filtres
    const filtered = applyFilters();
    console.log(`[AVIS] Après filtrage: ${filtered.length} avis à afficher`);

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15" style="padding: 40px; text-align: center; color: #666;">
                    <div style="font-size: 1.2em; margin-bottom: 10px;">🔍 Aucun résultat</div>
                    <div style="font-size: 0.9em; color: #999;">Essayez de modifier vos filtres</div>
                </td>
            </tr>
        `;
        document.getElementById('avis-filtered-count').textContent = '0';
        return;
    }

    tbody.innerHTML = filtered.map((avis, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        const ordre = avis['Ordre'] || '';

        // Récupérer les métadonnées pour cet ordre
        const metadata = ordre ? getOrderMetadata(ordre) : null;
        const hasMetadata = metadata && (metadata.comments.length > 0 || metadata.status || metadata.documents.length > 0);

        return `
            <tr style="background: ${bgColor};">
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['PosteTravPrinc.'] || avis['PosteTravPrinc'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(ordre)}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Créé le'] || avis['Cree le'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6; font-weight: 600; color: #667eea;">${escapeHtml(avis['Avis'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Poste technique'] || avis['PosteTechnique'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6; max-width: 300px; white-space: pre-wrap;">${escapeHtml(avis['Description'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Priorité'] || avis['Priorite'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Créé par'] || avis['Cree par'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Code ABC'] || avis['CodeABC'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['N° modèle'] || avis['No modele'] || avis['Numero modele'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Statut util.'] || avis['Statut util'] || avis['StatutUtil'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Statut système'] || avis['Statut systeme'] || avis['StatutSysteme'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Pièce jointe'] || avis['Piece jointe'] || avis['PieceJointe'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6;">${escapeHtml(avis['Tém. stat.'] || avis['Tem stat'] || avis['TemStat'] || '')}</td>
                <td style="padding: 10px 8px; border: 1px solid #dee2e6; text-align: center;">
                    ${renderMetadataBadge(ordre, metadata)}
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('avis-filtered-count').textContent = filtered.length;
}

/**
 * Applique les filtres de recherche
 * @returns {Array} Données filtrées
 */
function applyFilters() {
    const globalSearch = (document.getElementById('avis-search-global')?.value || '').toLowerCase();
    const posteFilter = (document.getElementById('avis-filter-poste')?.value || '').toLowerCase();
    const ordreFilter = (document.getElementById('avis-filter-ordre')?.value || '').toLowerCase();

    return avisData.filter(avis => {
        // Filtre global
        if (globalSearch) {
            const allValues = Object.values(avis).join(' ').toLowerCase();
            if (!allValues.includes(globalSearch)) {
                return false;
            }
        }

        // Filtre poste technique
        if (posteFilter) {
            const poste = (avis['Poste technique'] || avis['PosteTechnique'] || '').toLowerCase();
            if (!poste.includes(posteFilter)) {
                return false;
            }
        }

        // Filtre ordre
        if (ordreFilter) {
            const ordre = (avis['Ordre'] || '').toLowerCase();
            if (!ordre.includes(ordreFilter)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Filtre le tableau
 */
export function filterTable() {
    renderAvisTable();
}

/**
 * Réinitialise les filtres
 */
export function resetFilters() {
    const globalInput = document.getElementById('avis-search-global');
    const posteInput = document.getElementById('avis-filter-poste');
    const ordreInput = document.getElementById('avis-filter-ordre');

    if (globalInput) globalInput.value = '';
    if (posteInput) posteInput.value = '';
    if (ordreInput) ordreInput.value = '';

    renderAvisTable();
}

/**
 * Met à jour les statistiques
 */
function updateStatistics() {
    const totalCount = document.getElementById('avis-total-count');
    const activeCount = document.getElementById('avis-active-count');
    const ordersCount = document.getElementById('avis-orders-count');

    if (totalCount) {
        totalCount.textContent = avisData.length;
    }

    // Compter les avis actifs (ceux qui ont un statut util. actif)
    if (activeCount) {
        const active = avisData.filter(a => {
            const statut = (a['Statut util.'] || a['Statut util'] || '').toLowerCase();
            return statut.includes('actif') || statut.includes('ouvert') || statut === '';
        }).length;
        activeCount.textContent = active;
    }

    // Compter les ordres uniques
    if (ordersCount) {
        const uniqueOrders = new Set(avisData.map(a => a['Ordre'] || '').filter(o => o));
        ordersCount.textContent = uniqueOrders.size;
    }
}

/**
 * Exporte les données vers Excel
 */
export function exportToExcel() {
    if (!Array.isArray(avisData) || avisData.length === 0) {
        alert('❌ Aucune donnée à exporter');
        return;
    }

    try {
        // Créer le workbook
        const ws = XLSX.utils.json_to_sheet(avisData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Avis');

        // Générer le nom de fichier avec la date
        const date = new Date().toISOString().split('T')[0];
        const filename = `avis-${date}.xlsx`;

        // Télécharger
        XLSX.writeFile(wb, filename);

        console.log(`[AVIS] ✅ Export réussi: ${filename}`);
        alert(`✅ Export réussi!\n\n${avisData.length} avis exportés dans ${filename}`);

    } catch (error) {
        console.error('[AVIS] ❌ Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export vers Excel');
    }
}

/**
 * Efface toutes les données
 */
export async function clearAllData() {
    if (!Array.isArray(avisData) || avisData.length === 0) {
        alert('ℹ️ Aucune donnée à effacer');
        return;
    }

    const confirmDelete = confirm(
        `⚠️ ATTENTION\n\nVous êtes sur le point de supprimer ${avisData.length} avis.\n\nCette action est irréversible.\n\nVoulez-vous continuer?`
    );

    if (!confirmDelete) {
        return;
    }

    avisData = [];
    await saveAvisData();
    renderAvisTable();
    updateStatistics();

    alert('✅ Toutes les données ont été effacées');
    console.log('[AVIS] 🗑️ Toutes les données effacées');
}

/**
 * Recharge les données depuis le serveur
 */
export async function reloadData() {
    try {
        console.log('[AVIS] 🔄 Rechargement des données...');
        
        await loadAvisData();
        renderAvisTable();
        updateStatistics();
        
        if (avisData.length > 0) {
            alert(`✅ Données rechargées!\n\n${avisData.length} avis récupérés depuis le serveur.`);
        } else {
            alert('ℹ️ Aucune donnée trouvée sur le serveur.\n\nImportez un fichier Excel pour commencer.');
        }
    } catch (error) {
        console.error('[AVIS] ❌ Erreur lors du rechargement:', error);
        alert('❌ Erreur lors du rechargement des données.');
    }
}

/**
 * Échappe les caractères HTML
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Génère un badge de métadonnées pour un ordre
 * @param {string} ordre - Numéro d'ordre
 * @param {Object} metadata - Métadonnées de l'ordre
 * @returns {string} HTML du badge
 */
function renderMetadataBadge(ordre, metadata) {
    if (!ordre) return '<span style="color: #999;">-</span>';

    if (!metadata) {
        metadata = getOrderMetadata(ordre);
    }

    const hasComments = metadata.comments && metadata.comments.length > 0;
    const hasStatus = metadata.status && metadata.status !== '';
    const hasDocuments = metadata.documents && metadata.documents.length > 0;
    const hasAnyMetadata = hasComments || hasStatus || hasDocuments;

    const statusColor = hasStatus ? getStatusColor(metadata.status) : '#6c757d';

    return `
        <button onclick="window.avisActions.showMetadataModal('${escapeHtml(ordre)}')"
                style="background: ${hasAnyMetadata ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e9ecef'};
                       color: ${hasAnyMetadata ? 'white' : '#6c757d'};
                       border: none;
                       padding: 8px 15px;
                       border-radius: 6px;
                       cursor: pointer;
                       font-size: 0.85em;
                       font-weight: bold;
                       transition: all 0.2s ease;
                       box-shadow: ${hasAnyMetadata ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'};"
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'">
            ${hasStatus ? `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; margin-right: 5px;"></span>` : ''}
            ${hasComments ? `💬 ${metadata.comments.length}` : ''}
            ${hasComments && hasDocuments ? ' • ' : ''}
            ${hasDocuments ? `📎 ${metadata.documents.length}` : ''}
            ${!hasAnyMetadata ? '➕ Ajouter' : ''}
        </button>
    `;
}

/**
 * Retourne la couleur associée à un statut
 * @param {string} status - Statut
 * @returns {string} Code couleur
 */
function getStatusColor(status) {
    const statusColors = {
        'A planifier': '#ffc107',
        'Planifié': '#28a745',
        'En cours': '#007bff',
        'En attente': '#fd7e14',
        'Bloqué': '#dc3545',
        'Terminé': '#20c997',
        'Annulé': '#6c757d'
    };
    return statusColors[status] || '#6c757d';
}

/**
 * Affiche une modale avec les métadonnées d'un ordre
 * @param {string} ordre - Numéro d'ordre
 */
export function showMetadataModal(ordre) {
    if (!ordre) return;

    // Créer la modale
    const modal = document.createElement('div');
    modal.id = 'metadata-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
    `;

    modalContent.innerHTML = `
        <div style="padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #333;">📋 Suivi de l'ordre ${escapeHtml(ordre)}</h2>
                <button onclick="document.getElementById('metadata-modal').remove()"
                        style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.1em;">
                    ✖ Fermer
                </button>
            </div>
            ${renderOrderMetadataUI(ordre, {
                showComments: true,
                showStatus: true,
                showDocuments: true,
                compact: false,
                source: 'Page AVIS'
            })}
        </div>
    `;

    modal.appendChild(modalContent);

    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.avisActions = {
        handleFileUpload,
        reloadData,
        exportToExcel,
        clearAllData,
        filterTable,
        resetFilters,
        showMetadataModal
    };
    console.log('[AVIS] ✅ window.avisActions exposé globalement');
}


