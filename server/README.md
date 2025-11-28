# Architecture Serveur - Gestionnaire d'Arrêt d'Aciérie

## 📊 Vue d'ensemble

Serveur Node.js basé sur Express et Socket.IO pour la gestion en temps réel d'un arrêt d'aciérie.

**Caractéristiques principales :**
- ⚡ Communication temps réel (Socket.IO)
- 💾 Persistence JSON avec backups automatiques
- 📝 Logging complet (Winston)
- ⏰ Tâches planifiées (node-cron)
- 📄 Génération de documents (avis syndicaux)
- 📊 Gestion de 80+ modules de données

## 🚀 Démarrage

```bash
npm install
npm start        # Production
npm run dev      # Développement avec watch mode
npm run health   # Vérifier l'état du serveur
npm run backup   # Backup manuel
npm run clean    # Nettoyage des backups anciens
```

## 📁 Structure

```
server/
├── server.js              # Point d'entrée principal
├── config/
│   └── index.js           # Configuration centralisée
├── services/
│   ├── dataService.js     # Gestion des 80+ modules de données
│   ├── taskService.js     # Service de gestion des tâches
│   ├── avisService.js     # Génération avis syndicaux (Word)
│   └── emailService.js    # Envoi d'emails
├── socket/
│   ├── handlers.js        # Gestionnaires d'événements Socket.IO
│   └── validators.js      # Validation des événements (Joi)
├── routes/
│   ├── upload.js          # Upload de fichiers (Multer)
│   └── export.js          # Export de données
├── utils/
│   ├── logger.js          # Configuration Winston
│   ├── scheduler.js       # Tâches cron (backups, cleanup)
│   └── security.js        # Rate limiting
├── data/
│   ├── application-data.json     # Base de données JSON
│   ├── backups/                  # Backups incrémentaux (toutes les 5 min)
│   └── backups-daily/            # Backups quotidiens
├── uploads/               # Fichiers uploadés
└── scripts/              # Scripts utilitaires
```

## 🔌 Services

### DataService (`services/dataService.js`)

Service principal de gestion des données. Gère 80+ modules organisés en catégories :

**Catégories :**
- 📊 Données de base (arretData, scopeMarkers, iw37nData, iw38Data, tpaaData, pwData)
- 🔧 PSV et maintenance (psvData, psvPlans, maintenancesCapitalisablesData)
- 👥 Équipes et contacts (teamData, contactsData, entrepreneurData)
- 📋 Projets et planification (strategieData, revisionTravauxData, pointPresseData)
- 🔩 Pièces et approvisionnement (piecesData, consommablesData, approvisionnementData)
- 🏗️ Équipements (equipementLevageData, nacellesData, travailHauteurData)
- 💬 Communications (rencontreData, rencontresHebdoData)
- 📊 Analyse (smedData, amdecData)
- Et 70+ autres modules...

**Fonctions principales :**

```javascript
// Lire un module
const data = await getData('moduleName');

// Sauvegarder un module
await saveData('moduleName', newData);

// Lister tous les modules
const modules = await getModulesList();

// Statistiques globales
const stats = await getModulesStats();

// Backup manuel
await createBackup();
```

**Auto-chargement :**
Au démarrage, charge automatiquement `data-sources/IW37N.xlsx` si disponible.

### TaskService (`services/taskService.js`)

Gestion du cycle de vie des tâches.

**Fonctions :**
- Validation des données de tâches
- Sauvegarde avec backup automatique
- Détection des changements
- Logging des modifications

### AvisService (`services/avisService.js`)

Génération des avis syndicaux au format Word (.docx).

**Utilisation :**
```javascript
const { buffer, filename } = await generateAvis(avisData);
```

**Template :** `server/templates/avis-template.docx`

**Données requises :**
- date, numeroAvis, titre, contenu, expediteur, etc.

### EmailService (`services/emailService.js`)

Envoi d'emails via Nodemailer.

**Configuration :** Via variables d'environnement (.env)

## 🔌 Socket.IO Events

