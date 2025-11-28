/**
 * @fileoverview Gestion des données pour les rencontres hebdo de préparation d'arrêt
 * @module data/rencontres-hebdo-data
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les rencontres hebdo
 * @const {string}
 */
const STORAGE_KEY = 'rencontresHebdoData';

/**
 * Structure de données pour les rencontres
 * @type {Array<Object>}
 */
let rencontres = [];

/**
 * ID de la rencontre actuellement sélectionnée
 * @type {string|null}
 */
let currentRencontreId = null;

/**
 * Fonction setter pour injection des données depuis le serveur
 * @param {Array} data - Données des rencontres
 */
export function setRencontresHebdoData(data) {
    if (data && Array.isArray(data)) {
        rencontres = data;
        console.log(`[RENCONTRES-HEBDO] ✅ Données rencontres injectées: ${data.length} rencontre(s)`);
    } else {
        rencontres = [];
        console.log('[RENCONTRES-HEBDO] ℹ️ Aucune rencontre depuis le serveur');
    }

    // Rendre la liste si l'élément existe dans le DOM (page déjà chargée)
    if (document.getElementById('rencontresHebdoListContainer')) {
        console.log('[RENCONTRES-HEBDO] 🎨 Rendu de la liste des rencontres (données du serveur)');
        renderRencontresList();

        // Sélectionner la première rencontre si elle existe
        if (rencontres.length > 0 && !currentRencontreId) {
            selectRencontre(rencontres[0].id);
        }
    }
}

// Exposer globalement pour server-sync.js
window.setRencontresHebdoData = setRencontresHebdoData;

/**
 * Charge les données depuis le serveur
 * @returns {Promise<void>}
 */
export async function loadRencontresHebdoData() {
    // Charger uniquement si pas déjà en mémoire
    if (rencontres.length === 0) {
        console.log('[RENCONTRES-HEBDO] 📥 Chargement des rencontres depuis le serveur...');
        const saved = await loadFromStorage(STORAGE_KEY);
        console.log('[RENCONTRES-HEBDO] Résultat du chargement:', saved ? 'Données reçues' : 'Aucune donnée');

        if (saved && Array.isArray(saved)) {
            rencontres = saved;
            console.log(`[RENCONTRES-HEBDO] ✅ ${rencontres.length} rencontre(s) chargée(s)`);

            // Mettre à jour les statuts après chargement
            updateAllStatuts();
            console.log('[RENCONTRES-HEBDO] Statuts mis à jour après chargement');
        } else {
            console.log('[RENCONTRES-HEBDO] ⚠️ Aucune rencontre trouvée - initialisation tableau vide');
        }
    } else {
        console.log(`[RENCONTRES-HEBDO] ✅ Utilisation des données déjà en mémoire: ${rencontres.length} rencontre(s)`);

        // Toujours mettre à jour les statuts (au cas où la date aurait changé)
        updateAllStatuts();
    }

    // Ne rendre la liste que si l'élément existe dans le DOM (page déjà affichée)
    const listContainer = document.getElementById('rencontresHebdoListContainer');
    if (listContainer) {
        console.log('[RENCONTRES-HEBDO] Container trouvé dans le DOM, rendu...');
        renderRencontresList();

        // Sélectionner la première rencontre si elle existe
        if (rencontres.length > 0 && !currentRencontreId) {
            selectRencontre(rencontres[0].id);
        } else if (rencontres.length === 0) {
            // Créer une première rencontre par défaut
            console.log('[RENCONTRES-HEBDO] Création d\'une première rencontre par défaut...');
            addNewRencontre();
        }
    } else {
        console.log('[RENCONTRES-HEBDO] Container non trouvé (page non affichée), rendu différé');
    }
}

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
        saveData();
    }, 1000); // Attendre 1 seconde après la dernière modification
}

/**
 * Sauvegarde les données sur le serveur
 * @returns {Promise<void>}
 */
async function saveData() {
    console.log('[RENCONTRES-HEBDO] Sauvegarde de', rencontres.length, 'rencontre(s)...');

    const success = await saveToStorage(STORAGE_KEY, rencontres, false);

    if (success) {
        console.log('[RENCONTRES-HEBDO] ✅ Données sauvegardées et synchronisées avec le serveur');
    } else {
        console.error('[RENCONTRES-HEBDO] ❌ ÉCHEC de la sauvegarde des rencontres');
    }

    return success;
}

