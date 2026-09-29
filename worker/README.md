# Backend Strava — Cloudflare Worker

Ce Worker garde le `STRAVA_CLIENT_SECRET` hors de GitHub Pages, gère OAuth2, le renouvellement du jeton, un cache maximum de 7 jours et la révocation.

## Déploiement

1. Créer une application Strava dans https://www.strava.com/settings/api
2. Installer Node.js, puis dans ce dossier : `npm install`
3. Se connecter à Cloudflare : `npx wrangler login`
4. Créer le KV : `npx wrangler kv namespace create TOKENS`
5. Copier l'identifiant KV dans `wrangler.toml`.
6. Mettre le Client ID dans `wrangler.toml`.
7. Enregistrer le secret sans le committer : `npx wrangler secret put STRAVA_CLIENT_SECRET`
8. Déployer : `npm run deploy`
9. Dans Strava, mettre comme Authorization Callback Domain le domaine du Worker (sans https:// et sans chemin).
10. Dans `../js/config.js`, remplacer l'URL par celle du Worker, puis commit/push sur GitHub.

Le callback OAuth utilisé est automatiquement : `https://<worker>/auth/callback`.
