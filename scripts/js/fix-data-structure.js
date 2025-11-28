/**
 * Script de correction de la structure des données
 * Problème: Les données TPAA sont dans tpaaPwCachedData.tpaaData au lieu de tpaaData
 * Solution: Copier les données au bon endroit
 */

const fs = require('fs');
const path = require('path');

// Chemins
const DATA_FILE = path.join(__dirname, 'server', 'data', 'application-data.json');
const BACKUP_FILE = path.join(__dirname, 'server', 'data', `application-data-backup-avant-correction-${Date.now()}.json`);

console.log('🔧 SCRIPT DE CORRECTION DES DONNÉES');
console.log('=====================================\n');

// Étape 1: Lire le fichier
console.log('1️⃣ Lecture du fichier de données...');
let data;
try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    data = JSON.parse(content);
    console.log('   ✅ Fichier lu avec succès\n');
} catch (error) {
    console.error('   ❌ Erreur de lecture:', error.message);
    process.exit(1);
}

// Étape 2: Analyser la structure actuelle
console.log('2️⃣ Analyse de la structure actuelle...');
console.log(`   📊 tpaaData (racine): ${data.tpaaData === null ? 'NULL ❌' : 'Présent ✅'}`);
console.log(`   📊 tpaaPwCachedData: ${data.tpaaPwCachedData ? 'Présent ✅' : 'NULL ❌'}`);

if (data.tpaaPwCachedData && data.tpaaPwCachedData.tpaaData) {
    console.log(`   📊 tpaaPwCachedData.tpaaData: ${data.tpaaPwCachedData.tpaaData.length} entrées ✅`);
} else {
    console.log(`   📊 tpaaPwCachedData.tpaaData: NULL ❌`);
}

if (data.tpaaPwCachedData && data.tpaaPwCachedData.pwData) {
    console.log(`   📊 tpaaPwCachedData.pwData: ${data.tpaaPwCachedData.pwData.length} entrées ✅`);
} else {
    console.log(`   📊 tpaaPwCachedData.pwData: NULL ❌`);
}

console.log(`   📊 scopeFilters: ${data.scopeFilters ? Object.keys(data.scopeFilters).length + ' pages' : 'NULL'}`);
console.log(`   📊 posteAllocations: ${data.posteAllocations ? Object.keys(data.posteAllocations).length + ' postes' : 'NULL'}`);
console.log();

// Étape 3: Créer une sauvegarde
console.log('3️⃣ Création d\'une sauvegarde de sécurité...');
try {
    fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    console.log(`   ✅ Sauvegarde créée: ${path.basename(BACKUP_FILE)}\n`);
} catch (error) {
    console.error('   ❌ Erreur de sauvegarde:', error.message);
    process.exit(1);
}

// Étape 4: Corriger la structure
console.log('4️⃣ Correction de la structure...');
let correctionsMade = false;

// Correction 1: Copier tpaaPwCachedData.tpaaData vers tpaaData
if (data.tpaaData === null && data.tpaaPwCachedData && data.tpaaPwCachedData.tpaaData) {
    console.log('   🔧 Correction: tpaaData');
    data.tpaaData = data.tpaaPwCachedData.tpaaData;
    console.log(`      ✅ ${data.tpaaData.length} entrées TPAA copiées`);
    correctionsMade = true;
}

// Correction 2: Copier tpaaPwCachedData.pwData vers pwData
if (data.pwData === null && data.tpaaPwCachedData && data.tpaaPwCachedData.pwData) {
    console.log('   🔧 Correction: pwData');
    data.pwData = data.tpaaPwCachedData.pwData;
    console.log(`      ✅ ${data.pwData.length} entrées PW copiées`);
    correctionsMade = true;
}

// Vérification des autres données importantes
if (!data.scopeFilters) {
    console.log('   ⚠️  scopeFilters est null (normal si jamais configuré)');
}

if (!data.posteAllocations) {
    console.log('   ⚠️  posteAllocations est null (normal si jamais configuré)');
}

if (!correctionsMade) {
    console.log('   ℹ️  Aucune correction nécessaire - Les données sont déjà au bon endroit');
    console.log('\n❌ PROBLÈME: Si vos données ne s\'affichent pas, c\'est un problème de connexion, pas de structure.\n');
    console.log('📋 Actions recommandées:');
    console.log('   1. Arrêtez le serveur (Ctrl+C)');
    console.log('   2. Redémarrez: node server/server.js');
    console.log('   3. Rechargez l\'application dans le navigateur (Ctrl+F5)');
    process.exit(0);
}

console.log();

// Étape 5: Sauvegarder le fichier corrigé
console.log('5️⃣ Sauvegarde du fichier corrigé...');
try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('   ✅ Fichier corrigé sauvegardé\n');
} catch (error) {
    console.error('   ❌ Erreur d\'écriture:', error.message);
    console.log('\n⚠️  Le fichier original est intact, la sauvegarde est disponible.');
    process.exit(1);
}

// Étape 6: Vérification finale
console.log('6️⃣ Vérification finale...');
try {
    const verifyContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const verifyData = JSON.parse(verifyContent);

    console.log(`   ✅ tpaaData: ${verifyData.tpaaData ? verifyData.tpaaData.length : 0} entrées`);
    console.log(`   ✅ pwData: ${verifyData.pwData ? verifyData.pwData.length : 0} entrées`);
    console.log(`   ✅ scopeFilters: ${verifyData.scopeFilters ? Object.keys(verifyData.scopeFilters).length + ' pages' : 'NULL'}`);
    console.log(`   ✅ posteAllocations: ${verifyData.posteAllocations ? Object.keys(verifyData.posteAllocations).length + ' postes' : 'NULL'}`);
} catch (error) {
    console.error('   ❌ Erreur de vérification:', error.message);
    process.exit(1);
}

console.log('\n✅ CORRECTION TERMINÉE AVEC SUCCÈS!\n');
console.log('📋 Prochaines étapes:');
console.log('   1. Arrêtez le serveur (Ctrl+C dans le terminal du serveur)');
console.log('   2. Redémarrez le serveur: node server/server.js');
console.log('   3. Ouvrez l\'application: http://localhost:3000');
console.log('   4. Rechargez la page avec Ctrl+F5');
console.log('   5. Vos données TPAA et SCOPE devraient maintenant apparaître!\n');
console.log('💾 Note: Une sauvegarde a été créée au cas où:');
console.log(`   ${BACKUP_FILE}\n`);
