/**
 * Script de génération/mise à jour automatique du fichier MAP.md
 * Scanne le projet et met à jour les sections techniques du MAP.md
 *
 * Usage: node update-map.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAP_FILE = path.join(__dirname, 'docs', 'audit', 'MAP.md');
const PROJECT_ROOT = __dirname;

// Configuration
const IGNORE_DIRS = ['node_modules', '.git', 'logs', 'backup'];
const IGNORE_FILES = ['.DS_Store', 'Thumbs.db', '.gitignore'];

/**
 * Obtient la taille d'un fichier en octets
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Formate la taille en format lisible
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Compte les lignes d'un fichier
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Scanne récursivement un dossier et génère l'arborescence
 */
function scanDirectory(dir, prefix = '', isLast = true, stats = { files: 0, totalSize: 0 }) {
  let output = '';

  try {
    const items = fs.readdirSync(dir);
    const filteredItems = items.filter(item =>
      !IGNORE_DIRS.includes(item) && !IGNORE_FILES.includes(item)
    );

    filteredItems.forEach((item, index) => {
      const itemPath = path.join(dir, item);
      const isLastItem = index === filteredItems.length - 1;
      const isDirectory = fs.statSync(itemPath).isDirectory();

      const connector = isLastItem ? '└── ' : '├── ';
      const extension = prefix + connector;

      if (isDirectory) {
        output += `${extension}📁 ${item}/\n`;
        const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
        output += scanDirectory(itemPath, newPrefix, isLastItem, stats);
      } else {
        const size = getFileSize(itemPath);
        const sizeStr = formatSize(size);
        stats.files++;
        stats.totalSize += size;

        let icon = '📄';
        if (item.endsWith('.js')) icon = '📜';
        else if (item.endsWith('.html')) icon = '🌐';
        else if (item.endsWith('.css')) icon = '🎨';
        else if (item.endsWith('.json')) icon = '📋';
        else if (item.endsWith('.md')) icon = '📝';

        output += `${extension}${icon} ${item} (${sizeStr})\n`;
      }
    });
  } catch (error) {
    console.error(`Erreur lecture dossier ${dir}:`, error.message);
  }

  return output;
}

/**
 * Génère l'arborescence complète du projet
 */
function generateFileTree() {
  console.log('🔍 Scan de l\'arborescence des fichiers...');

  const stats = { files: 0, totalSize: 0 };
  let tree = '```\nE:\\TEST 3/\n';
  tree += scanDirectory(PROJECT_ROOT, '', true, stats);
  tree += '```\n\n';
  tree += `**Statistiques:**\n`;
  tree += `- **Nombre total de fichiers:** ${stats.files}\n`;
  tree += `- **Taille totale:** ${formatSize(stats.totalSize)}\n`;

  console.log(`✅ ${stats.files} fichiers scannés (${formatSize(stats.totalSize)})`);

  return tree;
}

/**
 * Analyse les modules JavaScript dans public/js/modules/
 */
function analyzeModules() {
  console.log('🔍 Analyse des modules JavaScript...');

  const modulesDir = path.join(PROJECT_ROOT, 'public', 'js', 'modules');
  const modules = {};

  // Catégories de modules (basées sur l'audit)
  const categories = {
    'Planning & Organisation': [],
    'Équipements & Maintenance': [],
    'SAP & Gestion': [],
    'Contractuels & Fournisseurs': [],
    'Sécurité & Qualité': [],
    'Ressources & Logistique': [],
    'Technique & Engineering': [],
    'Suivi & Reporting': [],
    'Finance & Budget': [],
    'Divers & Utilitaires': []
  };

  if (!fs.existsSync(modulesDir)) {
    console.warn('⚠️  Dossier modules non trouvé');
    return { categories, total: 0 };
  }

  const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));

  files.forEach(file => {
    const filePath = path.join(modulesDir, file);
    const lines = countLines(filePath);
    const size = getFileSize(filePath);
    const moduleName = file.replace('.js', '');

    const moduleInfo = {
      name: moduleName,
      file: `modules/${file}`,
      lines: lines,
      size: formatSize(size)
    };

    // Catégorisation basique par nom
    let categorized = false;

    if (/calendar|planning|jalon|chronogram|synthese/i.test(moduleName)) {
      categories['Planning & Organisation'].push(moduleInfo);
      categorized = true;
    } else if (/equipement|maintenance|outillage|tool/i.test(moduleName)) {
      categories['Équipements & Maintenance'].push(moduleInfo);
      categorized = true;
    } else if (/iw37|iw38|iw49|sap|pm-/i.test(moduleName)) {
      categories['SAP & Gestion'].push(moduleInfo);
      categorized = true;
    } else if (/t55|devis|contrat|fournisseur|supplier/i.test(moduleName)) {
      categories['Contractuels & Fournisseurs'].push(moduleInfo);
      categorized = true;
    } else if (/psv|audit|securite|consignation|safety|quality/i.test(moduleName)) {
      categories['Sécurité & Qualité'].push(moduleInfo);
      categorized = true;
    } else if (/personnel|stock|transport|hebergement|resource/i.test(moduleName)) {
      categories['Ressources & Logistique'].push(moduleInfo);
      categorized = true;
    } else if (/plan|gamme|check-list|procedure|technical/i.test(moduleName)) {
      categories['Technique & Engineering'].push(moduleInfo);
      categorized = true;
    } else if (/tableau|rapport|indicateur|dashboard|report/i.test(moduleName)) {
      categories['Suivi & Reporting'].push(moduleInfo);
      categorized = true;
    } else if (/budget|cout|facture|finance|cost/i.test(moduleName)) {
      categories['Finance & Budget'].push(moduleInfo);
      categorized = true;
    }

    if (!categorized) {
      categories['Divers & Utilitaires'].push(moduleInfo);
    }
  });

  console.log(`✅ ${files.length} modules analysés`);

  return { categories, total: files.length };
}

