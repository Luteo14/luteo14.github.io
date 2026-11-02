# LUTEO14 V5.2.2 — Lot 3 Strava Auto Sync

## Périmètre
Patch incrémental construit à partir de `archive.zip` fourni :
- `worker/src/index.js` : conserve OAuth, routes HTTP, Bridge, cache KV et ajoute `scheduled()`.
- `worker/wrangler.toml` : ajoute binding D1 existant `luteo-pro-docs` et Cron toutes les 15 minutes.
- `tests/quality/strava-scheduler.test.cjs` : 7 tests isolés, sans API réelle.

**Aucun fichier du Worker Garmin n'est remplacé. Aucune migration SQL n'est nécessaire** : les tables `sport_sync_preferences` et `sport_sync_runs` existent déjà. La configuration de l'interface `/sport/donnees/` reste inchangée.

## Installation
1. Créer une branche `feature/strava-auto-v5.2.2` à partir de `main` actualisée.
2. Extraire ce patch à la racine du dépôt, puis examiner le diff des deux fichiers `worker/`.
3. Exécuter depuis la racine :
   ```powershell
   node --check worker/src/index.js
   node --test tests/quality/strava-scheduler.test.cjs
   node --test tests/quality/smart-update.test.cjs
   python scripts/test_d1_schema.py
   npx playwright test --workers=1 --reporter=list
   ```
4. Commit, Push, Pull Request et validation `quality-advanced`.
5. Vérifier que le Worker Strava de production utilise bien la base D1 indiquée dans `worker/wrangler.toml`, et sauvegarder la configuration. Puis déployer depuis `worker/` avec `npx wrangler deploy`.
6. Dans Cloudflare, vérifier que le Worker `luteo-strava-api` possède le Cron `*/15 * * * *`.
7. Dans SPORT > Mes données, activer Strava, garder Garmin activé, enregistrer et vérifier la persistance D1.
8. Après l'heure programmée, contrôler (lecture seule) :
   ```powershell
   npx wrangler d1 execute luteo-pro-docs --remote --command="SELECT source,local_date,status,started_at,completed_at,details FROM sport_sync_runs ORDER BY started_at DESC LIMIT 10;"
   ```
9. Vérifier que le cache Strava a été actualisé via le Bridge Strava authentifié. La mise à jour côté serveur n'actualise pas automatiquement les données déjà ouvertes dans le navigateur.

## Comportement et limites
- Heure paramétrable `Europe/Paris`, vérifiée à chaque Cron ; une synchronisation maximum par date locale et par source grâce à la clé D1.
- Une tentative échouée reste enregistrée en `failed` et **n'est pas automatiquement retentée le même jour**. Un futur lot pourra proposer un mécanisme de reprise contrôlée.
- Le cache KV précédent reste conservé si l'appel Strava échoue.
- Le renouvellement OAuth existant est réutilisé ; il dépend des secrets Strava déjà configurés côté Cloudflare.
- Aucune requête HTTP publique supplémentaire n'est créée pour lancer la synchronisation.
- Les tests fournis valident la logique Worker avec des simulations D1/KV/Strava ; ils ne prouvent pas un déploiement réel ni le bon fonctionnement du Cron en production.
- Ne pas exposer les fichiers `.wrangler/cache/` de l'archive source : ils sont exclus de ce patch.
