# Epi Aggregator — Experience Builder widget

Widget custom pour ArcGIS Experience Builder, conçu pour les line-lists d'épidémies (MSF et partenaires humanitaires). Il transforme un champ de date hétérogène en périodes directement utilisables par les cartes, graphiques, listes, tables et indicateurs connectés à la même source.

## Fonctions

- Lecture des dates ISO, timestamps ArcGIS, dates Excel, `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD` et formats texte JavaScript.
- Agrégation par semaine épidémiologique ISO (S1–S53), mois, trimestre et année.
- Deux bases de semaine : semaine calendaire ISO ou semaine relative au début de l'épidémie (`EPI W1`, `EPI W2`, …).
- Comptage par période, signalement des dates illisibles et filtre de la source par période.
- Timeline Play/Stop : avance automatiquement au pas sélectionné et applique le filtre aux widgets connectés.
- Interface bilingue français/anglais.

## Installation

1. Copier `widgets/epi-aggregator` dans le dossier `client/your-extensions/widgets` du dépôt Experience Builder Developer Edition (ou dans le répertoire d'extensions prévu par votre organisation).
2. Lancer `npm install` puis `npm start` dans Experience Builder. Pour une version déployée, utiliser le processus officiel `npm run build` de votre version d'Experience Builder.
3. Ajouter **Epi Aggregator** à l'expérience, choisir la couche/table de line-list dans les paramètres et renseigner le nom du champ date (ex. `onset_date`).
4. Connecter les cartes, graphiques, listes, tables et indicateurs à la même source de données. La sélection d'une période met à jour la requête de la source avec une fenêtre `[début, fin)`.

> Le widget est livré sans `node_modules` ni lockfile : les dépendances sont celles de l'instance Experience Builder qui l'héberge (`jimu-core`, `jimu-ui`). Les versions ExB diffèrent ; si votre version ne propose pas `DataSourceTypes.MapService`, retirez ce type de la liste dans `setting.tsx` ou remplacez-le par le type équivalent de cette version.

## Notes GIS / données

- Pour de meilleures performances sur une grosse line-list, publier le champ date comme vrai champ `esriFieldTypeDate`. Les données locales ou les dates dans des formats mélangés peuvent être normalisées dans le widget, mais le filtre serveur final nécessite un champ date interrogeable par ArcGIS.
- Les dates ambiguës où les deux premiers nombres sont inférieurs ou égaux à 12 sont interprétées en convention jour/mois, convention par défaut des équipes terrain. Utiliser ISO pour éliminer toute ambiguïté.
- Une semaine ISO peut être `S53` certaines années ; le widget ne force pas artificiellement 52 semaines.
- La période active est appliquée via `updateQueryParams` avec l'identifiant du widget. Si l'expérience utilise des vues de données séparées, relier les widgets à la même source ou configurer une action de message/filtre de données dans Experience Builder.

## Structure

- `src/runtime/aggregation.ts` : parsing et moteur d'agrégation indépendant d'ExB, facilement testable.
- `src/runtime/widget.tsx` : interface, requête de la line-list, filtre et timeline.
- `src/setting/setting.tsx` : sélection de source et configuration.
