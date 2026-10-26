# LUTEO14 V3.5 - Pilotage entrainement et performance

## Installation
Copier uniquement `sport/js/app.js` dans le repository existant, en conservant l'arborescence. Publier via GitHub Desktop, puis recharger le Dashboard avec Ctrl+F5.

## Nouveautes
- Bloc Pilotage de l'entrainement sur le Dashboard : volumes 7 et 28 jours, comparaison, seances, sortie longue.
- Bloc explicatif dans Performance distinguant records extrapoles et predictions Riegel.
- Indication de la provenance et de la date du cache lorsqu'elles sont disponibles.
- Aucune modification du Worker, des jetons, de Cloudflare Access ou des appels OAuth.

## Precisions
- Les fenetres de 7/28 jours sont ancrees sur la derniere activite connue.
- La comparaison 28 jours n'est disponible que si la periode precedente contient des kilometres.
- Les records existants ne sont pas des meilleurs efforts GPS certifies.
- Le cache est toujours local (IndexedDB) et les donnees synchronisees sont conservees par le Worker selon la V3.4.2.

## Verification
1. Ouvrir `/sport/dashboard/` et verifier le bloc Pilotage.
2. Synchroniser via la fenetre Cloudflare Access puis verifier les indicateurs.
3. Ouvrir Performance, recalculer les records et verifier l'encart explicatif.
4. Recharger la page et confirmer la conservation du cache.

## Limites
Patch incremental base sur app.js V3.4.2 fourni. Ne modifie pas le HTML, la logique de calcul des records ni la securite du Worker. A tester sur une branche avant mise en production.
