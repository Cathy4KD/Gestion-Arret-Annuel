/**
 * @fileoverview Module de gestion des commandes de consommables d'arrêt
 * @module data/consommables-commande-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

/**
 * Clé de stockage
 * @const {string}
 */
const STORAGE_KEY = 'consommablesCommandeData';

/**
 * Données des consommables
 * Structure: {
 *   anneePrecedente: string,
 *   ordre: string,
 *   anneeActuelle: string,
 *   machines: Array<{id, code, description, image}>,
 *   articles: Array<{id, ordre, article, description, qty, nouvelleQty, machineQtys: {}}>,
 *   annees: Array<string>
 * }
 */
let consommablesData = {
    anneePrecedente: '2024',
    ordre: '112297222',
    anneeActuelle: '2025',
    machines: [
        {
            id: 'm1',
            code: 'A2 K-DSTMGGO60M',
            description: 'gants en cuir de vache style monteur Taille M',
            image: null
        },
        {
            id: 'm2',
            code: 'A6 K-DSTMGGO60L',
            description: 'gants en cuir de vache style',
            image: null
        },
        {
            id: 'm3',
            code: 'A8 K-DSTMGGO60XL',
            description: 'gants en cuir de vache style monteur',
            image: null
        },
        {
            id: 'm4',
            code: 'D0 YIU519',
            description: 'Lunette de sécurité',
            image: null
        },
        {
            id: 'm5',
            code: 'F5 K-DSTMGC1718',
            description: 'Gant nitri-flex 7/8',
            image: null
        },
        {
            id: 'm6',
            code: 'F6 K-DSTMGC17119',
            description: 'Gant nitri-flex 8/9',
            image: null
        },
        {
            id: 'm7',
            code: 'F7 K-DSTMGC17110',
            description: 'Gant nitri-flex 9/10',
            image: null
        },
        {
            id: 'm8',
            code: 'D1 K-DSTRMU023',
            description: 'Masque à poussières 3M',
            image: null
        }
    ],
    articles: [],
    annees: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033']
};

/**
 * Initialise le module
 */
export async function initConsommablesCommandeModule() {
    console.log('[CONSOMMABLES-COMMANDE] Initialisation du module...');
    await loadConsommablesData();
    renderInterface();
}

/**
 * Charge les données depuis le serveur
 */
async function loadConsommablesData() {
    const savedData = await loadFromStorage(STORAGE_KEY);
    if (savedData) {
        consommablesData = savedData;
        console.log('[CONSOMMABLES-COMMANDE] Données chargées depuis le serveur');
    } else {
        console.log('[CONSOMMABLES-COMMANDE] Aucune donnée sauvegardée, utilisation des valeurs par défaut');
    }
}

/**
 * Sauvegarde les données sur le serveur
 */
async function saveConsommablesData() {
    await saveToStorage(STORAGE_KEY, consommablesData);
    console.log('[CONSOMMABLES-COMMANDE] Données sauvegardées sur le serveur');
}

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Rend l'interface complète
 */
function renderInterface() {
    // Mettre à jour les champs en-tête
    const anneeP = document.getElementById('consommablesAnneePrecedente');
    const ordre = document.getElementById('consommablesOrdre');
    const anneeA = document.getElementById('consommablesAnneeActuelle');

    if (anneeP) {
        anneeP.value = consommablesData.anneePrecedente || '2024';
        anneeP.onchange = () => {
            consommablesData.anneePrecedente = anneeP.value;
            saveConsommablesData();
        };
    }

    if (ordre) {
        ordre.value = consommablesData.ordre || '112297222';
        ordre.onchange = () => {
            consommablesData.ordre = ordre.value;
            saveConsommablesData();
            renderTable();
        };
    }

    if (anneeA) {
        anneeA.value = consommablesData.anneeActuelle || '2025';
        anneeA.onchange = () => {
            consommablesData.anneeActuelle = anneeA.value;
            saveConsommablesData();
        };
    }

    renderTable();
}

/**
 * Rend le tableau principal
 */
