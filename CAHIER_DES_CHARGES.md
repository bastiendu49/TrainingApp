# Cahier des charges — application de suivi sport

Application personnelle (un seul utilisateur) de suivi des séances au poids du corps (calisthenics), faites à la maison.
Démarche : 1) fonctionnalités ✅ · 2) données et sauvegarde · 3) interface et design · 4) déploiement et utilisation.

> Le prototype actuel (`index.html`, `app.js`…) a été fait avant ces décisions : il servira de base et sera adapté.

---

## 1. Fonctionnalités (V1)

### 1.1 Séance guidée (le cœur de l'app)
Tout s'enchaîne automatiquement, sans lancer chaque exercice à la main (défaut principal de Pumped).

- Une séance = **échauffement** (checklist) → **travail technique** → **circuit(s)**.
- Un circuit = une liste d'exercices × N tours, avec :
  - **repos entre exercices** (réglable par circuit, 0 possible, modifiable en direct pendant la séance) ;
  - **repos entre tours** (réglable séparément).
- Écran de l'exercice en cours : nom, illustration, objectif, **en petit : perf et difficulté de la dernière fois**, exercice suivant.
- **Exercice en répétitions** : je le fais, puis je valide. Le nombre de reps est **pré-rempli avec la dernière perf**, modifiable (− / +).
- **Exercice en durée** : le **chrono démarre automatiquement** à la fin du repos.
  - Si j'appuie sur « Stop » avant la fin, c'est le temps réel qui est enregistré.
  - Si le chrono va au bout, le temps cible est enregistré.
- Après chaque exercice, le repos suivant démarre automatiquement.
- **Bip sonore sur les 3 dernières secondes** de chaque repos et de chaque chrono.
- **Difficulté ressentie de 1 à 5 à la fin de chaque tour** de circuit.
- **Commentaire libre en fin de séance** (douleur, forme…).
- Écran toujours allumé pendant la séance.
- Résumé en fin de séance.

### 1.2 Types d'exercice
- Répétitions · Répétitions par côté · Durée · Max · Jusqu'à l'échec.
- Charge : **poids du corps** par défaut, ou **lesté +X kg**.
- Propositions de progression (ex. objectif atteint sur tous les tours → +reps ou variante plus dure).
- Pas de calcul de disques.

### 1.3 Travail technique : échelles de niveaux
- Chaque technique a une suite de niveaux, chacun avec un **critère de validation**.
- L'app affiche le niveau actuel et son critère. Quand le critère est atteint, elle propose de passer au niveau suivant (et la date est notée).
- Il est possible de **revenir à un niveau précédent** (cas vécu : 90° + pompe trop dur, retour aux soulevés de pieds).
- En séance : un exercice seul, répété sur N séries, avec repos entre les séries.
- Règle propre aux tractions lestées : 4 séries au même lest. Quand **4 × 5 reps** sont atteintes, l'app propose d'augmenter le lest. Le palier est libre, selon le matériel disponible.

### 1.4 Programmes
- Programme hebdomadaire de 4 séances (voir §1.7), modifiable.
- Objectif par exercice dans chaque séance.
- Échauffements réutilisables, **ajout/suppression facile d'exercices** dans la checklist.

### 1.5 Suivi
- **Fiche par exercice** : record (max), courbe d'évolution, historique, consignes, variantes.
- Modifier une séance passée.
- Calendrier des séances.
- **Bilan mensuel** : début du mois vs maintenant, avec les courbes.
- Poids et mensurations avec courbes.
- Plus tard : photos de progression, nutrition. Pas de rappels/notifications.

### 1.6 Illustrations
- **Images libres** (base wger, CC-BY-SA, auteur cité) quand elles existent, sinon **pictogramme**.
- Pour chaque exercice, je peux **changer l'illustration choisie** et **ajouter ma propre photo**.
- Consignes rédigées pour l'app (sans référence aux pages du livre).

### 1.7 Historique initial
Saisir l'historique noté au crayon (≈ 9 séances) avec des dates approximatives (1 par semaine en remontant).

---

## Programme actuel

