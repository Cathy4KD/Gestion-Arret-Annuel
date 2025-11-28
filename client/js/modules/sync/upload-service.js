/**
 * @fileoverview Service d'upload de fichiers vers le serveur
 * @module sync/upload-service
 */

/**
 * URL de base de l'API de fichiers
 * @const {string}
 */
const API_BASE = window.location.origin + '/api/files';

/**
 * Upload un ou plusieurs fichiers vers le serveur
 * @param {FileList|File|File[]} files - Fichier(s) à uploader
 * @returns {Promise<Object>} Résultat avec les métadonnées des fichiers
 */
export async function uploadFiles(files) {
    try {
        // Convertir en tableau si nécessaire
        const fileArray = files instanceof FileList ? Array.from(files) :
                         Array.isArray(files) ? files : [files];

        if (fileArray.length === 0) {
            throw new Error('Aucun fichier à uploader');
        }

        // Créer FormData
        const formData = new FormData();
        fileArray.forEach(file => {
            formData.append('files', file);
        });

        console.log(`[UPLOAD] Envoi de ${fileArray.length} fichier(s)...`);

        // Envoyer au serveur
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erreur lors de l\'upload');
        }

        console.log(`[UPLOAD] ✅ ${result.files.length} fichier(s) uploadé(s) avec succès`);

        return result;
    } catch (error) {
        console.error('[UPLOAD] Erreur:', error);
        throw error;
    }
}

/**
 * Supprime un fichier du serveur
 * @param {string} filename - Nom du fichier à supprimer
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function deleteFile(filename) {
    try {
        const response = await fetch(`${API_BASE}/${filename}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erreur lors de la suppression');
        }

        console.log(`[UPLOAD] ✅ Fichier supprimé: ${filename}`);

        return result;
    } catch (error) {
        console.error('[UPLOAD] Erreur suppression:', error);
        throw error;
    }
}

/**
 * Récupère la liste de tous les fichiers uploadés
 * @returns {Promise<Array>} Liste des fichiers
 */
export async function listFiles() {
    try {
        const response = await fetch(`${API_BASE}/list`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erreur lors de la récupération de la liste');
        }

        return result.files;
    } catch (error) {
        console.error('[UPLOAD] Erreur liste fichiers:', error);
        throw error;
    }
}

/**
 * Obtient l'URL de téléchargement d'un fichier
 * @param {string} filename - Nom du fichier
 * @returns {string} URL complète du fichier
 */
export function getFileUrl(filename) {
    return `${API_BASE}/download/${filename}`;
}

/**
 * Télécharge un fichier depuis le serveur
 * @param {string} filename - Nom du fichier
 * @param {string} originalName - Nom original pour le téléchargement (optionnel)
 * @returns {void}
 */
export function downloadFile(filename, originalName) {
    const url = getFileUrl(filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Formate la taille d'un fichier en format lisible
 * @param {number} bytes - Taille en bytes
 * @returns {string} Taille formatée (ex: "2.5 MB")
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Valide un fichier avant upload
 * @param {File} file - Fichier à valider
 * @param {Object} options - Options de validation
 * @param {number} options.maxSize - Taille max en bytes (défaut: 50MB)
 * @param {Array<string>} options.allowedTypes - Types MIME autorisés
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateFile(file, options = {}) {
    const {
        maxSize = 50 * 1024 * 1024, // 50 MB par défaut
        allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'text/plain',
            'text/csv'
        ]
    } = options;

    // Vérifier la taille
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `Le fichier est trop volumineux (max: ${formatFileSize(maxSize)})`
        };
    }

    // Vérifier le type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Type de fichier non autorisé: ${file.type}`
        };
    }

    return { valid: true };
}
