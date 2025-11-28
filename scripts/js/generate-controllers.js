#!/usr/bin/env node
/**
 * Script de génération automatique des contrôleurs de pages
 * Génère un fichier controller.js pour chaque page HTML extraite
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins
const PAGES_DIR = path.join(__dirname, '..', '..', 'client', 'components', 'pages');
const CONTROLLERS_DIR = path.join(__dirname, '..', '..', 'client', 'js', 'modules', 'pages');
const MAPPING_FILE = path.join(PAGES_DIR, '_pages-mapping.json');

/**
 * Template de contrôleur de page
 */
const CONTROLLER_TEMPLATE = (pageId, pageName) => `/**
 * Controller pour la page ${pageName}
 * @module pages/${pageId}-controller
 *
 * Ce contrôleur gère toute la logique de la page ${pageName}.
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
    console.log('[${pageId.toUpperCase()}] Initialisation de la page...');

    try {
        // Charger les données depuis le serveur
        await loadData();

        // Attacher les event listeners
        attachEventListeners();

        // Render initial
        render();

        pageState.isInitialized = true;
        console.log('[${pageId.toUpperCase()}] ✅ Page initialisée avec succès');

    } catch (error) {
        console.error('[${pageId.toUpperCase()}] ❌ Erreur d\'initialisation:', error);
        showNotification('Erreur lors du chargement de la page', 'error');
    }
}

/**
 * Charge les données de la page depuis le serveur
 */
async function loadData() {
    try {
        // TODO: Adapter le nom de la clé de stockage selon vos besoins
        const storageKey = '${pageId}Data';
        pageState.data = await loadFromStorage(storageKey) || [];

        console.log(\`[${pageId.toUpperCase()}] Données chargées: \${pageState.data.length} éléments\`);
    } catch (error) {
        console.error('[${pageId.toUpperCase()}] Erreur de chargement des données:', error);
        throw error;
    }
}

/**
 * Attache tous les event listeners de la page
 * Remplace les onclick= inline par des addEventListener modernes
 */
function attachEventListeners() {
    // EXEMPLE: Bouton d'ajout
    // const addBtn = document.querySelector('#${pageId} .add-btn');
    // if (addBtn) {
    //     addBtn.addEventListener('click', handleAdd);
    // }

    // EXEMPLE: Bouton de retour au dashboard
    // const backBtn = document.querySelector('#${pageId} .back-btn');
    // if (backBtn) {
    //     backBtn.addEventListener('click', () => {
    //         window.switchToPage('dashboard');
    //     });
    // }

    // EXEMPLE: Champ de recherche
    // const searchInput = document.querySelector('#${pageId} .search-input');
    // if (searchInput) {
    //     searchInput.addEventListener('input', handleSearch);
    // }

    // EXEMPLE: Boutons d'action dans un tableau
    // const actionBtns = document.querySelectorAll('#${pageId} .action-btn');
    // actionBtns.forEach(btn => {
    //     btn.addEventListener('click', (e) => handleAction(e));
    // });

    console.log('[${pageId.toUpperCase()}] Event listeners attachés');
}

/**
 * Render la page avec les données actuelles
 */
function render() {
    // TODO: Implémenter le rendu de la page
    // EXEMPLE: Remplir un tableau
    // const tbody = document.querySelector('#${pageId} tbody');
    // if (!tbody) return;
    //
    // tbody.innerHTML = pageState.data.map(item => \`
    //     <tr>
    //         <td>\${item.name}</td>
    //         <td>
    //             <button class="edit-btn" data-id="\${item.id}">✏️</button>
    //             <button class="delete-btn" data-id="\${item.id}">🗑️</button>
    //         </td>
    //     </tr>
    // \`).join('');

    console.log('[${pageId.toUpperCase()}] Rendu effectué');
}

/**
 * Sauvegarde les données sur le serveur
 */
async function saveData() {
    try {
        const storageKey = '${pageId}Data';
        await saveToStorage(storageKey, pageState.data);
        console.log('[${pageId.toUpperCase()}] Données sauvegardées');
        showNotification('Données sauvegardées avec succès', 'success');
    } catch (error) {
        console.error('[${pageId.toUpperCase()}] Erreur de sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
        throw error;
    }
}

/**
 * Nettoyage avant de quitter la page
 * Cette fonction est appelée automatiquement par page-loader.js
 */
export function cleanup() {
    console.log('[${pageId.toUpperCase()}] Nettoyage de la page...');

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
    console.log('[${pageId.toUpperCase()}] Rafraîchissement de la page...');
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
    console.log('[${pageId.toUpperCase()}] Ajout d\'un nouvel élément');
}

/**
 * Gère la recherche/filtrage
 */
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    // TODO: Implémenter le filtrage
    console.log('[${pageId.toUpperCase()}] Recherche:', query);
}

/**
 * Gère les actions (edit, delete, etc.)
 */
function handleAction(event) {
    const btn = event.target;
    const id = btn.dataset.id;
    const action = btn.classList.contains('edit-btn') ? 'edit' : 'delete';

    console.log(\`[${pageId.toUpperCase()}] Action: \${action} sur ID: \${id}\`);

    // TODO: Implémenter les actions
}

// Exporter les handlers si nécessaire pour les tests
export const handlers = {
    handleAdd,
    handleSearch,
    handleAction
};
`;

/**
 * Génère tous les contrôleurs
 */
function generateControllers() {
    console.log('[GENERATE-CONTROLLERS] Démarrage...\n');

    // Créer le dossier des contrôleurs s'il n'existe pas
    if (!fs.existsSync(CONTROLLERS_DIR)) {
        fs.mkdirSync(CONTROLLERS_DIR, { recursive: true });
        console.log(`[OK] Dossier créé: ${CONTROLLERS_DIR}`);
    }

    // Lire le mapping des pages
    if (!fs.existsSync(MAPPING_FILE)) {
        console.error(`[ERROR] Fichier de mapping non trouvé: ${MAPPING_FILE}`);
        console.error('Exécutez d\'abord extract-pages.py');
        process.exit(1);
    }

    const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
    const pageIds = Object.keys(mapping);

    console.log(`[INFO] ${pageIds.length} pages trouvées dans le mapping\n`);

    let created = 0;
    let skipped = 0;

    // Générer un contrôleur pour chaque page
    for (const pageId of pageIds) {
        const controllerFileName = `${pageId}-controller.js`;
        const controllerPath = path.join(CONTROLLERS_DIR, controllerFileName);

        // Ne pas écraser si existe déjà
        if (fs.existsSync(controllerPath)) {
            console.log(`[SKIP] ${controllerFileName} existe déjà`);
            skipped++;
            continue;
        }

        // Nom formaté pour les commentaires
        const pageName = pageId
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        // Générer le contrôleur
        const content = CONTROLLER_TEMPLATE(pageId, pageName);

        // Écrire le fichier
        fs.writeFileSync(controllerPath, content, 'utf-8');
        console.log(`[OK] ${controllerFileName} créé`);
        created++;
    }

    console.log(`\n[SUCCESS] Génération terminée!`);
    console.log(`  - Créés: ${created}`);
    console.log(`  - Ignorés (existants): ${skipped}`);
    console.log(`  - Total: ${pageIds.length}`);
    console.log(`\nContrôleurs dans: ${CONTROLLERS_DIR}`);
}

// Exécution
generateControllers();
