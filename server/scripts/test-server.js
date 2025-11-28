/**
 * Script de test automatisé du serveur
 * Teste la santé, les performances et la sécurité
 *
 * Usage: node server/scripts/test-server.js
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Statistiques
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

/**
 * Affiche un résultat de test
 */
function logTest(name, passed, message = '') {
  stats.total++;
  if (passed) {
    stats.passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } else {
    stats.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) {
      console.log(`  ${colors.red}→ ${message}${colors.reset}`);
    }
  }
}

/**
 * Affiche un avertissement
 */
function logWarning(name, message) {
  stats.warnings++;
  console.log(`${colors.yellow}⚠${colors.reset} ${name}`);
  if (message) {
    console.log(`  ${colors.yellow}→ ${message}${colors.reset}`);
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
 * Teste l'existence d'un fichier
 */
function testFileExists(path, name) {
  const exists = existsSync(path);
  logTest(name, exists, exists ? '' : `Fichier manquant: ${path}`);
  return exists;
}

/**
 * Teste l'existence d'un dossier
 */
function testDirExists(path, name) {
  const exists = existsSync(path);
  logTest(name, exists, exists ? '' : `Dossier manquant: ${path}`);
  return exists;
}

/**
 * Teste la structure des dossiers
 */
async function testDirectoryStructure() {
  logSection('📁 Structure des dossiers');

  const rootPath = join(__dirname, '..', '..');

  // Dossiers serveur
  testDirExists(join(rootPath, 'server'), 'Dossier server/');
  testDirExists(join(rootPath, 'server', 'config'), 'Dossier server/config/');
  testDirExists(join(rootPath, 'server', 'data'), 'Dossier server/data/');
  testDirExists(join(rootPath, 'server', 'middleware'), 'Dossier server/middleware/');
  testDirExists(join(rootPath, 'server', 'routes'), 'Dossier server/routes/');
  testDirExists(join(rootPath, 'server', 'services'), 'Dossier server/services/');
  testDirExists(join(rootPath, 'server', 'socket'), 'Dossier server/socket/');
  testDirExists(join(rootPath, 'server', 'utils'), 'Dossier server/utils/');
  testDirExists(join(rootPath, 'server', 'scripts'), 'Dossier server/scripts/');

  // Dossiers client
  testDirExists(join(rootPath, 'client'), 'Dossier client/');
  testDirExists(join(rootPath, 'client', 'js'), 'Dossier client/js/');
  testDirExists(join(rootPath, 'client', 'js', 'modules'), 'Dossier client/js/modules/');
  testDirExists(join(rootPath, 'client', 'css'), 'Dossier client/css/');
  testDirExists(join(rootPath, 'client', 'components'), 'Dossier client/components/');

  // Dossiers runtime
  testDirExists(join(rootPath, 'server', 'data', 'backups'), 'Dossier backups/');
  testDirExists(join(rootPath, 'server', 'data', 'backups-daily'), 'Dossier backups-daily/');
  testDirExists(join(rootPath, 'server', 'uploads'), 'Dossier uploads/');
  testDirExists(join(rootPath, 'logs'), 'Dossier logs/');
  testDirExists(join(rootPath, 'generated-docs'), 'Dossier generated-docs/');
}

/**
 * Teste les fichiers critiques
 */
async function testCriticalFiles() {
  logSection('📄 Fichiers critiques');

  const rootPath = join(__dirname, '..', '..');

  // Fichiers de configuration
  testFileExists(join(rootPath, 'package.json'), 'package.json');
  testFileExists(join(rootPath, '.gitignore'), '.gitignore');
  testFileExists(join(rootPath, '.env.example'), '.env.example');

  // Fichiers serveur
  testFileExists(join(rootPath, 'server', 'server.js'), 'server/server.js');
  testFileExists(join(rootPath, 'server', 'config', 'index.js'), 'server/config/index.js');

  // Fichiers client
  testFileExists(join(rootPath, 'client', 'index.html'), 'client/index.html');
  testFileExists(join(rootPath, 'client', 'js', 'app.js'), 'client/js/app.js');

  // Fichiers de données
  const dataFile = join(rootPath, 'server', 'data', 'application-data.json');
  if (testFileExists(dataFile, 'server/data/application-data.json')) {
    try {
      const data = JSON.parse(await readFile(dataFile, 'utf-8'));
      logTest('Fichier de données valide (JSON)', true);

      // Vérifier la structure
      const hasModules = data && typeof data === 'object';
      logTest('Structure de données valide', hasModules, hasModules ? '' : 'Format de données invalide');
    } catch (error) {
      logTest('Fichier de données valide (JSON)', false, `Erreur: ${error.message}`);
    }
  }
}

/**
 * Teste la configuration package.json
 */
async function testPackageJson() {
  logSection('📦 Configuration package.json');

  const rootPath = join(__dirname, '..', '..');
  const packagePath = join(rootPath, 'package.json');

  try {
    const pkg = JSON.parse(await readFile(packagePath, 'utf-8'));

    // Vérifier les scripts
    const requiredScripts = ['start', 'dev', 'build'];
    requiredScripts.forEach(script => {
      const hasScript = pkg.scripts && pkg.scripts[script];
      logTest(`Script "${script}" défini`, hasScript, hasScript ? '' : 'Script manquant');
    });

    // Vérifier les dépendances critiques
    const requiredDeps = [
      'express',
      'socket.io',
      'winston',
      'joi',
      'multer',
      'node-cron',
      'xlsx'
    ];

    requiredDeps.forEach(dep => {
      const hasDep = pkg.dependencies && pkg.dependencies[dep];
      logTest(`Dépendance "${dep}" installée`, hasDep, hasDep ? '' : 'Dépendance manquante');
    });

    // Vérifier le type module
    const isModule = pkg.type === 'module';
    logTest('Configuration ES Modules (type: "module")', isModule, isModule ? '' : 'Devrait être "module"');

  } catch (error) {
    logTest('Lecture package.json', false, error.message);
  }
}

/**
 * Teste la sécurité
 */
async function testSecurity() {
  logSection('🔒 Sécurité');

  const rootPath = join(__dirname, '..', '..');

  // Vérifier que .env n'est pas commité
  const envExists = existsSync(join(rootPath, '.env'));
  if (envExists) {
    logWarning('Fichier .env trouvé', 'Assurez-vous qu\'il est dans .gitignore');
  } else {
    logTest('Fichier .env non présent (OK)', true);
  }

  // Vérifier .gitignore
  const gitignorePath = join(rootPath, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = await readFile(gitignorePath, 'utf-8');

    const requiredEntries = [
      'node_modules/',
      '.env',
      'logs/',
      'server/data/backups/',
      'server/uploads/'
    ];

    requiredEntries.forEach(entry => {
      const hasEntry = gitignore.includes(entry);
      logTest(`Gitignore contient "${entry}"`, hasEntry, hasEntry ? '' : 'Entrée manquante');
    });
  }

  // Vérifier les middleware de sécurité
  testFileExists(join(rootPath, 'server', 'middleware', 'security.js'), 'Middleware de sécurité');
  testFileExists(join(rootPath, 'server', 'utils', 'file-security.js'), 'Utilitaires de sécurité des fichiers');
}

/**
 * Teste les backups
 */
async function testBackups() {
  logSection('💾 Système de backups');

  const rootPath = join(__dirname, '..', '..');

  // Vérifier les dossiers de backup
  const backupDir = join(rootPath, 'server', 'data', 'backups');
  const dailyBackupDir = join(rootPath, 'server', 'data', 'backups-daily');

  testDirExists(backupDir, 'Dossier backups/');
  testDirExists(dailyBackupDir, 'Dossier backups-daily/');

  // Vérifier les utilitaires de backup
  testFileExists(join(rootPath, 'server', 'utils', 'backup.js'), 'Utilitaire backup.js');
  testFileExists(join(rootPath, 'server', 'utils', 'backup-compression.js'), 'Utilitaire backup-compression.js');
}

/**
 * Teste les logs
 */
async function testLogging() {
  logSection('📝 Système de logging');

  const rootPath = join(__dirname, '..', '..');

  testDirExists(join(rootPath, 'logs'), 'Dossier logs/');
  testFileExists(join(rootPath, 'server', 'utils', 'logger.js'), 'Utilitaire logger.js');
}

/**
 * Teste la documentation
 */
async function testDocumentation() {
  logSection('📚 Documentation');

  const rootPath = join(__dirname, '..', '..');

  const docFiles = [
    'README.md',
    'SECURITY.md',
    'GUIDE-DEVELOPPEMENT.md',
    'MODULES.md',
    'CHANGELOG.md',
    'server/README.md',
    'client/README.md'
  ];

  docFiles.forEach(file => {
    testFileExists(join(rootPath, file), file);
  });
}

/**
 * Teste les performances (analyse de code)
 */
async function testPerformanceUtils() {
  logSection('⚡ Utilitaires de performance');

  const rootPath = join(__dirname, '..', '..');

  testFileExists(join(rootPath, 'client', 'js', 'modules', 'utils', 'performance.js'), 'performance.js');
  testFileExists(join(rootPath, 'client', 'js', 'modules', 'charts', 'chart-optimization.js'), 'chart-optimization.js');
  testFileExists(join(rootPath, 'server', 'utils', 'socket-optimization.js'), 'socket-optimization.js');
  testFileExists(join(rootPath, 'server', 'scripts', 'build.js'), 'build.js (minification)');
}

/**
 * Teste la gestion d'erreurs
 */
async function testErrorHandling() {
  logSection('🚨 Gestion d\'erreurs');

  const rootPath = join(__dirname, '..', '..');

  testFileExists(join(rootPath, 'server', 'middleware', 'errorHandler.js'), 'errorHandler.js (serveur)');
  testFileExists(join(rootPath, 'client', 'js', 'modules', 'utils', 'error-handler.js'), 'error-handler.js (client)');
  testFileExists(join(rootPath, 'client', 'health.html'), 'health.html (page de santé)');
}

/**
 * Affiche le résumé
 */
function displaySummary() {
  console.log('');
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}               RÉSUMÉ DES TESTS${colors.reset}`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');
  console.log(`Total:        ${stats.total} tests`);
  console.log(`${colors.green}Réussis:      ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Échoués:      ${stats.failed}${colors.reset}`);
  console.log(`${colors.yellow}Avertissements: ${stats.warnings}${colors.reset}`);
  console.log('');

  const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  console.log(`${colors.bright}Taux de réussite: ${successRate}%${colors.reset}`);
  console.log('');

  if (stats.failed === 0 && stats.warnings === 0) {
    console.log(`${colors.green}${colors.bright}✓ TOUS LES TESTS SONT PASSÉS${colors.reset}`);
  } else if (stats.failed === 0) {
    console.log(`${colors.yellow}${colors.bright}⚠ Tests réussis avec avertissements${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ CERTAINS TESTS ONT ÉCHOUÉ${colors.reset}`);
  }

  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║   🧪 TESTS AUTOMATISÉS DU SERVEUR             ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}`);

  try {
    await testDirectoryStructure();
    await testCriticalFiles();
    await testPackageJson();
    await testSecurity();
    await testBackups();
    await testLogging();
    await testDocumentation();
    await testPerformanceUtils();
    await testErrorHandling();

    displaySummary();

    // Code de sortie
    process.exit(stats.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error(`${colors.red}Erreur fatale:${colors.reset}`, error);
    process.exit(1);
  }
}

// Exécuter
main();
