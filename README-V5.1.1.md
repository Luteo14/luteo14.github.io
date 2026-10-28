# LUTEO14 V5.1.1 — Garmin Data Reliability + Nutrition flexible / Cloudflare D1

## Contenu
Patch incrémental pour le repository LUTEO14 (base: `coach.zip` et `VersionZippe.zip`).

- `sport/coach/coach.js` et `index.html` : correction de la lecture des dates et des niveaux Body Battery ; si seul le couple `charged`/`drained` est disponible, l'interface indique clairement qu'il s'agit de **points rechargés/dépensés**, et non d'un niveau 0–100. Sommeil `sleepTimeSeconds` et VFC `hrvSummary.lastNightAvg` préservés. Couverture et fraîcheur de synchronisation visibles.
- `sport/nutrition/` : choix libre du début et de la fin du calendrier (1 à 61 jours), recalcul des recettes/courses, persistance locale et synchronisation **à la demande** via Cloudflare Access et D1. Conservation des anciens choix par date et des cases à cocher ; protection simple contre les écrasements concurrents (HTTP 409).
- `garmin-cloud-worker/src/index.js` : nouvelles routes `GET/PUT /api/nutrition` et `/nutrition-bridge` authentifiées par Cloudflare Access.
- `garmin-cloud-worker/migrations/005_nutrition_plans.sql` : nouvelle table isolée par `owner_email`.
- `tests/nutrition.spec.js` : tests UI existants mis à jour et 4 scénarios ajoutés (dates, persistance, invalidité, bouton cloud).
- `tests/quality/*.test.cjs` : 11 nouveaux tests de normalisation Garmin et d'API Nutrition D1 simulée.
- `scripts/test_d1_schema.py` : test de la nouvelle migration (3 tests SQL au total).
- `.github/workflows/quality-advanced.yml` : ajout des tests Node au **même job `quality-advanced`** pour préserver le Ruleset.

## Ordre de déploiement obligatoire

1. **Sauvegarder** le code actuel du Worker et la base D1 de production avant toute modification.
2. Appliquer le patch dans une branche de développement ; vérifier les différences, notamment `garmin-cloud-worker/src/index.js` si le Worker déployé a évolué depuis l'archive fournie.
3. Exécuter les tests en local :

```powershell
node --check sport/coach/coach.js
node --check sport/nutrition/nutrition.js
node --check garmin-cloud-worker/src/index.js
node --test tests/quality/garmin-normalization.test.cjs tests/quality/nutrition-api.test.cjs
python scripts/test_d1_schema.py
npx playwright test --workers=1 --reporter=list
```

4. Dans Cloudflare, appliquer **uniquement** la migration 005 à la base associée au binding `DB` du Worker (le `wrangler.toml` fourni indique `luteo-pro-docs`) :

```powershell
cd garmin-cloud-worker
npx wrangler d1 execute luteo-pro-docs --remote --file=./migrations/005_nutrition_plans.sql
```

5. Déployer le Worker **après la migration** :

```powershell
npx wrangler deploy
```

6. Publier les fichiers du site via Pull Request, après succès du contrôle `quality-advanced`.
7. Vérifier les pages SPORT / Mon Coach et SPORT / Nutrition sur ordinateur et mobile.

**Attention :** ces commandes D1/Worker sont des opérations de production. Vérifier d'abord l'environnement Cloudflare, la base ciblée et les sauvegardes. Ne pas lancer `wrangler d1 migrations apply` aveuglément sur toutes les anciennes migrations si leur historique n'est pas établi.

## Utilisation de la synchronisation Nutrition

- Sélectionner les dates et les repas ; le calendrier et les courses se recalculent.
- Cliquer sur **Synchroniser sur mes appareils** et s'authentifier via Cloudflare Access dans la fenêtre ouverte.
- Sur un autre appareil, ouvrir Nutrition et cliquer sur le même bouton pour **charger** le plan D1.
- Après modification, recliquer pour enregistrer dans D1.
- En cas de conflit avec une version plus récente, le serveur refuse l'écrasement et demande de recharger. La liste de courses est recalculée depuis les repas ; seules les cases cochées et les choix sont stockés.

## Validation réalisée dans l'environnement de génération

- Syntaxe des trois fichiers JavaScript modifiés : OK (`node --check`).
- Tests Node : **11/11 réussis** (API simulée + normalisation Garmin).
- Tests SQLite : **3/3 réussis**.
- **Playwright n'a pas été exécuté ici** : à valider dans le repository local et GitHub Actions avant fusion.
- Aucun appel au Worker ou à la base D1 de production n'a été effectué.

## Limites et points de vigilance

- La synchronisation entre appareils est déclenchée **à la demande**, pas automatiquement en arrière-plan.
- Les tests API utilisent le vrai handler Worker mais un stockage D1 simulé, pas une vraie base D1 distante.
- Les données Garmin `charged` et `drained` ne sont pas un niveau Body Battery ; elles sont identifiées comme telles.
- La migration D1 et le déploiement Worker ne sont pas automatiques lors de la publication GitHub Pages.
