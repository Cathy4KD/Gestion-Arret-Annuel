/**
 * Controller pour la page Detail T56
 * @module pages/detail-t56-controller
 *
 * Cette page gere la liste des INSPECTIONS NDT (Post.trav.oper. = MECEXT15)
 */

import { loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Etat local de la page
 */
let pageState = {
    ndtData: [],
    isInitialized: false
};

/**
 * Initialise la page et charge les donnees
 */
export async function init() {
    console.log('[DETAIL-T56] Initialisation de la page NDT...');

    try {
        // Charger les donnees IW37N depuis le serveur
        await loadNDTData();

        // Rendre le tableau
        renderNDTTable();

        pageState.isInitialized = true;
        console.log('[DETAIL-T56] Page initialisee avec succes');

    } catch (error) {
        console.error('[DETAIL-T56] Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de la page');
    }
}

/**
 * Charge et filtre les donnees IW37N pour NDT
 */
async function loadNDTData() {
    try {
        // Charger toutes les donnees IW37N
        const iw37nData = await loadFromStorage('iw37nData');

        if (!iw37nData || !Array.isArray(iw37nData)) {
            console.warn('[DETAIL-T56] Aucune donnee IW37N trouvee');
            pageState.ndtData = [];
            return;
        }

        // Filtrer par Post.trav.oper. = MECEXT15
        pageState.ndtData = iw37nData.filter(row => {
            const posteTrav = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['posteTravOper'] || '';
            return posteTrav.toString().trim().toUpperCase() === 'MECEXT15';
        });

        console.log(`[DETAIL-T56] ${pageState.ndtData.length} inspections NDT trouvees sur ${iw37nData.length} ordres`);

    } catch (error) {
        console.error('[DETAIL-T56] Erreur lors du chargement des donnees NDT:', error);
        pageState.ndtData = [];
    }
}

/**
 * Rend le tableau NDT
 */
function renderNDTTable() {
    const tbody = document.getElementById('ndtTableBody');
    const countSpan = document.getElementById('ndtCount');

    if (!tbody) {
        console.warn('[DETAIL-T56] Element ndtTableBody non trouve');
        return;
    }

    if (pageState.ndtData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 20px; text-align: center; color: #666;">
                    Aucune inspection NDT trouvee (Post.trav.oper. = MECEXT15)
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '(0)';
        return;
    }

    if (countSpan) countSpan.textContent = `(${pageState.ndtData.length})`;

    tbody.innerHTML = '';
    pageState.ndtData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        const ordre = item['Ordre'] || item['ordre'] || '-';
        const designOper = item['Désign. opér.'] || item['Design. oper.'] || item['designOper'] || '-';
        const posteTech = item['Poste technique'] || item['posteTechnique'] || '-';
        const commentaire = item['Commentaire'] || item['commentaire'] || '';

        row.innerHTML = `
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-weight: bold; color: #667eea;">
                ${ordre}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                ${designOper}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                ${posteTech}
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <textarea readonly style="width: 100%; min-height: 36px; padding: 4px; border: 1px solid #ddd; border-radius: 3px; background: #f8f9fa; font-size: 0.95em;">${commentaire}</textarea>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[DETAIL-T56] Tableau rendu: ${pageState.ndtData.length} inspections NDT`);
}

/**
 * Exporte les donnees vers Excel
 */
function exportToExcel() {
    if (pageState.ndtData.length === 0) {
        alert('Aucune donnee a exporter');
        return;
    }

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[DETAIL-T56] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    // Preparer les donnees pour l'export
    const exportData = pageState.ndtData.map(item => ({
        'Ordre': item['Ordre'] || item['ordre'] || '',
        'Design. Oper.': item['Désign. opér.'] || item['Design. oper.'] || item['designOper'] || '',
        'Poste technique': item['Poste technique'] || item['posteTechnique'] || '',
        'Commentaire': item['Commentaire'] || item['commentaire'] || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Inspections NDT');
    XLSX.writeFile(wb, `Inspections_NDT_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/**
 * Nettoyage avant de quitter la page
 */
export function cleanup() {
    console.log('[DETAIL-T56] Nettoyage de la page...');
    pageState.isInitialized = false;
}

/**
 * Force un rafraichissement de la page
 */
export async function refresh() {
    console.log('[DETAIL-T56] Rafraichissement de la page...');
    await loadNDTData();
    renderNDTTable();
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.ndtActions = {
        exportToExcel
    };
}
