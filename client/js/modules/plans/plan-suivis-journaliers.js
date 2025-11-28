/**
 * @fileoverview Module de gestion des Plans et Suivis Journaliers
 * @module plans/plan-suivis-journaliers
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getSocket } from '../sync/server-sync.js';

/**
 * Structure de stockage des plans et fichiers MS Project
 * @type {Object}
 */
let planSuivisData = {
    plans: [],
    msProjectFiles: []
};

const STORAGE_KEY = 'planSuivisJournaliersData';

/**
 * Mode de placement actuel ('postes', 'echafaudages', 'grues')
 * @type {string}
 */
let placementMode = 'postes';

/**
 * Variables pour le dessin de zones rectangulaires
 */
let isDrawing = false;
let drawStartX = 0;
let drawStartY = 0;
let currentDrawingRect = null;

/**
 * OBSOLÈTE - Ne plus utiliser (localStorage désactivé)
 * @returns {void}
 */
export function loadPlanSuivisData() {
    console.warn('[PLAN-SUIVIS] ⚠️ Fonction obsolète - localStorage désactivé');
    planSuivisData = {
        plans: [],
        msProjectFiles: []
    };
}

/**
 * Charge les données depuis le serveur (asynchrone - RECOMMANDÉ)
 * @returns {Promise<void>}
 */
export async function loadPlanSuivisDataFromServer() {
    try {
        console.log('[PLAN-SUIVIS] 📥 Chargement depuis le serveur...');

        // Récupérer le socket depuis server-sync
        const socket = getSocket();
        if (!socket) {
            console.warn('[PLAN-SUIVIS] ⚠️ Socket non disponible, utilisation de localStorage');
            loadPlanSuivisData();
            return;
        }

        // Utiliser Socket.io pour charger depuis le serveur
        const response = await new Promise((resolve) => {
            socket.emit('data:getModule', { moduleName: 'planSuivisJournaliersData' }, resolve);
        });

        if (response.success && response.data) {
            planSuivisData = response.data;
            console.log('[PLAN-SUIVIS] ✅ Données chargées depuis le serveur:', {
                plans: planSuivisData.plans?.length || 0,
                msProjectFiles: planSuivisData.msProjectFiles?.length || 0
            });
        } else {
            console.warn('[PLAN-SUIVIS] ⚠️ Aucune donnée sur le serveur');
            planSuivisData = {
                plans: [],
                msProjectFiles: []
            };
        }
    } catch (error) {
        console.error('[PLAN-SUIVIS] ❌ Erreur lors du chargement depuis le serveur:', error);
        // Fallback sur localStorage
        loadPlanSuivisData();
    }
}

/**
 * Initialise la page Plan Suivis Journaliers
 * @returns {Promise<void>}
 */
export async function initPlanSuivisPage() {
    console.log('[PLAN-SUIVIS] Initialisation de la page...');

    // Charger les données depuis le serveur
    await loadPlanSuivisDataFromServer();

    // Afficher la liste des fichiers MS Project (recharger depuis storage)
    renderMSProjectFilesList(true);

    // Afficher la liste des plans
    renderPlansList();

    console.log('[PLAN-SUIVIS] Page initialisée');
}

/**
 * Sauvegarde les données dans localStorage
 * @returns {Promise<boolean>} Succès de la sauvegarde
 */
