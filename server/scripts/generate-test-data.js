/**
 * Script pour générer des données de test
 * Utile pour tester les performances avec beaucoup de données
 *
 * Usage: node server/scripts/generate-test-data.js [nombre]
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Génère un ID unique
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Génère une date aléatoire dans le futur
 */
function randomFutureDate(daysAhead = 365) {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAhead);
  const futureDate = new Date(now.getTime() + randomDays * 24 * 60 * 60 * 1000);
  return futureDate.toISOString().split('T')[0];
}

/**
 * Sélectionne un élément aléatoire dans un tableau
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Génère des tâches de test
 */
function generateTaches(count = 100) {
  const taches = [];

  const types = ['Mécanique', 'Électrique', 'Instrumentation', 'Civil', 'Nettoyage'];
  const statuts = ['À faire', 'En cours', 'Terminée', 'En attente'];
  const priorites = ['Haute', 'Moyenne', 'Basse'];
  const secteurs = ['Haut-fourneau', 'Aciérie', 'Laminoir', 'Cokerie', 'Agglomération'];

  for (let i = 0; i < count; i++) {
    taches.push({
      id: generateId(),
      numero: `TASK-${String(i + 1).padStart(5, '0')}`,
      designation: `Tâche de test #${i + 1}`,
      type: randomChoice(types),
      secteur: randomChoice(secteurs),
      statut: randomChoice(statuts),
      priorite: randomChoice(priorites),
      dateDebut: randomFutureDate(30),
      dateFin: randomFutureDate(60),
      dureeEstimee: Math.floor(Math.random() * 48) + 1, // 1-48h
      progression: Math.floor(Math.random() * 101), // 0-100%
      responsable: `Responsable ${Math.floor(Math.random() * 10) + 1}`,
      equipe: `Équipe ${randomChoice(['A', 'B', 'C'])}`,
      description: `Description détaillée de la tâche de test #${i + 1}. Cette tâche a été générée automatiquement pour les tests de performance.`,
      commentaires: '',
      fichiers: [],
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString()
    });
  }

  return taches;
}

/**
 * Génère des ordres de travail de test
 */
function generateOrdres(count = 500) {
  const ordres = [];

  const types = ['PM01', 'PM02', 'PM03', 'CM01', 'CM02'];
  const statuts = ['CREE', 'AVIS', 'LANC', 'ENCR', 'CLOT'];
  const installations = ['HF1', 'HF2', 'ACR1', 'ACR2', 'LAM1', 'LAM2'];
  const priorites = ['1', '2', '3', '4'];

  for (let i = 0; i < count; i++) {
    ordres.push({
      id: generateId(),
      ordre: `${100000 + i}`,
      typeOrdre: randomChoice(types),
      statutSysteme: randomChoice(statuts),
      emplacement: randomChoice(installations),
      priorite: randomChoice(priorites),
      dateDebut: randomFutureDate(30),
      dateFin: randomFutureDate(90),
      texteAbrege: `Ordre de test ${i + 1}`,
      description: `Description de l'ordre de travail de test #${i + 1}`,
      responsablePlanification: `RESP${Math.floor(Math.random() * 5) + 1}`,
      division: `DIV-${randomChoice(['MEC', 'ELE', 'INS'])}`,
      groupePlanification: `GP${Math.floor(Math.random() * 10) + 1}`,
      operations: [],
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString()
    });
  }

  return ordres;
}

/**
 * Génère des opérations de test
 */
function generateOperations(count = 1000) {
  const operations = [];

  const postes = ['0010', '0020', '0030', '0040', '0050'];
  const statuts = ['CREE', 'AVIS', 'LANC', 'ENCR', 'CLOT'];
  const cles = ['PM01', 'PM02', 'PM03'];

  for (let i = 0; i < count; i++) {
    operations.push({
      id: generateId(),
      ordre: `${100000 + Math.floor(i / 3)}`, // 3 opérations par ordre en moyenne
      operation: randomChoice(postes),
      sousOperation: '',
      cleControle: randomChoice(cles),
      texteOperation: `Opération de test ${i + 1}`,
      travailARealiser: `Travail à réaliser pour l'opération ${i + 1}`,
      poste: randomChoice(postes),
      personnelNecessaire: Math.floor(Math.random() * 5) + 1,
      duree: Math.floor(Math.random() * 8) + 1, // 1-8h
      statut: randomChoice(statuts),
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString()
    });
  }

  return operations;
}

/**
 * Génère des pièces de test
 */
function generatePieces(count = 300) {
  const pieces = [];

  const unites = ['PC', 'KG', 'M', 'L'];
  const magasins = ['MAG1', 'MAG2', 'MAG3'];

  for (let i = 0; i < count; i++) {
    pieces.push({
      id: generateId(),
      numero: `${10000000 + i}`,
      designation: `Pièce de test ${i + 1}`,
      quantite: Math.floor(Math.random() * 100) + 1,
      unite: randomChoice(unites),
      magasin: randomChoice(magasins),
      emplacement: `E${Math.floor(Math.random() * 20) + 1}`,
      stock: Math.floor(Math.random() * 1000),
      prixUnitaire: (Math.random() * 1000).toFixed(2),
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString()
    });
  }

  return pieces;
}