**Semaine** : J1 Push · J2 Pull A · J3 repos · J4 Jambes · J5 Épaules · J6-J7 repos.
Chaque séance : échauffement → travail technique → circuit. Le circuit se fait en 3 tours.

| Jour | Échauffement | Technique | Circuit |
|---|---|---|---|
| J1 | Haut du corps | 90° | Push |
| J2 | Haut du corps | Muscle up | Pull A |
| J4 | Bas du corps | Back lever | Jambes |
| J5 | Haut du corps | Équilibre | Épaules |

### Travail technique (repos 2 min entre séries, 3 min pour les tractions lestées)

| Technique | Niveau actuel | Dernière séance | Niveaux suivants (critère) |
|---|---|---|---|
| 90° | Soulevés de pieds alternés (valider : 10 reps, 2 pieds en l'air 1 s) | 8 × 20 reps | 90° + pompe (10 reps, pieds en l'air 1 s) → 90° (tenir 5 s) |
| Muscle up | Tractions lestées 17 kg, 4 séries | 5/5/5/4 | Muscle up (5 reps) |
| Back lever | Skin the cat (valider : 5 reps jambes tendues) | 6 × 3 reps | Back lever négatif (tenir 2 s jambes tendues) → Straddle back lever, optionnel (2 s jambes fermées) → Back lever (5 s) |
| Équilibre | Équilibre sans appui, objectif 6 × 30 s | 30/13/20/30/30/28 s | Pompes en équilibre : négatives dos au mur (10 reps) → pompes dos au mur (8 reps) → négatives sans mur (8 reps) → pompes en équilibre (5 reps) |

Historique noté :
- Soulevés de pieds : 10/10/10 · 20 × 8 · 20 × 8 (dont une séance notée 20/20/20/20 + 20/20/20/20).
- 90° + pompe (essai, abandonné) : 5/6/5/6/5/5/5/5.
- Tractions lestées 13 kg (repos 2 min) : 5/4/4/3 · 5/5/4/4 · 5/5/5/3 · puis repos 3 min : 5/5/5/4 · 5/5/5/5.
- Tractions lestées 17 kg : 4/4/4/3 · 5/4/4/3 · 5/5/4/4 · 5/5/5/4.

**Pompes en équilibre** = suite de l'échelle « Équilibre » (niveaux 1 à 3 du livre déjà maîtrisés, on démarre au niveau 4 du livre une fois l'équilibre 6 × 30 s validé) :
- Négatives dos au mur : 10 reps, arrêt contrôlé à n'importe quelle hauteur.
- Pompes en équilibre dos au mur : 8 reps.
- Négatives sans mur : 8 reps.
- Pompes en équilibre : 5 reps.

### Circuits (3 tours, repos entre tours 2 min sauf mention)

**Push**, repos entre exos 40 s
| Exercice | Type | Objectif | Dernière perf |
|---|---|---|---|
| Pompes diamant | reps | 15 | 15/15/15 |
| Pompes archer alternées | reps / côté | 12 | 12/12/11 |
| Extensions triceps | reps | 10 | 10/10/10 |
| Gainage pieds alternés | reps / côté | 10 | 10/10/10 |
| Bateau | durée | 40 s | 40/40/40 |
| Planche inversée | durée | 30 s | 30/30/30 |

**Pull A**
- Partie 1, 3 tours, repos entre tours 3 min : Tractions explosives (max, variante lestée 2-3 kg). Dernière perf : 6/6/6.
- Partie 2, repos entre exos 60 s :

| Exercice | Type | Objectif | Dernière perf |
|---|---|---|---|
| Muscle ups négatifs | reps | 6 | 4/3/3 |
| Dips droit | reps | 15 | 15/15/15 |
| Tractions supination | reps | 10 | 6/6/5 |
| Tractions pronation | reps | 10 | 6/5/4 |
| Tractions australiennes | reps | 20 | 20/20/20 |
| Montées de jambes explosives | reps | 10 | 10/10/8 |

**Jambes** (partie 1 seulement), repos entre exos 45 s
| Exercice | Type | Objectif | Dernière perf |
|---|---|---|---|
| Fentes cosaques | reps / côté | 12 | 12/12/12 |
| Fentes alternées (non sautées) | reps / côté | 10 | 10/10/10 |
| Chaise | durée | 45 s | 45/45/45 |
| Montée de mollets | reps | 20 | 20/20/20 |

