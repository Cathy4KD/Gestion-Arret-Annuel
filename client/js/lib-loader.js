/**
 * Gestionnaire de chargement dynamique des bibliothèques
 * Optimise le temps de chargement initial en ne chargeant que ce qui est nécessaire
 */

const LIBRARIES = {
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    mpxj: 'https://cdn.jsdelivr.net/npm/mpxj@latest/mpxj.js',
    pptxgen: 'https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundle.min.js',
    pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
};

const loadedLibraries = new Set();

/**
 * Charge une bibliothèque de manière asynchrone
 * @param {string} name - Nom de la bibliothèque
 * @returns {Promise<void>}
 */
export async function loadLibrary(name) {
    if (loadedLibraries.has(name)) {
        console.log(`[LIB] ✅ ${name} déjà chargée`);
        return;
    }

    const url = LIBRARIES[name];
    if (!url) {
        throw new Error(`Bibliothèque inconnue: ${name}`);
    }

    console.log(`[LIB] 📥 Chargement de ${name}...`);
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            loadedLibraries.add(name);
            console.log(`[LIB] ✅ ${name} chargée`);
            resolve();
        };
        script.onerror = () => {
            console.error(`[LIB] ❌ Erreur chargement ${name}`);
            reject(new Error(`Échec du chargement de ${name}`));
        };
        document.head.appendChild(script);
    });
}

/**
 * Charge plusieurs bibliothèques en parallèle
 * @param {string[]} names - Noms des bibliothèques
 * @returns {Promise<void>}
 */
export async function loadLibraries(names) {
    await Promise.all(names.map(name => loadLibrary(name)));
}

/**
 * Vérifie si une bibliothèque est chargée
 * @param {string} name - Nom de la bibliothèque
 * @returns {boolean}
 */
export function isLibraryLoaded(name) {
    return loadedLibraries.has(name);
}

// ==================== VÉRIFICATION DES BIBLIOTHÈQUES DEFER ====================

/**
 * Vérifie que toutes les bibliothèques externes (chargées avec defer) sont disponibles
 * @returns {Object} Statut de chargement de chaque bibliothèque
 */
export function checkDeferredLibraries() {
    return {
        io: typeof io !== 'undefined',
        xlsx: typeof XLSX !== 'undefined',
        chart: typeof Chart !== 'undefined',
        jspdf: typeof window.jspdf !== 'undefined',
        pdfjsLib: typeof pdfjsLib !== 'undefined'
    };
}

/**
 * Attend qu'une bibliothèque defer soit chargée
 * @param {string} libName - Nom de la bibliothèque ('io', 'XLSX', 'Chart', 'jsPDF', 'pdfjsLib')
 * @param {number} timeout - Timeout en ms (défaut: 10000)
 * @returns {Promise<boolean>}
 */
export function waitForDeferredLibrary(libName, timeout = 10000) {
    return new Promise((resolve) => {
        const checkInterval = 50;
        let elapsed = 0;

        const check = () => {
            const libs = {
                'io': typeof io !== 'undefined',
                'XLSX': typeof XLSX !== 'undefined',
                'Chart': typeof Chart !== 'undefined',
                'jsPDF': typeof window.jspdf !== 'undefined',
                'pdfjsLib': typeof pdfjsLib !== 'undefined'
            };

            if (libs[libName]) {
                console.log(`[LIB-LOADER] ✅ ${libName} chargé`);
                resolve(true);
            } else if (elapsed >= timeout) {
                console.error(`[LIB-LOADER] ❌ ${libName} non chargé après ${timeout}ms`);
                resolve(false);
            } else {
                elapsed += checkInterval;
                setTimeout(check, checkInterval);
            }
        };

        check();
    });
}

/**
 * Vérifie qu'une bibliothèque defer est chargée, sinon affiche une erreur
 * @param {string} libName - Nom de la bibliothèque ('io', 'XLSX', 'Chart', 'jsPDF', 'pdfjsLib')
 * @param {string} displayName - Nom à afficher à l'utilisateur (optionnel)
 * @returns {boolean} true si la bibliothèque est chargée
 */
