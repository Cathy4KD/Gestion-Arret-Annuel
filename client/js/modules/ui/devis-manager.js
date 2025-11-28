/**
 * @fileoverview Module UI pour la gestion des devis
 * @module ui/devis-manager
 */

import { getIw37nData } from '../data/iw37n-data.js';
import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Structure d'un devis basée sur le template fourni
 */
const DEVIS_TEMPLATE = {
    // En-tête
    titre: "Devis général",
    entrepreneur: "",
    specialite: "",
    dateCreation: "",

    // Dates clés
    dates: {
        debutVisites: "",
        remiseSoumission: "",
        adjudication: "",
        listeCognibox: "",
        debutMobilisation: "",
        finMobilisation: "",
        debutArret: "",
        finArret: "",
        demobilisation: ""
    },

    // Informations travaux
    travaux: {
        description: "",
        lieu: "Rio Tinto Fer et Titane, Sorel-Tracy, Québec, Canada",
        typeContrat: "Dépenses contrôlées"
    },

    // Renseignements requis avec l'offre
    renseignements: {
        echeancier: "",
        nombreTrvailleurs: 0,
        sousTraitants: [],
        roulottes: {
            nombre: 0,
            dimensions: []
        }
    },

    // Opérations sélectionnées depuis IW37N
    operations: []
};

/**
 * État du gestionnaire de devis
 */
const devisState = {
    entrepreneursFilters: new Set(),
    devisSauvegardes: [],
    entrepreneursList: [],
    entrepreneursData: {} // Données saisies par entrepreneur
};

/**
 * Initialise le gestionnaire de devis
 */
export async function initDevisManager() {
    console.log('[DEVIS] Initialisation du gestionnaire de devis');

    // Charger les devis sauvegardés depuis le SERVEUR SEULEMENT si pas déjà injectés
    if (!devisState.devisSauvegardes || devisState.devisSauvegardes.length === 0) {
        await loadSavedDevis();
    } else {
        console.log('[DEVIS] Devis déjà injectés depuis le serveur:', devisState.devisSauvegardes.length);
    }

    // Charger la liste des entrepreneurs depuis le SERVEUR ou IW37N
    if (!devisState.entrepreneursList || devisState.entrepreneursList.length === 0) {
        // Essayer de charger depuis le serveur d'abord
        await loadEntrepreneursListFromServer();

        // Si toujours vide, extraire depuis IW37N
        if (!devisState.entrepreneursList || devisState.entrepreneursList.length === 0) {
            loadEntrepreneursList();
        } else {
            // Liste chargée depuis le serveur, initialiser les filtres
            console.log('[DEVIS] Liste entrepreneurs chargée depuis le serveur:', devisState.entrepreneursList.length);
            devisState.entrepreneursFilters.clear();
            devisState.entrepreneursList.forEach(e => devisState.entrepreneursFilters.add(e));
            updateEntrepreneurFilters();
        }
    } else {
        console.log('[DEVIS] Liste entrepreneurs déjà injectée depuis le serveur:', devisState.entrepreneursList.length);
        // Initialiser les filtres si la liste existe
        devisState.entrepreneursFilters.clear();
        devisState.entrepreneursList.forEach(e => devisState.entrepreneursFilters.add(e));
        updateEntrepreneurFilters();
    }

    // Charger les données des entrepreneurs depuis le SERVEUR SEULEMENT si pas déjà injectées
    if (!devisState.entrepreneursData || Object.keys(devisState.entrepreneursData).length === 0) {
        await loadEntrepreneursData();
    } else {
        console.log('[DEVIS] Données entrepreneurs déjà injectées depuis le serveur:', Object.keys(devisState.entrepreneursData).length);
    }

    console.log('[DEVIS] Gestionnaire de devis initialisé avec succès');
}

/**
 * Charge la liste des entrepreneurs depuis IW37N
 * Extrait les valeurs uniques de POST.TRAV.OPÉR. en excluant celles commençant par A et E
 * NE S'EXÉCUTE QUE SI la liste n'a pas déjà été injectée depuis le serveur
 */
function loadEntrepreneursList() {
    try {
        // Si la liste a déjà été injectée depuis le serveur, ne pas la remplacer
        if (devisState.entrepreneursList && devisState.entrepreneursList.length > 0) {
            console.log('[DEVIS] Liste entrepreneurs déjà disponible (injectée depuis le serveur), pas d\'extraction depuis IW37N');
            return;
        }

        const iw37nData = getIw37nData();
        const entrepreneurs = new Set();
        const allValues = new Set(); // Pour debug

        if (iw37nData && iw37nData.length > 0) {
            iw37nData.forEach(row => {
                // Extraire POST.TRAV.OPÉR.
                const posteTravOper = row['Post.trav.opér.'] || row['Post.trav.oper.'] || row['PosteTravOper'] || '';
                const posteTravOperStr = posteTravOper.toString().trim();

                // Pour debug: collecter toutes les valeurs
                if (posteTravOperStr) {
                    allValues.add(posteTravOperStr);
                }

                // Exclure les valeurs vides et celles commençant par A ou E
                if (posteTravOperStr &&
                    !posteTravOperStr.toUpperCase().startsWith('A') &&
                    !posteTravOperStr.toUpperCase().startsWith('E')) {
                    entrepreneurs.add(posteTravOperStr);
                }
            });
        }

        // Debug: afficher toutes les valeurs uniques trouvées
        const allValuesArray = Array.from(allValues).sort();
        console.log('[DEVIS] TOUTES les valeurs Post.trav.opér. trouvées:', allValuesArray);
        console.log('[DEVIS] Nombre total de valeurs uniques:', allValuesArray.length);

        devisState.entrepreneursList = Array.from(entrepreneurs).sort();
        console.log('[DEVIS] Entrepreneurs trouvés (POST.TRAV.OPÉR.) après filtre A/E:', devisState.entrepreneursList);
        console.log('[DEVIS] Nombre d\'entrepreneurs après filtre:', devisState.entrepreneursList.length);

        // Si aucun entrepreneur trouvé, afficher un message
        if (devisState.entrepreneursList.length === 0) {
            console.warn('[DEVIS] ⚠️ AUCUN entrepreneur trouvé après avoir exclu ceux commençant par A ou E!');
            console.warn('[DEVIS] ⚠️ Vérifiez que les données IW37N contiennent des valeurs Post.trav.opér. ne commençant pas par A ou E');
        }

        // Sauvegarder la liste sur le serveur
        saveEntrepreneursList();

        // Initialiser tous les entrepreneurs comme sélectionnés
        devisState.entrepreneursList.forEach(e => devisState.entrepreneursFilters.add(e));

        // Mettre à jour l'UI
        updateEntrepreneurFilters();
    } catch (error) {
        console.error('[DEVIS] Erreur chargement entrepreneurs:', error);
    }
}

/**
 * Récupère le nom d'un code externe depuis les données contacts
 * @param {string} code - Code externe
 * @returns {string} Nom correspondant ou chaîne vide
 */
function getCodeExterneName(code) {
    try {
        if (typeof window.getCodesExternes === 'function') {
            const codesExternes = window.getCodesExternes();
            const codeData = codesExternes.find(c => c.code === code);
            return codeData ? codeData.nom : '';
        }
    } catch (error) {
        console.warn('[DEVIS] Erreur récupération nom code externe:', error);
    }
    return '';
}

/**
 * Met à jour l'UI des filtres entrepreneurs
 */
function updateEntrepreneurFilters() {
    const container = document.getElementById('devis-entrepreneur-filters');
    const countSpan = document.getElementById('devis-entrepreneur-count');

    if (!container) return;

    const total = devisState.entrepreneursList.length;
    const selected = devisState.entrepreneursFilters.size;

    // Mettre à jour le compteur
    if (countSpan) {
        countSpan.textContent = `${selected} / ${total} sélectionnés`;
    }

    // Mettre à jour le texte du bouton
    const btnText = document.getElementById('devis-entrepreneur-selected-text');
    if (btnText) {
        if (selected === 0) {
            btnText.textContent = 'Aucun entrepreneur sélectionné';
        } else if (selected === total) {
            btnText.textContent = 'Tous les entrepreneurs';
        } else if (selected === 1) {
            const selectedEntrepreneur = Array.from(devisState.entrepreneursFilters)[0];
            const codeName = getCodeExterneName(selectedEntrepreneur);
            btnText.textContent = codeName ? `${selectedEntrepreneur} - ${codeName}` : selectedEntrepreneur;
        } else {
            btnText.textContent = `${selected} entrepreneurs sélectionnés`;
        }
    }

    // Générer les checkboxes
    container.innerHTML = devisState.entrepreneursList.map(entrepreneur => {
        const codeName = getCodeExterneName(entrepreneur);
        const displayText = codeName ? `${entrepreneur} - ${codeName}` : entrepreneur;

        return `
            <div style="padding: 8px; border-bottom: 1px solid #eee;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input
                        type="checkbox"
                        value="${entrepreneur}"
                        ${devisState.entrepreneursFilters.has(entrepreneur) ? 'checked' : ''}
                        onchange="window.devisManager.toggleEntrepreneurFilter('${entrepreneur.replace(/'/g, "\\'")}')"
                        style="margin-right: 10px; cursor: pointer;"
                    />
                    <span style="color: #333;">${displayText}</span>
                </label>
            </div>
        `;
    }).join('');
}

