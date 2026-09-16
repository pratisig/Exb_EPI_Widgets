# Livrables imprimables

Versions imprimables et diffusables des documents Markdown du dépôt.

| Fichier | Source | Contenu |
|---|---|---|
| `DOSSIER_PROPOSITION_GIS_CENTRE.{html,pdf,docx}` | `../DOSSIER_PROPOSITION_GIS_CENTRE.md` | Dossier de décision pour le GIS Centre : version, fonctionnalités, écarts, tests, critères, formulaire |
| `DESCRIPTION_OUTIL_EPI_AGGREGATOR.{html,pdf,docx}` | `../README.md` | Description technique de l'outil : version, fonctions, installation, notes GIS, structure |
| `MANUEL_UTILISATION.{html,pdf,docx}` | `../MANUEL_UTILISATION.md` | Manuel utilisateur GIS et surveillance |
| `GUIDE_TRANSFERT_TEST_GIS_CENTRE.{html,pdf,docx}` | `../GUIDE_TRANSFERT_TEST_GIS_CENTRE.md` | Protocole de test détaillé (scénarios A à L) |

## Artefacts de test et de partage

| Fichier | Contenu | Usage |
|---|---|---|
| `epi-aggregator-2.0.0.zip` | Le widget seul, dossier `epi-aggregator` à la racine | À décompresser dans `client\your-extensions\widgets` d'Experience Builder |
| `epi-aggregator-2.0.0.zip.sha256` | Empreinte SHA-256 de l'archive | Vérification d'intégrité après transfert |
| `donnees_test/epi_line_list_test.csv` | 226 lignes anonymisées, 2023-2025, 3 zones, avec semaine manquante, date impossible, date ambiguë et libellés de semaine texte | Publication comme table hébergée ArcGIS pour les tests T6, T14, T15b |

Le mode opératoire complet (tester sans Experience Builder, tester dans Experience Builder, partager, transmettre au GIS Centre) est décrit dans `../PARTAGER_ET_TESTER.md`.

## Régénération

Après toute modification d'un document Markdown, régénérer les fichiers :

```powershell
.\tools\Export-Document.ps1
.\tools\Export-Document.ps1 -Source MANUEL_UTILISATION.md
.\tools\Export-Document.ps1 -Source README.md -OutName DESCRIPTION_OUTIL_EPI_AGGREGATOR
```

Le troisième argument (`-OutName`, ou troisième paramètre du script Python) renomme les fichiers produits : le fichier `README.md` est ainsi publié sous le nom `DESCRIPTION_OUTIL_EPI_AGGREGATOR`.

Prérequis : Python 3.9+ et les paquets `markdown`, `xhtml2pdf`, `python-docx`.

```bash
python -m pip install markdown xhtml2pdf python-docx
python tools/md-to-deliverables.py DOSSIER_PROPOSITION_GIS_CENTRE.md deliverables
python tools/md-to-deliverables.py README.md deliverables DESCRIPTION_OUTIL_EPI_AGGREGATOR
```

> Les versions PDF et DOCX de ce dossier sont générées : en cas de divergence, le fichier Markdown source fait foi.