async function savePlanSuivisData() {
    console.log('[PLAN-SUIVIS] Sauvegarde en cours...', {
        plansCount: planSuivisData.plans?.length || 0,
        msProjectFilesCount: planSuivisData.msProjectFiles?.length || 0,
        key: STORAGE_KEY
    });

    try {
        // Attendre la sauvegarde sur le serveur
        const success = await saveToStorage(STORAGE_KEY, planSuivisData);

        if (!success) {
            console.error('[PLAN-SUIVIS] ❌ ERREUR: Échec de la sauvegarde sur le serveur!');
            return false;
        }

        console.log('[PLAN-SUIVIS] ✅ Données sauvegardées avec succès sur le serveur');

        // Vérification désactivée - localStorage n'est plus utilisé
        console.log('[PLAN-SUIVIS] ✅ Sauvegarde serveur confirmée');

        return true;
    } catch (error) {
        console.error('[PLAN-SUIVIS] ❌ ERREUR lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Charge un fichier MS Project
 * @returns {void}
 */
export function loadMSProjectFile() {
    console.log('[PLAN-SUIVIS] loadMSProjectFile appelé');

    // S'assurer que planSuivisData est initialisé
    loadPlanSuivisData();

    // Initialiser msProjectFiles si nécessaire
    if (!planSuivisData.msProjectFiles) {
        planSuivisData.msProjectFiles = [];
        console.log('[PLAN-SUIVIS] Initialisation du tableau msProjectFiles');
    }

    // Créer un input de type file pour ouvrir l'explorateur de fichiers
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.mpp,.xml,.mspdi';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.log('[PLAN-SUIVIS] Aucun fichier sélectionné');
            return;
        }

        console.log('[PLAN-SUIVIS] Fichier sélectionné:', file.name, 'Taille:', file.size, 'Type:', file.type);

        try {
            // Lire le fichier
            const reader = new FileReader();

            reader.onload = async (event) => {
                console.log('[PLAN-SUIVIS] Fichier lu avec succès');

                const fileData = {
                    id: 'msproject-' + Date.now(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    uploadDate: new Date().toISOString(),
                    data: event.target.result
                };

                console.log('[PLAN-SUIVIS] fileData créé:', {
                    id: fileData.id,
                    name: fileData.name,
                    size: fileData.size,
                    dataLength: fileData.data.length
                });

                // Recharger les données avant d'ajouter
                loadPlanSuivisData();
                console.log('[PLAN-SUIVIS] planSuivisData avant ajout:', {
                    plansCount: planSuivisData.plans?.length || 0,
                    msProjectFilesCount: planSuivisData.msProjectFiles?.length || 0
                });

                // S'assurer que le tableau existe
                if (!planSuivisData.msProjectFiles) {
                    planSuivisData.msProjectFiles = [];
                    console.log('[PLAN-SUIVIS] Initialisation du tableau msProjectFiles');
                }

                planSuivisData.msProjectFiles.push(fileData);
                console.log('[PLAN-SUIVIS] ✅ Fichier ajouté. Total fichiers:', planSuivisData.msProjectFiles.length);
                console.log('[PLAN-SUIVIS] planSuivisData après ajout:', planSuivisData);

                // Sauvegarder (attendre la sauvegarde serveur)
                const saveSuccess = await savePlanSuivisData();
                console.log('[PLAN-SUIVIS] Sauvegarde terminée:', saveSuccess ? '✅ OK' : '❌ ERREUR');

                // Vérifier que les données sont bien sauvegardées
                const verification = loadFromStorage(STORAGE_KEY);
                console.log('[PLAN-SUIVIS] Vérification après sauvegarde:', {
                    saved: !!verification,
                    msProjectFilesCount: verification?.msProjectFiles?.length || 0
                });

                // Rafraîchir l'affichage (sans recharger depuis storage, utiliser les données en mémoire)
                console.log('[PLAN-SUIVIS] Appel de renderMSProjectFilesList...');
                console.log('[PLAN-SUIVIS] planSuivisData AVANT render:', {
                    msProjectFiles: planSuivisData.msProjectFiles?.length || 0,
                    plans: planSuivisData.plans?.length || 0
                });
                renderMSProjectFilesList(false);  // Ne PAS recharger, utiliser les données en mémoire

                // Afficher le message de succès
                if (saveSuccess) {
                    showStatus('msProjectUploadStatus', 'success', `✅ Fichier "${file.name}" chargé avec succès !`);
                    alert(`✅ Fichier "${file.name}" chargé avec succès !\n\nLe fichier apparaît maintenant dans la liste ci-dessous.`);
                } else {
                    showStatus('msProjectUploadStatus', 'error', `⚠️ Fichier "${file.name}" chargé mais non sauvegardé sur le serveur`);
                    alert(`⚠️ ATTENTION: Le fichier "${file.name}" est chargé MAIS n'a pas pu être sauvegardé sur le serveur.\n\nAssurez-vous que le serveur est démarré.`);
                }
            };

            reader.onerror = (error) => {
                console.error('[PLAN-SUIVIS] ❌ Erreur lors de la lecture du fichier:', error);
                showStatus('msProjectUploadStatus', 'error', '❌ Erreur lors de la lecture du fichier');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('[PLAN-SUIVIS] ❌ Erreur lors du chargement du fichier:', error);
            showStatus('msProjectUploadStatus', 'error', '❌ Erreur: ' + error.message);
        }
    };

    fileInput.click();
    console.log('[PLAN-SUIVIS] Explorateur de fichiers ouvert');
}

/**
 * Affiche la liste des fichiers MS Project
 * @param {boolean} reload - Recharger les données depuis localStorage (défaut: false)
 * @returns {void}
 */
export function renderMSProjectFilesList(reload = false) {
    const container = document.getElementById('msProjectFilesList');
    if (!container) {
        console.warn('[PLAN-SUIVIS] Container msProjectFilesList non trouvé');
        return;
    }

    // Ne recharger que si demandé explicitement (pour éviter d'écraser les données en mémoire)
    if (reload) {
        console.log('[PLAN-SUIVIS] Rechargement des données depuis localStorage...');
        loadPlanSuivisData();
    }

    // Initialiser msProjectFiles si nécessaire
    if (!planSuivisData.msProjectFiles) {
        planSuivisData.msProjectFiles = [];
    }

    console.log('[PLAN-SUIVIS] renderMSProjectFilesList - Nombre de fichiers EN MÉMOIRE:', planSuivisData.msProjectFiles.length);

    if (planSuivisData.msProjectFiles.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0;">📁 Aucun fichier MS Project importé pour le moment</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: grid; gap: 15px;">';

    planSuivisData.msProjectFiles.forEach(file => {
        const uploadDate = new Date(file.uploadDate).toLocaleDateString('fr-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const fileSize = (file.size / 1024).toFixed(2);

        html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                            📊 ${file.name}
                        </div>
                        <div style="font-size: 0.9em; color: #666;">
                            Importé le: ${uploadDate}
                        </div>
                        <div style="font-size: 0.85em; color: #999; margin-top: 3px;">
                            Taille: ${fileSize} KB
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="window.planActions.viewMSProjectFile('${file.id}')"
                                style="padding: 8px 12px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                            👁️ Voir
                        </button>
                        <button onclick="window.planActions.deleteMSProjectFile('${file.id}')"
                                style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    console.log(`[PLAN-SUIVIS] ${planSuivisData.msProjectFiles.length} fichiers MS Project affichés`);
}

/**
 * Affiche un fichier MS Project
 * @param {string} fileId - ID du fichier
 * @returns {void}
 */
export function viewMSProjectFile(fileId) {
    // Ne PAS recharger - utiliser les données en mémoire
    console.log('[PLAN-SUIVIS] Recherche du fichier:', fileId);
    console.log('[PLAN-SUIVIS] Fichiers disponibles:', planSuivisData.msProjectFiles?.length || 0);

    if (!planSuivisData.msProjectFiles || planSuivisData.msProjectFiles.length === 0) {
        console.error('[PLAN-SUIVIS] ❌ Aucun fichier MS Project en mémoire');
        alert('❌ Aucun fichier MS Project disponible');
        return;
    }

    const file = planSuivisData.msProjectFiles.find(f => f.id === fileId);
    if (!file) {
        console.error('[PLAN-SUIVIS] ❌ Fichier non trouvé:', fileId);
        console.error('[PLAN-SUIVIS] IDs disponibles:', planSuivisData.msProjectFiles.map(f => f.id));
        alert('❌ Fichier non trouvé');
        return;
    }

    console.log('[PLAN-SUIVIS] Affichage aperçu MS Project:', file.name);

    // Créer une modale d'aperçu
    showMSProjectPreview(file);
}

/**
 * Affiche une modale d'aperçu pour un fichier MS Project
 * @param {Object} file - Données du fichier
 * @returns {void}
 */
function showMSProjectPreview(file) {
    // Créer la modale
    const modal = document.createElement('div');
    modal.id = 'msProjectPreviewModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 10px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <div>
            <h2 style="margin: 0 0 5px 0;">📊 Aperçu MS Project</h2>
            <p style="margin: 0; opacity: 0.9; font-size: 0.9em;">${file.name}</p>
        </div>
        <button onclick="document.getElementById('msProjectPreviewModal').remove()"
                style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 1.2em; font-weight: bold;">
            ✖️
        </button>
    `;

    // Body
    const body = document.createElement('div');
    body.style.cssText = 'padding: 20px;';

    // Infos générales
    const uploadDate = new Date(file.uploadDate).toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    body.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #667eea;">📋 Informations du Fichier</h3>
            <div style="display: grid; gap: 8px;">
                <div><strong>Nom:</strong> ${file.name}</div>
                <div><strong>Taille:</strong> ${(file.size / 1024).toFixed(2)} KB</div>
                <div><strong>Type:</strong> ${file.type || 'Non spécifié'}</div>
                <div><strong>Date d'import:</strong> ${uploadDate}</div>
            </div>
        </div>
    `;

    // Parser le contenu si c'est du XML
    const previewContent = parseMSProjectFile(file);
    body.innerHTML += previewContent;

    // Footer avec boutons
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 15px 20px;
        border-top: 1px solid #ddd;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    `;
    footer.innerHTML = `
        <button onclick="document.getElementById('msProjectPreviewModal').remove()"
                style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Fermer
        </button>
    `;

    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);

    // Fermer en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

/**
 * Parse un fichier MS Project et retourne un aperçu HTML
 * @param {Object} file - Données du fichier
 * @returns {string} HTML de l'aperçu
 */
function parseMSProjectFile(file) {
    try {
        // Vérifier si c'est un fichier XML (base64 commence par data:text/xml ou contient du XML)
        const isXML = file.name.toLowerCase().endsWith('.xml') ||
                      file.name.toLowerCase().endsWith('.mspdi');

        if (!isXML) {
            return `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ Fichier Binaire</h3>
                    <p style="margin: 0; color: #856404;">
                        Ce fichier est au format binaire (.mpp). L'aperçu détaillé n'est disponible que pour les fichiers XML/MSPDI.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #856404;">
                        <strong>✅ Le fichier est bien chargé et sauvegardé.</strong>
                    </p>
                </div>
            `;
        }

        // Décoder le base64 pour obtenir le XML
        let xmlContent = '';
        if (file.data.startsWith('data:')) {
            const base64Data = file.data.split(',')[1];
            xmlContent = atob(base64Data);
        } else {
            xmlContent = file.data;
        }

        // Parser le XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Vérifier les erreurs de parsing
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            throw new Error('Erreur de parsing XML');
        }

        // Extraire les tâches
        const tasks = xmlDoc.getElementsByTagName('Task');

        let html = `
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #155724;">✅ Fichier XML Chargé</h3>
                <p style="margin: 0; color: #155724;">
                    <strong>${tasks.length}</strong> tâche(s) trouvée(s) dans le fichier MS Project.
                </p>
            </div>
        `;

        if (tasks.length > 0) {
            html += `
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background: #667eea; color: white; padding: 10px 15px; font-weight: bold;">
                        📋 Aperçu des Tâches (10 premières)
                    </div>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f8f9fa; position: sticky; top: 0;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">ID</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Nom</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Début</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Fin</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            // Afficher les 10 premières tâches
            const maxTasks = Math.min(10, tasks.length);
            for (let i = 0; i < maxTasks; i++) {
                const task = tasks[i];
                const id = task.getElementsByTagName('ID')[0]?.textContent || '-';
                const name = task.getElementsByTagName('Name')[0]?.textContent || 'Sans nom';
                const start = task.getElementsByTagName('Start')[0]?.textContent || '-';
                const finish = task.getElementsByTagName('Finish')[0]?.textContent || '-';

                // Formatter les dates
                const startDate = start !== '-' ? new Date(start).toLocaleDateString('fr-CA') : '-';
                const finishDate = finish !== '-' ? new Date(finish).toLocaleDateString('fr-CA') : '-';

                html += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${id}</td>
                        <td style="padding: 10px; font-weight: 500;">${name}</td>
                        <td style="padding: 10px;">${startDate}</td>
                        <td style="padding: 10px;">${finishDate}</td>
                    </tr>
                `;
            }

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            if (tasks.length > 10) {
                html += `
                    <p style="margin: 10px 0 0 0; text-align: center; color: #666; font-size: 0.9em;">
                        ... et ${tasks.length - 10} autre(s) tâche(s)
                    </p>
                `;
            }
        }

        return html;

    } catch (error) {
        console.error('[PLAN-SUIVIS] Erreur parsing MS Project:', error);
        return `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <h3 style="margin: 0 0 10px 0; color: #721c24;">⚠️ Erreur de Lecture</h3>
                <p style="margin: 0; color: #721c24;">
                    Impossible de lire le contenu du fichier. Le fichier est peut-être corrompu ou dans un format non supporté.
                </p>
                <p style="margin: 10px 0 0 0; color: #721c24; font-size: 0.9em;">
                    Erreur: ${error.message}
                </p>
            </div>
        `;
    }
}

/**
 * Supprime un fichier MS Project
 * @param {string} fileId - ID du fichier
 * @returns {Promise<void>}
 */
export async function deleteMSProjectFile(fileId) {
    console.log('[PLAN-SUIVIS] Tentative de suppression du fichier:', fileId);
    console.log('[PLAN-SUIVIS] Fichiers disponibles:', planSuivisData.msProjectFiles?.length || 0);

    if (!planSuivisData.msProjectFiles || planSuivisData.msProjectFiles.length === 0) {
        console.error('[PLAN-SUIVIS] ❌ Aucun fichier MS Project en mémoire');
        alert('❌ Aucun fichier MS Project disponible');
        return;
    }

    const file = planSuivisData.msProjectFiles.find(f => f.id === fileId);
    if (!file) {
        console.error('[PLAN-SUIVIS] ❌ Fichier non trouvé:', fileId);
        console.error('[PLAN-SUIVIS] IDs disponibles:', planSuivisData.msProjectFiles.map(f => f.id));
        alert('❌ Fichier non trouvé');
        return;
    }

    if (confirm(`⚠️ Voulez-vous vraiment supprimer le fichier "${file.name}" ?`)) {
        planSuivisData.msProjectFiles = planSuivisData.msProjectFiles.filter(f => f.id !== fileId);
        await savePlanSuivisData();
        renderMSProjectFilesList(false);  // Ne pas recharger, utiliser les données en mémoire
        console.log(`[PLAN-SUIVIS] Fichier ${fileId} supprimé`);
    }
}

/**
 * Charge un fichier de plan d'usine
 * @returns {void}
 */
export async function loadPlanImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const planData = {
                    id: 'plan-' + Date.now(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    uploadDate: new Date().toISOString(),
                    imageData: event.target.result,
                    markers: [],
                    echafaudages: [],
                    grues: []
                };

                planSuivisData.plans.push(planData);
                const saveSuccess = await savePlanSuivisData();
                renderPlansList();

                if (saveSuccess) {
                    showStatus('planUploadStatus', 'success', `✅ Plan "${file.name}" chargé avec succès !`);
                } else {
                    showStatus('planUploadStatus', 'error', `⚠️ Plan chargé mais non sauvegardé sur le serveur`);
                }
            };

            reader.onerror = () => {
                showStatus('planUploadStatus', 'error', '❌ Erreur lors de la lecture du fichier');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('[PLAN-SUIVIS] Erreur lors du chargement du plan:', error);
            showStatus('planUploadStatus', 'error', '❌ Erreur: ' + error.message);
        }
    };

    fileInput.click();
}

/**
 * Affiche la liste des plans disponibles
 * @returns {void}
 */
export function renderPlansList() {
    const container = document.getElementById('plansListContainer');
    if (!container) return;

    loadPlanSuivisData();

    if (!planSuivisData.plans || planSuivisData.plans.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px; grid-column: 1 / -1;">
                <p style="margin: 0; font-size: 1.1em;">🗺️ Aucun plan importé pour le moment</p>
                <p style="margin: 10px 0 0 0; font-size: 0.9em;">Utilisez le bouton "Charger le Plan" ci-dessus pour importer un plan</p>
            </div>
        `;
        return;
    }

    let html = '';

    planSuivisData.plans.forEach(plan => {
        const uploadDate = new Date(plan.uploadDate).toLocaleDateString('fr-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const markersCount = plan.markers ? plan.markers.length : 0;

        html += `
            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;"
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                 onmouseout="this.style.transform=''; this.style.boxShadow='';">

                <!-- Image preview -->
                <div style="height: 150px; overflow: hidden; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
                    ${plan.imageData ?
                        `<img src="${plan.imageData}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                        `<span style="color: #999;">📄 ${plan.name}</span>`
                    }
                </div>

                <!-- Info -->
                <div style="padding: 15px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 5px; font-size: 0.95em;">
                        ${plan.name}
                    </div>
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 10px;">
                        ${uploadDate} • ${markersCount} marqueur${markersCount > 1 ? 's' : ''}
                    </div>

                    <!-- Boutons d'action -->
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button onclick="window.planActions.editPlan('${plan.id}')"
                                style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em; white-space: nowrap;">
                            ✏️ Éditer
                        </button>
                        <button onclick="window.planActions.viewPlan('${plan.id}')"
                                style="flex: 1; padding: 8px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em; white-space: nowrap;">
                            👁️ Voir
                        </button>
                        <button onclick="window.planActions.deletePlan('${plan.id}')"
                                style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    console.log(`[PLAN-SUIVIS] ${planSuivisData.plans.length} plans affichés`);
}

/**
 * Édite un plan
 * @param {string} planId - ID du plan
 * @returns {void}
 */
export function editPlan(planId) {
    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        alert('❌ Plan non trouvé');
        return;
    }

    // Afficher le mode édition
    switchToModeEdition();

    // Charger le plan dans le canvas d'édition
    const image = document.getElementById('planEditionImage');
    if (image) {
        image.dataset.planId = planId;

        // Attendre que l'image soit complètement chargée
        image.onload = async () => {
            console.log('[PLAN-SUIVIS] Image chargée, dimensions:', image.clientWidth, 'x', image.clientHeight);

            // Ajuster la hauteur du conteneur des marqueurs pour qu'il corresponde à l'image
            const markersContainer = document.getElementById('planMarkersContainer');
            if (markersContainer) {
                markersContainer.style.width = image.clientWidth + 'px';
                markersContainer.style.height = image.clientHeight + 'px';
                console.log('[PLAN-SUIVIS] Conteneur des marqueurs ajusté');
            }

            // Initialiser le système de placement maintenant que l'image est chargée
            initMarkerPlacement();

            // Charger les marqueurs existants depuis le serveur
            await loadExistingMarkers(planId);
        };

        image.src = plan.imageData;
    }

    console.log(`[PLAN-SUIVIS] Mode édition activé pour le plan ${planId}`);
}

/**
 * Charge les marqueurs existants d'un plan
 * @param {string} planId - ID du plan
 * @returns {void}
 */
async function loadExistingMarkers(planId) {
    console.log('[PLAN-SUIVIS] 📂 Chargement des marqueurs existants pour plan:', planId);

    // Recharger depuis le serveur pour avoir les données les plus récentes
    await loadPlanSuivisDataFromServer();

    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        console.log('[PLAN-SUIVIS] ❌ Plan non trouvé');
        return;
    }

    console.log('[PLAN-SUIVIS] ✅ Plan trouvé:', plan.name);
    console.log('[PLAN-SUIVIS] Données du plan:', {
        markers: plan.markers?.length || 0,
        echafaudages: plan.echafaudages?.length || 0,
        grues: plan.grues?.length || 0
    });

    const markersContainer = document.getElementById('planMarkersContainer');
    if (!markersContainer) {
        console.warn('[PLAN-SUIVIS] ❌ Container de marqueurs non trouvé');
        return;
    }

    console.log('[PLAN-SUIVIS] Dimensions du conteneur:', {
        width: markersContainer.style.width,
        height: markersContainer.style.height
    });

    // Effacer les éléments existants du DOM
    markersContainer.innerHTML = '';

    let totalLoaded = 0;

    // Charger les marqueurs (postes techniques)
    if (plan.markers && plan.markers.length > 0) {
        plan.markers.forEach(markerData => {
            placeMarker(markerData.posteTechnique, markerData.x, markerData.y, false);
            totalLoaded++;
        });
        console.log(`[PLAN-SUIVIS] ✅ ${plan.markers.length} marqueurs chargés`);
    }

    // Charger les échafaudages
    if (plan.echafaudages && plan.echafaudages.length > 0) {
        console.log('[PLAN-SUIVIS] 🏗️ Chargement de', plan.echafaudages.length, 'échafaudages...');
        plan.echafaudages.forEach((echData, index) => {
            console.log(`[PLAN-SUIVIS]   Échafaudage ${index + 1}:`, echData);
            loadEchafaudageToDOM(echData);
            totalLoaded++;
        });
        console.log(`[PLAN-SUIVIS] ✅ ${plan.echafaudages.length} échafaudages chargés`);
    } else {
        console.log('[PLAN-SUIVIS] ℹ️ Aucun échafaudage à charger');
    }

    // Charger les grues
    if (plan.grues && plan.grues.length > 0) {
        plan.grues.forEach(grueData => {
            loadGrueToDOM(grueData);
            totalLoaded++;
        });
        console.log(`[PLAN-SUIVIS] ✅ ${plan.grues.length} grues chargées`);
    }

    console.log(`[PLAN-SUIVIS] ✅ Total: ${totalLoaded} éléments chargés`);
}

/**
 * Charge un échafaudage existant dans le DOM
 */
function loadEchafaudageToDOM(echData) {
    const markersContainer = document.getElementById('planMarkersContainer');
    if (!markersContainer) return;

    const zone = document.createElement('div');
    zone.className = 'echafaudage-zone';
    zone.dataset.id = echData.id;
    zone.style.cssText = `
        position: absolute;
        left: ${echData.x}%;
        top: ${echData.y}%;
        width: ${echData.width}%;
        height: ${echData.height}%;
        border: 3px solid #ffc107;
        background: rgba(255, 193, 7, 0.15);
        cursor: pointer;
        pointer-events: auto;
        z-index: 5;
    `;

    const label = document.createElement('div');
    label.className = 'echafaudage-label';
    label.style.cssText = `
        position: absolute;
        top: 5px;
        left: 5px;
        background: #ffc107;
        color: #000;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
    `;

    // Afficher les informations MECEXT02 si disponibles
    if (echData.mecext02) {
        const mecInfo = echData.mecext02;
        label.textContent = `${mecInfo.posteTech} - ${mecInfo.ordre}`;
        // Ajouter un tooltip avec toutes les informations
        zone.title = `ÉCHAFAUDAGE MECEXT02\n\nPoste technique: ${mecInfo.posteTech}\nOrdre: ${mecInfo.ordre}\nDésignation: ${mecInfo.designOper}\nOpération: ${mecInfo.operation}`;
    } else {
        label.textContent = 'ÉCHAFAUDAGE';
    }

    zone.appendChild(label);

    // Afficher le label au survol
    zone.addEventListener('mouseenter', () => {
        label.style.opacity = '1';
    });
    zone.addEventListener('mouseleave', () => {
        label.style.opacity = '0';
    });

    zone.addEventListener('click', (e) => {
        e.stopPropagation();
        selectEchafaudage(zone);
    });

    markersContainer.appendChild(zone);
}

/**
 * Charge une grue existante dans le DOM
 */
function loadGrueToDOM(grueData) {
    const markersContainer = document.getElementById('planMarkersContainer');
    if (!markersContainer) return;

    const grue = document.createElement('div');
    grue.className = 'grue-marker';
    grue.dataset.id = grueData.id;
    grue.dataset.name = grueData.name;
    grue.style.cssText = `
        position: absolute;
        left: ${grueData.x}%;
        top: ${grueData.y}%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        cursor: pointer;
        pointer-events: auto;
        z-index: 20;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    grue.textContent = '🚛';
    grue.title = grueData.name;

    const nameLabel = document.createElement('div');
    nameLabel.style.cssText = `
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #17a2b8;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
        margin-top: 5px;
    `;
    nameLabel.textContent = grueData.name;
    grue.appendChild(nameLabel);

    grue.addEventListener('click', (e) => {
        e.stopPropagation();
        selectGrue(grue);
    });

    markersContainer.appendChild(grue);
}

/**
 * Affiche un plan en mode lecture
 * @param {string} planId - ID du plan
 * @returns {void}
 */
export function viewPlan(planId) {
    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        alert('❌ Plan non trouvé');
        return;
    }

    // Afficher le mode lecture
    switchToModeLecture();

    // Charger le plan dans le canvas de lecture
    const image = document.getElementById('planLectureImage');
    if (image) {
        image.src = plan.imageData;
        image.dataset.planId = planId;
    }

    // Charger les marqueurs et initialiser la timeline
    setTimeout(() => {
        loadLectureMarkers(planId);
        initTimelineSystem();

        // Appliquer immédiatement le filtrage selon la date actuelle
        const dateInput = document.getElementById('currentDateInput');
        const timeInput = document.getElementById('currentTimeInput');
        if (dateInput && dateInput.value) {
            const timeValue = timeInput && timeInput.value ? timeInput.value : '08:00';
            const currentDate = new Date(dateInput.value + 'T' + timeValue + ':00');
            console.log('[PLAN-SUIVIS] Application du filtrage initial à:', currentDate.toLocaleString('fr-CA'));
            updateMarkersForTimeline(currentDate);
        } else {
            // Si pas de date sélectionnée, utiliser aujourd'hui à 8h
            const today = new Date();
            today.setHours(8, 0, 0, 0);
            console.log('[PLAN-SUIVIS] Application du filtrage par défaut (aujourd\'hui 8h):', today.toLocaleString('fr-CA'));
            updateMarkersForTimeline(today);
        }
    }, 100);

    console.log(`[PLAN-SUIVIS] Mode lecture activé pour le plan ${planId}`);
}

/**
 * Charge les marqueurs en mode lecture
 * @param {string} planId - ID du plan
 * @returns {void}
 */
function loadLectureMarkers(planId) {
    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        console.log('[PLAN-SUIVIS] Plan non trouvé');
        return;
    }

    const markersContainer = document.getElementById('planLectureMarkersContainer');
    if (!markersContainer) {
        console.warn('[PLAN-SUIVIS] Container de marqueurs lecture non trouvé');
        return;
    }

    // Effacer les marqueurs existants
    markersContainer.innerHTML = '';

    let loadedCount = 0;

    // Charger les marqueurs de postes techniques
    if (plan.markers && plan.markers.length > 0) {
        plan.markers.forEach(markerData => {
            createLectureMarker(markerData.posteTechnique, markerData.x, markerData.y);
            loadedCount++;
        });
        console.log(`[PLAN-SUIVIS] ${plan.markers.length} marqueurs de postes chargés`);
    }

    // Charger les zones d'échafaudage
    if (plan.echafaudages && plan.echafaudages.length > 0) {
        plan.echafaudages.forEach(echafData => {
            createLectureEchafaudage(echafData);
            loadedCount++;
        });
        console.log(`[PLAN-SUIVIS] ${plan.echafaudages.length} zones d'échafaudage chargées`);
    }

    // Charger les grues
    if (plan.grues && plan.grues.length > 0) {
        plan.grues.forEach(grueData => {
            createLectureGrue(grueData);
            loadedCount++;
        });
        console.log(`[PLAN-SUIVIS] ${plan.grues.length} grues chargées`);
    }

    console.log(`[PLAN-SUIVIS] Total: ${loadedCount} éléments chargés en mode lecture`);
}

/**
 * Crée un marqueur en mode lecture (simple point)
 * @param {string} posteTechnique - Nom du poste technique
 * @param {number} xPercent - Position X en pourcentage
 * @param {number} yPercent - Position Y en pourcentage
 * @returns {HTMLElement} Le marqueur créé
 */
function createLectureMarker(posteTechnique, xPercent, yPercent) {
    const markersContainer = document.getElementById('planLectureMarkersContainer');
    if (!markersContainer) return null;

    // Créer un simple point circulaire (pas de texte)
    const marker = document.createElement('div');
    marker.className = 'plan-lecture-marker';
    marker.dataset.poste = posteTechnique;
    marker.style.cssText = `
        position: absolute;
        left: ${xPercent}%;
        top: ${yPercent}%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: #999;
        border-radius: 50%;
        cursor: help;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        z-index: 10;
        opacity: 0.7;
        transition: all 0.3s ease;
        pointer-events: auto;
    `;

    // Effet de survol
    marker.addEventListener('mouseenter', () => {
        marker.style.transform = 'translate(-50%, -50%) scale(1.3)';
        marker.style.opacity = '1';
        marker.style.zIndex = '100';
    });

    marker.addEventListener('mouseleave', () => {
        marker.style.transform = 'translate(-50%, -50%) scale(1)';
        const currentOpacity = marker.dataset.baseOpacity || '0.7';
        marker.style.opacity = currentOpacity;
        marker.style.zIndex = '10';
    });

    markersContainer.appendChild(marker);
    return marker;
}

/**
 * Crée une zone d'échafaudage en mode lecture
 * @param {object} echafData - Données de l'échafaudage
 * @returns {HTMLElement} La zone créée
 */
function createLectureEchafaudage(echafData) {
    const markersContainer = document.getElementById('planLectureMarkersContainer');
    if (!markersContainer) return null;

    // Créer la zone rectangulaire
    const zone = document.createElement('div');
    zone.className = 'plan-lecture-echafaudage';
    zone.dataset.echafId = echafData.id;

    // Stocker les infos MECEXT02 si présentes
    if (echafData.mecext02) {
        zone.dataset.mecext02 = echafData.mecext02.ordre || '';
        zone.dataset.dateDebut = echafData.mecext02.date_debut || '';
        zone.dataset.dateFin = echafData.mecext02.date_fin || '';
        zone.dataset.heureDebut = echafData.mecext02.heure_debut || '00:00:00';
        zone.dataset.heureFin = echafData.mecext02.heure_fin || '23:59:59';
        zone.dataset.typeOperation = echafData.mecext02.type_operation || 'standard';
    }

    zone.style.cssText = `
        position: absolute;
        left: ${echafData.x}%;
        top: ${echafData.y}%;
        width: ${echafData.width}%;
        height: ${echafData.height}%;
        background: rgba(255, 193, 7, 0.3);
        border: 2px solid #ffc107;
        border-radius: 4px;
        cursor: help;
        z-index: 5;
        opacity: 0.7;
        transition: all 0.3s ease;
        pointer-events: auto;
    `;

    // Créer le label (invisible par défaut)
    const label = document.createElement('div');
    label.className = 'echafaudage-label';
    label.style.cssText = `
        position: absolute;
        top: 5px;
        left: 5px;
        background: #ffc107;
        color: #000;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        white-space: nowrap;
    `;

    if (echafData.mecext02) {
        label.textContent = `📦 ${echafData.mecext02.ordre || 'Échafaudage'}`;
    } else {
        label.textContent = '📦 Échafaudage';
    }

    zone.appendChild(label);

    // Afficher le label au survol
    zone.addEventListener('mouseenter', () => {
        zone.style.opacity = '1';
        zone.style.zIndex = '100';
        label.style.opacity = '1';
    });

    zone.addEventListener('mouseleave', () => {
        const baseOpacity = zone.dataset.baseOpacity || '0.7';
        zone.style.opacity = baseOpacity;
        zone.style.zIndex = '5';
        label.style.opacity = '0';
    });

    markersContainer.appendChild(zone);
    return zone;
}

/**
 * Crée un marqueur de grue en mode lecture
 * @param {object} grueData - Données de la grue
 * @returns {HTMLElement} Le marqueur créé
 */
function createLectureGrue(grueData) {
    const markersContainer = document.getElementById('planLectureMarkersContainer');
    if (!markersContainer) return null;

    // Créer un marqueur de grue (icône)
    const marker = document.createElement('div');
    marker.className = 'plan-lecture-grue';
    marker.dataset.grueId = grueData.id;
    marker.dataset.grueName = grueData.name || 'Grue';

    // Stocker les infos MECEXT02 si présentes
    if (grueData.mecext02) {
        marker.dataset.mecext02 = grueData.mecext02.ordre || '';
        marker.dataset.dateDebut = grueData.mecext02.date_debut || '';
        marker.dataset.dateFin = grueData.mecext02.date_fin || '';
        marker.dataset.heureDebut = grueData.mecext02.heure_debut || '00:00:00';
        marker.dataset.heureFin = grueData.mecext02.heure_fin || '23:59:59';
    }

    marker.style.cssText = `
        position: absolute;
        left: ${grueData.x}%;
        top: ${grueData.y}%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: #ff9800;
        border-radius: 50%;
        cursor: help;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        z-index: 10;
        opacity: 0.7;
        transition: all 0.3s ease;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    `;

    marker.textContent = '🚛';

    // Créer le label (invisible par défaut)
    const label = document.createElement('div');
    label.className = 'grue-label';
    label.style.cssText = `
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff9800;
        color: #000;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        white-space: nowrap;
    `;

    label.textContent = grueData.name || 'Grue';

    marker.appendChild(label);

    // Effet de survol
    marker.addEventListener('mouseenter', () => {
        marker.style.transform = 'translate(-50%, -50%) scale(1.3)';
        marker.style.opacity = '1';
        marker.style.zIndex = '100';
        label.style.opacity = '1';
    });

    marker.addEventListener('mouseleave', () => {
        marker.style.transform = 'translate(-50%, -50%) scale(1)';
        const baseOpacity = marker.dataset.baseOpacity || '0.7';
        marker.style.opacity = baseOpacity;
        marker.style.zIndex = '10';
        label.style.opacity = '0';
    });

    markersContainer.appendChild(marker);
    return marker;
}

/**
 * Variable pour stocker l'état du mode heatmap
 */
let heatmapMode = false;

/**
 * Bascule entre le mode normal et le mode carte thermique
 * @returns {void}
 */
export function toggleHeatmapMode() {
    heatmapMode = !heatmapMode;
    console.log('[PLAN-SUIVIS] Mode heatmap:', heatmapMode ? 'ACTIVÉ' : 'DÉSACTIVÉ');

    if (heatmapMode) {
        generateHeatmap();
    } else {
        removeHeatmap();
    }

    // Mettre à jour les marqueurs
    updateMarkersForTimeline();
}

/**
 * Génère la carte thermique
 * @returns {void}
 */
function generateHeatmap() {
    const markersContainer = document.getElementById('planLectureMarkersContainer');
    if (!markersContainer) return;

    // Supprimer l'ancien heatmap s'il existe
    removeHeatmap();

    // Créer un canvas pour le heatmap
    const heatmapCanvas = document.createElement('div');
    heatmapCanvas.id = 'heatmapOverlay';
    heatmapCanvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
    `;

    // Obtenir la date courante
    const dateInput = document.getElementById('currentDateInput');
    let currentTime = new Date();
    if (dateInput && dateInput.value) {
        currentTime = new Date(dateInput.value + 'T08:00:00');
    } else {
        currentTime.setHours(8, 0, 0, 0);
    }

    // Pour chaque marqueur, créer un gradient radial
    const markers = document.querySelectorAll('.plan-lecture-marker');
    markers.forEach(marker => {
        const posteTechnique = marker.dataset.poste;
        const analysis = analyzeWorkOrdersForPoste(posteTechnique, currentTime);

        if (analysis.total > 0) {
            const rect = marker.getBoundingClientRect();
            const containerRect = markersContainer.getBoundingClientRect();

            const x = ((rect.left - containerRect.left) / containerRect.width) * 100;
            const y = ((rect.top - containerRect.top) / containerRect.height) * 100;

            // Intensité basée sur le nombre d'opérations
            const intensity = Math.min(analysis.total / 10, 1); // Max à 10 opérations
            const radius = 50 + (intensity * 100); // Rayon de 50px à 150px

            // Couleur basée sur l'intensité (bleu → vert → jaune → rouge)
            let color;
            if (intensity < 0.25) {
                color = `rgba(0, 123, 255, ${intensity * 2})`; // Bleu
            } else if (intensity < 0.5) {
                color = `rgba(40, 167, 69, ${intensity * 1.5})`; // Vert
            } else if (intensity < 0.75) {
                color = `rgba(255, 193, 7, ${intensity * 1.2})`; // Jaune
            } else {
                color = `rgba(220, 53, 69, ${intensity})`; // Rouge
            }

            const heatPoint = document.createElement('div');
            heatPoint.className = 'heat-point';
            heatPoint.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                transform: translate(-50%, -50%);
                width: ${radius}px;
                height: ${radius}px;
                background: radial-gradient(circle, ${color} 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
            `;

            heatmapCanvas.appendChild(heatPoint);
        }
    });

    markersContainer.appendChild(heatmapCanvas);
}

