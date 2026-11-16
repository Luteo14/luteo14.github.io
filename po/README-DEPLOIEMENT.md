# Parcours PO ADEME — site statique Netlify

## Déploiement rapide

1. Décompresser le dossier `site-parcours-po`.
2. Sur Netlify, choisir **Add new site → Deploy manually**.
3. Glisser-déposer le dossier `site-parcours-po` (ou le connecter à un dépôt Git).
4. Aucun build ni commande d’installation n’est nécessaire. Le fichier `netlify.toml` configure le dossier publié à la racine.

La page du parcours est disponible à `/po/`. L’accueil `/` reste celui du patch d’origine ; il contient déjà le lien vers le Parcours PO. Les données JSON, scripts, styles et PDF sont servis comme fichiers statiques.

## Développement local

Depuis ce dossier, lancer un serveur statique, par exemple `python -m http.server 8000`, puis ouvrir `http://localhost:8000/po/`.

## Personnalisation

- Récits des sept étapes : tableau `stories` dans `po/app.js`.
- Rôles et attendus : `po/data.json`.
- Couleurs et styles : variables CSS en tête de `po/parcours-po.css`.

## Contributions et synthèse d’atelier

Le site permet aux participants de donner un avis OK ou « À challenger » pour chaque rôle et étape. Les challenges exigent un commentaire. Les avis sont ajoutés à l’historique local du navigateur et ne remplacent pas les précédents. La page `/po/synthese.html` présente uniquement les compteurs par étape et par rôle, sans afficher les remarques dans les tableaux de synthèse.

Pour consolider les contributions de plusieurs appareils, chaque poste exporte ses données JSON depuis la page de synthèse ; un poste central importe ensuite les fichiers. L’import fusionne les entrées et ignore les identifiants déjà présents. L’export CSV contient les commentaires et constitue l’extraction détaillée à conserver et partager avec précaution. La conservation dépend du navigateur : effacer ses données de navigation supprime l’historique local.
