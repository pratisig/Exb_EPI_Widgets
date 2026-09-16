# Epi Aggregator — Experience Builder widget

Widget custom pour ArcGIS Experience Builder, conçu pour les line-lists d'épidémies (MSF et partenaires humanitaires). Il transforme un champ de date hétérogène en périodes directement utilisables par les cartes, graphiques, listes, tables et indicateurs connectés à la même source.

## Version

| Élément | Valeur |
|---|---|
| Version du widget | `2.0.0` (`manifest.json`) |
| Version Experience Builder déclarée | `exbVersion: "1.14.0"` — l'outillage de test cible ExB 1.15 / Node 20 LTS ; à confirmer par le GIS Centre |
| Licence | Apache-2.0 |
| Locales | `en`, `fr` |

Aucun tag Git n'est publié : la version de référence est identifiée par le commit. Voir `DOSSIER_PROPOSITION_GIS_CENTRE.md` § 3 pour la traçabilité complète.

## Fonctions

- Plusieurs sources line-list dans un même widget, avec champ date, mesure, statistique et période configurables séparément pour chaque source, plus une timeline liée lorsque les clés de période correspondent.
- Champ temporel sélectionnable parmi les champs **Date natifs** et, sur demande, parmi les **champs texte semaine** (`2025-W04`, `Week 03-2025`, `S01_2026`, `W01-2026`), normalisés en semaine ISO.
- Lecture des dates ISO, timestamps ArcGIS, dates Excel, `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD` et formats texte JavaScript.
- Agrégation par semaine épidémiologique ISO (S1–S53), mois, trimestre et année.
- Statistiques par période : comptage, somme, moyenne, médiane, minimum, maximum, première/dernière valeur et valeurs distinctes sur un champ numérique, numérique ou date, ou texte.
- Deux bases de semaine : semaine calendaire ISO ou semaine relative au début de l'épidémie (`EPI W1`, `EPI W2`, …).
- Comptage par période, signalement des dates illisibles et filtre de la source par période.
- Timeline liée (Play/Stop, pas à pas, vitesse, total cumulé) qui avance automatiquement et applique le filtre aux widgets connectés ; chaque source conserve en plus sa propre timeline pour rester pilotable individuellement.
- Liste de périodes repliable (**Afficher les périodes / Masquer les périodes**) et valeur affichée sur chaque période, en brut ou en cumulé.
- Interface bilingue français/anglais.
- Convention configurable pour les dates ambiguës (`jour/mois`, `mois/jour`, automatique).
- Synthèse de qualité et de surveillance : cas valides, dates ignorées, pic et nombre de périodes, plus agrégats zone × période lorsqu'un champ de regroupement est configuré.
- Mode cumulatif pour suivre la charge totale, bouton de réinitialisation du filtre, vitesse de timeline réglable.
- Période active, pic avec son label et total d'enregistrements affichés pour chaque source.
- Comparaison inter-annuelle alignée (delta et %) et export CSV (global ou par zone).
- Regroupement par champ administratif et couche virtuelle temporaire jointe aux géométries d'une couche frontière, sans modification des données sources.
- Manuel utilisateur complet dans `MANUEL_UTILISATION.md`, protocole de test dans `GUIDE_TRANSFERT_TEST_GIS_CENTRE.md`, dossier de décision dans `DOSSIER_PROPOSITION_GIS_CENTRE.md`.

## Installation

