# LUTEO14 V3.8.3 — Body Battery et actualisation Garmin locale

## Installation
Copier `sport/coach/coach.js` et `sport/coach/index.html` dans le dépôt GitHub Pages. Ne jamais publier le dossier `garmin-local` dans GitHub Pages : il contient un serveur local, à exécuter uniquement sur votre ordinateur.

## Actualiser sans exports JSON
Sur le PC qui dispose du client officiel Garmin :
1. Conserver la clé Garmin dans la variable d'environnement `GARMIN_PERSONAL_API_KEY` de la session PowerShell, sans l'écrire dans le dépôt.
2. Enregistrer `garmin-local/server.py` **hors du dépôt GitHub**, par exemple `$HOME\Garmin-Local\server.py`.
3. Exécuter `python "$HOME\Garmin-Local\server.py"`.
4. Copier le **code de session temporaire** affiché par le serveur dans le champ de la page SPORT > Coach, puis cliquer sur « Actualiser Garmin ».
5. Le serveur récupère 28 jours de Body Battery et 7 jours de sommeil et de VFC. Arrêter le serveur avec Ctrl+C.

Le serveur n'écoute que sur `127.0.0.1:8765`, vérifie l'origine `https://luteo14.github.io` et exige un code aléatoire propre à chaque lancement. La clé Garmin n'est pas transmise au site. Les données sont envoyées directement du serveur local au navigateur et enregistrées en IndexedDB. Elles ne sont pas envoyées à Cloudflare ou GitHub. La connexion Strava n'est pas modifiée.

**Limites :** les navigateurs peuvent bloquer les requêtes d'une page HTTPS vers localhost ou demander une permission d'accès au réseau local. Cette synchronisation n'est disponible que sur l'ordinateur où tourne le serveur Python. Elle n'est pas utilisable sur smartphone et n'est pas une synchronisation Cloudflare entre appareils. Pour une solution multi-appareils, il faudra un backend Garmin authentifié et déployé, avec stockage D1 et contrôles d'accès.

## Graphique
Le graphique affiche **la dernière mesure Body Battery de chaque journée disponible**. Les boutons 7 et 28 jours sélectionnent une fenêtre se terminant à la dernière date mesurée. Les jours manquants ne sont pas inventés. Il ne s'agit ni de la moyenne, ni de la valeur minimale ou maximale quotidienne.

## Vérification
1. Réimporter l'ancien `body-battery.json` : le graphique doit montrer 7 jours, et la carte la dernière valeur disponible.
2. Sélectionner 28 jours : seules les journées présentes dans le fichier sont représentées.
3. Lancer le compagnon et cliquer sur Actualiser Garmin : la date d'import doit changer et la courbe doit inclure les données plus récentes si Garmin les fournit.
4. Recharger la page : les données doivent rester présentes dans IndexedDB.
