/**
 * @fileoverview Module d'initialisation de la page Gestion des Pièces
 * @module ui/pieces-page
 */

import { savePiecesData, getPiecesData, renderPiecesTable } from '../data/pieces-data.js';

const numberOfColumns = 56;

/**
 * Initialise la page Gestion des Pièces
 */
export function initPiecesPage() {
    console.log('[PIECES-PAGE] Initialisation de la page...');
    
    // Afficher les données existantes
    const existingData = getPiecesData();
    if (existingData && existingData.length > 0) {
        console.log('[PIECES-PAGE] Affichage des données existantes');
        renderPiecesTable('pieces-table-body', numberOfColumns);
    }
    
    // Configurer le gestionnaire d'importation
    setupImportHandler();
    
    // Écouter les événements de mise à jour des données
    setupDataUpdateListener();
}

/**
 * Configure le gestionnaire d'événements pour l'importation Excel
 */
function setupImportHandler() {
    const fileInput = document.getElementById('excel-file-input');
    
    if (!fileInput) {
        console.warn('[PIECES-PAGE] Input file non trouvé');
        return;
    }
    
    // Supprimer les anciens listeners
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    // Ajouter le nouveau listener
    newFileInput.addEventListener('change', handleFileImport);
    console.log('[PIECES-PAGE] Gestionnaire d\'importation configuré');
}

/**
 * Gère l'importation du fichier Excel
 */
async function handleFileImport(event) {
    console.log('[PIECES-PAGE] Fichier sélectionné, début du traitement...');
    const file = event.target.files[0];
    
    if (!file) {
        console.log('[PIECES-PAGE] Aucun fichier sélectionné.');
        return;
    }
    
    console.log(`[PIECES-PAGE] Nom du fichier: ${file.name}, Taille: ${file.size} octets`);
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        console.log('[PIECES-PAGE] FileReader a terminé la lecture du fichier.');
        
        try {
            console.log('[PIECES-PAGE] Tentative de lecture du classeur Excel...');
            
            // Vérifier que XLSX est disponible
            if (typeof XLSX === 'undefined') {
                throw new Error('La bibliothèque XLSX n\'est pas chargée');
            }
            
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log('[PIECES-PAGE] Classeur Excel lu. Données JSON:', jsonData);
            
            if (jsonData.length < 2) {
                throw new Error('Le fichier Excel est vide ou ne contient pas de données.');
            }
            
            console.log(`[PIECES-PAGE] ${jsonData.length - 1} lignes de données extraites.`);
            
            // Sauvegarder sur le serveur et afficher
            console.log('[PIECES-PAGE] Tentative de sauvegarde des données sur le serveur...');
            const success = await savePiecesData(jsonData);
            
            if (success) {
                console.log('[PIECES-PAGE] Données sauvegardées avec succès sur le serveur. Rendu du tableau...');
                renderPiecesTable('pieces-table-body', numberOfColumns);
                alert(`✅ Importation réussie !\n${jsonData.length - 1} lignes importées et sauvegardées sur le serveur.`);
            } else {
                console.error('[PIECES-PAGE] Échec de la sauvegarde sur le serveur.');
                alert(`❌ Erreur lors de la sauvegarde sur le serveur.\nVérifiez que le serveur est démarré.`);
            }
            
        } catch (error) {
            console.error('[PIECES-PAGE] Erreur lors de la lecture ou du traitement du fichier Excel:', error);
            alert(`Une erreur s'est produite lors de la lecture du fichier :\n\n${error.message}`);
            
            const tableBody = document.getElementById('pieces-table-body');
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="${numberOfColumns}" style="padding: 30px; text-align: center; color: #c5554a;"><b>Erreur :</b> ${error.message}</td></tr>`;
            }
        }
    };
    
    reader.onerror = (error) => {
        console.error('[PIECES-PAGE] Erreur du FileReader:', error);
        alert('Une erreur est survenue lors de la lecture du fichier.');
    };
    
    console.log('[PIECES-PAGE] Démarrage de la lecture du fichier par FileReader...');
    reader.readAsArrayBuffer(file);
    
    // Reset input pour permettre de réimporter le même fichier
    event.target.value = '';
}

/**
 * Configure l'écouteur d'événements pour les mises à jour de données
 */
function setupDataUpdateListener() {
    window.addEventListener('data:updated', (event) => {
        if (event.detail.moduleName === 'piecesData') {
            console.log('[PIECES-PAGE] Mise à jour des données reçue');
            renderPiecesTable('pieces-table-body', numberOfColumns);
        }
    });
}
