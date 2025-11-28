/**
 * @fileoverview Gestion des équipements en location avec plan de localisation
 * @module data/equip-location-data
 *
 * @description
 * Gère les réservations d'équipements en location (roulottes, génératrices, etc.)
 * avec un tableau de gestion et un plan de localisation interactif avec canvas
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clés de stockage
 * @const {string}
 */
const STORAGE_KEY_EQUIPEMENTS = 'equipLocationData';
const STORAGE_KEY_PLAN = 'equipLocationPlanData';

/**
 * Données des équipements en location
 * @type {Array}
 */
let equipementsData = [];

/**
 * Données du plan (canvas)
 * @type {Object}
 */
let planData = {
    planImage: null, // Base64 de l'image de plan
    zones: [] // Zones dessinées sur le plan
};

// Variables canvas
let canvas, ctx;
let currentTool = 'select';
let currentColor = '#ff0000';
let currentThickness = 3;
let isDrawing = false;
let selectedZone = null;
let dragStart = null;
let tempZone = null;
let eventsAttached = false; // Flag pour éviter d'attacher les événements plusieurs fois

/**
 * Initialise le module
 */
export function initEquipLocationModule() {
    console.log('[EQUIP-LOCATION] Initialisation du module...');
    console.log('[EQUIP-LOCATION] Recherche du canvas dans le DOM...');

    canvas = document.getElementById('equipLocationPlanCanvas');

    if (canvas) {
        console.log('[EQUIP-LOCATION] ✅ Canvas trouvé:', canvas);
        ctx = canvas.getContext('2d');

        if (ctx) {
            console.log('[EQUIP-LOCATION] ✅ Contexte 2D obtenu');
            setupCanvasEvents();
            console.log('[EQUIP-LOCATION] ✅ Événements canvas configurés');
        } else {
            console.error('[EQUIP-LOCATION] ❌ Impossible d\'obtenir le contexte 2D du canvas');
        }
    } else {
        console.error('[EQUIP-LOCATION] ❌ Canvas non trouvé dans le DOM');
        console.error('[EQUIP-LOCATION] Vérifiez que l\'élément <canvas id="equipLocationPlanCanvas"> existe dans la page');

        // Afficher les éléments disponibles pour debug
        const allCanvases = document.querySelectorAll('canvas');
        console.log('[EQUIP-LOCATION] Canvas disponibles dans la page:', allCanvases.length);
        allCanvases.forEach((c, i) => {
            console.log(`  [${i}] Canvas ID: "${c.id}", classe: "${c.className}"`);
        });
    }

    loadEquipLocationData();
}

/**
 * Charge les données depuis le SERVEUR uniquement
 * @returns {Promise<void>}
 */
export async function loadEquipLocationData() {
    // Charger les équipements
    const savedEquipements = await loadFromStorage(STORAGE_KEY_EQUIPEMENTS);
    if (savedEquipements) {
        equipementsData = savedEquipements;
        console.log(`[EQUIP-LOCATION] ${equipementsData.length} équipements chargés depuis le serveur`);
    }

    // Charger le plan
    const savedPlan = await loadFromStorage(STORAGE_KEY_PLAN);
    if (savedPlan) {
        planData = savedPlan;
        // S'assurer que planData.zones existe
        if (!planData.zones) {
            planData.zones = [];
        }
        console.log('[EQUIP-LOCATION] Plan chargé depuis le serveur');
        console.log(`[EQUIP-LOCATION] - Image: ${planData.planImage ? 'Oui' : 'Non'}`);
        console.log(`[EQUIP-LOCATION] - Zones: ${planData.zones.length}`);

        // Restaurer l'image du plan
        if (planData.planImage && canvas && ctx) {
            const img = new Image();
            // Capturer canvas et ctx dans la closure
            const savedCanvas = canvas;
            const savedCtx = ctx;

            img.onload = function() {
                try {
                    // Vérifier à nouveau que ctx est disponible
                    if (!savedCtx || !savedCanvas) {
                        console.warn('[EQUIP-LOCATION] Context perdu lors du chargement de l\'image');
                        return;
                    }
                    savedCtx.clearRect(0, 0, savedCanvas.width, savedCanvas.height);
                    savedCtx.drawImage(img, 0, 0, savedCanvas.width, savedCanvas.height);
                    redrawZones();
                    hidePlaceholder();
                    console.log('[EQUIP-LOCATION] ✅ Image du plan restaurée');
                } catch (error) {
                    console.error('[EQUIP-LOCATION] Erreur lors du dessin de l\'image:', error);
                }
            };
            img.onerror = function() {
                console.error('[EQUIP-LOCATION] Erreur lors du chargement de l\'image du plan');
            };
            img.src = planData.planImage;
        } else if (!canvas || !ctx) {
            console.warn('[EQUIP-LOCATION] Canvas non disponible, impossible de restaurer le plan');
        }
    }

    renderEquipementsTable();
    renderZonesTable();
}

