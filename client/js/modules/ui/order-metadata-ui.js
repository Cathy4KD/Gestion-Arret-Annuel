/**
 * @fileoverview Composant UI standardisé pour afficher et modifier les métadonnées d'ordre
 * @module ui/order-metadata-ui
 */

import {
    getOrderMetadata,
    addComment,
    deleteComment,
    setStatus,
    addDocument,
    deleteDocument,
    subscribe
} from '../data/order-metadata.js';

/**
 * Statuts prédéfinis disponibles
 * @const {Array<Object>}
 */
const PREDEFINED_STATUSES = [
    { value: '', label: '-- Aucun --', color: '#6c757d' },
    { value: 'A planifier', label: '📅 A planifier', color: '#ffc107' },
    { value: 'Planifié', label: '✅ Planifié', color: '#28a745' },
    { value: 'En cours', label: '🔄 En cours', color: '#007bff' },
    { value: 'En attente', label: '⏸️ En attente', color: '#fd7e14' },
    { value: 'Bloqué', label: '🚫 Bloqué', color: '#dc3545' },
    { value: 'Terminé', label: '✔️ Terminé', color: '#20c997' },
    { value: 'Annulé', label: '❌ Annulé', color: '#6c757d' }
];

/**
 * Génère le HTML pour la section métadonnées d'un ordre
 * @param {string} ordre - Numéro d'ordre
 * @param {Object} [options] - Options d'affichage
 * @param {boolean} [options.showComments=true] - Afficher la section commentaires
 * @param {boolean} [options.showStatus=true] - Afficher le sélecteur de statut
 * @param {boolean} [options.showDocuments=true] - Afficher la section documents
 * @param {boolean} [options.compact=false] - Mode compact
 * @param {string} [options.source=''] - Source (nom de la page)
 * @returns {string} HTML
 */
export function renderOrderMetadataUI(ordre, options = {}) {
    const {
        showComments = true,
        showStatus = true,
        showDocuments = true,
        compact = false,
        source = 'Page'
    } = options;

    if (!ordre) {
        return '<div style="color: #999; padding: 10px;">Aucun ordre sélectionné</div>';
    }

    const metadata = getOrderMetadata(ordre);
    const containerId = `metadata-${ordre.replace(/[^a-zA-Z0-9]/g, '_')}`;

    return `
        <div id="${containerId}" class="order-metadata-container" style="background: #f8f9fa; border-radius: 10px; padding: ${compact ? '10px' : '20px'}; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #333; font-size: ${compact ? '1em' : '1.1em'};">
                    📋 Suivi de l'ordre <strong style="color: #667eea;">${escapeHtml(ordre)}</strong>
                </h4>
                ${showStatus ? renderStatusSelector(ordre, metadata.status, compact) : ''}
            </div>

            <div style="display: grid; grid-template-columns: ${compact ? '1fr' : showComments && showDocuments ? '1fr 1fr' : '1fr'}; gap: 15px;">
                ${showComments ? renderCommentsSection(ordre, metadata.comments, source, compact) : ''}
                ${showDocuments ? renderDocumentsSection(ordre, metadata.documents, compact) : ''}
            </div>
        </div>
    `;
}

/**
 * Génère le HTML pour le sélecteur de statut
 * @private
 */
function renderStatusSelector(ordre, currentStatus, compact = false) {
    const selectedStatus = PREDEFINED_STATUSES.find(s => s.value === currentStatus) || PREDEFINED_STATUSES[0];

    return `
        <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-weight: 600; color: #555; font-size: ${compact ? '0.9em' : '1em'};">Statut:</label>
            <select onchange="window.orderMetadataUI.handleStatusChange('${escapeHtml(ordre)}', this.value)"
                    style="padding: ${compact ? '5px 10px' : '8px 12px'}; border: 2px solid ${selectedStatus.color}; border-radius: 6px; background: white; color: ${selectedStatus.color}; font-weight: bold; cursor: pointer; font-size: ${compact ? '0.85em' : '0.95em'};">
                ${PREDEFINED_STATUSES.map(status => `
                    <option value="${status.value}" ${status.value === currentStatus ? 'selected' : ''}>
                        ${status.label}
                    </option>
                `).join('')}
            </select>
        </div>
    `;
}

/**
 * Génère le HTML pour la section commentaires
 * @private
 */
