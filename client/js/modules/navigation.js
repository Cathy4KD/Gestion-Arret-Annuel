/**
 * Module de navigation pour l'application d'arrêt annuel
 *
 * Ce module gère la navigation entre les différentes pages de l'application,
 * incluant le changement d'affichage des pages et l'activation des onglets.
 *
 * @module navigation
 * @source Lignes 13786-13899 du fichier source arret-annuel-avec-liste.html
 */

import { renderKanban, initKanbanDragDrop } from './ui/kanban.js';
import { renderCalendar } from './ui/calendar.js';

/**
 * Change la page active et déclenche les rendus appropriés
 *
 * Cette fonction:
 * - Désactive toutes les pages et onglets actuellement actifs
 * - Active la page demandée
 * - Active l'onglet correspondant si applicable
 * - Déclenche les fonctions de rendu spécifiques à chaque page
 *
 * @param {string} pageName - Le nom/ID de la page à afficher
 * @returns {void}
 *
 * @example
 * switchPage('timeline'); // Affiche la page timeline et rend le kanban/calendrier
 * switchPage('summary');  // Affiche la page summary et rend le tableau récapitulatif
 *
 * @dependencies
 * - Nécessite que les éléments DOM avec classe 'page' et 'nav-tab' existent
 * - Appelle diverses fonctions de rendu selon la page (renderKanban, renderCalendar, etc.)
 */
