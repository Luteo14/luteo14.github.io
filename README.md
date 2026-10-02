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

## V1.3 — Vue Performance

La navigation inclut désormais un onglet **Performance** qui calcule localement, à partir des activités de course :

- records estimés sur 5 km, 10 km, semi-marathon et marathon ;
- lien direct vers l'activité Strava utilisée comme référence quand son identifiant est disponible ;
- prévisions théoriques 5 km → marathon avec le modèle de Riegel (exposant 1,06) ;
- meilleure référence récente (180 jours) ;
- évolution annuelle de l'équivalent 10 km ;
- tableau des meilleures activités de référence.

### Important sur les records

L'export d'activités ne contient pas les temps de passage détaillés. Un « record » affiché est donc une **estimation** obtenue à partir de l'allure moyenne d'une activité dont la distance est proche de la distance cible (± environ 5 à 15 %). Le site le signale explicitement et fournit le lien Strava de l'activité source.

`prepare_data.py` exporte maintenant `id` et `strava_url`. Après un nouvel export Strava, relancer :

```bash
python prepare_data.py
```

Pour la synchronisation API, le Worker renvoie également `id` et `strava_url`.