/**
 * Calcule le statut d'une rencontre basé sur sa date
 * @param {Object} rencontre - La rencontre à évaluer
 * @returns {string} Le statut calculé
 */
function calculerStatutRencontre(rencontre) {
    // Si pas de date, considérer comme "a_venir"
    if (!rencontre.dateRencontre) {
        return 'a_venir';
    }

    // Si déjà marquée comme complétée, garder ce statut
    if (rencontre.statut === 'completee') {
        return 'completee';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateRencontre = new Date(rencontre.dateRencontre);
    dateRencontre.setHours(0, 0, 0, 0);

    // Si la date est passée, c'est en retard
    if (dateRencontre < today) {
        return 'en_retard';
    }

    // Sinon c'est à venir
    return 'a_venir';
}

/**
 * Détermine quelle est la prochaine rencontre (la plus proche dans le futur)
 * @returns {string|null} L'ID de la prochaine rencontre ou null
 */
function trouverProchaineRencontre() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtrer les rencontres futures et non complétées
    const rencontresFutures = rencontres.filter(r => {
        if (!r.dateRencontre || r.statut === 'completee') return false;
        const dateRencontre = new Date(r.dateRencontre);
        dateRencontre.setHours(0, 0, 0, 0);
        return dateRencontre >= today;
    });

    // Trouver la plus proche
    if (rencontresFutures.length === 0) return null;

    rencontresFutures.sort((a, b) => {
        return new Date(a.dateRencontre) - new Date(b.dateRencontre);
    });

    return rencontresFutures[0].id;
}

/**
 * Met à jour automatiquement les statuts de toutes les rencontres
 * @returns {void}
 */
function updateAllStatuts() {
    const prochaineId = trouverProchaineRencontre();

    rencontres.forEach(rencontre => {
        const statutCalcule = calculerStatutRencontre(rencontre);

        // Si c'est la prochaine rencontre, lui attribuer ce statut spécial
        if (rencontre.id === prochaineId && statutCalcule === 'a_venir') {
            rencontre.statut = 'prochaine';
        } else {
            rencontre.statut = statutCalcule;
        }
    });
}

/**
 * Ajoute une nouvelle rencontre
 * @returns {void}
 */
export function addNewRencontre() {
    const newRencontre = {
        id: 'rencontre-hebdo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        titre: `Rencontre ${rencontres.length + 1}`,
        dateRencontre: '',
        participants: '',
        ordreJour: '',
        decisions: '',
        actionsSuivi: [],
        documents: [],
        dateCreation: new Date().toISOString(),
        statut: 'a_venir'
    };

    rencontres.unshift(newRencontre);
    updateAllStatuts();
    renderRencontresList();
    selectRencontre(newRencontre.id);
    scheduleSave();
}

/**
 * Sélectionne une rencontre
 * @param {string} rencontreId - ID de la rencontre
 * @returns {void}
 */
export function selectRencontre(rencontreId) {
    currentRencontreId = rencontreId;
    console.log('[RENCONTRES-HEBDO] Sélection de la rencontre:', rencontreId);
    renderRencontreContent();
    updateRencontresListSelection();
}

/**
 * Met à jour le titre d'une rencontre
 * @param {string} newTitre - Nouveau titre
 * @returns {void}
 */
export function updateRencontreTitre(newTitre) {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (rencontre) {
        rencontre.titre = newTitre;
        renderRencontresList();
        updateRencontresListSelection();
        scheduleSave();
    }
}

/**
 * Met à jour un champ de la rencontre courante
 * @param {string} field - Nom du champ
 * @param {*} value - Nouvelle valeur
 * @returns {void}
 */
export function updateRencontreField(field, value) {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (rencontre) {
        rencontre[field] = value;

        // Si c'est la date qui a changé, recalculer les statuts
        if (field === 'dateRencontre') {
            updateAllStatuts();
            renderRencontresList();
        }

        scheduleSave();
    }
}

/**
 * Ajoute une action de suivi
 * @returns {void}
 */
export function addActionSuivi() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (rencontre) {
        rencontre.actionsSuivi.push({
            id: 'action-' + Date.now(),
            description: '',
            responsable: '',
            echeance: '',
            statut: 'en cours'
        });
        renderRencontreContent();
        scheduleSave();
    }
}

