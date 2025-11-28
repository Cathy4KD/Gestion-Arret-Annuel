/**
 * Script de vérification de santé du système
 * Vérifie que tous les composants sont en place et fonctionnels
 *
 * Usage: node server/scripts/health-check.js [--verbose]
 */

import { existsSync } from 'fs';
import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

/**
 * Log un succès
 */
function logSuccess(message) {
  stats.total++;
  stats.passed++;
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

/**
 * Log un échec
 */
function logFailure(message, details = '') {
  stats.total++;
  stats.failed++;
  console.log(`${colors.red}✗${colors.reset} ${message}`);
  if (details) {
    console.log(`  ${colors.red}→ ${details}${colors.reset}`);
  }
}

/**
 * Log un avertissement
 */
function logWarning(message, details = '') {
  stats.total++;
  stats.warnings++;
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
  if (details) {
    console.log(`  ${colors.yellow}→ ${details}${colors.reset}`);
  }
}

/**
 * Affiche une section
 */
function logSection(title) {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}━━━ ${title} ━━━${colors.reset}`);
  console.log('');
}

/**
 * Convertit bytes en format lisible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Vérifie l'existence d'un dossier
 */
function checkDirectory(path, name, critical = true) {
  const exists = existsSync(path);
  if (exists) {
    logSuccess(name);
  } else {
    if (critical) {
      logFailure(name, `Dossier manquant: ${path}`);
    } else {
      logWarning(name, `Dossier manquant (optionnel): ${path}`);
    }
  }
  return exists;
}

/**
 * Vérifie l'existence d'un fichier
 */
function checkFile(path, name, critical = true) {
  const exists = existsSync(path);
  if (exists) {
    logSuccess(name);
  } else {
    if (critical) {
      logFailure(name, `Fichier manquant: ${path}`);
    } else {
      logWarning(name, `Fichier manquant (optionnel): ${path}`);
    }
  }
  return exists;
}

/**
 * Vérifie la structure des dossiers
 */
function checkDirectoryStructure(rootPath) {
  logSection('📁 Structure des dossiers');

  // Dossiers serveur (critiques)
  checkDirectory(join(rootPath, 'server'), 'server/');
  checkDirectory(join(rootPath, 'server', 'config'), 'server/config/');
  checkDirectory(join(rootPath, 'server', 'data'), 'server/data/');
  checkDirectory(join(rootPath, 'server', 'middleware'), 'server/middleware/');
  checkDirectory(join(rootPath, 'server', 'routes'), 'server/routes/');
  checkDirectory(join(rootPath, 'server', 'services'), 'server/services/');
  checkDirectory(join(rootPath, 'server', 'socket'), 'server/socket/');
  checkDirectory(join(rootPath, 'server', 'utils'), 'server/utils/');
  checkDirectory(join(rootPath, 'server', 'scripts'), 'server/scripts/');

  // Dossiers client (critiques)
  checkDirectory(join(rootPath, 'client'), 'client/');
  checkDirectory(join(rootPath, 'client', 'js'), 'client/js/');
  checkDirectory(join(rootPath, 'client', 'js', 'modules'), 'client/js/modules/');
  checkDirectory(join(rootPath, 'client', 'css'), 'client/css/');
  checkDirectory(join(rootPath, 'client', 'components'), 'client/components/');

  // Dossiers runtime (optionnels mais recommandés)
  checkDirectory(join(rootPath, 'server', 'data', 'backups'), 'server/data/backups/', false);
  checkDirectory(join(rootPath, 'server', 'data', 'backups-daily'), 'server/data/backups-daily/', false);
  checkDirectory(join(rootPath, 'server', 'uploads'), 'server/uploads/', false);
  checkDirectory(join(rootPath, 'logs'), 'logs/', false);
  checkDirectory(join(rootPath, 'generated-docs'), 'generated-docs/', false);
}

/**
 * Vérifie les fichiers critiques
 */
function checkCriticalFiles(rootPath) {
  logSection('📄 Fichiers critiques');

  checkFile(join(rootPath, 'package.json'), 'package.json');
  checkFile(join(rootPath, '.gitignore'), '.gitignore');
  checkFile(join(rootPath, 'README.md'), 'README.md');
  checkFile(join(rootPath, 'server', 'server.js'), 'server/server.js');
  checkFile(join(rootPath, 'server', 'config', 'index.js'), 'server/config/index.js');
  checkFile(join(rootPath, 'client', 'index.html'), 'client/index.html');
  checkFile(join(rootPath, 'client', 'js', 'app.js'), 'client/js/app.js');
  checkFile(join(rootPath, 'server', 'data', 'application-data.json'), 'server/data/application-data.json');
  checkFile(join(rootPath, '.env.example'), '.env.example', false);
}

/**
 * Vérifie la configuration package.json
 */
async function checkPackageJson(rootPath) {
  logSection('📦 Configuration package.json');

  const packagePath = join(rootPath, 'package.json');

  try {
    const content = await readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    // Vérifier le type module
    if (pkg.type === 'module') {
      logSuccess('Type ES Modules (type: "module")');
    } else {
      logWarning('Type ES Modules', 'Devrait être "module"');
    }

    // Vérifier les scripts
    const requiredScripts = ['start', 'dev', 'test', 'build'];
    requiredScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        logSuccess(`Script "${script}"`);
      } else {
        logWarning(`Script "${script}"`, 'Script manquant');
      }
    });

    // Vérifier les dépendances critiques
    const criticalDeps = ['express', 'socket.io', 'winston', 'joi'];
    criticalDeps.forEach(dep => {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        logSuccess(`Dépendance "${dep}"`);
      } else {
        logFailure(`Dépendance "${dep}"`, 'Dépendance critique manquante');
      }
    });

  } catch (error) {
    logFailure('Lecture package.json', error.message);
  }
}

/**
 * Vérifie les dépendances Node.js
 */
async function checkDependencies(rootPath) {
  logSection('📚 Dépendances Node.js');

  const nodeModulesPath = join(rootPath, 'node_modules');

  if (existsSync(nodeModulesPath)) {
    logSuccess('node_modules/ existe');

    try {
      // Compter les packages installés
      const packages = await readdir(nodeModulesPath);
      const count = packages.filter(p => !p.startsWith('.')).length;
      logSuccess(`${count} packages installés`);
    } catch (error) {
      logWarning('Lecture node_modules/', error.message);
    }
  } else {
    logFailure('node_modules/', 'Exécutez "npm install"');
  }

  // Vérifier les vulnérabilités
  try {
    const auditOutput = execSync('npm audit --json', {
      cwd: rootPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const audit = JSON.parse(auditOutput);

    if (audit.metadata && audit.metadata.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities;
      const total = vulns.critical + vulns.high + vulns.moderate + vulns.low;

      if (total === 0) {
        logSuccess('Aucune vulnérabilité npm');
      } else if (vulns.critical > 0 || vulns.high > 0) {
        logFailure('Vulnérabilités npm', `${vulns.critical} critiques, ${vulns.high} élevées`);
      } else {
        logWarning('Vulnérabilités npm', `${vulns.moderate} modérées, ${vulns.low} faibles`);
      }
    }
  } catch (error) {
    logWarning('Audit npm', 'Impossible de vérifier les vulnérabilités');
  }
}

/**
 * Vérifie l'espace disque
 */
async function checkDiskSpace(rootPath) {
  logSection('💾 Espace disque');

  try {
    // Taille du dossier de données
    const dataPath = join(rootPath, 'server', 'data');
    if (existsSync(dataPath)) {
      const dataSize = await getFolderSize(dataPath);
      logSuccess(`Données: ${formatBytes(dataSize)}`);

      if (dataSize > 1024 * 1024 * 1024) { // > 1 GB
        logWarning('Données volumineuses', 'Considérez un nettoyage');
      }
    }

    // Taille des backups
    const backupsPath = join(rootPath, 'server', 'data', 'backups');
    if (existsSync(backupsPath)) {
      const backupsSize = await getFolderSize(backupsPath);
      logSuccess(`Backups incrémentaux: ${formatBytes(backupsSize)}`);

      if (backupsSize > 500 * 1024 * 1024) { // > 500 MB
        logWarning('Backups volumineux', 'Exécutez "npm run clean"');
      }
    }

    const backupsDailyPath = join(rootPath, 'server', 'data', 'backups-daily');
    if (existsSync(backupsDailyPath)) {
      const backupsDailySize = await getFolderSize(backupsDailyPath);
      logSuccess(`Backups quotidiens: ${formatBytes(backupsDailySize)}`);
    }

    // Taille des logs
    const logsPath = join(rootPath, 'logs');
    if (existsSync(logsPath)) {
      const logsSize = await getFolderSize(logsPath);
      logSuccess(`Logs: ${formatBytes(logsSize)}`);

      if (logsSize > 100 * 1024 * 1024) { // > 100 MB
        logWarning('Logs volumineux', 'Exécutez "npm run clean"');
      }
    }

    // Taille des uploads
    const uploadsPath = join(rootPath, 'server', 'uploads');
    if (existsSync(uploadsPath)) {
      const uploadsSize = await getFolderSize(uploadsPath);
      logSuccess(`Uploads: ${formatBytes(uploadsSize)}`);
    }

  } catch (error) {
    logWarning('Vérification espace disque', error.message);
  }
}

/**
 * Calcule la taille d'un dossier récursivement
 */
async function getFolderSize(folderPath) {
  let totalSize = 0;

  try {
    const files = await readdir(folderPath);

    for (const file of files) {
      const filePath = join(folderPath, file);
      try {
        const fileStat = await stat(filePath);

        if (fileStat.isDirectory()) {
          totalSize += await getFolderSize(filePath);
        } else {
          totalSize += fileStat.size;
        }
      } catch (error) {
        // Ignorer les erreurs pour les fichiers inaccessibles
      }
    }
  } catch (error) {
    // Ignorer les erreurs
  }

  return totalSize;
}

/**
 * Vérifie la sécurité
 */
async function checkSecurity(rootPath) {
  logSection('🔒 Sécurité');

  // Vérifier .gitignore
  const gitignorePath = join(rootPath, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = await readFile(gitignorePath, 'utf-8');

    const criticalEntries = ['node_modules/', '.env', 'logs/'];
    let allPresent = true;

    criticalEntries.forEach(entry => {
      if (!gitignore.includes(entry)) {
        allPresent = false;
      }
    });

    if (allPresent) {
      logSuccess('.gitignore complet');
    } else {
      logWarning('.gitignore', 'Certaines entrées critiques manquent');
    }
  }

  // Vérifier que .env n'est pas commité
  const envPath = join(rootPath, '.env');
  if (existsSync(envPath)) {
    logWarning('Fichier .env présent', 'Assurez-vous qu\'il est dans .gitignore');
  } else {
    logSuccess('Pas de fichier .env (OK pour dev)');
  }

  // Vérifier les middleware de sécurité
  checkFile(join(rootPath, 'server', 'middleware', 'security.js'), 'Middleware de sécurité');
  checkFile(join(rootPath, 'server', 'utils', 'file-security.js'), 'Sécurité des fichiers');
  checkFile(join(rootPath, 'server', 'middleware', 'errorHandler.js'), 'Gestionnaire d\'erreurs');
}

/**
 * Vérifie la documentation
 */
function checkDocumentation(rootPath) {
  logSection('📚 Documentation');

  const docs = [
    'README.md',
    'docs/README.md',
    'docs/maintenance/SECURITY.md',
    'docs/guides/GUIDE-DEVELOPPEMENT.md',
    'docs/guides/GUIDE-TESTS.md',
    'docs/architecture/MODULES.md',
    'docs/rapports/CHANGELOG.md'
  ];

  docs.forEach(doc => {
    checkFile(join(rootPath, doc), doc, false);
  });
}

/**
 * Affiche le résumé
 */
function displaySummary() {
  console.log('');
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}               RÉSUMÉ DE LA SANTÉ${colors.reset}`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');
  console.log(`Total:          ${stats.total} vérifications`);
  console.log(`${colors.green}Réussis:        ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Échoués:        ${stats.failed}${colors.reset}`);
  console.log(`${colors.yellow}Avertissements: ${stats.warnings}${colors.reset}`);
  console.log('');

  const healthScore = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  console.log(`${colors.bright}Score de santé: ${healthScore}%${colors.reset}`);
  console.log('');

  if (stats.failed === 0 && stats.warnings === 0) {
    console.log(`${colors.green}${colors.bright}✓ SYSTÈME EN PARFAITE SANTÉ${colors.reset}`);
  } else if (stats.failed === 0) {
    console.log(`${colors.yellow}${colors.bright}⚠ Système sain avec quelques avertissements${colors.reset}`);
  } else if (stats.failed <= 3) {
    console.log(`${colors.yellow}${colors.bright}⚠ Problèmes mineurs détectés${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ PROBLÈMES CRITIQUES DÉTECTÉS${colors.reset}`);
    console.log('');
    console.log('Actions recommandées:');
    console.log('  1. Vérifiez les fichiers et dossiers manquants');
    console.log('  2. Exécutez "npm install" si node_modules/ manque');
    console.log('  3. Consultez la documentation pour la configuration');
  }

  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');

  console.log('');
  console.log(`${colors.cyan}${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║   🏥 VÉRIFICATION DE SANTÉ DU SYSTÈME         ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}`);

  const rootPath = join(__dirname, '..', '..');

  try {
    checkDirectoryStructure(rootPath);
    checkCriticalFiles(rootPath);
    await checkPackageJson(rootPath);
    await checkDependencies(rootPath);
    await checkDiskSpace(rootPath);
    await checkSecurity(rootPath);
    checkDocumentation(rootPath);

    displaySummary();

    // Code de sortie basé sur le nombre d'échecs
    process.exit(stats.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error(`\n${colors.red}Erreur fatale:${colors.reset}`, error);
    process.exit(1);
  }
}

// Exécuter
main();
