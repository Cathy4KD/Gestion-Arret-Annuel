/**
 * @fileoverview Gestion des travaux en espace clos
 * @module data/espace-clos-data
 *
 * @description
 * Filtre et affiche les travaux en espace clos depuis IW37N
 * Critère: "EP-" ou "EC-" dans Désign. opér.
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage pour les données d'espace clos
 * @const {string}
 */
const STORAGE_KEY = 'espaceClosData';

/**
 * Données des espaces clos
 * @type {Array}
 */
let espaceClosData = [];

/**
 * Charge les données des espaces clos depuis localStorage
 * @returns {void}
 */
export async function loadEspaceClosData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        espaceClosData = saved;
        console.log(`[ESPACE-CLOS] ${espaceClosData.length} espaces clos chargés depuis localStorage`);
        renderEspaceClosTable();
    }
}

/**
 * Sauvegarde les données des espaces clos dans localStorage ET serveur
 * @returns {void}
 */
async function saveEspaceClosData() {
    await saveToStorage(STORAGE_KEY, espaceClosData);
    console.log('[ESPACE-CLOS] Données sauvegardées et synchronisées avec le serveur');
}

/**
 * Synchronise les espaces clos depuis IW37N
 * Filtre les travaux contenant "EP-" ou "EC-" dans Désign. opér.
 * @returns {void}
 */