/**
 * Bascule le dropdown des entrepreneurs
 */
export function toggleEntrepreneurDropdown() {
    const dropdown = document.getElementById('devis-entrepreneur-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Bascule le filtre d'un entrepreneur
 */
export function toggleEntrepreneurFilter(entrepreneur) {
    if (devisState.entrepreneursFilters.has(entrepreneur)) {
        devisState.entrepreneursFilters.delete(entrepreneur);
    } else {
        devisState.entrepreneursFilters.add(entrepreneur);
    }
    updateEntrepreneurFilters();
    filterDevisTable();
}

/**
 * Sélectionne tous les entrepreneurs
 */
export function selectAllEntrepreneurs() {
    devisState.entrepreneursList.forEach(e => devisState.entrepreneursFilters.add(e));
    updateEntrepreneurFilters();
    filterDevisTable();
}

/**
 * Désélectionne tous les entrepreneurs
 */
export function deselectAllEntrepreneurs() {
    devisState.entrepreneursFilters.clear();
    updateEntrepreneurFilters();
    filterDevisTable();
}

/**
 * Filtre le tableau selon les entrepreneurs sélectionnés
 */
function filterDevisTable() {
    // Cette fonction sera appelée pour filtrer le tableau
    // Elle travaillera avec le système de filtrage existant
    if (window.dataActions && window.dataActions.filterIW37NTable) {
        window.dataActions.filterIW37NTable('devis');
    }
}

/**
 * Vérifie si une ligne passe le filtre entrepreneur
 */
export function passesEntrepreneurFilter(entrepreneur) {
    if (!entrepreneur) return false;
    return devisState.entrepreneursFilters.has(entrepreneur.trim());
}

/**
 * Ouvre le formulaire de création de devis
 */
export function creerDevis() {
    console.log('[DEVIS] Ouverture du formulaire de création');

    // Récupérer les opérations filtrées depuis le tableau
    const operations = getFilteredOperations();

    if (operations.length === 0) {
        alert('Veuillez sélectionner au moins une opération en utilisant les filtres.');
        return;
    }

    showDevisForm(operations);
}

/**
 * Récupère les opérations filtrées depuis le tableau
 */
function getFilteredOperations() {
    const tbody = document.getElementById('devis-tbody');
    if (!tbody) return [];

    const operations = [];
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        if (row.style.display !== 'none' && !row.querySelector('td[colspan]')) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                operations.push({
                    etat: cells[0].textContent.trim(),
                    ordre: cells[1].textContent.trim(),
                    designation: cells[2].textContent.trim(),
                    operation: cells[3].textContent.trim(),
                    posteTravail: cells[4].textContent.trim(),
                    posteTechnique: cells[5].textContent.trim()
                });
            }
        }
    });

    return operations;
}

/**
 * Affiche le formulaire de création/modification de devis
 */
function showDevisForm(operations = []) {
    const modal = document.createElement('div');
    modal.id = 'devis-form-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 20px;
    `;

    const formContainer = document.createElement('div');
    formContainer.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    const today = new Date().toISOString().split('T')[0];

    formContainer.innerHTML = `
        <h2 style="margin: 0 0 25px 0; color: #333; font-size: 24px;">✏️ Créer un Devis</h2>

        <form id="devis-form">
            <!-- En-tête -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #667eea;">Informations Générales</h3>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                        Titre du devis:
                    </label>
                    <input type="text" name="titre" value="Devis général" required
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Entrepreneur:
                        </label>
                        <input type="text" name="entrepreneur" required
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Spécialité:
                        </label>
                        <select name="specialite" required
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                            <option value="">Sélectionner...</option>
                            <option value="Mécanique">Mécanique</option>
                            <option value="Électrique">Électrique</option>
                            <option value="Tuyauterie">Tuyauterie</option>
                            <option value="Structure">Structure</option>
                            <option value="Réfractaire">Réfractaire</option>
                            <option value="Instrumentation">Instrumentation</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                        Date de création:
                    </label>
                    <input type="date" name="dateCreation" value="${today}" required
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
            </div>

            <!-- Dates Clés -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #667eea;">Dates Clés</h3>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Début des visites:
                        </label>
                        <input type="date" name="debutVisites"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Remise soumission:
                        </label>
                        <input type="date" name="remiseSoumission"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Adjudication:
                        </label>
                        <input type="date" name="adjudication"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Liste Cognibox:
                        </label>
                        <input type="date" name="listeCognibox"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Début mobilisation:
                        </label>
                        <input type="date" name="debutMobilisation"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Fin mobilisation:
                        </label>
                        <input type="date" name="finMobilisation"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Début arrêt:
                        </label>
                        <input type="date" name="debutArret"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Fin arrêt:
                        </label>
                        <input type="date" name="finArret"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>
                </div>
            </div>

            <!-- Description des travaux -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #667eea;">Description des Travaux</h3>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                        Description:
                    </label>
                    <textarea name="description" rows="4" required
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;"
                        placeholder="Décrivez les travaux à réaliser..."></textarea>
                </div>
            </div>

            <!-- Renseignements -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #667eea;">Renseignements Requis</h3>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Nombre de travailleurs:
                        </label>
                        <input type="number" name="nombreTrvailleurs" min="0" value="0"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                            Nombre de roulottes:
                        </label>
                        <input type="number" name="nombreRoulottes" min="0" value="0"
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">
                        Sous-traitants (un par ligne):
                    </label>
                    <textarea name="sousTraitants" rows="3"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;"
                        placeholder="Nom Sous-traitant 1&#10;Nom Sous-traitant 2&#10;..."></textarea>
                </div>
            </div>

            <!-- Opérations sélectionnées -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #667eea;">
                    Opérations Incluses (${operations.length})
                </h3>
                <div style="max-height: 200px; overflow-y: auto; background: white; padding: 10px; border-radius: 8px;">
                    ${operations.length > 0 ? operations.map(op => `
                        <div style="padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">
                            <strong>${op.ordre}</strong> - ${op.designation}
                            <br><span style="color: #666;">Post. Trav: ${op.posteTravail} | Post. Tech: ${op.posteTechnique}</span>
                        </div>
                    `).join('') : '<p style="color: #999; text-align: center;">Aucune opération sélectionnée</p>'}
                </div>
            </div>

            <!-- Boutons -->
            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                <button type="button" onclick="window.devisManager.closeDevisForm()"
                    style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    Annuler
                </button>
                <button type="submit"
                    style="padding: 12px 30px; background: linear-gradient(145deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    💾 Sauvegarder le Devis
                </button>
            </div>
        </form>
    `;

    modal.appendChild(formContainer);
    document.body.appendChild(modal);

    // Gérer la soumission du formulaire
    const form = document.getElementById('devis-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveDevis(new FormData(form), operations);
    });

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDevisForm();
        }
    });
}

/**
 * Ferme le formulaire de devis
 */
export function closeDevisForm() {
    const modal = document.getElementById('devis-form-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Sauvegarde un devis
 */
function saveDevis(formData, operations) {
    const sousTraitantsText = formData.get('sousTraitants');
    const sousTraitants = sousTraitantsText ? sousTraitantsText.split('\n').filter(s => s.trim()) : [];

    const devis = {
        id: Date.now(),
        titre: formData.get('titre'),
        entrepreneur: formData.get('entrepreneur'),
        specialite: formData.get('specialite'),
        dateCreation: formData.get('dateCreation'),
        dates: {
            debutVisites: formData.get('debutVisites'),
            remiseSoumission: formData.get('remiseSoumission'),
            adjudication: formData.get('adjudication'),
            listeCognibox: formData.get('listeCognibox'),
            debutMobilisation: formData.get('debutMobilisation'),
            finMobilisation: formData.get('finMobilisation'),
            debutArret: formData.get('debutArret'),
            finArret: formData.get('finArret')
        },
        travaux: {
            description: formData.get('description'),
            lieu: "Rio Tinto Fer et Titane, Sorel-Tracy, Québec, Canada",
            typeContrat: "Dépenses contrôlées"
        },
        renseignements: {
            nombreTrvailleurs: parseInt(formData.get('nombreTrvailleurs')) || 0,
            nombreRoulottes: parseInt(formData.get('nombreRoulottes')) || 0,
            sousTraitants: sousTraitants
        },
        operations: operations
    };

    // Ajouter à la liste
    devisState.devisSauvegardes.push(devis);

    // Sauvegarder sur le SERVEUR (plus de localStorage!)
    saveToStorage('t55Data', devisState.devisSauvegardes)
        .then(success => {
            if (success) {
                console.log('[DEVIS] Devis sauvegardé avec succès sur le serveur:', devis.id);
                alert('Devis créé avec succès!');
                closeDevisForm();
            } else {
                console.error('[DEVIS] Erreur sauvegarde serveur');
                alert('Erreur lors de la sauvegarde du devis sur le serveur');
            }
        })
        .catch(error => {
            console.error('[DEVIS] Erreur sauvegarde:', error);
            alert('Erreur lors de la sauvegarde du devis');
        });
}

/**
 * Charge les devis sauvegardés depuis le SERVEUR
 */
async function loadSavedDevis() {
    try {
        const saved = await loadFromStorage('t55Data');
        if (saved && Array.isArray(saved)) {
            devisState.devisSauvegardes = saved;
            console.log('[DEVIS] Devis chargés depuis le serveur:', devisState.devisSauvegardes.length);
        } else {
            devisState.devisSauvegardes = [];
            console.log('[DEVIS] Aucun devis sauvegardé sur le serveur');
        }
    } catch (error) {
        console.error('[DEVIS] Erreur chargement devis depuis le serveur:', error);
        devisState.devisSauvegardes = [];
    }
}

/**
 * Affiche l'historique des devis et corrections
 */
export async function showHistorique() {
    console.log('[DEVIS] Ouverture historique');

    // Charger l'historique depuis le SERVEUR
    const historique = await loadHistoriqueData();

    const modal = document.createElement('div');
    modal.id = 'devis-historique-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 95%;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #333; font-size: 24px;">📋 Historique des Devis et Corrections</h2>
            <div style="display: flex; gap: 10px;">
                <button onclick="window.devisManager.addHistoriqueEntry()"
                    style="padding: 8px 16px; background: linear-gradient(145deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    ➕ Ajouter
                </button>
                <button onclick="window.devisManager.closeHistorique()"
                    style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    ✕ Fermer
                </button>
            </div>
        </div>

        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 50px;">Occ.</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 70px;">Révison</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 60px;">Item</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Equipement</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 80px;">Ordre</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 200px;">Description des travaux</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Matériel RTFT</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Matériel Entr.</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 120px;">Dessins - Réf.</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 80px;">Gammes</th>
                        <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; min-width: 100px;">CptrGrpGam</th>
                        <th style="padding: 12px 8px; text-align: center; border: 1px solid #dee2e6; width: 80px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="historique-tbody">
                    ${historique.length === 0 ? `
                        <tr>
                            <td colspan="12" style="padding: 40px; text-align: center; color: #999;">
                                Aucune entrée. Cliquez sur "Ajouter" pour commencer.
                            </td>
                        </tr>
                    ` : historique.map((entry, index) => `
                        <tr style="background: ${index % 2 === 0 ? 'white' : '#f8f9fa'};">
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.occ || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.revision || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.item || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.equipement || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.ordre || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.description || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.materielRTFT || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.materielEntrepreneur || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.dessinsRef || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.gammes || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${entry.cptrGrpGam || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                                <button onclick="window.devisManager.editHistoriqueEntry(${index})"
                                    style="padding: 4px 8px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 11px;">
                                    ✏️
                                </button>
                                <button onclick="window.devisManager.deleteHistoriqueEntry(${index})"
                                    style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeHistorique();
        }
    });
}

