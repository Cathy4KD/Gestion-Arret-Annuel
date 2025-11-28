/**
 * @fileoverview Éditeur de plan avec dessin de zones interactif
 * @module data/zones-plan-editor
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

// État de l'éditeur
let canvas = null;
let ctx = null;
let backgroundImage = null;
let zones = [];
let currentTool = 'select';
let currentColor = '#ff0000';
let currentThickness = 3;
let isDrawing = false;
let startX = 0;
let startY = 0;
let selectedZone = null;
let isDragging = false;

// Données chargées depuis le serveur (en mémoire)
let cachedPlanData = null;

/**
 * Charge les données du plan depuis le serveur (au démarrage de l'application)
 * @returns {Promise<void>}
 */
export async function loadZonesPlanData() {
    console.log('[ZONES-PLAN] 📥 Chargement des données du plan au démarrage...');
    const saved = await loadFromStorage('zonesPlanData');

    if (saved) {
        cachedPlanData = saved;
        console.log('[ZONES-PLAN] ✅ Données du plan chargées depuis le serveur en mémoire');

        if (saved.backgroundImage) {
            console.log('[ZONES-PLAN] ✅ Image de plan trouvée dans les données (taille:', saved.backgroundImage.length, 'caractères)');
        } else {
            console.log('[ZONES-PLAN] ⚠️ Aucune image de plan dans les données');
        }

        if (saved.zones) {
            console.log(`[ZONES-PLAN] ✅ ${saved.zones.length} zone(s) trouvée(s)`);
        } else {
            console.log('[ZONES-PLAN] ⚠️ Aucune zone dans les données');
        }
    } else {
        console.log('[ZONES-PLAN] ℹ️ Aucune donnée de plan trouvée sur le serveur (première utilisation)');
        cachedPlanData = null;
    }
}

/**
 * Initialise l'éditeur de plan
 */
export function initPlanEditor() {
    console.log('[ZONES-PLAN] 🎨 initPlanEditor() appelée');
    canvas = document.getElementById('zonesPlanCanvas');
    if (!canvas) {
        console.error('[ZONES-PLAN] ❌ Canvas zonesPlanCanvas non trouvé dans le DOM');
        return;
    }
    console.log('[ZONES-PLAN] ✅ Canvas trouvé, initialisation du contexte');

    ctx = canvas.getContext('2d');

    // Événements de souris
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Charger les données sauvegardées
    loadPlanData();

    console.log('[ZONES-PLAN] ✅ Éditeur complètement initialisé avec succès');
}

/**
 * Charge un plan (image de fond)
 */
