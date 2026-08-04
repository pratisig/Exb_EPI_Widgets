[CmdletBinding()]
param(
  [string]$ExperienceBuilderPath = "",
  [switch]$InstallDependencies,
  [switch]$CopyWidget
)

$ErrorActionPreference = 'Stop'
$widgetSource = Join-Path $PSScriptRoot '..\widgets\epi-aggregator'

Write-Host "Epi Aggregator - Experience Builder launcher" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($ExperienceBuilderPath)) {
  $ExperienceBuilderPath = Read-Host "Chemin du dossier ArcGISExperienceBuilder (ex. C:\ArcGISExperienceBuilder)"
}
$ExperienceBuilderPath = [System.IO.Path]::GetFullPath($ExperienceBuilderPath)
$server = Join-Path $ExperienceBuilderPath 'server'
$client = Join-Path $ExperienceBuilderPath 'client'

if (!(Test-Path (Join-Path $server 'package.json'))) { throw "Dossier server introuvable ou Experience Builder incorrect : $server" }
if (!(Test-Path (Join-Path $client 'package.json'))) { throw "Dossier client introuvable ou Experience Builder incorrect : $client" }

# NVM for Windows must be activated before child PowerShell windows are created.
try { nvm use 20 | Out-Host } catch { throw "NVM/Node.js 20 n'est pas disponible. Executez nvm install 20 puis nvm use 20." }
if (!(Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm est introuvable. Verifiez NVM_HOME/NVM_SYMLINK et relancez PowerShell." }
Write-Host "Node: $(node --version) - npm: $(npm --version)" -ForegroundColor Green

if ($InstallDependencies -or !(Test-Path (Join-Path $server 'node_modules'))) {
  Write-Host 'Installation des dependances serveur...' -ForegroundColor Yellow
  Start-Process npm -ArgumentList 'ci' -WorkingDirectory $server -Wait -NoNewWindow
}
if ($InstallDependencies -or !(Test-Path (Join-Path $client 'node_modules'))) {
  Write-Host 'Installation des dependances client...' -ForegroundColor Yellow
  Start-Process npm -ArgumentList 'ci' -WorkingDirectory $client -Wait -NoNewWindow
}

if ($CopyWidget) {
  $destination = Join-Path $client 'your-extensions\widgets\epi-aggregator'
  New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
  Copy-Item (Join-Path $widgetSource '*') $destination -Recurse -Force
  Write-Host "Widget copie dans $destination" -ForegroundColor Green
}

# Use separate titled windows so the server and webpack watcher remain visible.
$serverCommand = "Set-Location -LiteralPath '$server'; nvm use 20; npm run start"
$clientCommand = "Set-Location -LiteralPath '$client'; nvm use 20; npm run start"
Start-Process powershell.exe -ArgumentList @('-NoExit','-ExecutionPolicy','Bypass','-Command',$serverCommand) -WorkingDirectory $server
Start-Sleep -Seconds 2
Start-Process powershell.exe -ArgumentList @('-NoExit','-ExecutionPolicy','Bypass','-Command',$clientCommand) -WorkingDirectory $client

Write-Host ''
Write-Host 'Experience Builder est en cours de demarrage.' -ForegroundColor Green
Write-Host 'Ouvrez https://localhost:3001/ dans votre navigateur.' -ForegroundColor Cyan
Write-Host 'Ne fermez pas les deux fenetres Experience Builder ouvertes automatiquement.' -ForegroundColor Yellow