/**
 * Supprime la carte thermique
 * @returns {void}
 */
function removeHeatmap() {
    const heatmapOverlay = document.getElementById('heatmapOverlay');
    if (heatmapOverlay) {
        heatmapOverlay.remove();
    }
}

/**
 * Initialise le système de timeline
 * @returns {void}
 */
function initTimelineSystem() {
    // Mettre à jour l'affichage initial
    updateMarkersForTimeline();

    console.log('[PLAN-SUIVIS] Système de timeline initialisé');
}

/**
 * Parse les tâches d'un fichier MS Project
 * @param {Object} fileData - Données du fichier MS Project
 * @returns {Array} Liste des tâches parsées
 */
function parseMSProjectTasks(fileData) {
    if (!fileData || !fileData.data) {
        console.warn('[PLAN-SUIVIS] Pas de données MS Project à parser');
        return [];
    }

    try {
        // Vérifier si c'est un fichier XML
        const isXML = fileData.name.toLowerCase().endsWith('.xml') ||
                      fileData.name.toLowerCase().endsWith('.mspdi');

        if (!isXML) {
            console.warn('[PLAN-SUIVIS] Fichier MS Project non-XML, parsing non supporté');
            return [];
        }

        // Décoder le base64 pour obtenir le XML
        let xmlContent = '';
        if (fileData.data.startsWith('data:')) {
            const base64Data = fileData.data.split(',')[1];
            xmlContent = atob(base64Data);
        } else {
            xmlContent = fileData.data;
        }

        // Parser le XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Vérifier les erreurs de parsing
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            throw new Error('Erreur de parsing XML');
        }

        // Extraire les tâches
        const tasks = xmlDoc.getElementsByTagName('Task');
        const parsedTasks = [];

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const id = task.getElementsByTagName('ID')[0]?.textContent;
            const name = task.getElementsByTagName('Name')[0]?.textContent;
            const start = task.getElementsByTagName('Start')[0]?.textContent;
            const finish = task.getElementsByTagName('Finish')[0]?.textContent;
            const notes = task.getElementsByTagName('Notes')[0]?.textContent;

            if (id && name && start && finish) {
                parsedTasks.push({
                    id,
                    name,
                    start: new Date(start),
                    finish: new Date(finish),
                    notes: notes || '',
                    // Essayer d'extraire le poste technique depuis le nom ou les notes
                    posteTechnique: extractPosteTechniqueFromTask(name, notes)
                });
            }
        }

        console.log(`[PLAN-SUIVIS] ${parsedTasks.length} tâches parsées depuis MS Project`);
        return parsedTasks;

    } catch (error) {
        console.error('[PLAN-SUIVIS] Erreur parsing MS Project:', error);
        return [];
    }
}

