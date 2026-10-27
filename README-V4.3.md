# LUTEO14 V4.3 — Consolidation SPORT

## Livré
- Suppression de la barre d'onglets RUN // DATA redondante, conservation des vues par les liens du menu supérieur.
- Navigation commune : Accueil, Synthèse, Dashboard, Plan, Mon Coach, Performance, Objectifs, Mes données.
- Page `/sport/synthese/` avec informations réellement disponibles et états vides explicites.
- Bibliothèque commune `sport/js/charts.js` pour les graphiques Chart.js du Dashboard.
- Volume hebdomadaire en histogramme, séries chronologiques de performance en courbes.
- Graphiques de récupération agrandis.

## Déploiement
Copier les fichiers de cette archive dans le repository en conservant les chemins. Vérifier les liens `/sport/dashboard/?tab=training`, `?tab=performance`, `/sport/donnees/`, `/sport/coach/`. Ne pas déployer de Worker pour cette mise à jour front-end.

## Limite importante — Objectifs D1
La migration `002_sport_objectives.sql` est fournie comme **préparation**, pas comme synchronisation opérationnelle. NE PAS l'appliquer pour l'instant. La synchronisation multi-appareils nécessitera des endpoints protégés dans le Worker, la validation des schémas, le contrôle des identités, les conflits et la migration explicite des objectifs existants. Les objectifs restent conservés dans le navigateur jusqu'à cette étape.

## Vérifications
Tester le Dashboard et ses vues, la connexion Strava depuis Mes données, la synchronisation Garmin, les graphiques 7/28 jours, et les objectifs existants. Les valeurs ne sont pas inventées en l'absence de données.