### Événements entrants (client → serveur)

**Format :** `action:module`

Exemples :
```javascript
socket.emit('load:iw37n');
socket.emit('save:iw37n', data);
socket.emit('update:task', { id, updates });
socket.emit('generate:avis', avisData);
```

**Modules supportés :**
- `iw37n`, `iw38`, `tpaa`, `pw`, `psv`
- `entrepreneur`, `pieces`, `consommables`, `approvisionnement`
- `contacts`, `settings`, `ingq`, `team`
- `maintenancesCapitalisables`, `plansEntretien`
- `rencontre`, `strategie`, `revisionTravaux`, `pointPresse`
- `echafaudages`, `gruesNacelles`, `verrouillage`
- Et 60+ autres modules...

**Actions spéciales :**
```javascript
socket.emit('health:check');           // Vérification santé
socket.emit('modules:list');           // Liste modules
socket.emit('modules:stats');          // Statistiques
socket.emit('backup:create');          // Backup manuel
socket.emit('data:export', { modules }); // Export données
```

### Événements sortants (serveur → clients)

**Broadcasts (tous les clients) :**
```javascript
'data:updated:moduleName'   // Données modifiées
'task:updated'              // Tâche modifiée
'avis:generated'            // Avis généré
'backup:created'            // Backup créé
'error'                     // Erreur
```

**Réponses individuelles :**
```javascript
'data:loaded'               // Données chargées
'data:saved'                // Données sauvegardées
'health:status'             // Statut santé
'modules:list'              // Liste modules
'modules:stats'             // Statistiques
```

## 🛣️ Routes HTTP

### Upload de fichiers
```
POST /upload/:type
```

**Types supportés :**
- `pdf` - Fichiers PDF
- `drawing` - Plans/dessins
- `document` - Documents généraux

**Limite :** 50 MB par fichier

**Réponse :**
```json
{
  "success": true,
  "filename": "original-filename.pdf",
  "path": "/uploads/filename-timestamp.pdf",
  "size": 1024000
}
```

### Export de données
```
GET /export/:format
POST /export/:format
```

**Formats :**
- `json` - Export JSON
- `excel` - Export Excel

### Health Check
```
GET /health
```

**Réponse :**
```json
{
  "status": "ok",
  "uptime": 3600.5,
  "timestamp": "2025-11-15T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## ⚙️ Configuration

**Fichier :** `server/config/index.js`

**Variables d'environnement (.env) :**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATA_FILE=./server/data/application-data.json
BACKUP_INTERVAL=300000
MAX_BACKUPS=25
DAILY_BACKUPS_TO_KEEP=30
LOG_LEVEL=info
UPLOAD_MAX_SIZE=52428800
```

## 📝 Logging

**Transport :** Winston avec rotation quotidienne

**Fichiers :**
- `logs/combined-YYYY-MM-DD.log` - Tous les logs
- `logs/error-YYYY-MM-DD.log` - Erreurs uniquement

**Rétention :** 30 jours

**Niveaux :**
- `error` - Erreurs critiques
- `warn` - Avertissements
- `info` - Informations générales
- `debug` - Détails de débogage

**Utilisation :**
```javascript
import logger from './utils/logger.js';

logger.info('Message info');
logger.error('Erreur', { error: err });
logger.warn('Avertissement');
logger.debug('Debug', { data });
```

## ⏰ Tâches planifiées

**Scheduler :** node-cron (`utils/scheduler.js`)

**Tâches :**

1. **Backup quotidien** - Chaque jour à 2h00
   ```javascript
   '0 2 * * *' → createDailyBackup()
   ```

2. **Nettoyage hebdomadaire** - Dimanche à 3h00
   ```javascript
   '0 3 * * 0' → cleanupOldBackups()
   ```

3. **Backup incrémental** - Toutes les 5 minutes
   ```javascript
   Auto-déclenchée lors des modifications de données
   ```

## 💾 Système de Backup

**Double système :**

