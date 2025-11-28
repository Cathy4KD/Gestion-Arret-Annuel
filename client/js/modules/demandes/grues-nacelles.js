/**
 * @fileoverview Module de gestion des demandes de grues et nacelles
 * @module demandes/grues-nacelles
 *
 * @description
 * Gère toutes les demandes de grues et nacelles pour l'arrêt annuel.
 * Permet de créer, modifier, supprimer et exporter des demandes.
 *
 * Source: lignes 20154-20347 du fichier HTML original
 *
 * @requires modules/data/storage
 * @exports {Function} loadDemandesGruesNacelles
 * @exports {Function} saveDemandesGruesNacelles
 * @exports {Function} addDemandeGrueNacelle
 * @exports {Function} deleteDemandeGrueNacelle
 * @exports {Function} updateDemandeGrueNacelleField
 * @exports {Function} renderDemandesGruesNacelles
 * @exports {Function} updateStatsDemandesGruesNacelles
 * @exports {Function} exportDemandesGruesNacellesToExcel
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';
import { autoSizeColumns } from '../import-export/excel-export.js';

// Variable globale pour stocker les demandes
let demandesGruesNacellesData = [];

/**
 * Charge les demandes de grues/nacelles depuis localStorage
 * @returns {void}
 * @source Ligne 20154
 */
export function loadDemandesGruesNacelles() {
    const saved = loadFromStorage('demandesGruesNacelles');
    if (saved) {
        demandesGruesNacellesData = saved;
        console.log(`[OK] ${demandesGruesNacellesData.length} demandes grues/nacelles chargées`);
        renderDemandesGruesNacelles();
        updateStatsDemandesGruesNacelles();
    }
}

/**
 * Sauvegarde les demandes dans localStorage
 * @returns {void}
 * @source Ligne 20169
 */
export function saveDemandesGruesNacelles() {
    saveToStorage('demandesGruesNacelles', demandesGruesNacellesData);
    updateStatsDemandesGruesNacelles();
    console.log('[SAVE] Demandes grues/nacelles sauvegardées et synchronisées avec le serveur');
}

/**
 * Ajoute une nouvelle demande de grue/nacelle
 * @returns {void}
 * @source Ligne 20180
 */
