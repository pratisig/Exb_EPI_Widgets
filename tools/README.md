# Lanceur Windows Experience Builder

Le dossier contient un lanceur qui active Node 20 via NVM, installe les dépendances si nécessaire, copie éventuellement le widget et ouvre automatiquement les fenêtres serveur et client.

## Utilisation simple

1. Télécharger/cloner le dépôt sur le PC Windows.
2. Double-cliquer sur `Start-ExperienceBuilder.bat`.
3. Saisir le chemin du dossier Experience Builder, par exemple :

```text
C:\Users\ymbodji\Downloads\arcgis-experience-builder-1.15\ArcGISExperienceBuilder
```

4. Ouvrir : `https://localhost:3001/`.

Les deux fenêtres PowerShell ouvertes automatiquement doivent rester ouvertes pendant toute la session.

## Premier lancement ou installation du widget

Depuis PowerShell, le lancement peut recevoir des options :

```powershell
.\Start-ExperienceBuilder.ps1 -ExperienceBuilderPath "C:\Users\ymbodji\Downloads\arcgis-experience-builder-1.15\ArcGISExperienceBuilder" -InstallDependencies -CopyWidget
```

- `-InstallDependencies` exécute `npm ci` dans `server` et `client`.
- `-CopyWidget` copie le widget dans `client\your-extensions\widgets\epi-aggregator`.

Pour les lancements suivants, le double-clic sur le fichier `.bat` suffit. Le script ne réinstalle pas les dépendances si `node_modules` existe déjà.

## Prérequis

- NVM for Windows installé et accessible dans le PATH ;
- Node.js 20 activable par `nvm use 20` ;
- Experience Builder Developer Edition 1.15 décompressé ;
- droits suffisants pour le lien NVM `C:\nvm4w\nodejs`.

Si Windows bloque `nvm use 20`, lancer le `.bat` avec **Exécuter en tant qu'administrateur**.
