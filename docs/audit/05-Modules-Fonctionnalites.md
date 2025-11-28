# Audit Complet - Modules et Fonctionnalités

**Date:** 2025-11-23
**Application:** Gestionnaire d'Arrêt d'Aciérie
**Version:** 1.0.0 / 2.0.0

---

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Modules de Données (80+)](#modules-de-données)
3. [Fonctionnalités Principales](#fonctionnalités-principales)
4. [Gestion des Documents](#gestion-des-documents)
5. [Import/Export](#importexport)
6. [Analyses et Rapports](#analyses-et-rapports)
7. [Communication](#communication)
8. [Gestion des Ressources](#gestion-des-ressources)
9. [Suivi et Monitoring](#suivi-et-monitoring)
10. [Workflows Métier](#workflows-métier)

---

## Vue d'Ensemble

L'application gère **80+ modules de données** organisés pour couvrir l'ensemble du cycle de vie d'un arrêt d'aciérie, de la préparation à l'exécution et au suivi.

### Statistiques Modules

| Catégorie | Nombre de Modules | Exemples |
|-----------|------------------|----------|
| **Données SAP/ERP** | 3 | IW37N, IW38, T55 |
| **Préparation** | 5 | Arrêt, TPAA, PW, Protocole |
| **PSV/Sécurité** | 4 | PSV, Espace clos, Travail hauteur, Verrouillage |
| **Approvisionnement** | 6 | Pièces, Consommables, Commandes T30/T60 |
| **Équipements** | 5 | Levage, Nacelles, Location, Inspection |
| **Tâches (T-series)** | 40+ | T21, T22, ..., T139 |
| **Analyses** | 4 | AMDEC, SMED, Suivi coût, Priorisation |
| **Communication** | 3 | Avis syndicaux, Points presse, Avis généraux |
| **Projets & Travaux** | 3 | Projets, Révision travaux, Stratégie |
| **Demandes** | 3 | Échafaudages, Grues/Nacelles, Verrouillage |
| **Équipes & Contacts** | 3 | Équipes, Contacts, Entrepreneurs |
| **Configuration** | 5+ | Settings, Filtres, Allocations |

**Total:** ~80 modules de données

---

## Modules de Données

### 1. Données SAP/ERP

#### IW37N - Ordre de Maintenance SAP

**Module:** `iw37n-data.js` (604 lignes)

**Description:**
Gère les ordres de maintenance issus de SAP (transaction IW37N). C'est la source principale des interventions à réaliser pendant l'arrêt.

**Fonctionnalités:**
- Import fichier Excel IW37N
- Conversion automatique dates Excel → DD.MM.YYYY
- Filtrage multi-critères (Ordre, Design, Poste, Statut)
- Affichage tableau paginé
- Export Excel filtré
- Sélection lignes pour traitement
- Intégration avec autres modules

**Champs principaux:**
```javascript
{
  Ordre: "12345678",
  Design: "Description intervention",
  Poste: "M-001",
  TypeOrdre: "PM01",
  PrioriteOrdre: "2",
  DateDebut: "01.02.2026",
  DateFin: "05.02.2026",
  Statut: "CREE",
  CentreCharge: "CC-MECA",
  GroupePlanif: "PL01",
  Duree: "40",
  Unite: "H",
  Responsable: "Jean Dupont"
}
```

**Intégrations:**
- T51 Soumissions: Lien vers commandes
- T55 Devis: Génération devis entrepreneurs
- AMDEC: Analyse risques par ordre
- Planning: Synchronisation dates

---

#### IW38 - Données Complémentaires

**Module:** `iw38-data.js`

**Description:**
Données complémentaires de maintenance (notifications, historique).

**Fonctionnalités:**
- Import Excel IW38
- Historique interventions
- Notifications techniques
- Lien avec IW37N (par N° Ordre)

---

#### T55 - Devis Entrepreneurs

**Module:** `t55-devis.js` (1463 lignes - LE PLUS VOLUMINEUX!)

**Description:**
Gestion complète des devis pour entrepreneurs externes. Module le plus complet de l'application.

**Fonctionnalités:**
- CRUD complet devis
- Historique complet des modifications
- Corrections et révisions
- Export Excel structuré
- Génération DOCX via templates
- Workflow validation (Brouillon → En cours → Validé → Envoyé)
- Notifications automatiques
- Suivi des réponses
- Comparaison devis

**Structure Devis:**
```javascript
{
  id: "devis-uuid",
  entrepreneur: "ACME Corp",
  titreDevis: "Devis général aciérie",
  specialite: "Électricité",
  lieu: "Section A - Convertisseurs",
  typeContrat: "Contrat principal",

  // Responsables
  approbateur: "Jean Dupont",
  responsable: "Marie Martin",
  verificateur: "Pierre Bernard",

  // Dates
  dates: {
    debutVisites: "2025-11-25",
    remiseSoumission: "2025-12-05",
    adjudication: "2025-12-10",
    listeCognibox: "2025-12-15",
    debutMobilisation: "2025-12-20",
    finMobilisation: "2026-01-10",
    debutArret: "2026-02-01",
    finArret: "2026-02-05",
    demobilisation: "2026-02-10"
  },

  // Dessins
  dessins: [
    {
      numero: "DES-001",
      revision: "B",
      titre: "Schéma électrique principal"
    }
  ],

  // Travaux Convertisseur
  convertisseur: [
    {
      item: "1",
      equipement: "Convertisseur A",
      ordre: "1",
      description: "Réparation convertisseur A",
      materielRTFT: "Non",
      materielEntrepreneur: "Oui",
      dessinsRef: "DES-001"
    }
  ],

  // Travaux Coulée Continue
  couleeContinue: [
    {
      item: "1",
      equipement: "CC-001",
      ordre: "1",
      description: "Maintenance coulée continue",
      materielRTFT: "Oui",
      materielEntrepreneur: "Non",
      dessinsRef: "DES-002"
    }
  ],

  // Remarques
  remarquesGenerales: "Travaux complexes nécessitant expertise",
  corrections: "Aucune correction pour le moment",

  // Métadonnées
  status: "draft|in_progress|validated|sent",
  createdAt: "2025-11-23T10:00:00Z",
  updatedAt: "2025-11-23T10:00:00Z",
  createdBy: "User",
  version: 1
}
```

**Historique:**
Chaque modification est tracée avec:
- Type d'action (création, mise à jour, validation, envoi)
- Utilisateur
- Timestamp
- Données avant/après (diff)

---

### 2. Préparation Arrêt

#### Arrêt Data - Données Principales

**Module:** `arret-data.js` (300+ lignes)

**Description:**
Données centrales de l'arrêt annuel (dates, phases, configuration).

**Structure:**
```javascript
{
  id: "arret-2026",
  nom: "Arrêt Annuel 2026",
  dateDebut: "2026-02-01",
  dateFin: "2026-02-05",
  dureeJours: 5,

  // Phases de préparation
  phases: [
    {
      id: "phase-12-mois",
      nom: "Préparation 12 mois avant",
      semaines: -52,
      taches: [
        {
          id: "t21",
          nom: "Priorisation travaux",
          responsable: "Planificateur Long terme",
          statut: "pending|in_progress|completed",
          avancement: 0,
          dateEcheance: "2025-02-01"
        },
        {
          id: "t22",
          nom: "Stratégie arrêt",
          responsable: "Surintendant entretien",
          statut: "pending",
          avancement: 0,
          dateEcheance: "2025-02-15"
        }
      ]
    },
    {
      id: "phase-6-mois",
      nom: "Préparation 6 mois avant",
      semaines: -26,
      taches: [/* ... */]
    },
    // ... autres phases
  ],

  // Configuration
  config: {
    seuils: {
      budgetTotal: 5000000,
      nbEntrepreneurs: 50,
      nbTechniciens: 200,
      heuresPersonne: 10000
    },
    alertes: {
      retardTache: 7,  // jours
      depassementBudget: 10  // %
    }
  },

  // Statistiques
  stats: {
    totalTaches: 120,
    tachesCompleted: 45,
    avancementGlobal: 37.5,
    budgetDepense: 1850000,
    budgetRestant: 3150000
  }
}
```

---

#### TPAA - Travaux Préparatoires Avant Arrêt

**Module:** `tpaa-data.js`

**Description:**
Travaux à réaliser AVANT l'arrêt pour faciliter l'exécution.

**Exemples:**
- Pré-positionnement matériel
- Nettoyage zones
- Débullonnage équipements
- Préparation accès

---

#### PW - Pre-Work

**Module:** `pw-data.js`

**Description:**
Travaux préalables (similaire à TPAA mais catégorisation différente).

---

#### Protocole Arrêt

**Module:** `protocole-arret-data.js`

**Description:**
Séquence d'arrêt des équipements (ordre critique).

**Structure:**
```javascript
{
  sequences: [
    {
      ordre: 1,
      equipement: "Four électrique #1",
      action: "Arrêt production",
      duree: "2h",
      responsable: "Production",
      prerequis: [],
      suivant: ["seq-2"]
    },
    {
      ordre: 2,
      equipement: "Convertisseur #1",
      action: "Vidange",
      duree: "4h",
      responsable: "Mécanique",
      prerequis: ["seq-1"],
      suivant: ["seq-3", "seq-4"]
    }
  ]
}
```

---

### 3. PSV / Sécurité

#### PSV Data - Pressure Safety Valves

**Module:** `psv-data.js` (800 lignes)

**Description:**
Gestion des soupapes de sécurité (PSV). Module critique pour la sécurité.

**Fonctionnalités:**
- Inventaire complet PSV
- Planification inspections
- Historique calibrations
- Suivi certifications
- Plans avec marqueurs visuels
- Alertes expiration

**Structure PSV:**
```javascript
{
  id: "PSV-001",
  tag: "PSV-12345",
  designation: "Soupape sécurité four",
  equipement: "Four électrique #1",
  zone: "Zone A",
  pression: 150,  // psi
  temperature: 650,  // °C

  // Inspection
  dernierInspection: "2024-02-01",
  prochaineInspection: "2026-02-01",
  statut: "OK|Attention|Expiré",

  // Calibration
  dernierCalibration: "2024-02-01",
  prochainCalibration: "2027-02-01",

  // Plan
  planId: "plan-zone-a",
  positionX: 120,
  positionY: 340,

  // Documents
  certificat: "cert-psv-001.pdf",
  ficheData: "data-psv-001.pdf"
}
```

---

#### Espace Clos

**Module:** `espace-clos-data.js` (876 lignes)

**Description:**
Gestion des espaces confinés et permis de travail associés.

**Fonctionnalités:**
- Inventaire espaces clos
- Permis de travail
- Équipements requis (détecteurs, ventilation)
- Procédures de sauvetage
- Formation personnel
- Tests atmosphère

---

#### Travail en Hauteur

**Module:** `travail-hauteur-data.js`

**Description:**
Équipements et procédures pour travail en hauteur.

**Contenu:**
- Échafaudages
- Nacelles
- Harnais et ancrages
- Inspections pré-utilisation
- Certifications

---

#### Demandes de Verrouillage

**Module:** `demandes-verrouillage.js`

**Description:**
Système LOTO (Lockout/Tagout) pour isolation énergies.

**Structure Demande:**
```javascript
{
  id: "vr-001",
  equipement: "Convertisseur A",
  demandeur: "Jean Dupont",
  dateDebut: "2026-02-01T08:00",
  dateFin: "2026-02-01T17:00",

  // Énergies à verrouiller
  energies: [
    {
      type: "Électrique",
      source: "Disjoncteur D-123",
      procedure: "PROC-ELEC-001",
      cadenas: "LOCK-001",
      responsable: "Électricien Chef"
    },
    {
      type: "Mécanique",
      source: "Vanne V-456",
      procedure: "PROC-MECA-002",
      cadenas: "LOCK-002",
      responsable: "Mécanicien Chef"
    }
  ],

  statut: "demandé|approuvé|actif|libéré",
  approbateur: "Superviseur Sécurité"
}
```

---

### 4. Approvisionnement

#### Pièces de Rechange

**Module:** `pieces-data.js`

**Description:**
Inventaire et gestion des pièces de rechange.

**Fonctionnalités:**
- Catalogue pièces
- Stock disponible
- Demandes d'achat
- Suivi livraisons
- Localisation magasin

**Structure:**
```javascript
{
  id: "piece-001",
  reference: "REF-12345",
  designation: "Roulement SKF 6308",
  equipement: "Pompe P-001",

  // Stock
  stockDisponible: 5,
  stockMin: 2,
  stockMax: 10,
  localisation: "Magasin A - Allée 3 - Étagère 5",

  // Commande
  fournisseur: "SKF Canada",
  delaiLivraison: 14,  // jours
  prixUnitaire: 125.50,

  // Utilisation arrêt
  quantiteRequise: 3,
  quantiteCommande: 5,
  statut: "disponible|commandé|reçu|installé"
}
```

---

#### Consommables

**Module:** `consommables-data.js`

**Description:**
Matériaux consommables (boulons, joints, graisse, etc.).

**Catégories:**
- Boulonnerie
- Joints et garnitures
- Lubrifiants
- Électrodes soudure
- Produits chimiques
- EPI (Équipements Protection Individuelle)

---

#### Commandes T30 / T60

**Modules:** `t30-commandes-approvisionnement-data.js`, `t60-commandes-data.js`

**Description:**
Suivi des commandes d'approvisionnement avec délais.

**T30:** Commandes 30 jours avant arrêt
**T60:** Commandes 60 jours avant arrêt

---

### 5. Analyses

#### AMDEC (FMEA)

**Module:** `amdec-data.js` (830 lignes)

**Description:**
Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité.

**Méthodologie:**
- Identification défaillances potentielles
- Évaluation gravité (G)
- Évaluation occurrence (O)
- Évaluation détection (D)
- Calcul criticité (C = G × O × D)
- Priorisation actions

**Structure:**
```javascript
{
  id: "amdec-001",
  equipement: "Convertisseur A",
  fonction: "Conversion électrique",

  // Défaillance
  modeDefaillance: "Surchauffe thyristors",
  causesPotentielles: "Refroidissement insuffisant",
  effets: "Arrêt production",

  // Évaluation
  gravite: 8,  // 1-10
  occurrence: 5,  // 1-10
  detection: 6,  // 1-10
  criticite: 240,  // G × O × D

  // Actions
  actionsPreventives: "Inspection système refroidissement",
  responsable: "Mécanicien Chef",
  echeance: "2026-01-15",
  statut: "pending|in_progress|completed"
}
```

---

#### SMED

**Module:** `smed-data.js`

**Description:**
Single Minute Exchange of Die - Réduction temps de changement.

**Objectif:**
Optimiser les interventions pour réduire durée d'arrêt.

**Phases:**
1. Analyse temps actuel
2. Identification opérations internes/externes
3. Conversion interne → externe
4. Optimisation opérations
5. Standardisation

---

#### Suivi Coût

**Module:** `t72-suivi-cout.js` (756 lignes)

**Description:**
Suivi budgétaire détaillé de l'arrêt.

**Catégories:**
- Main d'œuvre interne
- Main d'œuvre externe (entrepreneurs)
- Matériel et équipements
- Pièces de rechange
- Consommables
- Location équipements
- Services (inspection, certification, etc.)
- Imprévus

**Rapports:**
- Budget vs Réel
- Écarts par catégorie
- Tendances
- Prévisions fin d'arrêt

---

### 6. Communication

#### Avis Syndicaux

**Module:** `avis-data.js`, `t25-avis-data.js` (616 lignes)

**Description:**
Génération et envoi d'avis syndicaux pour travaux entrepreneurs.

**Workflow:**
1. **Création avis:**
   - Entrepreneur
   - Description travaux
   - Dates et heures
   - Nombre techniciens
   - Heures-personne

2. **Génération document:**
   - Template DOCX
   - Remplissage automatique
   - Format standardisé

3. **Validation:**
   - Approbation responsable
   - Vérification conformité

4. **Envoi:**
   - Email automatique via Outlook
   - Pièce jointe DOCX
   - Accusé réception

**Types d'avis:**
- Contrat principal
- Sous-contrat
- Travaux mineurs

---

#### Points de Presse

**Module:** `point-presse-data.js` (418+ lignes)

**Description:**
Communication interne sur avancement de l'arrêt.

**Contenu:**
- Résumé hebdomadaire
- Avancement global
- Défis et solutions
- Faits saillants
- Photos
- Prochaines étapes

---

### 7. Gestion des Ressources

#### Entrepreneurs

**Module:** `t40-entrepreneurs-data.js` (210 lignes)

**Description:**
Base de données entrepreneurs externes.

**Informations:**
- Nom entreprise
- Spécialités
- Coordonnées
- Certifications
- Historique performance
- Taux horaires
- Disponibilité

---

#### Équipes

**Module:** `team-data.js`

**Description:**
Gestion des équipes internes.

**Structure:**
```javascript
{
  id: "team-001",
  nom: "Équipe Mécanique A",
  superviseur: "Jean Dupont",
  membres: [
    {
      nom: "Pierre Martin",
      role: "Mécanicien",
      specialite: "Hydraulique",
      niveau: "Compagnon"
    }
  ],
  quart: "Jour (7h-19h)",
  zone: "Zone A"
}
```

---

#### Contacts

**Module:** `contacts-manager.js`

**Description:**
Carnet d'adresses complet.

**Catégories:**
- Personnel interne
- Entrepreneurs
- Fournisseurs
- Services d'urgence
- Autorités
- Certifications

---

### 8. Workflows Métier

#### Workflow Préparation Arrêt

```
12 MOIS AVANT
├─ T21: Priorisation travaux
├─ T22: Stratégie arrêt
├─ T24: Identification besoins
└─ T27: Budget prévisionnel

9 MOIS AVANT
├─ T29: Appels d'offres
├─ T30: Approvisionnement long délai
└─ T33: Priorisation finale

6 MOIS AVANT
├─ T40: Sélection entrepreneurs
├─ T51: Soumissions
├─ T55: Devis finaux
└─ T60: Commandes matériel

3 MOIS AVANT
├─ T63: Attribution zones
├─ T72: Révision budget
├─ AMDEC: Analyse risques
└─ Protocole arrêt: Finalisation

1 MOIS AVANT
├─ T88: Confirmation long délai
├─ T25: Avis syndicaux
├─ Mobilisation équipes
└─ Pré-positionnement matériel

PENDANT ARRÊT
├─ Exécution travaux
├─ Suivi quotidien
├─ Points de presse
└─ Ajustements

APRÈS ARRÊT
├─ Démobilisation
├─ Bilan
├─ Capitalisation
└─ Améliorations
```

---

## Conclusion

L'application couvre **l'intégralité du cycle de vie** d'un arrêt d'aciérie avec:

✅ **80+ modules de données** couvrant tous les aspects
✅ **Workflows métier** bien définis et structurés
✅ **Intégrations** entre modules pour cohérence
✅ **Traçabilité** complète des actions
✅ **Communication** automatisée (avis, emails)
✅ **Analyses** avancées (AMDEC, SMED, coûts)
✅ **Sécurité** prioritaire (PSV, espaces clos, LOTO)
✅ **Approvisionnement** anticipé et suivi
✅ **Rapports** visuels et exports multiples

---

**Document suivant:** [06-Securite-Performance.md](./06-Securite-Performance.md)
