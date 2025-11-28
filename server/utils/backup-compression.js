/**
 * Utilitaires de compression pour les backups
 * Utilise gzip pour réduire la taille des fichiers de sauvegarde
 */

import { createGzip, createGunzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { readFile, writeFile, readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';

/**
 * Compresse un fichier avec gzip
 * @param {string} inputPath - Chemin du fichier à compresser
 * @param {string} outputPath - Chemin du fichier compressé (facultatif, ajoute .gz par défaut)
 * @returns {Promise<Object>} - Infos sur la compression
 */
export async function compressFile(inputPath, outputPath = null) {
  const output = outputPath || `${inputPath}.gz`;

  try {
    const startTime = Date.now();
    const inputStats = await stat(inputPath);
    const originalSize = inputStats.size;

    // Créer les streams
    const gzip = createGzip({ level: 9 }); // Compression maximale
    const source = createReadStream(inputPath);
    const destination = createWriteStream(output);

    // Compresser
    await pipeline(source, gzip, destination);

    // Statistiques
    const outputStats = await stat(output);
    const compressedSize = outputStats.size;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
    const duration = Date.now() - startTime;

    return {
      success: true,
      inputPath,
      outputPath: output,
      originalSize,
      compressedSize,
      ratio: parseFloat(ratio),
      savedBytes: originalSize - compressedSize,
      duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      inputPath,
      outputPath: output
    };
  }
}

/**
 * Décompresse un fichier gzip
 * @param {string} inputPath - Chemin du fichier .gz
 * @param {string} outputPath - Chemin du fichier décompressé
 * @returns {Promise<Object>} - Infos sur la décompression
 */
export async function decompressFile(inputPath, outputPath) {
  try {
    const startTime = Date.now();

    // Créer les streams
    const gunzip = createGunzip();
    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    // Décompresser
    await pipeline(source, gunzip, destination);

    const duration = Date.now() - startTime;
    const stats = await stat(outputPath);

    return {
      success: true,
      inputPath,
      outputPath,
      size: stats.size,
      duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      inputPath,
      outputPath
    };
  }
}

/**
 * Compresse tous les backups JSON d'un dossier
 * @param {string} backupDir - Dossier contenant les backups
 * @param {boolean} deleteOriginal - Supprimer les fichiers originaux après compression
 * @returns {Promise<Object>} - Statistiques de compression
 */
export async function compressBackupDirectory(backupDir, deleteOriginal = false) {
  try {
    const files = await readdir(backupDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'));

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let filesProcessed = 0;
    let errors = [];

    for (const file of jsonFiles) {
      const filePath = join(backupDir, file);

      try {
        const result = await compressFile(filePath);

        if (result.success) {
          totalOriginalSize += result.originalSize;
          totalCompressedSize += result.compressedSize;
          filesProcessed++;

          console.log(`✓ ${file}: ${(result.originalSize / 1024).toFixed(1)}KB → ${(result.compressedSize / 1024).toFixed(1)}KB (${result.ratio}%)`);

          // Supprimer l'original si demandé
          if (deleteOriginal) {
            await unlink(filePath);
          }
        } else {
          errors.push({ file, error: result.error });
        }
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    }

    const totalRatio = totalOriginalSize > 0
      ? ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(2)
      : 0;

    return {
      success: true,
      filesProcessed,
      totalOriginalSize,
      totalCompressedSize,
      totalSavedBytes: totalOriginalSize - totalCompressedSize,
      ratio: parseFloat(totalRatio),
      errors
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Nettoie les anciens backups en gardant seulement les N plus récents
 * Compatible avec fichiers .json et .json.gz
 * @param {string} backupDir - Dossier des backups
 * @param {number} maxBackups - Nombre maximum de backups à garder
 * @param {string} pattern - Pattern des fichiers (ex: 'application-data-')
 * @returns {Promise<Object>} - Statistiques de nettoyage
 */
export async function cleanupOldBackups(backupDir, maxBackups, pattern = 'application-data-') {
  try {
    const files = await readdir(backupDir);

    // Trouver tous les backups (JSON ou GZ)
    const backupFiles = files
      .filter(f => f.startsWith(pattern) && (f.endsWith('.json') || f.endsWith('.json.gz')))
      .map(f => ({
        name: f,
        path: join(backupDir, f),
        // Extraire le timestamp pour le tri
        timestamp: f.replace(pattern, '').replace('.json.gz', '').replace('.json', '')
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Plus récent en premier

    const filesToDelete = backupFiles.slice(maxBackups);
    let deletedCount = 0;
    let freedBytes = 0;

    for (const file of filesToDelete) {
      try {
        const stats = await stat(file.path);
        freedBytes += stats.size;
        await unlink(file.path);
        deletedCount++;
        console.log(`🗑️  ${file.name}`);
      } catch (error) {
        console.error(`Erreur suppression ${file.name}:`, error.message);
      }
    }

    return {
      success: true,
      totalFiles: backupFiles.length,
      keptFiles: backupFiles.length - deletedCount,
      deletedFiles: deletedCount,
      freedBytes,
      freedMB: (freedBytes / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Optimise un fichier JSON en supprimant les champs null et les espaces inutiles
 * @param {string} inputPath - Chemin du fichier JSON
 * @param {string} outputPath - Chemin de sortie (facultatif)
 * @returns {Promise<Object>} - Infos sur l'optimisation
 */
export async function optimizeJSON(inputPath, outputPath = null) {
  try {
    const output = outputPath || inputPath;
    const startTime = Date.now();

    // Lire le fichier
    const content = await readFile(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(content, 'utf-8');

    // Parser et nettoyer
    const data = JSON.parse(content);
    const cleaned = removeNullValues(data);

    // Sérialiser sans espaces (minifié)
    const optimized = JSON.stringify(cleaned);
    const optimizedSize = Buffer.byteLength(optimized, 'utf-8');

    // Sauvegarder
    await writeFile(output, optimized, 'utf-8');

    const savedBytes = originalSize - optimizedSize;
    const ratio = ((savedBytes / originalSize) * 100).toFixed(2);
    const duration = Date.now() - startTime;

    return {
      success: true,
      inputPath,
      outputPath: output,
      originalSize,
      optimizedSize,
      savedBytes,
      ratio: parseFloat(ratio),
      duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      inputPath
    };
  }
}

/**
 * Supprime récursivement les valeurs null et undefined d'un objet
 * @param {*} obj - Objet à nettoyer
 * @returns {*} - Objet nettoyé
 */
function removeNullValues(obj) {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(item => removeNullValues(item))
      .filter(item => item !== undefined);
  }

  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeNullValues(value);
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Obtient les statistiques d'un dossier de backups
 * @param {string} backupDir - Dossier des backups
 * @returns {Promise<Object>} - Statistiques
 */
export async function getBackupStats(backupDir) {
  try {
    const files = await readdir(backupDir);

    let totalSize = 0;
    let jsonCount = 0;
    let gzCount = 0;

    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.json.gz')) {
        const filePath = join(backupDir, file);
        const stats = await stat(filePath);
        totalSize += stats.size;

        if (file.endsWith('.json.gz')) {
          gzCount++;
        } else if (file.endsWith('.json')) {
          jsonCount++;
        }
      }
    }

    return {
      success: true,
      totalFiles: jsonCount + gzCount,
      jsonFiles: jsonCount,
      gzFiles: gzCount,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      avgFileSizeMB: ((totalSize / (jsonCount + gzCount)) / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  compressFile,
  decompressFile,
  compressBackupDirectory,
  cleanupOldBackups,
  optimizeJSON,
  getBackupStats
};
