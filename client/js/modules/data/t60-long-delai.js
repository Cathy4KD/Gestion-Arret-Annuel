/**
 * @fileoverview Module de gestion des Commandes à Long Délai (60-89 jours)
 * @module data/t60-long-delai
 *
 * @description
 * Gère les pièces avec un délai de livraison entre 60 et 89 jours
 *
 * @exports {Function} loadT60Data
 * @exports {Function} syncT60FromIW38
 * @exports {Function} renderT60Table
 * @exports {Function} exportT60ToExcel
 * @exports {Function} updateT60CommandeField
 */

import { loadFromStorage, saveToStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

let longDelaiPieces = [];
let commandeData = {}; // { pieceId: { dateCommande, fournisseur, statut, remarques } }

/**
 * Set T60 long délai pieces (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setT60LongDelaiPieces(data) {
    longDelaiPieces = data || [];
    console.log(`[T60] ✅ ${longDelaiPieces.length} pièces long délai injectées depuis le serveur`);
}

/**
 * Set T60 commande data (utilisé par server-sync pour injecter les données)
 * @param {Object} data - Données à définir
 */
export function setT60CommandeData(data) {
    commandeData = data || {};
    console.log(`[T60] ✅ Données commandes injectées`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setT60LongDelaiPieces = setT60LongDelaiPieces;
    window.setT60CommandeData = setT60CommandeData;
    console.log('[T60] ✅ Fonctions exposées globalement');
}

export async function loadT60Data() {
    console.log('[T60] 🔄 Chargement des données T60...');

    // Charger les pièces longues délais sauvegardées
    const savedPieces = await loadFromStorage('t60LongDelaiPieces');
    console.log('[T60] DEBUG savedPieces:', savedPieces);

    if (savedPieces && Array.isArray(savedPieces)) {
        longDelaiPieces = savedPieces;
        console.log(`[T60] ✅ ${longDelaiPieces.length} pièces long délai chargées depuis storage`);
    } else {
        console.log('[T60] ⚠️ Aucune pièce sauvegardée trouvée');
        longDelaiPieces = [];
    }

    // Charger les données de commande sauvegardées
    const savedCommandes = await loadFromStorage('t60CommandeData');
    if (savedCommandes) {
        commandeData = savedCommandes;
        console.log('[T60] ✅ Données commandes chargées');
    } else {
        console.log('[T60] ⚠️ Aucune donnée de commande sauvegardée');
        commandeData = {};
    }

    console.log('[T60] DEBUG longDelaiPieces.length =', longDelaiPieces.length);

    // Toujours afficher le tableau (vide ou avec données)
    await renderT60Table();

    console.log('[T60] ✅ Module T60 initialisé');
}

export async function syncT60FromIW38() {
    console.log('[T60] 🔄 Synchronisation depuis Gestion des Pièces...');

    const piecesData = await loadFromStorage('piecesData');
    console.log('[T60] Données Pièces chargées:', piecesData ? `${piecesData.length} lignes` : 'aucune');

    if (!piecesData || !Array.isArray(piecesData) || piecesData.length < 2) {
        console.warn('[T60] ⚠️ Aucune donnée Pièces trouvée');
        longDelaiPieces = [];
        await renderT60Table();
        alert('⚠️ Aucune donnée dans le tableau Gestion des Pièces.\n\nVeuillez d\'abord:\n1. Aller dans "PIÈCES"\n2. Importer vos données de pièces\n3. Revenir ici et cliquer sur "🔄 Synchroniser IW38"');
        return;
    }

    try {
        console.log('[T60] Filtrage des pièces avec délai 60-89 jours...');

        // Les données sont stockées comme tableau de tableaux
        // Ligne 0 = headers, lignes suivantes = données
        const headers = piecesData[0];
        const rows = piecesData.slice(1);

        console.log('[T60] Headers:', headers);
        console.log('[T60] Nombre de lignes de données:', rows.length);

        // Trouver l'index de la colonne de délai
        // Chercher spécifiquement "délai" pour éviter de trouver "Stat. livraison"
        const delaiIndex = headers.findIndex(header =>
            header && (
                header.toLowerCase().includes('délai') ||
                header.toLowerCase().includes('delai')
            )
        );

        console.log('[T60] Index colonne de délai:', delaiIndex, '- Nom:', headers[delaiIndex]);

        if (delaiIndex === -1) {
            alert('❌ Colonne de délai non trouvée dans les données Pièces.');
            return;
        }

        // Trouver les indices des autres colonnes importantes
        const designationIndex = headers.findIndex(h => h && (h.includes('Désignation') || h.includes('composant')));
        const ordreIndex = headers.findIndex(h => h && h.toLowerCase() === 'ordre');
        const qteIndex = headers.findIndex(h => h && h.toLowerCase().includes('qté'));
        const uniteIndex = headers.findIndex(h => h && h.toLowerCase().includes('unité'));

        // Filtrer les pièces avec délai >= 60 ET < 90 jours
        longDelaiPieces = rows.filter(row => {
            const delai = row[delaiIndex];
            const delaiNombre = parseInt(delai) || 0;

            if (delaiNombre >= 60 && delaiNombre < 90) {
                console.log('[T60] Pièce trouvée avec délai', delaiNombre, ':', row[designationIndex]);
            }

            return delaiNombre >= 60 && delaiNombre < 90;
        }).map(row => {
            // Convertir chaque ligne en objet pour compatibilité avec renderT60Table
            return {
                'Ordre': row[ordreIndex] || '',
                'Désignation composant': row[designationIndex] || '',
                'Qté réservée': row[qteIndex] || '',
                'Unité': row[uniteIndex] || '',
                'Délai prév. livrais.': row[delaiIndex] || ''
            };
        });

        console.log(`[T60] ✅ ${longDelaiPieces.length} pièces avec délai 60-89 jours trouvées`);

        // Sauvegarder les pièces filtrées pour qu'elles persistent après refresh
        console.log('[T60] DEBUG Avant sauvegarde, longDelaiPieces.length =', longDelaiPieces.length);
        await saveToStorage('t60LongDelaiPieces', longDelaiPieces);
        console.log('[T60] 💾 Pièces long délai sauvegardées dans storage avec clé: t60LongDelaiPieces');

        // Vérifier immédiatement que les données ont été sauvegardées
        const verification = await loadFromStorage('t60LongDelaiPieces');
        console.log('[T60] VERIFICATION: données rechargées =', verification ? verification.length : 'null', 'pièces');

        await renderT60Table();

        if (longDelaiPieces.length > 0) {
            alert(`✅ ${longDelaiPieces.length} pièces avec délai 60-89 jours synchronisées !`);
        } else {
            alert('ℹ️ Aucune pièce avec un délai entre 60 et 89 jours trouvée dans le tableau Gestion des Pièces.');
        }

    } catch (error) {
        console.error('[T60] ❌ Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation: ' + error.message);
    }
}

export async function updateT60CommandeField(pieceId, field, value) {
    if (!commandeData[pieceId]) {
        commandeData[pieceId] = {
            dateCommande: '',
            fournisseur: '',
            statut: '',
            remarques: ''
        };
    }

    commandeData[pieceId][field] = value;
    await saveToStorage('t60CommandeData', commandeData);
}

export async function renderT60Table() {
    const tbody = document.getElementById('t60TableBody');
    const countSpan = document.getElementById('t60Count');

    if (!tbody) return;

    if (!Array.isArray(longDelaiPieces) || longDelaiPieces.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 30px; text-align: center; color: #666;">
                    Aucune pièce avec délai 60-89 jours. Cliquez sur "🔄 Charger depuis Gestion des Pièces" pour charger les données.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = longDelaiPieces.length;

    // Charger arretData pour obtenir la date de début d'arrêt
    const arretData = await loadFromStorage('arretData');
    const dateDebutArret = arretData?.dateDebut || null;
    console.log('[T60] Date début arrêt:', dateDebutArret);

    longDelaiPieces.forEach((piece, index) => {
        const pieceId = piece['Désignation composant'] || `piece-${index}`;
        const commande = commandeData[pieceId] || {
            dateCommande: '',
            fournisseur: '',
            statut: '',
            remarques: ''
        };

        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';

        const delai = piece['Délai prév. livrais.'] || '-';
        const designation = piece['Désignation composant'] || '-';
        const quantite = piece['Qté réservée'] || '-';
        const unite = piece['Unité'] || '-';
        const ordre = piece['Ordre'] || '-';

        // Mettre en évidence si délai > 75 jours (urgent)
        const delaiNombre = parseInt(delai) || 0;
        const delaiColor = delaiNombre >= 75 ? '#ffa500' : '#333';
        const delaiWeight = delaiNombre >= 75 ? 'bold' : 'normal';

        // Calculer la date de commande suggérée (date début arrêt - délai en jours)
        let dateCommandeSuggeree = '';
        if (dateDebutArret && delaiNombre > 0) {
            const dateDebut = new Date(dateDebutArret);
            const dateCommande = new Date(dateDebut);
            dateCommande.setDate(dateCommande.getDate() - delaiNombre);
            // Format YYYY-MM-DD pour l'input date
            dateCommandeSuggeree = dateCommande.toISOString().split('T')[0];
        }

        // Si pas de date de commande saisie, utiliser la date suggérée
        const dateCommandeValue = commande.dateCommande || dateCommandeSuggeree;

        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">${ordre}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 600;">${designation}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${quantite}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${unite}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <span style="color: ${delaiColor}; font-weight: ${delaiWeight}; font-size: 1.1em;">${delai} jours</span>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="date" value="${dateCommandeValue}"
                       onchange="window.t60Actions.updateCommandeField('${pieceId}', 'dateCommande', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                       title="Date suggérée: ${dateCommandeSuggeree ? dateCommandeSuggeree + ' (Début arrêt - ' + delaiNombre + ' jours)' : 'Non calculable'}">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" value="${commande.fournisseur || ''}" placeholder="Nom du fournisseur"
                       onchange="window.t60Actions.updateCommandeField('${pieceId}', 'fournisseur', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <select onchange="window.t60Actions.updateCommandeField('${pieceId}', 'statut', this.value)"
                        style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="" ${commande.statut === '' ? 'selected' : ''}>-- Statut --</option>
                    <option value="À commander" ${commande.statut === 'À commander' ? 'selected' : ''}>À commander</option>
                    <option value="Commandé" ${commande.statut === 'Commandé' ? 'selected' : ''}>Commandé</option>
                    <option value="En transit" ${commande.statut === 'En transit' ? 'selected' : ''}>En transit</option>
                    <option value="Reçu" ${commande.statut === 'Reçu' ? 'selected' : ''}>Reçu</option>
                    <option value="Annulé" ${commande.statut === 'Annulé' ? 'selected' : ''}>Annulé</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <textarea onchange="window.t60Actions.updateCommandeField('${pieceId}', 'remarques', this.value)"
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px;"
                          placeholder="Remarques...">${commande.remarques || ''}</textarea>
            </td>
        `;

        tbody.appendChild(row);
    });
}

export function exportT60ToExcel() {
    if (!longDelaiPieces || longDelaiPieces.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    const exportData = longDelaiPieces.map(piece => {
        const pieceId = piece['Désignation composant'] || '';
        const commande = commandeData[pieceId] || {};

        return {
            'Ordre': piece['Ordre'] || '',
            'Désignation composant': piece['Désignation composant'] || '',
            'Qté réservée': piece['Qté réservée'] || '',
            'Unité': piece['Unité'] || '',
            'Délai prév. livrais. (jours)': piece['Délai prév. livrais.'] || '',
            'Date commande': commande.dateCommande || '',
            'Fournisseur': commande.fournisseur || '',
            'Statut': commande.statut || '',
            'Remarques': commande.remarques || ''
        };
    });

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Commandes Délai 60-89j');

    const fileName = `T60_Commandes_Delai_60-89j_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`✅ Fichier exporté: ${fileName}`);
}

export function getT60Data() {
    return {
        pieces: longDelaiPieces,
        commandes: commandeData
    };
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.syncT60FromIW38 = syncT60FromIW38;
    window.exportT60ToExcel = exportT60ToExcel;
    window.t60Actions = {
        updateCommandeField: updateT60CommandeField,
        loadT60Data,
        renderT60Table,
        syncT60FromIW38,
        exportT60ToExcel
    };
}

console.log('[T60] Module chargé');
