/**
 * @fileoverview Module de gestion des demandes de verrouillage
 * @module demandes/verrouillage
 *
 * @description
 * Gère toutes les demandes de verrouillage pour l'arrêt annuel.
 * Permet de créer, modifier, supprimer et exporter des demandes.
 *
 * Source: lignes 19964-20153 du fichier HTML original
 *
 * @requires modules/data/storage
 * @exports {Function} loadDemandesVerrouillage
 * @exports {Function} saveDemandesVerrouillage
 * @exports {Function} addDemandeVerrouillage
 * @exports {Function} deleteDemandeVerrouillage
 * @exports {Function} updateDemandeVerrouillageField
 * @exports {Function} renderDemandesVerrouillage
 * @exports {Function} updateStatsDemandesVerrouillage
 * @exports {Function} exportDemandesVerrouillageToExcel
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

// Variable globale pour stocker les demandes
let demandesVerrouillageData = [];

/**
 * Charge les demandes de verrouillage depuis localStorage
 * @returns {void}
 * @source Ligne 19970
 */
export function loadDemandesVerrouillage() {
    const saved = loadFromStorage('demandesVerrouillage');
    if (saved) {
        demandesVerrouillageData = saved;
        console.log(`[OK] ${demandesVerrouillageData.length} demandes de verrouillage chargées`);
        renderDemandesVerrouillage();
        updateStatsDemandesVerrouillage();
    }
}

/**
 * Sauvegarde les demandes dans localStorage
 * @returns {void}
 * @source Ligne 19985
 */
export function saveDemandesVerrouillage() {
    saveToStorage('demandesVerrouillage', demandesVerrouillageData);
    updateStatsDemandesVerrouillage();
    console.log('[SAVE] Demandes verrouillage sauvegardées et synchronisées avec le serveur');
}

/**
 * Ajoute une nouvelle demande de verrouillage
 * @returns {void}
 * @source Ligne 19996
 */