/**
 * Extrait le poste technique depuis le nom ou les notes d'une tâche MS Project
 * @param {string} taskName - Nom de la tâche
 * @param {string} notes - Notes de la tâche
 * @returns {string|null} Poste technique ou null
 */
function extractPosteTechniqueFromTask(taskName, notes) {
    // Chercher un pattern de poste technique (ex: AC-101, CC-201, etc.)
    const pattern = /([A-Z]{2,3}-\d{2,4})/;

    // Chercher d'abord dans le nom
    const matchName = taskName.match(pattern);
    if (matchName) {
        return matchName[1];
    }

    // Puis dans les notes
    if (notes) {
        const matchNotes = notes.match(pattern);
        if (matchNotes) {
            return matchNotes[1];
        }
    }

    return null;
}

/**
 * Obtient les tâches MS Project actives pour un poste technique à une date
 * @param {string} posteTechnique - Poste technique
 * @param {Date} date - Date à vérifier
 * @returns {Array} Tâches MS Project actives
 */
function getMSProjectTasksForPoste(posteTechnique, date) {
    // Récupérer les fichiers MS Project chargés
    if (!planSuivisData.msProjectFiles || planSuivisData.msProjectFiles.length === 0) {
        return [];
    }

    const allTasks = [];

    // Parser chaque fichier MS Project
    planSuivisData.msProjectFiles.forEach(file => {
        const tasks = parseMSProjectTasks(file);

        // Filtrer les tâches pour ce poste technique et cette date
        const activeTasks = tasks.filter(task => {
            // Vérifier si le poste technique correspond
            if (task.posteTechnique !== posteTechnique) {
                return false;
            }

            // Vérifier si la tâche est active à cette date
            return date >= task.start && date <= task.finish;
        });

        allTasks.push(...activeTasks);
    });

    return allTasks;
}

/**
 * Classifie un poste de travail opérateur selon son type
 * @param {string} posteTravOper - Valeur du champ "Post.trav.opér."
 * @returns {string} Type: 'externe', 'mecanique_interne', 'electrique_interne', 'autre'
 */
function classifyPosteTravail(posteTravOper) {
    if (!posteTravOper || posteTravOper.trim() === '') {
        return 'autre';
    }

    const poste = posteTravOper.trim().toUpperCase();

    // Liste des postes externes (BLEU)
    const externesExacts = ['A91CS', 'AEROVAC', 'E91CE', 'E91CS', 'ELEEXT02', 'EPHYD', 'ORTEC'];
    if (externesExacts.includes(poste)) {
        return 'externe';
    }

    // MECEXT* (tous les codes commençant par MECEXT)
    if (poste.startsWith('MECEXT')) {
        return 'externe';
    }

    // Mécaniques internes (VERT)
    const mecaniquesInternes = ['A01MU', 'A03MU', 'A06MU'];
    if (mecaniquesInternes.includes(poste)) {
        return 'mecanique_interne';
    }

    // Électriques internes (ROSE)
    const electriquesInternes = ['A02EI', 'A04EI'];
    if (electriquesInternes.includes(poste)) {
        return 'electrique_interne';
    }

    return 'autre';
}

/**
 * Analyse les ordres de travail IW37N pour un poste technique à une date donnée
 * @param {string} posteTechnique - Poste technique
 * @param {Date} date - Date à analyser
 * @returns {Object} Analyse des travaux {externe, mecanique_interne, electrique_interne, autre, total, operations, msTasks}
 */
function analyzeWorkOrdersForPoste(posteTechnique, date) {
    let externe = 0;
    let mecanique_interne = 0;
    let electrique_interne = 0;
    let autre = 0;
    let operations = [];

    // 1. Analyser les données IW37N
    if (window.getActiveWorkForPoste && typeof window.getActiveWorkForPoste === 'function') {
        const activeWork = window.getActiveWorkForPoste(posteTechnique, date);

        if (activeWork && activeWork.length > 0) {
            operations = activeWork;

            // Classifier selon le champ 'Post.trav.opér.'
            activeWork.forEach(work => {
                const posteTravOper = work['Post.trav.opér.'];
                const type = classifyPosteTravail(posteTravOper);

                switch (type) {
                    case 'externe':
                        externe++;
                        break;
                    case 'mecanique_interne':
                        mecanique_interne++;
                        break;
                    case 'electrique_interne':
                        electrique_interne++;
                        break;
                    default:
                        autre++;
                        break;
                }
            });
        }
    }

    // 2. Analyser les tâches MS Project
    const msTasks = getMSProjectTasksForPoste(posteTechnique, date);

    // Ajouter les tâches MS Project au total
    // Pour l'instant, on considère les tâches MS Project comme "autre" par défaut
    if (msTasks.length > 0) {
        autre += msTasks.length;
    }

    return {
        externe,
        mecanique_interne,
        electrique_interne,
        autre,
        total: externe + mecanique_interne + electrique_interne + autre,
        operations,
        msTasks
    };
}

/**
 * Calcule les propriétés visuelles d'un marqueur selon les ordres de travail
 * @param {Object} analysis - Résultat de analyzeWorkOrdersForPoste
 * @returns {Object} {color: string, size: number, opacity: number}
 */
function calculateMarkerVisualization(analysis) {
    const { externe, mecanique_interne, electrique_interne, autre, total } = analysis;

    // Aucun travail
    if (total === 0) {
        return {
            color: '#999',
            size: 10,
            opacity: 0.3,
            pointSize: 8
        };
    }

    // Déterminer la couleur selon le type de travaux
    let color;

    // Compter combien de types différents sont présents
    const typesPresents = [
        externe > 0,
        mecanique_interne > 0,
        electrique_interne > 0,
        autre > 0
    ].filter(x => x).length;

    if (typesPresents > 1) {
        // Plusieurs types → Violet (mixte)
        color = '#6f42c1';
    } else if (externe > 0) {
        // Tout externe → Bleu
        color = '#007bff';
    } else if (mecanique_interne > 0) {
        // Tout mécanique interne → Vert
        color = '#28a745';
    } else if (electrique_interne > 0) {
        // Tout électrique interne → Rose
        color = '#e83e8c';
    } else {
        // Autre → Gris
        color = '#999';
    }

    // Déterminer la taille selon le nombre d'opérations
    let size, pointSize;
    if (total === 1) {
        size = 10;
        pointSize = 8;
    } else if (total <= 3) {
        size = 14;
        pointSize = 10;
    } else if (total <= 5) {
        size = 18;
        pointSize = 12;
    } else {
        size = 22;
        pointSize = 14;
    }

    return {
        color,
        size,
        opacity: 1,
        pointSize
    };
}

/**
 * Met à jour l'affichage des marqueurs selon la timeline
 * @param {Date} currentTime - Date/heure courante (optionnel, utilise la timeline actuelle si non fourni)
 * @returns {void}
 */
export function updateMarkersForTimeline(currentTime) {
    // Si pas de date fournie, essayer de récupérer depuis l'input de date
    if (!currentTime) {
        const dateInput = document.getElementById('currentDateInput');
        if (dateInput && dateInput.value) {
            currentTime = new Date(dateInput.value + 'T08:00:00');
        } else {
            // Par défaut, utiliser aujourd'hui à 8h
            currentTime = new Date();
            currentTime.setHours(8, 0, 0, 0);
        }
    }

    const markers = document.querySelectorAll('.plan-lecture-marker');

    markers.forEach(marker => {
        const posteTechnique = marker.dataset.poste;

        // Analyser les ordres de travail pour ce poste
        const analysis = analyzeWorkOrdersForPoste(posteTechnique, currentTime);

        // Calculer les propriétés visuelles
        const visual = calculateMarkerVisualization(analysis);

        // Appliquer le style au marqueur (simple point)
        marker.style.background = visual.color;
        marker.style.width = visual.pointSize + 'px';
        marker.style.height = visual.pointSize + 'px';

        // Opacité adaptative : plus transparent si inactif
        const baseOpacity = analysis.total > 0 ? 0.85 : 0.3;
        marker.style.opacity = baseOpacity;
        marker.dataset.baseOpacity = baseOpacity;

        // Créer l'info-bulle détaillée
        if (analysis.total > 0) {
            // Construire le texte du type de travaux
            const typeParts = [];
            if (analysis.externe > 0) typeParts.push(`${analysis.externe} externe(s)`);
            if (analysis.mecanique_interne > 0) typeParts.push(`${analysis.mecanique_interne} mécanique(s) interne(s)`);
            if (analysis.electrique_interne > 0) typeParts.push(`${analysis.electrique_interne} électrique(s) interne(s)`);
            if (analysis.autre > 0) typeParts.push(`${analysis.autre} autre(s)`);

            const typeText = typeParts.join(' + ');

            let tooltipParts = [`${posteTechnique}`, `${analysis.total} travaux (${typeText})`];

            // Ajouter les opérations IW37N
            if (analysis.operations && analysis.operations.length > 0) {
                tooltipParts.push('\n📋 IW37N:');
                const iw37nSummary = analysis.operations
                    .map(w => `  • ${w['Ordre']}: ${w['Désign. opér.']} [${w['Post.trav.opér.'] || 'N/A'}]`)
                    .join('\n');
                tooltipParts.push(iw37nSummary);
            }

            // Ajouter les tâches MS Project
            if (analysis.msTasks && analysis.msTasks.length > 0) {
                tooltipParts.push('\n📊 MS Project:');
                const msSummary = analysis.msTasks
                    .map(t => `  • ${t.name}`)
                    .join('\n');
                tooltipParts.push(msSummary);
            }

            marker.title = tooltipParts.join('\n');
        } else {
            marker.title = `${posteTechnique}\nAucun travail actif`;
        }
    });

    // Mettre à jour les zones d'échafaudage MECEXT02
    updateMECEXT02Zones(currentTime);

    // Mettre à jour la visibilité des échafaudages et grues manuels selon la date
    updateEchafaudagesForTimeline(currentTime);
    updateGruesForTimeline(currentTime);

    console.log(`[PLAN-SUIVIS] Marqueurs mis à jour pour ${currentTime.toLocaleString('fr-CA')}`);
}