### 1. Backups incrémentaux (toutes les 5 min)
- Déclenchés lors des modifications
- Stockés dans `data/backups/`
- Conservation : 25 derniers backups
- Nettoyage automatique au-delà de 25

### 2. Backups quotidiens (2h00)
- Snapshot quotidien complet
- Stockés dans `data/backups-daily/`
- Conservation : 30 jours
- Format : `backup-YYYYMMDD-HHmmss.json`

**Restauration manuelle :**
```bash
cp data/backups-daily/backup-20251115-020000.json data/application-data.json
```

## 🔒 Sécurité

### Rate Limiting

**API endpoints :**
- 100 requêtes / 15 minutes / IP
- Message : "Trop de requêtes API, veuillez réessayer plus tard"

**Général :**
- 500 requêtes / 15 minutes / IP
- Message : "Trop de requêtes, veuillez réessayer plus tard"

### Upload de fichiers

- Taille max : 50 MB
- Stockage : `server/uploads/`
- Noms sécurisés : timestamp + sanitization

### Compression GZIP

Activée pour toutes les réponses HTTP > 1KB.

## 🧪 Scripts utilitaires

### Health Check
```bash
npm run health
```
Vérifie :
- Serveur accessible
- Uptime
- Version
- État

### Backup manuel
```bash
npm run backup
```
Crée un backup immédiat dans `backups-daily/`.

### Nettoyage
```bash
npm run clean
```
Supprime :
- Backups > 25 (incrémentaux)
- Backups > 30 jours (quotidiens)
- Logs > 30 jours

## 📊 Monitoring

### Vérification santé
```javascript
GET /health
```

### Logs en temps réel
```bash
tail -f logs/combined-$(date +%Y-%m-%d).log
```

### Statistiques modules
```javascript
socket.emit('modules:stats');
```

Retourne :
```javascript
{
  totalModules: 80,
  activeModules: 65,
  emptyModules: 15,
  totalItems: 12500,
  totalSizeBytes: 5242880,
  lastUpdated: '2025-11-15T10:30:00.000Z'
}
```

## 🐛 Débogage

**Mode développement :**
```bash
npm run dev
```

**Log level debug :**
```env
LOG_LEVEL=debug
```

**Validation Socket.IO :**
Les événements sont validés via Joi (`socket/validators.js`).

**Erreurs courantes :**
- Port 3000 déjà utilisé → Changer PORT dans .env
- Fichier JSON corrompu → Restaurer depuis backups/
- Upload échoue → Vérifier taille < 50MB

## 📚 Dépendances principales

- **express** 4.18.2 - Framework web
- **socket.io** 4.6.1 - Communication temps réel
- **joi** 17.9.2 - Validation de données
- **winston** 3.8.2 - Logging
- **winston-daily-rotate-file** 4.7.1 - Rotation logs
- **node-cron** 3.0.2 - Tâches planifiées
- **multer** 1.4.5-lts.1 - Upload fichiers
- **express-rate-limit** 6.7.0 - Rate limiting
- **compression** 1.7.4 - GZIP
- **docxtemplater** 3.37.11 - Génération Word
- **pizzip** 3.1.4 - Manipulation ZIP
- **nodemailer** 6.9.3 - Envoi emails
- **xlsx** 0.18.5 - Manipulation Excel

## 🔄 Cycle de vie

1. **Démarrage**
   - Chargement configuration
   - Initialisation logger
   - Connexion base de données JSON
   - Auto-chargement IW37N.xlsx
   - Démarrage serveur Express
   - Initialisation Socket.IO
   - Activation scheduler

2. **Exécution**
   - Écoute événements Socket.IO
   - Traitement requêtes HTTP
   - Backups automatiques
   - Logging continu

3. **Arrêt**
   - Fermeture connexions Socket.IO
   - Sauvegarde finale données
   - Arrêt serveur Express

## 📖 Ressources

- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [Winston](https://github.com/winstonjs/winston)
- [node-cron](https://github.com/node-cron/node-cron)
- [Joi](https://joi.dev/)

---

**Dernière mise à jour :** 2025-11-15
**Version :** 1.0.0
