# LUTEO14 V4.8 — Plan d’entraînement intelligent

## Installation
1. Sauvegarder la version déployée, particulièrement le Worker Garmin Cloud. Cette archive est basée sur les fichiers V4.7 fournis précédemment. Fusionner les changements du Worker avec tout correctif plus récent avant de déployer.
2. Exécuter depuis `garmin-cloud-worker` : `npx wrangler d1 execute luteo-pro-docs --remote --file=./migrations/004_training_sessions.sql`.
3. Déployer le Worker : `npx wrangler deploy`. Ne pas modifier Cloudflare Access ni les secrets.
4. Copier `sport/coach/index.html` et `sport/coach/plan/` vers GitHub Pages.
5. Ouvrir `/sport/coach/plan/`, charger le plan Cloudflare, créer une séance et cliquer sur Enregistrer. Tester sur un second appareil.

## Limites importantes
- Rapprochement indicatif sur la même date et une distance à ±35 % (minimum 2 km). Cela ne prouve pas qu’une séance planifiée a été exécutée.
- Les activités Strava sont lues depuis le cache local du navigateur ; la forme exacte du cache peut varier selon la version. Tester le rapprochement avec des données réelles.
- Les données Garmin sont lues depuis le stockage local alimenté par la synchronisation Cloudflare.
- Le plan n’est pas généré automatiquement : l’utilisateur saisit ses séances. Les objectifs D1 servent à rattacher les séances à une compétition.
- Le chargement Cloudflare nécessite la connexion Access via la fenêtre sécurisée. Ne pas placer de clé API dans le frontend.
- L’enregistrement remplace atomiquement la liste des séances de l’utilisateur ; éviter des modifications simultanées depuis plusieurs appareils.
- Conseils heuristiques non médicaux, sans ajustement automatique des séances.
