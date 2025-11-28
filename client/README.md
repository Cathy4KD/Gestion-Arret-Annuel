# Architecture Client - Gestionnaire d'Arrêt d'Aciérie

## 📊 Vue d'ensemble

Application web monopage pour la gestion d'un arrêt d'aciérie. Interface moderne et réactive avec communication temps réel.

**Statistiques :**
- 🌐 **131 pages HTML**
- 📜 **128 modules JavaScript**
- 🎨 **14 feuilles de style CSS**
- ⚡ **Communication Socket.IO temps réel**
- 📊 **Visualisations Chart.js**
- 📁 **Import/Export Excel**

## 🚀 Démarrage rapide

1. **Ouvrir l'application**
   ```
   http://localhost:3000
   ```

2. **Navigation**
   - Page d'accueil : Dashboard principal avec statistiques
   - Menu latéral : Navigation entre modules
   - Breadcrumbs : Fil d'Ariane pour localisation

3. **Fonctionnalités principales**
   - Visualisation tâches en Kanban
   - Graphiques temps réel (Chart.js)
   - Import/Export Excel
   - Génération PDF
   - Édition inline des données
   - Drag & Drop pour réorganisation

## 📁 Structure des fichiers

```
client/
├── index.html                 # Point d'entrée
├── components/
│   └── pages/                 # 131 pages HTML
│       ├── index.html         # Dashboard
│       ├── execution.html     # Suivi exécution
│       ├── historique.html    # Historique
│       ├── pieces.html        # Gestion pièces
│       ├── contacts.html      # Contacts
│       ├── detail-*.html      # ~100 pages de détail
│       └── ...
│
├── js/
│   ├── main.js                # Initialisation principale
│   ├── socket.js              # Gestion Socket.IO
│   ├── store.js               # État global (Zustand-like)
│   ├── actions.js             # Actions Socket.IO
│   ├── ui.js                  # Manipulation DOM
│   ├── lib-loader.js          # Chargement bibliothèques CDN
│   ├── textarea-resize-manager.js
│   │
│   └── modules/
│       ├── data/              # ~40 modules de données
│       │   ├── iw37n-data.js
│       │   ├── iw38-data.js
│       │   ├── tpaa-data.js
│       │   ├── pw-data.js
│       │   ├── psv-data.js
│       │   ├── entrepreneur-data.js
│       │   ├── pieces-data.js
│       │   ├── settings.js
│       │   └── t*-*.js        # Modules tâches (t21-t72)
│       │
│       ├── ui/                # ~15 modules UI
│       │   ├── dashboard-modals.js
│       │   ├── dashboard-actions.js
│       │   ├── dashboard-filters.js
│       │   ├── responsable-modal.js
│       │   ├── pieces-page.js
│       │   ├── calendar.js
│       │   ├── drag-drop.js
│       │   ├── devis-manager.js
│       │   └── timeline.js
│       │
│       ├── charts/
│       │   ├── charts.js
│       │   └── dashboard-charts.js
│       │
│       ├── import-export/
│       │   ├── excel-import.js
│       │   ├── excel-export.js
│       │   └── pdf-export.js
│       │
│       ├── entities/
│       │   ├── entrepreneurs.js
│       │   ├── team.js
│       │   └── ingq.js
│       │
│       ├── demandes/
│       │   ├── echafaudages.js
│       │   ├── grues-nacelles.js
│       │   └── verrouillage.js
│       │
│       ├── plans/
│       │   ├── plan-renderer.js
│       │   └── plan-suivis-journaliers.js
│       │
│       ├── psv/
│       │   └── psv-plan-markers.js
│       │
│       ├── scope/
│       │   └── scope-markers.js
│       │
│       ├── sync/
│       │   ├── upload-service.js
│       │   └── auto-refresh.js
│       │
│       ├── utils/
│       │   └── localStorage-recovery.js
│       │
│       └── theme.js
│
└── css/
    ├── main.css               # Feuille principale
    ├── base.css               # Reset et base
    ├── modern-theme.css       # Thème moderne
    ├── compact-mode.css       # Mode Excel compact
    │
    ├── components/
    │   ├── header.css
    │   ├── navigation.css
    │   ├── tables.css
    │   ├── forms.css
    │   ├── modals.css
    │   ├── kanban.css
    │   ├── charts.css
    │   ├── stats.css
    │   └── timeline.css
    │
    └── themes/
        └── modern-industrial.css
```