1. Copier `widgets/epi-aggregator` dans le dossier `client/your-extensions/widgets` du dépôt Experience Builder Developer Edition (ou dans le répertoire d'extensions prévu par votre organisation).
2. Lancer `npm ci` puis `npm start` dans Experience Builder. Pour une version déployée, utiliser le processus officiel `npm run build` de votre version d'Experience Builder.
3. Ajouter **Epi Aggregator** à l'expérience, choisir la couche/table de line-list dans les paramètres et renseigner le champ temporel (ex. `onset_date`).
4. Connecter les cartes, graphiques, listes, tables et indicateurs à la même source de données. La sélection d'une période met à jour la requête de la source avec une fenêtre `[début, fin)`.

Sous Windows, `tools/Start-ExperienceBuilder.ps1` automatise l'activation de Node 20, l'installation des dépendances, la copie du widget et le démarrage du serveur et du client (voir `tools/README.md`).

> Le widget est livré sans `node_modules` ni lockfile : les dépendances sont celles de l'instance Experience Builder qui l'héberge (`jimu-core`, `jimu-ui`, `jimu-arcgis`). Aucune dépendance externe n'est ajoutée.

## Notes GIS / données

- Pour de meilleures performances sur une grosse line-list, publier le champ date comme vrai champ `esriFieldTypeDate`. Les données locales ou les dates dans des formats mélangés peuvent être normalisées dans le widget, mais le filtre serveur final nécessite un champ date interrogeable par ArcGIS.
- **Champ texte semaine.** Un champ texte contenant des libellés de semaine peut être utilisé comme champ temporel : l'agrégation, la timeline, les indicateurs et l'export CSV fonctionnent. En revanche, un filtre serveur `DATE '…'` est impossible sur un champ texte : le widget désactive alors le filtrage de la source, de la carte et des composants connectés, et affiche un avertissement explicite. Pour filtrer la carte, utiliser un champ `esriFieldTypeDate`.
- Les dates ambiguës où les deux premiers nombres sont inférieurs ou égaux à 12 sont interprétées en convention jour/mois, convention par défaut des équipes terrain. Utiliser ISO pour éliminer toute ambiguïté.
- Une semaine ISO peut être `S53` certaines années ; le widget ne force pas artificiellement 52 semaines.
- La période active est appliquée via `updateQueryParams` avec l'identifiant du widget, et via `definitionExpression` sur la couche cartographique liée. Si l'expérience utilise des vues de données séparées, relier les widgets à la même source ou configurer une action de message/filtre de données dans Experience Builder.
- Le widget ne modifie jamais les données sources. La couche virtuelle du regroupement par zone est temporaire et côté client uniquement.

## Vérification avant livraison

Chaque modification livrée est vérifiée par compilation statique (bundling TSX/TS et `tsc --strict`, dépendances `jimu-*` remplacées par des stubs de types) : aucune erreur de typage ni de compilation, aucune variable ou import inutilisé. La validation du comportement dans Experience Builder reste manuelle et est décrite dans le protocole de test.

## Tester et partager

| Objectif | Point d'entrée |
|---|---|
| Voir le widget fonctionner sans Experience Builder | `tools/preview/index.html` (voir `tools/preview/README.md`) |
| Tester dans Experience Builder | § 3 de `PARTAGER_ET_TESTER.md` |
| Vérifier le moteur de calcul (17 contrôles) | Section 4 de l'aperçu navigateur |
| Envoyer la version à un collègue | `deliverables/epi-aggregator-2.0.0.zip` + empreinte `.sha256` |
| Transmettre au GIS Centre | `DOSSIER_PROPOSITION_GIS_CENTRE.md` et son PDF |

Mode opératoire détaillé : `PARTAGER_ET_TESTER.md`.

## Versions imprimables

Les versions PDF, HTML et DOCX de cette description, du manuel, du guide de transfert et du dossier de proposition sont générées dans `deliverables/` (voir `deliverables/README.md` pour le mode de régénération).

```text
deliverables/DESCRIPTION_OUTIL_EPI_AGGREGATOR.pdf
deliverables/DESCRIPTION_OUTIL_EPI_AGGREGATOR.docx
```

## Structure

- `src/runtime/aggregation.ts` : parsing et moteur d'agrégation indépendant d'ExB, facilement testable.
- `src/runtime/comparison.ts` : alignement des périodes entre années.
- `src/runtime/spatialAggregation.ts` : agrégats période × zone.
- `src/runtime/virtualLayer.ts` : jointure des agrégats avec les géométries d'une couche frontière.
- `src/runtime/widget.tsx` : interface, requête de la line-list, filtre, timlines et carte.
- `src/setting/setting.tsx` : sélection de source et configuration.
