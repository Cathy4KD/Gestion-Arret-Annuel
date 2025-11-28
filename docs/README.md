# Gestion Arrêt Annuel - Version Firebase

Cette version de l'application utilise **Firebase Firestore** pour stocker les données, permettant un déploiement sur GitHub Pages.

## 🚀 Déploiement

### Étape 1: Migrer les données

1. Ouvrez `migrate-to-firebase.html` dans votre navigateur
2. Sélectionnez le fichier `server/data/application-data.json`
3. Cliquez sur "Lancer la migration"
4. Attendez que la migration soit terminée

### Étape 2: Activer GitHub Pages

1. Allez dans les **Settings** du repository GitHub
2. Dans le menu latéral, cliquez sur **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **/(root)** ou **/client**
5. Cliquez **Save**

### Étape 3: Accéder à l'application

Votre application sera disponible à:
`https://cathy4kd.github.io/Gestion-Arret-Annuel/client/index-firebase.html`

## 📁 Structure des fichiers

```
client/
├── index.html              # Version locale (serveur Node.js)
├── index-firebase.html     # Version Firebase (GitHub Pages)
├── js/
│   ├── app.js              # Version locale
│   ├── app-firebase.js     # Version Firebase
│   ├── firebase-config.js  # Configuration Firebase
│   └── services/
│       └── firebase-data-service.js  # Service Firebase
└── ...

migrate-to-firebase.html    # Outil de migration des données
```

## 🔧 Configuration Firebase

Le projet Firebase utilisé:
- **Projet**: gestion-arret-annuel
- **Base de données**: Firestore
- **Mode**: Test (30 jours)

⚠️ **Important**: Pensez à configurer les règles de sécurité Firestore avant la mise en production.

## 📝 Notes

- Les fichiers uploadés (templates, etc.) ne sont pas synchronisés avec Firebase Storage
- La version Firebase ne nécessite pas de serveur Node.js
- Les données sont synchronisées en temps réel entre tous les utilisateurs
