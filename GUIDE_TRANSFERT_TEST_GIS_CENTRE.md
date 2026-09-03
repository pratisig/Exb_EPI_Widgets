# Guide de transfert et de test — Epi Aggregator 2.0

**Destinataires :** GIS Centre, équipes GIS et surveillance épidémiologique

**Version de test :** Epi Aggregator 2.0

**Branche :** `arena/019fc9ad-exb-epi-widgets`

## 1. Objet du pilote

Epi Aggregator 2.0 est un widget personnalisé ArcGIS Experience Builder pour analyser des line-lists épidémiologiques dans le temps, synchroniser plusieurs sources et préparer des agrégations par zone.

Le pilote doit vérifier :

- les formats de dates utilisés sur le terrain ;
- les semaines ISO et les semaines épidémiologiques relatives ;
- les agrégations mois/trimestre/année ;
- la comparaison de plusieurs années ;
- la synchronisation de plusieurs sources ;
- le comportement de la timeline avec cartes, indicateurs, graphiques et tables ;
- le regroupement par champ administratif ;
- les performances avec une line-list réelle anonymisée.

## 2. Pré-requis techniques

- ArcGIS Experience Builder Developer Edition 1.15 ou une version compatible ;
- une organisation ArcGIS Online ou ArcGIS Enterprise ;
- Node.js 20 LTS pour Experience Builder 1.15 ;
- Git, ou une archive du dépôt ;
- un compte pouvant lire les Feature Layers et tables de test ;
- une carte Experience Builder contenant au moins une couche de test.

Pour Experience Builder 1.15, utiliser `npm ci`, et non `pnpm ci`.

## 3. Installation locale

Cloner la branche de test :

```powershell
git clone -b arena/019fc9ad-exb-epi-widgets https://github.com/pratisig/Exb_EPI_Widgets.git
cd Exb_EPI_Widgets
```

Copier le widget vers Experience Builder :

```powershell
Copy-Item `
  ".\widgets\epi-aggregator" `
  "C:\Chemin\ArcGISExperienceBuilder\client\your-extensions\widgets\epi-aggregator" `
  -Recurse -Force
```

Remplacer `C:\Chemin\ArcGISExperienceBuilder` par le chemin local réel.

Le widget doit contenir :

```text
icon.svg
manifest.json
config.json
src\runtime\widget.tsx
src\runtime\aggregation.ts
src\runtime\comparison.ts
src\runtime\spatialAggregation.ts
src\runtime\virtualLayer.ts
src\setting\setting.tsx
```

## 4. Démarrage d’Experience Builder

Dans le dossier `server` :

```powershell
npm ci
npm run start
```

Dans le dossier `client` :

```powershell
npm ci
npm run start
```

Ouvrir :

```text
https://localhost:3001/
```

Pour une organisation Enterprise, renseigner :

```text
Portal URL : https://geo.geomsf.org/portal
```

Le Client ID OAuth doit être créé dans le même portail. L’URI de redirection doit être :

```text
https://localhost:3001/jimu-core/oauth-callback.html
```

Si le portail est derrière CloudFront ou un reverse proxy, l’administrateur doit autoriser et transmettre les paramètres de :

```text
/portal/sharing/rest/oauth2/authorize
/portal/sharing/rest/oauth2/token
```

## 5. Données de test minimales

Créer une couche ou table de test anonymisée contenant au minimum :

```text
case_id       : texte ou identifiant
onset_date    : Date ou texte EpiWeek
adm1_name     : texte
status        : texte
cases         : numérique
 deaths       : numérique
