# Manuel de terrain — Epi Aggregator

## 1. Objectif

Epi Aggregator est un widget Experience Builder destiné aux équipes GIS, surveillance et coordination. Il transforme une line-list en série temporelle exploitable sans imposer de modifier les données sources.

Il répond notamment à ces questions :

- Combien de cas ont été notifiés par semaine, mois, trimestre ou année ?
- Quel est le pic de la période analysée ?
- Où se situe la période active sur une carte ou un graphique ?
- Combien d'enregistrements contiennent une date illisible ?
- Quelle est la progression cumulée au cours de l'épidémie ?

## 2. Avant de commencer

### Données recommandées

La table ou couche devrait avoir :

- un identifiant unique (`case_id`) ;
- un champ date de référence documenté (`onset_date`, `report_date`, `specimen_date`, etc.) ;
- un champ de statut (`confirmed`, `probable`, `suspected`, `discarded`) ;
- une localisation ou un code géographique ;
- idéalement un vrai champ ArcGIS de type Date.

Ne mélangez pas les dates de début des symptômes, de notification et de prélèvement sans l'indiquer à l'utilisateur : elles répondent à des questions épidémiologiques différentes.

### Contrôle préalable

Avant publication :

1. vérifier le fuseau horaire et la règle d'inclusion des cas ;
2. rechercher les dates futures, les dates avant le début de la surveillance et les doublons ;
3. conserver le champ original et, si possible, créer un champ date normalisé ;
4. documenter si la date est connue au jour, à la semaine ou seulement au mois.

## 3. Configuration

1. Ajouter **Epi Aggregator** à l'expérience.
2. Dans le panneau Contenu, sélectionner une ou plusieurs Feature Layers/tables line-list.
3. Pour chaque source, choisir le champ date dans la liste des champs de la source.
4. Pour chaque source, choisir la statistique et, si nécessaire, le champ numérique dans la liste des champs.
5. Choisir la période, le mode de semaine et la convention de date propres à chaque source.
6. Choisir la convention des dates ambiguës :
   - **Jour / mois / année** : recommandée pour les équipes terrain francophones ;
   - **Mois / jour / année** : pour les exports provenant des États-Unis ;
   - **Automatique** : à utiliser seulement si les dates ambiguës ont été contrôlées.
5. Enregistrer l'expérience.

Le champ peut aussi être saisi directement dans le widget lorsque l'interface est affichée aux utilisateurs.

## 4. Modes d'agrégation

### Semaine calendaire ISO

Utiliser ce mode pour comparer plusieurs années ou suivre la surveillance selon une norme commune. Une semaine commence le lundi et certaines années comportent une semaine 53.

Exemple : `2024 S01`, `2024 S02`.

### Semaine relative à l'épidémie

Utiliser ce mode pour comparer la dynamique d'une flambée depuis son démarrage. Saisir la date de début de l'épidémie ; le widget crée `EPI W1`, `EPI W2`, etc.

Cette option est particulièrement utile pour comparer plusieurs flambées, même si elles ont commencé à des dates différentes.

### Mois, trimestre et année

Utiliser le mois pour la situation report, le trimestre pour les revues programmatiques et l'année pour les tendances historiques. Le filtre utilise toujours une borne de fin exclusive afin d'éviter les doublons entre périodes.

## 5. Statistiques disponibles

Le widget peut agréger un champ numérique par période. Le choix se fait dans **Statistique** et le champ dans **Champ numérique / mesure**.

- **Compter les enregistrements** : nombre de lignes avec une date valide ; recommandé pour une courbe de cas.
- **Somme** : total d'un champ numérique, par exemple décès ou doses administrées.
- **Moyenne** : moyenne arithmétique des valeurs non vides.
- **Médiane** : valeur centrale, plus robuste que la moyenne face aux valeurs extrêmes.
- **Minimum / Maximum** : bornes observées dans la période.
- **Première valeur / Dernière valeur** : première ou dernière valeur dans l'ordre retourné par le service ; utiliser uniquement avec un ordre de requête documenté.
- **Valeurs distinctes** : nombre de valeurs numériques différentes du champ. Pour compter des individus distincts, utiliser un identifiant numérique ou préparer une agrégation dédiée.

