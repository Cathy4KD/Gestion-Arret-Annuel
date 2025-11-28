/**
 * Script de migration de données
 * Permet de transformer les données de l'ancienne version vers la nouvelle
 *
 * Usage: node server/scripts/migrate.js [version] [--dry-run] [--force]
 *
 * Exemples:
 *   node server/scripts/migrate.js 1.1.0         # Migrer vers version 1.1.0
 *   node server/scripts/migrate.js 1.1.0 --dry-run  # Tester sans modifier
 *   node server/scripts/migrate.js 1.1.0 --force    # Sans confirmation
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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
 * Crée un backup avant migration
 */
async function createBackup(dataPath) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupPath = join(
    dirname(dataPath),
    'backups',
    `backup-before-migration-${timestamp}.json`
  );

  try {
    const data = await readFile(dataPath, 'utf-8');
    await writeFile(backupPath, data, 'utf-8');
    console.log(`${colors.green}✓${colors.reset} Backup créé: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Erreur lors du backup:`, error.message);
    throw error;
  }
}

/**
 * Migration vers 1.1.0
 * Exemple: Ajouter un champ "version" à tous les modules
 */
function migrate_1_1_0(data) {
  console.log(`\n${colors.cyan}Migration vers 1.1.0...${colors.reset}`);

  let changesCount = 0;

  // Ajouter le champ version si manquant
  if (!data.version) {
    data.version = '1.1.0';
    changesCount++;
    console.log(`  ${colors.green}✓${colors.reset} Ajout du champ "version"`);
  }

  // Ajouter dateCreation et dateModification aux tâches si manquantes
  if (data.taches && Array.isArray(data.taches)) {
    data.taches.forEach((tache, index) => {
      let modified = false;

      if (!tache.dateCreation) {
        tache.dateCreation = new Date().toISOString();
        modified = true;
      }

      if (!tache.dateModification) {
        tache.dateModification = new Date().toISOString();
        modified = true;
      }

      if (modified) {
        changesCount++;
      }
    });

    if (changesCount > 1) {
      console.log(`  ${colors.green}✓${colors.reset} Ajout des dates aux tâches`);
    }
  }

  // Ajouter statut par défaut si manquant
  if (data.ordres && Array.isArray(data.ordres)) {
    data.ordres.forEach((ordre, index) => {
      if (!ordre.statutSysteme) {
        ordre.statutSysteme = 'CREE';
        changesCount++;
      }
    });

    if (changesCount > 1) {
      console.log(`  ${colors.green}✓${colors.reset} Ajout des statuts par défaut aux ordres`);
    }
  }

  console.log(`\n${colors.bright}Total: ${changesCount} modifications${colors.reset}`);

  return data;
}

/**
 * Migration vers 1.2.0
 * Exemple: Normaliser les formats de dates
 */
