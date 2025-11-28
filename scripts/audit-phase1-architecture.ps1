# AUDIT PHASE 1 - ARCHITECTURE & STRUCTURE
# Date: 2025-11-15

$rootPath = "E:\TEST 3"
$reportPath = "$rootPath\docs\rapports\AUDIT-PHASE1-ARCHITECTURE.md"

# Ensure rapport directory exists
$reportDir = Split-Path $reportPath -Parent
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$report = @"
# AUDIT PHASE 1 - ARCHITECTURE & STRUCTURE

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Auditeur:** Automatise
**Projet:** Gestion Arret Annuel 2026

---

## 1. STRUCTURE DES REPERTOIRES

### 1.1 Arborescence Racine

``````
"@

# Analyze root structure
$rootDirs = Get-ChildItem $rootPath -Directory -Depth 0 | Where-Object { $_.Name -ne "node_modules" }
$report += "`n### Dossiers principaux:`n`n"
foreach ($dir in $rootDirs) {
    $fileCount = (Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
    $subDirCount = (Get-ChildItem $dir.FullName -Directory -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
    $report += "- **$($dir.Name)/** - $fileCount fichiers, $subDirCount sous-dossiers`n"
}

# Analyze client structure
$report += "`n### 1.2 Structure CLIENT`n`n"
$clientDirs = Get-ChildItem "$rootPath\client" -Directory
foreach ($dir in $clientDirs) {
    $fileCount = (Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
    $report += "- **client/$($dir.Name)/** - $fileCount fichiers`n"
}

# Analyze server structure
$report += "`n### 1.3 Structure SERVER`n`n"
$serverDirs = Get-ChildItem "$rootPath\server" -Directory
foreach ($dir in $serverDirs) {
    $fileCount = (Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
    $report += "- **server/$($dir.Name)/** - $fileCount fichiers`n"
}

# File counts by type
$report += "`n---`n`n## 2. ANALYSE PAR TYPE DE FICHIER`n`n"

$jsFiles = Get-ChildItem $rootPath -Filter "*.js" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }
$htmlFiles = Get-ChildItem $rootPath -Filter "*.html" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }
$cssFiles = Get-ChildItem $rootPath -Filter "*.css" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }
$jsonFiles = Get-ChildItem $rootPath -Filter "*.json" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }
$mdFiles = Get-ChildItem $rootPath -Filter "*.md" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }

$report += "| Type | Nombre | Taille Totale |`n"
$report += "|------|--------|---------------|`n"
$report += "| JavaScript (.js) | $($jsFiles.Count) | $([math]::Round(($jsFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB |`n"
$report += "| HTML (.html) | $($htmlFiles.Count) | $([math]::Round(($htmlFiles | Measure-Object -Property Length -Sum).Sum / 1KB, 2)) KB |`n"
$report += "| CSS (.css) | $($cssFiles.Count) | $([math]::Round(($cssFiles | Measure-Object -Property Length -Sum).Sum / 1KB, 2)) KB |`n"
$report += "| JSON (.json) | $($jsonFiles.Count) | $([math]::Round(($jsonFiles | Measure-Object -Property Length -Sum).Sum / 1KB, 2)) KB |`n"
$report += "| Markdown (.md) | $($mdFiles.Count) | $([math]::Round(($mdFiles | Measure-Object -Property Length -Sum).Sum / 1KB, 2)) KB |`n"

# Top 10 largest files
$report += "`n---`n`n## 3. TOP 10 FICHIERS LES PLUS VOLUMINEUX`n`n"
$largestFiles = Get-ChildItem $rootPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.git" } |
    Sort-Object Length -Descending |
    Select-Object -First 10

$report += "| Fichier | Taille | Lignes |`n"
$report += "|---------|--------|--------|`n"
foreach ($file in $largestFiles) {
    $relativePath = $file.FullName.Replace("$rootPath\", "")
    $size = if ($file.Length -gt 1MB) { "$([math]::Round($file.Length / 1MB, 2)) MB" }
            elseif ($file.Length -gt 1KB) { "$([math]::Round($file.Length / 1KB, 2)) KB" }
            else { "$($file.Length) B" }

    try {
        $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
    } catch {
        $lines = "N/A"
    }

    $report += "| $relativePath | $size | $lines |`n"
}

# JavaScript modules analysis
$report += "`n---`n`n## 4. ANALYSE DES MODULES JAVASCRIPT`n`n"
$report += "### 4.1 Modules Client (client/js/modules/)`n`n"

$clientModulesPath = "$rootPath\client\js\modules"
if (Test-Path $clientModulesPath) {
    $clientModules = Get-ChildItem $clientModulesPath -Directory
    foreach ($module in $clientModules) {
        $jsCount = (Get-ChildItem $module.FullName -Filter "*.js" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        $report += "- **$($module.Name)/** - $jsCount fichiers JS`n"
    }
}

# Configuration files
$report += "`n---`n`n## 5. FICHIERS DE CONFIGURATION`n`n"

$configFiles = @(
    "package.json",
    ".env.example",
    ".gitignore",
    "README.md"
)

$report += "| Fichier | Existe | Taille |`n"
$report += "|---------|--------|--------|`n"
foreach ($configFile in $configFiles) {
    $path = Join-Path $rootPath $configFile
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        $sizeStr = if ($size -gt 1KB) { "$([math]::Round($size / 1KB, 2)) KB" } else { "$size B" }
        $report += "| $configFile | OUI | $sizeStr |`n"
    } else {
        $report += "| $configFile | NON | - |`n"
    }
}

# Dependencies analysis
$report += "`n---`n`n## 6. ANALYSE PACKAGE.JSON`n`n"

$packageJsonPath = "$rootPath\package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json

    $report += "**Nom:** $($packageJson.name)`n"
    $report += "**Version:** $($packageJson.version)`n`n"

    if ($packageJson.dependencies) {
        $depCount = ($packageJson.dependencies | Get-Member -MemberType NoteProperty).Count
        $report += "**Dependencies:** $depCount`n`n"

        $report += "``````json`n"
        $report += ($packageJson.dependencies | ConvertTo-Json -Depth 3)
        $report += "`n```````n`n"
    }

    if ($packageJson.devDependencies) {
        $devDepCount = ($packageJson.devDependencies | Get-Member -MemberType NoteProperty).Count
        $report += "**DevDependencies:** $devDepCount`n`n"
    }

    if ($packageJson.scripts) {
        $report += "### Scripts disponibles:`n`n"
        $packageJson.scripts.PSObject.Properties | ForEach-Object {
            $report += "- **$($_.Name):** ``$($_.Value)```n"
        }
    }
}

