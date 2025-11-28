/**
 * Script de génération automatique de documentation
 * Scanne les modules JS et génère une documentation HTML
 *
 * Usage: node server/scripts/generate-docs.js [--output dir]
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, relative, extname, basename } from 'path';
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
  modulesScanned: 0,
  functionsDocumented: 0,
  classesDocumented: 0,
  eventsDocumented: 0
};

/**
 * Scanne récursivement un dossier pour trouver les fichiers JS
 */
async function scanDirectory(dirPath, fileList = []) {
  const files = await readdir(dirPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = join(dirPath, file.name);

    if (file.isDirectory()) {
      // Ignorer node_modules, dist, etc.
      if (!['node_modules', 'dist', '.git', 'logs', 'backups'].includes(file.name)) {
        await scanDirectory(filePath, fileList);
      }
    } else if (file.isFile() && extname(file.name) === '.js') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Extrait les commentaires JSDoc d'un fichier
 */
async function extractJSDoc(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const docs = [];

  // Pattern pour détecter les blocs JSDoc
  const jsdocPattern = /\/\*\*\s*\n([^*]|\*(?!\/))*\*\//g;
  const matches = content.matchAll(jsdocPattern);

  for (const match of matches) {
    const jsdoc = match[0];
    const startIndex = match.index + jsdoc.length;

    // Extraire la déclaration suivante (function, class, const, etc.)
    const declaration = content.substring(startIndex, startIndex + 200)
      .split('\n')[0]
      .trim();

    docs.push({
      jsdoc,
      declaration,
      type: detectDeclarationType(declaration)
    });
  }

  return docs;
}

/**
 * Détecte le type de déclaration (function, class, const, etc.)
 */
function detectDeclarationType(declaration) {
  if (declaration.startsWith('export class') || declaration.startsWith('class')) {
    return 'class';
  } else if (declaration.startsWith('export function') || declaration.startsWith('function')) {
    return 'function';
  } else if (declaration.startsWith('export const') || declaration.startsWith('const')) {
    return 'const';
  } else if (declaration.startsWith('export default')) {
    return 'export';
  }
  return 'other';
}

/**
 * Parse un commentaire JSDoc
 */
function parseJSDoc(jsdoc) {
  const lines = jsdoc.split('\n').map(line => line.trim().replace(/^[\*\s]+/, ''));

  const parsed = {
    description: '',
    params: [],
    returns: null,
    examples: []
  };

  let currentSection = 'description';
  let currentExample = '';

  for (const line of lines) {
    if (line.startsWith('@param')) {
      currentSection = 'params';
      const match = line.match(/@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
      if (match) {
        parsed.params.push({
          type: match[1],
          name: match[2],
          description: match[3]
        });
      }
    } else if (line.startsWith('@returns') || line.startsWith('@return')) {
      currentSection = 'returns';
      const match = line.match(/@returns?\s+\{([^}]+)\}\s*(.*)/);
      if (match) {
        parsed.returns = {
          type: match[1],
          description: match[2]
        };
      }
    } else if (line.startsWith('@example')) {
      currentSection = 'example';
      currentExample = '';
    } else if (line.startsWith('/**') || line.startsWith('*/') || line === '') {
      // Ignorer
    } else {
      if (currentSection === 'description') {
        parsed.description += line + ' ';
      } else if (currentSection === 'example') {
        currentExample += line + '\n';
      }
    }
  }

  if (currentExample) {
    parsed.examples.push(currentExample.trim());
  }

  parsed.description = parsed.description.trim();

  return parsed;
}

/**
 * Extrait les événements Socket.IO d'un fichier
 */
async function extractSocketEvents(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const events = [];

  // Pattern pour détecter socket.on, socket.emit, io.emit, etc.
  const patterns = [
    /socket\.on\(['"](.*?)['"]/g,
    /socket\.emit\(['"](.*?)['"]/g,
    /io\.emit\(['"](.*?)['"]/g,
    /socket\.once\(['"](.*?)['"]/g
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const eventName = match[1];
      const type = match[0].includes('.on') || match[0].includes('.once') ? 'listen' : 'emit';

      if (!events.some(e => e.name === eventName && e.type === type)) {
        events.push({
          name: eventName,
          type,
          file: filePath
        });
      }
    }
  }

  return events;
}

/**
 * Génère la documentation HTML
 */
function generateHTML(modules, socketEvents) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation - Gestionnaire d'Arrêt d'Aciérie</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 0;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        nav {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        nav ul {
            list-style: none;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        nav a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }

        nav a:hover {
            color: #764ba2;
        }

        .section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .section h2 {
            color: #667eea;
            font-size: 2em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }

        .section h3 {
            color: #764ba2;
            font-size: 1.5em;
            margin-top: 30px;
            margin-bottom: 15px;
        }

        .module {
            margin-bottom: 40px;
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }

        .module-title {
            font-size: 1.3em;
            color: #333;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .module-path {
            color: #666;
            font-size: 0.9em;
            font-family: 'Courier New', monospace;
            margin-bottom: 15px;
        }

        .doc-item {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }

        .declaration {
            font-family: 'Courier New', monospace;
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 10px 0;
        }

        .description {
            margin: 10px 0;
            color: #555;
        }

        .params {
            margin: 15px 0;
        }

        .param {
            margin: 8px 0;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 3px;
        }

        .param-name {
            font-weight: bold;
            color: #667eea;
            font-family: 'Courier New', monospace;
        }

        .param-type {
            color: #764ba2;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        .returns {
            margin: 15px 0;
            padding: 10px;
            background: #e8f4f8;
            border-left: 3px solid #667eea;
            border-radius: 3px;
        }

        .event-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .event {
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
            border-left: 4px solid #667eea;
        }

        .event.listen {
            border-left-color: #48bb78;
        }

        .event.emit {
            border-left-color: #ed8936;
        }

        .event-name {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .event-type {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            font-weight: 500;
        }

        .event-type.listen {
            background: #c6f6d5;
            color: #22543d;
        }

        .event-type.emit {
            background: #feebc8;
            color: #7c2d12;
        }

        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            font-weight: 500;
            margin-right: 5px;
        }

        .badge.function {
            background: #bee3f8;
            color: #2c5282;
        }

        .badge.class {
            background: #faf089;
            color: #744210;
        }

        .badge.const {
            background: #fed7d7;
            color: #742a2a;
        }

        footer {
            text-align: center;
            padding: 30px;
            color: #666;
            border-top: 1px solid #ddd;
            margin-top: 50px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }

        .stat-label {
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>🏭 Documentation Technique</h1>
            <p>Gestionnaire d'Arrêt d'Aciérie - Documentation automatique</p>
        </div>
    </header>

    <div class="container">
        <nav>
            <ul>
                <li><a href="#overview">Vue d'ensemble</a></li>
                <li><a href="#modules">Modules</a></li>
                <li><a href="#socket-events">Événements Socket.IO</a></li>
            </ul>
        </nav>

        <section id="overview" class="section">
            <h2>📊 Vue d'ensemble</h2>

            <div class="stats">
                <div class="stat">
                    <div class="stat-number">${stats.modulesScanned}</div>
                    <div class="stat-label">Modules scannés</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${stats.functionsDocumented}</div>
                    <div class="stat-label">Fonctions documentées</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${stats.classesDocumented}</div>
                    <div class="stat-label">Classes documentées</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${stats.eventsDocumented}</div>
                    <div class="stat-label">Événements Socket.IO</div>
                </div>
            </div>

            <p>Cette documentation a été générée automatiquement à partir des commentaires JSDoc et du code source.</p>
            <p><strong>Date de génération:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </section>

        <section id="modules" class="section">
            <h2>📚 Modules</h2>

            ${generateModulesHTML(modules)}
        </section>

        <section id="socket-events" class="section">
            <h2>🔌 Événements Socket.IO</h2>

            <p>Liste de tous les événements Socket.IO détectés dans le code.</p>

            <h3>Événements écoutés (listen)</h3>
            <div class="event-list">
                ${socketEvents
                  .filter(e => e.type === 'listen')
                  .map(e => `
                    <div class="event listen">
                        <div class="event-name">${e.name}</div>
                        <span class="event-type listen">LISTEN</span>
                        <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                            ${relative(join(__dirname, '..', '..'), e.file)}
                        </div>
                    </div>
                  `).join('')}
            </div>

            <h3>Événements émis (emit)</h3>
            <div class="event-list">
                ${socketEvents
                  .filter(e => e.type === 'emit')
                  .map(e => `
                    <div class="event emit">
                        <div class="event-name">${e.name}</div>
                        <span class="event-type emit">EMIT</span>
                        <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                            ${relative(join(__dirname, '..', '..'), e.file)}
                        </div>
                    </div>
                  `).join('')}
            </div>
        </section>
    </div>

    <footer>
        <p>&copy; 2025 - Gestionnaire d'Arrêt d'Aciérie</p>
        <p>Documentation générée automatiquement par generate-docs.js</p>
    </footer>
</body>
</html>`;

  return html;
}

/**
 * Génère le HTML pour les modules
 */
function generateModulesHTML(modules) {
  return modules.map(module => {
    const docs = module.docs.filter(d => d.type !== 'other');

    if (docs.length === 0) {
      return '';
    }

    return `
      <div class="module">
          <div class="module-title">${basename(module.path, '.js')}</div>
          <div class="module-path">${relative(join(__dirname, '..', '..'), module.path)}</div>

          ${docs.map(doc => {
            const parsed = parseJSDoc(doc.jsdoc);

            return `
              <div class="doc-item">
                  <span class="badge ${doc.type}">${doc.type.toUpperCase()}</span>
                  <div class="declaration">${escapeHtml(doc.declaration)}</div>

                  ${parsed.description ? `<div class="description">${parsed.description}</div>` : ''}

                  ${parsed.params.length > 0 ? `
                    <div class="params">
                        <strong>Paramètres:</strong>
                        ${parsed.params.map(p => `
                          <div class="param">
                              <span class="param-name">${p.name}</span>
                              <span class="param-type">{${p.type}}</span>
                              ${p.description ? `- ${p.description}` : ''}
                          </div>
                        `).join('')}
                    </div>
                  ` : ''}

                  ${parsed.returns ? `
                    <div class="returns">
                        <strong>Retourne:</strong> <span class="param-type">{${parsed.returns.type}}</span>
                        ${parsed.returns.description ? `- ${parsed.returns.description}` : ''}
                    </div>
                  ` : ''}
              </div>
            `;
          }).join('')}
      </div>
    `;
  }).join('');
}

/**
 * Échappe le HTML
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const outputDirArg = args.indexOf('--output');
  const outputDir = outputDirArg >= 0 && args[outputDirArg + 1]
    ? args[outputDirArg + 1]
    : 'docs-generated';

  console.log('');
  console.log(`${colors.cyan}${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║   📚 GÉNÉRATION DE DOCUMENTATION               ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  const rootPath = join(__dirname, '..', '..');
  const outputPath = join(rootPath, outputDir);

  try {
    // Créer le dossier de sortie si nécessaire
    if (!existsSync(outputPath)) {
      await mkdir(outputPath, { recursive: true });
      console.log(`${colors.green}✓${colors.reset} Dossier créé: ${outputDir}/`);
    }

    // Scanner les fichiers JS
    console.log('\n📂 Scan des fichiers JavaScript...');
    const serverFiles = await scanDirectory(join(rootPath, 'server'));
    const clientFiles = await scanDirectory(join(rootPath, 'client'));
    const allFiles = [...serverFiles, ...clientFiles];

    console.log(`${colors.green}✓${colors.reset} ${allFiles.length} fichiers trouvés`);

    // Extraire la documentation
    console.log('\n📖 Extraction de la documentation...');
    const modules = [];
    const allSocketEvents = [];

    for (const file of allFiles) {
      const docs = await extractJSDoc(file);
      const events = await extractSocketEvents(file);

      if (docs.length > 0) {
        modules.push({
          path: file,
          docs
        });

        stats.modulesScanned++;
        docs.forEach(doc => {
          if (doc.type === 'function') stats.functionsDocumented++;
          if (doc.type === 'class') stats.classesDocumented++;
        });
      }

      allSocketEvents.push(...events);
    }

    stats.eventsDocumented = allSocketEvents.length;

    console.log(`${colors.green}✓${colors.reset} ${stats.modulesScanned} modules documentés`);
    console.log(`${colors.green}✓${colors.reset} ${stats.functionsDocumented} fonctions documentées`);
    console.log(`${colors.green}✓${colors.reset} ${stats.classesDocumented} classes documentées`);
    console.log(`${colors.green}✓${colors.reset} ${stats.eventsDocumented} événements Socket.IO détectés`);

    // Générer le HTML
    console.log('\n🎨 Génération du HTML...');
    const html = generateHTML(modules, allSocketEvents);

    const htmlPath = join(outputPath, 'index.html');
    await writeFile(htmlPath, html, 'utf-8');

    console.log(`${colors.green}✓${colors.reset} Documentation générée: ${htmlPath}`);

    console.log('');
    console.log(`${colors.green}${colors.bright}✓ DOCUMENTATION GÉNÉRÉE AVEC SUCCÈS${colors.reset}`);
    console.log('');
    console.log(`Ouvrez ${colors.cyan}${htmlPath}${colors.reset} dans votre navigateur`);
    console.log('');

  } catch (error) {
    console.error(`\n${colors.red}Erreur fatale:${colors.reset}`, error);
    process.exit(1);
  }
}

// Exécuter
main();
