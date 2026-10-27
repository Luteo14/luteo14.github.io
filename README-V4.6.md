# LUTEO14 V4.6 — Focus personnalisé

## Livrables
- `sport/coach/index.html` : cartes « Mon état du jour », « Ma semaine d’entraînement », panneau de personnalisation.
- `sport/coach/coach.js` : tendances comparées, ressenti quotidien, suivi hebdomadaire Strava, préférences.
- `sport/assets/sport-unified.css` : mise en page responsive.

## Installation
Copier les trois fichiers dans le dépôt en préservant l’arborescence. Publier avec GitHub Pages. Aucune migration D1 et aucun redéploiement Cloudflare : les endpoints Strava/Garmin existants sont inchangés.

## Précisions fonctionnelles
Les cibles kilométriques et de séances sont saisies par l’utilisateur (pas encore reliées automatiquement au programme de compétition) ; le nombre de séances restantes est donc indicatif. Le ressenti et les préférences d’affichage sont enregistrés dans le navigateur actuel. Les tendances comparatives nécessitent au moins 4 jours par semaine. Aucun score médical, diagnostic ni données fictives.

## Vérification
1. Tester l’affichage et le déplacement des cartes avec les flèches en mode « Personnaliser ».
2. Vérifier le masquage puis la réapparition après rechargement.
3. Saisir cibles kilométriques et séances, vérifier le calcul lundi–dimanche depuis Strava.
4. Sélectionner le ressenti ; vérifier les formulations nuancées.
5. Contrôler Garmin, les graphiques de récupération et la navigation existante.
