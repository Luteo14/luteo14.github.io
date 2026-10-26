# LUTEO14 V4.0 - Synchronisation Garmin directe via Cloudflare

## Contenu
- `garmin-cloud-worker/src/index.js` : authentification Garmin Personal API et synchronisation a la demande.
- `sport/coach/coach.js` : reception des snapshots depuis la fenetre securisee.
- `sport/coach/index.html` : bouton de synchronisation et libelles mis a jour.

Le fichier `wrangler.toml` n'est volontairement PAS remplace : conservez votre configuration V3.9 actuelle.

## Installation
1. Sauvegarder le repository et les fichiers existants.
2. Copier les trois fichiers aux emplacements indiques.
3. Dans `garmin-cloud-worker`, executer `npx wrangler secret put GARMIN_PERSONAL_API_KEY`. Coller la cle uniquement dans l'invite Wrangler. Ne jamais la mettre dans Git.
4. Verifier que l'application Cloudflare Access protege la production URL `luteo-garmin-cloud` et que le Worker valide son AUD et l'adresse autorisee.
5. Verifier que la migration V3.9 a cree la table `garmin_snapshots` dans D1. Ne pas relancer aveuglement des migrations.
6. Dans `garmin-cloud-worker`, executer `npx wrangler deploy`.
7. Publier les deux fichiers `sport/coach/` via GitHub Desktop.
8. Ouvrir `/sport/coach/`, cliquer sur **Synchroniser Garmin via Cloudflare**, s'authentifier via Access et cliquer sur **Synchroniser Garmin maintenant** dans la fenetre securisee.
9. Verifier sommeil, VFC, Body Battery, graphique 7/28 jours et persistence apres rechargement. Tester aussi depuis smartphone.

## Securite
- Ne pas ajouter de cle Garmin ou de jeton dans les fichiers du site.
- Le Worker exige le JWT Cloudflare Access valide pour `/bridge`, `/api/sync`, `/api/snapshot`, `/api/upload`.
- Les appels Garmin et l'echange de cle sont executes uniquement dans le Worker.
- L'API ne fournit pas de CORS aux appels JavaScript interdomaines : la fenetre securisee utilise `postMessage` avec controle d'origine, de fenetre et de nonce.
- Les donnees de sante sont conservees dans D1 et dans IndexedDB apres consultation ; les suppressions et la retention doivent etre definies avant une exploitation reguliere.

## Limites
- Le Worker effectue 16 appels Garmin (1 jeton, 1 Body Battery, 7 sommeil, 7 VFC) par synchronisation. Une limitation de debit ou un temps d'execution maximum peut necessiter une synchronisation en plusieurs lots.
- Une erreur sur une des requetes Garmin empeche la mise a jour des trois categories : les snapshots precedents restent disponibles.
- Le bouton ne lance aucune synchronisation en arriere-plan : elle est uniquement a la demande.
- Les donnees d'entrainement Strava et les autres Workers restent inchanges.
- Le code a passe les verifications syntaxiques ; l'authentification Garmin et le deploiement Cloudflare doivent etre testes dans le compte reel.
