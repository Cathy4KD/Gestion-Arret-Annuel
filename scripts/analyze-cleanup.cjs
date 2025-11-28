/**
 * Analyse des fichiers a nettoyer
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

console.log('\n=== ANALYSE DES FICHIERS A NETTOYER ===\n');

// 1. Archives
console.log('1. ARCHIVES');
console.log('----------');
const archivesPath = path.join(ROOT, 'archives');
if (fs.existsSync(archivesPath)) {
    const archives = fs.readdirSync(archivesPath);
    archives.forEach(archive => {
        const archivePath = path.join(archivesPath, archive);
        const stats = fs.statSync(archivePath);
        if (stats.isDirectory()) {
            const files = getAllFiles(archivePath);
            const totalSize = files.reduce((sum, f) => sum + fs.statSync(f).size, 0);
            console.log(`  - ${archive}/`);
            console.log(`    Fichiers: ${files.length}`);
            console.log(`    Taille: ${(totalSize / 1024).toFixed(2)} KB`);
            console.log(`    PEUT ETRE SUPPRIME: ${files.length === 0 ? 'OUI (vide)' : 'OUI (archivage ancien)'}`);
        }
    });
}

console.log('\n2. LOGS ANCIENS');
console.log('---------------');
const logsPath = path.join(ROOT, 'logs');
if (fs.existsSync(logsPath)) {
    const logs = fs.readdirSync(logsPath).filter(f => f.endsWith('.log'));
    const today = new Date();
    const oldLogs = [];

    logs.forEach(log => {
        const logPath = path.join(logsPath, log);
        const stats = fs.statSync(logPath);
        const age = Math.floor((today - stats.mtime) / (1000 * 60 * 60 * 24));
        const size = stats.size;

        if (age > 7) {
            oldLogs.push({ log, age, size });
        }
    });

    console.log(`  Total logs: ${logs.length}`);
    console.log(`  Logs > 7 jours: ${oldLogs.length}`);

    if (oldLogs.length > 0) {
        let totalSize = 0;
        oldLogs.forEach(({ log, age, size }) => {
            totalSize += size;
            console.log(`    - ${log} (${age} jours, ${(size / 1024).toFixed(2)} KB)`);
        });
        console.log(`  PEUT ETRE SUPPRIME: OUI (${(totalSize / 1024).toFixed(2)} KB a liberer)`);
    }
}

console.log('\n3. FICHIERS BACKUP');
console.log('------------------');
const backupFiles = [];
findBackups(path.join(ROOT, 'client'), backupFiles);

if (backupFiles.length > 0) {
    let totalSize = 0;
    backupFiles.forEach(f => {
        const stats = fs.statSync(f);
        totalSize += stats.size;
        const relativePath = f.replace(ROOT + path.sep, '');
        console.log(`  - ${relativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    console.log(`  PEUT ETRE SUPPRIME: OUI (${(totalSize / 1024).toFixed(2)} KB a liberer)`);
} else {
    console.log('  Aucun fichier backup trouve');
}

console.log('\n4. FICHIERS TEMPORAIRES');
console.log('-----------------------');
const tempFiles = [
    path.join(ROOT, 'structure-actuelle.txt'),
    path.join(ROOT, 'client', 'index-refactored.html'),
    path.join(ROOT, 'client', 'index-old-preoptimize.html')
];

tempFiles.forEach(f => {
    if (fs.existsSync(f)) {
        const stats = fs.statSync(f);
        const relativePath = f.replace(ROOT + path.sep, '');
        console.log(`  - ${relativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
        console.log(`    PEUT ETRE SUPPRIME: OUI (fichier intermediaire)`);
    }
});

console.log('\n5. NODE_MODULES INUTILISES');
console.log('--------------------------');
const packageJsonPath = path.join(ROOT, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    console.log(`  Dependencies: ${deps.length}`);
    console.log(`  DevDependencies: ${devDeps.length}`);
    console.log(`  RECOMMANDATION: Executer 'npm prune' pour nettoyer`);
}

// Summary
console.log('\n=== RESUME ===');
console.log('');
console.log('ESPACE RECUPERABLE:');
console.log('  - Archives: Peut liberer plusieurs KB/MB');
console.log('  - Logs anciens: ' + (oldLogs ? `${oldLogs.length} fichiers` : '0'));
console.log('  - Backups: ' + backupFiles.length + ' fichiers');
console.log('');
console.log('RECOMMANDATIONS PRIORITAIRES:');
console.log('  1. Supprimer archives/ COMPLET (dossiers vides d\'archivage)');
console.log('  2. Supprimer logs > 7 jours (garder seulement les recents)');
console.log('  3. Supprimer fichiers .backup-* dans client/');
console.log('  4. Supprimer fichiers intermediaires (index-refactored, etc.)');
console.log('');

// Helper functions
function getAllFiles(dirPath, arrayOfFiles = []) {
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
            } else {
                arrayOfFiles.push(filePath);
            }
        });
    } catch (err) {}
    return arrayOfFiles;
}

function findBackups(dirPath, backupFiles) {
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                findBackups(filePath, backupFiles);
            } else if (file.includes('backup') || file.includes('.backup-')) {
                backupFiles.push(filePath);
            }
        });
    } catch (err) {}
}
