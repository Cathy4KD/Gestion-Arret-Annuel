# Dossier data-sources

Ce dossier contient les fichiers sources de données qui peuvent être chargés automatiquement au démarrage du serveur.

## Fichiers supportés

### IW37N.xlsx
**Chargement:** Automatique au démarrage si le module `iw37nData` est vide
**Format:** Fichier Excel avec les colonnes IW37N standard
**Script:** `server/scripts/loadIw37nAtStartup.js`

## Utilisation

1. Placez vos fichiers Excel source dans ce dossier
2. Le serveur les chargera automatiquement au démarrage
3. Les données seront sauvegardées dans `server/data/application-data.json`

## Notes

- Les fichiers source sont en lecture seule (non modifiés par l'application)
- Le chargement automatique ne se fait QUE si les données sont vides
- Pour recharger, videz d'abord le module correspondant via l'interface