export function addDemandeGrueNacelle() {
    const newDemande = {
        id: `grue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'Grue',
        capacite: '',
        localisation: '',
        dateDebut: '',
        dateFin: '',
        duree: '',
        responsable: '',
        statut: 'En attente',
        remarques: ''
    };
    demandesGruesNacellesData.push(newDemande);
    saveDemandesGruesNacelles();
    renderDemandesGruesNacelles();
}

/**
 * Supprime une demande de grue/nacelle
 * @param {string} demandeId - ID de la demande à supprimer
 * @returns {void}
 * @source Ligne 20199
 */
export function deleteDemandeGrueNacelle(demandeId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
        demandesGruesNacellesData = demandesGruesNacellesData.filter(d => d.id !== demandeId);
        saveDemandesGruesNacelles();
        renderDemandesGruesNacelles();
    }
}

/**
 * Met à jour un champ d'une demande
 * @param {string} demandeId - ID de la demande
 * @param {string} field - Nom du champ à modifier
 * @param {any} value - Nouvelle valeur
 * @returns {void}
 * @source Ligne 20208
 */
export function updateDemandeGrueNacelleField(demandeId, field, value) {
    const demande = demandesGruesNacellesData.find(d => d.id === demandeId);
    if (demande) {
        demande[field] = value;
        saveDemandesGruesNacelles();
    }
}

/**
 * Affiche le tableau des demandes
 * @returns {void}
 * @source Ligne 20217
 */
export function renderDemandesGruesNacelles() {
    const tbody = document.getElementById('demandesGruesNacellesTableBody');
    const countSpan = document.getElementById('demandesGruesNacellesCount');

    if (!tbody) return;

    if (!demandesGruesNacellesData || demandesGruesNacellesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="padding: 30px; text-align: center; color: #666;">
                    Aucune demande de grue/nacelle. Cliquez sur "Ajouter une Demande" pour commencer.
                </td>
            </tr>
        `;
        if (countSpan) countSpan.textContent = '0';
        return;
    }

    if (countSpan) countSpan.textContent = demandesGruesNacellesData.length;
    tbody.innerHTML = '';

    demandesGruesNacellesData.forEach((demande, index) => {
        const row = document.createElement('tr');
        row.style.background = index % 2 === 0 ? '#e3f2fd' : 'white';

        const statutColors = {
            'En attente': '#ffc107',
            'Approuvée': '#28a745',
            'Refusée': '#dc3545',
            'En cours': '#17a2b8',
            'Complétée': '#6c757d'
        };

        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateDemandeGrueNacelleField('${demande.id}', 'type', this.value)"
                        style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="Grue" ${demande.type === 'Grue' ? 'selected' : ''}>Grue</option>
                    <option value="Nacelle" ${demande.type === 'Nacelle' ? 'selected' : ''}>Nacelle</option>
                    <option value="Chariot élévateur" ${demande.type === 'Chariot élévateur' ? 'selected' : ''}>Chariot élévateur</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${demande.capacite}"
                       onchange="updateDemandeGrueNacelleField('${demande.id}', 'capacite', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;"
                       placeholder="Ex: 50 tonnes">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${demande.localisation}"
                       onchange="updateDemandeGrueNacelleField('${demande.id}', 'localisation', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${demande.dateDebut}"
                       onchange="updateDemandeGrueNacelleField('${demande.id}', 'dateDebut', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="date" value="${demande.dateFin}"
                       onchange="updateDemandeGrueNacelleField('${demande.id}', 'dateFin', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${demande.duree}"
                       onchange="updateDemandeGrueNacelleField('${demande.id}', 'duree', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;"
                       placeholder="Ex: 5 jours">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <input type="text" value="${demande.responsable}"
                       onchange="updateDemandeGrueNacelleField('${demande.id}', 'responsable', this.value)"
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <select onchange="updateDemandeGrueNacelleField('${demande.id}', 'statut', this.value)"
                        style="width: 100%; padding: 5px; border: 2px solid ${statutColors[demande.statut]}; border-radius: 4px; background: ${statutColors[demande.statut]}20; font-weight: bold;">
                    <option value="En attente" ${demande.statut === 'En attente' ? 'selected' : ''}>En attente</option>
                    <option value="Approuvée" ${demande.statut === 'Approuvée' ? 'selected' : ''}>Approuvée</option>
                    <option value="Refusée" ${demande.statut === 'Refusée' ? 'selected' : ''}>Refusée</option>
                    <option value="En cours" ${demande.statut === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Complétée" ${demande.statut === 'Complétée' ? 'selected' : ''}>Complétée</option>
                </select>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">
                <textarea onchange="updateDemandeGrueNacelleField('${demande.id}', 'remarques', this.value)"
                          style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px; min-height: 40px; resize: vertical;">${demande.remarques}</textarea>
            </td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                <button onclick="deleteDemandeGrueNacelle('${demande.id}')"
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
 * @source Ligne 20294
 */
export function updateStatsDemandesGruesNacelles() {
    const stats = {
        total: demandesGruesNacellesData.length,
        enAttente: demandesGruesNacellesData.filter(d => d.statut === 'En attente').length,
        approuvees: demandesGruesNacellesData.filter(d => d.statut === 'Approuvée').length,
        refusees: demandesGruesNacellesData.filter(d => d.statut === 'Refusée').length,
        enCours: demandesGruesNacellesData.filter(d => d.statut === 'En cours').length,
        completees: demandesGruesNacellesData.filter(d => d.statut === 'Complétée').length
    };

    const statsContainer = document.getElementById('statsDemandesGruesNacelles');
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
            <div style="background: #17a2b8; color: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.9em; opacity: 0.9;">En cours</div>
                <div style="font-size: 2em; font-weight: bold;">${stats.enCours}</div>
            </div>
            <div style="background: #6c757d; color: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.9em; opacity: 0.9;">Complétées</div>
                <div style="font-size: 2em; font-weight: bold;">${stats.completees}</div>
            </div>
        `;
    }
}

/**
 * Exporte les demandes vers Excel
 * @returns {void}
 * @source Ligne 20312
 */
export function exportDemandesGruesNacellesToExcel() {
    if (!demandesGruesNacellesData || demandesGruesNacellesData.length === 0) {
        alert('[WARNING] Aucune donnée à exporter.');
        return;
    }

    const exportData = demandesGruesNacellesData.map(demande => ({
        'Type': demande.type,
        'Capacité': demande.capacite,
        'Localisation': demande.localisation,
        'Date Début': demande.dateDebut,
        'Date Fin': demande.dateFin,
        'Durée': demande.duree,
        'Responsable': demande.responsable,
        'Statut': demande.statut,
        'Remarques': demande.remarques
    }));

    if (typeof XLSX === 'undefined') {
        alert('[ERROR] Bibliothèque XLSX non chargée');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster automatiquement la largeur des colonnes
    ws['!cols'] = autoSizeColumns(ws, exportData);

    XLSX.utils.book_append_sheet(wb, ws, 'Demandes Grues Nacelles');

    const fileName = `Demandes_Grues_Nacelles_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    console.log(` Fichier exporté: ${fileName}`);
}

export function getDemandesGruesNacellesData() {
    return demandesGruesNacellesData;
}
