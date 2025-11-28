/**
 * @fileoverview Module de gestion des Commandes à Long Délai (>90 jours)
 * @module data/t88-long-delai
 *
 * @description
 * Gère les pièces avec un délai de livraison entre 30 et 59 jours
 *
 * @exports {Function} loadT88Data
 * @exports {Function} syncT88FromIW38
 * @exports {Function} renderT88Table
 * @exports {Function} exportT88ToExcel
 * @exports {Function} updateT88CommandeField
 */

import { loadFromStorage, saveToStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

let longDelaiPieces = [];
let commandeData = {}; // { pieceId: { dateCommande, statut, remarques } }
let sortOrder = 'desc'; // 'asc' ou 'desc'
let searchQuery = '';

/**
 * Set T88 long delai pieces (utilisé par server-sync pour injecter les données)
 * @param {Array} data - Données à définir
 */
export function setT88LongDelaiPieces(data) {
    longDelaiPieces = data || [];
    console.log(`[T88] ✅ ${longDelaiPieces.length} pièces long délai injectées`);
}

/**
 * Set T88 commande data (utilisé par server-sync pour injecter les données)
 * @param {Object} data - Données à définir
 */
export function setT88CommandeData(data) {
    commandeData = data || {};
    console.log(`[T88] ✅ Données commandes injectées`);
}

// Exposer globalement pour server-sync.js
if (typeof window !== 'undefined') {
    window.setT88LongDelaiPieces = setT88LongDelaiPieces;
    window.setT88CommandeData = setT88CommandeData;
}

export async function loadT88Data() {
    console.log('[T88] 🔄 Chargement des données T88...');

    // Charger les pièces longues délais sauvegardées
    const savedPieces = await loadFromStorage('t88LongDelaiPieces');
    console.log('[T88] DEBUG savedPieces:', savedPieces);

    if (savedPieces && Array.isArray(savedPieces)) {
        longDelaiPieces = savedPieces;
        console.log(`[T88] ✅ ${longDelaiPieces.length} pièces long délai chargées depuis storage`);
    } else {
        console.log('[T88] ⚠️ Aucune pièce sauvegardée trouvée (savedPieces est:', typeof savedPieces, ')');
        longDelaiPieces = [];
    }

    // Charger les données de commande sauvegardées
    const savedCommandes = await loadFromStorage('t88CommandeData');
    if (savedCommandes) {
        commandeData = savedCommandes;
        console.log('[T88] ✅ Données commandes chargées');
    } else {
        console.log('[T88] ⚠️ Aucune donnée de commande sauvegardée');
        commandeData = {};
    }

    console.log('[T88] DEBUG longDelaiPieces.length =', longDelaiPieces.length);

    // Toujours afficher le tableau (vide ou avec données)
    await renderT88Table();

    console.log('[T88] ✅ Module T88 initialisé');
}

export async function syncT88FromIW38() {
    console.log('[T88] 🔄 Synchronisation depuis Gestion des Pièces...');

    const piecesData = await loadFromStorage('piecesData');
    console.log('[T88] Données Pièces chargées:', piecesData ? `${piecesData.length} lignes` : 'aucune');

    if (!piecesData || !Array.isArray(piecesData) || piecesData.length < 2) {
        console.warn('[T88] ⚠️ Aucune donnée Pièces trouvée');
        longDelaiPieces = [];
        await renderT88Table();
        alert('⚠️ Aucune donnée dans le tableau Gestion des Pièces.\n\nVeuillez d\'abord:\n1. Aller dans "PIÈCES"\n2. Importer vos données de pièces\n3. Revenir ici et cliquer sur "🔄 Synchroniser IW38"');
        return;
    }

    try {
        console.log('[T88] Filtrage des pièces avec délai 30-59 jours...');

        // Les données sont stockées comme tableau de tableaux
        // Ligne 0 = headers, lignes suivantes = données
        const headers = piecesData[0];
        const rows = piecesData.slice(1);

        console.log('[T88] Headers:', headers);
        console.log('[T88] Nombre de lignes de données:', rows.length);

        // Trouver l'index de la colonne de délai
        // Chercher spécifiquement "délai" pour éviter de trouver "Stat. livraison"
        const delaiIndex = headers.findIndex(header =>
            header && (
                header.toLowerCase().includes('délai') ||
                header.toLowerCase().includes('delai')
            )
        );

        console.log('[T88] Index colonne de délai:', delaiIndex, '- Nom:', headers[delaiIndex]);

        if (delaiIndex === -1) {
            alert('❌ Colonne de délai non trouvée dans les données Pièces.');
            return;
        }

        // Trouver les indices des autres colonnes importantes
        const designationIndex = headers.findIndex(h => h && (h.includes('Désignation') || h.includes('composant')));
        const ordreIndex = headers.findIndex(h => h && h.toLowerCase() === 'ordre');
        const articleIndex = headers.findIndex(h => h && h.toLowerCase().trim() === 'article');
        const qteIndex = headers.findIndex(h => h && h.toLowerCase().includes('qté'));
        const uniteIndex = headers.findIndex(h => h && h.toLowerCase().includes('unité'));

        console.log('[T88] Index des colonnes trouvées:');
        console.log('[T88]   - designationIndex:', designationIndex, headers[designationIndex]);
        console.log('[T88]   - ordreIndex:', ordreIndex, headers[ordreIndex]);
        console.log('[T88]   - articleIndex:', articleIndex, headers[articleIndex]);
        console.log('[T88]   - qteIndex:', qteIndex, headers[qteIndex]);
        console.log('[T88]   - uniteIndex:', uniteIndex, headers[uniteIndex]);

        // Filtrer les pièces avec délai 30-59 jours
        longDelaiPieces = rows.filter(row => {
            const delai = row[delaiIndex];
            const delaiNombre = parseInt(delai) || 0;

            if (delaiNombre >= 30 && delaiNombre < 60) {
                console.log('[T88] Pièce trouvée avec délai', delaiNombre, ':', row[designationIndex]);
            }

            return delaiNombre >= 30 && delaiNombre < 60;
        }).map(row => {
            // Convertir chaque ligne en objet pour compatibilité avec renderT88Table
            return {
                'Ordre': row[ordreIndex] || '',
                'Désignation composant': row[designationIndex] || '',
                'Article': row[articleIndex] || '',
                'Qté réservée': row[qteIndex] || '',
                'Unité': row[uniteIndex] || '',
                'Délai prév. livrais.': row[delaiIndex] || ''
            };
        });

        console.log(`[T88] ✅ ${longDelaiPieces.length} pièces avec délai 30-59 jours trouvées`);

        // Sauvegarder les pièces filtrées pour qu'elles persistent après refresh
        console.log('[T88] DEBUG Avant sauvegarde, longDelaiPieces.length =', longDelaiPieces.length);
        await saveToStorage('t88LongDelaiPieces', longDelaiPieces);
        console.log('[T88] 💾 Pièces long délai sauvegardées dans storage avec clé: t88LongDelaiPieces');

        // Vérifier immédiatement que les données ont été sauvegardées
        const verification = await loadFromStorage('t88LongDelaiPieces');
        console.log('[T88] VERIFICATION: données rechargées =', verification ? verification.length : 'null', 'pièces');

        await renderT88Table();

        if (longDelaiPieces.length > 0) {
            alert(`✅ ${longDelaiPieces.length} pièces avec délai 30-59 jours synchronisées !`);
        } else {
            alert('ℹ️ Aucune pièce avec un délai entre 30 et 59 jours trouvée dans le tableau Gestion des Pièces.');
        }

    } catch (error) {
        console.error('[T88] ❌ Erreur lors de la synchronisation:', error);
        alert('❌ Erreur lors de la synchronisation: ' + error.message);
    }
}

export async function updateT88CommandeField(pieceId, field, value) {
    if (!commandeData[pieceId]) {
        commandeData[pieceId] = {
            dateCommande: '',
            statut: '',
            remarques: ''
        };
    }

    commandeData[pieceId][field] = value;
    await saveToStorage('t88CommandeData', commandeData);

    // Re-rendre le tableau pour mettre à jour les couleurs de statut
    await renderT88Table();
}

/**
 * Bascule l'ordre de tri et re-rend le tableau
 */
export function toggleT88Sort() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    renderT88Table();
}

