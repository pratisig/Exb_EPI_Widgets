# Dossier de proposition — Epi Aggregator 2.0

## Test et validation par le GIS Centre

| Champ | Valeur |
|---|---|
| **Objet** | Proposition de test, validation ou rejet du widget Epi Aggregator 2.0 |
| **Destinataires** | Équipes GIS Centre, coordination GIS, référents surveillance épidémiologique, administrateur Portal |
| **Émetteur** | Équipe de développement Epi Aggregator (MSF GIS community) |
| **Version proposée** | **Epi Aggregator 2.0.0** (`manifest.json` → `"version": "2.0.0"`) |
| **Référence source** | Dépôt `pratisig/Exb_EPI_Widgets`, branche `main`, commit `907b88ded195ca2f4c0a2c92118b1dd1a350385d` |
| **Date d'émission** | 16 septembre 2026 |
| **Décision demandée** | **Validation** — **Validation avec réserves** — **Rejet** |
| **Statut du document** | Pour décision |

---

## 1. Objet et décision demandée

Le présent dossier propose à l'équipe GIS Centre de prendre en charge la **campagne de test et d'homologation** du widget *Epi Aggregator 2.0*, puis de prononcer une décision formelle :

1. **Validation** : le widget est accepté pour un déploiement pilote sur des expériences de surveillance réelles ;
2. **Validation avec réserves** : accepté sous conditions, avec liste d'actions correctives datée ;
3. **Rejet** : le widget n'est pas retenu en l'état, avec motif documenté.

Le dossier fournit : la description de la version livrée et de ses fonctionnalités, les écarts connus entre la documentation et le code, le protocole de test, les critères de décision, les livrables attendus des testeurs et le formulaire de décision.

> **Portée de la demande.** Il ne s'agit pas d'une demande d'installation en production. Il s'agit d'un pilote encadré, sur données anonymisées, dont l'objectif est de prononcer une décision traçable et de constituer une base de défauts à corriger.

---

## 2. Synthèse exécutive

**Ce qu'est le widget.** Epi Aggregator est un widget personnalisé pour ArcGIS Experience Builder Developer Edition. Il lit une ou plusieurs line-lists épidémiologiques, normalise un champ de date hétérogène, produit une série temporelle agrégée (semaine épidémiologique, mois, trimestre, année) et publie un filtre temporel aux cartes, tableaux, graphiques, listes et indicateurs connectés à la même source de données.

**Ce qu'il apporte au GIS Centre.** Un moyen de transformer une line-list brute en objet d'analyse temporelle et cartographique sans pipeline ETL, sans modification de la donnée source, et sans développement spécifique supplémentaire : timeline animée, comparaison inter-annuelle, agrégats par zone administrative, export CSV.

**Ce qu'il n'est pas.** Ce n'est ni un ETL de qualité de données, ni un moteur de calcul de taux d'incidence, ni un outil d'alerte. Les limites sont détaillées au § 5 et au § 13.

**Demande.** Tester la version 2.0.0 selon le protocole du § 9, consigner les résultats, puis statuer selon les critères du § 10 et retourner le formulaire du § 14.

**Point d'attention immédiat.** Quatre écarts entre la documentation livrée et le code (dont un critère d'acceptation actuellement inatteignable) sont identifiés au § 6. Ils doivent être tranchés **avant** le démarrage des tests, sinon ils conduiront à un rejet sur un critère non implémenté.

---

## 3. Traçabilité de la version proposée

| Élément | Valeur constatée |
|---|---|
| Version du widget | `2.0.0` dans `widgets/epi-aggregator/manifest.json` |
| Libellé | `Epi Aggregator` |
| Auteur déclaré | MSF GIS community |
| Licence | Apache-2.0 |
| Locales | `en`, `fr` |
| Dépendance déclarée | `jimu-arcgis` |
| Version ExB déclarée dans le manifeste | `exbVersion: "1.14.0"` — **à confirmer**, les documents de transfert ciblent ExB 1.15 (§ 6, écart E4) |
| Taille par défaut du widget | 380 × 520 px |
| Intégration | PR #1 « feat: release Epi Aggregator 2.0 », **fusionnée dans `main` le 3 septembre 2026** |
| Commit de référence | `907b88d` — « Merge Epi Aggregator 2.0 » |
| Tag de version | Aucun tag Git publié |
| Suite de tests automatisés | Aucune |
| Intégration continue | Aucune |

**Conséquence pour le test.** La validation repose entièrement sur une campagne manuelle. Toute régression devra être décrite par un scénario reproductible (procédure, configuration, résultat attendu, résultat observé), car il n'existe pas de test automatisé permettant de la circonscrire.

