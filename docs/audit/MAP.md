# MAP - Cartographie Complète de l'Application

**Date:** 2025-11-23
**Application:** Gestionnaire d'Arrêt d'Aciérie
**Version:** 1.0.0 / 2.0.0

---

## Table des Matières

1. [Vue d'Ensemble Globale](#vue-densemble-globale)
2. [Architecture en Couches](#architecture-en-couches)
3. [Map Backend](#map-backend)
4. [Map Frontend](#map-frontend)
5. [Map Flux de Données](#map-flux-de-données)
6. [Map Modules de Données](#map-modules-de-données)
7. [Map API & Endpoints](#map-api--endpoints)
8. [Map Sécurité](#map-sécurité)
9. [Map Fichiers](#map-fichiers)
10. [Index des Fonctionnalités](#index-des-fonctionnalités)

---

## Vue d'Ensemble Globale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     GESTIONNAIRE D'ARRÊT D'ACIÉRIE                          │
│                            Architecture SPA                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
          ┌─────────▼─────────┐          ┌─────────▼─────────┐
          │   CLIENT (SPA)    │          │  SERVER (API)     │
          │                   │          │                   │
          │  183 Modules JS   │◄────────►│  Express.js       │
          │  139 Pages HTML   │  Socket  │  Socket.IO        │
          │  39 Fichiers CSS  │   .IO    │  4 Services       │
          └───────────────────┘          └─────────┬─────────┘
                                                   │
                                         ┌─────────▼─────────┐
                                         │  DATA STORAGE     │
                                         │                   │
                                         │  application-     │
                                         │  data.json        │
                                         │  (80+ modules)    │
                                         │                   │
                                         │  Backups Auto     │
                                         │  (5min + daily)   │
                                         └───────────────────┘
```

---

## Architecture en Couches

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                          LAYER 1: PRÉSENTATION                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ║
║  │   HTML      │  │     CSS     │  │  JavaScript │  │   Assets    │    ║
║  │   Pages     │  │   Styles    │  │   Modules   │  │   Images    │    ║
║  │             │  │             │  │             │  │   Icons     │    ║
║  │ 139 pages   │  │ 39 fichiers │  │ 183 modules │  │   Fonts     │    ║
║  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                         LAYER 2: APPLICATION                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌──────────────────────┐  ┌──────────────────────┐                     ║
║  │   UI MODULES (21)    │  │  DATA MODULES (80+)  │                     ║
║  ├──────────────────────┤  ├──────────────────────┤                     ║
║  │ • page-loader.js     │  │ • iw37n-data.js      │                     ║
║  │ • devis-manager.js   │  │ • iw38-data.js       │                     ║
║  │ • summary.js         │  │ • psv-data.js        │                     ║
║  │ • dashboard-charts.js│  │ • t55-devis.js       │                     ║
║  │ • kanban.js          │  │ • amdec-data.js      │                     ║
║  │ • calendar.js        │  │ • t21-t139.js (40+)  │                     ║
║  └──────────────────────┘  └──────────────────────┘                     ║
║                                                                           ║
║  ┌──────────────────────────────────────────────────────────┐            ║
║  │             SPECIALIZED MODULES                          │            ║
║  ├──────────────────────────────────────────────────────────┤            ║
║  │ Charts (5) │ Entities (3) │ Demandes (3) │ Plans (3)    │            ║
║  │ Import/Export (3) │ Sync (3) │ Backup (2) │ Utils (4)   │            ║
║  └──────────────────────────────────────────────────────────┘            ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                      LAYER 3: CORE FRAMEWORK                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        ║
║  │   app.js   │  │ socket.js  │  │  store.js  │  │ actions.js │        ║
║  │            │  │            │  │            │  │            │        ║
║  │ Controller │  │ Socket.IO  │  │ State Mgmt │  │ API Calls  │        ║
║  │ Principal  │  │ Connection │  │ (Observer) │  │ (Wrappers) │        ║
║  └────────────┘  └────────────┘  └────────────┘  └────────────┘        ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                    LAYER 4: COMMUNICATION                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║        ┌────────────────────────────────────────────────┐                ║
║        │           Socket.IO Client ↔ Server            │                ║
║        │                                                 │                ║
║        │  Events: data:*, task:*, user:*, notification:*│                ║
║        └────────────────────────────────────────────────┘                ║
║                                                                           ║
║        ┌────────────────────────────────────────────────┐                ║
║        │              HTTP REST API                      │                ║
║        │                                                 │                ║
║        │  /api/files, /api/admin, /api/t55              │                ║
║        └────────────────────────────────────────────────┘                ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                        LAYER 5: BACKEND                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────┐         ║
║  │                    EXPRESS.JS SERVER                        │         ║
║  ├─────────────────────────────────────────────────────────────┤         ║
║  │  Middleware Stack (9):                                      │         ║
║  │  1. JSON/URLEncoded Parser    6. Sanitization              │         ║
║  │  2. HTTP Logger                7. Attack Detection          │         ║
║  │  3. Compression GZIP           8. Cache Control             │         ║
║  │  4. Security Headers           9. Rate Limiting             │         ║
║  │  5. CORS                                                    │         ║
║  └─────────────────────────────────────────────────────────────┘         ║
║                                                                           ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   ║
║  │   Routes     │  │   Services   │  │   Socket     │                   ║
║  │              │  │              │  │   Handlers   │                   ║
║  │ • files.js   │  │ • dataService│  │ • taskHandler│                   ║
║  │ • admin.js   │  │ • taskService│  │ • dataHandler│                   ║
║  │ • t55-docx.js│  │ • avisService│  │              │                   ║
║  │              │  │ • emailService│  │              │                   ║
║  └──────────────┘  └──────────────┘  └──────────────┘                   ║
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────┐         ║
║  │                      UTILITIES                              │         ║
║  ├─────────────────────────────────────────────────────────────┤         ║
║  │ logger.js │ scheduler.js │ file-security.js │ validation.js│         ║
║  └─────────────────────────────────────────────────────────────┘         ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                       LAYER 6: PERSISTANCE                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────┐         ║
║  │                  FILE SYSTEM STORAGE                        │         ║
║  ├─────────────────────────────────────────────────────────────┤         ║
║  │                                                             │         ║
║  │  server/data/                                               │         ║
║  │  ├─ application-data.json (5-10 MB, 80+ modules)           │         ║
║  │  ├─ backups/ (25 incrémentaux, 5 min)                      │         ║
║  │  └─ backups-daily/ (30 quotidiens, 2h00)                   │         ║
║  │                                                             │         ║
║  │  server/uploads/                                            │         ║
║  │  ├─ Fichiers uploadés (PDF, Excel, Images)                 │         ║
║  │  └─ t55-templates/ (Templates DOCX)                        │         ║
║  │                                                             │         ║
║  │  logs/                                                      │         ║
║  │  ├─ combined-YYYY-MM-DD.log (14 jours)                     │         ║
║  │  ├─ error-YYYY-MM-DD.log (30 jours)                        │         ║
║  │  ├─ exceptions-YYYY-MM-DD.log (30 jours)                   │         ║
║  │  └─ rejections-YYYY-MM-DD.log (30 jours)                   │         ║
║  │                                                             │         ║
║  │  generated-docs/                                            │         ║
║  │  ├─ Avis syndicaux générés (DOCX)                          │         ║
║  │  └─ Devis générés (DOCX)                                   │         ║
║  │                                                             │         ║
║  └─────────────────────────────────────────────────────────────┘         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Map Backend

### Structure Hiérarchique

```
server/
│
├── server.js ★ POINT D'ENTRÉE
│   ├─► Initialisation Express
│   ├─► Configuration Socket.IO
│   ├─► Setup Middleware (9 layers)
│   ├─► Enregistrement Routes
│   ├─► Démarrage HTTP Server
│   └─► Graceful Shutdown Handlers
│
├── config/
│   └── config.js
│       └─► Variables configuration globales
│
├── middleware/
│   ├── security.js ★ SÉCURITÉ
│   │   ├─► Headers CSP, X-Frame-Options, etc.
│   │   ├─► Sanitization inputs
│   │   ├─► Attack detection (SQL injection, Path traversal)
│   │   └─► CORS configuration
│   │
│   ├── errorHandler.js ★ ERREURS
│   │   ├─► AppError class
│   │   ├─► Error codes (10 types)
│   │   ├─► Format JSON réponses
│   │   └─► Process error handlers
│   │
│   └── validation.js ★ VALIDATION
│       ├─► 70+ Joi schemas
│       ├─► validateSocketData()
│       └─► Middleware factory
│
├── routes/ ★ API REST
│   ├── files.js
│   │   ├─► POST /api/files/upload
│   │   ├─► GET /api/files/download/:filename
│   │   ├─► GET /api/files/list
│   │   └─► DELETE /api/files/:filename
│   │
│   ├── admin.js
│   │   ├─► GET /api/admin/stats
│   │   ├─► GET /api/admin/logs
│   │   └─► GET /api/admin/health
│   │
│   └── t55-docx.js
│       ├─► POST /api/t55/upload-template
│       └─► POST /api/t55/generate-docx
│
├── services/ ★ LOGIQUE MÉTIER
│   ├── dataService.js ★ CRITIQUE
│   │   ├─► 80+ modules de données
│   │   ├─► initializeDataService()
│   │   ├─► getAllData() / getModuleData()
│   │   ├─► updateModuleData() / updateMultipleModules()
│   │   ├─► resetAllData()
│   │   ├─► createBackup() → Toutes les 5 min
│   │   ├─► createDailyBackup() → 2h00 du matin
│   │   ├─► cleanOldBackups() → Max 25
│   │   └─► cleanOldDailyBackups() → Max 30
│   │
│   ├── taskService.js
│   │   ├─► In-memory (non persistant)
│   │   ├─► getAllTasks() / getTaskById()
│   │   ├─► createTask() / updateTask() / deleteTask()
│   │   ├─► addUser() / removeUser() / getAllUsers()
│   │   └─► getGlobalState()
│   │
│   ├── avisService.js
│   │   └─► genererAvisSyndical(avisData)
│   │       ├─► Charge template DOCX
│   │       ├─► Remplit données (docxtemplater)
│   │       ├─► Supprime highlighting jaune
│   │       └─► Sauvegarde generated-docs/
│   │
│   └── emailService.js
│       ├─► envoyerAvisSyndical({to, filePath, avisData})
│       │   ├─► PowerShell script
│       │   ├─► Outlook COM automation
│       │   └─► Email HTML + attachment
│       └─► testerConfigurationEmail()
│
├── socket/ ★ TEMPS RÉEL
│   ├── index.js
│   │   ├─► initializeSocketHandlers(io)
│   │   ├─► connection event
│   │   │   ├─► Send initial state
│   │   │   ├─► Send application data
│   │   │   └─► Register handlers
│   │   └─► disconnect event
│   │       └─► Remove user
│   │
│   ├── taskHandler.js
│   │   ├─► task:create
│   │   ├─► task:update
│   │   └─► task:delete
│   │
│   └── dataHandler.js
│       ├─► data:getAll → callback
│       ├─► data:getModule → callback
│       ├─► data:updateModule → broadcast
│       ├─► data:updateMultiple → broadcast
│       ├─► data:reset → broadcast
│       └─► get-data (legacy)
│
├── utils/ ★ UTILITAIRES
│   ├── logger.js
│   │   ├─► Winston logger
│   │   ├─► DailyRotateFile transports
│   │   ├─► Helpers: logSocketEvent(), logHttpRequest()
│   │   └─► httpLoggerMiddleware()
│   │
│   ├── scheduler.js
│   │   ├─► initializeScheduler()
│   │   ├─► Daily backup: 0 2 * * * (2h00)
│   │   ├─► Log cleanup: 0 3 * * 0 (Dimanche 3h00)
│   │   └─► stopAllTasks(tasks)
│   │
│   ├── file-security.js
│   │   ├─► detectRealMimeType(filePath) → Magic numbers
│   │   ├─► validateUploadedFile(file, options)
│   │   ├─► sanitizeFilename(filename)
│   │   ├─► isDangerousFile(filename)
│   │   ├─► scanFileForThreats(filePath)
│   │   └─► calculateUserQuota() / isQuotaExceeded()
│   │
│   ├── socket-optimization.js
│   │   └─► Optimisations Socket.IO
│   │
│   └── backup-compression.js
│       └─► Compression GZIP backups
│
├── data/ ★ STOCKAGE
│   ├── application-data.json (5-10 MB)
│   ├── backups/ (25 max)
│   │   └── application-data-YYYY-MM-DDTHH-mm-ss.json
│   └── backups-daily/ (30 jours)
│       └── application-data-YYYY-MM-DD.json
│
└── uploads/
    ├── fichier-timestamp.pdf
    ├── fichier-timestamp.xlsx
    └── t55-templates/
        └── template-timestamp-Template.docx
```

### Flow de Requête Backend

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────┐
│     MIDDLEWARE STACK (ordre)        │
├─────────────────────────────────────┤
│ 1. JSON/URLEncoded Parser (50MB)   │
│ 2. HTTP Logger (Winston)            │
│ 3. Compression GZIP (level 6)       │
│ 4. Security Headers (CSP, etc.)     │
│ 5. CORS (localhost)                 │
│ 6. Sanitization (control chars)     │
│ 7. Attack Detection (SQL, Path)     │
│ 8. Cache Control (no-store)         │
│ 9. Rate Limiting (100/15min)        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         ROUTER MATCHING             │
├─────────────────────────────────────┤
│ /api/files/*    → filesRouter       │
│ /api/admin/*    → adminRouter       │
│ /api/t55/*      → t55Router         │
│ /download-*     → Download handlers │
│ /health         → Health check      │
│ /*              → Static / SPA      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         ROUTE HANDLER               │
├─────────────────────────────────────┤
│ 1. Validation (Joi schema)          │
│ 2. Business Logic (Service call)    │
│ 3. Response formatting              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         SERVICE LAYER               │
├─────────────────────────────────────┤
│ dataService / taskService / etc.    │
│ • Database operations               │
│ • File operations                   │
│ • Business rules                    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         PERSISTANCE                 │
├─────────────────────────────────────┤
│ • JSON File read/write              │
│ • Backup creation                   │
│ • Logging                           │
└─────────────────┬───────────────────┘
                  │
                  ▼
HTTP Response (JSON)
```

---

## Map Frontend

### Structure Hiérarchique

```
client/
│
├── index.html ★ POINT D'ENTRÉE
│   ├─► CDN Libraries (7)
│   │   ├─ Chart.js 3.9.1
│   │   ├─ chartjs-adapter-date-fns
│   │   ├─ XLSX 0.18.5
│   │   ├─ jsPDF 2.5.1
│   │   ├─ PDF.js 3.11.174
│   │   ├─ JSZip 3.10.1
│   │   └─ Socket.IO Client
│   │
│   ├─► CSS Files (5)
│   │   ├─ main.css (import centralisé)
│   │   ├─ compact-mode.css
│   │   ├─ professional-enhancements.css
│   │   ├─ assistant-briefing.css
│   │   └─ assistant-widget.css
│   │
│   └─► Initialization Script
│       ├─ waitForSocketIO()
│       ├─ waitForCDNLibraries()
│       ├─ loadComponents()
│       └─ import('./js/app.js').initApp()
│
├── css/ (39 fichiers)
│   ├── main.css ★ IMPORT CENTRAL
│   ├── base.css (Reset + Variables)
│   ├── modern-theme.css
│   ├── compact-mode.css
│   ├── professional-enhancements.css
│   │
│   ├── components/
│   │   ├── header.css
│   │   ├── navigation.css
│   │   ├── tables.css
│   │   ├── forms.css
│   │   ├── modals.css
│   │   ├── cards.css
│   │   ├── buttons.css
│   │   ├── charts.css
│   │   ├── kanban.css
│   │   ├── timeline.css
│   │   └── stats.css
│   │
│   └── themes/
│       └── modern-industrial.css
│
├── js/ (183 modules)
│   │
│   ├── main.js
│   │   └─► Expose global functions
│   │
│   ├── app.js ★ CONTRÔLEUR PRINCIPAL (1500+ lignes)
│   │   ├─► initApp() - 9 étapes
│   │   ├─► Phase 0a: Import data modules critiques
│   │   ├─► Phase 0b: Global functions
│   │   ├─► Phase 1: Core modules
│   │   ├─► Phase 2: Data modules (80+)
│   │   ├─► Phase 3: UI modules (21)
│   │   ├─► Phase 4-7: Specialized modules
│   │   ├─► setupAutoSave() - Toutes les 60 sec
│   │   └─► setupEventListeners()
│   │
│   ├── socket.js ★ SOCKET.IO
│   │   ├─► io() connection
│   │   ├─► initSocketListeners()
│   │   ├─► Events:
│   │   │   ├─ connect / disconnect
│   │   │   ├─ state:update
│   │   │   ├─ notification:error / success
│   │   │   ├─ data:moduleUpdated
│   │   │   ├─ data:resetComplete
│   │   │   └─ data:initial
│   │   └─► window.socket (global)
│   │
│   ├── store.js ★ STATE MANAGEMENT
│   │   ├─► Pattern: Observer (Zustand-like)
│   │   ├─► initializeState(initialState)
│   │   ├─► setState(newState) → notify()
│   │   ├─► updateState(updates)
│   │   ├─► getState()
│   │   └─► subscribe(selector, callback)
│   │
│   ├── actions.js ★ API WRAPPERS
│   │   ├─► createTask(taskData)
│   │   ├─► updateTask(taskId, updates)
│   │   ├─► deleteTask(taskId)
│   │   ├─► changeTaskStatus(taskId, status)
│   │   ├─► joinSession(userName)
│   │   ├─► saveModuleData(moduleName, data)
│   │   └─► loadModuleData(moduleName)
│   │
│   ├── ui.js
│   │   ├─► initUI()
│   │   ├─► renderTaskList(tasks)
│   │   ├─► renderUserList(users)
│   │   └─► Event handlers (onclick exposés)
│   │
│   ├── global-functions.js
│   │   └─► exposeGlobalFunctions()
│   │       └─► Fonctions pour onclick HTML
│   │
│   └── modules/
│       │
│       ├── data/ ★ 80+ MODULES DE DONNÉES
│       │   ├── index.js
│       │   │   ├─► initializeDataModules()
│       │   │   ├─► saveAllData()
│       │   │   └─► getDataSummary()
│       │   │
│       │   ├── arret-data.js (300+ lignes)
│       │   ├── iw37n-data.js (604 lignes)
│       │   ├── iw38-data.js
│       │   ├── psv-data.js (800 lignes)
│       │   ├── tpaa-data.js
│       │   ├── pw-data.js
│       │   ├── espace-clos-data.js (876 lignes)
│       │   ├── travail-hauteur-data.js
│       │   ├── approvisionnement-data.js
│       │   ├── consommables-data.js
│       │   ├── pieces-data.js
│       │   ├── amdec-data.js (830 lignes)
│       │   ├── smed-data.js
│       │   ├── avis-data.js (616 lignes)
│       │   ├── point-presse-data.js (418+ lignes)
│       │   ├── t21-priorisation-data.js
│       │   ├── t22-strategie-data.js
│       │   ├── t25-avis-data.js (616 lignes)
│       │   ├── t30-commandes.js
│       │   ├── t33-priorisation-data.js
│       │   ├── t40-entrepreneurs-data.js (210 lignes)
│       │   ├── t51-soumissions.js (575 lignes)
│       │   ├── t55-devis.js ★ (1463 lignes - PLUS GROS!)
│       │   ├── t60-commandes-data.js
│       │   ├── t63-zones.js (498 lignes)
│       │   ├── t72-suivi-cout.js (756 lignes)
│       │   ├── t88-long-delai.js (518 lignes)
│       │   ├── ... (t24, t27, t29, etc.)
│       │   └── ... (40+ autres modules T-series)
│       │
│       ├── ui/ ★ 21 MODULES UI
│       │   ├── index.js
│       │   │   └─► initUI()
│       │   │
│       │   ├── page-loader.js ★ (885 lignes)
│       │   │   ├─► pageCache (Map)
│       │   │   ├─► PAGE_CONTROLLERS (40+ lazy imports)
│       │   │   ├─► loadPageComponent(pageId)
│       │   │   ├─► switchToPage(pageId)
│       │   │   └─► getCurrentPage()
│       │   │
│       │   ├── devis-manager.js ★ (2523 lignes - ÉNORME!)
│       │   │   ├─► CRUD complet devis
│       │   │   ├─► Historique modifications
│       │   │   ├─► Corrections et révisions
│       │   │   ├─► Export Excel
│       │   │   └─► Génération DOCX
│       │   │
│       │   ├── summary.js (730 lignes)
│       │   │   ├─► renderSummaryTable()
│       │   │   ├─► calculatePhaseDate()
│       │   │   └─► Tableau préparation
│       │   │
│       │   ├── summary-timeline.js (592 lignes)
│       │   │   └─► Timeline visuelle préparation
│       │   │
│       │   ├── drag-drop.js (599 lignes)
│       │   │   └─► Upload fichiers drag & drop
│       │   │
│       │   ├── kanban.js (506 lignes)
│       │   │   └─► Vue Kanban tâches
│       │   │
│       │   ├── calendar.js (472 lignes)
│       │   │   └─► Calendrier interactif
│       │   │
│       │   ├── dashboard-modals.js
│       │   ├── dashboard-actions.js
│       │   ├── dashboard-filters.js
│       │   ├── dashboard-charts.js
│       │   ├── bilan-reunions.js (404 lignes)
│       │   ├── order-metadata-ui.js (431 lignes)
│       │   └── responsable-modal.js
│       │
│       ├── charts/ ★ GRAPHIQUES
│       │   ├── index.js
│       │   ├── dashboard-charts.js
│       │   │   ├─► initDashboardCharts()
│       │   │   ├─► createAvancementPhaseChart()
│       │   │   ├─► createResponsablesChart()
│       │   │   ├─► createStatutTachesChart()
│       │   │   ├─► createBudgetTrackingChart()
│       │   │   └─► createBudgetRepartitionChart()
│       │   └── charts.js
│       │       ├─► createPieChart()
│       │       ├─► createBarChart()
│       │       ├─► createLineChart()
│       │       └─► createGaugeChart()
│       │
│       ├── entities/ ★ ENTITÉS
│       │   ├── entrepreneurs.js
│       │   ├── team.js
│       │   ├── contacts.js
│       │   └── ingq.js
│       │
│       ├── demandes/ ★ DEMANDES
│       │   ├── echafaudages.js
│       │   ├── grues-nacelles.js
│       │   └── verrouillage.js
│       │
│       ├── plans/ ★ PLANS
│       │   ├── plan-renderer.js
│       │   ├── zone-editor.js
│       │   └── zones-plan-editor.js (797 lignes)
│       │
│       ├── psv/
│       │   └── psv-plan-markers.js
│       │
│       ├── scope/
│       │   └── scope-markers.js
│       │
│       ├── sync/ ★ SYNCHRONISATION
│       │   ├── server-sync.js (36 KB!)
│       │   │   ├─► initSync(user)
│       │   │   ├─► loadInitialDataFromServer()
│       │   │   ├─► applyServerData(data)
│       │   │   ├─► handleModuleUpdate(update)
│       │   │   └─► handleRemoteReset()
│       │   │
│       │   ├── storage-wrapper.js
│       │   │   ├─► saveToStorage(key, data)
│       │   │   └─► loadFromStorage(key)
│       │   │
│       │   └── auto-refresh.js
│       │
│       ├── import-export/
│       │   ├── excel-import.js
│       │   ├── excel-export.js
│       │   └── pdf-export.js
│       │
│       ├── backup/
│       │   └── backup-manager.js
│       │
│       ├── assistant/
│       │   └── virtual-assistant.js
│       │
│       ├── theme.js
│       │   ├─► changeTheme(themeName)
│       │   ├─► loadSavedTheme()
│       │   ├─► getCurrentTheme()
│       │   └─► resetTheme()
│       │
│       ├── utils.js
│       │   ├─► getUserInfo()
│       │   ├─► getOrCreateSessionId()
│       │   ├─► formatDate() / formatDateTime()
│       │   ├─► daysBetween()
│       │   ├─► generateId()
│       │   ├─► isEmpty()
│       │   ├─► copyToClipboard()
│       │   ├─► downloadJSON()
│       │   ├─► escapeHTML()
│       │   ├─► sortByProperty()
│       │   └─► debounce()
│       │
│       └── init.js
│           ├─► loadAllData()
│           ├─► initApp()
│           ├─► resetApp()
│           └─► checkAppHealth()
│
├── components/
│   ├── layout/
│   │   ├── app-header.html
│   │   ├── app-navigation.html
│   │   ├── app-loader.html
│   │   └── app-modals.html
│   │
│   └── pages/ ★ 139 PAGES HTML
│       ├── dashboard.html
│       ├── execution.html
│       ├── historique.html
│       ├── contacts.html
│       ├── bilan-reunions.html
│       ├── detail-amdec.html
│       ├── detail-approvisionnement.html
│       ├── detail-avis.html
│       ├── detail-avis-syndicaux.html
│       ├── detail-consommables.html
│       ├── detail-devis.html
│       ├── detail-espace-clos.html
│       ├── detail-plan-levage.html
│       ├── detail-protocole-arret.html
│       ├── detail-t21.html
│       ├── detail-t22.html
│       ├── detail-t24.html
│       ├── ... (t25-t99)
│       └── ... (100+ pages détails)
│
├── admin/
│   └── Pages administration
│
├── maintenance/
│   └── Pages maintenance
│
└── pages/
    └── Pages statiques
```

### Flow de Chargement Frontend

```
Browser Load index.html
    │
    ▼
┌──────────────────────────────────────┐
│  ÉTAPE 1: Chargement Dépendances     │
├──────────────────────────────────────┤
│  1. CDN Libraries (defer)            │
│     • Chart.js                       │
│     • XLSX                           │
│     • jsPDF                          │
│     • Socket.IO                      │
│  2. CSS Files                        │
│  3. PDF.js Worker config             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  ÉTAPE 2: Attente Async              │
├──────────────────────────────────────┤
│  waitForSocketIO() - Max 10s         │
│  waitForCDNLibraries() - Max 15s     │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  ÉTAPE 3: Chargement Composants      │
├──────────────────────────────────────┤
│  • app-loader.html                   │
│  • app-header.html                   │
│  • app-navigation.html               │
│  • app-modals.html                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  ÉTAPE 4: Initialisation App         │
├──────────────────────────────────────┤
│  import('./js/app.js')               │
│  initApp()                           │
│    ├─ exposeGlobalFunctions()        │
│    ├─ loadSavedTheme()               │
│    ├─ initSync('User')               │
│    ├─ loadAllData()                  │
│    ├─ initializeDataModules()        │
│    ├─ initUI()                       │
│    ├─ switchPage('dashboard')        │
│    ├─ initAssistant()                │
│    ├─ setupAutoSave()                │
│    └─ setupEventListeners()          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  ÉTAPE 5: Affichage Interface        │
├──────────────────────────────────────┤
│  • Hide loader (fade-out)            │
│  • Show app container (fade-in)      │
│  • Ready!                            │
└──────────────────────────────────────┘
```

---

## Map Flux de Données

### Flux Complet: User Action → Server → Broadcast

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION                              │
│  (Click bouton "Sauvegarder", Form submit, Drag & Drop, etc.)         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          UI EVENT HANDLER                               │
│  onclick="saveDevis()" ou addEventListener('submit', ...)              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         UI MODULE METHOD                                │
│  devisManager.updateDevis(devisId, updates)                            │
│  ou iw37nData.saveIw37nData()                                          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ACTIONS WRAPPER                                 │
│  saveModuleData('t55Data', devisData)                                  │
│  socket.emit('data:updateModule', {moduleName, data, userName})        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Socket.IO WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVER: SOCKET HANDLER                          │
│  socket.on('data:updateModule', async (payload, callback) => {...})    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VALIDATION (Joi)                                │
│  const { error, value } = updateModuleSchema.validate(payload)         │
│  if (error) return callback({ success: false, error })                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SANITIZATION                                    │
│  sanitizeObject(value.data) - Remove control chars                     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SERVICE                                    │
│  await dataService.updateModuleData(moduleName, data, userName)         │
│    ├─ Load application-data.json                                       │
│    ├─ Update module in memory                                          │
│    ├─ Write back to file                                               │
│    └─ Create backup (if 5 min elapsed)                                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOGGING (Winston)                               │
│  logger.info('Data Operation', {operation, module, user, success})     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CALLBACK TO SENDER                              │
│  callback({ success: true, data: updatedData })                        │
└─────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROADCAST TO OTHERS                             │
│  socket.broadcast.emit('data:moduleUpdated', {                         │
│    moduleName, data, updatedBy, timestamp                              │
│  })                                                                     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Socket.IO WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ALL OTHER CLIENTS                               │
│  socket.on('data:moduleUpdated', (update) => {...})                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT: UPDATE LOCAL DATA                       │
│  const setter = window[`set${moduleName}Data`]                         │
│  setter(update.data)  // e.g. setT55Data(data)                         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT: UPDATE STORE                            │
│  store.setState({ [moduleName]: update.data })                         │
│  → Triggers notify() → All subscribers called                          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT: RE-RENDER UI                            │
│  subscribe((state) => state.t55Data, (data) => {                       │
│    renderDevisTable(data)                                              │
│  })                                                                     │
│  → Table automatically updates with new data                           │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION VISUELLE                           │
│  showNotification('success', 't55Data mis à jour par User')            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Temps de Réponse Typiques

| Opération | Temps Moyen |
|-----------|-------------|
| Socket.IO emit → callback | 10-50 ms |
| JSON read (5 MB) | 50-200 ms |
| JSON write (5 MB) | 100-300 ms |
| Backup creation | 100-300 ms |
| Total (save + broadcast) | **200-600 ms** |
| UI re-render | 10-50 ms |
| **Total perçu par utilisateur** | **~300-700 ms** |

---

## Map Modules de Données

### Organisation par Catégorie

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       80+ MODULES DE DONNÉES                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 1: SAP/ERP (3 modules)                              │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • iw37n-data.js (604 lignes)                                   │    │
│  │   └─► Ordres de maintenance SAP IW37N                         │    │
│  │   └─► Import Excel, filtrage, export                          │    │
│  │                                                                │    │
│  │ • iw38-data.js                                                 │    │
│  │   └─► Données complémentaires IW38                            │    │
│  │   └─► Notifications, historique                               │    │
│  │                                                                │    │
│  │ • t55-devis.js (1463 lignes) ★ PLUS GROS MODULE                │    │
│  │   └─► Devis entrepreneurs complets                            │    │
│  │   └─► CRUD, historique, corrections, génération DOCX          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 2: PRÉPARATION ARRÊT (5 modules)                    │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • arret-data.js (300+ lignes)                                  │    │
│  │   └─► Données centrales arrêt (dates, phases, config)         │    │
│  │                                                                │    │
│  │ • tpaa-data.js                                                 │    │
│  │   └─► Travaux Préparatoires Avant Arrêt                       │    │
│  │                                                                │    │
│  │ • pw-data.js                                                   │    │
│  │   └─► Pre-Work / Travaux préalables                           │    │
│  │                                                                │    │
│  │ • protocole-arret-data.js                                      │    │
│  │   └─► Séquence d'arrêt équipements                            │    │
│  │                                                                │    │
│  │ • protocole-gantt.js (957 lignes)                              │    │
│  │   └─► Gantt protocole visuel                                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 3: PSV / SÉCURITÉ (4 modules)                       │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • psv-data.js (800 lignes)                                     │    │
│  │   └─► Pressure Safety Valves, plans, marqueurs               │    │
│  │                                                                │    │
│  │ • espace-clos-data.js (876 lignes)                             │    │
│  │   └─► Espaces confinés, permis, équipements                  │    │
│  │                                                                │    │
│  │ • travail-hauteur-data.js                                      │    │
│  │   └─► Échafaudages, nacelles, harnais                        │    │
│  │                                                                │    │
│  │ • demandes-verrouillage.js                                     │    │
│  │   └─► LOTO (Lockout/Tagout), énergies                        │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 4: APPROVISIONNEMENT (6 modules)                    │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • pieces-data.js                                               │    │
│  │   └─► Pièces de rechange, stock, localisation                │    │
│  │                                                                │    │
│  │ • consommables-data.js                                         │    │
│  │   └─► Matériaux consommables, boulons, joints                │    │
│  │                                                                │    │
│  │ • consommables-commande-data.js (2200+ lignes)                 │    │
│  │   └─► Commandes consommables détaillées                      │    │
│  │                                                                │    │
│  │ • approvisionnement-data.js                                    │    │
│  │   └─► Stratégie approvisionnement globale                    │    │
│  │                                                                │    │
│  │ • t30-commandes-approvisionnement-data.js                      │    │
│  │   └─► Commandes 30 jours avant arrêt                         │    │
│  │                                                                │    │
│  │ • t60-commandes-data.js                                        │    │
│  │   └─► Commandes 60 jours avant arrêt                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 5: ÉQUIPEMENTS (5 modules)                          │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • equipement-levage-data.js                                    │    │
│  │   └─► Grues, palans, ponts roulants                          │    │
│  │                                                                │    │
│  │ • nacelles-data.js                                             │    │
│  │   └─► Nacelles élévatrices                                    │    │
│  │                                                                │    │
│  │ • equip-location-data.js (1079 lignes)                         │    │
│  │   └─► Location équipements externes                          │    │
│  │                                                                │    │
│  │ • inspection-levage-data.js                                    │    │
│  │   └─► Inspections réglementaires levage                      │    │
│  │                                                                │    │
│  │ • plan-levage-data.js (644 lignes)                             │    │
│  │   └─► Plans de levage détaillés                              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 6: TÂCHES (T-SERIES) (40+ modules)                  │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • t21-priorisation-data.js                                     │    │
│  │ • t22-strategie-data.js                                        │    │
│  │ • t24-identification-besoins.js                                │    │
│  │ • t25-avis-data.js (616 lignes)                                │    │
│  │ • t27-budget-previsionnel.js                                   │    │
│  │ • t29-appels-offres.js                                         │    │
│  │ • t30-commandes-approvisionnement-data.js                      │    │
│  │ • t33-priorisation-data.js                                     │    │
│  │ • t40-entrepreneurs-data.js (210 lignes)                       │    │
│  │ • t51-soumissions.js (575 lignes)                              │    │
│  │ • t55-devis.js (1463 lignes) ★                                 │    │
│  │ • t60-commandes-data.js                                        │    │
│  │ • t63-zones.js (498 lignes)                                    │    │
│  │ • t72-suivi-cout.js (756 lignes)                               │    │
│  │ • t88-long-delai.js (518 lignes)                               │    │
│  │ • ... (t90-t139) - 30+ autres modules                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 7: ANALYSES (4 modules)                             │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • amdec-data.js (830 lignes)                                   │    │
│  │   └─► FMEA: Modes défaillance, criticité                     │    │
│  │                                                                │    │
│  │ • smed-data.js                                                 │    │
│  │   └─► Single Minute Exchange of Die                          │    │
│  │   └─► Optimisation temps changement                          │    │
│  │                                                                │    │
│  │ • t72-suivi-cout.js (756 lignes)                               │    │
│  │   └─► Suivi budgétaire détaillé                              │    │
│  │                                                                │    │
│  │ • t33-priorisation-data.js                                     │    │
│  │   └─► Priorisation tâches par criticité                      │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 8: COMMUNICATION (3 modules)                        │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • avis-data.js (616 lignes)                                    │    │
│  │   └─► Avis syndicaux généraux                                │    │
│  │                                                                │    │
│  │ • t25-avis-data.js (616 lignes)                                │    │
│  │   └─► Avis syndicaux T25 spécifiques                         │    │
│  │   └─► Génération DOCX, envoi email                           │    │
│  │                                                                │    │
│  │ • point-presse-data.js (418+ lignes)                           │    │
│  │   └─► Points de presse hebdomadaires                         │    │
│  │   └─► Communication avancement                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 9: ÉQUIPES & CONTACTS (3 modules)                   │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • team-data.js                                                 │    │
│  │   └─► Équipes internes, superviseurs, membres                │    │
│  │                                                                │    │
│  │ • contacts-manager.js                                          │    │
│  │   └─► Carnet d'adresses complet                              │    │
│  │                                                                │    │
│  │ • t40-entrepreneurs-data.js (210 lignes)                       │    │
│  │   └─► Base données entrepreneurs externes                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CATÉGORIE 10: CONFIGURATION (5+ modules)                      │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ • settings-data.js                                             │    │
│  │   └─► Paramètres application                                 │    │
│  │                                                                │    │
│  │ • scope-filters.js                                             │    │
│  │   └─► Filtres scope arrêt                                    │    │
│  │                                                                │    │
│  │ • data-page-filters.js                                         │    │
│  │   └─► Filtres pages de données                               │    │
│  │                                                                │    │
│  │ • poste-allocations.js                                         │    │
│  │   └─► Allocations postes de travail                          │    │
│  │                                                                │    │
│  │ • zones-plan-editor.js (797 lignes)                            │    │
│  │   └─► Éditeur plans zones                                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Structure Commune d'un Module de Données

```javascript
/**
 * Pattern standard pour tous les modules de données
 */

// 1. Déclaration variable globale
export let moduleData = [];

// 2. Setter (pour injection serveur)
export function setModuleData(data) {
    moduleData = data;
    if (typeof window !== 'undefined') {
        window.setModuleData = setModuleData;
        console.log('[MODULE] ✅ window.setModuleData exposée');
    }
}

// 3. Chargement depuis serveur/localStorage
export async function loadModuleData() {
    const saved = await loadFromStorage('moduleData');
    if (saved) {
        moduleData = saved;
        console.log(`[MODULE] ✅ ${moduleData.length} items chargés`);
        renderModuleTable();
    }
}

// 4. Sauvegarde
export async function saveModuleData() {
    console.log('[MODULE] 💾 Sauvegarde...');
    return await saveToStorage('moduleData', moduleData);
}

// 5. CRUD Operations
export function addItem(item) {
    moduleData.push(item);
    saveModuleData();
    renderModuleTable();
}

export function updateItem(id, updates) {
    const index = moduleData.findIndex(item => item.id === id);
    if (index !== -1) {
        moduleData[index] = { ...moduleData[index], ...updates };
        saveModuleData();
        renderModuleTable();
    }
}

export function deleteItem(id) {
    moduleData = moduleData.filter(item => item.id !== id);
    saveModuleData();
    renderModuleTable();
}

// 6. Filtrage / Recherche
export function filterItems(criteria) {
    return moduleData.filter(item => {
        // Logic de filtrage
    });
}

// 7. Rendu UI
function renderModuleTable() {
    const container = document.getElementById('module-table-container');
    if (!container) return;

    // HTML generation
    container.innerHTML = generateTableHTML(moduleData);
}

// 8. Getter
export function getModuleData() {
    return moduleData;
}
```

---

## Map API & Endpoints

### Routes REST API

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            API ENDPOINTS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ /api/files/* - Gestion Fichiers                               │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  POST /api/files/upload                                        │    │
│  │  ├─► Body: multipart/form-data                                │    │
│  │  ├─► Files: files[] (max 10, 50MB each)                       │    │
│  │  ├─► Validation: Extension whitelist, MIME, Size              │    │
│  │  └─► Response: {success, files: [...]}                        │    │
│  │                                                                │    │
│  │  GET /api/files/download/:filename                            │    │
│  │  ├─► Params: filename                                         │    │
│  │  ├─► Security: Path validation                                │    │
│  │  └─► Response: Binary file + Content-Type                     │    │
│  │                                                                │    │
│  │  GET /api/files/list                                          │    │
│  │  └─► Response: {success, files: [...]}                        │    │
│  │                                                                │    │
│  │  DELETE /api/files/:filename                                  │    │
│  │  └─► Response: {success, message}                             │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ /api/admin/* - Administration & Monitoring                    │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  GET /api/admin/stats                                          │    │
│  │  └─► Response:                                                 │    │
│  │      {                                                         │    │
│  │        server: {uptime, nodeVersion, platform},                │    │
│  │        memory: {used, total, systemTotal, usagePercent},       │    │
│  │        cpu: {count, model, speed, loadAverage},                │    │
│  │        data: {size, backups, dailyBackups},                    │    │
│  │        network: {requestCount, requestsPerMinute, clients}     │    │
│  │      }                                                         │    │
│  │                                                                │    │
│  │  GET /api/admin/logs?level=&limit=&search=                    │    │
│  │  ├─► Query: level (error|warn|info), limit, search            │    │
│  │  └─► Response: {success, logs: [...]}                         │    │
│  │                                                                │    │
│  │  GET /api/admin/health                                         │    │
│  │  └─► Response:                                                 │    │
│  │      {                                                         │    │
│  │        status: "ok|warning|error",                             │    │
│  │        checks: [                                               │    │
│  │          {name, status, value, message},                       │    │
│  │          ...                                                   │    │
│  │        ],                                                      │    │
│  │        alerts: [...],                                          │    │
│  │        timestamp                                               │    │
│  │      }                                                         │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ /api/t55/* - Génération Documents DOCX                        │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  POST /api/t55/upload-template                                 │    │
│  │  ├─► Body: multipart/form-data                                │    │
│  │  ├─► File: template (DOCX only)                               │    │
│  │  └─► Response: {success, filename, path}                      │    │
│  │                                                                │    │
│  │  POST /api/t55/generate-docx                                   │    │
│  │  ├─► Body: {templateFilename, data}                           │    │
│  │  ├─► Process:                                                 │    │
│  │  │   1. Load template DOCX                                    │    │
│  │  │   2. Fill with docxtemplater                               │    │
│  │  │   3. Remove yellow highlighting                            │    │
│  │  │   4. Generate output DOCX                                  │    │
│  │  │   5. Save to generated-docs/                               │    │
│  │  └─► Response:                                                 │    │
│  │      {                                                         │    │
│  │        success, fileName, filePath,                            │    │
│  │        downloadUrl: "/download-devis/..."                      │    │
│  │      }                                                         │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Routes Utilitaires                                             │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  GET /health                                                   │    │
│  │  └─► Quick health check                                       │    │
│  │                                                                │    │
│  │  GET /download-avis/:fileName                                  │    │
│  │  └─► Télécharger avis syndical généré                         │    │
│  │                                                                │    │
│  │  GET /download-devis/:fileName                                 │    │
│  │  └─► Télécharger devis généré                                 │    │
│  │                                                                │    │
│  │  GET /client/* ou GET /*                                       │    │
│  │  └─► Static files ou SPA fallback (index.html)                │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Socket.IO Events

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOCKET.IO EVENTS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ CONNECTION & LIFECYCLE                                         │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  connection                                                    │    │
│  │  ├─► Trigger: New client connects                             │    │
│  │  ├─► Server Actions:                                          │    │
│  │  │   1. Send initial state: emit('state:update', state)       │    │
│  │  │   2. Send app data: emit('data:initial', appData)          │    │
│  │  │   3. Register event handlers                               │    │
│  │  └─► Client: Ready to interact                                │    │
│  │                                                                │    │
│  │  disconnect                                                    │    │
│  │  ├─► Trigger: Client disconnects                              │    │
│  │  └─► Server Actions:                                          │    │
│  │      1. Remove user from list                                 │    │
│  │      2. Broadcast state update                                │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ USER MANAGEMENT                                                │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  user:join                                                     │    │
│  │  ├─► Payload: {userName}                                      │    │
│  │  └─► Server:                                                  │    │
│  │      1. Add user to connected list                            │    │
│  │      2. Broadcast('state:update', newState)                   │    │
│  │      3. emit('notification:success', welcome)                 │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ DATA OPERATIONS                                                │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  data:getAll                                                   │    │
│  │  ├─► Callback: (response) => {...}                            │    │
│  │  └─► Response: {success, data: {...all modules...}}           │    │
│  │                                                                │    │
│  │  data:getModule                                                │    │
│  │  ├─► Payload: {moduleName}                                    │    │
│  │  ├─► Validation: Module in authorized list                    │    │
│  │  └─► Callback: {success, data}                                │    │
│  │                                                                │    │
│  │  data:updateModule                                             │    │
│  │  ├─► Payload: {moduleName, data, userName}                    │    │
│  │  ├─► Server:                                                  │    │
│  │  │   1. Validate (Joi schema)                                 │    │
│  │  │   2. Sanitize (remove control chars)                       │    │
│  │  │   3. Update in application-data.json                       │    │
│  │  │   4. Create backup (if 5 min elapsed)                      │    │
│  │  │   5. Log operation                                         │    │
│  │  ├─► Callback: {success, data}                                │    │
│  │  └─► Broadcast: ('data:moduleUpdated', update) to others      │    │
│  │                                                                │    │
│  │  data:updateMultiple                                           │    │
│  │  ├─► Payload: {updates: [{moduleName, data}, ...], userName}  │    │
│  │  ├─► Max: 50 updates per request                              │    │
│  │  ├─► Server: Update each module                               │    │
│  │  ├─► Callback: {success, results}                             │    │
│  │  └─► Broadcast: ('data:multipleUpdated', updates) to others   │    │
│  │                                                                │    │
│  │  data:reset                                                    │    │
│  │  ├─► Payload: {userName}                                      │    │
│  │  ├─► Server: Reset all data to initial state                  │    │
│  │  └─► Broadcast: ('data:resetComplete') to all                 │    │
│  │                                                                │    │
│  │  data:initial (server → client)                               │    │
│  │  ├─► Sent after connection                                    │    │
│  │  └─► Payload: {all 80+ modules data}                          │    │
│  │                                                                │    │
│  │  data:moduleUpdated (server → clients broadcast)              │    │
│  │  ├─► Sent after data:updateModule                             │    │
│  │  └─► Payload: {moduleName, data, updatedBy, timestamp}        │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ TASK MANAGEMENT                                                │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  task:create                                                   │    │
│  │  ├─► Payload: taskData                                        │    │
│  │  └─► Broadcast: ('state:update', newState)                    │    │
│  │                                                                │    │
│  │  task:update                                                   │    │
│  │  ├─► Payload: {taskId, updates}                               │    │
│  │  └─► Broadcast: ('state:update', newState)                    │    │
│  │                                                                │    │
│  │  task:delete                                                   │    │
│  │  ├─► Payload: {taskId}                                        │    │
│  │  └─► Broadcast: ('state:update', newState)                    │    │
│  │                                                                │    │
│  │  state:update (server → clients)                              │    │
│  │  └─► Payload: {tasks: [...], users: [...]}                    │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ NOTIFICATIONS                                                  │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  notification:error (server → client)                          │    │
│  │  └─► Payload: {message, code, context}                        │    │
│  │                                                                │    │
│  │  notification:success (server → client)                        │    │
│  │  └─► Payload: message                                         │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ LEGACY / COMPATIBILITY                                         │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  get-data (legacy)                                             │    │
│  │  └─► Emit: ('data-update', allData)                           │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Map Sécurité

### Couches de Sécurité

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  LAYER 1: NETWORK SECURITY                                              │
│  ├─► Rate Limiting: 100 req/15min (API), 2000 req/15min (General)      │
│  ├─► CORS: localhost only (dev), domain whitelist (prod)                │
│  └─► Socket.IO: 100 msg/min per socket                                  │
│                                                                         │
│  LAYER 2: HEADERS SECURITY                                              │
│  ├─► Content-Security-Policy (CSP):                                     │
│  │   • default-src 'self'                                               │
│  │   • script-src 'self' 'unsafe-inline' 'unsafe-eval' CDNs            │
│  │   • style-src 'self' 'unsafe-inline' CDNs                            │
│  │   • img-src 'self' data: https:                                      │
│  │   • connect-src 'self' ws: wss:                                      │
│  │   • frame-ancestors 'none'                                           │
│  ├─► X-Content-Type-Options: nosniff                                    │
│  ├─► X-Frame-Options: DENY                                              │
│  ├─► X-XSS-Protection: 1; mode=block                                    │
│  ├─► Referrer-Policy: strict-origin-when-cross-origin                   │
│  └─► Permissions-Policy: geolocation=(), microphone=(), camera=()       │
│                                                                         │
│  LAYER 3: INPUT VALIDATION                                              │
│  ├─► Joi Schemas: 70+ validation schemas                                │
│  ├─► Modules validés: Tous les 80+ modules de données                   │
│  ├─► Socket.IO events: Validation avant traitement                      │
│  └─► File uploads: Extension, MIME, Size validation                     │
│                                                                         │
│  LAYER 4: INPUT SANITIZATION                                            │
│  ├─► Control characters removal: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g   │
│  ├─► Applied to: query, params, body (HTTP), payload (Socket.IO)        │
│  ├─► Recursive: Objects and arrays                                      │
│  └─► Whitelist: Keep \n, \r, \t                                         │
│                                                                         │
│  LAYER 5: ATTACK DETECTION                                              │
│  ├─► SQL Injection patterns (10 regex)                                  │
│  ├─► Path Traversal patterns (6 regex)                                  │
│  ├─► Action: Block request + Log + 400 response                         │
│  └─► False positives: Minimal (bien tuné)                               │
│                                                                         │
│  LAYER 6: FILE SECURITY                                                 │
│  ├─► Extension Whitelist: 13 extensions autorisées                      │
│  ├─► MIME Type Verification: Extension-based + Magic numbers            │
│  ├─► Dangerous Extensions Blocked: .exe, .bat, .ps1, .js, .dll, etc.    │
│  ├─► Content Scanning: XSS patterns, eval(), base64_decode              │
│  ├─► Size Limit: 50 MB per file, 10 files max                           │
│  └─► Quota Management: Support per-user quota (non activé)              │
│                                                                         │
│  LAYER 7: LOGGING & MONITORING                                          │
│  ├─► Winston Logging: All operations logged                             │
│  ├─► Rotation: Daily (14-30 days retention)                             │
│  ├─► Levels: error, warn, info, debug                                   │
│  ├─► Context: User, operation, module, timestamp                        │
│  └─► Audit Trail: Complete operation history                            │
│                                                                         │
│  LAYER 8: BACKUPS & RECOVERY                                            │
│  ├─► Automatic Backups: Every 5 minutes                                 │
│  ├─► Daily Backups: 2:00 AM                                             │
│  ├─► Retention: 25 incremental + 30 daily                               │
│  ├─► Compression: Optional GZIP                                         │
│  └─► Recovery: Manual restore from backup files                         │
│                                                                         │
│  LAYER 9: ERROR HANDLING                                                │
│  ├─► Global Error Handler: Centralized error processing                 │
│  ├─► AppError class: Structured errors with codes                       │
│  ├─► Process Handlers: uncaughtException, unhandledRejection            │
│  ├─► Stack Traces: Hidden in production                                 │
│  └─► User-friendly messages: No internal details leaked                 │
│                                                                         │
│  LAYER 10: CACHE CONTROL                                                │
│  ├─► Cache-Control: no-store (all responses)                            │
│  ├─► Pragma: no-cache                                                   │
│  ├─► Expires: 0                                                         │
│  └─► Rationale: Prevent stale data, especially après updates            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

⚠️ MISSING (Production):
├─► Authentication: NO JWT/OAuth/Sessions
├─► Authorization: NO RBAC/Permissions
├─► HTTPS: HTTP only (vulnerable MITM)
├─► Secrets Management: Credentials potentially exposed
├─► CSRF Protection: Not implemented
├─► Database Encryption: JSON in clear text
└─► Subresource Integrity (SRI): CDN libraries not verified
```

---

## Map Fichiers

### Arborescence Complète avec Tailles

```
E:\TEST 3\
│
├── 📄 package.json (2 KB)
├── 📄 package-lock.json (50 KB)
├── 📄 .env.example (1 KB)
│
├── 📁 server/ (Backend)
│   ├── 📄 server.js (8 KB) ★ POINT D'ENTRÉE
│   │
│   ├── 📁 config/
│   │   └── 📄 config.js (1 KB)
│   │
│   ├── 📁 middleware/ (3 fichiers)
│   │   ├── 📄 security.js (5 KB)
│   │   ├── 📄 errorHandler.js (3 KB)
│   │   └── 📄 validation.js (10 KB) - 70+ schemas
│   │
│   ├── 📁 routes/ (3 fichiers)
│   │   ├── 📄 files.js (4 KB)
│   │   ├── 📄 admin.js (6 KB)
│   │   └── 📄 t55-docx.js (12 KB)
│   │
│   ├── 📁 services/ (4 fichiers)
│   │   ├── 📄 dataService.js (15 KB) ★ CRITIQUE
│   │   ├── 📄 taskService.js (3 KB)
│   │   ├── 📄 avisService.js (4 KB)
│   │   └── 📄 emailService.js (3 KB)
│   │
│   ├── 📁 socket/ (3 fichiers)
│   │   ├── 📄 index.js (2 KB)
│   │   ├── 📄 taskHandler.js (2 KB)
│   │   └── 📄 dataHandler.js (5 KB)
│   │
│   ├── 📁 utils/ (4+ fichiers)
│   │   ├── 📄 logger.js (4 KB)
│   │   ├── 📄 scheduler.js (2 KB)
│   │   ├── 📄 file-security.js (6 KB)
│   │   └── 📄 socket-optimization.js (2 KB)
│   │
│   ├── 📁 data/ ★ STOCKAGE
│   │   ├── 📄 application-data.json (5-10 MB)
│   │   ├── 📁 backups/ (25 max)
│   │   │   └── 📄 application-data-YYYY-MM-DDTHH-mm-ss.json
│   │   └── 📁 backups-daily/ (30 jours)
│   │       └── 📄 application-data-YYYY-MM-DD.json
│   │
│   └── 📁 uploads/
│       ├── 📄 fichier-timestamp.pdf
│       └── 📁 t55-templates/
│           └── 📄 template-timestamp-Template.docx
│
├── 📁 client/ (Frontend)
│   ├── 📄 index.html (15 KB) ★ POINT D'ENTRÉE
│   │
│   ├── 📁 css/ (39 fichiers, ~150 KB total)
│   │   ├── 📄 main.css (2 KB) - Import centralisé
│   │   ├── 📄 base.css (5 KB)
│   │   ├── 📄 modern-theme.css (4 KB)
│   │   ├── 📄 compact-mode.css (3 KB)
│   │   ├── 📁 components/ (12 fichiers)
│   │   │   ├── 📄 header.css
│   │   │   ├── 📄 navigation.css
│   │   │   ├── 📄 tables.css
│   │   │   └── ...
│   │   └── 📁 themes/ (2 fichiers)
│   │
│   ├── 📁 js/ (183 modules, ~2.5 MB total)
│   │   ├── 📄 main.js (1 KB)
│   │   ├── 📄 app.js (80 KB) ★ 1500+ lignes
│   │   ├── 📄 socket.js (3 KB)
│   │   ├── 📄 store.js (2 KB)
│   │   ├── 📄 actions.js (2 KB)
│   │   ├── 📄 ui.js (4 KB)
│   │   ├── 📄 global-functions.js (3 KB)
│   │   │
│   │   └── 📁 modules/
│   │       ├── 📁 data/ (80+ fichiers, ~1.5 MB)
│   │       │   ├── 📄 index.js (5 KB)
│   │       │   ├── 📄 iw37n-data.js (30 KB) - 604 lignes
│   │       │   ├── 📄 psv-data.js (40 KB) - 800 lignes
│   │       │   ├── 📄 t55-devis.js (80 KB) ★ 1463 lignes
│   │       │   ├── 📄 espace-clos-data.js (45 KB) - 876 lignes
│   │       │   ├── 📄 amdec-data.js (42 KB) - 830 lignes
│   │       │   └── ... (75+ autres)
│   │       │
│   │       ├── 📁 ui/ (21 fichiers, ~500 KB)
│   │       │   ├── 📄 page-loader.js (45 KB) - 885 lignes
│   │       │   ├── 📄 devis-manager.js (130 KB) ★ 2523 lignes
│   │       │   ├── 📄 summary.js (37 KB) - 730 lignes
│   │       │   ├── 📄 summary-timeline.js (30 KB) - 592 lignes
│   │       │   └── ... (17 autres)
│   │       │
│   │       ├── 📁 charts/ (5 fichiers)
│   │       ├── 📁 entities/ (4 fichiers)
│   │       ├── 📁 demandes/ (3 fichiers)
│   │       ├── 📁 plans/ (3 fichiers)
│   │       ├── 📁 psv/ (2 fichiers)
│   │       ├── 📁 sync/ (3 fichiers)
│   │       ├── 📁 import-export/ (3 fichiers)
│   │       ├── 📁 backup/ (2 fichiers)
│   │       ├── 📁 assistant/ (1 fichier)
│   │       ├── 📄 theme.js
│   │       ├── 📄 utils.js
│   │       └── 📄 init.js
│   │
│   ├── 📁 components/
│   │   ├── 📁 layout/ (4 fichiers HTML)
│   │   └── 📁 pages/ (139 fichiers HTML, ~600 KB)
│   │
│   ├── 📁 admin/
│   ├── 📁 maintenance/
│   └── 📁 pages/
│
├── 📁 docs/
│   └── 📁 audit/ ★ VOUS ÊTES ICI!
│       ├── 📄 INDEX.md (20 KB)
│       ├── 📄 01-Vue-Generale.md (45 KB)
│       ├── 📄 02-Technologies-Stack.md (60 KB)
│       ├── 📄 03-Architecture-Backend.md (75 KB)
│       ├── 📄 04-Architecture-Frontend.md (55 KB)
│       ├── 📄 05-Modules-Fonctionnalites.md (50 KB)
│       ├── 📄 06-Securite-Performance.md (65 KB)
│       └── 📄 MAP.md (100 KB) ★ CE FICHIER
│
├── 📁 logs/
│   ├── 📄 combined-2025-11-23.log
│   ├── 📄 error-2025-11-23.log
│   ├── 📄 exceptions-2025-11-23.log
│   └── 📄 rejections-2025-11-23.log
│
├── 📁 generated-docs/
│   ├── 📄 Avis - Entrepreneur - 23-11-2025.docx
│   └── 📄 Devis - ACME Corp - Électricité - 23-11-2025.docx
│
├── 📁 scripts/ (15+ fichiers)
│   ├── 📄 *.js (Node.js)
│   ├── 📄 *.py (Python)
│   └── 📄 *.bat (Windows Batch)
│
├── 📁 assets/
│   ├── 📁 images/
│   └── 📁 diagrams/
│
└── 📁 node_modules/ (~50 MB)
    └── ... (11 packages + dependencies)
```

### Tailles Totales par Catégorie

| Catégorie | Nombre Fichiers | Taille Totale | % du Projet |
|-----------|-----------------|---------------|-------------|
| **node_modules** | ~1000 | ~50 MB | 50% |
| **client/js** | 183 | ~2.5 MB | 2.5% |
| **client/css** | 39 | ~150 KB | 0.15% |
| **client/components** | 143 | ~600 KB | 0.6% |
| **server** | ~30 | ~100 KB | 0.1% |
| **data (application-data.json)** | 1 | 5-10 MB | 10% |
| **data/backups** | ~55 | ~300 MB | 30% |
| **logs** | ~30 | ~50 MB | 5% |
| **docs/audit** | 8 | ~500 KB | 0.5% |
| **TOTAL** | ~1,500 | **~400 MB** | 100% |

**Note:** Taille variable selon nombre de backups et logs accumulés.

---

## Index des Fonctionnalités

### Par Module de Données

| Fonctionnalité | Module(s) | Emplacement Fichier | Lignes |
|----------------|-----------|---------------------|--------|
| **Ordres Maintenance SAP** | iw37n-data.js | client/js/modules/data/ | 604 |
| **Devis Entrepreneurs** | t55-devis.js | client/js/modules/data/ | 1463 |
| **Pressure Safety Valves** | psv-data.js | client/js/modules/data/ | 800 |
| **Espaces Confinés** | espace-clos-data.js | client/js/modules/data/ | 876 |
| **Analyse AMDEC** | amdec-data.js | client/js/modules/data/ | 830 |
| **Suivi Coûts** | t72-suivi-cout.js | client/js/modules/data/ | 756 |
| **Plans Levage** | plan-levage-data.js | client/js/modules/data/ | 644 |
| **Avis Syndicaux** | avis-data.js, t25-avis-data.js | client/js/modules/data/ | 616 |
| **Zones Arrêt** | t63-zones.js | client/js/modules/data/ | 498 |
| **Soumissions** | t51-soumissions.js | client/js/modules/data/ | 575 |
| **Long Délai** | t88-long-delai.js | client/js/modules/data/ | 518 |
| **Points Presse** | point-presse-data.js | client/js/modules/data/ | 418+ |
| **Entrepreneurs** | t40-entrepreneurs-data.js | client/js/modules/data/ | 210 |

### Par Module UI

| Fonctionnalité | Module | Emplacement Fichier | Lignes |
|----------------|--------|---------------------|--------|
| **Gestion Devis Complète** | devis-manager.js | client/js/modules/ui/ | 2523 |
| **Chargement Pages Dynamique** | page-loader.js | client/js/modules/ui/ | 885 |
| **Tableau Préparation** | summary.js | client/js/modules/ui/ | 730 |
| **Timeline Préparation** | summary-timeline.js | client/js/modules/ui/ | 592 |
| **Upload Drag & Drop** | drag-drop.js | client/js/modules/ui/ | 599 |
| **Vue Kanban** | kanban.js | client/js/modules/ui/ | 506 |
| **Calendrier** | calendar.js | client/js/modules/ui/ | 472 |

### Par Service Backend

| Fonctionnalité | Service | Emplacement Fichier | Rôle |
|----------------|---------|---------------------|------|
| **Persistance Données** | dataService.js | server/services/ | 80+ modules, backups auto |
| **Gestion Tâches** | taskService.js | server/services/ | CRUD tâches (in-memory) |
| **Génération Avis** | avisService.js | server/services/ | DOCX avis syndicaux |
| **Envoi Emails** | emailService.js | server/services/ | Outlook COM automation |

### Par Route API

| Endpoint | Route Fichier | Fonctionnalité |
|----------|---------------|----------------|
| POST /api/files/upload | files.js | Upload multi-fichiers (10 max, 50MB) |
| GET /api/admin/stats | admin.js | Statistiques serveur (uptime, RAM, CPU) |
| GET /api/admin/health | admin.js | Health checks (4 vérifications) |
| POST /api/t55/generate-docx | t55-docx.js | Génération devis DOCX depuis template |

---

## Conclusion de la MAP

Cette cartographie complète vous permet de:

✅ **Naviguer rapidement** dans l'application (370 fichiers)
✅ **Comprendre l'architecture** (backend + frontend)
✅ **Identifier les dépendances** entre modules
✅ **Localiser fonctionnalités** précises
✅ **Visualiser flux de données** complets
✅ **Auditer sécurité** par couches
✅ **Optimiser performance** (goulots identifiés)

### Utilisation Recommandée

1. **Développeurs nouveaux:** Commencer par "Vue d'Ensemble Globale"
2. **Debug spécifique:** Utiliser "Map Flux de Données"
3. **Ajout fonctionnalité:** Consulter "Map Modules de Données"
4. **Audit sécurité:** Référer "Map Sécurité"
5. **Optimisation:** Analyser "Map Fichiers" (tailles)

### Mise à Jour

**Fréquence:** À chaque changement architectural majeur
**Responsable:** Lead Developer / Architect
**Format:** Markdown (facilite diffs Git)

---

**Version de la MAP:** 1.0
**Dernière mise à jour:** 2025-11-23
**Couverture:** 100% de l'application

**Retour Index:** [INDEX.md](./INDEX.md)


## 9️⃣ ARBORESCENCE COMPLÈTE DES FICHIERS

### Structure Complète avec Tailles

```
E:\TEST 3/
├── 📄 start.bat (2.89 KB)
├── 📄 .env.example (6.41 KB)
├── 📄 dev.bat (898 B)
├── 📋 package-lock.json (63.53 KB)
├── 📁 data-sources/
│   ├── 📄 IW37N.xlsx (333.52 KB)
│   ├── 📄 IW28.xlsx (11.08 KB)
│   ├── 📄 Calendrier.xlsx (75.33 KB)
│   ├── 📄 Avis.xlsx (11.16 KB)
│   ├── 📄 Gabarit_Jour 1_Points de presse journaliers.xlsx (918.82 KB)
│   ├── 📄 Séquence nettoyage et verrouillage KOBM - 1.xlsx (18.74 KB)
│   ├── 📄 PIECES AA26.XLSX (116.57 KB)
│   ├── 📄 MS Project KXUK-25A_001.mpp (508 KB)
│   └── 📝 README.md (829 B)
├── 📁 assets/
│   ├── 📁 diagrams/
│   │   ├── 📄 Process 2.png (375.86 KB)
│   │   ├── 📄 Processus.png (450.92 KB)
│   │   ├── 📄 Exact-V2.png (116.69 KB)
│   │   └── 📄 html-Perfect.png (195.38 KB)
│   ├── 📁 screenshots/
│   ├── 📁 process-pages/
│   │   ├── 🌐 process-2.html (23.09 KB)
│   │   └── 🌐 process-2-detailed.html (33.64 KB)
│   └── 📁 images/
│       ├── 📄 pont.png (33.11 KB)
│       ├── 📄 tableau.png (84.76 KB)
│       └── 📄 tableaudevis.png (35.21 KB)
├── 📁 docs/
│   └── 📁 audit/
│       ├── 📝 01-Vue-Generale.md (29.34 KB)
│       ├── 📝 02-Technologies-Stack.md (28.35 KB)
│       ├── 📝 03-Architecture-Backend.md (31.37 KB)
│       ├── 📝 04-Architecture-Frontend.md (25.13 KB)
│       ├── 📝 05-Modules-Fonctionnalites.md (16.72 KB)
│       ├── 📝 06-Securite-Performance.md (22.18 KB)
│       ├── 📝 INDEX.md (13.88 KB)
│       ├── 📝 MAP.md (116.11 KB)
│       └── 📝 WORKFLOW-GUIDE.md (31.54 KB)
├── 📁 scripts/
│   ├── 📄 diagnosticmetrics.ps1 (3.21 KB)
│   ├── 📄 audit-phase1-architecture.ps1 (10.53 KB)
│   ├── 📄 audit-phase2-qualite-code.ps1 (13.11 KB)
│   ├── 📄 audit-complete.cjs (27.54 KB)
│   ├── 📄 analyze-cleanup.cjs (5.55 KB)
│   ├── 📁 python/
│   │   ├── 📄 apply-json-changes.py (1.43 KB)
│   │   ├── 📄 create-t88-module.py (1.22 KB)
│   │   ├── 📄 fix-now.py (675 B)
│   │   ├── 📄 update-t30.py (978 B)
│   │   ├── 📄 verify-changes.py (1.39 KB)
│   │   ├── 📄 extract-pages.py (4.21 KB)
│   │   └── 📄 remove-pages-from-index.py (4.83 KB)
│   ├── 📁 js/
│   │   ├── 📜 fix-data-structure.js (5.76 KB)
│   │   ├── 📄 check-data.cjs (1.41 KB)
│   │   └── 📜 generate-controllers.js (8.78 KB)
│   └── 📁 batch/
│       └── 📄 apply-all-changes.bat (1.79 KB)
├── 📁 .claude/
│   └── 📋 settings.local.json (3.32 KB)
├── 📁 client/
│   ├── 📄 ARBORESCENCE-PAGES.txt (8.59 KB)
│   ├── 📝 README.md (16.19 KB)
│   ├── 📄 index.html.backup-20251115 (242.13 KB)
│   ├── 📝 ARCHITECTURE.md (7.5 KB)
│   ├── 🌐 health.html (12.67 KB)
│   ├── 🌐 index-refactored.html (15.69 KB)
│   ├── 🌐 index-optimized.html (3.62 KB)
│   ├── 🌐 index-old-preoptimize.html (242.13 KB)
│   ├── 🌐 test-assistant.html (1.96 KB)
│   ├── 📁 admin/
│   │   ├── 🌐 monitoring.html (21.78 KB)
│   │   └── 🌐 logs.html (17.86 KB)
│   ├── 📁 components/
│   │   ├── 📁 pages/
│   │   │   ├── 🌐 avis.html (9.7 KB)
│   │   │   ├── 🌐 timeline.html (2.08 KB)
│   │   │   ├── 🌐 contacts.html (5.58 KB)
│   │   │   ├── 🌐 demandes-echafaudages.html (5.78 KB)
│   │   │   ├── 🌐 demandes-execution.html (5.31 KB)
│   │   │   ├── 🌐 demandes-grues-nacelles.html (5.65 KB)
│   │   │   ├── 🌐 demandes-verrouillage.html (5.57 KB)
│   │   │   ├── 🌐 detail-arret-electrique.html (4.29 KB)
│   │   │   ├── 🌐 detail-branchement-roulottes.html (4.35 KB)
│   │   │   ├── 🌐 detail-capacite-magasin.html (4.32 KB)
│   │   │   ├── 🌐 detail-chemin-critique.html (4.26 KB)
│   │   │   ├── 🌐 detail-cognibox.html (4.21 KB)
│   │   │   ├── 🌐 detail-echeanciers-projets.html (4.34 KB)
│   │   │   ├── 🌐 detail-emplacement-poches.html (4.33 KB)
│   │   │   ├── 🌐 detail-equipe.html (3.33 KB)
│   │   │   ├── 🌐 detail-zones-entreposage.html (5.06 KB)
│   │   │   ├── 🌐 detail-amdec.html (20.06 KB)
│   │   │   ├── 🌐 detail-t109.html (7.02 KB)
│   │   │   ├── 🌐 detail-grosses-pieces.html (4.27 KB)
│   │   │   ├── 🌐 detail-ingq.html (3.2 KB)
│   │   │   ├── 🌐 detail-lots-magasin.html (4.24 KB)
│   │   │   ├── 🌐 detail-oscillateurs.html (4.27 KB)
│   │   │   ├── 🌐 detail-permis-feu.html (4.24 KB)
│   │   │   ├── 🌐 detail-t72.html (11.01 KB)
│   │   │   ├── 🌐 detail-protocole-arret.html (4.29 KB)
│   │   │   ├── 🌐 detail-equipements-hauteur.html (5.79 KB)
│   │   │   ├── 🌐 detail-revue-securite.html (4.25 KB)
│   │   │   ├── 🌐 detail-t50.html (9.51 KB)
│   │   │   ├── 🌐 detail-avis-syndicaux.html (29.59 KB)
│   │   │   ├── 🌐 detail-t100.html (2.4 KB)
│   │   │   ├── 🌐 detail-t87.html (23.32 KB)
│   │   │   ├── 🌐 detail-t20-t21.html (14.74 KB)
│   │   │   ├── 🌐 detail-t110.html (4.21 KB)
│   │   │   ├── 🌐 detail-t116.html (4.8 KB)
│   │   │   ├── 🌐 detail-t24.html (3.98 KB)
│   │   │   ├── 🌐 detail-t125.html (5.69 KB)
│   │   │   ├── 🌐 detail-t128.html (1.19 KB)
│   │   │   ├── 🌐 detail-t25.html (25.55 KB)
│   │   │   ├── 🌐 detail-t131.html (1.07 KB)
│   │   │   ├── 🌐 detail-t132.html (1.11 KB)
│   │   │   ├── 🌐 detail-t136.html (1.11 KB)
│   │   │   ├── 🌐 detail-t139.html (1.1 KB)
│   │   │   ├── 🌐 detail-t29.html (3.63 KB)
│   │   │   ├── 🌐 detail-t71.html (4.98 KB)
│   │   │   ├── 🌐 detail-t36.html (5.04 KB)
│   │   │   ├── 🌐 detail-t19.html (7.97 KB)
│   │   │   ├── 🌐 detail-t21.html (3.63 KB)
│   │   │   ├── 🌐 detail-t22.html (3.72 KB)
│   │   │   ├── 🌐 detail-t23.html (3.37 KB)
│   │   │   ├── 🌐 detail-livraison-lots.html (15.7 KB)
│   │   │   ├── 🌐 detail-t144.html (5.15 KB)
│   │   │   ├── 🌐 detail-t83.html (6.43 KB)
│   │   │   ├── 🌐 detail-t27.html (3.32 KB)
│   │   │   ├── 🌐 detail-t3.html (9.82 KB)
│   │   │   ├── 🌐 detail-soumissions.html (4.37 KB)
│   │   │   ├── 🌐 detail-t31.html (3.21 KB)
│   │   │   ├── 🌐 detail-t32.html (815 B)
│   │   │   ├── 🌐 detail-suivi-cout.html (1.97 KB)
│   │   │   ├── 🌐 detail-t37.html (3.33 KB)
│   │   │   ├── 🌐 detail-t4.html (4.31 KB)
│   │   │   ├── 🌐 detail-t4-t9-combined.html (7.33 KB)
│   │   │   ├── 🌐 detail-t33.html (3.87 KB)
│   │   │   ├── 🌐 detail-t43.html (4.33 KB)
│   │   │   ├── 🌐 detail-plan-levage.html (4.85 KB)
│   │   │   ├── 🌐 detail-t40.html (3.83 KB)
│   │   │   ├── 🌐 detail-t5.html (3.73 KB)
│   │   │   ├── 🌐 detail-t30.html (6.74 KB)
│   │   │   ├── 🌐 detail-t51.html (5.37 KB)
│   │   │   ├── 🌐 detail-t55-historique.html (7.28 KB)
│   │   │   ├── 🌐 detail-t70.html (6.86 KB)
│   │   │   ├── 🌐 detail-t62.html (1.08 KB)
│   │   │   ├── 🌐 detail-t82.html (4.16 KB)
│   │   │   ├── 🌐 detail-t64.html (6.38 KB)
│   │   │   ├── 🌐 detail-t65.html (4.87 KB)
│   │   │   ├── 🌐 detail-t66.html (1.08 KB)
│   │   │   ├── 🌐 detail-t67.html (1.07 KB)
│   │   │   ├── 🌐 bilan-reunions.html (5.13 KB)
│   │   │   ├── 🌐 detail-t69.html (1.09 KB)
│   │   │   ├── 🌐 detail-t7.html (7.57 KB)
│   │   │   ├── 🌐 detail-t60.html (4.53 KB)
│   │   │   ├── 🌐 detail-t73.html (4.12 KB)
│   │   │   ├── 🌐 detail-t75.html (8.97 KB)
│   │   │   ├── 🌐 detail-t78.html (4.29 KB)
│   │   │   ├── 🌐 detail-t79.html (11.88 KB)
│   │   │   ├── 🌐 detail-t8.html (7.35 KB)
│   │   │   ├── 🌐 detail-t45.html (7.13 KB)
│   │   │   ├── 🌐 detail-t111.html (4.87 KB)
│   │   │   ├── 🌐 demo-styles-tableaux.html (21.13 KB)
│   │   │   ├── 🌐 detail-t9.html (4.66 KB)
│   │   │   ├── 🌐 detail-t90.html (2.33 KB)
│   │   │   ├── 🌐 detail-t91.html (5.97 KB)
│   │   │   ├── 🌐 detail-t93.html (1.09 KB)
│   │   │   ├── 🌐 detail-t94.html (1.13 KB)
│   │   │   ├── 🌐 detail-t95.html (8.79 KB)
│   │   │   ├── 🌐 detail-t98.html (4.6 KB)
│   │   │   ├── 🌐 detail-t99.html (1.12 KB)
│   │   │   ├── 🌐 detail-tours-refroidissement.html (4.37 KB)
│   │   │   ├── 🌐 detail-travaux-entrepreneur.html (4.09 KB)
│   │   │   ├── 🌐 detail-visite-soumissionnaires.html (4.38 KB)
│   │   │   ├── 🌐 detail-suivi-pieces-delai.html (13.32 KB)
│   │   │   ├── 🌐 execution.html (7.24 KB)
│   │   │   ├── 🌐 historique.html (3.53 KB)
│   │   │   ├── 🌐 iw38.html (188 B)
│   │   │   ├── 🌐 parametres.html (8.26 KB)
│   │   │   ├── 🌐 plan-suivis-journaliers.html (28.31 KB)
│   │   │   ├── 🌐 point-presse-form.html (17.88 KB)
│   │   │   ├── 🌐 point-presse-journaliers.html (1.96 KB)
│   │   │   ├── 🌐 post_mortem.html (5.83 KB)
│   │   │   ├── 🌐 psv_caracteristiques.html (2.67 KB)
│   │   │   ├── 🌐 detail-t58.html (11.82 KB)
│   │   │   ├── 🌐 detail-rencontres-hebdo.html (9.63 KB)
│   │   │   ├── 🌐 detail-t63.html (8.73 KB)
│   │   │   ├── 📋 _pages-mapping.json (3.56 KB)
│   │   │   ├── 🌐 detail-t10.html (9.86 KB)
│   │   │   ├── 🌐 detail-devis.html (7.43 KB)
│   │   │   ├── 🌐 detail-t11.html (9.17 KB)
│   │   │   ├── 🌐 detail-t12.html (7.11 KB)
│   │   │   ├── 🌐 detail-t13.html (7.11 KB)
│   │   │   ├── 🌐 detail-t14.html (33.43 KB)
│   │   │   ├── 🌐 detail-t15.html (6.12 KB)
│   │   │   ├── 🌐 detail-t16.html (6.13 KB)
│   │   │   ├── 🌐 detail-t17.html (6.11 KB)
│   │   │   ├── 🌐 detail-t18.html (6.1 KB)
│   │   │   ├── 🌐 pieces.html (11.32 KB)
│   │   │   ├── 🌐 detail-t26.html (32.75 KB)
│   │   │   ├── 🌐 iw37n.html (7.71 KB)
│   │   │   ├── 🌐 detail-t55.html (23.5 KB)
│   │   │   ├── 🌐 detail-approvisionnement.html (4.54 KB)
│   │   │   ├── 🌐 detail-t41.html (5.48 KB)
│   │   │   ├── 🌐 detail-t56.html (2.97 KB)
│   │   │   ├── 🌐 detail-t57.html (7.82 KB)
│   │   │   ├── 🌐 detail-espace-clos.html (4.96 KB)
│   │   │   ├── 🌐 detail-besoins-echafaud.html (4.84 KB)
│   │   │   ├── 🌐 detail-equipements-location.html (9.58 KB)
│   │   │   ├── 🌐 summary.html (18.55 KB)
│   │   │   ├── 🌐 detail-besoin-electriques.html (3.27 KB)
│   │   │   ├── 🌐 detail-t68.html (6 KB)
│   │   │   ├── 🌐 detail-purges-gaz.html (9.08 KB)
│   │   │   ├── 🌐 detail-consommables.html (5.63 KB)
│   │   │   └── 🌐 dashboard.html (10.18 KB)
│   │   └── 📁 layout/
│   │       ├── 🌐 app-loader.html (301 B)
│   │       ├── 🌐 app-navigation.html (621 B)
│   │       ├── 🌐 assistant-widget.html (9.38 KB)
│   │       ├── 🌐 app-header.html (2.02 KB)
│   │       └── 🌐 app-modals.html (4.25 KB)
│   ├── 📁 css/
│   │   ├── 🎨 modern-theme.css (8.45 KB)
│   │   ├── 🎨 compact-mode.css (6.3 KB)
│   │   ├── 🎨 main.css (1.04 KB)
│   │   ├── 🎨 assistant-briefing.css (11.19 KB)
│   │   ├── 🎨 assistant-widget.css (12.16 KB)
│   │   ├── 📁 components/
│   │   │   ├── 🎨 charts.css (653 B)
│   │   │   ├── 🎨 modals.css (6.07 KB)
│   │   │   ├── 🎨 stats.css (1004 B)
│   │   │   ├── 🎨 forms.css (1.67 KB)
│   │   │   ├── 🎨 loader.css (1.98 KB)
│   │   │   ├── 🎨 tables.css (10.36 KB)
│   │   │   ├── 🎨 header.css (1.61 KB)
│   │   │   ├── 🎨 buttons.css (5.89 KB)
│   │   │   ├── 🎨 navigation.css (1.56 KB)
│   │   │   ├── 🎨 cards.css (7.28 KB)
│   │   │   ├── 🎨 timeline.css (8.71 KB)
│   │   │   └── 🎨 kanban.css (3.84 KB)
│   │   ├── 📁 themes/
│   │   │   └── 🎨 modern-industrial.css (15.79 KB)
│   │   ├── 📁 dist/
│   │   │   ├── 🎨 base.min.css (1.89 KB)
│   │   │   ├── 🎨 modern-theme.min.css (6.29 KB)
│   │   │   ├── 🎨 compact-mode.min.css (3.26 KB)
│   │   │   ├── 🎨 main.min.css (504 B)
│   │   │   ├── 🎨 assistant-briefing.min.css (7.56 KB)
│   │   │   ├── 🎨 assistant-widget.min.css (8.2 KB)
│   │   │   ├── 🎨 charts.min.css (386 B)
│   │   │   ├── 🎨 header.min.css (819 B)
│   │   │   ├── 🎨 kanban.min.css (2.88 KB)
│   │   │   ├── 🎨 modals.min.css (4.36 KB)
│   │   │   ├── 🎨 stats.min.css (658 B)
│   │   │   ├── 🎨 navigation.min.css (588 B)
│   │   │   ├── 🎨 timeline.min.css (6.26 KB)
│   │   │   ├── 🎨 buttons.min.css (2.93 KB)
│   │   │   ├── 🎨 cards.min.css (3.07 KB)
│   │   │   ├── 🎨 forms.min.css (1005 B)
│   │   │   ├── 🎨 loader.min.css (839 B)
│   │   │   ├── 🎨 tables.min.css (4.15 KB)
│   │   │   └── 🎨 modern-industrial.min.css (12.6 KB)
│   │   ├── 🎨 professional-enhancements.css (11.65 KB)
│   │   └── 🎨 base.css (3.6 KB)
│   ├── 📁 js/
│   │   ├── 📜 actions.js (1.55 KB)
│   │   ├── 📜 app.js (10.54 KB)
│   │   ├── 📜 socket.js (2.97 KB)
│   │   ├── 📜 main.js (1.24 KB)
│   │   ├── 📜 store.js (1.8 KB)
│   │   ├── 📜 ui.js (4.62 KB)
│   │   ├── 📁 modules/
│   │   │   ├── 📜 index.js (2.7 KB)
│   │   │   ├── 📜 theme.js (2.81 KB)
│   │   │   ├── 📜 utils.js (9.22 KB)
│   │   │   ├── 📜 init.js (14.12 KB)
│   │   │   ├── 📁 pages/
│   │   │   │   ├── 📜 detail-t22-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t24-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t27-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t29-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t30-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t60-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-suivi-pieces-delai-controller.js (5.99 KB)
│   │   │   │   ├── 📜 detail-t43-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t50-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t51-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t57-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t58-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t62-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t63-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t64-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t65-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t66-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t67-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t68-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t69-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t70-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t71-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t72-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t75-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t90-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t91-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t94-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t95-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t99-controller.js (5.64 KB)
│   │   │   │   ├── 📜 detail-t100-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t109-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t110-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t128-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t131-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t132-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t136-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t139-controller.js (5.66 KB)
│   │   │   │   ├── 📜 detail-t55-historique-controller.js (6.4 KB)
│   │   │   │   ├── 📜 contacts-controller.js (5.59 KB)
│   │   │   │   ├── 📜 detail-t4-t9-combined-controller.js (1.88 KB)
│   │   │   │   ├── 📜 detail-t45-controller.js (1.44 KB)
│   │   │   │   ├── 📜 detail-t33-controller.js (1.4 KB)
│   │   │   │   ├── 📜 detail-t56-controller.js (5.48 KB)
│   │   │   │   ├── 📜 detail-t79-controller.js (5.64 KB)
│   │   │   │   └── 📜 detail-t93-controller.js (5.64 KB)
│   │   │   ├── 📁 utils/
│   │   │   │   ├── 📜 error-handler.js (9.73 KB)
│   │   │   │   ├── 📜 validation.js (10.12 KB)
│   │   │   │   ├── 📜 version.js (1.89 KB)
│   │   │   │   └── 📜 performance.js (12.47 KB)
│   │   │   ├── 📁 charts/
│   │   │   │   ├── 📜 charts.js (9.79 KB)
│   │   │   │   ├── 📜 index.js (766 B)
│   │   │   │   ├── 📜 dashboard-charts.js (54.36 KB)
│   │   │   │   └── 📜 chart-optimization.js (9.86 KB)
│   │   │   ├── 📁 data/
│   │   │   │   ├── 📜 approvisionnement-data.js (9.62 KB)
│   │   │   │   ├── 📜 arret-data.js (10.99 KB)
│   │   │   │   ├── 📜 avis-data.js (20.68 KB)
│   │   │   │   ├── 📜 consommables-data.js (7.01 KB)
│   │   │   │   ├── 📜 vpo.js (9.29 KB)
│   │   │   │   ├── 📜 pieces-data.js (10.6 KB)
│   │   │   │   ├── 📜 amenagement-data.js (9.18 KB)
│   │   │   │   ├── 📜 psv-data.js (26.35 KB)
│   │   │   │   ├── 📜 tpaa-data.js (19.57 KB)
│   │   │   │   ├── 📜 plans-entretien.js (15.47 KB)
│   │   │   │   ├── 📜 t60-long-delai.js (14.73 KB)
│   │   │   │   ├── 📜 settings.js (37.94 KB)
│   │   │   │   ├── 📜 t72-suivi-cout.js (19.46 KB)
│   │   │   │   ├── 📜 pw-data.js (12.98 KB)
│   │   │   │   ├── 📜 rencontre-data.js (2.73 KB)
│   │   │   │   ├── 📜 ressources-planification.js (12.78 KB)
│   │   │   │   ├── 📜 revision-travaux-data.js (22.2 KB)
│   │   │   │   ├── 📜 stats.js (13.66 KB)
│   │   │   │   ├── 📜 ingq-data.js (13.39 KB)
│   │   │   │   ├── 📜 task-manager.js (9 KB)
│   │   │   │   ├── 📜 t40-entrepreneurs-data.js (10 KB)
│   │   │   │   ├── 📜 amdec-data.js (30.92 KB)
│   │   │   │   ├── 📜 contacts-manager.js (10.22 KB)
│   │   │   │   ├── 📜 chemin-critique.js (13.19 KB)
│   │   │   │   ├── 📜 entrepreneur-data.js (8.78 KB)
│   │   │   │   ├── 📜 generic-meeting-manager.js (16.52 KB)
│   │   │   │   ├── 📜 t88-long-delai.js (17.94 KB)
│   │   │   │   ├── 📜 iw37n-data.js (18.93 KB)
│   │   │   │   ├── 📜 cognibox-tasks.js (7.14 KB)
│   │   │   │   ├── 📜 equipement-levage-data.js (18.52 KB)
│   │   │   │   ├── 📜 t33-priorisation-data.js (10.94 KB)
│   │   │   │   ├── 📜 order-metadata.js (14.65 KB)
│   │   │   │   ├── 📜 tours-refroidissement-data.js (23.08 KB)
│   │   │   │   ├── 📜 t78-meeting.js (1.97 KB)
│   │   │   │   ├── 📜 t94-meeting.js (1.75 KB)
│   │   │   │   ├── 📜 t116-meeting.js (1.8 KB)
│   │   │   │   ├── 📜 t144-meeting.js (1.79 KB)
│   │   │   │   ├── 📜 iw38-data.js (7.58 KB)
│   │   │   │   ├── 📜 t57-equipements-hauteur.js (15.47 KB)
│   │   │   │   ├── 📜 t63-zones.js (17.04 KB)
│   │   │   │   ├── 📜 protocole-arret-data.js (16.78 KB)
│   │   │   │   ├── 📜 rencontres-hebdo-data.js (34.13 KB)
│   │   │   │   ├── 📜 suivi-cout-data.js (30.33 KB)
│   │   │   │   ├── 📜 t55-historique.js (33.27 KB)
│   │   │   │   ├── 📜 smed-manager.js (24.95 KB)
│   │   │   │   ├── 📜 t51-soumissions.js (21.65 KB)
│   │   │   │   ├── 📜 t30-long-delai.js (19.36 KB)
│   │   │   │   ├── 📜 maintenances-capitalisables-data.js (15.91 KB)
│   │   │   │   ├── 📜 projets-data.js (13.65 KB)
│   │   │   │   ├── 📜 tpaa-pw-data.js (64.69 KB)
│   │   │   │   ├── 📜 point-presse-data.js (18.02 KB)
│   │   │   │   ├── 📜 espace-clos-data.js (32.64 KB)
│   │   │   │   ├── 📜 plan-levage-data.js (21.82 KB)
│   │   │   │   ├── 📜 zones-plan-editor.js (25.98 KB)
│   │   │   │   ├── 📜 protocole-gantt.js (42.38 KB)
│   │   │   │   ├── 📄 t55-devis.js.backup-20251120-200215 (61.53 KB)
│   │   │   │   ├── 📜 t55-devis.js (66.22 KB)
│   │   │   │   ├── 📜 strategie-data.js (17.74 KB)
│   │   │   │   ├── 📜 inspection-levage-data.js (13.76 KB)
│   │   │   │   ├── 📜 travail-hauteur-data.js (17.46 KB)
│   │   │   │   ├── 📜 nacelles-data.js (11.17 KB)
│   │   │   │   ├── 📜 data-pages.js (41.21 KB)
│   │   │   │   ├── 📜 besoin-electriques-data.js (9.5 KB)
│   │   │   │   ├── 📜 index.js (8 KB)
│   │   │   │   ├── 📜 zones-entreposage-editor.js (15.27 KB)
│   │   │   │   ├── 📜 besoins-nettoyage-data.js (10.49 KB)
│   │   │   │   ├── 📜 equip-location-data.js (34.63 KB)
│   │   │   │   ├── 📜 consommables-commande-data.js (15.84 KB)
│   │   │   │   └── 📜 purges-gaz-data.js (11.76 KB)
│   │   │   ├── 📁 demandes/
│   │   │   │   ├── 📜 echafaudages.js (5.35 KB)
│   │   │   │   ├── 📜 grues-nacelles.js (12.67 KB)
│   │   │   │   ├── 📜 index.js (3.71 KB)
│   │   │   │   └── 📜 verrouillage.js (12.19 KB)
│   │   │   ├── 📁 entities/
│   │   │   │   ├── 📜 entrepreneurs.js (6.3 KB)
│   │   │   │   ├── 📜 index.js (1.93 KB)
│   │   │   │   ├── 📜 ingq.js (9.6 KB)
│   │   │   │   └── 📜 team.js (12.24 KB)
│   │   │   ├── 📁 export/
│   │   │   │   ├── 📜 timeline-pdf-export.js (23.43 KB)
│   │   │   │   ├── 📜 pdf-export.js (12.82 KB)
│   │   │   │   └── 📜 preparation-pdf-export.js (22.47 KB)
│   │   │   ├── 📁 forms/
│   │   │   │   └── 📜 index.js (437 B)
│   │   │   ├── 📁 import-export/
│   │   │   │   ├── 📜 excel-export.js (8.64 KB)
│   │   │   │   ├── 📜 excel-import.js (9 KB)
│   │   │   │   └── 📜 index.js (743 B)
│   │   │   ├── 📁 modals/
│   │   │   │   └── 📜 index.js (10.51 KB)
│   │   │   ├── 📁 plans/
│   │   │   │   ├── 📜 index.js (607 B)
│   │   │   │   ├── 📜 plan-renderer.js (9.18 KB)
│   │   │   │   └── 📜 plan-suivis-journaliers.js (117.7 KB)
│   │   │   ├── 📁 psv/
│   │   │   │   └── 📜 psv-plan-markers.js (13.47 KB)
│   │   │   ├── 📁 scope/
│   │   │   │   ├── 📜 scope-markers.js (20.48 KB)
│   │   │   │   └── 📜 index.js (31.52 KB)
│   │   │   ├── 📁 sync/
│   │   │   │   ├── 📜 auto-refresh.js (15.81 KB)
│   │   │   │   ├── 📜 upload-service.js (5.23 KB)
│   │   │   │   ├── 📜 socket-resilience.js (10.47 KB)
│   │   │   │   ├── 📜 server-sync.js (35.81 KB)
│   │   │   │   └── 📜 storage-wrapper.js (11.09 KB)
│   │   │   ├── 📁 tables/
│   │   │   │   └── 📜 index.js (428 B)
│   │   │   ├── 📁 ui/
│   │   │   │   ├── 📜 add-reunion-custom.js (3.7 KB)
│   │   │   │   ├── 📜 summary-timeline.js (26.87 KB)
│   │   │   │   ├── 📜 calendar.js (15.09 KB)
│   │   │   │   ├── 📜 dashboard-actions.js (14.36 KB)
│   │   │   │   ├── 📜 kanban.js (16.32 KB)
│   │   │   │   ├── 📜 index.js (6.6 KB)
│   │   │   │   ├── 📜 dashboard-modals.js (1.08 KB)
│   │   │   │   ├── 📜 order-metadata-ui.js (17.53 KB)
│   │   │   │   ├── 📜 dashboard-filters.js (10.67 KB)
│   │   │   │   ├── 📜 pieces-page.js (5.29 KB)
│   │   │   │   ├── 📜 point-presse-ui.js (15.76 KB)
│   │   │   │   ├── 📜 timeline.js (6.71 KB)
│   │   │   │   ├── 📜 devis-manager.js (118.41 KB)
│   │   │   │   ├── 📄 page-loader.js.backup-20251115 (30.82 KB)
│   │   │   │   ├── 📜 drag-drop.js (17.75 KB)
│   │   │   │   ├── 📜 responsable-modal.js (8.42 KB)
│   │   │   │   ├── 📜 bilan-reunions.js (14.87 KB)
│   │   │   │   ├── 📜 summary.js (46.42 KB)
│   │   │   │   ├── 📜 page-loader.js (36.92 KB)
│   │   │   │   └── 📜 notification.js (1.7 KB)
│   │   │   ├── 📁 assistant/
│   │   │   │   ├── 📜 data-analyzer.js (26.3 KB)
│   │   │   │   ├── 📜 virtual-assistant.js (49.87 KB)
│   │   │   │   ├── 📜 background-worker.js (11.82 KB)
│   │   │   │   ├── 📜 ai-engine.js (19.63 KB)
│   │   │   │   ├── 📜 daily-briefing.js (19 KB)
│   │   │   │   ├── 📜 text-assistant.js (17.69 KB)
│   │   │   │   ├── 📜 interactive-assistant.js (20.01 KB)
│   │   │   │   ├── 📜 chat-assistant.js (14.36 KB)
│   │   │   │   └── 📜 document-generator.js (39.53 KB)
│   │   │   └── 📜 navigation.js (33.32 KB)
│   │   ├── 📜 global-functions.js (113.24 KB)
│   │   ├── 📜 lib-loader.js (8.19 KB)
│   │   ├── 📁 dist/
│   │   │   ├── 📜 actions.min.js (502 B)
│   │   │   └── 📜 app.min.js (6 KB)
│   │   └── 📜 textarea-resize-manager.js (10.49 KB)
│   ├── 📁 maintenance/
│   ├── 📁 pages/
│   └── 🌐 index.html (7 KB)
├── 📁 server/
│   ├── 📝 README.md (11.31 KB)
│   ├── 📜 server.js (9.32 KB)
│   ├── 📁 config/
│   │   └── 📜 index.js (998 B)
│   ├── 📁 data/
│   │   ├── 📋 application-data.json (7.25 MB)
│   │   ├── 📄 application-data.json.backup_1763082331 (7 MB)
│   │   ├── 📄 application-data.json.backup_20251113_204637 (7 MB)
│   │   ├── 📄 application-data.json.tmp (5.5 MB)
│   │   ├── 📁 backups/
│   │   │   ├── 📋 application-data-2025-11-21T23-43-02.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-49-30.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-55-15.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-00-16.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-05-27.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-10-27.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-15-29.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-20-30.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-26-27.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-31-27.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-22T00-53-35.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T22-25-55.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T22-31-55.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T22-36-56.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T22-42-12.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T22-48-09.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T22-53-11.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T22-58-58.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-04-20.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-06-46.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-16-46.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-21-46.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-26-46.json (7.25 MB)
│   │   │   ├── 📋 application-data-2025-11-21T23-32-18.json (7.25 MB)
│   │   │   └── 📋 application-data-2025-11-21T23-38-02.json (7.25 MB)
│   │   └── 📁 backups-daily/
│   │       ├── 📋 application-data-2025-11-15.json (7 MB)
│   │       ├── 📋 application-data-2025-11-16.json (7 MB)
│   │       ├── 📋 application-data-2025-11-17.json (6.99 MB)
│   │       ├── 📋 application-data-2025-11-18.json (7.28 MB)
│   │       ├── 📋 application-data-2025-11-19.json (7.21 MB)
│   │       ├── 📋 application-data-2025-11-20.json (7.23 MB)
│   │       └── 📋 application-data-2025-11-21.json (7.23 MB)
│   ├── 📁 routes/
│   │   ├── 📜 files.js (5.62 KB)
│   │   ├── 📜 admin.js (10.38 KB)
│   │   └── 📜 t55-docx.js (21.31 KB)
│   ├── 📁 scripts/
│   │   ├── 📜 loadIw37nAtStartup.js (2.47 KB)
│   │   ├── 📜 build.js (5.77 KB)
│   │   ├── 📜 test-server.js (12.74 KB)
│   │   ├── 📜 generate-test-data.js (11.51 KB)
│   │   ├── 📜 cleanup.js (11.92 KB)
│   │   ├── 📜 migrate.js (13.33 KB)
│   │   ├── 📜 generate-docs.js (20.75 KB)
│   │   ├── 📜 check-conventions.js (16.12 KB)
│   │   └── 📜 health-check.js (15.49 KB)
│   ├── 📁 services/
│   │   ├── 📜 taskService.js (3.78 KB)
│   │   ├── 📜 emailService.js (6.33 KB)
│   │   ├── 📜 avisService.js (7.05 KB)
│   │   └── 📜 dataService.js (29.18 KB)
│   ├── 📁 socket/
│   │   ├── 📜 index.js (2.73 KB)
│   │   ├── 📜 taskHandler.js (2.89 KB)
│   │   └── 📜 dataHandler.js (11.24 KB)
│   ├── 📁 uploads/
│   │   ├── 📄 7706840___nettoyage_tubes_refroidisseur_aci__rie-1762285179185-985523617.pdf (100.32 KB)
│   │   ├── 📄 Etendue__2012__Chariot_Acier_CHA_5102_rev_P2-1762347551734-383766892.doc (362 KB)
│   │   ├── 📄 Devis_chariot_acier_2022_R00-1762347685854-903719347.docx (5.15 MB)
│   │   ├── 📄 RTFT_Info_G__n__ral_Maintenance_Rev__B-1762865377091-839175246.PDF (2.78 MB)
│   │   ├── 📄 E339102_PM101_50_035_0058-1762865384495-526498579.pdf (371.75 KB)
│   │   ├── 📄 Tendons_sud_ouest-1762865520850-387364411.png (276.02 KB)
│   │   ├── 📄 Tendons_sud_est-1762865534116-297577460.png (771.65 KB)
│   │   ├── 📄 E339102_PM101_50_035_0057-1762866256779-578422872.pdf (459.59 KB)
│   │   ├── 📄 __paisseurs_minimales_bassins___H372546_0000_240_030_0001-1762875919195-499880511.pdf (1.59 MB)
│   │   ├── 📄 TI_RP_763_31789_1_PATM_Navic_gm_MP-1762876140992-506529500.pdf (2.55 MB)
│   │   ├── 📄 QC2288C25___Soumission_RTFT___Bassins_d_eau___Rev__tement_Chesterton-1762876692367-402150940.pdf (450.64 KB)
│   │   ├── 📄 S1625_1986_357_F000_05-1763127981750-329279468.pdf (258.8 KB)
│   │   ├── 📄 S1625_1986_359_F000_04-1763128011835-298102945.pdf (220.73 KB)
│   │   ├── 📄 S1625_1986_361_F000_02-1763128026142-403986752.pdf (107.3 KB)
│   │   ├── 📄 S1625_1996_002_F000_03-1763128525079-857287400.pdf (116.41 KB)
│   │   ├── 📄 .gitkeep (0 B)
│   │   ├── 📄 OS19389____RTFT___SECTEUR_ACI__RIE___CHANGEMENT_D_HUILE_PONT_1__2_ET_22T-1763571245027-760770705.pdf (152.68 KB)
│   │   └── 📁 t55-templates/
│   │       ├── 📄 template-1763497536387-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763559542834-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763560102344-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763562459007-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763562934655-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763563837847-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763564349850-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763565138385-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763570631853-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763571134349-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763571688513-Template devis.docx (1.78 MB)
│   │       ├── 📄 template-1763571919419-Template devis.docx (1.76 MB)
│   │       ├── 📄 template-FIXED-Template devis.docx (1.76 MB)
│   │       ├── 📄 template-1763571919419-Template devis.BACKUP.docx (1.78 MB)
│   │       ├── 📄 template-1763571919419-Template devis.BACKUP2.docx (1.76 MB)
│   │       ├── 📄 template-1763571919419-Template devis.BACKUP3.docx (1.76 MB)
│   │       ├── 📄 template-1763571919419-Template devis.BACKUP4.docx (1.76 MB)
│   │       ├── 📄 template-1763729969756-Template devis.docx (1.76 MB)
│   │       ├── 📄 template-NEW-Template-devis.docx (2.72 KB)
│   │       ├── 📄 template-1763732586937-Template devis.docx (1.79 MB)
│   │       ├── 📄 template-1763734312356-Template devis.docx (1.79 MB)
│   │       ├── 📄 template-1763734845742-Template devis.docx (1.79 MB)
│   │       ├── 📄 template-1763736688206-Template devis.docx (1.88 KB)
│   │       ├── 📄 template-1763736688206-Template devis.BACKUP-AUTO.docx (1.79 MB)
│   │       ├── 📄 template-1763736688206-Template devis.BACKUP-1763739504494.docx (1.76 MB)
│   │       ├── 📄 template-CLEAN-Template-devis.docx (1.88 KB)
│   │       ├── 📄 template-1763739912585-Template devis COMPLET.docx (22.96 KB)
│   │       ├── 📄 template-1763740022774-template-CLEAN-Template-devis.docx (1.73 KB)
│   │       ├── 📄 template-CORRECT-V2-Template-devis.docx (1.77 KB)
│   │       ├── 📄 template-1763741587577-Template devis.docx (1.73 KB)
│   │       ├── 📄 template-FINAL-Template-devis.docx (1.73 KB)
│   │       ├── 📄 template-1763742446696-template-FINAL-Template-devis.docx (1.73 KB)
│   │       └── 📄 template-1763742578917-Template devis.docx (1.79 MB)
│   ├── 📁 middleware/
│   │   ├── 📜 security.js (9.76 KB)
│   │   ├── 📜 errorHandler.js (7.64 KB)
│   │   └── 📜 validation.js (9.8 KB)
│   └── 📁 utils/
│       ├── 📜 logger.js (5.22 KB)
│       ├── 📜 scheduler.js (2.96 KB)
│       ├── 📜 backup-compression.js (9.64 KB)
│       ├── 📜 socket-optimization.js (12.28 KB)
│       └── 📜 file-security.js (10.17 KB)
├── 📄 Template devis.docx (1.79 MB)
├── 📁 BACKUP-AVANT-NETTOYAGE-20251121/
│   └── 📋 application-data.json (7.23 MB)
├── 📄 nul (0 B)
├── 📄 consommables.png (77.35 KB)
├── 📜 update-map.js (14.22 KB)
└── 📋 package.json (1.3 KB)
```

**Statistiques:**
- **Nombre total de fichiers:** 561
- **Taille totale:** 333.97 MB


> **Note:** Cette section est générée automatiquement par `npm run update-map`
> **Dernière mise à jour:** 23/11/2025 17:56:09

