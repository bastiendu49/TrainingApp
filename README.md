# Training-app

Application personnelle de séances guidées et de suivi de progression au poids du corps.
Installable sur Android (PWA), fonctionne hors ligne.

Le détail des fonctionnalités, du programme et des choix de design est dans [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

## Développement

```bash
npm install
npm run dev      # serveur local
npm test         # tests
npm run lint     # vérifications
npm run build    # version de production (dossier dist)
npm run icons    # régénère les icônes
```

Déploiement : chaque push sur `main` est publié automatiquement par Netlify (développer sur une autre branche pour économiser les crédits).

## Sauvegarde en ligne

La fonction `netlify/functions/sync.mts` garde une copie des données dans Netlify Blobs. Elle exige la variable
d'environnement `SYNC_CODE` (réglages Netlify), à saisir aussi dans l'app (Plus › Sauvegarde en ligne).

## Crédits

Police Outfit (licence OFL). Images d'exercices de la base [wger](https://wger.de) sous licence CC-BY-SA, détaillées dans
l'app (Plus › Crédits des images) et dans `src/data/exerciseInfo.ts`.