**Branche à utiliser.** Le guide de transfert existant indique la branche `arena/019fc9ad-exb-epi-widgets`. Cette branche a été fusionnée le 3 septembre 2026 et n'est plus la référence : pour ce pilote, utiliser **`main` au commit `907b88d`** (ou une archive du répertoire `widgets/epi-aggregator` jointe au dossier de test).

---

## 4. Fonctionnalités livrées dans la version 2.0.0

**Légende du statut**
- **Livré** : présent dans le code de la version 2.0.0.
- **Livré — à confirmer** : présent dans le code, mais la documentation associée est incomplète, contradictoire ou en retard (§ 6).
- **Non vérifié** : présent dans le code, jamais exécuté sur une line-list réelle à ce jour.

### 4.1 Sources et configuration

| ID | Fonction | Détail | Statut |
|---|---|---|---|
| F1 | Sources multiples | Plusieurs Feature Layers ou tables line-list dans un même widget ; une section de configuration par source | Livré |
| F2 | Configuration indépendante par source | Champ date, statistique, champ de mesure, période, base de semaine, convention de date, mode de filtre, échelle, décimales, libellé court, champ de regroupement spatial | Livré |
| F3 | Détection des champs par le schéma ArcGIS | Listes de champs filtrées par type : champs date, champs numériques, champs texte ; les listes s'adaptent à la statistique choisie | Livré |
| F4 | Mode compact « timeline uniquement » | Par défaut, seule la timeline maître est affichée ; les cartes de synthèse par source s'activent dans **Affichage** | Livré |
| F5 | Lecture d'une source sans champ date configuré | La source reste masquée du panneau d'analyse au lieu d'afficher un résultat erroné | Livré |

### 4.2 Lecture et normalisation des dates

| ID | Fonction | Détail | Statut |
|---|---|---|---|
| F6 | Formats pris en charge | Date native ArcGIS (`esriFieldTypeDate`), horodatage epoch milliseconde, date série Excel, ISO `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM`, et formats texte interprétables par JavaScript | Livré |
| F7 | Libellés de semaine texte | `Week 03-2025`, `2025-W04`, `W01-2026`, `S01_2026`, `wk`, `w` → normalisés en semaine ISO | Livré — **à confirmer** : non sélectionnables depuis l'interface (écart E2) |
| F8 | Dates ambiguës | Convention **jour/mois** (défaut terrain), **mois/jour**, ou **automatique** ; une composante supérieure à 12 lève l'ambiguïté quel que soit le réglage | Livré |
| F9 | Contrôle de validité | Une date impossible (ex. `31/02/2024`) est rejetée et comptée comme date illisible ; calendrier en UTC, sans dérive de fuseau | Livré |
| F10 | Signalement des dates illisibles | Compteur et bandeau d'avertissement : `n enregistrement(s) ignoré(s) : date non reconnue` | Livré |

### 4.3 Agrégations et statistiques

| ID | Fonction | Détail | Statut |
|---|---|---|---|
| F11 | Semaine épidémiologique ISO | Semaines calendaires du lundi au dimanche, clé `AAAA-Wnn`, libellé `AAAA Snn` ; l'existence d'une semaine 53 n'est pas artificiellement bloquée | Livré |
| F12 | Semaine relative à l'épidémie | Base de semaine alternative à partir d'une date de début d'épidémie : `EPI W1`, `EPI W2`, … | Livré |
| F13 | Mois, trimestre, année | Clés `AAAA-MM`, `AAAA-Tn`, `AAAA` | Livré |
| F14 | Statistiques | `Count`, `Sum`, `Mean`, `Median`, `Min`, `Max`, `First`, `Last`, `Distinct` | Livré |
| F15 | `Min` / `Max` sur une date | Retourne la date la plus ancienne ou la plus récente au format ISO | Livré |
| F16 | Périodes manquantes | Option « Créer des périodes à zéro » : les périodes sans enregistrement sont matérialisées avec une valeur 0 entre la première et la dernière période | Livré |
| F17 | Recalcul propre | Le filtre temporel précédent est effacé avant chaque recalcul, pour qu'un filtre hebdomadaire ne limite pas par erreur un résultat mensuel ou annuel | Livré |

### 4.4 Filtrage et synchronisation avec la page

| ID | Fonction | Détail | Statut |
|---|---|---|---|
| F18 | Filtre progressif / cumulatif | Affiche toutes les données depuis la première période jusqu'à la fin de la période active | Livré |
| F19 | Filtre période unique | Applique la fenêtre `[début de la période active, fin de la période active)` | Livré |
| F20 | Aucun filtre | La timeline reste opérationnelle mais la source n'est pas restreinte | Livré |
| F21 | Publication du filtre | Requête temporelle transmise à la source via `updateQueryParams`, identifiée par le couple widget/source ; les composants connectés à la même source suivent la période active | Livré — **non vérifié** sur expérience réelle |
| F22 | Réinitialisation du filtre | Bouton **Réinitialiser** qui restaure toutes les données | Livré |

