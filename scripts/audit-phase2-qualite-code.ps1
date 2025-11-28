# AUDIT PHASE 2 - QUALITE DU CODE
# Date: 2025-11-15

$rootPath = "E:\TEST 3"
$reportPath = "$rootPath\docs\rapports\AUDIT-PHASE2-QUALITE-CODE.md"

# Ensure rapport directory exists
$reportDir = Split-Path $reportPath -Parent
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$report = @"
# AUDIT PHASE 2 - QUALITE DU CODE

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Auditeur:** Automatise
**Projet:** Gestion Arret Annuel 2026

---

## 1. ANALYSE JAVASCRIPT

"@

# Get all JS files (exclude node_modules)
$jsFiles = Get-ChildItem $rootPath -Filter "*.js" -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" }

$report += "**Nombre total de fichiers JS:** $($jsFiles.Count)`n`n"

# Analyze JS files
$totalLines = 0
$totalFunctions = 0
$varCount = 0
$letCount = 0
$constCount = 0
$todoCount = 0
$fixmeCount = 0
$evalCount = 0
$consoleLogCount = 0
$inlineHTMLCount = 0
$filesWithVar = @()
$filesWithEval = @()
$filesWithTodo = @()
$longFiles = @()
$longFunctions = @()

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $lineCount = $content.Count
    $totalLines += $lineCount

    # Check for long files (> 500 lines)
    if ($lineCount -gt 500) {
        $longFiles += [PSCustomObject]@{
            File = $file.FullName.Replace("$rootPath\", "")
            Lines = $lineCount
        }
    }

    # Count variables declarations
    $varInFile = ($content | Select-String -Pattern '\bvar\s+' -AllMatches).Matches.Count
    $letInFile = ($content | Select-String -Pattern '\blet\s+' -AllMatches).Matches.Count
    $constInFile = ($content | Select-String -Pattern '\bconst\s+' -AllMatches).Matches.Count

    $varCount += $varInFile
    $letCount += $letInFile
    $constCount += $constInFile

    if ($varInFile -gt 0) {
        $filesWithVar += $file.FullName.Replace("$rootPath\", "")
    }

    # Count TODOs and FIXMEs
    $todosInFile = ($content | Select-String -Pattern '\bTODO\b' -AllMatches).Matches.Count
    $fixmesInFile = ($content | Select-String -Pattern '\bFIXME\b' -AllMatches).Matches.Count

    $todoCount += $todosInFile
    $fixmeCount += $fixmesInFile

    if ($todosInFile -gt 0 -or $fixmesInFile -gt 0) {
        $filesWithTodo += [PSCustomObject]@{
            File = $file.FullName.Replace("$rootPath\", "")
            TODO = $todosInFile
            FIXME = $fixmesInFile
        }
    }

    # Count eval()
    $evalInFile = ($content | Select-String -Pattern '\beval\s*\(' -AllMatches).Matches.Count
    $evalCount += $evalInFile
    if ($evalInFile -gt 0) {
        $filesWithEval += $file.FullName.Replace("$rootPath\", "")
    }

    # Count console.log
    $consoleLogCount += ($content | Select-String -Pattern '\bconsole\.log\s*\(' -AllMatches).Matches.Count

    # Count innerHTML usage
    $inlineHTMLCount += ($content | Select-String -Pattern '\.innerHTML\s*=' -AllMatches).Matches.Count

    # Count functions
    $totalFunctions += ($content | Select-String -Pattern '\bfunction\s+\w+' -AllMatches).Matches.Count
    $totalFunctions += ($content | Select-String -Pattern '(\w+)\s*:\s*function' -AllMatches).Matches.Count
    $totalFunctions += ($content | Select-String -Pattern '(const|let|var)\s+\w+\s*=\s*\(' -AllMatches).Matches.Count
}

### 1.1 Statistiques generales
$report += "### 1.1 Statistiques generales`n`n"
$report += "| Metrique | Valeur |`n"
$report += "|----------|--------|`n"
$report += "| Fichiers JS totaux | $($jsFiles.Count) |`n"
$report += "| Lignes de code totales | $totalLines |`n"
$report += "| Fonctions estimees | $totalFunctions |`n"
$report += "| Moyenne lignes/fichier | $([math]::Round($totalLines / $jsFiles.Count, 2)) |`n"

### 1.2 Variables declarations
$report += "`n### 1.2 Declarations de variables`n`n"
$report += "| Type | Count | Pourcentage |`n"
$report += "|------|-------|-------------|`n"
$totalVarDecl = $varCount + $letCount + $constCount
if ($totalVarDecl -gt 0) {
    $report += "| ``var`` (deprecated) | $varCount | $([math]::Round($varCount / $totalVarDecl * 100, 2))% |`n"
    $report += "| ``let`` | $letCount | $([math]::Round($letCount / $totalVarDecl * 100, 2))% |`n"
    $report += "| ``const`` | $constCount | $([math]::Round($constCount / $totalVarDecl * 100, 2))% |`n"
} else {
    $report += "| AUCUNE DECLARATION TROUVEE | 0 | 0% |`n"
}

# Files with var
if ($filesWithVar.Count -gt 0) {
    $report += "`n**ATTENTION:** $($filesWithVar.Count) fichiers utilisent encore ``var`` (deprecated):`n`n"
    $filesWithVar | Select-Object -First 10 | ForEach-Object {
        $report += "- $_`n"
    }
    if ($filesWithVar.Count -gt 10) {
        $report += "`n... et $($filesWithVar.Count - 10) autres fichiers`n"
    }
}

### 1.3 Code quality issues
$report += "`n### 1.3 Problemes de qualite`n`n"
$report += "| Issue | Count | Severite |`n"
$report += "|-------|-------|----------|`n"
$report += "| eval() usage | $evalCount | CRITIQUE |`n"
$report += "| console.log() | $consoleLogCount | MOYEN |`n"
$report += "| innerHTML usage | $inlineHTMLCount | MOYEN |`n"
$report += "| TODO comments | $todoCount | INFO |`n"
$report += "| FIXME comments | $fixmeCount | ELEVE |`n"

# Files with eval()
if ($filesWithEval.Count -gt 0) {
    $report += "`n**CRITIQUE:** eval() detected in $($filesWithEval.Count) files:`n`n"
    $filesWithEval | ForEach-Object {
        $report += "- $_`n"
    }
}

### 1.4 Long files
if ($longFiles.Count -gt 0) {
    $report += "`n### 1.4 Fichiers trop longs (> 500 lignes)`n`n"
    $report += "| Fichier | Lignes |`n"
    $report += "|---------|--------|`n"
    $longFiles | Sort-Object Lines -Descending | Select-Object -First 20 | ForEach-Object {
        $report += "| $($_.File) | $($_.Lines) |`n"
    }
}

### 1.5 TODOs
if ($filesWithTodo.Count -gt 0) {
    $report += "`n### 1.5 Fichiers avec TODO/FIXME`n`n"
    $report += "| Fichier | TODO | FIXME |`n"
    $report += "|---------|------|-------|`n"
    $filesWithTodo | Sort-Object { $_.TODO + $_.FIXME } -Descending | Select-Object -First 20 | ForEach-Object {
        $report += "| $($_.File) | $($_.TODO) | $($_.FIXME) |`n"
    }
}

"@

$report += "`n---`n`n## 2. ANALYSE HTML`n`n"

# Get all HTML files (exclude node_modules)
$htmlFiles = Get-ChildItem $rootPath -Filter "*.html" -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" }

$report += "**Nombre total de fichiers HTML:** $($htmlFiles.Count)`n`n"

$totalHTMLLines = 0
$inlineStylesTotal = 0
$inlineEventsTotal = 0
$deprecatedTagsTotal = 0
$filesWithInlineStyles = @()
$filesWithInlineEvents = @()
$filesWithDeprecated = @()

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $lineCount = ($content -split "`n").Count
    $totalHTMLLines += $lineCount

    # Count inline styles
    $inlineStyles = ([regex]::Matches($content, 'style="[^"]*"')).Count
    $inlineStylesTotal += $inlineStyles
    if ($inlineStyles -gt 0) {
        $filesWithInlineStyles += [PSCustomObject]@{
            File = $file.FullName.Replace("$rootPath\", "")
            Count = $inlineStyles
        }
    }

    # Count inline events (onclick, onload, etc.)
    $inlineEvents = ([regex]::Matches($content, 'on\w+="[^"]*"')).Count
    $inlineEventsTotal += $inlineEvents
    if ($inlineEvents -gt 0) {
        $filesWithInlineEvents += [PSCustomObject]@{
            File = $file.FullName.Replace("$rootPath\", "")
            Count = $inlineEvents
        }
    }

    # Check for deprecated tags
    $deprecated = ([regex]::Matches($content, '<(font|center|marquee|blink|frame|frameset)')).Count
    $deprecatedTagsTotal += $deprecated
    if ($deprecated -gt 0) {
        $filesWithDeprecated += $file.FullName.Replace("$rootPath\", "")
    }
}

$report += "### 2.1 Statistiques HTML`n`n"
$report += "| Metrique | Valeur |`n"
$report += "|----------|--------|`n"
$report += "| Fichiers HTML | $($htmlFiles.Count) |`n"
$report += "| Lignes totales | $totalHTMLLines |`n"
$report += "| Inline styles | $inlineStylesTotal |`n"
$report += "| Inline events | $inlineEventsTotal |`n"
$report += "| Tags deprecies | $deprecatedTagsTotal |`n"

# Files with inline styles
if ($filesWithInlineStyles.Count -gt 0) {
    $report += "`n### 2.2 Fichiers avec inline styles`n`n"
    $report += "| Fichier | Count |`n"
    $report += "|---------|-------|`n"
    $filesWithInlineStyles | Sort-Object Count -Descending | Select-Object -First 20 | ForEach-Object {
        $report += "| $($_.File) | $($_.Count) |`n"
    }
}

# Files with inline events
if ($filesWithInlineEvents.Count -gt 0) {
    $report += "`n### 2.3 Fichiers avec inline events (onclick, etc.)`n`n"
    $report += "| Fichier | Count |`n"
    $report += "|---------|-------|`n"
    $filesWithInlineEvents | Sort-Object Count -Descending | Select-Object -First 20 | ForEach-Object {
        $report += "| $($_.File) | $($_.Count) |`n"
    }
}

"@

$report += "`n---`n`n## 3. ANALYSE CSS`n`n"

# Get all CSS files
$cssFiles = Get-ChildItem $rootPath -Filter "*.css" -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules" }

$report += "**Nombre total de fichiers CSS:** $($cssFiles.Count)`n`n"

$totalCSSLines = 0
$importantCount = 0
$filesWithImportant = @()
$cssLongFiles = @()

foreach ($file in $cssFiles) {
    $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $lineCount = $content.Count
    $totalCSSLines += $lineCount

    if ($lineCount -gt 1000) {
        $cssLongFiles += [PSCustomObject]@{
            File = $file.FullName.Replace("$rootPath\", "")
            Lines = $lineCount
        }
    }

    # Count !important
    $importantInFile = ($content | Select-String -Pattern '!important' -AllMatches).Matches.Count
    $importantCount += $importantInFile
    if ($importantInFile -gt 0) {
        $filesWithImportant += [PSCustomObject]@{
            File = $file.FullName.Replace("$rootPath\", "")
            Count = $importantInFile
        }
    }
}

$report += "### 3.1 Statistiques CSS`n`n"
$report += "| Metrique | Valeur |`n"
$report += "|----------|--------|`n"
$report += "| Fichiers CSS | $($cssFiles.Count) |`n"
$report += "| Lignes totales | $totalCSSLines |`n"
$report += "| !important usage | $importantCount |`n"

if ($filesWithImportant.Count -gt 0) {
    $report += "`n### 3.2 Fichiers avec !important`n`n"
    $report += "| Fichier | Count |`n"
    $report += "|---------|-------|`n"
    $filesWithImportant | Sort-Object Count -Descending | ForEach-Object {
        $report += "| $($_.File) | $($_.Count) |`n"
    }
}

if ($cssLongFiles.Count -gt 0) {
    $report += "`n### 3.3 Fichiers CSS trop longs (> 1000 lignes)`n`n"
    $filesWithImportant | Sort-Object Lines -Descending | ForEach-Object {
        $report += "- $($_.File) ($($_.Lines) lignes)`n"
    }
}

"@

$report += "`n---`n`n## 4. RESUME & RECOMMENDATIONS`n`n"

# Priority recommendations
$criticalIssues = @()
$highIssues = @()
$mediumIssues = @()

if ($evalCount -gt 0) {
    $criticalIssues += "eval() detecte dans $evalCount endroits - A ELIMINER IMMEDIATEMENT (injection de code)"
}

if ($varCount -gt 50) {
    $highIssues += "Usage excessif de 'var' ($varCount occurrences) - Migrer vers let/const"
}

if ($inlineStylesTotal -gt 100) {
    $highIssues += "Trop de inline styles ($inlineStylesTotal) - Extraire vers CSS"
}

if ($inlineEventsTotal -gt 50) {
    $highIssues += "Trop de inline events ($inlineEventsTotal) - Utiliser addEventListener"
}

if ($consoleLogCount -gt 100) {
    $mediumIssues += "Nombreux console.log ($consoleLogCount) - Implementer un systeme de logging propre"
}

if ($importantCount -gt 50) {
    $mediumIssues += "Abus de !important ($importantCount) - Revoir la specificite CSS"
}

if ($fixmeCount -gt 0) {
    $highIssues += "$fixmeCount FIXME comments - Resoudre les problemes connus"
}

$report += "### CRITIQUE (P0)`n`n"
if ($criticalIssues.Count -gt 0) {
    $criticalIssues | ForEach-Object { $report += "- $_`n" }
} else {
    $report += "Aucun probleme critique detecte.`n"
}

$report += "`n### ELEVE (P1)`n`n"
if ($highIssues.Count -gt 0) {
    $highIssues | ForEach-Object { $report += "- $_`n" }
} else {
    $report += "Aucun probleme de priorite elevee.`n"
}

$report += "`n### MOYEN (P2)`n`n"
if ($mediumIssues.Count -gt 0) {
    $mediumIssues | ForEach-Object { $report += "- $_`n" }
} else {
    $report += "Aucun probleme de priorite moyenne.`n"
}

$report += "`n---`n`n**Audit Phase 2 termine**`n"

# Save report
$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "[OK] Rapport Phase 2 genere: $reportPath"
Write-Host ""
Write-Host "ISSUES DETECTES:"
Write-Host "   - Critiques: $($criticalIssues.Count)"
Write-Host "   - Eleves: $($highIssues.Count)"
Write-Host "   - Moyens: $($mediumIssues.Count)"
