# LUTEO14 V4.9.3 — Quality Advanced

Ce pack **complète** V4.9.2. Il ne remplace aucun fichier applicatif et ne contacte pas la base D1 de production.

## Installation
Copier les dossiers `tests/advanced`, `scripts/`, `.github/workflows/` à la racine du dépôt. Copier également `garmin-cloud-worker/migrations/002_sport_objectives.sql` et `004_training_sessions.sql` uniquement si absents (les versions du dépôt font autorité). Conserver les fichiers Playwright V4.9.2.

```powershell
npm install
npx playwright install chromium
python scripts/test_d1_schema.py
npx playwright test
```

## Périmètre réellement couvert
- Navigateur : kilométrage de la semaine, rapprochement à date et distance comparables, unicité de l'association, absence de correspondance, rejet d'un GPX invalide. Ces tests exécutent le vrai `plan.js` via les pages existantes.
- SQL : création, modification, suppression et isolation par propriétaire des séances ; création, modification et suppression logique des objectifs. Base SQLite **en mémoire**, compatible avec le SQL D1 utilisé ici.
- **Non couverts dans ce pack** : Worker Cloudflare de bout en bout, vérification réelle des JWT Access, API Garmin/Strava, GPX valide téléchargé, algorithme de génération et affûtage (à instrumenter sans dupliquer la logique métier). Ne pas présenter ces tests comme validés.

## Protection de la branche main
GitHub > Settings > Rules > Rulesets > New branch ruleset : cible `main`, activer *Require a pull request before merging* et *Require status checks to pass*. Après une première exécution de la workflow sur une PR, sélectionner le check `quality-advanced`. Activer aussi le contrôle de mise à jour de branche si souhaité. Selon le plan et la visibilité du dépôt, les règles peuvent avoir des limitations.

**Important** : un workflow ne bloque pas à lui seul une fusion. Le ruleset GitHub doit être activé manuellement par un administrateur. Aucun changement automatique de protection n'est effectué par ce pack.

## Sécurité
Ne jamais lancer ces tests sur la D1 distante. Ne pas injecter de secrets Garmin ou Strava dans GitHub Actions. Les fixtures sont fictives. En cas d'échec, examiner le rapport Playwright avant de publier.
