/**
 * Analyseur de Liens de Données
 * @module assistant/data-analyzer
 *
 * Trouve toutes les relations entre les données du projet
 * C'EST LE CERVEAU QUI FAIT LES LIENS INTELLIGENTS
 */

import { loadFromStorage } from '../sync/storage-wrapper.js';

export class DataAnalyzer {
    constructor(aiEngine) {
        this.ai = aiEngine;
        this.dataGraph = {
            nodes: [],
            edges: []
        };
        this.cache = new Map();
        this.relationshipRules = new Map();
        this.setupRelationshipRules();
    }

    /**
     * Configure les règles de relations entre données
     * NOUVELLE VERSION: Détecte les liens spécifiques du projet (IW37N, Numéro d'ordre, Designation)
     */
    setupRelationshipRules() {
        // ===== RÈGLES PRINCIPALES DU PROJET =====

        // Règle CRITIQUE: Lien par Numéro d'ordre (CLEF PRINCIPALE)
        this.relationshipRules.set('link-by-order-number', {
            fields: ['numeroOrdre', 'numero_ordre', 'orderNumber', 'ordre', 'N° Ordre'],
            strength: 1.0,  // Force maximale
            bidirectional: true,
            description: 'Lien principal via Numéro d\'ordre'
        });

        // Règle CRITIQUE: Lien par Designation d'opération (CLEF SECONDAIRE)
        this.relationshipRules.set('link-by-designation', {
            fields: ['designationOperation', 'designation_operation', 'designation', 'Désignation opération'],
            strength: 0.95,  // Très fort
            bidirectional: true,
            description: 'Lien via Designation d\'opération'
        });

        // Règle CRITIQUE: Lien via IW37N (FICHIER CENTRAL)
        this.relationshipRules.set('link-by-iw37n', {
            fields: ['iw37n', 'IW37N', 'iw37nId', 'iw37n_id'],
            strength: 1.0,  // Force maximale
            bidirectional: true,
            description: 'Lien central via IW37N'
        });

        // ===== RÈGLES CLASSIQUES =====

        // Règle: Tâche → Équipement
        this.relationshipRules.set('task-equipment', {
            from: 'task',
            to: 'equipment',
            field: 'equipementId',
            strength: 0.9,
            bidirectional: true
        });

        // Règle: Tâche → Pièce
        this.relationshipRules.set('task-piece', {
            from: 'task',
            to: 'piece',
            field: 'pieceIds',
            isArray: true,
            strength: 0.8,
            bidirectional: true
        });

        // Règle: Tâche → Équipe
        this.relationshipRules.set('task-team', {
            from: 'task',
            to: 'team',
            field: 'teamId',
            strength: 0.7,
            bidirectional: true
        });

        // Règle: Tâche → Réunion
        this.relationshipRules.set('task-meeting', {
            from: 'task',
            to: 'meeting',
            field: 'meetingId',
            strength: 0.6,
            bidirectional: true
        });

        // Règle: Tâche → Responsable
        this.relationshipRules.set('task-responsible', {
            from: 'task',
            to: 'person',
            field: 'responsable',
            strength: 0.9,
            bidirectional: true
        });

        console.log(`[ANALYZER] ✅ ${this.relationshipRules.size} règles de relations configurées`);
        console.log('[ANALYZER] 🔗 Détection activée pour: Numéro d\'ordre, Designation, IW37N');
    }

    /**
     * Construit le graphe complet des relations
     */
    async buildDataGraph() {
        console.log('[ANALYZER] Construction du graphe de données...');

        const startTime = Date.now();

        // Réinitialiser le graphe
        this.dataGraph = {
            nodes: [],
            edges: [],
            metadata: {
                buildDate: new Date(),
                version: '1.0.0'
            }
        };

        // Charger toutes les données
        const [tasks, equipments, pieces, teams, meetings] = await Promise.all([
            this.loadTasks(),
            this.loadEquipments(),
            this.loadPieces(),
            this.loadTeams(),
            this.loadMeetings()
        ]);

        // Ajouter les nœuds au graphe
        this.addNodesToGraph('task', tasks);
        this.addNodesToGraph('equipment', equipments);
        this.addNodesToGraph('piece', pieces);
        this.addNodesToGraph('team', teams);
        this.addNodesToGraph('meeting', meetings);

        // Construire les relations (edges)
        this.buildRelationships(tasks, equipments, pieces, teams, meetings);

        const duration = Date.now() - startTime;

        this.dataGraph.metadata.buildDuration = duration;
        this.dataGraph.metadata.nodeCount = this.dataGraph.nodes.length;
        this.dataGraph.metadata.edgeCount = this.dataGraph.edges.length;

        console.log(`[ANALYZER] Graphe construit en ${duration}ms: ${this.dataGraph.nodes.length} nœuds, ${this.dataGraph.edges.length} relations`);

        return this.dataGraph;
    }

