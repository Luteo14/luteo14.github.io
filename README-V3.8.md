# LUTEO14 V3.8 — Mon Coach Running 360° (première intégration)

## Portée exacte
Cette version crée `/sport/coach/`, relie l'accueil SPORT et le Dashboard à cette page, et permet un import **manuel local** de JSON Garmin. Elle ne déploie **pas** de Worker Garmin, ne contacte **pas** l'API Garmin depuis le navigateur et ne synchronise **pas** les données Garmin entre appareils. Le Worker Strava et `sport/js/app.js` V3.7 restent inchangés.

## Installer
Copier `sport/index.html`, `sport/dashboard/index.html` et le dossier `sport/coach/` dans le repository GitHub Pages. Vérifier les différences locales avant remplacement. Publier avec GitHub Desktop. Ouvrir `https://luteo14.github.io/sport/coach/`.

## Exporter manuellement Garmin (sur le PC déjà authentifié)
Dans PowerShell, créer un dossier **hors du repository public** :

```powershell
New-Item -ItemType Directory -Force "$HOME\Garmin-Exports" | Out-Null
python -m garmin_personal_api sleep --date 2026-10-25 --quiet > "$HOME\Garmin-Exports\sleep.json"
python -m garmin_personal_api body-battery --start-date 2026-10-19 --end-date 2026-10-25 --quiet > "$HOME\Garmin-Exports\body-battery.json"
python -m garmin_personal_api hrv --date 2026-10-25 --quiet > "$HOME\Garmin-Exports\hrv.json"
```

Les options globales doivent précéder la sous-commande : si `--quiet` est refusé, utiliser `python -m garmin_personal_api --quiet sleep ...` (et de même pour les autres commandes). **Préférer systématiquement cette seconde forme** :

```powershell
python -m garmin_personal_api --quiet sleep --date 2026-10-25 > "$HOME\Garmin-Exports\sleep.json"
python -m garmin_personal_api --quiet body-battery --start-date 2026-10-19 --end-date 2026-10-25 > "$HOME\Garmin-Exports\body-battery.json"
python -m garmin_personal_api --quiet hrv --date 2026-10-25 > "$HOME\Garmin-Exports\hrv.json"
```

Vérifier que les fichiers sont du JSON valide avant l'import : `python -m json.tool "$HOME\Garmin-Exports\sleep.json" > $null`. Pour les activités, consulter `python -m garmin_personal_api activities --help` puis exporter dans `activities.json` avec les arguments proposés.

Sur la page Coach, cliquer sur **Importer les données Garmin** et sélectionner les fichiers. L'import est conservé dans IndexedDB sur cet appareil uniquement. Un nouvel import du même type remplace le précédent. Les structures de réponse Garmin pouvant varier, une valeur peut afficher « Non disponible » même si le fichier est valide : il faudra alors adapter le mapping après examen d'un exemple anonymisé. Les fichiers importés ne quittent pas le navigateur.

## Sécurité
Ne jamais publier la clé Garmin, les jetons, le cache de jeton, les exports de santé ou `.venv-garmin` sur GitHub. Ne pas ajouter de secrets au code frontend. Les données importées dans un navigateur sur appareil partagé restent accessibles aux autres utilisateurs de ce profil navigateur. La page Coach GitHub Pages est publique, **les données importées ne sont pas publiées**. Pour une synchronisation inter-appareils, une version ultérieure nécessitera une API sécurisée, une gestion d'identité et un stockage privé côté serveur.

## Contrôles
- La page Coach s'ouvre depuis SPORT et Dashboard.
- Les trois imports sont acceptés sans erreur et les cartes affichent des valeurs reconnues ou « Non disponible ».
- Le rechargement conserve les imports.
- « Effacer les données Garmin locales » efface le cache.
- Le Dashboard Strava, la connexion OAuth et le recalcul des records restent fonctionnels.
