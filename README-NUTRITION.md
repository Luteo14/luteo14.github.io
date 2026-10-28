# LUTEO14 — Module Nutrition Marathon (version installable)

## Installation

Copier le contenu de cette archive à la racine du repository `luteo14.github.io`, en conservant les dossiers.

- `sport/nutrition/index.html`, `nutrition.css`, `nutrition.js`, `recipes.json` : nouvelle rubrique Nutrition.
- `sport/js/common-nav.js` : ajout de Nutrition au menu SPORT commun.
- `sport/index.html` : la vignette Nutrition pointe vers la nouvelle page.
- `tests/nutrition.spec.js` : quatre tests Playwright (desktop + mobile selon configuration).

Publier via GitHub Desktop puis ouvrir `https://luteo14.github.io/sport/nutrition/`.

## Fonctionnement

- Calendrier inclusif du 24 octobre au 7 novembre 2026, soit les 15 jours avant la course du 8 novembre.
- Quatre prises alimentaires proposées par jour (60 choix modifiables).
- 13 recettes documentées, quantités par personne en grammes, millilitres ou pièces.
- Quantités agrégées par ingrédient et unité, sans conversion implicite entre unités.
- Par défaut : 2 personnes. Ajustable de 1 à 12.
- Liste de courses avec cases à cocher, copie, CSV et impression.
- Préférences conservées localement dans le navigateur (localStorage). Pas de synchronisation D1 dans cette version, et aucune donnée envoyée à Garmin ou Strava.
- La liste est une somme d'ingrédients bruts : elle ne tient pas compte des stocks, des conditionnements commerciaux, ni de la variabilité des appétits.
- Les produits de ravitaillement du jour J ne sont pas inclus automatiquement.

## Tests

Depuis la racine du repository avec Playwright déjà installé :

```powershell
node --check sport/nutrition/nutrition.js
npx playwright test tests/nutrition.spec.js --workers=1 --reporter=list
```

Les tests vérifient 15 jours / 60 choix, la mise à l'échelle des quantités, la conservation des choix après rechargement et l'export CSV.

## Précautions

Menus indicatifs et non prescription médicale. Le chargement glucidique, l'hydratation et les ravitaillements doivent être adaptés aux besoins, au niveau d'entraînement et aux tolérances digestives. Éviter les aliments non testés à l'approche de la compétition. Vérifier allergies et sécurité alimentaire.

## Compatibilité

Ce patch ne modifie ni les Workers Cloudflare, ni les bases D1, ni les fichiers `plan.js` et `coach.js`. Les autres fichiers SPORT restent en place.