Les statistiques autres que le comptage ignorent les valeurs non numériques ou vides. Le filtre temporel continue à utiliser le champ date et non le champ de mesure.

## 6. Lire les résultats

Le bandeau de synthèse affiche :

- le nombre d'enregistrements valides ;
- le pic d'enregistrements dans une période ;
- le nombre total de périodes trouvées.

Une période affiche son nombre de cas. En activant **Cumulé**, la valeur affichée devient la somme depuis la première période. Le cumul ne remplace pas le nombre de cas utilisé par la requête de filtrage.

Les enregistrements sans date reconnue sont affichés séparément. Ils ne sont pas supprimés de la source : ils sont seulement exclus de l'agrégation.

## 6. Filtrer une expérience

Cliquer sur une période applique un filtre temporel à la source utilisée par le widget. Les composants qui partagent cette source peuvent alors être actualisés :

- carte ;
- graphique ;
- tableau ;
- liste ;
- indicateur.

Utiliser **Réinitialiser** pour revenir à la requête complète (`1=1`). Tester cette action avant publication afin de confirmer le comportement de la version Experience Builder installée.

> Pour une couche avec un champ texte contenant des dates, l'agrégation locale peut fonctionner, mais le filtre serveur a besoin d'un vrai champ ArcGIS Date. En production, publier un champ date normalisé est fortement recommandé.

## 7. Timeline

- **Lire** avance automatiquement d'une période à l'autre.
- **Arrêter** suspend la lecture.
- Choisir une vitesse lente, normale ou rapide.
- La période active est filtrée à chaque étape.

Pour une présentation en salle de situation, désactiver les transitions inutiles et utiliser une vitesse lente. Pour une exploration rapide, utiliser la vitesse rapide.

## 8. Bonnes pratiques de surveillance

- Fixer une date d'extraction et afficher cette date dans le dashboard.
- Ne pas interpréter une baisse récente avant de tenir compte du délai de notification.
- Distinguer date d'apparition, date de prélèvement et date de notification.
- Utiliser le nombre de cas par période pour la courbe épidémique ; utiliser le cumul pour communiquer une charge totale.
- Pour comparer des zones de tailles différentes, ajouter un dénominateur de population et calculer le taux dans un graphique ou une vue dédiée. Le widget ne fabrique pas de taux sans population de référence.
- Traiter les cas suspects, probables et confirmés séparément quand la définition de cas l'exige.
- Ne pas publier d'agrégations sur de très petits effectifs si cela présente un risque de ré-identification.

## 9. Dépannage

### Aucune période

Vérifier le nom du champ, les permissions du service et le format des dates. Consulter le compteur de dates invalides affiché par le widget.

### Périodes décalées d'un jour

Vérifier le fuseau horaire de publication et utiliser un vrai champ Date. Éviter de convertir plusieurs fois une date UTC en heure locale.

### `01/02/2023` mal interprété

Sélectionner explicitement **Jour / mois / année** ou **Mois / jour / année**. Pour supprimer l'ambiguïté, convertir les dates en ISO (`2023-02-01`).

### La carte ne se filtre pas

Confirmer que la carte utilise la même source que le widget, que le champ est de type Date et que la couche autorise les requêtes. Selon la version d'Experience Builder, il peut être nécessaire de configurer une action de données ou une vue de données partagée.

### Le widget n'apparaît pas

Vérifier le dossier `client/your-extensions/widgets/epi-aggregator`, redémarrer Experience Builder Developer Edition et consulter la console du navigateur.

## 10. Limites connues

- Le widget agrège et filtre ; il ne remplace pas un pipeline ETL de qualité de données.
- La pagination du service doit être configurée correctement pour les line-lists volumineuses. Pour plusieurs centaines de milliers d'enregistrements, préparer une table agrégée côté serveur.
- Le filtre temporel final dépend de la capacité du service ArcGIS à interroger le champ date.
- Les taux d'incidence, moyennes mobiles, seuils d'alerte et intervalles de confiance doivent être calculés dans une couche analytique ou un service dédié avec leurs dénominateurs et hypothèses documentés.
