# Audit Complet - Architecture Backend

**Date:** 2025-11-23
**Application:** Gestionnaire d'Arrêt d'Aciérie - Backend
**Version:** 1.0.0

---

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Point d'Entrée: server.js](#point-dentrée-serverjs)
3. [Routes API](#routes-api)
4. [Services Métier](#services-métier)
5. [Gestionnaires Socket.IO](#gestionnaires-socketio)
6. [Middleware](#middleware)
7. [Utilitaires](#utilitaires)
8. [Flux de Données](#flux-de-données)
9. [Analyse de Sécurité](#analyse-de-sécurité)
10. [Recommandations](#recommandations)

---

## Vue d'Ensemble

### Architecture Générale

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Web)                         │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │ HTTP/REST │ WebSocket │
         └─────┬─────┴─────┬─────┘
               │           │
┌──────────────▼───────────▼──────────────────────────────┐
│               EXPRESS.JS SERVER (Port 3000)             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         MIDDLEWARES (Ordre de traitement)          │ │
│  │  1. Parser JSON/URLEncoded (50MB limit)            │ │
│  │  2. HTTP Logger (Winston)                          │ │
│  │  3. Compression GZIP (sauf si x-no-compression)    │ │
│  │  4. Security Headers (CSP, XSS, Clickjacking)      │ │
│  │  5. CORS Configuration (localhost)                 │ │
│  │  6. Sanitization (Injection prevention)            │ │
│  │  7. Attack Detection (SQL, Path traversal)         │ │
│  │  8. Cache Control (Cache-Control: no-store)        │ │
│  │  9. Rate Limiting (API: 100/15min, General: 2000)  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              ROUTES API                            │ │
│  │  /api/files/*        - File upload/download        │ │
│  │  /api/admin/*        - Monitoring & Stats          │ │
│  │  /api/t55/*          - DOCX Template Generation    │ │
│  │  /download-*         - Document Downloads          │ │
│  │  /health             - Health Check                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         SOCKET.IO (WebSocket Communications)       │ │
│  │  - Task synchronization                            │ │
│  │  - Data synchronization                            │ │
│  │  - Real-time notifications                         │ │
│  │  - Buffer size: 10MB, Ping timeout: 60s            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           STATIC FILES                             │ │
│  │  /client/* -> Express static (client folder)       │ │
│  │  /* -> Fallback index.html (SPA routing)           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
        ▼            ▼            ▼              ▼
    ┌────────┐  ┌────────┐  ┌──────────┐  ┌─────────┐
    │Services│  │Logger  │  │Scheduler │  │ Socket  │
    │(Data,  │  │(Winston)│  │ (Cron)   │  │Handlers │
    │Task,   │  └────────┘  └──────────┘  └─────────┘
    │Email)  │
    └────────┘
        │
        ▼
    ┌─────────────────────────────────────┐
    │ FILE SYSTEM                         │
    │ ├─ server/data/                     │
    │ │  ├─ application-data.json         │
    │ │  ├─ backups/ (25 backups max)     │
    │ │  └─ backups-daily/ (30 jours)     │
    │ ├─ server/uploads/                  │
    │ ├─ generated-docs/                  │
    │ └─ logs/ (Daily rotation)           │
    └─────────────────────────────────────┘
```

### Stack Technique Backend

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Runtime** | Node.js | 18.x LTS+ |
| **Module System** | ES Modules | Native |
| **Framework Web** | Express.js | 4.18.2 |
| **Communication Temps Réel** | Socket.IO | 4.6.1 |
| **Validation** | Joi | 18.0.1 |
| **Upload Fichiers** | Multer | 2.0.2 |
| **Logging** | Winston | 3.18.3 |
| **Rotation Logs** | winston-daily-rotate-file | 5.0.0 |
| **Compression** | compression | 1.8.1 |
| **Rate Limiting** | express-rate-limit | 8.2.1 |
| **Tâches Planifiées** | node-cron | 4.2.1 |
| **Génération DOCX** | docxtemplater | 3.67.3 |
| **Manipulation ZIP** | pizzip | 3.2.0 |
| **Excel** | xlsx | 0.18.5 |

### Structure des Dossiers Backend

```
server/
├── server.js                      # Point d'entrée principal
├── config/                        # Configuration
│   └── config.js                  # Variables configuration
├── data/                          # Données persistantes
│   ├── application-data.json      # Base de données JSON
│   ├── backups/                   # Backups incrémentaux (5min)
│   └── backups-daily/             # Backups quotidiens (2h00)
├── middleware/                    # Middlewares Express
│   ├── security.js                # Sécurité (headers, sanitization)
│   ├── errorHandler.js            # Gestion erreurs
│   └── validation.js              # Validation Joi schemas
├── routes/                        # Routes API
│   ├── files.js                   # Upload/Download fichiers
│   ├── admin.js                   # Stats, logs, health
│   └── t55-docx.js                # Génération templates DOCX
├── services/                      # Logique métier
│   ├── dataService.js             # Gestion données JSON
│   ├── taskService.js             # Gestion tâches (in-memory)
│   ├── avisService.js             # Génération avis syndicaux
│   └── emailService.js            # Envoi emails (Outlook COM)
├── socket/                        # Gestionnaires Socket.IO
│   ├── index.js                   # Initialisation Socket.IO
│   ├── taskHandler.js             # Événements tâches
│   └── dataHandler.js             # Événements données
├── uploads/                       # Fichiers uploadés
│   └── t55-templates/             # Templates DOCX T55
└── utils/                         # Utilitaires
    ├── logger.js                  # Configuration Winston
    ├── scheduler.js               # Tâches planifiées (cron)
    ├── file-security.js           # Validation sécurité fichiers
    ├── socket-optimization.js     # Optimisations Socket.IO
    └── backup-compression.js      # Compression backups (gzip)
```

---

## Point d'Entrée: server.js

**Emplacement:** `E:\TEST 3\server\server.js`

### Séquence de Démarrage

#### Phase 0: Configuration Environnement

```javascript
// 1. Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Erreur non gérée:', error);
  // Note: Ne quitte PAS en dev pour debugging
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée:', { reason, promise });
});

// 2. Configuration variables d'environnement
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
```

#### Phase 1: Initialisation Services

```javascript
async function startServer() {
  // 1. Initialiser dataService (charge application-data.json)
  await dataService.initialize();

  // 2. Charger IW37N.xlsx si présent (données initiales)
  await loadIw37nAtStartup();

  // 3. Créer Express app
  const app = express();

  // 4. Créer HTTP server
  const httpServer = createServer(app);

  // 5. Créer Socket.IO instance
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 10 * 1024 * 1024,  // 10 MB
    pingTimeout: 60000,    // 60 secondes
    pingInterval: 25000    // 25 secondes
  });

  // 6. Rendre IO accessible globalement (pour routes admin)
  global.io = io;

  // 7. Initialiser gestionnaires Socket.IO
  initializeSocketHandlers(io);

  // 8. Initialiser scheduler (tâches planifiées)
  const scheduledTasks = initializeScheduler();

  // 9. Démarrer serveur HTTP
  httpServer.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur démarré sur http://${HOST}:${PORT}`);
  });

  // 10. Graceful shutdown
  setupGracefulShutdown(httpServer, scheduledTasks);
}

startServer();
```

### Configuration Middleware (Ordre Critique)

**IMPORTANT:** L'ordre des middleware est CRITIQUE pour la sécurité et fonctionnalité.

```javascript
// ============================================
// 1. PARSERS (Doivent être en premier)
// ============================================
app.use(express.json({
  limit: '50mb',
  strict: true  // Only parse objects and arrays
}));

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

// ============================================
// 2. LOGGING
// ============================================
app.use(httpLoggerMiddleware());  // Winston HTTP logger

// ============================================
// 3. COMPRESSION
// ============================================
app.use(compression({
  level: 6,                  // Balance vitesse/compression
  threshold: 1024,           // Compresser si > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// ============================================
// 4. SÉCURITÉ
// ============================================
app.use(setupSecurity());  // Headers, sanitization, attack detection

// ============================================
// 5. CORS
// ============================================
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      `http://${HOST}:${PORT}`
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// ============================================
// 6. CACHE CONTROL (Désactivation totale)
// ============================================
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ============================================
// 7. RATE LIMITING
// ============================================
// Rate limit API strict
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requêtes max
  message: 'Trop de requêtes depuis cette IP',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

// Rate limit général (permissif)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000                   // 2000 requêtes max
});

app.use(generalLimiter);

// ============================================
// 8. TYPE ENFORCEMENT (pour .js files)
// ============================================
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.set('Content-Type', 'application/javascript');
  }
  next();
});
```

### Configuration Routes (Ordre de Priorité)

```javascript
// ============================================
// 1. ROUTES API (avant static)
// ============================================
app.use('/api/files', filesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/t55', t55Router);

// ============================================
// 2. DOWNLOAD ROUTES (documents générés)
// ============================================
app.get('/download-avis/:fileName', async (req, res) => {
  const filePath = path.join('generated-docs', req.params.fileName);
  res.download(filePath);
});

app.get('/download-devis/:fileName', async (req, res) => {
  const filePath = path.join('generated-docs', req.params.fileName);
  res.download(filePath);
});

// ============================================
// 3. HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 4. STATIC FILES
// ============================================
app.use(express.static('client', {
  maxAge: 0,              // Pas de cache
  etag: false,
  lastModified: false
}));

// ============================================
// 5. SPA FALLBACK (doit être en dernier)
// ============================================
app.get('*', (req, res) => {
  // Exclure routes API
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
  } else {
    next();
  }
});

// ============================================
// 6. ERROR HANDLERS (toujours en dernier)
// ============================================
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.path} non trouvée`
    }
  });
});

// Global error handler
app.use(errorHandler);
```

### Graceful Shutdown

```javascript
function setupGracefulShutdown(httpServer, scheduledTasks) {
  const shutdown = async (signal) => {
    console.log(`\n⚠️  Signal ${signal} reçu, arrêt gracieux...`);

    // 1. Arrêter tâches planifiées
    stopAllTasks(scheduledTasks);

    // 2. Fermer serveur HTTP (refuse nouvelles connexions)
    httpServer.close(() => {
      console.log('✅ Serveur HTTP fermé');
    });

    // 3. Créer backup final
    try {
      await dataService.createBackup();
      console.log('✅ Backup final créé');
    } catch (error) {
      console.error('❌ Erreur backup final:', error);
    }

    // 4. Attendre connexions actives (max 10 secondes)
    setTimeout(() => {
      console.log('⏱️  Timeout atteint, fermeture forcée');
      process.exit(0);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```

### Affichage Console au Démarrage

```
╔════════════════════════════════════╗
║   🏭 Gestionnaire d'Arrêt d'Aciérie║
╚════════════════════════════════════╝

🚀 Serveur démarré sur: http://0.0.0.0:3000
📁 Fichiers client: E:\TEST 3\client
🌍 Environnement: development

📡 Accès réseau:
   Local:  http://localhost:3000
   Réseau: http://192.168.1.100:3000

✅ Socket.IO configuré
✅ Middlewares initialisés
✅ Routes API enregistrées
✅ Tâches planifiées démarrées
✅ DataService initialisé (70+ modules)

Prêt à recevoir des connexions...
```

---

## Routes API

Voir le document détaillé: **[05-API-Endpoints.md](./05-API-Endpoints.md)**

**Résumé:**

| Route | Endpoints | Rôle |
|-------|-----------|------|
| `/api/files` | 4 endpoints | Upload, download, list, delete fichiers |
| `/api/admin` | 3 endpoints | Statistiques, logs, health check |
| `/api/t55` | 2 endpoints | Upload template, génération DOCX |

**Types de fichiers supportés:**
- Documents: PDF, DOC, DOCX
- Excel: XLS, XLSX, CSV
- Images: JPG, JPEG, PNG, GIF
- Archives: ZIP, RAR
- Texte: TXT, CSV

**Limites:**
- Taille max: 50 MB par fichier
- Nombre max: 10 fichiers simultanés
- Rate limit: 100 requêtes/15min sur `/api/*`

---

## Services Métier

### 1. Data Service

**Fichier:** `server/services/dataService.js`

**Responsabilité:** Gestion centralisée des données JSON avec système de backup automatique

#### 1.1 Modules de Données (70+)

L'application gère **70+ modules de données** organisés par catégorie:

| Catégorie | Modules (exemples) | Quantité |
|-----------|-------------------|----------|
| **Données de base** | arretData, iw37nData, iw38Data, tpaaData, pwData | 5 |
| **PSV & Maintenance** | psvData, maintenancesCapitalisablesData, plansEntretienData | 3 |
| **Équipes & Contacts** | teamData, contactsData, entrepreneurData | 3 |
| **Projets & Travaux** | projetsData, revisionTravauxData, strategieData | 3 |
| **Demandes** | demandesEchafaudages, demandesGruesNacelles, demandesVerrouillage | 3 |
| **Approvisionnement** | approvisionnementData, piecesData, consommablesData, t30Data, t60Data | 5 |
| **Équipements** | equipementLevageData, nacellesData, travailHauteurData | 3 |
| **Avis & Communication** | avisData, avisSyndicauxData, pointPresseData | 3 |
| **Analyses** | smedData, amdecData, suiviCoutData, t33PriorisationData | 4 |
| **T-series (Tasks)** | t21Data, t22Data, ..., t139Data | ~40 |
| **Configuration** | settingsData, scopeFilters, dataPageFilters, posteAllocations | 5 |

**Total:** ~80 modules

#### 1.2 API Publique

```javascript
// Initialisation (charge données en mémoire)
await dataService.initialize();

// Lecture
const allData = await dataService.getAllData();
const moduleData = await dataService.getModuleData('iw37nData');

// Écriture
await dataService.updateModuleData('iw37nData', newData, 'John');

// Batch update
await dataService.updateMultipleModules([
  { moduleName: 'iw37nData', data: [...] },
  { moduleName: 'iw38Data', data: [...] }
], 'John');

// Reset
await dataService.resetAllData();

// Backup manuel
await dataService.createBackup();
await dataService.createDailyBackup();
```

#### 1.3 Système de Backup

**Stratégie double:**

**A. Backups incrémentaux (automatiques)**
- **Fréquence:** Toutes les 5 minutes (si données modifiées)
- **Rétention:** 25 derniers backups
- **Emplacement:** `server/data/backups/`
- **Format:** `application-data-YYYY-MM-DDTHH-mm-ss.json`
- **Compression:** Optionnelle (gzip)

**B. Backups quotidiens (scheduled)**
- **Fréquence:** Tous les jours à 2h00 du matin
- **Rétention:** 30 jours
- **Emplacement:** `server/data/backups-daily/`
- **Format:** `application-data-YYYY-MM-DD.json`
- **Compression:** Optionnelle (gzip)

**Implémentation:**

```javascript
class DataService {
  constructor() {
    this.data = null;
    this.lastBackupTime = 0;
    this.isBackingUp = false;
    this.BACKUP_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes
    this.MAX_BACKUPS = 25;
    this.MAX_DAILY_BACKUPS = 30;
  }

  async createBackup() {
    const now = Date.now();

    // Optimisation: skip si backup récent
    if (now - this.lastBackupTime < this.BACKUP_INTERVAL_MS) {
      return;
    }

    // Prevent concurrent backups
    if (this.isBackingUp) {
      return;
    }

    this.isBackingUp = true;

    try {
      // Créer dossier si nécessaire
      if (!existsSync(BACKUP_DIR)) {
        await mkdir(BACKUP_DIR, { recursive: true });
      }

      // Créer backup
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');

      const backupFile = join(
        BACKUP_DIR,
        `application-data-${timestamp}.json`
      );

      const data = await readFile(DATA_FILE, 'utf-8');
      await writeFile(backupFile, data);

      logger.info(`✅ Backup créé: ${backupFile}`);

      // Nettoyer vieux backups
      await this.cleanOldBackups();

      this.lastBackupTime = now;
    } catch (error) {
      logger.error('❌ Erreur création backup:', error);
    } finally {
      this.isBackingUp = false;
    }
  }

  async cleanOldBackups() {
    try {
      const files = await readdir(BACKUP_DIR);

      const backups = files
        .filter(f => f.startsWith('application-data-'))
        .sort()
        .reverse();  // Plus récents en premier

      // Supprimer backups excédentaires
      if (backups.length > this.MAX_BACKUPS) {
        const toDelete = backups.slice(this.MAX_BACKUPS);

        for (const file of toDelete) {
          await unlink(join(BACKUP_DIR, file));
          logger.info(`🗑️  Backup supprimé: ${file}`);
        }
      }
    } catch (error) {
      logger.error('❌ Erreur nettoyage backups:', error);
    }
  }

  async createDailyBackup() {
    try {
      if (!existsSync(DAILY_BACKUP_DIR)) {
        await mkdir(DAILY_BACKUP_DIR, { recursive: true });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const backupFile = join(
        DAILY_BACKUP_DIR,
        `application-data-${dateStr}.json`
      );

      // Skip si backup du jour existe déjà
      if (existsSync(backupFile)) {
        logger.info(`⏭️  Backup quotidien existe déjà pour ${dateStr}`);
        return;
      }

      const data = await readFile(DATA_FILE, 'utf-8');
      await writeFile(backupFile, data);

      logger.info(`✅ Backup quotidien créé: ${backupFile}`);

      // Nettoyer vieux backups quotidiens
      await this.cleanOldDailyBackups();
    } catch (error) {
      logger.error('❌ Erreur backup quotidien:', error);
    }
  }

  async cleanOldDailyBackups() {
    try {
      const files = await readdir(DAILY_BACKUP_DIR);

      const backups = files
        .filter(f => f.startsWith('application-data-'))
        .sort()
        .reverse();

      if (backups.length > this.MAX_DAILY_BACKUPS) {
        const toDelete = backups.slice(this.MAX_DAILY_BACKUPS);

        for (const file of toDelete) {
          await unlink(join(DAILY_BACKUP_DIR, file));
          logger.info(`🗑️  Backup quotidien supprimé: ${file}`);
        }
      }
    } catch (error) {
      logger.error('❌ Erreur nettoyage backups quotidiens:', error);
    }
  }
}
```

#### 1.4 Nettoyage Caractères de Contrôle

Pour éviter les erreurs JSON.parse, tous les caractères de contrôle sont supprimés (sauf `\n`, `\r`, `\t`):

```javascript
function cleanControlCharacters(obj) {
  if (typeof obj === 'string') {
    // Garde: \n (0x0A), \r (0x0D), \t (0x09)
    // Supprime: 0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F
    return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanControlCharacters(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      cleaned[key] = cleanControlCharacters(obj[key]);
    }
    return cleaned;
  }

  return obj;
}
```

#### 1.5 Logging des Opérations

Chaque opération est loggée avec Winston:

```javascript
await dataService.updateModuleData('iw37nData', data, 'John');

// Log généré:
// 2025-11-23 10:30:45 [INFO]: Data Operation
// {
//   "operation": "updateModule",
//   "module": "iw37nData",
//   "user": "John",
//   "success": true,
//   "timestamp": "2025-11-23T10:30:45.123Z"
// }
```

---

### 2. Task Service

**Fichier:** `server/services/taskService.js`

**Responsabilité:** Gestion des tâches et utilisateurs connectés (in-memory, non persistant)

**Note importante:** Ce service gère les données en mémoire uniquement. Au redémarrage du serveur, toutes les tâches et utilisateurs sont perdus.

#### API

```javascript
// Tâches
const tasks = taskService.getAllTasks();
const task = taskService.getTaskById('task-id');
await taskService.createTask({ title, description, assignee, status });
await taskService.updateTask('task-id', { status: 'completed' });
await taskService.deleteTask('task-id');

// Utilisateurs
taskService.addUser('socket-id', 'John Doe');
taskService.removeUser('socket-id');
const users = taskService.getAllUsers();

// État global
const state = taskService.getGlobalState();
// Returns: { tasks: [...], users: [...] }
```

#### Structure Task

```javascript
{
  id: "uuid-v4",
  title: "Titre de la tâche",
  description: "Description optionnelle",
  assignee: "Nom de la personne",
  status: "pending|in-progress|completed",
  createdAt: "2025-11-23T10:30:00Z",
  updatedAt: "2025-11-23T10:30:00Z"
}
```

---

### 3. Avis Service

**Fichier:** `server/services/avisService.js`

**Responsabilité:** Génération de documents Word pour avis syndicaux

#### Fonction Principale

```javascript
const result = await avisService.genererAvisSyndical({
  nomEntrepreneur: "ACME Corp",
  descriptionTravaux: "Réparation section A",
  dateAvis: "2025-11-23",
  dateDebut: "2025-12-01",
  dateFin: "2025-12-05",
  heureDebut: "08:00",
  heureFin: "17:00",
  nbTechniciens: 5,
  nbJours: 5,
  heuresHomme: 200,
  responsableProjet: "Jean Dupont",
  surintendant: "Pierre Martin",
  types: ["Contrat"],  // Ou ["Mineur"], ["Sous-contrat"]

  // Optionnel: dates formatées
  dateAvisFormatted: "23/11/2025",
  dateDebutFormatted: "01/12/2025",
  dateFinFormatted: "05/12/2025"
});

// Returns:
// {
//   success: true,
//   filePath: "...\ACME Corp - Réparation section A - 23-11-2025.docx"
// }
```

#### Template DOCX

**Emplacement:** `generated-docs/templates/Avis Template.docx`

**Variables docxtemplater:**

| Variable | Exemple | Type |
|----------|---------|------|
| `{DATE}` | 23/11/2025 | Texte |
| `{DESCRIPTION}` | Réparation section A | Texte |
| `{TYPE_CONTRAT}` | ☑ ou ☐ | Checkbox |
| `{TYPE_MINEUR}` | ☑ ou ☐ | Checkbox |
| `{TYPE_SOUS_CONTRAT}` | ☑ ou ☐ | Checkbox |
| `{ENTREPRENEUR}` | ACME Corp | Texte |
| `{DATE_DEBUT}` | 01/12/2025 | Date |
| `{DATE_FIN}` | 05/12/2025 | Date |
| `{HEURE_DEBUT}` | 08:00 | Heure |
| `{HEURE_FIN}` | 17:00 | Heure |
| `{NB_TECHNICIENS}` | 5 | Nombre |
| `{NB_JOURS}` | 5 | Nombre |
| `{HEURES_HOMME}` | 200 | Nombre |
| `{RESPONSABLE}` | Jean Dupont | Texte |
| `{SURINTENDANT}` | Pierre Martin | Texte |

#### Traitement

1. **Chargement template** via PizZip
2. **Création docxtemplater** avec options:
   - `paragraphLoop: true`
   - `linebreaks: true`
   - `nullGetter: () => ''` (pas de highlighting jaune)
3. **Préparation données:**
   - Conversion checkboxes: `types.includes('Contrat') ? '☑' : '☐'`
   - Formatage dates: DD/MM/YYYY
   - Nettoyage strings (caractères contrôle)
4. **Render template**
5. **Post-traitement:**
   - Suppression highlighting jaune dans `word/document.xml`
   - Génération buffer avec compression DEFLATE
6. **Sauvegarde:**
   - Nom: `{Entrepreneur} - {Description tronquée 50 char} - {DD-MM-YYYY}.docx`
   - Emplacement: `generated-docs/`

---

### 4. Email Service

**Fichier:** `server/services/emailService.js`

**Responsabilité:** Envoi d'emails via Outlook COM automation (Windows uniquement)

**Méthode:** Utilise PowerShell pour contrôler Outlook via COM Automation

#### Fonction Principale

```javascript
const result = await emailService.envoyerAvisSyndical({
  to: "destinataire@example.com",
  filePath: "path/to/document.docx",
  fileName: "ACME Corp - Réparation - 23-11-2025.docx",
  avisData: {
    nomEntrepreneur: "ACME Corp",
    descriptionTravaux: "...",
    dateDebut: "01/12/2025",
    dateFin: "05/12/2025",
    // ...
  }
});

// Returns:
// {
//   success: true,
//   message: "Email envoyé avec succès via Outlook!",
//   method: "outlook-com"
// }
```

#### Script PowerShell Généré

```powershell
$outlook = New-Object -ComObject Outlook.Application
$mail = $outlook.CreateItem(0)  # 0 = MailItem

$mail.To = "destinataire@example.com"
$mail.Subject = "Avis syndical - ACME Corp"
$mail.HTMLBody = @"
<div style="font-family: Arial, sans-serif;">
  <h2 style="color: #004085; border-bottom: 2px solid #004085;">
    Avis Syndical
  </h2>

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td><strong>Entrepreneur:</strong></td>
      <td>ACME Corp</td>
    </tr>
    <tr>
      <td><strong>Date:</strong></td>
      <td>23/11/2025</td>
    </tr>
    <tr>
      <td><strong>Type:</strong></td>
      <td>Contrat</td>
    </tr>
    <tr>
      <td><strong>Période:</strong></td>
      <td>01/12/2025 - 05/12/2025</td>
    </tr>
    <tr>
      <td><strong>Heures-personne:</strong></td>
      <td>200</td>
    </tr>
  </table>

  <h3>Description des travaux:</h3>
  <p>Réparation section A</p>

  <p style="margin-top: 30px; font-size: 12px; color: #666;">
    <em>Cet email a été généré automatiquement le 2025-11-23 à 10:30:00</em>
  </p>
</div>
"@

$mail.Attachments.Add("C:\path\to\document.docx")
$mail.Send()
```

#### Gestion Erreurs

| Erreur | Message Utilisateur |
|--------|---------------------|
| Outlook non installé | "Outlook n'est pas installé sur ce système" |
| Permission refusée | "Permission refusée pour accéder à Outlook" |
| Fichier introuvable | "Le fichier joint est introuvable" |
| Erreur générique | "Erreur lors de l'envoi de l'email: [details]" |

#### Test Configuration

```javascript
const testResult = await emailService.testerConfigurationEmail();

// Returns:
// {
//   success: true,
//   message: "Outlook est disponible et configuré",
//   outlookVersion: "16.0"
// }
```

---

**Suite:** Voir document **[05-API-Endpoints.md](./05-API-Endpoints.md)** pour les détails complets des endpoints API.

---

**Document suivant:** [04-Architecture-Frontend.md](./04-Architecture-Frontend.md)
