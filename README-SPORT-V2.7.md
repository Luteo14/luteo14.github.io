# LUTEO14 V2.7 — Navigation SPORT et simulateur d’allure

Patch incrémental sur V2.6, avec le simulateur fonctionnel de V2.4.

## À copier dans le dépôt GitHub
- `sport/index.html` : raccourcis de navigation, liens vers les vues RUN // DATA.
- `sport/js/sport-navigation.js` : prise en charge de `?tab=dashboard|performance|training|strava`, sans toucher à `app.js`.
- `sport/univers/index.html` : les cartes ouvrent directement la vue correspondante.
- `sport/allure/index.html` : simulateur complet, avec 5 km, 10 km, semi-marathon, marathon ; chrono ↔ allure, vitesse, passages, équivalences et navigation.
- `sport/assets/` : styles et images V2.6 conservés.

## Parcours utilisateur
`/sport/` : dashboard avec accès rapides ; `/sport/univers/` : portail visuel des huit thèmes ; `/sport/allure/` : outil autonome.

## Installation
Copier le contenu de l'archive à la racine du dépôt local, en conservant `.git`. Ne pas effacer les dossiers existants. Commit et Push via GitHub Desktop.

## Vérifications
1. Ouvrir `/sport/univers/`, cliquer Performance : l'onglet Performance doit s'ouvrir directement.
2. Cliquer Plan d'entraînement : le formulaire doit s'afficher.
3. Ouvrir `/sport/allure/`, tester marathon 3h35, puis 10 km 40 min et le mode Allure → Chrono.
4. Vérifier les pages Marathon et Strava (leur code n'est pas modifié).

La version est un patch de fichiers, pas un dépôt complet. Elle ne modifie ni les Workers Cloudflare, ni les données Strava. Les visuels sont issus de la V2.6.
