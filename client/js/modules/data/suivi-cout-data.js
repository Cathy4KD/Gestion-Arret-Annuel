/**
 * @fileoverview Module de suivi des coûts - Agrégation automatique depuis multiples sources
 * @module data/suivi-cout-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { getPiecesData } from './pieces-data.js';
import { getSoumissionsManualData } from './data-pages.js';

const STORAGE_KEY = 'suiviCoutData';

/**
 * Données des lignes manuelles
 * @type {Array}
 */
let lignesManuelles = [];

/**
 * Données des montants entrepreneurs (t40) avec soumissions
 * @type {Array}
 */
let entrepreneursSoumissions = [];

/**
 * Setter pour injection depuis le serveur
 */
export function setSuiviCoutData(data) {
    if (data && data.lignesManuelles) {
        lignesManuelles = data.lignesManuelles;
        console.log(`[SUIVI-COUT] ✅ ${lignesManuelles.length} lignes manuelles injectées`);
    }
    if (data && data.entrepreneursSoumissions) {
        entrepreneursSoumissions = data.entrepreneursSoumissions;
        console.log(`[SUIVI-COUT] ✅ ${entrepreneursSoumissions.length} soumissions entrepreneurs injectées`);
    }
}

// Exposer globalement pour server-sync
window.setSuiviCoutData = setSuiviCoutData;

/**
 * Timer pour debounce
 */
let saveTimer = null;

/**
 * Sauvegarde différée
 */
function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveData(), 1000);
}

/**
 * Sauvegarde sur le serveur
 */
async function saveData() {
    const data = {
        lignesManuelles,
        entrepreneursSoumissions
    };

    const success = await saveToStorage(STORAGE_KEY, data, false);

    if (success) {
        console.log('[SUIVI-COUT] ✅ Données sauvegardées');
    } else {
        console.error('[SUIVI-COUT] ❌ Échec sauvegarde');
    }

    return success;
}

/**
 * Charge les données
 */
export async function loadSuiviCoutData() {
    // [FIX-2025-11-05-20:19] Attente du container avant rendu
    // Charger uniquement si pas déjà en mémoire
    if (lignesManuelles.length === 0 && entrepreneursSoumissions.length === 0) {
        const saved = await loadFromStorage(STORAGE_KEY);
        if (saved) {
            lignesManuelles = saved.lignesManuelles || [];
            entrepreneursSoumissions = saved.entrepreneursSoumissions || [];
            console.log(`[SUIVI-COUT] ✅ Données chargées`);
        }
    } else {
        console.log('[SUIVI-COUT] ✅ Utilisation données en mémoire');
    }

    // Attendre que l'élément soit disponible avant de rendre
    const checkElement = setInterval(() => {
        const container = document.getElementById('suiviCoutDashboard');
        if (container) {
            clearInterval(checkElement);
            console.log('[SUIVI-COUT] ✅ Container trouvé, rendu du dashboard...');
            renderSuiviCoutDashboard();
        } else {
            console.log('[SUIVI-COUT] ⏳ En attente du container...');
        }
    }, 100);

    // Timeout de sécurité après 5 secondes
    setTimeout(() => {
        clearInterval(checkElement);
        console.error('[SUIVI-COUT] ❌ Timeout: Container suiviCoutDashboard non trouvé après 5 secondes');
    }, 5000);
}

/**
 * Calcule le total des pièces (Prix/Devise × Quantité)
 * @returns {number}
 */
