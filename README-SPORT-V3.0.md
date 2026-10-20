# LUTEO14 SPORT V3.0 — Mise à jour incrémentale

## Installation
Copier le contenu de cette archive à la racine du dépôt `luteo14.github.io`, en conservant les fichiers existants, notamment `sport/js/app.js`, `sport/js/config.js`, `sport/css/style.css`, `sport/data/`, `sport/marathon/`, les fichiers PRO et les Workers.

## Nouvelle navigation
- `/sport/` : nouvel accueil Univers Running (8 domaines illustrés).
- `/sport/dashboard/` : ancien RUN // DATA, avec ses onglets Strava, Performance et Plan.
- `/sport/allure/` : simulateur existant.
- `/sport/marathon/` : préparation marathon existante.
- `/sport/photos/` : galerie personnelle (20 photos).
- `/sport/univers/` : redirection vers `/sport/`.

## Important
La page dashboard est déplacée dans `sport/dashboard/index.html` avec `<base href="/sport/">` afin que les ressources existantes continuent à se charger. Si le code `app.js` utilise des URL absolues ou une logique dépendante de `location.pathname`, tester l'ensemble des fonctionnalités. Ne pas supprimer les fichiers historiques sans vérification.

Pour afficher la navigation commune sur la page Marathon existante, ajouter avant `</body>` : `<script src="/sport/js/common-nav.js"></script>`. La page n'est pas remplacée dans cette archive afin de préserver les checklists et la nutrition.

## Photos et confidentialité
Les 20 photos personnelles sont converties en WebP. Toute image publiée sur GitHub Pages est accessible publiquement. Vérifier avant publication les personnes, lieux et autres éléments visibles sur les clichés.

## Contrôles après déploiement
1. Accueil SPORT et huit illustrations visibles.
2. Galerie de 20 photos, agrandissement et fermeture.
3. Dashboard et graphiques Strava.
4. `?tab=performance`, `?tab=training`, `?tab=strava`.
5. Simulateur et page Marathon.
6. Connexion Strava et données locales.
7. Navigation mobile et retour SPORT.

Aucune modification de PRO, Cloudflare, R2, D1 ou OAuth.