/**
 * Analyse les routes API dans server/routes/
 */
function analyzeRoutes() {
  console.log('🔍 Analyse des routes API...');

  const routesDir = path.join(PROJECT_ROOT, 'server', 'routes');
  const routes = {
    rest: [],
    socketio: []
  };

  if (!fs.existsSync(routesDir)) {
    console.warn('⚠️  Dossier routes non trouvé');
    return routes;
  }

  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

  files.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extraction des routes REST (router.get, router.post, etc.)
    const routeRegex = /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const endpoint = match[2];

      routes.rest.push({
        method: method,
        path: endpoint,
        file: file
      });
    }
  });

  // Analyse des événements Socket.IO dans server.js
  const serverFile = path.join(PROJECT_ROOT, 'server', 'server.js');
  if (fs.existsSync(serverFile)) {
    const content = fs.readFileSync(serverFile, 'utf8');

    // Extraction des socket.on
    const socketOnRegex = /socket\.on\(['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = socketOnRegex.exec(content)) !== null) {
      const event = match[1];
      if (!['connection', 'disconnect'].includes(event)) {
        routes.socketio.push({
          event: event,
          type: 'RECEIVE',
          file: 'server.js'
        });
      }
    }

    // Extraction des io.emit
    const ioEmitRegex = /io\.emit\(['"`]([^'"`]+)['"`]/g;
    while ((match = ioEmitRegex.exec(content)) !== null) {
      const event = match[1];
      if (!routes.socketio.find(r => r.event === event && r.type === 'EMIT')) {
        routes.socketio.push({
          event: event,
          type: 'EMIT',
          file: 'server.js'
        });
      }
    }
  }

  console.log(`✅ ${routes.rest.length} routes REST et ${routes.socketio.length} événements Socket.IO trouvés`);

  return routes;
}

/**
 * Génère le contenu mis à jour pour la section arborescence
 */
function generateTreeSection() {
  const tree = generateFileTree();

  return `## 9️⃣ ARBORESCENCE COMPLÈTE DES FICHIERS

### Structure Complète avec Tailles

${tree}

> **Note:** Cette section est générée automatiquement par \`npm run update-map\`
> **Dernière mise à jour:** ${new Date().toLocaleString('fr-FR')}

`;
}

/**
 * Génère le contenu mis à jour pour la section modules
 */
function generateModulesSection() {
  const { categories, total } = analyzeModules();

  let output = `## 6️⃣ MODULES DE DONNÉES (${total} modules)

### Organisation par Catégorie

`;

  Object.entries(categories).forEach(([category, modules]) => {
    if (modules.length > 0) {
      output += `#### ${category} (${modules.length} modules)\n\n`;
      modules.forEach(mod => {
        output += `- **${mod.name}** - \`${mod.file}\` (${mod.lines} lignes, ${mod.size})\n`;
      });
      output += '\n';
    }
  });

  output += `> **Note:** Cette section est générée automatiquement par \`npm run update-map\`\n`;
  output += `> **Dernière mise à jour:** ${new Date().toLocaleString('fr-FR')}\n\n`;

  return output;
}

/**
 * Génère le contenu mis à jour pour la section API
 */
function generateApiSection() {
  const routes = analyzeRoutes();

  let output = `## 8️⃣ API & ENDPOINTS

### Routes REST API (${routes.rest.length} endpoints)

`;

  // Grouper par fichier
  const routesByFile = {};
  routes.rest.forEach(route => {
    if (!routesByFile[route.file]) {
      routesByFile[route.file] = [];
    }
    routesByFile[route.file].push(route);
  });

  Object.entries(routesByFile).forEach(([file, fileRoutes]) => {
    output += `#### ${file}\n\n`;
    output += `| Méthode | Endpoint |\n`;
    output += `|---------|----------|\n`;
    fileRoutes.forEach(route => {
      output += `| **${route.method}** | \`${route.path}\` |\n`;
    });
    output += '\n';
  });

  output += `### Événements Socket.IO (${routes.socketio.length} événements)\n\n`;
  output += `| Type | Événement | Description |\n`;
  output += `|------|-----------|-------------|\n`;

  routes.socketio.forEach(event => {
    const icon = event.type === 'RECEIVE' ? '📥' : '📤';
    output += `| ${icon} ${event.type} | \`${event.event}\` | Défini dans ${event.file} |\n`;
  });

  output += `\n> **Note:** Cette section est générée automatiquement par \`npm run update-map\`\n`;
  output += `> **Dernière mise à jour:** ${new Date().toLocaleString('fr-FR')}\n\n`;

  return output;
}

/**
 * Met à jour le fichier MAP.md
 */
function updateMapFile() {
  console.log('\n📝 Mise à jour du fichier MAP.md...');

  if (!fs.existsSync(MAP_FILE)) {
    console.error('❌ Fichier MAP.md non trouvé:', MAP_FILE);
    return false;
  }

  let mapContent = fs.readFileSync(MAP_FILE, 'utf8');

  // Générer les nouvelles sections
  const newTreeSection = generateTreeSection();
  const newModulesSection = generateModulesSection();
  const newApiSection = generateApiSection();

  // Remplacer Section 9 (Arborescence)
  const treeRegex = /## 9️⃣ ARBORESCENCE COMPLÈTE DES FICHIERS[\s\S]*?(?=##|$)/;
  if (treeRegex.test(mapContent)) {
    mapContent = mapContent.replace(treeRegex, newTreeSection);
    console.log('✅ Section 9 (Arborescence) mise à jour');
  } else {
    console.log('⚠️  Section 9 non trouvée, ajout à la fin');
    mapContent += '\n\n' + newTreeSection;
  }

  // Remplacer Section 6 (Modules)
  const modulesRegex = /## 6️⃣ MODULES DE DONNÉES[\s\S]*?(?=##|$)/;
  if (modulesRegex.test(mapContent)) {
    mapContent = mapContent.replace(modulesRegex, newModulesSection);
    console.log('✅ Section 6 (Modules) mise à jour');
  } else {
    console.log('⚠️  Section 6 non trouvée');
  }

  // Remplacer Section 8 (API)
  const apiRegex = /## 8️⃣ API & ENDPOINTS[\s\S]*?(?=##|$)/;
  if (apiRegex.test(mapContent)) {
    mapContent = mapContent.replace(apiRegex, newApiSection);
    console.log('✅ Section 8 (API) mise à jour');
  } else {
    console.log('⚠️  Section 8 non trouvée');
  }

  // Sauvegarder le fichier
  try {
    fs.writeFileSync(MAP_FILE, mapContent, 'utf8');
    console.log('\n✅ MAP.md mis à jour avec succès!');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   MISE À JOUR AUTOMATIQUE DU FICHIER MAP.md   ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  const success = updateMapFile();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n╔════════════════════════════════════════════════╗');
  if (success) {
    console.log('║              ✅ MISE À JOUR RÉUSSIE            ║');
  } else {
    console.log('║              ❌ MISE À JOUR ÉCHOUÉE            ║');
  }
  console.log(`║              Durée: ${duration}s${' '.repeat(28 - duration.length)}║`);
  console.log('╚════════════════════════════════════════════════╝\n');

  if (success) {
    console.log('📋 Sections mises à jour:');
    console.log('  • Section 6: Modules de données');
    console.log('  • Section 8: API & Endpoints');
    console.log('  • Section 9: Arborescence des fichiers\n');
    console.log('💡 Vérifiez le fichier docs/audit/MAP.md pour voir les changements\n');
  }

  process.exit(success ? 0 : 1);
}

// Exécution
main();