/**
 * Génère des arrêts de test
 */
function generateArrets(count = 20) {
  const arrets = [];

  const types = ['Programmé', 'Imprévu', 'Maintenance'];
  const statuts = ['Planifié', 'En cours', 'Terminé'];
  const installations = ['Haut-fourneau 1', 'Haut-fourneau 2', 'Aciérie', 'Laminoir'];

  for (let i = 0; i < count; i++) {
    const dateDebut = randomFutureDate(60);
    const dureeJours = Math.floor(Math.random() * 14) + 1; // 1-14 jours
    const dateFin = new Date(new Date(dateDebut).getTime() + dureeJours * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    arrets.push({
      id: generateId(),
      reference: `ARR-${String(i + 1).padStart(4, '0')}`,
      titre: `Arrêt de test ${i + 1}`,
      type: randomChoice(types),
      installation: randomChoice(installations),
      dateDebut,
      dateFin,
      duree: dureeJours,
      statut: randomChoice(statuts),
      description: `Description de l'arrêt de test #${i + 1}`,
      impactProduction: Math.floor(Math.random() * 100),
      nombrePersonnes: Math.floor(Math.random() * 50) + 10,
      budget: Math.floor(Math.random() * 1000000) + 100000,
      responsable: `Responsable ${Math.floor(Math.random() * 5) + 1}`,
      taches: [],
      ordres: [],
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString()
    });
  }

  return arrets;
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  let multiplier = 1;

  if (args.length > 0) {
    multiplier = parseInt(args[0], 10);
    if (isNaN(multiplier) || multiplier < 1) {
      console.error('❌ Le nombre doit être un entier positif');
      process.exit(1);
    }
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🧪 GÉNÉRATEUR DE DONNÉES DE TEST            ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');

  const dataPath = join(__dirname, '..', 'data', 'application-data.json');

  // Charger les données existantes
  let data = {};
  if (existsSync(dataPath)) {
    try {
      const content = await readFile(dataPath, 'utf-8');
      data = JSON.parse(content);
      console.log('✅ Données existantes chargées');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error.message);
      process.exit(1);
    }
  } else {
    console.log('⚠️  Aucune donnée existante, création d\'un nouveau fichier');
    data = {};
  }

  // Sauvegarder une copie de backup
  const backupPath = join(__dirname, '..', 'data', 'backups', `backup-before-test-data-${Date.now()}.json`);
  try {
    await writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Backup créé: ${backupPath}`);
  } catch (error) {
    console.error('⚠️  Impossible de créer le backup:', error.message);
  }

  console.log('');
  console.log(`📊 Génération de données de test (multiplicateur: ${multiplier})...`);
  console.log('');

  // Générer les données
  const tachesCount = 100 * multiplier;
  const ordresCount = 500 * multiplier;
  const operationsCount = 1000 * multiplier;
  const piecesCount = 300 * multiplier;
  const arretsCount = 20 * multiplier;

  console.log(`🔄 Génération de ${tachesCount} tâches...`);
  const taches = generateTaches(tachesCount);

  console.log(`🔄 Génération de ${ordresCount} ordres...`);
  const ordres = generateOrdres(ordresCount);

  console.log(`🔄 Génération de ${operationsCount} opérations...`);
  const operations = generateOperations(operationsCount);

  console.log(`🔄 Génération de ${piecesCount} pièces...`);
  const pieces = generatePieces(piecesCount);

  console.log(`🔄 Génération de ${arretsCount} arrêts...`);
  const arrets = generateArrets(arretsCount);

  // Fusionner avec les données existantes
  if (!data.taches) data.taches = [];
  if (!data.ordres) data.ordres = [];
  if (!data.operations) data.operations = [];
  if (!data.pieces) data.pieces = [];
  if (!data.arrets) data.arrets = [];

  data.taches.push(...taches);
  data.ordres.push(...ordres);
  data.operations.push(...operations);
  data.pieces.push(...pieces);
  data.arrets.push(...arrets);

  console.log('');
  console.log('💾 Sauvegarde des données...');

  try {
    await writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✅ Données sauvegardées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    process.exit(1);
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   ✅ GÉNÉRATION TERMINÉE                       ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Statistiques:');
  console.log(`   Tâches:      ${data.taches.length} (+ ${tachesCount})`);
  console.log(`   Ordres:      ${data.ordres.length} (+ ${ordresCount})`);
  console.log(`   Opérations:  ${data.operations.length} (+ ${operationsCount})`);
  console.log(`   Pièces:      ${data.pieces.length} (+ ${piecesCount})`);
  console.log(`   Arrêts:      ${data.arrets.length} (+ ${arretsCount})`);
  console.log('');
  console.log('📝 Notes:');
  console.log('   - Un backup a été créé avant la génération');
  console.log('   - Redémarrez le serveur pour voir les nouvelles données');
  console.log('   - Pour restaurer: copiez le backup vers application-data.json');
  console.log('');
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
