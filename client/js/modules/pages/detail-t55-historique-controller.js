/**
 * Controller pour la page Detail T55 Historique
 * @module pages/detail-t55-historique-controller
 *
 * Ce contrôleur gère toute la logique de la page Detail T55 Historique.
 * Il est automatiquement chargé et initialisé quand l'utilisateur navigue vers cette page.
 */

import { loadFromStorage, saveToStorage } from '../sync/storage-wrapper.js';
import { showNotification } from '../ui/notification.js';

/**
 * État local de la page
 */
let pageState = {
    data: [],
    filters: {},
    selectedItem: null,
    isInitialized: false
};

/**
 * Initialise la page et charge les données
 * Cette fonction est appelée automatiquement par page-loader.js
 */
export async function init() {
    console.log('[DETAIL-T55-HISTORIQUE] Initialisation de la page...');

    try {
        // Charger les données depuis le serveur
        await loadData();

        // Attacher les event listeners
        attachEventListeners();

        // Render initial
        render();

        pageState.isInitialized = true;
        console.log('[DETAIL-T55-HISTORIQUE] Page initialisee avec succes');

    } catch (error) {
        console.error('[DETAIL-T55-HISTORIQUE] Erreur initialisation:', error);
        showNotification('Erreur lors du chargement de la page', 'error');
    }
}

/**
 * Charge les données de la page depuis le serveur
 */
async function loadData() {
    try {
        console.log('[DETAIL-T55-HISTORIQUE] Debut du chargement des donnees...');

        // Charger les données via le module t55-historique.js
        const t55HistoriqueModule = await import('../data/t55-historique.js');

        // Attendre que le DOM soit prêt avant de charger les données
        console.log('[DETAIL-T55-HISTORIQUE] Attente de 200ms pour que le DOM soit pret...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Vérifier que le tbody existe avant de charger
        const tbody = document.getElementById('t55HistoriqueStandaloneTableBody');
        console.log('[DETAIL-T55-HISTORIQUE] Tbody trouve dans le DOM:', !!tbody);

        await t55HistoriqueModule.loadT55HistoriqueData();

        console.log('[DETAIL-T55-HISTORIQUE] Donnees chargees via t55-historique module');
    } catch (error) {
        console.error('[DETAIL-T55-HISTORIQUE] Erreur de chargement des donnees:', error);
        throw error;
    }
}

/**
 * Attache tous les event listeners de la page
 * Remplace les onclick= inline par des addEventListener modernes
 */
function attachEventListeners() {
    // EXEMPLE: Bouton d'ajout
    // const addBtn = document.querySelector('#detail-t55-historique .add-btn');
    // if (addBtn) {
    //     addBtn.addEventListener('click', handleAdd);
    // }

    // EXEMPLE: Bouton de retour au dashboard
    // const backBtn = document.querySelector('#detail-t55-historique .back-btn');
    // if (backBtn) {
    //     backBtn.addEventListener('click', () => {
    //         window.switchToPage('dashboard');
    //     });
    // }

    // EXEMPLE: Champ de recherche
    // const searchInput = document.querySelector('#detail-t55-historique .search-input');
    // if (searchInput) {
    //     searchInput.addEventListener('input', handleSearch);
    // }

    // EXEMPLE: Boutons d'action dans un tableau
    // const actionBtns = document.querySelectorAll('#detail-t55-historique .action-btn');
    // actionBtns.forEach(btn => {
    //     btn.addEventListener('click', (e) => handleAction(e));
    // });

    console.log('[DETAIL-T55-HISTORIQUE] Event listeners attachés');
}

/**
 * Render la page avec les données actuelles
 */
function render() {
    // TODO: Implémenter le rendu de la page
    // EXEMPLE: Remplir un tableau
    // const tbody = document.querySelector('#detail-t55-historique tbody');
    // if (!tbody) return;
    //
    // tbody.innerHTML = pageState.data.map(item => `
    //     <tr>
    //         <td>${item.name}</td>
    //         <td>
    //             <button class="edit-btn" data-id="${item.id}">✏️</button>
    //             <button class="delete-btn" data-id="${item.id}">🗑️</button>
    //         </td>
    //     </tr>
    // `).join('');

    console.log('[DETAIL-T55-HISTORIQUE] Rendu effectué');
}

/**
 * Sauvegarde les données sur le serveur
 */
async function saveData() {
    try {
        const storageKey = 'detail-t55-historiqueData';
        await saveToStorage(storageKey, pageState.data);
        console.log('[DETAIL-T55-HISTORIQUE] Données sauvegardées');
        showNotification('Données sauvegardées avec succès', 'success');
    } catch (error) {
        console.error('[DETAIL-T55-HISTORIQUE] Erreur de sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
        throw error;
    }
}

/**
 * Nettoyage avant de quitter la page
 * Cette fonction est appelée automatiquement par page-loader.js
 */
export function cleanup() {
    console.log('[DETAIL-T55-HISTORIQUE] Nettoyage de la page...');

    // TODO: Nettoyer les timers, intervals, event listeners globaux, etc.
    // EXEMPLE: Sauvegarder les données avant de quitter
    // if (pageState.hasChanges) {
    //     saveData();
    // }

    // Reset de l'état
    pageState.isInitialized = false;
}

/**
 * Force un rafraîchissement de la page
 * Utile pour les mises à jour en temps réel via Socket.io
 */
export async function refresh() {
    console.log('[DETAIL-T55-HISTORIQUE] Rafraîchissement de la page...');
    await loadData();
    render();
}

// ============================================================
// HANDLERS D'ÉVÉNEMENTS (À IMPLÉMENTER SELON VOS BESOINS)
// ============================================================

/**
 * Gere l'ajout d'un nouvel element
 */
function handleAdd() {
    // TODO: Implementer
    console.log('[DETAIL-T55-HISTORIQUE] Ajout d un nouvel element');
}

/**
 * Gère la recherche/filtrage
 */
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    // TODO: Implémenter le filtrage
    console.log('[DETAIL-T55-HISTORIQUE] Recherche:', query);
}

/**
 * Gère les actions (edit, delete, etc.)
 */
function handleAction(event) {
    const btn = event.target;
    const id = btn.dataset.id;
    const action = btn.classList.contains('edit-btn') ? 'edit' : 'delete';

    console.log(`[DETAIL-T55-HISTORIQUE] Action: ${action} sur ID: ${id}`);

    // TODO: Implémenter les actions
}

// Exporter les handlers si nécessaire pour les tests
export const handlers = {
    handleAdd,
    handleSearch,
    handleAction
};
