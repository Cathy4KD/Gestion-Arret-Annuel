/**
 * @fileoverview Page Component Loader
 * Dynamically loads HTML page components
 * @module page-loader
 */

/**
 * Cache for loaded page components
 * @type {Map<string, string>}
 */
const pageCache = new Map();

/**
 * Currently active page ID
 * @type {string|null}
 */
let currentPageId = null;

/**
 * Currently active page controller
 * @type {Object|null}
 */
let currentController = null;

/**
 * Page controllers mapping
 * Maps page IDs to their controller module loaders (dynamic imports)
 */
const PAGE_CONTROLLERS = {
    'detail-t22': () => import('../pages/detail-t22-controller.js'),
    'detail-t24': () => import('../pages/detail-t24-controller.js'),
    'detail-t27': () => import('../pages/detail-t27-controller.js'),
    'detail-t29': () => import('../pages/detail-t29-controller.js'),
    'detail-t30': () => import('../pages/detail-t30-controller.js'),
    'detail-t33': () => import('../pages/detail-t33-controller.js'),
    'detail-t60': () => import('../pages/detail-t60-controller.js'),
    'detail-suivi-pieces-delai': () => import('../pages/detail-suivi-pieces-delai-controller.js'),
    'detail-t43': () => import('../pages/detail-t43-controller.js'),
    'detail-t45': () => import('../pages/detail-t45-controller.js'),
    'detail-t50': () => import('../pages/detail-t50-controller.js'),
    'detail-t51': () => import('../pages/detail-t51-controller.js'),
    'detail-t55-historique': () => import('../pages/detail-t55-historique-controller.js'),
    'detail-t56': () => import('../pages/detail-t56-controller.js'),
    'detail-t57': () => import('../pages/detail-t57-controller.js'),
    'detail-t58': () => import('../pages/detail-t58-controller.js'),
    'detail-t62': () => import('../pages/detail-t62-controller.js'),
    'detail-t63': () => import('../pages/detail-t63-controller.js'),
    'detail-t64': () => import('../pages/detail-t64-controller.js'),
    'detail-t65': () => import('../pages/detail-t65-controller.js'),
    'detail-t66': () => import('../pages/detail-t66-controller.js'),
    'detail-t67': () => import('../pages/detail-t67-controller.js'),
    'detail-t68': () => import('../pages/detail-t68-controller.js'),
    'detail-t69': () => import('../pages/detail-t69-controller.js'),
    'detail-t70': () => import('../pages/detail-t70-controller.js'),
    'detail-t71': () => import('../pages/detail-t71-controller.js'),
    'detail-t72': () => import('../pages/detail-t72-controller.js'),
    'detail-t75': () => import('../pages/detail-t75-controller.js'),
    // 'detail-t79': () => import('../pages/detail-t79-controller.js'), // Désactivé - utilise le système legacy dans navigation.js
    'detail-t90': () => import('../pages/detail-t90-controller.js'),
    'detail-t91': () => import('../pages/detail-t91-controller.js'),
    'detail-t93': () => import('../pages/detail-t93-controller.js'),
    'detail-t94': () => import('../pages/detail-t94-controller.js'),
    'detail-t95': () => import('../pages/detail-t95-controller.js'),
    'detail-t99': () => import('../pages/detail-t99-controller.js'),
    'detail-t100': () => import('../pages/detail-t100-controller.js'),
    'detail-t109': () => import('../pages/detail-t109-controller.js'),
    'detail-t110': () => import('../pages/detail-t110-controller.js'),
    'detail-t128': () => import('../pages/detail-t128-controller.js'),
    'detail-t131': () => import('../pages/detail-t131-controller.js'),
    'detail-t132': () => import('../pages/detail-t132-controller.js'),
    'detail-t136': () => import('../pages/detail-t136-controller.js'),
    'detail-t139': () => import('../pages/detail-t139-controller.js'),
    'detail-t4-t9-combined': () => import('../pages/detail-t4-t9-combined-controller.js'),
    'contacts': () => import('../pages/contacts-controller.js')
};

