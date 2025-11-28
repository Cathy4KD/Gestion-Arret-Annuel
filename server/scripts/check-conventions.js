/**
 * Script de vérification des conventions de code
 * Analyse le code source et détecte les non-conformités
 *
 * Usage: node server/scripts/check-conventions.js [--fix] [--verbose]
 */

import { readFile, readdir } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

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
  filesChecked: 0,
  violations: 0,
  warnings: 0,
  fixable: 0
};

// Violations par type
const violations = {
  fileNaming: [],
  variableNaming: [],
  functionNaming: [],
  classNaming: [],
  constantNaming: [],
  missingJSDoc: [],
  socketEvents: [],
  longLines: [],
  other: []
};

/**
 * Vérifie si un nom de fichier respecte kebab-case
 */
function isKebabCase(filename) {
  // Ignorer les fichiers de configuration
  if (filename.startsWith('.')) return true;
  if (['package.json', 'package-lock.json'].includes(filename)) return true;

  const nameWithoutExt = basename(filename, extname(filename));
  const kebabPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  return kebabPattern.test(nameWithoutExt);
}

/**
 * Vérifie si un nom de variable respecte camelCase
 */
function isCamelCase(name) {
  const camelPattern = /^[a-z][a-zA-Z0-9]*$/;
  return camelPattern.test(name);
}

/**
 * Vérifie si un nom de classe respecte PascalCase
 */
function isPascalCase(name) {
  const pascalPattern = /^[A-Z][a-zA-Z0-9]*$/;
  return pascalPattern.test(name);
}

/**
 * Vérifie si un nom de constante respecte UPPER_CASE
 */
function isUpperCase(name) {
  const upperPattern = /^[A-Z][A-Z0-9_]*$/;
  return upperPattern.test(name);
}

/**
 * Vérifie le nommage d'un fichier
 */
