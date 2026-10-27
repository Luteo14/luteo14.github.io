# LUTEO14 V4.5 — Mon Coach, interface Focus

## Contenu
- `sport/coach/index.html` : nouvelle zone « Ton focus du moment » inspirée des principes de synthèse visuelle de Garmin Connect, sans reproduire son interface.
- `sport/coach/coach.js` : quatre mini-graphiques Chart.js issus des données Strava/Garmin déjà conservées, et cartes de synthèse sans données fictives.
- `sport/assets/sport-unified.css` : cartes responsive, typographie, grille, couleurs, espacements.

## Installation
Copier les trois fichiers vers les chemins identiques du dépôt GitHub Pages; commit/push, puis recharger `/sport/coach/` (Ctrl+F5). Aucune migration D1 ni redéploiement Worker nécessaires. Conserver les autres fichiers V4.4.

## Vue d'ensemble
Body Battery dernière mesure, sommeil de la dernière nuit disponible, distance de course des 7 jours de la période affichée, dernière VFC, accès à la page Objectifs. Les quatre graphiques compacts suivent les 7 derniers jours de la dernière mesure connue et ne comblent pas les trous.

## Points de vigilance
- La fenêtre 7 jours est alignée sur la dernière donnée disponible, qui peut être ancienne : les cartes portent une date, et les synchronisations passent par « Mes données ».
- Le kilométrage est issu du cache Strava de l'appareil. Un cache absent ne signifie pas 0 km.
- La tuile « Objectif sportif » ouvre la page Objectifs. Elle n'affiche pas de compétition inventée.
- Les graphiques détaillés de 7/28 jours, l'historique et les recommandations existants restent accessibles plus bas.
- Les éléments Garmin disponibles dépendent des données transmises par la montre et du Worker actuel.

## Vérification
1. Sur `/sport/coach/`, contrôler l'affichage des cinq cartes, en PC et mobile.
2. Synchroniser Garmin et Strava via `/sport/donnees/`, puis revenir à Mon Coach.
3. Vérifier les dates de mesure, les quatre graphiques et la section détaillée 7/28 jours.
4. Tester les liens vers Objectifs et RUN // DATA.

Contrôles automatiques : syntaxe JavaScript et structure ZIP. Aucune synchronisation réelle avec les comptes privés n'a été exécutée dans l'environnement de génération.