/**
 * Sauvegarde les équipements sur le SERVEUR uniquement
 * @returns {Promise<void>}
 */
async function saveEquipementsData() {
    await saveToStorage(STORAGE_KEY_EQUIPEMENTS, equipementsData);
    console.log('[EQUIP-LOCATION] Équipements sauvegardés sur le serveur');
}

/**
 * Sauvegarde le plan sur le SERVEUR uniquement
 * @returns {Promise<void>}
 */
async function savePlanData() {
    await saveToStorage(STORAGE_KEY_PLAN, planData);
    console.log('[EQUIP-LOCATION] Plan sauvegardé sur le serveur');
}

// ========== GESTION DES ÉQUIPEMENTS ==========

/**
 * Ajoute un équipement (ligne vide)
 */
function addEquipement() {
    const newEquip = {
        id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entrepreneur: '',
        nombre: '',
        dimension: '',
        commentaire: ''
    };

    equipementsData.push(newEquip);
    saveEquipementsData();
    renderEquipementsTable();

    console.log('[EQUIP-LOCATION] Nouvelle ligne ajoutée');
}

/**
 * Met à jour un champ d'équipement
 */
function updateEquipementField(equipId, field, value) {
    const equip = equipementsData.find(e => e.id === equipId);
    if (equip) {
        equip[field] = value;
        saveEquipementsData();
    }
}

/**
 * Supprime un équipement
 */
function deleteEquipement(equipId) {
    const equip = equipementsData.find(e => e.id === equipId);
    if (!equip) return;

    if (!confirm(`Voulez-vous vraiment supprimer l'équipement "${equip.entrepreneur}" ?`)) {
        return;
    }

    equipementsData = equipementsData.filter(e => e.id !== equipId);
    saveEquipementsData();
    renderEquipementsTable();

    console.log('[EQUIP-LOCATION] Équipement supprimé:', equip.entrepreneur);
}

/**
 * Échappe les caractères HTML pour éviter les injections et erreurs de syntaxe
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Rend le tableau des équipements
 */
