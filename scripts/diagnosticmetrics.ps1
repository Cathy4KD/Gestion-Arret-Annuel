# Script de diagnostic des métriques du projet

Write-Host "=== DIAGNOSTIC PROJET - METRIQUES ==="
Write-Host ""

# 1. Analyse index.html
$indexActuel = "E:\TEST 3\client\index.html"
$indexOriginal = "E:\TEST 3\client\index.html.backup-20251115"

$lignesActuel = (Get-Content $indexActuel | Measure-Object -Line).Lines
$lignesOriginal = (Get-Content $indexOriginal | Measure-Object -Line).Lines
$reduction = [math]::Round((($lignesOriginal - $lignesActuel) / $lignesOriginal) * 100, 2)

Write-Host "INDEX.HTML:"
Write-Host "  Original: $lignesOriginal lignes"
Write-Host "  Actuel: $lignesActuel lignes"
Write-Host "  Reduction: $reduction%"
Write-Host "  Lignes supprimees: $($lignesOriginal - $lignesActuel)"
Write-Host ""

# 2. Pages extraites
$pages = Get-ChildItem "E:\TEST 3\client\components\pages" -Filter "*.html"
$totalLignesPages = 0
$pages | ForEach-Object {
    $totalLignesPages += (Get-Content $_.FullName | Measure-Object -Line).Lines
}

Write-Host "PAGES EXTRAITES:"
Write-Host "  Nombre de fichiers: $($pages.Count)"
Write-Host "  Total lignes: $totalLignesPages"
Write-Host ""

# 3. Contrôleurs JS
$controleurs = Get-ChildItem "E:\TEST 3\client\js\modules\pages" -Filter "*.js"
$totalLignesControleurs = 0
$controleurs | ForEach-Object {
    $totalLignesControleurs += (Get-Content $_.FullName | Measure-Object -Line).Lines
}

Write-Host "CONTROLEURS JS:"
Write-Host "  Nombre de fichiers: $($controleurs.Count)"
Write-Host "  Total lignes: $totalLignesControleurs"
Write-Host ""

# 4. CSS Components
$cssFiles = Get-ChildItem "E:\TEST 3\client\css\components" -Filter "*.css"
$totalLignesCSS = 0
$cssFiles | ForEach-Object {
    $totalLignesCSS += (Get-Content $_.FullName | Measure-Object -Line).Lines
}

Write-Host "CSS COMPONENTS:"
Write-Host "  Nombre de fichiers: $($cssFiles.Count)"
Write-Host "  Total lignes: $totalLignesCSS"
Write-Host ""

# 5. Layout components
$layoutFiles = Get-ChildItem "E:\TEST 3\client\components\layout" -Filter "*.html"
Write-Host "LAYOUT COMPONENTS:"
Write-Host "  Nombre de fichiers: $($layoutFiles.Count)"
Write-Host ""

# 6. Total des fichiers créés
$totalFichiers = $pages.Count + $controleurs.Count + $cssFiles.Count + $layoutFiles.Count
Write-Host "TOTAL FICHIERS CREES: $totalFichiers"
Write-Host ""

# 7. Analyse qualité du code
Write-Host "=== ANALYSE QUALITE ==="
Write-Host ""

# Vérifier les inline styles dans index.html actuel
$inlineStyles = (Select-String -Path $indexActuel -Pattern 'style="' -AllMatches).Matches.Count
Write-Host "Inline styles dans index.html: $inlineStyles"

# Vérifier les inline styles dans l'original
$inlineStylesOriginal = (Select-String -Path $indexOriginal -Pattern 'style="' -AllMatches).Matches.Count
Write-Host "Inline styles dans original: $inlineStylesOriginal"
Write-Host "Reduction inline styles: $(100 - [math]::Round(($inlineStyles / $inlineStylesOriginal) * 100, 2))%"
Write-Host ""

Write-Host "=== RESUME ==="
Write-Host "Total lignes avant: $lignesOriginal"
Write-Host "Total lignes maintenant (index + pages + JS + CSS): $($lignesActuel + $totalLignesPages + $totalLignesControleurs + $totalLignesCSS)"
Write-Host "Modularisation: Monolithique -> $totalFichiers fichiers modulaires"
