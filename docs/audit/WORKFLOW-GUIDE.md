# 🔧 WORKFLOW GUIDE - GUIDE DE FLUX DE TRAVAIL IA CODING

## 📋 TABLE DES MATIÈRES

1. [Introduction](#introduction)
2. [Navigation Rapide](#navigation-rapide)
3. [Workflows par Scénario](#workflows-par-scénario)
4. [Checklist Avant Modification](#checklist-avant-modification)
5. [Patterns de Code](#patterns-de-code)
6. [Sécurité et Validation](#sécurité-et-validation)
7. [Référence des Documents](#référence-des-documents)

---

## 1️⃣ INTRODUCTION

### Objectif de ce Guide

Ce document sert de **référence systématique** pour guider l'IA lors de toute tâche de coding sur l'application de gestion d'arrêt technique d'aciérie. Il doit être consulté **à chaque demande utilisateur** avant de commencer à coder.

### Documents de Référence Disponibles

```
docs/audit/
├── INDEX.md                          → Table des matières générale
├── MAP.md                            → Cartographie complète (100 KB)
├── 01-Vue-Generale.md                → Vision d'ensemble
├── 02-Technologies-Stack.md          → Technologies utilisées
├── 03-Architecture-Backend.md        → Architecture serveur
├── 04-Architecture-Frontend.md       → Architecture client
├── 05-Modules-Fonctionnalites.md     → 80+ modules détaillés
├── 06-Securite-Performance.md        → Sécurité & Performance
└── WORKFLOW-GUIDE.md                 → Ce document
```

### Principe de Base

```
📝 DEMANDE UTILISATEUR
    ↓
🔍 CONSULTER WORKFLOW-GUIDE.md (ce fichier)
    ↓
🗺️ CONSULTER MAP.md pour localiser
    ↓
📚 CONSULTER AUDIT correspondant pour comprendre
    ↓
✅ APPLIQUER CHECKLIST SÉCURITÉ
    ↓
💻 CODER en suivant les patterns établis
    ↓
🧪 TESTER et VALIDER
    ↓
📋 METTRE À JOUR MAP.md (si modifications importantes)
```

### 🔄 Mise à Jour Automatique du MAP.md

Le fichier **MAP.md** contient des sections techniques qui peuvent être **générées automatiquement** après vos modifications.

**Commande :**
```bash
npm run update-map
```

**Ce qui est mis à jour automatiquement :**
- ✅ **Section 6** : Liste complète des modules JavaScript avec tailles
- ✅ **Section 8** : Routes API REST et événements Socket.IO
- ✅ **Section 9** : Arborescence complète des fichiers avec statistiques

**Quand exécuter cette commande :**
- ✅ Après avoir créé un nouveau module dans `public/js/modules/`
- ✅ Après avoir ajouté/modifié des routes dans `server/routes/`
- ✅ Après avoir ajouté/supprimé des fichiers importants
- ✅ Après modifications structurelles du projet
- ✅ Avant de committer des changements importants

**Exemple d'utilisation :**
```bash
# Vous venez de créer un nouveau module
# 1. Créer le fichier
# 2. Tester le code
# 3. Mettre à jour la documentation
npm run update-map

# Vérifier les changements
git diff docs/audit/MAP.md
```

> **Note :** Les sections descriptives (1-5, 7, 10-11) doivent être mises à jour **manuellement** si nécessaire.

---

## 2️⃣ NAVIGATION RAPIDE

### Arbre de Décision - Où Aller ?

```
┌─────────────────────────────────────────────────────────────┐
│ QUESTION                    │ DOCUMENT À CONSULTER          │
├─────────────────────────────────────────────────────────────┤
│ Où se trouve le fichier X ? │ MAP.md → Section 9            │
│ Comment fonctionne module Y ?│ 05-Modules-Fonctionnalites.md │
│ API endpoints disponibles ?  │ MAP.md → Section 8            │
│ Architecture backend ?       │ 03-Architecture-Backend.md    │
│ Architecture frontend ?      │ 04-Architecture-Frontend.md   │
│ Technologies utilisées ?     │ 02-Technologies-Stack.md      │
│ Problème de sécurité ?       │ 06-Securite-Performance.md    │
│ Problème de performance ?    │ 06-Securite-Performance.md    │
│ Vue d'ensemble projet ?      │ 01-Vue-Generale.md            │
└─────────────────────────────────────────────────────────────┘
```

### Localisation Rapide des Fichiers

**TOUJOURS consulter MAP.md Section 9** pour l'arborescence complète avec tailles.

#### Fichiers Backend Clés
```
server/
├── server.js                 → Point d'entrée (700 lignes)
├── routes/
│   ├── t55-routes.js        → Routes T55 (1700 lignes)
│   ├── files-routes.js      → Gestion fichiers
│   └── admin-routes.js      → Routes admin
├── services/
│   ├── dataService.js       → Service de données principal
│   ├── taskService.js       → Gestion tâches
│   ├── avisService.js       → Notifications
│   └── emailService.js      → Emails
└── middleware/              → 9 middlewares sécurité
```

#### Fichiers Frontend Clés
```
public/js/
├── app.js                   → Contrôleur principal (1500+ lignes)
├── core/
│   ├── socket.js           → WebSocket client
│   ├── store.js            → State management
│   └── actions.js          → Actions globales
├── modules/                 → 80+ modules de données
└── ui/                      → 21 modules UI
```

---

## 3️⃣ WORKFLOWS PAR SCÉNARIO

### Scénario 1 : Modifier un Module de Données Existant

**Exemple : "Modifier le module T55 Devis"**

```
ÉTAPE 1 : LOCALISATION
→ Consulter MAP.md Section 6 (Modules de Données)
→ Trouver "T55 Devis" dans catégorie "Contractuels & Fournisseurs"
→ Fichier identifié : public/js/modules/t55-devis.js (1463 lignes)

ÉTAPE 2 : COMPRÉHENSION
→ Consulter 05-Modules-Fonctionnalites.md
→ Lire section 3.2 "T55 Devis - Le Plus Complexe"
→ Comprendre structure : 15+ formulaires, génération DOCX, workflows

ÉTAPE 3 : ARCHITECTURE
→ Consulter 04-Architecture-Frontend.md
→ Vérifier pattern utilisé (Observer pattern, lazy loading)
→ Consulter 03-Architecture-Backend.md pour routes API associées

ÉTAPE 4 : SÉCURITÉ
→ Consulter 06-Securite-Performance.md
→ Vérifier vulnérabilités connues
→ Appliquer checklist sécurité (voir section 6)

ÉTAPE 5 : MODIFICATION
→ Lire le fichier complet avec Read tool
→ Respecter les patterns existants
→ Maintenir la cohérence avec store.js

ÉTAPE 6 : VALIDATION
→ Vérifier données dans application-data.json
→ Tester en local
→ Vérifier synchronisation Socket.IO
```

### Scénario 2 : Ajouter une Nouvelle Route API

**Exemple : "Ajouter endpoint GET /api/stats/monthly"**

```
ÉTAPE 1 : ARCHITECTURE
→ Consulter 03-Architecture-Backend.md Section 2 (Routes)
→ Identifier quelle route utiliser (probablement t55-routes.js)
→ Consulter MAP.md Section 8 pour endpoints existants

ÉTAPE 2 : PATTERNS
→ Étudier routes existantes dans le fichier cible
→ Pattern standard :
  router.get('/endpoint',
    middleware.validateRequest(schema),
    async (req, res) => { ... })

ÉTAPE 3 : VALIDATION
→ Consulter 02-Technologies-Stack.md pour Joi schemas
→ Créer schema de validation si nécessaire
→ Ajouter dans dossier validation/

ÉTAPE 4 : SERVICE
→ Vérifier si logique appartient à un service existant
→ Consulter 03-Architecture-Backend.md Section 3 (Services)
→ Ajouter méthode au service approprié

ÉTAPE 5 : SÉCURITÉ
→ Appliquer rate limiting approprié
→ Valider toutes les entrées utilisateur
→ Gérer les erreurs proprement
→ Logger les accès (Winston)

ÉTAPE 6 : DOCUMENTATION
→ Exécuter npm run update-map (met à jour automatiquement Section 8)
→ Documenter dans 03-Architecture-Backend.md si majeur
```

### Scénario 3 : Créer un Nouveau Module Frontend

**Exemple : "Créer module pour gestion nouvel équipement"**

```
ÉTAPE 1 : PLANIFICATION
→ Consulter 01-Vue-Generale.md pour comprendre workflow global
→ Consulter 05-Modules-Fonctionnalites.md pour patterns existants
→ Identifier catégorie : Équipements ou nouveau ?

ÉTAPE 2 : TEMPLATE
→ Utiliser module existant similaire comme template
→ Recommandation : utiliser module simple comme modèle
→ Consulter MAP.md Section 6 pour modules par catégorie

ÉTAPE 3 : STRUCTURE
→ Créer fichier : public/js/modules/[nom-module].js
→ Pattern obligatoire :

  import { store } from '../core/store.js';
  import { ui } from '../ui/ui.js';

  export const MonModule = {
    init() { ... },
    render() { ... },
    handleSave() { ... },
    loadData() { ... }
  };

ÉTAPE 4 : PAGE HTML
→ Créer page : public/pages/[nom-page].html
→ Pattern : div.page-container > div.content-section
→ Utiliser classes CSS existantes

ÉTAPE 5 : INTÉGRATION
→ Ajouter route dans app.js
→ Ajouter au menu de navigation
→ Mettre à jour structure de données dans application-data.json

ÉTAPE 6 : STATE MANAGEMENT
→ Ajouter observers dans store.js si nécessaire
→ Implémenter synchronisation Socket.IO
→ Tester mise à jour temps réel

ÉTAPE 7 : DOCUMENTATION
→ Exécuter npm run update-map (met à jour automatiquement Section 6)
→ Vérifier que le module apparaît dans la bonne catégorie
```

### Scénario 4 : Corriger un Bug de Sécurité

**Exemple : "Corriger vulnérabilité XSS identifiée"**

```
ÉTAPE 1 : IDENTIFICATION
→ Consulter 06-Securite-Performance.md Section 2
→ Localiser la vulnérabilité dans le code
→ Comprendre l'impact et la priorité

ÉTAPE 2 : ANALYSE
→ Lire le fichier concerné complètement
→ Identifier tous les points d'injection possibles
→ Vérifier si d'autres endroits ont le même problème

ÉTAPE 3 : CORRECTION
→ Appliquer sanitization appropriée :
  - Backend : utiliser validator.js ou DOMPurify
  - Frontend : textContent au lieu de innerHTML
→ Ne JAMAIS faire confiance aux données utilisateur

ÉTAPE 4 : VALIDATION
→ Tester avec payloads XSS standards
→ Vérifier que fonctionnalité reste opérationnelle
→ Ajouter tests de non-régression si possible

ÉTAPE 5 : DOCUMENTATION
→ Mettre à jour 06-Securite-Performance.md
→ Marquer vulnérabilité comme corrigée
→ Documenter la solution appliquée
```

### Scénario 5 : Optimiser les Performances

**Exemple : "Réduire temps de chargement page"**

```
ÉTAPE 1 : DIAGNOSTIC
→ Consulter 06-Securite-Performance.md Section 4
→ Identifier les bottlenecks connus
→ Mesurer performance actuelle

ÉTAPE 2 : STRATÉGIE
→ Vérifier si lazy loading est appliqué
→ Consulter 04-Architecture-Frontend.md
→ Identifier modules chargés inutilement

ÉTAPE 3 : OPTIMISATION
→ Options selon contexte :
  - Lazy loading modules (déjà implémenté)
  - Compression GZIP (déjà active)
  - Minification code
  - Optimisation images
  - Cache navigateur

ÉTAPE 4 : MESURE
→ Tester avant/après
→ Vérifier temps de chargement
→ Vérifier impact sur expérience utilisateur

ÉTAPE 5 : DOCUMENTATION
→ Mettre à jour 06-Securite-Performance.md
→ Documenter gains de performance
```

---

## 4️⃣ CHECKLIST AVANT MODIFICATION

### ✅ Checklist Universelle (TOUJOURS suivre)

Avant **toute** modification de code, vérifier :

#### 📖 1. Documentation Consultée
- [ ] WORKFLOW-GUIDE.md lu (ce fichier)
- [ ] MAP.md consulté pour localiser fichiers
- [ ] Document audit pertinent lu
- [ ] Architecture comprise

#### 🔍 2. Fichiers Lus
- [ ] Fichier cible lu complètement avec Read tool
- [ ] Fichiers dépendants identifiés
- [ ] Patterns existants compris
- [ ] Impact sur autres modules évalué

#### 🏗️ 3. Architecture Respectée
- [ ] Pattern Observer pour state management
- [ ] Lazy loading maintenu si applicable
- [ ] Structure modulaire préservée
- [ ] Conventions de nommage suivies

#### 🔒 4. Sécurité Vérifiée
- [ ] Inputs validés (Joi backend, validation frontend)
- [ ] XSS prévenu (textContent, sanitization)
- [ ] Injection SQL non applicable (JSON, pas de DB)
- [ ] Path traversal vérifié (file operations)
- [ ] Rate limiting respecté

#### 💾 5. Données Cohérentes
- [ ] Structure application-data.json maintenue
- [ ] Synchronisation Socket.IO fonctionnelle
- [ ] Backup automatique non cassé
- [ ] Migration données si nécessaire planifiée

#### 🧪 6. Test et Validation
- [ ] Modification testée localement
- [ ] Pas de régression introduite
- [ ] Logs vérifiés (Winston)
- [ ] Performance acceptable

---

## 5️⃣ PATTERNS DE CODE

### Pattern 1 : Module Frontend Standard

**Toujours suivre cette structure pour modules de données**

```javascript
// public/js/modules/[module-name].js

import { store } from '../core/store.js';
import { ui } from '../ui/ui.js';

export const ModuleName = {

  /**
   * Initialise le module
   */
  init() {
    console.log('[ModuleName] Initialisation...');
    this.loadData();
    this.attachEventListeners();
  },

  /**
   * Charge les données depuis le store
   */
  loadData() {
    const data = store.state.data?.moduleName || [];
    this.render(data);
  },

  /**
   * Render le module
   */
  render(data = []) {
    const container = document.getElementById('module-container');
    if (!container) return;

    // Utiliser textContent pour éviter XSS
    container.innerHTML = ''; // Uniquement si structure HTML statique
    // ... render logic
  },

  /**
   * Attache les event listeners
   */
  attachEventListeners() {
    // Utiliser délégation d'événements si possible
    document.addEventListener('click', (e) => {
      if (e.target.matches('.save-btn')) {
        this.handleSave(e);
      }
    });
  },

  /**
   * Gestion de la sauvegarde
   */
  async handleSave(event) {
    event.preventDefault();

    // Validation côté client
    const data = this.collectFormData();
    if (!this.validate(data)) return;

    try {
      // Envoyer via actions
      await window.actions.updateData('moduleName', data);
      ui.showSuccess('Données sauvegardées');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      ui.showError('Erreur lors de la sauvegarde');
    }
  },

  /**
   * Validation des données
   */
  validate(data) {
    // Validation basique côté client
    if (!data.requiredField) {
      ui.showError('Champ requis manquant');
      return false;
    }
    return true;
  },

  /**
   * Collecte les données du formulaire
   */
  collectFormData() {
    // Utiliser FormData ou collecte manuelle
    return {
      // ... données
    };
  }
};

// Observer pour mises à jour temps réel
store.subscribe((newState) => {
  if (newState.lastUpdate?.type === 'moduleName') {
    ModuleName.loadData();
  }
});
```

### Pattern 2 : Route API Backend Standard

**Toujours suivre cette structure pour routes API**

```javascript
// server/routes/[route-name]-routes.js

import express from 'express';
import Joi from 'joi';
import { dataService } from '../services/dataService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Schema de validation
const itemSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('').optional(),
  // ... autres champs
});

// Middleware de validation
const validateItem = (req, res, next) => {
  const { error } = itemSchema.validate(req.body);
  if (error) {
    logger.warn('Validation error:', error.details);
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

// GET - Récupérer tous les items
router.get('/items', async (req, res) => {
  try {
    const data = await dataService.getData();
    const items = data.moduleName || [];

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Erreur récupération items:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// POST - Créer un item
router.post('/items', validateItem, async (req, res) => {
  try {
    const newItem = {
      id: `item_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };

    const data = await dataService.getData();
    if (!data.moduleName) data.moduleName = [];
    data.moduleName.push(newItem);

    await dataService.saveData(data);

    // Notifier via Socket.IO
    req.app.get('io').emit('dataUpdate', {
      type: 'moduleName',
      action: 'create',
      data: newItem
    });

    logger.info('Item créé:', newItem.id);
    res.json({ success: true, data: newItem });

  } catch (error) {
    logger.error('Erreur création item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création'
    });
  }
});

// PUT - Mettre à jour un item
router.put('/items/:id', validateItem, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await dataService.getData();

    const index = data.moduleName?.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item non trouvé'
      });
    }

    data.moduleName[index] = {
      ...data.moduleName[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await dataService.saveData(data);

    req.app.get('io').emit('dataUpdate', {
      type: 'moduleName',
      action: 'update',
      data: data.moduleName[index]
    });

    logger.info('Item mis à jour:', id);
    res.json({ success: true, data: data.moduleName[index] });

  } catch (error) {
    logger.error('Erreur mise à jour item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour'
    });
  }
});