**Épaules** (partie 2 seulement), repos entre exos 40 s
| Exercice | Type | Objectif | Dernière perf |
|---|---|---|---|
| Pompes piquées | reps | 12 | 12/12/12 |
| Pseudo-pompes | reps | 12 | 12/12/12 |
| Gainage reach up | reps / côté | 12 | 12/12/12 |
| Épaule à épaule | reps | 20 | 20/20/20 |
| Planche inversée | durée | 30 s | 30/30/30 |

Historique complet des circuits : voir les photos du livre (séries notées XX/XX/XX par séance).

### Échauffements (checklists modifiables)
- **Haut du corps** (5 min max) :
  - moulinets poignets, coudes et épaules : 10-15 par sens
  - torsions de buste : 10-15 par côté
  - extensions et flexions de poignets : 5 par angle
  - tractions australiennes faciles : 10-15 reps
  - pompes à genoux : 15-20 reps
- **Bas du corps** (3 min max) : montées de mollets, montées d'orteils, squats, fentes cosaques alternées, fentes alternées, montées de genoux allongé, chacun 20-30 s.

---

## 2. Données et sauvegarde ✅
- **Option B retenue** : données stockées sur le téléphone (l'app marche hors ligne), puis **synchronisées automatiquement en ligne** dès qu'il y a du réseau.
- Stockage en ligne : **Netlify Blobs**, lu et écrit par une petite fonction Netlify, sur le compte Netlify existant. Aucun nouveau compte.
- Accès protégé par un **code secret personnel** (variable d'environnement Netlify), saisi une seule fois sur le téléphone.
- Les photos d'exercices ajoutées sont sauvegardées aussi.
- L'export/import manuel en fichier reste disponible en secours.
- Consultation sur PC possible mais pas prioritaire.

## 3. Interface et design
- Thème clair/sombre qui **suit le réglage du téléphone**.
- Affichage **simple** : seulement l'information utile, assez de couleur pour donner envie, ergonomique et intuitif.
- **Gros chiffres et gros chrono**, lisibles d'un coup d'œil (téléphone généralement proche).
- **Direction retenue : « Anneaux, couleurs Terre »**. C'est la structure de la direction C, avec la palette de meal-app. Maquette : https://claude.ai/artifact/ALtiF3qVmuDgeHmg4A17EN (planche « C + A »).
  - Police **Outfit**.
  - Clair : fond crème `#fff7ee`, cartes blanches, texte `#2a1b12`, accent terracotta `#a9420e`.
  - Sombre : fond `#1c140f`, cartes `#2a1f18`, texte `#f6ebe1`, accent `#f08a4b`.
  - Une couleur par partie de séance : échauffement ambre (`#d08a1a` / sombre `#f0b44f`), technique vert olive (`#3f6b2a` / `#8cc56b`), circuit terracotta. Pour les petits textes, l'ambre est foncé (`#8a5606`) pour rester lisible.
  - Icônes en anneau, semaine en anneaux, progression de séance en segments (un par exercice et par tour).
  - **Minuteur de repos en anneau** vert olive qui se vide, avec un gros chiffre au centre, des boutons −10 s / +10 s / Passer et l'exercice suivant en dessous.
  - **Écran exercice** : image, nom, objectif, gros compteur de reps avec − / +, dernière perf et ressenti, bouton Valider, exercice suivant.
  - Barre d'onglets : Séance · Suivi · Corps · Plus.

## 4. Déploiement et utilisation
- Même chaîne que meal-app : **dépôt GitHub → déploiement automatique sur Netlify** à chaque push.
- Même base technique que meal-app : React + TypeScript + Vite + PWA (installable, hors ligne).
- **Nom : Training-app.** Nom affiché sous l'icône : « Training ». Dépôt GitHub et adresse Netlify du type `training-app.netlify.app`, si ce nom est libre.
- **Téléphone : Android.** Installation depuis Chrome (menu ⋮ → « Installer l'application »).
- Mises à jour : la nouvelle version s'installe à la prochaine ouverture, jamais pendant une séance en cours.
- Les fichiers du premier prototype seront remplacés par le nouveau projet.
- **Icône : « Anneaux de gym »** (proposition 6 du canevas de maquettes) : sur fond crème `#fff7ee`, une barre `#2a1b12` d'où pendent deux sangles `#6e5646` et deux anneaux terracotta `#a9420e`.

---

## Plan de construction ✅ (V1 construite)
Chaque étape donne une version utilisable sur le téléphone. Étapes 0 et 1 sur `main` ; étapes 2 à 7 développées sur la branche `developpement` (un commit par étape) puis fusionnées.
0. **Mise en place** : projet (même base que meal-app), dépôt GitHub `training-app`, site Netlify, icône. Résultat : une app vide installable sur Android.
1. **Programme et données** : modèle de données, programme pré-rempli (4 séances, échauffements, technique, circuits, temps de repos), stockage sur le téléphone.
2. **Séance guidée** : checklist d'échauffement, technique, circuits, enchaînement automatique, chronos, repos, bip sur les 3 dernières secondes, écran allumé, ressenti par tour, commentaire, résumé. Premier vrai test en séance.
3. **Sauvegarde en ligne** : synchronisation Netlify Blobs avec code secret, export/import en secours. Faite tôt, pour ne rien perdre dès que l'app sert.
4. **Historique** : import de l'historique noté au crayon, liste et modification des séances passées, fiche par exercice (max, courbe).
5. **Progression** : échelles de niveaux de technique, propositions de progression, tractions lestées.
6. **Suivi** : calendrier, bilan mensuel, poids et mensurations.
7. **Illustrations et finitions** : images libres, pictogrammes de secours, tes photos, édition du programme et des échauffements.

---

## Choix faits pendant la construction
- **Séance proposée** : elle suit l'ordre du programme (Push → Pull A → Jambes → Épaules), pas le jour de la semaine. Une séance décalée ne casse donc pas le cycle, et l'accueil permet de choisir une autre séance.
- **Exercice en durée** : le chrono démarre seul juste après un repos. Sinon, 5 s de préparation (affichées en ambre, avec un bouton « Démarrer maintenant »). « Stop » enregistre le temps tenu.
- **Ressenti** : noté pendant le repos entre les tours. Pour le dernier tour, sur un écran dédié. Il est facultatif.
- **Historique du carnet** : 27 séances ajoutées au premier lancement, avec des dates fixes (les plus récentes la semaine du 2 novembre 2026) et des identifiants fixes. Pas de doublon d'un appareil à l'autre, et une séance supprimée ne revient pas.
- **Propositions de progression** :
  - +1 rep ou +5 s quand l'objectif est atteint sur tous les tours 2 séances de suite ;
  - niveau de technique suivant selon la même règle ;
  - lest des tractions lestées dès qu'une séance atteint 4 × 5, avec un palier au choix (+2,5 kg proposé).
  - Une proposition ignorée ne revient pas tant que l'objectif ne change pas.
- **Images libres retenues (7)** : dessins de la base wger sous licence CC-BY-SA, crédités dans Plus › Crédits.
  - Exclues : les fentes (filigrane d'un site commercial), ainsi que les mollets, les tractions australiennes et épaule à épaule (style de banque d'images commerciale, origine douteuse).
  - Les autres exercices ont un pictogramme. Chaque fiche permet de choisir son illustration ou d'ajouter sa photo (compressée, environ 10 à 60 Ko, sauvegardée avec le reste).
- **Synchro** : 1 lecture à l'ouverture de l'app. Après une modification : 1 lecture + 1 envoi, 4 s plus tard. Rien n'est envoyé si les deux copies sont identiques.

## Mise en service de la sauvegarde en ligne
1. Netlify → le projet → Project configuration → Environment variables → Add a variable : clé `SYNC_CODE`, valeur = un code secret de ton choix (long, sans espace).
2. Relancer un déploiement (Deploys → Trigger deploy) pour que la fonction prenne le code en compte.
3. Dans l'app : Plus → Sauvegarde en ligne → saisir le même code → « Activer la sauvegarde ».
