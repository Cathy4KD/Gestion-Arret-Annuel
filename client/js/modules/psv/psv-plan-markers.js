/**
 * @fileoverview PSV Plan Markers Module
 * Gestion des plans et marqueurs pour les PSV
 * @module psv/psv-plan-markers
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getPsvData } from '../data/psv-data.js';

/**
 * PSV Plans data structure
 * @type {Object}
 */
let psvPlans = {
    plans: [],
    currentPlanIndex: 0
};

/**
 * Zoom and pan state
 */
let zoomLevel = 1;
let panX = 0;
let panY = 0;

/**
 * Load PSV plans from storage
 */
export async function loadPSVPlans() {
    const saved = await loadFromStorage('psvPlans');
    if (saved) {
        psvPlans = saved;
        console.log('[PSV] ✅ Plans PSV chargés depuis le storage');
    } else {
        console.log('[PSV] ℹ️ Aucun plan PSV sauvegardé');
    }

    // Toujours initialiser les sélecteurs et le plan au chargement
    renderPlanSelector();
    displayCurrentPlan();
    renderPSVSelector();
}

/**
 * Save PSV plans to storage
 */
export async function savePSVPlans() {
    const success = await saveToStorage('psvPlans', psvPlans);
    if (success) {
        console.log('[PSV] ✅ Plans PSV sauvegardés sur le serveur');
    } else {
        console.error('[PSV] ❌ Échec de la sauvegarde des plans PSV');
    }
}

/**
 * Handle plan file upload
 * @param {Event} event - File input change event
 */
export function handlePSVPlanUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const fileType = file.type;

        if (fileType === 'application/pdf') {
            // Convert PDF to image using PDF.js
            await convertPDFToImage(e.target.result, file.name);
        } else if (fileType.startsWith('image/')) {
            // Direct image upload
            await addPlan(file.name, e.target.result);
        } else {
            console.error('[PSV] ❌ Type de fichier non supporté');
        }
    };

    if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsDataURL(file);
    }
}

/**
 * Convert PDF to image using PDF.js
 * @param {ArrayBuffer} pdfData - PDF data
 * @param {string} fileName - Original file name
 */
async function convertPDFToImage(pdfData, fileName) {
    try {
        // Vérifier si PDF.js est disponible
        if (typeof pdfjsLib === 'undefined') {
            alert('❌ PDF.js n\'est pas chargé.\n\nVeuillez utiliser des images (PNG, JPG) au lieu de PDF pour le moment.');
            console.error('[PSV] ❌ PDF.js n\'est pas disponible. Utilisez des images à la place.');
            return;
        }

        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        const imageUrl = canvas.toDataURL('image/png');
        await addPlan(fileName, imageUrl);

    } catch (error) {
        console.error('[PSV] ❌ Erreur conversion PDF:', error);
        alert('❌ Erreur lors de la conversion du PDF.\n\nVeuillez utiliser une image (PNG, JPG) à la place.');
    }
}

/**
 * Add a new plan
 * @param {string} fileName - Plan file name
 * @param {string} imageUrl - Plan image data URL
 */
async function addPlan(fileName, imageUrl) {
    const newPlan = {
        id: 'plan-' + Date.now(),
        name: fileName,
        imageUrl: imageUrl,
        markers: []
    };

    psvPlans.plans.push(newPlan);
    psvPlans.currentPlanIndex = psvPlans.plans.length - 1;

    await savePSVPlans();
    renderPlanSelector();
    displayCurrentPlan();
    renderPSVSelector();

    console.log('[PSV] ✅ Plan PSV ajouté:', fileName);
}

/**
 * Render plan selector dropdown
 */
