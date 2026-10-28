# LUTEO14 V5.2.1.1 — Correctif lot 2

Patch incrémental basé sur `Lot2.1.zip`. Ne contient aucun Worker modifié ni aucune migration.

## Corrections
- Ajout de la référence `/assets/version.js` aux 43 pages HTML qui ne l'avaient pas, sur les 45 pages examinées.
- Ajout du chargeur commun `assets/version.js`, absent de l'archive source. Il lit `version.json` sans cache et affiche la version en bas de page.
- Séparation du contrôle Garmin (lot 2) et du contrôle Strava (lot 3). Le test Strava est ignoré jusqu'à ce que son Worker déclare un handler `scheduled`.

## Installation
Extraire le ZIP à la racine du repository existant, dans la branche `feature/garmin-auto-v5.2.1`.

## Vérification
```
node --check assets/version.js
node --test tests/quality/smart-update.test.cjs
python scripts/test_d1_schema.py
npx playwright test --workers=1 --reporter=list
```

Résultat vérifié sur les fichiers de l'archive : **6 tests réussis, 1 ignoré (Strava lot 3)** pour `smart-update.test.cjs`.

Les tests Playwright complets et les appels Cloudflare distants n'ont pas été exécutés ici.

## Avertissement
L'archive source contient un environnement virtuel `.venv-garmin` et de nombreux fichiers techniques. Ne pas les ajouter à Git ni les diffuser. Ne pas déployer le Worker avant validation des tests et sauvegarde de D1.
