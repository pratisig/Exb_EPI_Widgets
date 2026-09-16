# Guide de transfert et de test — Epi Aggregator 2.0

**Destinataires :** GIS Centre, équipes GIS et surveillance épidémiologique

**Version de test :** Epi Aggregator 2.0.0

**Référence de test :** branche `arena/01a0aaf8-exb-epi-widgets` — correctifs de préparation au pilote (écarts E1 à E3 du dossier de proposition), à fusionner dans `main` avant la campagne

**Référence historique :** `main` au commit `907b88d` (« Merge Epi Aggregator 2.0 », 3 septembre 2026)

> **Vérifier l'artefact testé.** Noter le résultat de `git log -1 --oneline` dans la fiche de retour (§ 9). La branche de test est référencée par son nom et non par un commit figé : c'est le commit constaté le jour du test qui fait foi.

Ce guide détaille la manipulation. Le **dossier de proposition** `DOSSIER_PROPOSITION_GIS_CENTRE.md` porte la grille de décision T1–T15, les critères d'acceptation formels, le planning, les rôles et le formulaire de décision. Les deux documents se lisent ensemble : chaque scénario de ce guide est rattaché à un test noté de la grille.

## 1. Objet du pilote

Epi Aggregator 2.0 est un widget personnalisé ArcGIS Experience Builder pour analyser des line-lists épidémiologiques dans le temps, synchroniser plusieurs sources et préparer des agrégations par zone.

Le pilote doit vérifier :

- les formats de dates utilisés sur le terrain ;
- les champs Date natifs et les champs texte de semaine (EpiWeek) ;
- les semaines ISO et les semaines épidémiologiques relatives ;
- les agrégations mois/trimestre/année ;
- la comparaison de plusieurs années ;
- la synchronisation de plusieurs sources ;
- le comportement des timelines avec cartes, indicateurs, graphiques et tables ;
- le regroupement par champ administratif et la couche virtuelle cartographique ;
- les performances avec une line-list réelle anonymisée.

## 2. Pré-requis techniques

- ArcGIS Experience Builder Developer Edition **1.15** ;
- une organisation ArcGIS Online ou ArcGIS Enterprise ;
- **Node.js 20 LTS** pour Experience Builder 1.15 ;
- Git, ou une archive du dépôt ;
- un compte pouvant lire les Feature Layers et tables de test ;
- une carte Experience Builder contenant au moins une couche de test ;
- pour ExB 1.15, utiliser `npm ci` (et non `pnpm ci`).

> **Version Experience Builder.** Le manifeste du widget déclare `exbVersion: "1.14.0"` alors que ce guide cible ExB 1.15. Si le GIS Centre constate une incompatibilité de compilation, le signaler : c'est le point à arbitrer avant la campagne (écart E4 du dossier de proposition).

## 3. Installation locale

Récupérer la référence de test :

```powershell
git clone https://github.com/pratisig/Exb_EPI_Widgets.git
cd Exb_EPI_Widgets
git checkout arena/01a0aaf8-exb-epi-widgets
git log -1 --oneline
```

```powershell
Copy-Item `
  ".\widgets\epi-aggregator" `
  "C:\Chemin\ArcGISExperienceBuilder\client\your-extensions\widgets\epi-aggregator" `
  -Recurse -Force
```

Remplacer `C:\Chemin\ArcGISExperienceBuilder` par le chemin local réel.

### Voie rapide (Windows)

Le script `tools\Start-ExperienceBuilder.ps1` active Node 20, installe les dépendances si nécessaire, copie le widget et ouvre les deux fenêtres de service :

```powershell
.\tools\Start-ExperienceBuilder.ps1 `
  -ExperienceBuilderPath "C:\Chemin\ArcGISExperienceBuilder" `
  -InstallDependencies -CopyWidget