/**
 * Met à jour l'affichage des zones d'échafaudage MECEXT02 selon la timeline
 * @param {Date} currentTime - Date/heure courante
 * @returns {void}
 */
function updateMECEXT02Zones(currentTime) {
    // Supprimer les anciennes zones MECEXT02 temporaires
    document.querySelectorAll('.mecext02-zone').forEach(z => z.remove());

    // Obtenir toutes les opérations MECEXT02 actives
    if (!window.getActiveWorkForPoste || typeof window.getActiveWorkForPoste !== 'function') {
        return;
    }

    // Récupérer tous les marqueurs de postes techniques
    const markers = document.querySelectorAll('.plan-lecture-marker');

    markers.forEach(marker => {
        const posteTechnique = marker.dataset.poste;
        const activeWork = window.getActiveWorkForPoste(posteTechnique, currentTime);

        if (!activeWork || activeWork.length === 0) return;

        // Filtrer les opérations MECEXT02
        const mecext02Operations = activeWork.filter(work => {
            const posteTravOper = work['Post.trav.opér.'];
            return posteTravOper && posteTravOper.trim().toUpperCase() === 'MECEXT02';
        });

        if (mecext02Operations.length > 0) {
            // Créer une zone d'échafaudage autour de ce poste
            createMECEXT02Zone(marker, mecext02Operations);
        }
    });
}

/**
 * Crée une zone d'échafaudage MECEXT02 autour d'un marqueur
 * @param {HTMLElement} marker - Le marqueur du poste technique
 * @param {Array} operations - Les opérations MECEXT02 pour ce poste
 * @returns {void}
 */
function createMECEXT02Zone(marker, operations) {
    const markersContainer = marker.parentElement;
    if (!markersContainer) return;

    // Obtenir la position du marqueur
    const markerRect = marker.getBoundingClientRect();
    const containerRect = markersContainer.getBoundingClientRect();

    // Calculer la position relative (en pourcentage)
    const markerLeft = parseFloat(marker.style.left) || 0;
    const markerTop = parseFloat(marker.style.top) || 0;

    // Créer une zone autour du marqueur (zone de 10% x 8%)
    const zoneWidth = 10;
    const zoneHeight = 8;
    const zoneLeft = markerLeft - (zoneWidth / 2);
    const zoneTop = markerTop - (zoneHeight / 2);

    // Créer la zone visuelle
    const zone = document.createElement('div');
    zone.className = 'mecext02-zone';
    zone.style.cssText = `
        position: absolute;
        left: ${zoneLeft}%;
        top: ${zoneTop}%;
        width: ${zoneWidth}%;
        height: ${zoneHeight}%;
        border: 3px dashed #ffc107;
        background: rgba(255, 193, 7, 0.25);
        pointer-events: none;
        z-index: 3;
        animation: pulse-echafaudage 2s ease-in-out infinite;
    `;

    // Ajouter un label
    const label = document.createElement('div');
    label.style.cssText = `
        position: absolute;
        top: 2px;
        left: 2px;
        background: #ffc107;
        color: #000;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 9px;
        font-weight: bold;
        white-space: nowrap;
    `;
    label.textContent = `${operations.length} ÉCHAFAUDAGE${operations.length > 1 ? 'S' : ''}`;
    zone.appendChild(label);

    // Ajouter le tooltip avec les détails
    const operationsDetails = operations
        .map(op => `  • ${op['Ordre']}: ${op['Désign. opér.']}`)
        .join('\n');
    zone.title = `Échafaudages MECEXT02:\n${operationsDetails}`;

    markersContainer.appendChild(zone);

    // Ajouter l'animation CSS si elle n'existe pas déjà
    if (!document.getElementById('echafaudage-animations')) {
        const style = document.createElement('style');
        style.id = 'echafaudage-animations';
        style.textContent = `
            @keyframes pulse-echafaudage {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Met à jour la visibilité des échafaudages manuels selon la timeline
 * Affiche uniquement les échafaudages dont date_debut <= date actuelle <= date_fin
 * @param {Date} currentTime - Date/heure courante
 * @returns {void}
 */
function updateEchafaudagesForTimeline(currentTime) {
    const echafaudages = document.querySelectorAll('.plan-lecture-echafaudage');

    console.log(`[ECHAF-FILTER] ====== Filtrage de ${echafaudages.length} zones ======`);
    console.log(`[ECHAF-FILTER] Date/heure actuelle timeline:`, currentTime.toLocaleString('fr-CA'));

    echafaudages.forEach(echaf => {
        const dateDebut = echaf.dataset.dateDebut;
        const dateFin = echaf.dataset.dateFin;
        const heureDebut = echaf.dataset.heureDebut || '00:00:00';
        const heureFin = echaf.dataset.heureFin || '23:59:59';
        const typeOperation = echaf.dataset.typeOperation || 'standard';
        const mecext02 = echaf.dataset.mecext02;

        console.log(`[ECHAF-FILTER] --- Zone ${mecext02} ---`);
        console.log(`[ECHAF-FILTER] Type opération:`, typeOperation);
        console.log(`[ECHAF-FILTER] Date début:`, dateDebut, heureDebut);
        console.log(`[ECHAF-FILTER] Date fin:`, dateFin, heureFin);

        // Si pas de date associée, toujours afficher
        if (!dateDebut) {
            console.log(`[ECHAF-FILTER] ✅ Pas de date → affichage permanent`);
            echaf.style.opacity = '0.7';
            echaf.dataset.baseOpacity = '0.7';
            echaf.style.display = 'block';
            return;
        }

        // Convertir les dates + heures en objets Date complets
        const dateDebutObj = new Date(`${dateDebut}T${heureDebut}`);
        const dateFinObj = dateFin ? new Date(`${dateFin}T${heureFin}`) : null;

        console.log(`[ECHAF-FILTER] Date début parsée:`, dateDebutObj.toLocaleString('fr-CA'));
        if (dateFinObj) {
            console.log(`[ECHAF-FILTER] Date fin parsée:`, dateFinObj.toLocaleString('fr-CA'));
        }

        // Logique spéciale pour montage/démontage
        if (typeOperation === 'montage') {
            // Opération de MONTAGE: afficher à partir de cette date
            console.log(`[ECHAF-FILTER] Type MONTAGE détecté`);
            if (currentTime < dateDebutObj) {
                console.log(`[ECHAF-FILTER] ⏳ Avant montage → transparent (prévu)`);
                // Avant le montage: masqué (prévu)
                echaf.style.opacity = '0.1';
                echaf.dataset.baseOpacity = '0.1';
                echaf.style.display = 'block';
                if (mecext02) {
                    echaf.title = `📦 Échafaudage (prévu - montage)\nOrdre: ${mecext02}\nMontage prévu: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
                }
            } else {
                console.log(`[ECHAF-FILTER] ✅ Après montage → visible (installé)`);
                // Après le montage: visible (installé)
                echaf.style.opacity = '0.7';
                echaf.dataset.baseOpacity = '0.7';
                echaf.style.display = 'block';
                if (mecext02) {
                    echaf.title = `📦 Échafaudage (installé)\nOrdre: ${mecext02}\nMonté le: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
                }
            }
            return;
        } else if (typeOperation === 'demontage') {
            // Opération de DÉMONTAGE: masquer après cette date
            console.log(`[ECHAF-FILTER] Type DÉMONTAGE détecté`);
            if (currentTime < dateDebutObj) {
                console.log(`[ECHAF-FILTER] ✅ Avant démontage → visible (en place)`);
                // Avant le démontage: visible (encore en place)
                echaf.style.opacity = '0.7';
                echaf.dataset.baseOpacity = '0.7';
                echaf.style.display = 'block';
                if (mecext02) {
                    echaf.title = `📦 Échafaudage (en place)\nOrdre: ${mecext02}\nDémontage prévu: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
                }
            } else {
                console.log(`[ECHAF-FILTER] ❌ Après démontage → transparent (retiré)`);
                // Après le démontage: masqué (retiré)
                echaf.style.opacity = '0.1';
                echaf.dataset.baseOpacity = '0.1';
                echaf.style.display = 'block';
                if (mecext02) {
                    echaf.title = `📦 Échafaudage (démonté)\nOrdre: ${mecext02}\nDémonté le: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
                }
            }
            return;
        }

        console.log(`[ECHAF-FILTER] Type STANDARD détecté (avec dates début/fin)`);

        // Logique standard pour les opérations normales (avec date début et fin)

        // Vérifier si on est avant la date de début
        if (currentTime < dateDebutObj) {
            console.log(`[ECHAF-FILTER] ⏳ Avant date début → transparent (prévu)`);
            // Masquer l'échafaudage (la date de début n'est pas encore atteinte)
            echaf.style.opacity = '0.1';
            echaf.dataset.baseOpacity = '0.1';
            echaf.style.display = 'block';

            if (mecext02) {
                echaf.title = `📦 Échafaudage (prévu)\nOrdre: ${mecext02}\nDébut prévu: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
                if (dateFinObj) {
                    echaf.title += `\nFin prévue: ${dateFinObj.toLocaleDateString('fr-CA')} ${heureFin}`;
                }
            }
            return;
        }

        // Vérifier si on est après la date de fin
        if (dateFinObj && currentTime > dateFinObj) {
            console.log(`[ECHAF-FILTER] ❌ Après date fin → transparent (terminé)`);
            // Masquer l'échafaudage (période terminée)
            echaf.style.opacity = '0.1';
            echaf.dataset.baseOpacity = '0.1';
            echaf.style.display = 'block';

            if (mecext02) {
                echaf.title = `📦 Échafaudage (terminé)\nOrdre: ${mecext02}\nDébut: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}\nFin: ${dateFinObj.toLocaleDateString('fr-CA')} ${heureFin}`;
            }
            return;
        }

        console.log(`[ECHAF-FILTER] ✅ Dans la période active → visible (actif)`);
        // On est dans la période active (date_debut <= currentTime <= date_fin)
        echaf.style.opacity = '0.7';
        echaf.dataset.baseOpacity = '0.7';
        echaf.style.display = 'block';

        if (mecext02) {
            echaf.title = `📦 Échafaudage (actif)\nOrdre: ${mecext02}\nDébut: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
            if (dateFinObj) {
                echaf.title += `\nFin: ${dateFinObj.toLocaleDateString('fr-CA')} ${heureFin}`;
            }
        }
    });

    console.log(`[PLAN-SUIVIS] ${echafaudages.length} échafaudages mis à jour pour ${currentTime.toLocaleDateString('fr-CA')}`);
}

/**
 * Met à jour la visibilité des grues manuelles selon la timeline
 * Affiche uniquement les grues dont date_debut <= date actuelle <= date_fin
 * @param {Date} currentTime - Date/heure courante
 * @returns {void}
 */
function updateGruesForTimeline(currentTime) {
    const grues = document.querySelectorAll('.plan-lecture-grue');

    grues.forEach(grue => {
        const dateDebut = grue.dataset.dateDebut;
        const dateFin = grue.dataset.dateFin;
        const heureDebut = grue.dataset.heureDebut || '00:00:00';
        const heureFin = grue.dataset.heureFin || '23:59:59';

        // Si pas de date associée, toujours afficher
        if (!dateDebut) {
            grue.style.opacity = '0.7';
            grue.dataset.baseOpacity = '0.7';
            grue.style.display = 'flex';
            return;
        }

        // Convertir les dates + heures en objets Date complets
        const dateDebutObj = new Date(`${dateDebut}T${heureDebut}`);
        const dateFinObj = dateFin ? new Date(`${dateFin}T${heureFin}`) : null;

        const mecext02 = grue.dataset.mecext02;
        const grueName = grue.dataset.grueName;

        // Vérifier si on est avant la date de début
        if (currentTime < dateDebutObj) {
            // Masquer la grue (la date de début n'est pas encore atteinte)
            grue.style.opacity = '0.1';
            grue.dataset.baseOpacity = '0.1';
            grue.style.display = 'flex';

            if (mecext02) {
                grue.title = `🚛 ${grueName} (prévu)\nOrdre: ${mecext02}\nDébut prévu: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
                if (dateFinObj) {
                    grue.title += `\nFin prévue: ${dateFinObj.toLocaleDateString('fr-CA')} ${heureFin}`;
                }
            }
            return;
        }

        // Vérifier si on est après la date de fin
        if (dateFinObj && currentTime > dateFinObj) {
            // Masquer la grue (période terminée)
            grue.style.opacity = '0.1';
            grue.dataset.baseOpacity = '0.1';
            grue.style.display = 'flex';

            if (mecext02) {
                grue.title = `🚛 ${grueName} (terminé)\nOrdre: ${mecext02}\nDébut: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}\nFin: ${dateFinObj.toLocaleDateString('fr-CA')} ${heureFin}`;
            }
            return;
        }

        // On est dans la période active (date_debut <= currentTime <= date_fin)
        grue.style.opacity = '0.7';
        grue.dataset.baseOpacity = '0.7';
        grue.style.display = 'flex';

        if (mecext02) {
            grue.title = `🚛 ${grueName} (actif)\nOrdre: ${mecext02}\nDébut: ${dateDebutObj.toLocaleDateString('fr-CA')} ${heureDebut}`;
            if (dateFinObj) {
                grue.title += `\nFin: ${dateFinObj.toLocaleDateString('fr-CA')} ${heureFin}`;
            }
        }
    });

    console.log(`[PLAN-SUIVIS] ${grues.length} grues mises à jour pour ${currentTime.toLocaleDateString('fr-CA')}`);
}

