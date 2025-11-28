/**
 * @fileoverview Gestion des marqueurs sur les plans SCOPE
 * @module scope/scope-markers
 */

import { getScopeFilters } from './index.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Stockage des données de marqueurs par scope
 * Structure: {
 *   scopeId: {
 *     plans: [{id, name, imageUrl, markers: []}],
 *     currentPlanIndex: 0
 *   }
 * }
 * @type {Object}
 */
let scopeMarkers = {};

/**
 * ID du scope actuellement affiché
 * @type {string|null}
 */
let currentScopeId = null;

/**
 * Zoom et pan pour les plans
 * @type {Object}
 */
let zoomLevel = 1;
let panX = 0;
let panY = 0;

/**
 * Charge les marqueurs depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadScopeMarkers() {
    const saved = await loadFromStorage('scopeMarkers');
    if (saved) {
        scopeMarkers = saved;
        console.log('[SCOPE-MARKERS] ✅ Marqueurs chargés depuis le serveur');
    } else {
        console.log('[SCOPE-MARKERS] ℹ️ Aucun marqueur sur le serveur');
    }
}

/**
 * Sauvegarde les marqueurs sur le SERVEUR uniquement
 * @returns {Promise<void>}
 */
async function saveScopeMarkers() {
    await saveToStorage('scopeMarkers', scopeMarkers);
    console.log('[SCOPE-MARKERS] ✅ Marqueurs sauvegardés sur le serveur');
}

/**
 * Initialise la zone de plan pour un scope donné
 * @param {string} scopeId - ID du scope (ex: 't10', 't11', etc.)
 * @returns {Promise<void>}
 */
export async function initScopePlan(scopeId) {
    currentScopeId = scopeId;
    zoomLevel = 1;
    panX = 0;
    panY = 0;

    // Migrer l'ancienne structure si nécessaire
    if (scopeMarkers[scopeId] && scopeMarkers[scopeId].imageUrl && !scopeMarkers[scopeId].plans) {
        const oldData = scopeMarkers[scopeId];
        scopeMarkers[scopeId] = {
            plans: [{
                id: 'plan-' + Date.now(),
                name: 'Plan principal',
                imageUrl: oldData.imageUrl,
                markers: oldData.markers || []
            }],
            currentPlanIndex: 0
        };
        saveScopeMarkers();
    }

    // Initialiser les données du scope si nécessaire
    if (!scopeMarkers[scopeId]) {
        scopeMarkers[scopeId] = {
            plans: [],
            currentPlanIndex: 0
        };
    }

    // Afficher l'interface de sélection des plans et le plan actuel
    renderPlanSelector(scopeId);
    await renderWorkSelector(scopeId);
    displayCurrentPlan(scopeId);
}

/**
 * Gère l'upload d'une image ou PDF pour le plan
 * @param {Event} event - Événement de changement de fichier
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
export function handleScopePlanUpload(event, scopeId) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        // C'est une image - traitement direct
        const reader = new FileReader();
        reader.onload = function(e) {
            addPlanToScope(scopeId, file.name, e.target.result);
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        // C'est un PDF - conversion en image
        convertPDFToImage(file, scopeId);
    } else {
        alert('⚠️ Format non supporté. Veuillez utiliser une image (PNG, JPG) ou un PDF.');
    }
}

/**
 * Ajoute un plan à un scope
 * @param {string} scopeId - ID du scope
 * @param {string} fileName - Nom du fichier
 * @param {string} imageUrl - URL de l'image (data URL)
 * @returns {Promise<void>}
 */
async function addPlanToScope(scopeId, fileName, imageUrl) {
    if (!scopeMarkers[scopeId]) {
        scopeMarkers[scopeId] = {
            plans: [],
            currentPlanIndex: 0
        };
    }

    const newPlan = {
        id: 'plan-' + Date.now(),
        name: fileName,
        imageUrl: imageUrl,
        markers: []
    };

    scopeMarkers[scopeId].plans.push(newPlan);
    scopeMarkers[scopeId].currentPlanIndex = scopeMarkers[scopeId].plans.length - 1;

    await saveScopeMarkers();
    renderPlanSelector(scopeId);
    await renderWorkSelector(scopeId);
    displayCurrentPlan(scopeId);

    console.log(`[SCOPE-MARKERS] Plan ajouté: ${fileName}`);
}