/**
 * Met à jour une action de suivi
 * @param {string} actionId - ID de l'action
 * @param {string} field - Champ à mettre à jour
 * @param {*} value - Nouvelle valeur
 * @returns {void}
 */
export function updateActionSuivi(actionId, field, value) {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (rencontre) {
        const action = rencontre.actionsSuivi.find(a => a.id === actionId);
        if (action) {
            action[field] = value;
            scheduleSave();
        }
    }
}

/**
 * Supprime une action de suivi
 * @param {string} actionId - ID de l'action à supprimer
 * @returns {void}
 */
export function deleteActionSuivi(actionId) {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (rencontre) {
        rencontre.actionsSuivi = rencontre.actionsSuivi.filter(a => a.id !== actionId);
        renderRencontreContent();
        scheduleSave();
    }
}

/**
 * Ajoute un document
 * @returns {void}
 */
export function addDocument() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (rencontre) {
        const nomDoc = prompt('Nom du document (ex: Présentation technique, Compte rendu, etc.)');
        if (nomDoc) {
            rencontre.documents.push({
                id: 'doc-' + Date.now(),
                nom: nomDoc,
                url: '',
                dateAjout: new Date().toISOString()
            });
            renderRencontreContent();
            scheduleSave();
        }
    }
}

/**
 * Met à jour l'URL d'un document
 * @param {string} docId - ID du document
 * @param {string} url - Nouvelle URL
 * @returns {void}
 */
export function updateDocumentUrl(docId, url) {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (rencontre) {
        const doc = rencontre.documents.find(d => d.id === docId);
        if (doc) {
            doc.url = url;
            scheduleSave();
        }
    }
}

/**
 * Supprime un document
 * @param {string} docId - ID du document à supprimer
 * @returns {void}
 */
export function deleteDocument(docId) {
    if (confirm('Supprimer ce document ?')) {
        const rencontre = rencontres.find(r => r.id === currentRencontreId);
        if (rencontre) {
            rencontre.documents = rencontre.documents.filter(d => d.id !== docId);
            renderRencontreContent();
            scheduleSave();
        }
    }
}

/**
 * Marque une rencontre comme complétée ou non complétée
 * @param {string} rencontreId - ID de la rencontre (optionnel, utilise la rencontre courante si non fourni)
 * @returns {void}
 */
export function toggleRencontreCompletee(rencontreId = null) {
    const id = rencontreId || currentRencontreId;
    const rencontre = rencontres.find(r => r.id === id);

    if (rencontre) {
        if (rencontre.statut === 'completee') {
            // Réactiver la rencontre
            rencontre.statut = 'a_venir';
        } else {
            // Marquer comme complétée
            rencontre.statut = 'completee';
        }

        updateAllStatuts();
        renderRencontresList();
        renderRencontreContent();
        scheduleSave();
    }
}

/**
 * Supprime une rencontre
 * @param {string} rencontreId - ID de la rencontre à supprimer
 * @returns {void}
 */
export function deleteRencontre(rencontreId) {
    if (confirm('Supprimer cette rencontre ?')) {
        rencontres = rencontres.filter(r => r.id !== rencontreId);

        // Si c'était la rencontre sélectionnée, sélectionner une autre
        if (currentRencontreId === rencontreId) {
            currentRencontreId = rencontres.length > 0 ? rencontres[0].id : null;
        }

        updateAllStatuts();
        renderRencontresList();

        if (currentRencontreId) {
            renderRencontreContent();
        }

        scheduleSave();
    }
}

/**
 * Rend la liste des rencontres dans la sidebar
 * @returns {void}
 */
