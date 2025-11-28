/**
 * @fileoverview Module de suivi des coûts T72
 * Agrège automatiquement les coûts depuis Gestion des Pièces et Création DA
 * @module data/t72-suivi-cout
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getPiecesData } from './pieces-data.js';

const STORAGE_KEY = 't72Data';

/**
 * Données T72
 */
let t72Data = {
    budgetPrevu: {
        externe: 0,
        pieces: 0,
        mainDoeuvre: 0
    },
    actualCosts: {
        externe: [],
        pieces: [],
        mainDoeuvre: []
    }
};

/**
 * Charge les données T72
 */
export async function loadT72Data() {
    const saved = await loadFromStorage(STORAGE_KEY);
    if (saved) {
        t72Data = saved;
        console.log('[T72] Données chargées');
    }

    // Attendre que la page soit chargée
    const checkElement = setInterval(() => {
        if (document.getElementById('budgetExterne')) {
            clearInterval(checkElement);
            renderT72Dashboard();
        }
    }, 100);

    setTimeout(() => clearInterval(checkElement), 5000);
}

/**
 * Sauvegarde les données T72
 */
async function saveT72Data() {
    await saveToStorage(STORAGE_KEY, t72Data);
    console.log('[T72] Données sauvegardées');
}

/**
 * Calcule le total des pièces depuis Gestion des Pièces
 * EXCLUT les pièces T30/T60 qui ne sont pas encore commandées
 */
export async function calculateTotalPiecesFromGestion() {
    try {
        const piecesData = getPiecesData();
        if (!piecesData || piecesData.length < 2) return { total: 0, details: {} };

        const headers = piecesData[0];
        const rows = piecesData.slice(1);

        const articleIndex = headers.findIndex(h => h && (h === 'Article' || h.toLowerCase().includes('article')));
        const ordreIndex = headers.findIndex(h => h && (h === 'Ordre' || h.toLowerCase().includes('ordre')));
        const prixIndex = headers.findIndex(h => h && h.toLowerCase().includes('prix/devise'));
        const qteIndex = headers.findIndex(h => h && h === 'Quantité requise');

        if (prixIndex === -1 || qteIndex === -1) {
            console.warn('[T72] Colonnes Prix/devise ou Quantité requise introuvables');
            return { total: 0, details: {} };
        }

        // Charger les données T30 et T60
        const t30Pieces = await loadFromStorage('t30LongDelaiPieces') || [];
        const t30Commandes = await loadFromStorage('t30CommandeData') || {};
        const t60Pieces = await loadFromStorage('t60LongDelaiPieces') || [];
        const t60Commandes = await loadFromStorage('t60CommandeData') || {};

        // Créer un Set des pièces T30/T60 NON commandées (à exclure)
        const piecesAExclure = new Set();

        // Pièces T30 non commandées
        t30Pieces.forEach(piece => {
            const pieceId = piece.id || `${piece.article}-${piece.ordre}`;
            const commandeInfo = t30Commandes[pieceId];
            // Si pas de commande OU statut pas dans la liste autorisée
            if (!commandeInfo || !['Commandé', 'En transit', 'Reçu'].includes(commandeInfo.statut)) {
                piecesAExclure.add(`${piece.article}-${piece.ordre}`);
            }
        });

        // Pièces T60 non commandées
        t60Pieces.forEach(piece => {
            const pieceId = piece.id || `${piece.article}-${piece.ordre}`;
            const commandeInfo = t60Commandes[pieceId];
            if (!commandeInfo || !['Commandé', 'En transit', 'Reçu'].includes(commandeInfo.statut)) {
                piecesAExclure.add(`${piece.article}-${piece.ordre}`);
            }
        });

        let totalNormal = 0;
        let totalT30 = 0;
        let totalT60 = 0;
        let countNormal = 0;
        let countT30 = 0;
        let countT60 = 0;

        rows.forEach(row => {
            const article = row[articleIndex] || '';
            const ordre = row[ordreIndex] || '';
            const pieceKey = `${article}-${ordre}`;
            const prixStr = row[prixIndex];
            const qteStr = row[qteIndex];

            const prixMatch = String(prixStr).match(/([0-9,]+\.?[0-9]*)/);
            const prix = prixMatch ? parseFloat(prixMatch[1].replace(/,/g, '')) : 0;
            const qte = parseFloat(qteStr) || 0;
            const montant = prix * qte;

            // Vérifier si cette pièce doit être exclue
            if (piecesAExclure.has(pieceKey)) {
                return; // Skip cette pièce
            }

            // Vérifier si c'est une pièce T30 commandée
            const isT30 = t30Pieces.some(p => `${p.article}-${p.ordre}` === pieceKey);
            const isT60 = t60Pieces.some(p => `${p.article}-${p.ordre}` === pieceKey);

            if (isT30) {
                totalT30 += montant;
                countT30++;
            } else if (isT60) {
                totalT60 += montant;
                countT60++;
            } else {
                totalNormal += montant;
                countNormal++;
            }
        });

        const total = totalNormal + totalT30 + totalT60;
        const totalCount = countNormal + countT30 + countT60;

        console.log(`[T72] 📊 Total Pièces: ${totalCount} pièces = ${total.toFixed(2)}€`);

        return {
            total,
            details: {
                normal: totalNormal,
                t30: totalT30,
                t60: totalT60,
                countNormal,
                countT30,
                countT60
            }
        };
    } catch (error) {
        console.error('[T72] Erreur calcul pièces:', error);
        return { total: 0, details: {} };
    }
}

