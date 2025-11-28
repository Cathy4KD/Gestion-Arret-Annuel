/**
 * @fileoverview Gestion des Plans d'Entretien à Long Délai
 * @module data/plans-entretien
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Données des plans d'entretien
 * @type {Array}
 */
let plansEntretienData = [];

/**
 * Données des modifications apportées aux plans
 * @type {Array}
 */
let modificationsData = [];

/**
 * Fonction setter pour injection des données depuis le serveur
 * @param {Array} data - Données des modifications
 */
export function setPlansModificationsData(data) {
    if (data && Array.isArray(data)) {
        modificationsData = data;
        console.log(`[PLANS] ✅ Données modifications injectées: ${data.length} modifications`);
    } else {
        modificationsData = [];
        console.log('[PLANS] ℹ️ Aucune modification depuis le serveur');
    }

    // Rendre le tableau si l'élément existe dans le DOM (page déjà chargée)
    if (document.getElementById('modificationsTableBody')) {
        console.log('[PLANS] 🎨 Rendu du tableau modifications (données du serveur)');
        renderModificationsTable();
    }
}

// Exposer globalement pour server-sync.js
window.setPlansModificationsData = setPlansModificationsData;

/**
 * Charge les données des plans d'entretien depuis localStorage
 * @returns {void}
 */
export async function loadPlansData() {
    const saved = await loadFromStorage('plansData');
    if (saved) {
        plansEntretienData = saved;
        console.log(`[PLANS] ${plansEntretienData.length} plans chargés depuis localStorage`);
        renderPlansTable();
    }

    // Charger également les modifications (uniquement si pas déjà en mémoire)
    if (modificationsData.length === 0) {
        console.log('[PLANS] 📥 Chargement des modifications depuis le serveur...');
        const savedModifications = await loadFromStorage('plansModificationsData');
        console.log('[PLANS] Résultat du chargement:', savedModifications ? 'Données reçues' : 'Aucune donnée');

        if (savedModifications && Array.isArray(savedModifications)) {
            modificationsData = savedModifications;
            console.log(`[PLANS] ✅ ${modificationsData.length} modifications chargées depuis le serveur`);
            console.log('[PLANS] Données chargées:', JSON.stringify(modificationsData));

            // Mettre à jour les anciennes modifications avec les nouveaux champs s'ils n'existent pas
            modificationsData = modificationsData.map(modif => ({
                id: modif.id,
                planEntretien: modif.planEntretien || '',
                gamme: modif.gamme || '',
                posteEntretien: modif.posteEntretien || '',
                modification: modif.modification || '',
                nouvellesFrequences: modif.nouvellesFrequences || '',
                dateCreation: modif.dateCreation || new Date().toISOString()
            }));
        } else {
            console.log('[PLANS] ⚠️ Aucune modification trouvée - initialisation tableau vide');
        }
    } else {
        console.log(`[PLANS] ✅ Utilisation des données déjà en mémoire: ${modificationsData.length} modifications`);
    }

    // Toujours afficher le tableau (même vide)
    setTimeout(() => {
        renderModificationsTable();
    }, 150);
}

/**
 * Sauvegarde les données des plans d'entretien dans localStorage ET serveur
 * @returns {void}
 */
function savePlansData() {
    saveToStorage('plansData', plansEntretienData);
    console.log('[PLANS] Données sauvegardées et synchronisées avec le serveur');
}

/**
 * Gère l'upload du fichier Excel/CSV des plans d'entretien
 * @param {Event} event - Événement de changement du fichier
 * @returns {Promise<void>}
 */