### 4.5 Timeline liée

| ID | Fonction | Détail | Statut |
|---|---|---|---|
| F23 | Timeline maître liée | Une timeline au-dessus des sources, qui pilote les sources partageant la même clé de période | Livré — **non vérifié** avec plus d'une source réelle |
| F24 | Lecture animée | Play/Pause et trois vitesses : lent (2 000 ms), normal (1 200 ms), rapide (600 ms) | Livré |
| F25 | Navigation | Première période, reculer, avancer, dernière période, plus un curseur de défilement direct | Livré |
| F26 | Affichage des bornes | Libellé de la période active et plage totale `première période — dernière période` | Livré |
| F27 | Export CSV | Export des périodes agrégées : `period,label,count,value,start,end` ; en mode regroupement spatial : `boundary,period,label,count,value,start,end` | Livré |

### 4.6 Carte, symbologie et regroupement spatial

| ID | Fonction | Détail | Statut |
|---|---|---|---|
| F28 | Carte pilotée | Sélection d'une carte dans **Carte à piloter** ; la période active est appliquée aux couches liées par `definitionExpression` | Livré — **non vérifié** |
| F29 | Rééchelle dynamique | Mode **dynamique** : les bornes `minDataValue` / `maxDataValue` des variables visuelles déjà configurées sont recalculées pour la période ; mode **fixe** : échelle conservée sur toute l'analyse | Livré — **non vérifié** |
| F30 | Respect du renderer | Le widget ne remplace ni le renderer ni la palette : cercles proportionnels, couleurs graduées et classes restent configurés dans la carte | Livré |
| F31 | Regroupement par zone | Champ de regroupement optionnel par source (ex. `adm1_name`, `adm2_name`, `district`) ; agrégats calculés par période **et** par zone | Livré — **non vérifié** |
| F32 | Couche virtuelle agrégée | Jointure à la volée des agrégats période/zone avec les géométries d'une couche frontière (interne à la source ou couche dédiée), créée comme FeatureLayer côté client et retirée au nettoyage. Champs produits : `boundary`, `period`, `value`, `count`, `label` | Livré — **non vérifié** ; le manuel le présente encore comme « étape suivante » (écart E3) |

### 4.7 Qualité, indicateurs, langue et présentation

| ID | Fonction | Détail | Statut |
|---|---|---|---|
| F33 | Synthèse par source | Nombre total d'enregistrements valides, valeur du pic et libellé de la période du pic, nombre de périodes générées, nombre de dates illisibles ignorées | Livré |
| F34 | Comparaison des années | Mode « Comparer les années » : alignement des mêmes périodes (S01 2023 vs S01 2024…), années sélectionnables, année de référence, colonnes d'écart absolu (Δ) et relatif (%) | Livré — **non vérifié** |
| F35 | Période active affichée | La période affichée et le mode de filtre sont rappelés en tête de chaque source | Livré |
| F36 | Bilinguisme FR/EN | Libellés de l'interface en français ou en anglais selon la locale configurée | Livré |
| F37 | Présentation | Couleur principale, couleur de la ligne de timeline, taille de timeline (petite/moyenne/grande), décimales affichées (0 à 3) | Livré |

---

## 5. Périmètre exclu (ce que le widget ne fait pas)

- **Aucune écriture dans les données.** Le widget lit les enregistrements, calcule et filtre ; il ne modifie ni la line-list ni la couche frontière. La couche virtuelle agrégée est temporaire et côté client uniquement.
- **Aucune agrégation côté serveur.** Le calcul est réalisé dans le navigateur après lecture des enregistrements (`outFields: ['*']`, `pageSize: 10000`). Les volumes au-delà de cette limite doivent être évalués en test avant tout déploiement sur une grosse line-list.
- **Aucun calcul de taux.** Incidence, létalité, taux d'attaque et leurs dénominateurs de population restent à préparer dans une couche analytique dédiée.
- **Aucun seuil d'alerte, aucune moyenne mobile, aucun intervalle de confiance.**
- **Aucune gestion de la qualité de la donnée source** : doublons, notifications répétées, dates futures et fuseaux horaires relèvent du contrôle amont (§ 3 du manuel utilisateur).
- **Aucune sélection cartographique ni édition géométrique.**
- **Aucune protection contre la ré-identification** : à traiter au niveau du jeu de données et des règles de diffusion (petits effectifs).

---

## 6. Écarts documentation / code à trancher avant le pilote

Ces écarts sont signalés par transparence. Ils ne remettent pas en cause la valeur du widget, mais l'un d'entre eux **rend un critère d'acceptation du guide de transfert actuellement inatteignable** : le trancher avant les tests évite un rejet sur une fonction non implémentée.