function renderTable() {
    const tbody = document.getElementById('consommablesTableBody');
    const table = document.getElementById('consommablesMainTable');

    if (!tbody || !table) {
        console.warn('[CONSOMMABLES-COMMANDE] Éléments de tableau non trouvés');
        return;
    }

    // Reconstruire l'en-tête avec les colonnes machines
    const thead = table.querySelector('thead tr');
    if (thead) {
        // Supprimer les anciennes colonnes machines
        const machineHeaders = thead.querySelectorAll('.machine-header');
        machineHeaders.forEach(h => h.remove());

        // Ajouter les nouvelles colonnes machines
        const actionsHeader = thead.querySelector('th:last-child');
        consommablesData.machines.forEach(machine => {
            const th = document.createElement('th');
            th.className = 'machine-header';
            th.style.cssText = 'padding: 8px; border: 1px solid #dee2e6; min-width: 100px; text-align: center; font-size: 0.85em;';
            th.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <span style="font-weight: 700;">${escapeHtml(machine.code)}</span>
                    <span style="font-size: 0.9em; font-weight: 400;">${escapeHtml(machine.description)}</span>
                </div>
            `;
            thead.insertBefore(th, actionsHeader);
        });
    }

    // Rendre les lignes
    if (consommablesData.articles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${5 + consommablesData.machines.length + 1}" style="padding: 30px; text-align: center; color: #666;">
                    Aucun article. Cliquez sur "Ajouter Article" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    consommablesData.articles.forEach((article, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';

        // Colonnes fixes (sticky)
        const ordreCell = document.createElement('td');
        ordreCell.style.cssText = 'padding: 5px 8px; border: 1px solid #dee2e6; position: sticky; left: 0; background: ' + (index % 2 === 0 ? 'white' : '#f9f9f9') + '; z-index: 1;';
        ordreCell.innerHTML = `<input type="text" value="${escapeHtml(article.ordre || consommablesData.ordre)}"
                                      onchange="window.consommablesActions.updateField('${article.id}', 'ordre', this.value)"
                                      style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;">`;

        const articleCell = document.createElement('td');
        articleCell.style.cssText = 'padding: 5px 8px; border: 1px solid #dee2e6; position: sticky; left: 100px; background: ' + (index % 2 === 0 ? 'white' : '#f9f9f9') + '; z-index: 1;';
        articleCell.innerHTML = `<input type="text" value="${escapeHtml(article.article || '10')}"
                                        onchange="window.consommablesActions.updateField('${article.id}', 'article', this.value)"
                                        style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 0.9em;">`;

        const descCell = document.createElement('td');
        descCell.style.cssText = 'padding: 5px 8px; border: 1px solid #dee2e6; position: sticky; left: 180px; background: ' + (index % 2 === 0 ? 'white' : '#f9f9f9') + '; z-index: 1;';
        descCell.innerHTML = `<textarea onchange="window.consommablesActions.updateField('${article.id}', 'description', this.value)"
                                        class="auto-resize"
                                        style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; resize: none; overflow: hidden; font-size: 0.9em; line-height: 1.4;">${escapeHtml(article.description || '')}</textarea>`;

        const qtyCell = document.createElement('td');
        qtyCell.style.cssText = 'padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;';
        qtyCell.innerHTML = `<input type="number" value="${article.qty || ''}"
                                    onchange="window.consommablesActions.updateField('${article.id}', 'qty', this.value)"
                                    style="width: 60px; padding: 4px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 0.9em;">`;

        const nouvelleQtyCell = document.createElement('td');
        nouvelleQtyCell.style.cssText = 'padding: 5px 8px; border: 1px solid #dee2e6; text-align: center; background: #e3f2fd;';
        nouvelleQtyCell.innerHTML = `<input type="number" value="${article.nouvelleQty || ''}"
                                            onchange="window.consommablesActions.updateField('${article.id}', 'nouvelleQty', this.value)"
                                            style="width: 80px; padding: 4px; border: 2px solid #2196f3; border-radius: 4px; text-align: center; font-weight: 600; font-size: 0.9em;">`;

        row.appendChild(ordreCell);
        row.appendChild(articleCell);
        row.appendChild(descCell);
        row.appendChild(qtyCell);
        row.appendChild(nouvelleQtyCell);

        // Colonnes machines
        if (!article.machineQtys) article.machineQtys = {};

        consommablesData.machines.forEach(machine => {
            const machineCell = document.createElement('td');
            machineCell.style.cssText = 'padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;';
            machineCell.innerHTML = `<input type="number" value="${article.machineQtys[machine.id] || ''}"
                                            onchange="window.consommablesActions.updateMachineQty('${article.id}', '${machine.id}', this.value)"
                                            style="width: 60px; padding: 4px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 0.9em;">`;
            row.appendChild(machineCell);
        });

        // Colonne actions
        const actionsCell = document.createElement('td');
        actionsCell.style.cssText = 'padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;';
        actionsCell.innerHTML = `
            <button onclick="window.consommablesActions.deleteArticle('${article.id}')"
                    style="padding: 3px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                🗑️
            </button>
        `;
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

    // Initialiser l'auto-resize pour les textareas
    setTimeout(() => {
        document.querySelectorAll('#consommablesTableBody textarea.auto-resize').forEach(textarea => {
            if (window.initTextareaAutoResize) {
                window.initTextareaAutoResize(textarea);
            }
        });
    }, 100);

    console.log(`[CONSOMMABLES-COMMANDE] Tableau rendu: ${consommablesData.articles.length} articles, ${consommablesData.machines.length} machines`);
}

/**
 * Ajoute un nouvel article
 */
function addArticle() {
    const newArticle = {
        id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ordre: consommablesData.ordre,
        article: '10',
        description: '',
        qty: '',
        nouvelleQty: '',
        machineQtys: {}
    };

    consommablesData.articles.push(newArticle);
    saveConsommablesData();
    renderTable();
    console.log('[CONSOMMABLES-COMMANDE] Nouvel article ajouté');
}

/**
 * Supprime un article
 */
function deleteArticle(articleId) {
    if (!confirm('Voulez-vous vraiment supprimer cet article ?')) return;

    consommablesData.articles = consommablesData.articles.filter(a => a.id !== articleId);
    saveConsommablesData();
    renderTable();
    console.log('[CONSOMMABLES-COMMANDE] Article supprimé');
}

/**
 * Met à jour un champ d'article
 */
function updateField(articleId, field, value) {
    const article = consommablesData.articles.find(a => a.id === articleId);
    if (article) {
        article[field] = value;
        saveConsommablesData();
    }
}

/**
 * Met à jour la quantité d'une machine pour un article
 */
function updateMachineQty(articleId, machineId, value) {
    const article = consommablesData.articles.find(a => a.id === articleId);
    if (article) {
        if (!article.machineQtys) article.machineQtys = {};
        article.machineQtys[machineId] = value;
        saveConsommablesData();
    }
}

/**
 * Ajoute une nouvelle machine/équipement
 */
function addMachine() {
    const code = prompt('Code de la machine/équipement (ex: A2 K-DSTMGGO60M):');
    if (!code) return;

    const description = prompt('Description:');
    if (!description) return;

    const newMachine = {
        id: `machine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code: code,
        description: description,
        image: null
    };

    consommablesData.machines.push(newMachine);
    saveConsommablesData();
    renderTable();
    console.log('[CONSOMMABLES-COMMANDE] Nouvelle machine ajoutée');
}

/**
 * Exporte vers Excel
 */
function exportToExcel() {
    if (consommablesData.articles.length === 0) {
        alert('⚠️ Aucun article à exporter.');
        return;
    }

    try {
        // Préparer les données pour l'export
        const exportData = consommablesData.articles.map(article => {
            const row = {
                'Ordre': article.ordre || '',
                'Article': article.article || '',
                'Description': article.description || '',
                'Qty': article.qty || '',
                'Nouvelle QTY': article.nouvelleQty || ''
            };

            // Ajouter les colonnes machines
            consommablesData.machines.forEach(machine => {
                row[machine.code] = article.machineQtys?.[machine.id] || '';
            });

            return row;
        });

        if (typeof XLSX === 'undefined') {
            alert('❌ Bibliothèque XLSX non chargée');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Consommables');

        // Auto-size colonnes
        ws['!cols'] = autoSizeColumns(ws, exportData);

        const fileName = `Consommables_Arret_${consommablesData.ordre}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('[CONSOMMABLES-COMMANDE] Export Excel réussi');
    } catch (error) {
        console.error('[CONSOMMABLES-COMMANDE] Erreur export Excel:', error);
        alert('❌ Erreur lors de l\'export Excel.');
    }
}

/**
 * Envoie la liste à Yannick Brodeur
 */
function sendToYannick() {
    alert('📧 Fonction d\'envoi à implémenter\n\nCette fonction enverra la liste des consommables à Yannick Brodeur par email.');
}

// Exposer les actions globalement
window.consommablesActions = {
    addArticle,
    deleteArticle,
    updateField,
    updateMachineQty,
    addMachine,
    exportToExcel,
    sendToYannick,
    initConsommablesCommandeModule
};

console.log('[CONSOMMABLES-COMMANDE] ✅ Module chargé');
