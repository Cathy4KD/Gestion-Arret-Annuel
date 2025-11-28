/**
 * @fileoverview Gestionnaire générique de rencontres multiples
 * @module data/generic-meeting-manager
 *
 * Ce module fournit une classe réutilisable pour gérer plusieurs rencontres
 * avec des travaux, documents et comptes rendus pour chaque type de rencontre.
 */

import { saveToStorage, loadFromStorage } from '../sync/storage-wrapper.js';

/**
 * Classe pour gérer un type de rencontre spécifique
 */
export class MeetingManager {
    /**
     * @param {string} storageKey - Clé de stockage unique (ex: 't78RencontresData')
     * @param {string} containerId - ID du conteneur HTML (ex: 'rencontresListContainer-t78')
     * @param {string} tableBodyId - ID du tbody du tableau (ex: 't78TableBody')
     * @param {string} documentsListId - ID du conteneur de documents (ex: 't78DocumentsList')
     */
    constructor(storageKey, containerId, tableBodyId, documentsListId) {
        this.storageKey = storageKey;
        this.containerId = containerId;
        this.tableBodyId = tableBodyId;
        this.documentsListId = documentsListId;

        this.rencontres = [];
        this.currentRencontreId = null;
        this.saveTimer = null;
    }

    /**
     * Charge les données depuis le serveur
     */
    async loadData() {
        if (this.rencontres.length === 0) {
            console.log(`[MEETING-${this.storageKey}] Chargement depuis le serveur...`);
            const saved = await loadFromStorage(this.storageKey);

            if (saved && Array.isArray(saved)) {
                this.rencontres = saved;
                console.log(`[MEETING-${this.storageKey}] ${this.rencontres.length} rencontre(s) chargée(s)`);
            }
        }

        this.renderRencontresList();

        if (this.rencontres.length > 0 && !this.currentRencontreId) {
            this.selectRencontre(this.rencontres[0].id);
        } else if (this.rencontres.length === 0) {
            this.addNewRencontre();
        }
    }

