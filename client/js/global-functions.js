/**
 * @fileoverview Fonctions globales exposées pour les onclick dans le HTML
 * Ce fichier expose toutes les fonctions nécessaires pour les boutons onclick dans index-acierie.html
 * @module global-functions
 * @version 1.0.0
 */

// Importer les modules nécessaires
import { switchToPage, preloadPage, preloadPages } from './modules/ui/page-loader.js';
import { loadIw37nDataFromServer, setIw37nData, saveIw37nData, renderIw37nTable, getUniquePostesTechniques, getActiveWorkForPoste, getIw37nData, getSelectedIw37nRow } from './modules/data/iw37n-data.js';
import { loadIw38DataFromServer, setIw38Data } from './modules/data/iw38-data.js';
import { renderSummaryTable } from './modules/ui/summary.js';
import { changeCalendarMonth } from './modules/ui/calendar.js';
import { renderKanban, initKanbanDragDrop } from './modules/ui/kanban.js';
import {
    enableFileDropZone,
    enableFileDropOnAllUploads,
    disableFileDropZone
} from './modules/ui/drag-drop.js';
import {
    loadPlansData,
    handlePlansUpload,
    renderPlansTable,
    addModificationRow,
    updateModificationField,
    deleteModification,
    renderModificationsTable
} from './modules/data/plans-entretien.js';
import {
    loadRencontreData,
    saveRencontreData,
    getRencontreData
} from './modules/data/rencontre-data.js';
import {
    loadToursRefroidissementData,
    saveToursRefroidissementData,
    addToursRefroidissementTravail,
    updateTravailField,
    deleteTravail,
    addNewRencontre,
    selectRencontre,
    deleteRencontre,
    updateRencontreTitre,
    addToursDocument,
    deleteToursDocument,
    exportToursRefroidissementComplet,
    exportToursRefroidissementToExcel
} from './modules/data/tours-refroidissement-data.js';
import {
    loadSuiviCoutData,
    addLigneManuelle,
    updateLigneManuelle,
    deleteLigneManuelle,
    addSoumissionEntrepreneur,
    updateSoumissionEntrepreneur,
    deleteSoumissionEntrepreneur,
    exportSuiviCoutToExcel
} from './modules/data/suivi-cout-data.js';
import {
    loadProjetsData,
    addProjetRow,
    deleteProjet,
    updateProjetField,
    renderProjetsTable,
    handleProjetsUpload,
    getProjetsData,
    uploadProjetDocument,
    deleteProjetDocument
} from './modules/data/projets-data.js';
import {
    loadMaintenancesCapitalisablesData,
    addMaintenanceCapitalisableRow,
    deleteMaintenanceCapitalisable,
    updateMaintenanceCapitalisableField,
    renderMaintenancesCapitalisablesTable,
    handleMaintenancesCapitalisablesUpload,
    getMaintenancesCapitalisablesData,
    handleMaintenanceAttachmentUpload,
    deleteMaintenanceAttachment,
    viewMaintenanceAttachment
} from './modules/data/maintenances-capitalisables-data.js';
import {
    loadRevisionListeData,
    syncRevisionListeFromIw37n,
    updateRevisionStatut,
    updateRevisionField,
    deleteRevisionItem,
    renderRevisionListeTable,
    exportRevisionListeToExcel,
    getRevisionData,
    clearAllRevisionData
} from './modules/data/revision-travaux-data.js';
import {
    initPointPresseUI,
    showAddForm as showPointPresseAddForm,
    showEditForm as showPointPresseEditForm,
    renderPointPresseList,
    deletePointPresseUI,
    exportToExcelUI as exportPointPresseToExcelUI,
    generatePDFUI as generatePointPressePDFUI
} from './modules/ui/point-presse-ui.js';
import {
    loadPSVData,
    syncPSVFromIw37n,
    renderPSVTable,
    renderUniquePSVTable,
    exportPSVToExcel,
    exportAndEmailUniquePSV,
    handlePSVCharsUpload,
    exportPSVCharsToExcel,
    viewPSVCharacteristics,
    handlePSVPhotoUpload,
    deletePSVPhoto,
    viewPSVPhoto
} from './modules/data/psv-data.js';
import {
    loadTPAAListeData,
    syncTPAAFromIw37n as syncTPAA,
    updateTPAAStatut as updateTPAAStatus,
    updateTPAAJoursSupp as updateTPAADays,
    updateTPAACommentaire as updateTPAAComment,
    exportTPAAToExcel as exportTPAA,
    renderTPAATable
} from './modules/data/tpaa-data.js';
import {
    loadPWData,
    syncPWFromIw37n,
    updatePWStatut,
    updatePWJoursSupp,
    updatePWCommentaire,
    exportPWToExcel,
    renderPWTable
} from './modules/data/pw-data.js';
import {
    loadApprovisionnementData,
    addApprovisionnementRow as addApprovisionnementRowModule,
    deleteApprovisionnementRow,
    updateApprovisionnementField,
    toggleHistoryColumns as toggleApproHistoryColumns,
    renderApprovisionnementTable,
    getApprovisionnementData
} from './modules/data/approvisionnement-data.js';
import {
    loadStrategieData,
    addStrategieRow,
    deleteStrategie,
    updateStrategieField,
    toggleHistoriqueColumns,
    renderStrategieTable,
    exportStrategieToExcel,
    getStrategieData
} from './modules/data/strategie-data.js';
import {
    syncEntrepreneurFromIw37n,
    filterByPoste,
    exportToExcel as exportEntrepreneurToExcel,
    initEntrepreneurPage
} from './modules/data/entrepreneur-data.js';
import {
    loadEspaceClosData,
    syncEspaceClosFromIw37n,
    renderEspaceClosTable,
    exportEspaceClosToExcel,
    getEspaceClosData
} from './modules/data/espace-clos-data.js';
import {
    loadAmenagementData,
    handleAmenagementImageUpload,
    renderAmenagementPlans,
    downloadPlan as downloadAmenagementPlan,
    deletePlan as deleteAmenagementPlan,
    openPlanEditor,
    exportAmenagementData,
    getAmenagementData
} from './modules/data/amenagement-data.js';
import {
    loadT40Data,
    syncEntrepreneursFromIw37n,
    renderT40Table,
    exportToExcel as exportT40ToExcel,
    getT40Data,
    setT40Data,
    addManualEntrepreneur
} from './modules/data/t40-entrepreneurs-data.js';
import {
    loadT33Data,
    syncFromAvis,
    renderT33Table,
    exportToExcel as exportT33ToExcel,
    getT33Data
} from './modules/data/t33-priorisation-data.js';
import {
    loadTPAAPW,
    exportTPAAListToExcel,
    exportPWListToExcel,
    updateManualField,
    adjustDays,
    sortTPAAByDate,
    sortPWByDate,
    sortTPAABy,
    sortPWBy,
    filterTPAA,
    filterPW,
    clearTPAAFilters,
    clearPWFilters,
    refreshFromIW37N,
    renderCalendar,
    previousMonth,
    nextMonth
} from './modules/data/tpaa-pw-data.js';
import {
    loadT51Data,
    addT51Soumission,
    syncT51Entrepreneurs,
    renderT51Table,
    updateT51Field,
    deleteT51Soumission,
    uploadT51Document,
    deleteT51Document,
    updateT51Stats,
    exportT51ToExcel
} from './modules/data/t51-soumissions.js';
import {
    loadSettings,
    saveSettings,
    getStartDate,
    getEndDate,
    getBudget,
    getArretDuration,
    initSettingsPage,
    saveSettingsFromForm,
    cancelSettings,
    handleStartDateChange,
    handleEndDateChange,
    handleDurationChange,
    extractExternals,
    updateExternalDescription,
    loadExternalsPage,
    getExternalDescription,
    getAllExternals
} from './modules/data/settings.js';
import { importIW37N } from './modules/import-export/excel-import.js';
import {
    exportPreparationPDF,
    toggleReunionsMenu,
    exportReunionsSummaryPDF,
    exportReunionsCompletePDF
} from './modules/export/preparation-pdf-export.js';
import {
    openModal,
    closeModal,
    closeAllModals,
    createModal,
    updateModalContent,
    showConfirmModal,
    showAlertModal
} from './modules/modals/index.js';
import {
    loadScopeData,
    togglePosteDropdown,
    selectAllPostesTechniques,
    deselectAllPostesTechniques,
    exportScopeToExcel
} from './modules/scope/index.js';
import {
    loadDataPage,
    togglePosteDropdown as toggleDataPosteDropdown,
    selectAllPostesTechniques as selectAllDataPostesTechniques,
    deselectAllPostesTechniques as deselectAllDataPostesTechniques,
    exportToExcel as exportDataToExcel,
    handleT21PhotoUpload,
    deleteT21Photo,
    updateT21Commentaire,
    filterIW37NTable,
    updateSoumissionMontant,
    getSoumissionsManualData
} from './modules/data/data-pages.js';
import {
    loadINGQData,
    addProjet as addINGQProjet,
    deleteProjet as deleteINGQProjet,
    updateField as updateINGQField,
    renderTable as renderINGQTable,
    exportToExcel as exportINGQToExcel
} from './modules/entities/ingq.js';
import {
    loadTeamData,
    addTeamMember,
    deleteTeamMember,
    updateTeamField,
    renderTeamTable,
    renderOrganigramme,
    exportTeamToExcel
} from './modules/entities/team.js';
import {
    loadVPOData,
    addVPO,
    deleteVPO,
    updateVPOField,
    renderVPOTable,
    exportVPOToExcel,
    addVPODocument,
    removeVPODocument,
    getVPOData
} from './modules/data/vpo.js';
import {
    loadT55Data,
    saveT55Data,
    syncT55Entrepreneurs,
    loadT55EntrepreneurData,
    getT55Data
} from './modules/data/t55-devis.js';
import {
    loadT30Data,
    syncT30FromIW38,
    renderT30Table,
    exportT30ToExcel,
    updateT30CommandeField,
    getT30Data,
    toggleT30Sort,
    updateT30Search
} from './modules/data/t30-long-delai.js';
import {
    loadT60Data,
    syncT60FromIW38,
    renderT60Table,
    exportT60ToExcel,
    updateT60CommandeField,
    getT60Data
} from './modules/data/t60-long-delai.js';
import {
    loadT88Data,
    syncT88FromIW38,
    renderT88Table,
    exportT88ToExcel,
    updateT88CommandeField,
    getT88Data,
    toggleT88Sort,
    updateT88Search
} from './modules/data/t88-long-delai.js';
import {
    loadCheminCritiqueData,
    addCheminCritiqueTask,
    deleteCheminCritiqueTask,
    updateCheminCritiqueField,
    moveTaskUp,
    moveTaskDown,
    renderCheminCritiqueTable,
    exportCheminCritiqueToExcel,
    getCheminCritiqueData
} from './modules/data/chemin-critique.js';
import {
    showTaskDetails
} from './modules/ui/dashboard-actions.js';
import {
    initDashboardFilters,
    applyFilter as applyDashboardFilter,
    resetFilters
} from './modules/ui/dashboard-filters.js';
import { switchPage } from './modules/navigation.js';
import {
    loadPlanData,
    renderPlansList,
    openPlanInEdition,
    openPlanInLecture,
    savePlanEdition as savePlanEditionData,
    deletePlan,
    loadPlanImage as loadPlanImageFunction
} from './modules/plans/plan-renderer.js';
import {
    loadPlanSuivisData,
    initPlanSuivisPage,
    loadMSProjectFile as loadMSProjectFileFunc,
    renderMSProjectFilesList,
    viewMSProjectFile,
    deleteMSProjectFile,
    loadPlanImage as loadPlanImageSuivis,
    renderPlansList as renderPlansSuivisList,
    editPlan,
    viewPlan,
    deletePlan as deletePlanSuivis,
    switchToModeEdition as switchModeEdition,
    switchToModeLecture as switchModeLecture,
    closeModeEdition,
    savePlanEdition as savePlanEditionSuivis,
    deleteSelectedMarker as deleteSelectedMarkerPlan,
    updateMarkersForTimeline,
    toggleHeatmapMode,
    changePlacementMode
} from './modules/plans/plan-suivis-journaliers.js';
import {
    loadDemandesVerrouillage,
    addDemandeVerrouillage as addVerrouillage,
    deleteDemandeVerrouillage,
    exportDemandesVerrouillageToExcel as exportVerrouillage,
    renderDemandesVerrouillage
} from './modules/demandes/verrouillage.js';
import {
    loadDemandesGruesNacelles,
    addDemandeGrueNacelle as addGrueNacelle,
    deleteDemandeGrueNacelle,
    exportDemandesGruesNacellesToExcel as exportGruesNacelles,
    renderDemandesGruesNacelles
} from './modules/demandes/grues-nacelles.js';
import {
    loadDemandesEchafaudages,
    addDemandeEchafaudage as addEchafaudage,
    deleteDemandeEchafaudage,
    exportDemandesEchafaudagesToExcel as exportEchafaudages,
    renderDemandesEchafaudages
} from './modules/demandes/echafaudages.js';
import {
    openResponsibleModal,
    closeResponsibleModal,
    saveResponsibles,
    closeModalOnOverlay,
    openResponsibleModalForTask
} from './modules/ui/responsable-modal.js';
import {
    loadScopeMarkers,
    initScopePlan,
    handleScopePlanUpload,
    clearScopePlan,
    exportScopeMarkers,
    switchPlan,
    zoomIn,
    zoomOut,
    resetZoom
} from './modules/scope/scope-markers.js';
import {
    loadPSVPlans,
    handlePSVPlanUpload,
    handlePSVImageClick,
    deletePSVMarker,
    switchPSVPlan,
    clearPSVPlan,
    zoomInPSV,
    zoomOutPSV,
    resetZoomPSV
} from './modules/psv/psv-plan-markers.js';
import {
    createArchive,
    downloadBackup,
    restoreFromFile,
    showBackupsList
} from './modules/backup/backup-manager.js';

