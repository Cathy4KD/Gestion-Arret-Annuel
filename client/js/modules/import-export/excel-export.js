/**
 * @fileoverview Module d'export Excel
 * @module import-export/excel-export
 *
 * @description
 * Gère tous les exports Excel de l'application
 * Source: lignes 6869-7178 et autres du fichier HTML original
 *
 * @requires XLSX (bibliothèque externe)
 * @exports {Function} exportToExcel
 * @exports {Function} exportRevisionListToExcel
 * @exports {Function} exportPSVToExcel
 * @exports {Function} exportTPAAToExcel
 */

/**
 * Calcule automatiquement les largeurs de colonnes optimales
 * @param {Object} worksheet - Feuille Excel (XLSX worksheet)
 * @param {Array} data - Données source
 * @param {number} minWidth - Largeur minimale (défaut: 10)
 * @param {number} maxWidth - Largeur maximale (défaut: 100)
 * @returns {Array} Configuration des largeurs de colonnes
 */
export function autoSizeColumns(worksheet, data, minWidth = 10, maxWidth = 100) {
    if (!data || data.length === 0) return [];

    const columnWidths = {};
    const headers = Object.keys(data[0]);

    // Calculer la largeur basée sur les en-têtes
    headers.forEach(header => {
        columnWidths[header] = header.length;
    });

    // Parcourir toutes les lignes pour trouver la valeur la plus longue de chaque colonne
    data.forEach(row => {
        headers.forEach(header => {
            const cellValue = row[header] ? String(row[header]) : '';
            const cellLength = cellValue.length;
            if (cellLength > columnWidths[header]) {
                columnWidths[header] = cellLength;
            }
        });
    });

    // Convertir en format XLSX avec largeurs min/max
    return headers.map(header => {
        let width = columnWidths[header] + 2; // Ajouter une marge
        width = Math.max(minWidth, Math.min(maxWidth, width));
        return { wch: width };
    });
}

/**
 * Exporte les données principales vers Excel
 * @param {Object} arretData - Données de l'arrêt annuel
 * @returns {void}
 * @source Ligne 6869
 */
export function exportToExcel(arretData) {
    if (!arretData || !arretData.phases) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    console.log(' Début export Excel...');

    // Préparer les données pour l'export
    const exportData = [];

    arretData.phases.forEach(phase => {
        phase.taches.forEach(tache => {
            exportData.push({
                'Phase': phase.nom,
                'Semaines': phase.semaines,
                'Date Phase': phase.date,
                'Titre Tâche': tache.titre,
                'Description': tache.description,
                'Responsable': tache.responsable,
                'Statut': tache.statut,
                'Date Début': tache.dateDebut,
                'Date Fin': tache.dateFin,
                'Priorité': tache.priorite,
                'Durée (h)': tache.duree,
                'Budget': phase.budget,
                'Risque': tache.risque || '',
                'Actions': tache.actions || ''
            });
        });
    });

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Arrêt Annuel');

    // Ajouter une feuille de statistiques
    const stats = {
        'Total Phases': arretData.phases.length,
        'Total Tâches': exportData.length,
        'Budget Total': arretData.phases.reduce((sum, phase) =>
            sum + (parseFloat(phase.budget) || 0), 0).toLocaleString() + '€',
        'Date Export': new Date().toLocaleString()
    };

    const statsData = Object.entries(stats).map(([key, value]) => ({ 'Indicateur': key, 'Valeur': value }));
    const wsStats = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

    // Télécharger le fichier
    const fileName = `Arret_Annuel_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`[OK] Fichier exporté: ${fileName}`);
}

/**
 * Exporte la liste de révision vers Excel
 * @param {Array} revisionData - Données de révision
 * @returns {void}
 * @source Ligne 6869
 */
export function exportRevisionListToExcel(revisionData) {
    if (!revisionData || revisionData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const exportData = revisionData.map(item => ({
        'Ordre': item.ordre,
        'Opération': item.operation,
        'Désignation': item.designation,
        'Poste Technique': item.posteTechnique,
        'Description': item.description,
        'Statut': item.statut,
        'Commentaires': item.commentaires
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Révision Liste Travaux');

    const fileName = `Revision_Liste_Travaux_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`[OK] Fichier exporté: ${fileName}`);
}

/**
 * Exporte les PSV (Postes de Sécurité Vitaux) vers Excel
 * @param {Array} psvData - Données PSV
 * @returns {void}
 * @source Ligne 7006
 */
export function exportPSVToExcel(psvData) {
    if (!psvData || psvData.length === 0) {
        alert('[WARNING] Aucune donnée PSV à exporter.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const exportData = psvData.map(psv => ({
        'Ordre': psv.ordre,
        'Opération': psv.operation,
        'Poste Technique': psv.posteTechnique,
        'Désignation': psv.designation,
        'Type PSV': psv.typePSV,
        'Commentaires': psv.commentaires
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Liste PSV');

    const fileName = `Liste_PSV_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`[OK] Fichier PSV exporté: ${fileName}`);
}

/**
 * Exporte les TPAA (Travaux Préparatoires Arrêt Annuel) vers Excel
 * @param {Array} tpaaData - Données TPAA
 * @returns {void}
 * @source Ligne 7654
 */
export function exportTPAAToExcel(tpaaData) {
    if (!tpaaData || tpaaData.length === 0) {
        alert('[WARNING] Aucune donnée TPAA à exporter.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const exportData = tpaaData.map(tpaa => ({
        'Ordre': tpaa.ordre,
        'Opération': tpaa.operation,
        'Poste Technique': tpaa.posteTechnique,
        'Désignation': tpaa.designation,
        'Type TPAA': tpaa.typeTpaa,
        'Date Prévue': tpaa.datePrevue,
        'Responsable': tpaa.responsable,
        'Statut': tpaa.statut,
        'Commentaires': tpaa.commentaires
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Liste TPAA');

    const fileName = `Liste_TPAA_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`[OK] Fichier TPAA exporté: ${fileName}`);
}

/**
 * Exporte un tableau générique vers Excel
 * @param {Array} data - Données à exporter
 * @param {string} sheetName - Nom de la feuille
 * @param {string} fileName - Nom du fichier
 * @returns {void}
 */
export function exportGenericToExcel(data, sheetName, fileName) {
    if (!data || data.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, data);

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fullFileName = fileName || `Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fullFileName);
    console.log(`[OK] Fichier exporté: ${fullFileName}`);
}