function calculateTotalPieces() {
    try {
        const piecesData = getPiecesData();
        if (!piecesData || piecesData.length < 2) return 0;

        const headers = piecesData[0];
        const rows = piecesData.slice(1);

        // Trouver les index des colonnes
        const prixIndex = headers.findIndex(h => h && h.toLowerCase().includes('prix/devise'));
        const qteIndex = headers.findIndex(h => h && h === 'Quantité requise');

        if (prixIndex === -1 || qteIndex === -1) {
            console.warn('[SUIVI-COUT] Colonnes Prix/devise ou Quantité requise introuvables');
            return 0;
        }

        let total = 0;
        rows.forEach(row => {
            const prixStr = row[prixIndex];
            const qteStr = row[qteIndex];

            // Extraire le prix (format: "1234.56 CAD" ou "1234.56")
            const prixMatch = String(prixStr).match(/([0-9,]+\.?[0-9]*)/);
            const prix = prixMatch ? parseFloat(prixMatch[1].replace(/,/g, '')) : 0;

            const qte = parseFloat(qteStr) || 0;

            total += prix * qte;
        });

        return total;
    } catch (error) {
        console.error('[SUIVI-COUT] Erreur calcul pièces:', error);
        return 0;
    }
}

/**
 * Calcule le total DA (depuis t25)
 * @returns {number}
 */
async function calculateTotalDA() {
    try {
        // Charger les données t25 depuis le serveur
        const t25Data = await loadFromStorage('t25Data');
        console.log('[SUIVI-COUT] [DEBUG] t25Data brut:', t25Data);

        const daData = t25Data?.daData || [];
        console.log('[SUIVI-COUT] [DEBUG] daData extrait:', daData);
        console.log('[SUIVI-COUT] [DEBUG] Nombre de lignes DA:', daData.length);

        let total = 0;
        daData.forEach((item, index) => {
            // Essayer plusieurs champs possibles pour le montant
            const montantValue = item.montant || item.Montant || item.montantTotal || 0;
            const montant = parseFloat(montantValue) || 0;

            if (montant > 0) {
                console.log(`[SUIVI-COUT] [DEBUG] Ligne ${index}: montant = ${montant}`, item);
            }

            total += montant;
        });

        console.log('[SUIVI-COUT] [DEBUG] Total DA calculé:', total);
        return total;
    } catch (error) {
        console.warn('[SUIVI-COUT] Erreur chargement t25:', error);
        return 0;
    }
}

/**
 * Calcule le total des pièces T30 (90J) commandées/en transit/reçues
 * @returns {Promise<number>}
 */
async function calculateTotalT30Commandees() {
    try {
        // Charger les données T30
        const t30Pieces = await loadFromStorage('t30LongDelaiPieces');
        const t30Commandes = await loadFromStorage('t30CommandeData');
        const piecesData = await loadFromStorage('piecesData');

        if (!t30Pieces || !t30Commandes || !piecesData) {
            return 0;
        }

        const headers = piecesData[0] || [];
        const rows = piecesData.slice(1);

        // Trouver les index des colonnes dans Gestion des Pièces
        const articleIndex = headers.findIndex(h => h && (h === 'Article' || h.toLowerCase().includes('article')));
        const prixIndex = headers.findIndex(h => h && h.toLowerCase().includes('prix/devise'));
        const qteIndex = headers.findIndex(h => h && h === 'Quantité requise');

        if (articleIndex === -1 || prixIndex === -1 || qteIndex === -1) {
            console.warn('[SUIVI-COUT] Colonnes introuvables dans Gestion des Pièces');
            return 0;
        }

        let total = 0;

        // Parcourir les pièces T30
        t30Pieces.forEach(piece => {
            const pieceId = piece.id || `${piece.article}-${piece.ordre}`;
            const commandeInfo = t30Commandes[pieceId];

            // Vérifier si le statut est "Commandé", "En transit" ou "Reçu"
            if (commandeInfo && ['Commandé', 'En transit', 'Reçu'].includes(commandeInfo.statut)) {
                // Chercher le prix dans Gestion des Pièces
                const articleMatch = rows.find(row => row[articleIndex] === piece.article);

                if (articleMatch) {
                    const prixStr = articleMatch[prixIndex];
                    const prixMatch = String(prixStr).match(/([0-9,]+\.?[0-9]*)/);
                    const prix = prixMatch ? parseFloat(prixMatch[1].replace(/,/g, '')) : 0;

                    const qte = parseFloat(piece.qte || piece.quantite || articleMatch[qteIndex]) || 0;

                    total += prix * qte;
                }
            }
        });

        return total;
    } catch (error) {
        console.warn('[SUIVI-COUT] Erreur calcul T30:', error);
        return 0;
    }
}

