/**
 * @fileoverview Gestion des Ressources de Planification
 * @module data/ressources-planification
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les ressources
 * @const {string}
 */
const RESSOURCES_KEY = 'ressourcesPlanificationData';

/**
 * Données des ressources en mémoire
 * @type {Array<Object>}
 */
let ressourcesData = [];

/**
 * Index de la ressource en cours d'édition (-1 si nouvelle ressource)
 * @type {number}
 */
let editingIndex = -1;

/**
 * Set ressources data (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setRessourcesPlanificationData(data) {
    ressourcesData = data || [];
    console.log(`[RESSOURCES] ✅ ${ressourcesData.length} ressources injectées depuis le serveur`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setRessourcesPlanificationData = setRessourcesPlanificationData;
    console.log('[RESSOURCES] ✅ window.setRessourcesPlanificationData exposée');
}

/**
 * Charge les ressources depuis le serveur ou localStorage
 * @returns {Array} Données chargées
 */
export function loadRessources() {
    // Si déjà en mémoire (injecté par le serveur), retourner
    if (ressourcesData && ressourcesData.length > 0) {
        console.log(`[RESSOURCES] ${ressourcesData.length} ressources déjà en mémoire (depuis serveur)`);
        return ressourcesData;
    }

    // Sinon, charger depuis localStorage (fallback)
    const saved = loadFromStorage(RESSOURCES_KEY);
    if (saved) {
        ressourcesData = saved;
        console.log(`[RESSOURCES] ${ressourcesData.length} ressources chargées depuis localStorage (fallback)`);
    } else {
        ressourcesData = [];
        console.log('[RESSOURCES] Aucune ressource trouvée, initialisation à tableau vide');
    }

    return ressourcesData;
}

/**
 * Sauvegarde les ressources sur le serveur
 * @returns {Promise<boolean>} True si succès
 */
async function saveRessources() {
    const success = await saveToStorage(RESSOURCES_KEY, ressourcesData);
    if (success) {
        console.log(`[RESSOURCES] ✅ ${ressourcesData.length} ressources sauvegardées sur le serveur`);
    } else {
        console.error('[RESSOURCES] ❌ Échec de la sauvegarde des ressources sur le serveur');
    }
    return success;
}

/**
 * Initialise la page des ressources
 * @returns {void}
 */
export function initRessourcesPage() {
    console.log('[RESSOURCES] Initialisation de la page Ressources...');

    loadRessources();
    renderRessourcesTable();
    updateStatistics();

    console.log('[RESSOURCES] Page initialisée');
}

/**
 * Affiche/masque le formulaire d'ajout
 * @returns {void}
 */
export function toggleForm() {
    const form = document.getElementById('ressourceForm');
    const btn = document.getElementById('toggleFormBtn');

    if (form.style.display === 'none') {
        form.style.display = 'block';
        btn.textContent = '❌ Fermer le formulaire';
        btn.style.background = '#dc3545';
        editingIndex = -1;
        clearForm();
    } else {
        form.style.display = 'none';
        btn.textContent = '➕ Nouvelle Ressource';
        btn.style.background = '#28a745';
        editingIndex = -1;
        clearForm();
    }
}

/**
 * Vide le formulaire
 * @returns {void}
 */
function clearForm() {
    document.getElementById('inputNom').value = '';
    document.getElementById('inputRole').value = '';
    document.getElementById('inputResponsabilites').value = '';
}

/**
 * Annule l'édition
 * @returns {void}
 */
export function cancelForm() {
    const form = document.getElementById('ressourceForm');
    const btn = document.getElementById('toggleFormBtn');

    form.style.display = 'none';
    btn.textContent = '➕ Nouvelle Ressource';
    btn.style.background = '#28a745';
    editingIndex = -1;
    clearForm();
}

/**
 * Sauvegarde une ressource (création ou modification)
 * @returns {Promise<void>}
 */