/**
 * Calcule le total DA depuis CRÉATION DE LA DA
 */
export async function calculateTotalDA() {
    try {
        const t25Data = await loadFromStorage('t25Data');
        const daData = t25Data?.daData || [];

        let total = 0;
        daData.forEach(item => {
            const montantValue = item.montant || item.Montant || item.montantTotal || 0;
            const montant = parseFloat(montantValue) || 0;
            total += montant;
        });

        return total;
    } catch (error) {
        console.warn('[T72] Erreur chargement DA:', error);
        return 0;
    }
}

/**
 * Met à jour le budget prévisionnel
 */
export function updateT72Budget() {
    const externe = parseFloat(document.getElementById('budgetExterne')?.value) || 0;
    const pieces = parseFloat(document.getElementById('budgetPieces')?.value) || 0;
    const mainDoeuvre = parseFloat(document.getElementById('budgetMainDoeuvre')?.value) || 0;

    t72Data.budgetPrevu = { externe, pieces, mainDoeuvre };

    const total = externe + pieces + mainDoeuvre;
    const budgetTotalElement = document.getElementById('budgetTotal');
    if (budgetTotalElement) {
        budgetTotalElement.textContent = total.toFixed(2);
    }

    saveT72Data();
    renderT72Dashboard();
}

/**
 * Ajoute un coût réel
 */
export function addT72Actual(category) {
    const description = prompt('Description:');
    if (!description) return;

    const montant = prompt('Montant (€):');
    if (!montant) return;

    const newCost = {
        id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description,
        montant: parseFloat(montant) || 0
    };

    t72Data.actualCosts[category].push(newCost);
    saveT72Data();
    renderT72Dashboard();
}

/**
 * Supprime un coût réel
 */
export function deleteT72Actual(category, id) {
    if (!confirm('Supprimer ce coût ?')) return;

    t72Data.actualCosts[category] = t72Data.actualCosts[category].filter(c => c.id !== id);
    saveT72Data();
    renderT72Dashboard();
}

/**
 * Formate un montant en euros
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }).format(value);
}

/**
 * Affiche le tableau de bord T72
 */