export function addDemandeVerrouillage() {
    const newDemande = {
        id: `verr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        equipement: '',
        localisation: '',
        typeVerrouillage: 'Électrique',
        dateDebut: '',
        dateFin: '',
        responsable: '',
        statut: 'En attente',
        remarques: ''
    };
    demandesVerrouillageData.push(newDemande);
    saveDemandesVerrouillage();
    renderDemandesVerrouillage();
}

/**
 * Supprime une demande de verrouillage
 * @param {string} demandeId - ID de la demande à supprimer
 * @returns {void}
 * @source Ligne 20014
 */
export function deleteDemandeVerrouillage(demandeId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
        demandesVerrouillageData = demandesVerrouillageData.filter(d => d.id !== demandeId);
        saveDemandesVerrouillage();
        renderDemandesVerrouillage();
    }
}

/**
 * Met à jour un champ d'une demande
 * @param {string} demandeId - ID de la demande
 * @param {string} field - Nom du champ à modifier
 * @param {any} value - Nouvelle valeur
 * @returns {void}
 * @source Ligne 20023
 */
export function updateDemandeVerrouillageField(demandeId, field, value) {
    const demande = demandesVerrouillageData.find(d => d.id === demandeId);
    if (demande) {
        demande[field] = value;
        saveDemandesVerrouillage();
    }
}

/**
 * Affiche le tableau des demandes
 * @returns {void}
 * @source Ligne 20032
 */
export function renderDemandesVerrouillage() {
    const tbody = document.getElementById('demandesVerrouillageTableBody');
    const countSpan = document.getElementById('demandesVerrouillageCount');

    if (!tbody) return;

    if (!demandesVerrouillageData || demandesVerrouillageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 30px; text-align: center; color: #666;">
                    Aucune demande de verrouillage. Cliquez sur "Ajouter une Demande" pour commencer.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    if (countSpan) countSpan.textContent = demandesVerrouillageData.length;
    tbody.innerHTML = '';

    demandesVerrouillageData.forEach((demande, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#fff3cd' : 'white';

        const statutColors = {
            'En attente': '#ffc107',
            'Approuvée': '#28a745',
            'Refusée': '#dc3545',
            'Complétée': '#17a2b8'
        };

        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${demande.equipement}"
                       onchange="updateDemandeVerrouillageField('${demande.id}', 'equipement', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${demande.localisation}"
                       onchange="updateDemandeVerrouillageField('${demande.id}', 'localisation', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateDemandeVerrouillageField('${demande.id}', 'typeVerrouillage', this.value)"
                        style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="Électrique" ${demande.typeVerrouillage === 'Électrique' ? 'selected' : ''}>Électrique</option>
                    <option value="Mécanique" ${demande.typeVerrouillage === 'Mécanique' ? 'selected' : ''}>Mécanique</option>
                    <option value="Mixte" ${demande.typeVerrouillage === 'Mixte' ? 'selected' : ''}>Mixte</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${demande.dateDebut}"
                       onchange="updateDemandeVerrouillageField('${demande.id}', 'dateDebut', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${demande.dateFin}"
                       onchange="updateDemandeVerrouillageField('${demande.id}', 'dateFin', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${demande.responsable}"
                       onchange="updateDemandeVerrouillageField('${demande.id}', 'responsable', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateDemandeVerrouillageField('${demande.id}', 'statut', this.value)"
                        style="width: 100%; padding: 5px; border: 2px solid ${statutColors[demande.statut]}; border-radius: 4px; background: ${statutColors[demande.statut]}20; font-weight: bold;">
                    <option value="En attente" ${demande.statut === 'En attente' ? 'selected' : ''}>En attente</option>
                    <option value="Approuvée" ${demande.statut === 'Approuvée' ? 'selected' : ''}>Approuvée</option>
                    <option value="Refusée" ${demande.statut === 'Refusée' ? 'selected' : ''}>Refusée</option>
                    <option value="Complétée" ${demande.statut === 'Complétée' ? 'selected' : ''}>Complétée</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea onchange="updateDemandeVerrouillageField('${demande.id}', 'remarques', this.value)"
                          style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px; min-height: 40px; resize: vertical;">${demande.remarques}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="deleteDemandeVerrouillage('${demande.id}')"
                        style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    [DELETE]
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Met à jour les statistiques des demandes
 * @returns {void}
 * @source Ligne 20101
 */
export function updateStatsDemandesVerrouillage() {
    const stats = {
        total: demandesVerrouillageData.length,
        enAttente: demandesVerrouillageData.filter(d => d.statut === 'En attente').length,
        approuvees: demandesVerrouillageData.filter(d => d.statut === 'Approuvée').length,
        refusees: demandesVerrouillageData.filter(d => d.statut === 'Refusée').length,
        completees: demandesVerrouillageData.filter(d => d.statut === 'Complétée').length
    };

    // Mettre à jour les éléments du DOM
    const statsContainer = document.getElementById('statsDemandesVerrouillage');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div style="background: #667eea; color: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.9em; opacity: 0.9;">Total</div>
                <div style="font-size: 2em; font-weight: bold;">${stats.total}</div>
            </div>
            <div style="background: #ffc107; color: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.9em; opacity: 0.9;">En attente</div>
                <div style="font-size: 2em; font-weight: bold;">${stats.enAttente}</div>
            </div>
            <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.9em; opacity: 0.9;">Approuvées</div>
                <div style="font-size: 2em; font-weight: bold;">${stats.approuvees}</div>
            </div>
            <div style="background: #dc3545; color: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.9em; opacity: 0.9;">Refusées</div>
                <div style="font-size: 2em; font-weight: bold;">${stats.refusees}</div>
            </div>
            <div style="background: #17a2b8; color: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.9em; opacity: 0.9;">Complétées</div>
                <div style="font-size: 2em; font-weight: bold;">${stats.completees}</div>
            </div>
        `;
    }
}

/**
 * Exporte les demandes vers Excel
 * @returns {void}
 * @source Ligne 20119
 */
export function exportDemandesVerrouillageToExcel() {
    if (!demandesVerrouillageData || demandesVerrouillageData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    // Préparer les données pour l'export
    const exportData = demandesVerrouillageData.map(demande => ({
        'Équipement': demande.equipement,
        'Localisation': demande.localisation,
        'Type': demande.typeVerrouillage,
        'Date Début': demande.dateDebut,
        'Date Fin': demande.dateFin,
        'Responsable': demande.responsable,
        'Statut': demande.statut,
        'Remarques': demande.remarques
    }));

    // Créer le workbook (nécessite XLSX)
    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Demandes Verrouillage');

    // Télécharger le fichier
    const fileName = `Demandes_Verrouillage_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(` Fichier exporté: ${fileName}`);
}

// Exporter les données pour accès externe
export function getDemandesVerrouillageData() {
    return demandesVerrouillageData;
}
