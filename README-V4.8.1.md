# LUTEO14 V4.8.1 — Rapprochement Strava

## Correctif
Le Dashboard RUN // DATA utilise IndexedDB `luteo14-sport`, object store `cache`, clé `strava` et la propriété `activities`. Le calendrier V4.8 cherchait à tort `luteo14-strava-v1`.

Remplacer uniquement `sport/coach/plan/plan.js` par le fichier fourni. Aucun changement Worker, D1 ou Strava.

## Test
1. Sur le même navigateur, ouvrir `/sport/dashboard/` et synchroniser Strava.
2. Ouvrir `/sport/coach/plan/` et afficher la semaine d'une activité connue.
3. Vérifier le total kilométrique et le rapprochement éventuel.
4. Le statut « À confirmer » signifie une proposition basée sur la date et la distance, pas une validation automatique.
5. Si les activités ne s'affichent pas, ouvrir la console et vérifier « Plan LUTEO14 : N activités Strava lues depuis RUN // DATA ».

**Limite :** les activités Strava sont stockées dans le navigateur ; sur un autre appareil, synchroniser Strava sur cet appareil.
