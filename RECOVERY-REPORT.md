# LUTEO14 V5.2.1 — Recovery Edition

Source: archive LUTEO14-sauvegarde.zip (état Git sauvegardé).

Reconstruction: fichiers applicatifs de la sauvegarde, remplacement ciblé du lot 2 (Worker Garmin, configuration, migration 006, interface Mes données), versioning injecté dans les pages qui ne le référencent pas, test Quality Gate du lot 2. Aucun changement Worker Strava.

**Ce package est une reconstruction, non une restauration byte-à-byte d’un commit Git certifié.** Ne pas déployer le Worker ou appliquer une migration D1 avant validation de la configuration de production, sauvegarde D1 et revue des différences.

## Tests exécutés
- assets/version.js: OK
- garmin-cloud-worker/src/index.js: OK
- sport/donnees/auto-sync.js: OK
- worker/src/index.js: OK
- smart-update: OK
- sql: OK

## Validation restante
- npm ci puis npx playwright test --workers=1 (navigateur non exécuté lors de la reconstruction).
- Vérification manuelle Garmin Cloudflare Access, bridge, Nutrition et navigation.
- Validation du déploiement Cron en environnement Cloudflare après PR.

## Git
Créer une branche recovery/v5.2.1 depuis main à jour, extraire ce ZIP dans une copie propre du repository, comparer les différences, lancer les tests, puis ouvrir une PR. Ne pas forcer main.

## Attention
Le ZIP source comportait de nombreux node_modules, supprimés de cette livraison. Les configurations Wrangler peuvent inclure des identifiants de ressources non secrets; ne pas publier de clés privées ou fichiers .env.