/**
 * Calcule le total des pièces T60 (60J) commandées/en transit/reçues
 * @returns {Promise<number>}
 */
async function calculateTotalT60Commandees() {
    try {
        // Charger les données T60
        const t60Pieces = await loadFromStorage('t60LongDelaiPieces');
        const t60Commandes = await loadFromStorage('t60CommandeData');
        const piecesData = await loadFromStorage('piecesData');

        if (!t60Pieces || !t60Commandes || !piecesData) {
            return 0;
        }

        const headers = piecesData[0] || [];
        const rows = piecesData.slice(1);

        // Trouver les index des colonnes dans Gestion des Pièces
        const articleIndex = headers.findIndex(h => h && (h === 'Article' || h.toLowerCase().includes('article')));
        const prixIndex = headers.findIndex(h => h && h.toLowerCase().includes('prix/devise'));
        const qteIndex = headers.findIndex(h => h && h === 'Quantité requise');

        if (articleIndex === -1 || prixIndex === -1 || qteIndex === -1) {
            console.warn('[SUIVI-COUT] Colonnes introuvables dans Gestion des Pièces');
            return 0;
        }

        let total = 0;

        // Parcourir les pièces T60
        t60Pieces.forEach(piece => {
            const pieceId = piece.id || `${piece.article}-${piece.ordre}`;
            const commandeInfo = t60Commandes[pieceId];

            // Vérifier si le statut est "Commandé", "En transit" ou "Reçu"
            if (commandeInfo && ['Commandé', 'En transit', 'Reçu'].includes(commandeInfo.statut)) {
                // Chercher le prix dans Gestion des Pièces
                const articleMatch = rows.find(row => row[articleIndex] === piece.article);

                if (articleMatch) {
                    const prixStr = articleMatch[prixIndex];
                    const prixMatch = String(prixStr).match(/([0-9,]+\.?[0-9]*)/);
                    const prix = prixMatch ? parseFloat(prixMatch[1].replace(/,/g, '')) : 0;

                    const qte = parseFloat(piece.qte || piece.quantite || articleMatch[qteIndex]) || 0;

                    total += prix * qte;
                }
            }
        });

        return total;
    } catch (error) {
        console.warn('[SUIVI-COUT] Erreur calcul T60:', error);
        return 0;
    }
}

/**
 * Calcule le total soumissions entrepreneurs
 * Agrège les montants depuis deux sources:
 * 1. entrepreneursSoumissions (saisie manuelle dans Suivi des Coûts)
 * 2. soumissionsManualData (montants de la page DÉPÔT DES SOUMISSIONS)
 * @returns {number}
 */
function calculateTotalEntrepreneurs() {
    let total = 0;

    // Source 1: Soumissions saisies manuellement dans Suivi des Coûts
    entrepreneursSoumissions.forEach(item => {
        const montant = parseFloat(item.montant) || 0;
        total += montant;
    });

    // Source 2: Montants de la page DÉPÔT DES SOUMISSIONS DES ENTREPRENEURS
    const soumissionsData = getSoumissionsManualData();
    Object.values(soumissionsData).forEach(item => {
        const montant = parseFloat(item.montant) || 0;
        total += montant;
    });

    return total;
}

/**
 * Calcule le total des lignes manuelles
 * @returns {number}
 */
function calculateTotalManuel() {
    let total = 0;
    lignesManuelles.forEach(item => {
        const montant = parseFloat(item.montant) || 0;
        total += montant;
    });
    return total;
}

/**
 * Formate un nombre en devise
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2
    }).format(value);
}

/**
 * Ajoute une ligne manuelle
 */
export function addLigneManuelle() {
    const newLigne = {
        id: 'ligne-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        categorie: '',
        description: '',
        montant: 0,
        commentaire: ''
    };

    lignesManuelles.unshift(newLigne);
    renderSuiviCoutDashboard();
    scheduleSave();
}

