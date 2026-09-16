# Export-Document.ps1
#
# Convertit un document Markdown du dépôt (par défaut DOSSIER_PROPOSITION_GIS_CENTRE.md)
# en HTML, PDF et DOCX imprimables, dans le dossier `deliverables`.
#
# Prérequis : Python 3.9+ et les paquets `markdown`, `xhtml2pdf`, `python-docx`.
#   python -m pip install markdown xhtml2pdf python-docx
#
# Usage :
#   .\tools\Export-Document.ps1
#   .\tools\Export-Document.ps1 -Source MANUEL_UTILISATION.md
#   .\tools\Export-Document.ps1 -Source README.md -OutName DESCRIPTION_OUTIL_EPI_AGGREGATOR
#   .\tools\Export-Document.ps1 -Python "C:\Python311\python.exe"

[CmdletBinding()]
param(
  [string]$Source = "DOSSIER_PROPOSITION_GIS_CENTRE.md",
  [string]$OutName = "",
  [string]$Python = "python"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $root $Source
if (!(Test-Path $sourcePath)) { throw "Document introuvable : $sourcePath" }

$script = Join-Path $PSScriptRoot 'md-to-deliverables.py'
if (!(Test-Path $script)) { throw "Script de conversion introuvable : $script" }

$arguments = @($script, $sourcePath, (Join-Path $root 'deliverables'))
if (![string]::IsNullOrWhiteSpace($OutName)) { $arguments += $OutName }
& $Python @arguments
if ($LASTEXITCODE -ne 0) { throw "La conversion a échoué (code $LASTEXITCODE)." }
Write-Host "Livrables générés dans $(Join-Path $root 'deliverables')" -ForegroundColor Green