function renderCommentsSection(ordre, comments, source, compact = false) {
    const ordreId = ordre.replace(/[^a-zA-Z0-9]/g, '_');

    return `
        <div class="comments-section" style="background: white; border-radius: 8px; padding: ${compact ? '10px' : '15px'};">
            <h5 style="margin: 0 0 10px 0; color: #333; font-size: ${compact ? '0.95em' : '1em'};">💬 Commentaires (${comments.length})</h5>

            <!-- Zone d'ajout de commentaire -->
            <div style="margin-bottom: 15px;">
                <textarea id="comment-input-${ordreId}"
                          placeholder="Ajouter un commentaire..."
                          style="width: 100%; min-height: ${compact ? '60px' : '80px'}; padding: 10px; border: 2px solid #dee2e6; border-radius: 6px; resize: vertical; font-family: inherit; font-size: ${compact ? '0.85em' : '0.9em'};"></textarea>
                <button onclick="window.orderMetadataUI.handleAddComment('${escapeHtml(ordre)}', '${escapeHtml(source)}', 'comment-input-${ordreId}')"
                        style="margin-top: 8px; padding: ${compact ? '6px 15px' : '8px 20px'}; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: ${compact ? '0.85em' : '0.9em'};">
                    ➕ Ajouter
                </button>
            </div>

            <!-- Liste des commentaires -->
            <div id="comments-list-${ordreId}" style="max-height: ${compact ? '200px' : '300px'}; overflow-y: auto;">
                ${comments.length === 0 ? `
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 0.9em;">
                        Aucun commentaire. Ajoutez-en un ci-dessus.
                    </div>
                ` : comments.map(comment => renderComment(ordre, comment, compact)).join('')}
            </div>
        </div>
    `;
}

/**
 * Génère le HTML pour un commentaire
 * @private
 */
function renderComment(ordre, comment, compact = false) {
    const date = new Date(comment.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="comment-item" style="background: #f8f9fa; border-left: 3px solid #667eea; padding: ${compact ? '8px' : '10px'}; margin-bottom: 8px; border-radius: 4px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
                <div style="font-size: ${compact ? '0.8em' : '0.85em'}; color: #666;">
                    <strong style="color: #333;">${escapeHtml(comment.author)}</strong>
                    ${comment.source ? `<span style="color: #999;"> • ${escapeHtml(comment.source)}</span>` : ''}
                </div>
                <button onclick="window.orderMetadataUI.handleDeleteComment('${escapeHtml(ordre)}', '${comment.id}')"
                        style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 2px 6px; font-size: 1.1em;"
                        title="Supprimer">
                    🗑️
                </button>
            </div>
            <div style="color: #333; font-size: ${compact ? '0.85em' : '0.9em'}; margin-bottom: 5px; white-space: pre-wrap;">
                ${escapeHtml(comment.text)}
            </div>
            <div style="font-size: ${compact ? '0.75em' : '0.8em'}; color: #999;">
                ${date}
            </div>
        </div>
    `;
}

/**
 * Génère le HTML pour la section documents
 * @private
 */
function renderDocumentsSection(ordre, documents, compact = false) {
    const ordreId = ordre.replace(/[^a-zA-Z0-9]/g, '_');

    return `
        <div class="documents-section" style="background: white; border-radius: 8px; padding: ${compact ? '10px' : '15px'};">
            <h5 style="margin: 0 0 10px 0; color: #333; font-size: ${compact ? '0.95em' : '1em'};">📎 Documents (${documents.length})</h5>

            <!-- Zone d'upload -->
            <div style="margin-bottom: 15px;">
                <input type="file"
                       id="doc-input-${ordreId}"
                       multiple
                       style="display: none;"
                       onchange="window.orderMetadataUI.handleAddDocument('${escapeHtml(ordre)}', this)">
                <button onclick="document.getElementById('doc-input-${ordreId}').click()"
                        style="padding: ${compact ? '6px 15px' : '8px 20px'}; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: ${compact ? '0.85em' : '0.9em'};">
                    📤 Ajouter Document/Photo
                </button>
            </div>

            <!-- Liste des documents -->
            <div id="documents-list-${ordreId}" style="max-height: ${compact ? '200px' : '300px'}; overflow-y: auto;">
                ${documents.length === 0 ? `
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 0.9em;">
                        Aucun document. Ajoutez-en un ci-dessus.
                    </div>
                ` : documents.map(doc => renderDocument(ordre, doc, compact)).join('')}
            </div>
        </div>
    `;
}

/**
 * Génère le HTML pour un document
 * @private
 */
function renderDocument(ordre, doc, compact = false) {
    const isImage = doc.type && doc.type.startsWith('image/');
    const size = formatFileSize(doc.size);
    const date = new Date(doc.uploadDate).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return `
        <div class="document-item" style="background: #f8f9fa; padding: ${compact ? '8px' : '10px'}; margin-bottom: 8px; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
            ${isImage ? `
                <img src="${doc.url}"
                     alt="${escapeHtml(doc.name)}"
                     onclick="window.orderMetadataUI.viewDocument('${doc.url}', '${escapeHtml(doc.name)}')"
                     style="width: ${compact ? '40px' : '50px'}; height: ${compact ? '40px' : '50px'}; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid #dee2e6;">
            ` : `
                <div style="width: ${compact ? '40px' : '50px'}; height: ${compact ? '40px' : '50px'}; background: #667eea; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5em;">
                    📄
                </div>
            `}
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: #333; font-size: ${compact ? '0.85em' : '0.9em'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(doc.name)}
                </div>
                <div style="font-size: ${compact ? '0.75em' : '0.8em'}; color: #666;">
                    ${size} • ${date}
                </div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button onclick="window.orderMetadataUI.downloadDocument('${doc.url}', '${escapeHtml(doc.name)}')"
                        style="background: #007bff; color: white; border: none; padding: ${compact ? '4px 8px' : '6px 10px'}; border-radius: 4px; cursor: pointer; font-size: ${compact ? '0.8em' : '0.85em'};"
                        title="Télécharger">
                    ⬇️
                </button>
                <button onclick="window.orderMetadataUI.handleDeleteDocument('${escapeHtml(ordre)}', '${doc.id}')"
                        style="background: #dc3545; color: white; border: none; padding: ${compact ? '4px 8px' : '6px 10px'}; border-radius: 4px; cursor: pointer; font-size: ${compact ? '0.8em' : '0.85em'};"
                        title="Supprimer">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

/**
 * Gère l'ajout d'un commentaire
 * @param {string} ordre - Numéro d'ordre
 * @param {string} source - Source du commentaire
 * @param {string} inputId - ID du textarea
 */
export async function handleAddComment(ordre, source, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const text = input.value.trim();
    if (!text) {
        alert('⚠️ Veuillez entrer un commentaire');
        return;
    }

    await addComment(ordre, text, source);
    input.value = '';

    // Rafraîchir l'affichage
    refreshMetadataUI(ordre);
}

/**
 * Gère la suppression d'un commentaire
 * @param {string} ordre - Numéro d'ordre
 * @param {string} commentId - ID du commentaire
 */
export async function handleDeleteComment(ordre, commentId) {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
        return;
    }

    await deleteComment(ordre, commentId);
    refreshMetadataUI(ordre);
}

/**
 * Gère le changement de statut
 * @param {string} ordre - Numéro d'ordre
 * @param {string} status - Nouveau statut
 */
export async function handleStatusChange(ordre, status) {
    await setStatus(ordre, status);
    console.log(`[ORDER-METADATA-UI] Statut de l'ordre ${ordre} changé: ${status}`);
}

/**
 * Gère l'ajout de documents
 * @param {string} ordre - Numéro d'ordre
 * @param {HTMLInputElement} input - Input file
 */
export async function handleAddDocument(ordre, input) {
    if (!input.files || input.files.length === 0) {
        return;
    }

    for (const file of input.files) {
        await addDocument(ordre, file);
    }

    input.value = '';
    refreshMetadataUI(ordre);
}

/**
 * Gère la suppression d'un document
 * @param {string} ordre - Numéro d'ordre
 * @param {string} documentId - ID du document
 */
export async function handleDeleteDocument(ordre, documentId) {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) {
        return;
    }

    await deleteDocument(ordre, documentId);
    refreshMetadataUI(ordre);
}