/**
 * Expose toutes les fonctions globalement via window
 * pour qu'elles soient accessibles depuis les onclick dans le HTML
 */
export function exposeGlobalFunctions() {
    console.log('[GLOBAL] Exposition des fonctions globales...');

    // ==================== FONCTIONS DE CHARGEMENT ====================

    window.loadIw37nDataFromServer = async function() {
        console.log('[IMPORT] Chargement des données IW37N...');

        // Récupérer le fichier sélectionné
        const select = document.getElementById('iw37nFileSelect');
        if (!select) {
            alert('❌ Élément de sélection non trouvé');
            return;
        }

        const fileName = select.value;
        if (!fileName) {
            alert('⚠️ Veuillez sélectionner un fichier IW37N dans la liste');
            return;
        }

        try {
            console.log(`[IMPORT] Chargement du fichier: ${fileName}`);
            const success = await loadIw37nDataFromServer(fileName);

            if (success) {
                console.log('[OK] ✅ Données IW37N chargées ET sauvegardées sur le serveur');
            } else {
                console.error('[ERROR] ❌ Échec du chargement ou de la sauvegarde');
            }
        } catch (error) {
            console.error('[ERROR] Erreur lors du chargement IW37N:', error);
            alert(`❌ Erreur: ${error.message}`);
        }
    };

    // Fonction pour importer un fichier Excel IW37N depuis l'ordinateur
    window.importIw37nFile = function() {
        console.log('[IMPORT] Sélection d\'un fichier IW37N...');

        // Créer un input file temporaire
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';

        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            console.log('[IMPORT] Fichier sélectionné:', file.name);

            try {
                const data = await importIW37N(file);
                console.log('[OK]', data.length, 'lignes importées');

                // Stocker les données
                if (typeof setIw37nData === 'function') {
                    setIw37nData(data);
                } else {
                    console.error('[ERROR] setIw37nData non disponible');
                    alert('❌ Erreur: Fonction setIw37nData non trouvée');
                    return;
                }

                // Rafraîchir l'affichage du tableau
                window.renderIw37nTable(data);

                // IMPORTANT: Sauvegarder les données sur le serveur (ATTENDRE la confirmation)
                console.log('[SAVE] 💾 Sauvegarde sur le serveur...');

                if (typeof saveIw37nData === 'function') {
                    const saveSuccess = await saveIw37nData();

                    if (saveSuccess) {
                        console.log('[SAVE] ✅ Données IW37N VRAIMENT sauvegardées sur le serveur');
                        alert(`✅ SUCCÈS!\n\n${data.length} lignes importées ET sauvegardées sur le serveur.\n\nVous pouvez rafraîchir la page (F5) pour vérifier.`);
                    } else {
                        console.error('[SAVE] ❌ ÉCHEC de la sauvegarde sur le serveur');
                        alert(`⚠️ ATTENTION!\n\n${data.length} lignes importées mais PAS sauvegardées sur le serveur.\n\nElles seront perdues au rafraîchissement.\n\nVérifiez que le serveur est connecté.`);
                    }
                } else {
                    console.error('[ERROR] saveIw37nData non disponible');
                    alert(`⚠️ ${data.length} lignes importées mais fonction de sauvegarde non trouvée.`);
                }
            } catch (error) {
                console.error('[ERROR] Erreur lors de l\'import:', error);
                alert('Erreur lors de l\'import du fichier: ' + error.message);
            }
        };

        input.click();
    };

    // Exposer les setters globalement pour l'injection directe depuis le serveur
    window.setIw37nData = setIw37nData;
    window.setIw38Data = setIw38Data;
    window.setT40Data = setT40Data;

    window.loadIw38DataFromServer = async function() {
        console.log('[IMPORT] Chargement des données IW38...');
        try {
            await loadIw38DataFromServer();
            console.log('[OK] Données IW38 chargées');
        } catch (error) {
            console.error('[ERROR] Erreur lors du chargement IW38:', error);
        }
    };

    window.loadMSProjectFile = async function() {
        console.log('[INFO] Fonction loadMSProjectFile appelée');
        try {
            loadMSProjectFileFunc();
        } catch (error) {
            console.error('[ERROR] Erreur lors du chargement du fichier MS Project:', error);
            alert('❌ Erreur lors du chargement du fichier: ' + error.message);
        }
    };

    window.loadPlanImage = async function() {
        console.log('[INFO] Fonction loadPlanImage appelée');
        try {
            loadPlanImageSuivis();
        } catch (error) {
            console.error('[ERROR] Erreur lors du chargement du plan:', error);
            alert('❌ Erreur lors du chargement du plan: ' + error.message);
        }
    };

    window.loadRencontreData = function() {
        console.log('[INFO] Fonction loadRencontreData appelée');
        // TODO: Implémenter le chargement des données de rencontre
    };

    window.loadIncendieData = function() {
        console.log('[INFO] Fonction loadIncendieData appelée');
        // TODO: Implémenter le chargement des données incendie
    };

    // ==================== FONCTIONS DE SAUVEGARDE ====================

    window.saveData = function() {
        console.log('[SAVE] Sauvegarde des données...');
        if (window.appActions && window.appActions.save) {
            window.appActions.save();
        }
    };

    window.savePlanEdition = function() {
        console.log('[SAVE] Sauvegarde du plan en cours...');
        savePlanEditionSuivis();
    };

    window.saveT14PlanEdition = function() {
        console.log('[INFO] Fonction saveT14PlanEdition appelée');
        // TODO: Implémenter la sauvegarde du plan T14
    };

    window.saveRencontreData = function() {
        console.log('[INFO] Fonction saveRencontreData appelée');
        // TODO: Implémenter la sauvegarde des données de rencontre
    };

    window.saveIncendieData = function() {
        console.log('[INFO] Fonction saveIncendieData appelée');
        // TODO: Implémenter la sauvegarde des données incendie
    };

    // ==================== FONCTIONS D'EXPORT ====================

    window.exportToExcel = function() {
        console.log('[EXPORT] Export vers Excel...');
        if (window.appActions && window.appActions.exportData) {
            window.appActions.exportData();
        }
    };

    window.exportPointPresseToExcel = function() {
        console.log('[EXPORT] Export des points de presse vers Excel...');
        exportPointPresseToExcelUI();
    };

    window.exportDemandesVerrouillageToExcel = function() {
        console.log('[EXPORT] Export des demandes de verrouillage vers Excel...');
        exportVerrouillage();
    };

    window.exportDemandesGruesNacellesToExcel = function() {
        console.log('[EXPORT] Export des demandes grues/nacelles vers Excel...');
        exportGruesNacelles();
    };

    window.exportDemandesEchafaudagesToExcel = function() {
        console.log('[EXPORT] Export des demandes échafaudages vers Excel...');
        exportEchafaudages();
    };

    window.exportAllArchives = function() {
        console.log('[INFO] Fonction exportAllArchives appelée');
        // TODO: Implémenter l'export de toutes les archives
    };

    window.exportRevisionListeToExcel = function() {
        console.log('[INFO] Fonction exportRevisionListeToExcel appelée');
        // TODO: Implémenter l'export de la liste de révision
    };

    window.exportScopeToExcel = function(scope, name) {
        console.log(`[INFO] Fonction exportScopeToExcel appelée pour ${name} (${scope})`);
        // TODO: Implémenter l'export du scope
    };

    window.exportPSVToExcel = function() {
        console.log('[INFO] Fonction exportPSVToExcel appelée');
        // TODO: Implémenter l'export PSV
    };

    window.exportAndEmailUniquePSV = function() {
        console.log('[INFO] Fonction exportAndEmailUniquePSV appelée');
        // TODO: Implémenter l'export et email PSV
    };

    window.exportINGQToExcel = function() {
        console.log('[INFO] Fonction exportINGQToExcel appelée');
        // TODO: Implémenter l'export INGQ
    };

    window.exportTeamToExcel = exportTeamToExcel;

    window.exportTPAAToExcel = function() {
        console.log('[EXPORT] Export TPAA vers Excel...');
        exportTPAA();
    };

    window.exportPWToExcel = function() {
        console.log('[EXPORT] Export PW vers Excel...');
        exportPWToExcel();
    };

    // ==================== FONCTIONS D'AFFICHAGE ====================

    window.showTasksForStatus = function(status) {
        console.log(`[INFO] Affichage des tâches pour le statut: ${status}`);
        // TODO: Implémenter l'affichage des tâches par statut
    };

    window.showBackupsList = showBackupsList;

    // ==================== FONCTIONS DE RENDU ====================

    window.renderPlansList = function() {
        console.log('[RENDER] Rendu de la liste des plans...');
        renderPlansSuivisList();
    };

    window.renderMSProjectFilesList = function() {
        console.log('[RENDER] Rendu de la liste des fichiers MS Project...');
        renderMSProjectFilesList();
    };

    // ==================== FONCTIONS D'AJOUT ====================

    window.addPointPresse = function() {
        console.log('[ADD] Ajout d\'un point de presse...');
        showPointPresseAddForm();
    };

    window.addDemandeVerrouillage = function() {
        console.log('[ADD] Ajout d\'une demande de verrouillage...');
        addVerrouillage();
    };

    window.addDemandeGrueNacelle = function() {
        console.log('[ADD] Ajout d\'une demande grue/nacelle...');
        addGrueNacelle();
    };

    window.addDemandeEchafaudage = function() {
        console.log('[ADD] Ajout d\'une demande échafaudage...');
        addEchafaudage();
    };

    window.addProjetRow = function() {
        console.log('[INFO] Fonction addProjetRow appelée');
        // TODO: Implémenter l'ajout d'un projet
    };

    window.addIncendieRow = function() {
        console.log('[INFO] Fonction addIncendieRow appelée');
        // TODO: Implémenter l'ajout d'une ligne incendie
    };

    window.addMaintenanceRow = function() {
        console.log('[INFO] Fonction addMaintenanceRow appelée');
        // TODO: Implémenter l'ajout d'une ligne maintenance
    };

    window.addINGQRow = function() {
        console.log('[INFO] Fonction addINGQRow appelée');
        if (window.ingqModule && window.ingqModule.addINGQProjet) {
            window.ingqModule.addINGQProjet();
        } else {
            console.error('[INGQ] Module INGQ non chargé');
        }
    };

    window.exportINGQToExcel = function() {
        console.log('[INFO] Fonction exportINGQToExcel appelée');
        if (window.ingqModule && window.ingqModule.exportINGQToExcel) {
            window.ingqModule.exportINGQToExcel();
        } else {
            console.error('[INGQ] Module INGQ non chargé');
        }
    };

    window.addTeamMember = addTeamMember;

    window.addApprovisionnementRow = addApprovisionnementRowModule;

    window.toggleHistoryColumns = toggleApproHistoryColumns;

    // ==================== FONCTIONS DE SUPPRESSION ====================

    window.deleteSelectedMarker = function() {
        console.log('[DELETE] Suppression du marqueur sélectionné...');
        deleteSelectedMarkerPlan();
    };

    window.deleteT14SelectedMarker = function() {
        console.log('[INFO] Fonction deleteT14SelectedMarker appelée');
        // TODO: Implémenter la suppression du marqueur T14 sélectionné
    };

    // ==================== FONCTIONS DE MODE ====================

    window.switchToModeEdition = function() {
        console.log('[MODE] Passage en mode édition...');
        switchModeEdition();
    };

    window.switchToModeLecture = function() {
        console.log('[MODE] Passage en mode lecture...');
        switchModeLecture();
    };

    window.closeModeEdition = function() {
        console.log('[MODE] Fermeture du mode édition...');
        closeModeEdition();
    };

    window.closeModeLecture = function() {
        console.log('[MODE] Fermeture du mode lecture...');
        const lectureContainer = document.getElementById('modeLectureContainer');
        if (lectureContainer) lectureContainer.style.display = 'none';
    };

    // ==================== FONCTIONS DE NAVIGATION ====================

    window.goPreviousDay = function() {
        console.log('[NAV] Navigation vers le jour précédent...');
        const dateInput = document.getElementById('currentDateInput');
        if (dateInput && dateInput.value) {
            const currentDate = new Date(dateInput.value);
            currentDate.setDate(currentDate.getDate() - 1);
            dateInput.value = currentDate.toISOString().split('T')[0];
            window.updateTimeDisplay();
        } else {
            // Si pas de date sélectionnée, utiliser hier
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (dateInput) dateInput.value = yesterday.toISOString().split('T')[0];
            window.updateTimeDisplay();
        }
    };

    window.goToday = function() {
        console.log('[NAV] Navigation vers aujourd\'hui...');
        const dateInput = document.getElementById('currentDateInput');
        const today = new Date();
        if (dateInput) dateInput.value = today.toISOString().split('T')[0];
        window.updateTimeDisplay();
    };

    window.goNextDay = function() {
        console.log('[NAV] Navigation vers le jour suivant...');
        const dateInput = document.getElementById('currentDateInput');
        if (dateInput && dateInput.value) {
            const currentDate = new Date(dateInput.value);
            currentDate.setDate(currentDate.getDate() + 1);
            dateInput.value = currentDate.toISOString().split('T')[0];
            window.updateTimeDisplay();
        } else {
            // Si pas de date sélectionnée, utiliser demain
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];
            window.updateTimeDisplay();
        }
    };

    window.updateTimeDisplay = function() {
        console.log('[UPDATE] Mise à jour de l\'affichage temporel...');
        const dateInput = document.getElementById('currentDateInput');
        const timeInput = document.getElementById('currentTimeInput');
        const displays = document.querySelectorAll('#timelineDisplay');

        if (dateInput && dateInput.value) {
            // Utiliser l'heure du input time, ou 08:00 par défaut
            const timeValue = timeInput && timeInput.value ? timeInput.value : '08:00';
            const selectedDate = new Date(dateInput.value + 'T' + timeValue + ':00');

            const formatted = selectedDate.toLocaleDateString('fr-CA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) + ' - ' + timeValue;

            displays.forEach(display => {
                display.textContent = formatted;
            });

            // Mettre à jour les marqueurs du plan
            updateMarkersForTimeline(selectedDate);
        }
    };

    window.goTimeMinus1Hour = function() {
        console.log('[NAV] -1 heure...');
        const dateInput = document.getElementById('currentDateInput');
        const timeInput = document.getElementById('currentTimeInput');

        if (dateInput && dateInput.value && timeInput) {
            const timeValue = timeInput.value || '08:00';
            // Créer la date en UTC pour éviter les problèmes de fuseau horaire
            const [year, month, day] = dateInput.value.split('-').map(Number);
            const [hours, minutes] = timeValue.split(':').map(Number);
            const currentDateTime = new Date(year, month - 1, day, hours, minutes, 0);

            console.log('[NAV] Date avant -1h:', currentDateTime.toString());

            // Reculer d'une heure
            currentDateTime.setHours(currentDateTime.getHours() - 1);

            console.log('[NAV] Date après -1h:', currentDateTime.toString());

            // Mettre à jour les inputs
            const newYear = currentDateTime.getFullYear();
            const newMonth = String(currentDateTime.getMonth() + 1).padStart(2, '0');
            const newDay = String(currentDateTime.getDate()).padStart(2, '0');
            const newHours = String(currentDateTime.getHours()).padStart(2, '0');
            const newMinutes = String(currentDateTime.getMinutes()).padStart(2, '0');

            dateInput.value = `${newYear}-${newMonth}-${newDay}`;
            timeInput.value = `${newHours}:${newMinutes}`;

            console.log('[NAV] Nouvelle date:', dateInput.value, 'Nouvelle heure:', timeInput.value);

            window.updateTimeDisplay();
        }
    };

    window.goTimePlus1Hour = function() {
        console.log('[NAV] +1 heure...');
        const dateInput = document.getElementById('currentDateInput');
        const timeInput = document.getElementById('currentTimeInput');

        if (dateInput && dateInput.value && timeInput) {
            const timeValue = timeInput.value || '08:00';
            // Créer la date en local pour éviter les problèmes de fuseau horaire
            const [year, month, day] = dateInput.value.split('-').map(Number);
            const [hours, minutes] = timeValue.split(':').map(Number);
            const currentDateTime = new Date(year, month - 1, day, hours, minutes, 0);

            console.log('[NAV] Date avant +1h:', currentDateTime.toString());

            // Avancer d'une heure
            currentDateTime.setHours(currentDateTime.getHours() + 1);

            console.log('[NAV] Date après +1h:', currentDateTime.toString());

            // Mettre à jour les inputs
            const newYear = currentDateTime.getFullYear();
            const newMonth = String(currentDateTime.getMonth() + 1).padStart(2, '0');
            const newDay = String(currentDateTime.getDate()).padStart(2, '0');
            const newHours = String(currentDateTime.getHours()).padStart(2, '0');
            const newMinutes = String(currentDateTime.getMinutes()).padStart(2, '0');

            dateInput.value = `${newYear}-${newMonth}-${newDay}`;
            timeInput.value = `${newHours}:${newMinutes}`;

            console.log('[NAV] Nouvelle date:', dateInput.value, 'Nouvelle heure:', timeInput.value);

            window.updateTimeDisplay();
        }
    };

    // ==================== FONCTIONS D'ARCHIVES ====================

    window.createArchive = createArchive;
    window.downloadBackup = downloadBackup;
    window.restoreFromFile = restoreFromFile;

    // ==================== FONCTIONS DE FILTRES ====================

    window.resetDashboardFilters = function() {
        console.log('[INFO] Fonction resetDashboardFilters appelée');
        // TODO: Implémenter la réinitialisation des filtres
    };

    // ==================== FONCTIONS DE CALENDRIER ====================

    window.changeCalendarMonth = function(offset) {
        console.log(`[INFO] Changement de mois: ${offset}`);
        changeCalendarMonth(offset);
    };

    // ==================== FONCTIONS DE PAGE LOADER ====================

    window.switchToPage = switchToPage;
    window.preloadPage = preloadPage;
    window.preloadPages = preloadPages;

    // ==================== FONCTIONS DRAG & DROP ====================

    /**
     * Active le drag & drop sur une zone d'upload spécifique
     */
    window.enableFileDropZone = enableFileDropZone;

    /**
     * Active automatiquement le drag & drop sur tous les uploads de la page
     */
    window.enableFileDropOnAllUploads = enableFileDropOnAllUploads;

    /**
     * Désactive le drag & drop sur une zone
     */
    window.disableFileDropZone = disableFileDropZone;

    // ==================== FONCTIONS DE RENDU DE TABLEAUX ====================

    // Exposer la vraie fonction renderIw37nTable du module (avec filtre PSV/TPAA/PW/NOTE)
    window.renderIw37nTable = renderIw37nTable;

    // Exposer la fonction pour obtenir les postes techniques uniques
    window.getUniquePostesTechniques = getUniquePostesTechniques;

    // Exposer la fonction pour obtenir les travaux actifs d'un poste
    window.getActiveWorkForPoste = getActiveWorkForPoste;

    // Exposer la fonction pour obtenir les données IW37N
    window.getIw37nData = getIw37nData;
    window.getSelectedIw37nRow = getSelectedIw37nRow;

    // ==================== FONCTIONS DE MODALES ====================

    /**
     * Ouvre une modale par son ID
     */
    window.openModal = function(modalId) {
        return openModal(modalId);
    };

    /**
     * Ferme une modale par son ID
     */
    window.closeModal = function(modalId) {
        return closeModal(modalId);
    };

    /**
     * Ferme toutes les modales ouvertes
     */
    window.closeAllModals = function() {
        return closeAllModals();
    };

    /**
     * Crée une modale dynamique
     */
    window.createModal = function(config) {
        return createModal(config);
    };

    /**
     * Met à jour le contenu d'une modale
     */
    window.updateModalContent = function(modalId, updates) {
        return updateModalContent(modalId, updates);
    };

    /**
     * Affiche une modale de confirmation
     */
    window.showConfirmModal = function(message, onConfirm, onCancel) {
        return showConfirmModal(message, onConfirm, onCancel);
    };

    /**
     * Affiche une modale d'alerte
     */
    window.showAlertModal = function(title, message, type) {
        return showAlertModal(title, message, type);
    };

    /**
     * Fonction de test pour démontrer toutes les fonctionnalités des modales
     */
    window.testModalsSystem = function() {
        console.log('[TEST] Démonstration du système de modales');

        // Test 1: Créer une modale personnalisée
        createModal({
            id: 'testModal',
            title: 'Test du système de modales',
            content: `
                <div style="padding: 20px;">
                    <h4 style="margin-bottom: 15px;">Système de modales fonctionnel !</h4>
                    <p style="margin-bottom: 10px;">Ce système offre les fonctionnalités suivantes :</p>
                    <ul style="margin-left: 20px; margin-bottom: 15px;">
                        <li>Modales personnalisées avec tailles configurables</li>
                        <li>Boutons d'action avec callbacks</li>
                        <li>Fermeture par ESC ou clic sur l'overlay</li>
                        <li>Modales de confirmation rapides</li>
                        <li>Modales d'alerte avec types (info, success, warning, error)</li>
                    </ul>
                    <p><strong>Testez les autres types :</strong></p>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button onclick="window.showAlertModal('Information', 'Ceci est une alerte informative', 'info')"
                                style="padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Info
                        </button>
                        <button onclick="window.showAlertModal('Succès', 'Opération réussie avec succès !', 'success')"
                                style="padding: 8px 15px; background: #4a7c59; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Succès
                        </button>
                        <button onclick="window.showAlertModal('Attention', 'Soyez prudent avec cette action', 'warning')"
                                style="padding: 8px 15px; background: #c9941a; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Attention
                        </button>
                        <button onclick="window.showAlertModal('Erreur', 'Une erreur est survenue', 'error')"
                                style="padding: 8px 15px; background: #c5554a; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Erreur
                        </button>
                        <button onclick="window.showConfirmModal('Voulez-vous vraiment continuer ?', () => window.showAlertModal('Confirmé', 'Vous avez confirmé !', 'success'), () => window.showAlertModal('Annulé', 'Action annulée', 'info'))"
                                style="padding: 8px 15px; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Confirmation
                        </button>
                    </div>
                </div>
            `,
            size: 'large',
            buttons: [
                {
                    text: 'Fermer',
                    class: 'modal-btn-secondary',
                    onClick: () => closeModal('testModal')
                }
            ]
        });

        openModal('testModal');
    };

    // ==================== FONCTIONS SCOPE ====================

    /**
     * Actions SCOPE exposées globalement
     */
    window.scopeActions = {
        loadScopeData,
        togglePosteDropdown,
        selectAllPostesTechniques,
        deselectAllPostesTechniques,
        exportScopeToExcel
    };

    // ==================== FONCTIONS DATA PAGES ====================

    /**
     * Actions DATA PAGES exposées globalement
     * Utilisées pour toutes les pages de données génériques (PSV, INGQ, etc.)
     */
    window.dataActions = {
        loadDataPage,
        togglePosteDropdown: toggleDataPosteDropdown,
        selectAllPostesTechniques: selectAllDataPostesTechniques,
        deselectAllPostesTechniques: deselectAllDataPostesTechniques,
        exportToExcel: exportDataToExcel,
        handleT21PhotoUpload,
        deleteT21Photo,
        updateT21Commentaire,
        filterIW37NTable,
        updateSoumissionMontant,
        getSoumissionsManualData
    };

    // ==================== FONCTIONS INGQ ====================

    /**
     * Actions INGQ exposées globalement
     */
    window.ingqActions = {
        loadINGQData,
        addProjet: addINGQProjet,
        deleteProjet: deleteINGQProjet,
        updateField: updateINGQField,
        renderTable: renderINGQTable,
        exportToExcel: exportINGQToExcel
    };

    // ==================== FONCTIONS TEAM ====================

    /**
     * Actions TEAM exposées globalement
     */
    window.teamActions = {
        loadTeamData,
        addMember: addTeamMember,
        deleteMember: deleteTeamMember,
        updateField: updateTeamField,
        renderTable: renderTeamTable,
        renderOrganigramme,
        exportToExcel: exportTeamToExcel
    };

    // ==================== FONCTIONS VPO ====================

    /**
     * Actions VPO exposées globalement
     */
    window.vpoActions = {
        loadVPOData,
        addVPO,
        deleteVPO,
        updateField: updateVPOField,
        renderTable: renderVPOTable,
        exportToExcel: exportVPOToExcel,
        addDocument: addVPODocument,
        removeDocument: removeVPODocument,
        getVPOData
    };

    // Exposer aussi les fonctions directement pour les onclick simples
    window.addVPO = addVPO;
    window.exportVPOToExcel = exportVPOToExcel;
    window.loadVPOData = loadVPOData;

    // ==================== FONCTIONS T55 DEVIS ET CORRECTION ====================

    /**
     * Actions T55 exposées globalement
     */
    window.t55Actions = {
        loadT55Data,
        saveT55Data,
        syncEntrepreneurs: syncT55Entrepreneurs,
        loadEntrepreneurData: loadT55EntrepreneurData,
        getT55Data
    };

    // Exposer aussi les fonctions directement pour les onclick simples
    // Les autres fonctions (addT55HistoriqueRow, etc.) sont déjà exposées via t55-devis.js
    window.saveT55Data = saveT55Data;
    window.syncT55Entrepreneurs = syncT55Entrepreneurs;
    window.loadT55EntrepreneurData = loadT55EntrepreneurData;

    // ==================== FONCTIONS T30 COMMANDES LONG DÉLAI ====================

    /**
     * Actions T30 exposées globalement
     */
    window.t30Actions = {
        loadT30Data,
        syncFromIW38: syncT30FromIW38,
        renderTable: renderT30Table,
        exportToExcel: exportT30ToExcel,
        updateCommandeField: updateT30CommandeField,
        getT30Data,
        toggleSort: toggleT30Sort,
        updateSearch: updateT30Search
    };

    // Exposer aussi les fonctions directement pour les onclick simples
    window.syncT30FromIW38 = syncT30FromIW38;
    window.exportT30ToExcel = exportT30ToExcel;

    // ==================== FONCTIONS EXPORT PDF ====================

    /**
     * Toggle le menu d'export PDF pour les réunions
     */
    function toggleReunionsMenu() {
        const menu = document.getElementById('reunionsPDFMenu');
        if (menu) {
            if (menu.style.display === 'none') {
                menu.style.display = 'block';
            } else {
                menu.style.display = 'none';
            }
        }

        // Fermer le menu si on clique ailleurs
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('#btnExportReunionsPDF') && !e.target.closest('#reunionsPDFMenu')) {
                    if (menu) menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    // La fonction exportPreparationPDF est importée depuis preparation-pdf-export.js
    // Pas besoin de la redéfinir ici

    // Les fonctions exportReunionsSummaryPDF et exportReunionsCompletePDF sont importées depuis preparation-pdf-export.js
    // Pas besoin de les redéfinir ici

    /**
     * Formate une date ISO en format lisible
     */
    function formatDate(dateStr) {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (error) {
            return dateStr;
        }
    }

    /**
     * Retourne la couleur RGB selon le statut
     */
    function getStatusColor(statut) {
        switch (statut) {
            case 'completed':
                return { r: 40, g: 167, b: 69 };
            case 'inprogress':
                return { r: 255, g: 193, b: 7 };
            case 'notstarted':
            default:
                return { r: 220, g: 53, b: 69 };
        }
    }

    /**
     * Retourne le label du statut
     */
    function getStatutLabel(statut) {
        switch (statut) {
            case 'completed':
                return 'Complétée';
            case 'inprogress':
                return 'En cours';
            case 'notstarted':
            default:
                return 'Non commencée';
        }
    }

    /**
     * Actions PDF Export exposées globalement
     * Pour exporter la préparation et le bilan des réunions en PDF
     */
    console.log('[GLOBAL] Exposition window.pdfExportActions...');
    window.pdfExportActions = {
        exportPreparationPDF,
        exportReunionsSummaryPDF,
        exportReunionsCompletePDF,
        toggleReunionsMenu
    };
    console.log('[GLOBAL] ✅ window.pdfExportActions exposé:', window.pdfExportActions);
    window.loadT30Data = loadT30Data;
    window.toggleT30Sort = toggleT30Sort;
    window.updateT30Search = updateT30Search;

    // ==================== FONCTIONS T60 COMMANDES LONG DÉLAI 60-89J ====================

    /**
     * Actions T60 exposées globalement
     */
    window.t60Actions = {
        loadT60Data,
        syncFromIW38: syncT60FromIW38,
        renderTable: renderT60Table,
        exportToExcel: exportT60ToExcel,
        updateCommandeField: updateT60CommandeField,
        getT60Data
    };

    // Exposer aussi les fonctions directement pour les onclick simples
    window.syncT60FromIW38 = syncT60FromIW38;
    window.exportT60ToExcel = exportT60ToExcel;
    window.loadT60Data = loadT60Data;

    // ==================== FONCTIONS T88 COMMANDES LONG DÉLAI 30-59J ====================

    /**
     * Actions T88 exposées globalement
     */
    window.t88Actions = {
        loadT88Data,
        syncFromIW38: syncT88FromIW38,
        renderTable: renderT88Table,
        exportToExcel: exportT88ToExcel,
        updateCommandeField: updateT88CommandeField,
        getT88Data,
        toggleSort: toggleT88Sort,
        updateSearch: updateT88Search
    };

    // Exposer aussi les fonctions directement pour les onclick simples
    window.syncT88FromIW38 = syncT88FromIW38;
    window.exportT88ToExcel = exportT88ToExcel;
    window.loadT88Data = loadT88Data;
    window.toggleT88Sort = toggleT88Sort;
    window.updateT88Search = updateT88Search;

    // ==================== FONCTIONS CHEMIN CRITIQUE ====================

    /**
     * Actions Chemin Critique exposées globalement
     */
    window.cheminCritiqueActions = {
        loadData: loadCheminCritiqueData,
        addTask: addCheminCritiqueTask,
        deleteTask: deleteCheminCritiqueTask,
        updateField: updateCheminCritiqueField,
        moveUp: moveTaskUp,
        moveDown: moveTaskDown,
        renderTable: renderCheminCritiqueTable,
        exportToExcel: exportCheminCritiqueToExcel,
        getData: getCheminCritiqueData
    };

    // Exposer aussi les fonctions directement pour les onclick simples
    window.addCheminCritiqueTask = addCheminCritiqueTask;
    window.exportCheminCritiqueToExcel = exportCheminCritiqueToExcel;
    window.loadCheminCritiqueData = loadCheminCritiqueData;

    // ==================== FONCTIONS TPAA ====================

    /**
     * Actions TPAA exposées globalement
     */
    window.tpaaActions = {
        loadTPAAListeData,
        syncWithIW37N: () => {
            const dateStr = prompt('Entrez la date de début de l\'arrêt (YYYY-MM-DD):', '2026-04-01');
            if (dateStr) {
                const count = syncTPAA(dateStr);
                alert(`${count} travaux TPAA synchronisés depuis IW37N`);
            }
        },
        updateStatut: updateTPAAStatus,
        updateJoursSupp: updateTPAADays,
        updateCommentaire: updateTPAAComment,
        sortByDate: sortTPAAByDate,
        exportToExcel: exportTPAA
    };

    /**
     * Actions Dashboard exposées globalement
     */
    window.dashboardActions = {
        showTaskDetails
    };

    /**
     * Actions Point de Presse exposées globalement
     */
    window.pointPresseActions = {
        init: initPointPresseUI,
        showAddForm: showPointPresseAddForm,
        edit: showPointPresseEditForm,
        delete: deletePointPresseUI,
        exportToExcel: exportPointPresseToExcelUI,
        generatePDF: generatePointPressePDFUI,
        renderList: renderPointPresseList
    };

    /**
     * Ouvre une page de détail de tâche depuis les graphiques du Dashboard
     * @param {string} page - Identifiant de la page à ouvrir
     */
    window.openTaskFromChart = function(page) {
        console.log(`[CHARTS] Ouverture de la page: ${page}`);
        switchPage(page);
    };

    /**
     * Ouvre une page de détail de tâche depuis le calendrier
     * @param {string} taskId - ID de la tâche
     */
    window.openTaskDetail = function(taskId) {
        console.log(`[CALENDAR] Ouverture de la tâche: ${taskId}`);
        // Importer les fonctions nécessaires
        import('./modules/ui/summary.js').then(summaryModule => {
            const phases = summaryModule.getPreparationPhases();

            // Trouver la tâche
            let taskPage = null;
            phases.forEach(phase => {
                phase.taches.forEach(tache => {
                    if (tache.id === taskId && tache.clickable && tache.page) {
                        taskPage = tache.page;
                    }
                });
            });

            if (taskPage) {
                switchPage(taskPage);
            } else {
                console.warn(`[CALENDAR] Aucune page de détail pour la tâche ${taskId}`);
            }
        });
    };

    /**
     * Filtres Dashboard exposés globalement
     */
    window.dashboardFilters = {
        initDashboardFilters,
        applyFilter: applyDashboardFilter,
        resetFilters
    };

    // Exposer les fonctions update globalement pour les onchange dans le tableau
    window.updateTPAAStatut = updateTPAAStatus;
    window.updateTPAAJoursSupp = updateTPAADays;
    window.updateTPAACommentaire = updateTPAAComment;

    // Exposer les fonctions Plans d'Entretien globalement
    window.handlePlansUpload = handlePlansUpload;
    window.renderPlansTable = renderPlansTable;
    window.loadPlansData = loadPlansData;

    // Exposer les actions Plans d'Entretien (pour les modifications)
    window.plansActions = {
        addModificationRow,
        updateModificationField,
        deleteModification,
        renderModificationsTable
    };

    // Exposer les fonctions Rencontre de Définition globalement
    window.loadRencontreData = loadRencontreData;
    window.saveRencontreData = saveRencontreData;
    window.getRencontreData = getRencontreData;

    // Exposer les fonctions Tours de Refroidissement globalement
    window.loadToursRefroidissementData = loadToursRefroidissementData;
    window.saveToursRefroidissementData = saveToursRefroidissementData;
    window.addToursRefroidissementTravail = addToursRefroidissementTravail;
    window.addToursDocument = addToursDocument;
    window.exportToursRefroidissementToExcel = exportToursRefroidissementToExcel;

    window.toursActions = {
        addNewRencontre,
        selectRencontre,
        deleteRencontre,
        updateRencontreTitre,
        updateTravailField,
        deleteTravail,
        deleteToursDocument,
        exportToursRefroidissementComplet
    };

    // Exposer les fonctions Suivi de Coût globalement
    window.loadSuiviCoutData = loadSuiviCoutData;
    window.suiviCoutActions = {
        addLigneManuelle,
        updateLigneManuelle,
        deleteLigneManuelle,
        addSoumissionEntrepreneur,
        updateSoumissionEntrepreneur,
        deleteSoumissionEntrepreneur,
        exportSuiviCoutToExcel
    };

    // Exposer les fonctions Liste des Projets globalement
    window.loadProjetsData = loadProjetsData;
    window.addProjetRow = addProjetRow;
    window.deleteProjet = deleteProjet;
    window.updateProjetField = updateProjetField;
    window.renderProjetsTable = renderProjetsTable;
    window.handleProjetsUpload = handleProjetsUpload;
    window.getProjetsData = getProjetsData;
    window.uploadProjetDocument = uploadProjetDocument;
    window.deleteProjetDocument = deleteProjetDocument;

    // Exposer le module projets pour compatibilité avec l'ancien code HTML
    window.projetsModule = {
        uploadProjetDocument,
        deleteProjetDocument
    };

    // Exposer les fonctions Maintenances Capitalisables globalement
    window.loadMaintenancesCapitalisablesData = loadMaintenancesCapitalisablesData;
    window.addMaintenanceCapitalisableRow = addMaintenanceCapitalisableRow;
    window.deleteMaintenanceCapitalisable = deleteMaintenanceCapitalisable;
    window.updateMaintenanceCapitalisableField = updateMaintenanceCapitalisableField;
    window.renderMaintenancesCapitalisablesTable = renderMaintenancesCapitalisablesTable;
    window.handleMaintenancesCapitalisablesUpload = handleMaintenancesCapitalisablesUpload;
    window.getMaintenancesCapitalisablesData = getMaintenancesCapitalisablesData;
    window.handleMaintenanceAttachmentUpload = handleMaintenanceAttachmentUpload;
    window.deleteMaintenanceAttachment = deleteMaintenanceAttachment;
    window.viewMaintenanceAttachment = viewMaintenanceAttachment;

    // Exposer les fonctions Révision Liste Travaux globalement
    window.loadRevisionListeData = loadRevisionListeData;
    window.syncRevisionListeFromIw37n = syncRevisionListeFromIw37n;
    window.updateRevisionStatut = updateRevisionStatut;
    window.updateRevisionField = updateRevisionField;
    window.deleteRevisionItem = deleteRevisionItem;
    window.renderRevisionListeTable = renderRevisionListeTable;
    window.exportRevisionListeToExcel = exportRevisionListeToExcel;
    window.getRevisionData = getRevisionData;
    window.clearAllRevisionListe = clearAllRevisionData;

    // Exposer les fonctions PSV globalement
    window.loadPSVData = loadPSVData;
    window.syncPSVFromIw37n = syncPSVFromIw37n;
    window.renderPSVTable = renderPSVTable;
    window.renderUniquePSVTable = renderUniquePSVTable;
    window.exportPSVToExcel = exportPSVToExcel;
    window.exportUniquePSVAndSend = exportAndEmailUniquePSV;
    window.importPSVCaracteristiques = handlePSVCharsUpload;
    window.exportPSVCharsToExcel = exportPSVCharsToExcel;
    window.viewPSVCharacteristics = viewPSVCharacteristics;
    window.handlePSVPhotoUpload = handlePSVPhotoUpload;
    window.deletePSVPhoto = deletePSVPhoto;
    window.viewPSVPhoto = viewPSVPhoto;

    // Exposer les fonctions TPAA globalement
    window.renderTPAATable = renderTPAATable;

    // Exposer les fonctions PW globalement
    window.renderPWTable = renderPWTable;

    // Exposer les fonctions de résumé/préparation globalement
    window.renderSummaryTable = renderSummaryTable;

    // Exposer les fonctions PSV Plans globalement
    window.loadPSVPlans = loadPSVPlans;
    window.handlePSVPlanUpload = handlePSVPlanUpload;
    window.handlePSVImageClick = handlePSVImageClick;
    window.deletePSVMarker = deletePSVMarker;
    window.switchPSVPlan = switchPSVPlan;
    window.clearPSVPlan = clearPSVPlan;
    window.zoomInPSV = zoomInPSV;
    window.zoomOutPSV = zoomOutPSV;
    window.resetZoomPSV = resetZoomPSV;

    // Créer l'objet psvPlanActions pour regrouper les actions
    window.psvPlanActions = {
        handlePlanUpload: handlePSVPlanUpload,
        clearPlan: clearPSVPlan,
        zoomIn: zoomInPSV,
        zoomOut: zoomOutPSV,
        resetZoom: resetZoomPSV
    };

    // Exposer les fonctions TPAA globalement
    window.loadTPAAListeData = loadTPAAListeData;
    window.syncTPAAFromIw37n = syncTPAA;
    window.updateTPAAStatut = updateTPAAStatus;
    window.updateTPAAJoursSupp = updateTPAADays;
    window.updateTPAACommentaire = updateTPAAComment;
    window.sortTPAAByDate = sortTPAAByDate;
    window.exportTPAAToExcel = exportTPAA;

    // Exposer les fonctions PW globalement
    window.loadPWData = loadPWData;
    window.syncPWFromIw37n = syncPWFromIw37n;
    window.updatePWStatut = updatePWStatut;
    window.updatePWJoursSupp = updatePWJoursSupp;
    window.updatePWCommentaire = updatePWCommentaire;
    window.sortPWByDate = sortPWByDate;
    window.exportPWToExcel = exportPWToExcel;

    // Exposer les fonctions Approvisionnement (t27) globalement
    window.loadApprovisionnementData = loadApprovisionnementData;
    window.deleteApprovisionnementRow = deleteApprovisionnementRow;
    window.updateApprovisionnementField = updateApprovisionnementField;
    window.renderApprovisionnementTable = renderApprovisionnementTable;
    window.getApprovisionnementData = getApprovisionnementData;

    // Exposer les fonctions Stratégie d'Approvisionnement globalement
    window.loadStrategieData = loadStrategieData;
    window.addStrategieRow = addStrategieRow;
    window.deleteStrategie = deleteStrategie;
    window.updateStrategieField = updateStrategieField;
    window.toggleHistoriqueColumns = toggleHistoriqueColumns;
    window.renderStrategieTable = renderStrategieTable;
    window.exportStrategieToExcel = exportStrategieToExcel;
    window.getStrategieData = getStrategieData;

    // Fonction T58 - Synchroniser les rencontres depuis le projet
    window.syncT58RencontresFromProject = function() {
        console.log('[T58] Synchronisation des rencontres depuis le projet - TODO');
        alert('⚠️ Fonction à implémenter: Synchroniser les rencontres depuis le projet');
    };

    // Fonction T58 - Ouvrir la modal de sélection de rencontre
    window.openRencontreSelectorModal = function() {
        console.log('[T58] Ouverture de la modal de sélection de rencontre - TODO');
        alert('⚠️ Fonction à implémenter: Ajouter une nouvelle rencontre');
    };

    // Exposer les fonctions Travaux Entrepreneur globalement
    window.entrepreneurActions = {
        syncFromIw37n: syncEntrepreneurFromIw37n,
        filterByPoste: filterByPoste,
        exportToExcel: exportEntrepreneurToExcel,
        initPage: initEntrepreneurPage
    };
    console.log('[GLOBAL] window.entrepreneurActions exposé:', window.entrepreneurActions);

    // Exposer les fonctions Espaces Clos globalement
    window.loadEspaceClosData = loadEspaceClosData;
    window.syncEspaceClosFromIw37n = syncEspaceClosFromIw37n;
    window.renderEspaceClosTable = renderEspaceClosTable;
    window.exportEspaceClosToExcel = exportEspaceClosToExcel;
    window.getEspaceClosData = getEspaceClosData;

    // Exposer les fonctions Aménagement globalement
    window.handleAmenagementImageUpload = handleAmenagementImageUpload;
    window.exportAmenagementData = exportAmenagementData;
    window.amenagementActions = {
        loadAmenagementData,
        renderAmenagementPlans,
        downloadPlan: downloadAmenagementPlan,
        deletePlan: deleteAmenagementPlan,
        openPlanEditor,
        getAmenagementData
    };
    console.log('[GLOBAL] window.amenagementActions exposé:', window.amenagementActions);

    // Exposer les fonctions T40 Entrepreneurs globalement
    window.t40Actions = {
        loadT40Data,
        syncEntrepreneursFromIw37n,
        renderT40Table,
        exportToExcel: exportT40ToExcel,
        getT40Data,
        addManualEntrepreneur
    };
    console.log('[GLOBAL] window.t40Actions exposé:', window.t40Actions);

    // Exposer les fonctions T33 Priorisation globalement
    window.t33Actions = {
        loadT33Data,
        syncFromAvis,
        renderT33Table,
        exportToExcel: exportT33ToExcel,
        getT33Data
    };
    console.log('[GLOBAL] window.t33Actions exposé:', window.t33Actions);

    // Ajouter les fonctions TPAA/PW liste à l'objet existant
    window.tpaaActions.loadTPAAPW = loadTPAAPW;
    window.tpaaActions.exportTPAAListToExcel = exportTPAAListToExcel;
    window.tpaaActions.exportPWListToExcel = exportPWListToExcel;
    window.tpaaActions.updateManualField = updateManualField;
    window.tpaaActions.adjustDays = adjustDays;
    window.tpaaActions.sortTPAAByDate = sortTPAAByDate;
    window.tpaaActions.sortPWByDate = sortPWByDate;
    window.tpaaActions.sortTPAABy = sortTPAABy;
    window.tpaaActions.sortPWBy = sortPWBy;
    window.tpaaActions.filterTPAA = filterTPAA;
    window.tpaaActions.filterPW = filterPW;
    window.tpaaActions.clearTPAAFilters = clearTPAAFilters;
    window.tpaaActions.clearPWFilters = clearPWFilters;
    window.tpaaActions.refreshFromIW37N = refreshFromIW37N;
    window.tpaaActions.renderCalendar = renderCalendar;
    window.tpaaActions.previousMonth = previousMonth;
    window.tpaaActions.nextMonth = nextMonth;

    // Exposer les fonctions T51 Soumissions globalement
    window.t51Actions = {
        updateField: updateT51Field,
        deleteSoumission: deleteT51Soumission,
        uploadDocument: uploadT51Document,
        deleteDocument: deleteT51Document
    };
    window.loadT51Data = loadT51Data;
    window.addT51Soumission = addT51Soumission;
    window.syncT51Entrepreneurs = syncT51Entrepreneurs;
    window.renderT51Table = renderT51Table;
    window.updateT51Stats = updateT51Stats;
    window.exportT51ToExcel = exportT51ToExcel;

    // Exposer les fonctions Paramètres globalement
    window.settingsActions = {
        loadSettings,
        saveSettings: saveSettingsFromForm,
        cancelSettings,
        getStartDate,
        getEndDate,
        getBudget,
        getArretDuration,
        initSettingsPage,
        handleStartDateChange,
        handleEndDateChange,
        handleDurationChange,
        extractExternals,
        updateExternalDescription,
        loadExternalsPage,
        // Fonctions pour les dates limites (importées depuis settings.js)
        addDateLimite: async () => {
            const { addDateLimite } = await import('./modules/data/settings.js');
            return addDateLimite();
        },
        updateDateLimiteField: async (index, field, value) => {
            const { updateDateLimiteField } = await import('./modules/data/settings.js');
            return updateDateLimiteField(index, field, value);
        },
        deleteDateLimite: async (index) => {
            const { deleteDateLimite } = await import('./modules/data/settings.js');
            return deleteDateLimite(index);
        },
        getExternalDescription,
        getAllExternals
    };

    // Exposer les fonctions Plan Suivis Journaliers globalement
    window.planActions = {
        initPlanSuivisPage,
        loadMSProjectFile: loadMSProjectFileFunc,
        loadPlanImage: loadPlanImageSuivis,
        editPlan,
        viewPlan,
        deletePlan: deletePlanSuivis,
        viewMSProjectFile,
        deleteMSProjectFile,
        savePlanEdition: savePlanEditionSuivis,
        toggleHeatmapMode,
        changePlacementMode
    };

    // Exposer les fonctions de la modale de sélection des responsables globalement
    window.openResponsibleModal = openResponsibleModal;
    window.closeResponsibleModal = closeResponsibleModal;
    window.saveResponsibles = saveResponsibles;
    window.closeModalOnOverlay = closeModalOnOverlay;
    window.openResponsibleModalForTask = openResponsibleModalForTask;

    // Exposer les fonctions de marqueurs SCOPE globalement
    window.scopeMarkersActions = {
        loadScopeMarkers,
        initScopePlan,
        handleScopePlanUpload,
        clearScopePlan,
        exportScopeMarkers,
        switchPlan,
        zoomIn,
        zoomOut,
        resetZoom
    };

    // ==================== SECTIONS TPAA (Hydraulique, Nettoyage, NDT) ====================

    // Données pour chaque section
    window.hydrauliqueData = window.hydrauliqueData || [];
    window.nettoyageData = window.nettoyageData || [];
    window.ndtData = window.ndtData || [];
    window.planImages = window.planImages || {};
    window.planMarkers = window.planMarkers || {}; // Marqueurs: {sectionName: [{x, y, rowIndex}]}

    // Timers pour l'auto-sauvegarde
    const autoSaveTimers = {};

    // Basculer l'affichage des sections
    window.toggleSection = function(sectionName) {
        console.log('toggleSection appelé avec:', sectionName);

        // Cacher toutes les sections
        const allSections = document.querySelectorAll('.section-toggle');
        console.log('Nombre de sections trouvées:', allSections.length);
        allSections.forEach(section => {
            section.style.display = 'none';
        });

        // Afficher la section sélectionnée
        const section = document.getElementById('section-' + sectionName);
        console.log('Section trouvée:', section);
        if (section) {
            section.style.display = 'block';
            console.log('Section affichée:', sectionName);

            // Initialiser les données et le tableau
            if (!window[sectionName + 'Data']) {
                window[sectionName + 'Data'] = [];
            }

            // Rendre le tableau et le plan immédiatement
            setTimeout(() => {
                renderSectionTable(sectionName);
                renderPlan(sectionName);
                console.log(`[toggleSection] ✅ Tableau et plan rendus pour ${sectionName}`);
            }, 100);

            // Charger les données de la section depuis le serveur
            loadSectionData(sectionName);
        } else {
            console.error('Section non trouvée:', 'section-' + sectionName);
        }
    };

    // Charger les données d'une section
    function loadSectionData(sectionName) {
        const socket = window.socket;
        if (!socket) return;

        socket.emit('get-data');
        socket.once('data-update', (data) => {
            if (data && data[sectionName + 'SectionData']) {
                window[sectionName + 'Data'] = data[sectionName + 'SectionData'].tableData || [];
                window.planImages[sectionName] = data[sectionName + 'SectionData'].planImage || null;
                window.planMarkers[sectionName] = data[sectionName + 'SectionData'].markers || [];
                renderSectionTable(sectionName);
                renderPlan(sectionName);
            }
        });
    }

    // Fonction pour auto-resize des textareas
    window.autoResizeTextarea = function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };

    // Rendre le tableau d'une section
    function renderSectionTable(sectionName) {
        const tbody = document.getElementById(sectionName + '-tbody');
        const data = window[sectionName + 'Data'];

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="padding: 20px; text-align: center; color: #666;">
                        Aucune donnée. Cliquez sur "➕ Ajouter" pour commencer.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((row, index) => {
            // Définir les couleurs en fonction du statut (mêmes que TPAA/PW)
            let bgColor, statutColor;
            switch (row.statut) {
                case 'À faire':
                    bgColor = '#ffe0e0'; // Rouge clair
                    statutColor = '#c62828'; // Rouge foncé
                    break;
                case 'Planifié':
                    bgColor = '#e3f2fd'; // Bleu clair
                    statutColor = '#1565c0'; // Bleu foncé
                    break;
                case 'Terminé':
                    bgColor = '#e8f5e9'; // Vert clair
                    statutColor = '#2e7d32'; // Vert foncé
                    break;
                case 'Annulé':
                    bgColor = '#e0e0e0'; // Gris clair
                    statutColor = '#616161'; // Gris foncé
                    break;
                default:
                    bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                    statutColor = '#333';
            }

            return `
            <tr style="background: ${bgColor} !important;">
                <td style="padding: 1px; border: 1px solid #d0d0d0; background: ${bgColor} !important;">
                    <input type="text" value="${row.code || ''}"
                           onchange="window.updateSectionCell('${sectionName}', ${index}, 'code', this.value); window.updateDateFromTPAA('${sectionName}', ${index});"
                           style="width: 100%; padding: 2px; border: none; background: transparent; font-size: 11px; font-family: inherit;">
                </td>
                <td style="padding: 1px; border: 1px solid #d0d0d0; background: ${bgColor} !important; vertical-align: top;">
                    <textarea
                           onchange="window.updateSectionCell('${sectionName}', ${index}, 'nom', this.value)"
                           oninput="window.autoResizeTextarea(this)"
                           style="width: 100%; padding: 2px; border: none; background: transparent; font-size: 11px; font-family: inherit; resize: none; overflow: hidden; min-height: 20px; line-height: 1.3;">${row.nom || ''}</textarea>
                </td>
                <td style="padding: 1px; border: 1px solid #d0d0d0; background: ${bgColor} !important;">
                    <select onchange="window.updateSectionCell('${sectionName}', ${index}, 'priorite', this.value)"
                            style="width: 100%; padding: 2px; border: none; background: transparent; font-size: 11px; cursor: pointer;">
                        <option value="Haute" ${row.priorite === 'Haute' ? 'selected' : ''}>Haute</option>
                        <option value="Moyenne" ${row.priorite === 'Moyenne' ? 'selected' : ''}>Moyenne</option>
                        <option value="Basse" ${row.priorite === 'Basse' ? 'selected' : ''}>Basse</option>
                    </select>
                </td>
                <td style="padding: 1px; border: 1px solid #d0d0d0; background: #f5f5f5 !important;">
                    <input type="text" value="${row.dateTpaa || ''}"
                           readonly
                           style="width: 100%; padding: 2px; border: none; background: transparent; font-size: 11px; cursor: not-allowed; color: #666;">
                </td>
                <td style="padding: 1px; border: 1px solid #d0d0d0; background: ${bgColor} !important;">
                    <select onchange="window.updateSectionCell('${sectionName}', ${index}, 'jeudi', this.value)"
                            style="width: 100%; padding: 2px; border: none; background: transparent; font-size: 11px; cursor: pointer;">
                        <option value="" ${!row.jeudi ? 'selected' : ''}>-</option>
                        <option value="Oui" ${row.jeudi === 'Oui' ? 'selected' : ''}>Oui</option>
                        <option value="Non" ${row.jeudi === 'Non' ? 'selected' : ''}>Non</option>
                    </select>
                </td>
                <td style="padding: 1px; border: 1px solid #d0d0d0; background: ${bgColor} !important; vertical-align: top;">
                    <textarea
                           onchange="window.updateSectionCell('${sectionName}', ${index}, 'feuilleVerrouillage', this.value)"
                           oninput="window.autoResizeTextarea(this)"
                           style="width: 100%; padding: 2px; border: none; background: transparent; font-size: 11px; font-family: inherit; resize: none; overflow: hidden; min-height: 20px; line-height: 1.3;">${row.feuilleVerrouillage || ''}</textarea>
                </td>
                <td style="padding: 1px; border: 1px solid #d0d0d0; background: ${bgColor} !important;">
                    <select onchange="window.updateSectionCell('${sectionName}', ${index}, 'statut', this.value)"
                            style="width: 100%; padding: 2px; border: none; background: transparent; font-size: 11px; font-weight: bold; color: ${statutColor}; cursor: pointer;">
                        <option value="">-</option>
                        <option value="À faire" ${row.statut === 'À faire' ? 'selected' : ''}>À faire</option>
                        <option value="Planifié" ${row.statut === 'Planifié' ? 'selected' : ''}>Planifié</option>
                        <option value="Terminé" ${row.statut === 'Terminé' ? 'selected' : ''}>Terminé</option>
                        <option value="Annulé" ${row.statut === 'Annulé' ? 'selected' : ''}>Annulé</option>
                    </select>
                </td>
                <td style="padding: 2px; border: 1px solid #d0d0d0; background: ${bgColor} !important; text-align: center;">
                    ${row.photo ? `
                        <div style="position: relative; display: inline-block;">
                            <img src="${row.photo}" style="width: 40px; height: 40px; object-fit: cover; cursor: pointer; display: block;"
                                 onclick="window.viewSectionPhoto('${sectionName}', ${index})" title="Cliquez pour agrandir">
                            <button onclick="window.deleteSectionPhoto('${sectionName}', ${index})"
                                    style="position: absolute; top: -4px; right: -4px; background: #dc3545; color: white; border: none;
                                           width: 16px; height: 16px; border-radius: 50%; cursor: pointer; font-size: 10px; padding: 0; line-height: 16px;">×</button>
                        </div>
                    ` : `
                        <button onclick="window.uploadSectionPhoto('${sectionName}', ${index})"
                                style="background: #3b82f6; color: white; border: none; padding: 2px 6px; cursor: pointer; font-size: 10px;">
                            📷
                        </button>
                    `}
                    <input type="file" id="${sectionName}-photo-${index}" accept="image/*" style="display: none;"
                           onchange="window.handleSectionPhotoUpload(event, '${sectionName}', ${index})">
                </td>
                <td style="padding: 1px; border: 1px solid #d0d0d0; text-align: center; background: ${bgColor} !important;">
                    <button onclick="window.deleteSectionRow('${sectionName}', ${index})"
                            style="background: #dc3545; color: white; border: none; padding: 2px 6px; cursor: pointer; font-size: 11px;">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
        }).join('');

        // Après le rendu, ajuster la hauteur de toutes les textareas
        setTimeout(() => {
            const textareas = tbody.querySelectorAll('textarea');
            textareas.forEach(ta => window.autoResizeTextarea(ta));
        }, 0);
    }

    // Rendre le plan
    function renderPlan(sectionName) {
        console.log(`[renderPlan] 🎨 Début du rendu pour section: ${sectionName}`);

        // Sélectionner le div blanc qui contient le plan (en tenant compte des h3 et h4)
        const section = document.getElementById(`section-${sectionName}`);
        if (!section) {
            console.warn(`[renderPlan] ❌ Section #section-${sectionName} non trouvée`);
            return;
        }
        console.log(`[renderPlan] ✅ Section trouvée:`, section);

        // Trouver le div grid (après le h3), puis la première colonne, puis le div blanc (après le h4)
        console.log(`[renderPlan] Recherche du grid div...`);
        console.log(`[renderPlan] Children de section:`, Array.from(section.children).map(c => ({tag: c.tagName, display: c.style.display})));

        const gridDiv = Array.from(section.children).find(child =>
            child.style.display === 'grid' ||
            child.style.display.includes('grid')
        );

        if (!gridDiv) {
            console.warn(`[renderPlan] ❌ Grid div non trouvé dans section ${sectionName}`);
            console.log('[renderPlan] Tous les children:', section.children);
            return;
        }
        console.log(`[renderPlan] ✅ Grid div trouvé:`, gridDiv);

        const planColumn = gridDiv.children[0]; // Première colonne
        if (!planColumn) {
            console.warn(`[renderPlan] ❌ Plan column non trouvée dans section ${sectionName}`);
            return;
        }
        console.log(`[renderPlan] ✅ Plan column trouvée:`, planColumn);

        // Le div blanc est après le h4 (caractérisé par min-height: 550px)
        console.log(`[renderPlan] Children de planColumn:`, Array.from(planColumn.children).map(c => ({
            tag: c.tagName,
            minHeight: c.style.minHeight,
            bg: c.style.background,
            bgColor: c.style.backgroundColor
        })));

        const planDiv = Array.from(planColumn.children).find(child =>
            child.style.minHeight === '550px' ||
            (child.style.background && child.style.background.includes('white')) ||
            child.style.backgroundColor === 'white'
        );

        if (!planDiv) {
            console.warn(`[renderPlan] ❌ Plan div (white background) non trouvé dans section ${sectionName}`);
            console.log('[renderPlan] Children of planColumn:', Array.from(planColumn.children));
            return;
        }
        console.log(`[renderPlan] ✅ Plan div trouvé:`, planDiv);

        if (!window.planImages[sectionName]) {
            // Afficher uniquement le bouton d'upload quand il n'y a pas de plan
            planDiv.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <p style="color: #666; margin-bottom: 20px;">📍 Aucun plan uploadé</p>
                    <button onclick="window.uploadPlan('${sectionName}')" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">
                        📤 Uploader un plan
                    </button>
                    <input type="file" id="${sectionName}-plan-upload" accept="image/*" style="display: none;" onchange="window.handlePlanUpload(event, '${sectionName}')">
                </div>
            `;
            console.log(`[renderPlan] ✅ Bouton et input file créés pour ${sectionName}`);
            return;
        }

        // Créer le conteneur du plan avec position relative
        const planContainerId = `plan-container-${sectionName}`;
        planDiv.innerHTML = `
            <div style="position: relative;">
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <span style="font-size: 0.9em; color: #666;">📍 Cliquez sur le plan pour ajouter un marqueur</span>
                    <div style="display: flex; gap: 5px; align-items: center;">
                        <button onclick="window.zoomPlan('${sectionName}', 'out')" style="padding: 4px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; font-weight: bold;">
                            -
                        </button>
                        <span id="zoom-level-${sectionName}" style="font-size: 0.85em; color: #666; min-width: 45px; text-align: center;">100%</span>
                        <button onclick="window.zoomPlan('${sectionName}', 'in')" style="padding: 4px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; font-weight: bold;">
                            +
                        </button>
                        <button onclick="window.zoomPlan('${sectionName}', 'reset')" style="padding: 4px 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                            Reset
                        </button>
                        <button onclick="window.uploadPlan('${sectionName}')" style="padding: 4px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                            🔄 Changer
                        </button>
                    </div>
                </div>
                <div id="plan-wrapper-${sectionName}" style="overflow: auto; max-height: 550px; border: 2px solid #007bff; border-radius: 8px; background: #f8f9fa;">
                    <div id="${planContainerId}" style="position: relative; display: inline-block; transform-origin: top left; transition: transform 0.2s ease;">
                        <img id="plan-img-${sectionName}" src="${window.planImages[sectionName]}"
                             style="max-width: 100%; max-height: 500px; border-radius: 8px; display: block; cursor: crosshair;">
                    </div>
                </div>
            </div>
        `;

        // Ajouter l'événement de clic sur le plan
        const planImg = document.getElementById(`plan-img-${sectionName}`);
        const planContainer = document.getElementById(planContainerId);

        planImg.onclick = function(e) {
            // Obtenir le niveau de zoom actuel
            const currentZoom = window.planZoomLevels[sectionName] || 1;

            // Calculer la position relative au plan (en tenant compte du zoom)
            const rect = planImg.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100; // Pourcentage
            const y = ((e.clientY - rect.top) / rect.height) * 100; // Pourcentage

            // Demander à quelle ligne associer ce marqueur
            showMarkerRowSelector(sectionName, x, y);
        };

        // Afficher les marqueurs existants
        renderMarkers(sectionName, planContainer);
    }

    // Afficher les marqueurs sur le plan
    function renderMarkers(sectionName, planContainer) {
        if (!window.planMarkers[sectionName]) return;

        window.planMarkers[sectionName].forEach((marker, index) => {
            const rowData = window[sectionName + 'Data'][marker.rowIndex];
            const label = rowData ? (rowData.code || rowData.nom || (marker.rowIndex + 1)) : '?';

            // Conteneur pour le marqueur + label
            const markerWrapper = document.createElement('div');
            markerWrapper.style.cssText = `
                position: absolute;
                left: ${marker.x}%;
                top: ${marker.y}%;
                transform: translate(-50%, -50%);
                z-index: 10;
            `;

            // Le point rouge
            const markerDiv = document.createElement('div');
            markerDiv.style.cssText = `
                background: #ff6b6b;
                color: white;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 8px;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
            `;
            markerDiv.textContent = '';

            // Label texte permanent à côté du marqueur
            const labelDiv = document.createElement('div');
            const labelText = rowData ? (rowData.code || rowData.nom || '').substring(0, 20) : '?';
            labelDiv.style.cssText = `
                position: absolute;
                left: 20px;
                top: -4px;
                background: rgba(0, 0, 0, 0.75);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                white-space: nowrap;
                pointer-events: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;
            labelDiv.textContent = labelText;
            markerDiv.appendChild(labelDiv);

            // Créer un tooltip amélioré
            const tooltip = document.createElement('div');
            tooltip.style.cssText = `
                position: absolute;
                bottom: 110%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 1000;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            const tooltipContent = [];
            if (rowData) {
                if (rowData.code) tooltipContent.push(`<strong>Code:</strong> ${rowData.code}`);
                if (rowData.nom) tooltipContent.push(`<strong>Nom:</strong> ${rowData.nom}`);
                if (rowData.priorite) tooltipContent.push(`<strong>Priorité:</strong> ${rowData.priorite}`);
                if (rowData.statut) tooltipContent.push(`<strong>Statut:</strong> ${rowData.statut}`);
            }
            tooltip.innerHTML = tooltipContent.length > 0 ? tooltipContent.join('<br>') : 'N/A';

            // Ajouter une petite flèche au tooltip
            const arrow = document.createElement('div');
            arrow.style.cssText = `
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid rgba(0, 0, 0, 0.9);
            `;
            tooltip.appendChild(arrow);
            markerDiv.appendChild(tooltip);

            // Afficher/masquer le tooltip au survol
            markerDiv.onmouseenter = function() {
                tooltip.style.opacity = '1';
            };
            markerDiv.onmouseleave = function() {
                tooltip.style.opacity = '0';
            };

            // Supprimer le marqueur au double-clic
            markerDiv.ondblclick = function(e) {
                e.stopPropagation();
                if (confirm('Supprimer ce marqueur ?')) {
                    window.planMarkers[sectionName].splice(index, 1);
                    renderPlan(sectionName);
                    saveSectionData(sectionName, true); // Auto-save après suppression de marqueur
                }
            };

            markerWrapper.appendChild(markerDiv);
            planContainer.appendChild(markerWrapper);
        });
    }

    // Afficher le sélecteur de ligne pour associer un marqueur
    function showMarkerRowSelector(sectionName, x, y) {
        const data = window[sectionName + 'Data'];

        if (!data || data.length === 0) {
            alert('Veuillez d\'abord ajouter des lignes au tableau avant de placer des marqueurs.');
            return;
        }

        // Créer une liste d'options
        let options = 'Choisissez la ligne à associer à ce marqueur:\n\n';
        data.forEach((row, index) => {
            const label = `${index + 1}. ${row.code || ''} ${row.nom || ''}`.trim();
            options += `${index + 1}: ${label}\n`;
        });

        const choice = prompt(options + '\nEntrez le numéro de la ligne:');
        if (choice === null) return; // Annulé

        const rowIndex = parseInt(choice) - 1;
        if (rowIndex >= 0 && rowIndex < data.length) {
            // Initialiser les marqueurs si nécessaire
            if (!window.planMarkers[sectionName]) {
                window.planMarkers[sectionName] = [];
            }

            // Ajouter le marqueur
            window.planMarkers[sectionName].push({ x, y, rowIndex });
            renderPlan(sectionName);
            saveSectionData(sectionName, true); // Auto-save après ajout de marqueur
        } else {
            alert('Numéro de ligne invalide');
        }
    }

    // Stockage des niveaux de zoom pour chaque section
    window.planZoomLevels = window.planZoomLevels || {};

    // Fonction de zoom/dézoom du plan
    window.zoomPlan = function(sectionName, action) {
        // Initialiser le zoom à 1 (100%) si nécessaire
        if (!window.planZoomLevels[sectionName]) {
            window.planZoomLevels[sectionName] = 1;
        }

        const planContainer = document.getElementById(`plan-container-${sectionName}`);
        const zoomLevelSpan = document.getElementById(`zoom-level-${sectionName}`);

        if (!planContainer || !zoomLevelSpan) return;

        let currentZoom = window.planZoomLevels[sectionName];

        // Modifier le niveau de zoom selon l'action
        if (action === 'in') {
            currentZoom = Math.min(currentZoom + 0.25, 3); // Max 300%
        } else if (action === 'out') {
            currentZoom = Math.max(currentZoom - 0.25, 0.5); // Min 50%
        } else if (action === 'reset') {
            currentZoom = 1; // 100%
        }

        // Appliquer le zoom
        window.planZoomLevels[sectionName] = currentZoom;
        planContainer.style.transform = `scale(${currentZoom})`;
        zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;

        console.log(`[ZOOM] ${sectionName} - Niveau: ${currentZoom}`);
    };

    // Fonction pour rechercher et mettre à jour la date depuis TPAA
    window.updateDateFromTPAA = function(sectionName, rowIndex) {
        const row = window[sectionName + 'Data'][rowIndex];
        if (!row || !row.code) {
            return;
        }

        // Essayer de récupérer les données TPAA depuis le localStorage
        try {
            const tpaaPwCached = localStorage.getItem('tpaaPwCachedData');
            if (!tpaaPwCached) {
                console.log('[TPAA-DATE] Aucune donnée TPAA dans localStorage');
                return;
            }

            const cachedData = JSON.parse(tpaaPwCached);
            if (!cachedData.tpaaData || cachedData.tpaaData.length === 0) {
                console.log('[TPAA-DATE] Aucune donnée TPAA disponible');
                return;
            }

            // Rechercher dans TPAA une correspondance avec le code (poste technique)
            const code = row.code.trim().toUpperCase();
            console.log(`[TPAA-DATE] Recherche pour CODE: "${code}"`);

            const matchingTpaa = cachedData.tpaaData.find(tpaa => {
                // Essayer toutes les variantes possibles de noms de colonnes
                const tpaaPtech = (
                    tpaa.posteTechnique ||
                    tpaa['Poste Technique'] ||
                    tpaa['PosteTechnique'] ||
                    tpaa['POSTE TECHNIQUE'] ||
                    tpaa['Poste technique'] ||
                    tpaa['P.Tech.'] ||
                    tpaa['ptech'] ||
                    tpaa.ptech ||
                    ''
                ).toString().trim().toUpperCase();

                if (tpaaPtech) {
                    console.log(`[TPAA-DATE] Comparaison: "${tpaaPtech}" === "${code}" ? ${tpaaPtech === code}`);
                }
                return tpaaPtech === code;
            });

            if (matchingTpaa) {
                // Essayer différentes propriétés pour la date
                const date = (
                    matchingTpaa.dateCalculee ||
                    matchingTpaa['Date Calculée'] ||
                    matchingTpaa['Date calculée'] ||
                    matchingTpaa.date ||
                    matchingTpaa.Date ||
                    matchingTpaa['Date Prévue'] ||
                    matchingTpaa.datePrevue ||
                    ''
                );
                window[sectionName + 'Data'][rowIndex].dateTpaa = date;
                console.log(`[TPAA-DATE] ✅ Date trouvée pour ${code}: ${date}`);
                console.log('[TPAA-DATE] Objet TPAA trouvé:', matchingTpaa);
                renderSectionTable(sectionName);
                saveSectionData(sectionName, true);
            } else {
                console.log(`[TPAA-DATE] ❌ Aucune correspondance trouvée pour ${code}`);
                console.log('[TPAA-DATE] Nombre de TPAA disponibles:', cachedData.tpaaData.length);
                // Afficher les 3 premiers postes techniques pour debug
                if (cachedData.tpaaData.length > 0) {
                    console.log('[TPAA-DATE] Exemples de postes techniques disponibles:');
                    cachedData.tpaaData.slice(0, 3).forEach((t, i) => {
                        console.log(`  ${i+1}:`, t.posteTechnique || t['Poste Technique'] || t['PosteTechnique'] || 'N/A');
                    });
                }
                window[sectionName + 'Data'][rowIndex].dateTpaa = '';
                renderSectionTable(sectionName);
            }
        } catch (error) {
            console.error('[TPAA-DATE] Erreur:', error);
        }
    };

    // Ajouter une ligne
    window.addHydrauliqueRow = function() {
        window.hydrauliqueData.push({ code: '', nom: '', priorite: 'Moyenne', dateTpaa: '', jeudi: '', feuilleVerrouillage: '', statut: '', photo: '' });
        renderSectionTable('hydraulique');
        saveSectionData('hydraulique', true); // Auto-save après ajout
    };

    window.addNettoyageRow = function() {
        window.nettoyageData.push({ code: '', nom: '', priorite: 'Moyenne', dateTpaa: '', jeudi: '', feuilleVerrouillage: '', statut: '', photo: '' });
        renderSectionTable('nettoyage');
        saveSectionData('nettoyage', true); // Auto-save après ajout
    };

    window.addNdtRow = function() {
        window.ndtData.push({ code: '', nom: '', priorite: 'Moyenne', dateTpaa: '', jeudi: '', feuilleVerrouillage: '', statut: '', photo: '' });
        renderSectionTable('ndt');
        saveSectionData('ndt', true); // Auto-save après ajout
    };

    // Mettre à jour une cellule
    window.updateSectionCell = function(sectionName, index, field, value) {
        if (window[sectionName + 'Data'][index]) {
            window[sectionName + 'Data'][index][field] = value;

            // Si le statut change, re-rendre le tableau pour mettre à jour les couleurs
            if (field === 'statut') {
                renderSectionTable(sectionName);
            }

            // Auto-sauvegarde avec debounce (attendre 2 secondes après la dernière modification)
            if (autoSaveTimers[sectionName]) {
                clearTimeout(autoSaveTimers[sectionName]);
            }

            autoSaveTimers[sectionName] = setTimeout(() => {
                console.log('Auto-sauvegarde de', sectionName);
                saveSectionData(sectionName, true); // true = auto-save silencieux
            }, 2000);
        }
    };

    // Supprimer une ligne
    window.deleteSectionRow = function(sectionName, index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
            window[sectionName + 'Data'].splice(index, 1);
            renderSectionTable(sectionName);
            saveSectionData(sectionName, true); // Auto-save après suppression
        }
    };

    // Sauvegarder les données
    window.saveHydrauliqueData = function() { saveSectionData('hydraulique', false); };
    window.saveNettoyageData = function() { saveSectionData('nettoyage', false); };
    window.saveNdtData = function() { saveSectionData('ndt', false); };

    function saveSectionData(sectionName, isAutoSave = false) {
        const socket = window.socket;
        if (!socket) {
            if (!isAutoSave) {
                alert('Erreur: Socket non disponible');
            }
            return;
        }

        socket.emit('update-data', {
            module: sectionName + 'SectionData',
            data: {
                tableData: window[sectionName + 'Data'],
                planImage: window.planImages[sectionName],
                markers: window.planMarkers[sectionName] || []
            }
        });

        if (!isAutoSave) {
            socket.once('data-saved', () => {
                alert('✅ Données sauvegardées avec succès!');
            });
        } else {
            // Auto-save silencieux - juste un log
            socket.once('data-saved', () => {
                console.log('✅ Auto-sauvegarde réussie pour', sectionName);
            });
        }
    }

    // Upload de plan
    window.uploadPlan = function(sectionName) {
        console.log('[uploadPlan] Appelé pour section:', sectionName);
        const fileInput = document.getElementById(sectionName + '-plan-upload');
        console.log('[uploadPlan] Input file trouvé:', fileInput);
        if (!fileInput) {
            console.error('[uploadPlan] ❌ Input file non trouvé:', sectionName + '-plan-upload');
            alert(`Erreur: L'input file "${sectionName}-plan-upload" n'a pas été trouvé.`);
            return;
        }
        fileInput.click();
        console.log('[uploadPlan] ✅ Click déclenché sur input file');
    };

    window.handlePlanUpload = function(event, sectionName) {
        console.log('[handlePlanUpload] Appelé pour section:', sectionName);
        const file = event.target.files[0];
        if (!file) {
            console.warn('[handlePlanUpload] Aucun fichier sélectionné');
            return;
        }

        console.log('[handlePlanUpload] Fichier sélectionné:', file.name, file.type);
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('[handlePlanUpload] Fichier chargé, taille:', e.target.result.length);
            window.planImages[sectionName] = e.target.result;
            console.log('[handlePlanUpload] Image stockée dans window.planImages');
            renderPlan(sectionName);
            saveSectionData(sectionName, true); // Auto-save après upload de plan
            console.log('[handlePlanUpload] ✅ Upload terminé');
        };
        reader.onerror = function(error) {
            console.error('[handlePlanUpload] ❌ Erreur lecture fichier:', error);
        };
        reader.readAsDataURL(file);
    };

    // Gestion des photos dans les lignes de tableau
    window.uploadSectionPhoto = function(sectionName, rowIndex) {
        const fileInput = document.getElementById(`${sectionName}-photo-${rowIndex}`);
        if (fileInput) {
            fileInput.click();
        }
    };

    window.handleSectionPhotoUpload = function(event, sectionName, rowIndex) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            if (window[sectionName + 'Data'][rowIndex]) {
                window[sectionName + 'Data'][rowIndex].photo = e.target.result;
                renderSectionTable(sectionName);
                saveSectionData(sectionName, true); // Auto-save après upload de photo
            }
        };
        reader.readAsDataURL(file);
    };

    window.viewSectionPhoto = function(sectionName, rowIndex) {
        const row = window[sectionName + 'Data'][rowIndex];
        if (!row || !row.photo) return;

        // Créer une modal pour afficher la photo en grand
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = row.photo;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;

        modal.appendChild(img);
        document.body.appendChild(modal);

        modal.onclick = function() {
            document.body.removeChild(modal);
        };
    };

    window.deleteSectionPhoto = function(sectionName, rowIndex) {
        if (confirm('Supprimer cette photo ?')) {
            if (window[sectionName + 'Data'][rowIndex]) {
                delete window[sectionName + 'Data'][rowIndex].photo;
                renderSectionTable(sectionName);
                saveSectionData(sectionName, true); // Auto-save après suppression de photo
            }
        }
    };

    // Export PDF d'une section complète
    window.exportSectionToPDF = async function(sectionName) {
        try {
            // Vérifier que jsPDF est chargé
            if (typeof window.jspdf === 'undefined') {
                alert('jsPDF n\'est pas chargé. Veuillez recharger la page.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape (paysage)

            // Titres selon la section (sans emojis)
            const titles = {
                'hydraulique': 'SYSTEME HYDRAULIQUE',
                'nettoyage': 'NETTOYAGE',
                'ndt': 'NDT - CONTROLE NON DESTRUCTIF'
            };
            const title = titles[sectionName] || sectionName.toUpperCase();

            // En-tête
            pdf.setFontSize(16);
            pdf.setTextColor(59, 130, 246);
            pdf.text(title, 148.5, 12, { align: 'center' }); // 148.5 = milieu en paysage (297/2)

            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, 148.5, 18, { align: 'center' });

            let yPos = 25;

            // 1. Ajouter le plan avec les marqueurs si disponible (côté gauche, centré)
            let planWidth = 0;
            const leftSectionWidth = 135; // Largeur de la section gauche
            const rightSectionX = 140; // Début de la section droite
            const totalAvailableHeight = 175; // Hauteur totale disponible
            const planSectionHeight = totalAvailableHeight / 2; // Moitié pour le plan
            const commentSectionHeight = totalAvailableHeight / 2; // Moitié pour les commentaires

            if (window.planImages[sectionName]) {
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont(undefined, 'bold');
                pdf.text('PLAN AVEC MARQUEURS', leftSectionWidth / 2, yPos, { align: 'center' });
                pdf.setFont(undefined, 'normal');

                const planYStart = yPos + 3;

                // Charger html2canvas dynamiquement si nécessaire
                if (typeof html2canvas === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    document.head.appendChild(script);
                    await new Promise(resolve => script.onload = resolve);
                }

                // Capturer le plan avec les marqueurs
                const planContainer = document.getElementById(`plan-container-${sectionName}`);
                if (planContainer) {
                    const canvas = await html2canvas(planContainer, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const maxPlanWidth = 125; // Largeur max du plan
                    const imgHeight = (canvas.height * maxPlanWidth) / canvas.width;
                    const maxPlanHeight = planSectionHeight - 8; // Hauteur max = moitié de l'espace moins marges
                    const finalHeight = Math.min(imgHeight, maxPlanHeight);
                    const finalWidth = (canvas.width * finalHeight) / canvas.height;

                    // Centrer le plan dans la section gauche
                    const planX = (leftSectionWidth - finalWidth) / 2;
                    pdf.addImage(imgData, 'PNG', planX, planYStart, finalWidth, finalHeight);
                    planWidth = leftSectionWidth;
                }
            }

            // 2. Ajouter le tableau avec les données (côté droit, centré)
            const data = window[sectionName + 'Data'];
            const tableX = planWidth > 0 ? rightSectionX : 10; // Position X du tableau
            const tableWidth = planWidth > 0 ? 147 : 277; // Largeur du tableau
            let tableYPos = 25; // Position Y du tableau (commence en haut)
            const tableStartY = tableYPos;

            if (data && data.length > 0) {
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont(undefined, 'bold');
                pdf.text('LISTE DES ELEMENTS', tableX + (tableWidth / 2), tableYPos, { align: 'center' });
                pdf.setFont(undefined, 'normal');
                tableYPos += 5;

                // En-tête du tableau
                pdf.setFontSize(8);
                pdf.setFillColor(59, 130, 246);
                pdf.setTextColor(255, 255, 255);
                pdf.rect(tableX, tableYPos, tableWidth, 5, 'F');

                const colWidths = {
                    code: 28,
                    nom: 57,
                    jeudi: 15,
                    date: 20,
                    statut: 27
                };

                // Lignes verticales dans l'en-tête
                pdf.setDrawColor(255, 255, 255);
                pdf.setLineWidth(0.3);
                let headerVerticalX = tableX + colWidths.code;
                pdf.line(headerVerticalX, tableYPos, headerVerticalX, tableYPos + 5); // Après Code
                headerVerticalX += colWidths.nom;
                pdf.line(headerVerticalX, tableYPos, headerVerticalX, tableYPos + 5); // Après Nom
                headerVerticalX += colWidths.jeudi;
                pdf.line(headerVerticalX, tableYPos, headerVerticalX, tableYPos + 5); // Après Jeudi
                headerVerticalX += colWidths.date;
                pdf.line(headerVerticalX, tableYPos, headerVerticalX, tableYPos + 5); // Après Date

                let xPos = tableX + 2;
                pdf.text('Code', xPos, tableYPos + 3.5);
                xPos += colWidths.code;
                pdf.text('Nom', xPos, tableYPos + 3.5);
                xPos += colWidths.nom;
                pdf.text('Jeudi', xPos, tableYPos + 3.5);
                xPos += colWidths.jeudi;
                pdf.text('Date', xPos, tableYPos + 3.5);
                xPos += colWidths.date;
                pdf.text('Statut', xPos, tableYPos + 3.5);
                tableYPos += 6;

                // Calculer la hauteur max du tableau pour qu'il s'aligne avec le bas de la zone commentaires
                // commentYStart = 25 + planSectionHeight + 5 = 25 + 87.5 + 5 = 117.5
                // bas commentaires = commentYStart + 2 + commentBoxHeight = 117.5 + 2 + 77.5 = 197
                const commentBottomY = 25 + planSectionHeight + 5 + 2 + (commentSectionHeight - 10);
                const tableContentStartY = tableYPos; // Position Y après le titre et l'en-tête
                const maxTableHeight = commentBottomY - tableContentStartY; // Hauteur disponible pour le contenu

                // Lignes du tableau - afficher TOUS les éléments
                pdf.setTextColor(0, 0, 0);
                const displayData = data;
                let currentTableHeight = 0;

                for (let i = 0; i < displayData.length; i++) {
                    const row = displayData[i];

                    // Calculer la hauteur de ligne nécessaire selon le texte du nom
                    const nomLines = pdf.splitTextToSize(row.nom || '', colWidths.nom - 2);
                    const nomTextHeight = nomLines.length * 3; // 3mm par ligne de texte (optimisé)
                    const rowHeight = Math.max(nomTextHeight + 1.5, 5); // Hauteur minimale réduite à 5mm

                    // Vérifier si on dépasse la hauteur max du tableau
                    if (currentTableHeight + rowHeight > maxTableHeight && i > 0) {
                        // Ajouter une note et arrêter
                        pdf.setFontSize(6);
                        pdf.setTextColor(150, 150, 150);
                        pdf.text(`(${data.length - i} elements supplementaires non affiches)`, tableX, tableYPos + 2);
                        console.log(`[PDF] ${i} elements affiches sur ${data.length} total. Hauteur utilisee: ${currentTableHeight}mm / ${maxTableHeight}mm`);
                        break;
                    }

                    currentTableHeight += rowHeight;

                    // Fond de ligne alterné
                    if (i % 2 === 0) {
                        pdf.setFillColor(248, 249, 250);
                        pdf.rect(tableX, tableYPos, tableWidth, rowHeight, 'F');
                    }

                    // Couleur selon le statut
                    if (row.statut === 'Termine' || row.statut === 'Terminé') {
                        pdf.setFillColor(232, 245, 233);
                        pdf.rect(tableX, tableYPos, tableWidth, rowHeight, 'F');
                    } else if (row.statut === 'A faire' || row.statut === 'À faire') {
                        pdf.setFillColor(255, 224, 224);
                        pdf.rect(tableX, tableYPos, tableWidth, rowHeight, 'F');
                    }

                    // Bordure horizontale
                    pdf.setDrawColor(222, 226, 230);
                    pdf.rect(tableX, tableYPos, tableWidth, rowHeight);

                    // Lignes verticales pour séparer les colonnes
                    pdf.setDrawColor(222, 226, 230);
                    pdf.setLineWidth(0.3);
                    let verticalX = tableX + colWidths.code;
                    pdf.line(verticalX, tableYPos, verticalX, tableYPos + rowHeight); // Après Code
                    verticalX += colWidths.nom;
                    pdf.line(verticalX, tableYPos, verticalX, tableYPos + rowHeight); // Après Nom
                    verticalX += colWidths.jeudi;
                    pdf.line(verticalX, tableYPos, verticalX, tableYPos + rowHeight); // Après Jeudi
                    verticalX += colWidths.date;
                    pdf.line(verticalX, tableYPos, verticalX, tableYPos + rowHeight); // Après Date

                    // Texte
                    pdf.setFontSize(7);
                    let xPos = tableX + 2;

                    // Code
                    const codeText = (row.code || '').substring(0, 15);
                    pdf.text(codeText, xPos, tableYPos + 3.5);
                    xPos += colWidths.code;

                    // Nom (avec retour à la ligne) - réutilise nomLines déjà calculé
                    pdf.text(nomLines, xPos, tableYPos + 3.5);
                    xPos += colWidths.nom;

                    // Jeudi (Oui/Non)
                    pdf.text(row.jeudi || '-', xPos, tableYPos + 3.5);
                    xPos += colWidths.jeudi;

                    // Date TPAA
                    pdf.text(row.dateTpaa || '', xPos, tableYPos + 3.5);
                    xPos += colWidths.date;

                    // Statut (sans accents)
                    const statut = (row.statut || '').replace('À', 'A').replace('é', 'e');
                    pdf.text(statut, xPos, tableYPos + 3.5);

                    tableYPos += rowHeight;
                }

                // Log final si tous les éléments ont été affichés
                if (displayData.length > 0) {
                    console.log(`[PDF] Tous les ${displayData.length} elements ont ete affiches. Hauteur utilisee: ${currentTableHeight}mm / ${maxTableHeight}mm`);
                }
            } else {
                pdf.setFontSize(10);
                pdf.setTextColor(150, 150, 150);
                pdf.text('Aucune donnee disponible', tableX + (tableWidth / 2), tableYPos, { align: 'center' });
            }

            // Zone de commentaire sous le plan (côté gauche uniquement, moitié inférieure)
            const commentYStart = 25 + planSectionHeight + 5; // Commence après la moitié supérieure
            const commentX = 10;
            const commentWidth = 125; // Largeur de la zone de commentaires (même que la section gauche)

            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'bold');
            pdf.text('COMMENTAIRES', commentX + (commentWidth / 2), commentYStart, { align: 'center' });
            pdf.setFont(undefined, 'normal');

            // Dessiner le cadre pour les commentaires (moitié inférieure de la section gauche)
            pdf.setDrawColor(100, 100, 100);
            pdf.setLineWidth(0.5);
            const commentBoxHeight = commentSectionHeight - 10; // Hauteur de la zone de commentaires
            pdf.rect(commentX, commentYStart + 2, commentWidth, commentBoxHeight);

            // Lignes horizontales dans la zone de commentaire
            const numLines = Math.floor(commentBoxHeight / 10); // Une ligne tous les 10mm
            for (let i = 1; i <= numLines; i++) {
                const lineY = commentYStart + 2 + (i * 10);
                if (lineY < commentYStart + 2 + commentBoxHeight) {
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.2);
                    pdf.line(commentX, lineY, commentX + commentWidth, lineY);
                }
            }

            // Pied de page
            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Page 1 / 1`, 148.5, 203, { align: 'center' });
            pdf.text(`Document genere automatiquement`, 148.5, 206, { align: 'center' });

            // Afficher le PDF dans un nouvel onglet au lieu de le télécharger
            const fileName = `${sectionName}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Créer une URL blob et l'ouvrir dans un nouvel onglet
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Ouvrir dans un nouvel onglet
            const pdfWindow = window.open(pdfUrl, '_blank');

            if (pdfWindow) {
                // Définir le titre de l'onglet
                pdfWindow.document.title = fileName;
                console.log(`[PDF] Rapport ouvert dans un nouvel onglet: ${fileName}`);
            } else {
                // Si le popup est bloqué, télécharger directement
                pdf.save(fileName);
                alert('Le popup a ete bloque. Le PDF a ete telecharge.');
            }
        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            alert('ERREUR: Impossible d\'exporter le PDF. Consultez la console pour plus de details.');
        }
    };

    // ==================== EXPOSITION GLOBALE DE SWITCHPAGE ====================

    // Exposer switchPage directement pour les onclick simples
    window.switchPage = switchPage;

    // Créer window.appActions pour une utilisation cohérente
    window.appActions = {
        switchPage: switchPage,
        save: () => {
            console.log('[SAVE] Sauvegarde via appActions');
            // La fonction de sauvegarde sera appelée via saveData() défini plus haut
            if (typeof window.saveData === 'function') {
                window.saveData();
            }
        },
        exportData: () => {
            console.log('[EXPORT] Export via appActions');
            // La fonction d'export sera appelée via exportToExcel() défini plus haut
            if (typeof window.exportToExcel === 'function') {
                window.exportToExcel();
            }
        }
    };

    console.log('[OK] Fonctions globales exposées');
}