```

Conserver les deux fenêtres PowerShell ouvertes pendant toute la session.

### Contrôle d'intégrité de la copie

Le widget doit contenir :

```text
icon.svg
manifest.json
config.json
src\config.ts
src\runtime\widget.tsx
src\runtime\aggregation.ts
src\runtime\comparison.ts
src\runtime\spatialAggregation.ts
src\runtime\virtualLayer.ts
src\runtime\style.css
src\setting\setting.tsx
src\setting\style.css
```

## 4. Démarrage d'Experience Builder

Dans le dossier `server` : `npm ci` puis `npm run start`.

Dans le dossier `client` : `npm ci` puis `npm run start`.

Ouvrir :

```text
https://localhost:3001/
```

Pour une organisation Enterprise, renseigner :

```text
Portal URL : https://geo.geomsf.org/portal
```

Le Client ID OAuth doit être créé dans le même portail. L'URI de redirection doit être :

```text
https://localhost:3001/jimu-core/oauth-callback.html
```

Si le portail est derrière CloudFront ou un reverse proxy, l'administrateur doit autoriser et transmettre les paramètres de :

```text
/portal/sharing/rest/oauth2/authorize
/portal/sharing/rest/oauth2/token
```

## 5. Données de test minimales

Créer une couche ou table de test anonymisée contenant au minimum :

```text
case_id       : texte ou identifiant
onset_date    : Date ou texte EpiWeek
week_label    : texte (facultatif, pour tester le champ semaine)
adm1_name     : texte
status        : texte
cases         : numérique
deaths        : numérique
```

Éviter les données nominatives ou les coordonnées individuelles dans le pilote initial.

Jeu de test recommandé :

| case_id | onset_date | week_label | adm1_name | status | cases | deaths |
|---|---|---|---|---|---:|---:|
| 1 | 2024-01-03 | 2024-W01 | Dakar | Confirmed | 1 | 0 |
| 2 | 2024-01-05 | 2024-W01 | Dakar | Probable | 1 | 0 |
| 3 | 2024-01-12 | 2024-W02 | Thiès | Confirmed | 1 | 1 |
| 4 | 2025-01-20 | Week 04-2025 | Dakar | Confirmed | 1 | 0 |
| 5 | 2025-01-24 | 2025-W04 | Thiès | Suspected | 1 | 0 |

Pour tester les années, utiliser **au moins trois années** et plusieurs périodes par année. Supprimer volontairement une semaine au milieu de la série pour le scénario F.

## 6. Configuration du widget

1. Ajouter Epi Aggregator à une expérience.
2. Ouvrir le panneau **Contenu**.
3. Sélectionner une ou plusieurs sources.
4. Pour chaque source, choisir le **champ date ou semaine** détecté.
   - Pour un champ **Date** natif, rien de plus : le filtrage de la source est disponible.
   - Pour un champ **texte**, activer **Afficher aussi les champs texte (semaines EpiWeek…)** puis sélectionner le champ. Le widget signale alors que le filtrage est désactivé.
5. Choisir une statistique :
   - Count ;
   - Sum ;
   - Mean ;
   - Median ;
   - Min ;
   - Max ;
   - First ;
   - Last ;
   - Distinct.
6. Choisir le champ numérique, date ou texte selon la statistique.
7. Choisir l’agrégation temporelle.
8. Choisir le mode de filtre : période unique, progressif/cumulatif ou toutes les données.
9. Choisir l’affichage : **Timeline uniquement** ou **Timeline et détails des sources**.

Pour le regroupement spatial, choisir :

```text
Champ de regroupement spatial : adm1_name
```

Pour une couche frontière séparée, utiliser :

```text
Couche frontière / géométrie
```

puis sélectionner le champ administratif correspondant.

## 7. Scénarios de test fonctionnels

Chaque scénario est rattaché au test correspondant de la grille T1–T15 du dossier de proposition.

### Scénario A — Installation et compilation (T1)

Copier le widget, lancer `npm ci` puis `npm run start` dans `server` et `client`.

**Résultat attendu :** le widget apparaît dans le panneau des widgets, sans erreur bloquante de compilation ni erreur dans la console du navigateur.

### Scénario B — Champ Date natif et semaine ISO (T3, T4)

- Agrégation : semaine ISO ;
- une source avec `onset_date` de type `esriFieldTypeDate` ;
- statistique : Count ;
- inclure une année comportant une semaine 53.

**Résultat attendu :** le champ est détecté automatiquement, les semaines sont exactes, les bornes vont du lundi au dimanche et la semaine 53 n'est pas tronquée.

### Scénario C — Champ texte semaine EpiWeek (T14) — *nouveauté*

- Activer **Afficher aussi les champs texte** ;
- sélectionner `week_label` (valeurs `2024-W01`, `Week 04-2025`, `2025-W04`) ;
- statistique : Count.

**Résultat attendu :**

- les libellés sont normalisés en semaine ISO et agrégés correctement ;
- le widget affiche l'avertissement « Champ texte semaine : … le filtrage … nécessite un champ Date natif » ;
- aucune requête temporelle n'est envoyée à la source (vérifier dans les requêtes réseau) ;
- l'avertissement apparaît aussi dans le panneau Contenu.

### Scénario D — Timeline liée et filtres (T5)

- Agrégation : semaine ISO, une source, statistique Count ;
- cliquer plusieurs périodes ;
- tester successivement les trois modes de filtre.

**Résultat attendu :** la période active et le filtre changent sans recharger l'expérience. En mode progressif, toutes les périodes depuis la première sont conservées ; en mode période unique, seule la période active ; en mode toutes les données, aucune restriction.

### Scénario E — Timeline de source, cumulé et repli (T5) — *nouveauté*

- Afficher le widget en **Timeline et détails des sources**, puis en **Timeline uniquement** ;
- avancer avec les boutons et le curseur ;
- activer **Cumulé** puis **Brut** ;
- cliquer sur **Masquer les périodes**, puis **Afficher les périodes** ;
- utiliser **Lire/Arrêter** et les trois vitesses.

**Résultat attendu :**

- les valeurs affichées sur les boutons passent de la valeur de période au cumulé ;
- le bouton Cumulé est désactivé pour les statistiques non numériques (First, Last, Distinct) ;
- le repli masque les boutons sans désactiver le curseur ni la période active ;
- les douze premières périodes affichent la liste dépliée, au-delà la liste se replie automatiquement ;
- avec une seule source, le mode compact n'affiche que la timeline liée ; avec deux sources, chaque source garde sa timeline compacte.

### Scénario F — Périodes manquantes (T6)

Supprimer les lignes d'une semaine au milieu de la série et activer :

```text
Créer des périodes à zéro
```

**Résultat attendu :** la semaine absente apparaît avec une valeur zéro, sans être confondue avec une absence de notification.

### Scénario G — Comparaison des années (T10)

- données 2023, 2024 et 2025 ;
- mode : **Comparer les années** ;
- années : `2023, 2024, 2025` ;
- année de référence : `2024`.

**Résultat attendu :** les périodes comparables sont alignées, les colonnes delta et % sont cohérentes et les valeurs absentes sont affichées `—`.

### Scénario H — Plusieurs sources et timeline liée (T9)

Ajouter une source Cas (Count) et une source Décès (Sum sur `deaths`) avec la même clé temporelle.

**Résultat attendu :** la timeline liée filtre les deux sources ensemble ; les totaux, pics et périodes ne se mélangent pas.

### Scénario I — Regroupement administratif et export par zone (T7)

Configurer :

```text
Champ de regroupement spatial : adm1_name
```

Vérifier dans le CSV la présence de :

```text
boundary,period,label,count,value,start,end
```

**Résultat attendu :** une ligne par zone et par période, cohérente avec les valeurs du widget ; le compteur d'agrégats zone × période est affiché dans la carte de la source.

### Scénario J — Carte, symbologie et couche virtuelle (T8)

Configurer la symbologie dans la carte, pas dans le widget :

- cercles proportionnels pour les points ;
- couleurs graduées pour les polygones ;
- variables visuelles existantes ;
- échelle dynamique ou fixe dans le widget.

Sélectionner une couche frontière, puis déplacer la timeline.

**Résultat attendu :**

- le filtre temporel et les variables visuelles réagissent à la période active ;
- une couche temporaire par période est produite avec `boundary`, `period`, `value`, `count` ;
- la palette et le renderer d'origine sont conservés ;
- la couche temporaire est retirée au changement de période et à la fermeture.

### Scénario K — Performance (T12)

Tester avec une line-list anonymisée de taille représentative (par exemple 10 000, 50 000 puis 100 000 enregistrements).

**Résultat attendu :** temps d'agrégation, de filtre et d'animation mesurés et consignés ; comportement documenté au-delà de 10 000 enregistrements par requête.

### Scénario L — Intégrité des données sources (T2)

Relever avant et après les tests le nombre d'enregistrements, le `lastEditDate` et un échantillon de valeurs.

**Résultat attendu :** aucune modification de la line-list ni de la couche frontière.

## 8. Critères d'acceptation GIS Centre

Le pilote peut être accepté si :

- une source Date native est détectée automatiquement ;
- un champ texte de semaine (EpiWeek) est normalisé et agrégé ;
- la limite de filtrage d'un champ texte est signalée à l'utilisateur ;
- plusieurs années sont affichées ;
- une comparaison annuelle est lisible ;
- les périodes manquantes peuvent être représentées par zéro ;
- deux sources partagent la timeline liée et restent pilotables individuellement ;
- les trois modes de filtre fonctionnent ;
- l'affichage brut/cumulé et le repli des périodes fonctionnent ;
- l'export CSV est exploitable, globalement et par zone ;
- une source peut être regroupée par zone et une couche frontière peut être sélectionnée ;
- la couche virtuelle ne modifie ni le renderer ni les données sources ;
- aucune donnée source n'est modifiée ;
- une line-list anonymisée de taille représentative reste utilisable.

## 9. Fiche de retour d'expérience

Pour chaque test, documenter :

```text
Test (T1…T15) :
Scénario (A…L) :
Commit testé (git log -1 --oneline) :
Pays / mission :
Utilisateur testeur :
Version Experience Builder :
Version Portal :
Taille de la source :
Type de source :
Champ temporel et type (Date / texte) :
Champ de regroupement :
Période choisie :
Statistique :
Navigateur :
Résultat : conforme / non conforme / non testé
Erreur console :
Contournement disponible :
Capture écran :
Priorité : critique / haute / moyenne / basse
```

Ne jamais joindre de données nominatives ou de secrets OAuth à un ticket.

## 10. Limites connues du pilote

- Le calcul est principalement côté navigateur ; les gros volumes doivent être mesurés avant déploiement.
- Un champ temporel de type texte ne peut pas être filtré par le service : l'agrégation reste disponible, le filtre non.
- Le regroupement spatial nécessite des valeurs Boundary cohérentes entre la line-list et la couche frontière.
- La carte doit conserver son renderer ; le widget agit sur le filtre et les variables visuelles déjà configurées.
- Les cartes, graphiques et indicateurs doivent utiliser les sources configurées ou une vue de données compatible.
- Les taux épidémiologiques ne sont pas déduits automatiquement : leurs définitions et dénominateurs doivent être préparés et validés par la surveillance.
- Pour une utilisation Enterprise derrière un proxy, la configuration OAuth et la transmission des query strings doivent être validées par l'administrateur Portal.
- La déclaration `exbVersion` du manifeste (1.14.0) doit être confirmée par rapport à la version réellement déployée.

## 11. Support et livraison du retour

Pour chaque problème, transmettre :

1. la référence testée (`git log -1 --oneline`) ;
2. la version Experience Builder ;
3. le scénario de test et le test T correspondant ;
4. la structure des champs sans données sensibles ;
5. l'erreur de la console ;
6. une capture d'écran anonymisée ;
7. la fréquence et la gravité du problème.

Le manuel général se trouve dans `MANUEL_UTILISATION.md`, le dossier de décision dans `DOSSIER_PROPOSITION_GIS_CENTRE.md` et la description technique dans `README.md`.