/**
 * Met à jour une ligne manuelle
 */
export function updateLigneManuelle(id, field, value) {
    const ligne = lignesManuelles.find(l => l.id === id);
    if (ligne) {
        ligne[field] = value;
        renderSuiviCoutDashboard();
        scheduleSave();
    }
}

/**
 * Supprime une ligne manuelle
 */
export function deleteLigneManuelle(id) {
    if (confirm('Supprimer cette ligne ?')) {
        lignesManuelles = lignesManuelles.filter(l => l.id !== id);
        renderSuiviCoutDashboard();
        scheduleSave();
    }
}

/**
 * Ajoute une soumission entrepreneur
 */
export function addSoumissionEntrepreneur() {
    const newSoumission = {
        id: 'soum-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        entrepreneur: '',
        description: '',
        montant: 0,
        statut: 'En attente'
    };

    entrepreneursSoumissions.unshift(newSoumission);
    renderSuiviCoutDashboard();
    scheduleSave();
}

/**
 * Met à jour une soumission entrepreneur
 */
export function updateSoumissionEntrepreneur(id, field, value) {
    const soumission = entrepreneursSoumissions.find(s => s.id === id);
    if (soumission) {
        soumission[field] = value;
        renderSuiviCoutDashboard();
        scheduleSave();
    }
}

/**
 * Supprime une soumission entrepreneur
 */
export function deleteSoumissionEntrepreneur(id) {
    if (confirm('Supprimer cette soumission ?')) {
        entrepreneursSoumissions = entrepreneursSoumissions.filter(s => s.id !== id);
        renderSuiviCoutDashboard();
        scheduleSave();
    }
}

/**
 * Affiche le tableau de bord complet
 */