/**
 * Ferme l'historique
 */
export function closeHistorique() {
    const modal = document.getElementById('devis-historique-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Affiche un devis en détail
 */
export function viewDevis(devisId) {
    const devis = devisState.devisSauvegardes.find(d => d.id === devisId);
    if (!devis) {
        alert('Devis non trouvé');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'devis-view-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 40px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h1 style="margin: 0; color: #333;">${devis.titre}</h1>
            <button onclick="window.devisManager.closeDevisView()"
                style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                ✕ Fermer
            </button>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="color: #667eea; margin-bottom: 10px;">Entrepreneur</h2>
            <p style="margin: 5px 0;"><strong>Code:</strong> ${devis.entrepreneur}</p>
            ${getCodeExterneName(devis.entrepreneur) ? `<p style="margin: 5px 0;"><strong>Nom:</strong> ${getCodeExterneName(devis.entrepreneur)}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Spécialité:</strong> ${devis.specialite}</p>
            <p style="margin: 5px 0;"><strong>Date création:</strong> ${new Date(devis.dateCreation).toLocaleDateString('fr-CA')}</p>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="color: #667eea; margin-bottom: 10px;">Dates Clés</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                ${devis.dates.debutVisites ? `<p style="margin: 5px 0;"><strong>Début visites:</strong> ${new Date(devis.dates.debutVisites).toLocaleDateString('fr-CA')}</p>` : ''}
                ${devis.dates.remiseSoumission ? `<p style="margin: 5px 0;"><strong>Remise soumission:</strong> ${new Date(devis.dates.remiseSoumission).toLocaleDateString('fr-CA')}</p>` : ''}
                ${devis.dates.adjudication ? `<p style="margin: 5px 0;"><strong>Adjudication:</strong> ${new Date(devis.dates.adjudication).toLocaleDateString('fr-CA')}</p>` : ''}
                ${devis.dates.listeCognibox ? `<p style="margin: 5px 0;"><strong>Liste Cognibox:</strong> ${new Date(devis.dates.listeCognibox).toLocaleDateString('fr-CA')}</p>` : ''}
                ${devis.dates.debutArret ? `<p style="margin: 5px 0;"><strong>Début arrêt:</strong> ${new Date(devis.dates.debutArret).toLocaleDateString('fr-CA')}</p>` : ''}
                ${devis.dates.finArret ? `<p style="margin: 5px 0;"><strong>Fin arrêt:</strong> ${new Date(devis.dates.finArret).toLocaleDateString('fr-CA')}</p>` : ''}
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="color: #667eea; margin-bottom: 10px;">Travaux</h2>
            <p style="margin: 5px 0;"><strong>Lieu:</strong> ${devis.travaux.lieu}</p>
            <p style="margin: 5px 0;"><strong>Type de contrat:</strong> ${devis.travaux.typeContrat}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 5px;">
                ${devis.travaux.description}
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="color: #667eea; margin-bottom: 10px;">Renseignements</h2>
            <p style="margin: 5px 0;"><strong>Nombre de travailleurs:</strong> ${devis.renseignements.nombreTrvailleurs}</p>
            <p style="margin: 5px 0;"><strong>Nombre de roulottes:</strong> ${devis.renseignements.nombreRoulottes}</p>
            ${devis.renseignements.sousTraitants.length > 0 ? `
                <p style="margin: 10px 0 5px 0;"><strong>Sous-traitants:</strong></p>
                <ul style="margin: 5px 0;">
                    ${devis.renseignements.sousTraitants.map(st => `<li>${st}</li>`).join('')}
                </ul>
            ` : ''}
        </div>

        <div>
            <h2 style="color: #667eea; margin-bottom: 10px;">Opérations (${devis.operations.length})</h2>
            <div style="max-height: 400px; overflow-y: auto; border: 2px solid #ddd; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="position: sticky; top: 0; background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                        <tr>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Ordre</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Désignation</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Post. Trav.</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Post. Tech.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${devis.operations.map((op, idx) => `
                            <tr style="background: ${idx % 2 === 0 ? 'white' : '#f8f9fa'};">
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${op.ordre}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${op.designation}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${op.posteTravail}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${op.posteTechnique}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDevisView();
        }
    });
}

/**
 * Ferme la vue détaillée
 */
export function closeDevisView() {
    const modal = document.getElementById('devis-view-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Exporte un devis en PDF
 */
export function exportDevisPDF(devisId) {
    const devis = devisState.devisSauvegardes.find(d => d.id === devisId);
    if (!devis) {
        alert('Devis non trouvé');
        return;
    }

    alert('Fonctionnalité d\'export PDF en cours de développement.\nPour l\'instant, vous pouvez utiliser la vue détaillée et imprimer la page (Ctrl+P).');

    // Ouvrir la vue pour impression
    viewDevis(devisId);
}

/**
 * Supprime un devis
 */
export function deleteDevis(devisId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis?')) {
        return;
    }

    const index = devisState.devisSauvegardes.findIndex(d => d.id === devisId);
    if (index !== -1) {
        devisState.devisSauvegardes.splice(index, 1);

        // Sauvegarder sur le SERVEUR
        saveToStorage('t55Data', devisState.devisSauvegardes)
            .then(success => {
                if (success) {
                    console.log('[DEVIS] Devis supprimé sur le serveur:', devisId);
                    // Rafraîchir l'historique
                    closeHistorique();
                    showHistorique();
                } else {
                    console.error('[DEVIS] Erreur suppression serveur');
                    alert('Erreur lors de la suppression du devis sur le serveur');
                }
            })
            .catch(error => {
                console.error('[DEVIS] Erreur suppression:', error);
                alert('Erreur lors de la suppression du devis');
            });
    }
}

/**
 * Charge la liste des entrepreneurs depuis le SERVEUR
 */
async function loadEntrepreneursListFromServer() {
    try {
        const saved = await loadFromStorage('t55EntrepreneursList');
        if (saved && Array.isArray(saved) && saved.length > 0) {
            devisState.entrepreneursList = saved;
            console.log('[DEVIS] Liste entrepreneurs chargée depuis le serveur:', devisState.entrepreneursList.length);
        } else {
            devisState.entrepreneursList = [];
            console.log('[DEVIS] Aucune liste entrepreneurs sur le serveur');
        }
    } catch (error) {
        console.error('[DEVIS] Erreur chargement liste entrepreneurs depuis le serveur:', error);
        devisState.entrepreneursList = [];
    }
}

/**
 * Charge les données des entrepreneurs depuis le SERVEUR
 */
async function loadEntrepreneursData() {
    try {
        const saved = await loadFromStorage('t55EntrepreneursData');
        if (saved && typeof saved === 'object') {
            devisState.entrepreneursData = saved;
            console.log('[DEVIS] Données entrepreneurs chargées depuis le serveur:', Object.keys(devisState.entrepreneursData).length);
        } else {
            devisState.entrepreneursData = {};
            console.log('[DEVIS] Aucune donnée entrepreneurs sur le serveur');
        }
    } catch (error) {
        console.error('[DEVIS] Erreur chargement données entrepreneurs depuis le serveur:', error);
        devisState.entrepreneursData = {};
    }
}

/**
 * Sauvegarde les données des entrepreneurs sur le SERVEUR
 */
async function saveEntrepreneursData() {
    try {
        const success = await saveToStorage('t55EntrepreneursData', devisState.entrepreneursData);
        if (success) {
            console.log('[DEVIS] Données entrepreneurs sauvegardées sur le serveur');
        } else {
            console.error('[DEVIS] Erreur sauvegarde données entrepreneurs sur le serveur');
        }
    } catch (error) {
        console.error('[DEVIS] Erreur sauvegarde données entrepreneurs:', error);
    }
}

/**
 * Sauvegarde la liste des entrepreneurs sur le SERVEUR
 */
async function saveEntrepreneursList() {
    try {
        const success = await saveToStorage('t55EntrepreneursList', devisState.entrepreneursList);
        if (success) {
            console.log('[DEVIS] Liste entrepreneurs sauvegardée sur le serveur');
        } else {
            console.error('[DEVIS] Erreur sauvegarde liste entrepreneurs sur le serveur');
        }
    } catch (error) {
        console.error('[DEVIS] Erreur sauvegarde liste entrepreneurs:', error);
    }
}

/**
 * Affiche la liste des entrepreneurs pour saisie de données
 */
export function showEntrepreneursDataList() {
    console.log('[DEVIS] Affichage liste entrepreneurs pour saisie');

    if (devisState.entrepreneursList.length === 0) {
        alert('Aucun entrepreneur trouvé. Veuillez d\'abord charger les données IW37N.');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'entrepreneurs-data-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 1000px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #333; font-size: 24px;">📝 Saisie des Données par Entrepreneur</h2>
            <button onclick="window.devisManager.closeEntrepreneursDataList()"
                style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                ✕ Fermer
            </button>
        </div>

        <p style="color: #666; margin-bottom: 20px;">
            Cliquez sur un entrepreneur pour saisir les informations du devis (dessins, travaux mécaniques, dates clés, etc.)
        </p>

        <div id="entrepreneurs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
            ${devisState.entrepreneursList.map((entrepreneur, idx) => {
                const hasData = devisState.entrepreneursData[entrepreneur];
                const safeId = `entr-${idx}`;
                const codeName = getCodeExterneName(entrepreneur);
                const displayName = codeName ? `${entrepreneur}<br><small style="color: #666; font-size: 14px;">${codeName}</small>` : entrepreneur;
                return `
                    <div style="background: ${hasData ? '#e8f5e9' : '#f8f9fa'}; padding: 20px; border-radius: 10px; border: 2px solid ${hasData ? '#4caf50' : '#ddd'};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #333; font-size: 18px; word-break: break-word; line-height: 1.4;">${displayName}</h3>
                            ${hasData ? '<span style="color: #4caf50; font-size: 24px;">✓</span>' : ''}
                        </div>
                        <div style="display: flex; gap: 8px; flex-direction: column;">
                            <button data-entrepreneur="${entrepreneur}" data-action="edit" class="entr-edit-btn"
                                style="width: 100%; padding: 10px; background: linear-gradient(145deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                ${hasData ? '✏️ Modifier' : '➕ Saisir'}
                            </button>
                            ${hasData ? `
                                <button data-entrepreneur="${entrepreneur}" data-action="view" class="entr-view-btn"
                                    style="width: 100%; padding: 10px; background: linear-gradient(145deg, #28a745, #20c997); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    👁️ Consulter
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    // Ajouter les event listeners pour les boutons
    document.querySelectorAll('.entr-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const entrepreneur = this.getAttribute('data-entrepreneur');
            editEntrepreneurData(entrepreneur);
        });
    });

    document.querySelectorAll('.entr-view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const entrepreneur = this.getAttribute('data-entrepreneur');
            viewEntrepreneurDevis(entrepreneur);
        });
    });

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEntrepreneursDataList();
        }
    });
}

