# LUTEO14 V3.4.1 — Correctif connexion Strava

## Diagnostic
Le HAR montre que OAuth Strava se termine, mais que `fetch('/api/status')` depuis github.io est redirigé vers Cloudflare Access, ce qui échoue en contexte CORS. Un cookie Access sur workers.dev n'est pas une solution fiable aux requêtes tierces.

## Solution
La fenêtre `/bridge` est hébergée sur le Worker lui-même et protégée par Cloudflare Access. Les appels `/api/status`, `/api/activities` et `/api/disconnect` sont effectués en **same-origin**. Les activités normalisées sont transmises au Dashboard via `postMessage`, avec vérification stricte de l'origine du Worker, de la fenêtre source et d'un nonce aléatoire. Aucun jeton OAuth ni JWT n'est transmis au frontend.

## Installation
1. Copier `worker/src/index.js` et `sport/js/app.js` dans le repository existant (ne pas remplacer le reste du site).
2. Vérifier la configuration actuelle `worker/wrangler.toml`, en particulier `FRONTEND_URL`, `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `ADMIN_EMAIL`, la liaison KV `TOKENS` et le secret Cloudflare `STRAVA_CLIENT_SECRET`. **Ne pas copier de secrets dans Git.**
3. Dans `worker`, exécuter `npx wrangler deploy`.
4. Tester la fenêtre sécurisée depuis `https://luteo14.github.io/sport/dashboard/?tab=strava` après publication de `sport/js/app.js`.
5. Autoriser les fenêtres contextuelles si le navigateur les bloque. Cliquer « Connecter mon compte Strava » et suivre la fenêtre Access/Strava. Attendre le transfert des activités, puis vérifier Dashboard et Performance.
6. Tester dans une fenêtre privée non authentifiée : `/bridge` et `/api/activities` doivent être protégés par Access.
7. Tester « Déconnecter et supprimer » uniquement si la suppression des données est réellement souhaitée.

## Précautions
- Le Worker reste entièrement protégé par Cloudflare Access ; ne pas ajouter de règle Bypass pour les API.
- Les données déjà publiées dans `/sport/data/activities.json` restent publiques : leur retrait est une opération séparée.
- Le `postMessage` transporte les activités privées vers la page GitHub Pages ouverte par l'utilisateur : cette page demeure publique, et son JavaScript doit rester de confiance. Les activités sont ensuite stockées dans IndexedDB sur l'appareil.
- La suppression efface KV et le cache du navigateur courant, pas les autres appareils ni les anciens fichiers publics.
- Le recalcul des records repose toujours sur les activités normalisées, non sur les meilleurs splits GPS.
- Validation : syntaxe JavaScript seulement ; tests réels Access/Strava à effectuer après déploiement.
