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

Déploiement : chaque push sur `main` est publié automatiquement par Netlify.
