/**
 * @fileoverview Interface utilisateur pour les Points de Presse
 * @module ui/point-presse-ui
 */

import {
    loadPointPresseData,
    addPointPresse,
    updatePointPresse,
    deletePointPresse,
    getAllPointsPresse,
    getPointPresseById,
    exportPointPresseToExcel,
    generatePointPressePDF
} from '../data/point-presse-data.js';

/**
 * ID du point de presse en cours d'édition (null si nouveau)
 * @type {string|null}
 */
let currentEditId = null;

/**
 * Initialise le module
 * @returns {void}
 */
export function initPointPresseUI() {
    loadPointPresseData();
    renderPointPresseList();

    // Attacher l'événement au formulaire
    const form = document.getElementById('pointPresseFormElement');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    console.log('[POINT-PRESSE-UI] Module initialisé');
}

/**
 * Affiche le formulaire d'ajout
 * @returns {Promise<void>}
 */
export async function showAddForm() {
    currentEditId = null;

    // Navigate to the page first
    await window.switchToPage('point-presse-form');

    // Wait a bit for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 50));

    // Then set the values
    const titleElement = document.getElementById('point-presse-form-title');
    if (titleElement) {
        titleElement.textContent = '📝 Ajouter un Point de Presse';
    }

    resetForm();

    // Définir la date d'aujourd'hui par défaut
    const dateElement = document.getElementById('pp-date');
    if (dateElement) {
        dateElement.valueAsDate = new Date();
    }
}

/**
 * Affiche le formulaire d'édition
 * @param {string} id - ID du point de presse à éditer
 * @returns {Promise<void>}
 */
export async function showEditForm(id) {
    currentEditId = id;

    const pp = getPointPresseById(id);
    if (!pp) {
        alert('⚠️ Point de presse non trouvé.');
        return;
    }

    // Navigate to the page first
    await window.switchToPage('point-presse-form');

    // Wait a bit for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 50));

    // Then set the values
    const titleElement = document.getElementById('point-presse-form-title');
    if (titleElement) {
        titleElement.textContent = '✏️ Modifier un Point de Presse';
    }

    // Remplir le formulaire
    const setValueIfExists = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    setValueIfExists('pp-jour', pp.jour || '');
    setValueIfExists('pp-date', pp.date || '');
    setValueIfExists('pp-duree', pp.duree || '');
    setValueIfExists('pp-nb-travailleurs', pp.nbTravailleurs || 0);

    setValueIfExists('pp-arret-prevu', pp.arretPrevu || '');
    setValueIfExists('pp-arret-reel', pp.arretReel || '');
    setValueIfExists('pp-depart-prevu', pp.departPrevu || '');
    setValueIfExists('pp-depart-reel', pp.departReel || '');

    // Indicateurs SSE
    setValueIfExists('pp-arreter-aide-24', pp.indicateurs.arreterDemanderAide.h24 || 0);
    setValueIfExists('pp-arreter-aide-total', pp.indicateurs.arreterDemanderAide.total || 0);
    setValueIfExists('pp-incident-blessure-24', pp.indicateurs.incidentBlessure.h24 || 0);
    setValueIfExists('pp-incident-blessure-total', pp.indicateurs.incidentBlessure.total || 0);
    setValueIfExists('pp-incident-autre-24', pp.indicateurs.incidentAutre.h24 || 0);
    setValueIfExists('pp-incident-autre-total', pp.indicateurs.incidentAutre.total || 0);
    setValueIfExists('pp-qualite-min-24', pp.indicateurs.problemeQualiteMin.h24 || 0);
    setValueIfExists('pp-qualite-min-total', pp.indicateurs.problemeQualiteMin.total || 0);
    setValueIfExists('pp-qualite-maj-24', pp.indicateurs.problemeQualiteMaj.h24 || 0);
    setValueIfExists('pp-qualite-maj-total', pp.indicateurs.problemeQualiteMaj.total || 0);
    setValueIfExists('pp-reel-vs-cible-24', pp.indicateurs.reelVsCible.h24 || 0);
    setValueIfExists('pp-reel-vs-cible-total', pp.indicateurs.reelVsCible.total || 0);

    setValueIfExists('pp-sse-pbo', pp.ssePBO || '');

    // Avancement des travaux
    setValueIfExists('pp-entretien-avancement', pp.travauxEntretien.avancement || '');
    setValueIfExists('pp-entretien-completes', pp.travauxEntretien.completes || '');
    setValueIfExists('pp-correctifs-avancement', pp.travauxCorrectifs.avancement || '');
    setValueIfExists('pp-correctifs-completes', pp.travauxCorrectifs.completes || '');
    setValueIfExists('pp-projets-avancement', pp.travauxProjets.avancement || '');
    setValueIfExists('pp-projets-completes', pp.travauxProjets.completes || '');

    // Sections textuelles
    setValueIfExists('pp-enjeu-principal', pp.enjeuPrincipal || '');
    setValueIfExists('pp-problemes-imprevus', pp.problemesImprevus || '');
    setValueIfExists('pp-bon-coup', pp.bonCoup || '');
    setValueIfExists('pp-a-venir', pp.aVenir || '');
}

