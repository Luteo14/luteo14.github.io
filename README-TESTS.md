# LUTEO14 V4.9.2 — Quality & Testing

## Installation
Copier les fichiers du pack **à la racine** du dépôt LUTEO14 (pas dans `sport/`).

```powershell
npm install
npx playwright install chromium
npm test
npm run test:report
```

Les tests démarrent un serveur HTTP local sur 127.0.0.1:8766 et n'appellent pas les Workers privés pour écrire des données. Les scénarios de création de séance restent locaux ; aucune sauvegarde D1 n'est exécutée.

## Couverture livrée
- 7 routes SPORT sur desktop et mobile ; navigation et liens internes.
- Affichage des cartes Mon Coach et des boutons de synchronisation.
- Calendrier, verrouillage de sauvegarde, création locale de séance.
- Présence du générateur et de l'export GPX.
- Contrôle statique élémentaire de secrets dans trois scripts publics.

## Limites et prochaines étapes
Ces tests ne prouvent **pas** que l'authentification Cloudflare Access, l'enregistrement D1, la synchronisation Garmin/Strava ou la validité d'un GPX exporté fonctionnent. Pour cela, créer un environnement de test séparé, avec base D1 dédiée, données fictives et identité Access de test. Ne pas exécuter de tests destructifs contre la production.

Si `npm ci` échoue faute de `package-lock.json`, exécuter `npm install` une fois puis commiter le `package-lock.json` généré. Le workflow GitHub Actions utilisera ensuite `npm ci`.

Ne pas ajouter `.venv-garmin`, `.wrangler`, jetons ou exports de santé au dépôt public. Ajouter ces dossiers à `.gitignore` si nécessaire.