# Data sources analysis
$report += "`n---`n`n## 7. SOURCES DE DONNÉES`n`n"

$dataSourcesPath = "$rootPath\data-sources"
if (Test-Path $dataSourcesPath) {
    $dataFiles = Get-ChildItem $dataSourcesPath -File -Recurse
    $report += "**Nombre de fichiers de données:** $($dataFiles.Count)`n`n"

    $report += "| Fichier | Type | Taille |`n"
    $report += "|---------|------|--------|`n"
    foreach ($file in $dataFiles) {
        $relativePath = $file.FullName.Replace("$dataSourcesPath\", "")
        $size = if ($file.Length -gt 1MB) { "$([math]::Round($file.Length / 1MB, 2)) MB" }
                else { "$([math]::Round($file.Length / 1KB, 2)) KB" }
        $report += "| $relativePath | $($file.Extension) | $size |`n"
    }
}

# Server routes analysis
$report += "`n---`n`n## 8. ANALYSE DES ROUTES SERVEUR`n`n"

$routesPath = "$rootPath\server\routes"
if (Test-Path $routesPath) {
    $routeFiles = Get-ChildItem $routesPath -Filter "*.js" -File
    $report += "**Nombre de fichiers de routes:** $($routeFiles.Count)`n`n"

    foreach ($file in $routeFiles) {
        $report += "- **$($file.Name)**`n"
    }
}

# Archives analysis
$report += "`n---`n`n## 9. ARCHIVES & BACKUPS`n`n"

$archivesPath = "$rootPath\archives"
if (Test-Path $archivesPath) {
    $archiveDirs = Get-ChildItem $archivesPath -Directory
    $report += "**Nombre de dossiers d'archives:** $($archiveDirs.Count)`n`n"

    foreach ($dir in $archiveDirs) {
        $fileCount = (Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
        $totalSize = [math]::Round(((Get-ChildItem $dir.FullName -File -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB), 2)
        $report += "- **$($dir.Name)** - $fileCount fichiers ($totalSize MB)`n"
    }
}

# Logs analysis
$report += "`n---`n`n## 10. LOGS`n`n"

$logsPath = "$rootPath\logs"
if (Test-Path $logsPath) {
    $logFiles = Get-ChildItem $logsPath -Filter "*.log" -File
    $totalLogSize = [math]::Round(((Get-ChildItem $logsPath -Filter "*.log" -File | Measure-Object -Property Length -Sum).Sum / 1MB), 2)

    $report += "**Nombre de fichiers de logs:** $($logFiles.Count)`n"
    $report += "**Taille totale des logs:** $totalLogSize MB`n`n"

    # Most recent log
    $recentLog = $logFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($recentLog) {
        $report += "**Log le plus récent:** $($recentLog.Name) ($(Get-Date $recentLog.LastWriteTime -Format 'yyyy-MM-dd HH:mm:ss'))`n"
    }
}

# Summary
$report += "`n---`n`n## RESUME PHASE 1`n`n"

$totalFiles = (Get-ChildItem $rootPath -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }).Count
$totalDirs = (Get-ChildItem $rootPath -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }).Count
$totalSize = [math]::Round(((Get-ChildItem $rootPath -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" } | Measure-Object -Property Length -Sum).Sum / 1MB), 2)

$report += "- **Fichiers totaux:** $totalFiles`n"
$report += "- **Dossiers totaux:** $totalDirs`n"
$report += "- **Taille totale:** $totalSize MB (hors node_modules)`n"
$report += "- **Fichiers JavaScript:** $($jsFiles.Count)`n"
$report += "- **Fichiers HTML:** $($htmlFiles.Count)`n"
$report += "- **Fichiers CSS:** $($cssFiles.Count)`n"

$report += "`n---`n`n**Audit Phase 1 terminé**`n"

# Save report
$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "[OK] Rapport Phase 1 genere: $reportPath"
Write-Host ""
Write-Host "STATISTIQUES:"
Write-Host "   - Fichiers totaux: $totalFiles"
Write-Host "   - Dossiers totaux: $totalDirs"
Write-Host "   - Taille totale: $totalSize MB"
