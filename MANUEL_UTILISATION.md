# Epi Aggregator — Manuel utilisateur GIS et surveillance

## 1. Présentation

**Epi Aggregator** est un widget personnalisé pour ArcGIS Experience Builder Developer Edition. Il transforme une ou plusieurs line-lists en séries temporelles et permet de piloter les cartes, graphiques, listes, tableaux et indicateurs d'une expérience.

Le widget ne modifie pas la table source. Il lit les enregistrements, normalise les dates pour l'agrégation, calcule une statistique par période et applique, sur demande, une fenêtre temporelle à la source.

## 2. Ce que le widget permet de faire

- choisir plusieurs Feature Layers ou tables line-list ;
- configurer chaque source indépendamment ;
- détecter les champs Date et numériques depuis le schéma ArcGIS ;
- utiliser un champ texte de semaine (EpiWeek) comme champ temporel ;
- agréger par semaine ISO, semaine relative à l'épidémie, mois, trimestre ou année ;
- compter, sommer, calculer une moyenne ou une médiane ;
- calculer minimum et maximum sur des nombres ou des dates ;
- récupérer la première ou la dernière valeur d'un champ texte ;
- calculer le nombre de valeurs distinctes ;
- afficher la période active en haut de chaque source ;
- afficher le nombre total d'enregistrements, le pic et l'étiquette de la période du pic ;
- lire une timeline avec trois vitesses ;
- piloter chaque source depuis sa propre timeline, et toutes les sources depuis la timeline liée ;
- choisir entre filtre unique, filtre progressif ou absence de filtre ;
- afficher les valeurs en brut ou en cumulé ;
- replier la liste des périodes pour conserver un widget compact ;
- exporter les périodes agrégées en CSV, globalement ou par zone ;
- regrouper les agrégats par champ administratif et les joindre à une couche frontière ;
- comparer plusieurs années période par période ;
- personnaliser la couleur principale du widget.

## 3. Préparer les données

### Champs recommandés

Une line-list de surveillance devrait idéalement contenir :

- un identifiant unique (`case_id`) ;
- un vrai champ Date de référence (`onset_date`, `report_date`, `specimen_date`) ;
- un statut de cas (`confirmed`, `probable`, `suspected`, `discarded`) ;
- une localisation ou un code géographique ;
- les mesures utiles (`deaths`, `age`, `population`, `dose_count`).

### Champ Date ou champ semaine

Le champ temporel peut être de deux natures.

**Champ Date natif (`esriFieldTypeDate`) — recommandé.** C'est la seule configuration qui permet à la fois l'agrégation **et** le filtrage de la source, de la carte et des composants connectés. Les dates locales saisies dans le widget restent prises en charge dans les formats ISO, timestamps ArcGIS, dates Excel et formats jour/mois ou mois/jour.

**Champ texte de semaine (EpiWeek).** Un champ texte contenant des libellés tels que `Week 01-2026`, `2026-W01`, `W01-2026`, `S01_2026` ou `2026-W04` peut être sélectionné comme champ temporel : le widget les normalise en semaine ISO. Dans ce cas :

- l'agrégation, la timeline, les indicateurs et l'export CSV fonctionnent normalement ;
- **le filtrage de la source, de la carte et des composants connectés est désactivé**, car ArcGIS ne peut pas comparer un champ texte à une borne `DATE '…'`. Un avertissement s'affiche dans le widget et dans le panneau Contenu.

Pour disposer du filtrage, publier le champ date comme `esriFieldTypeDate` ou créer dans ArcGIS un champ Date normalisé à partir du champ texte.

Par défaut, le sélecteur de champ temporel ne propose que les champs Date. Les champs texte apparaissent après activation de l'option **Afficher aussi les champs texte (semaines EpiWeek…)** sous le sélecteur.

### Contrôles avant analyse

Avant publication :

1. rechercher les dates futures ou antérieures au début de la surveillance ;
2. documenter la date utilisée : début des symptômes, notification, prélèvement ou validation ;
3. rechercher les doublons et notifications répétées ;
4. contrôler les valeurs nulles et les valeurs non numériques ;
5. vérifier le fuseau horaire du service ;
6. conserver une date d'extraction dans l'expérience.

## 4. Ajouter et configurer le widget

