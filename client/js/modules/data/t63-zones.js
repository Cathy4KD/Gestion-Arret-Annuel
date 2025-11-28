/**
 * @fileoverview Gestion des Zones d'Entreposage et Plans de Localisation (T63)
 * @module data/t63-zones
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Données des plans
 * @type {Array}
 */
let plansData = [];

/**
 * Plan actuellement sélectionné pour annotation
 * @type {Object|null}
 */
let currentPlan = null;

/**
 * Chargement des données
 */
export async function loadZonesData() {
    const saved = await loadFromStorage('zonesEntreposageData');
    if (saved && Array.isArray(saved)) {
        plansData = saved;
        console.log(`[ZONES] ${plansData.length} plan(s) chargé(s) depuis le serveur`);
    } else {
        plansData = [];
        console.log('[ZONES] Aucun plan sauvegardé trouvé');
    }

    // Ne rendre le conteneur que si l'élément existe dans le DOM (page déjà affichée)
    const container = document.getElementById('zonesPlansContainer');
    if (container) {
        console.log('[ZONES] Container trouvé dans le DOM, rendu...');
        renderPlansContainer();
    } else {
        console.log('[ZONES] Container non trouvé (page non affichée), rendu différé');
    }
}

/**
 * Sauvegarde des données
 */
async function saveZonesData() {
    await saveToStorage('zonesEntreposageData', plansData);
    console.log('[ZONES] Données sauvegardées');
}

/**
 * Upload d'une image de plan
 */
export function handleZonesImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('⚠️ Veuillez sélectionner une image valide');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const newPlan = {
            id: 't63-plan-' + Date.now(),
            name: file.name,
            imageData: e.target.result,
            zones: [],
            createdAt: new Date().toISOString()
        };

        plansData.push(newPlan);
        await saveZonesData();
        renderPlansContainer();
        alert(`✅ Plan "${file.name}" ajouté avec succès !`);
    };

    reader.readAsDataURL(file);
}

/**
 * Rend le conteneur des plans
 */
