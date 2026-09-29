# RUN // DATA — Dashboard Strava

Dashboard statique et responsive pour visualiser un historique Strava. Il est prêt pour **GitHub Pages** et ne nécessite ni serveur, ni base de données.

## Ce que contient le projet

- KPI : distance, séances, temps, D+, moyenne par sortie et par semaine
- filtres par année
- volume mensuel
- évolution annuelle
- dénivelé annuel
- nombre de séances
- régularité sur 12 semaines
- répartition des sports
- tableau des activités récentes

Le fichier `data/activities-public.csv` est une version **sanitisée** de l'export Strava : noms d'activités, coordonnées, fichiers FIT, notes privées et matériel ne sont pas publiés. Le site lit `data/activities.json`.

## Publication sur GitHub Pages

1. Créez un nouveau dépôt GitHub, par exemple `running-dashboard`.
2. Décompressez ce projet et placez son contenu à la racine du dépôt.
3. Exécutez :

```bash
git init
git add .
git commit -m "Initial Strava dashboard"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/running-dashboard.git
git push -u origin main
```

4. Dans GitHub : **Settings → Pages**.
5. Dans **Build and deployment**, choisissez **Deploy from a branch**.
6. Branche : `main`, dossier : `/ (root)`, puis **Save**.
7. Après quelques minutes, le site sera disponible à `https://VOTRE-COMPTE.github.io/running-dashboard/`.

## Test local

Le navigateur bloque parfois `fetch()` quand `index.html` est ouvert directement. Utilisez un petit serveur local :

```bash
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.

## Mettre les données à jour

1. Placez le nouvel export Strava à la racine sous le nom `activities.csv` (il est ignoré par Git).
2. Installez la dépendance une fois : `pip install -r requirements.txt`.
3. Lancez : `python prepare_data.py`.
4. Commit/push uniquement les fichiers générés dans `data/`.

## Confidentialité

Ne publiez pas votre export Strava brut dans un dépôt public : il peut contenir noms, traces/fichiers d'activités, habitudes horaires, matériel et autres informations personnelles.

## Stack

HTML5 · CSS3 · JavaScript · Chart.js (CDN) · GitHub Pages
