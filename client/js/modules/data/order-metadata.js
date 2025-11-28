/**
 * @fileoverview Module centralisé de gestion des métadonnées par ordre
 * Ce module gère les commentaires, statuts, documents et autres métadonnées
 * liés aux ordres IW37N et les synchronise entre tous les écrans
 * @module data/order-metadata
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Clé de stockage pour les métadonnées
 * @const {string}
 */
const STORAGE_KEY = 'orderMetadata';

/**
 * Structure des métadonnées par ordre
 * @type {Object.<string, OrderMetadata>}
 *
 * @typedef {Object} OrderMetadata
 * @property {string} ordre - Numéro d'ordre
 * @property {Array<Comment>} comments - Liste des commentaires
 * @property {string} status - Statut local (ex: "En cours", "Terminé", "Bloqué")
 * @property {Array<Document>} documents - Liste des documents/photos
 * @property {string} lastUpdated - Date de dernière modification
 * @property {Object} customFields - Champs personnalisés supplémentaires
 */
let metadata = {};

/**
 * @typedef {Object} Comment
 * @property {string} id - ID unique du commentaire
 * @property {string} text - Texte du commentaire
 * @property {string} author - Auteur du commentaire
 * @property {string} date - Date de création
 * @property {string} source - Source du commentaire (nom de la page)
 */

/**
 * @typedef {Object} Document
 * @property {string} id - ID unique du document
 * @property {string} name - Nom du fichier
 * @property {string} url - URL du fichier (base64 ou URL serveur)
 * @property {string} type - Type MIME
 * @property {number} size - Taille en octets
 * @property {string} uploadDate - Date d'upload
 * @property {string} uploadedBy - Utilisateur ayant uploadé
 */

/**
 * Écouteurs de changements (pour synchronisation temps réel)
 * @type {Set<Function>}
 */
const listeners = new Set();

/**
 * Initialise le module et charge les données
 * @async
 * @returns {Promise<void>}
 */
export async function initOrderMetadata() {
    console.log('[ORDER-METADATA] 🚀 Initialisation...');
    await loadMetadata();
    console.log(`[ORDER-METADATA] ✅ ${Object.keys(metadata).length} ordres avec métadonnées chargés`);
}

/**
 * Charge les métadonnées depuis le stockage
 * @async
 * @returns {Promise<void>}
 */
async function loadMetadata() {
    try {
        const saved = await loadFromStorage(STORAGE_KEY);
        if (saved && typeof saved === 'object') {
            metadata = saved;
            console.log(`[ORDER-METADATA] ✅ ${Object.keys(metadata).length} ordres chargés`);
        } else {
            metadata = {};
            console.log('[ORDER-METADATA] ℹ️ Aucune métadonnée sauvegardée');
        }
        notifyListeners();
    } catch (error) {
        console.error('[ORDER-METADATA] ❌ Erreur lors du chargement:', error);
        metadata = {};
    }
}

/**
 * Sauvegarde les métadonnées
 * @async
 * @returns {Promise<boolean>}
 */
