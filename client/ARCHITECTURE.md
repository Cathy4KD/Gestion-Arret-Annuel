# Architecture Client - Application Gestionnaire d'Arrêt d'Aciérie

## 📊 Statistiques
- **Pages HTML:** 131 pages
- **Fichiers JavaScript:** 128 modules
- **Fichiers CSS:** 14 feuilles de style

## 📁 Structure des dossiers

```
client/
├── index.html                 # Point d'entrée principal
├── js/
│   ├── main.js               # Module principal d'initialisation
│   ├── socket.js             # Gestion Socket.IO
│   ├── store.js              # État global (Zustand-like)
│   ├── actions.js            # Actions Socket.IO
│   ├── ui.js                 # Manipulation DOM
│   ├── lib-loader.js         # Chargement bibliothèques
│   ├── textarea-resize-manager.js
│   └── modules/
│       ├── data/             # ~40 modules de données
│       ├── ui/               # ~15 modules UI
│       ├── charts/           # Graphiques
│       ├── import-export/    # Import/Export Excel
│       ├── entities/         # Entités (entrepreneurs, team, ingq)
│       ├── demandes/         # 3 types de demandes
│       ├── plans/            # Gestion des plans
│       ├── psv/              # PSV markers
│       ├── scope/            # Scope markers
│       ├── forms/            # Formulaires
│       ├── tables/           # Tableaux
│       ├── modals/           # Modales
│       ├── sync/             # Synchronisation
│       ├── export/           # Export PDF
│       ├── utils/            # Utilitaires
│       └── theme.js          # Gestion thème
│
├── css/
│   ├── main.css              # Feuille principale
│   ├── base.css              # Styles de base
│   ├── modern-theme.css      # Thème moderne
│   ├── compact-mode.css      # Mode compact (Excel-like)
│   ├── components/           # Composants CSS
│   │   ├── header.css
│   │   ├── navigation.css
│   │   ├── tables.css
│   │   ├── forms.css
│   │   ├── modals.css
│   │   ├── kanban.css
│   │   ├── charts.css
│   │   ├── stats.css
│   │   └── timeline.css
│   └── themes/
│       └── modern-industrial.css
│
└── components/
    └── pages/                # 131 pages HTML
        ├── index.html
        ├── execution.html
        ├── historique.html
        ├── contacts.html
        ├── pieces.html
        ├── detail-*.html     # ~100 pages détails (tâches, modules)
        └── ...

```

## 🔗 Modules JavaScript par catégorie

### Modules de données (`client/js/modules/data/`)
Gèrent la logique métier et les données:
- `iw37n-data.js`, `iw38-data.js` - Données IW37N/IW38
- `tpaa-data.js`, `pw-data.js` - TPAA/PW
- `psv-data.js` - PSV
- `entrepreneur-data.js` - Entrepreneurs
- `pieces-data.js`, `consommables-data.js` - Pièces/Consommables
- `approvisionnement-data.js` - Approvisionnement
- `t*-*.js` - Modules tâches spécifiques (t21, t25, t30, t33, t40, t55, t57, t60, t72, etc.)
- `settings.js` - Paramètres
- Et ~30 autres modules...

### Modules UI (`client/js/modules/ui/`)
Gèrent l'affichage et l'interaction:
- `dashboard-modals.js`, `dashboard-actions.js`, `dashboard-filters.js`
- `responsable-modal.js`
- `point-presse-ui.js`
- `pieces-page.js`
- `calendar.js`
- `drag-drop.js`
- `devis-manager.js`
- `timeline.js`

### Modules Charts (`client/js/modules/charts/`)
- `charts.js` - Gestion générale des graphiques
- `dashboard-charts.js` - Graphiques du dashboard

### Modules Import/Export
- `excel-import.js` - Import fichiers Excel
- `excel-export.js` - Export vers Excel
- `pdf-export.js` - Export PDF

### Modules Entities
- `entrepreneurs.js` - Gestion entrepreneurs
- `team.js` - Gestion équipe
- `ingq.js` - INGQ

