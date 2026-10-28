# LUTEO14 V5.1.2 — Garmin Sync Reliability + Nutrition période personnalisable

## Sources auditées
- `coach(1).zip` : version fournie du Coach. Le bouton Garmin `#garminCloudSync` était caché dans `#coachLegacyImport` et la page affichait les données du cache IndexedDB sans rendre la synchronisation accessible.
- `nutrition.zip` : version fournie de Nutrition **V1 à période fixe** (24 octobre au 7 novembre 2026), sans champs de dates ni synchronisation Cloudflare.
- Correctif V5.1.1 précédemment préparé : utilisé comme base pour la normalisation Garmin, le calendrier Nutrition flexible et l'API D1 Nutrition. **Vérifier les différences avec les fichiers actuels du Worker avant tout déploiement.**

## Livrable
- `sport/coach/coach.js`, `index.html`, `coach.css` : bouton Garmin visible, bridge Access sécurisé, vérification origine + nonce + fenêtre, snapshot validé, refus des snapshots plus anciens, écriture atomique des trois catégories dans IndexedDB, rechargement des cartes/graphiques, statuts de fraîcheur et erreurs.
- `sport/nutrition/*` : sélection libre début/fin (1 à 61 jours), recalcul des repas/courses, conservation locale, synchronisation D1 **à la demande** via bridge Cloudflare Access. Par défaut : 24/10 au 07/11/2026, deux personnes.
- `garmin-cloud-worker/src/index.js` et `migrations/005_nutrition_plans.sql` : version backend issue du patch V5.1.1. Ne pas écraser un Worker plus récent sans fusion ciblée des routes Nutrition.
- `tests/garmin-sync.spec.js` : 3 scénarios Playwright (cache ancien remplacé, snapshot incomplet refusé, erreur Access visible).
- `tests/nutrition.spec.js` : scénarios Nutrition incluant les périodes personnalisées.
- `tests/quality/*.test.cjs` : 16 tests Node en environnement isolé.
- `scripts/test_d1_schema.py` : 3 tests SQL (à exécuter dans le repository complet avec migrations 002/004/005).
- `.github/workflows/quality-advanced.yml` : conserve le job `quality-advanced` et exécute tests Node, SQL et Playwright.

## Installation prudente
1. Créer `feature/garmin-sync-v5.1.2` depuis `main` à jour. Sauvegarder les fichiers modifiés.
2. Copier `sport/coach/*`, `sport/nutrition/*`, `tests/*`, `scripts/test_d1_schema.py` et le workflow. Conserver les autres fichiers existants.
3. **Pour le Worker**, comparer la version fournie à la version actuelle avant de la remplacer : si des changements ont été apportés depuis V5.1.1, ne fusionner que les routes `/nutrition-bridge`, `GET/PUT /api/nutrition` et les fonctions de validation associées.
4. Vérifier si la migration 005 a déjà été appliquée. Ne pas redéployer ni réexécuter une migration distante sans sauvegarde, contrôle du binding D1 et validation de son contenu.
5. Tests :
   ```powershell
   node --check sport/coach/coach.js
   node --check sport/nutrition/nutrition.js
   node --check garmin-cloud-worker/src/index.js
   node --test tests/quality/*.test.cjs
   python scripts/test_d1_schema.py
   npx playwright test --workers=1 --reporter=list
   ```
6. Après tests locaux et GitHub Actions verts, fusionner par Pull Request. Si nécessaire, déployer le Worker validé séparément.
7. Sur Mon Coach, cliquer **Actualiser Garmin**, se connecter dans le popup Access et vérifier que la date de snapshot et d'import local sont récentes. Sur Nutrition, choisir les dates, synchroniser puis vérifier sur un second appareil.

## Limites de validation
- Tests Node : **16/16 réussis** dans l'environnement de préparation.
- Tests Playwright : fournis, **non exécutés ici** (Playwright n'est pas installé dans l'environnement de préparation).
- Tests SQL : **3/3 réussis** avec les migrations 002 et 004 extraites de l'archive historique, plus la migration 005 du patch.
- Aucune modification Cloudflare distante n'a été effectuée. Les données réelles Garmin et D1 n'ont pas été consultées par le correctif.
- Le timestamp du snapshot représente la dernière synchronisation Cloudflare, pas nécessairement la dernière mesure quotidienne Garmin. Le bouton déclenche la **lecture du snapshot via bridge** ; si une synchronisation Garmin serveur est nécessaire, utiliser le bouton de la fenêtre bridge, puis attendre la nouvelle réponse `snapshot`.
