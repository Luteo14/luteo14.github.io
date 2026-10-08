# LUTEO14 V1.6 — Design system rose et bleu

Inspiré de principes géométriques et de la vitalité graphique de Paris 2024, sans reprendre d’identité officielle.

## Palette
- Bleu nuit `#111A42` : fond
- Bleu `#3468F5` : actions
- Bleu ciel `#74C9F8` : données et focus
- Rose `#F34D91` : accent et records
- Rose clair `#F9B7D0` : détails
- Violet `#8455D8` : transition

## Installation GitHub Desktop
Copier les fichiers de l’archive à la racine du dépôt existant, **sans supprimer le dossier `.git`**. Effectuer `Commit to main`, puis `Push origin`.

## Architecture préservée
- `/` : portail
- `/pro/` : expertise
- `/sport/` : RUN // DATA
- `/worker/` : Cloudflare Worker (inchangé)

Les données personnelles Strava et le Worker ne sont pas modifiés. Le JavaScript de SPORT reçoit uniquement une nouvelle palette pour les graphiques.
