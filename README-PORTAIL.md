# LUTEO14 — Portail V1.4

- `/` : accueil Pro / Sport
- `/pro/` : page Pro en construction
- `/sport/` : application RUN // DATA existante, y compris Performance, Plan et Connexion Strava.

## Installation
Copier les fichiers du ZIP à la racine du dépôt local `luteo14.github.io` avec GitHub Desktop. Les anciens fichiers `css/`, `js/`, `data/` à la racine ne sont plus utilisés ; ne les supprimer qu'après validation de `/sport/`. Conserver `.git`, `.gitignore`, `activities.csv`, les secrets et la configuration locale existante.

## OAuth Strava
Le Worker existant renvoie à `https://luteo14.github.io/?strava=connected`. Le nouvel accueil redirige alors automatiquement vers `/sport/?strava=connected` : aucune modification de `FRONTEND_URL` ou redéploiement du Worker n'est nécessaire.

## Données et synchronisation
Pour régénérer les données après un nouvel export CSV, lancer `python prepare_data.py` depuis la racine. Le script existant écrit éventuellement dans `data/` à la racine : recopier les nouveaux `activities.json` et `activities-public.csv` dans `sport/data/` avant de publier.

## Test local
`python -m http.server 8000` puis `http://localhost:8000/`. Les liens absolus `/sport/` et `/pro/` fonctionnent aussi en local.
