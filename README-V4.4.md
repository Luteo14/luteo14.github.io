# LUTEO14 V4.4 — SPORT Consolidation

## Principales évolutions
- Navigation SPORT unique, avec page Objectifs dédiée.
- Suppression du bloc Compétitions du Dashboard et des libellés techniques V3.6/V3.7.
- Accueil : vignette Photothèque à la place de Trail et suppression du bloc photothèque redondant.
- Mon Coach aligné sur le Design System SPORT, sans sous-menu concurrent ni actualisation Python locale.
- Graphiques Dashboard, Synthèse et Mon Coach unifiés avec Chart.js + `/sport/js/charts.js`.
- Synthèse enrichie : volume 28 j, sommeil, VFC, Body Battery, graphiques entraînement/récupération et prochaine compétition.
- Mes données devient le point unique de synchronisation Strava + Garmin.
- Objectifs centralisables dans Cloudflare D1 via le Worker Garmin Cloud protégé par Access.

## Déploiement site
Copier les dossiers `sport/` et les fichiers concernés dans le repository GitHub Pages puis publier.

## Activation des objectifs D1
Depuis `garmin-cloud-worker` :

```powershell
npx wrangler d1 execute luteo-pro-docs --remote --file=./migrations/002_sport_objectives.sql
npx wrangler deploy
```

La clé Garmin et la configuration Access existantes sont conservées.

## Validation
1. Vérifier le menu unique sur Accueil, Dashboard, Mon Coach, Synthèse, Objectifs, Mes données.
2. Vérifier l'absence du bloc Objectifs dans Dashboard.
3. Vérifier les graphiques sur 7/28 jours dans Mon Coach.
4. Synchroniser Strava/Garmin depuis Mes données.
5. Ouvrir Objectifs, cliquer `Synchroniser mes objectifs`, s'authentifier via Access, puis vérifier le même objectif depuis un second appareil.