/**
 * Convertit la première page d'un PDF en image
 * @param {File} file - Fichier PDF
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
async function convertPDFToImage(file, scopeId) {
    try {
        // Vérifier que PDF.js est chargé
        if (typeof pdfjsLib === 'undefined') {
            alert('❌ Erreur: Bibliothèque PDF.js non chargée. Veuillez recharger la page.');
            return;
        }

        // Configurer le worker PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Lire le fichier PDF
        const arrayBuffer = await file.arrayBuffer();

        // Charger le document PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        // Obtenir la première page
        const page = await pdf.getPage(1);

        // Préparer le canvas
        const scale = 2.0; // Échelle pour meilleure qualité
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Rendre la page sur le canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Convertir le canvas en data URL
        const imageDataUrl = canvas.toDataURL('image/png');

        // Ajouter le plan
        addPlanToScope(scopeId, file.name, imageDataUrl);

        console.log(`[SCOPE-MARKERS] PDF converti en image pour ${scopeId}`);
        alert('✅ PDF importé avec succès ! La première page a été convertie en image.');

    } catch (error) {
        console.error('[SCOPE-MARKERS] Erreur lors de la conversion PDF:', error);
        alert('❌ Erreur lors de l\'import du PDF. Veuillez réessayer ou utiliser une image (PNG/JPG).');
    }
}

/**
 * Affiche le plan actuellement sélectionné
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
function displayCurrentPlan(scopeId) {
    const scopeData = scopeMarkers[scopeId];
    if (!scopeData || !scopeData.plans || scopeData.plans.length === 0) {
        const container = document.getElementById(`${scopeId}-plan-container`);
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun plan chargé. Utilisez le bouton "Charger Plan" ci-dessus.</p>';
        }
        return;
    }

    const currentPlan = scopeData.plans[scopeData.currentPlanIndex];
    if (currentPlan) {
        displayScopeImage(scopeId, currentPlan);
    }
}

/**
 * Affiche une image de plan dans le conteneur
 * @param {string} scopeId - ID du scope
 * @param {Object} plan - Objet plan {id, name, imageUrl, markers}
 * @returns {void}
 */
function displayScopeImage(scopeId, plan) {
    const container = document.getElementById(`${scopeId}-plan-container`);
    if (!container) {
        console.warn(`[SCOPE-MARKERS] Conteneur ${scopeId}-plan-container non trouvé`);
        return;
    }

    container.innerHTML = '';

    // Créer le conteneur zoomable
    const zoomWrapper = document.createElement('div');
    zoomWrapper.style.width = '100%';
    zoomWrapper.style.height = '600px';
    zoomWrapper.style.overflow = 'auto';
    zoomWrapper.style.border = '1px solid #ddd';
    zoomWrapper.style.borderRadius = '8px';
    zoomWrapper.style.background = '#f5f5f5';
    zoomWrapper.style.position = 'relative';

    // Créer la zone d'affichage avec l'image
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
    wrapper.style.transformOrigin = 'top left';
    wrapper.style.transition = 'transform 0.3s ease';

    const img = document.createElement('img');
    img.src = plan.imageUrl;
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.cursor = 'crosshair';

    // Ajouter l'événement de clic pour placer les marqueurs
    img.addEventListener('click', (e) => handleImageClick(e, scopeId, img, plan));

    wrapper.appendChild(img);
    zoomWrapper.appendChild(wrapper);
    container.appendChild(zoomWrapper);

    // Afficher les marqueurs existants
    renderMarkers(scopeId, wrapper, img, plan);

    console.log(`[SCOPE-MARKERS] Image affichée pour ${scopeId}:`, plan.name);
}

