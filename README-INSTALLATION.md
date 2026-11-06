# LUTEO14 — Échauffement Marathon

Correctif basé sur `LUTEO14-V5.2.1-Recovery-Complete.zip` (archive antérieure, pas nécessairement identique au dépôt actuel).

## Installation sécurisée

1. Créer une branche depuis `main` et sauvegarder les fichiers existants.
2. **Comparer** `sport/marathon/index.html` et `sport/marathon/marathon.css` avec les versions actuelles avant remplacement. Le remplacement brut pourrait supprimer des changements plus récents.
3. Intégrer la nouvelle section `#echauffement`, le lien de navigation et les styles `.warmup-*` si les fichiers ont évolué.
4. Copier `tests/advanced/marathon-warmup.spec.js`.
5. Exécuter `npx playwright test tests/advanced/marathon-warmup.spec.js` puis la suite complète.
6. Ouvrir une Pull Request et attendre `quality-advanced`.

Les trois liens vidéo sont des recherches YouTube, et non des vidéos individuelles vérifiées.
La chronologie et les autres fonctions Marathon de l'archive source sont préservées.
