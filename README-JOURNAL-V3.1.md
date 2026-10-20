# LUTEO14 SPORT V3.1 — Journal de courses

## Installation
Copier `sport/photos/` et `sport/assets/photos/` dans le dépôt GitHub Pages existant. La navigation SPORT V3.0 vers `/sport/photos/` reste valable. Ne pas effacer les autres dossiers.

## Fonctionnalités
- Albums personnalisables : nom, date, lieu, description, URL d’activité Strava.
- 20 photographies V3.0 visibles dans « Archives personnelles » (sans inventer de date ou compétition).
- Ajout de JPG/PNG/WebP depuis mobile ou ordinateur, redimensionnement et stockage local IndexedDB.
- Recherche, filtrage, visionneuse, changement d’album et suppression des ajouts locaux.
- Export JSON avec photos encodées et import pour sauvegarde/transfert manuel.

## Limites importantes
GitHub Pages est statique. Les photos ajoutées par le formulaire sont stockées uniquement dans le navigateur courant, **pas sur GitHub ni sur Cloudflare**, et ne sont pas visibles sur les autres appareils. Vider les données du navigateur peut les effacer. L’export JSON est indispensable pour sauvegarder. Les 20 photos de base sont publiques sur GitHub Pages. Les dates, compétitions et liens Strava n’ont pas été inventés : renseigne-les dans tes albums.

Pour une vraie publication multi-appareils, il faudra une API authentifiée (Cloudflare Access), un Worker dédié et R2 privé/public avec contrôle de visibilité. Ne pas utiliser le Worker documentaire PRO tel quel pour publier des photos sans définir les autorisations.

## Vérifications
1. `/sport/photos/` affiche les 20 photos initiales.
2. Créer un album, ajouter une photo, actualiser la page : l’ajout reste visible sur ce navigateur.
3. Exporter puis importer sur un autre navigateur : l’album et la photo apparaissent.
4. Vérifier qu’aucune photo ajoutée localement n’est publiée automatiquement sur GitHub.
