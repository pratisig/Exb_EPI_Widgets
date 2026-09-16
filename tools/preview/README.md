# Aperçu hors Experience Builder

Cette page exécute **le moteur et les styles réels du widget** pour vérifier les agrégations, la timeline, le cumulé, le repli des périodes et l'export CSV **sans installer Experience Builder**.

## Lancement

Depuis la racine du dépôt :

```powershell
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000/tools/preview/index.html`.

Le double-clic sur `index.html` ne fonctionne pas : le navigateur interdit la lecture du fichier CSV local en `file://`.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'aperçu (configuration, rendu, contrôles) |
| `apercu.js` | Logique d'aperçu : lecture du CSV, agrégation, timeline, export CSV, contrôles |
| `moteur.js` | **Fichier généré** : bundle des moteurs `aggregation.ts`, `comparison.ts`, `spatialAggregation.ts` |

## Régénérer `moteur.js`

À refaire après toute modification d'un fichier du moteur :

```powershell
npx esbuild widgets/epi-aggregator/src/runtime/aggregation.ts widgets/epi-aggregator/src/runtime/comparison.ts widgets/epi-aggregator/src/runtime/spatialAggregation.ts --bundle --format=iife --global-name=EpiMoteur --outfile=tools/preview/moteur.js
```

## Portée

Testable : moteur de dates et d'agrégation, statistiques, périodes manquantes, libellés de semaine texte, timeline, cumulé/brut, repli des périodes, comparaison inter-annuelle, agrégats par zone, export CSV.

Non testable ici : carte, couches ArcGIS, requête serveur (`updateQueryParams`, `definitionExpression`), couche virtuelle, panneau Contenu, rendu `jimu-ui`. Ces éléments relèvent de la campagne Experience Builder décrite dans `GUIDE_TRANSFERT_TEST_GIS_CENTRE.md` (tests T1 à T15).