/**
 * Met à jour la recherche et re-rend le tableau
 * @param {string} query - Requête de recherche
 */
export function updateT88Search(query) {
    searchQuery = query.toLowerCase();
    renderT88Table();
}

export async function renderT88Table() {
    const tbody = document.getElementById('t88TableBody');
    const countSpan = document.getElementById('t88Count');

    console.log('[T88] 📊 Rendu du tableau:', longDelaiPieces.length, 'pièces');
    console.log('[T88] 🔍 DEBUG: tbody element:', tbody);

    if (!tbody) {
        console.warn('[T88] ⚠️ Tableau tbody non trouvé - DOM pas encore chargé?');
        return;
    }

    if (!Array.isArray(longDelaiPieces) || longDelaiPieces.length === 0) {
        console.log('[T88] ⚠️ Aucune pièce à afficher (array vide ou invalide)');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 30px; text-align: center; color: #666;">
                    Aucune pièce avec délai 30-59 jours. Cliquez sur "🔄 Charger depuis Gestion des Pièces" pour charger les données.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    console.log('[T88] ✅ Array valide avec', longDelaiPieces.length, 'pièces');
    console.log('[T88] 🔍 DEBUG: Premier élément:', JSON.stringify(longDelaiPieces[0], null, 2));

    // Appliquer la recherche
    let filteredPieces = longDelaiPieces;
    if (searchQuery.trim() !== '') {
        filteredPieces = longDelaiPieces.filter(piece => {
            const ordre = (piece['Ordre'] || '').toLowerCase();
            const designation = (piece['Désignation composant'] || '').toLowerCase();
            const article = (piece['Article'] || '').toLowerCase();

            return ordre.includes(searchQuery) ||
                   designation.includes(searchQuery) ||
                   article.includes(searchQuery);
        });
    }

    // Appliquer le tri par délai
    const sortedPieces = [...filteredPieces].sort((a, b) => {
        const delaiA = parseInt(a['Délai prév. livrais.']) || 0;
        const delaiB = parseInt(b['Délai prév. livrais.']) || 0;

        return sortOrder === 'asc' ? delaiA - delaiB : delaiB - delaiA;
    });

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = `${sortedPieces.length} / ${longDelaiPieces.length}`;

    // Charger arretData pour obtenir la date de début d'arrêt
    const arretData = await loadFromStorage('arretData');
    const dateDebutArret = arretData?.dateDebut || null;
    console.log('[T88] Date début arrêt:', dateDebutArret);

    sortedPieces.forEach((piece, index) => {
        const pieceId = piece['Désignation composant'] || `piece-${index}`;
        const commande = commandeData[pieceId] || {
            dateCommande: '',
            statut: '',
            remarques: ''
        };

        const row = document.createElement('tr');

        // Définir la couleur de fond selon le statut
        let backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white'; // Défaut
        switch(commande.statut) {
            case 'Annulé':
                backgroundColor = '#e0e0e0'; // Gris
                break;
            case 'Commandé':
            case 'En transit':
                backgroundColor = '#ffe0b2'; // Orange clair
                break;
            case 'Reçu':
                backgroundColor = '#d4edda'; // Vert clair
                break;
            case 'À commander':
                backgroundColor = '#f8d7da'; // Rouge clair
                break;
        }
        row.style.background = backgroundColor;

        const delai = piece['Délai prév. livrais.'] || '-';
        const designation = piece['Désignation composant'] || '-';
        const fournisseur = piece['Fournisseur'] || piece['Fabricant'] || '-';
        const quantite = piece['Qté réservée'] || '-';
        const unite = piece['Unité'] || '-';
        const ordre = piece['Ordre'] || '-';

        // Mettre en évidence si délai > 120 jours (très urgent)
        const delaiNombre = parseInt(delai) || 0;
        const delaiColor = delaiNombre > 120 ? '#dc3545' : (delaiNombre > 90 ? '#ffa500' : '#333');
        const delaiWeight = delaiNombre > 120 ? 'bold' : 'normal';

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
                       onchange="window.t88Actions.updateCommandeField('${pieceId}', 'dateCommande', this.value)"
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                       title="Date suggérée: ${dateCommandeSuggeree ? dateCommandeSuggeree + ' (Début arrêt - ' + delaiNombre + ' jours)' : 'Non calculable'}">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${fournisseur}</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <select onchange="window.t88Actions.updateCommandeField('${pieceId}', 'statut', this.value)"
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
                <textarea onchange="window.t88Actions.updateCommandeField('${pieceId}', 'remarques', this.value)"
                          style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px;"
                          placeholder="Remarques...">${commande.remarques || ''}</textarea>
            </td>
        `;

        tbody.appendChild(row);
        console.log(`[T88] ➕ Ligne ${index + 1}/${sortedPieces.length} ajoutée - Ordre: ${ordre}`);
    });

    console.log('[T88] ✅✅✅ RENDU TERMINÉ ✅✅✅');
    console.log('[T88] 📊 tbody.children.length:', tbody.children.length);
    console.log('[T88] 📊 tbody.innerHTML.length:', tbody.innerHTML.length);
}

export function exportT88ToExcel() {
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
            'Fournisseur': piece['Fournisseur'] || piece['Fabricant'] || '',
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

    XLSX.utils.book_append_sheet(wb, ws, 'Commandes Long Délai');

    const fileName = `T88_Commandes_Long_Delai_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(`✅ Fichier exporté: ${fileName}`);
}

export function getT88Data() {
    return {
        pieces: longDelaiPieces,
        commandes: commandeData
    };
}