export function loadPlan(event) {
    console.log('[ZONES-PLAN] 📂 loadPlan() appelée, event:', event);
    const file = event.target.files[0];
    if (!file) {
        console.warn('[ZONES-PLAN] ⚠️ Aucun fichier sélectionné');
        return;
    }
    console.log('[ZONES-PLAN] ✅ Fichier sélectionné:', file.name, file.type);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            // Vérifier que le canvas existe toujours (l'utilisateur peut avoir changé de page)
            if (!canvas) {
                console.warn('[ZONES-PLAN] ⚠️ Canvas n\'existe plus, chargement abandonné');
                return;
            }

            backgroundImage = img;

            // Ajuster la taille du canvas à l'image
            canvas.width = Math.min(img.width, 1200);
            canvas.height = Math.min(img.height, 800);

            // Cacher le placeholder
            const placeholder = document.getElementById('canvasPlaceholder');
            if (placeholder) placeholder.style.display = 'none';

            redraw();
            console.log('[ZONES-PLAN] ✅ Plan chargé et affiché:', file.name);

            // Sauvegarder automatiquement le plan
            await savePlanData();
            console.log('[ZONES-PLAN] ✅ Plan sauvegardé automatiquement sur le serveur');

            alert(`✅ Plan "${file.name}" chargé et sauvegardé avec succès !`);
        };
        img.onerror = () => {
            console.error('[ZONES-PLAN] ❌ Erreur lors du chargement de l\'image');
            alert('❌ Erreur lors du chargement de l\'image. Vérifiez que le fichier est une image valide.');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Efface le plan et les zones
 */
export function clearPlan() {
    if (!confirm('Êtes-vous sûr de vouloir effacer le plan et toutes les zones ?')) {
        return;
    }

    backgroundImage = null;
    zones = [];
    selectedZone = null;

    const placeholder = document.getElementById('canvasPlaceholder');
    if (placeholder) placeholder.style.display = 'block';

    redraw();
    renderZonesTable();
    savePlanData();
}

/**
 * Définit l'outil de dessin actuel
 */
export function setTool(tool) {
    currentTool = tool;
    selectedZone = null;

    // Mettre à jour les boutons
    ['select', 'rectangle', 'circle', 'text'].forEach(t => {
        const btn = document.getElementById(`tool-${t}`);
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

    // Changer le curseur
    if (tool === 'select') {
        canvas.style.cursor = 'default';
    } else {
        canvas.style.cursor = 'crosshair';
    }

    redraw();
}

/**
 * Définit la couleur actuelle
 */
export function setColor(color) {
    currentColor = color;
    if (selectedZone) {
        selectedZone.color = color;
        redraw();
        renderZonesTable();
        savePlanData();
    }
}

/**
 * Définit l'épaisseur actuelle
 */
export function setThickness(thickness) {
    currentThickness = parseInt(thickness);
    document.getElementById('thickness-value').textContent = thickness;
    if (selectedZone) {
        selectedZone.thickness = currentThickness;
        redraw();
        savePlanData();
    }
}

/**
 * Supprime la zone sélectionnée
 */
export function deleteSelected() {
    if (selectedZone) {
        zones = zones.filter(z => z.id !== selectedZone.id);
        selectedZone = null;
        redraw();
        renderZonesTable();
        savePlanData();
    } else {
        alert('Veuillez d\'abord sélectionner une zone à supprimer.');
    }
}

/**
 * Gère le clic de souris
 */
function handleMouseDown(e) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startX = x;
    startY = y;

    if (currentTool === 'select') {
        // Vérifier si on clique sur une zone existante
        selectedZone = findZoneAtPoint(x, y);
        if (selectedZone) {
            isDragging = true;
        }
        redraw();
    } else if (currentTool === 'text') {
        // Créer une zone de texte
        const text = prompt('Entrez le texte/commentaire:');
        if (text) {
            const newZone = {
                id: 'zone-' + Date.now(),
                type: 'text',
                x: x,
                y: y,
                text: text,
                color: currentColor,
                thickness: currentThickness,
                fontSize: 16
            };
            zones.push(newZone);
            redraw();
            renderZonesTable();
            savePlanData();
        }
    } else {
        isDrawing = true;
    }
}

/**
 * Gère le mouvement de la souris
 */
function handleMouseMove(e) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && selectedZone && currentTool === 'select') {
        // Déplacer la zone
        const dx = x - startX;
        const dy = y - startY;

        if (selectedZone.type === 'rectangle' || selectedZone.type === 'circle') {
            selectedZone.x += dx;
            selectedZone.y += dy;
        } else if (selectedZone.type === 'text') {
            selectedZone.x += dx;
            selectedZone.y += dy;
        }

        startX = x;
        startY = y;
        redraw();
    } else if (isDrawing) {
        // Dessiner un aperçu
        redraw();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentThickness;
        ctx.fillStyle = currentColor + '40'; // Semi-transparent

        if (currentTool === 'rectangle') {
            const width = x - startX;
            const height = y - startY;
            ctx.strokeRect(startX, startY, width, height);
            ctx.fillRect(startX, startY, width, height);
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
            ctx.beginPath();
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        }
    }
}

/**
 * Gère le relâchement de la souris
 */