function renderPlanSelector() {
    const container = document.getElementById('psv-plan-selector');
    if (!container) return;

    if (!psvPlans.plans || psvPlans.plans.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Aucun plan importé</p>';
        return;
    }

    const currentPlan = psvPlans.plans[psvPlans.currentPlanIndex];

    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <label style="font-weight: bold;">Plan actuel:</label>
            <select onchange="switchPSVPlan(parseInt(this.value))"
                    style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 5px; flex: 1;">
                ${psvPlans.plans.map((plan, index) => `
                    <option value="${index}" ${index === psvPlans.currentPlanIndex ? 'selected' : ''}>
                        ${plan.name}
                    </option>
                `).join('')}
            </select>
            <button onclick="clearPSVPlan()"
                    style="padding: 5px 15px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🗑️ Supprimer ce plan
            </button>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <button onclick="zoomInPSV()"
                    style="padding: 5px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🔍+ Zoom
            </button>
            <button onclick="zoomOutPSV()"
                    style="padding: 5px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🔍- Zoom
            </button>
            <button onclick="resetZoomPSV()"
                    style="padding: 5px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🔄 Réinitialiser
            </button>
        </div>
    `;
}

/**
 * Render PSV selector dropdown
 */
function renderPSVSelector() {
    const container = document.getElementById('psv-selector-container');
    if (!container) return;

    if (!psvPlans.plans || psvPlans.plans.length === 0) {
        container.innerHTML = '';
        return;
    }

    const availablePSVs = getAvailablePSVs();

    if (availablePSVs.length === 0) {
        container.innerHTML = `
            <div style="padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; color: #155724;">
                ✅ Tous les PSV ont été placés sur les plans
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="margin-bottom: 10px;">
            <label style="font-weight: bold; display: block; margin-bottom: 5px;">
                PSV disponibles à placer (${availablePSVs.length}):
            </label>
            <select id="psv-selector"
                    style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 100%; font-size: 14px;">
                <option value="">-- Sélectionnez un PSV à placer --</option>
                ${availablePSVs.map(psv => `
                    <option value="${psv.ordre}">
                        ${psv.ordre} - ${psv.designOperation}
                    </option>
                `).join('')}
            </select>
            <p style="color: #666; font-size: 12px; margin-top: 5px;">
                💡 Cliquez sur le plan pour placer le PSV sélectionné
            </p>
        </div>
    `;
}

/**
 * Get available PSVs that haven't been placed yet
 * @returns {Array} Available PSVs
 */
function getAvailablePSVs() {
    const allPSVs = getPsvData();
    if (!allPSVs || allPSVs.length === 0) return [];

    const placedOrdres = new Set();

    // Collect all placed PSV ordres from all plans
    if (psvPlans && psvPlans.plans) {
        psvPlans.plans.forEach(plan => {
            if (plan.markers) {
                plan.markers.forEach(marker => {
                    placedOrdres.add(marker.ordre);
                });
            }
        });
    }

    // Filter out already placed PSVs
    return allPSVs.filter(psv => {
        return psv.ordre && !placedOrdres.has(psv.ordre);
    });
}

/**
 * Display current plan with markers
 */
function displayCurrentPlan() {
    const planContainer = document.getElementById('psv-plan-container');
    if (!planContainer) return;

    if (!psvPlans.plans || psvPlans.plans.length === 0) {
        planContainer.innerHTML = '<p style="color: #666; font-style: italic;">Aucun plan à afficher</p>';
        return;
    }

    const currentPlan = psvPlans.plans[psvPlans.currentPlanIndex];

    planContainer.innerHTML = `
        <div style="position: relative; overflow: auto; max-width: 100%; max-height: 800px; border: 2px solid #ddd; border-radius: 5px;">
            <img src="${currentPlan.imageUrl}"
                 id="psv-plan-image"
                 onclick="handlePSVImageClick(event)"
                 style="display: block; transform: scale(${zoomLevel}) translate(${panX}px, ${panY}px); transform-origin: top left; cursor: crosshair; max-width: none;">
            <div id="psv-markers-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
                ${renderMarkers(currentPlan.markers)}
            </div>
        </div>
    `;
}

/**
 * Render markers HTML
 * @param {Array} markers - Array of markers
 * @returns {string} HTML string
 */
function renderMarkers(markers) {
    if (!markers || markers.length === 0) return '';

    return markers.map(marker => `
        <div style="position: absolute; left: ${marker.x}%; top: ${marker.y}%; transform: translate(-50%, -100%); pointer-events: auto;">
            <div style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                ${marker.ordre}
                <button onclick="deletePSVMarker('${marker.id}')"
                        style="margin-left: 5px; background: white; color: #dc3545; border: none; border-radius: 3px; cursor: pointer; padding: 2px 5px; font-size: 10px;">×</button>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 8px solid #dc3545; margin: 0 auto;"></div>
        </div>
    `).join('');
}

/**
 * Handle image click to place marker
 * @param {Event} event - Click event
 */
export async function handlePSVImageClick(event) {
    if (!psvPlans.plans || psvPlans.plans.length === 0) return;

    const selector = document.getElementById('psv-selector');
    if (!selector || !selector.value) {
        console.log('[PSV] ℹ️ Veuillez sélectionner un PSV à placer');
        return;
    }

    const selectedOrdre = selector.value;
    const allPSVs = getPsvData();
    const selectedPSV = allPSVs.find(psv => psv.ordre === selectedOrdre);

    if (!selectedPSV) {
        console.error('[PSV] ❌ PSV non trouvé');
        return;
    }

    const img = event.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const currentPlan = psvPlans.plans[psvPlans.currentPlanIndex];
    if (!currentPlan.markers) {
        currentPlan.markers = [];
    }

    currentPlan.markers.push({
        id: 'marker-' + Date.now(),
        ordre: selectedPSV.ordre,
        designOperation: selectedPSV.designOperation,
        x: x,
        y: y
    });

    await savePSVPlans();
    displayCurrentPlan();
    renderPSVSelector();

    console.log('[PSV] ✅ Marqueur PSV ajouté:', selectedPSV.ordre);
}

/**
 * Delete a marker
 * @param {string} markerId - Marker ID
 */
export async function deletePSVMarker(markerId) {
    if (!psvPlans.plans || psvPlans.plans.length === 0) return;

    const currentPlan = psvPlans.plans[psvPlans.currentPlanIndex];
    if (!currentPlan.markers) return;

    currentPlan.markers = currentPlan.markers.filter(m => m.id !== markerId);

    await savePSVPlans();
    displayCurrentPlan();
    renderPSVSelector();

    console.log('[PSV] ✅ Marqueur PSV supprimé');
}

/**
 * Switch to a different plan
 * @param {number} planIndex - Plan index
 */
export async function switchPSVPlan(planIndex) {
    if (!psvPlans.plans || planIndex < 0 || planIndex >= psvPlans.plans.length) return;

    psvPlans.currentPlanIndex = planIndex;
    await savePSVPlans();
    displayCurrentPlan();

    console.log('[PSV] ✅ Plan PSV changé:', psvPlans.plans[planIndex].name);
}

/**
 * Clear current plan
 */
export async function clearPSVPlan() {
    if (!psvPlans.plans || psvPlans.plans.length === 0) return;

    psvPlans.plans.splice(psvPlans.currentPlanIndex, 1);

    if (psvPlans.plans.length > 0) {
        psvPlans.currentPlanIndex = Math.max(0, psvPlans.currentPlanIndex - 1);
    } else {
        psvPlans.currentPlanIndex = 0;
    }

    await savePSVPlans();
    renderPlanSelector();
    displayCurrentPlan();
    renderPSVSelector();

    console.log('[PSV] ✅ Plan PSV supprimé');
}

/**
 * Zoom in
 */
export function zoomInPSV() {
    zoomLevel = Math.min(zoomLevel + 0.25, 3);
    displayCurrentPlan();
}

/**
 * Zoom out
 */
export function zoomOutPSV() {
    zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
    displayCurrentPlan();
}

/**
 * Reset zoom and pan
 */
export function resetZoomPSV() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    displayCurrentPlan();
}
