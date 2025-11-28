@echo off
REM Fichier de lancement de l'application Gestionnaire d'Arrêt d'Aciérie

title Serveur - Gestionnaire d'Arrêt d'Aciérie

echo ╔════════════════════════════════════════════════╗
echo ║   Gestionnaire d'Arrêt d'Aciérie               ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo [INFO] Installation des dépendances...
    call npm install
    echo.
)

REM Vérifier si le port 3000 est déjà utilisé
echo [INFO] Verification du port 3000...
netstat -ano | findstr ":3000.*LISTENING" > nul 2>&1
if not errorlevel 1 (
    echo.
    echo ╔════════════════════════════════════════════════╗
    echo ║   ATTENTION: Le port 3000 est deja utilise    ║
    echo ╚════════════════════════════════════════════════╝
    echo.
    echo Un serveur est deja en cours d'execution sur le port 3000.
    echo.
    echo Voulez-vous arreter le serveur existant et en demarrer un nouveau?
    echo   [O] Oui - Arreter et redemarrer
    echo   [N] Non - Annuler
    echo.
    choice /C ON /N /M "Votre choix: "
    if errorlevel 2 (
        echo.
        echo [INFO] Demarrage annule. Appuyez sur une touche pour fermer...
        pause > nul
        exit /b 0
    )
    echo.
    echo [INFO] Arret du serveur existant...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
        taskkill /PID %%a /F > nul 2>&1
    )
    timeout /t 2 /nobreak > nul
    echo [INFO] Serveur existant arrete.
    echo.
)

echo [INFO] Démarrage du serveur...
echo [INFO] Cette fenetre doit rester ouverte pour que le serveur fonctionne
echo [INFO] Fermez cette fenetre pour arreter le serveur
echo.

REM Attendre 3 secondes puis ouvrir le navigateur
start /B cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

REM Démarrer le serveur (si erreur, afficher le message et attendre)
node server/server.js
if errorlevel 1 (
    echo.
    echo ╔════════════════════════════════════════════════╗
    echo ║   ERREUR: Le serveur n'a pas pu demarrer      ║
    echo ╚════════════════════════════════════════════════╝
    echo.
    echo Verifiez les erreurs ci-dessus.
    echo.
    echo Appuyez sur une touche pour fermer...
    pause > nul
) else (
    echo.
    echo [INFO] Le serveur s'est arrete normalement.
    echo.
    pause
)