    /**
     * Ajoute des nœuds au graphe
     */
    addNodesToGraph(type, items) {
        if (!Array.isArray(items)) return;

        items.forEach(item => {
            this.dataGraph.nodes.push({
                id: this.generateNodeId(type, item),
                type,
                data: item,
                metadata: {
                    addedAt: new Date()
                }
            });
        });
    }

    /**
     * Génère un ID unique pour un nœud
     */
    generateNodeId(type, item) {
        return `${type}:${item.id || item._id || Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Construit toutes les relations
     */
    buildRelationships(tasks, equipments, pieces, teams, meetings) {
        console.log('[ANALYZER] Construction des relations...');

        // ===== NOUVEAUTÉ: Liens par Numéro d'ordre, Designation, IW37N =====
        this.buildSmartLinks(tasks, equipments, pieces, teams, meetings);

        // Relations Tâches → Équipements
        tasks.forEach(task => {
            if (task.equipementId) {
                const equipment = equipments.find(e => e.id === task.equipementId);

                this.addEdge(
                    this.generateNodeId('task', task),
                    this.generateNodeId('equipment', equipment || { id: task.equipementId }),
                    'uses_equipment',
                    equipment ? 1.0 : 0.3 // Moins de confiance si l'équipement n'existe pas
                );
            }
        });

        // Relations Tâches → Pièces
        tasks.forEach(task => {
            if (task.pieceIds && Array.isArray(task.pieceIds)) {
                task.pieceIds.forEach(pieceId => {
                    const piece = pieces.find(p => p.id === pieceId);

                    this.addEdge(
                        this.generateNodeId('task', task),
                        this.generateNodeId('piece', piece || { id: pieceId }),
                        'requires_piece',
                        piece ? 1.0 : 0.3
                    );
                });
            }
        });

        // Relations Tâches → Équipes
        tasks.forEach(task => {
            if (task.teamId) {
                const team = teams.find(t => t.id === task.teamId);

                this.addEdge(
                    this.generateNodeId('task', task),
                    this.generateNodeId('team', team || { id: task.teamId }),
                    'assigned_to_team',
                    team ? 1.0 : 0.3
                );
            }
        });

        // Relations Tâches → Réunions
        tasks.forEach(task => {
            if (task.meetingId) {
                const meeting = meetings.find(m => m.id === task.meetingId);

                this.addEdge(
                    this.generateNodeId('task', task),
                    this.generateNodeId('meeting', meeting || { id: task.meetingId }),
                    'discussed_in_meeting',
                    meeting ? 1.0 : 0.3
                );
            }
        });

        // Relations basées sur les noms (détection intelligente)
        this.detectNameBasedRelationships(tasks, equipments);
        this.detectDateBasedRelationships(tasks, meetings);
    }

    /**
     * Détecte les relations basées sur les noms
     */
    detectNameBasedRelationships(tasks, equipments) {
        tasks.forEach(task => {
            if (!task.titre) return;

            const taskTitle = task.titre.toLowerCase();

            equipments.forEach(equipment => {
                if (!equipment.nom) return;

                const equipmentName = equipment.nom.toLowerCase();

                // Vérifier si le nom de l'équipement est dans le titre de la tâche
                if (taskTitle.includes(equipmentName) || equipmentName.includes(taskTitle)) {
                    // Vérifier qu'il n'y a pas déjà une relation directe
                    const existingEdge = this.dataGraph.edges.find(e =>
                        e.from === this.generateNodeId('task', task) &&
                        e.to === this.generateNodeId('equipment', equipment)
                    );

                    if (!existingEdge) {
                        this.addEdge(
                            this.generateNodeId('task', task),
                            this.generateNodeId('equipment', equipment),
                            'potential_link_by_name',
                            0.7 // Confiance modérée
                        );
                    }
                }
            });
        });
    }

    /**
     * Détecte les relations basées sur les dates
     */
    detectDateBasedRelationships(tasks, meetings) {
        tasks.forEach(task => {
            if (!task.date && !task.phaseDate) return;

            const taskDate = new Date(task.date || task.phaseDate);
            taskDate.setHours(0, 0, 0, 0);

            meetings.forEach(meeting => {
                if (!meeting.date) return;

                const meetingDate = new Date(meeting.date);
                meetingDate.setHours(0, 0, 0, 0);

                // Tâche mentionnée dans une réunion si dates proches (±7 jours)
                const daysDiff = Math.abs((taskDate - meetingDate) / (1000 * 60 * 60 * 24));

                if (daysDiff <= 7) {
                    const existingEdge = this.dataGraph.edges.find(e =>
                        e.from === this.generateNodeId('task', task) &&
                        e.to === this.generateNodeId('meeting', meeting)
                    );

                    if (!existingEdge) {
                        this.addEdge(
                            this.generateNodeId('task', task),
                            this.generateNodeId('meeting', meeting),
                            'potential_link_by_date',
                            0.5 // Confiance faible
                        );
                    }
                }
            });
        });
    }

    /**
     * Ajoute une arête (relation) au graphe
     */
    addEdge(fromId, toId, type, confidence = 1.0) {
        this.dataGraph.edges.push({
            from: fromId,
            to: toId,
            type,
            confidence,
            createdAt: new Date()
        });
    }

    /**
     * Trouve toutes les données liées à un élément
     */
    findRelatedData(itemId) {
        const related = {
            direct: [],
            indirect: [],
            suggested: []
        };

        // Relations directes
        const directEdges = this.dataGraph.edges.filter(edge =>
            edge.from === itemId || edge.to === itemId
        );

        directEdges.forEach(edge => {
            const relatedId = edge.from === itemId ? edge.to : edge.from;
            const node = this.dataGraph.nodes.find(n => n.id === relatedId);

            if (node) {
                related.direct.push({
                    ...node,
                    relationship: edge.type,
                    confidence: edge.confidence
                });
            }
        });

        // Relations indirectes (à 2 niveaux)
        related.direct.forEach(directItem => {
            const indirectEdges = this.dataGraph.edges.filter(edge =>
                (edge.from === directItem.id || edge.to === directItem.id) &&
                edge.from !== itemId && edge.to !== itemId
            );

            indirectEdges.forEach(edge => {
                const relatedId = edge.from === directItem.id ? edge.to : edge.from;

                // Ne pas ajouter les doublons
                if (related.direct.find(r => r.id === relatedId) ||
                    related.indirect.find(r => r.id === relatedId)) {
                    return;
                }

                const node = this.dataGraph.nodes.find(n => n.id === relatedId);

                if (node) {
                    related.indirect.push({
                        ...node,
                        relationship: edge.type,
                        confidence: edge.confidence * 0.5, // Réduire la confiance
                        via: directItem.id
                    });
                }
            });
        });

        // Relations suggérées (confiance < 0.8)
        const suggestedEdges = this.dataGraph.edges.filter(edge =>
            (edge.from === itemId || edge.to === itemId) &&
            edge.confidence < 0.8
        );

        suggestedEdges.forEach(edge => {
            const relatedId = edge.from === itemId ? edge.to : edge.from;
            const node = this.dataGraph.nodes.find(n => n.id === relatedId);

            if (node && !related.direct.find(r => r.id === relatedId)) {
                related.suggested.push({
                    ...node,
                    relationship: edge.type,
                    confidence: edge.confidence
                });
            }
        });

        return related;
    }

    /**
     * Détecte les incohérences dans les données
     */
    detectInconsistencies() {
        const issues = [];

        // 1. Nœuds orphelins (sans relations)
        const orphans = this.dataGraph.nodes.filter(node => {
            const hasEdge = this.dataGraph.edges.some(edge =>
                edge.from === node.id || edge.to === node.id
            );
            return !hasEdge && node.type !== 'person';
        });

        if (orphans.length > 0) {
            issues.push({
                type: 'orphan_nodes',
                severity: 'medium',
                count: orphans.length,
                message: `${orphans.length} élément(s) sans aucune relation`,
                items: orphans.map(n => ({
                    type: n.type,
                    data: n.data
                }))
            });
        }

        // 2. Relations cassées (IDs invalides)
        const brokenEdges = this.dataGraph.edges.filter(edge => {
            const fromExists = this.dataGraph.nodes.some(n => n.id === edge.from);
            const toExists = this.dataGraph.nodes.some(n => n.id === edge.to);
            return !fromExists || !toExists;
        });

        if (brokenEdges.length > 0) {
            issues.push({
                type: 'broken_links',
                severity: 'high',
                count: brokenEdges.length,
                message: `${brokenEdges.length} lien(s) cassé(s) (références invalides)`,
                items: brokenEdges
            });
        }

        // 3. Doublons potentiels
        const duplicates = this.findPotentialDuplicates();

        if (duplicates.length > 0) {
            issues.push({
                type: 'potential_duplicates',
                severity: 'low',
                count: duplicates.length,
                message: `${duplicates.length} doublon(s) potentiel(s) détecté(s)`,
                items: duplicates
            });
        }

        return issues;
    }

    /**
     * Trouve les doublons potentiels
     */
    findPotentialDuplicates() {
        const duplicates = [];
        const nodesByType = this.groupNodesByType();

        Object.keys(nodesByType).forEach(type => {
            const nodes = nodesByType[type];

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const similarity = this.calculateSimilarity(nodes[i], nodes[j]);

                    if (similarity > 0.8) {
                        duplicates.push({
                            node1: nodes[i],
                            node2: nodes[j],
                            similarity,
                            type
                        });
                    }
                }
            }
        });

        return duplicates;
    }

    /**
     * Groupe les nœuds par type
     */
    groupNodesByType() {
        const groups = {};

        this.dataGraph.nodes.forEach(node => {
            if (!groups[node.type]) {
                groups[node.type] = [];
            }
            groups[node.type].push(node);
        });

        return groups;
    }

    /**
     * Calcule la similarité entre deux nœuds
     */
    calculateSimilarity(node1, node2) {
        if (node1.type !== node2.type) return 0;

        const data1 = node1.data;
        const data2 = node2.data;

        // Comparer les titres/noms
        const name1 = (data1.titre || data1.nom || '').toLowerCase();
        const name2 = (data2.titre || data2.nom || '').toLowerCase();

        if (name1 === name2) return 1.0;

        // Similarité basique (à améliorer)
        const commonWords = this.getCommonWords(name1, name2);
        const totalWords = Math.max(name1.split(/\s+/).length, name2.split(/\s+/).length);

        return commonWords / totalWords;
    }

    /**
     * Obtient les mots communs
     */
    getCommonWords(text1, text2) {
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));

        let common = 0;
        words1.forEach(word => {
            if (words2.has(word)) common++;
        });

        return common;
    }

    /**
     * Suggère des liens potentiels
     */
    suggestLinks() {
        const suggestions = [];

        // Parcourir toutes les relations suggérées (confidence < 1.0)
        const suggestedEdges = this.dataGraph.edges.filter(e => e.confidence < 1.0 && e.confidence > 0.5);

        suggestedEdges.forEach(edge => {
            const fromNode = this.dataGraph.nodes.find(n => n.id === edge.from);
            const toNode = this.dataGraph.nodes.find(n => n.id === edge.to);

            if (fromNode && toNode) {
                suggestions.push({
                    type: edge.type,
                    from: fromNode,
                    to: toNode,
                    confidence: edge.confidence,
                    reason: this.getReasonForSuggestion(edge.type),
                    action: `Lier "${fromNode.data.titre || fromNode.data.nom}" à "${toNode.data.titre || toNode.data.nom}"`
                });
            }
        });

        return suggestions;
    }

    /**
     * Obtient la raison d'une suggestion
     */
    getReasonForSuggestion(type) {
        const reasons = {
            'potential_link_by_name': 'Correspondance de nom détectée',
            'potential_link_by_date': 'Dates proches détectées',
            'uses_equipment': 'Équipement mentionné dans la tâche',
            'requires_piece': 'Pièce potentiellement nécessaire',
            'assigned_to_team': 'Équipe correspondante trouvée'
        };

        return reasons[type] || 'Relation potentielle';
    }

    /**
     * Charge les tâches
     */
    async loadTasks() {
        return this.ai ? await this.ai.getAllTasks() : [];
    }

    /**
     * Charge les équipements
     */
    async loadEquipments() {
        try {
            return await loadFromStorage('equipmentsData') || [];
        } catch {
            return [];
        }
    }

    /**
     * Charge les pièces
     */
    async loadPieces() {
        try {
            return await loadFromStorage('piecesData') || [];
        } catch {
            return [];
        }
    }

    /**
     * Charge les équipes
     */
    async loadTeams() {
        try {
            return await loadFromStorage('teamsData') || [];
        } catch {
            return [];
        }
    }

    /**
     * Charge les réunions
     */
    async loadMeetings() {
        try {
            return await loadFromStorage('reunionsData') || [];
        } catch {
            return [];
        }
    }

    /**
     * Exporte le graphe en JSON
     */
    exportGraph() {
        return JSON.stringify(this.dataGraph, null, 2);
    }

    /**
     * Obtient des statistiques sur le graphe
     */
    getGraphStats() {
        const stats = {
            totalNodes: this.dataGraph.nodes.length,
            totalEdges: this.dataGraph.edges.length,
            nodesByType: {},
            edgesByType: {},
            avgConnectionsPerNode: 0,
            orphanNodes: 0,
            highConfidenceLinks: 0,
            suggestedLinks: 0
        };

        // Nodes par type
        this.dataGraph.nodes.forEach(node => {
            stats.nodesByType[node.type] = (stats.nodesByType[node.type] || 0) + 1;
        });

        // Edges par type
        this.dataGraph.edges.forEach(edge => {
            stats.edgesByType[edge.type] = (stats.edgesByType[edge.type] || 0) + 1;

            if (edge.confidence >= 0.9) {
                stats.highConfidenceLinks++;
            } else if (edge.confidence < 0.8) {
                stats.suggestedLinks++;
            }
        });

        // Moyenne de connexions
        if (stats.totalNodes > 0) {
            stats.avgConnectionsPerNode = (stats.totalEdges * 2 / stats.totalNodes).toFixed(2);
        }

        // Orphelins
        stats.orphanNodes = this.dataGraph.nodes.filter(node => {
            return !this.dataGraph.edges.some(e => e.from === node.id || e.to === node.id);
        }).length;

        return stats;
    }

    /**
     * NOUVELLE FONCTION: Construit les liens intelligents par Numéro d'ordre, Designation, IW37N
     */
    buildSmartLinks(tasks, equipments, pieces, teams, meetings) {
        console.log('[ANALYZER] 🔗 Détection des liens intelligents...');

        // Créer des index pour recherche rapide
        const allData = [
            ...tasks.map(t => ({ ...t, _type: 'task' })),
            ...equipments.map(e => ({ ...e, _type: 'equipment' })),
            ...pieces.map(p => ({ ...p, _type: 'piece' })),
            ...teams.map(t => ({ ...t, _type: 'team' })),
            ...meetings.map(m => ({ ...m, _type: 'meeting' }))
        ];

        let linksFound = 0;

        // Pour chaque donnée, chercher les liens possibles
        allData.forEach((item1, i) => {
            allData.slice(i + 1).forEach(item2 => {
                // Ne pas lier un élément avec lui-même
                if (item1 === item2) return;

                // Chercher les liens par Numéro d'ordre
                const orderLink = this.findLinkByField(item1, item2, [
                    'numeroOrdre', 'numero_ordre', 'orderNumber', 'ordre', 'N° Ordre', 'nOrdre'
                ]);

                if (orderLink) {
                    this.addEdge(
                        this.generateNodeId(item1._type, item1),
                        this.generateNodeId(item2._type, item2),
                        'linked_by_order_number',
                        1.0
                    );
                    linksFound++;
                }

                // Chercher les liens par Designation
                const designationLink = this.findLinkByField(item1, item2, [
                    'designationOperation', 'designation_operation', 'designation', 'Désignation opération', 'designationOp'
                ]);

                if (designationLink) {
                    this.addEdge(
                        this.generateNodeId(item1._type, item1),
                        this.generateNodeId(item2._type, item2),
                        'linked_by_designation',
                        0.95
                    );
                    linksFound++;
                }

                // Chercher les liens par IW37N
                const iw37nLink = this.findLinkByField(item1, item2, [
                    'iw37n', 'IW37N', 'iw37nId', 'iw37n_id'
                ]);

                if (iw37nLink) {
                    this.addEdge(
                        this.generateNodeId(item1._type, item1),
                        this.generateNodeId(item2._type, item2),
                        'linked_by_iw37n',
                        1.0
                    );
                    linksFound++;
                }
            });
        });

        console.log(`[ANALYZER] ✅ ${linksFound} liens intelligents détectés`);
    }

    /**
     * Cherche si deux éléments partagent la même valeur pour un champ
     */
    findLinkByField(item1, item2, possibleFieldNames) {
        for (const fieldName of possibleFieldNames) {
            const value1 = item1[fieldName];
            const value2 = item2[fieldName];

            // Les deux ont le champ ET la même valeur (et pas vide)
            if (value1 && value2 && value1 === value2 && value1 !== '') {
                return {
                    field: fieldName,
                    value: value1
                };
            }
        }
        return null;
    }

    /**
     * Ajoute une relation (edge) au graphe
     */
    addEdge(from, to, type, strength = 1.0) {
        if (!from || !to) return;

        // Éviter les doublons
        const exists = this.dataGraph.edges.some(e =>
            e.from === from && e.to === to && e.type === type
        );

        if (exists) return;

        this.dataGraph.edges.push({
            from,
            to,
            type,
            strength,
            confidence: strength,  // Alias pour compatibilité
            metadata: {
                createdAt: new Date()
            }
        });
    }
}
