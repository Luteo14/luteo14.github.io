# LUTEO14 V4.1 — Analyse récupération Garmin + Strava

## Installation
Copier `sport/coach/index.html` et `sport/coach/coach.js` dans le repository existant. Conserver `coach.css`, les autres fichiers et les Workers Cloudflare. Publier sur GitHub Pages puis recharger `/sport/coach/` avec Ctrl+F5.

## Fonctions
- Graphiques 7 / 28 jours : sommeil (heures), VFC (ms), Body Battery (dernière mesure quotidienne) et kilomètres courus (Strava).
- Source Garmin : snapshots reçus via la fenêtre Cloudflare Access puis enregistrés dans IndexedDB `luteo14-garmin-v38`.
- Source Strava : cache IndexedDB `luteo14-sport` / `cache` / `strava` du même navigateur, uniquement si déjà synchronisé dans RUN // DATA. Aucune requête directe interdomaines.
- Affichage de la couverture des données, sans interpolation des jours Garmin manquants.
- Comparaison des 7 derniers jours aux 7 précédents et recommandations prudentes fondées sur des règles explicites.
- Objectif sélectionnable, mémorisé localement, sans prétendre lire les objectifs V3.7.

## Limites
Le Worker Garmin V4.0 actuel récupère 7 jours de sommeil et de VFC et 28 jours de Body Battery. Les graphiques 28 jours pour sommeil/VFC resteront partiels jusqu'à extension de la synchronisation. Les données Strava sont visibles seulement si leur cache existe dans le même navigateur; sinon elles sont indiquées absentes. Une baisse de VFC ou de Body Battery n'est pas un diagnostic médical.

## Contrôles
1. Synchroniser Strava dans RUN // DATA depuis ce navigateur.
2. Synchroniser Garmin via Cloudflare depuis `/sport/coach/`.
3. Vérifier les graphiques 7 et 28 jours, leur couverture et la date des mesures.
4. Changer l'objectif, recharger la page et vérifier sa conservation.
5. Vérifier que Strava et les Workers n'ont pas été modifiés.

## Sécurité
Aucun secret ni clé API dans les fichiers. Les données de santé restent privées dans Cloudflare D1 et le cache du navigateur; ne pas les publier dans GitHub.