## 🔌 Architecture de données

### Store global (`js/store.js`)

État centralisé de type Zustand/Redux.

```javascript
const store = {
  // Données chargées
  iw37nData: [],
  iw38Data: [],
  tpaaData: [],
  psvData: [],
  // ... 80+ modules

  // État UI
  currentPage: 'dashboard',
  filters: {},
  selectedItems: [],

  // Métadonnées
  lastUpdated: null,
  isConnected: false
};
```

### Communication Socket.IO (`js/socket.js`)

**Connexion :**
```javascript
const socket = io();
```

**Charger des données :**
```javascript
socket.emit('load:iw37n');
socket.on('data:loaded', (data) => {
  store.iw37nData = data;
  renderView();
});
```

**Sauvegarder des données :**
```javascript
socket.emit('save:iw37n', updatedData);
socket.on('data:saved', () => {
  showNotification('Sauvegardé !');
});
```

**Recevoir mises à jour temps réel :**
```javascript
socket.on('data:updated:iw37n', (newData) => {
  store.iw37nData = newData;
  renderView();
});
```

### Actions (`js/actions.js`)

Fonctions utilitaires pour émettre des événements Socket.IO.

```javascript
import { loadData, saveData, updateTask } from './actions.js';

// Charger un module
await loadData('iw37n');

// Sauvegarder un module
await saveData('iw37n', data);

// Mettre à jour une tâche
await updateTask(taskId, { statut: 'En cours' });
```

## 🎨 Système de styles

### CSS modulaire

**Point d'entrée :** `css/main.css` importe tous les composants.

**Ordre de chargement :**
1. `base.css` - Reset CSS et variables
2. `modern-theme.css` - Thème principal
3. `components/*.css` - Styles par composant
4. `compact-mode.css` - Mode compact (optionnel)

### Variables CSS

Définies dans `base.css` :

```css
:root {
  --primary-color: #2c5f8d;
  --secondary-color: #4a90c2;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --dark-bg: #1a1a2e;
  --light-bg: #f8f9fa;
  --border-radius: 8px;
  --transition-speed: 0.3s;
}
```

### Thèmes

**Actuel :** `modern-industrial.css`
- Design industriel moderne
- Couleurs sombres/métalliques
- Icônes Font Awesome

**Mode compact :**
- Activé via `compact-mode.css`
- Style Excel-like
- Densité d'information maximale

## 📦 Modules de données

### Format standard

Chaque module de données suit ce pattern :

```javascript
// iw37n-data.js
export default class IW37NData {
  constructor() {
    this.moduleName = 'iw37n';
    this.data = [];
  }

  async load() {
    socket.emit('load:iw37n');
    return new Promise((resolve) => {
      socket.once('data:loaded', (data) => {
        this.data = data;
        resolve(data);
      });
    });
  }

  async save(newData) {
    socket.emit('save:iw37n', newData);
    return new Promise((resolve) => {
      socket.once('data:saved', () => {
        this.data = newData;
        resolve();
      });
    });
  }

  find(criteria) {
    return this.data.filter(item => /* ... */);
  }

  add(item) {
    this.data.push(item);
    return this.save(this.data);
  }

  update(id, updates) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      return this.save(this.data);
    }
  }

  remove(id) {
    this.data = this.data.filter(item => item.id !== id);
    return this.save(this.data);
  }
}
```

### Modules disponibles

**Données de base :**
- `iw37n-data.js` - IW37N
- `iw38-data.js` - IW38
- `tpaa-data.js` - TPAA
- `pw-data.js` - PW
- `psv-data.js` - PSV

**Ressources :**
- `entrepreneur-data.js` - Entrepreneurs
- `pieces-data.js` - Pièces
- `consommables-data.js` - Consommables
- `approvisionnement-data.js` - Approvisionnement