/**
 * Réinitialise le formulaire
 * @returns {void}
 */
function resetForm() {
    const formElement = document.getElementById('pointPresseFormElement');
    if (formElement) {
        formElement.reset();
    }
}

/**
 * Gère la soumission du formulaire
 * @param {Event} e - Événement de soumission
 * @returns {void}
 */
function handleFormSubmit(e) {
    e.preventDefault();

    // Collecter les données du formulaire
    const formData = {
        jour: document.getElementById('pp-jour').value,
        date: document.getElementById('pp-date').value,
        duree: document.getElementById('pp-duree').value,
        nbTravailleurs: parseInt(document.getElementById('pp-nb-travailleurs').value) || 0,

        arretPrevu: document.getElementById('pp-arret-prevu').value,
        arretReel: document.getElementById('pp-arret-reel').value,
        departPrevu: document.getElementById('pp-depart-prevu').value,
        departReel: document.getElementById('pp-depart-reel').value,

        arreterAide24: parseInt(document.getElementById('pp-arreter-aide-24').value) || 0,
        arreterAideTotal: parseInt(document.getElementById('pp-arreter-aide-total').value) || 0,
        incidentBlessure24: parseInt(document.getElementById('pp-incident-blessure-24').value) || 0,
        incidentBlessureTotal: parseInt(document.getElementById('pp-incident-blessure-total').value) || 0,
        incidentAutre24: parseInt(document.getElementById('pp-incident-autre-24').value) || 0,
        incidentAutreTotal: parseInt(document.getElementById('pp-incident-autre-total').value) || 0,
        qualiteMin24: parseInt(document.getElementById('pp-qualite-min-24').value) || 0,
        qualiteMinTotal: parseInt(document.getElementById('pp-qualite-min-total').value) || 0,
        qualiteMaj24: parseInt(document.getElementById('pp-qualite-maj-24').value) || 0,
        qualiteMajTotal: parseInt(document.getElementById('pp-qualite-maj-total').value) || 0,
        reelVsCible24: parseInt(document.getElementById('pp-reel-vs-cible-24').value) || 0,
        reelVsCibleTotal: parseInt(document.getElementById('pp-reel-vs-cible-total').value) || 0,

        ssePBO: document.getElementById('pp-sse-pbo').value,

        entretienAvancement: document.getElementById('pp-entretien-avancement').value,
        entretienCompletes: document.getElementById('pp-entretien-completes').value,
        correctifsAvancement: document.getElementById('pp-correctifs-avancement').value,
        correctifsCompletes: document.getElementById('pp-correctifs-completes').value,
        projetsAvancement: document.getElementById('pp-projets-avancement').value,
        projetsCompletes: document.getElementById('pp-projets-completes').value,

        enjeuPrincipal: document.getElementById('pp-enjeu-principal').value,
        problemesImprevus: document.getElementById('pp-problemes-imprevus').value,
        bonCoup: document.getElementById('pp-bon-coup').value,
        aVenir: document.getElementById('pp-a-venir').value
    };

    if (currentEditId) {
        // Mise à jour
        const success = updatePointPresse(currentEditId, formData);
        if (success) {
            alert('✅ Point de presse mis à jour avec succès !');
            renderPointPresseList();
            window.switchToPage('point-presse-journaliers');
        } else {
            alert('❌ Erreur lors de la mise à jour.');
        }
    } else {
        // Ajout
        const id = addPointPresse(formData);
        if (id) {
            alert('✅ Point de presse ajouté avec succès !');
            renderPointPresseList();
            window.switchToPage('point-presse-journaliers');
        } else {
            alert('❌ Erreur lors de l\'ajout.');
        }
    }
}

/**
 * Affiche la liste des points de presse
 * @returns {void}
 */