    /**
     * Sauvegarde différée
     */
    scheduleSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
            this.saveData();
        }, 1000);
    }

    /**
     * Sauvegarde les données
     */
    async saveData() {
        try {
            await saveToStorage(this.storageKey, this.rencontres);
            console.log(`[MEETING-${this.storageKey}] Données sauvegardées`);
        } catch (error) {
            console.error(`[MEETING-${this.storageKey}] Erreur sauvegarde:`, error);
        }
    }

    /**
     * Ajoute une nouvelle rencontre
     */
    addNewRencontre() {
        const newRencontre = {
            id: 'rencontre-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            titre: `Rencontre ${this.rencontres.length + 1}`,
            dateRencontre: '',
            participants: '',
            compteRendu: '',
            travaux: [],
            documents: [],
            dateCreation: new Date().toISOString()
        };

        this.rencontres.unshift(newRencontre);
        this.renderRencontresList();
        this.selectRencontre(newRencontre.id);
        this.scheduleSave();
    }

    /**
     * Sélectionne une rencontre
     */
    selectRencontre(rencontreId) {
        this.currentRencontreId = rencontreId;
        this.renderRencontresList();
        this.loadCurrentRencontre();
    }

    /**
     * Charge la rencontre actuelle dans le formulaire
     */
    loadCurrentRencontre() {
        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre) return;

        // Charger les champs communs
        const prefix = this.storageKey.replace('Data', '').replace('Rencontres', '').toLowerCase();

        const titreInput = document.getElementById(`${prefix}RencontreTitre`);
        const dateInput = document.getElementById(`${prefix}DateRencontre`);
        const participantsInput = document.getElementById(`${prefix}Participants`);
        const compteRenduInput = document.getElementById(`${prefix}CompteRendu`);

        if (titreInput) titreInput.value = rencontre.titre || '';
        if (dateInput) dateInput.value = rencontre.dateRencontre || '';
        if (participantsInput) participantsInput.value = rencontre.participants || '';
        if (compteRenduInput) compteRenduInput.value = rencontre.compteRendu || '';

        this.renderTravauxTable();
        this.renderDocumentsList();
    }

    /**
     * Sauvegarde les modifications de la rencontre actuelle
     */
    saveCurrentRencontre() {
        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre) return;

        const prefix = this.storageKey.replace('Data', '').replace('Rencontres', '').toLowerCase();

        const dateInput = document.getElementById(`${prefix}DateRencontre`);
        const participantsInput = document.getElementById(`${prefix}Participants`);
        const compteRenduInput = document.getElementById(`${prefix}CompteRendu`);

        rencontre.dateRencontre = dateInput ? dateInput.value : '';
        rencontre.participants = participantsInput ? participantsInput.value : '';
        rencontre.compteRendu = compteRenduInput ? compteRenduInput.value : '';

        this.scheduleSave();
    }

    /**
     * Met à jour le titre de la rencontre
     */
    updateRencontreTitre(newTitre) {
        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre) return;

        rencontre.titre = newTitre;
        this.renderRencontresList();
        this.scheduleSave();
    }

    /**
     * Supprime une rencontre
     */
    deleteRencontre(rencontreId) {
        if (!confirm('Voulez-vous vraiment supprimer cette rencontre ?')) return;

        this.rencontres = this.rencontres.filter(r => r.id !== rencontreId);

        if (this.currentRencontreId === rencontreId) {
            this.currentRencontreId = this.rencontres.length > 0 ? this.rencontres[0].id : null;
        }

        this.renderRencontresList();

        if (this.currentRencontreId) {
            this.loadCurrentRencontre();
        }

        this.scheduleSave();
    }

    /**
     * Affiche la liste des rencontres dans la sidebar
     */
    renderRencontresList() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        if (this.rencontres.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">Aucune rencontre</p>';
            return;
        }

        container.innerHTML = this.rencontres.map(rencontre => {
            const isSelected = rencontre.id === this.currentRencontreId;
            const dateStr = rencontre.dateRencontre ? new Date(rencontre.dateRencontre).toLocaleDateString('fr-FR') : 'Date non définie';

            return `
                <div onclick="window.meetingActions['${this.storageKey}'].selectRencontre('${rencontre.id}')"
                     style="padding: 12px; background: ${isSelected ? '#e3f2fd' : 'white'}; border: 2px solid ${isSelected ? '#667eea' : '#dee2e6'}; border-radius: 8px; cursor: pointer; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${rencontre.titre}</div>
                            <div style="font-size: 0.85em; color: #666;">📅 ${dateStr}</div>
                            <div style="font-size: 0.85em; color: #666;">📋 ${rencontre.travaux.length} travau(x)</div>
                        </div>
                        <button onclick="event.stopPropagation(); window.meetingActions['${this.storageKey}'].deleteRencontre('${rencontre.id}')"
                                style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Ajoute un travail
     */
    addTravail() {
        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre) return;

        const newTravail = {
            id: 'travail-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            description: '',
            responsable: '',
            priorite: 'Moyenne',
            commentaires: ''
        };

        rencontre.travaux.unshift(newTravail);
        this.renderTravauxTable();
        this.scheduleSave();
    }

    /**
     * Met à jour un champ de travail
     */
    updateTravailField(travailId, field, value) {
        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre) return;

        const travail = rencontre.travaux.find(t => t.id === travailId);
        if (travail) {
            travail[field] = value;
            this.scheduleSave();
        }
    }

    /**
     * Supprime un travail
     */
    deleteTravail(travailId) {
        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre) return;

        rencontre.travaux = rencontre.travaux.filter(t => t.id !== travailId);
        this.renderTravauxTable();
        this.scheduleSave();
    }

    /**
     * Affiche le tableau des travaux
     */
    renderTravauxTable() {
        const tbody = document.getElementById(this.tableBodyId);
        if (!tbody) return;

        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre || rencontre.travaux.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 30px; text-align: center; color: #666;">
                        Aucun travail ajouté. Cliquez sur "Ajouter un Travail" pour commencer.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rencontre.travaux.map(travail => `
            <tr>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                    <textarea onchange="window.meetingActions['${this.storageKey}'].updateTravailField('${travail.id}', 'description', this.value)"
                              style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; min-height: 60px;">${travail.description || ''}</textarea>
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                    <input type="text" value="${travail.responsable || ''}"
                           onchange="window.meetingActions['${this.storageKey}'].updateTravailField('${travail.id}', 'responsable', this.value)"
                           style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                    <select onchange="window.meetingActions['${this.storageKey}'].updateTravailField('${travail.id}', 'priorite', this.value)"
                            style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="Haute" ${travail.priorite === 'Haute' ? 'selected' : ''}>Haute</option>
                        <option value="Moyenne" ${travail.priorite === 'Moyenne' ? 'selected' : ''}>Moyenne</option>
                        <option value="Basse" ${travail.priorite === 'Basse' ? 'selected' : ''}>Basse</option>
                    </select>
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                    <input type="text" value="${travail.commentaires || ''}"
                           onchange="window.meetingActions['${this.storageKey}'].updateTravailField('${travail.id}', 'commentaires', this.value)"
                           style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <button onclick="window.meetingActions['${this.storageKey}'].deleteTravail('${travail.id}')"
                            style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Ajoute un document
     */
    addDocument() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
        input.multiple = true;

        input.onchange = async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
            if (!rencontre) return;

            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const doc = {
                        id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        dataUrl: event.target.result,
                        size: file.size,
                        uploadDate: new Date().toISOString()
                    };

                    rencontre.documents.push(doc);
                    this.renderDocumentsList();
                    this.scheduleSave();
                };
                reader.readAsDataURL(file);
            }
        };

        input.click();
    }

    /**
     * Supprime un document
     */
    deleteDocument(docId) {
        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre) return;

        rencontre.documents = rencontre.documents.filter(d => d.id !== docId);
        this.renderDocumentsList();
        this.scheduleSave();
    }

    /**
     * Affiche la liste des documents
     */
    renderDocumentsList() {
        const container = document.getElementById(this.documentsListId);
        if (!container) return;

        const rencontre = this.rencontres.find(r => r.id === this.currentRencontreId);
        if (!rencontre || !rencontre.documents || rencontre.documents.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Aucun document ajouté.</p>';
            return;
        }

        container.innerHTML = rencontre.documents.map(doc => {
            const sizeKB = (doc.size / 1024).toFixed(1);
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <span style="font-size: 1.5em;">📄</span>
                        <div>
                            <div style="font-weight: bold; color: #333;">${doc.name}</div>
                            <div style="font-size: 0.85em; color: #666;">${sizeKB} KB</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <a href="${doc.dataUrl}" download="${doc.name}"
                           style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; font-size: 0.85em;">
                            ⬇️ Télécharger
                        </a>
                        <button onclick="window.meetingActions['${this.storageKey}'].deleteDocument('${doc.id}')"
                                style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialiser l'objet global pour stocker les instances
if (typeof window !== 'undefined') {
    window.meetingActions = window.meetingActions || {};
}
