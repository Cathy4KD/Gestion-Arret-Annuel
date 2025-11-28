/**
 * @fileoverview Module d'import Excel
 * @module import-export/excel-import
 *
 * @description
 * Gère tous les imports Excel (IW37N, SAP, etc.)
 * Source: lignes 6030-6620 du fichier HTML original
 *
 * @requires XLSX (bibliothèque externe)
 * @exports {Function} importIW37N
 * @exports {Function} importSAPData
 * @exports {Function} parseExcelFile
 */

/**
 * Importe un fichier IW37N depuis Excel
 * @param {File} file - Fichier Excel à importer
 * @returns {Promise<Array>} Données importées
 * @source Ligne 6030
 */
export async function importIW37N(file) {
    if (!file) {
        throw new Error('Aucun fichier sélectionné');
    }

    if (typeof XLSX === 'undefined') {
        throw new Error('Bibliothèque XLSX non chargée');
    }

    console.log(` Import du fichier IW37N: ${file.name}`);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                console.log(`[OK] ${jsonData.length} lignes importées depuis IW37N`);
                resolve(jsonData);
            } catch (error) {
                console.error('[ERROR] Erreur import IW37N:', error);
                reject(error);
            }
        };

        reader.onerror = function (error) {
            console.error('[ERROR] Erreur lecture fichier:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Importe des données SAP depuis Excel
 * @param {File} file - Fichier Excel à importer
 * @returns {Promise<Array>} Données importées
 * @source Ligne 6305
 */
export async function importSAPData(file) {
    if (!file) {
        throw new Error('Aucun fichier sélectionné');
    }

    if (typeof XLSX === 'undefined') {
        throw new Error('Bibliothèque XLSX non chargée');
    }

    console.log(` Import du fichier SAP: ${file.name}`);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                console.log(`[OK] ${jsonData.length} lignes importées depuis SAP`);
                resolve(jsonData);
            } catch (error) {
                console.error('[ERROR] Erreur import SAP:', error);
                reject(error);
            }
        };

        reader.onerror = function (error) {
            console.error('[ERROR] Erreur lecture fichier:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse un fichier Excel générique
 * @param {File} file - Fichier Excel
 * @param {Object} options - Options de parsing
 * @returns {Promise<Object>} Workbook parsé
 * @source Ligne 6496
 */
export async function parseExcelFile(file, options = {}) {
    if (!file) {
        throw new Error('Aucun fichier sélectionné');
    }

    if (typeof XLSX === 'undefined') {
        throw new Error('Bibliothèque XLSX non chargée');
    }

    console.log(` Parsing du fichier Excel: ${file.name}`);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', ...options });

                const result = {
                    workbook: workbook,
                    sheetNames: workbook.SheetNames,
                    sheets: {}
                };

                // Convertir chaque feuille en JSON
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    result.sheets[sheetName] = XLSX.utils.sheet_to_json(sheet);
                });

                console.log(`[OK] Fichier Excel parsé: ${workbook.SheetNames.length} feuilles`);
                resolve(result);
            } catch (error) {
                console.error('[ERROR] Erreur parsing Excel:', error);
                reject(error);
            }
        };

        reader.onerror = function (error) {
            console.error('[ERROR] Erreur lecture fichier:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Importe des données de révision depuis Excel
 * @param {File} file - Fichier Excel
 * @returns {Promise<Array>} Données de révision
 * @source Ligne 6529
 */
export async function importRevisionData(file) {
    if (!file) {
        throw new Error('Aucun fichier sélectionné');
    }

    if (typeof XLSX === 'undefined') {
        throw new Error('Bibliothèque XLSX non chargée');
    }

    console.log(` Import révision: ${file.name}`);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Ajouter un ID unique à chaque ligne
                const dataWithIds = jsonData.map((row, index) => ({
                    id: `rev-${Date.now()}-${index}`,
                    ...row,
                    statut: row.statut || 'A réviser',
                    commentaires: row.commentaires || ''
                }));

                console.log(`[OK] ${dataWithIds.length} lignes de révision importées`);
                resolve(dataWithIds);
            } catch (error) {
                console.error('[ERROR] Erreur import révision:', error);
                reject(error);
            }
        };

        reader.onerror = function (error) {
            console.error('[ERROR] Erreur lecture fichier:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Importe des données PSV depuis Excel
 * @param {File} file - Fichier Excel
 * @returns {Promise<Array>} Données PSV
 * @source Ligne 7038
 */
export async function importPSVData(file) {
    if (!file) {
        throw new Error('Aucun fichier sélectionné');
    }

    if (typeof XLSX === 'undefined') {
        throw new Error('Bibliothèque XLSX non chargée');
    }

    console.log(` Import PSV: ${file.name}`);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Ajouter un ID unique à chaque PSV
                const dataWithIds = jsonData.map((row, index) => ({
                    id: `psv-${Date.now()}-${index}`,
                    ...row,
                    typePSV: row.typePSV || '',
                    commentaires: row.commentaires || ''
                }));

                console.log(`[OK] ${dataWithIds.length} PSV importés`);
                resolve(dataWithIds);
            } catch (error) {
                console.error('[ERROR] Erreur import PSV:', error);
                reject(error);
            }
        };

        reader.onerror = function (error) {
            console.error('[ERROR] Erreur lecture fichier:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Valide les données importées
 * @param {Array} data - Données à valider
 * @param {Array} requiredFields - Champs requis
 * @returns {Object} Résultat de validation
 */
export function validateImportedData(data, requiredFields) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(data) || data.length === 0) {
        errors.push('Aucune donnée importée');
        return { valid: false, errors, warnings };
    }

    // Vérifier les champs requis
    data.forEach((row, index) => {
        requiredFields.forEach(field => {
            if (!row[field] || row[field] === '') {
                warnings.push(`Ligne ${index + 1}: Champ "${field}" manquant ou vide`);
            }
        });
    });

    const valid = errors.length === 0;

    console.log(`[SEARCH] Validation: ${valid ? '[OK] Succès' : '[ERROR] Échec'}`);
    if (warnings.length > 0) {
        console.warn(`[WARNING] ${warnings.length} avertissements`);
    }

    return { valid, errors, warnings, data };
}
