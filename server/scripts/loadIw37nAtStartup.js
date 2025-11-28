// scripts/loadIw37nAtStartup.js - Charge automatiquement IW37N.xlsx au démarrage

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { updateModuleData } from '../services/dataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chemin vers le fichier IW37N.xlsx dans /data-sources
const IW37N_FILE = join(__dirname, '..', '..', 'data-sources', 'IW37N.xlsx');

/**
 * Charge automatiquement le fichier IW37N.xlsx au démarrage du serveur
 * UNIQUEMENT si iw37nData est vide (optimisation)
 */
export async function loadIw37nAtStartup() {
    try {
        // Vérifier si le fichier existe
        if (!existsSync(IW37N_FILE)) {
            console.log('ℹ️  Pas de fichier IW37N.xlsx trouvé dans /data-sources');
            console.log('   → Vous pouvez en importer un depuis l\'interface web');
            return false;
        }

        // OPTIMISATION: Ne charger que si les données sont vides
        const { getAllData } = await import('../services/dataService.js');
        const currentData = await getAllData();
        
        if (currentData.iw37nData && currentData.iw37nData.length > 0) {
            console.log(`✅ IW37N déjà chargé (${currentData.iw37nData.length} lignes) - chargement ignoré`);
            return true;
        }

        console.log('📂 Chargement du fichier IW37N.xlsx...');

        // Lire le fichier Excel
        const fileBuffer = await readFile(IW37N_FILE);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Lire la première feuille
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
            console.warn('⚠️  Fichier IW37N.xlsx vide ou mal formaté');
            return false;
        }

        // Sauvegarder dans le service de données
        await updateModuleData('iw37nData', jsonData, 'System');

        console.log(`✅ IW37N.xlsx chargé avec succès: ${jsonData.length} lignes`);
        return true;

    } catch (error) {
        console.error('❌ Erreur lors du chargement de IW37N.xlsx:', error.message);
        console.error('   → Vous pouvez en importer un depuis l\'interface web');
        return false;
    }
}