function renderEquipementsTable() {
    const tbody = document.getElementById('equipLocationTableBody');
    const countSpan = document.getElementById('equipLocationCount');

    if (!tbody) {
        console.warn('[EQUIP-LOCATION] Element equipLocationTableBody non trouvé');
        return;
    }

    const totalCount = equipementsData.length;
    if (countSpan) countSpan.textContent = totalCount;

    if (equipementsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucun équipement enregistré. Cliquez sur "Ajouter Équipement" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    equipementsData.forEach((equip, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        // Échapper toutes les valeurs utilisateur pour éviter les erreurs de syntaxe
        const escapedEntrepreneur = escapeHtml(equip.entrepreneur || '');
        const escapedNombre = escapeHtml(equip.nombre || '');
        const escapedDimension = escapeHtml(equip.dimension || '');
        const escapedCommentaire = escapeHtml(equip.commentaire || '');

        row.innerHTML = `
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${escapedEntrepreneur}"
                       onchange="window.equipLocationActions.updateField('${equip.id}', 'entrepreneur', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <input type="text" value="${escapedNombre}"
                       onchange="window.equipLocationActions.updateField('${equip.id}', 'nombre', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 0.9em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${escapedDimension}"
                       onchange="window.equipLocationActions.updateField('${equip.id}', 'dimension', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;">
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6;">
                <textarea onchange="window.equipLocationActions.updateField('${equip.id}', 'commentaire', this.value)"
                          class="auto-resize"
                          style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; resize: none; overflow: hidden; font-size: 0.9em; line-height: 1.4;">${escapedCommentaire}</textarea>
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.equipLocationActions.deleteEquipement('${equip.id}')"
                        style="padding: 3px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Initialiser l'auto-resize pour les textareas
    setTimeout(() => {
        document.querySelectorAll('#equipLocationTableBody textarea.auto-resize').forEach(textarea => {
            if (window.initTextareaAutoResize) {
                window.initTextareaAutoResize(textarea);
            }
        });
    }, 100);

    console.log(`[EQUIP-LOCATION] Tableau rendu: ${equipementsData.length} équipements`);
}

/**
 * Exporte les équipements vers Excel (paysage)
 */
function exportToExcel() {
    if (equipementsData.length === 0) {
        alert('⚠️ Aucun équipement à exporter.');
        return;
    }

    try {
        const exportData = equipementsData.map(eq => ({
            'Entrepreneur': eq.entrepreneur,
            'Nombre de Roulottes': eq.nombre,
            'Dimension': eq.dimension,
            'Commentaire': eq.commentaire || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Équipements Location');

        // Définir l'orientation paysage
        ws['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0, footer: 0 };
        ws['!cols'] = autoSizeColumns(ws, exportData);

        // Configuration de l'impression en paysage
        if (!ws['!printOptions']) ws['!printOptions'] = {};
        ws['!printOptions'].orientation = 'landscape';

        const fileName = `Equipements_Location_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[EQUIP-LOCATION] Export Excel réussi');
    } catch (error) {
        console.error('[EQUIP-LOCATION] Erreur export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Exporte le rapport complet (tableau + plan) en PDF paysage
 */
async function exportCompletePDF() {
    // Réinitialiser le canvas si nécessaire (utilisé pour le plan)
    if (planData.planImage && (!canvas || !ctx)) {
        console.warn('[EQUIP-LOCATION] Canvas non initialisé pour export PDF complet, tentative de réinitialisation...');
        canvas = document.getElementById('equipLocationPlanCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
        } else {
            console.error('[EQUIP-LOCATION] Canvas non disponible, export sans plan');
        }
    }

    try {
        if (typeof jspdf === 'undefined') {
            alert('❌ Bibliothèque jsPDF non chargée');
            return;
        }

        const { jsPDF } = jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        let yPos = 15;

        // Titre
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('RÉSERVATION ÉQUIPEMENTS EN LOCATION', 148, yPos, { align: 'center' });
        yPos += 10;

        // Tableau des équipements
        if (equipementsData.length > 0) {
            doc.setFontSize(12);
            doc.text('Liste des Équipements', 14, yPos);
            yPos += 5;

            const tableData = equipementsData.map(eq => [
                eq.entrepreneur || '',
                eq.nombre || '',
                eq.dimension || '',
                eq.commentaire || ''
            ]);

            doc.autoTable({
                startY: yPos,
                head: [['Entrepreneur', 'Nombre de Roulottes', 'Dimension', 'Commentaire']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [249, 249, 249] },
                margin: { left: 14, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 10;
        }

        // Plan de localisation
        if (planData.planImage) {
            // Si le tableau prend trop de place, ajouter une nouvelle page
            if (yPos > 120) {
                doc.addPage();
                yPos = 15;
            }

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Plan de Localisation', 14, yPos);
            yPos += 5;

            // Ajouter le canvas (plan + zones dessinées)
            const canvasData = canvas.toDataURL('image/jpeg', 0.8);
            const imgWidth = 270; // Largeur en paysage
            const imgHeight = (canvas.height / canvas.width) * imgWidth;

            // Si l'image est trop haute, ajuster
            const maxHeight = 180 - yPos;
            if (imgHeight > maxHeight) {
                const ratio = maxHeight / imgHeight;
                doc.addImage(canvasData, 'JPEG', 14, yPos, imgWidth * ratio, maxHeight);
            } else {
                doc.addImage(canvasData, 'JPEG', 14, yPos, imgWidth, imgHeight);
            }

            // Tableau des zones dessinées
            if (planData.zones.length > 0) {
                doc.addPage();
                yPos = 15;

                doc.setFontSize(12);
                doc.text('Localisations Dessinées', 14, yPos);
                yPos += 5;

                const zonesData = planData.zones.map(zone => {
                    const typeLabel = zone.type === 'rectangle' ? 'Rectangle' :
                                     zone.type === 'circle' ? 'Cercle' : 'Texte';
                    return [
                        typeLabel,
                        zone.text || '-',
                        zone.color
                    ];
                });

                doc.autoTable({
                    startY: yPos,
                    head: [['Type', 'Commentaire', 'Couleur']],
                    body: zonesData,
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 2 },
                    headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [249, 249, 249] },
                    margin: { left: 14, right: 14 }
                });
            }
        }

        const fileName = `Rapport_Complet_Equipements_Location_${new Date().toISOString().split('T')[0]}.pdf`;
        window.libLoader.displayPDF(doc, fileName);

        console.log('[EQUIP-LOCATION] Export PDF complet réussi');
    } catch (error) {
        console.error('[EQUIP-LOCATION] Erreur export PDF complet:', error);
        alert('❌ Erreur lors de l\'export PDF complet.');
    }
}

// ========== GESTION DU PLAN CANVAS ==========

/**
 * Cache le placeholder
 */
function hidePlaceholder() {
    const placeholder = document.getElementById('equipCanvasPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
}

/**
 * Affiche le placeholder
 */
function showPlaceholder() {
    const placeholder = document.getElementById('equipCanvasPlaceholder');
    if (placeholder) placeholder.style.display = 'block';
}

/**
 * Charge une image de plan
 */
function loadPlan(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier et réinitialiser le canvas si nécessaire
    if (!canvas || !ctx) {
        console.warn('[EQUIP-LOCATION] Canvas non initialisé, tentative de réinitialisation...');
        canvas = document.getElementById('equipLocationPlanCanvas');

        if (canvas) {
            ctx = canvas.getContext('2d');
            setupCanvasEvents();
            console.log('[EQUIP-LOCATION] ✅ Canvas réinitialisé avec succès');
        } else {
            console.error('[EQUIP-LOCATION] ❌ Impossible de trouver le canvas dans le DOM');
            alert('❌ Erreur: Le canvas n\'est pas disponible. Veuillez rafraîchir la page.');
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        // Capturer canvas et ctx dans la closure
        const savedCanvas = canvas;
        const savedCtx = ctx;

        img.onload = function() {
            try {
                if (!savedCtx || !savedCanvas) {
                    console.error('[EQUIP-LOCATION] Context perdu lors du chargement du plan');
                    alert('❌ Erreur lors du chargement du plan');
                    return;
                }

                savedCtx.clearRect(0, 0, savedCanvas.width, savedCanvas.height);
                savedCtx.drawImage(img, 0, 0, savedCanvas.width, savedCanvas.height);

                planData.planImage = e.target.result;
                planData.zones = []; // Reset les zones

                savePlanData();
                renderZonesTable();
                hidePlaceholder();

                console.log('[EQUIP-LOCATION] ✅ Plan chargé avec succès');
            } catch (error) {
                console.error('[EQUIP-LOCATION] Erreur lors du chargement du plan:', error);
                alert('❌ Erreur lors du chargement du plan');
            }
        };

        img.onerror = function() {
            console.error('[EQUIP-LOCATION] Erreur lors du chargement de l\'image');
            alert('❌ Impossible de charger l\'image');
        };

        img.src = e.target.result;
    };

    reader.onerror = function() {
        console.error('[EQUIP-LOCATION] Erreur lors de la lecture du fichier');
        alert('❌ Erreur lors de la lecture du fichier');
    };

    reader.readAsDataURL(file);
}

/**
 * Efface le plan
 */
function clearPlan() {
    if (!confirm('Voulez-vous vraiment effacer le plan et toutes les zones dessinées?')) {
        return;
    }

    // Réinitialiser le canvas si nécessaire
    if (!canvas || !ctx) {
        console.warn('[EQUIP-LOCATION] Canvas non initialisé, tentative de réinitialisation...');
        canvas = document.getElementById('equipLocationPlanCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
            setupCanvasEvents();
        } else {
            console.error('[EQUIP-LOCATION] Canvas non disponible');
            return;
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    planData.planImage = null;
    planData.zones = [];

    savePlanData();
    renderZonesTable();
    showPlaceholder();

    console.log('[EQUIP-LOCATION] Plan effacé');
}

/**
 * Sauvegarde le plan (bouton manuel)
 */
function savePlan() {
    savePlanData();
    alert('✅ Plan sauvegardé avec succès!');
}

/**
 * Exporte le plan en PDF
 */
async function exportToPDF() {
    if (!planData.planImage) {
        alert('⚠️ Aucun plan chargé à exporter.');
        return;
    }

    // Réinitialiser le canvas si nécessaire
    if (!canvas || !ctx) {
        console.warn('[EQUIP-LOCATION] Canvas non initialisé pour export PDF, tentative de réinitialisation...');
        canvas = document.getElementById('equipLocationPlanCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
        } else {
            alert('❌ Erreur: Canvas non disponible pour l\'export');
            return;
        }
    }

    try {
        if (typeof jspdf === 'undefined') {
            alert('❌ Bibliothèque jsPDF non chargée');
            return;
        }

        const { jsPDF } = jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');

        // Dessiner le canvas sur le PDF
        const canvasData = canvas.toDataURL('image/jpeg', 0.8);
        doc.addImage(canvasData, 'JPEG', 10, 10, 277, 185);

        const fileName = `Plan_Localisation_Equipements_${new Date().toISOString().split('T')[0]}.pdf`;
        window.libLoader.displayPDF(doc, fileName);
        console.log('[EQUIP-LOCATION] Export PDF réussi');
    } catch (error) {
        console.error('[EQUIP-LOCATION] Erreur export PDF:', error);
        alert('❌ Erreur lors de l\'export PDF.');
    }
}

// ========== OUTILS DE DESSIN ==========

/**
 * Change l'outil de dessin actif
 */
function setTool(tool) {
    currentTool = tool;

    // Mettre à jour les boutons
    ['select', 'rectangle', 'circle', 'text'].forEach(t => {
        const btn = document.getElementById(`equip-tool-${t}`);
        if (btn) {
            if (t === tool) {
                btn.style.background = '#667eea';
                btn.style.color = 'white';
            } else {
                btn.style.background = '#f0f0f0';
                btn.style.color = '#333';
            }
        }
    });

    console.log('[EQUIP-LOCATION] Outil sélectionné:', tool);
}

/**
 * Change la couleur de dessin
 */
function setColor(color) {
    currentColor = color;
}

/**
 * Change l'épaisseur de dessin
 */
function setThickness(thickness) {
    currentThickness = parseInt(thickness);
    const valueSpan = document.getElementById('equip-thickness-value');
    if (valueSpan) valueSpan.textContent = thickness;
}

/**
 * Configure les événements canvas
 */
function setupCanvasEvents() {
    if (!canvas) {
        console.error('[EQUIP-LOCATION] Impossible d\'attacher les événements: canvas non disponible');
        return;
    }

    // Éviter d'attacher les événements plusieurs fois
    if (eventsAttached) {
        console.log('[EQUIP-LOCATION] Événements déjà attachés, skip');
        return;
    }

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    eventsAttached = true;
    console.log('[EQUIP-LOCATION] Événements canvas attachés');
}

/**
 * Obtient les coordonnées de la souris
 */
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

/**
 * Gère le mousedown
 */
function handleMouseDown(e) {
    const pos = getMousePos(e);

    if (currentTool === 'select') {
        // Sélectionner une zone
        selectedZone = findZoneAt(pos.x, pos.y);
        if (selectedZone) {
            dragStart = pos;
        }
        redrawAll();
    } else if (currentTool === 'text') {
        // Ajouter du texte
        const text = prompt('Entrez le texte/commentaire:');
        if (text) {
            const newZone = {
                id: 'zone-' + Date.now(),
                type: 'text',
                x: pos.x,
                y: pos.y,
                text: text,
                color: currentColor,
                thickness: currentThickness
            };
            planData.zones.push(newZone);
            savePlanData();
            renderZonesTable();
            redrawAll();
        }
    } else {
        // Commencer à dessiner
        isDrawing = true;
        dragStart = pos;
        tempZone = {
            type: currentTool,
            x: pos.x,
            y: pos.y,
            color: currentColor,
            thickness: currentThickness
        };
    }
}

/**
 * Gère le mousemove
 */
function handleMouseMove(e) {
    if (!isDrawing && !selectedZone) return;

    const pos = getMousePos(e);

    if (selectedZone && dragStart) {
        // Déplacer la zone
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;

        selectedZone.x += dx;
        selectedZone.y += dy;

        if (selectedZone.type === 'rectangle') {
            // Pas besoin de mettre à jour les coordonnées de fin
        }

        dragStart = pos;
        redrawAll();
    } else if (isDrawing && tempZone) {
        // Prévisualiser la forme
        redrawAll();
        drawZonePreview(tempZone, pos.x, pos.y);
    }
}

/**
 * Gère le mouseup
 */
function handleMouseUp(e) {
    if (isDrawing && tempZone) {
        const pos = getMousePos(e);

        // Finaliser la forme
        if (currentTool === 'rectangle') {
            tempZone.width = pos.x - tempZone.x;
            tempZone.height = pos.y - tempZone.y;
        } else if (currentTool === 'circle') {
            const dx = pos.x - tempZone.x;
            const dy = pos.y - tempZone.y;
            tempZone.radius = Math.sqrt(dx * dx + dy * dy);
        }

        tempZone.id = 'zone-' + Date.now();
        planData.zones.push(tempZone);

        savePlanData();
        renderZonesTable();
        redrawAll();

        tempZone = null;
    }

    if (selectedZone) {
        savePlanData();
    }

    isDrawing = false;
    selectedZone = null;
    dragStart = null;
}

/**
 * Trouve la zone à une position
 */
function findZoneAt(x, y) {
    for (let i = planData.zones.length - 1; i >= 0; i--) {
        const zone = planData.zones[i];

        if (zone.type === 'rectangle') {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return zone;
            }
        } else if (zone.type === 'circle') {
            const dx = x - zone.x;
            const dy = y - zone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= zone.radius) {
                return zone;
            }
        } else if (zone.type === 'text') {
            // Zone cliquable autour du texte
            if (x >= zone.x - 20 && x <= zone.x + 100 &&
                y >= zone.y - 20 && y <= zone.y + 10) {
                return zone;
            }
        }
    }
    return null;
}

/**
 * Redessine tout (plan + zones)
 */
function redrawAll() {
    if (!canvas || !ctx) {
        console.warn('[EQUIP-LOCATION] Impossible de redessiner: canvas/ctx non disponible');
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redessiner l'image du plan
    if (planData.planImage) {
        const img = new Image();
        // Capturer ctx dans la closure
        const savedCanvas = canvas;
        const savedCtx = ctx;

        img.onload = function() {
            try {
                if (!savedCtx || !savedCanvas) {
                    console.warn('[EQUIP-LOCATION] Context perdu lors du redessin');
                    return;
                }
                savedCtx.drawImage(img, 0, 0, savedCanvas.width, savedCanvas.height);
                redrawZones();
            } catch (error) {
                console.error('[EQUIP-LOCATION] Erreur lors du redessin:', error);
            }
        };
        img.src = planData.planImage;
    } else {
        redrawZones();
    }
}

/**
 * Redessine les zones
 */
function redrawZones() {
    if (!ctx) {
        console.warn('[EQUIP-LOCATION] Impossible de redessiner les zones: ctx non disponible');
        return;
    }
    if (!planData.zones || planData.zones.length === 0) {
        console.log('[EQUIP-LOCATION] Aucune zone à redessiner');
        return;
    }
    console.log(`[EQUIP-LOCATION] Redessin de ${planData.zones.length} zone(s)`);
    planData.zones.forEach(zone => {
        drawZone(zone);
    });
}

/**
 * Dessine une zone
 */
function drawZone(zone) {
    if (!ctx) {
        console.warn('[EQUIP-LOCATION] Impossible de dessiner la zone: ctx non disponible');
        return;
    }
    ctx.strokeStyle = zone.color;
    ctx.fillStyle = zone.color;
    ctx.lineWidth = zone.thickness;

    if (zone.type === 'rectangle') {
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    } else if (zone.type === 'circle') {
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.stroke();
    } else if (zone.type === 'text') {
        ctx.font = '16px Arial';
        ctx.fillText(zone.text, zone.x, zone.y);
    }
}

/**
 * Dessine la prévisualisation d'une zone
 */
function drawZonePreview(zone, endX, endY) {
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = zone.thickness;
    ctx.setLineDash([5, 5]);

    if (zone.type === 'rectangle') {
        const width = endX - zone.x;
        const height = endY - zone.y;
        ctx.strokeRect(zone.x, zone.y, width, height);
    } else if (zone.type === 'circle') {
        const dx = endX - zone.x;
        const dy = endY - zone.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.setLineDash([]);
}

/**
 * Supprime la zone sélectionnée
 */
function deleteSelected() {
    if (!selectedZone) {
        alert('⚠️ Aucune zone sélectionnée. Utilisez l\'outil "Sélectionner" puis cliquez sur une zone.');
        return;
    }

    if (!confirm('Voulez-vous vraiment supprimer cette zone?')) {
        return;
    }

    planData.zones = planData.zones.filter(z => z.id !== selectedZone.id);
    selectedZone = null;

    savePlanData();
    renderZonesTable();
    redrawAll();

    console.log('[EQUIP-LOCATION] Zone supprimée');
}

/**
 * Supprime une zone par ID
 */
function deleteZone(zoneId) {
    if (!confirm('Voulez-vous vraiment supprimer cette zone?')) {
        return;
    }

    planData.zones = planData.zones.filter(z => z.id !== zoneId);

    savePlanData();
    renderZonesTable();
    redrawAll();

    console.log('[EQUIP-LOCATION] Zone supprimée:', zoneId);
}

/**
 * Rend le tableau des zones
 */
function renderZonesTable() {
    const tbody = document.getElementById('equipZonesDrawnTableBody');
    const countSpan = document.getElementById('equipZonesDrawnCount');

    if (!tbody) return;

    // S'assurer que planData.zones existe
    if (!planData.zones) {
        planData.zones = [];
    }

    if (countSpan) countSpan.textContent = planData.zones.length;

    if (planData.zones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 30px; text-align: center; color: #666;">
                    Aucune localisation dessinée. Utilisez les outils ci-dessus pour dessiner sur le plan.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    planData.zones.forEach((zone, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        const typeLabel = zone.type === 'rectangle' ? '⬜ Rectangle' :
                         zone.type === 'circle' ? '⭕ Cercle' :
                         '📝 Texte';

        // Échapper le commentaire pour éviter les erreurs de syntaxe
        const comment = escapeHtml(zone.text || '-');

        row.innerHTML = `
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-size: 0.9em;">${typeLabel}</td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-size: 0.9em;">${comment}</td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <div style="width: 24px; height: 24px; background: ${zone.color}; border: 1px solid #ccc; border-radius: 4px; margin: 0 auto;"></div>
            </td>
            <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.equipLocationPlanEditor.deleteZone('${zone.id}')"
                        style="padding: 3px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.equipLocationActions = {
        addEquipement,
        updateField: updateEquipementField,
        deleteEquipement,
        exportToExcel,
        exportCompletePDF
    };

    window.equipLocationPlanEditor = {
        loadPlan,
        clearPlan,
        savePlan,
        exportToPDF,
        setTool,
        setColor,
        setThickness,
        deleteSelected,
        deleteZone
    };
}

console.log('[EQUIP-LOCATION] Module chargé');
