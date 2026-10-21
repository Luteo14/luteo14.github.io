# LUTEO14 SPORT V3.2 — Journal cloud

## Contenu
Patch incrémental sur V3.1/V3.0. Ne remplace pas les autres pages SPORT ou PRO.

- `sport/photos/` : consultation des albums publics et des 20 archives existantes, lien vers administration sécurisée.
- `journal-public-worker/` : API publique lecture seule, ne révèle jamais albums/photos privés.
- `journal-admin-worker/` : interface d'administration, API authentifiée, stockage R2 et D1.

## Pré-requis
- Cloudflare Wrangler connecté (`npx wrangler whoami`).
- D1 `luteo-pro-docs` et bucket R2 **privé** `luteo-pro-private` existants.
- Les noms de bindings DB et FILES dans les deux `wrangler.toml` correspondent au code.
- Sauvegarder D1 avant toute migration de schéma.

## 1. Initialiser les tables
Depuis `journal-admin-worker` :

```powershell
npm install
npx wrangler d1 execute luteo-pro-docs --remote --file=./schema.sql
```

Ces tables `running_albums` et `running_photos` sont distinctes de la bibliothèque documentaire PRO. Le schéma utilise `IF NOT EXISTS`.

## 2. Déployer le Worker public
Depuis `journal-public-worker` :

```powershell
npm install
npx wrangler deploy
```

URL attendue (à confirmer avec Wrangler) : `https://luteo-sport-journal-public.luteo-strava-api.workers.dev`.
Tester `/api/albums` et `/api/photos` (retour `[]` avant ajouts). Tester `/admin/` et POST `/api/albums` : refus 404/405. Ne pas configurer Cloudflare Access sur ce Worker.

## 3. Déployer et protéger le Worker privé
Depuis `journal-admin-worker` :

```powershell
npm install
npx wrangler deploy
```

Dans Cloudflare Zero Trust, créer une **nouvelle** application Access de type **Workers** dont le scope est **uniquement** `luteo-sport-journal-admin`. Politique `Allow` limitée à ton adresse e-mail ; aucune règle `Everyone`. Le Worker public reste hors de cette application. Sélectionner production et éventuellement preview, selon le besoin.

Récupérer le **nouvel AUD** de cette application et le Team Domain. Renseigner dans `journal-admin-worker/wrangler.toml` : `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN` (URL https://...cloudflareaccess.com, sans slash final) et `ADMIN_EMAIL`. Le nouvel AUD n'est pas forcément celui de l'application PRO précédente.

Redéployer depuis `journal-admin-worker` :

```powershell
npx wrangler deploy
```

**Ne jamais contourner la vérification JWT pour résoudre un 403.** Les routes privées vérifient le JWT signé et l'adresse e-mail.

## 4. Vérifier la sécurité AVANT publication
1. En navigation privée, `https://luteo-sport-journal-admin.<sous-domaine>.workers.dev/admin/` doit afficher Cloudflare Access.
2. Après authentification autorisée, créer un album privé et une photo privée de test ; télécharger la photo depuis l'administration.
3. Les endpoints du Worker public `/api/albums`, `/api/photos`, `/api/photos/{id}/image` ne doivent pas révéler la photo privée (404).
4. Passer un album et une photo en public ; vérifier leur apparition via Worker public. Repasser l'album en privé et confirmer que le téléchargement public est refusé.
5. Vérifier que R2 n'a ni domaine public ni accès `r2.dev`.
6. Tester un compte non autorisé : accès refusé.

## 5. Publier GitHub Pages
Dans `sport/photos/config.js`, remplacer les deux URL si les adresses affichées par Wrangler diffèrent. Copier le dossier `sport/photos/` dans ton dépôt GitHub. Les 20 archives WebP de la V3.0 restent sous `sport/assets/photos/` : ne pas les supprimer.

Commit GitHub Desktop : `LUTEO14 V3.2 - Journal cloud R2 D1 Access`.

## Gestion et limites
- Photos JPG, PNG, WebP jusqu'à 8 Mo ; limite côté Worker. Redimensionner sur le téléphone si nécessaire.
- Albums publics ou privés ; photos publiques ou privées. Une photo publique dans un album privé reste inaccessible au Worker public.
- Les nouvelles photos sont persistantes et visibles depuis plusieurs appareils, à condition de se connecter pour les privées.
- La photothèque historique (20 photos déjà publiées sur GitHub Pages) **reste publique**. La rendre privée nécessite de les retirer du dépôt public, et de vérifier les caches/historiques.
- Les ajouts locaux IndexedDB de V3.1 ne sont **pas automatiquement migrés**. Exporter une sauvegarde V3.1 puis réimporter les photos manuellement via l'administration V3.2 (aucune migration automatisée fournie).
- Le backend utilise les ressources D1/R2 existantes mais de nouvelles tables et un préfixe R2 `sport-journal/` ; ne modifie pas les documents PRO.
- Les fichiers de code et paramètres ne contiennent pas de mot de passe. Ne jamais placer des clés privées dans GitHub Pages.
- Les coûts/quotas Cloudflare dépendent du compte et du volume réel. Sauvegarder régulièrement les ressources.

## Déploiement validé ?
Syntaxe JavaScript vérifiée localement. Tests Cloudflare Access, R2, D1, téléversement réel et navigateur à réaliser sur ton compte.
