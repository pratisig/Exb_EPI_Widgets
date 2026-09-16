# Livrables imprimables

Versions imprimables et diffusables des documents Markdown du dépôt.

| Fichier | Source |
|---|---|
| `DOSSIER_PROPOSITION_GIS_CENTRE.{html,pdf,docx}` | `../DOSSIER_PROPOSITION_GIS_CENTRE.md` |
| `MANUEL_UTILISATION.{html,pdf,docx}` | `../MANUEL_UTILISATION.md` |
| `GUIDE_TRANSFERT_TEST_GIS_CENTRE.{html,pdf,docx}` | `../GUIDE_TRANSFERT_TEST_GIS_CENTRE.md` |

## Régénération

Après toute modification d'un document Markdown, régénérer les fichiers :

```powershell
.\tools\Export-Document.ps1
.\tools\Export-Document.ps1 -Source MANUEL_UTILISATION.md
```

Prérequis : Python 3.9+ et les paquets `markdown`, `xhtml2pdf`, `python-docx`.

```bash
python -m pip install markdown xhtml2pdf python-docx
python tools/md-to-deliverables.py DOSSIER_PROPOSITION_GIS_CENTRE.md deliverables
```

> Les versions PDF et DOCX de ce dossier sont générées : en cas de divergence, le fichier Markdown source fait foi.
