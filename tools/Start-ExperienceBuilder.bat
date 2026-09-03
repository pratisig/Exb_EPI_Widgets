@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-ExperienceBuilder.ps1" %*
if errorlevel 1 (
  echo.
  echo Le lancement a echoue. Consultez le message ci-dessus.
  pause
)
