# LUTEO14 V3.4 - Securisation Strava

## Important : precondition Cloudflare Access

Le Worker `luteo-strava-api` doit etre protege **sur toutes ses URL** par une application Cloudflare Access (Workers / production URL), avec une politique `Allow` restreinte a votre adresse e-mail. Le code verifie egalement le JWT Access et l'e-mail administrateur. Ne pas activer le frontend tant que les tests ci-dessous ne sont pas concluants.

**Limite navigateur :** depuis GitHub Pages, les appels `fetch` cross-site avec cookies Access peuvent etre bloques par les navigateurs refusant les cookies tiers. Le test doit etre fait sur votre navigateur reel. Dans ce cas, un domaine personnalise sous le meme site ou un schema de session adapte est necessaire. Ne pas desactiver Access pour contourner ce probleme.

## Installation

1. Fusionner les fichiers dans le depot local. Verifier que `worker/wrangler.toml` contient le bon KV namespace et les variables existantes.
2. Dans Cloudflare Zero Trust > Access > Applications, creer une nouvelle application **Workers** sur `luteo-strava-api` (pas le Worker PRO), production. Politique Allow > Emails > votre e-mail. Activer One-time PIN si necessaire.
3. Recuperer l'Application Audience (AUD) de cette application (distincte des autres) et le Team Domain; renseigner `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `ADMIN_EMAIL` dans `worker/wrangler.toml`.
4. Verifier `STRAVA_CLIENT_SECRET` via Cloudflare Secrets; ne jamais le mettre dans GitHub. Dans `worker/`: `npx wrangler deploy`.
5. **Avant de publier GitHub Pages**, en navigation privee, ouvrir `https://luteo-strava-api.luteo-strava-api.workers.dev/api/status` : Access doit demander une connexion; apres connexion le Worker doit afficher le statut JSON.
6. Tester avec un compte non autorise : acces refuse. Tester les routes `/api/activities` et `/api/disconnect` sans session : aucun acces aux donnees, aucune suppression.
7. Publier `sport/js/app.js` sur GitHub et tester les boutons Strava, y compris `Synchroniser maintenant`, sur ordinateur et smartphone.

## Confidentialite et limites

- KV `single-athlete-token` et `single-athlete-cache` sont reserves a un administrateur. Ne pas reutiliser cette architecture multi-utilisateur sans isolation par identite.
- `POST /api/disconnect` efface les jetons et le cache KV, tente de revoquer l'autorisation Strava et efface le cache IndexedDB de ce navigateur. Il ne supprime **pas** les exports CSV/JSON publies dans GitHub ni les caches d'autres navigateurs.
- `DELETE /api/data` efface les jetons et cache KV, sans revocation distante; route reservee a l'administrateur et non exposee dans l'interface.
- Un `activities.json` commite sur un depot GitHub public reste **public**, meme si le Worker est protege. Retirer les donnees sensibles de GitHub et de son historique si necessaire.
- OAuth: callback `/auth/callback` exige une session Access valide, ainsi que le cookie `oauth_state` et le parametre `state` correspondant. Les cookies tiers et les restrictions cross-origin peuvent empecher la synchronisation depuis GitHub Pages.
- Ne pas partager les cookies `CF_Authorization`, les JWT ou les secrets.

## Verification / retour arriere

Si la connexion echoue, lancer `npx wrangler tail luteo-strava-api --format pretty` puis verifier AUD, Team Domain, e-mail, protection Access et comportement des cookies dans le navigateur. Conserver une copie du Worker precedent pour retour arriere, sans remettre en production ses routes non protegees.
