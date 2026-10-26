# LUTEO14 V3.8.1 — Correctif Body Battery

Remplacer uniquement `sport/coach/coach.js` dans le repository GitHub Pages.

Corrections : décodage JSON UTF-16 LE/BE (exports PowerShell Windows) et UTF-8 ; lecture des tableaux Garmin `bodyBatteryValuesArray` avec index déterminés par `bodyBatteryValueDescriptorDTOList` ; sélection de la dernière mesure datée disponible.

Déploiement : commit et push GitHub ; aucun redéploiement Cloudflare nécessaire. Recharge forcée, puis réimporte `body-battery.json`. Vérifie la valeur et la date. Le stockage reste local IndexedDB.

La dernière valeur du fichier de test daté du 25/10/2026 est 50/100. Il ne s'agit pas d'une mesure actuelle.