async function saveMetadata() {
    try {
        await saveToStorage(STORAGE_KEY, metadata);
        console.log(`[ORDER-METADATA] 💾 ${Object.keys(metadata).length} ordres sauvegardés`);
        return true;
    } catch (error) {
        console.error('[ORDER-METADATA] ❌ Erreur lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Récupère ou crée les métadonnées pour un ordre
 * @param {string} ordre - Numéro d'ordre
 * @returns {OrderMetadata}
 */
export function getOrderMetadata(ordre) {
    if (!ordre) {
        console.warn('[ORDER-METADATA] ⚠️ Ordre vide fourni à getOrderMetadata');
        return null;
    }

    const ordreStr = String(ordre).trim();

    if (!metadata[ordreStr]) {
        metadata[ordreStr] = {
            ordre: ordreStr,
            comments: [],
            status: '',
            documents: [],
            lastUpdated: new Date().toISOString(),
            customFields: {}
        };
    }

    return metadata[ordreStr];
}

/**
 * Récupère toutes les métadonnées
 * @returns {Object.<string, OrderMetadata>}
 */
export function getAllMetadata() {
    return { ...metadata };
}

/**
 * Ajoute un commentaire à un ordre
 * @param {string} ordre - Numéro d'ordre
 * @param {string} text - Texte du commentaire
 * @param {string} source - Source du commentaire (nom de la page)
 * @param {string} [author='Utilisateur'] - Auteur du commentaire
 * @returns {Promise<Comment>}
 */
export async function addComment(ordre, text, source, author = 'Utilisateur') {
    if (!ordre || !text) {
        console.error('[ORDER-METADATA] ❌ Ordre ou texte manquant');
        return null;
    }

    const orderMeta = getOrderMetadata(ordre);

    const comment = {
        id: generateId(),
        text: text.trim(),
        author,
        date: new Date().toISOString(),
        source
    };

    orderMeta.comments.push(comment);
    orderMeta.lastUpdated = new Date().toISOString();

    await saveMetadata();
    notifyListeners(ordre);

    console.log(`[ORDER-METADATA] ✅ Commentaire ajouté à l'ordre ${ordre} (source: ${source})`);
    return comment;
}

/**
 * Supprime un commentaire
 * @param {string} ordre - Numéro d'ordre
 * @param {string} commentId - ID du commentaire
 * @returns {Promise<boolean>}
 */
export async function deleteComment(ordre, commentId) {
    const orderMeta = getOrderMetadata(ordre);
    if (!orderMeta) return false;

    const index = orderMeta.comments.findIndex(c => c.id === commentId);
    if (index === -1) return false;

    orderMeta.comments.splice(index, 1);
    orderMeta.lastUpdated = new Date().toISOString();

    await saveMetadata();
    notifyListeners(ordre);

    console.log(`[ORDER-METADATA] ✅ Commentaire supprimé de l'ordre ${ordre}`);
    return true;
}

/**
 * Modifie le statut d'un ordre
 * @param {string} ordre - Numéro d'ordre
 * @param {string} status - Nouveau statut
 * @returns {Promise<boolean>}
 */
export async function setStatus(ordre, status) {
    if (!ordre) return false;

    const orderMeta = getOrderMetadata(ordre);
    orderMeta.status = status || '';
    orderMeta.lastUpdated = new Date().toISOString();

    await saveMetadata();
    notifyListeners(ordre);

    console.log(`[ORDER-METADATA] ✅ Statut de l'ordre ${ordre} mis à jour: ${status}`);
    return true;
}

/**
 * Ajoute un document à un ordre
 * @param {string} ordre - Numéro d'ordre
 * @param {File|Object} file - Fichier ou objet document
 * @param {string} [uploadedBy='Utilisateur'] - Utilisateur ayant uploadé
 * @returns {Promise<Document>}
 */
export async function addDocument(ordre, file, uploadedBy = 'Utilisateur') {
    if (!ordre || !file) {
        console.error('[ORDER-METADATA] ❌ Ordre ou fichier manquant');
        return null;
    }

    const orderMeta = getOrderMetadata(ordre);

    // Si c'est un objet File du navigateur
    if (file instanceof File) {
        const document = {
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: await fileToBase64(file),
            uploadDate: new Date().toISOString(),
            uploadedBy
        };

        orderMeta.documents.push(document);
        orderMeta.lastUpdated = new Date().toISOString();

        await saveMetadata();
        notifyListeners(ordre);

        console.log(`[ORDER-METADATA] ✅ Document ajouté à l'ordre ${ordre}: ${file.name}`);
        return document;
    }
    // Si c'est déjà un objet document formaté
    else if (file.name && file.url) {
        const document = {
            id: file.id || generateId(),
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size || 0,
            url: file.url,
            uploadDate: file.uploadDate || new Date().toISOString(),
            uploadedBy: file.uploadedBy || uploadedBy
        };

        orderMeta.documents.push(document);
        orderMeta.lastUpdated = new Date().toISOString();

        await saveMetadata();
        notifyListeners(ordre);

        console.log(`[ORDER-METADATA] ✅ Document ajouté à l'ordre ${ordre}: ${file.name}`);
        return document;
    }

    return null;
}

/**
 * Supprime un document
 * @param {string} ordre - Numéro d'ordre
 * @param {string} documentId - ID du document
 * @returns {Promise<boolean>}
 */
export async function deleteDocument(ordre, documentId) {
    const orderMeta = getOrderMetadata(ordre);
    if (!orderMeta) return false;

    const index = orderMeta.documents.findIndex(d => d.id === documentId);
    if (index === -1) return false;

    orderMeta.documents.splice(index, 1);
    orderMeta.lastUpdated = new Date().toISOString();

    await saveMetadata();
    notifyListeners(ordre);

    console.log(`[ORDER-METADATA] ✅ Document supprimé de l'ordre ${ordre}`);
    return true;
}

/**
 * Définit une valeur de champ personnalisé
 * @param {string} ordre - Numéro d'ordre
 * @param {string} fieldName - Nom du champ
 * @param {any} value - Valeur
 * @returns {Promise<boolean>}
 */
export async function setCustomField(ordre, fieldName, value) {
    if (!ordre || !fieldName) return false;

    const orderMeta = getOrderMetadata(ordre);
    orderMeta.customFields[fieldName] = value;
    orderMeta.lastUpdated = new Date().toISOString();

    await saveMetadata();
    notifyListeners(ordre);

    return true;
}

/**
 * Récupère une valeur de champ personnalisé
 * @param {string} ordre - Numéro d'ordre
 * @param {string} fieldName - Nom du champ
 * @returns {any}
 */
export function getCustomField(ordre, fieldName) {
    const orderMeta = getOrderMetadata(ordre);
    return orderMeta ? orderMeta.customFields[fieldName] : undefined;
}

/**
 * S'abonne aux changements de métadonnées
 * @param {Function} callback - Fonction appelée lors des changements
 * @returns {Function} Fonction pour se désabonner
 */
export function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/**
 * Notifie tous les écouteurs d'un changement
 * @param {string} [ordre] - Ordre modifié (optionnel)
 */
function notifyListeners(ordre) {
    listeners.forEach(listener => {
        try {
            listener(ordre, metadata);
        } catch (error) {
            console.error('[ORDER-METADATA] ❌ Erreur dans listener:', error);
        }
    });
}

/**
 * Convertit un fichier en base64
 * @param {File} file - Fichier à convertir
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Génère un ID unique
 * @returns {string}
 */
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Exporte toutes les métadonnées vers Excel
 * @returns {void}
 */
export function exportMetadataToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('❌ La bibliothèque XLSX n\'est pas chargée');
        return;
    }

    const data = Object.values(metadata).map(meta => ({
        'Ordre': meta.ordre,
        'Statut': meta.status || '',
        'Nb Commentaires': meta.comments.length,
        'Nb Documents': meta.documents.length,
        'Dernière modification': new Date(meta.lastUpdated).toLocaleString('fr-FR'),
        'Commentaires': meta.comments.map(c => `[${c.author}] ${c.text}`).join(' | ')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Métadonnées');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `metadata-ordres-${date}.xlsx`);

    console.log('[ORDER-METADATA] ✅ Export Excel réussi');
}

/**
 * Importe des métadonnées depuis un objet
 * @param {Object} importedData - Données à importer
 * @returns {Promise<boolean>}
 */
export async function importMetadata(importedData) {
    if (!importedData || typeof importedData !== 'object') {
        console.error('[ORDER-METADATA] ❌ Données d\'import invalides');
        return false;
    }

    // Fusionner avec les données existantes
    Object.keys(importedData).forEach(ordre => {
        if (!metadata[ordre]) {
            metadata[ordre] = importedData[ordre];
        } else {
            // Fusionner les commentaires et documents
            const existing = metadata[ordre];
            const imported = importedData[ordre];

            if (imported.comments) {
                imported.comments.forEach(comment => {
                    if (!existing.comments.find(c => c.id === comment.id)) {
                        existing.comments.push(comment);
                    }
                });
            }

            if (imported.documents) {
                imported.documents.forEach(doc => {
                    if (!existing.documents.find(d => d.id === doc.id)) {
                        existing.documents.push(doc);
                    }
                });
            }

            // Mettre à jour le statut si plus récent
            if (imported.lastUpdated > existing.lastUpdated) {
                existing.status = imported.status;
                existing.lastUpdated = imported.lastUpdated;
            }
        }
    });

    await saveMetadata();
    notifyListeners();

    console.log('[ORDER-METADATA] ✅ Import de métadonnées réussi');
    return true;
}

/**
 * Efface toutes les métadonnées
 * @returns {Promise<boolean>}
 */
export async function clearAllMetadata() {
    if (!confirm('⚠️ Voulez-vous vraiment effacer TOUTES les métadonnées (commentaires, statuts, documents) ?')) {
        return false;
    }

    metadata = {};
    await saveMetadata();
    notifyListeners();

    console.log('[ORDER-METADATA] 🗑️ Toutes les métadonnées effacées');
    return true;
}

// Exposer globalement pour compatibilité
if (typeof window !== 'undefined') {
    window.orderMetadata = {
        init: initOrderMetadata,
        getMetadata: getOrderMetadata,
        getAllMetadata,
        addComment,
        deleteComment,
        setStatus,
        addDocument,
        deleteDocument,
        setCustomField,
        getCustomField,
        subscribe,
        exportToExcel: exportMetadataToExcel,
        importMetadata,
        clearAll: clearAllMetadata
    };
    console.log('[ORDER-METADATA] ✅ Exposé globalement via window.orderMetadata');
}