function renderRencontresList() {
    const container = document.getElementById('rencontresHebdoListContainer');
    if (!container) return;

    if (rencontres.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 0.85em; text-align: center;">Aucune rencontre</p>';
        return;
    }

    // Mettre à jour les statuts avant de rendre
    updateAllStatuts();

    container.innerHTML = rencontres.map(rencontre => {
        const isActive = rencontre.id === currentRencontreId;

        // Définir les couleurs selon le statut
        let bgColor, borderColor, textColor, badgeColor, badgeText, badgeIcon;

        switch (rencontre.statut) {
            case 'prochaine':
                bgColor = isActive ? '#2563eb' : '#dbeafe';
                borderColor = '#3b82f6';
                textColor = isActive ? 'white' : '#1e40af';
                badgeColor = '#3b82f6';
                badgeText = 'Prochaine';
                badgeIcon = '📅';
                break;
            case 'completee':
                bgColor = isActive ? '#059669' : '#d1fae5';
                borderColor = '#10b981';
                textColor = isActive ? 'white' : '#065f46';
                badgeColor = '#10b981';
                badgeText = 'Complétée';
                badgeIcon = '✅';
                break;
            case 'en_retard':
                bgColor = isActive ? '#dc2626' : '#fee2e2';
                borderColor = '#ef4444';
                textColor = isActive ? 'white' : '#991b1b';
                badgeColor = '#ef4444';
                badgeText = 'En retard';
                badgeIcon = '⚠️';
                break;
            case 'a_venir':
            default:
                bgColor = isActive ? '#667eea' : '#f8f9fa';
                borderColor = '#e5e7eb';
                textColor = isActive ? 'white' : '#333';
                badgeColor = '#6b7280';
                badgeText = 'À venir';
                badgeIcon = '📋';
                break;
        }

        return `
            <div class="rencontre-item ${isActive ? 'active' : ''}"
                 onclick="window.rencontresHebdoActions.selectRencontre('${rencontre.id}')"
                 style="padding: 12px; margin-bottom: 8px; background: ${bgColor};
                        color: ${textColor}; border-radius: 8px; cursor: pointer;
                        border-left: 4px solid ${borderColor};
                        transition: all 0.2s; box-shadow: ${isActive ? '0 2px 8px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div style="font-weight: 600; font-size: 0.95em;">${rencontre.titre}</div>
                    <span style="background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; white-space: nowrap;">
                        ${badgeIcon} ${badgeText}
                    </span>
                </div>
                <div style="font-size: 0.8em; opacity: ${isActive ? 0.9 : 0.7};">
                    ${rencontre.dateRencontre ? new Date(rencontre.dateRencontre).toLocaleDateString('fr-CA') : 'Date non définie'}
                </div>
                <div style="font-size: 0.75em; margin-top: 5px; opacity: ${isActive ? 0.8 : 0.6};">
                    ${rencontre.actionsSuivi.length} action(s) · ${rencontre.documents.length} doc(s)
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Met à jour la sélection dans la liste
 * @returns {void}
 */
function updateRencontresListSelection() {
    renderRencontresList();
}

/**
 * Rend le contenu de la rencontre sélectionnée
 * @returns {void}
 */
function renderRencontreContent() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) {
        console.warn('[RENCONTRES-HEBDO] Aucune rencontre sélectionnée');
        return;
    }

    // Mettre à jour le titre
    const titreInput = document.getElementById('hebdoRencontreTitre');
    if (titreInput) titreInput.value = rencontre.titre;

    // Mettre à jour les champs de la rencontre
    const dateInput = document.getElementById('hebdoDateRencontre');
    if (dateInput) dateInput.value = rencontre.dateRencontre || '';

    const participantsInput = document.getElementById('hebdoParticipants');
    if (participantsInput) participantsInput.value = rencontre.participants || '';

    const ordreJourTextarea = document.getElementById('hebdoOrdreJour');
    if (ordreJourTextarea) ordreJourTextarea.value = rencontre.ordreJour || '';

    const decisionsTextarea = document.getElementById('hebdoDecisions');
    if (decisionsTextarea) decisionsTextarea.value = rencontre.decisions || '';

    // Mettre à jour le bouton "Marquer comme complétée"
    const toggleBtn = document.getElementById('toggleCompleteeBtn');
    if (toggleBtn) {
        if (rencontre.statut === 'completee') {
            toggleBtn.innerHTML = '🔄 Réactiver la rencontre';
            toggleBtn.style.background = '#6b7280';
        } else {
            toggleBtn.innerHTML = '✅ Marquer comme complétée';
            toggleBtn.style.background = '#10b981';
        }
    }

    // Rendre les actions de suivi
    renderActionsSuivi(rencontre);

    // Rendre les documents
    renderDocuments(rencontre);
}

/**
 * Rend le tableau des actions de suivi
 * @param {Object} rencontre - Rencontre courante
 * @returns {void}
 */
function renderActionsSuivi(rencontre) {
    const tbody = document.getElementById('hebdoActionsTableBody');
    if (!tbody) return;

    if (!rencontre.actionsSuivi || rencontre.actionsSuivi.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                    Aucune action de suivi. Cliquez sur "Ajouter une Action" pour commencer.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = rencontre.actionsSuivi.map(action => `
        <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" value="${action.description || ''}"
                       placeholder="Description de l'action"
                       onchange="window.rencontresHebdoActions.updateActionSuivi('${action.id}', 'description', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" value="${action.responsable || ''}"
                       placeholder="Responsable"
                       onchange="window.rencontresHebdoActions.updateActionSuivi('${action.id}', 'responsable', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="date" value="${action.echeance || ''}"
                       onchange="window.rencontresHebdoActions.updateActionSuivi('${action.id}', 'echeance', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <select onchange="window.rencontresHebdoActions.updateActionSuivi('${action.id}', 'statut', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px;">
                    <option value="en cours" ${action.statut === 'en cours' ? 'selected' : ''}>En cours</option>
                    <option value="complété" ${action.statut === 'complété' ? 'selected' : ''}>Complété</option>
                    <option value="en retard" ${action.statut === 'en retard' ? 'selected' : ''}>En retard</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="window.rencontresHebdoActions.deleteActionSuivi('${action.id}')"
                        style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Rend la liste des documents
 * @param {Object} rencontre - Rencontre courante
 * @returns {void}
 */
function renderDocuments(rencontre) {
    const container = document.getElementById('hebdoDocumentsList');
    if (!container) return;

    if (!rencontre.documents || rencontre.documents.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Aucun document ajouté.</p>';
        return;
    }

    container.innerHTML = rencontre.documents.map(doc => `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 8px;">${doc.nom}</div>
                    <input type="text" value="${doc.url || ''}"
                           placeholder="URL ou chemin du document"
                           onchange="window.rencontresHebdoActions.updateDocumentUrl('${doc.id}', this.value)"
                           style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em;">
                    ${doc.url ? `<a href="${doc.url}" target="_blank" style="color: #667eea; font-size: 0.85em; margin-top: 5px; display: inline-block;">📎 Ouvrir le document</a>` : ''}
                </div>
                <button onclick="window.rencontresHebdoActions.deleteDocument('${doc.id}')"
                        style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 15px;">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Génère automatiquement les rencontres de préparation
 * - Rencontres aux 2 semaines jusqu'à -4 semaines avant l'arrêt
 * - Rencontres hebdomadaires de -4 semaines à -1 semaine avant l'arrêt
 * @returns {Promise<void>}
 */
export async function genererRencontresAutomatiques() {
    // Obtenir la date de début de l'arrêt
    let dateDebutArret = null;

    try {
        // Importer le module arret-data pour obtenir la date
        const arretModule = await import('./arret-data.js');
        const arretData = arretModule.getArretData();

        if (!arretData || !arretData.dateDebut) {
            alert('❌ La date de début de l\'arrêt n\'est pas définie.\n\nVeuillez configurer la date de début de l\'arrêt dans les paramètres.');
            return;
        }

        dateDebutArret = new Date(arretData.dateDebut);
        console.log('[RENCONTRES-HEBDO] Date de début de l\'arrêt:', dateDebutArret.toISOString().split('T')[0]);
    } catch (error) {
        console.error('[RENCONTRES-HEBDO] Erreur lors de la récupération de la date d\'arrêt:', error);
        alert('❌ Impossible de récupérer la date de début de l\'arrêt.');
        return;
    }

    // Demander confirmation avant de générer (car ça peut créer beaucoup de rencontres)
    const nbSemainesDebut = parseInt(prompt('À partir de combien de semaines avant l\'arrêt voulez-vous commencer les rencontres ?\n\nExemple: entrez 26 pour commencer -26 semaines avant l\'arrêt', '26'));

    if (isNaN(nbSemainesDebut) || nbSemainesDebut < 4) {
        alert('❌ Veuillez entrer un nombre de semaines valide (minimum 4 semaines).');
        return;
    }

    const confirmation = confirm(
        `Générer les rencontres automatiques ?\n\n` +
        `📅 Date de début de l'arrêt: ${dateDebutArret.toLocaleDateString('fr-CA')}\n\n` +
        `📋 Rencontres qui seront créées:\n` +
        `• Rencontres AUX 2 SEMAINES: de -${nbSemainesDebut} semaines à -4 semaines\n` +
        `• Rencontres HEBDOMADAIRES: de -4 semaines à -1 semaine\n\n` +
        `⚠️ Les rencontres existantes seront conservées.`
    );

    if (!confirmation) {
        return;
    }

    const nouvellesRencontres = [];

    // Phase 1: Rencontres aux 2 semaines (de -nbSemainesDebut à -4 semaines)
    console.log('[RENCONTRES-HEBDO] Phase 1: Génération des rencontres aux 2 semaines...');
    for (let semaines = nbSemainesDebut; semaines >= 4; semaines -= 2) {
        const dateRencontre = new Date(dateDebutArret);
        dateRencontre.setDate(dateRencontre.getDate() - (semaines * 7));

        nouvellesRencontres.push({
            id: 'rencontre-hebdo-auto-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            titre: `Rencontre -${semaines} semaines`,
            dateRencontre: dateRencontre.toISOString().split('T')[0],
            participants: '',
            ordreJour: `Rencontre de préparation - ${semaines} semaines avant l'arrêt\n\nPoints à discuter:\n- État d'avancement des préparatifs\n- Révision de la liste des travaux\n- Points de coordination\n- Actions à prendre`,
            decisions: '',
            actionsSuivi: [],
            documents: [],
            dateCreation: new Date().toISOString(),
            genereeAutomatiquement: true,
            statut: 'a_venir'
        });
    }

    // Phase 2: Rencontres hebdomadaires (de -4 semaines à -1 semaine)
    console.log('[RENCONTRES-HEBDO] Phase 2: Génération des rencontres hebdomadaires...');
    for (let semaines = 4; semaines >= 1; semaines--) {
        const dateRencontre = new Date(dateDebutArret);
        dateRencontre.setDate(dateRencontre.getDate() - (semaines * 7));

        nouvellesRencontres.push({
            id: 'rencontre-hebdo-auto-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            titre: `Rencontre -${semaines} semaine${semaines > 1 ? 's' : ''}`,
            dateRencontre: dateRencontre.toISOString().split('T')[0],
            participants: '',
            ordreJour: `Rencontre de préparation - ${semaines} semaine${semaines > 1 ? 's' : ''} avant l'arrêt\n\nPoints à discuter:\n- Révision finale des travaux planifiés\n- État de préparation des équipes\n- Coordination des ressources\n- Validation des derniers détails\n- Actions urgentes`,
            decisions: '',
            actionsSuivi: [],
            documents: [],
            dateCreation: new Date().toISOString(),
            genereeAutomatiquement: true,
            statut: 'a_venir'
        });
    }

    // Trier les rencontres par date (plus récentes en premier)
    nouvellesRencontres.sort((a, b) => new Date(b.dateRencontre) - new Date(a.dateRencontre));

    // Ajouter les nouvelles rencontres au début de la liste
    rencontres = [...nouvellesRencontres, ...rencontres];

    console.log(`[RENCONTRES-HEBDO] ✅ ${nouvellesRencontres.length} rencontres générées automatiquement`);

    // Mettre à jour les statuts de toutes les rencontres
    updateAllStatuts();

    // Sauvegarder et rafraîchir l'affichage
    await saveData();
    renderRencontresList();

    // Sélectionner la première rencontre (la plus proche de l'arrêt)
    if (rencontres.length > 0) {
        selectRencontre(rencontres[0].id);
    }

    alert(`✅ ${nouvellesRencontres.length} rencontres de préparation générées avec succès !\n\n` +
          `📋 Rencontres aux 2 semaines: ${Math.floor((nbSemainesDebut - 4) / 2) + 1}\n` +
          `📋 Rencontres hebdomadaires: 4\n\n` +
          `Les dates sont calculées automatiquement à partir de la date de début de l'arrêt.`);
}

/**
 * Exporte les données au format Excel
 * @returns {void}
 */
export function exportToExcel() {
    const rencontre = rencontres.find(r => r.id === currentRencontreId);
    if (!rencontre) {
        alert('Aucune rencontre sélectionnée');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();

    // Feuille 1: Informations générales
    const infoData = [
        ['Titre', rencontre.titre],
        ['Date de la rencontre', rencontre.dateRencontre || ''],
        ['Participants', rencontre.participants || ''],
        [''],
        ['Ordre du jour'],
        [rencontre.ordreJour || ''],
        [''],
        ['Décisions'],
        [rencontre.decisions || '']
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');

    // Feuille 2: Actions de suivi
    if (rencontre.actionsSuivi && rencontre.actionsSuivi.length > 0) {
        const actionsData = [
            ['Description', 'Responsable', 'Échéance', 'Statut'],
            ...rencontre.actionsSuivi.map(a => [
                a.description || '',
                a.responsable || '',
                a.echeance || '',
                a.statut || ''
            ])
        ];
        const wsActions = XLSX.utils.aoa_to_sheet(actionsData);
        XLSX.utils.book_append_sheet(wb, wsActions, 'Actions de Suivi');
    }

    const fileName = `Rencontre_Hebdo_${rencontre.titre.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Exposer les fonctions globalement
console.log('[RENCONTRES-HEBDO] 📤 Exposition des fonctions dans window.rencontresHebdoActions...');
window.rencontresHebdoActions = {
    addNewRencontre,
    selectRencontre,
    updateRencontreTitre,
    updateRencontreField,
    addActionSuivi,
    updateActionSuivi,
    deleteActionSuivi,
    addDocument,
    updateDocumentUrl,
    deleteDocument,
    deleteRencontre,
    toggleRencontreCompletee,
    exportToExcel,
    loadRencontresHebdoData,
    genererRencontresAutomatiques
};

// Fonctions wrapper globales pour les boutons HTML (pour éviter les problèmes de chargement asynchrone)
window.genererRencontresHebdoAuto = async function() {
    console.log('[RENCONTRES-HEBDO] Wrapper genererRencontresHebdoAuto() appelé');
    if (window.rencontresHebdoActions && window.rencontresHebdoActions.genererRencontresAutomatiques) {
        await window.rencontresHebdoActions.genererRencontresAutomatiques();
    } else {
        console.warn('[RENCONTRES-HEBDO] Module non encore chargé, import en cours...');
        try {
            const module = await import('./rencontres-hebdo-data.js');
            await module.genererRencontresAutomatiques();
        } catch (error) {
            console.error('[RENCONTRES-HEBDO] Erreur lors du chargement du module:', error);
            alert('❌ Erreur lors du chargement du module. Veuillez rafraîchir la page.');
        }
    }
};

window.addNewRencontreHebdo = async function() {
    console.log('[RENCONTRES-HEBDO] Wrapper addNewRencontreHebdo() appelé');
    if (window.rencontresHebdoActions && window.rencontresHebdoActions.addNewRencontre) {
        window.rencontresHebdoActions.addNewRencontre();
    } else {
        console.warn('[RENCONTRES-HEBDO] Module non encore chargé, import en cours...');
        try {
            const module = await import('./rencontres-hebdo-data.js');
            module.addNewRencontre();
        } catch (error) {
            console.error('[RENCONTRES-HEBDO] Erreur lors du chargement du module:', error);
            alert('❌ Erreur lors du chargement du module. Veuillez rafraîchir la page.');
        }
    }
};

window.exportRencontreHebdoToExcel = async function() {
    console.log('[RENCONTRES-HEBDO] Wrapper exportRencontreHebdoToExcel() appelé');
    if (window.rencontresHebdoActions && window.rencontresHebdoActions.exportToExcel) {
        window.rencontresHebdoActions.exportToExcel();
    } else {
        console.warn('[RENCONTRES-HEBDO] Module non encore chargé, import en cours...');
        try {
            const module = await import('./rencontres-hebdo-data.js');
            module.exportToExcel();
        } catch (error) {
            console.error('[RENCONTRES-HEBDO] Erreur lors du chargement du module:', error);
            alert('❌ Erreur lors du chargement du module. Veuillez rafraîchir la page.');
        }
    }
};

console.log('[RENCONTRES-HEBDO] ✅ Module chargé - window.rencontresHebdoActions disponible avec', Object.keys(window.rencontresHebdoActions).length, 'fonctions');
console.log('[RENCONTRES-HEBDO] ✅ Fonctions wrapper globales créées: genererRencontresHebdoAuto, addNewRencontreHebdo, exportRencontreHebdoToExcel');
console.log('[RENCONTRES-HEBDO] Fonctions disponibles:', Object.keys(window.rencontresHebdoActions).join(', '));
