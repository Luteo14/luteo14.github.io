# LUTEO14 V3.9 - Garmin Cloudflare D1

## Portee reelle
Cette version synchronise Garmin **a la demande depuis un PC** vers Cloudflare D1 via le client Python officiel, puis permet de **consulter les donnees depuis n'importe quel appareil** par Cloudflare Access. Le bouton sur smartphone recharge les donnees deja deposees dans D1; il ne declenche PAS une nouvelle interrogation Garmin. Une synchronisation Garmin directement depuis Cloudflare sans PC necessite de porter le protocole officiel en JavaScript ou d'heberger un service Python autorise.

## Fichiers
- `sport/coach/coach.js` et `sport/coach/index.html` : nouvelle lecture Cloudflare via popup securisee; import JSON et compagnon local V3.8.3 conserves.
- `garmin-cloud-worker/src/index.js` : API protegee, verification JWT Cloudflare Access, D1.
- `garmin-cloud-worker/migrations/001_garmin.sql` : tables dediees.
- `garmin-uploader/sync.py` : transfert manuel Python vers D1, **a conserver hors du repository public**.

## Installation
1. Dans `garmin-cloud-worker/wrangler.toml`, renseigner `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ADMIN_EMAIL`. Conserver les identifiants D1 si cette base est bien la bonne.
2. Dans `garmin-cloud-worker`, executer `npx wrangler d1 execute luteo-pro-docs --remote --file=./migrations/001_garmin.sql`, puis `npx wrangler deploy`.
3. Creer une application Cloudflare Access pour le Worker `luteo-garmin-cloud` (production URLs), avec une politique Allow Emails limitee a votre adresse. Renseigner l'AUD de cette application dans `wrangler.toml`, puis redeployer. Ne pas exposer l'API upload sans Access.
4. Adapter `GARMIN_CLOUD_BASE` dans `sport/coach/coach.js` a l'URL exacte du Worker deployee.
5. Copier seulement les deux fichiers `sport/coach/` dans GitHub Pages et publier.
6. Installer `cloudflared` sur le PC, puis `cloudflared access login --app https://VOTRE-WORKER.workers.dev`.
7. Conserver `garmin-uploader/sync.py` **hors de GitHub**, avec la cle dans `GARMIN_PERSONAL_API_KEY`. Configurer `$env:LUTEO_GARMIN_WORKER='https://VOTRE-WORKER.workers.dev'` puis `python sync.py`.
8. Sur smartphone ou PC, cliquer « Actualiser depuis Cloudflare », s'authentifier, verifier la date et les indicateurs.

## Securite
- Jamais de cle Garmin dans le navigateur ou GitHub Pages.
- L'API Worker ne fournit pas d'en-tetes CORS pour la lecture interdomaines; elle utilise une navigation popup et `postMessage` controle par origine, fenetre et nonce.
- Le Worker verifie la signature, l'emetteur, l'audience, la validite et l'email du JWT Access.
- Les donnees Garmin de sante sont stockees dans D1 : configurer un controle d'acces strict et une politique de retention.
- L'API `POST /api/upload` accepte seulement une session Access proprietaire; ne jamais publier une policy Everyone.
- `GET /health` ne contient aucune donnee privee.
- La suppression cloud, la retention automatique et la rotation des secrets ne sont pas encore implementees. Ne pas considerer cette version comme une solution de production complete avant ces controles.

## Tests
- Fenetre privee: `GET /api/snapshot` doit exiger Cloudflare Access.
- Compte autorise: `GET /api/snapshot` renvoie les categories sauvegardees.
- Depuis le Dashboard: clic « Actualiser depuis Cloudflare », popup Access, reception des donnees, courbe Body Battery, persistance apres F5.
- Controle sur smartphone: meme resultat apres connexion Access.
- Strava: verifier que la connexion, la synchronisation et les records sont toujours fonctionnels.

## Limites
- Pas de rafraichissement Garmin autonome depuis le cloud: le PC doit executer `sync.py` a chaque nouvel import.
- Aucune execution en arriere-plan, aucune tache planifiee.
- Le flux `cloudflared access token` peut varier selon la version de cloudflared et la politique Access; tester et ajuster au besoin.