export async function renderSuiviCoutDashboard() {
    const container = document.getElementById('suiviCoutDashboard');
    if (!container) {
        console.warn('[SUIVI-COUT] Container suiviCoutDashboard non trouvé');
        return;
    }

    // Calculer les totaux
    const totalPieces = calculateTotalPieces();
    const totalDA = await calculateTotalDA();
    const totalT30 = await calculateTotalT30Commandees();
    const totalT60 = await calculateTotalT60Commandees();
    const totalEntrepreneurs = calculateTotalEntrepreneurs();
    const totalManuel = calculateTotalManuel();
    const totalGeneral = totalPieces + totalDA + totalT30 + totalT60 + totalEntrepreneurs + totalManuel;

    let html = `
        <!-- Section Totaux Automatiques -->
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                📊 Totaux Automatiques
            </h3>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
                    <div style="font-size: 0.9em; margin-bottom: 5px;">💰 Total Pièces</div>
                    <div style="font-size: 1.5em; font-weight: bold;">${formatCurrency(totalPieces)}</div>
                    <div style="font-size: 0.75em; opacity: 0.9; margin-top: 5px;">Prix/Devise × Quantité</div>
                </div>

                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px;">
                    <div style="font-size: 0.9em; margin-bottom: 5px;">📝 Total DA</div>
                    <div style="font-size: 1.5em; font-weight: bold;">${formatCurrency(totalDA)}</div>
                    <div style="font-size: 0.75em; opacity: 0.9; margin-top: 5px;">Demandes d'achat</div>
                </div>

                <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); color: white; padding: 20px; border-radius: 10px;">
                    <div style="font-size: 0.9em; margin-bottom: 5px;">📦 Total T30 (90J)</div>
                    <div style="font-size: 1.5em; font-weight: bold;">${formatCurrency(totalT30)}</div>
                    <div style="font-size: 0.75em; opacity: 0.9; margin-top: 5px;">Commandé/Transit/Reçu</div>
                </div>

                <div style="background: linear-gradient(135deg, #A8E6CF 0%, #3CDBD3 100%); color: white; padding: 20px; border-radius: 10px;">
                    <div style="font-size: 0.9em; margin-bottom: 5px;">📦 Total T60 (60J)</div>
                    <div style="font-size: 1.5em; font-weight: bold;">${formatCurrency(totalT60)}</div>
                    <div style="font-size: 0.75em; opacity: 0.9; margin-top: 5px;">Commandé/Transit/Reçu</div>
                </div>

                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px;">
                    <div style="font-size: 0.9em; margin-bottom: 5px;">👔 Total Entrepreneurs</div>
                    <div style="font-size: 1.5em; font-weight: bold;">${formatCurrency(totalEntrepreneurs)}</div>
                    <div style="font-size: 0.75em; opacity: 0.9; margin-top: 5px;">Soumissions reçues</div>
                </div>

                <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 10px;">
                    <div style="font-size: 0.9em; margin-bottom: 5px;">✏️ Total Manuel</div>
                    <div style="font-size: 1.5em; font-weight: bold;">${formatCurrency(totalManuel)}</div>
                    <div style="font-size: 0.75em; opacity: 0.9; margin-top: 5px;">Coûts additionnels</div>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white; padding: 25px; border-radius: 10px; margin-top: 20px; text-align: center;">
                <div style="font-size: 1.1em; margin-bottom: 10px;">💎 TOTAL GÉNÉRAL</div>
                <div style="font-size: 2.5em; font-weight: bold;">${formatCurrency(totalGeneral)}</div>
            </div>
        </div>

        <!-- Section Lignes Manuelles -->
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #667eea;">✏️ Coûts Additionnels Manuels</h3>
                <button onclick="window.suiviCoutActions.addLigneManuelle()"
                        style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ➕ Ajouter une ligne
                </button>
            </div>

            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 20%;">Catégorie</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 30%;">Description</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right; width: 15%;">Montant ($)</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 25%;">Commentaire</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center; width: 10%;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (lignesManuelles.length === 0) {
        html += `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucun coût additionnel. Cliquez sur "Ajouter une ligne" pour commencer.
                </td>
            </tr>
        `;
    } else {
        lignesManuelles.forEach((ligne, index) => {
            const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            html += `
                <tr style="background: ${bgColor};">
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <input type="text"
                               value="${ligne.categorie || ''}"
                               placeholder="Ex: Main d'oeuvre"
                               onchange="window.suiviCoutActions.updateLigneManuelle('${ligne.id}', 'categorie', this.value)"
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <input type="text"
                               value="${ligne.description || ''}"
                               placeholder="Description..."
                               onchange="window.suiviCoutActions.updateLigneManuelle('${ligne.id}', 'description', this.value)"
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <input type="number"
                               value="${ligne.montant || 0}"
                               step="0.01"
                               onchange="window.suiviCoutActions.updateLigneManuelle('${ligne.id}', 'montant', this.value)"
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: right;">
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <input type="text"
                               value="${ligne.commentaire || ''}"
                               placeholder="Commentaire..."
                               onchange="window.suiviCoutActions.updateLigneManuelle('${ligne.id}', 'commentaire', this.value)"
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                        <button onclick="window.suiviCoutActions.deleteLigneManuelle('${ligne.id}')"
                                style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Section Soumissions Entrepreneurs -->
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #667eea;">👔 Soumissions Entrepreneurs</h3>
                <button onclick="window.suiviCoutActions.addSoumissionEntrepreneur()"
                        style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ➕ Ajouter une soumission
                </button>
            </div>

            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 25%;">Entrepreneur</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 35%;">Description Travaux</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right; width: 15%;">Montant ($)</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 15%;">Statut</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center; width: 10%;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (entrepreneursSoumissions.length === 0) {
        html += `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucune soumission enregistrée. Cliquez sur "Ajouter une soumission" pour commencer.
                </td>
            </tr>
        `;
    } else {
        entrepreneursSoumissions.forEach((soum, index) => {
            const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            const statutColors = {
                'En attente': '#ffc107',
                'Reçue': '#28a745',
                'Refusée': '#dc3545',
                'En négociation': '#17a2b8'
            };
            const statutColor = statutColors[soum.statut] || '#6c757d';

            html += `
                <tr style="background: ${bgColor};">
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <input type="text"
                               value="${soum.entrepreneur || ''}"
                               placeholder="Nom entrepreneur..."
                               onchange="window.suiviCoutActions.updateSoumissionEntrepreneur('${soum.id}', 'entrepreneur', this.value)"
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <input type="text"
                               value="${soum.description || ''}"
                               placeholder="Description travaux..."
                               onchange="window.suiviCoutActions.updateSoumissionEntrepreneur('${soum.id}', 'description', this.value)"
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <input type="number"
                               value="${soum.montant || 0}"
                               step="0.01"
                               onchange="window.suiviCoutActions.updateSoumissionEntrepreneur('${soum.id}', 'montant', this.value)"
                               style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: right;">
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <select onchange="window.suiviCoutActions.updateSoumissionEntrepreneur('${soum.id}', 'statut', this.value)"
                                style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: ${statutColor}; color: white; font-weight: bold;">
                            <option value="En attente" ${soum.statut === 'En attente' ? 'selected' : ''}>En attente</option>
                            <option value="Reçue" ${soum.statut === 'Reçue' ? 'selected' : ''}>Reçue</option>
                            <option value="En négociation" ${soum.statut === 'En négociation' ? 'selected' : ''}>En négociation</option>
                            <option value="Refusée" ${soum.statut === 'Refusée' ? 'selected' : ''}>Refusée</option>
                        </select>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                        <button onclick="window.suiviCoutActions.deleteSoumissionEntrepreneur('${soum.id}')"
                                style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Exporte le tableau de bord en Excel
 */
export async function exportSuiviCoutToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('❌ Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();

    // Feuille 1: Résumé
    const totalPieces = calculateTotalPieces();
    const totalDA = await calculateTotalDA();
    const totalT30 = await calculateTotalT30Commandees();
    const totalT60 = await calculateTotalT60Commandees();
    const totalEntrepreneurs = calculateTotalEntrepreneurs();
    const totalManuel = calculateTotalManuel();
    const totalGeneral = totalPieces + totalDA + totalT30 + totalT60 + totalEntrepreneurs + totalManuel;

    const resumeData = [
        ['Catégorie', 'Montant (CAD)'],
        ['Total Pièces', totalPieces],
        ['Total DA', totalDA],
        ['Total T30 (90J) Commandé/Transit/Reçu', totalT30],
        ['Total T60 (60J) Commandé/Transit/Reçu', totalT60],
        ['Total Entrepreneurs', totalEntrepreneurs],
        ['Total Manuel', totalManuel],
        ['', ''],
        ['TOTAL GÉNÉRAL', totalGeneral]
    ];

    const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
    XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

    // Feuille 2: Lignes Manuelles
    const lignesData = lignesManuelles.map(l => ({
        'Catégorie': l.categorie,
        'Description': l.description,
        'Montant': l.montant,
        'Commentaire': l.commentaire
    }));
    const wsLignes = XLSX.utils.json_to_sheet(lignesData);
    XLSX.utils.book_append_sheet(wb, wsLignes, 'Coûts Manuels');

    // Feuille 3: Soumissions Entrepreneurs
    const soumData = entrepreneursSoumissions.map(s => ({
        'Entrepreneur': s.entrepreneur,
        'Description': s.description,
        'Montant': s.montant,
        'Statut': s.statut
    }));
    const wsSoum = XLSX.utils.json_to_sheet(soumData);
    XLSX.utils.book_append_sheet(wb, wsSoum, 'Soumissions Entrepreneurs');

    // Télécharger
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Suivi_Cout_${date}.xlsx`);
}

// Exposer globalement
window.suiviCoutActions = {
    loadSuiviCoutData,
    renderSuiviCoutDashboard,
    addLigneManuelle,
    updateLigneManuelle,
    deleteLigneManuelle,
    addSoumissionEntrepreneur,
    updateSoumissionEntrepreneur,
    deleteSoumissionEntrepreneur,
    exportSuiviCoutToExcel
};

console.log('[SUIVI-COUT] ✅ Module chargé');