export async function renderT72Dashboard() {
    // Charger les valeurs du budget
    const budgetExterneEl = document.getElementById('budgetExterne');
    const budgetPiecesEl = document.getElementById('budgetPieces');
    const budgetMainDoeuvreEl = document.getElementById('budgetMainDoeuvre');

    if (budgetExterneEl) budgetExterneEl.value = t72Data.budgetPrevu.externe || 0;
    if (budgetPiecesEl) budgetPiecesEl.value = t72Data.budgetPrevu.pieces || 0;
    if (budgetMainDoeuvreEl) budgetMainDoeuvreEl.value = t72Data.budgetPrevu.mainDoeuvre || 0;

    // Calculer les totaux automatiques
    const piecesResult = await calculateTotalPiecesFromGestion();
    const totalPiecesAuto = piecesResult.total;
    const totalDAAuto = await calculateTotalDA();

    // Calculer les totaux des coûts réels manuels
    const totalExterne = t72Data.actualCosts.externe.reduce((sum, c) => sum + c.montant, 0);
    const totalPieces = t72Data.actualCosts.pieces.reduce((sum, c) => sum + c.montant, 0);
    const totalMainDoeuvre = t72Data.actualCosts.mainDoeuvre.reduce((sum, c) => sum + c.montant, 0);

    // Total des dépenses réelles (incluant auto + manuel)
    const totalActual = totalPiecesAuto + totalDAAuto + totalExterne + totalPieces + totalMainDoeuvre;

    // Budget prévu total
    const budgetTotal = t72Data.budgetPrevu.externe + t72Data.budgetPrevu.pieces + t72Data.budgetPrevu.mainDoeuvre;

    // Budget des paramètres - avec synchronisation automatique
    console.log('[T72 DEBUG] 📡 Chargement du budget depuis arretAnnuelData...');
    let arretData = await loadFromStorage('arretAnnuelData');
    console.log('[T72 DEBUG] 📦 arretData chargé:', arretData);

    // Si arretData est vide ou n'a pas de budgetTotal, on crée la structure
    if (!arretData || !arretData.budgetTotal) {
        console.log('[T72 DEBUG] ⚠️ arretData vide ou sans budgetTotal, tentative de synchronisation...');

        // Charger le budget depuis settingsData
        const settingsData = await loadFromStorage('arretAnnuelSettings');
        console.log('[T72 DEBUG] 📦 settingsData chargé:', settingsData);

        if (settingsData && settingsData.budget) {
            console.log('[T72 DEBUG] 🔄 Synchronisation du budget:', settingsData.budget);
            arretData = arretData || {};
            arretData.budgetTotal = settingsData.budget;
            arretData.dateDebut = settingsData.startDate;
            arretData.dateFin = settingsData.endDate;

            // Sauvegarder la synchronisation
            const syncSuccess = await saveToStorage('arretAnnuelData', arretData, false);
            console.log('[T72 DEBUG] 💾 Sauvegarde synchronisation:', syncSuccess ? 'Succès' : 'Échec');
        } else {
            console.warn('[T72 DEBUG] ❌ Pas de budget dans settingsData non plus');
        }
    }

    console.log('[T72 DEBUG] 💰 budgetTotal value:', arretData?.budgetTotal);
    const globalBudget = arretData?.budgetTotal || 0;
    console.log('[T72 DEBUG] ✅ globalBudget après défaut:', globalBudget);

    // Solde restant
    const remaining = globalBudget - totalActual;
    const percentUsed = globalBudget > 0 ? (totalActual / globalBudget * 100).toFixed(1) : 0;

    // Mettre à jour l'affichage global
    const globalBudgetEl = document.getElementById('t72GlobalBudgetTotal');
    const globalBudgetPrevuEl = document.getElementById('t72GlobalBudgetPrevu');
    const globalActualEl = document.getElementById('t72GlobalActualTotal');
    const globalRemainingEl = document.getElementById('t72GlobalRemaining');
    const globalPercentageEl = document.getElementById('t72GlobalPercentage');
    const globalStatusEl = document.getElementById('t72GlobalStatus');
    const budgetTotalEl = document.getElementById('budgetTotal');

    if (globalBudgetEl) globalBudgetEl.textContent = formatCurrency(globalBudget);
    if (globalBudgetPrevuEl) globalBudgetPrevuEl.textContent = formatCurrency(budgetTotal);
    if (globalActualEl) globalActualEl.textContent = formatCurrency(totalActual);
    if (globalRemainingEl) {
        globalRemainingEl.textContent = formatCurrency(remaining);
        globalRemainingEl.style.color = remaining < 0 ? '#dc3545' : 'white';
    }
    if (globalPercentageEl) globalPercentageEl.textContent = `${percentUsed}% utilisé`;
    if (globalStatusEl) {
        if (remaining < 0) {
            globalStatusEl.textContent = '⚠️ Dépassement';
            globalStatusEl.style.color = '#dc3545';
        } else if (percentUsed > 80) {
            globalStatusEl.textContent = '⚠️ Alerte';
            globalStatusEl.style.color = '#ffc107';
        } else {
            globalStatusEl.textContent = '✅ Conforme';
        }
    }
    if (budgetTotalEl) budgetTotalEl.textContent = budgetTotal.toFixed(2);

    // Synthèse par catégorie - simplifié sans détails T30/T60
    const summaryContainer = document.getElementById('t72SummaryContainer');
    if (summaryContainer) {
        const totalPiecesCount = (piecesResult.details.countNormal || 0) + (piecesResult.details.countT30 || 0) + (piecesResult.details.countT60 || 0);

        summaryContainer.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px;">
                <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 8px;">💰 Pièces (Auto)</div>
                <div style="font-size: 1.8em; font-weight: bold;">${formatCurrency(totalPiecesAuto)}</div>
                <div style="font-size: 0.75em; opacity: 0.8; margin-top: 5px;">${totalPiecesCount} pièces</div>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 20px; border-radius: 10px;">
                <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 8px;">📝 DA (Auto)</div>
                <div style="font-size: 1.8em; font-weight: bold;">${formatCurrency(totalDAAuto)}</div>
                <div style="font-size: 0.75em; opacity: 0.8; margin-top: 5px;">Depuis Création DA</div>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 20px; border-radius: 10px;">
                <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 8px;">💼 Externes</div>
                <div style="font-size: 1.8em; font-weight: bold;">${formatCurrency(totalExterne)}</div>
                <div style="font-size: 0.75em; opacity: 0.8; margin-top: 5px;">${t72Data.actualCosts.externe.length} coûts</div>
            </div>
            <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 20px; border-radius: 10px;">
                <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 8px;">👷 Main d'œuvre</div>
                <div style="font-size: 1.8em; font-weight: bold;">${formatCurrency(totalMainDoeuvre)}</div>
                <div style="font-size: 0.75em; opacity: 0.8; margin-top: 5px;">${t72Data.actualCosts.mainDoeuvre.length} coûts</div>
            </div>
        `;
    }

    // Rendre les tableaux de coûts réels
    renderCostTable('externe', t72Data.actualCosts.externe);
    renderCostTable('pieces', t72Data.actualCosts.pieces);
    renderCostTable('mainDoeuvre', t72Data.actualCosts.mainDoeuvre);

    console.log('[T72] Dashboard mis à jour');
}

/**
 * Rend un tableau de coûts
 */
function renderCostTable(category, costs) {
    const tbody = document.getElementById(`actual${category.charAt(0).toUpperCase() + category.slice(1)}TableBody`);
    if (!tbody) return;

    if (costs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Aucun coût enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    costs.forEach((cost, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? 'white' : '#f9f9f9';
        row.innerHTML = `
            <td style="padding: 8px;">${cost.description}</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(cost.montant)}</td>
            <td style="padding: 8px; text-align: center;">
                <button onclick="window.t72Actions.deleteT72Actual('${category}', '${cost.id}')"
                        style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Génère un rapport Excel
 */
export async function generateT72Report() {
    if (typeof XLSX === 'undefined') {
        alert('❌ Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();

    // Calculs
    const piecesResult = await calculateTotalPiecesFromGestion();
    const totalPiecesAuto = piecesResult.total;
    const totalDAAuto = await calculateTotalDA();
    const totalExterne = t72Data.actualCosts.externe.reduce((sum, c) => sum + c.montant, 0);
    const totalPieces = t72Data.actualCosts.pieces.reduce((sum, c) => sum + c.montant, 0);
    const totalMainDoeuvre = t72Data.actualCosts.mainDoeuvre.reduce((sum, c) => sum + c.montant, 0);
    const totalActual = totalPiecesAuto + totalDAAuto + totalExterne + totalPieces + totalMainDoeuvre;
    const budgetTotal = t72Data.budgetPrevu.externe + t72Data.budgetPrevu.pieces + t72Data.budgetPrevu.mainDoeuvre;

    // Récupérer le budget autorisé
    const arretData = await loadFromStorage('arretAnnuelData');
    const globalBudget = arretData?.budgetTotal || 0;

    // Feuille Résumé
    const resumeData = [
        ['SUIVI DE COÛT - T72', ''],
        ['', ''],
        ['Budget Total Autorisé', globalBudget],
        ['', ''],
        ['Budget Prévisionnel', ''],
        ['Externes', t72Data.budgetPrevu.externe],
        ['Pièces', t72Data.budgetPrevu.pieces],
        ['Main d\'œuvre', t72Data.budgetPrevu.mainDoeuvre],
        ['TOTAL BUDGET PRÉVU', budgetTotal],
        ['', ''],
        ['Dépenses Réelles', ''],
        ['Pièces (Auto)', totalPiecesAuto],
        ['DA (Auto)', totalDAAuto],
        ['Externes (Manuel)', totalExterne],
        ['Pièces (Manuel)', totalPieces],
        ['Main d\'œuvre (Manuel)', totalMainDoeuvre],
        ['', ''],
        ['TOTAL DÉPENSES', totalActual],
        ['', ''],
        ['SOLDE DISPONIBLE', globalBudget - totalActual]
    ];

    const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
    XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

    // Feuilles détails
    ['externe', 'pieces', 'mainDoeuvre'].forEach(cat => {
        const data = t72Data.actualCosts[cat].map(c => ({
            'Description': c.description,
            'Montant (€)': c.montant
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, cat.charAt(0).toUpperCase() + cat.slice(1));
    });

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Suivi_Cout_T72_${date}.xlsx`);
}

// Exposer globalement
window.t72Actions = {
    loadT72Data,
    updateT72Budget,
    addT72Actual,
    deleteT72Actual,
    generateT72Report
};

// Alias pour compatibilité avec HTML
window.updateT72Budget = updateT72Budget;
window.addT72Actual = addT72Actual;
window.generateT72Report = generateT72Report;

console.log('[T72] Module chargé');
