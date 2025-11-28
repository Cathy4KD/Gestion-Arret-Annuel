# Audit Complet - Vue Générale

**Date:** 2025-11-23
**Application:** Gestionnaire d'Arrêt d'Aciérie
**Version:** 1.0.0
**Emplacement:** E:\TEST 3

---

## Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Contexte et Objectif](#contexte-et-objectif)
3. [Architecture Globale](#architecture-globale)
4. [Structure des Dossiers](#structure-des-dossiers)
5. [Statistiques Globales](#statistiques-globales)
6. [Points Forts](#points-forts)
7. [Points d'Amélioration](#points-damélioration)
8. [Recommandations Stratégiques](#recommandations-stratégiques)

---

## Résumé Exécutif

Cette application est une **SPA (Single Page Application) complète** développée pour gérer l'ensemble des opérations liées à un arrêt d'aciérie. Elle combine une interface utilisateur riche avec un backend robuste pour offrir une expérience temps réel et collaborative.

### Caractéristiques Principales

- **Type:** Application web monopage (SPA)
- **Architecture:** Client-Server avec communication temps réel
- **Stack:** Node.js/Express + Vanilla JavaScript
- **Persistance:** JSON file-based avec backups automatiques
- **Communication:** Socket.IO pour synchronisation temps réel
- **Déploiement:** Local (environnement de développement/test)

### Métriques Clés

| Métrique | Valeur |
|----------|--------|
| **Pages HTML** | 139 |
| **Modules JavaScript** | 183 |
| **Feuilles CSS** | 39 |
| **Modules de données** | 80+ |
| **Routes API** | 3 (files, admin, t55) |
| **Endpoints API** | 15+ |
| **Services backend** | 4 |
| **Dépendances npm** | 11 |
| **Taille projet** | ~50 MB (avec node_modules) |

---

## Contexte et Objectif

### Domaine Métier

L'application gère les opérations complexes liées à un **arrêt d'aciérie**, incluant:

- **Planification** des interventions
- **Suivi d'exécution** en temps réel
- **Gestion des ressources** (équipes, entrepreneurs, équipements)
- **Gestion documentaire** (plans, avis, devis)
- **Analyses** (AMDEC, SMED, coûts)
- **Communication** (avis syndicaux, points de presse)
- **Approvisionnement** (pièces, consommables, commandes)

### Utilisateurs Cibles

- Responsables d'arrêt
- Chefs de projet
- Coordinateurs
- Techniciens
- Équipes de maintenance
- Entrepreneurs externes
- Management

### Objectifs de l'Application

1. **Centralisation** de toutes les données d'arrêt
2. **Collaboration** en temps réel entre équipes
3. **Traçabilité** complète des opérations
4. **Reporting** automatisé (Excel, PDF, DOCX)
5. **Optimisation** des processus (SMED, AMDEC)
6. **Communication** fluide avec parties prenantes

---

## Architecture Globale

### Schéma Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Client SPA)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HTML Pages (139)                                        │   │
│  │  • Dashboard principal                                   │   │
│  │  • Pages détails (T22-T139)                             │   │
│  │  • Gestion ressources                                    │   │
│  │  • Analyses et rapports                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  JavaScript Modules (183)                                │   │
│  │  • Core (main, socket, store, ui, actions)              │   │
│  │  • Données (40+ modules)                                 │   │
│  │  • UI (15+ composants)                                   │   │
│  │  • Import/Export (Excel, PDF)                            │   │
│  │  • Spécialisés (charts, entities, demandes, plans)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CSS (39 fichiers)                                       │   │
│  │  • Base + Variables                                      │   │
│  │  • Thèmes (modern, industrial, compact)                 │   │
│  │  • Composants (tables, forms, modals, kanban)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Socket.IO (WebSocket)
                      │ HTTP REST API
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js Server)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HTTP Server + Socket.IO Server                          │   │
│  │  • Port: 3000                                            │   │
│  │  • Host: 0.0.0.0 (toutes interfaces)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                        │   │
│  │  • CORS                                                  │   │
│  │  • Compression GZIP                                      │   │
│  │  • Rate Limiting                                         │   │
│  │  • Security Headers                                      │   │
│  │  • Error Handling                                        │   │
│  │  • Logging                                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes API (3)                                          │   │
│  │  • /api/files - Upload/Download fichiers                │   │
│  │  • /api/admin - Stats, logs, health                     │   │
│  │  • /api/t55 - Templates DOCX                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Socket.IO Event Handlers                                │   │
│  │  • taskHandler - Gestion tâches                         │   │
│  │  • dataHandler - Synchronisation données                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services (4)                                            │   │
│  │  • dataService - Persistance JSON                       │   │
│  │  • taskService - Gestion tâches/users                   │   │
│  │  • avisService - Génération avis syndicaux              │   │
│  │  • emailService - Envoi emails SMTP                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Utilitaires                                             │   │
│  │  • logger.js - Winston logs                             │   │
│  │  • scheduler.js - Tâches planifiées                     │   │
│  │  • file-security.js - Validation fichiers               │   │
│  │  • socket-optimization.js - Optimisations Socket.IO     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        STORAGE (Persistance)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  JSON Database                                           │   │
│  │  • application-data.json (80+ modules)                   │   │
│  │  • Taille: ~5-10 MB                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Backups                                                 │   │
│  │  • Incrémentaux: Toutes les 5 minutes (25 derniers)     │   │
│  │  • Quotidiens: 2h00 du matin (30 jours rétention)       │   │
│  │  • Compression: Optionnelle (gzip)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Fichiers                                                │   │
│  │  • Uploads: server/uploads/                              │   │
│  │  • Templates: server/uploads/t55-templates/              │   │
│  │  • Logs: logs/ (rotation quotidienne)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de Communication

#### 1. Chargement Initial

```
1. Client → HTTP GET /
2. Server → index.html
3. Client → Charge assets (CSS, JS, CDN libs)
4. Client → Socket.IO connect
5. Server → Broadcast 'connection' event
6. Client → emit('user:join', {username})
7. Server → emit('data:initial', {allData})
8. Client → Initialise UI avec données
```

#### 2. Mise à Jour Données (Temps Réel)

```
1. Client A → emit('data:update', {module, data})
2. Server → Valide données (Joi)
3. Server → dataService.save(module, data)
4. Server → Crée backup automatique
5. Server → Logger opération
6. Server → broadcast('data:updated', {module, data})
7. Client A, B, C... → Reçoivent mise à jour
8. Client A, B, C... → Re-render UI
```

#### 3. Upload Fichier

```
1. Client → POST /api/files/upload (multipart/form-data)
2. Server → Multer intercepte upload
3. Server → Valide type/taille fichier
4. Server → Sauvegarde dans server/uploads/
5. Server → Retourne {fileId, filename, path}
6. Client → Affiche confirmation
```

---

## Structure des Dossiers

### Vue d'Ensemble

```
E:\TEST 3/
├── 📁 server/                      # Backend Node.js/Express
│   ├── 📁 config/                  # Configuration serveur
│   ├── 📁 data/                    # Données persistantes JSON
│   │   ├── application-data.json   # Base données principale
│   │   ├── 📁 backups/             # Backups incrémentaux (5 min)
│   │   └── 📁 backups-daily/       # Backups quotidiens (2h00)
│   ├── 📁 middleware/              # Middlewares Express
│   │   ├── security.js             # Sécurité (headers, sanitization)
│   │   ├── errorHandler.js         # Gestion erreurs
│   │   └── validation.js           # Validation Joi
│   ├── 📁 routes/                  # Routes API
│   │   ├── files.js                # Upload/Download fichiers
│   │   ├── admin.js                # Stats, logs, health
│   │   └── t55-docx.js             # Templates DOCX
│   ├── 📁 scripts/                 # Scripts init/maintenance
│   ├── 📁 services/                # Logique métier
│   │   ├── dataService.js          # Persistance JSON
│   │   ├── taskService.js          # Gestion tâches
│   │   ├── avisService.js          # Avis syndicaux
│   │   └── emailService.js         # Envoi emails
│   ├── 📁 socket/                  # Gestionnaires Socket.IO
│   │   ├── taskHandler.js          # Événements tâches
│   │   └── dataHandler.js          # Synchronisation données
│   ├── 📁 uploads/                 # Fichiers uploadés
│   │   └── 📁 t55-templates/       # Templates DOCX
│   ├── 📁 utils/                   # Utilitaires
│   │   ├── logger.js               # Winston logging
│   │   ├── scheduler.js            # Tâches planifiées
│   │   ├── file-security.js        # Validation fichiers
│   │   └── socket-optimization.js  # Optimisations Socket.IO
│   └── server.js                   # Point d'entrée serveur
│
├── 📁 client/                      # Frontend SPA
│   ├── 📁 admin/                   # Pages administration
│   ├── 📁 components/              # Composants HTML
│   │   └── 📁 pages/               # 139 pages HTML
│   ├── 📁 css/                     # 39 feuilles de style
│   │   ├── main.css                # Import centralisé
│   │   ├── base.css                # Reset + variables CSS
│   │   ├── modern-theme.css        # Thème principal
│   │   ├── compact-mode.css        # Mode Excel-like
│   │   ├── 📁 components/          # Styles composants
│   │   └── 📁 themes/              # Thèmes visuels
│   ├── 📁 js/                      # 183 modules JavaScript
│   │   ├── main.js                 # Initialisation app
│   │   ├── socket.js               # Connexion Socket.IO
│   │   ├── store.js                # État global
│   │   ├── actions.js              # Actions Socket.IO
│   │   ├── ui.js                   # Manipulation DOM
│   │   ├── app.js                  # Contrôleur principal
│   │   └── 📁 modules/             # Modules organisés
│   │       ├── 📁 charts/          # Graphiques
│   │       ├── 📁 entities/        # Entités métier
│   │       ├── 📁 demandes/        # Demandes (échafaudages, etc.)
│   │       ├── 📁 plans/           # Gestion plans
│   │       ├── 📁 psv/             # Plans PSV
│   │       ├── 📁 scope/           # Marqueurs scope
│   │       ├── 📁 sync/            # Synchronisation
│   │       └── 📁 backup/          # Gestion backups
│   ├── 📁 maintenance/             # Pages maintenance
│   ├── 📁 pages/                   # Pages statiques
│   └── index.html                  # Point d'entrée frontend
│
├── 📁 scripts/                     # Scripts utilitaires
│   ├── *.js                        # Scripts Node.js
│   ├── *.py                        # Scripts Python
│   └── *.bat                       # Scripts batch Windows
│
├── 📁 docs/                        # Documentation
│   └── 📁 audit/                   # Rapports d'audit
│
├── 📁 logs/                        # Logs applicatifs
│   ├── combined-*.log              # Tous niveaux (14j)
│   └── error-*.log                 # Erreurs (30j)
│
├── 📁 assets/                      # Ressources
│   ├── 📁 images/                  # Images
│   └── 📁 diagrams/                # Diagrammes
│
├── 📁 node_modules/                # Dépendances npm
├── package.json                    # Configuration npm
├── package-lock.json               # Lock dépendances
└── .env.example                    # Configuration exemple
```

### Détails par Dossier

#### server/ (Backend)

| Dossier | Fichiers | Rôle |
|---------|----------|------|
| config/ | 3 | Configuration serveur, environnement |
| data/ | 1 + backups | Base données JSON + sauvegardes |
| middleware/ | 3 | Security, validation, error handling |
| routes/ | 3 | Endpoints API REST |
| scripts/ | 5+ | Initialisation, migration, maintenance |
| services/ | 4 | Logique métier (data, task, avis, email) |
| socket/ | 2 | Handlers Socket.IO (task, data) |
| uploads/ | Variable | Fichiers uploadés par utilisateurs |
| utils/ | 4+ | Logger, scheduler, security, optimizations |

#### client/ (Frontend)

| Dossier | Fichiers | Rôle |
|---------|----------|------|
| admin/ | 10+ | Pages administration |
| components/pages/ | 139 | Pages HTML application |
| css/ | 39 | Feuilles de style modulaires |
| js/ | 183 | Modules JavaScript |
| js/modules/charts/ | 5+ | Gestion graphiques Chart.js |
| js/modules/entities/ | 10+ | Entités métier (entrepreneurs, équipes, etc.) |
| js/modules/demandes/ | 5+ | Gestion demandes (échafaudages, grues, etc.) |
| js/modules/plans/ | 3+ | Affichage et gestion plans |
| js/modules/psv/ | 5+ | Plans PSV avec marqueurs |
| js/modules/scope/ | 3+ | Marqueurs scope |
| js/modules/sync/ | 5+ | Synchronisation et uploads |
| js/modules/backup/ | 2+ | Gestion backups |

---

## Statistiques Globales

### Code Source

| Type | Quantité | Estimation Lignes |
|------|----------|-------------------|
| **JavaScript** | 183 modules | ~25,000 lignes |
| **HTML** | 139 pages | ~15,000 lignes |
| **CSS** | 39 fichiers | ~8,000 lignes |
| **Node.js** | 20+ fichiers | ~5,000 lignes |
| **Scripts** | 15+ fichiers | ~1,000 lignes |
| **Total** | ~370 fichiers | **~54,000 lignes** |

### Dépendances

| Package | Version | Catégorie |
|---------|---------|-----------|
| express | 4.18.2 | Framework web |
| socket.io | 4.6.1 | Communication temps réel |
| joi | 18.0.1 | Validation données |
| multer | 2.0.2 | Upload fichiers |
| docxtemplater | 3.67.3 | Génération DOCX |
| pizzip | 3.2.0 | Manipulation ZIP |
| xlsx | 0.18.5 | Gestion Excel |
| winston | 3.18.3 | Logging |
| winston-daily-rotate-file | 5.0.0 | Rotation logs |
| compression | 1.8.1 | Compression HTTP |
| express-rate-limit | 8.2.1 | Rate limiting |
| node-cron | 4.2.1 | Tâches planifiées |

### Performance

| Métrique | Valeur |
|----------|--------|
| **Temps démarrage serveur** | ~2 secondes |
| **Temps chargement initial client** | ~3-5 secondes |
| **Taille application-data.json** | ~5-10 MB |
| **Nombre backups conservés** | 25 incrémentaux + 30 quotidiens |
| **Fréquence backup** | 5 minutes |
| **Rétention logs** | 30 jours (erreurs), 14 jours (combined) |
| **Rate limit API** | 100 req/15min (API), 2000 req/15min (général) |
| **Max upload fichier** | 50 MB |
| **Max buffer Socket.IO** | 10 MB |

---

## Points Forts

### 1. Architecture Modulaire

✅ **Organisation claire:** Séparation frontend/backend, modules bien organisés
✅ **Réutilisabilité:** Composants réutilisables, services découplés
✅ **Maintenabilité:** Code structuré, facile à naviguer et modifier
✅ **Extensibilité:** Facile d'ajouter de nouveaux modules/fonctionnalités

### 2. Communication Temps Réel

✅ **Socket.IO:** Synchronisation instantanée entre clients
✅ **Broadcast events:** Tous les utilisateurs reçoivent mises à jour
✅ **Optimisations:** Compression, throttling, buffer management
✅ **Fiabilité:** Reconnexion automatique, gestion erreurs

### 3. Persistance et Backups

✅ **Backups automatiques:** Incrémentaux (5 min) + quotidiens (2h00)
✅ **Rétention:** 25 incrémentaux + 30 quotidiens
✅ **Compression:** Option gzip pour économiser espace
✅ **Traçabilité:** Logs complets de toutes opérations

### 4. Sécurité

✅ **Rate limiting:** Protection contre surcharge et abus
✅ **Validation:** Joi schemas pour validation robuste
✅ **Sanitization:** Nettoyage inputs, détection attaques
✅ **Headers sécurité:** X-Content-Type-Options, X-Frame-Options, etc.
✅ **Validation fichiers:** Whitelist extensions, vérification MIME

### 5. Monitoring et Logging

✅ **Winston logging:** Logs structurés avec rotation
✅ **Health checks:** Endpoints monitoring (stats, health, logs)
✅ **Métriques:** Uptime, mémoire, CPU, état services
✅ **Alertes:** Logs erreurs séparés pour surveillance

### 6. Fonctionnalités Riches

✅ **80+ modules de données:** Couverture complète métier
✅ **Import/Export:** Excel, PDF, DOCX
✅ **Graphiques:** Chart.js pour visualisations
✅ **Gestion documents:** Upload, templates, génération
✅ **Analyses:** AMDEC, SMED, suivi coûts

---

## Points d'Amélioration

### 1. Base de Données

❌ **JSON file-based:** Non scalable pour production
❌ **Performances:** Lecture/écriture disque synchrone
❌ **Concurrent access:** Risque de conflits écriture
❌ **Recherche:** Pas d'indexation, recherches lentes

**Recommandation:**
- Migrer vers PostgreSQL ou MySQL
- Implémenter ORM (Sequelize, TypeORM, Prisma)
- Conserver JSON pour dev/test uniquement

### 2. Authentification

❌ **Pas d'authentification:** Application ouverte à tous
❌ **Pas d'autorisation:** Tous les utilisateurs ont mêmes droits
❌ **Pas de sessions:** Pas de gestion utilisateurs persistante
❌ **Pas de RBAC:** Pas de contrôle d'accès basé rôles

**Recommandation:**
- Implémenter JWT authentication
- Ajouter système de rôles (admin, manager, user, readonly)
- Middleware auth sur routes sensibles
- Sessions persistantes avec refresh tokens

### 3. Tests

❌ **Pas de tests unitaires:** Code non testé automatiquement
❌ **Pas de tests intégration:** Interactions non vérifiées
❌ **Pas de tests E2E:** Flux utilisateurs non testés
❌ **Pas de CI/CD:** Pas de validation automatique commits

**Recommandation:**
- Tests unitaires: Jest ou Mocha/Chai
- Tests intégration: Supertest pour API
- Tests E2E: Playwright ou Cypress
- CI/CD: GitHub Actions ou GitLab CI

### 4. HTTPS

❌ **HTTP only:** Communication non chiffrée
❌ **Pas de certificats SSL:** Vulnérable man-in-the-middle
❌ **Credentials en clair:** Passwords envoyés non chiffrés

**Recommandation:**
- Configurer HTTPS avec Let's Encrypt
- Forcer redirection HTTP → HTTPS
- Implémenter HSTS headers
- Chiffrer credentials en transit

### 5. Documentation

❌ **Documentation limitée:** Pas de docs utilisateur
❌ **Pas d'API docs:** Endpoints non documentés
❌ **Pas de diagrammes:** Architecture pas visualisée
❌ **Pas de guides:** Onboarding difficile nouveaux devs

**Recommandation:**
- Générer docs API avec Swagger/OpenAPI
- Créer guides utilisateur (markdown)
- Ajouter diagrammes architecture (draw.io, mermaid)
- Documenter processus déploiement

### 6. Scalabilité

❌ **Single-threaded:** Pas de clustering Node.js
❌ **File storage:** Uploads sur disque local
❌ **No caching:** Pas de Redis/Memcached
❌ **No load balancing:** Pas de répartition charge

**Recommandation:**
- Implémenter Node.js cluster mode
- Migrer uploads vers S3 ou équivalent
- Ajouter Redis pour caching et sessions
- Configurer load balancer (nginx, HAProxy)

### 7. Environnements

❌ **Config hardcodée:** Pas de gestion multi-env
❌ **Pas de staging:** Environnement test manquant
❌ **Pas de production config:** Pas de config prod séparée
❌ **Secrets en clair:** Credentials potentiellement exposés

**Recommandation:**
- Variables d'environnement (.env.dev, .env.prod)
- Environnements séparés (dev, staging, prod)
- Gestion secrets (Vault, AWS Secrets Manager)
- Configuration par environnement

---

## Recommandations Stratégiques

### Phase 1: Sécurisation (Priorité Haute)

**Durée estimée:** 2-3 semaines

1. **Authentification JWT**
   - Implémenter login/logout
   - Protéger routes API
   - Ajouter middleware auth

2. **HTTPS**
   - Configurer certificats SSL
   - Forcer HTTPS
   - Headers sécurité renforcés

3. **RBAC (Role-Based Access Control)**
   - Définir rôles (admin, manager, user)
   - Permissions par module
   - Audit trail des actions

### Phase 2: Robustesse (Priorité Haute)

**Durée estimée:** 3-4 semaines

1. **Migration Base de Données**
   - PostgreSQL ou MySQL
   - ORM (Prisma recommandé)
   - Migrations schema
   - Script migration données JSON → DB

2. **Tests**
   - Tests unitaires (coverage 70%+)
   - Tests intégration API
   - Tests E2E critiques
   - CI/CD pipeline

3. **Monitoring Avancé**
   - APM (Application Performance Monitoring)
   - Error tracking (Sentry)
   - Métriques custom (Prometheus)
   - Alerting (PagerDuty, Slack)

### Phase 3: Scalabilité (Priorité Moyenne)

**Durée estimée:** 4-6 semaines

1. **Infrastructure**
   - Node.js cluster mode
   - Redis pour caching
   - Load balancer
   - CDN pour assets statiques

2. **Storage**
   - S3 pour uploads
   - Backup strategy cloud
   - Replication DB

3. **Performance**
   - Query optimization
   - Lazy loading frontend
   - Code splitting
   - Compression assets

### Phase 4: Expérience Utilisateur (Priorité Basse)

**Durée estimée:** 2-3 semaines

1. **UI/UX**
   - Amélioration design
   - Responsive mobile
   - Accessibility (WCAG 2.1)
   - Dark mode amélioré

2. **Fonctionnalités**
   - Notifications push
   - Offline mode (PWA)
   - Recherche full-text
   - Exports avancés

3. **Documentation**
   - Guide utilisateur
   - Vidéos tutoriels
   - FAQ
   - Support chat

---

## Conclusion

Cette application représente une **solution complète et fonctionnelle** pour la gestion d'arrêts d'aciérie. L'architecture est **solide**, le code est **bien organisé**, et les fonctionnalités sont **riches et adaptées** au métier.

### Points Clés

✅ **Architecture modulaire** facilitant maintenance et évolution
✅ **Communication temps réel** efficace avec Socket.IO
✅ **Persistance robuste** avec backups automatiques
✅ **Sécurité de base** présente (rate limiting, validation, sanitization)
✅ **Fonctionnalités complètes** couvrant tous les besoins métier

⚠️ **Amélioration nécessaires pour production:**
- Migration vers DB relationnelle
- Authentification et autorisation
- Tests automatisés
- HTTPS obligatoire
- Documentation complète

### Prochaines Étapes Recommandées

1. **Court terme (1 mois):**
   - Authentification JWT
   - HTTPS
   - Tests critiques

2. **Moyen terme (3 mois):**
   - Migration PostgreSQL
   - CI/CD
   - Monitoring avancé

3. **Long terme (6 mois):**
   - Scalabilité infrastructure
   - PWA mobile
   - Documentation complète

---

**Document suivant:** [02-Technologies-Stack.md](./02-Technologies-Stack.md)
