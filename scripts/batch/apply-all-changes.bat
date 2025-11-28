@echo off
chcp 65001 >nul
echo ============================================
echo   APPLICATION DES CHANGEMENTS
echo ============================================
echo.

echo [1/5] Arrêt du serveur Node.js...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 3 /nobreak >nul
echo ✓ Serveur arrêté

echo.
echo [2/5] Modification du fichier JSON...
python -c "import json; data = json.load(open(r'E:\TEST 3\server\data\application-data.json', 'r', encoding='utf-8')); [t.update({'titre': 'FAIRE LES COMMANDE A LONG DELAIS', 'page': 'detail-suivi-pieces-delai'}) for p in data['arretData']['phases'] for t in p.get('taches', []) if t.get('id') == 't30']; json.dump(data, open(r'E:\TEST 3\server\data\application-data.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)"
echo ✓ JSON modifié

echo.
echo [3/5] Vérification des changements...
python -c "import json, sys; sys.stdout.reconfigure(encoding='utf-8'); data = json.load(open(r'E:\TEST 3\server\data\application-data.json', 'r', encoding='utf-8')); t30 = [t for p in data['arretData']['phases'] for t in p.get('taches', []) if t.get('id') == 't30'][0]; print(f'  Titre: {t30[\"titre\"]}'); print(f'  Page: {t30[\"page\"]}')"

echo.
echo [4/5] Redémarrage du serveur...
start /B node server/server.js
timeout /t 5 /nobreak >nul
echo ✓ Serveur redémarré

echo.
echo [5/5] Vérification du serveur...
netstat -ano | findstr :3000 | findstr LISTENING >nul
if errorlevel 1 (
    echo ✗ ERREUR: Le serveur ne répond pas sur le port 3000
) else (
    echo ✓ Serveur opérationnel sur le port 3000
)

echo.
echo ============================================
echo   CHANGEMENTS APPLIQUÉS AVEC SUCCÈS !
echo ============================================
echo.
echo Rafraîchissez votre navigateur avec Ctrl+Shift+R
echo.
pause