function renderPlansContainer() {
    const container = document.getElementById('zonesPlansContainer');
    if (!container) return;

    if (plansData.length === 0) {
        container.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                <div style="font-size: 3em; margin-bottom: 15px;">📋</div>
                <div style="color: #666; font-size: 1.1em;">Aucun plan ajouté</div>
                <div style="color: #999; margin-top: 10px;">Cliquez sur "➕ Ajouter un Plan" pour commencer</div>
            </div>
        `;
        return;
    }

    container.innerHTML = plansData.map(plan => `
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0; color: #667eea;">📐 ${plan.name}</h3>
                    <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                        ${plan.zones.length} zone(s) définie(s) • Créé le ${new Date(plan.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="editPlan('${plan.id}')"
                            style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        ✏️ Annoter
                    </button>
                    <button onclick="deletePlan('${plan.id}')"
                            style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>

            <!-- Miniature du plan -->
            <div style="max-width: 300px; max-height: 200px; overflow: hidden; border: 2px solid #dee2e6; border-radius: 5px; margin-bottom: 15px;">
                <img src="${plan.imageData}" alt="${plan.name}" style="width: 100%; height: auto;">
            </div>

            <!-- Liste des zones -->
            ${plan.zones.length > 0 ? `
                <div style="margin-top: 15px;">
                    <h4 style="color: #667eea; margin-bottom: 10px;">Zones définies:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px;">
                        ${plan.zones.map((zone, idx) => `
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid ${zone.color || '#667eea'};">
                                <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${zone.label || 'Zone ' + (idx + 1)}</div>
                                <div style="font-size: 0.85em; color: #666;">${zone.commentaire || 'Aucun commentaire'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

/**
 * Éditer un plan (ouvrir l'éditeur d'annotations)
 */
export function editPlan(planId) {
    const plan = plansData.find(p => p.id === planId);
    if (!plan) return;

    currentPlan = plan;
    openAnnotationEditor(plan);
}

/**
 * Supprimer un plan
 */
export async function deletePlan(planId) {
    if (!confirm('Voulez-vous vraiment supprimer ce plan et toutes ses zones ?')) {
        return;
    }

    plansData = plansData.filter(p => p.id !== planId);
    await saveZonesData();
    renderPlansContainer();
    alert('✅ Plan supprimé');
}

/**
 * Ouvre l'éditeur d'annotations
 */
function openAnnotationEditor(plan) {
    // Créer une modale plein écran pour l'éditeur
    const modal = document.createElement('div');
    modal.id = 'annotationEditorModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
    `;

    modal.innerHTML = `
        <div style="background: #333; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #667eea;">
            <div style="color: white;">
                <h3 style="margin: 0;">📐 ${plan.name}</h3>
                <div style="font-size: 0.9em; opacity: 0.8; margin-top: 5px;">Cliquez et glissez pour dessiner une zone • Double-clic pour ajouter un commentaire</div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="clearAllZones" style="padding: 10px 20px; background: #ffc107; color: #333; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    🗑️ Effacer toutes les zones
                </button>
                <button id="saveAnnotations" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    💾 Sauvegarder
                </button>
                <button id="closeEditor" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    ✕ Fermer
                </button>
            </div>
        </div>

        <div style="flex: 1; overflow: auto; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="position: relative; display: inline-block;">
                <canvas id="annotationCanvas" style="border: 2px solid #667eea; cursor: crosshair; background: white;"></canvas>
            </div>
        </div>

        <div style="background: #333; padding: 10px; color: white; text-align: center; font-size: 0.9em;">
            💡 <strong>Instructions:</strong> Cliquez et glissez pour dessiner une zone rectangulaire •
            Double-cliquez sur une zone pour modifier son label et commentaire •
            Clic droit sur une zone pour la supprimer
        </div>
    `;

    document.body.appendChild(modal);

    // Initialiser le canvas
    initializeAnnotationCanvas(plan, modal);

    // Event listeners pour les boutons
    document.getElementById('closeEditor').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('saveAnnotations').addEventListener('click', async () => {
        await saveZonesData();
        alert('✅ Annotations sauvegardées !');
        modal.remove();
        renderPlansContainer();
    });

    document.getElementById('clearAllZones').addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment effacer toutes les zones ?')) {
            plan.zones = [];
            initializeAnnotationCanvas(plan, modal);
        }
    });
}

/**
 * Initialise le canvas d'annotation
 */
function initializeAnnotationCanvas(plan, modal) {
    const canvas = document.getElementById('annotationCanvas');
    const ctx = canvas.getContext('2d');

    // Charger l'image
    const img = new Image();
    img.onload = () => {
        // Définir la taille du canvas
        const maxWidth = window.innerWidth - 100;
        const maxHeight = window.innerHeight - 200;

        let scale = 1;
        if (img.width > maxWidth) {
            scale = maxWidth / img.width;
        }
        if (img.height * scale > maxHeight) {
            scale = maxHeight / img.height;
        }

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Variables pour le dessin
        let isDrawing = false;
        let startX, startY;
        let tempZone = null;

        function redraw() {
            // Dessiner l'image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Dessiner les zones existantes
            plan.zones.forEach((zone, idx) => {
                ctx.strokeStyle = zone.color || '#667eea';
                ctx.fillStyle = (zone.color || '#667eea') + '30'; // 30 = transparence
                ctx.lineWidth = 3;

                ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
                ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

                // Dessiner le label
                ctx.fillStyle = zone.color || '#667eea';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(zone.label || `Zone ${idx + 1}`, zone.x + 5, zone.y + 20);
            });

            // Dessiner la zone temporaire en cours de création
            if (tempZone) {
                ctx.strokeStyle = '#ffc107';
                ctx.fillStyle = '#ffc10730';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);

                ctx.fillRect(tempZone.x, tempZone.y, tempZone.width, tempZone.height);
                ctx.strokeRect(tempZone.x, tempZone.y, tempZone.width, tempZone.height);

                ctx.setLineDash([]);
            }
        }

        // Event: Mouse Down
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            isDrawing = true;
        });

        // Event: Mouse Move
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;

            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            tempZone = {
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                width: Math.abs(currentX - startX),
                height: Math.abs(currentY - startY)
            };

            redraw();
        });

        // Event: Mouse Up
        canvas.addEventListener('mouseup', (e) => {
            if (!isDrawing) return;
            isDrawing = false;

            if (tempZone && tempZone.width > 10 && tempZone.height > 10) {
                // Demander le label et commentaire
                const label = prompt('Nom de la zone:', `Zone ${plan.zones.length + 1}`);
                if (label === null) {
                    tempZone = null;
                    redraw();
                    return;
                }

                const commentaire = prompt('Commentaire (optionnel):');
                const colors = ['#667eea', '#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'];
                const color = colors[plan.zones.length % colors.length];

                plan.zones.push({
                    ...tempZone,
                    label: label || `Zone ${plan.zones.length + 1}`,
                    commentaire: commentaire || '',
                    color: color
                });

                tempZone = null;
                redraw();
            } else {
                tempZone = null;
                redraw();
            }
        });

        // Event: Double-click pour éditer une zone
        canvas.addEventListener('dblclick', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Trouver la zone cliquée
            const clickedZone = plan.zones.find(zone =>
                x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height
            );

            if (clickedZone) {
                const newLabel = prompt('Modifier le nom de la zone:', clickedZone.label);
                if (newLabel !== null) {
                    clickedZone.label = newLabel;
                }

                const newComment = prompt('Modifier le commentaire:', clickedZone.commentaire);
                if (newComment !== null) {
                    clickedZone.commentaire = newComment;
                }

                redraw();
            }
        });

        // Event: Right-click pour supprimer une zone
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Trouver la zone cliquée
            const clickedZoneIndex = plan.zones.findIndex(zone =>
                x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height
            );

            if (clickedZoneIndex !== -1) {
                if (confirm(`Supprimer la zone "${plan.zones[clickedZoneIndex].label}" ?`)) {
                    plan.zones.splice(clickedZoneIndex, 1);
                    redraw();
                }
            }
        });

        // Dessiner initialement
        redraw();
    };

    img.src = plan.imageData;
}

/**
 * Exporte les données
 */
export async function exportZonesData() {
    if (plansData.length === 0) {
        alert('⚠️ Aucun plan à exporter');
        return;
    }

    try {
        // Créer un rapport Excel avec les zones
        const exportData = [];

        plansData.forEach(plan => {
            plan.zones.forEach((zone, idx) => {
                exportData.push({
                    'Plan': plan.name,
                    'Zone': zone.label,
                    'Commentaire': zone.commentaire || '',
                    'Position X': zone.x.toFixed(0),
                    'Position Y': zone.y.toFixed(0),
                    'Largeur': zone.width.toFixed(0),
                    'Hauteur': zone.height.toFixed(0),
                    'Couleur': zone.color
                });
            });
        });

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Zones Entreposage');

        const fileName = `Zones_Entreposage_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[ZONES] Export Excel réussi:', fileName);
        alert(`✅ Export Excel réussi: ${fileName}`);
    } catch (error) {
        console.error('[ZONES] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données des zones
 */
export function getZonesData() {
    return plansData;
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.handleZonesImageUpload = handleZonesImageUpload;
    window.editPlan = editPlan;
    window.deletePlan = deletePlan;
    window.exportZonesData = exportZonesData;
    window.zonesActions = {
        loadZonesData,
        handleZonesImageUpload,
        editPlan,
        deletePlan,
        exportZonesData
    };
}

console.log('[ZONES] Module chargé');
