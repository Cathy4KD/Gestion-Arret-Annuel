/**
 * @fileoverview Gestion des plans d'aménagement (chantier et roulottes)
 * @module data/amenagement-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les données d'aménagement
 * @const {string}
 */
const STORAGE_KEY = 'amenagementData';

/**
 * Données des plans d'aménagement
 * @type {Object}
 */
let amenagementData = {
    plans: [],
    zones: []
};

/**
 * Charge les données d'aménagement depuis localStorage
 * @returns {Promise<void>}
 */
export async function loadAmenagementData() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        amenagementData = saved;
        console.log(`[AMENAGEMENT] ${amenagementData.plans?.length || 0} plans chargés depuis localStorage`);
        renderAmenagementPlans();
    } else {
        amenagementData = { plans: [], zones: [] };
        console.log('[AMENAGEMENT] Aucune donnée trouvée, initialisation avec données vides');
    }
}

/**
 * Sauvegarde les données d'aménagement
 * @returns {Promise<boolean>}
 */
async function saveAmenagementData() {
    try {
        await saveToStorage(STORAGE_KEY, amenagementData);
        console.log('[AMENAGEMENT] Données sauvegardées et synchronisées');
        return true;
    } catch (error) {
        console.error('[AMENAGEMENT] Erreur lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Gère l'upload d'une image de plan
 * @param {Event} event - Événement de changement du input file
 * @returns {void}
 */
export function handleAmenagementImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.warn('[AMENAGEMENT] Aucun fichier sélectionné');
        return;
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
        alert('⚠️ Veuillez sélectionner un fichier image (JPG, PNG, GIF)');
        return;
    }

    console.log('[AMENAGEMENT] Fichier sélectionné:', file.name, 'Taille:', file.size, 'Type:', file.type);

    const reader = new FileReader();

    reader.onload = async (e) => {
        console.log('[AMENAGEMENT] Image lue avec succès');

        const planData = {
            id: 'plan-' + Date.now(),
            name: file.name,
            type: file.type,
            size: file.size,
            uploadDate: new Date().toISOString(),
            imageData: e.target.result,
            zones: []
        };

        // Ajouter le plan
        amenagementData.plans.push(planData);
        console.log('[AMENAGEMENT] Plan ajouté. Total:', amenagementData.plans.length);

        // Sauvegarder
        const success = await saveAmenagementData();

        if (success) {
            // Rafraîchir l'affichage
            renderAmenagementPlans();
            alert(`✅ Plan "${file.name}" chargé avec succès!`);
        } else {
            alert(`⚠️ Plan "${file.name}" chargé mais non sauvegardé sur le serveur`);
        }

        // Réinitialiser l'input pour permettre de charger le même fichier à nouveau
        event.target.value = '';
    };

    reader.onerror = (error) => {
        console.error('[AMENAGEMENT] Erreur lors de la lecture du fichier:', error);
        alert('❌ Erreur lors de la lecture du fichier');
    };

    reader.readAsDataURL(file);
}

/**
 * Rend la liste des plans d'aménagement
 * @returns {void}
 */
export function renderAmenagementPlans() {
    const container = document.getElementById('amenagementPlansContainer');
    if (!container) {
        console.warn('[AMENAGEMENT] Container amenagementPlansContainer non trouvé');
        return;
    }

    if (!amenagementData.plans || amenagementData.plans.length === 0) {
        container.innerHTML = `
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; color: #666;">
                <p style="margin: 0; font-size: 1.1em;">📋 Aucun plan chargé</p>
                <p style="margin: 10px 0 0 0; font-size: 0.9em;">Cliquez sur "Ajouter un Plan" pour commencer</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    amenagementData.plans.forEach((plan, index) => {
        const planDiv = document.createElement('div');
        planDiv.style.cssText = 'background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;';

        planDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #333;">${plan.name}</h4>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.amenagementActions.downloadPlan('${plan.id}')"
                            style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        💾 Télécharger
                    </button>
                    <button onclick="window.amenagementActions.deletePlan('${plan.id}')"
                            style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
            <div style="text-align: center;">
                <img src="${plan.imageData}"
                     alt="${plan.name}"
                     style="max-width: 100%; max-height: 600px; border: 2px solid #dee2e6; border-radius: 8px; cursor: pointer;"
                     onclick="window.amenagementActions.openPlanEditor('${plan.id}')">
            </div>
            <p style="color: #666; font-size: 0.9em; margin-top: 10px;">
                📅 Chargé le ${new Date(plan.uploadDate).toLocaleDateString('fr-FR')} à ${new Date(plan.uploadDate).toLocaleTimeString('fr-FR')}
                | 📏 ${(plan.size / 1024).toFixed(1)} KB
                ${plan.zones && plan.zones.length > 0 ? ` | 📍 ${plan.zones.length} zone(s) marquée(s)` : ''}
            </p>
        `;

        container.appendChild(planDiv);
    });

    console.log('[AMENAGEMENT] Rendu de', amenagementData.plans.length, 'plan(s)');
}

/**
 * Télécharge un plan
 * @param {string} planId - ID du plan
 * @returns {void}
 */
export function downloadPlan(planId) {
    const plan = amenagementData.plans.find(p => p.id === planId);
    if (!plan) {
        alert('❌ Plan non trouvé');
        return;
    }

    const link = document.createElement('a');
    link.href = plan.imageData;
    link.download = plan.name;
    link.click();

    console.log('[AMENAGEMENT] Plan téléchargé:', plan.name);
}

/**
 * Supprime un plan
 * @param {string} planId - ID du plan
 * @returns {void}
 */
export async function deletePlan(planId) {
    const plan = amenagementData.plans.find(p => p.id === planId);
    if (!plan) {
        alert('❌ Plan non trouvé');
        return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer le plan "${plan.name}" ?\n\nCette action est irréversible.`)) {
        return;
    }

    // Supprimer le plan
    amenagementData.plans = amenagementData.plans.filter(p => p.id !== planId);

    // Sauvegarder
    await saveAmenagementData();

    // Rafraîchir
    renderAmenagementPlans();

    console.log('[AMENAGEMENT] Plan supprimé:', plan.name);
}

/**
 * Ouvre l'éditeur de plan (pour ajouter des zones)
 * @param {string} planId - ID du plan
 * @returns {void}
 */
export function openPlanEditor(planId) {
    alert('🚧 Fonctionnalité en développement\n\nL\'éditeur de zones sera disponible prochainement.\nVous pourrez marquer les zones de chantier, roulottes, etc. directement sur le plan.');
    console.log('[AMENAGEMENT] Ouverture éditeur pour plan:', planId);
}

/**
 * Exporte les données d'aménagement
 * @returns {void}
 */
export function exportAmenagementData() {
    if (!amenagementData.plans || amenagementData.plans.length === 0) {
        alert('⚠️ Aucun plan à exporter');
        return;
    }

    const exportData = {
        exportDate: new Date().toISOString(),
        plans: amenagementData.plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            uploadDate: plan.uploadDate,
            zones: plan.zones || []
        })),
        totalPlans: amenagementData.plans.length,
        totalZones: amenagementData.plans.reduce((sum, p) => sum + (p.zones?.length || 0), 0)
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Amenagement_Data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);

    console.log('[AMENAGEMENT] Données exportées');
}

/**
 * Récupère les données d'aménagement
 * @returns {Object}
 */
export function getAmenagementData() {
    return amenagementData;
}
