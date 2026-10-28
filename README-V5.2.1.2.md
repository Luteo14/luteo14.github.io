# LUTEO14 V5.2.1.2 — Garmin Scheduler Recovery

Correctif incrémental construit à partir des fichiers `index(4).js` et `wrangler(1).toml` transmis.

## Diagnostic

Le Worker fourni ne contient pas `/sync-settings-bridge`, `/api/sync-settings` ni le gestionnaire `scheduled`. Son `wrangler.toml` ne définit pas de Cron Trigger. La page web `/sport/donnees/` ouvre pourtant `/sync-settings-bridge`.

## Contenu

- `garmin-cloud-worker/src/index.js` : conservation du code actuel et ajout des routes GET/PUT de programmation, du Bridge sécurisé, de l'ordonnancement Garmin et de l'historique D1.
- `garmin-cloud-worker/wrangler.toml` : ajout du Cron `*/15 * * * *`, autres paramètres inchangés.
- `tests/quality/garmin-scheduler-recovery.test.cjs` : 7 tests de non-régression et de planification.

Les routes Nutrition, objectifs, entraînements et Garmin manuel sont conservées. Aucune modification des tables D1 ni des données stockées n'est effectuée par l'archive. Les tables `sport_sync_preferences` et `sport_sync_runs` doivent déjà exister.

## Installation et validation

1. Créer une branche depuis `main` (ex. `fix/garmin-scheduler-v5212`).
2. Sauvegarder les deux fichiers Worker existants et comparer les différences avec ceux du ZIP avant remplacement. Ne pas copier si le Worker a changé depuis les fichiers transmis.
3. Copier les trois fichiers à la racine du repository, en conservant les chemins.
4. Exécuter :

```powershell
node --check garmin-cloud-worker/src/index.js
node --test tests/quality/garmin-scheduler-recovery.test.cjs
python scripts/test_d1_schema.py
npx playwright test --workers=1 --reporter=list
```

5. Vérifier que le Quality Gate GitHub est vert. Sauvegarder D1 avant le déploiement et vérifier que le binding `DB` pointe vers la bonne base.
6. Depuis `garmin-cloud-worker`, lancer `npx wrangler deploy` **uniquement après validation**.
7. Vérifier `/sync-settings-bridge` après authentification Cloudflare Access et tester l'enregistrement des préférences depuis `/sport/donnees/`.
8. Contrôler le Cron Trigger dans Cloudflare et, après l'heure choisie, lire l'historique `sport_sync_runs` et le snapshot Garmin.

## Limites

- Les tests livrés vérifient les routes, la sécurité structurelle et la logique horaire. Ils ne remplacent pas un test d'intégration réel de Cloudflare Access, D1 et Cron.
- La programmation Strava reste inactive côté Worker Garmin : elle relève du lot 3.
- La logique de déduplication D1 interdit une seconde tentative automatique pour le même jour et la même source, même en cas d'échec.
- La synchronisation serveur n'actualise pas à elle seule le cache IndexedDB du navigateur : Mon Coach doit toujours importer le snapshot récent.