1. Ajouter **Epi Aggregator** à l'expérience.
2. Ouvrir le panneau **Contenu**.
3. Sélectionner une ou plusieurs sources line-list.
4. Une section de configuration est créée pour chaque source.
5. Pour chaque source, sélectionner le champ temporel dans **Champ date ou semaine**.
6. Choisir la statistique.
7. Si nécessaire, choisir le champ de mesure dans la liste filtrée.
8. Choisir la période et le mode de semaine.
9. Choisir le mode d'affichage sur la page.
10. Enregistrer l'expérience.

## 5. Configuration de plusieurs sources

Chaque source possède sa propre configuration et son propre résultat. Une source ajoutée mais sans champ temporel configuré reste masquée dans le panneau d'analyse ; elle apparaît uniquement dans le panneau Contenu jusqu'à sa configuration.

Exemple :

```text
Source Choléra
  Date       : onset_date
  Statistique: Count
  Période    : Semaine ISO
  Filtre     : Progressif

Source Décès
  Date       : report_date
  Statistique: Sum
  Mesure     : deaths
  Période    : Mois
  Filtre     : Une seule période
```

Les indicateurs, périodes et timelines restent séparés. Le total de la source Choléra ne se mélange pas avec le total de la source Décès.

## 6. Choisir une statistique

### Count

Compte les enregistrements dont la date est valide. Aucun champ de mesure n'est nécessaire.

L'indicateur bleu est libellé **Nombre total d'enregistrements**. Il correspond à la somme des enregistrements valides de la source, et non uniquement à la période active.

### Sum

Disponible uniquement pour les champs numériques. Exemple : somme des décès ou des doses administrées.

### Mean

Moyenne arithmétique d'un champ numérique. Les valeurs vides et non numériques sont ignorées.

### Median

Médiane d'un champ numérique. Elle est préférable à la moyenne lorsque des valeurs extrêmes sont présentes.

### Min et Max

Ces deux statistiques acceptent :

- un champ numérique ;
- un champ Date.

Sur une date, `Min` retourne la date la plus ancienne et `Max` la date la plus récente.

### First et Last

Ces statistiques sont réservées aux champs texte, par exemple `status`, `district`, `facility` ou `classification`. Elles suivent l'ordre retourné par le service et nécessitent donc un ordre de requête documenté.

### Distinct

Compte les valeurs différentes d'un champ texte ou numérique. Pour compter des patients uniques, utiliser un identifiant préparé pour l'analyse et contrôler les doublons de visites.

## 7. Périodes disponibles

### Semaine ISO

Semaine calendaire commençant le lundi. Les labels sont par exemple :

```text
2025 S01
2025 S02
```

Certaines années ont une semaine 53.

### Semaine relative à l'épidémie

Après saisie de la date de début, le widget affiche :

```text
EPI W1
EPI W2
EPI W3
```

Cette option permet de comparer des flambées dont les dates de début sont différentes.

### Mois, trimestre et année

Lorsque **Créer des périodes à zéro** est activé, le widget complète automatiquement les trous entre la première et la dernière période. Une semaine sans enregistrement apparaît alors avec une valeur zéro, ce qui évite de confondre absence de notification et absence de période.

Les labels sont par exemple :

```text
2025-01
2025 T1
2025
```

Le widget réinitialise le filtre précédent avant de recalculer une nouvelle agrégation. Un filtre hebdomadaire ne peut donc pas limiter par erreur les résultats mensuels, trimestriels ou annuels.

## 8. Modes de filtre sur la page

### Progressif / cumulatif

Par défaut, la période sélectionnée affiche toutes les données depuis la première période jusqu'à la période active.

Si l'utilisateur sélectionne `2025 S04`, la carte conserve :

```text
S01 + S02 + S03 + S04
```

### Une seule période

Seule la fenêtre de la période active est filtrée.

Pour `2025 S04`, seule la période S04 est affichée.

### Toutes les données

La timeline et les valeurs du widget restent disponibles, mais la carte, la table et les autres composants conservent toutes les données de la source. Dans ce mode, les boutons de période et le curseur restent visibles mais ne modifient pas la source.

## 9. Les timelines

Le widget comporte deux niveaux de commande.

### Timeline liée (au-dessus des sources)

Lorsque plusieurs sources utilisent la même base de périodes, le widget affiche une **Timeline liée**. Elle pilote toutes les sources qui possèdent la même clé de période.

Par exemple, si toutes les sources produisent `2025 S01`, `2025 S02` et `2025 S03`, déplacer le curseur maître vers `2025 S03` actualise les filtres de chaque source. Les sources configurées en mode **Toutes les données** restent volontairement non filtrées.