export async function handlePlansUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que XLSX est chargé
    if (typeof XLSX === 'undefined') {
        console.error('[PLANS] ❌ XLSX non chargé');
        alert('❌ Erreur: La bibliothèque Excel (XLSX) n\'est pas chargée.\n\nVeuillez recharger la page (F5 ou Ctrl+R).');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Mapper les données selon les colonnes attendues
            plansEntretienData = jsonData.map(row => ({
                planEnt: row['Plan d\'ent'] || row['Plan d ent'] || '',
                texte: row['Texte PlanEntr.'] || row['Texte PlanEntr'] || '',
                interval: row['Interval'] || '',
                uniteInterval: row['Un.interv.'] || row['Un interv'] || '',
                secteur: row['Secteur'] || '',
                aa: row['AA'] || '',
                debut: row['Début'] || row['Debut'] || '',
                freq: row['Fréq.'] || row['Freq'] || '',
                s1: row['S1'] || '',
                s2: row['S2'] || '',
                s3: row['S3'] || '',
                s4: row['S4'] || ''
            }));

            console.log(`[PLANS] ${plansEntretienData.length} plans chargés depuis le fichier`);
            renderPlansTable();

            // Sauvegarder les données
            savePlansData();

            alert(`✅ ${plansEntretienData.length} plans d'entretien chargés avec succès !`);
        } catch (error) {
            console.error('[PLANS] Erreur lors de la lecture du fichier:', error);
            alert('Erreur lors de la lecture du fichier. Veuillez vérifier le format.');
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Affiche le tableau des plans d'entretien
 * @returns {void}
 */
export function renderPlansTable() {
    const tbody = document.getElementById('plansTableBody');
    const filterAnneeInput = document.getElementById('filterAnnee');

    if (!tbody) {
        console.warn('[PLANS] Element plansTableBody non trouvé');
        return;
    }

    const anneeFilter = filterAnneeInput ? parseInt(filterAnneeInput.value) : null;

    if (!plansEntretienData || plansEntretienData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="padding: 30px; text-align: center; color: #666;">
                    Aucun plan d'entretien chargé. Veuillez importer un fichier Excel ou CSV.
                </td>
            </tr>
        `;
        return;
    }

    // Filtrer par année si nécessaire (basé sur la colonne AA ou Début)
    const filteredPlans = plansEntretienData.filter(plan => {
        if (!anneeFilter) return true;
        return plan.debut == anneeFilter || plan.aa === 'Oui';
    });

    tbody.innerHTML = '';
    filteredPlans.forEach((plan, index) => {
        const bgColor = plan.secteur === 'MACC' ? '#d4edda' : (index % 2 === 0 ? '#f8f9fa' : 'white');
        const row = document.createElement('tr');
        row.style.background = bgColor;
        row.style.height = '28px';

        row.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; white-space: nowrap; font-size: 12px; background: #e9ecef;">${plan.planEnt}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; font-size: 12px; background: #e9ecef;">${plan.texte}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${plan.interval}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${plan.uniteInterval}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${plan.secteur}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${plan.aa}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${plan.debut}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: #e9ecef;">${plan.freq}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: ${plan.s1 ? '#e3f2fd' : '#e9ecef'};">${plan.s1 || ''}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: ${plan.s2 ? '#e3f2fd' : '#e9ecef'};">${plan.s2 || ''}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: ${plan.s3 ? '#e3f2fd' : '#e9ecef'};">${plan.s3 || ''}</td>
            <td style="padding: 2px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; background: ${plan.s4 ? '#e3f2fd' : '#e9ecef'};">${plan.s4 || ''}</td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[PLANS] Tableau rendu: ${filteredPlans.length} plans affichés`);
}

/**
 * Récupère les données des plans d'entretien
 * @returns {Array}
 */
export function getPlansData() {
    return plansEntretienData;
}

/**
 * Sauvegarde les données des modifications
 * @returns {Promise<void>}
 */
/**
 * Timer pour le debounce de sauvegarde
 */
let saveTimer = null;

/**
 * Sauvegarde différée (debounced) pour éviter trop de requêtes serveur
 */
function scheduleSave() {
    if (saveTimer) {
        clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
        saveModificationsData();
    }, 1000); // Attendre 1 seconde après la dernière modification
}