/**
 * Supprime un plan
 * @param {string} planId - ID du plan
 * @returns {Promise<void>}
 */
export async function deletePlan(planId) {
    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        alert('❌ Plan non trouvé');
        return;
    }

    if (confirm(`⚠️ Voulez-vous vraiment supprimer le plan "${plan.name}" ?\n\nCette action est irréversible.`)) {
        planSuivisData.plans = planSuivisData.plans.filter(p => p.id !== planId);
        await savePlanSuivisData();
        renderPlansList();
        console.log(`[PLAN-SUIVIS] Plan ${planId} supprimé`);
    }
}

/**
 * Change le mode de placement (postes, échafaudages, grues)
 * @param {string} mode - Le nouveau mode ('postes', 'echafaudages', 'grues')
 * @returns {void}
 * @export
 */
export function changePlacementMode(mode) {
    placementMode = mode;
    console.log(`[PLAN-SUIVIS] Mode de placement changé: ${mode}`);

    // Afficher/masquer les panneaux appropriés
    const posteTechniquePanel = document.getElementById('posteTechniquePanel');
    const echafaudagesPanel = document.getElementById('echafaudagesPanel');
    const gruesPanel = document.getElementById('gruesPanel');

    if (posteTechniquePanel) posteTechniquePanel.style.display = mode === 'postes' ? 'block' : 'none';
    if (echafaudagesPanel) {
        echafaudagesPanel.style.display = mode === 'echafaudages' ? 'block' : 'none';
        // Peupler la liste MECEXT02 quand on entre en mode échafaudages
        if (mode === 'echafaudages') {
            populateMECEXT02List();
        }
    }
    if (gruesPanel) gruesPanel.style.display = mode === 'grues' ? 'block' : 'none';

    // Changer le curseur du plan
    const planImage = document.getElementById('planEditionImage');
    if (planImage) {
        switch (mode) {
            case 'echafaudages':
                planImage.style.cursor = 'crosshair';
                break;
            case 'grues':
                planImage.style.cursor = 'pointer';
                break;
            default:
                planImage.style.cursor = 'crosshair';
        }
    }
}

/**
 * Peuple le menu déroulant avec les opérations MECEXT02 depuis IW37N
 * @returns {void}
 */
function populateMECEXT02List() {
    const select = document.getElementById('mecext02Select');
    if (!select) {
        console.warn('[PLAN-SUIVIS] Element mecext02Select non trouvé');
        return;
    }

    // Sauvegarder la valeur actuellement sélectionnée
    const currentValue = select.value;

    // Obtenir les données IW37N
    if (!window.getIw37nData || typeof window.getIw37nData !== 'function') {
        console.warn('[PLAN-SUIVIS] getIw37nData non disponible');
        select.innerHTML = '<option value="">-- Aucune donnée IW37N disponible --</option>';
        return;
    }

    const iw37nData = window.getIw37nData();
    if (!iw37nData || iw37nData.length === 0) {
        select.innerHTML = '<option value="">-- Aucune donnée IW37N disponible --</option>';
        return;
    }

    // Filtrer les opérations MECEXT02
    const mecext02Operations = iw37nData.filter(row => {
        const posteTravOper = row['Post.trav.opér.'];
        return posteTravOper && posteTravOper.trim().toUpperCase() === 'MECEXT02';
    });

    console.log(`[PLAN-SUIVIS] ${mecext02Operations.length} opérations MECEXT02 trouvées`);

    if (mecext02Operations.length === 0) {
        select.innerHTML = '<option value="">-- Aucune opération MECEXT02 trouvée --</option>';
        return;
    }

    // Remplir le select
    let html = '<option value="">-- Sélectionnez une opération MECEXT02 --</option>';
    mecext02Operations.forEach((row, index) => {
        const ordre = row['Ordre'] || 'N/A';
        const designOper = row['Désign. opér.'] || 'N/A';
        const posteTech = row['Poste technique'] || 'N/A';
        const operation = row['Opération'] || '';
        const dateDebut = row['Date début'] || row['Début'] || '';
        const dateFin = row['Date fin'] || row['Fin'] || '';
        const heureDebut = row['Heure début'] || row['H.début'] || '00:00:00';
        const heureFin = row['Heure fin'] || row['H.fin'] || '23:59:59';

        // Déterminer le type d'opération (montage ou démontage)
        const designLower = designOper.toLowerCase();
        const isMonter = designLower.includes('monter') || designLower.includes('montage') || designLower.includes('install');
        const isDemonter = designLower.includes('démonter') || designLower.includes('demonter') || designLower.includes('démontage') || designLower.includes('demontage') || designLower.includes('retrait') || designLower.includes('enlever');

        // Créer un ID unique pour cette opération
        const optionValue = JSON.stringify({
            ordre,
            designOper,
            posteTech,
            operation,
            date_debut: dateDebut,
            date_fin: dateFin,
            heure_debut: heureDebut,
            heure_fin: heureFin,
            type_operation: isMonter ? 'montage' : (isDemonter ? 'demontage' : 'standard'),
            index
        });

        html += `<option value='${optionValue.replace(/'/g, '&apos;')}'>${posteTech} - ${ordre} - ${designOper}</option>`;
    });

    select.innerHTML = html;

    // Restaurer la valeur sélectionnée si elle existe toujours dans la nouvelle liste
    if (currentValue) {
        select.value = currentValue;
        console.log('[PLAN-SUIVIS] Liste MECEXT02 peuplée - sélection restaurée');
    } else {
        console.log('[PLAN-SUIVIS] Liste MECEXT02 peuplée');
    }
}

/**
 * Passe en mode édition
 * @returns {void}
 */
export function switchToModeEdition() {
    const editionContainer = document.getElementById('modeEditionContainer');
    const lectureContainer = document.getElementById('modeLectureContainer');

    if (editionContainer) editionContainer.style.display = 'block';
    if (lectureContainer) lectureContainer.style.display = 'none';

    // Réinitialiser au mode postes par défaut
    placementMode = 'postes';
    changePlacementMode('postes');

    // Peupler le select des postes techniques avec les données IW37N
    populatePostesTechniquesSelect();

    // NE PAS initialiser le système de placement ici
    // Il sera initialisé dans editPlan() après le chargement de l'image
    // initMarkerPlacement();

    console.log('[PLAN-SUIVIS] Mode édition activé');
}

/**
 * Peuple le select des postes techniques avec les données IW37N
 * @returns {void}
 */
function populatePostesTechniquesSelect() {
    const select = document.getElementById('posteTechniqueSelect');
    if (!select) {
        console.warn('[PLAN-SUIVIS] Select posteTechniqueSelect non trouvé');
        return;
    }

    // Vérifier que la fonction globale existe
    if (typeof window.getUniquePostesTechniques !== 'function') {
        console.warn('[PLAN-SUIVIS] getUniquePostesTechniques non disponible');
        select.innerHTML = '<option value="">⚠️ Chargez d\'abord les données IW37N</option>';
        return;
    }

    // Obtenir les postes techniques uniques
    const allPostes = window.getUniquePostesTechniques();

    if (!allPostes || allPostes.length === 0) {
        select.innerHTML = '<option value="">⚠️ Aucun poste technique trouvé</option>';
        console.warn('[PLAN-SUIVIS] Aucun poste technique disponible');
        return;
    }

    // Obtenir les postes déjà placés sur le plan actuel
    const placedPostes = getPlacedPostesTechniques();

    // Filtrer pour exclure les postes déjà placés
    const availablePostes = allPostes.filter(poste => !placedPostes.includes(poste));

    // Peupler le select
    select.innerHTML = '<option value="">-- Sélectionnez un poste technique --</option>';

    if (availablePostes.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '✅ Tous les postes ont été placés';
        option.disabled = true;
        select.appendChild(option);
    } else {
        availablePostes.forEach(poste => {
            const option = document.createElement('option');
            option.value = poste;
            option.textContent = poste;
            select.appendChild(option);
        });
    }

    console.log(`[PLAN-SUIVIS] ${availablePostes.length}/${allPostes.length} postes techniques disponibles (${placedPostes.length} déjà placés)`);

    // Afficher l'info quand un poste est sélectionné
    select.removeEventListener('change', handlePosteTechniqueChange);
    select.addEventListener('change', handlePosteTechniqueChange);
}

/**
 * Gère le changement de sélection du poste technique
 * @param {Event} e - L'événement change
 * @returns {void}
 */
function handlePosteTechniqueChange(e) {
    const infoDiv = document.getElementById('posteTechniqueInfo');
    if (infoDiv) {
        infoDiv.style.display = e.target.value ? 'block' : 'none';
    }
}

/**
 * Obtient la liste des postes techniques déjà placés sur le plan actuel
 * @returns {Array<string>} Liste des postes placés
 */
function getPlacedPostesTechniques() {
    const planImage = document.getElementById('planEditionImage');
    const planId = planImage?.dataset.planId;

    console.log('[PLAN-SUIVIS] getPlacedPostesTechniques - planId:', planId);

    if (!planId) {
        console.warn('[PLAN-SUIVIS] Aucun plan actif pour récupérer les marqueurs');
        return [];
    }

    // Recharger les données pour s'assurer qu'elles sont à jour
    loadPlanSuivisData();

    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        console.warn('[PLAN-SUIVIS] Plan non trouvé:', planId);
        return [];
    }

    if (!plan.markers || plan.markers.length === 0) {
        console.log('[PLAN-SUIVIS] Aucun marqueur sur ce plan');
        return [];
    }

    // Retourner les postes uniques (au cas où il y aurait des doublons)
    const placedPostes = [...new Set(plan.markers.map(m => m.posteTechnique))];
    console.log('[PLAN-SUIVIS] Postes placés:', placedPostes);
    return placedPostes;
}

/**
 * Initialise le système de placement de marqueurs sur le plan
 * @returns {void}
 */
function initMarkerPlacement() {
    const planImage = document.getElementById('planEditionImage');
    const markersContainer = document.getElementById('planMarkersContainer');

    if (!planImage || !markersContainer) {
        console.warn('[PLAN-SUIVIS] Éléments de plan non trouvés');
        return;
    }

    // Ajuster le conteneur des marqueurs si l'image est déjà chargée
    if (planImage.clientWidth > 0 && planImage.clientHeight > 0) {
        markersContainer.style.width = planImage.clientWidth + 'px';
        markersContainer.style.height = planImage.clientHeight + 'px';
        console.log('[PLAN-SUIVIS] Conteneur ajusté aux dimensions:', planImage.clientWidth, 'x', planImage.clientHeight);
    }

    // Sauvegarder le planId avant le clonage
    const planId = planImage.dataset.planId;

    // Retirer les anciens event listeners du document
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Supprimer les anciens event listeners de l'image en la clonant
    planImage.replaceWith(planImage.cloneNode(true));
    const newPlanImage = document.getElementById('planEditionImage');

    // Restaurer le planId sur la nouvelle image
    if (planId) {
        newPlanImage.dataset.planId = planId;
        console.log('[PLAN-SUIVIS] PlanId restauré:', planId);
    }

    // Event listeners pour les clics (modes postes et grues)
    newPlanImage.addEventListener('click', handlePlanClick);

    // Event listeners pour le dessin de rectangles (mode échafaudages)
    // MouseDown sur l'image, mais MouseMove et MouseUp sur le document
    // pour capturer les événements même si la souris sort de l'image
    newPlanImage.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    console.log('[PLAN-SUIVIS] Système de placement initialisé (listeners sur document)');
}

/**
 * Gère le clic sur le plan selon le mode actif
 */
function handlePlanClick(e) {
    const newPlanImage = document.getElementById('planEditionImage');
    const rect = newPlanImage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    if (placementMode === 'postes') {
        const select = document.getElementById('posteTechniqueSelect');
        const posteTechnique = select?.value;

        if (!posteTechnique) {
            alert('⚠️ Veuillez d\'abord sélectionner un poste technique à placer');
            return;
        }

        placeMarker(posteTechnique, xPercent, yPercent);
        console.log(`[PLAN-SUIVIS] Marqueur placé: ${posteTechnique}`);
    } else if (placementMode === 'grues') {
        const grueNameInput = document.getElementById('grueNameInput');
        const grueName = grueNameInput?.value || `Grue-${Date.now()}`;

        placeGrue(grueName, xPercent, yPercent);
        console.log(`[PLAN-SUIVIS] Grue placée: ${grueName}`);
    }
}

/**
 * Début du dessin d'une zone rectangulaire
 */