export function ensureDeferredLibrary(libName, displayName = null) {
    const libs = {
        'io': typeof io !== 'undefined',
        'XLSX': typeof XLSX !== 'undefined',
        'Chart': typeof Chart !== 'undefined',
        'jsPDF': typeof window.jspdf !== 'undefined',
        'pdfjsLib': typeof pdfjsLib !== 'undefined'
    };

    const friendlyNames = {
        'io': 'Socket.IO',
        'XLSX': 'Excel (XLSX)',
        'Chart': 'Chart.js',
        'jsPDF': 'jsPDF',
        'pdfjsLib': 'PDF.js'
    };

    if (!libs[libName]) {
        const name = displayName || friendlyNames[libName] || libName;
        console.error(`[LIB-LOADER] ❌ ${libName} non chargé`);
        alert(`❌ Erreur: La bibliothèque ${name} n'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).`);
        return false;
    }

    return true;
}

/**
 * Vérifie XLSX et retourne true si disponible
 * @returns {boolean}
 */
export function checkXLSX() {
    return ensureDeferredLibrary('XLSX');
}

/**
 * Vérifie Chart.js et retourne true si disponible
 * @returns {boolean}
 */
export function checkChart() {
    return ensureDeferredLibrary('Chart');
}

/**
 * Vérifie jsPDF et retourne true si disponible
 * @returns {boolean}
 */
export function checkJsPDF() {
    return ensureDeferredLibrary('jsPDF');
}

/**
 * Vérifie Socket.IO et retourne true si disponible
 * @returns {boolean}
 */
export function checkSocketIO() {
    return ensureDeferredLibrary('io', 'Socket.IO');
}

/**
 * Vérifie PDF.js et retourne true si disponible
 * @returns {boolean}
 */
export function checkPDFjs() {
    return ensureDeferredLibrary('pdfjsLib', 'PDF.js');
}

/**
 * Affiche le statut de toutes les bibliothèques defer dans la console
 */
export function logDeferredLibrariesStatus() {
    const status = checkDeferredLibraries();
    console.log('[LIB-LOADER] État des bibliothèques defer:');
    console.log('  - Socket.IO:', status.io ? '✅' : '❌');
    console.log('  - XLSX:', status.xlsx ? '✅' : '❌');
    console.log('  - Chart.js:', status.chart ? '✅' : '❌');
    console.log('  - jsPDF:', status.jspdf ? '✅' : '❌');
    console.log('  - PDF.js:', status.pdfjsLib ? '✅' : '❌');
}

/**
 * Fonction utilitaire pour afficher un PDF au lieu de le télécharger
 * @param {Object} pdfDoc - Document jsPDF
 * @param {string} fileName - Nom du fichier PDF
 */
export function displayPDF(pdfDoc, fileName) {
    try {
        // Créer une URL blob et l'ouvrir dans un nouvel onglet
        const pdfBlob = pdfDoc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Ouvrir dans un nouvel onglet
        const pdfWindow = window.open(pdfUrl, '_blank');

        if (pdfWindow) {
            // Définir le titre de l'onglet
            pdfWindow.document.title = fileName;
            console.log(`[PDF] Rapport ouvert dans un nouvel onglet: ${fileName}`);
        } else {
            // Si le popup est bloqué, télécharger directement
            pdfDoc.save(fileName);
            alert('Le popup a ete bloque. Le PDF a ete telecharge.');
        }
    } catch (error) {
        console.error('[PDF] Erreur lors de l\'affichage:', error);
        // En cas d'erreur, télécharger directement
        pdfDoc.save(fileName);
    }
}

// Exposer globalement pour debug
window.libLoader = window.libLoader || {};
window.libLoader.checkDeferred = checkDeferredLibraries;
window.libLoader.waitDeferred = waitForDeferredLibrary;
window.libLoader.ensureDeferred = ensureDeferredLibrary;
window.libLoader.checkXLSX = checkXLSX;
window.libLoader.checkChart = checkChart;
window.libLoader.checkJsPDF = checkJsPDF;
window.libLoader.checkSocketIO = checkSocketIO;
window.libLoader.checkPDFjs = checkPDFjs;
window.libLoader.statusDeferred = logDeferredLibrariesStatus;
window.libLoader.displayPDF = displayPDF;

console.log('[LIB-LOADER] ✅ Module chargé - Utilisez window.libLoader.statusDeferred() pour voir l\'état');
