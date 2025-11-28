/**
 * @fileoverview Point d'entrée du module Import/Export
 * @module import-export
 *
 * @description
 * Module centralisé pour tous les imports et exports de données
 * - Import Excel (IW37N, SAP, PSV, TPAA, etc.)
 * - Export Excel
 * - Export PDF (jsPDF)
 * - Export PowerPoint
 * - Import MS Project
 *
 * @requires ./excel-import
 * @requires ./excel-export
 */

import * as excelImport from './excel-import.js';
import * as excelExport from './excel-export.js';

export function initImportExport() {
    console.log(' Module Import/Export initialisé');
}

// Ré-exporter tous les modules
export {
    excelImport,
    excelExport
};

export default {
    init: initImportExport,
    import: excelImport,
    export: excelExport
};