async function handleMouseUp(e) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
        // Créer la zone finale
        if (currentTool === 'rectangle') {
            const width = x - startX;
            const height = y - startY;

            if (Math.abs(width) > 5 && Math.abs(height) > 5) {
                const newZone = {
                    id: 'zone-' + Date.now(),
                    type: 'rectangle',
                    x: startX,
                    y: startY,
                    width: width,
                    height: height,
                    color: currentColor,
                    thickness: currentThickness,
                    comment: ''
                };
                zones.push(newZone);
                renderZonesTable();
                await savePlanData();
                console.log('[ZONES-PLAN] ✅ Rectangle ajouté et sauvegardé');
            }
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));

            if (radius > 5) {
                const newZone = {
                    id: 'zone-' + Date.now(),
                    type: 'circle',
                    x: startX,
                    y: startY,
                    radius: radius,
                    color: currentColor,
                    thickness: currentThickness,
                    comment: ''
                };
                zones.push(newZone);
                renderZonesTable();
                await savePlanData();
                console.log('[ZONES-PLAN] ✅ Cercle ajouté et sauvegardé');
            }
        }
    }

    if (isDragging && selectedZone) {
        // Sauvegarder après avoir déplacé une zone
        await savePlanData();
        console.log('[ZONES-PLAN] ✅ Zone déplacée et sauvegardée');
    }

    isDrawing = false;
    isDragging = false;
    redraw();
}

/**
 * Trouve une zone à un point donné
 */
function findZoneAtPoint(x, y) {
    // Chercher en ordre inverse pour sélectionner les zones du dessus
    for (let i = zones.length - 1; i >= 0; i--) {
        const zone = zones[i];

        if (zone.type === 'rectangle') {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return zone;
            }
        } else if (zone.type === 'circle') {
            const dist = Math.sqrt(Math.pow(x - zone.x, 2) + Math.pow(y - zone.y, 2));
            if (dist <= zone.radius) {
                return zone;
            }
        } else if (zone.type === 'text') {
            // Zone de texte approximative (20px autour du texte)
            if (Math.abs(x - zone.x) < 100 && Math.abs(y - zone.y) < 20) {
                return zone;
            }
        }
    }
    return null;
}

/**
 * Redessine tout le canvas
 */
function redraw() {
    if (!ctx) {
        console.warn('[ZONES-PLAN] ⚠️ redraw() appelé mais ctx est null');
        return;
    }

    console.log('[ZONES-PLAN] 🎨 redraw() - canvas:', canvas.width, 'x', canvas.height, 'backgroundImage:', !!backgroundImage, 'zones:', zones.length);

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner l'image de fond
    if (backgroundImage) {
        console.log('[ZONES-PLAN] 🖼️ Dessin de l\'image de fond...');
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        console.log('[ZONES-PLAN] ✅ Image de fond dessinée');
    } else {
        console.log('[ZONES-PLAN] ⚠️ Aucune image de fond à dessiner');
    }

    // Dessiner toutes les zones
    zones.forEach(zone => {
        drawZone(zone, zone === selectedZone);
    });

    console.log('[ZONES-PLAN] ✅ redraw() terminé');
}

/**
 * Dessine une zone individuelle
 */