function migrate_1_2_0(data) {
  console.log(`\n${colors.cyan}Migration vers 1.2.0...${colors.reset}`);

  let changesCount = 0;

  // Normaliser les dates (s'assurer qu'elles sont au format ISO)
  const normalizeDates = (obj) => {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        normalizeDates(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach(item => {
          if (item && typeof item === 'object') {
            normalizeDates(item);
          }
        });
      } else if (key.toLowerCase().includes('date') && obj[key]) {
        // Vérifier si la date est au format ISO
        const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
        if (!isoRegex.test(obj[key])) {
          try {
            const date = new Date(obj[key]);
            if (!isNaN(date.getTime())) {
              obj[key] = date.toISOString();
              changesCount++;
            }
          } catch (error) {
            // Ignorer les dates invalides
          }
        }
      }
    }
  };

  normalizeDates(data);

  if (changesCount > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Normalisation de ${changesCount} dates`);
  } else {
    console.log(`  ${colors.green}✓${colors.reset} Toutes les dates sont déjà au bon format`);
  }

  // Mettre à jour la version
  data.version = '1.2.0';

  console.log(`\n${colors.bright}Total: ${changesCount} modifications${colors.reset}`);

  return data;
}

/**
 * Migration vers 1.3.0
 * Exemple: Ajouter des index pour optimisation
 */
function migrate_1_3_0(data) {
  console.log(`\n${colors.cyan}Migration vers 1.3.0...${colors.reset}`);

  let changesCount = 0;

  // Créer des index pour accès rapide
  if (!data._indexes) {
    data._indexes = {
      tachesById: {},
      ordresById: {},
      operationsById: {},
      lastUpdated: new Date().toISOString()
    };

    // Indexer les tâches
    if (data.taches && Array.isArray(data.taches)) {
      data.taches.forEach(tache => {
        if (tache.id) {
          data._indexes.tachesById[tache.id] = tache;
        }
      });
      changesCount++;
      console.log(`  ${colors.green}✓${colors.reset} Indexation de ${data.taches.length} tâches`);
    }

    // Indexer les ordres
    if (data.ordres && Array.isArray(data.ordres)) {
      data.ordres.forEach(ordre => {
        if (ordre.id) {
          data._indexes.ordresById[ordre.id] = ordre;
        }
      });
      changesCount++;
      console.log(`  ${colors.green}✓${colors.reset} Indexation de ${data.ordres.length} ordres`);
    }

    // Indexer les opérations
    if (data.operations && Array.isArray(data.operations)) {
      data.operations.forEach(operation => {
        if (operation.id) {
          data._indexes.operationsById[operation.id] = operation;
        }
      });
      changesCount++;
      console.log(`  ${colors.green}✓${colors.reset} Indexation de ${data.operations.length} opérations`);
    }
  } else {
    console.log(`  ${colors.yellow}ℹ${colors.reset} Index déjà présents`);
  }

  // Mettre à jour la version
  data.version = '1.3.0';

  console.log(`\n${colors.bright}Total: ${changesCount} modifications${colors.reset}`);

  return data;
}

/**
 * Applique les migrations nécessaires
 */
function applyMigrations(data, targetVersion) {
  const currentVersion = data.version || '1.0.0';

  console.log(`\n${colors.cyan}Version actuelle: ${currentVersion}${colors.reset}`);
  console.log(`${colors.cyan}Version cible: ${targetVersion}${colors.reset}`);

  // Définir l'ordre des migrations
  const migrations = [
    { version: '1.1.0', fn: migrate_1_1_0 },
    { version: '1.2.0', fn: migrate_1_2_0 },
    { version: '1.3.0', fn: migrate_1_3_0 }
  ];

  // Trouver les migrations à appliquer
  const migrationsToApply = migrations.filter(m => {
    return compareVersions(currentVersion, m.version) < 0 &&
           compareVersions(m.version, targetVersion) <= 0;
  });

  if (migrationsToApply.length === 0) {
    console.log(`\n${colors.yellow}Aucune migration nécessaire${colors.reset}`);
    return data;
  }

  console.log(`\n${colors.bright}${migrationsToApply.length} migration(s) à appliquer${colors.reset}`);

  // Appliquer les migrations dans l'ordre
  let migratedData = data;
  for (const migration of migrationsToApply) {
    migratedData = migration.fn(migratedData);
  }

  return migratedData;
}

/**
 * Compare deux versions (format X.Y.Z)
 * Retourne: -1 si v1 < v2, 0 si v1 === v2, 1 si v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Affiche l'aide
 */
function displayHelp() {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}Script de migration de données${colors.reset}`);
  console.log('');
  console.log('Usage: node server/scripts/migrate.js [version] [options]');
  console.log('');
  console.log('Arguments:');
  console.log('  version      Version cible (ex: 1.1.0, 1.2.0)');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run    Teste la migration sans modifier les données');
  console.log('  --force      Migre sans demander confirmation');
  console.log('  --help       Affiche cette aide');
  console.log('');
  console.log('Exemples:');
  console.log('  node server/scripts/migrate.js 1.1.0');
  console.log('  node server/scripts/migrate.js 1.2.0 --dry-run');
  console.log('  node server/scripts/migrate.js 1.3.0 --force');
  console.log('');
  console.log('Versions disponibles:');
  console.log('  1.1.0 - Ajout champs version, dates, statuts par défaut');
  console.log('  1.2.0 - Normalisation des formats de dates');
  console.log('  1.3.0 - Ajout d\'index pour optimisation');
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

  if (help || args.length === 0) {
    displayHelp();
    return;
  }

  const targetVersion = args.find(arg => !arg.startsWith('--'));

  if (!targetVersion) {
    console.error(`${colors.red}Erreur: Version cible requise${colors.reset}`);
    displayHelp();
    process.exit(1);
  }

  // Valider le format de version
  if (!/^\d+\.\d+\.\d+$/.test(targetVersion)) {
    console.error(`${colors.red}Erreur: Format de version invalide (utilisez X.Y.Z)${colors.reset}`);
    process.exit(1);
  }

  console.log('');
  console.log(`${colors.cyan}${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║   🔄 MIGRATION DE DONNÉES                      ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}`);

  if (dryRun) {
    console.log('');
    console.log(`${colors.yellow}${colors.bright}MODE DRY-RUN${colors.reset} - Aucune donnée ne sera modifiée`);
  }

  const rootPath = join(__dirname, '..', '..');
  const dataPath = join(rootPath, 'server', 'data', 'application-data.json');

  // Vérifier que le fichier existe
  if (!existsSync(dataPath)) {
    console.error(`\n${colors.red}Erreur: Fichier de données non trouvé: ${dataPath}${colors.reset}`);
    process.exit(1);
  }

  try {
    // Charger les données
    console.log('\n📥 Chargement des données...');
    const content = await readFile(dataPath, 'utf-8');
    const data = JSON.parse(content);
    console.log(`${colors.green}✓${colors.reset} Données chargées`);

    // Demander confirmation si pas en mode force ou dry-run
    if (!dryRun && !force) {
      console.log('');
      console.log(`${colors.yellow}${colors.bright}ATTENTION:${colors.reset}`);
      console.log('Cette opération va modifier vos données.');
      console.log('Un backup sera créé avant la migration.');
      console.log('');

      const confirmed = await confirm('Voulez-vous continuer ?');

      if (!confirmed) {
        console.log('');
        console.log(`${colors.yellow}Migration annulée${colors.reset}`);
        console.log('');
        return;
      }
    }

    // Créer un backup
    if (!dryRun) {
      console.log('\n💾 Création du backup...');
      await createBackup(dataPath);
    }

    // Appliquer les migrations
    const migratedData = applyMigrations(data, targetVersion);

    // Sauvegarder les données migrées
    if (!dryRun) {
      console.log('\n💾 Sauvegarde des données migrées...');
      await writeFile(dataPath, JSON.stringify(migratedData, null, 2), 'utf-8');
      console.log(`${colors.green}✓${colors.reset} Données sauvegardées`);
    }

    console.log('');
    console.log(`${colors.green}${colors.bright}✓ MIGRATION TERMINÉE${colors.reset}`);

    if (dryRun) {
      console.log('');
      console.log(`${colors.yellow}Mode dry-run: Aucune donnée n'a été modifiée${colors.reset}`);
      console.log(`${colors.yellow}Relancez sans --dry-run pour appliquer la migration${colors.reset}`);
    }

    console.log('');

  } catch (error) {
    console.error(`\n${colors.red}Erreur fatale:${colors.reset}`, error);
    process.exit(1);
  }
}

// Exécuter
main();
