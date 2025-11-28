/**
 * Utilitaires de sécurité pour les uploads de fichiers
 */

import { readFile } from 'fs/promises';
import { extname, basename } from 'path';

/**
 * Types MIME autorisés par extension
 */
const ALLOWED_MIME_TYPES = {
  // Documents
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

  // Tableurs
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],

  // Images
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.svg': ['image/svg+xml'],

  // Archives
  '.zip': ['application/zip', 'application/x-zip-compressed'],
  '.rar': ['application/x-rar-compressed'],

  // Texte
  '.txt': ['text/plain'],
  '.csv': ['text/csv', 'text/plain']
};

/**
 * Signatures de fichiers (magic numbers) pour vérification MIME réelle
 */
const FILE_SIGNATURES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'application/zip': [0x50, 0x4B, 0x03, 0x04],
  'application/x-rar-compressed': [0x52, 0x61, 0x72, 0x21],
  // Office Open XML (docx, xlsx)
  'application/vnd.openxmlformats-officedocument': [0x50, 0x4B, 0x03, 0x04]
};

/**
 * Vérifie le type MIME réel d'un fichier en lisant ses premiers bytes
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<string|null>} - Type MIME détecté ou null
 */
export async function detectRealMimeType(filePath) {
  try {
    // Lire les premiers 16 bytes
    const buffer = await readFile(filePath);
    const header = Array.from(buffer.slice(0, 16));

    // Vérifier les signatures
    for (const [mimeType, signature] of Object.entries(FILE_SIGNATURES)) {
      if (matchesSignature(header, signature)) {
        return mimeType;
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur détection MIME:', error);
    return null;
  }
}

/**
 * Vérifie si un header correspond à une signature
 * @param {Array} header - Header du fichier
 * @param {Array} signature - Signature à vérifier
 * @returns {boolean}
 */
function matchesSignature(header, signature) {
  for (let i = 0; i < signature.length; i++) {
    if (header[i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Valide un fichier uploadé
 * @param {Object} file - Objet fichier Multer
 * @param {Object} options - Options de validation
 * @returns {Promise<Object>} - {valid: boolean, error?: string}
 */
export async function validateUploadedFile(file, options = {}) {
  const {
    maxSize = 50 * 1024 * 1024, // 50 MB par défaut
    allowedExtensions = Object.keys(ALLOWED_MIME_TYPES),
    checkRealMimeType = true
  } = options;

  // Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop gros. Taille max: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    };
  }

  // Vérifier l'extension
  const ext = extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Extension non autorisée: ${ext}. Extensions autorisées: ${allowedExtensions.join(', ')}`
    };
  }

  // Vérifier le type MIME déclaré
  const allowedMimes = ALLOWED_MIME_TYPES[ext];
  if (allowedMimes && !allowedMimes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Type MIME invalide pour ${ext}: ${file.mimetype}`
    };
  }

  // Vérifier le type MIME réel (magic numbers)
  if (checkRealMimeType && file.path) {
    const realMimeType = await detectRealMimeType(file.path);

    if (realMimeType) {
      // Pour les fichiers Office Open XML, vérifier le début ZIP
      if (ext === '.docx' || ext === '.xlsx') {
        if (!realMimeType.includes('zip') && !realMimeType.includes('openxmlformats')) {
          return {
            valid: false,
            error: 'Le fichier ne correspond pas au format attendu'
          };
        }
      }
      // Pour les autres, vérifier correspondance exacte
      else if (allowedMimes && !allowedMimes.some(mime => realMimeType.includes(mime.split('/')[1]))) {
        return {
          valid: false,
          error: 'Le contenu du fichier ne correspond pas à son extension'
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Sanitize un nom de fichier pour la sécurité
 * @param {string} filename - Nom de fichier original
 * @returns {string} - Nom de fichier sécurisé
 */
export function sanitizeFilename(filename) {
  // Extraire le nom et l'extension
  const ext = extname(filename).toLowerCase();
  const name = basename(filename, ext);

  // Remplacer les caractères non alphanumériques par des underscores
  // Garder: lettres, chiffres, tirets, underscores
  const safeName = name
    .normalize('NFD') // Normaliser les accents
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
    .replace(/[^a-zA-Z0-9\-_]/g, '_') // Remplacer caractères spéciaux
    .replace(/_+/g, '_') // Réduire underscores multiples
    .replace(/^_|_$/g, '') // Supprimer underscores début/fin
    .substring(0, 100); // Limiter longueur

  // Ajouter timestamp pour unicité
  const timestamp = Date.now();

  return `${safeName}-${timestamp}${ext}`;
}

/**
 * Vérifie si un fichier est potentiellement dangereux
 * @param {string} filename - Nom du fichier
 * @returns {boolean} - True si dangereux
 */
export function isDangerousFile(filename) {
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.scr',
    '.js', '.vbs', '.jar', '.app', '.deb', '.rpm',
    '.sh', '.bash', '.ps1', '.msi', '.dll',
    '.sys', '.drv', '.ocx'
  ];

  const ext = extname(filename).toLowerCase();
  return dangerousExtensions.includes(ext);
}

/**
 * Scanne un fichier pour détecter des patterns suspects
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<Object>} - {safe: boolean, threats: Array}
 */
export async function scanFileForThreats(filePath) {
  try {
    const threats = [];

    // Vérifier extension dangereuse
    if (isDangerousFile(filePath)) {
      threats.push({
        type: 'dangerous_extension',
        severity: 'high',
        message: 'Extension de fichier potentiellement dangereuse'
      });
    }

    // Lire le contenu pour rechercher des patterns suspects
    const content = await readFile(filePath, 'utf-8').catch(() => null);

    if (content) {
      // Patterns suspects dans le contenu
      const suspiciousPatterns = [
        { pattern: /<script/i, type: 'xss', message: 'Balise script détectée' },
        { pattern: /eval\s*\(/i, type: 'code_injection', message: 'eval() détecté' },
        { pattern: /base64_decode/i, type: 'obfuscation', message: 'Décodage base64 détecté' },
        { pattern: /\$\(.*\)/g, type: 'jquery_injection', message: 'Injection jQuery potentielle' },
        { pattern: /on(load|error|click|mouse)/i, type: 'event_handler', message: 'Gestionnaire d\'événement suspect' }
      ];

      for (const { pattern, type, message } of suspiciousPatterns) {
        if (pattern.test(content)) {
          threats.push({
            type,
            severity: 'medium',
            message
          });
        }
      }
    }

    return {
      safe: threats.length === 0,
      threats
    };
  } catch (error) {
    console.error('Erreur scan fichier:', error);
    return {
      safe: false,
      threats: [{
        type: 'scan_error',
        severity: 'low',
        message: 'Impossible de scanner le fichier'
      }]
    };
  }
}

/**
 * Calcule un quota d'espace disque utilisé par un utilisateur
 * @param {string} uploadDir - Dossier d'uploads
 * @param {string} userId - ID utilisateur (pour usage futur)
 * @returns {Promise<Object>} - {totalSize: number, fileCount: number}
 */
export async function calculateUserQuota(uploadDir, userId = 'default') {
  try {
    const { readdir, stat } = await import('fs/promises');
    const { join } = await import('path');

    const files = await readdir(uploadDir);
    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      try {
        const filePath = join(uploadDir, file);
        const stats = await stat(filePath);

        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
        }
      } catch (error) {
        // Ignorer les fichiers inaccessibles
      }
    }

    return {
      totalSize,
      fileCount,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    console.error('Erreur calcul quota:', error);
    return { totalSize: 0, fileCount: 0, totalSizeMB: '0.00' };
  }
}

/**
 * Vérifie si un quota est dépassé
 * @param {number} currentSize - Taille actuelle en bytes
 * @param {number} maxQuota - Quota maximum en bytes
 * @returns {boolean} - True si quota dépassé
 */
export function isQuotaExceeded(currentSize, maxQuota) {
  return currentSize >= maxQuota;
}

/**
 * Configuration de sécurité par défaut pour Multer
 */
export const secureMulterConfig = {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 10, // Max 10 fichiers simultanés
    fields: 20, // Max 20 champs
    parts: 30 // Max 30 parts
  },
  fileFilter: (req, file, cb) => {
    // Vérifier extension
    const ext = extname(file.originalname).toLowerCase();
    const allowedExtensions = Object.keys(ALLOWED_MIME_TYPES);

    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`Extension non autorisée: ${ext}`), false);
    }

    // Vérifier fichier dangereux
    if (isDangerousFile(file.originalname)) {
      return cb(new Error('Type de fichier dangereux détecté'), false);
    }

    cb(null, true);
  }
};

export default {
  detectRealMimeType,
  validateUploadedFile,
  sanitizeFilename,
  isDangerousFile,
  scanFileForThreats,
  calculateUserQuota,
  isQuotaExceeded,
  secureMulterConfig,
  ALLOWED_MIME_TYPES
};