/**
 * Gère le clic sur l'image pour placer un marqueur
 * @param {MouseEvent} e - Événement de clic
 * @param {string} scopeId - ID du scope
 * @param {HTMLImageElement} img - Element image
 * @param {Object} plan - Objet plan
 * @returns {Promise<void>}
 */
async function handleImageClick(e, scopeId, img, plan) {
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Position en %
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Position en %

    // Vérifier si un travail est sélectionné dans le dropdown
    const workSelector = document.getElementById(`${scopeId}-work-selector`);
    if (!workSelector || !workSelector.value || workSelector.value === '') {
        alert('⚠️ Veuillez sélectionner un travail dans la liste déroulante avant de placer un marqueur.');
        return;
    }

    const selectedWork = JSON.parse(workSelector.value);
    const description = prompt('Entrez une description pour ce marqueur (optionnel):') || selectedWork.designation || '';

    // Créer le marqueur
    const marker = {
        id: 'marker-' + Date.now(),
        x: x,
        y: y,
        ordre: selectedWork.ordre,
        operation: selectedWork.operation || '',
        description: description
    };

    plan.markers.push(marker);
    await saveScopeMarkers();

    // Rafraîchir le sélecteur de travaux et l'affichage
    await renderWorkSelector(scopeId);
    displayCurrentPlan(scopeId);
}

/**
 * Affiche tous les marqueurs sur le plan
 * @param {string} scopeId - ID du scope
 * @param {HTMLElement} wrapper - Conteneur wrapper
 * @param {HTMLImageElement} img - Element image
 * @param {Object} plan - Objet plan
 * @returns {void}
 */
function renderMarkers(scopeId, wrapper, img, plan) {
    if (!plan || !plan.markers) return;

    plan.markers.forEach((marker, index) => {
        const markerEl = document.createElement('div');
        markerEl.className = 'scope-marker';
        markerEl.style.position = 'absolute';
        markerEl.style.left = marker.x + '%';
        markerEl.style.top = marker.y + '%';
        markerEl.style.width = '30px';
        markerEl.style.height = '30px';
        markerEl.style.background = 'rgba(255, 0, 0, 0.7)';
        markerEl.style.borderRadius = '50%';
        markerEl.style.border = '3px solid white';
        markerEl.style.cursor = 'pointer';
        markerEl.style.transform = 'translate(-50%, -50%)';
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';
        markerEl.style.color = 'white';
        markerEl.style.fontWeight = 'bold';
        markerEl.style.fontSize = '12px';
        markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        markerEl.style.zIndex = '10';
        markerEl.textContent = index + 1;

        // Tooltip au survol
        markerEl.title = `Ordre: ${marker.ordre}\n${marker.description}`;

        // Clic pour supprimer
        markerEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Supprimer le marqueur #${index + 1} (Ordre: ${marker.ordre})?`)) {
                deleteMarker(scopeId, marker.id);
            }
        });

        wrapper.appendChild(markerEl);
    });
}

/**
 * Supprime un marqueur
 * @param {string} scopeId - ID du scope
 * @param {string} markerId - ID du marqueur
 * @returns {Promise<void>}
 */
async function deleteMarker(scopeId, markerId) {
    const scopeData = scopeMarkers[scopeId];
    if (!scopeData || !scopeData.plans) return;

    const currentPlan = scopeData.plans[scopeData.currentPlanIndex];
    if (!currentPlan) return;

    currentPlan.markers = currentPlan.markers.filter(m => m.id !== markerId);
    await saveScopeMarkers();

    // Rafraîchir l'affichage et le sélecteur de travaux
    await renderWorkSelector(scopeId);
    displayCurrentPlan(scopeId);

    console.log(`[SCOPE-MARKERS] Marqueur ${markerId} supprimé`);
}

/**
 * Supprime le plan actuellement affiché et tous ses marqueurs
 * @param {string} scopeId - ID du scope
 * @returns {Promise<void>}
 */