function handleMouseDown(e) {
    console.log('[PLAN-SUIVIS] 🖱️ MouseDown déclenché, placementMode:', placementMode, 'target:', e.target.id);

    if (placementMode !== 'echafaudages') {
        console.log('[PLAN-SUIVIS] ⚠️ MouseDown ignoré - pas en mode échafaudages');
        return;
    }

    // Ne démarrer le dessin que si le clic est sur l'image du plan
    const newPlanImage = document.getElementById('planEditionImage');
    if (!newPlanImage || e.target !== newPlanImage) {
        console.log('[PLAN-SUIVIS] ⚠️ MouseDown ignoré - clic pas sur l\'image du plan');
        return;
    }

    // Empêcher le comportement par défaut et la propagation
    e.preventDefault();
    e.stopPropagation();

    const rect = newPlanImage.getBoundingClientRect();

    isDrawing = true;
    drawStartX = e.clientX - rect.left;
    drawStartY = e.clientY - rect.top;

    console.log('[PLAN-SUIVIS] ✅ MouseDown traité:', {
        clientX: e.clientX,
        clientY: e.clientY,
        rectLeft: rect.left,
        rectTop: rect.top,
        drawStartX,
        drawStartY,
        isDrawing
    });
}

/**
 * Dessin en cours d'une zone rectangulaire
 */
function handleMouseMove(e) {
    if (!isDrawing || placementMode !== 'echafaudages') return;

    const newPlanImage = document.getElementById('planEditionImage');
    const rect = newPlanImage.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Supprimer le rectangle temporaire précédent
    if (currentDrawingRect) {
        currentDrawingRect.remove();
    }

    // Créer un rectangle temporaire
    const width = Math.abs(currentX - drawStartX);
    const height = Math.abs(currentY - drawStartY);
    const left = Math.min(drawStartX, currentX);
    const top = Math.min(drawStartY, currentY);

    const markersContainer = document.getElementById('planMarkersContainer');
    currentDrawingRect = document.createElement('div');
    currentDrawingRect.style.cssText = `
        position: absolute;
        left: ${(left / rect.width) * 100}%;
        top: ${(top / rect.height) * 100}%;
        width: ${(width / rect.width) * 100}%;
        height: ${(height / rect.height) * 100}%;
        border: 3px dashed #ffc107;
        background: rgba(255, 193, 7, 0.2);
        pointer-events: none;
        z-index: 1000;
    `;
    markersContainer.appendChild(currentDrawingRect);
}

/**
 * Fin du dessin d'une zone rectangulaire
 */
function handleMouseUp(e) {
    console.log('[PLAN-SUIVIS] 🖱️ MouseUp - isDrawing:', isDrawing, 'placementMode:', placementMode);

    if (!isDrawing || placementMode !== 'echafaudages') {
        console.log('[PLAN-SUIVIS] ⚠️ MouseUp ignoré - conditions non remplies');
        return;
    }

    const newPlanImage = document.getElementById('planEditionImage');
    const rect = newPlanImage.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    console.log('[PLAN-SUIVIS] 📐 Coordonnées MouseUp:', {
        endX,
        endY,
        drawStartX,
        drawStartY
    });

    // Calculer les dimensions en pourcentages
    const width = Math.abs(endX - drawStartX);
    const height = Math.abs(endY - drawStartY);
    const left = Math.min(drawStartX, endX);
    const top = Math.min(drawStartY, endY);

    const xPercent = (left / rect.width) * 100;
    const yPercent = (top / rect.height) * 100;
    const widthPercent = (width / rect.width) * 100;
    const heightPercent = (height / rect.height) * 100;

    console.log('[PLAN-SUIVIS] 📏 Dimensions calculées:', {
        widthPercent: widthPercent.toFixed(2),
        heightPercent: heightPercent.toFixed(2),
        meetsMinimumSize: widthPercent > 1 && heightPercent > 1
    });

    // Ne créer une zone que si elle a une taille minimale (0.3% = très petite)
    if (widthPercent > 0.3 && heightPercent > 0.3) {
        console.log('[PLAN-SUIVIS] ✅ Taille suffisante pour créer la zone');
        // Vérifier qu'une opération MECEXT02 est sélectionnée
        const select = document.getElementById('mecext02Select');
        console.log('[PLAN-SUIVIS] 🔍 Vérification select MECEXT02:', {
            selectTrouve: !!select,
            selectValue: select?.value,
            selectValueLength: select?.value?.length
        });

        if (!select || !select.value) {
            console.error('[PLAN-SUIVIS] ❌ Aucune opération MECEXT02 sélectionnée');
            alert('⚠️ Veuillez d\'abord sélectionner une opération MECEXT02 dans la liste');
            // Nettoyer
            if (currentDrawingRect) {
                currentDrawingRect.remove();
                currentDrawingRect = null;
            }
            isDrawing = false;
            return;
        }

        // Récupérer les informations de l'opération sélectionnée
        let mecext02Info;
        try {
            mecext02Info = JSON.parse(select.value);
            console.log('[PLAN-SUIVIS] ✅ Info MECEXT02 parsée:', mecext02Info);
        } catch (error) {
            console.error('[PLAN-SUIVIS] ❌ Erreur parsing MECEXT02 info:', error);
            alert('❌ Erreur lors de la récupération des informations MECEXT02');
            // Nettoyer
            if (currentDrawingRect) {
                currentDrawingRect.remove();
                currentDrawingRect = null;
            }
            isDrawing = false;
            return;
        }

        console.log('[PLAN-SUIVIS] 🚀 Appel de placeEchafaudageZone...');
        placeEchafaudageZone(xPercent, yPercent, widthPercent, heightPercent, mecext02Info);
        console.log(`[PLAN-SUIVIS] ✅ Zone d'échafaudage créée pour ${mecext02Info.ordre}`);

        // Ne pas réinitialiser le select pour permettre de placer plusieurs zones pour la même opération
        // Le select garde la valeur sélectionnée
    } else {
        console.error('[PLAN-SUIVIS] ❌ Zone trop petite, création annulée');
    }

    // Nettoyer
    console.log('[PLAN-SUIVIS] 🧹 Nettoyage du rectangle temporaire...');
    if (currentDrawingRect) {
        currentDrawingRect.remove();
        currentDrawingRect = null;
    }
    isDrawing = false;
    console.log('[PLAN-SUIVIS] ✅ HandleMouseUp terminé');
}

/**
 * Place un marqueur sur le plan
 * @param {string} posteTechnique - Nom du poste technique
 * @param {number} xPercent - Position X en pourcentage
 * @param {number} yPercent - Position Y en pourcentage
 * @param {boolean} save - Sauvegarder dans les données (défaut: true)
 * @returns {Promise<void>}
 */
async function placeMarker(posteTechnique, xPercent, yPercent, save = true) {
    const markersContainer = document.getElementById('planMarkersContainer');
    if (!markersContainer) return;

    // Créer le marqueur
    const marker = document.createElement('div');
    marker.className = 'plan-marker';
    marker.dataset.poste = posteTechnique;
    marker.style.cssText = `
        position: absolute;
        left: ${xPercent}%;
        top: ${yPercent}%;
        transform: translate(-50%, -100%);
        background: #667eea;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        z-index: 10;
    `;
    marker.textContent = posteTechnique;

    // Ajouter un point en dessous du marqueur
    const point = document.createElement('div');
    point.style.cssText = `
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 8px;
        background: #667eea;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    marker.appendChild(point);

    // Ajouter un event listener pour sélectionner/supprimer le marqueur
    marker.addEventListener('click', (e) => {
        e.stopPropagation();
        selectMarker(marker);
    });

    markersContainer.appendChild(marker);

    // Sauvegarder dans les données du plan si demandé
    if (save) {
        await saveMarkerToPlan(posteTechnique, xPercent, yPercent);
        // Rafraîchir la liste des postes disponibles
        populatePostesTechniquesSelect();
    }
}

/**
 * Place une zone d'échafaudage sur le plan
 * @param {number} xPercent - Position X en pourcentage
 * @param {number} yPercent - Position Y en pourcentage
 * @param {number} widthPercent - Largeur en pourcentage
 * @param {number} heightPercent - Hauteur en pourcentage
 * @returns {Promise<void>}
 */
async function placeEchafaudageZone(xPercent, yPercent, widthPercent, heightPercent, mecext02Info = null) {
    console.log('[PLAN-SUIVIS] 🏗️ Placement zone échafaudage:', {xPercent, yPercent, widthPercent, heightPercent, mecext02Info});

    const markersContainer = document.getElementById('planMarkersContainer');
    if (!markersContainer) {
        console.error('[PLAN-SUIVIS] ❌ Conteneur planMarkersContainer non trouvé!');
        return;
    }

    console.log('[PLAN-SUIVIS] ✅ Conteneur trouvé, dimensions:', {
        width: markersContainer.style.width,
        height: markersContainer.style.height,
        clientWidth: markersContainer.clientWidth,
        clientHeight: markersContainer.clientHeight,
        offsetWidth: markersContainer.offsetWidth,
        offsetHeight: markersContainer.offsetHeight,
        position: markersContainer.style.position,
        top: markersContainer.style.top,
        left: markersContainer.style.left
    });

    // Vérifier combien d'éléments sont déjà dans le conteneur
    console.log('[PLAN-SUIVIS] Éléments actuels dans le conteneur:', markersContainer.children.length);

    const zoneId = `ech-${Date.now()}`;

    // Créer la zone
    const zone = document.createElement('div');
    zone.className = 'echafaudage-zone';
    zone.dataset.id = zoneId;
    zone.style.cssText = `
        position: absolute;
        left: ${xPercent}%;
        top: ${yPercent}%;
        width: ${widthPercent}%;
        height: ${heightPercent}%;
        border: 3px solid #ffc107;
        background: rgba(255, 193, 7, 0.15);
        cursor: pointer;
        pointer-events: auto;
        z-index: 5;
    `;

    // Ajouter un label avec les informations MECEXT02
    const label = document.createElement('div');
    label.className = 'echafaudage-label';
    label.style.cssText = `
        position: absolute;
        top: 5px;
        left: 5px;
        background: #ffc107;
        color: #000;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
    `;

    if (mecext02Info) {
        label.textContent = `${mecext02Info.posteTech} - ${mecext02Info.ordre}`;
        // Ajouter un tooltip avec toutes les informations
        zone.title = `ÉCHAFAUDAGE MECEXT02\n\nPoste technique: ${mecext02Info.posteTech}\nOrdre: ${mecext02Info.ordre}\nDésignation: ${mecext02Info.designOper}\nOpération: ${mecext02Info.operation}`;
    } else {
        label.textContent = 'ÉCHAFAUDAGE';
    }

    zone.appendChild(label);

    // Afficher le label au survol
    zone.addEventListener('mouseenter', () => {
        label.style.opacity = '1';
    });
    zone.addEventListener('mouseleave', () => {
        label.style.opacity = '0';
    });

    // Event listener pour sélectionner/supprimer
    zone.addEventListener('click', (e) => {
        e.stopPropagation();
        selectEchafaudage(zone);
    });

    markersContainer.appendChild(zone);
    console.log('[PLAN-SUIVIS] ✅ Zone ajoutée au DOM, ID:', zoneId);

    // Vérifier que la zone est bien dans le DOM
    setTimeout(() => {
        const zoneInDOM = document.querySelector(`[data-id="${zoneId}"]`);
        if (zoneInDOM) {
            console.log('[PLAN-SUIVIS] ✅ Vérification: Zone toujours dans le DOM après 100ms');
            console.log('[PLAN-SUIVIS] Style de la zone:', {
                position: zoneInDOM.style.position,
                left: zoneInDOM.style.left,
                top: zoneInDOM.style.top,
                width: zoneInDOM.style.width,
                height: zoneInDOM.style.height,
                zIndex: zoneInDOM.style.zIndex,
                display: window.getComputedStyle(zoneInDOM).display,
                visibility: window.getComputedStyle(zoneInDOM).visibility
            });
            console.log('[PLAN-SUIVIS] Parent conteneur:', zoneInDOM.parentElement?.id);
        } else {
            console.error('[PLAN-SUIVIS] ❌ Zone ABSENTE du DOM après 100ms!');
        }
    }, 100);

    // Sauvegarder dans les données
    await saveEchafaudageToPlan(zoneId, xPercent, yPercent, widthPercent, heightPercent, mecext02Info);
    console.log('[PLAN-SUIVIS] ✅ Zone sauvegardée dans les données du plan');
}

/**
 * Place une grue sur le plan
 * @param {string} grueName - Nom de la grue
 * @param {number} xPercent - Position X en pourcentage
 * @param {number} yPercent - Position Y en pourcentage
 * @returns {Promise<void>}
 */
async function placeGrue(grueName, xPercent, yPercent) {
    const markersContainer = document.getElementById('planMarkersContainer');
    if (!markersContainer) return;

    const grueId = `grue-${Date.now()}`;

    // Créer le marqueur de grue
    const grue = document.createElement('div');
    grue.className = 'grue-marker';
    grue.dataset.id = grueId;
    grue.dataset.name = grueName;
    grue.style.cssText = `
        position: absolute;
        left: ${xPercent}%;
        top: ${yPercent}%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        cursor: pointer;
        pointer-events: auto;
        z-index: 20;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    grue.textContent = '🚛';
    grue.title = grueName;

    // Ajouter le nom en dessous
    const nameLabel = document.createElement('div');
    nameLabel.style.cssText = `
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #17a2b8;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
        margin-top: 5px;
    `;
    nameLabel.textContent = grueName;
    grue.appendChild(nameLabel);

    // Event listener pour sélectionner/supprimer
    grue.addEventListener('click', (e) => {
        e.stopPropagation();
        selectGrue(grue);
    });

    markersContainer.appendChild(grue);

    // Sauvegarder dans les données
    await saveGrueToPlan(grueId, grueName, xPercent, yPercent);
}

