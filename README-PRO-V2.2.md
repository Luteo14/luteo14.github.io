# LUTEO14 PRO V2.2 — Installation et sécurité

## Architecture
- GitHub Pages : vitrine publique et liste des documents **publics**.
- Worker Cloudflare **distinct du Worker Strava** : administration et API.
- Cloudflare Access : contrôle d’identité sur `/admin/*` et `/api/admin/*`.
- Cloudflare R2 : bucket **privé** `luteo-pro-private`.
- Cloudflare D1 : métadonnées documentaires.

## Installation
1. Depuis le tableau de bord Cloudflare, créez un bucket R2 privé `luteo-pro-private` et une base D1 `luteo-pro-docs`.
2. Dans `pro-doc-worker/wrangler.toml`, remplacez `database_id` par l’ID D1. Ne touchez pas au Worker Strava.
3. Dans `pro-doc-worker`, lancez `npm install`, puis `npx wrangler d1 execute luteo-pro-docs --remote --file=./schema.sql` et `npm run deploy`.
4. Dans Cloudflare Zero Trust > Access > Applications, créez une application **Self-hosted** pour l’hôte exact du Worker. Protégez les chemins `/admin/*` et `/api/admin/*` (et `/admin`), avec une politique **Allow** limitée à votre adresse e-mail. Selon les possibilités de configuration de chemins de votre compte, utilisez des applications Access séparées ou des règles correspondantes. Vérifiez qu’aucun chemin administratif n’est exclu de la protection.
5. Récupérez l’**Application Audience (AUD)** dans Access et le domaine de l’équipe (`https://VOTRE-EQUIPE.cloudflareaccess.com`) puis renseignez `ACCESS_AUD` et `ACCESS_TEAM_DOMAIN` dans `wrangler.toml`; redéployez.
6. Modifiez `pro/config.js` avec l’URL publique exacte du nouveau Worker, puis publiez le dossier `pro/` sur GitHub Pages.
7. Ouvrez `/pro/admin/` puis cliquez sur **Ouvrir l’administration sécurisée**. La page d’administration est servie directement par le Worker, sous la protection Access.

## Vérifications de sécurité impératives
- Sans connexion : `/admin/` et `/api/admin/documents` doivent être bloqués par Cloudflare Access; le Worker vérifie également la signature, l’émetteur et l’audience du JWT Access.
- Avec connexion : ajout, modification, suppression et téléchargement privé fonctionnent.
- L’URL `/api/public/documents` n’affiche que les documents marqués **publics**.
- Vérifiez que R2 n’a **aucun accès public** activé.
- Ne mettez jamais de documents privés dans GitHub, même si la page semble protégée.
- Testez dans une fenêtre privée avant d’utiliser des documents sensibles.

## Limites et précautions
- Le formulaire accepte PDF, DOC(X), PPT(X), XLS(X) et TXT jusqu’à 15 Mo. Les téléchargements sont forcés en pièces jointes, sans prévisualisation HTML.
- La vérification MIME s’appuie sur le navigateur; une analyse antivirus et un contrôle du type réel sont recommandés avant ouverture aux utilisateurs externes.
- Les documents marqués « public » sont accessibles à toute personne disposant du lien, même sans connexion.
- Aucun système de versions ni corbeille : la suppression est définitive; prévoyez des sauvegardes R2/D1.
- Les chemins Access, les quotas et la facturation dépendent du compte Cloudflare; vérifiez les paramètres dans le tableau de bord.
- L’administration est **non opérationnelle** tant que les étapes Cloudflare ci-dessus ne sont pas effectuées.