| ID | Écart | Preuve | Impact | Recommandation |
|---|---|---|---|---|
| **E1** | **Liste de périodes repliable.** Le manuel décrit un bouton « Afficher/Masquer les périodes » ; ce bouton n'existe pas dans le code. L'état `periodsOpen` est calculé puis jamais utilisé par l'interface | `src/runtime/widget.tsx` : `periodsOpen` déclaré et affecté, aucune utilisation en rendu | Documentaire et fonctionnel mineur. Critère P2 : pas de blocage | Retirer la mention du manuel **ou** implémenter le bouton avant le pilote. À trancher par l'équipe de développement |
| **E2** | **Champ semaine texte (EpiWeek) non sélectionnable.** Le guide d'acceptation exige qu'« un champ EpiWeek texte soit normalisé », mais le sélecteur de champ date ne propose **que** les champs de type date ArcGIS ; les colonnes texte sont volontairement exclues (le manuel le confirme) | `src/setting/setting.tsx` : liste `dateFields` limitée à `isDate` | **Critère d'acceptation inatteignable en l'état.** Risque de rejet sur un critère non implémenté | Soit étendre le sélecteur aux champs texte et laisser le moteur (`parseEpiDate`, qui gère déjà ces libellés) les interpréter, soit retirer ce critère du guide et le remplacer par « un champ de date natif est reconnu » |
| **E3** | **Manuel en retard sur la couche virtuelle.** Le manuel présente le regroupement spatial et la couche virtuelle comme « à activer dans l'étape suivante » ; ils sont implémentés dans le runtime | `src/runtime/spatialAggregation.ts`, `virtualLayer.ts`, et le bloc FeatureLayer client-side de `widget.tsx` | Documentaire : sous-estime la version livrée et prive les testeurs du scénario de test | Mettre à jour le § 15 du manuel et conserver le test correspondant (T7, T8) |
| **E4** | **Version Experience Builder.** Le manifeste déclare `exbVersion: "1.14.0"`, les documents de transfert et l'outillage ciblent ExB 1.15 / Node 20 | `manifest.json` vs `GUIDE_TRANSFERT_TEST_GIS_CENTRE.md` et `tools/README.md` | Configuration de l'environnement de test ; peut générer une incompatibilité de build | Faire confirmer par le GIS Centre la version effectivement utilisée, puis aligner la déclaration |
| **E5** | **Référence de branche obsolète.** Le guide de transfert pointe la branche `arena/019fc9ad-exb-epi-widgets`, fusionnée le 3 septembre 2026 | PR #1 fusionnée dans `main` ; `main` = `907b88d` | Risque de tester une copie non alignée sur la référence | Utiliser `main` au commit `907b88d` (§ 3). Correction à porter dans le guide de transfert |
| **E6** | **Note de compatibilité du README inexacte.** Le README mentionne une dépendance possible à `DataSourceTypes.MapService` ; le setting utilise `AllDataSourceTypes.FeatureLayer` | `README.md` vs `src/setting/setting.tsx` | Documentaire | Aligner le README sur le code |

---

## 7. Prérequis techniques