function drawZone(zone, isSelected) {
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = zone.thickness || 3;
    ctx.fillStyle = zone.color + '40'; // Semi-transparent

    if (zone.type === 'rectangle') {
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // Afficher le commentaire au centre du rectangle
        if (zone.comment) {
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Diviser le commentaire en lignes si trop long
            const maxWidth = zone.width - 10;
            const words = zone.comment.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + ' ' + words[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            // Dessiner chaque ligne
            const lineHeight = 16;
            const centerX = zone.x + zone.width / 2;
            const startY = zone.y + zone.height / 2 - (lines.length * lineHeight) / 2;

            lines.forEach((line, index) => {
                ctx.fillText(line, centerX, startY + index * lineHeight);
            });

            // Réinitialiser l'alignement
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
    } else if (zone.type === 'circle') {
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();

        // Afficher le commentaire au centre du cercle
        if (zone.comment) {
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Diviser le commentaire en lignes si trop long
            const maxWidth = zone.radius * 1.8;
            const words = zone.comment.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + ' ' + words[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            // Dessiner chaque ligne
            const lineHeight = 16;
            const startY = zone.y - (lines.length * lineHeight) / 2;

            lines.forEach((line, index) => {
                ctx.fillText(line, zone.x, startY + index * lineHeight);
            });

            // Réinitialiser l'alignement
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
    } else if (zone.type === 'text') {
        ctx.font = `${zone.fontSize || 16}px Arial`;
        ctx.fillStyle = zone.color;
        ctx.fillText(zone.text, zone.x, zone.y);
    }

    // Dessiner une bordure de sélection
    if (isSelected) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        if (zone.type === 'rectangle') {
            ctx.strokeRect(zone.x - 5, zone.y - 5, zone.width + 10, zone.height + 10);
        } else if (zone.type === 'circle') {
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius + 5, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (zone.type === 'text') {
            ctx.strokeRect(zone.x - 5, zone.y - zone.fontSize - 5, 100, zone.fontSize + 10);
        }

        ctx.setLineDash([]);
    }
}

/**
 * Met à jour le commentaire d'une zone
 */
function updateZoneComment(zoneId, comment) {
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
        if (zone.type === 'text') {
            zone.text = comment;
        } else {
            zone.comment = comment;
        }
        redraw();
        savePlanData();
    }
}

/**
 * Supprime une zone du tableau
 */
function deleteZoneFromTable(zoneId) {
    zones = zones.filter(z => z.id !== zoneId);
    if (selectedZone && selectedZone.id === zoneId) {
        selectedZone = null;
    }
    redraw();
    renderZonesTable();
    savePlanData();
}

/**
 * Affiche le tableau des zones
 */
function renderZonesTable() {
    const tbody = document.getElementById('zonesDrawnTableBody');
    const countSpan = document.getElementById('zonesDrawnCount');

    if (!tbody) return;

    countSpan.textContent = zones.length;

    if (zones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 30px; text-align: center; color: #666;">
                    Aucune zone dessinée. Utilisez les outils ci-dessus pour dessiner sur le plan.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    zones.forEach((zone, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        const typeIcon = zone.type === 'rectangle' ? '⬜' : zone.type === 'circle' ? '⭕' : '📝';
        const typeText = zone.type === 'rectangle' ? 'Rectangle' : zone.type === 'circle' ? 'Cercle' : 'Texte';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${typeIcon} ${typeText}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.zonesPlanEditor.updateZoneComment('${zone.id}', this.value)"
                          placeholder="Ajouter un commentaire..."
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; resize: vertical;">${zone.type === 'text' ? zone.text : (zone.comment || '')}</textarea>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <div style="width: 30px; height: 30px; background: ${zone.color}; border: 2px solid #333; border-radius: 4px; margin: 0 auto;"></div>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.zonesPlanEditor.deleteZoneFromTable('${zone.id}')"
                        style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️ Supprimer
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Sauvegarde les données du plan
 */
export async function savePlan() {
    await savePlanData();
    alert('✅ Plan et zones sauvegardés avec succès !');
}

/**
 * Sauvegarde en arrière-plan
 */
async function savePlanData() {
    const planData = {
        backgroundImage: backgroundImage ? backgroundImage.src : null,
        zones: zones
    };

    await saveToStorage('zonesPlanData', planData);
    cachedPlanData = planData; // Mettre à jour le cache
    console.log('[ZONES-PLAN] Données sauvegardées sur le serveur et mises en cache');
}

/**
 * Charge les données du plan
 */
async function loadPlanData() {
    console.log('[ZONES-PLAN] 📂 loadPlanData() appelée');

    // Utiliser les données en cache si disponibles, sinon charger depuis le serveur
    let saved = cachedPlanData;

    if (!saved) {
        console.log('[ZONES-PLAN] Pas de cache, chargement depuis le serveur...');
        saved = await loadFromStorage('zonesPlanData');
        cachedPlanData = saved; // Mettre en cache
    } else {
        console.log('[ZONES-PLAN] ✅ Utilisation des données en cache');
    }

    if (saved) {
        console.log('[ZONES-PLAN] Données trouvées:', {
            hasImage: !!saved.backgroundImage,
            imageLength: saved.backgroundImage ? saved.backgroundImage.length : 0,
            zonesCount: saved.zones ? saved.zones.length : 0
        });

        if (saved.backgroundImage) {
            console.log('[ZONES-PLAN] 🖼️ Création de l\'objet Image pour charger le plan...');
            console.log('[ZONES-PLAN] 📏 Longueur de l\'image base64:', saved.backgroundImage.length, 'caractères');
            console.log('[ZONES-PLAN] 🔍 Début de l\'image:', saved.backgroundImage.substring(0, 50));

            const img = new Image();
            img.onload = () => {
                console.log('[ZONES-PLAN] ✅ Image.onload() déclenché !');
                console.log('[ZONES-PLAN] 📐 Dimensions de l\'image:', img.width, 'x', img.height);

                // Vérifier que le canvas existe toujours
                if (!canvas) {
                    console.warn('[ZONES-PLAN] ⚠️ Canvas n\'existe plus, chargement abandonné');
                    return;
                }

                backgroundImage = img;
                canvas.width = Math.min(img.width, 1200);
                canvas.height = Math.min(img.height, 800);

                console.log('[ZONES-PLAN] 📐 Dimensions du canvas ajustées:', canvas.width, 'x', canvas.height);

                const placeholder = document.getElementById('canvasPlaceholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                    console.log('[ZONES-PLAN] ✅ Placeholder masqué');
                }

                console.log('[ZONES-PLAN] 🎨 Appel de redraw() pour afficher l\'image...');
                redraw();
                console.log('[ZONES-PLAN] ✅ Image du plan affichée sur le canvas');
            };
            img.onerror = (error) => {
                console.error('[ZONES-PLAN] ❌ Image.onerror() déclenché !');
                console.error('[ZONES-PLAN] ❌ Erreur lors du chargement de l\'image:', error);
                console.error('[ZONES-PLAN] ❌ Image src (début):', img.src.substring(0, 100));
            };

            console.log('[ZONES-PLAN] 🔄 Assignation de img.src...');
            img.src = saved.backgroundImage;
            console.log('[ZONES-PLAN] ✅ img.src assigné, en attente du callback onload...');
        } else {
            console.log('[ZONES-PLAN] ⚠️ Aucune image dans les données sauvegardées');
        }

        if (saved.zones) {
            zones = saved.zones;
            renderZonesTable();
            console.log(`[ZONES-PLAN] ✅ ${zones.length} zone(s) chargée(s)`);
        }

        console.log('[ZONES-PLAN] ✅ loadPlanData() terminé (l\'image se chargera de façon asynchrone)');
    } else {
        console.log('[ZONES-PLAN] ℹ️ Aucune donnée à charger (première utilisation)');
    }
}

/**
 * Exporte le plan en PDF
 */
export async function exportToPDF() {
    if (!backgroundImage && zones.length === 0) {
        alert('Aucun plan ou zone à exporter.');
        return;
    }

    if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
        alert('Bibliothèque jsPDF non chargée');
        return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Format paysage

    // Capturer le canvas actuel
    const imgData = canvas.toDataURL('image/png');

    // Ajouter l'image au PDF
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addImage(imgData, 'PNG', 10, 10, pageWidth - 20, pageHeight - 40);

    // Ajouter un titre
    doc.setFontSize(16);
    doc.text('ZONES ENTREPOSAGES & PLAN DE LOCALISATION', pageWidth / 2, pageHeight - 15, { align: 'center' });

    const fileName = `Plan_Zones_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);
    console.log('[ZONES-PLAN] PDF exporté:', fileName);
}

// Exposer globalement
console.log('[ZONES-PLAN] 📤 Exposition des fonctions globales...');
window.zonesPlanEditor = {
    initPlanEditor,
    loadPlan,
    clearPlan,
    setTool,
    setColor,
    setThickness,
    deleteSelected,
    updateZoneComment,
    deleteZoneFromTable,
    savePlan,
    exportToPDF,
    loadZonesPlanData
};

console.log('[ZONES-PLAN] ✅ Module chargé - window.zonesPlanEditor disponible');
console.log('[ZONES-PLAN] Fonctions disponibles:', Object.keys(window.zonesPlanEditor).join(', '));
