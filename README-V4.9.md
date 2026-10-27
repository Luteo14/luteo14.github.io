# LUTEO14 V4.9 — Générateur de préparation et export GPX

## Installation
Remplacer uniquement `sport/coach/plan/index.html`, `plan.js` et `plan.css` dans le repository. Publier sur GitHub Pages. Aucun changement de Worker ou de migration D1.

## Utilisation
1. Ouvrir Mon Coach > Plan et cliquer « Charger mon plan Cloudflare ».
2. Choisir un objectif D1, une fréquence, un volume de départ et une durée.
3. Cliquer « Proposer mon plan ». Vérifier les séances, leurs dates et leur volume.
4. Cliquer « Valider et ajouter au calendrier », puis **« Enregistrer mon plan »** pour persister dans D1.
5. Recharger depuis Cloudflare et vérifier les séances. Le rapprochement Strava V4.8.1 reste en place.

## GPX
Le GPX est un **itinéraire géographique** et ne peut être construit à partir d'une simple distance ou allure. Pour une séance, sélectionner un tracé GPX de référence (créé par Garmin Connect, Komoot, etc.), puis exporter le GPX annoté. Aucune coordonnée fictive n'est produite. Les allures et intervalles ne sont pas encodés dans ce GPX. Pour envoyer des entraînements structurés à Garmin, un format/workflow adapté (FIT workout, Garmin Connect) est nécessaire.

## Limites et sécurité
Le générateur est fondé sur le volume Strava récent, l'objectif D1 et un signal prudent de sommeil Garmin. Ce n'est pas un plan médical ni une adaptation automatique fiable à la fatigue. Il n'écrase aucune séance existante ; il propose, puis exige une validation et un enregistrement explicites. Les données restent dans les mécanismes existants (Cloudflare Access/D1, cache navigateur). Ne pas publier de données personnelles ni de clés API.