// DELETE - Supprimer un item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await dataService.getData();

    const index = data.moduleName?.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item non trouvé'
      });
    }

    data.moduleName.splice(index, 1);
    await dataService.saveData(data);

    req.app.get('io').emit('dataUpdate', {
      type: 'moduleName',
      action: 'delete',
      id: id
    });

    logger.info('Item supprimé:', id);
    res.json({ success: true });

  } catch (error) {
    logger.error('Erreur suppression item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

export default router;
```

### Pattern 3 : Synchronisation Socket.IO

**Flux de synchronisation temps réel**

```javascript
// BACKEND - server/server.js ou handlers
io.on('connection', (socket) => {

  // Client se connecte
  socket.on('requestData', async () => {
    const data = await dataService.getData();
    socket.emit('dataSync', data);
  });

  // Client met à jour des données
  socket.on('updateData', async (update) => {
    try {
      // Validation
      const { error } = updateSchema.validate(update);
      if (error) {
        socket.emit('error', { message: 'Données invalides' });
        return;
      }

      // Sauvegarde
      const data = await dataService.getData();
      // ... mise à jour
      await dataService.saveData(data);

      // Broadcast à tous les clients
      io.emit('dataUpdate', {
        type: update.type,
        action: update.action,
        data: update.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Erreur mise à jour:', error);
      socket.emit('error', { message: 'Erreur serveur' });
    }
  });
});
```

```javascript
// FRONTEND - public/js/core/socket.js
class SocketManager {

  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Socket connecté');
      this.socket.emit('requestData');
    });

    this.socket.on('dataSync', (data) => {
      store.setState({ data });
    });

    this.socket.on('dataUpdate', (update) => {
      // Mettre à jour le store local
      const currentData = store.state.data;
      // ... mise à jour selon update.type et update.action
      store.setState({
        data: updatedData,
        lastUpdate: update
      });
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      ui.showError(error.message);
    });
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}
```

### Pattern 4 : Gestion d'Erreurs Robuste

**Toujours implémenter gestion d'erreurs complète**

```javascript
// Backend - Pattern try/catch avec logging
async function handleOperation() {
  try {
    // Opération principale
    const result = await riskyOperation();

    // Logging succès
    logger.info('Opération réussie', { result });

    return { success: true, data: result };

  } catch (error) {
    // Logging erreur avec stack trace
    logger.error('Erreur opération:', {
      message: error.message,
      stack: error.stack,
      context: { /* contexte utile */ }
    });

    // Retourner erreur générique (pas de détails sensibles)
    return {
      success: false,
      error: 'Une erreur est survenue'
    };
  }
}
```

```javascript
// Frontend - Pattern try/catch avec UI feedback
async function performAction() {
  ui.showLoading('Chargement...');

  try {
    const response = await fetch('/api/endpoint');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue');
    }

    ui.showSuccess('Opération réussie');
    return data.data;

  } catch (error) {
    console.error('Erreur:', error);
    ui.showError(error.message || 'Une erreur est survenue');
    return null;

  } finally {
    ui.hideLoading();
  }
}
```

---

## 6️⃣ SÉCURITÉ ET VALIDATION

### 🔒 Checklist Sécurité (CRITIQUE)

Avant **toute** modification touchant :
- Entrées utilisateur
- Fichiers
- Génération de contenu dynamique
- APIs

#### 1. Validation des Entrées (OBLIGATOIRE)

**Backend - Joi Validation**
```javascript
import Joi from 'joi';

// Définir schema strict
const schema = Joi.object({
  field: Joi.string()
    .min(1)
    .max(255)
    .pattern(/^[a-zA-Z0-9-_]+$/) // Whitelist caractères
    .required()
});

// Valider AVANT utilisation
const { error, value } = schema.validate(userInput);
if (error) {
  return res.status(400).json({ error: error.message });
}

// Utiliser value (sanitized), PAS userInput
```

**Frontend - Validation Basique**
```javascript
function validateInput(input) {
  // Longueur
  if (input.length > 255) return false;

  // Pattern
  const validPattern = /^[a-zA-Z0-9\s-_]+$/;
  if (!validPattern.test(input)) return false;

  return true;
}
```

#### 2. Prévention XSS (CRITIQUE)

**❌ JAMAIS faire :**
```javascript
element.innerHTML = userInput; // DANGER!
```

**✅ TOUJOURS faire :**
```javascript
element.textContent = userInput; // Safe

// OU si HTML nécessaire, sanitize
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

#### 3. Path Traversal (CRITIQUE pour fichiers)

**❌ JAMAIS faire :**
```javascript
const filePath = `uploads/${req.params.filename}`; // DANGER!
fs.readFile(filePath); // Attaque possible: ../../../etc/passwd
```

**✅ TOUJOURS faire :**
```javascript
import path from 'path';

const filename = path.basename(req.params.filename); // Supprime ../
const filePath = path.join(SAFE_DIR, filename);

// Vérifier que path est dans SAFE_DIR
const realPath = fs.realpathSync(filePath);
if (!realPath.startsWith(SAFE_DIR)) {
  throw new Error('Path traversal détecté');
}
```

#### 4. Rate Limiting (Déjà implémenté)

**Vérifier que nouvelles routes respectent les limites**

```javascript
// Consulter server/server.js pour limites actuelles:
// - API routes: 100 req / 15 min
// - General: 2000 req / 15 min

// Appliquer rate limiter approprié
router.use('/api/sensitive', apiLimiter);
```

#### 5. Logging Sécurisé

**❌ JAMAIS logger :**
```javascript
logger.info('Login:', password); // DANGER! Mot de passe en clair
```

**✅ TOUJOURS logger sans données sensibles :**
```javascript
logger.info('Login attempt', {
  userId: user.id, // OK
  timestamp: new Date() // OK
  // PAS de passwords, tokens, données sensibles
});
```

### 🧪 Validation Post-Modification

Après modification, **TOUJOURS** vérifier :

```bash
# 1. Pas d'erreurs serveur
npm start
# Vérifier logs Winston pour erreurs

# 2. Tester endpoint/feature
# Utiliser curl ou Postman

# 3. Vérifier synchronisation
# Ouvrir 2 navigateurs, tester updates temps réel

# 4. Vérifier logs
tail -f logs/combined-YYYY-MM-DD.log
tail -f logs/error-YYYY-MM-DD.log

# 5. Vérifier backup
# Vérifier que server/backup/ contient backups récents
```

---

## 7️⃣ RÉFÉRENCE DES DOCUMENTS

### Document MAP.md - Sections Clés

```
Section 1 : Vue d'ensemble architecture
Section 2 : Diagrammes architecture 6 couches
Section 3 : Backend - Hiérarchie complète
Section 4 : Frontend - Hiérarchie complète
Section 5 : Flux de données (User → Server → Broadcast)
Section 6 : 80+ Modules par catégorie ⭐ TRÈS UTILISÉ
Section 7 : Data Management & Synchronisation
Section 8 : API & Endpoints ⭐ TRÈS UTILISÉ
Section 9 : Arborescence fichiers avec tailles ⭐ TRÈS UTILISÉ
Section 10 : Sécurité (10 couches)
Section 11 : Index fonctionnalités
```

### Documents Audit - Usage

| Document | Quand l'utiliser |
|----------|------------------|
| **INDEX.md** | Vue d'ensemble, statistiques, guides de lecture |
| **01-Vue-Generale.md** | Comprendre projet global, architecture générale, recommandations stratégiques |
| **02-Technologies-Stack.md** | Comprendre technologies (11 backend + 7 frontend), versions, compatibilité |
| **03-Architecture-Backend.md** | Modifier/comprendre backend : server.js, routes, services, middleware |
| **04-Architecture-Frontend.md** | Modifier/comprendre frontend : app.js, modules, patterns |
| **05-Modules-Fonctionnalites.md** | Modifier module de données : workflows, exemples détaillés des 80+ modules |
| **06-Securite-Performance.md** | Vérifier sécurité, corriger vulnérabilités, optimiser performances |

### Tableau de Référence Rapide - Localisation

| Besoin | Fichier Backend | Fichier Frontend | Document Audit |
|--------|----------------|------------------|----------------|
| **Authentification** | server/middleware/auth.js | public/js/login.js | 03-Architecture-Backend.md |
| **Upload fichiers** | server/routes/files-routes.js | public/js/modules/*.js | 03-Architecture-Backend.md |
| **Génération DOCX** | server/routes/t55-routes.js | public/js/modules/t55-devis.js | 05-Modules-Fonctionnalites.md |
| **Emails** | server/services/emailService.js | - | 03-Architecture-Backend.md |
| **Tâches** | server/services/taskService.js | public/js/modules/task-list.js | 05-Modules-Fonctionnalites.md |
| **Avis** | server/services/avisService.js | public/js/modules/avis-technique.js | 05-Modules-Fonctionnalites.md |
| **State management** | - | public/js/core/store.js | 04-Architecture-Frontend.md |
| **Socket.IO** | server/server.js | public/js/core/socket.js | 03 & 04-Architecture |
| **Logging** | server/utils/logger.js | - | 03-Architecture-Backend.md |
| **Backup** | server/utils/scheduler.js | - | 03-Architecture-Backend.md |

### Index des 80+ Modules (Référence MAP.md Section 6)

**10 Catégories de Modules :**

1. **Planning & Organisation** (9 modules)
   - Calendrier, Jalons, Chronogramme, Planning-synthese...

2. **Équipements & Maintenance** (8 modules)
   - Equipements, Maintenance-preventive, Liste-outillage...

3. **SAP & Gestion** (11 modules)
   - IW37N (604 lignes), IW38, IW49, PM-actions...

4. **Contractuels & Fournisseurs** (15 modules)
   - T55 Devis (1463 lignes - le plus gros!), Contrats, Fournisseurs...

5. **Sécurité & Qualité** (8 modules)
   - PSV (800 lignes), Audits-securite, Consignations...

6. **Ressources & Logistique** (10 modules)
   - Personnel, Stocks, Transport, Hebergement...

7. **Technique & Engineering** (9 modules)
   - Plans-techniques, Gammes-operatoires, Check-lists...

8. **Suivi & Reporting** (7 modules)
   - Tableaux-de-bord, Rapports-quotidiens, Indicateurs...

9. **Finance & Budget** (6 modules)
   - Budget-previsionnel, Suivi-couts, Factures...

10. **Divers & Utilitaires** (7 modules)
    - Notes-techniques, Documents, Contacts-urgence...

---

## 📌 RÉSUMÉ - WORKFLOW EN 5 ÉTAPES

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW STANDARD - À SUIVRE POUR TOUTE MODIFICATION       │
└──────────────────────────────────────────────────────────────┘

1️⃣ LOCALISER
   → Consulter MAP.md pour trouver fichiers concernés
   → Identifier dépendances

2️⃣ COMPRENDRE
   → Lire document audit correspondant
   → Lire fichiers complets avec Read tool
   → Comprendre patterns et architecture

3️⃣ VÉRIFIER SÉCURITÉ
   → Appliquer checklist sécurité (section 6)
   → Vérifier vulnérabilités connues (06-Securite-Performance.md)
   → Prévoir validation des inputs

4️⃣ MODIFIER
   → Respecter patterns existants (section 5)
   → Maintenir cohérence architecture
   → Logger les changements importants

5️⃣ VALIDER
   → Tester localement
   → Vérifier synchronisation Socket.IO
   → Vérifier logs Winston
   → Vérifier pas de régression

✅ Checklist finale :
   □ Documentation consultée
   □ Fichiers lus complètement
   □ Sécurité vérifiée
   □ Patterns respectés
   □ Tests passés
   □ Aucune régression
```

---

## 🎯 PRINCIPES DIRECTEURS

### 1. TOUJOURS Lire Avant de Modifier
- Ne JAMAIS modifier un fichier sans l'avoir lu complètement
- Ne JAMAIS proposer des changements basés sur des suppositions

### 2. TOUJOURS Suivre les Patterns Établis
- Observer comment le code existant fonctionne
- Maintenir la cohérence avec l'architecture actuelle
- Ne pas introduire de nouveaux patterns sans raison valable

### 3. TOUJOURS Privilégier la Sécurité
- Valider TOUTES les entrées utilisateur
- Prévenir XSS, injection, path traversal
- Logger sans exposer de données sensibles

### 4. TOUJOURS Respecter l'Architecture
- Pattern Observer pour state management
- Lazy loading pour performance
- Synchronisation Socket.IO pour temps réel
- Structure modulaire

### 5. TOUJOURS Tester
- Tester localement avant de considérer terminé
- Vérifier synchronisation temps réel
- Vérifier logs pour erreurs
- Vérifier pas de régression

---

## 📞 AIDE & RÉFÉRENCES

### En Cas de Doute

1. **Consulter MAP.md** pour localisation rapide
2. **Consulter document audit** correspondant pour contexte
3. **Lire le code existant** pour comprendre patterns
4. **Appliquer checklist sécurité** avant modification
5. **Tester rigoureusement** après modification

### Liens Rapides Documentation

- **Vue d'ensemble** : `docs/audit/01-Vue-Generale.md`
- **Technologies** : `docs/audit/02-Technologies-Stack.md`
- **Backend** : `docs/audit/03-Architecture-Backend.md`
- **Frontend** : `docs/audit/04-Architecture-Frontend.md`
- **Modules** : `docs/audit/05-Modules-Fonctionnalites.md`
- **Sécurité** : `docs/audit/06-Securite-Performance.md`
- **Cartographie** : `docs/audit/MAP.md`

---

**📝 NOTE IMPORTANTE :** Ce workflow guide doit être consulté **SYSTÉMATIQUEMENT** avant toute tâche de coding. Il garantit cohérence, sécurité et qualité du code produit.

**Version :** 1.0
**Dernière mise à jour :** 2025-11-23
**Couverture :** 100% de l'application
