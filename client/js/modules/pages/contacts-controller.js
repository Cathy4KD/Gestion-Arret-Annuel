/**
 * Controller pour la page Contacts
 * @module pages/contacts-controller
 *
 * Ce contrôleur gère toute la logique de la page Contacts.
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
    console.log('[CONTACTS] Initialisation de la page...');

    try {
        // Charger les données depuis le serveur
        await loadData();

        // Attacher les event listeners
        attachEventListeners();

        // Render initial
        render();

        pageState.isInitialized = true;
        console.log('[CONTACTS] ✅ Page initialisée avec succès');

    } catch (error) {
        console.error('[CONTACTS] ❌ Erreur d'initialisation:', error);
        showNotification('Erreur lors du chargement de la page', 'error');
    }
}

/**
 * Charge les données de la page depuis le serveur
 */
async function loadData() {
    try {
        // TODO: Adapter le nom de la clé de stockage selon vos besoins
        const storageKey = 'contactsData';
        pageState.data = await loadFromStorage(storageKey) || [];

        console.log(`[CONTACTS] Données chargées: ${pageState.data.length} éléments`);
    } catch (error) {
        console.error('[CONTACTS] Erreur de chargement des données:', error);
        throw error;
    }
}

/**
 * Attache tous les event listeners de la page
 * Remplace les onclick= inline par des addEventListener modernes
 */
function attachEventListeners() {
    // EXEMPLE: Bouton d'ajout
    // const addBtn = document.querySelector('#contacts .add-btn');
    // if (addBtn) {
    //     addBtn.addEventListener('click', handleAdd);
    // }

    // EXEMPLE: Bouton de retour au dashboard
    // const backBtn = document.querySelector('#contacts .back-btn');
    // if (backBtn) {
    //     backBtn.addEventListener('click', () => {
    //         window.switchToPage('dashboard');
    //     });
    // }

    // EXEMPLE: Champ de recherche
    // const searchInput = document.querySelector('#contacts .search-input');
    // if (searchInput) {
    //     searchInput.addEventListener('input', handleSearch);
    // }

    // EXEMPLE: Boutons d'action dans un tableau
    // const actionBtns = document.querySelectorAll('#contacts .action-btn');
    // actionBtns.forEach(btn => {
    //     btn.addEventListener('click', (e) => handleAction(e));
    // });

    console.log('[CONTACTS] Event listeners attachés');
}

/**
 * Render la page avec les données actuelles
 */
function render() {
    // TODO: Implémenter le rendu de la page
    // EXEMPLE: Remplir un tableau
    // const tbody = document.querySelector('#contacts tbody');
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

    console.log('[CONTACTS] Rendu effectué');
}

/**
 * Sauvegarde les données sur le serveur
 */
async function saveData() {
    try {
        const storageKey = 'contactsData';
        await saveToStorage(storageKey, pageState.data);
        console.log('[CONTACTS] Données sauvegardées');
        showNotification('Données sauvegardées avec succès', 'success');
    } catch (error) {
        console.error('[CONTACTS] Erreur de sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
        throw error;
    }
}

/**
 * Nettoyage avant de quitter la page
 * Cette fonction est appelée automatiquement par page-loader.js
 */
export function cleanup() {
    console.log('[CONTACTS] Nettoyage de la page...');

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
    console.log('[CONTACTS] Rafraîchissement de la page...');
    await loadData();
    render();
}

// ============================================================
// HANDLERS D'ÉVÉNEMENTS (À IMPLÉMENTER SELON VOS BESOINS)
// ============================================================

/**
 * Gère l'ajout d'un nouvel élément
 */
function handleAdd() {
    // TODO: Implémenter
    console.log('[CONTACTS] Ajout d'un nouvel élément');
}

/**
 * Gère la recherche/filtrage
 */
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    // TODO: Implémenter le filtrage
    console.log('[CONTACTS] Recherche:', query);
}

/**
 * Gère les actions (edit, delete, etc.)
 */
function handleAction(event) {
    const btn = event.target;
    const id = btn.dataset.id;
    const action = btn.classList.contains('edit-btn') ? 'edit' : 'delete';

    console.log(`[CONTACTS] Action: ${action} sur ID: ${id}`);

    // TODO: Implémenter les actions
}

// Exporter les handlers si nécessaire pour les tests
export const handlers = {
    handleAdd,
    handleSearch,
    handleAction
};
