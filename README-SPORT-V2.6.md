# LUTEO14 V2.6 — Visuels individuels SPORT

Patch à copier à la racine du dépôt GitHub Pages. Remplacer `sport/index.html`, `sport/assets/sport-visual.css` et `sport/univers/index.html` ; ajouter `sport/assets/hero-running.webp` et les huit fichiers `sport/assets/themes/*.webp`.

Les huit images sont des recadrages individuels du visuel de référence généré pour LUTEO14. Chaque carte charge désormais son propre fichier optimisé WebP, sans découpage CSS d’une image globale. La page principale conserve ses fonctionnalités Strava et ses scripts existants.

Publication : GitHub Desktop > Commit > Push origin. Contrôler `https://luteo14.github.io/sport/univers/` sur mobile et ordinateur.

Les liens vers des vues internes de RUN // DATA utilisent des ancres ; leur activation directe dépend du comportement du script de navigation existant.