### Modules Demandes
- `echafaudages.js` - Demandes échafaudages
- `grues-nacelles.js` - Demandes grues/nacelles
- `verrouillage.js` - Demandes verrouillage

### Modules Plans
- `plan-renderer.js` - Rendu des plans
- `plan-suivis-journaliers.js` - Plans de suivi

### Autres modules importants
- `psv/psv-plan-markers.js` - Markers PSV
- `scope/scope-markers.js` - Markers scope
- `sync/upload-service.js`, `sync/auto-refresh.js` - Synchronisation
- `utils/localStorage-recovery.js` - Récupération données

## 📚 Bibliothèques externes (CDN)

### Chargées depuis CDN:
- **Chart.js 3.9.1** - Visualisations graphiques
- **chartjs-adapter-date-fns** - Adapter dates pour Chart.js
- **XLSX 0.18.5** - Manipulation fichiers Excel
- **jsPDF 2.5.1** - Génération PDF
- **PDF.js 3.11.174** - Lecture/conversion PDF
- **Socket.IO Client** - Communication temps réel

## 🎨 Système de styles

### Architecture CSS modulaire:
1. **base.css** - Reset et styles de base
2. **main.css** - Orchestrateur, importe tous les composants
3. **modern-theme.css** - Thème principal
4. **compact-mode.css** - Mode Excel compact
5. **components/** - Styles par composant
6. **themes/** - Thèmes alternatifs

### Versioning:
Les CSS utilisent un query string pour le cache: `?v=20251103-002`

## 🔄 Flux de données

```
1. Socket.IO (socket.js) ← → Serveur
2. Store (store.js) - État global
3. Actions (actions.js) - Émission événements
4. Modules data/ - Logique métier
5. Modules ui/ - Affichage
6. Pages HTML - Rendu final
```

## 📄 Pages principales

### Pages de navigation:
- `index.html` - Tableau de bord principal
- `execution.html` - Suivi exécution
- `historique.html` - Historique
- `pieces.html` - Gestion pièces
- `contacts.html` - Contacts

### Pages de détail (detail-*.html):
- Générées dynamiquement pour chaque module/tâche
- Format: `detail-[nom-module].html` ou `detail-t[XX].html`
- ~100 pages de détail différentes

### Pages spécialisées:
- `point-presse-*.html` - Points de presse
- `demandes-*.html` - Demandes (échafaudages, grues, verrouillage)
- `plan-suivis-journaliers.html` - Plans de suivi
- `psv_caracteristiques.html` - Caractéristiques PSV
- `iw37n.html`, `iw38.html` - IW37N/IW38

## 🔍 Conventions de nommage

### Fichiers JavaScript:
- `kebab-case.js` pour tous les fichiers
- Suffixe `-data.js` pour modules de données
- Suffixe `-ui.js` pour modules UI
- Suffixe `-manager.js` pour gestionnaires

### Fichiers HTML:
- `kebab-case.html`
- Préfixe `detail-` pour pages de détail
- Préfixe `demandes-` pour formulaires de demandes

### Fichiers CSS:
- `kebab-case.css`
- Un fichier par composant dans `components/`

## 📦 Optimisations possibles

### Actuellement:
✅ CDN pour bibliothèques externes
✅ Scripts chargés en `defer`
✅ CSS avec versioning cache
✅ Architecture modulaire

### À considérer:
- [ ] Bundling des modules JS (Webpack/Rollup)
- [ ] Minification CSS/JS
- [ ] Tree-shaking pour réduire la taille
- [ ] Lazy loading des pages de détail
- [ ] Service Worker (PWA)
- [ ] Code splitting par route

## 🔗 Points d'entrée

### JavaScript:
- `js/main.js` - Initialisation principale
- Charge tous les modules nécessaires dynamiquement

### CSS:
- `css/main.css` - Point d'entrée CSS
- Importe tous les autres fichiers

### HTML:
- `index.html` - Page d'accueil
- Redirige vers les autres pages via navigation

---

**Date de création:** 2025-11-15
**Version:** 1.0.0
**Mainteneur:** Optimisation automatique