Pour une synchronisation fiable, utiliser la même agrégation et la même base de semaine pour les sources à comparer.

La timeline liée propose : première période, reculer, lecture/pause, curseur, avancer, dernière période, trois vitesses (lent, normal, rapide) et l'export CSV. Elle affiche également la plage couverte et, lorsque les périodes produisent des valeurs numériques, le total cumulé de la série.

### Timeline de chaque source

Chaque source conserve sa propre timeline, ce qui permet de piloter une source sans déplacer les autres lorsque leurs périodes ne se recouvrent pas.

- Le curseur permet de passer directement d'une période à l'autre.
- Les boutons première, précédente, suivante et dernière période facilite la navigation.
- **Lire** avance d'une période à l'autre ; **Arrêter** suspend la lecture.
- **Lent**, **Normal** et **Rapide** changent la vitesse.
- **Cumulé** affiche la valeur cumulée lorsque la statistique est numérique ; **Brut** revient à la valeur de la période. Le bouton est désactivé lorsque la statistique n'est pas numérique (`First`, `Last`, `Distinct`).
- Le bouton **Afficher les périodes / Masquer les périodes** réduit la liste des boutons, sans désactiver le curseur.
- Les bornes de la série sont affichées sous le curseur.

Lorsque la source contient plus de douze périodes, la liste se replie automatiquement pour éviter un widget trop long. La timeline continue de fonctionner lorsque la liste est repliée.

## 10. Mode timeline uniquement

L'affichage se règle dans **Affichage** :

- **Timeline uniquement** (par défaut) : les cartes de synthèse par source sont masquées pour garder un widget compact ;
- **Timeline et détails des sources** : chaque source affiche sa carte complète (indicateurs, timeline, comparaison, filtre actif).

Dans les deux modes, les sources configurées continuent d'être filtrées et la timeline pilote la carte et les composants connectés. Le compteur de dates illisibles reste visible même en mode compact.

Avec **une seule source** configurée, la timeline liée suffit à piloter l'ensemble : en mode compact, la timeline de source n'est donc pas répétée. Avec **plusieurs sources**, chaque source conserve sa timeline compacte afin de rester pilotable individuellement.

## 11. Indicateurs affichés

Pour chaque source :

- **Nombre total d'enregistrements** : total des enregistrements avec une date valide ;
- **Pic** : valeur maximale observée selon la statistique ;
- étiquette de la période du pic, par exemple `2025 S12` ;
- nombre de périodes générées ;
- **Période active** ou **Total cumulé**, selon l'état du bouton Cumulé ;
- nombre de dates invalides ignorées ;
- nombre d'agrégats zone × période lorsque le regroupement spatial est configuré.

Pour `First`, `Last` et les mesures textuelles, le pic numérique n'est pas calculé et est remplacé par un tiret.

## 12. Interaction avec les composants de la page

Connecter les cartes, graphiques, tables, listes et indicateurs à la même source de données que celle configurée dans le widget.

Lorsqu'une période est sélectionnée, le widget applique une requête temporelle à la source. En mode progressif :

```sql
date_field >= début_de_la_première_période
AND date_field < fin_de_la_période_active
```

En mode période unique :

```sql
date_field >= début_de_la_période_active
AND date_field < fin_de_la_période_active
```

En mode sans filtre, la requête revient à l'ensemble des données.

Si le champ temporel est un champ texte de semaine, aucune requête temporelle n'est appliquée (voir § 3).

Le comportement exact dépend de la version Experience Builder et de la manière dont les composants partagent la source. Tester l'expérience avec une carte, un tableau et un indicateur avant publication.

## 13. Synchronisation avec la carte

Le widget ne choisit pas le type de rendu cartographique. Les cercles proportionnels, les couleurs graduées et les plages de classes restent configurés dans la carte Experience Builder. Dans le widget, seul le mode de rééchelle dynamique ou fixe peut être activé.

Le widget peut piloter une carte sélectionnée dans le panneau Contenu : il applique la période active aux couches liées lorsque leur source possède le même champ temporel et la même clé de période. Il peut aussi demander une rééchelle dynamique des variables visuelles déjà configurées dans le renderer de la couche. Il ne remplace pas le renderer et ne modifie pas la palette choisie par le cartographe.

