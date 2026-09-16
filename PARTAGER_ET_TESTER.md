# Partager et tester Epi Aggregator 2.0

Ce guide répond à deux questions : **comment tester la version corrigée maintenant** et **comment la transmettre** à des collègues ou au GIS Centre.

| Je veux… | Chemin | Temps |
|---|---|---|
| Voir le widget fonctionner sans rien installer | § 1 — aperçu navigateur | 2 min |
| Vérifier que le moteur calcule juste | § 2 — contrôles automatiques | 2 min |
| Tester dans Experience Builder | § 3 — installation complète | 2 à 4 h |
| Envoyer la version à un collègue | § 4 — archive ZIP ou GitHub | 5 min |
| Transmettre au GIS Centre pour décision | § 5 — paquet de décision | 10 min |

---

## 1. Voir le widget fonctionner sans installer Experience Builder

Le fichier `tools/preview/index.html` rejoue l'interface du widget avec **le moteur et les styles réels du dépôt** (`aggregation.ts`, `comparison.ts`, `spatialAggregation.ts`, `runtime/style.css`).

### 1.1 Le plus rapide : double-clic

Ouvrir `tools/preview/index.html` dans un navigateur ne suffit pas : le navigateur bloque la lecture du CSV local (`fetch` sur `file://`). Utiliser l'une des deux méthodes ci-dessous.

### 1.2 Serveur local en une commande

Depuis la racine du dépôt :

```powershell
python -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000/tools/preview/index.html
```

### 1.3 Emporté avec la version hébergée

Si le dossier est déjà exposé par un serveur web, l'URL est :

```text
https://<votre-serveur>/tools/preview/index.html
```

### Ce qui est testable dans l'aperçu

| Élément | Testable | Remarque |
|---|---|---|
| Semaine ISO, EPI-week, mois, trimestre, année | Oui | Moteur réel |
| Conventions jour/mois, mois/jour, automatique | Oui | Moteur réel |
| Comptage, somme, moyenne, médiane, max, valeurs distinctes | Oui | Moteur réel |
| Champ texte semaine (EpiWeek) et son avertissement | Oui | Sélectionner `week_label (Texte / EpiWeek)` |
| Timeline, lecture, vitesses, cumulé/brut, repli des périodes | Oui | Mêmes classes CSS que le widget |
| Indicateurs : total, pic, périodes, période active ou cumul | Oui | — |
| Comparaison inter-annuelle (delta, %) | Oui | — |
| Agrégats zone x période et export CSV par zone | Oui | Sélectionner `adm1_name` |
| Mon propre fichier CSV | Oui | Choisir « Fichier CSV à moi… » |
| Carte, couches ArcGIS, requête serveur, filtre `definitionExpression` | **Non** | Nécessite Experience Builder |
| Rendu des composants `jimu-ui`, comportement du panneau Contenu | **Non** | Nécessite Experience Builder |

> **Ne pas confondre.** L'aperçu valide le *calcul* et la logique de timeline, pas l'intégration. Les tests T1 à T15 du guide de transfert restent la référence pour la décision.

---

## 2. Vérifier que le moteur calcule juste

Dans la même page, la section **« Contrôles automatiques du moteur »** exécute 17 contrôles : semaines ISO (dont la semaine 53), conventions de dates, dates impossibles, séries Excel, libellés `2024-W02` / `Week 04-2025` / `S01_2026`, comptage, somme, médiane, périodes manquantes à zéro, dates illisibles, comparaison inter-annuelle et agrégats par zone.

Pour les relancer après une modification du code, reconstruire le moteur puis recharger la page :

```powershell
npx esbuild widgets/epi-aggregator/src/runtime/aggregation.ts widgets/epi-aggregator/src/runtime/comparison.ts widgets/epi-aggregator/src/runtime/spatialAggregation.ts --bundle --format=iife --global-name=EpiMoteur --outfile=tools/preview/moteur.js
```

---

## 3. Tester dans Experience Builder

### 3.1 Prérequis

- ArcGIS Experience Builder **Developer Edition 1.15** décompressé ;
- **Node.js 20 LTS** ;
- une organisation ArcGIS Online ou Enterprise et un compte de test ;
- environ 3 Go d'espace disque et une bonne connexion (l'installation des dépendances est longue).

### 3.2 Installation

```powershell
git clone https://github.com/pratisig/Exb_EPI_Widgets.git
cd Exb_EPI_Widgets
git checkout arena/01a0aaf8-exb-epi-widgets
git log -1 --oneline     # noter le commit : c'est l'artefact testé
```

Copier le widget :

```powershell
Copy-Item `
  ".\widgets\epi-aggregator" `
  "C:\Chemin\ArcGISExperienceBuilder\client\your-extensions\widgets\epi-aggregator" `
  -Recurse -Force
```

Ou, sans Git, décompresser `deliverables/epi-aggregator-2.0.0.zip` (le dossier `epi-aggregator` est à la racine de l'archive) au même endroit.

Puis lancer les deux services (deux fenêtres, à laisser ouvertes) :

```powershell
cd C:\Chemin\ArcGISExperienceBuilder\server ; npm ci ; npm run start
cd C:\Chemin\ArcGISExperienceBuilder\client ; npm ci ; npm run start
```

Sous Windows, le lanceur fourni fait tout cela, y compris la copie du widget :

```powershell
.\tools\Start-ExperienceBuilder.ps1 `
  -ExperienceBuilderPath "C:\Chemin\ArcGISExperienceBuilder" `
  -InstallDependencies -CopyWidget
```

Ouvrir ensuite `https://localhost:3001/`.

### 3.3 Données de test

Le fichier `deliverables/donnees_test/epi_line_list_test.csv` (226 lignes, 2023-2025, 3 zones) est prêt à être publié comme table hébergée ArcGIS :

