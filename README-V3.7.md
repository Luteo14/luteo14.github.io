# LUTEO14 V3.7 — Objectifs et compétitions

## Installation

Archive incrémentale basée sur le fichier `sport/js/app.js` de la V3.6. Sauvegarder le fichier actuel, puis copier `sport/js/app.js` dans le dépôt GitHub Pages. Commit et Push, puis recharger la page `/sport/dashboard/` avec Ctrl+F5. **Aucune modification du Worker Cloudflare ni de Cloudflare Access.**

## Fonctions

- Ajout, modification et suppression d'objectifs (nom, date, distance, chrono cible, volume hebdomadaire, lieu).
- Comparaison hebdomadaire des distances courues dans les activités présentes dans `DATA` avec un **repère indicatif** de volume saisi (ce n'est pas le détail du plan généré).
- Affûtage indicatif : 80 % entre J-21 et J-14, 65 % entre J-14 et J-7, 40 % la dernière semaine. Ces coefficients sont des repères visuels, non une prescription personnalisée.
- Résultat de course saisi manuellement, écart avec l'objectif, notes, lien Strava ; suggestion d'activité proche en date/distance, sans validation automatique.
- Export/import JSON des objectifs pour transférer entre appareils.
- Harmonisation visuelle du bouton « Recalculer les records estimés » avec le bouton Strava.
- Statut de synchronisation : nombre d'activités en cache et date de synchronisation, sans appel `fetch` interdomaines ; aucune affirmation de connexion serveur sans vérification dans la fenêtre sécurisée.

## Stockage et limites

Les objectifs et bilans sont stockés dans **localStorage**, donc ne sont pas synchronisés entre appareils et peuvent disparaître en cas d'effacement du navigateur. Les activités Strava sont toujours synchronisées par le pont Cloudflare Access de la V3.4.2 et mises en cache dans IndexedDB. Aucune donnée de course n'est envoyée vers un service supplémentaire.

La V3.7 n'importe pas les séances hebdomadaires détaillées du générateur de plan : le volume cible saisi est utilisé comme référence. Les prévisions de performances existantes restent des estimations.

## Contrôles

1. Créer une compétition et vérifier son enregistrement après rechargement.
2. Vérifier la comparaison prévu/réalisé et la détection de l'affûtage.
3. Saisir un résultat et vérifier l'écart au chrono visé.
4. Tester export puis import JSON sur un autre navigateur.
5. Vérifier les boutons « Synchroniser maintenant » et « Recalculer les records estimés ».
6. Vérifier la zone « État de la synchronisation » après une nouvelle synchronisation.

Tests effectués : vérification syntaxique JavaScript (`node --check`) et intégrité de l'archive ZIP. Tests réels GitHub Pages/Strava à réaliser après déploiement.