/**
 * Télécharge un document
 * @param {string} url - URL du document (base64 ou URL)
 * @param {string} filename - Nom du fichier
 */
export function downloadDocument(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Affiche un document (pour les images)
 * @param {string} url - URL de l'image
 * @param {string} title - Titre
 */
export function viewDocument(url, title) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
    `;
    modal.innerHTML = `
        <div style="max-width: 90%; max-height: 90%; position: relative;">
            <img src="${url}" alt="${escapeHtml(title)}"
                 style="max-width: 100%; max-height: 90vh; border-radius: 8px; box-shadow: 0 0 30px rgba(255,255,255,0.3);">
            <div style="position: absolute; top: -40px; right: 0; color: white; font-size: 2em; cursor: pointer;">✖️</div>
        </div>
    `;
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
}

/**
 * Rafraîchit l'affichage des métadonnées pour un ordre
 * @param {string} ordre - Numéro d'ordre
 */
function refreshMetadataUI(ordre) {
    const containerId = `metadata-${ordre.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const container = document.getElementById(containerId);

    if (container) {
        // Récupérer les options depuis le container
        const options = {
            showComments: container.querySelector('.comments-section') !== null,
            showDocuments: container.querySelector('.documents-section') !== null,
            source: container.dataset.source || 'Page',
            compact: container.dataset.compact === 'true'
        };

        const newHtml = renderOrderMetadataUI(ordre, options);
        container.outerHTML = newHtml;
    }
}

/**
 * Formate la taille d'un fichier
 * @private
 */
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Échappe les caractères HTML
 * @private
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.orderMetadataUI = {
        render: renderOrderMetadataUI,
        handleAddComment,
        handleDeleteComment,
        handleStatusChange,
        handleAddDocument,
        handleDeleteDocument,
        downloadDocument,
        viewDocument,
        STATUSES: PREDEFINED_STATUSES
    };
    console.log('[ORDER-METADATA-UI] ✅ Exposé globalement via window.orderMetadataUI');
}
