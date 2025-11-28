/**
 * Script de build pour minifier CSS et JS
 * Usage: node server/scripts/build.js
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

/**
 * Minification CSS simple (pas de librairie externe)
 */
function minifyCSS(css) {
  return css
    // Supprimer les commentaires
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Supprimer les espaces inutiles
    .replace(/\s+/g, ' ')
    // Supprimer espaces autour des symboles
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    // Supprimer le dernier ;
    .replace(/;}/g, '}')
    // Trim
    .trim();
}

/**
 * Minification JS simple
 */
function minifyJS(js) {
  return js
    // Supprimer les commentaires simples
    .replace(/\/\/.*/g, '')
    // Supprimer les commentaires multi-lignes
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Supprimer les lignes vides
    .replace(/^\s*[\r\n]/gm, '')
    // Supprimer les espaces multiples
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

/**
 * Récupère tous les fichiers d'un dossier récursivement
 */
async function getFiles(dir, extension) {
  const files = [];

  async function scan(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

/**
 * Build CSS
 */
async function buildCSS() {
  console.log('🎨 Minification CSS...');

  const cssDir = join(rootDir, 'client', 'css');
  const distDir = join(rootDir, 'client', 'css', 'dist');

  // Créer le dossier dist s'il n'existe pas
  if (!existsSync(distDir)) {
    await mkdir(distDir, { recursive: true });
  }

  // Obtenir tous les fichiers CSS
  const cssFiles = await getFiles(cssDir, '.css');

  let totalSaved = 0;
  let filesProcessed = 0;

  for (const file of cssFiles) {
    // Ignorer le dossier dist
    if (file.includes('/dist/') || file.includes('\\dist\\')) continue;

    try {
      const content = await readFile(file, 'utf-8');
      const minified = minifyCSS(content);

      // Calculer l'économie
      const originalSize = Buffer.byteLength(content, 'utf-8');
      const minifiedSize = Buffer.byteLength(minified, 'utf-8');
      const saved = originalSize - minifiedSize;
      totalSaved += saved;

      // Nom du fichier minifié
      const fileName = file.split(/[/\\]/).pop();
      const minFile = join(distDir, fileName.replace('.css', '.min.css'));

      await writeFile(minFile, minified, 'utf-8');

      const percent = ((saved / originalSize) * 100).toFixed(1);
      console.log(`  ✓ ${fileName}: ${originalSize}B → ${minifiedSize}B (${percent}% économisé)`);

      filesProcessed++;
    } catch (error) {
      console.error(`  ✗ Erreur sur ${file}:`, error.message);
    }
  }

  console.log(`✅ ${filesProcessed} fichiers CSS minifiés`);
  console.log(`💾 Total économisé: ${(totalSaved / 1024).toFixed(2)} KB\n`);
}

/**
 * Build JS
 */
async function buildJS() {
  console.log('📜 Minification JavaScript...');

  const jsDir = join(rootDir, 'client', 'js');
  const distDir = join(rootDir, 'client', 'js', 'dist');

  // Créer le dossier dist s'il n'existe pas
  if (!existsSync(distDir)) {
    await mkdir(distDir, { recursive: true });
  }

  // Obtenir tous les fichiers JS
  const jsFiles = await getFiles(jsDir, '.js');

  let totalSaved = 0;
  let filesProcessed = 0;

  for (const file of jsFiles) {
    // Ignorer le dossier dist
    if (file.includes('/dist/') || file.includes('\\dist\\')) continue;

    try {
      const content = await readFile(file, 'utf-8');
      const minified = minifyJS(content);

      // Calculer l'économie
      const originalSize = Buffer.byteLength(content, 'utf-8');
      const minifiedSize = Buffer.byteLength(minified, 'utf-8');
      const saved = originalSize - minifiedSize;
      totalSaved += saved;

      // Nom du fichier minifié
      const relativePath = file.replace(jsDir, '').replace(/^[/\\]/, '');
      const minFile = join(distDir, relativePath.replace('.js', '.min.js'));

      // Créer les sous-dossiers si nécessaire
      const minFileDir = dirname(minFile);
      if (!existsSync(minFileDir)) {
        await mkdir(minFileDir, { recursive: true });
      }

      await writeFile(minFile, minified, 'utf-8');

      const percent = ((saved / originalSize) * 100).toFixed(1);
      console.log(`  ✓ ${relativePath}: ${originalSize}B → ${minifiedSize}B (${percent}% économisé)`);

      filesProcessed++;
    } catch (error) {
      console.error(`  ✗ Erreur sur ${file}:`, error.message);
    }
  }

  console.log(`✅ ${filesProcessed} fichiers JS minifiés`);
  console.log(`💾 Total économisé: ${(totalSaved / 1024).toFixed(2)} KB\n`);
}

/**
 * Build principal
 */
async function build() {
  console.log('🔨 Démarrage du build...\n');

  const startTime = Date.now();

  try {
    await buildCSS();
    await buildJS();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Build terminé en ${duration}s`);

  } catch (error) {
    console.error('❌ Erreur lors du build:', error);
    process.exit(1);
  }
}

// Exécution
build();