function checkFileName(filePath) {
  const filename = basename(filePath);

  if (!isKebabCase(filename)) {
    violations.fileNaming.push({
      file: filePath,
      issue: `Nom de fichier non conforme à kebab-case: ${filename}`,
      suggestion: filename.toLowerCase().replace(/[_\s]/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
      fixable: true
    });
  }
}

/**
 * Extrait les déclarations de variables d'un fichier
 */
function extractVariables(content) {
  const variables = [];

  // const/let/var declarations
  const varPattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let match;

  while ((match = varPattern.exec(content)) !== null) {
    variables.push({
      name: match[1],
      type: 'variable',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return variables;
}

/**
 * Extrait les déclarations de fonctions d'un fichier
 */
function extractFunctions(content) {
  const functions = [];

  // function declarations
  const funcPattern = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  let match;

  while ((match = funcPattern.exec(content)) !== null) {
    const name = match[1];
    const line = content.substring(0, match.index).split('\n').length;

    functions.push({
      name,
      type: 'function',
      line,
      hasJSDoc: hasJSDocBefore(content, match.index)
    });
  }

  // Arrow functions assigned to const
  const arrowPattern = /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;

  while ((match = arrowPattern.exec(content)) !== null) {
    const name = match[1];
    const line = content.substring(0, match.index).split('\n').length;

    functions.push({
      name,
      type: 'arrow_function',
      line,
      hasJSDoc: hasJSDocBefore(content, match.index)
    });
  }

  return functions;
}

/**
 * Extrait les déclarations de classes d'un fichier
 */
function extractClasses(content) {
  const classes = [];

  const classPattern = /(?:export\s+)?(?:default\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match;

  while ((match = classPattern.exec(content)) !== null) {
    const name = match[1];
    const line = content.substring(0, match.index).split('\n').length;

    classes.push({
      name,
      type: 'class',
      line,
      hasJSDoc: hasJSDocBefore(content, match.index)
    });
  }

  return classes;
}

/**
 * Vérifie si une déclaration a un JSDoc juste avant
 */
function hasJSDocBefore(content, index) {
  const before = content.substring(Math.max(0, index - 500), index);
  const lines = before.split('\n').reverse();

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') continue;

    if (trimmed.startsWith('/**') || trimmed.includes('*/')) {
      return true;
    }

    if (!trimmed.startsWith('*') && !trimmed.startsWith('//')) {
      return false;
    }
  }

  return false;
}

/**
 * Extrait les événements Socket.IO
 */
function extractSocketEvents(content) {
  const events = [];

  // Patterns for socket events
  const patterns = [
    /socket\.(?:on|emit|once)\s*\(\s*['"]([^'"]+)['"]/g,
    /io\.emit\s*\(\s*['"]([^'"]+)['"]/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const eventName = match[1];
      const line = content.substring(0, match.index).split('\n').length;

      events.push({
        name: eventName,
        line
      });
    }
  }

  return events;
}

/**
 * Vérifie les conventions Socket.IO
 */
function checkSocketConventions(event, filePath) {
  const { name, line } = event;

  // Format recommandé: action:module ou module:action
  const conventionPattern = /^[a-z]+:[a-z]+(?::[a-z]+)?$/;

  if (!conventionPattern.test(name)) {
    violations.socketEvents.push({
      file: filePath,
      line,
      issue: `Événement Socket.IO non conforme: "${name}"`,
      suggestion: 'Utiliser le format "action:module" (ex: "load:taches", "save:tache")',
      fixable: false
    });
  }
}

/**
 * Vérifie les lignes trop longues
 */
function checkLineLengths(content, filePath, maxLength = 100) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Ignorer les URLs et imports
    if (line.includes('http://') || line.includes('https://') || line.trim().startsWith('import ')) {
      return;
    }

    if (line.length > maxLength) {
      violations.longLines.push({
        file: filePath,
        line: index + 1,
        length: line.length,
        issue: `Ligne trop longue (${line.length} caractères, max ${maxLength})`,
        preview: line.substring(0, 80) + '...',
        fixable: false
      });
    }
  });
}

/**
 * Vérifie un fichier JavaScript
 */
async function checkJavaScriptFile(filePath, verbose = false) {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Vérifier le nom du fichier
    checkFileName(filePath);

    // Extraire et vérifier les variables
    const variables = extractVariables(content);
    for (const variable of variables) {
      // Vérifier si c'est une constante (nom en UPPER_CASE dans le code)
      const isConstantStyle = /^[A-Z][A-Z0-9_]*$/.test(variable.name);

      if (isConstantStyle && !isUpperCase(variable.name)) {
        violations.constantNaming.push({
          file: filePath,
          line: variable.line,
          issue: `Constante mal nommée: "${variable.name}"`,
          suggestion: 'Utiliser UPPER_CASE pour les constantes',
          fixable: false
        });
      } else if (!isConstantStyle && !isCamelCase(variable.name) && variable.name !== '_') {
        violations.variableNaming.push({
          file: filePath,
          line: variable.line,
          issue: `Variable mal nommée: "${variable.name}"`,
          suggestion: 'Utiliser camelCase pour les variables',
          fixable: false
        });
      }
    }

    // Extraire et vérifier les fonctions
    const functions = extractFunctions(content);
    for (const func of functions) {
      if (!isCamelCase(func.name)) {
        violations.functionNaming.push({
          file: filePath,
          line: func.line,
          issue: `Fonction mal nommée: "${func.name}"`,
          suggestion: 'Utiliser camelCase pour les fonctions',
          fixable: false
        });
      }

      // Vérifier JSDoc pour fonctions exportées
      if (content.includes(`export function ${func.name}`) || content.includes(`export const ${func.name}`)) {
        if (!func.hasJSDoc) {
          violations.missingJSDoc.push({
            file: filePath,
            line: func.line,
            issue: `Fonction exportée sans JSDoc: "${func.name}"`,
            suggestion: 'Ajouter un commentaire JSDoc',
            fixable: false
          });
        }
      }
    }

    // Extraire et vérifier les classes
    const classes = extractClasses(content);
    for (const cls of classes) {
      if (!isPascalCase(cls.name)) {
        violations.classNaming.push({
          file: filePath,
          line: cls.line,
          issue: `Classe mal nommée: "${cls.name}"`,
          suggestion: 'Utiliser PascalCase pour les classes',
          fixable: false
        });
      }

      if (content.includes(`export class ${cls.name}`) || content.includes(`export default class ${cls.name}`)) {
        if (!cls.hasJSDoc) {
          violations.missingJSDoc.push({
            file: filePath,
            line: cls.line,
            issue: `Classe exportée sans JSDoc: "${cls.name}"`,
            suggestion: 'Ajouter un commentaire JSDoc',
            fixable: false
          });
        }
      }
    }

    // Vérifier les événements Socket.IO
    const events = extractSocketEvents(content);
    for (const event of events) {
      checkSocketConventions(event, filePath);
    }

    // Vérifier la longueur des lignes
    checkLineLengths(content, filePath);

    stats.filesChecked++;

  } catch (error) {
    console.error(`${colors.red}Erreur lors de la lecture de ${filePath}:${colors.reset}`, error.message);
  }
}

/**
 * Scanne récursivement un dossier
 */
async function scanDirectory(dirPath, verbose = false) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Ignorer certains dossiers
        if (['node_modules', 'dist', '.git', 'logs', 'backups', 'docs-generated'].includes(entry.name)) {
          continue;
        }

        await scanDirectory(fullPath, verbose);
      } else if (entry.isFile() && extname(entry.name) === '.js') {
        await checkJavaScriptFile(fullPath, verbose);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Erreur lors du scan de ${dirPath}:${colors.reset}`, error.message);
  }
}

/**
 * Affiche les violations
 */
function displayViolations(verbose = false) {
  const allViolations = [
    ...violations.fileNaming,
    ...violations.variableNaming,
    ...violations.functionNaming,
    ...violations.classNaming,
    ...violations.constantNaming,
    ...violations.missingJSDoc,
    ...violations.socketEvents,
    ...violations.longLines
  ];

  stats.violations = allViolations.length;
  stats.fixable = allViolations.filter(v => v.fixable).length;

  if (allViolations.length === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ Aucune violation détectée${colors.reset}`);
    return;
  }

  // Grouper par fichier
  const byFile = {};
  allViolations.forEach(v => {
    if (!byFile[v.file]) {
      byFile[v.file] = [];
    }
    byFile[v.file].push(v);
  });

  console.log(`\n${colors.yellow}${colors.bright}⚠ ${allViolations.length} violation(s) détectée(s)${colors.reset}\n`);

  for (const [file, fileViolations] of Object.entries(byFile)) {
    console.log(`${colors.cyan}${file}${colors.reset}`);

    fileViolations.forEach(v => {
      const icon = v.fixable ? '🔧' : '⚠️';
      const lineInfo = v.line ? `:${v.line}` : '';

      console.log(`  ${icon} ${v.issue}${lineInfo}`);

      if (verbose && v.suggestion) {
        console.log(`     ${colors.yellow}→ ${v.suggestion}${colors.reset}`);
      }

      if (verbose && v.preview) {
        console.log(`     ${colors.yellow}Aperçu: ${v.preview}${colors.reset}`);
      }
    });

    console.log('');
  }
}

