# RUN // DATA — V1.2

Dashboard personnel GitHub Pages avec statistiques de course, plan d'entraînement et connexion Strava optionnelle.

## Architecture

- Frontend statique : GitHub Pages (`https://luteo14.github.io`)
- Données de secours : `data/activities.json`
- Backend Strava : Cloudflare Worker dans `worker/`
- Secrets : uniquement dans Cloudflare (`STRAVA_CLIENT_SECRET`), jamais dans le dépôt

## Mise en ligne du frontend

Copier cette version dans le dépôt `luteo14.github.io`, commit puis Push via GitHub Desktop.

## Activer Strava

Suivre `worker/README.md`. Après déploiement du Worker, modifier `js/config.js` avec son URL publique puis pousser cette modification.

## Fonctionnement

1. Onglet **Connexion Strava** → Connecter mon compte.
2. OAuth Strava autorise `read,activity:read_all`.
3. Le Worker échange le code et conserve les jetons dans Cloudflare KV.
4. **Synchroniser maintenant** récupère les activités et les affiche dans le dashboard.
5. **Déconnecter et supprimer** révoque l'accès et supprime jetons + cache.
6. Sans connexion, le dashboard continue d'utiliser `data/activities.json`.

## Confidentialité

Cette V1.2 n'envoie pas les données récupérées via l'API Strava à un modèle d'IA. Le cache backend est limité à 7 jours. Les données API ne sont pas commitées dans GitHub.

## Développement local

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`. Pour tester OAuth en production, utiliser le frontend GitHub Pages configuré dans `FRONTEND_URL`.
