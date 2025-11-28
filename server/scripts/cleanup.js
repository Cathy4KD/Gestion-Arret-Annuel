/**
 * Script de nettoyage automatique
 * Supprime les fichiers anciens (logs, backups, uploads, documents)
 *
 * Usage: node server/scripts/cleanup.js [--dry-run] [--force]
 *
 * Options:
 *   --dry-run : Affiche ce qui serait supprimé sans rien supprimer
 *   --force   : Supprime sans demander confirmation
 */

import { readdir, stat, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration par défaut (en jours)
const CONFIG = {
  logs: 30,              // Supprimer logs > 30 jours
  backupsDaily: 30,      // Supprimer backups quotidiens > 30 jours
  backupsIncremental: 7, // Supprimer backups 5min > 7 jours
  uploads: 90,           // Supprimer uploads > 90 jours (optionnel)
  generatedDocs: 90      // Supprimer avis syndicaux > 90 jours (optionnel)
};

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

// Statistiques
const stats = {
  logsDeleted: 0,
  backupsDailyDeleted: 0,
  backupsIncrementalDeleted: 0,
  uploadsDeleted: 0,
  docsDeleted: 0,
  totalSizeFreed: 0
};

/**
 * Convertit bytes en format lisible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Demande confirmation à l'utilisateur
 */
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (o/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'o' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Supprime les fichiers anciens d'un dossier
 */
async function cleanupDirectory(dirPath, maxAgeDays, filePattern = null, dryRun = false) {
  if (!existsSync(dirPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} Dossier non trouvé: ${dirPath}`);
    return { count: 0, size: 0 };
  }

  const now = Date.now();
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convert to milliseconds

  let deletedCount = 0;
  let deletedSize = 0;

  try {
    const files = await readdir(dirPath);

    for (const file of files) {
      const filePath = join(dirPath, file);

      try {
        const fileStat = await stat(filePath);

        // Vérifier le pattern si spécifié
        if (filePattern && !filePattern.test(file)) {
          continue;
        }

        // Vérifier l'âge du fichier
        const fileAge = now - fileStat.mtimeMs;

        if (fileAge > maxAge) {
          if (dryRun) {
            console.log(`  ${colors.yellow}[DRY-RUN]${colors.reset} Supprimerait: ${file} (${formatBytes(fileStat.size)})`);
          } else {
            await unlink(filePath);
            console.log(`  ${colors.green}✓${colors.reset} Supprimé: ${file} (${formatBytes(fileStat.size)})`);
          }
          deletedCount++;
          deletedSize += fileStat.size;
        }
      } catch (error) {
        console.error(`  ${colors.red}✗${colors.reset} Erreur avec ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la lecture de ${dirPath}:${colors.reset}`, error.message);
  }

  return { count: deletedCount, size: deletedSize };
}

/**
 * Nettoie les logs
 */
async function cleanupLogs(dryRun = false) {
  console.log(`\n${colors.cyan}📝 Nettoyage des logs...${colors.reset}`);
  console.log(`   Critère: > ${CONFIG.logs} jours`);

  const rootPath = join(__dirname, '..', '..');
  const logsPath = join(rootPath, 'logs');

  const result = await cleanupDirectory(logsPath, CONFIG.logs, /\.(log|log\.gz)$/, dryRun);

  stats.logsDeleted = result.count;
  stats.totalSizeFreed += result.size;

  console.log(`   ${colors.bright}${result.count} fichiers${colors.reset} (${formatBytes(result.size)})`);
}

/**
 * Nettoie les backups quotidiens
 */
async function cleanupBackupsDaily(dryRun = false) {
  console.log(`\n${colors.cyan}💾 Nettoyage des backups quotidiens...${colors.reset}`);
  console.log(`   Critère: > ${CONFIG.backupsDaily} jours`);

  const rootPath = join(__dirname, '..', '..');
  const backupsPath = join(rootPath, 'server', 'data', 'backups-daily');

  const result = await cleanupDirectory(backupsPath, CONFIG.backupsDaily, /backup-.*\.(json|json\.gz)$/, dryRun);

  stats.backupsDailyDeleted = result.count;
  stats.totalSizeFreed += result.size;

  console.log(`   ${colors.bright}${result.count} fichiers${colors.reset} (${formatBytes(result.size)})`);
}

/**
 * Nettoie les backups incrémentaux (5 min)
 */
async function cleanupBackupsIncremental(dryRun = false) {
  console.log(`\n${colors.cyan}💾 Nettoyage des backups incrémentaux (5 min)...${colors.reset}`);
  console.log(`   Critère: > ${CONFIG.backupsIncremental} jours`);

  const rootPath = join(__dirname, '..', '..');
  const backupsPath = join(rootPath, 'server', 'data', 'backups');

  const result = await cleanupDirectory(backupsPath, CONFIG.backupsIncremental, /backup-.*\.(json|json\.gz)$/, dryRun);

  stats.backupsIncrementalDeleted = result.count;
  stats.totalSizeFreed += result.size;

  console.log(`   ${colors.bright}${result.count} fichiers${colors.reset} (${formatBytes(result.size)})`);
}

/**
 * Nettoie les fichiers uploadés
 */
async function cleanupUploads(dryRun = false) {
  console.log(`\n${colors.cyan}📎 Nettoyage des fichiers uploadés...${colors.reset}`);
  console.log(`   Critère: > ${CONFIG.uploads} jours`);

  const rootPath = join(__dirname, '..', '..');
  const uploadsPath = join(rootPath, 'server', 'uploads');

  const result = await cleanupDirectory(uploadsPath, CONFIG.uploads, null, dryRun);

  stats.uploadsDeleted = result.count;
  stats.totalSizeFreed += result.size;

  console.log(`   ${colors.bright}${result.count} fichiers${colors.reset} (${formatBytes(result.size)})`);
}

/**
 * Nettoie les documents générés (avis syndicaux)
 */
async function cleanupGeneratedDocs(dryRun = false) {
  console.log(`\n${colors.cyan}📄 Nettoyage des documents générés...${colors.reset}`);
  console.log(`   Critère: > ${CONFIG.generatedDocs} jours`);

  const rootPath = join(__dirname, '..', '..');
  const docsPath = join(rootPath, 'generated-docs');

  const result = await cleanupDirectory(docsPath, CONFIG.generatedDocs, /\.(docx|pdf)$/, dryRun);

  stats.docsDeleted = result.count;
  stats.totalSizeFreed += result.size;

  console.log(`   ${colors.bright}${result.count} fichiers${colors.reset} (${formatBytes(result.size)})`);
}

/**
 * Affiche le résumé
 */
function displaySummary(dryRun = false) {
  console.log('');
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}               RÉSUMÉ DU NETTOYAGE${colors.reset}`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');

  if (dryRun) {
    console.log(`${colors.yellow}${colors.bright}MODE DRY-RUN${colors.reset} - Aucun fichier n'a été supprimé`);
    console.log('');
  }

  console.log(`Logs:                  ${stats.logsDeleted} fichiers`);
  console.log(`Backups quotidiens:    ${stats.backupsDailyDeleted} fichiers`);
  console.log(`Backups incrémentaux:  ${stats.backupsIncrementalDeleted} fichiers`);
  console.log(`Fichiers uploadés:     ${stats.uploadsDeleted} fichiers`);
  console.log(`Documents générés:     ${stats.docsDeleted} fichiers`);
  console.log('');
  console.log(`${colors.bright}Total espace libéré:   ${formatBytes(stats.totalSizeFreed)}${colors.reset}`);
  console.log('');

  const totalFiles = stats.logsDeleted + stats.backupsDailyDeleted +
                     stats.backupsIncrementalDeleted + stats.uploadsDeleted +
                     stats.docsDeleted;

  if (totalFiles === 0) {
    console.log(`${colors.green}✓ Aucun fichier à nettoyer${colors.reset}`);
  } else if (dryRun) {
    console.log(`${colors.yellow}ℹ Relancez sans --dry-run pour effectuer le nettoyage${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Nettoyage terminé avec succès${colors.reset}`);
  }
  console.log('');
}

/**
 * Affiche l'aide
 */
function displayHelp() {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}Script de nettoyage automatique${colors.reset}`);
  console.log('');
  console.log('Usage: node server/scripts/cleanup.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run    Affiche ce qui serait supprimé sans rien supprimer');
  console.log('  --force      Supprime sans demander confirmation');
  console.log('  --help       Affiche cette aide');
  console.log('');
  console.log('Configuration par défaut:');
  console.log(`  Logs:                  > ${CONFIG.logs} jours`);
  console.log(`  Backups quotidiens:    > ${CONFIG.backupsDaily} jours`);
  console.log(`  Backups incrémentaux:  > ${CONFIG.backupsIncremental} jours`);
  console.log(`  Fichiers uploadés:     > ${CONFIG.uploads} jours`);
  console.log(`  Documents générés:     > ${CONFIG.generatedDocs} jours`);
  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const help = args.includes('--help');

  if (help) {
    displayHelp();
    return;
  }

  console.log('');
  console.log(`${colors.cyan}${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║   🧹 NETTOYAGE AUTOMATIQUE                     ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}`);

  if (dryRun) {
    console.log('');
    console.log(`${colors.yellow}${colors.bright}MODE DRY-RUN${colors.reset} - Aucun fichier ne sera supprimé`);
  }

  // Demander confirmation si pas en mode force ou dry-run
  if (!dryRun && !force) {
    console.log('');
    console.log('Ce script va supprimer:');
    console.log(`  - Logs de plus de ${CONFIG.logs} jours`);
    console.log(`  - Backups quotidiens de plus de ${CONFIG.backupsDaily} jours`);
    console.log(`  - Backups incrémentaux de plus de ${CONFIG.backupsIncremental} jours`);
    console.log(`  - Fichiers uploadés de plus de ${CONFIG.uploads} jours`);
    console.log(`  - Documents générés de plus de ${CONFIG.generatedDocs} jours`);
    console.log('');

    const confirmed = await confirm('Voulez-vous continuer ?');

    if (!confirmed) {
      console.log('');
      console.log(`${colors.yellow}Nettoyage annulé${colors.reset}`);
      console.log('');
      return;
    }
  }

  try {
    await cleanupLogs(dryRun);
    await cleanupBackupsDaily(dryRun);
    await cleanupBackupsIncremental(dryRun);
    await cleanupUploads(dryRun);
    await cleanupGeneratedDocs(dryRun);

    displaySummary(dryRun);

  } catch (error) {
    console.error(`\n${colors.red}Erreur fatale:${colors.reset}`, error);
    process.exit(1);
  }
}

// Exécuter
main();