Pour lier une couche, sélectionner la même source dans la carte et dans Epi Aggregator, utiliser le même champ Date et la même base d'agrégation, puis sélectionner la carte dans **Carte à piloter**.

## 14. Couleur

Le paramètre **Couleur principale** personnalise :

- l'indicateur total ;
- le titre de la source ;
- la période active ;
- les éléments sélectionnés.

La couleur par défaut est `#1261a0`. **Couleur de la ligne timeline** règle séparément la teinte de la timeline liée et **Taille de la timeline** son encombrement (petite, moyenne, grande).

## 15. Dépannage

### Aucun champ Date détecté

Vérifier que le champ est réellement de type Date dans la Feature Layer et non un champ texte. Vérifier également les droits de lecture du service et attendre le chargement du schéma. Pour utiliser malgré tout un champ texte de semaine, activer **Afficher aussi les champs texte**.

### Le widget indique que le filtrage est désactivé

Le champ temporel sélectionné est un champ texte. L'agrégation et la timeline restent valides, mais le filtre de la source nécessite un champ Date natif. Voir § 3.

### Aucun champ numérique détecté

Vérifier que le champ est de type Integer, BigInteger, Single, Double ou équivalent. Les nombres stockés comme texte ne sont pas proposés comme mesures numériques ; les normaliser dans la source.

### Une seule année ou période apparaît

Réinitialiser le widget, vérifier le mode d'affichage et changer d'agrégation. La version actuelle efface le filtre de timeline avant chaque recalcul. Si le problème persiste, vérifier qu'une vue de données ou un filtre externe ne limite pas la source.

### La timeline ne filtre pas la carte

Vérifier que la carte utilise la même source, que le champ est un vrai champ Date et que le service autorise les requêtes. Vérifier aussi que la source n'est pas en mode **Toutes les données**. Pour les vues de données séparées, configurer une action de données ou une source partagée.

### Les valeurs numériques sont nulles

Vérifier que le champ mesure est sélectionné, qu'il est numérique et que ses valeurs ne contiennent pas uniquement des textes ou des valeurs vides.

### Trop de périodes

Utiliser **Masquer les périodes**. La timeline continue de fonctionner et la période active reste affichée en haut.

## 16. Export

Le bouton **CSV** de la timeline télécharge les périodes actuellement agrégées avec : la clé, le label, le nombre d'enregistrements, la valeur, le début et la fin de chaque période. Lorsqu'un champ de regroupement spatial est configuré, l'export contient en plus la zone :

```text
boundary,period,label,count,value,start,end
```

Cet export est destiné au contrôle, à la revue de situation et à la réutilisation analytique.

## 17. Regroupement spatial

Chaque source peut déclarer un **Champ de regroupement spatial** optionnel, par exemple `adm1_name`, `adm2_name`, `district` ou `facility`. Le moteur produit des résultats par période et par zone sans modifier la line-list :

- les agrégats zone × période sont comptés et affichés dans la carte de la source ;
- ils alimentent l'export CSV par zone ;
- ils alimentent la couche virtuelle cartographique (§ 18).

### Couche virtuelle agrégée (carte)

Lorsqu'une **Couche frontière / géométrie** est sélectionnée et qu'un champ de regroupement est configuré, le widget construit à la volée une couche temporaire en joignant les agrégats période/zone aux géométries de la couche frontière. Elle contient les champs `boundary`, `period`, `value`, `count` et `label`.

- La couche est créée côté client et retirée lorsque la période change ou que le widget est démonté.
- Les données sources ne sont jamais modifiées : ni la line-list, ni la couche frontière.
- La symbologie de cette couche se configure dans la carte, comme pour toute autre couche.
- Les libellés de zone doivent être cohérents entre la line-list et la couche frontière, faute de quoi la jointure ne produit aucune géométrie.

## 18. Limites

- Le widget ne remplace pas un pipeline ETL de qualité de données.
- Les très grosses line-lists devraient être pré-agrégées côté serveur.
- Le filtrage de la source exige un champ Date natif ; un champ texte de semaine ne peut pas être filtré par le service.
- Le regroupement spatial dépend de la cohérence des libellés entre la line-list et la couche frontière.
- Les taux d'incidence nécessitent un dénominateur de population et doivent être préparés dans une couche analytique dédiée.
- Les intervalles de confiance, moyennes mobiles et seuils d'alerte doivent être calculés avec leurs hypothèses documentées.
- Les petits effectifs doivent être protégés contre la ré-identification.