async function saveModificationsData() {
    console.log('[PLANS] Sauvegarde de', modificationsData.length, 'modifications...');

    const success = await saveToStorage('plansModificationsData', modificationsData, false); // false = afficher les logs

    if (success) {
        console.log('[PLANS] ✅ Modifications sauvegardées et synchronisées avec le serveur');
    } else {
        console.error('[PLANS] ❌ ÉCHEC de la sauvegarde des modifications');
    }

    return success;
}

/**
 * Ajoute une nouvelle ligne de modification
 * @returns {Promise<void>}
 */
export function addModificationRow() {
    const newModification = {
        id: 'modif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        planEntretien: '',
        gamme: '',
        posteEntretien: '',
        modification: '',
        nouvellesFrequences: '',
        dateCreation: new Date().toISOString()
    };

    modificationsData.unshift(newModification);
    renderModificationsTable(); // Afficher immédiatement
    scheduleSave(); // Sauvegarder en arrière-plan
}

/**
 * Met à jour un champ d'une modification
 * @param {string} id - ID de la modification
 * @param {string} field - Nom du champ
 * @param {string} value - Nouvelle valeur
 * @returns {void}
 */
export function updateModificationField(id, field, value) {
    const modification = modificationsData.find(m => m.id === id);
    if (modification) {
        modification[field] = value;
        scheduleSave(); // Sauvegarde différée (1 seconde après la dernière modification)
    }
}

/**
 * Supprime une modification
 * @param {string} id - ID de la modification
 * @returns {void}
 */
export function deleteModification(id) {
    if (confirm('Voulez-vous vraiment supprimer cette modification ?')) {
        modificationsData = modificationsData.filter(m => m.id !== id);
        renderModificationsTable(); // Afficher immédiatement
        scheduleSave(); // Sauvegarder en arrière-plan
    }
}

/**
 * Affiche le tableau des modifications
 * @returns {void}
 */
export function renderModificationsTable() {
    const tbody = document.getElementById('modificationsTableBody');
    if (!tbody) {
        console.warn('[PLANS] Element modificationsTableBody non trouvé');
        return;
    }

    if (!modificationsData || modificationsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666;">
                    Aucune modification enregistrée. Cliquez sur "Ajouter une modification" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    modificationsData.forEach((modif, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${modif.planEntretien || ''}"
                       placeholder="Ex: PE-12345"
                       onchange="window.plansActions.updateModificationField('${modif.id}', 'planEntretien', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; ${!modif.planEntretien ? 'background: #fffbcc;' : ''}">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${modif.gamme || ''}"
                       placeholder="Gamme..."
                       onchange="window.plansActions.updateModificationField('${modif.id}', 'gamme', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; ${!modif.gamme ? 'background: #fffbcc;' : ''}">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${modif.posteEntretien || ''}"
                       placeholder="Poste d'entretien..."
                       onchange="window.plansActions.updateModificationField('${modif.id}', 'posteEntretien', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; ${!modif.posteEntretien ? 'background: #fffbcc;' : ''}">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea
                    placeholder="Description de la modification..."
                    onchange="window.plansActions.updateModificationField('${modif.id}', 'modification', this.value)"
                    style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; min-height: 60px; resize: vertical; ${!modif.modification ? 'background: #fffbcc;' : ''}">${modif.modification || ''}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text"
                       value="${modif.nouvellesFrequences || ''}"
                       placeholder="Ex: Mensuelle, Trimestrielle..."
                       onchange="window.plansActions.updateModificationField('${modif.id}', 'nouvellesFrequences', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; ${!modif.nouvellesFrequences ? 'background: #fffbcc;' : ''}">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.plansActions.deleteModification('${modif.id}')"
                        style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                    🗑️ Supprimer
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[PLANS] Tableau modifications rendu: ${modificationsData.length} modifications affichées`);
}