export function renderPointPresseList() {
    const container = document.getElementById('pointPresseList');
    if (!container) {
        console.warn('[POINT-PRESSE-UI] Container pointPresseList non trouvé');
        return;
    }

    const pointsPresse = getAllPointsPresse();

    if (pointsPresse.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; background: white; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <p style="color: #666; font-size: 1.1em;">📰 Aucun point de presse enregistré.</p>
                <p style="color: #999; font-size: 0.95em;">Cliquez sur "Ajouter Point de Presse" pour commencer.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pointsPresse.map(pp => `
        <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-left: 5px solid #f093fb;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 10px 0; color: #333; font-size: 1.3em;">📅 ${pp.jour || 'Point de Presse'} - ${formatDate(pp.date)}</h3>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <span style="color: #666;"><strong>Durée:</strong> ${pp.duree || 'N/A'}</span>
                        <span style="color: #666;"><strong>Travailleurs:</strong> ${pp.nbTravailleurs || 0}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.pointPresseActions.generatePDF('${pp.id}')" style="padding: 8px 16px; background: linear-gradient(145deg, #ff6b6b, #ee5a52); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;" title="Exporter en PDF">
                        📄 PDF
                    </button>
                    <button onclick="window.pointPresseActions.edit('${pp.id}')" style="padding: 8px 16px; background: #4facfe; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        ✏️ Modifier
                    </button>
                    <button onclick="window.pointPresseActions.delete('${pp.id}')" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 15px;">
                ${pp.arretReel ? `<div style="padding: 10px; background: #fff3cd; border-radius: 5px;"><strong>Arrêt Réel:</strong> ${pp.arretReel}</div>` : ''}
                ${pp.departReel ? `<div style="padding: 10px; background: #d1ecf1; border-radius: 5px;"><strong>Départ Réel:</strong> ${pp.departReel}</div>` : ''}
            </div>

            ${pp.indicateurs.incidentBlessure.total > 0 ? `
                <div style="padding: 12px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 5px; margin-bottom: 15px;">
                    <strong style="color: #721c24;">⚠️ Incidents Blessure:</strong>
                    <span style="color: #721c24;">${pp.indicateurs.incidentBlessure.h24} (24H) / ${pp.indicateurs.incidentBlessure.total} (Total)</span>
                </div>
            ` : ''}

            ${pp.enjeuPrincipal ? `
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: #555; font-size: 1em;">🎯 Enjeu Principal</h4>
                    <p style="margin: 0; padding: 10px; background: #f8f9fa; border-radius: 5px; color: #333;">${escapeHtml(pp.enjeuPrincipal)}</p>
                </div>
            ` : ''}

            ${pp.problemesImprevus ? `
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: #555; font-size: 1em;">⚠️ Problèmes / Imprévus</h4>
                    <p style="margin: 0; padding: 10px; background: #fff3cd; border-radius: 5px; color: #333;">${escapeHtml(pp.problemesImprevus)}</p>
                </div>
            ` : ''}

            ${pp.bonCoup ? `
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: #555; font-size: 1em;">👍 Bon Coup</h4>
                    <p style="margin: 0; padding: 10px; background: #d4edda; border-radius: 5px; color: #333;">${escapeHtml(pp.bonCoup)}</p>
                </div>
            ` : ''}

            ${pp.aVenir ? `
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: #555; font-size: 1em;">🔜 À Venir (24h)</h4>
                    <p style="margin: 0; padding: 10px; background: #d1ecf1; border-radius: 5px; color: #333;">${escapeHtml(pp.aVenir)}</p>
                </div>
            ` : ''}

            <div style="text-align: right; color: #999; font-size: 0.85em; margin-top: 10px;">
                Créé le ${formatDateTime(pp.dateCreation)}
            </div>
        </div>
    `).join('');

    console.log(`[POINT-PRESSE-UI] ${pointsPresse.length} points de presse affichés`);
}

/**
 * Supprime un point de presse
 * @param {string} id - ID du point de presse
 * @returns {void}
 */
export function deletePointPresseUI(id) {
    const success = deletePointPresse(id);
    if (success) {
        renderPointPresseList();
    }
}

/**
 * Exporte vers Excel
 * @returns {void}
 */
export function exportToExcelUI() {
    exportPointPresseToExcel();
}

/**
 * Formate une date au format lisible
 * @param {string} dateStr - Date au format ISO
 * @returns {string} Date formatée
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Formate une date-heure au format lisible
 * @param {string} dateStr - Date au format ISO
 * @returns {string} Date-heure formatée
 */
function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Échappe le HTML pour prévenir les injections XSS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

/**
 * Génère un PDF pour un point de presse
 * @param {string} id - ID du point de presse
 * @returns {void}
 */
export function generatePDFUI(id) {
    generatePointPressePDF(id);
}
