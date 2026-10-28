# LUTEO14 V5.1 — Quality Advanced

## Installation
Ce ZIP est un **patch incrémental**. Décompresser à la racine du repository existant en conservant les chemins.
Il remplace `.github/workflows/quality-advanced.yml` et ajoute `tests/quality/*.test.cjs`.
Aucun fichier applicatif ni aucune migration de production n'est remplacé.

## Tests
```powershell
node --test tests/quality/*.test.cjs
python scripts/test_d1_schema.py
npx playwright test --workers=1
```
Sous Windows, si le glob `*.test.cjs` n'est pas développé, exécuter :
```powershell
node --test tests/quality/cloudflare-api.test.cjs tests/quality/plan-generator.test.cjs
```

## Couverture et limites
- 8 tests d'API : ils exécutent le **vrai handler** `garmin-cloud-worker/src/index.js` avec un JWT de test signé, un faux service JWKS et une **fausse interface D1 en mémoire**. Aucun appel à Cloudflare, Garmin, Strava ou à la production.
- 7 tests métier : ils évaluent les **expressions réelles** du générateur dans `plan.js` (affûtage, allègement, plafonds, volume). Ils ne remplacent pas un test complet de l'interface et de la génération de toutes les séances.
- Tests SQLite existants : vérification des migrations sur SQLite en mémoire, sans base D1 distante.
- Tests Playwright existants : inchangés (44 réussis selon l'exécution locale communiquée par l'utilisateur).
- Le contrôle GitHub reste nommé `quality-advanced`, pour préserver le Ruleset.
- Aucun test sur une véritable base Cloudflare D1 de préproduction n'est inclus : il faut provisionner une base isolée et un Worker de staging avant d'activer des tests HTTP distants.

## Constats sur l'archive
- Le workflow présent utilise déjà `node node_modules/playwright/cli.js`, évitant le binaire `npx` qui provoquait `Permission denied`.
- Le `package.json` indique `4.9.2`, alors que Nutrition V5.0 est présente : métadonnée à harmoniser lors d'une prochaine livraison.
- `garmin-cloud-worker/wrangler.toml` pointe vers une base nommée `luteo-pro-docs` : vérifier que ce partage est voulu. **Ne pas changer le binding en production sans audit des migrations et sauvegarde.**
- L'archive contient environ 9 365 entrées `node_modules/`, ainsi que `.wrangler/`, `test-results/`, `playwright-report/` : ne pas les inclure dans les archives de livraison ni les commits. Ajouter les exclusions `.wrangler/`, `test-results/`, `playwright-report/` au `.gitignore` existant.
- Les routes d'entraînement utilisent `PUT` pour remplacer la collection entière des séances, et non des routes CRUD indépendantes par séance. Les tests vérifient ce contrat réel.
- Les objectifs sont supprimés logiquement (`deleted_at`), pas physiquement.
- Le générateur utilise actuellement un volume de croissance plafonné et deux semaines d'affûtage ; les tests sont alignés sur ce comportement, sans juger de la pertinence sportive individuelle.

## Déploiement
Créer une branche `feature/quality-v5.1`, appliquer le patch, exécuter les tests, pousser la branche, puis ouvrir une Pull Request vers `main`.
Ne pas remplacer le Ruleset `quality-advanced`.