**Planification :**
- `plans-entretien.js` - Plans d'entretien
- `strategie-data.js` - Stratégie
- `revision-travaux-data.js` - Révision travaux

**Tâches spécifiques (T21-T72) :**
- `t33-priorisation-data.js` - Priorisation T33
- `t40-entrepreneurs-data.js` - Entrepreneurs T40
- `t55-devis.js` - Devis T55
- `t57-equipements-hauteur.js` - Équipements hauteur
- `t60-long-delai.js` - Long délai pièces
- `t72-suivi-cout.js` - Suivi coûts
- Et 20+ autres modules...

## 🎨 Modules UI

### Dashboard (`ui/dashboard-*.js`)

**dashboard-modals.js :**
- Modales pour création/édition tâches
- Formulaires dynamiques

**dashboard-actions.js :**
- Actions rapides (compléter, archiver, dupliquer)
- Gestion des statuts

**dashboard-filters.js :**
- Filtres par statut, responsable, priorité
- Recherche textuelle

**dashboard-charts.js :**
- Graphiques Chart.js
- Distribution des tâches
- Timeline de progression

### Composants réutilisables

**calendar.js :**
```javascript
import Calendar from './modules/ui/calendar.js';

const cal = new Calendar('#calendar-container');
cal.render(events);
cal.on('dateSelected', (date) => {
  // ...
});
```

**drag-drop.js :**
```javascript
import DragDrop from './modules/ui/drag-drop.js';

const dd = new DragDrop('.kanban-column');
dd.on('dropped', (itemId, newColumn) => {
  updateTaskStatus(itemId, newColumn);
});
```

**timeline.js :**
```javascript
import Timeline from './modules/ui/timeline.js';

const timeline = new Timeline('#timeline');
timeline.render(tasks);
```

## 📊 Graphiques (Chart.js)

### Configuration

Chargé via CDN dans `lib-loader.js`.

### Utilisation

```javascript
import { createPieChart, createBarChart, createLineChart } from './modules/charts/charts.js';

// Graphique en camembert
createPieChart('myCanvas', {
  labels: ['Complété', 'En cours', 'En attente'],
  data: [45, 30, 25],
  colors: ['#27ae60', '#f39c12', '#e74c3c']
});

// Graphique en barres
createBarChart('myCanvas', {
  labels: ['Sem 1', 'Sem 2', 'Sem 3'],
  datasets: [
    { label: 'Tâches complétées', data: [12, 19, 15] }
  ]
});

// Graphique linéaire
createLineChart('myCanvas', {
  labels: dates,
  datasets: [
    { label: 'Progression', data: progressData }
  ]
});
```

## 📁 Import/Export Excel

### Import (`import-export/excel-import.js`)

```javascript
import { importExcel } from './modules/import-export/excel-import.js';

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const data = await importExcel(file, {
    sheet: 'Feuil1',
    headerRow: 1,
    mapping: {
      'Nom': 'name',
      'Description': 'description',
      'Statut': 'status'
    }
  });

  await saveData('moduleName', data);
});
```

### Export (`import-export/excel-export.js`)

```javascript
import { exportToExcel } from './modules/import-export/excel-export.js';

exportButton.addEventListener('click', () => {
  exportToExcel(data, {
    filename: 'export-taches.xlsx',
    sheetName: 'Tâches',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Titre', key: 'title' },
      { header: 'Statut', key: 'status' }
    ]
  });
});
```

## 📄 Export PDF

### Utilisation (`export/pdf-export.js`)

```javascript
import { exportToPDF } from './modules/export/pdf-export.js';

exportPDFButton.addEventListener('click', () => {
  exportToPDF({
    title: 'Rapport de tâches',
    subtitle: 'Semaine 45 - 2025',
    data: tasks,
    template: 'table', // ou 'list', 'custom'
    columns: ['id', 'title', 'status', 'responsable']
  });
});
```

## 🔄 Synchronisation temps réel

### Auto-refresh (`sync/auto-refresh.js`)

Rafraîchissement automatique des données toutes les X secondes.