| Élément | Exigence |
|---|---|
| ArcGIS Experience Builder | Developer Edition **1.15** (ou version compatible — confirmer via l'écart E4) |
| Runtime Node.js | Node.js **20 LTS** |
| Organisation | ArcGIS Online ou ArcGIS Enterprise ; portail MSF : `https://geo.geomsf.org/portal` |
| Compte | Droits de lecture sur les Feature Layers et tables de test |
| Client ID OAuth | Créé dans le même portail que l'instance ExB. URI de redirection : `https://localhost:3001/jimu-core/oauth-callback.html` |
| Reverse proxy / CloudFront | Si le portail est derrière un proxy, l'administrateur doit autoriser et transmettre les paramètres de `oauth2/authorize` et `oauth2/token` |
| Outils | `git` **ou** une archive du dépôt ; navigateur à jour ; droits suffisants pour les liens NVM sous Windows |
| Installation | Pour ExB 1.15, utiliser `npm ci` (et non `pnpm ci`) dans `server` puis `client` |
| Données | Line-list **anonymisée** : ni identité, ni coordonnée individuelle. Structure minimale : `case_id`, `onset_date`, `adm1_name`, `status`, `cases`, `deaths` |

---

## 8. Installation et mise en route

### 8.1 Voie rapide (poste Windows)

1. Récupérer le dépôt sur la référence de test :
   ```powershell
   git clone https://github.com/pratisig/Exb_EPI_Widgets.git
   cd Exb_EPI_Widgets
   git checkout 907b88ded195ca2f4c0a2c92118b1dd1a350385d
   ```
2. Lancer le script fourni, qui active Node 20, installe les dépendances si nécessaire, copie le widget et ouvre les fenêtres serveur et client :
   ```powershell
   .\tools\Start-ExperienceBuilder.ps1 `
     -ExperienceBuilderPath "C:\Chemin\ArcGISExperienceBuilder" `
     -InstallDependencies -CopyWidget
   ```
3. Ouvrir `https://localhost:3001/`.
4. Conserver ouvertes les deux fenêtres PowerShell (serveur et client) pendant toute la session.

### 8.2 Voie manuelle

```powershell
Copy-Item `
  ".\widgets\epi-aggregator" `
  "C:\Chemin\ArcGISExperienceBuilder\client\your-extensions\widgets\epi-aggregator" `
  -Recurse -Force
```

Puis, dans le dossier `server` : `npm ci` et `npm run start` ; dans le dossier `client` : `npm ci` et `npm run start`.

### 8.3 Contrôle d'intégrité de la copie

Le widget doit contenir exactement :

```text
icon.svg
manifest.json
config.json
src/runtime/widget.tsx
src/runtime/aggregation.ts
src/runtime/comparison.ts
src/runtime/spatialAggregation.ts
src/runtime/virtualLayer.ts
src/runtime/style.css
src/setting/setting.tsx
src/setting/style.css
src/config.ts
```

> Le widget est livré **sans `node_modules` ni lockfile** : les dépendances (`jimu-core`, `jimu-ui`, `jimu-arcgis`) sont celles de l'instance Experience Builder qui l'héberge. Aucune nouvelle dépendance externe n'est introduite.

### 8.4 Premier montage dans une expérience

1. Ajouter **Epi Aggregator** à l'expérience.
2. Ouvrir le panneau **Contenu**.
3. Sélectionner une ou plusieurs sources line-list.
4. Pour chaque source : choisir le **champ date détecté**, la **statistique**, le **champ de mesure** si nécessaire, l'**agrégation**, la **base des semaines**, la **convention des dates**, le **mode d'affichage**.
5. Optionnel : **champ de regroupement spatial**, **couche frontière / géométrie**, **carte à piloter**.
6. Enregistrer l'expérience.

---

## 9. Protocole de test proposé

Le protocole détaillé, avec les manipulations pas à pas, figure dans `GUIDE_TRANSFERT_TEST_GIS_CENTRE.md` (scénarios A à F). Le tableau ci-dessous est la **grille de décision** : chaque test porte un identifiant, une priorité et un résultat attendu vérifiable.

**Priorités** : **P0** = bloquant, conditionne à lui seul la décision ; **P1** = majeur ; **P2** = mineur.

| ID | Priorité | Scénario | Configuration | Résultat attendu |
|---|---|---|---|---|
| T1 | P0 | Installation et compilation | Copie du widget, `npm ci` + `npm run start` dans `server` et `client` | Widget visible dans le panneau, aucune erreur bloquante de compilation ni dans la console du navigateur |
| T2 | P0 | Intégrité des données sources | Relever le nombre d'enregistrements, le `lastEditDate` et un échantillon de valeurs avant et après les tests | Aucune modification de la line-list ni de la couche frontière |
| T3 | P0 | Champ date natif | Source avec `onset_date` en `esriFieldTypeDate` | Champ détecté automatiquement ; agrégation correcte |
| T4 | P0 | Semaine ISO | Agrégation semaine ISO, plusieurs années, dont une année à 53 semaines | Semaines `AAAA-Snn` exactes, bornes lundi–dimanche, semaine 53 non tronquée |
| T5 | P0 | Filtre temporel sur la page | Carte + tableau + indicateur sur la même source ; cliquer plusieurs périodes | Le filtre suit la période active, sans rechargement de l'expérience ; mode période unique et mode cumulatif conformes à F18/F19 |
| T6 | P1 | Périodes manquantes | Supprimer une semaine au milieu de la série, activer « Créer des périodes à zéro » | La période absente apparaît avec la valeur 0 |
| T7 | P1 | Regroupement administratif | **Champ de regroupement spatial** = `adm1_name`, puis export CSV | Le CSV contient `boundary,period,label,count,value,start,end` avec des valeurs cohérentes par zone |
| T8 | P1 | Couche virtuelle et symbologie | **Couche frontière / géométrie** = couche polygones, variables visuelles configurées dans la carte | Une couche temporaire par période est produite avec `boundary`, `period`, `value`, `count` ; la palette et le renderer d'origine sont conservés ; la couche est retirée au changement de période |
| T9 | P1 | Multi-sources et timeline liée | Source « Cas » (count) et source « Décès » (sum sur `deaths`), même base de périodes | Les deux sources sont filtrées simultanément par la timeline liée ; les totaux ne se mélangent pas |
| T10 | P1 | Comparaison inter-annuelle | Mode « Comparer les années », années `2023, 2024, 2025`, référence `2024` | Les périodes comparables sont alignées, Δ et % cohérents, valeurs absentes affichées `—` |
| T11 | P1 | Export CSV et décimales | Export depuis la timeline, décimales 0 à 3 | Fichier `epi-aggregation.csv` ouvrable, séparateur et guillemets corrects, décimales respectées, accents conservés |
| T12 | P1 | Performance | Line-list anonymisée de taille représentative (à définir par le GIS Centre : par ex. 10 000, 50 000 puis 100 000 enregistrements) | Temps d'agrégation, de filtre et d'animation mesuré et consigné ; comportement documenté au-delà de `pageSize: 10000` |
| T13 | P2 | Bilingue et présentation | Locale EN puis FR ; changement des couleurs, de la taille de timeline | Libellés traduits, couleurs et taille appliquées, mise en page non cassée |
| T14 | P2 | Dates illisibles | Insérer des valeurs non interprétables et des dates impossibles (`31/02/2024`) | Les lignes sont ignorées, comptées et signalées ; aucune valeur inventée |
| T15 | P2 | Convention des dates ambiguës | Mêmes données en `jour/mois`, `mois/jour`, `automatique` | Le comportement suit le réglage ; une composante > 12 lève l'ambiguïté |

### Jeu de données minimal suggéré

| case_id | onset_date | adm1_name | status | cases | deaths |
|---|---|---|---|---:|---:|
| 1 | 2024-01-03 | Dakar | Confirmed | 1 | 0 |
| 2 | 2024-01-05 | Dakar | Probable | 1 | 0 |
| 3 | 2024-01-12 | Thiès | Confirmed | 1 | 1 |
| 4 | 2024-01-22 | Dakar | Confirmed | 1 | 0 |
| 5 | 2024-02-11 | Thiès | Suspected | 1 | 0 |

À compléter avec **au moins trois années** et plusieurs périodes par année, et avec une semaine manquante pour T6. Pour tester les libellés de semaine texte (F7 / écart E2), ajouter des lignes portant `Week 03-2025`, `2025-W04` ou `S01_2026` dans un **champ date normalisé** ou, après arbitrage de E2, dans la colonne texte correspondante.

---

## 10. Critères de décision du GIS Centre

### 10.1 Validation

La version 2.0.0 peut être validée si, cumulativement :

- **100 % des tests P0 sont conformes** (T1 à T5) ;
- **au moins 90 % des tests P1 sont conformes** (T6 à T12) ;
- aucun défaut bloquant ni perte d'intégrité des données sources n'est constaté ;
- les écarts E1 à E6 sont soit corrigés, soit explicitement acceptés par écrit avec une échéance ;
- la performance observée en T12 est jugée compatible avec les volumes cibles du GIS Centre.

### 10.2 Validation avec réserves

Recevable si :

- **100 % des tests P0 sont conformes** ;
- au moins 70 % des tests P1 sont conformes ;
- chaque défaut restant est **non bloquant**, dispose d'un contournement documenté et fait l'objet d'une action corrective avec responsable et échéance ;
- aucune anomalie d'intégrité de données (T2) ni de fuite d'information n'est constatée.

### 10.3 Rejet

Le rejet doit être prononcé si l'un des cas suivants est constaté :

- échec d'au moins un test P0 (T1 à T5) ;
- modification, même involontaire, des données sources (T2) ;
- résultat d'agrégation temporelle incorrect non corrigeable dans le pilote (semaine ISO ou bornes de période erronées) ;
- performance incompatible avec les volumes cibles, sans voie de correction identifiée ;
- incompatibilité de build avec la version d'Experience Builder retenue par le GIS Centre ;
- moins de 70 % des tests P1 conformes.

Tout rejet doit mentionner l'identifiant du test, la preuve (capture, journal console, configuration) et la condition de réexamen.

---

## 11. Livrables attendus du testeur

Pour chaque test exécuté, consigner :

```text
Test (T1…T15) :
Pays / mission :
Utilisateur testeur :
Version Experience Builder :
Version Portal :
Type et taille de la source :
Champ temporel :
Champ de regroupement spatial :
Période choisie :
Statistique :
Navigateur et version :
Résultat : conforme / non conforme / non testé
Écart constaté :
Erreur console (texte brut) :
Capture d'écran anonymisée :
Contournement disponible :
Priorité : P0 / P1 / P2
```

**Règles de sécurité.** Ne jamais joindre de données nominatives, de coordonnées individuelles, de secrets OAuth ou de jetons d'accès. Anonymiser les captures d'écran (noms de patients, identifiants, URL de services sensibles).

---

## 12. Planning proposé et rôles

### 12.1 Planning indicatif

| Étape | Date proposée | Responsable |
|---|---|---|
| Envoi du dossier, arbitrage des écarts E1–E6, confirmation de la version ExB | 16 – 18 septembre 2026 | Émetteur + GIS Centre |
| Mise en place de l'environnement (ExB, Node 20, OAuth, copie du widget) | 17 – 21 septembre 2026 | GIS Centre / administrateur Portal |
| Préparation du jeu de test anonymisé (3 années, zone manquante, volumes T12) | 21 – 24 septembre 2026 | Référent surveillance + GIS Centre |
| Exécution des tests T1 à T15 et journal des défauts | 24 septembre – 2 octobre 2026 | Testeurs GIS Centre |
| Consolidation, corrections et nouvelle passe ciblée si réserves | 2 – 6 octobre 2026 | Émetteur + GIS Centre |
| **Décision formelle** (validation / réserves / rejet) | **à partir du 7 octobre 2026** | Comité de validation |
| Clôture, plan d'action et publication du retour | 9 octobre 2026 | Émetteur |

Ce calendrier est une proposition : les dates peuvent être ajustées par le GIS Centre selon ses contraintes d'exploitation.

### 12.2 Rôles

| Rôle | Responsabilité |
|---|---|
| Émetteur (équipe de développement) | Fournir la version figée et son archive, corriger les défauts confirmés, expliquer les écarts E1–E6 |
| Référent GIS Centre | Cadrer le pilote, valider le jeu de test, arbitrer les priorités, consolider le rapport |
| Testeur(s) GIS | Exécuter les tests, documenter les écarts, joindre les preuves |
| Référent surveillance épidémiologique | Valider la pertinence métier : définitions de période, semaine épidémiologique, cohérence des agrégats |
| Cartographe | Valider le comportement carte : renderer, variables visuelles, échelle dynamique, couche virtuelle |
| Administrateur Portal | OAuth, droits de lecture, proxy, comptes de test |
| Comité de validation | Prononcer la décision et la consigner |

---

## 13. Risques et limites connues

| Risque | Impact | Mesure de maîtrise proposée |
|---|---|---|
| Calcul côté navigateur sur une grosse line-list (`outFields: ['*']`, `pageSize: 10000`) | Lenteur, mémoire, plafond silencieux au-delà de 10 000 enregistrements par requête | Mesurer en T12 avant tout déploiement ; prévoir une pré-agrégation serveur pour les gros volumes |
| Aucun test automatisé ni intégration continue | Régressions difficiles à détecter, correction non vérifiée | Journal des défauts précis et reproductibles ; envisager l'ajout d'une suite de tests sur `aggregation.ts` (fonctions pures, sans dépendance ExB) |
| Écart E2 (champ semaine texte non sélectionnable) | Rejet possible sur un critère d'acceptation non implémenté | Trancher avant le démarrage : corriger le sélecteur ou amender le critère |
| Valeurs de zone incohérentes entre la line-list et la couche frontière | Couche virtuelle incomplète ou vide | Contrôler les libellés et les codes administratifs avant T7/T8 ; documenter la table de correspondance |
| Renderer cartographique modifié ou écrasé | Perte de la charte cartographique | Vérifier en T8 que le renderer et la palette restent inchangés après plusieurs périodes |
| Filtre non propagé aux composants (vues de données séparées) | Timeline sans effet visible sur la carte ou les indicateurs | Utiliser la même source pour tous les composants, ou configurer une action de données dans Experience Builder |
| Dates texte hétérogènes dans la source | Dates illisibles ignorées, agrégats sous-estimés | Publier le champ date en `esriFieldTypeDate` ; contrôler le compteur de dates ignorées avant publication |
| Taux épidémiologiques attendus par les utilisateurs | Interprétation erronée des valeurs affichées | Rappeler que le widget n'affiche pas de taux ; préparer les dénominateurs dans une couche analytique |
| Ré-identification sur petits effectifs | Risque de protection des données | Définir des règles de seuil dans l'expérience et les données de diffusion |
| Dépendance aux versions ExB et Node | Échec d'installation | Figer ExB 1.15 / Node 20 LTS pour le pilote et documenter la procédure d'installation (§ 8) |

---

## 14. Formulaire de décision (à compléter et retourner)

```text
Dossier        : Epi Aggregator 2.0 — proposition de test et de validation
Version testée : 2.0.0 (commit 907b88d)
Environnement  : Experience Builder ______ / Node ______ / Portal ______
Période de test: du __________ au __________
Testeurs       : ______________________________________________
Jeu de données : type ____________ / taille ____________ / anonymisé : oui / non

RÉSULTATS
  Tests P0 conformes   : ____ / 5
  Tests P1 conformes   : ____ / 7
  Tests P2 conformes   : ____ / 3
  Défauts bloquants    : ____
  Défauts majeurs      : ____
  Défauts mineurs      : ____

DÉCISION
  [ ] VALIDATION
  [ ] VALIDATION AVEC RÉSERVES — réserves et échéances :
      ________________________________________________________________
  [ ] REJET — motif(s), test(s) concerné(s) et condition de réexamen :
      ________________________________________________________________

Écarts E1–E6 : corrigés / acceptés avec échéance (préciser) :
      ________________________________________________________________

Observations :
      ________________________________________________________________

Nom et fonction : ______________________  Date : __________
Signature       : ______________________
```

---

## 15. Annexes

### Annexe A — Checklist express

- [ ] Version figée et commit vérifiés (`2.0.0`, `907b88d`)
- [ ] Environnement ExB / Node 20 / Portal opérationnel
- [ ] Widget copié et compilé sans erreur bloquante (T1)
- [ ] Jeu de test anonymisé, 3 années, zone manquante prévue (T6), jeux de volume T12 prêts
- [ ] Écarts E1–E6 arbitrés ou consignés
- [ ] Tests T1 à T15 exécutés, résultats et preuves consignés
- [ ] Intégrité des données sources contrôlée avant/après (T2)
- [ ] Formulaire de décision complété et signé

### Annexe B — Structure du dépôt

```text
.
├── README.md                              Description technique et installation
├── MANUEL_UTILISATION.md                  Manuel utilisateur GIS et surveillance
├── GUIDE_TRANSFERT_TEST_GIS_CENTRE.md     Protocole de test détaillé (scénarios A à F)
├── DOSSIER_PROPOSITION_GIS_CENTRE.md      Présent dossier de proposition et de décision
├── tools/
│   ├── README.md                          Mode d'emploi du lanceur Windows
│   ├── Start-ExperienceBuilder.ps1        Lanceur (Node 20, npm ci, copie du widget)
│   └── Start-ExperienceBuilder.bat        Point d'entrée double-clic
└── widgets/
    └── epi-aggregator/
        ├── manifest.json                  Version 2.0.0, locales, dépendances
        ├── config.json                    Valeurs par défaut du widget
        ├── icon.svg                       Icône
        └── src/
            ├── config.ts                  Types de configuration
            ├── runtime/
            │   ├── widget.tsx             Interface, requête, filtre, timeline, carte
            │   ├── aggregation.ts         Moteur de dates et d'agrégation (sans dépendance ExB)
            │   ├── comparison.ts          Alignement des périodes entre années
            │   ├── spatialAggregation.ts  Agrégats période × zone
            │   ├── virtualLayer.ts        Jointure agrégats ↔ géométries frontières
            │   ├── style.css              Styles de la timeline et des synthèses
            │   └── icon.svg
            └── setting/
                ├── setting.tsx            Panneau de configuration
                └── style.css
```

### Annexe C — Documents liés

| Document | Contenu |
|---|---|
| `README.md` | Description technique, installation, notes GIS et limites |
| `MANUEL_UTILISATION.md` | Manuel utilisateur complet : configuration, statistiques, périodes, modes de filtre, dépannage |
| `GUIDE_TRANSFERT_TEST_GIS_CENTRE.md` | Protocole détaillé des scénarios A à F, pré-requis, fiche de retour d'expérience |
| `tools/README.md` | Mode d'emploi du lanceur Windows |

### Annexe D — Lexique

| Terme | Définition |
|---|---|
| **Line-list** | Tableau de cas individuels (une ligne par cas) utilisé en surveillance épidémiologique |
| **Semaine ISO** | Semaine normalisée du lundi au dimanche, numérotée `S01` à `S53` selon la norme ISO 8601 |
| **Semaine épidémiologique relative** | Numérotation `EPI W1, W2, …` comptée depuis la date de début de l'épidémie |
| **Filtre progressif / cumulatif** | Restriction de la source à toutes les périodes depuis la première jusqu'à la période active |
| **Période active** | Période sélectionnée dans la timeline, qui détermine le filtre publié aux composants connectés |
| **Couche virtuelle agrégée** | Couche temporaire créée côté client, joignant les agrégats période × zone aux géométries d'une couche frontière, sans modifier les données sources |
| **Renderer** | Ensemble des règles de symbologie configurées dans la carte Experience Builder |
| **`definitionExpression`** | Clause de filtre appliquée à une couche dans la carte Experience Builder |

### Annexe E — Retour et support

Pour tout problème, transmettre : la version du widget, la version d'Experience Builder, l'identifiant du scénario de test, la structure des champs **sans données sensibles**, l'erreur brute de la console, une capture d'écran anonymisée, ainsi que la fréquence et la gravité du problème.

---

*Fin du dossier. La décision est attendue via le formulaire du § 14 ; les écarts du § 6 doivent être arbitrés avant le démarrage des tests.*