export async function clearScopePlan(scopeId) {
    const scopeData = scopeMarkers[scopeId];
    if (!scopeData || !scopeData.plans || scopeData.plans.length === 0) return;

    const currentPlan = scopeData.plans[scopeData.currentPlanIndex];
    if (confirm(`Êtes-vous sûr de vouloir supprimer le plan "${currentPlan.name}" et tous ses marqueurs ?`)) {
        scopeData.plans.splice(scopeData.currentPlanIndex, 1);

        // Ajuster l'index si nécessaire
        if (scopeData.currentPlanIndex >= scopeData.plans.length) {
            scopeData.currentPlanIndex = Math.max(0, scopeData.plans.length - 1);
        }

        await saveScopeMarkers();
        renderPlanSelector(scopeId);
        await renderWorkSelector(scopeId);
        displayCurrentPlan(scopeId);

        console.log(`[SCOPE-MARKERS] Plan "${currentPlan.name}" supprimé`);
    }
}

/**
 * Exporte les marqueurs d'un scope
 * @param {string} scopeId - ID du scope
 * @returns {Object} Données des marqueurs
 */
export function exportScopeMarkers(scopeId) {
    return scopeMarkers[scopeId] || { plans: [], currentPlanIndex: 0 };
}

/**
 * Affiche le sélecteur de plans
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
function renderPlanSelector(scopeId) {
    const container = document.getElementById(`${scopeId}-plan-selector`);
    if (!container) return;

    const scopeData = scopeMarkers[scopeId];
    if (!scopeData || !scopeData.plans || scopeData.plans.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 0.9em;">Aucun plan chargé</p>';
        return;
    }

    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <label style="font-weight: 600;">Plans disponibles:</label>
            <select id="${scopeId}-plan-dropdown" onchange="window.scopeMarkersActions.switchPlan('${scopeId}', parseInt(this.value))"
                    style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-width: 200px;">
                ${scopeData.plans.map((plan, index) => `
                    <option value="${index}" ${index === scopeData.currentPlanIndex ? 'selected' : ''}>
                        ${plan.name} (${plan.markers.length} marqueurs)
                    </option>
                `).join('')}
            </select>
            <button onclick="window.scopeMarkersActions.zoomIn('${scopeId}')"
                    style="padding: 6px 12px; background: #4a7c59; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🔍+ Zoom
            </button>
            <button onclick="window.scopeMarkersActions.zoomOut('${scopeId}')"
                    style="padding: 6px 12px; background: #4a7c59; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🔍− Dézoom
            </button>
            <button onclick="window.scopeMarkersActions.resetZoom('${scopeId}')"
                    style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                ↺ Réinitialiser
            </button>
        </div>
    `;
}

/**
 * Affiche le sélecteur de travaux
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
export async function renderWorkSelector(scopeId) {
    const container = document.getElementById(`${scopeId}-work-selector-container`);
    if (!container) return;

    const availableWorks = await getAvailableWorks(scopeId);

    if (availableWorks.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 0.9em;">Tous les travaux ont été placés ou aucune donnée IW37N disponible</p>';
        return;
    }

    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-weight: 600;">Sélectionner un travail à placer:</label>
            <select id="${scopeId}-work-selector"
                    style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; max-width: 600px;">
                <option value="">-- Choisir un travail --</option>
                ${availableWorks.map(work => `
                    <option value='${JSON.stringify({ordre: work.ordre, operation: work.operation, designation: work.designation})}'>
                        ${work.ordre} - ${work.designation}
                    </option>
                `).join('')}
            </select>
            <span style="color: #666; font-size: 0.9em;">${availableWorks.length} travaux disponibles</span>
        </div>
    `;
}

/**
 * Récupère la liste des travaux disponibles (filtrés par poste technique et non encore placés)
 * @param {string} scopeId - ID du scope
 * @returns {Promise<Array>} Liste des travaux disponibles
 */