```

Éviter les données nominatives ou les coordonnées individuelles dans le pilote initial.

Jeu de test recommandé :

| case_id | onset_date | adm1_name | status | cases | deaths |
|---|---|---|---|---:|---:|
| 1 | 2024-01-03 | Dakar | Confirmed | 1 | 0 |
| 2 | 2024-01-05 | Dakar | Probable | 1 | 0 |
| 3 | 2024-01-12 | Thiès | Confirmed | 1 | 1 |
| 4 | Week 03-2025 | Dakar | Confirmed | 1 | 0 |
| 5 | 2025-W04 | Thiès | Suspected | 1 | 0 |

Pour tester les années, utiliser au moins trois années et plusieurs périodes par année.

## 6. Configuration du widget

1. Ajouter Epi Aggregator à une expérience.
2. Ouvrir le panneau **Contenu**.
3. Sélectionner une ou plusieurs sources.
4. Pour chaque source, choisir le champ date détecté.
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
6. Choisir le champ numérique ou texte selon la statistique.
7. Choisir l’agrégation temporelle.
8. Choisir le mode de filtre :
   - période unique ;
   - progressif/cumulatif ;
   - toutes les données.

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

### Test A — Timeline simple

- Agrégation : semaine ISO ;
- une source ;
- statistique : Count ;
- cliquer sur plusieurs périodes ;
- vérifier le filtre de la carte et de la table ;
- tester Play/Pause et les trois vitesses.

Résultat attendu : la période active et le filtre changent sans recharger l’expérience.

### Test B — Années multiples

- Agrégation : semaine ISO ;
- données 2023, 2024 et 2025 ;
- mode : Comparer les années ;
- années : `2023, 2024, 2025` ;
- année de référence : `2024`.

Résultat attendu : les périodes comparables sont alignées et les colonnes de variation sont calculées.

### Test C — Périodes manquantes

Supprimer les lignes d’une semaine au milieu de la série et activer :

```text
Créer des périodes à zéro
```

Résultat attendu : la semaine absente apparaît avec une valeur zéro.

### Test D — Plusieurs sources

Ajouter une source Cas et une source Décès avec la même clé temporelle.

Résultat attendu : la timeline liée filtre les deux sources ensemble.

### Test E — Regroupement administratif

Configurer :

```text
Boundary Field : adm1_name
```

Vérifier dans le CSV la présence de :

```text
boundary
period
count
value
```

### Test F — Carte et symbologie

Configurer la symbologie dans la carte, pas dans le widget :

- cercles proportionnels pour les points ;
- couleurs graduées pour les polygones ;
- variables visuelles existantes ;
- échelle dynamique ou fixe dans le widget.

Déplacer la timeline et vérifier que le filtre temporel et les variables visuelles réagissent à la période active.

## 8. Critères d’acceptation GIS Centre

Le pilote peut être accepté si :

- une source Date native est détectée ;
- un champ EpiWeek texte est normalisé ;
- plusieurs années sont affichées ;
- une comparaison annuelle est lisible ;
- les périodes manquantes peuvent être représentées par zéro ;
- deux sources partagent la timeline ;
- le mode période unique fonctionne ;
- le mode cumulatif fonctionne ;
- le mode sans filtre fonctionne ;
- l’export CSV est exploitable ;
- une source peut être regroupée par zone ;
- une couche frontière peut être sélectionnée ;
- aucune donnée source n’est modifiée ;
- une line-list anonymisée de taille représentative reste utilisable.

## 9. Fiche de retour d’expérience

Pour chaque test, documenter :

```text
Pays / mission :
Utilisateur testeur :
Version Experience Builder :
Version Portal :
Taille de la source :
Type de source :
Champ temporel :
Champ Boundary :
Période choisie :
Statistique :
Navigateur :
Résultat :
Erreur console :
Capture écran :
Priorité : critique / haute / moyenne / basse
```

Ne jamais joindre de données nominatives ou de secrets OAuth à un ticket.

## 10. Limites connues du pilote

- Le calcul est principalement côté navigateur ; les gros volumes doivent être mesurés avant déploiement.
- Le regroupement spatial nécessite des valeurs Boundary cohérentes entre la line-list et la couche frontière.
- La carte doit conserver son renderer ; le widget agit sur le filtre et les variables visuelles déjà configurées.
- Les cartes, graphiques et indicateurs doivent utiliser les sources configurées ou une vue de données compatible.
- Les taux épidémiologiques ne sont pas déduits automatiquement : leurs définitions et dénominateurs doivent être préparés et validés par la surveillance.
- Pour une utilisation Enterprise derrière un proxy, la configuration OAuth et la transmission des query strings doivent être validées par l’administrateur Portal.

## 11. Support et livraison du retour

Pour chaque problème, transmettre :

1. la version du widget ;
2. la version Experience Builder ;
3. le scénario de test ;
4. la structure des champs sans données sensibles ;
5. l’erreur de la console ;
6. une capture d’écran anonymisée ;
7. la fréquence et la gravité du problème.

Le manuel général se trouve dans `MANUEL_UTILISATION.md` et la description technique dans `README.md`.