/**
 * Affiche le résumé
 */
function displaySummary() {
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}               RÉSUMÉ${colors.reset}`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log('');
  console.log(`Fichiers vérifiés:     ${stats.filesChecked}`);
  console.log(`${colors.yellow}Violations:            ${stats.violations}${colors.reset}`);
  console.log(`${colors.green}Réparables auto:       ${stats.fixable}${colors.reset}`);
  console.log('');

  if (stats.violations > 0) {
    console.log('Violations par type:');
    console.log(`  Noms de fichiers:    ${violations.fileNaming.length}`);
    console.log(`  Noms de variables:   ${violations.variableNaming.length}`);
    console.log(`  Noms de fonctions:   ${violations.functionNaming.length}`);
    console.log(`  Noms de classes:     ${violations.classNaming.length}`);
    console.log(`  Noms de constantes:  ${violations.constantNaming.length}`);
    console.log(`  JSDoc manquant:      ${violations.missingJSDoc.length}`);
    console.log(`  Événements Socket:   ${violations.socketEvents.length}`);
    console.log(`  Lignes trop longues: ${violations.longLines.length}`);
    console.log('');
  }

  const conformityRate = stats.filesChecked > 0
    ? ((1 - stats.violations / (stats.filesChecked * 10)) * 100).toFixed(1)
    : 100;

  console.log(`${colors.bright}Taux de conformité:    ${conformityRate}%${colors.reset}`);
  console.log('');

  if (stats.violations === 0) {
    console.log(`${colors.green}${colors.bright}✓ CODE CONFORME AUX CONVENTIONS${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠ Consultez CONVENTIONS.md pour les bonnes pratiques${colors.reset}`);
  }
  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const fix = args.includes('--fix');

  console.log('');
  console.log(`${colors.cyan}${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║   📐 VÉRIFICATION DES CONVENTIONS              ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  if (fix) {
    console.log(`${colors.yellow}Mode --fix non encore implémenté${colors.reset}`);
    console.log(`${colors.yellow}Les violations seront listées uniquement${colors.reset}`);
    console.log('');
  }

  const rootPath = join(__dirname, '..', '..');

  try {
    console.log('📂 Scan des fichiers JavaScript...\n');

    await scanDirectory(join(rootPath, 'server'), verbose);
    await scanDirectory(join(rootPath, 'client'), verbose);

    console.log(`${colors.green}✓${colors.reset} ${stats.filesChecked} fichiers analysés\n`);

    displayViolations(verbose);
    displaySummary();

    // Code de sortie
    process.exit(stats.violations > 0 ? 1 : 0);

  } catch (error) {
    console.error(`\n${colors.red}Erreur fatale:${colors.reset}`, error);
    process.exit(1);
  }
}

// Exécuter
main();