/**
 * Sélectionne un marqueur
 * @param {HTMLElement} marker - Le marqueur à sélectionner
 * @returns {void}
 */
function selectMarker(marker) {
    // Désélectionner tous les autres marqueurs
    document.querySelectorAll('.plan-marker').forEach(m => {
        m.style.background = '#667eea';
        m.style.outline = 'none';
    });

    // Sélectionner ce marqueur
    marker.style.background = '#dc3545';
    marker.style.outline = '3px solid #ffc107';

    // Stocker la sélection
    marker.dataset.selected = 'true';

    console.log(`[PLAN-SUIVIS] Marqueur sélectionné: ${marker.dataset.poste}`);
}

/**
 * Sélectionne une zone d'échafaudage
 * @param {HTMLElement} zone - La zone à sélectionner
 * @returns {void}
 */
function selectEchafaudage(zone) {
    // Désélectionner tous les autres éléments
    document.querySelectorAll('.plan-marker, .echafaudage-zone, .grue-marker').forEach(el => {
        el.style.outline = 'none';
        delete el.dataset.selected;
    });

    // Sélectionner cette zone
    zone.style.outline = '4px solid #dc3545';
    zone.dataset.selected = 'true';

    console.log(`[PLAN-SUIVIS] Échafaudage sélectionné: ${zone.dataset.id}`);
}

/**
 * Sélectionne une grue
 * @param {HTMLElement} grue - La grue à sélectionner
 * @returns {void}
 */
function selectGrue(grue) {
    // Désélectionner tous les autres éléments
    document.querySelectorAll('.plan-marker, .echafaudage-zone, .grue-marker').forEach(el => {
        el.style.outline = 'none';
        el.style.transform = el.classList.contains('grue-marker') ? 'translate(-50%, -50%)' : null;
        delete el.dataset.selected;
    });

    // Sélectionner cette grue
    grue.style.outline = '3px solid #dc3545';
    grue.style.transform = 'translate(-50%, -50%) scale(1.2)';
    grue.dataset.selected = 'true';

    console.log(`[PLAN-SUIVIS] Grue sélectionnée: ${grue.dataset.name}`);
}

/**
 * Sauvegarde un marqueur dans les données du plan
 * @param {string} posteTechnique - Nom du poste technique
 * @param {number} xPercent - Position X en pourcentage
 * @param {number} yPercent - Position Y en pourcentage
 * @returns {Promise<void>}
 */
async function saveMarkerToPlan(posteTechnique, xPercent, yPercent) {
    const planImage = document.getElementById('planEditionImage');
    const planId = planImage?.dataset.planId;

    console.log('[PLAN-SUIVIS] saveMarkerToPlan - planId:', planId, 'poste:', posteTechnique);

    if (!planId) {
        console.error('[PLAN-SUIVIS] ❌ Aucun plan actif pour sauvegarder le marqueur');
        alert('⚠️ Erreur: Aucun plan actif. Veuillez d\'abord ouvrir un plan en mode édition.');
        return;
    }

    loadPlanSuivisData();

    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        console.error('[PLAN-SUIVIS] ❌ Plan non trouvé:', planId);
        return;
    }

    // Initialiser markers si nécessaire
    if (!plan.markers) {
        plan.markers = [];
        console.log('[PLAN-SUIVIS] Initialisation du tableau markers');
    }

    // Ajouter le marqueur
    const marker = {
        id: 'marker-' + Date.now(),
        posteTechnique,
        x: xPercent,
        y: yPercent,
        createdAt: new Date().toISOString()
    };

    plan.markers.push(marker);

    console.log('[PLAN-SUIVIS] ✅ Marqueur ajouté:', marker);
    console.log('[PLAN-SUIVIS] Total marqueurs sur ce plan:', plan.markers.length);

    await savePlanSuivisData();
    console.log('[PLAN-SUIVIS] ✅ Données sauvegardées');
}

/**
 * Sauvegarde une zone d'échafaudage dans les données du plan
 */
async function saveEchafaudageToPlan(zoneId, xPercent, yPercent, widthPercent, heightPercent, mecext02Info = null) {
    const planImage = document.getElementById('planEditionImage');
    const planId = planImage?.dataset.planId;

    console.log('[PLAN-SUIVIS] 💾 Tentative de sauvegarde échafaudage, planId:', planId);

    if (!planId) {
        console.error('[PLAN-SUIVIS] ❌ Aucun plan actif pour sauvegarder l\'échafaudage');
        alert('❌ Erreur: Aucun plan actif. Veuillez d\'abord éditer un plan.');
        return;
    }

    // Recharger depuis le serveur pour avoir les données à jour
    await loadPlanSuivisDataFromServer();
    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) {
        console.error('[PLAN-SUIVIS] ❌ Plan non trouvé dans les données:', planId);
        return;
    }

    console.log('[PLAN-SUIVIS] ✅ Plan trouvé:', plan.name);

    // Initialiser echafaudages si nécessaire
    if (!plan.echafaudages) {
        plan.echafaudages = [];
        console.log('[PLAN-SUIVIS] Initialisation du tableau échafaudages');
    }

    // Ajouter l'échafaudage avec les informations MECEXT02
    const echafaudageData = {
        id: zoneId,
        x: xPercent,
        y: yPercent,
        width: widthPercent,
        height: heightPercent,
        createdAt: new Date().toISOString()
    };

    // Ajouter les infos MECEXT02 si présentes
    if (mecext02Info) {
        echafaudageData.mecext02 = mecext02Info;
    }

    plan.echafaudages.push(echafaudageData);
    console.log('[PLAN-SUIVIS] ✅ Échafaudage ajouté au tableau, total:', plan.echafaudages.length);

    const saveSuccess = await savePlanSuivisData();
    if (saveSuccess) {
        console.log('[PLAN-SUIVIS] ✅ Données sauvegardées avec succès');
    } else {
        console.error('[PLAN-SUIVIS] ⚠️ Erreur lors de la sauvegarde');
    }
    console.log('[PLAN-SUIVIS] ✅ Échafaudage sauvegardé', mecext02Info ? `(${mecext02Info.ordre})` : '');
}

/**
 * Sauvegarde une grue dans les données du plan
 */
async function saveGrueToPlan(grueId, grueName, xPercent, yPercent) {
    const planImage = document.getElementById('planEditionImage');
    const planId = planImage?.dataset.planId;

    if (!planId) {
        console.error('[PLAN-SUIVIS] ❌ Aucun plan actif pour sauvegarder la grue');
        return;
    }

    loadPlanSuivisData();
    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan) return;

    // Initialiser grues si nécessaire
    if (!plan.grues) {
        plan.grues = [];
    }

    // Ajouter la grue
    plan.grues.push({
        id: grueId,
        name: grueName,
        x: xPercent,
        y: yPercent,
        createdAt: new Date().toISOString()
    });

    await savePlanSuivisData();
    console.log('[PLAN-SUIVIS] ✅ Grue sauvegardée');
}

/**
 * Passe en mode lecture
 * @returns {void}
 */
export function switchToModeLecture() {
    const editionContainer = document.getElementById('modeEditionContainer');
    const lectureContainer = document.getElementById('modeLectureContainer');

    if (editionContainer) editionContainer.style.display = 'none';
    if (lectureContainer) lectureContainer.style.display = 'block';

    console.log('[PLAN-SUIVIS] Mode lecture activé');
}

/**
 * Ferme le mode édition
 * @returns {void}
 */
export function closeModeEdition() {
    const editionContainer = document.getElementById('modeEditionContainer');
    if (editionContainer) editionContainer.style.display = 'none';

    console.log('[PLAN-SUIVIS] Mode édition fermé');
}

/**
 * Supprime le marqueur sélectionné
 * @returns {Promise<void>}
 */
export async function deleteSelectedMarker() {
    // Chercher tous les types d'éléments sélectionnés
    const selectedMarker = document.querySelector('.plan-marker[data-selected="true"]');
    const selectedEchafaudage = document.querySelector('.echafaudage-zone[data-selected="true"]');
    const selectedGrue = document.querySelector('.grue-marker[data-selected="true"]');

    if (!selectedMarker && !selectedEchafaudage && !selectedGrue) {
        alert('⚠️ Veuillez d\'abord sélectionner un élément à supprimer en cliquant dessus');
        return;
    }

    // Supprimer selon le type
    if (selectedMarker) {
        const posteTechnique = selectedMarker.dataset.poste;
        if (confirm(`Voulez-vous vraiment supprimer le marqueur "${posteTechnique}" ?`)) {
            selectedMarker.remove();
            await removeMarkerFromPlan(posteTechnique);
            populatePostesTechniquesSelect();
            console.log(`[PLAN-SUIVIS] Marqueur supprimé: ${posteTechnique}`);
        }
    } else if (selectedEchafaudage) {
        const echafaudageId = selectedEchafaudage.dataset.id;
        if (confirm(`Voulez-vous vraiment supprimer cette zone d'échafaudage ?`)) {
            selectedEchafaudage.remove();
            await removeEchafaudageFromPlan(echafaudageId);
            console.log(`[PLAN-SUIVIS] Échafaudage supprimé: ${echafaudageId}`);
        }
    } else if (selectedGrue) {
        const grueName = selectedGrue.dataset.name;
        const grueId = selectedGrue.dataset.id;
        if (confirm(`Voulez-vous vraiment supprimer la grue "${grueName}" ?`)) {
            selectedGrue.remove();
            await removeGrueFromPlan(grueId);
            console.log(`[PLAN-SUIVIS] Grue supprimée: ${grueName}`);
        }
    }
}

/**
 * Supprime un marqueur des données du plan
 * @param {string} posteTechnique - Nom du poste technique
 * @returns {Promise<void>}
 */
async function removeMarkerFromPlan(posteTechnique) {
    const planImage = document.getElementById('planEditionImage');
    const planId = planImage?.dataset.planId;

    if (!planId) return;

    loadPlanSuivisData();

    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan || !plan.markers) return;

    // Supprimer le dernier marqueur avec ce poste technique
    const index = plan.markers.map(m => m.posteTechnique).lastIndexOf(posteTechnique);
    if (index !== -1) {
        plan.markers.splice(index, 1);
        await savePlanSuivisData();
    }
}

/**
 * Supprime un échafaudage des données du plan
 * @param {string} echafaudageId - ID de l'échafaudage
 * @returns {Promise<void>}
 */
async function removeEchafaudageFromPlan(echafaudageId) {
    const planImage = document.getElementById('planEditionImage');
    const planId = planImage?.dataset.planId;

    if (!planId) return;

    loadPlanSuivisData();

    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan || !plan.echafaudages) return;

    // Supprimer l'échafaudage par ID
    const index = plan.echafaudages.findIndex(e => e.id === echafaudageId);
    if (index !== -1) {
        plan.echafaudages.splice(index, 1);
        await savePlanSuivisData();
    }
}

/**
 * Supprime une grue des données du plan
 * @param {string} grueId - ID de la grue
 * @returns {Promise<void>}
 */
async function removeGrueFromPlan(grueId) {
    const planImage = document.getElementById('planEditionImage');
    const planId = planImage?.dataset.planId;

    if (!planId) return;

    loadPlanSuivisData();

    const plan = planSuivisData.plans.find(p => p.id === planId);
    if (!plan || !plan.grues) return;

    // Supprimer la grue par ID
    const index = plan.grues.findIndex(g => g.id === grueId);
    if (index !== -1) {
        plan.grues.splice(index, 1);
        await savePlanSuivisData();
    }
}

/**
 * Sauvegarde les modifications du plan
 * @returns {Promise<void>}
 */
export async function savePlanEdition() {
    const image = document.getElementById('planEditionImage');
    const planId = image?.dataset.planId;

    if (!planId) {
        alert('⚠️ Aucun plan en cours d\'édition');
        return;
    }

    const success = await savePlanSuivisData();
    if (success) {
        alert('✅ Modifications sauvegardées !');
        console.log('[PLAN-SUIVIS] Modifications du plan sauvegardées');
    } else {
        alert('⚠️ Erreur lors de la sauvegarde des modifications');
    }
}

/**
 * Affiche un message de statut
 * @param {string} elementId - ID de l'élément de statut
 * @param {string} type - Type de message ('success', 'error', 'info')
 * @param {string} message - Message à afficher
 * @returns {void}
 */
function showStatus(elementId, type, message) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const colors = {
        success: { bg: '#d4edda', border: '#28a745', text: '#155724' },
        error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
        info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' }
    };

    const color = colors[type] || colors.info;

    element.style.display = 'block';
    element.style.background = color.bg;
    element.style.borderLeft = `4px solid ${color.border}`;
    element.style.color = color.text;
    element.innerHTML = `<p style="margin: 0;">${message}</p>`;

    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}
