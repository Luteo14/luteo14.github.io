# LUTEO14 V4.7 — Coach connecté

## Installation
1. Sauvegarder la V4.6 et déployer les fichiers `sport/coach/` et `sport/assets/`.
2. Depuis `garmin-cloud-worker`, appliquer `npx wrangler d1 execute luteo-pro-docs --remote --file=./migrations/003_coach_preferences.sql`.
3. Déployer le Worker avec `npx wrangler deploy` après avoir fusionné le fichier `src/index.js` fourni avec votre version actuellement en production. **Ne pas écraser des correctifs de production non inclus dans cette archive.**
4. Sur Mon Coach, cliquer sur « Charger mes objectifs et préférences », s'authentifier via Access et vérifier la prochaine compétition.
5. Modifier l'ordre des cartes et vérifier la synchronisation sur un second appareil après nouvelle connexion.

## Limites et sécurité
- Les objectifs sont lus depuis `sport_objectives` ; la V4.4 doit déjà être déployée.
- Les séances réellement réalisées proviennent du cache Strava du navigateur. Actualiser Strava sur chaque appareil.
- La cible kilométrique découle de `weeklyKm` et d'un affûtage indicatif 80/65/40 % sur les trois dernières semaines, comme dans Objectifs ; elle ne constitue pas un plan séance par séance.
- Le nombre de séances prévues reste saisi manuellement : aucune structure de séances n'est présente dans les objectifs D1.
- Les préférences synchronisées comprennent l'ordre, la visibilité des cartes et les cibles hebdomadaires, mais pas le ressenti quotidien.
- La première connexion au pont sécurisé est volontairement interactive pour éviter les erreurs CORS de Cloudflare Access.
- Le Worker conserve la vérification JWT Access ; ne jamais exposer la clé Garmin dans GitHub.
