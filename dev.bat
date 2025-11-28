@echo off
REM Mode développement avec auto-reload

echo ╔════════════════════════════════════════════════╗
echo ║   Mode Développement (Auto-reload activé)      ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo [INFO] Installation des dépendances...
    call npm install
    echo.
)

echo [INFO] Démarrage du serveur en mode développement...
echo [INFO] Le serveur redémarrera automatiquement à chaque modification
echo.

REM Attendre 2 secondes puis ouvrir le navigateur
start /B cmd /c "timeout /t 2 /nobreak > nul && start http://localhost:3000"

REM Démarrer en mode dev
npm run dev

pause