export async function saveRessource() {
    const nom = document.getElementById('inputNom').value.trim();
    const role = document.getElementById('inputRole').value.trim();
    const responsabilites = document.getElementById('inputResponsabilites').value.trim();

    // Validation
    if (!nom) {
        alert('⚠️ Le nom est obligatoire');
        document.getElementById('inputNom').focus();
        return;
    }

    if (!role) {
        alert('⚠️ Le rôle est obligatoire');
        document.getElementById('inputRole').focus();
        return;
    }

    // Créer l'objet ressource
    const ressource = {
        id: editingIndex >= 0 ? ressourcesData[editingIndex].id : generateId(),
        nom,
        role,
        responsabilites,
        createdAt: editingIndex >= 0 ? ressourcesData[editingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Ajouter ou modifier
    if (editingIndex >= 0) {
        ressourcesData[editingIndex] = ressource;
        console.log(`[RESSOURCES] Ressource modifiée: ${role}`);
    } else {
        ressourcesData.push(ressource);
        console.log(`[RESSOURCES] Nouvelle ressource ajoutée: ${role}`);
    }

    // Sauvegarder sur le serveur
    const success = await saveRessources();

    if (success) {
        // Rafraîchir l'affichage
        renderRessourcesTable();
        updateStatistics();
        cancelForm();

        alert(`✅ Ressource "${role}" enregistrée avec succès !`);
    } else {
        alert(`❌ ERREUR: La ressource n'a pas pu être sauvegardée sur le serveur.\n\nVérifiez que le serveur est démarré.`);
    }
}

/**
 * Génère un ID unique
 * @returns {string}
 */
function generateId() {
    return 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Modifie une ressource
 * @param {number} index - Index de la ressource
 * @returns {void}
 */
export function editRessource(index) {
    const ressource = ressourcesData[index];

    if (!ressource) {
        alert('❌ Ressource introuvable');
        return;
    }

    // Remplir le formulaire
    document.getElementById('inputNom').value = ressource.nom;
    document.getElementById('inputRole').value = ressource.role;
    document.getElementById('inputResponsabilites').value = ressource.responsabilites || '';

    // Afficher le formulaire
    const form = document.getElementById('ressourceForm');
    const btn = document.getElementById('toggleFormBtn');

    form.style.display = 'block';
    btn.textContent = '❌ Fermer le formulaire';
    btn.style.background = '#dc3545';

    // Mémoriser l'index
    editingIndex = index;

    // Scroll vers le formulaire
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Supprime une ressource
 * @param {number} index - Index de la ressource
 * @returns {Promise<void>}
 */
export async function deleteRessource(index) {
    const ressource = ressourcesData[index];

    if (!ressource) {
        alert('❌ Ressource introuvable');
        return;
    }

    if (!confirm(`⚠️ Voulez-vous vraiment supprimer la ressource "${ressource.role}" ?\n\nCette action est irréversible.`)) {
        return;
    }

    // Supprimer
    ressourcesData.splice(index, 1);
    console.log(`[RESSOURCES] Ressource supprimée: ${ressource.role}`);

    // Sauvegarder sur le serveur
    const success = await saveRessources();

    if (success) {
        // Rafraîchir l'affichage
        renderRessourcesTable();
        updateStatistics();

        alert(`✅ Ressource "${ressource.role}" supprimée avec succès !`);
    } else {
        alert(`❌ ERREUR: La suppression n'a pas pu être sauvegardée sur le serveur.`);
    }
}

/**
 * Met à jour une cellule du tableau manuellement et sauvegarde
 * @param {number} index - Index de la ressource
 * @param {string} field - Nom du champ à mettre à jour ('nom', 'role', 'responsabilites')
 * @param {string} value - Nouvelle valeur
 * @returns {Promise<void>}
 */
export async function updateCell(index, field, value) {
    if (!ressourcesData[index]) {
        console.error('[RESSOURCES] Ressource introuvable pour la mise à jour de la cellule');
        return;
    }

    ressourcesData[index][field] = value.trim();
    const success = await saveRessources();

    if (success) {
        console.log(`[RESSOURCES] ✅ Cellule ${field} mise à jour et sauvegardée pour la ressource ${index}`);
        updateStatistics(); // Mettre à jour les statistiques après modification
    } else {
        console.error(`[RESSOURCES] ❌ Erreur lors de la sauvegarde de la cellule ${field} pour la ressource ${index}`);
    }
}

/**
 * Affiche le tableau des ressources
 * @returns {void}
 */
function renderRessourcesTable() {
    const tbody = document.getElementById('ressourcesTableBody');

    if (!tbody) {
        console.error('[RESSOURCES] Element ressourcesTableBody non trouvé');
        return;
    }

    if (ressourcesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucune ressource définie. Cliquez sur "➕ Nouvelle Ressource" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ressourcesData.map((ressource, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';

        return `
            <tr style="background: ${bgColor};">
                <td contenteditable="true" onblur="window.ressourcesActions.updateCell(${index}, 'nom', this.textContent)"
                    style="padding: 12px; border: 1px solid #dee2e6;">
                    <strong style="color: #667eea;">${ressource.nom}</strong>
                </td>
                <td contenteditable="true" onblur="window.ressourcesActions.updateCell(${index}, 'role', this.textContent)"
                    style="padding: 12px; border: 1px solid #dee2e6;">
                    ${ressource.role}
                </td>
                <td contenteditable="true" onblur="window.ressourcesActions.updateCell(${index}, 'responsabilites', this.textContent)"
                    style="padding: 12px; border: 1px solid #dee2e6;">
                    ${ressource.responsabilites || '<span style="color: #999;">Non spécifié</span>'}
                </td>
                <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">
                    <button onclick="window.ressourcesActions.deleteRessource(${index})"
                            style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;"
                            title="Supprimer">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    console.log(`[RESSOURCES] Tableau rendu: ${ressourcesData.length} ressources`);
}

/**
 * Met à jour les statistiques
 * @returns {void}
 */
function updateStatistics() {
    const totalRessources = ressourcesData.length;
    const totalRoles = new Set(ressourcesData.map(r => r.role)).size;
    const totalPersonnes = ressourcesData.length; // Assuming each resource represents one person

    document.getElementById('totalRessources').textContent = totalRessources;
    document.getElementById('totalRoles').textContent = totalRoles;
    document.getElementById('totalPersonnes').textContent = totalPersonnes;
}

/**
 * Exporte les ressources vers Excel
 * @returns {void}
 */
export function exportToExcel() {
    if (ressourcesData.length === 0) {
        alert('⚠️ Aucune ressource à exporter');
        return;
    }

    try {
        const exportData = ressourcesData.map(ressource => ({
            'Nom': ressource.nom,
            'Rôle': ressource.role,
            'Responsabilités': ressource.responsabilites || ''
        }));

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ressources');

        const fileName = `Ressources_Planification_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[RESSOURCES] Export Excel réussi:', fileName);
        alert(`✅ Export réussi: ${fileName}`);
    } catch (error) {
        console.error('[RESSOURCES] Erreur export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel');
    }
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.ressourcesActions = {
        initRessourcesPage,
        toggleForm,
        cancelForm,
        saveRessource,
        editRessource,
        deleteRessource,
        updateCell, // Add this line
        exportToExcel
    };

    console.log('[RESSOURCES] ✅ Actions exposées globalement');
}