/**
 * Load a page component from the server
 * @param {string} pageId - Page identifier (e.g., 'dashboard', 'summary')
 * @returns {Promise<string>} HTML content of the page
 */
async function loadPageComponent(pageId) {
    // Vérifier si la page est déjà en cache
    if (pageCache.has(pageId)) {
        console.log(`[PAGE-LOADER] ✅ Chargement depuis le cache: ${pageId}`);
        return pageCache.get(pageId);
    }

    try {
        console.log(`[PAGE-LOADER] 📡 Chargement du composant: ${pageId}`);
        // Pas de cache-busting: on fait confiance au cache HTTP du serveur
        const response = await fetch(`/components/pages/${pageId}.html`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Cache the loaded component
        pageCache.set(pageId, html);
        console.log(`[PAGE-LOADER] ✅ Composant chargé et mis en cache: ${pageId}`);

        return html;
    } catch (error) {
        console.error(`[PAGE-LOADER] ❌ Erreur lors du chargement de ${pageId}:`, error);
        throw error;
    }
}

/**
 * Inject a page component into the pages container
 * @param {string} pageId - Page identifier
 * @param {string} html - HTML content to inject
 */
function injectPageComponent(pageId, html) {
    const container = document.getElementById('pages-container');

    if (!container) {
        console.error('[PAGE-LOADER] ❌ pages-container non trouvé!');
        return;
    }

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get the page element (should be a div with class="page")
    const pageElement = tempDiv.querySelector('.page');

    if (!pageElement) {
        console.error(`[PAGE-LOADER] ❌ Aucun élément .page trouvé dans ${pageId}.html`);
        return;
    }

    // Set the page ID if not already set
    if (!pageElement.id) {
        pageElement.id = pageId;
    }

    // Extract and execute scripts from the HTML
    const scripts = tempDiv.querySelectorAll('script');
    const scriptContents = [];
    scripts.forEach(script => {
        scriptContents.push(script.textContent);
        script.remove(); // Remove script from pageElement to avoid duplicate execution
    });

    // Append to container
    container.appendChild(pageElement);
    console.log(`[PAGE-LOADER] ✅ Composant injecté: ${pageId}`);

    // Execute scripts after DOM insertion
    scriptContents.forEach(scriptContent => {
        try {
            // Use Function constructor instead of eval for better scope control
            const scriptFunc = new Function(scriptContent);
            scriptFunc();
        } catch (error) {
            console.error(`[PAGE-LOADER] ❌ Erreur lors de l'exécution du script pour ${pageId}:`, error);
        }
    });
}

/**
 * Switch to a specific page, loading it if necessary
 * @param {string} pageId - Page identifier
 * @returns {Promise<void>}
 */
export async function switchToPage(pageId) {
    console.log(`[PAGE-LOADER] 🔄 Changement de page vers: ${pageId}`);

    // STEP 1: Cleanup previous controller
    if (currentController && currentController.cleanup) {
        try {
            console.log(`[PAGE-LOADER] 🧹 Nettoyage du contrôleur précédent...`);
            await currentController.cleanup();
        } catch (error) {
            console.error('[PAGE-LOADER] ❌ Erreur lors du cleanup du contrôleur:', error);
        }
    }
    currentController = null;

    // Check if page already exists in DOM
    let pageElement = document.getElementById(pageId);

    // If page doesn't exist, load and inject it
    if (!pageElement) {
        try {
            const html = await loadPageComponent(pageId);
            injectPageComponent(pageId, html);
            pageElement = document.getElementById(pageId);
        } catch (error) {
            console.error(`[PAGE-LOADER] ❌ Impossible de charger la page ${pageId}:`, error);
            alert(`Erreur lors du chargement de la page ${pageId}.\nVeuillez vérifier la console pour plus de détails.`);
            return;
        }
    }

    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // Show the requested page
    if (pageElement) {
        pageElement.classList.add('active');
        currentPageId = pageId;
        console.log(`[PAGE-LOADER] ✅ Page active: ${pageId}`);

        // Émettre un événement personnalisé pour l'assistant virtuel
        window.dispatchEvent(new CustomEvent('pageChanged', {
            detail: { pageId: pageId }
        }));
    }

    // Update navigation tabs
    updateNavigationTabs(pageId);

    // STEP 2: Load and initialize new controller if available
    if (PAGE_CONTROLLERS[pageId]) {
        try {
            console.log(`[PAGE-LOADER] 📦 Chargement du contrôleur pour: ${pageId}`);
            const controllerModule = await PAGE_CONTROLLERS[pageId]();
            currentController = controllerModule;

            if (controllerModule.init) {
                console.log(`[PAGE-LOADER] ⚡ Initialisation du contrôleur: ${pageId}`);
                await controllerModule.init();
            }
        } catch (error) {
            console.error(`[PAGE-LOADER] ❌ Erreur lors du chargement du contrôleur ${pageId}:`, error);
            // Continue anyway - fallback to legacy initialization
        }
    }

    // STEP 3: Legacy initialization for pages not yet migrated to controllers
    // This will be removed as we migrate all pages to the controller pattern
    await initializePage(pageId);
}

/**
 * Initialize page-specific features after page is loaded
 * @param {string} pageId - Page identifier
 */
async function initializePage(pageId) {
    if (pageId === 'dashboard') {
        // Initialize dashboard charts
        try {
            const chartsModule = await import('../charts/dashboard-charts.js');
            const filtersModule = await import('./dashboard-filters.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 🎨 Initialisation des graphiques du Dashboard...');
                await filtersModule.initDashboardFilters();
                await chartsModule.initDashboardCharts();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation du Dashboard:', err);
        }
    } else if (pageId === 'timeline') {
        // Initialize Kanban board
        try {
            const kanbanModule = await import('./kanban.js');
            const calendarModule = await import('./calendar.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📋 Initialisation du Kanban...');
                await kanbanModule.renderKanban();
                kanbanModule.initKanbanDragDrop();

                console.log('[PAGE-LOADER] 📅 Initialisation du Calendrier...');
                await calendarModule.renderCalendar();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation du Kanban:', err);
        }
    } else if (pageId === 'summary') {
        // Initialize Summary (Préparation) table
        try {
            const summaryModule = await import('./summary.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📝 Initialisation du tableau de préparation...');
                summaryModule.renderSummaryTable();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation du Summary:', err);
        }
    } else if (pageId === 'contacts') {
        // Initialize Contacts page
        try {
            const contactsModule = await import('../data/contacts-manager.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📞 Initialisation de la page Contacts...');
                await contactsModule.loadContactsData();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des Contacts:', err);
        }
    } else if (pageId === 'bilan-reunions') {
        // Initialize Bilan Reunions page
        try {
            const reunionsModule = await import('./bilan-reunions.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📅 Initialisation du bilan des réunions...');
                reunionsModule.renderReunionsTable();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation du Bilan Réunions:', err);
        }
    } else if (pageId === 'execution') {
        // Initialize Execution page if needed
        // For now, no special initialization required
        console.log('[PAGE-LOADER] ⚙️ Page Exécution chargée');
    } else if (pageId === 'avis') {
        // Initialize Avis page
        try {
            const avisModule = await import('../data/avis-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📋 Initialisation de la page Avis...');
                avisModule.initAvisPage();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation d\'Avis:', err);
        }
    } else if (pageId === 'iw37n') {
        // Initialize IW37N table
        try {
            const iw37nModule = await import('../data/iw37n-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📊 Initialisation du tableau IW37N...');
                iw37nModule.renderIw37nTable();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation d\'IW37N:', err);
        }
    } else if (pageId === 'detail-t8') {
        // Initialize Révision de la Liste des Travaux (detail-t8)
        try {
            const revisionModule = await import('../data/revision-travaux-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📋 Initialisation de la Révision des Travaux...');
                revisionModule.loadRevisionListeData();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation de la Révision des Travaux:', err);
        }
    } else if (pageId === 'detail-t19') {
        // Initialize PSV (detail-t19)
        try {
            const psvModule = await import('../data/psv-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🔧 Initialisation des PSV...');
                psvModule.loadPSVData();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des PSV:', err);
        }
    } else if (pageId === 'detail-t20-t21' || pageId === 'detail-t26') {
        // Initialize TPAA et PW (detail-t20-t21 et detail-t26)
        try {
            const tpaaPwModule = await import('../data/tpaa-pw-data.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📅 Initialisation des TPAA et PW...');
                await tpaaPwModule.loadTPAAPW();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des TPAA/PW:', err);
        }
    } else if (pageId === 'detail-echeanciers-projets') {
        // Initialize Projets page
        try {
            const projetsModule = await import('../data/projets-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📋 Initialisation des Projets...');
                projetsModule.loadProjetsData();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des Projets:', err);
        }
    } else if (pageId === 'demandes-echafaudages') {
        // Initialize Demandes Échafaudages page
        try {
            const echafaudagesModule = await import('../demandes/echafaudages.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🧱 Initialisation des demandes échafaudages...');
                echafaudagesModule.loadDemandesEchafaudages();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des demandes échafaudages:', err);
        }
    } else if (pageId === 'demandes-grues-nacelles') {
        // Initialize Demandes Grues/Nacelles page
        try {
            const gruesNacellesModule = await import('../demandes/grues-nacelles.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🏗️ Initialisation des demandes grues/nacelles...');
                gruesNacellesModule.loadDemandesGruesNacelles();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des demandes grues/nacelles:', err);
        }
    } else if (pageId === 'demandes-verrouillage') {
        // Initialize Demandes Verrouillage page
        try {
            const verrouillageModule = await import('../demandes/verrouillage.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🔒 Initialisation des demandes verrouillage...');
                verrouillageModule.loadDemandesVerrouillage();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des demandes verrouillage:', err);
        }
    } else if (pageId === 'pieces') {
        // Initialize Pieces (Gestion des Pièces) page
        try {
            const piecesPageModule = await import('./pieces-page.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🔧 Initialisation de la Gestion des Pièces...');
                piecesPageModule.initPiecesPage();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation de la Gestion des Pièces:', err);
        }
    } else if (pageId.startsWith('detail-t1') && pageId.match(/^detail-t1[0-8]$/)) {
        // Initialize SCOPE pages (t10 à t18: CONVERTISSEUR, FOSSE, HALLE 1, HALLE 2, etc.)
        try {
            const scopeModule = await import('../scope/index.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                // Extraire "t10" de "detail-t10"
                const scopePageId = pageId.replace('detail-', '');
                console.log(`[PAGE-LOADER] 🏭 Initialisation de la page SCOPE ${pageId} (ID: ${scopePageId})...`);
                scopeModule.loadScopeData(scopePageId);
            }, 100);
        } catch (err) {
            console.error(`[PAGE-LOADER] ❌ Erreur lors de l'initialisation de ${pageId}:`, err);
        }
    } else if (pageId === 'detail-t21') {
        // Initialize Service Incendie (t21)
        try {
            const dataPageModule = await import('../data/data-pages.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 🚒 Initialisation du Service Incendie...');
                await dataPageModule.loadDataPage('t21');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation du Service Incendie:', err);
        }
    } else if (pageId === 'detail-t25') {
        // Initialize DA (Demandes d'Achat) - detail-t25
        try {
            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📝 Initialisation des Demandes d\'Achat (DA)...');
                if (typeof window.loadDAData === 'function') {
                    window.loadDAData();
                } else {
                    console.warn('[PAGE-LOADER] ⚠️ window.loadDAData() n\'est pas encore définie');
                }
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] Erreur lors de l\'initialisation des DA:', err);
        }
    } else if (pageId === 'detail-notes-prochain-arret') {
        // Initialize Notes Prochain Arrêt
        try {
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📝 Initialisation des Notes Prochain Arrêt...');
                if (typeof window.loadNotesData === 'function') {
                    window.loadNotesData();
                } else {
                    console.warn('[PAGE-LOADER] ⚠️ window.loadNotesData() n\'est pas encore définie');
                }
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] Erreur lors de l\'initialisation des Notes:', err);
        }
    } else if (pageId === 'detail-devis') {
        // Initialize Devis et Corrections page
        try {
            const dataPageModule = await import('../data/data-pages.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📝 Initialisation de la page Devis...');
                await dataPageModule.loadDataPage('devis');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation de Devis:', err);
        }
    } else if (pageId === 'detail-t109') {
        // Initialize Tâches Cognibox page
        try {
            const cogniboxTasksModule = await import('../data/cognibox-tasks.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📋 Initialisation des Tâches Cognibox...');
                cogniboxTasksModule.loadCogniboxTasks();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des Tâches Cognibox:', err);
        }
    } else if (pageId === 'detail-t70') {
        // Initialize Équipements de Levage page
        try {
            const equipementLevageModule = await import('../data/equipement-levage-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🏗️ Initialisation des Équipements de Levage...');
                equipementLevageModule.loadEquipementLevageData();
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation des Équipements de Levage:', err);
        }
    } else if (pageId === 'detail-t40') {
        // Initialize Présentation aux Entrepreneurs - detail-t40
        try {
            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 👔 Initialisation Présentation aux Entrepreneurs...');
                if (typeof window.t40Actions !== 'undefined' && typeof window.t40Actions.loadT40Data === 'function') {
                    await window.t40Actions.loadT40Data();
                    console.log('[PAGE-LOADER] ✅ Données T40 chargées et affichées');
                } else {
                    console.warn('[PAGE-LOADER] ⚠️ window.t40Actions non disponible');
                }
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Présentation aux Entrepreneurs:', err);
        }
    } else if (pageId === 'detail-espace-clos') {
        // Initialize Espace Clos page - detail-espace-clos
        try {
            const dataPageModule = await import('../data/data-pages.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🚪 Initialisation de la page Espace Clos...');
                dataPageModule.loadDataPage('espace-clos');
                console.log('[PAGE-LOADER] ✅ Page Espace Clos chargée');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Espace Clos:', err);
        }
    } else if (pageId === 'detail-t50') {
        // Initialize Tours de Refroidissement - detail-t50
        try {
            const toursModule = await import('../data/tours-refroidissement-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] ❄️ Initialisation Tours de Refroidissement...');
                toursModule.loadToursRefroidissementData();
                console.log('[PAGE-LOADER] ✅ Données Tours de Refroidissement chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Tours Refroidissement:', err);
        }
    } else if (pageId === 'detail-t51') {
        // Initialize T51 Soumissions - detail-t51
        try {
            const t51Module = await import('../data/t51-soumissions.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📋 Initialisation Dépôt des Soumissions...');
                await t51Module.loadT51Data();

                const data = t51Module.getT51Data();
                console.log(`[PAGE-LOADER] ✅ Données T51: ${data.length} soumissions`);

                // Si pas de données, attendre que le serveur envoie les données
                if (!data || data.length === 0) {
                    console.log('[PAGE-LOADER] ⏳ Attente des données serveur pour T51...');
                    setTimeout(async () => {
                        await t51Module.loadT51Data();
                        const newData = t51Module.getT51Data();
                        console.log(`[PAGE-LOADER] 🔄 Reload T51: ${newData.length} soumissions`);
                    }, 1000);
                }
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation T51:', err);
        }
    } else if (pageId === 'detail-t55') {
        // Initialize FAIRE DEVIS ET CORRECTION (T55)
        try {
            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📝 Initialisation FAIRE DEVIS ET CORRECTION (T55)...');
                if (typeof window.reloadT55Page === 'function') {
                    await window.reloadT55Page();
                    console.log('[PAGE-LOADER] ✅ Page T55 initialisée');
                } else {
                    console.warn('[PAGE-LOADER] ⚠️ window.reloadT55Page non disponible');
                }
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation T55:', err);
        }
    } else if (pageId === 'detail-equipements-hauteur') {
        // Initialize Équipements de Travail en Hauteur (T57)
        try {
            const t57Module = await import('../data/t57-equipements-hauteur.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🏗️ Initialisation Équipements de Travail en Hauteur...');
                t57Module.loadT57Data();
                console.log('[PAGE-LOADER] ✅ Données T57 Équipements chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Équipements Hauteur:', err);
        }
    } else if (pageId === 'detail-rencontres-hebdo') {
        // Initialize Rencontres de Préparation Hebdo
        try {
            const hebdoModule = await import('../data/rencontres-hebdo-data.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📅 Initialisation Rencontres de Préparation Hebdo...');
                hebdoModule.loadRencontresHebdoData();
                console.log('[PAGE-LOADER] ✅ Données Rencontres Hebdo chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Rencontres Hebdo:', err);
        }
    } else if (pageId === 'detail-zones-entreposage') {
        // Initialize Zones Entreposage avec documents/plans
        try {
            const zonesModule = await import('../data/zones-entreposage-editor.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📦 Initialisation Zones Entreposage...');
                zonesModule.loadZonesData();
                console.log('[PAGE-LOADER] ✅ Données Zones Entreposage chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Zones Entreposage:', err);
        }
    } else if (pageId === 'detail-t63') {
        // Initialize T63 Zones Entreposage & Plan de Localisation
        try {
            const zonesPlanModule = await import('../data/zones-plan-editor.js');
            const zonesDataModule = await import('../data/t63-zones.js');

            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 🗺️ Initialisation T63 Plan de Localisation...');

                // Initialiser l'éditeur de plan
                const canvas = document.getElementById('zonesPlanCanvas');
                if (canvas) {
                    console.log('[PAGE-LOADER] ✅ Canvas trouvé, initialisation...');
                    zonesPlanModule.initPlanEditor();
                } else {
                    console.warn('[PAGE-LOADER] ⚠️ Canvas non trouvé, attente supplémentaire...');
                    setTimeout(() => {
                        const retryCanvas = document.getElementById('zonesPlanCanvas');
                        if (retryCanvas) {
                            console.log('[PAGE-LOADER] ✅ Canvas trouvé après attente');
                            zonesPlanModule.initPlanEditor();
                        } else {
                            console.error('[PAGE-LOADER] ❌ Canvas toujours non trouvé');
                        }
                    }, 300);
                }

                // Charger les données de zones
                zonesDataModule.loadZonesData();
                console.log('[PAGE-LOADER] ✅ Données T63 chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation T63:', err);
        }
    } else if (pageId === 'detail-avis-syndicaux') {
        // Initialize Avis Syndicaux page
        try {
            // Wait for DOM to be ready
            setTimeout(() => {
                console.log('[PAGE-LOADER] 📢 Initialisation des Avis Syndicaux...');
                if (typeof window.avisSyndicaux !== 'undefined' && typeof window.avisSyndicaux.chargerDonnees === 'function') {
                    window.avisSyndicaux.chargerDonnees();
                    console.log('[PAGE-LOADER] ✅ Données Avis Syndicaux chargées');
                } else {
                    console.warn('[PAGE-LOADER] ⚠️ window.avisSyndicaux non disponible');
                }
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Avis Syndicaux:', err);
        }
    } else if (pageId === 'parametres') {
        // Initialize Paramètres de l'Arrêt Annuel page
        try {
            const settingsModule = await import('../data/settings.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] ⚙️ Initialisation de la page Paramètres...');
                await settingsModule.initSettingsPage();
                console.log('[PAGE-LOADER] ✅ Page Paramètres initialisée');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation de la page Paramètres:', err);
        }
    } else if (pageId === 'detail-suivi-pieces-delai') {
        // Initialize Page Unifiée de Suivi des Pièces à Long Délai (90j, 60j, 30j)
        try {
            const [t30Module, t60Module, t88Module] = await Promise.all([
                import('../data/t30-long-delai.js'),
                import('../data/t60-long-delai.js'),
                import('../data/t88-long-delai.js')
            ]);

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📦 Initialisation SUIVI DES PIÈCES À LONG DÉLAI (T30, T60, T88)...');
                await Promise.all([
                    t30Module.loadT30Data(),
                    t60Module.loadT60Data(),
                    t88Module.loadT88Data()
                ]);
                console.log('[PAGE-LOADER] ✅ Données T30, T60 et T88 chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Suivi des Pièces:', err);
        }
    } else if (pageId === 'detail-t49') {
        // Redirection vers la page unifiée
        console.log('[PAGE-LOADER] 🔄 Redirection de detail-t49 vers detail-suivi-pieces-delai');
        await switchToPage('detail-suivi-pieces-delai');
        return;
    } else if (pageId === 'detail-t72') {
        // Initialize ÉTABLIR LE PROCESSUS DE SUIVI DE COÛT (T72)
        try {
            const t72Module = await import('../data/t72-suivi-cout.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 💰 Initialisation du Suivi de Coût T72...');
                await t72Module.loadT72Data();
                console.log('[PAGE-LOADER] ✅ Données T72 chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation T72:', err);
        }
    } else if (pageId === 'detail-amdec') {
        // Initialize AMDEC (Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité)
        try {
            const amdecModule = await import('../data/amdec-data.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 🔍 Initialisation de l\'Analyse AMDEC...');
                await amdecModule.initAmdec();
                console.log('[PAGE-LOADER] ✅ Module AMDEC initialisé');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation AMDEC:', err);
        }
    } else if (pageId === 'detail-t41') {
        // Initialize Inspection Équipements de Levage (T41)
        try {
            const inspectionModule = await import('../data/inspection-levage-data.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 🏗️ Initialisation Inspection Équipements de Levage...');
                await inspectionModule.loadInspectionData();
                console.log('[PAGE-LOADER] ✅ Données d\'inspection chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Inspection Levage:', err);
        }
    } else if (pageId === 'detail-approvisionnement') {
        // Initialize Stratégie d'Approvisionnement
        try {
            const strategieModule = await import('../data/strategie-data.js');

            // Wait for DOM to be ready
            setTimeout(async () => {
                console.log('[PAGE-LOADER] 📦 Initialisation Stratégie d\'Approvisionnement...');
                await strategieModule.loadStrategieData();
                console.log('[PAGE-LOADER] ✅ Données stratégie chargées');
            }, 100);
        } catch (err) {
            console.error('[PAGE-LOADER] ❌ Erreur lors de l\'initialisation Stratégie Approvisionnement:', err);
        }
    }
}

/**
 * Update navigation tab highlighting
 * @param {string} pageId - Current page ID
 */
function updateNavigationTabs(pageId) {
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(tab => {
        // Remove active class from all tabs
        tab.classList.remove('active');

        // Check if this tab corresponds to the current page
        const onclick = tab.getAttribute('onclick');
        if (onclick && onclick.includes(`'${pageId}'`)) {
            tab.classList.add('active');
        }
    });
}

/**
 * Preload a page component (without displaying it)
 * @param {string} pageId - Page identifier
 * @returns {Promise<void>}
 */
export async function preloadPage(pageId) {
    try {
        const html = await loadPageComponent(pageId);
        console.log(`[PAGE-LOADER] ✅ Page préchargée: ${pageId}`);
    } catch (error) {
        console.warn(`[PAGE-LOADER] ⚠️ Impossible de précharger ${pageId}:`, error);
    }
}

/**
 * Preload multiple pages in parallel
 * @param {string[]} pageIds - Array of page identifiers
 * @returns {Promise<void>}
 */
export async function preloadPages(pageIds) {
    console.log(`[PAGE-LOADER] 📦 Préchargement de ${pageIds.length} pages...`);

    const promises = pageIds.map(pageId => preloadPage(pageId));
    await Promise.allSettled(promises);

    console.log(`[PAGE-LOADER] ✅ Préchargement terminé`);
}

/**
 * Clear the page cache
 */
export function clearPageCache() {
    pageCache.clear();
    console.log('[PAGE-LOADER] 🗑️ Cache vidé');
}

/**
 * Get the currently active page ID
 * @returns {string|null}
 */
export function getCurrentPageId() {
    return currentPageId;
}

// Expose globally for HTML onclick handlers
if (typeof window !== 'undefined') {
    window.switchToPage = switchToPage;
    window.preloadPage = preloadPage;
    window.preloadPages = preloadPages;
    console.log('[PAGE-LOADER] ✅ Fonctions exposées globalement');
}