```javascript
import AutoRefresh from './modules/sync/auto-refresh.js';

const autoRefresh = new AutoRefresh({
  interval: 30000, // 30 secondes
  modules: ['iw37n', 'iw38', 'tpaa']
});

autoRefresh.start();
```

### Upload service (`sync/upload-service.js`)

Upload de fichiers avec progress bar.

```javascript
import UploadService from './modules/sync/upload-service.js';

const uploader = new UploadService();

uploader.upload(file, {
  type: 'pdf', // ou 'drawing', 'document'
  onProgress: (percent) => {
    progressBar.style.width = percent + '%';
  },
  onComplete: (response) => {
    console.log('Uploadé:', response.path);
  },
  onError: (error) => {
    alert('Erreur: ' + error.message);
  }
});
```

## 🎭 Gestion du thème

### Theme Manager (`modules/theme.js`)

```javascript
import ThemeManager from './modules/theme.js';

const theme = new ThemeManager();

// Changer le thème
theme.setTheme('dark'); // ou 'light', 'industrial'

// Mode compact
theme.setCompactMode(true);

// Obtenir le thème actuel
const current = theme.getCurrentTheme();
```

## 🛠️ Utilitaires

### localStorage Recovery (`utils/localStorage-recovery.js`)

Récupération des données localStorage en cas de crash.

```javascript
import { recoverData, saveToLocalStorage } from './modules/utils/localStorage-recovery.js';

// Sauvegarder en localStorage
saveToLocalStorage('myModule', data);

// Récupérer depuis localStorage
const recovered = recoverData('myModule');
```

## 📚 Bibliothèques externes (CDN)

Chargées via `js/lib-loader.js` :

- **Chart.js 3.9.1** - Graphiques
- **chartjs-adapter-date-fns** - Adapter dates
- **XLSX 0.18.5** - Excel
- **jsPDF 2.5.1** - PDF
- **PDF.js 3.11.174** - Lecture PDF
- **Socket.IO Client** - WebSocket
- **Font Awesome** - Icônes

## 🔍 Conventions de code

### Nommage

**Fichiers :**
- `kebab-case.js` pour tous les fichiers
- Suffixe `-data.js` pour modules de données
- Suffixe `-ui.js` pour modules UI
- Suffixe `-manager.js` pour gestionnaires

**Variables :**
```javascript
// camelCase pour variables et fonctions
const myVariable = 'value';
function myFunction() {}

// PascalCase pour classes
class MyClass {}

// UPPER_SNAKE_CASE pour constantes
const MAX_ITEMS = 100;
```

### Structure de module

```javascript
// Import
import dependency from './dependency.js';

// Classe ou fonctions
export default class MyModule {
  constructor() {
    // ...
  }
}

// Ou export nommé
export function myFunction() {
  // ...
}
```

## 🐛 Débogage

### Console

```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'true');

// Afficher l'état du store
console.log('Store:', store);

// Vérifier connexion Socket.IO
console.log('Connecté:', socket.connected);
```

### Outils développeur

**Network tab :**
- Vérifier requêtes Socket.IO (WS)
- Vérifier chargement assets

**Console tab :**
- Erreurs JavaScript
- Logs applicatifs

**Application tab :**
- localStorage
- sessionStorage

## 🔒 Bonnes pratiques

1. **Toujours valider les données avant sauvegarde**
2. **Gérer les erreurs Socket.IO**
   ```javascript
   socket.on('error', (error) => {
     console.error('Erreur:', error);
     alert('Une erreur est survenue');
   });
   ```
3. **Afficher feedback utilisateur (toasts/notifications)**
4. **Utiliser loading states pendant chargement**
5. **Déconnecter Socket.IO en quittant la page**
   ```javascript
   window.addEventListener('beforeunload', () => {
     socket.disconnect();
   });
   ```

## 📖 Ressources

- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [Chart.js](https://www.chartjs.org/docs/latest/)
- [SheetJS (XLSX)](https://docs.sheetjs.com/)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Font Awesome](https://fontawesome.com/)

---

**Dernière mise à jour :** 2025-11-15
**Version :** 1.0.0
