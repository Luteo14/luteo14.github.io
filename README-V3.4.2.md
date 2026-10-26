# LUTEO14 V3.4.2 - Correctif synchronisation Strava

## Diagnostic
Le navigateur GitHub Pages ne peut pas appeler directement les routes protegees Cloudflare Access : la redirection vers la page de connexion est bloquee par CORS. Le Worker repond pourtant correctement lors d'une navigation directe.

## Modifications
- `sport/js/app.js` : le bouton **Recalculer les records estimes** n'appelle plus `/api/activities` par `fetch` interdomaines. Il utilise les activites disponibles en memoire et IndexedDB.
- `sport/js/app.js` : rafraichissement de Performance apres synchronisation par la fenetre securisee ; filtre d'annee construit sur les donnees fusionnees.
- `worker/src/index.js` : la revocation Strava est confirmee seulement lorsque l'API renvoie un code HTTP de succes.
- Les boutons Connexion et Synchronisation utilisent la fenetre `/bridge` du Worker, protegee par Cloudflare Access. Aucun secret OAuth n'est transmis au navigateur GitHub Pages.

## Installation
1. Sauvegarder les fichiers actuels, puis copier `sport/js/app.js` et `worker/src/index.js` dans le repository, en conservant les autres fichiers.
2. Dans le dossier `worker`, executer `npx wrangler deploy`.
3. Publier les modifications GitHub Pages (commit et push).
4. Ouvrir le Dashboard, effectuer un rechargement force, puis cliquer sur **Connecter mon compte Strava** ou **Synchroniser maintenant**. Autoriser les popups si necessaire.
5. Dans la fenetre Cloudflare Access, s'authentifier si demande. Verifier le message `N activites transferees au Dashboard`.
6. Dans Performance, cliquer sur **Recalculer les records estimes**. Aucune requete directe `/api/activities` ne doit partir de `app.js`.
7. Recharger la page et verifier que les donnees restent disponibles (IndexedDB).

## Limites et controles
- La protection Cloudflare Access reste active. Ne pas l'enlever ni ouvrir les routes API au public.
- Les appels du bridge vers `/api/status` et `/api/activities?sync=1` s'executent sur le meme domaine Worker, et non depuis GitHub Pages.
- Une session Access expiree peut demander une nouvelle authentification dans la fenetre securisee.
- Le JSON historique public `sport/data/activities.json` reste accessible sur GitHub Pages : le supprimer si les donnees doivent etre privees.
- La synchronisation Strava est plafonnee par le code existant a 20 pages de 100 activites.
- Le cache local est propre a chaque navigateur. La suppression sur un appareil ne purge pas automatiquement les autres appareils.
- Les tests syntaxiques JavaScript sont effectues, mais l'authentification et les appels API reels doivent etre testes sur ton compte Cloudflare.
