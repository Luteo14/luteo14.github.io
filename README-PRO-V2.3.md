# LUTEO14 PRO V2.3 — Migration vers deux Workers

Archive **incrémentale** : copier les fichiers à la racine du dépôt GitHub existant, sans supprimer `.git`. L’application SPORT est inchangée.

## 1. Configuration

Les deux Workers partagent D1 `luteo-pro-docs` et R2 `luteo-pro-private`. Vérifier les bindings `DB` et `FILES`. Le bucket R2 doit rester privé (aucun domaine public ni r2.dev public).

Dans `pro-admin-worker/wrangler.toml`, remplacer `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN` et `ADMIN_EMAIL` par les valeurs exactes de ton application Cloudflare Access. Ne pas utiliser de secret dans GitHub. Vérifier que le JWT Access contient le champ `email` pour ton fournisseur d'identité.

## 2. Déploiement

Depuis VS Code, dans chaque dossier Worker : `npm install`, puis `npx wrangler deploy`. Les commandes ne doivent pas être lancées dans le dossier racine. Si npm présente une erreur de CA, utiliser la configuration de certificats Windows déjà validée, sans désactiver TLS.

## 3. Cloudflare Access

Dans Zero Trust > Access > Applications, créer une application **Workers** qui protège **uniquement** `luteo-pro-admin` en production. Politique `Allow` limitée à ton e-mail, méthode One-time PIN ou identité autorisée. Récupérer l'AUD et le domaine de l'équipe. Le Worker public ne doit pas être inclus dans l'application Access.

**Attention à l'ordre** : déployer le Worker admin avec les variables de vérification configurées, puis appliquer la protection Access. Aucun document sensible avant tests complets.

## 4. Configuration frontend

Mettre à jour `pro/config.js` avec les URL **exactes** affichées par `wrangler deploy`. Les URL fournies sont des exemples plausibles, non vérifiés. Les scripts de pages de prestations utilisent `PUBLIC_API` ; le bouton d'administration utilise `ADMIN_API`. Commit/push dans GitHub Desktop.

## 5. Tests de sécurité avant données confidentielles

Navigation privée sans authentification :
- PUBLIC `/api/public/documents?domain=formation&service=formations-et-certifications-agile` -> `[]` ou documents publics.
- PUBLIC `/admin/` -> 404 ; PUBLIC `/api/admin/documents` -> 404 ; PUBLIC POST -> 405.
- ADMIN `/admin/` -> Cloudflare Access / refus. ADMIN `/api/admin/documents` -> refus.

Après connexion autorisée : ADMIN `/admin/` -> formulaire ; `/api/admin/documents` -> `[]` au départ. Tester avec un fichier PDF **non confidentiel**, le classer `private`, confirmer que l'API publique ne le liste pas et que le téléchargement public par ID échoue. Puis tester publication `public`, mise à jour, suppression.

Ne désactiver l'ancien Worker `luteo-pro-docs` **qu'après** vérification des deux nouveaux Workers. **Ensuite le désactiver** pour ne pas conserver un ancien chemin d'administration accessible.

## Notes de sécurité

- `pro/admin/` sur GitHub Pages est un simple lien public ; l'administration réelle est servie par le Worker privé.
- Le Worker admin exige une signature JWT Access valide, audience et émetteur corrects, et correspondance de `ADMIN_EMAIL` (défense en profondeur).
- La configuration des routes Access et la présence du header `Cf-Access-Jwt-Assertion` doivent être vérifiées sur le déploiement réel.
- Le code ne réalise pas d'analyse antivirus des fichiers ; ne pas distribuer de documents non fiables. Limite applicative : 15 Mo.