async function getAvailableWorks(scopeId) {
    // Récupérer les données IW37N depuis la mémoire (déjà chargées par le serveur)
    const iw37nData = window.getIw37nData ? window.getIw37nData() : null;
    if (!iw37nData) return [];

    try {
        const allWorks = iw37nData;

        // Obtenir les filtres de postes techniques pour cette page (await car c'est async)
        const activeFilters = await getScopeFilters(scopeId);

        console.log(`[SCOPE-MARKERS] Filtres actifs pour ${scopeId}:`, activeFilters);

        // Si aucun filtre actif, retourner une liste vide (il faut sélectionner des postes techniques)
        if (!activeFilters || activeFilters.length === 0) {
            console.log(`[SCOPE-MARKERS] Aucun filtre actif pour ${scopeId}, liste vide`);
            return [];
        }

        // Récupérer tous les ordres déjà placés dans tous les plans de ce scope
        const scopeData = scopeMarkers[scopeId];
        const placedOrdres = new Set();

        if (scopeData && scopeData.plans) {
            scopeData.plans.forEach(plan => {
                if (plan.markers) {
                    plan.markers.forEach(marker => {
                        placedOrdres.add(marker.ordre);
                    });
                }
            });
        }

        // Fonction pour extraire le poste technique (même logique que dans index.js)
        const getPosteTechnique = (row) => {
            const knownVariants = [
                'POSTE TECHNIQUE',
                'Poste technique',
                'PosteTechnique',
                'Poste Technique',
                'poste technique',
                'postetechnique',
                'Post. Tech.',
                'Post.Tech.',
                'Poste tech',
                'Poste Tech'
            ];

            for (const variant of knownVariants) {
                if (row[variant]) {
                    return row[variant].toString().trim();
                }
            }

            const keys = Object.keys(row);
            const foundKey = keys.find(key => {
                const lowerKey = key.toLowerCase();
                return lowerKey.includes('poste') && lowerKey.includes('tech');
            });

            if (foundKey && row[foundKey]) {
                return row[foundKey].toString().trim();
            }

            return '';
        };

        // Filtrer les travaux selon:
        // 1. Les postes techniques sélectionnés (ceux visibles dans le tableau)
        // 2. Les travaux non encore placés
        const filteredWorks = allWorks.filter(work => {
            const ordre = work['Ordre'] || work['ordre'] || '';
            if (!ordre) return false;

            // Vérifier si le travail n'est pas déjà placé
            if (placedOrdres.has(ordre)) return false;

            // Vérifier que le poste technique est dans les filtres actifs
            const posteTech = getPosteTechnique(work);
            return activeFilters.includes(posteTech);
        }).map(work => ({
            ordre: work['Ordre'] || work['ordre'] || '',
            operation: work['Opération'] || work['operation'] || '',
            designation: work['Désign. opér.'] || work['Désign.opération'] || work['Design operation'] || work['Design. Opération'] || ''
        }));

        console.log(`[SCOPE-MARKERS] ${filteredWorks.length} travaux disponibles pour ${scopeId}`);
        return filteredWorks;

    } catch (error) {
        console.error('[SCOPE-MARKERS] Erreur lors du chargement des travaux:', error);
        return [];
    }
}

/**
 * Change le plan affiché
 * @param {string} scopeId - ID du scope
 * @param {number} planIndex - Index du plan à afficher
 * @returns {Promise<void>}
 */
export async function switchPlan(scopeId, planIndex) {
    const scopeData = scopeMarkers[scopeId];
    if (!scopeData || !scopeData.plans || planIndex < 0 || planIndex >= scopeData.plans.length) return;

    scopeData.currentPlanIndex = planIndex;
    await saveScopeMarkers();
    await renderWorkSelector(scopeId);
    displayCurrentPlan(scopeId);

    console.log(`[SCOPE-MARKERS] Passage au plan ${planIndex}`);
}

/**
 * Zoom avant sur le plan
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
export function zoomIn(scopeId) {
    zoomLevel = Math.min(zoomLevel + 0.25, 3);
    displayCurrentPlan(scopeId);
}

/**
 * Zoom arrière sur le plan
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
export function zoomOut(scopeId) {
    zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
    displayCurrentPlan(scopeId);
}

/**
 * Réinitialise le zoom et le pan
 * @param {string} scopeId - ID du scope
 * @returns {void}
 */
export function resetZoom(scopeId) {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    displayCurrentPlan(scopeId);
}