/**
 * Affiche le devis d'un entrepreneur en mode consultation
 */
export function viewEntrepreneurDevis(entrepreneur) {
    console.log('[DEVIS] Consultation devis pour:', entrepreneur);

    const data = devisState.entrepreneursData[entrepreneur];
    if (!data) {
        alert('Aucun devis trouvé pour cet entrepreneur.');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'view-entrepreneur-devis-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 1400px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #333; font-size: 24px;">📄 Devis - ${entrepreneur}</h2>
            <div style="display: flex; gap: 10px;">
                <button id="view-devis-edit-btn" data-entrepreneur="${entrepreneur}"
                    style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    ✏️ Modifier
                </button>
                <button id="view-devis-close-btn"
                    style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    ✕ Fermer
                </button>
            </div>
        </div>

        <!-- Tableau 1: Dessins -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">Tableau des Dessins</h3>
            ${data.tableauDessins && data.tableauDessins.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <thead>
                            <tr style="background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Numéro de dessin</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Révision</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Titre</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.tableauDessins.map((row, idx) => `
                                <tr style="background: ${idx % 2 === 0 ? 'white' : '#f8f9fa'};">
                                    <td style="padding: 10px; border: 1px solid #ddd;">${row.numeroDessin || '-'}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${row.revision || '-'}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${row.titre || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p style="color: #999; text-align: center; padding: 20px;">Aucun dessin enregistré.</p>'}
        </div>

        <!-- Tableau 2: Travaux - Convertisseur -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #667eea;">Tableau des Travaux</h3>

            <!-- Section Convertisseur -->
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #333; background: #e3f2fd; padding: 10px; border-radius: 6px;">Convertisseur</h4>
                ${data.tableauTravaux?.convertisseur && data.tableauTravaux.convertisseur.length > 0 ? `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #e3f2fd;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;"># Item</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Équipement</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;"># Ordre</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description des travaux</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Matériel RTFT</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Matériel Entr.</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dessins/réf.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.tableauTravaux.convertisseur.map((row, idx) => `
                                    <tr style="background: ${idx % 2 === 0 ? 'white' : '#f8f9fa'};">
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.item || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.equipement || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.ordre || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${row.description || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${row.materielRTFT || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${row.materielEntrepreneur || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.dessinsRef || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p style="color: #999; text-align: center; padding: 15px;">Aucune ligne pour le convertisseur.</p>'}
            </div>

            <!-- Section Coulée Continue -->
            <div style="background: white; padding: 15px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #333; background: #fff3e0; padding: 10px; border-radius: 6px;">Coulée Continue</h4>
                ${data.tableauTravaux?.couleeContinue && data.tableauTravaux.couleeContinue.length > 0 ? `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #fff3e0;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;"># Item</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Équipement</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;"># Ordre</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description des travaux</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Matériel RTFT</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Matériel Entr.</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dessins/réf.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.tableauTravaux.couleeContinue.map((row, idx) => `
                                    <tr style="background: ${idx % 2 === 0 ? 'white' : '#f8f9fa'};">
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.item || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.equipement || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.ordre || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${row.description || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${row.materielRTFT || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${row.materielEntrepreneur || '-'}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${row.dessinsRef || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p style="color: #999; text-align: center; padding: 15px;">Aucune ligne pour la coulée continue.</p>'}
            </div>
        </div>

        <!-- Informations de mise à jour -->
        ${data.lastUpdated ? `
            <div style="text-align: right; color: #666; font-size: 12px; margin-top: 20px;">
                Dernière mise à jour: ${new Date(data.lastUpdated).toLocaleString('fr-CA')}
            </div>
        ` : ''}
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    // Ajouter les event listeners
    document.getElementById('view-devis-edit-btn').addEventListener('click', function() {
        const entr = this.getAttribute('data-entrepreneur');
        closeViewEntrepreneurDevis();
        editEntrepreneurData(entr);
    });

    document.getElementById('view-devis-close-btn').addEventListener('click', function() {
        closeViewEntrepreneurDevis();
    });

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeViewEntrepreneurDevis();
        }
    });
}

/**
 * Ferme la vue de consultation du devis
 */
export function closeViewEntrepreneurDevis() {
    const modal = document.getElementById('view-entrepreneur-devis-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Ferme la liste des entrepreneurs
 */
export function closeEntrepreneursDataList() {
    const modal = document.getElementById('entrepreneurs-data-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Affiche le formulaire de saisie pour un entrepreneur
 */
export function editEntrepreneurData(entrepreneur) {
    console.log('[DEVIS] Édition données pour:', entrepreneur);

    // Charger les données existantes
    const existingData = devisState.entrepreneursData[entrepreneur] || {
        dessins: '',
        tableauPoint6: '',
        travauxMecaniques: '',
        datesCles: '',
        tableauDessins: [],
        tableauTravaux: {
            convertisseur: [],
            couleeContinue: []
        }
    };

    const modal = document.createElement('div');
    modal.id = 'entrepreneur-form-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;

    const formContainer = document.createElement('div');
    formContainer.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 1200px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    formContainer.innerHTML = `
        <h2 style="margin: 0 0 25px 0; color: #333; font-size: 24px;">
            📝 Devis - ${entrepreneur}
        </h2>

        <form id="entrepreneur-data-form">
            <!-- TABLEAU 1: Dessins -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #667eea;">Tableau des Dessins</h3>
                    <button type="button" onclick="window.devisManager.addDessinRow()"
                        style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        ➕ Ajouter un dessin
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table id="tableauDessins" style="width: 100%; border-collapse: collapse; background: white;">
                        <thead>
                            <tr style="background: linear-gradient(145deg, #667eea, #764ba2); color: white;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd; min-width: 150px;">Numéro de dessin</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd; min-width: 100px;">Révision</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd; min-width: 250px;">Titre</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd; width: 80px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyDessins">
                            ${existingData.tableauDessins && existingData.tableauDessins.length > 0
                                ? existingData.tableauDessins.map((row, idx) => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #ddd;">
                                            <input type="text" value="${row.numeroDessin || ''}"
                                                class="dessin-numero"
                                                style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                                        </td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">
                                            <input type="text" value="${row.revision || ''}"
                                                class="dessin-revision"
                                                style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                                        </td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">
                                            <input type="text" value="${row.titre || ''}"
                                                class="dessin-titre"
                                                style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                                        </td>
                                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                                            <button type="button" onclick="window.devisManager.deleteDessinRow(this)"
                                                style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')
                                : '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #999;">Aucun dessin. Cliquez sur "Ajouter un dessin".</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TABLEAU 2: Travaux -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #667eea;">Tableau des Travaux</h3>

                <!-- Section Convertisseur -->
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #333;">Convertisseur</h4>
                        <div style="display: flex; gap: 10px;">
                            <button type="button" onclick="window.devisManager.importFromIW37N('convertisseur', '${entrepreneur}')"
                                style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                📥 Importer depuis IW37N
                            </button>
                            <button type="button" onclick="window.devisManager.addTravauxRow('convertisseur')"
                                style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                ➕ Ajouter
                            </button>
                        </div>
                    </div>
                    <!-- Indicateur de chargement -->
                    <div id="loading-convertisseur" style="display: none; padding: 15px; text-align: center; background: #e3f2fd; border-radius: 6px; margin-bottom: 10px;">
                        <div style="display: inline-block;">
                            <div style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <p style="margin: 10px 0 0 0; color: #667eea; font-weight: 600;">Chargement des données...</p>
                        </div>
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="tableauConvertisseur" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #e3f2fd;">
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 60px;"># Item</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Équipement</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 80px;"># Ordre</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 200px;">Description des travaux</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Matériel RTFT</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Matériel Entr.</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Dessins/réf.</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd; width: 70px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="tbodyConvertisseur">
                                ${existingData.tableauTravaux?.convertisseur && existingData.tableauTravaux.convertisseur.length > 0
                                    ? existingData.tableauTravaux.convertisseur.map(row => `
                                        <tr>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.item || ''}" class="conv-item" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.equipement || ''}" class="conv-equipement" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.ordre || ''}" class="conv-ordre" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <textarea class="conv-description" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.description || ''}</textarea>
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <textarea class="conv-materielRTFT" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.materielRTFT || ''}</textarea>
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <textarea class="conv-materielEntr" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.materielEntrepreneur || ''}</textarea>
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.dessinsRef || ''}" class="conv-dessinsRef" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">
                                                <button type="button" onclick="window.devisManager.deleteTravauxRow(this, 'convertisseur')"
                                                    style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')
                                    : '<tr><td colspan="8" style="padding: 15px; text-align: center; color: #999;">Aucune ligne. Cliquez sur "Ajouter".</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Section Coulée Continue -->
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #333;">Coulée Continue</h4>
                        <div style="display: flex; gap: 10px;">
                            <button type="button" onclick="window.devisManager.importFromIW37N('couleeContinue', '${entrepreneur}')"
                                style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                📥 Importer depuis IW37N
                            </button>
                            <button type="button" onclick="window.devisManager.addTravauxRow('couleeContinue')"
                                style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                ➕ Ajouter
                            </button>
                        </div>
                    </div>
                    <!-- Indicateur de chargement -->
                    <div id="loading-couleeContinue" style="display: none; padding: 15px; text-align: center; background: #fff3e0; border-radius: 6px; margin-bottom: 10px;">
                        <div style="display: inline-block;">
                            <div style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #ff9800; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <p style="margin: 10px 0 0 0; color: #ff9800; font-weight: 600;">Chargement des données...</p>
                        </div>
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="tableauCouleeContinue" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #fff3e0;">
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 60px;"># Item</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Équipement</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 80px;"># Ordre</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 200px;">Description des travaux</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Matériel RTFT</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Matériel Entr.</th>
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Dessins/réf.</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd; width: 70px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="tbodyCouleeContinue">
                                ${existingData.tableauTravaux?.couleeContinue && existingData.tableauTravaux.couleeContinue.length > 0
                                    ? existingData.tableauTravaux.couleeContinue.map(row => `
                                        <tr>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.item || ''}" class="cc-item" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.equipement || ''}" class="cc-equipement" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.ordre || ''}" class="cc-ordre" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <textarea class="cc-description" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.description || ''}</textarea>
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <textarea class="cc-materielRTFT" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.materielRTFT || ''}</textarea>
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <textarea class="cc-materielEntr" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.materielEntrepreneur || ''}</textarea>
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd;">
                                                <input type="text" value="${row.dessinsRef || ''}" class="cc-dessinsRef" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">
                                                <button type="button" onclick="window.devisManager.deleteTravauxRow(this, 'couleeContinue')"
                                                    style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')
                                    : '<tr><td colspan="8" style="padding: 15px; text-align: center; color: #999;">Aucune ligne. Cliquez sur "Ajouter".</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Boutons -->
            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                <button type="button" onclick="window.devisManager.closeEntrepreneurForm()"
                    style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    Annuler
                </button>
                <button type="submit"
                    style="padding: 12px 30px; background: linear-gradient(145deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    💾 Sauvegarder
                </button>
            </div>
        </form>
    `;

    modal.appendChild(formContainer);
    document.body.appendChild(modal);

    // Ajouter l'animation CSS pour le spinner
    if (!document.getElementById('spinner-animation-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-animation-style';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Gérer la soumission du formulaire
    const form = document.getElementById('entrepreneur-data-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEntrepreneurDataNew(entrepreneur);
    });

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEntrepreneurForm();
        }
    });
}

/**
 * Ajoute une ligne dans le tableau des dessins
 */
export function addDessinRow() {
    const tbody = document.getElementById('tbodyDessins');
    if (!tbody) return;

    // Supprimer le message "Aucun dessin" s'il existe
    const emptyRow = tbody.querySelector('td[colspan="4"]');
    if (emptyRow) {
        emptyRow.parentElement.remove();
    }

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd;">
            <input type="text" value="" class="dessin-numero"
                style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">
            <input type="text" value="" class="dessin-revision"
                style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">
            <input type="text" value="" class="dessin-titre"
                style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            <button type="button" onclick="window.devisManager.deleteDessinRow(this)"
                style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🗑️
            </button>
        </td>
    `;
    tbody.appendChild(newRow);
}

/**
 * Supprime une ligne du tableau des dessins
 */
export function deleteDessinRow(button) {
    const row = button.closest('tr');
    const tbody = row.parentElement;
    row.remove();

    // Si plus de lignes, afficher le message "Aucun dessin"
    if (tbody.children.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #999;">Aucun dessin. Cliquez sur "Ajouter un dessin".</td></tr>';
    }
}

/**
 * Ajoute une ligne dans le tableau des travaux
 */
export function addTravauxRow(section) {
    const tbodyId = section === 'convertisseur' ? 'tbodyConvertisseur' : 'tbodyCouleeContinue';
    const prefix = section === 'convertisseur' ? 'conv' : 'cc';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    // Supprimer le message "Aucune ligne" s'il existe
    const emptyRow = tbody.querySelector('td[colspan="8"]');
    if (emptyRow) {
        emptyRow.parentElement.remove();
    }

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td style="padding: 6px; border: 1px solid #ddd;">
            <input type="text" value="" class="${prefix}-item" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
        <td style="padding: 6px; border: 1px solid #ddd;">
            <input type="text" value="" class="${prefix}-equipement" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
        <td style="padding: 6px; border: 1px solid #ddd;">
            <input type="text" value="" class="${prefix}-ordre" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
        <td style="padding: 6px; border: 1px solid #ddd;">
            <textarea class="${prefix}-description" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
        </td>
        <td style="padding: 6px; border: 1px solid #ddd;">
            <textarea class="${prefix}-materielRTFT" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
        </td>
        <td style="padding: 6px; border: 1px solid #ddd;">
            <textarea class="${prefix}-materielEntr" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
        </td>
        <td style="padding: 6px; border: 1px solid #ddd;">
            <input type="text" value="" class="${prefix}-dessinsRef" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">
            <button type="button" onclick="window.devisManager.deleteTravauxRow(this, '${section}')"
                style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                🗑️
            </button>
        </td>
    `;
    tbody.appendChild(newRow);
}

/**
 * Supprime une ligne du tableau des travaux
 */
export function deleteTravauxRow(button, section) {
    const row = button.closest('tr');
    const tbody = row.parentElement;
    row.remove();

    // Si plus de lignes, afficher le message "Aucune ligne"
    if (tbody.children.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="padding: 15px; text-align: center; color: #999;">Aucune ligne. Cliquez sur "Ajouter".</td></tr>';
    }
}

/**
 * Sauvegarde les données d'un entrepreneur avec les nouveaux tableaux
 */
function saveEntrepreneurDataNew(entrepreneur) {
    // Récupérer les données du tableau des dessins
    const tableauDessins = [];
    const dessinRows = document.querySelectorAll('#tbodyDessins tr');
    dessinRows.forEach(row => {
        const numeroInput = row.querySelector('.dessin-numero');
        const revisionInput = row.querySelector('.dessin-revision');
        const titreInput = row.querySelector('.dessin-titre');

        if (numeroInput && revisionInput && titreInput) {
            tableauDessins.push({
                numeroDessin: numeroInput.value.trim(),
                revision: revisionInput.value.trim(),
                titre: titreInput.value.trim()
            });
        }
    });

    // Récupérer les données du tableau des travaux - Convertisseur
    const travauxConvertisseur = [];
    const convRows = document.querySelectorAll('#tbodyConvertisseur tr');
    convRows.forEach(row => {
        const itemInput = row.querySelector('.conv-item');
        if (itemInput) {
            travauxConvertisseur.push({
                item: itemInput.value.trim(),
                equipement: row.querySelector('.conv-equipement')?.value.trim() || '',
                ordre: row.querySelector('.conv-ordre')?.value.trim() || '',
                description: row.querySelector('.conv-description')?.value.trim() || '',
                materielRTFT: row.querySelector('.conv-materielRTFT')?.value.trim() || '',
                materielEntrepreneur: row.querySelector('.conv-materielEntr')?.value.trim() || '',
                dessinsRef: row.querySelector('.conv-dessinsRef')?.value.trim() || ''
            });
        }
    });

    // Récupérer les données du tableau des travaux - Coulée Continue
    const travauxCouleeContinue = [];
    const ccRows = document.querySelectorAll('#tbodyCouleeContinue tr');
    ccRows.forEach(row => {
        const itemInput = row.querySelector('.cc-item');
        if (itemInput) {
            travauxCouleeContinue.push({
                item: itemInput.value.trim(),
                equipement: row.querySelector('.cc-equipement')?.value.trim() || '',
                ordre: row.querySelector('.cc-ordre')?.value.trim() || '',
                description: row.querySelector('.cc-description')?.value.trim() || '',
                materielRTFT: row.querySelector('.cc-materielRTFT')?.value.trim() || '',
                materielEntrepreneur: row.querySelector('.cc-materielEntr')?.value.trim() || '',
                dessinsRef: row.querySelector('.cc-dessinsRef')?.value.trim() || ''
            });
        }
    });

    // Sauvegarder les données
    devisState.entrepreneursData[entrepreneur] = {
        tableauDessins: tableauDessins,
        tableauTravaux: {
            convertisseur: travauxConvertisseur,
            couleeContinue: travauxCouleeContinue
        },
        lastUpdated: new Date().toISOString()
    };

    saveEntrepreneursData();
    closeEntrepreneurForm();

    // Rafraîchir la liste
    closeEntrepreneursDataList();
    showEntrepreneursDataList();

    alert(`✅ Devis sauvegardé pour ${entrepreneur}`);
}

/**
 * Ferme le formulaire entrepreneur
 */
export function closeEntrepreneurForm() {
    const modal = document.getElementById('entrepreneur-form-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Sauvegarde les données d'un entrepreneur
 */
function saveEntrepreneurData(entrepreneur, formData) {
    devisState.entrepreneursData[entrepreneur] = {
        dessins: formData.get('dessins'),
        tableauPoint6: formData.get('tableauPoint6'),
        travauxMecaniques: formData.get('travauxMecaniques'),
        datesCles: formData.get('datesCles'),
        lastUpdated: new Date().toISOString()
    };

    saveEntrepreneursData();
    closeEntrepreneurForm();

    // Rafraîchir la liste
    closeEntrepreneursDataList();
    showEntrepreneursDataList();

    alert(`✅ Données sauvegardées pour ${entrepreneur}`);
}

/**
 * Charge les données de l'historique depuis le SERVEUR
 */
async function loadHistoriqueData() {
    try {
        const saved = await loadFromStorage('t55PdfTemplate');
        if (saved && Array.isArray(saved)) {
            return saved;
        } else {
            console.log('[DEVIS] Aucun historique sur le serveur');
            return [];
        }
    } catch (error) {
        console.error('[DEVIS] Erreur chargement historique depuis le serveur:', error);
        return [];
    }
}

/**
 * Sauvegarde les données de l'historique sur le SERVEUR
 */
async function saveHistoriqueData(historique) {
    try {
        const success = await saveToStorage('t55PdfTemplate', historique);
        if (success) {
            console.log('[DEVIS] Historique sauvegardé sur le serveur');
        } else {
            console.error('[DEVIS] Erreur sauvegarde historique sur le serveur');
        }
    } catch (error) {
        console.error('[DEVIS] Erreur sauvegarde historique:', error);
    }
}

/**
 * Ajoute une nouvelle entrée à l'historique
 */
export function addHistoriqueEntry() {
    showHistoriqueEntryForm();
}

/**
 * Modifie une entrée de l'historique
 */
export async function editHistoriqueEntry(index) {
    const historique = await loadHistoriqueData();
    const entry = historique[index];
    if (entry) {
        showHistoriqueEntryForm(entry, index);
    }
}

/**
 * Supprime une entrée de l'historique
 */
export async function deleteHistoriqueEntry(index) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
        return;
    }

    const historique = await loadHistoriqueData();
    historique.splice(index, 1);
    await saveHistoriqueData(historique);

    // Rafraîchir l'affichage
    closeHistorique();
    showHistorique();
}

/**
 * Affiche le formulaire de saisie/modification d'une entrée historique
 */
function showHistoriqueEntryForm(entry = null, index = null) {
    const isEdit = entry !== null;

    const modal = document.createElement('div');
    modal.id = 'historique-entry-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const formContainer = document.createElement('div');
    formContainer.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    const occValue = entry ? (entry.occ || '') : '';
    const revisionValue = entry ? (entry.revision || '') : '';
    const itemValue = entry ? (entry.item || '') : '';
    const equipementValue = entry ? (entry.equipement || '') : '';
    const ordreValue = entry ? (entry.ordre || '') : '';
    const descriptionValue = entry ? (entry.description || '') : '';
    const materielRTFTValue = entry ? (entry.materielRTFT || '') : '';
    const materielEntrepreneurValue = entry ? (entry.materielEntrepreneur || '') : '';
    const dessinsRefValue = entry ? (entry.dessinsRef || '') : '';
    const gammesValue = entry ? (entry.gammes || '') : '';
    const cptrGrpGamValue = entry ? (entry.cptrGrpGam || '') : '';

    formContainer.innerHTML = `
        <h2 style="margin: 0 0 25px 0; color: #333; font-size: 24px;">
            ${isEdit ? '✏️ Modifier' : '➕ Ajouter'} une entrée
        </h2>

        <form id="historique-entry-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Occ.:</label>
                    <input type="text" name="occ" value="${occValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Révison:</label>
                    <input type="text" name="revision" value="${revisionValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Item:</label>
                    <input type="text" name="item" value="${itemValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Equipement:</label>
                    <input type="text" name="equipement" value="${equipementValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Ordre:</label>
                    <input type="text" name="ordre" value="${ordreValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Description des travaux:</label>
                <textarea name="description" rows="3"
                    style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;">${descriptionValue}</textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Matériel fournis par RTFT:</label>
                    <textarea name="materielRTFT" rows="2"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;">${materielRTFTValue}</textarea>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Matériel fournis par Entrepreneur:</label>
                    <textarea name="materielEntrepreneur" rows="2"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;">${materielEntrepreneurValue}</textarea>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Dessins - Références:</label>
                    <input type="text" name="dessinsRef" value="${dessinsRefValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Gammes:</label>
                    <input type="text" name="gammes" value="${gammesValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">CptrGrpGam:</label>
                    <input type="text" name="cptrGrpGam" value="${cptrGrpGamValue}"
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                </div>
            </div>

            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                <button type="button" onclick="window.devisManager.closeHistoriqueEntryForm()"
                    style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    Annuler
                </button>
                <button type="submit"
                    style="padding: 12px 30px; background: linear-gradient(145deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    💾 Sauvegarder
                </button>
            </div>
        </form>
    `;

    modal.appendChild(formContainer);
    document.body.appendChild(modal);

    // Gérer la soumission du formulaire
    const form = document.getElementById('historique-entry-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveHistoriqueEntry(new FormData(form), index);
    });

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeHistoriqueEntryForm();
        }
    });
}

/**
 * Ferme le formulaire d'entrée historique
 */
export function closeHistoriqueEntryForm() {
    const modal = document.getElementById('historique-entry-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Sauvegarde une entrée historique
 */
async function saveHistoriqueEntry(formData, index) {
    const newEntry = {
        occ: formData.get('occ'),
        revision: formData.get('revision'),
        item: formData.get('item'),
        equipement: formData.get('equipement'),
        ordre: formData.get('ordre'),
        description: formData.get('description'),
        materielRTFT: formData.get('materielRTFT'),
        materielEntrepreneur: formData.get('materielEntrepreneur'),
        dessinsRef: formData.get('dessinsRef'),
        gammes: formData.get('gammes'),
        cptrGrpGam: formData.get('cptrGrpGam'),
        lastUpdated: new Date().toISOString()
    };

    const historique = await loadHistoriqueData();

    if (index !== null) {
        // Modification
        historique[index] = newEntry;
    } else {
        // Ajout
        historique.push(newEntry);
    }

    await saveHistoriqueData(historique);
    closeHistoriqueEntryForm();

    // Rafraîchir l'affichage
    closeHistorique();
    showHistorique();
}

/**
 * Injecte les données T55 depuis le serveur
 * Appelé par server-sync.js lors de la synchronisation
 * @param {Array} data - Données des devis
 */
export function setT55Data(data) {
    if (data && Array.isArray(data)) {
        devisState.devisSauvegardes = data;
        console.log('[DEVIS] Données T55 injectées depuis le serveur:', data.length, 'devis');
    } else {
        devisState.devisSauvegardes = [];
        console.log('[DEVIS] Aucune donnée T55 reçue du serveur');
    }
}

/**
 * Injecte la liste des entrepreneurs depuis le serveur
 * Appelé par server-sync.js lors de la synchronisation
 * @param {Array} data - Liste des entrepreneurs
 */
export function setT55EntrepreneursList(data) {
    if (data && Array.isArray(data) && data.length > 0) {
        devisState.entrepreneursList = data;
        console.log('[DEVIS] Liste entrepreneurs injectée depuis le serveur:', data.length, 'entrepreneurs');

        // Initialiser tous les entrepreneurs comme sélectionnés dans les filtres
        devisState.entrepreneursFilters.clear();
        devisState.entrepreneursList.forEach(e => devisState.entrepreneursFilters.add(e));

        // Mettre à jour l'affichage si les filtres sont visibles
        updateEntrepreneurFilters();
    } else {
        console.log('[DEVIS] Aucune liste entrepreneurs reçue du serveur');
    }
}

/**
 * Injecte les données des entrepreneurs depuis le serveur
 * Appelé par server-sync.js lors de la synchronisation
 * @param {Object} data - Données des entrepreneurs (object avec clés = codes entrepreneurs)
 */
export function setT55EntrepreneursData(data) {
    if (data && typeof data === 'object') {
        devisState.entrepreneursData = data;
        console.log('[DEVIS] Données entrepreneurs injectées depuis le serveur:', Object.keys(data).length, 'entrepreneurs');
    } else {
        devisState.entrepreneursData = {};
        console.log('[DEVIS] Aucune donnée entrepreneurs reçue du serveur');
    }
}

/**
 * Importe les données depuis IW37N et remplit le tableau avec correspondance historique
 * @param {string} section - 'convertisseur' ou 'couleeContinue'
 * @param {string} entrepreneur - Nom de l'entrepreneur
 */
export async function importFromIW37N(section, entrepreneur) {
    console.log(`[DEVIS] Import depuis IW37N pour ${section} - ${entrepreneur}`);

    // Afficher l'indicateur de chargement
    const loadingDiv = document.getElementById(`loading-${section}`);
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
    }

    try {
        // 1. Charger les données IW37N
        const iw37nData = getIw37nData();
        if (!iw37nData || iw37nData.length === 0) {
            alert('❌ Aucune donnée IW37N disponible. Veuillez d\'abord importer les données IW37N.');
            return;
        }

        // Diagnostic: Afficher la structure de IW37N
        if (iw37nData.length > 0) {
            console.log('[DEVIS] 🔍 Structure complète de la première entrée IW37N:');
            console.log(JSON.stringify(iw37nData[0], null, 2));
            console.log('[DEVIS] 🔍 Clés disponibles dans IW37N:', Object.keys(iw37nData[0]));
        }

        // 2. Charger l'historique depuis le module t55-historique (PAGE "T55 - Historique")
        console.log('[DEVIS] 📂 Chargement des données depuis la page "T55 - Historique"...');
        console.log('[DEVIS] ⚠️ ATTENTION: Ce N\'EST PAS le tableau "Historique des Devis et Corrections" en bas de cette page!');
        console.log('[DEVIS] ⚠️ C\'est le tableau sur la page séparée "T55 - Historique" (clé: t55HistoriqueData)');

        const { getHistoriqueData } = await import('../data/t55-historique.js');
        const historiqueData = await getHistoriqueData();
        console.log(`[DEVIS] ✅ Historique chargé depuis T55-Historique: ${historiqueData.length} entrées`);

        if (historiqueData.length === 0) {
            alert('⚠️ ATTENTION: L\'historique T55 est vide!\n\n' +
                'Pour utiliser cette fonction, vous devez d\'abord:\n\n' +
                '1. Aller sur la page "T55 - Historique" (dans le menu de navigation)\n' +
                '2. Cliquer sur "📤 Upload Excel"\n' +
                '3. Importer votre fichier Excel avec les données historiques\n\n' +
                'Note: Ce n\'est PAS le tableau "Historique des Devis et Corrections" en bas de cette page!\n' +
                'C\'est la page séparée "T55 - Historique".');
            return;
        }

        // Afficher TOUS les numéros de gammes disponibles dans l'historique
        const allGammes = historiqueData.map(h => h.gammes || '(vide)').filter(g => g !== '(vide)');
        console.log('[DEVIS] 📋 TOUS les numéros de gammes dans l\'historique (' + allGammes.length + ' total):');
        console.log(allGammes);

        // Vérification spécifique pour la gamme 180167
        const has180167 = historiqueData.some(h => h.gammes === '180167' || h.gammes === 180167);
        console.log('[DEVIS] ✅ La gamme 180167 existe dans l\'historique?', has180167);
        if (has180167) {
            const match180167 = historiqueData.find(h => h.gammes === '180167' || h.gammes === 180167);
            console.log('[DEVIS] 🎯 Données pour la gamme 180167:', match180167);
        }

        // Diagnostic: Afficher la structure complète de la première entrée
        if (historiqueData.length > 0) {
            console.log('[DEVIS] 🔍 Structure complète de la première entrée d\'historique:');
            console.log(JSON.stringify(historiqueData[0], null, 2));
            console.log('[DEVIS] 🔍 Clés disponibles:', Object.keys(historiqueData[0]));
        }

        // 3. Filtrer les données IW37N par entrepreneur (via Fournisseur)
        const entrepreneurData = iw37nData.filter(row => {
            const fournisseur = row['Fournisseur'] || '';
            return fournisseur.toLowerCase().includes(entrepreneur.toLowerCase());
        });

        console.log(`[DEVIS] ${entrepreneurData.length} lignes trouvées pour l'entrepreneur ${entrepreneur}`);

        // 4. Pour chaque ligne, chercher la correspondance dans l'historique
        const newRows = [];
        let itemCounter = 1;
        let matchCount = 0;

        console.log('[DEVIS] 🔍 Début du matching des gammes...');
        console.log(`[DEVIS] Total IW37N pour cet entrepreneur: ${entrepreneurData.length} lignes`);
        console.log(`[DEVIS] Total Historique: ${historiqueData.length} lignes`);

        for (const iw37nRow of entrepreneurData) {
            const grpeGammes = iw37nRow['Grpe de gammes'] || iw37nRow['Groupe de gammes'] || '';
            const ordre = iw37nRow['Ordre'] || '';
            const designation = iw37nRow['Désignation'] || '';

            console.log(`[DEVIS] ─────────────────────────────────────────────────`);
            console.log(`[DEVIS] 📋 Traitement ligne IW37N:`);
            console.log(`[DEVIS]    Ordre: ${ordre}`);
            console.log(`[DEVIS]    Désignation: ${designation}`);
            console.log(`[DEVIS]    Grpe de gammes: "${grpeGammes}"`);

            if (!grpeGammes) {
                console.warn('[DEVIS] ⚠️ Ligne sans "Grpe de gammes", ignorée');
                continue;
            }

            // Test spécifique pour l'exemple 180167
            if (grpeGammes === '180167') {
                console.log('[DEVIS] 🎯 EXEMPLE TEST: Gamme 180167 détectée!');
                console.log('[DEVIS] Recherche dans l\'historique...');
                historiqueData.forEach((hist, idx) => {
                    if (idx < 10 || hist.gammes === '180167') {
                        console.log(`[DEVIS]   Historique ligne ${idx}: gammes="${hist.gammes}" (${typeof hist.gammes})`);
                        if (hist.gammes === '180167') {
                            console.log(`[DEVIS]   🎯 CORRESPONDANCE TROUVÉE! Ligne ${idx}:`, hist);
                        }
                    }
                });
            }

            // Chercher dans l'historique si ce numéro existe dans la colonne "Gammes"
            // Supporter les gammes au format string ET numérique
            const historiqueMatch = historiqueData.find(hist => {
                const histGammes = hist.gammes || '';
                const histGammesStr = histGammes.toString().trim();
                const grpeGammesStr = grpeGammes.toString().trim();

                // Essayer correspondance exacte (string)
                if (histGammesStr === grpeGammesStr) {
                    console.log(`[DEVIS]    ✅ Match trouvé! (string) "${histGammesStr}" === "${grpeGammesStr}"`);
                    return true;
                }

                // Essayer correspondance numérique
                if (parseInt(histGammesStr) === parseInt(grpeGammesStr)) {
                    console.log(`[DEVIS]    ✅ Match trouvé! (number) ${parseInt(histGammesStr)} === ${parseInt(grpeGammesStr)}`);
                    return true;
                }

                return false;
            });

            // Log du résultat du matching
            if (!historiqueMatch) {
                console.log(`[DEVIS]    ❌ AUCUN MATCH trouvé pour "${grpeGammes}"`);
            }

            // Créer la nouvelle ligne avec les données
            const newRow = {
                item: itemCounter.toString(),
                equipement: historiqueMatch ? (historiqueMatch.equipement || '') : '',
                ordre: iw37nRow['Ordre'] || '',
                description: historiqueMatch ? (historiqueMatch.descriptionTravaux || iw37nRow['Désignation'] || '') : (iw37nRow['Désignation'] || ''),
                materielRTFT: historiqueMatch ? (historiqueMatch.materielRTFT || '') : '',
                materielEntrepreneur: historiqueMatch ? (historiqueMatch.materielEntrepreneur || '') : '',
                dessinsRef: historiqueMatch ? (historiqueMatch.dessinsReferences || '') : ''
            };

            newRows.push(newRow);
            itemCounter++;

            if (historiqueMatch) {
                matchCount++;
                console.log(`[DEVIS] 📦 Données récupérées de l'historique:`);
                console.log(`[DEVIS]    - Équipement: "${historiqueMatch.equipement || '(vide)'}"`);
                console.log(`[DEVIS]    - Description: "${historiqueMatch.descriptionTravaux || '(vide)'}"`);
                console.log(`[DEVIS]    - Matériel RTFT: "${historiqueMatch.materielRTFT || '(vide)'}"`);
                console.log(`[DEVIS]    - Matériel Entrepreneur: "${historiqueMatch.materielEntrepreneur || '(vide)'}"`);
                console.log(`[DEVIS]    - Dessins/Réf: "${historiqueMatch.dessinsReferences || '(vide)'}"`);
            } else {
                console.log(`[DEVIS] ⚠️ Aucune correspondance dans l'historique`);
                console.log(`[DEVIS]    - Utilisation de la Désignation IW37N: "${iw37nRow['Désignation'] || '(vide)'}"`);
            }
        }

        // 5. Remplir le tableau
        const tbodyId = section === 'convertisseur' ? 'tbodyConvertisseur' : 'tbodyCouleeContinue';
        const prefix = section === 'convertisseur' ? 'conv' : 'cc';
        const tbody = document.getElementById(tbodyId);

        if (!tbody) {
            console.error(`[DEVIS] Tbody ${tbodyId} introuvable`);
            alert('❌ Erreur: Tableau introuvable');
            return;
        }

        // Supprimer les lignes existantes
        tbody.innerHTML = '';

        if (newRows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding: 15px; text-align: center; color: #999;">Aucune donnée trouvée pour cet entrepreneur.</td></tr>';
            alert(`ℹ️ Aucune donnée trouvée pour l'entrepreneur "${entrepreneur}"`);
            return;
        }

        // Ajouter les nouvelles lignes
        newRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 6px; border: 1px solid #ddd;">
                    <input type="text" value="${row.item}" class="${prefix}-item" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">
                    <input type="text" value="${row.equipement}" class="${prefix}-equipement" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">
                    <input type="text" value="${row.ordre}" class="${prefix}-ordre" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">
                    <textarea class="${prefix}-description" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.description}</textarea>
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">
                    <textarea class="${prefix}-materielRTFT" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.materielRTFT}</textarea>
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">
                    <textarea class="${prefix}-materielEntr" rows="2" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${row.materielEntrepreneur}</textarea>
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">
                    <input type="text" value="${row.dessinsRef}" class="${prefix}-dessinsRef" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">
                    <button type="button" onclick="window.devisManager.deleteTravauxRow(this, '${section}')"
                        style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const summaryMessage = `✅ ${newRows.length} ligne(s) importée(s) depuis IW37N\n\n` +
            `📊 Résumé:\n` +
            `- ${matchCount} correspondance(s) trouvée(s) dans l'historique\n` +
            `- ${newRows.length - matchCount} ligne(s) sans correspondance\n\n` +
            (matchCount > 0
                ? `Les colonnes suivantes ont été remplies depuis l'historique:\n✓ Équipement\n✓ Description des travaux\n✓ Matériel fourni par RTFT\n✓ Matériel fourni par Entrepreneur\n✓ Dessins/Références`
                : `⚠️ Aucune correspondance trouvée.\nVérifiez que l'historique contient des données avec les bons numéros de gammes.`);

        alert(summaryMessage);
        console.log(`[DEVIS] ✅ Import terminé: ${newRows.length} lignes ajoutées (${matchCount} correspondances)`);

    } catch (error) {
        console.error('[DEVIS] ❌ Erreur lors de l\'import:', error);
        alert(`❌ Erreur lors de l'import: ${error.message}`);
    } finally {
        // Cacher l'indicateur de chargement
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
}

// Exposer l'API publique
window.devisManager = {
    initDevisManager,
    toggleEntrepreneurDropdown,
    toggleEntrepreneurFilter,
    selectAllEntrepreneurs,
    deselectAllEntrepreneurs,
    passesEntrepreneurFilter,
    creerDevis,
    closeDevisForm,
    // showHistorique, // SUPPRIMÉ - Utiliser la page "T55 - Historique" à la place
    // closeHistorique, // SUPPRIMÉ
    viewDevis,
    closeDevisView,
    exportDevisPDF,
    deleteDevis,
    showEntrepreneursDataList,
    closeEntrepreneursDataList,
    editEntrepreneurData,
    closeEntrepreneurForm,
    // addHistoriqueEntry, // SUPPRIMÉ - Utiliser la page "T55 - Historique"
    // editHistoriqueEntry, // SUPPRIMÉ
    // deleteHistoriqueEntry, // SUPPRIMÉ
    // closeHistoriqueEntryForm, // SUPPRIMÉ
    addDessinRow,
    deleteDessinRow,
    addTravauxRow,
    deleteTravauxRow,
    viewEntrepreneurDevis,
    closeViewEntrepreneurDevis,
    importFromIW37N
};

// Exposer les fonctions d'injection pour server-sync.js
window.setT55Data = setT55Data;
window.setT55EntrepreneursList = setT55EntrepreneursList;
window.setT55EntrepreneursData = setT55EntrepreneursData;

console.log('[DEVIS] Module chargé');
