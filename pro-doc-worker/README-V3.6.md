# LUTEO14 V3.6 — Mon Coach Running

## Installation
1. Sauvegarder le fichier actuel `sport/js/app.js`.
2. Copier `sport/js/app.js` de cette archive dans le repository en conservant son chemin.
3. Publier avec GitHub Desktop (commit puis Push origin).
4. Recharger `/sport/dashboard/` avec Ctrl+F5.

Aucun changement du Worker Strava ni de Cloudflare Access.

## Fonctionnalités
- Nouveau bloc « Mon Coach Running » avant les KPI du Dashboard.
- Volume et fréquence sur 28 jours, comparaison 28j/28j, répartition sur quatre semaines, sortie longue.
- Recommandations déterministes basées sur les activités disponibles.
- Projection marathon Riegel explicitement identifiée comme estimation.
- Avertissement si les données sont anciennes et présentation de la méthodologie.
- Mise à jour après synchronisation Strava via le mécanisme sécurisé V3.4.2.

## Limites
- Pas de mesure de fatigue physiologique ou de zones cardiaques.
- Le graphique des semaines utilise des fenêtres glissantes ancrées sur la dernière activité.
- Les recommandations ne remplacent pas un suivi médical ou un coach humain.
- La prédiction Riegel peut être optimiste pour un marathon.
- Les données sont conservées selon le fonctionnement V3.5, sans modification des règles de sécurité.

## Vérifications
1. Ouvrir Dashboard : vérifier « Mon Coach Running ».
2. Synchroniser Strava et vérifier l'actualisation des indicateurs.
3. Ouvrir Performance et recalculer les records.
4. Recharger la page et vérifier la persistance des activités.