1. ArcGIS Online → **Contenu** → **Nouvel élément** → *Importer un fichier CSV* ;
2. publier comme **table hébergée**, puis **Publier** en Feature Layer si la carte doit être filtrée ;
3. vérifier que `onset_date` est bien de type **Date** et que `week_label` reste en **texte** : c'est ce qui permet de reproduire le cas E2.

Le fichier contient volontairement : une semaine manquante (T6), une date impossible `31/02/2024` et une date illisible (T15b), une date ambiguë `03/04/2024` (T15), et 30 lignes avec libellé de semaine texte (T14).

### 3.4 Premier montage

1. Créer une expérience, ajouter **Epi Aggregator**.
2. Panneau **Contenu** → sélectionner la table de test.
3. Pour chaque source : **Champ date ou semaine**, statistique, agrégation, convention, mode d'affichage.
4. Pour le test du champ texte : activer *Afficher aussi les champs texte (semaines EpiWeek…)* puis choisir `week_label` — l'avertissement de filtrage doit apparaître.
5. Enregistrer, puis dérouler les scénarios du `GUIDE_TRANSFERT_TEST_GIS_CENTRE.md`.

### 3.5 Pièges fréquents

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le widget n'apparaît pas dans le panneau | Copie au mauvais endroit | Le chemin doit finir par `client\your-extensions\widgets\epi-aggregator` |
| Erreur de compilation au démarrage | Mauvaise version de Node | `nvm use 20` avant `npm ci` |
| `npm ci` échoue | Lockfile absent ou version ExB différente | Utiliser la même version majeure d'ExB que celle du dépôt téléchargé |
| Page inaccessible | Un seul des deux services lancé | `server` **et** `client` doivent tourner |
| Erreur d'authentification au portail | Client ID OAuth ou URI de redirection | URI : `https://localhost:3001/jimu-core/oauth-callback.html` |
| Aucun champ Date détecté | `onset_date` importé en texte | Republier la colonne en `esriFieldTypeDate` |
| Le filtre ne touche pas la carte | Source ou champ différents | Même source et même champ date dans la carte et le widget |

---

## 4. Envoyer la version à un collègue

### 4.1 Archive ZIP (recommandé pour un test rapide)

Le fichier `deliverables/epi-aggregator-2.0.0.zip` contient uniquement le widget, prêt à décompresser dans `client\your-extensions\widgets`.

Envoyer avec l'empreinte pour vérifier l'intégrité :

```text
epi-aggregator-2.0.0.zip
epi-aggregator-2.0.0.zip.sha256
```

Vérification côté destinataire (PowerShell) :

```powershell
Get-FileHash .\epi-aggregator-2.0.0.zip -Algorithm SHA256
```

La valeur doit correspondre à celle du fichier `.sha256`.

### 4.2 GitHub (recommandé pour la traçabilité)

| Moyen | Usage |
|---|---|
| **PR #2** (`arena/01a0aaf8-exb-epi-widgets` → `main`) | Revue du code, discussion, fusion après validation |
| **Branche de test** | `git checkout arena/01a0aaf8-exb-epi-widgets` pour tester la version corrigée |
| **Archive du dépôt** | GitHub → *Code* → *Download ZIP* (version d'une branche donnée) |
| **Release avec pièce jointe** | Fige l'artefact et le rend téléchargeable sans Git : voir § 4.3 |

Pour figer la version testée, créer une release :

```powershell
gh release create v2.0.0-rc1 `
  deliverables/epi-aggregator-2.0.0.zip `
  deliverables/DOSSIER_PROPOSITION_GIS_CENTRE.pdf `
  --title "Epi Aggregator 2.0.0-rc1 — version de test GIS Centre" `
  --notes "Version de test : correctifs E1 à E3. Tester avec le guide de transfert, tests T1 à T15."
```

### 4.3 Ce qu'il faut joindre à un envoi

| Public | Documents |
|---|---|
| Testeur technique | `epi-aggregator-2.0.0.zip`, `GUIDE_TRANSFERT_TEST_GIS_CENTRE.pdf`, `donnees_test/epi_line_list_test.csv` |
| Utilisateur métier | `MANUEL_UTILISATION.pdf` |
| Décideur / comité | `DOSSIER_PROPOSITION_GIS_CENTRE.pdf` + `DESCRIPTION_OUTIL_EPI_AGGREGATOR.pdf` |

Tous ces fichiers sont dans `deliverables/` (voir `deliverables/README.md`). **Ne jamais joindre de données nominatives ni de secrets OAuth**, et anonymiser les captures d'écran.

---

## 5. Transmettre au GIS Centre pour décision

1. Vérifier que la **PR #2** est fusionnée dans `main` (ou indiquer la branche de test exacte).
2. Envoyer le paquet du § 4.3 avec une date limite de retour.
3. Demander la confirmation de la version Experience Builder (écart E4) et l'arbitrage des limites résiduelles (§ 6.2 du dossier).
4. Récupérer le **formulaire de décision** du § 14 du dossier, complété et signé.
5. À l'issue du pilote : taguer la version validée (`gh release create v2.0.1 --target main`) pour que les prochains utilisateurs disposent d'un artefact figé.

---

## 6. Rappel des limites de l'aperçu

- L'aperçu ne teste pas ArcGIS : ni la carte, ni la requête serveur, ni les couches virtuelles, ni le panneau Contenu d'Experience Builder.
- Il utilise le même moteur de calcul et les mêmes styles, mais pas les composants `jimu-ui` : l'apparence peut différer légèrement du rendu final.
- Le chargement des gros volumes n'est pas représentatif : la performance doit être mesurée dans Experience Builder (test T12).
