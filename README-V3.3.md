# LUTEO14 V3.3 — Mise à jour incrémentale

Copier les trois fichiers dans le dépôt, en conservant les autres dossiers.

- `sport/dashboard/index.html` : bouton de recalcul et statut de stockage.
- `sport/js/app.js` : cache IndexedDB persistant, fusion export/Strava, rafraîchissement des records.
- `worker/src/index.js` : cache Cloudflare KV sans expiration automatique (une actualisation reste déclenchée après 7 jours).

Déploiement : depuis `worker/`, exécuter `npx wrangler deploy` ; puis Commit/Push GitHub Desktop. Le Worker Strava existant conserve son nom et son namespace KV.

Tests : ouvrir `/sport/dashboard/`, synchroniser Strava, recharger la page, vérifier les chiffres ; cliquer sur « Recalculer les records estimés ». Déconnecter et vérifier l'effacement local.

**Sécurité :** la version actuelle du Worker utilise un jeton Strava global et ne vérifie pas l'identité de l'appelant sur les routes `/api/activities`, `/api/status`, `/api/disconnect`. Ne pas considérer ces routes comme privées. Protéger le Worker via authentification et autorisations serveur avant de stocker des données personnelles sensibles. La présente version ne prétend pas résoudre ce défaut existant.

**Méthodologie :** records estimés par extrapolation de l'allure moyenne, pas des meilleurs segments GPS.