export async function switchPage(pageName) {
    console.log('[NAV] Changement de page vers: ' + pageName);

    // Redirection spéciale : T73 (FOURNIR LISTE DES PO) vers T25 (CRÉATION DE LA DA)
    if (pageName === 'detail-t73') {
        console.log('[NAV] Redirection t73 -> t25 (même page de création DA)');
        pageName = 'detail-t25';
    }

    // Redirection spéciale : T82 (SÉLECTIONNER TRAVAUX AMDEC) vers T71 (CHEMIN CRITIQUE)
    if (pageName === 'detail-t82') {
        console.log('[NAV] Redirection t82 -> t71 (même page chemin critique)');
        pageName = 'detail-t71';
    }

    // Désactiver toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Désactiver tous les onglets de navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Activer la page demandée
    const pageElement = document.getElementById(pageName);
    if (!pageElement) {
        console.error('[ERROR] Page non trouvee: ' + pageName);
        console.warn('[WARNING] Assurez-vous que le contenu HTML est charge');
        return;
    }

    pageElement.classList.add('active');

    // Activer l'onglet correspondant si disponible (pas pour les pages de détail)
    if (event && event.target && event.target.classList.contains('nav-tab')) {
        event.target.classList.add('active');
    }

    // Déclencher les rendus spécifiques selon la page
    if (pageName === 'summary') {
        // Charger le module dynamiquement pour éviter les imports circulaires
        import('./ui/summary.js').then(module => {
            module.renderSummaryTable();
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement du module summary:', err);
        });

        // Rendre le calendrier des tâches
        setTimeout(async () => {
            await renderCalendar();
            console.log('[NAV] Calendrier des tâches rendu');
        }, 100);
    } else if (pageName === 'dashboard') {
        // Initialiser les filtres et graphiques du Dashboard
        Promise.all([
            import('./ui/dashboard-filters.js'),
            import('./charts/dashboard-charts.js')
        ]).then(([filtersModule, chartsModule]) => {
            // Attendre que le DOM soit prêt
            setTimeout(async () => {
                await filtersModule.initDashboardFilters();
                await chartsModule.initDashboardCharts();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement du Dashboard:', err);
        });
    } else if (pageName === 'timeline') {
        // Charger et rendre le Kanban avec les données depuis arretData
        import('./ui/kanban.js').then(module => {
            setTimeout(async () => {
                console.log('[KANBAN] Rendu du Kanban depuis les données...');
                module.renderKanban();
                module.initKanbanDragDrop();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement du Kanban:', err);
        });

        // Rendre également le calendrier
        await renderCalendar();
    } else if (pageName.startsWith('detail-t') && ['detail-t10', 'detail-t11', 'detail-t12', 'detail-t13', 'detail-t14', 'detail-t15', 'detail-t16', 'detail-t17', 'detail-t18'].includes(pageName)) {
        // Charger les données SCOPE
        import('./scope/index.js').then(module => {
            setTimeout(async () => {
                const pageId = pageName.replace('detail-', '');
                module.loadScopeData(pageId);
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement du module SCOPE:', err);
        });

        // Initialiser le plan avec marqueurs pour cette page SCOPE
        import('./scope/scope-markers.js').then(module => {
            setTimeout(async () => {
                const pageId = pageName.replace('detail-', '');
                module.initScopePlan(pageId);
            }, 150);
        }).catch(err => {
            console.error('[ERROR] Erreur lors de l\'initialisation du plan SCOPE:', err);
        });
    } else if (pageName === 'detail-t19') {
        // Charger les données pour Liste des PSV
        import('./data/psv-data.js').then(module => {
            setTimeout(async () => {
                module.loadPSVData();
                module.renderPSVTable();
                module.renderUniquePSVTable();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Liste des PSV:', err);
        });
        // Initialiser les plans et marqueurs PSV
        import('./psv/psv-plan-markers.js').then(module => {
            setTimeout(async () => {
                module.loadPSVPlans();
            }, 150);
        }).catch(err => {
            console.error('[ERROR] Erreur lors de l\'initialisation des plans PSV:', err);
        });
    } else if (pageName === 'detail-ingq') {
        // Charger les données pour Projets INGQ
        import('./entities/ingq.js').then(module => {
            setTimeout(async () => {
                module.loadINGQData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page INGQ:', err);
        });
    } else if (pageName === 'detail-equipe' || pageName === 'detail-t24') {
        // Charger les données pour Équipe de Gestion
        import('./entities/team.js').then(module => {
            setTimeout(async () => {
                module.loadTeamData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Équipe:', err);
        });
    } else if (pageName === 'detail-t29') {
        // Charger les données pour VPO
        import('./data/vpo.js').then(module => {
            setTimeout(async () => {
                module.loadVPOData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page VPO:', err);
        });
    } else if (pageName === 'detail-t33') {
        // Charger les données pour T33 Priorisation des Demandes
        import('./data/t33-priorisation-data.js').then(module => {
            setTimeout(async () => {
                module.loadT33Data();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T33:', err);
        });
    } else if (pageName === 'detail-t40') {
        // Charger les données pour T40 Présentation aux Entrepreneurs
        import('./data/t40-entrepreneurs-data.js').then(module => {
            setTimeout(async () => {
                module.loadT40Data();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T40:', err);
        });
    } else if (pageName === 'detail-t55') {
        // Charger les données pour T55 Devis et Correction
        import('./data/t55-devis.js').then(module => {
            // Attendre que la page soit complètement affichée avant de charger les données
            setTimeout(async () => {
                console.log('[NAVIGATION] Chargement des données T55...');
                const selectElement = document.getElementById('t55EntrepreneurSelect');
                if (selectElement) {
                    console.log('[NAVIGATION] ✅ Select t55EntrepreneurSelect trouvé, chargement des données');
                    module.loadT55Data();
                } else {
                    console.warn('[NAVIGATION] ⚠️ Select t55EntrepreneurSelect NON trouvé, attente supplémentaire');
                    // Réessayer après un délai supplémentaire
                    setTimeout(() => {
                        module.loadT55Data();
                    }, 500);
                }
            }, 300);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T55:', err);
        });
    } else if (pageName === 'detail-t55-historique') {
        // Charger les données pour T55 Historique
        import('./data/t55-historique.js').then(module => {
            setTimeout(async () => {
                console.log('[NAVIGATION] Chargement des données T55 Historique...');
                const tbody = document.getElementById('t55HistoriqueStandaloneTableBody');
                if (tbody) {
                    console.log('[NAVIGATION] ✅ Tableau t55HistoriqueStandaloneTableBody trouvé, chargement des données');
                    await module.loadT55HistoriqueData();
                } else {
                    console.warn('[NAVIGATION] ⚠️ Tableau t55HistoriqueStandaloneTableBody NON trouvé, attente supplémentaire');
                    // Réessayer après un délai supplémentaire
                    setTimeout(async () => {
                        await module.loadT55HistoriqueData();
                    }, 500);
                }
            }, 300);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T55 Historique:', err);
        });
    } else if (pageName === 'detail-t45') {
        // Charger les données pour T45 Espace Clos
        import('./data/espace-clos-data.js').then(module => {
            setTimeout(async () => {
                module.loadEspaceClosData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T45:', err);
        });
    } else if (pageName === 'detail-t63') {
        // Charger les données pour T63 Zones Entreposage
        import('./data/t63-zones.js').then(module => {
            setTimeout(async () => {
                module.loadZonesData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T63:', err);
        });

        // Initialiser l'éditeur de plan (le module est déjà chargé dans init.js)
        setTimeout(() => {
            console.log('[NAVIGATION] Initialisation de l\'éditeur de plan...');
            console.log('[NAVIGATION] window.zonesPlanEditor disponible:', typeof window.zonesPlanEditor);

            if (typeof window.zonesPlanEditor !== 'undefined' && window.zonesPlanEditor.initPlanEditor) {
                const canvas = document.getElementById('zonesPlanCanvas');
                if (canvas) {
                    console.log('[NAVIGATION] ✅ Canvas trouvé, appel de initPlanEditor()');
                    window.zonesPlanEditor.initPlanEditor();
                } else {
                    console.warn('[NAVIGATION] ⚠️ Canvas NON trouvé, attente supplémentaire');
                    setTimeout(() => {
                        const retryCanvas = document.getElementById('zonesPlanCanvas');
                        if (retryCanvas) {
                            console.log('[NAVIGATION] ✅ Canvas trouvé après attente, appel de initPlanEditor()');
                            window.zonesPlanEditor.initPlanEditor();
                        } else {
                            console.error('[NAVIGATION] ❌ Canvas toujours non trouvé après 800ms, abandon');
                        }
                    }, 500);
                }
            } else {
                console.error('[NAVIGATION] ❌ window.zonesPlanEditor non disponible!');
            }
        }, 300);
    } else if (pageName === 'detail-t65') {
        // Charger les données pour T65 Plans de Levage
        import('./data/plan-levage-data.js').then(module => {
            setTimeout(async () => {
                module.loadPlanLevageData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T65:', err);
        });
    } else if (pageName === 'detail-t68') {
        // Charger les données pour T68 Besoins de Nettoyage
        import('./data/besoins-nettoyage-data.js').then(module => {
            setTimeout(() => {
                module.initBesoinsNettoyage();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T68:', err);
        });
    } else if (pageName === 'detail-purges-gaz') {
        // Charger les données pour Validation Points Purges Gaz CO
        import('./data/purges-gaz-data.js').then(module => {
            setTimeout(() => {
                module.initPurgesGazModule();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Purges Gaz:', err);
        });
    } else if (pageName === 'detail-consommables') {
        // Charger les données pour Commande des Consommables d'Arrêt
        import('./data/consommables-commande-data.js').then(module => {
            setTimeout(() => {
                module.initConsommablesCommandeModule();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Consommables:', err);
        });
    } else if (pageName === 'detail-t79') {
        // Charger les données pour T79 Équipements en Location
        setTimeout(() => {
            console.log('[NAVIGATION] Initialisation du module Équipements en Location...');
            import('./data/equip-location-data.js').then(module => {
                const tableBody = document.getElementById('equipLocationTableBody');
                const canvas = document.getElementById('equipLocationPlanCanvas');

                console.log('[NAVIGATION] Éléments trouvés:', {
                    tableBody: !!tableBody,
                    canvas: !!canvas
                });

                if (tableBody && canvas) {
                    console.log('[NAVIGATION] ✅ Tous les éléments trouvés, initialisation immédiate');
                    module.initEquipLocationModule();
                } else {
                    console.warn('[NAVIGATION] ⚠️ Éléments manquants, attente supplémentaire...');
                    setTimeout(() => {
                        const retryTableBody = document.getElementById('equipLocationTableBody');
                        const retryCanvas = document.getElementById('equipLocationPlanCanvas');
                        console.log('[NAVIGATION] Retry - Éléments trouvés:', {
                            tableBody: !!retryTableBody,
                            canvas: !!retryCanvas
                        });
                        module.initEquipLocationModule();
                    }, 500);
                }
            }).catch(err => {
                console.error('[ERROR] Erreur lors du chargement de la page T79:', err);
            });
        }, 400);
    } else if (pageName === 'detail-suivi-pieces-delai' || pageName === 'detail-t30' || pageName === 'detail-t49' || pageName === 'detail-t88') {
        // Charger les données pour la page unifiée de Suivi des Pièces à Long Délai (90j, 60j, 30j)
        console.log('[NAV] 🔄 Chargement de la page Suivi des Pièces à Long Délai...');
        Promise.all([
            import('./data/t30-long-delai.js'),
            import('./data/t60-long-delai.js'),
            import('./data/t88-long-delai.js')
        ]).then(([t30Module, t60Module, t88Module]) => {
            console.log('[NAV] ✅ Modules T30, T60, T88 chargés');

            // Attendre que le DOM soit complètement chargé
            const waitForDOM = setInterval(async () => {
                const t30Body = document.getElementById('t30TableBody');
                const t60Body = document.getElementById('t60TableBody');
                const t88Body = document.getElementById('t88TableBody');

                if (t30Body && t60Body && t88Body) {
                    clearInterval(waitForDOM);
                    console.log('[NAV] ✅ DOM prêt, chargement des données...');

                    try {
                        await t30Module.loadT30Data();
                        await t60Module.loadT60Data();
                        await t88Module.loadT88Data();
                        console.log('[NAV] ✅ Toutes les données chargées et affichées');
                    } catch (error) {
                        console.error('[NAV] ❌ Erreur lors du chargement des données:', error);
                    }
                }
            }, 50); // Vérifier toutes les 50ms

            // Timeout de sécurité après 5 secondes
            setTimeout(() => {
                clearInterval(waitForDOM);
                console.warn('[NAV] ⚠️ Timeout - Chargement forcé');
            }, 5000);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Suivi des Pièces:', err);
        });
    } else if (pageName === 'detail-t60') {
        // Charger les données pour T60 Commandes Long Délai 60-89j
        import('./data/t60-long-delai.js').then(module => {
            setTimeout(async () => {
                module.loadT60Data();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T49/T60:', err);
        });
    } else if (pageName === 'detail-t71') {
        // Charger les données pour Chemin Critique
        import('./data/chemin-critique.js').then(module => {
            setTimeout(async () => {
                module.loadCheminCritiqueData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Chemin Critique:', err);
        });
    } else if (pageName === 'detail-t20-t21') {
        // Charger les données pour Liste des TPAA et PW
        Promise.all([
            import('./data/tpaa-data.js'),
            import('./data/pw-data.js')
        ]).then(([tpaaModule, pwModule]) => {
            setTimeout(async () => {
                tpaaModule.loadTPAAListeData();
                pwModule.loadPWData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page TPAA/PW:', err);
        });
    } else if (pageName === 'detail-t3') {
        // Charger les données pour Plans d'Entretien
        import('./data/plans-entretien.js').then(module => {
            setTimeout(async () => {
                module.loadPlansData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Plans d\'Entretien:', err);
        });
    } else if (pageName === 'detail-t4') {
        // Charger les données pour Liste des Projets
        import('./data/projets-data.js').then(module => {
            setTimeout(async () => {
                module.loadProjetsData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Projets:', err);
        });
    } else if (pageName === 'detail-t5') {
        // Charger les données pour Rencontre de Définition
        import('./data/rencontre-data.js').then(module => {
            setTimeout(async () => {
                module.loadRencontreData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Rencontre:', err);
        });
    } else if (pageName === 'detail-t8') {
        // Charger les données pour Révision Liste Travaux
        import('./data/revision-travaux-data.js').then(module => {
            setTimeout(async () => {
                module.loadRevisionListeData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Révision Travaux:', err);
        });
    } else if (pageName === 'detail-approvisionnement') {
        // Charger les données pour Stratégie d'Approvisionnement
        import('./data/strategie-data.js').then(module => {
            setTimeout(async () => {
                module.loadStrategieData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Stratégie:', err);
        });
    } else if (pageName === 'detail-travaux-entrepreneur') {
        // Charger les données pour Travaux Entrepreneur
        import('./data/entrepreneur-data.js').then(module => {
            setTimeout(async () => {
                module.initEntrepreneurPage();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Entrepreneur:', err);
        });
    } else if (pageName === 'parametres') {
        // Initialiser la page des Paramètres
        import('./data/settings.js').then(module => {
            setTimeout(async () => {
                module.initSettingsPage();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Paramètres:', err);
        });
    } else if (pageName === 'avis') {
        // Initialiser la page des Avis
        import('./data/avis-data.js').then(module => {
            setTimeout(async () => {
                module.initAvisPage();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Avis:', err);
        });
    } else if (pageName === 'plan-suivis-journaliers') {
        // Charger les données pour la page Plan et Suivis Journaliers
        import('./plans/plan-suivis-journaliers.js').then(module => {
            setTimeout(async () => {
                console.log('[NAV] Initialisation de la page Plan et Suivis Journaliers...');
                module.initPlanSuivisPage();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Plan et Suivis Journaliers:', err);
        });
    } else if (pageName === 'detail-t64') {
        // Charger le Gantt du protocole d'arrêt et drainage
        import('./data/protocole-gantt.js').then(module => {
            setTimeout(async () => {
                console.log('[NAV] Initialisation du Gantt du protocole d\'arrêt...');
                module.initGantt();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement du Gantt:', err);
        });
    } else if (pageName.startsWith('detail-')) {
        // Pour toutes les autres pages de détail, utiliser le module data-pages
        const pageId = pageName.replace('detail-', '');
        import('./data/data-pages.js').then(module => {
            setTimeout(async () => {
                await module.loadDataPage(pageId);
            }, 100);
        }).catch(err => {
            console.error(`[ERROR] Erreur lors du chargement de la page ${pageId}:`, err);
        });
    }

    console.log('[NAV] Page activee: ' + pageName);

    // Appeler les fonctions de rendu selon la page
    if (pageName === 'timeline') {
        console.log('[NAV] Rendu de la page Timeline (Kanban)');
        renderKanban();
        // Attendre que le DOM soit mis à jour avant d'initialiser le drag & drop
        setTimeout(async () => {
            initKanbanDragDrop();
            console.log('[NAV] Drag & drop Kanban initialisé');
        }, 100);
        await renderCalendar();
    }
    /* Fonctions de rendu des autres pages (commentées pour l'instant)
    if (pageName === 'timeline') {
        if (typeof renderKanban === 'function') renderKanban();
        if (typeof renderCalendar === 'function') await renderCalendar();
    } else if (pageName === 'summary') {
        renderSummaryTable();
    } else if (pageName === 'execution_suivi') {
        renderExecutionSuiviTable();
    } else if (pageName === 'post_mortem') {
        renderPostMortemTable();
    } else if (pageName === 'dashboard') {
        updateCharts();
    } else if (pageName === 'execution') {
        renderExecutionJournal();
        renderExecutionIncidents();
        renderExecutionTravaux();
    } else if (pageName === 'historique') {
        renderArchivesList();
    } else if (pageName === 'iw37n') {
        renderIw37nTable();
    } else if (pageName === 'contacts') {
        renderContactsTable();
    } else if (pageName === 'detail-t5') {
        loadRencontreData();
    } else if (pageName === 'detail-t21') {
        loadIncendieData();
    } else if (pageName === 'detail-t8') {
        renderRevisionListeTable();
    } else if (pageName === 'detail-t19') {
        renderPSVTable();
        renderUniquePSVTable();
    } else if (pageName === 'psv_caracteristiques') {
        // Charger les données avant de les afficher
        import('./data/psv-data.js').then(module => {
            module.loadPSVCharsData().then(() => {
                module.renderPSVCharsTable();
            });
        });
    } else if (pageName === 'detail-t26') {
        // Charger les tableaux TPAA et PW
        import('./data/tpaa-pw-data.js').then(module => {
            setTimeout(async () => {
                module.loadTPAAPW();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement des tableaux TPAA/PW:', err);
        });
    } else if (pageName === 'detail-t43') {
        loadT43Data();
    } else if (pageName === 'detail-t50') {
        // Charger les données pour T50 Tours de Refroidissement
        import('./data/tours-refroidissement-data.js').then(module => {
            setTimeout(async () => {
                await module.loadToursRefroidissementData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T50:', err);
        });
    } else if (pageName === 'detail-suivi-cout') {
        // Charger les données pour Suivi de Coût
        import('./data/suivi-cout-data.js').then(module => {
            setTimeout(async () => {
                module.loadSuiviCoutData();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement du Suivi de Coût:', err);
        });
    } else if (pageName === 'detail-t51') {
        // Charger les données des soumissions
        import('./data/t51-soumissions.js').then(module => {
            setTimeout(async () => {
                await module.loadT51Data();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T51:', err);
        });
    } else if (pageName === 'detail-t57') {
        // Charger les données pour T57 Équipements de Travail en Hauteur et Nacelles
        Promise.all([
            import('./data/travail-hauteur-data.js'),
            import('./data/nacelles-data.js')
        ]).then(([travailHauteurModule, nacellesModule]) => {
            // Attendre que la page soit complètement affichée
            setTimeout(async () => {
                console.log('[NAVIGATION] Chargement des données Travail en Hauteur et Nacelles...');

                // Charger ET rendre le tableau des équipements de travail en hauteur
                const travailTableBody = document.getElementById('travailHauteurTableBody');
                if (travailTableBody) {
                    console.log('[NAVIGATION] ✅ Table Travail en Hauteur trouvée, chargement des données');
                    await travailHauteurModule.loadTravailHauteurData();
                } else {
                    console.warn('[NAVIGATION] ⚠️ Table Travail en Hauteur NON trouvée, attente supplémentaire');
                    setTimeout(() => {
                        travailHauteurModule.loadTravailHauteurData();
                    }, 500);
                }

                // Charger ET rendre le tableau des nacelles
                const nacellesTableBody = document.getElementById('nacellesTableBody');
                if (nacellesTableBody) {
                    console.log('[NAVIGATION] ✅ Table Nacelles trouvée, chargement des données');
                    await nacellesModule.loadNacellesData();
                } else {
                    console.warn('[NAVIGATION] ⚠️ Table Nacelles NON trouvée, attente supplémentaire');
                    setTimeout(() => {
                        nacellesModule.loadNacellesData();
                    }, 500);
                }
            }, 300);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T57:', err);
        });
    } else if (pageName === 'detail-t58') {
        // Charger les données pour T58 Rencontres Hebdo
        import('./data/rencontres-hebdo-data.js').then(module => {
            // Attendre que la page soit complètement affichée avant de charger les données
            setTimeout(async () => {
                console.log('[NAVIGATION] Chargement des données Rencontres Hebdo...');
                const listContainer = document.getElementById('rencontresHebdoListContainer');
                if (listContainer) {
                    console.log('[NAVIGATION] ✅ Container trouvé, chargement des données');
                    module.loadRencontresHebdoData();
                } else {
                    console.warn('[NAVIGATION] ⚠️ Container NON trouvé, attente supplémentaire');
                    // Réessayer après un délai supplémentaire
                    setTimeout(() => {
                        module.loadRencontresHebdoData();
                    }, 500);
                }
            }, 300);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page T58:', err);
        });
    } else if (pageName === 'detail-t72') {
        // Charger les données T72 - Suivi de Coût
        console.log('[NAV] 🔍 Tentative de chargement du module T72...');
        import('./data/t72-suivi-cout.js').then(module => {
            console.log('[NAV] ✅ Module T72 importé avec succès', module);
            setTimeout(() => {
                console.log('[NAV] 🚀 Appel de loadT72Data()...');
                module.loadT72Data();
            }, 100);
        }).catch(err => {
            console.error('[NAV] ❌ Erreur lors du chargement de la page T72:', err);
            console.error('[NAV] ❌ Détails de l\'erreur:', err.stack);
        });
    } else if (pageName === 'detail-t75') {
        loadT75Data();
    } else if (pageName === 'detail-t71') {
        loadT71Data();
    } else if (pageName === 'liste-entrepreneurs') {
        loadT71Data();
    } else if (pageName === 'detail-t87') {
        loadT71Data();
        loadSMEDData();
        loadSMEDTasksSelection();
    } else if (pageName === 'detail-t82') {
        loadAMDECData();
        loadAMDECTasksSelection();
        if (amdecAnalyses.length > 0) {
            renderAMDECAnalyses();
            document.getElementById('amdecAnalysisContainer').style.display = 'block';
            document.getElementById('amdecSummary').style.display = 'block';
            updateAMDECSummary();
        }
    } else if (pageName === 'detail-t91') {
        renderT91Table();
        updateT91Dropdowns();
    } else if (pageName === 'plan-suivis-journaliers') {
        // Charger les données pour la page Plan et Suivis Journaliers
        import('./plans/plan-suivis-journaliers.js').then(module => {
            setTimeout(async () => {
                console.log('[NAV] Initialisation de la page Plan et Suivis Journaliers...');
                module.initPlanSuivisPage();
            }, 100);
        }).catch(err => {
            console.error('[ERROR] Erreur lors du chargement de la page Plan et Suivis Journaliers:', err);
        });
    } else if (pageName === 'detail-t95') {
        loadT95Data();
    } else if (pageName === 'detail-t10' || pageName === 'detail-t11' || pageName === 'detail-t12' ||
               pageName === 'detail-t13' || pageName === 'detail-t14' || pageName === 'detail-t15' ||
               pageName === 'detail-t16' || pageName === 'detail-t17' || pageName === 'detail-t18') {
        // Charger les données pour les pages Scope
        const pageId = pageName.replace('detail-', '');
        loadScopeData(pageId);

        // Si c'est la page t14, charger aussi les fichiers
        if (pageName === 'detail-t14') {
            renderT14PlansList();
        }
    }
    */
}

/**
 * Retourne la classe CSS correspondant au statut donné
 *
 * @param {string} statut - Le statut de la tâche ('completed', 'inprogress', 'cancelled', 'notstarted')
 * @returns {string} La classe CSS correspondante
 *
 * @example
 * getStatusClass('completed'); // Retourne 'status-completed'
 * getStatusClass('inprogress'); // Retourne 'status-inprogress'
 * getStatusClass('invalid');    // Retourne 'status-notstarted' (défaut)
 */
export function getStatusClass(statut) {
    switch(statut) {
        case 'completed':
            return 'status-completed';
        case 'inprogress':
            return 'status-inprogress';
        case 'cancelled':
            return 'status-cancelled';
        default:
            return 'status-notstarted';
    }
}