export async function syncEspaceClosFromIw37n() {
    // Récupérer les données IW37N depuis localStorage
    const iw37nData = await loadFromStorage('iw37nData');

    if (!iw37nData) {
        alert('⚠️ Aucune donnée IW37N trouvée. Veuillez d\'abord charger les données IW37N.');
        console.warn('[ESPACE-CLOS] Aucune donnée IW37N disponible');
        return;
    }

    try {
        console.log('[ESPACE-CLOS] Données IW37N chargées:', iw37nData.length, 'lignes');

        // Filtrer les travaux contenant "EP-" ou "EC-" dans Désign. opér.
        const filtered = iw37nData.filter(row => {
            const designOper = row['Désign. opér.'] || row['Design. opération'] || row['designOper'] || '';
            return designOper.includes('EP-') || designOper.includes('EC-');
        });

        console.log(`[ESPACE-CLOS] ${filtered.length} espaces clos trouvés`);

        // Mapper les données pour le tableau
        espaceClosData = filtered.map(row => {
            const designOper = row['Désign. opér.'] || row['Design. opération'] || row['designOper'] || '';

            // Extraire la valeur EP- ou EC-
            let espaceClos = '';
            if (designOper.includes('EP-')) {
                const match = designOper.match(/EP-[^\s]*/);
                espaceClos = match ? match[0] : 'EP-';
            } else if (designOper.includes('EC-')) {
                const match = designOper.match(/EC-[^\s]*/);
                espaceClos = match ? match[0] : 'EC-';
            }

            return {
                id: `ec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                espaceClos: espaceClos,
                ordre: row['Ordre'] || row['ordre'] || '',
                designOper: designOper,
                posteTechnique: row['Poste technique'] || row['PosteTechnique'] || row['posteTechnique'] || '',
                reclassification: '',
                commentaire: ''
            };
        });

        saveEspaceClosData();
        renderEspaceClosTable();

        alert(`✅ ${espaceClosData.length} espace(s) clos synchronisé(s) depuis IW37N`);
    } catch (error) {
        console.error('[ESPACE-CLOS] Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation avec IW37N');
    }
}

/**
 * Met à jour un champ d'une ligne
 * @param {number} index - Index de la ligne
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 */
function updateEspaceClosField(index, field, value) {
    if (espaceClosData[index]) {
        espaceClosData[index][field] = value;
        saveEspaceClosData();

        // Re-rendre le tableau et les cartes pour mettre à jour les couleurs en temps réel
        renderEspaceClosTable();
    }
}

// Exposer globalement pour les événements onclick
if (typeof window !== 'undefined') {
    window.updateEspaceClosField = updateEspaceClosField;
}

/**
 * Rend le tableau des espaces clos
 * @returns {void}
 */
export function renderEspaceClosTable() {
    const tbody = document.getElementById('espaceClosTableBody');
    const countSpan = document.getElementById('espaceClosCount');
    const uniqueCountSpan = document.getElementById('espaceClosUniqueCount');
    const surveillantsCountSpan = document.getElementById('surveillantsCount');

    if (!tbody) {
        console.warn('[ESPACE-CLOS] Element espaceClosTableBody non trouvé');
        return;
    }

    if (!Array.isArray(espaceClosData) || espaceClosData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucun espace clos dans la liste. Cliquez sur "Synchroniser avec IW37N" pour importer les données.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        if (uniqueCountSpan) uniqueCountSpan.textContent = '0';
        if (surveillantsCountSpan) surveillantsCountSpan.textContent = '0';
        return;
    }

    // Calculer le nombre d'espaces clos uniques
    const uniqueEspacesClos = new Set(
        espaceClosData
            .map(item => item.espaceClos)
            .filter(ec => ec && ec.trim() !== '' && ec !== '-')
    );
    const uniqueCount = uniqueEspacesClos.size;

    tbody.innerHTML = '';
    espaceClosData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; color: #c9941a;">
                ${item.espaceClos || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.ordre || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.designOper || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.posteTechnique || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="window.updateEspaceClosField(${index}, 'reclassification', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="" ${!item.reclassification || item.reclassification === '' ? 'selected' : ''}>--</option>
                    <option value="Espace clos" ${item.reclassification === 'Espace clos' ? 'selected' : ''}>Espace clos</option>
                    <option value="Non espace clos" ${item.reclassification === 'Non espace clos' ? 'selected' : ''}>Non espace clos</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.updateEspaceClosField(${index}, 'commentaire', this.value)"
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; resize: vertical;">${item.commentaire || ''}</textarea>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Calculer le nombre de surveillants requis (espaces clos confirmés)
    const surveillantsRequis = espaceClosData.filter(item =>
        item.reclassification === 'Espace clos' ||
        (!item.reclassification && item.espaceClos)
    ).length;

    // Mettre à jour les compteurs
    if (countSpan) {
        countSpan.textContent = espaceClosData.length;
    }
    if (uniqueCountSpan) {
        uniqueCountSpan.textContent = uniqueCount;
    }
    if (surveillantsCountSpan) {
        surveillantsCountSpan.textContent = surveillantsRequis;
    }

    // Afficher la liste unique des espaces clos
    renderEspaceClosListeUnique();

    console.log(`[ESPACE-CLOS] Tableau rendu: ${espaceClosData.length} espaces clos (${uniqueCount} uniques, ${surveillantsRequis} surveillants requis)`);
}

/**
 * Rend la liste unique des espaces clos avec statistiques
 * @returns {void}
 */
function renderEspaceClosListeUnique() {
    const container = document.getElementById('espaceClosListeUnique');
    if (!container) {
        console.warn('[ESPACE-CLOS] Element espaceClosListeUnique non trouvé');
        return;
    }

    if (!Array.isArray(espaceClosData) || espaceClosData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">
                Aucun espace clos. Synchronisez avec IW37N pour commencer.
            </div>
        `;
        return;
    }

    // Extraire les espaces clos uniques avec leurs statistiques
    const espaceClosMap = new Map();

    espaceClosData.forEach(item => {
        const espaceClos = item.espaceClos || '';
        if (!espaceClos || espaceClos === '-' || espaceClos.trim() === '') return;

        if (!espaceClosMap.has(espaceClos)) {
            espaceClosMap.set(espaceClos, {
                nom: espaceClos,
                count: 0,
                reclassifications: {
                    espaceClos: 0,
                    nonEspaceClos: 0,
                    nonDefini: 0
                },
                travaux: []
            });
        }

        const stats = espaceClosMap.get(espaceClos);
        stats.count++;
        stats.travaux.push(item);

        // Compter les reclassifications
        if (item.reclassification === 'Espace clos') {
            stats.reclassifications.espaceClos++;
        } else if (item.reclassification === 'Non espace clos') {
            stats.reclassifications.nonEspaceClos++;
        } else {
            stats.reclassifications.nonDefini++;
        }
    });

    // Trier par nom d'espace clos
    const espacesClosUniques = Array.from(espaceClosMap.values()).sort((a, b) =>
        a.nom.localeCompare(b.nom)
    );

    // Générer le HTML pour chaque espace clos
    container.innerHTML = espacesClosUniques.map(ec => {
        // Déterminer la couleur selon la reclassification
        let borderColor = '#c9941a'; // Orange par défaut
        let bgColor = '#fff9e6';
        let statusText = 'À vérifier';

        // VERT: si tous les travaux sont reclassifiés "Non espace clos"
        if (ec.reclassifications.nonEspaceClos === ec.count) {
            borderColor = '#28a745'; // Vert pour non espace clos
            bgColor = '#e8f5e9';
            statusText = 'Non Espace Clos';
        }
        // ROUGE: si au moins un travail est reclassifié "Espace clos"
        else if (ec.reclassifications.espaceClos > 0) {
            borderColor = '#dc3545'; // Rouge pour espace clos confirmé
            bgColor = '#ffe0e0';
            statusText = 'Espace Clos Confirmé';
        }
        // ORANGE: reste à vérifier (non défini ou mixte)

        return `
            <div style="
                background: ${bgColor};
                border: 2px solid ${borderColor};
                border-radius: 10px;
                padding: 15px;
                transition: all 0.3s ease;
                cursor: pointer;
            "
            onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
            onclick="filterEspaceClosTableau('${ec.nom}')">
                <div style="font-size: 1.3em; font-weight: bold; color: ${borderColor}; margin-bottom: 10px;">
                    ${ec.nom}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #666; font-size: 0.9em;">Total de travaux:</span>
                    <span style="font-weight: bold; font-size: 1.1em; color: ${borderColor};">${ec.count}</span>
                </div>
                <div style="border-top: 1px solid ${borderColor}; padding-top: 8px; margin-top: 8px;">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">
                        <strong>Reclassifications:</strong>
                    </div>
                    <div style="display: flex; gap: 10px; font-size: 0.8em;">
                        <span style="color: #dc3545;">✓ ${ec.reclassifications.espaceClos}</span>
                        <span style="color: #28a745;">✗ ${ec.reclassifications.nonEspaceClos}</span>
                        <span style="color: #999;">? ${ec.reclassifications.nonDefini}</span>
                    </div>
                </div>
                <div style="margin-top: 10px; padding: 5px; background: rgba(255,255,255,0.5); border-radius: 5px; text-align: center; font-size: 0.85em; font-weight: 600; color: ${borderColor};">
                    ${statusText}
                </div>
                <div style="margin-top: 8px; text-align: center; font-size: 0.75em; color: #666;">
                    👆 Cliquer pour filtrer le tableau
                </div>
            </div>
        `;
    }).join('');

    console.log(`[ESPACE-CLOS] Liste unique rendue: ${espacesClosUniques.length} espaces clos uniques`);
}

/**
 * Filtre le tableau pour n'afficher qu'un espace clos spécifique
 * @param {string} espaceClos - Nom de l'espace clos à filtrer
 * @returns {void}
 */
function filterEspaceClosTableau(espaceClos) {
    const tbody = document.getElementById('espaceClosTableBody');
    if (!tbody) return;

    console.log(`[ESPACE-CLOS] Filtrage du tableau pour: ${espaceClos}`);

    // Filtrer les données
    const filteredData = espaceClosData.filter(item => item.espaceClos === espaceClos);

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666; border: 1px solid #dee2e6;">
                    Aucun travail trouvé pour l'espace clos: <strong>${espaceClos}</strong>
                    <br><br>
                    <button onclick="renderEspaceClosTable()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Afficher tous les espaces clos
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    // Afficher seulement les lignes filtrées
    tbody.innerHTML = '';
    filteredData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
        row.style.borderLeft = '4px solid #c9941a'; // Bordure pour indiquer le filtrage

        // Calculer l'index réel dans le tableau complet
        const realIndex = espaceClosData.findIndex(d => d.id === item.id);

        // Couleurs par reclassification
        const reclassColors = {
            'Espace clos': { bg: '#ffe0e0', text: '#c62828' },
            'Non espace clos': { bg: '#e8f5e9', text: '#2e7d32' }
        };
        const color = reclassColors[item.reclassification] || { bg: '#f5f5f5', text: '#757575' };

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; color: #c9941a;">
                ${item.espaceClos || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.ordre || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.designOper || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                ${item.posteTechnique || '-'}
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <select onchange="window.updateEspaceClosField(${realIndex}, 'reclassification', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; background: ${color.bg}; color: ${color.text};">
                    <option value="" ${!item.reclassification || item.reclassification === '' ? 'selected' : ''}>--</option>
                    <option value="Espace clos" ${item.reclassification === 'Espace clos' ? 'selected' : ''}>Espace clos</option>
                    <option value="Non espace clos" ${item.reclassification === 'Non espace clos' ? 'selected' : ''}>Non espace clos</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.updateEspaceClosField(${realIndex}, 'commentaire', this.value)"
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; resize: vertical;">${item.commentaire || ''}</textarea>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Ajouter un bouton pour réinitialiser le filtre
    const resetRow = document.createElement('tr');
    resetRow.innerHTML = `
        <td colspan="6" style="padding: 15px; text-align: center; background: #f0f0f0; border: 1px solid #dee2e6;">
            <strong>Filtrage actif:</strong> Affichage de ${filteredData.length} travau(x) pour <strong style="color: #c9941a;">${espaceClos}</strong>
            <button onclick="renderEspaceClosTable()" style="margin-left: 15px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                ✕ Afficher tous les espaces clos
            </button>
        </td>
    `;
    tbody.appendChild(resetRow);

    // Faire défiler jusqu'au tableau
    document.getElementById('espaceClosTableBody').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Exposer la fonction globalement
if (typeof window !== 'undefined') {
    window.filterEspaceClosTableau = filterEspaceClosTableau;
}

/**
 * Exporte les données d'espace clos vers Excel
 * @returns {void}
 */
export function exportEspaceClosToExcel() {
    if (!Array.isArray(espaceClosData) || espaceClosData.length === 0) {
        alert('⚠️ Aucun espace clos à exporter.');
        return;
    }

    try {
        const exportData = espaceClosData.map(item => ({
            'Espace clos': item.espaceClos || '',
            'Ordre': item.ordre || '',
            'Désign. opér.': item.designOper || '',
            'Poste technique': item.posteTechnique || '',
            'Reclassification': item.reclassification || '',
            'Commentaire': item.commentaire || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Espaces Clos');

        // Ajuster automatiquement la largeur des colonnes
        ws['!cols'] = autoSizeColumns(ws, exportData);

        const fileName = `Espaces_Clos_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[ESPACE-CLOS] Export Excel réussi:', fileName);
    } catch (error) {
        console.error('[ESPACE-CLOS] Erreur lors de l\'export:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Récupère les données des espaces clos
 * @returns {Array}
 */
export function getEspaceClosData() {
    return espaceClosData;
}

/**
 * Exporte la liste unique des espaces clos en PDF
 * @returns {void}
 */
export function exportEspaceClosUniquePDF() {
    if (!Array.isArray(espaceClosData) || espaceClosData.length === 0) {
        alert('⚠️ Aucun espace clos à exporter.');
        return;
    }

    // Vérifier que jsPDF est chargé
    if (typeof window.jspdf === 'undefined') {
        alert('❌ Erreur: La bibliothèque jsPDF n\'est pas chargée.\nVeuillez recharger la page.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    let currentY = margin;

    // En-tête
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 LISTE UNIQUE DES ESPACES CLOS', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Info date
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'impression: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Ligne de séparation
    doc.setDrawColor(201, 148, 26); // Orange #c9941a
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // Extraire les espaces clos uniques
    const espaceClosMap = new Map();
    espaceClosData.forEach(item => {
        const espaceClos = item.espaceClos || '';
        if (!espaceClos || espaceClos === '-' || espaceClos.trim() === '') return;

        if (!espaceClosMap.has(espaceClos)) {
            espaceClosMap.set(espaceClos, {
                nom: espaceClos,
                count: 0,
                reclassifications: {
                    espaceClos: 0,
                    nonEspaceClos: 0,
                    nonDefini: 0
                }
            });
        }

        const stats = espaceClosMap.get(espaceClos);
        stats.count++;

        if (item.reclassification === 'Espace clos') {
            stats.reclassifications.espaceClos++;
        } else if (item.reclassification === 'Non espace clos') {
            stats.reclassifications.nonEspaceClos++;
        } else {
            stats.reclassifications.nonDefini++;
        }
    });

    const espacesClosUniques = Array.from(espaceClosMap.values()).sort((a, b) =>
        a.nom.localeCompare(b.nom)
    );

    // Statistiques globales
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${espacesClosUniques.length} espaces clos uniques`, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`(${espaceClosData.length} travaux au total)`, margin + 70, currentY);
    currentY += 7;

    // Ligne de séparation
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // Légende des couleurs
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Légende:', margin, currentY);

    // Vert
    doc.setFillColor(40, 167, 69);
    doc.circle(margin + 15, currentY - 1, 1.5, 'F');
    doc.text('Non EC', margin + 18, currentY);

    // Rouge
    doc.setFillColor(220, 53, 69);
    doc.circle(margin + 35, currentY - 1, 1.5, 'F');
    doc.text('EC Confirmé', margin + 38, currentY);

    // Orange
    doc.setFillColor(201, 148, 26);
    doc.circle(margin + 60, currentY - 1, 1.5, 'F');
    doc.text('À vérifier', margin + 63, currentY);

    doc.setTextColor(0, 0, 0);
    currentY += 7;

    // Liste des espaces clos
    espacesClosUniques.forEach((ec, index) => {
        if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = margin;
        }

        // Déterminer la couleur
        let statusColor = { r: 201, g: 148, b: 26 }; // Orange par défaut
        let statusText = 'À vérifier';

        if (ec.reclassifications.nonEspaceClos === ec.count) {
            statusColor = { r: 40, g: 167, b: 69 }; // Vert
            statusText = 'Non Espace Clos';
        } else if (ec.reclassifications.espaceClos > 0) {
            statusColor = { r: 220, g: 53, b: 69 }; // Rouge
            statusText = 'Espace Clos Confirmé';
        }

        // Encadré compact
        const boxHeight = 15;
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, pageWidth - (2 * margin), boxHeight, 'F');
        doc.setDrawColor(statusColor.r, statusColor.g, statusColor.b);
        doc.setLineWidth(0.5);
        doc.rect(margin, currentY, pageWidth - (2 * margin), boxHeight);

        // Numéro
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
        doc.text(`#${index + 1}`, margin + 2, currentY + 4);

        // Nom de l'espace clos
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(ec.nom, margin + 10, currentY + 5);

        // Nombre de travaux
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`${ec.count} travaux`, margin + 2, currentY + 9);

        // Reclassifications
        doc.setFontSize(7);
        doc.text(`EC: ${ec.reclassifications.espaceClos}`, margin + 30, currentY + 9);
        doc.text(`Non EC: ${ec.reclassifications.nonEspaceClos}`, margin + 50, currentY + 9);
        doc.text(`?: ${ec.reclassifications.nonDefini}`, margin + 75, currentY + 9);

        // Statut
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
        doc.setFontSize(7);
        doc.text(statusText, margin + 2, currentY + 13);

        currentY += boxHeight + 3;
    });

    // ========== TABLEAU DÉTAILLÉ DES ESPACES CLOS ==========

    // Nouvelle page pour le tableau
    doc.addPage();
    currentY = margin;

    // Titre du tableau
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TABLEAU DÉTAILLÉ DES TRAVAUX EN ESPACE CLOS', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Ligne de séparation
    doc.setDrawColor(201, 148, 26);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // Définir les colonnes du tableau
    const colWidths = {
        ec: 20,           // Espace clos
        ordre: 15,        // Ordre
        designOper: 50,   // Désignation opération
        poste: 35,        // Poste technique
        reclass: 20,      // Reclassification
        comment: 40       // Commentaire
    };

    // En-tête du tableau
    doc.setFillColor(201, 148, 26);
    doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');

    let colX = margin + 1;
    doc.text('Espace Clos', colX, currentY + 4);
    colX += colWidths.ec;
    doc.text('Ordre', colX, currentY + 4);
    colX += colWidths.ordre;
    doc.text('Désign. opér.', colX, currentY + 4);
    colX += colWidths.designOper;
    doc.text('Poste Technique', colX, currentY + 4);
    colX += colWidths.poste;
    doc.text('Reclass.', colX, currentY + 4);
    colX += colWidths.reclass;
    doc.text('Commentaire', colX, currentY + 4);

    currentY += 6;
    doc.setTextColor(0, 0, 0);

    // Trier les données par espace clos
    const sortedData = [...espaceClosData].sort((a, b) =>
        (a.espaceClos || '').localeCompare(b.espaceClos || '')
    );

    // Parcourir les données et créer les lignes du tableau
    sortedData.forEach((item, index) => {
        // Calculer la hauteur nécessaire pour cette ligne
        const designOperLines = doc.splitTextToSize(item.designOper || '-', colWidths.designOper - 2);
        const posteLines = doc.splitTextToSize(item.posteTechnique || '-', colWidths.poste - 2);
        const commentLines = item.commentaire ? doc.splitTextToSize(item.commentaire, colWidths.comment - 2) : [];

        const lineHeight = Math.max(6,
            designOperLines.length * 2.5,
            posteLines.length * 2.5,
            commentLines.length * 2.5 + 1
        );

        // Vérifier si on a besoin d'une nouvelle page
        if (currentY + lineHeight > pageHeight - margin - 5) {
            doc.addPage();
            currentY = margin;

            // Redessiner l'en-tête du tableau
            doc.setFillColor(201, 148, 26);
            doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');

            colX = margin + 1;
            doc.text('Espace Clos', colX, currentY + 4);
            colX += colWidths.ec;
            doc.text('Ordre', colX, currentY + 4);
            colX += colWidths.ordre;
            doc.text('Désign. opér.', colX, currentY + 4);
            colX += colWidths.designOper;
            doc.text('Poste Technique', colX, currentY + 4);
            colX += colWidths.poste;
            doc.text('Reclass.', colX, currentY + 4);
            colX += colWidths.reclass;
            doc.text('Commentaire', colX, currentY + 4);

            currentY += 6;
            doc.setTextColor(0, 0, 0);
        }

        // Dessiner la ligne du tableau
        const rowY = currentY;

        // Fond alterné
        if (index % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(margin, rowY, pageWidth - (2 * margin), lineHeight, 'F');
        }

        // Couleur de fond selon reclassification
        if (item.reclassification === 'Espace clos') {
            doc.setFillColor(255, 224, 224); // Rouge clair
            doc.rect(margin, rowY, pageWidth - (2 * margin), lineHeight, 'F');
        } else if (item.reclassification === 'Non espace clos') {
            doc.setFillColor(232, 245, 233); // Vert clair
            doc.rect(margin, rowY, pageWidth - (2 * margin), lineHeight, 'F');
        }

        // Bordures de cellules
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);

        colX = margin;

        // Espace clos
        doc.rect(colX, rowY, colWidths.ec, lineHeight);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(201, 148, 26);
        doc.text(item.espaceClos || '-', colX + 1, rowY + 3);
        doc.setTextColor(0, 0, 0);
        colX += colWidths.ec;

        // Ordre
        doc.rect(colX, rowY, colWidths.ordre, lineHeight);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text(item.ordre || '-', colX + 1, rowY + 3);
        colX += colWidths.ordre;

        // Désignation opération
        doc.rect(colX, rowY, colWidths.designOper, lineHeight);
        doc.setFontSize(5);
        doc.text(designOperLines, colX + 1, rowY + 2.5);
        colX += colWidths.designOper;

        // Poste technique
        doc.rect(colX, rowY, colWidths.poste, lineHeight);
        doc.setFontSize(5);
        doc.text(posteLines, colX + 1, rowY + 2.5);
        colX += colWidths.poste;

        // Reclassification
        doc.rect(colX, rowY, colWidths.reclass, lineHeight);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');

        if (item.reclassification === 'Espace clos') {
            doc.setTextColor(220, 53, 69); // Rouge
            doc.text('EC', colX + 2, rowY + lineHeight / 2);
        } else if (item.reclassification === 'Non espace clos') {
            doc.setTextColor(40, 167, 69); // Vert
            doc.text('Non EC', colX + 2, rowY + lineHeight / 2);
        } else {
            doc.setTextColor(150, 150, 150); // Gris
            doc.text('?', colX + 2, rowY + lineHeight / 2);
        }
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        colX += colWidths.reclass;

        // Commentaire
        doc.rect(colX, rowY, colWidths.comment, lineHeight);
        doc.setFontSize(5);
        if (commentLines.length > 0) {
            doc.text(commentLines, colX + 1, rowY + 2.5);
        }

        currentY += lineHeight;
    });

    // Pied de page avec légende (sur la dernière page)
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    const footerY = pageHeight - 8;
    doc.text('EC = Espace Clos', margin, footerY);
    doc.text(`${espaceClosData.length} travaux | Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth - margin - 80, footerY);

    // Afficher le PDF dans un nouvel onglet
    const fileName = `Espaces_Clos_Complet_${new Date().toISOString().split('T')[0]}.pdf`;
    window.libLoader.displayPDF(doc, fileName);
    console.log('[ESPACE-CLOS] ✅ PDF Complet généré:', fileName);
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.syncEspaceClosFromIw37n = syncEspaceClosFromIw37n;
    window.exportEspaceClosToExcel = exportEspaceClosToExcel;
    window.exportEspaceClosUniquePDF = exportEspaceClosUniquePDF;
    window.renderEspaceClosTable = renderEspaceClosTable;
    window.espaceClosActions = {
        syncEspaceClosFromIw37n,
        exportEspaceClosToExcel,
        exportEspaceClosUniquePDF,
        loadEspaceClosData,
        renderEspaceClosTable
    };
}

console.log('[ESPACE-CLOS] Module chargé');
