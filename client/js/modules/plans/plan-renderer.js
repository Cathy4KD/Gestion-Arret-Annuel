/**
 * @fileoverview Module de rendu des plans d'usine
 * @module plans/plan-renderer
 *
 * @description
 * Gère l'affichage et l'interaction avec les plans d'usine interactifs
 * Source: lignes 17659-18490 du fichier HTML original
 *
 * @exports {Function} loadPlanData
 * @exports {Function} renderPlansList
 * @exports {Function} openPlanInEdition
 * @exports {Function} openPlanInLecture
 * @exports {Function} placeEquipmentMarker
 * @exports {Function} renderMarkersEdition
 * @exports {Function} savePlanEdition
 */

let planData = {
    plans: [],
    currentPlan: null,
    editMode: false
};

/**
 * DÉSACTIVÉ - Les plans ne sont plus stockés en localStorage
 * @returns {void}
 * @source Ligne 17659
 */
export function loadPlanData() {
    console.log('[PLAN-RENDERER] ℹ️ localStorage désactivé - aucun plan à charger');
    planData = { plans: [], currentPlan: null, editMode: false };
    renderPlansList();
}

/**
 * DÉSACTIVÉ - Les plans ne peuvent plus être sauvegardés en localStorage
 * Les images doivent être uploadées sur le serveur via /api/files/upload
 * @returns {void}
 * @source Ligne 17687
 */
export function savePlanData() {
    console.error('[PLAN-RENDERER] ❌ ERREUR: localStorage désactivé pour les plans');
    console.error('[PLAN-RENDERER] ℹ️ Utilisez /api/files/upload pour uploader les images sur le serveur');
    alert('❌ ERREUR: Le stockage local des plans est désactivé.\n\nLes images doivent être uploadées sur le serveur.\nVeuillez contacter l\'administrateur système.');
}

/**
 * Charge une image de plan
 * @param {File} file - Fichier image
 * @returns {Promise<string>} Data URL de l'image
 * @source Ligne 17875
 */
export async function loadPlanImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Aucun fichier sélectionné'));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                console.log(`[OK] Image chargée: ${img.width}x${img.height}`);
                resolve(e.target.result);
            };
            img.onerror = function () {
                reject(new Error('Erreur chargement image'));
            };
            img.src = e.target.result;
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Affiche la liste des plans
 * @returns {void}
 * @source Ligne 17969
 */
export function renderPlansList() {
    const container = document.getElementById('plansListContainer');
    if (!container) return;

    if (!planData.plans || planData.plans.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <p>Aucun plan disponible. Chargez une image de plan pour commencer.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    planData.plans.forEach((plan, index) => {
        const planCard = document.createElement('div');
        planCard.className = 'plan-card';
        planCard.style.cssText = 'background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;';

        planCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">${plan.nom || `Plan ${index + 1}`}</h3>
                    <div style="color: #666; font-size: 0.9em;">
                        ${plan.markers ? plan.markers.length : 0} équipements placés
                    </div>
                </div>
                <div>
                    <button onclick="openPlanInEdition('${plan.id}')"
                            style="padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                         Éditer
                    </button>
                    <button onclick="openPlanInLecture('${plan.id}')"
                            style="padding: 8px 15px; background: #48bb78; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                         Voir
                    </button>
                    <button onclick="deletePlan('${plan.id}')"
                            style="padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        [DELETE]
                    </button>
                </div>
            </div>
        `;

        container.appendChild(planCard);
    });
}

/**
 * Ouvre un plan en mode édition
 * @param {string} planId - ID du plan
 * @returns {void}
 * @source Ligne 18041
 */
export function openPlanInEdition(planId) {
    const plan = planData.plans.find(p => p.id === planId);
    if (!plan) {
        alert('[ERROR] Plan non trouvé');
        return;
    }

    planData.currentPlan = plan;
    planData.editMode = true;

    // Afficher le mode édition
    const editionContainer = document.getElementById('planEditionContainer');
    if (editionContainer) {
        editionContainer.style.display = 'block';

        const canvas = document.getElementById('planEditionCanvas');
        const img = document.getElementById('planEditionImage');

        if (img && canvas) {
            img.src = plan.imageData;
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                renderMarkersEdition();
            };
        }
    }

    console.log(` Plan ouvert en édition: ${plan.nom}`);
}

/**
 * Ouvre un plan en mode lecture
 * @param {string} planId - ID du plan
 * @returns {void}
 * @source Ligne 18350
 */
export function openPlanInLecture(planId) {
    const plan = planData.plans.find(p => p.id === planId);
    if (!plan) {
        alert('[ERROR] Plan non trouvé');
        return;
    }

    planData.currentPlan = plan;
    planData.editMode = false;

    // Afficher le mode lecture
    const lectureContainer = document.getElementById('planLectureContainer');
    if (lectureContainer) {
        lectureContainer.style.display = 'block';

        const canvas = document.getElementById('planLectureCanvas');
        const img = document.getElementById('planLectureImage');

        if (img && canvas) {
            img.src = plan.imageData;
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                renderMarkersLecture();
            };
        }
    }

    console.log(` Plan ouvert en lecture: ${plan.nom}`);
}

/**
 * Place un marqueur d'équipement sur le plan
 * @param {string} posteTechnique - Nom du poste technique
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @returns {void}
 * @source Ligne 18176
 */
export function placeEquipmentMarker(posteTechnique, x, y) {
    if (!planData.currentPlan) return;

    const marker = {
        id: `marker-${Date.now()}`,
        posteTechnique: posteTechnique,
        x: x,
        y: y,
        visible: true
    };

    if (!planData.currentPlan.markers) {
        planData.currentPlan.markers = [];
    }

    planData.currentPlan.markers.push(marker);
    renderMarkersEdition();
    savePlanData();

    console.log(` Marqueur placé: ${posteTechnique} à (${x}, ${y})`);
}

/**
 * Affiche les marqueurs en mode édition
 * @returns {void}
 * @source Ligne 18228
 */
export function renderMarkersEdition() {
    if (!planData.currentPlan) return;

    const canvas = document.getElementById('planEditionCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!planData.currentPlan.markers) return;

    planData.currentPlan.markers.forEach(marker => {
        if (!marker.visible) return;

        // Dessiner le marqueur
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;

        // Cercle
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Texte
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(marker.posteTechnique, marker.x + 25, marker.y + 5);
    });
}

/**
 * Affiche les marqueurs en mode lecture
 * @returns {void}
 * @source Ligne 18386
 */
export function renderMarkersLecture() {
    renderMarkersEdition(); // Même logique pour l'instant
}

/**
 * Sauvegarde l'édition du plan
 * @returns {void}
 * @source Ligne 18318
 */
export function savePlanEdition() {
    savePlanData();
    alert('[OK] Plan sauvegardé avec succès');
}

/**
 * Supprime un plan
 * @param {string} planId - ID du plan
 * @returns {void}
 * @source Ligne 18010
 */
export function deletePlan(planId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
        planData.plans = planData.plans.filter(p => p.id !== planId);
        savePlanData();
        renderPlansList();
        console.log('[DELETE] Plan supprimé');
    }
}

export function getPlanData() {
    return planData;
}
