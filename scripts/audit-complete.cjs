/**
 * AUDIT COMPLET - Toutes Phases
 * Script Node.js pour audit approfondi de l'application
 */

const fs = require('fs');
const path = require('path');

const ROOT_PATH = path.join(__dirname, '..');
const REPORTS_DIR = path.join(ROOT_PATH, 'docs', 'rapports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// === PHASE 2: QUALITE DU CODE ===

function auditPhase2() {
    console.log('\n=== PHASE 2: AUDIT QUALITE DU CODE ===\n');

    const report = [];
    report.push('# AUDIT PHASE 2 - QUALITE DU CODE\n');
    report.push(`**Date:** ${new Date().toLocaleString()}\n`);
    report.push(`**Auditeur:** Automatise\n`);
    report.push(`**Projet:** Gestion Arret Annuel 2026\n\n`);
    report.push('---\n\n');

    // Analyze JavaScript files
    report.push('## 1. ANALYSE JAVASCRIPT\n\n');

    const jsFiles = getAllFiles(ROOT_PATH, '.js').filter(f => !f.includes('node_modules'));
    report.push(`**Nombre total de fichiers JS:** ${jsFiles.length}\n\n`);

    let totalLines = 0;
    let varCount = 0;
    let letCount = 0;
    let constCount = 0;
    let evalCount = 0;
    let consoleLogCount = 0;
    let todoCount = 0;
    let fixmeCount = 0;
    let filesWithVar = [];
    let filesWithEval = [];
    let longFiles = [];

    jsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        totalLines += lines.length;

        if (lines.length > 500) {
            longFiles.push({ file: path.relative(ROOT_PATH, file), lines: lines.length });
        }

        const varMatches = content.match(/\bvar\s+/g);
        const letMatches = content.match(/\blet\s+/g);
        const constMatches = content.match(/\bconst\s+/g);
        const evalMatches = content.match(/\beval\s*\(/g);
        const consoleMatches = content.match(/\bconsole\.log\s*\(/g);
        const todoMatches = content.match(/\bTODO\b/g);
        const fixmeMatches = content.match(/\bFIXME\b/g);

        if (varMatches) {
            varCount += varMatches.length;
            filesWithVar.push(path.relative(ROOT_PATH, file));
        }
        if (letMatches) letCount += letMatches.length;
        if (constMatches) constCount += constMatches.length;
        if (evalMatches) {
            evalCount += evalMatches.length;
            filesWithEval.push(path.relative(ROOT_PATH, file));
        }
        if (consoleMatches) consoleLogCount += consoleMatches.length;
        if (todoMatches) todoCount += todoMatches.length;
        if (fixmeMatches) fixmeCount += fixmeMatches.length;
    });

    report.push('### 1.1 Statistiques generales\n\n');
    report.push('| Metrique | Valeur |\n');
    report.push('|----------|--------|\n');
    report.push(`| Fichiers JS totaux | ${jsFiles.length} |\n`);
    report.push(`| Lignes de code totales | ${totalLines} |\n`);
    report.push(`| Moyenne lignes/fichier | ${Math.round(totalLines / jsFiles.length)} |\n\n`);

    report.push('### 1.2 Declarations de variables\n\n');
    report.push('| Type | Count | Pourcentage |\n');
    report.push('|------|-------|-------------|\n');
    const totalVarDecl = varCount + letCount + constCount;
    if (totalVarDecl > 0) {
        report.push(`| \`var\` (deprecated) | ${varCount} | ${((varCount / totalVarDecl) * 100).toFixed(2)}% |\n`);
        report.push(`| \`let\` | ${letCount} | ${((letCount / totalVarDecl) * 100).toFixed(2)}% |\n`);
        report.push(`| \`const\` | ${constCount} | ${((constCount / totalVarDecl) * 100).toFixed(2)}% |\n\n`);
    }

    if (filesWithVar.length > 0) {
        report.push(`\n**ATTENTION:** ${filesWithVar.length} fichiers utilisent encore \`var\` (deprecated):\n\n`);
        filesWithVar.slice(0, 10).forEach(f => report.push(`- ${f}\n`));
        if (filesWithVar.length > 10) {
            report.push(`\n... et ${filesWithVar.length - 10} autres fichiers\n`);
        }
    }

    report.push('\n### 1.3 Problemes de qualite\n\n');
    report.push('| Issue | Count | Severite |\n');
    report.push('|-------|-------|----------|\n');
    report.push(`| eval() usage | ${evalCount} | CRITIQUE |\n`);
    report.push(`| console.log() | ${consoleLogCount} | MOYEN |\n`);
    report.push(`| TODO comments | ${todoCount} | INFO |\n`);
    report.push(`| FIXME comments | ${fixmeCount} | ELEVE |\n\n`);

    if (filesWithEval.length > 0) {
        report.push(`\n**CRITIQUE:** eval() detected in ${filesWithEval.length} files:\n\n`);
        filesWithEval.forEach(f => report.push(`- ${f}\n`));
    }

    if (longFiles.length > 0) {
        report.push('\n### 1.4 Fichiers trop longs (> 500 lignes)\n\n');
        report.push('| Fichier | Lignes |\n');
        report.push('|---------|--------|\n');
        longFiles.sort((a, b) => b.lines - a.lines).slice(0, 20).forEach(f => {
            report.push(`| ${f.file} | ${f.lines} |\n`);
        });
    }

    // Analyze HTML files
    report.push('\n---\n\n## 2. ANALYSE HTML\n\n');

    const htmlFiles = getAllFiles(ROOT_PATH, '.html').filter(f => !f.includes('node_modules'));
    report.push(`**Nombre total de fichiers HTML:** ${htmlFiles.length}\n\n`);

    let inlineStylesTotal = 0;
    let inlineEventsTotal = 0;
    let filesWithInlineStyles = [];
    let filesWithInlineEvents = [];

    htmlFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        const styleMatches = content.match(/style="[^"]*"/g);
        const eventMatches = content.match(/on\w+="[^"]*"/g);

        if (styleMatches) {
            inlineStylesTotal += styleMatches.length;
            filesWithInlineStyles.push({ file: path.relative(ROOT_PATH, file), count: styleMatches.length });
        }
        if (eventMatches) {
            inlineEventsTotal += eventMatches.length;
            filesWithInlineEvents.push({ file: path.relative(ROOT_PATH, file), count: eventMatches.length });
        }
    });

    report.push('### 2.1 Statistiques HTML\n\n');
    report.push('| Metrique | Valeur |\n');
    report.push('|----------|--------|\n');
    report.push(`| Fichiers HTML | ${htmlFiles.length} |\n`);
    report.push(`| Inline styles | ${inlineStylesTotal} |\n`);
    report.push(`| Inline events | ${inlineEventsTotal} |\n\n`);

    if (filesWithInlineStyles.length > 0) {
        report.push('### 2.2 Fichiers avec inline styles\n\n');
        report.push('| Fichier | Count |\n');
        report.push('|---------|-------|\n');
        filesWithInlineStyles.sort((a, b) => b.count - a.count).slice(0, 20).forEach(f => {
            report.push(`| ${f.file} | ${f.count} |\n`);
        });
    }

    if (filesWithInlineEvents.length > 0) {
        report.push('\n### 2.3 Fichiers avec inline events (onclick, etc.)\n\n');
        report.push('| Fichier | Count |\n');
        report.push('|---------|-------|\n');
        filesWithInlineEvents.sort((a, b) => b.count - a.count).slice(0, 20).forEach(f => {
            report.push(`| ${f.file} | ${f.count} |\n`);
        });
    }

    // Analyze CSS files
    report.push('\n---\n\n## 3. ANALYSE CSS\n\n');

    const cssFiles = getAllFiles(ROOT_PATH, '.css').filter(f => !f.includes('node_modules'));
    report.push(`**Nombre total de fichiers CSS:** ${cssFiles.length}\n\n`);

    let importantCount = 0;
    let filesWithImportant = [];

    cssFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const importantMatches = content.match(/!important/g);

        if (importantMatches) {
            importantCount += importantMatches.length;
            filesWithImportant.push({ file: path.relative(ROOT_PATH, file), count: importantMatches.length });
        }
    });

    report.push('### 3.1 Statistiques CSS\n\n');
    report.push('| Metrique | Valeur |\n');
    report.push('|----------|--------|\n');
    report.push(`| Fichiers CSS | ${cssFiles.length} |\n`);
    report.push(`| !important usage | ${importantCount} |\n\n`);

    if (filesWithImportant.length > 0) {
        report.push('### 3.2 Fichiers avec !important\n\n');
        report.push('| Fichier | Count |\n');
        report.push('|---------|-------|\n');
        filesWithImportant.sort((a, b) => b.count - a.count).forEach(f => {
            report.push(`| ${f.file} | ${f.count} |\n`);
        });
    }

    // Recommendations
    report.push('\n---\n\n## 4. RESUME & RECOMMENDATIONS\n\n');

    const criticalIssues = [];
    const highIssues = [];
    const mediumIssues = [];

    if (evalCount > 0) {
        criticalIssues.push(`eval() detecte dans ${evalCount} endroits - A ELIMINER IMMEDIATEMENT (injection de code)`);
    }

    if (varCount > 50) {
        highIssues.push(`Usage excessif de 'var' (${varCount} occurrences) - Migrer vers let/const`);
    }

    if (inlineStylesTotal > 100) {
        highIssues.push(`Trop de inline styles (${inlineStylesTotal}) - Extraire vers CSS`);
    }

    if (inlineEventsTotal > 50) {
        highIssues.push(`Trop de inline events (${inlineEventsTotal}) - Utiliser addEventListener`);
    }

    if (consoleLogCount > 100) {
        mediumIssues.push(`Nombreux console.log (${consoleLogCount}) - Implementer un systeme de logging propre`);
    }

    if (importantCount > 50) {
        mediumIssues.push(`Abus de !important (${importantCount}) - Revoir la specificite CSS`);
    }

    if (fixmeCount > 0) {
        highIssues.push(`${fixmeCount} FIXME comments - Resoudre les problemes connus`);
    }

    report.push('### CRITIQUE (P0)\n\n');
    if (criticalIssues.length > 0) {
        criticalIssues.forEach(issue => report.push(`- ${issue}\n`));
    } else {
        report.push('Aucun probleme critique detecte.\n');
    }

    report.push('\n### ELEVE (P1)\n\n');
    if (highIssues.length > 0) {
        highIssues.forEach(issue => report.push(`- ${issue}\n`));
    } else {
        report.push('Aucun probleme de priorite elevee.\n');
    }

    report.push('\n### MOYEN (P2)\n\n');
    if (mediumIssues.length > 0) {
        mediumIssues.forEach(issue => report.push(`- ${issue}\n`));
    } else {
        report.push('Aucun probleme de priorite moyenne.\n');
    }

    report.push('\n---\n\n**Audit Phase 2 termine**\n');

    // Save report
    const reportPath = path.join(REPORTS_DIR, 'AUDIT-PHASE2-QUALITE-CODE.md');
    fs.writeFileSync(reportPath, report.join(''), 'utf-8');

    console.log(`[OK] Rapport Phase 2 genere: ${reportPath}`);
    console.log('');
    console.log('ISSUES DETECTES:');
    console.log(`   - Critiques: ${criticalIssues.length}`);
    console.log(`   - Eleves: ${highIssues.length}`);
    console.log(`   - Moyens: ${mediumIssues.length}`);
}

// === PHASE 3: PERFORMANCE ===

function auditPhase3() {
    console.log('\n=== PHASE 3: AUDIT PERFORMANCE ===\n');

    const report = [];
    report.push('# AUDIT PHASE 3 - PERFORMANCE\n\n');
    report.push(`**Date:** ${new Date().toLocaleString()}\n`);
    report.push(`**Auditeur:** Automatise\n\n`);
    report.push('---\n\n');

    // Analyze bundle sizes
    report.push('## 1. TAILLE DES FICHIERS\n\n');

    const jsFiles = getAllFiles(ROOT_PATH, '.js').filter(f => !f.includes('node_modules'));
    const cssFiles = getAllFiles(ROOT_PATH, '.css').filter(f => !f.includes('node_modules'));
    const htmlFiles = getAllFiles(ROOT_PATH, '.html').filter(f => !f.includes('node_modules'));
    const imageFiles = getAllFiles(ROOT_PATH, '.png').concat(
        getAllFiles(ROOT_PATH, '.jpg'),
        getAllFiles(ROOT_PATH, '.jpeg'),
        getAllFiles(ROOT_PATH, '.gif'),
        getAllFiles(ROOT_PATH, '.svg')
    ).filter(f => !f.includes('node_modules'));

    const jsSize = jsFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
    const cssSize = cssFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
    const htmlSize = htmlFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
    const imageSize = imageFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);

    report.push('| Type | Fichiers | Taille Totale |\n');
    report.push('|------|----------|---------------|\n');
    report.push(`| JavaScript | ${jsFiles.length} | ${(jsSize / 1024 / 1024).toFixed(2)} MB |\n`);
    report.push(`| CSS | ${cssFiles.length} | ${(cssSize / 1024).toFixed(2)} KB |\n`);
    report.push(`| HTML | ${htmlFiles.length} | ${(htmlSize / 1024).toFixed(2)} KB |\n`);
    report.push(`| Images | ${imageFiles.length} | ${(imageSize / 1024 / 1024).toFixed(2)} MB |\n\n`);

    // Largest files
    report.push('## 2. FICHIERS LES PLUS VOLUMINEUX\n\n');

    const allFiles = [].concat(jsFiles, cssFiles, htmlFiles, imageFiles);
    const largestFiles = allFiles
        .map(f => ({ path: path.relative(ROOT_PATH, f), size: fs.statSync(f).size }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 20);

    report.push('| Fichier | Taille |\n');
    report.push('|---------|--------|\n');
    largestFiles.forEach(f => {
        const size = f.size > 1024 * 1024
            ? `${(f.size / 1024 / 1024).toFixed(2)} MB`
            : `${(f.size / 1024).toFixed(2)} KB`;
        report.push(`| ${f.path} | ${size} |\n`);
    });

    report.push('\n## 3. RECOMMENDATIONS PERFORMANCE\n\n');

    const perfIssues = [];

    if (jsSize > 5 * 1024 * 1024) {
        perfIssues.push(`JavaScript total > 5MB (${(jsSize / 1024 / 1024).toFixed(2)} MB) - Implementer code splitting`);
    }

    if (imageSize > 10 * 1024 * 1024) {
        perfIssues.push(`Images total > 10MB (${(imageSize / 1024 / 1024).toFixed(2)} MB) - Optimiser et compresser les images`);
    }

    // Check for large individual files
    const largeJsFiles = jsFiles.filter(f => fs.statSync(f).size > 500 * 1024);
    if (largeJsFiles.length > 0) {
        perfIssues.push(`${largeJsFiles.length} fichiers JS > 500KB - Considerer le code splitting`);
    }

    if (perfIssues.length > 0) {
        perfIssues.forEach(issue => report.push(`- ${issue}\n`));
    } else {
        report.push('Aucun probleme de performance majeur detecte.\n');
    }

    report.push('\n---\n\n**Audit Phase 3 termine**\n');

    const reportPath = path.join(REPORTS_DIR, 'AUDIT-PHASE3-PERFORMANCE.md');
    fs.writeFileSync(reportPath, report.join(''), 'utf-8');

    console.log(`[OK] Rapport Phase 3 genere: ${reportPath}`);
    console.log('');
    console.log(`ISSUES PERFORMANCE: ${perfIssues.length}`);
}

// === PHASE 4: SECURITE ===

function auditPhase4() {
    console.log('\n=== PHASE 4: AUDIT SECURITE ===\n');

    const report = [];
    report.push('# AUDIT PHASE 4 - SECURITE\n\n');
    report.push(`**Date:** ${new Date().toLocaleString()}\n`);
    report.push(`**Auditeur:** Automatise\n`);
    report.push(`**Note:** Application interne d'equipe, pas de prod prevue\n\n`);
    report.push('---\n\n');

    // Security analysis
    report.push('## 1. ANALYSE SECURITE FRONTEND\n\n');

    const jsFiles = getAllFiles(ROOT_PATH, '.js').filter(f => !f.includes('node_modules'));
    const htmlFiles = getAllFiles(ROOT_PATH, '.html').filter(f => !f.includes('node_modules'));

    let evalCount = 0;
    let innerHTMLCount = 0;
    let execScriptCount = 0;
    let filesWithSecurityIssues = [];

    jsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const issues = [];

        const evalMatches = content.match(/\beval\s*\(/g);
        const innerHTMLMatches = content.match(/\.innerHTML\s*=/g);
        const execMatches = content.match(/\bexecScript\s*\(/g);

        if (evalMatches) {
            evalCount += evalMatches.length;
            issues.push(`eval() (${evalMatches.length})`);
        }
        if (innerHTMLMatches) {
            innerHTMLCount += innerHTMLMatches.length;
            issues.push(`innerHTML (${innerHTMLMatches.length})`);
        }
        if (execMatches) {
            execScriptCount += execMatches.length;
            issues.push(`execScript (${execMatches.length})`);
        }

        if (issues.length > 0) {
            filesWithSecurityIssues.push({
                file: path.relative(ROOT_PATH, file),
                issues: issues.join(', ')
            });
        }
    });

    report.push('### 1.1 Risques XSS potentiels\n\n');
    report.push('| Issue | Count | Severite |\n');
    report.push('|-------|-------|----------|\n');
    report.push(`| eval() usage | ${evalCount} | CRITIQUE |\n`);
    report.push(`| innerHTML assignments | ${innerHTMLCount} | MOYEN |\n`);
    report.push(`| execScript() | ${execScriptCount} | CRITIQUE |\n\n`);

    if (filesWithSecurityIssues.length > 0) {
        report.push('### 1.2 Fichiers avec problemes de securite\n\n');
        report.push('| Fichier | Issues |\n');
        report.push('|---------|--------|\n');
        filesWithSecurityIssues.forEach(f => {
            report.push(`| ${f.file} | ${f.issues} |\n`);
        });
    }

    // Check for hardcoded secrets
    report.push('\n## 2. SECRETS ET CREDENTIALS\n\n');

    let secretsFound = [];
    const secretPatterns = [
        { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Password hardcode' },
        { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, name: 'API Key hardcode' },
        { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, name: 'Secret hardcode' },
        { pattern: /token\s*=\s*['"][^'"]+['"]/gi, name: 'Token hardcode' }
    ];

    jsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        secretPatterns.forEach(({ pattern, name }) => {
            const matches = content.match(pattern);
            if (matches) {
                secretsFound.push({
                    file: path.relative(ROOT_PATH, file),
                    type: name,
                    count: matches.length
                });
            }
        });
    });

    if (secretsFound.length > 0) {
        report.push('**ATTENTION:** Secrets potentiels detectes:\n\n');
        report.push('| Fichier | Type | Count |\n');
        report.push('|---------|------|-------|\n');
        secretsFound.forEach(s => {
            report.push(`| ${s.file} | ${s.type} | ${s.count} |\n`);
        });
    } else {
        report.push('Aucun secret hardcode detecte.\n');
    }

    report.push('\n## 3. RECOMMENDATIONS SECURITE\n\n');

    const securityIssues = [];

    if (evalCount > 0) {
        securityIssues.push(`[CRITIQUE] eval() detecte ${evalCount} fois - Risque injection de code`);
    }

    if (innerHTMLCount > 20) {
        securityIssues.push(`[MOYEN] innerHTML utilise ${innerHTMLCount} fois - Risque XSS, utiliser textContent ou sanitization`);
    }

    if (secretsFound.length > 0) {
        securityIssues.push(`[ELEVE] ${secretsFound.length} secrets potentiels hardcodes - Utiliser variables d'environnement`);
    }

    if (securityIssues.length > 0) {
        securityIssues.forEach(issue => report.push(`- ${issue}\n`));
    } else {
        report.push('Bonnes pratiques de securite respectees (contexte interne).\n');
    }

    report.push('\n**Note:** Pour un outil interne d\'equipe, ces risques sont moins critiques mais devraient etre corriges pour adopter les bonnes pratiques.\n');

    report.push('\n---\n\n**Audit Phase 4 termine**\n');

    const reportPath = path.join(REPORTS_DIR, 'AUDIT-PHASE4-SECURITE.md');
    fs.writeFileSync(reportPath, report.join(''), 'utf-8');

    console.log(`[OK] Rapport Phase 4 genere: ${reportPath}`);
    console.log('');
    console.log(`ISSUES SECURITE: ${securityIssues.length}`);
}

// === PHASE 5: MAINTENABILITE ===

function auditPhase5() {
    console.log('\n=== PHASE 5: AUDIT MAINTENABILITE ===\n');

    const report = [];
    report.push('# AUDIT PHASE 5 - MAINTENABILITE\n\n');
    report.push(`**Date:** ${new Date().toLocaleString()}\n`);
    report.push(`**Auditeur:** Automatise\n\n`);
    report.push('---\n\n');

    // Analyze code organization
    report.push('## 1. ORGANISATION DU CODE\n\n');

    const jsFiles = getAllFiles(ROOT_PATH, '.js').filter(f => !f.includes('node_modules'));

    let totalFunctions = 0;
    let longFunctions = [];
    let filesWithoutComments = [];
    let totalCommentLines = 0;
    let totalCodeLines = 0;

    jsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        // Count comment lines
        const commentLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
        }).length;

        totalCommentLines += commentLines;
        totalCodeLines += lines.length - commentLines;

        if (commentLines === 0 && lines.length > 50) {
            filesWithoutComments.push(path.relative(ROOT_PATH, file));
        }

        // Detect functions (simplified)
        const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g);
        if (functionMatches) {
            totalFunctions += functionMatches.length;
        }
    });

    const commentRatio = totalCodeLines > 0 ? (totalCommentLines / totalCodeLines * 100).toFixed(2) : 0;

    report.push('### 1.1 Documentation du code\n\n');
    report.push('| Metrique | Valeur |\n');
    report.push('|----------|--------|\n');
    report.push(`| Lignes de code | ${totalCodeLines} |\n`);
    report.push(`| Lignes de commentaires | ${totalCommentLines} |\n`);
    report.push(`| Ratio commentaires/code | ${commentRatio}% |\n`);
    report.push(`| Fichiers sans commentaires (>50 lignes) | ${filesWithoutComments.length} |\n\n`);

    if (filesWithoutComments.length > 0) {
        report.push('**Fichiers importants sans commentaires:**\n\n');
        filesWithoutComments.slice(0, 10).forEach(f => report.push(`- ${f}\n`));
        if (filesWithoutComments.length > 10) {
            report.push(`\n... et ${filesWithoutComments.length - 10} autres\n`);
        }
    }

    report.push('\n### 1.2 Complexite\n\n');
    report.push('| Metrique | Valeur |\n');
    report.push('|----------|--------|\n');
    report.push(`| Fonctions detectees | ${totalFunctions} |\n`);
    report.push(`| Fichiers JS | ${jsFiles.length} |\n`);
    report.push(`| Moyenne fonctions/fichier | ${(totalFunctions / jsFiles.length).toFixed(2)} |\n\n`);

    report.push('\n## 2. RECOMMENDATIONS MAINTENABILITE\n\n');

    const maintIssues = [];

    if (commentRatio < 10) {
        maintIssues.push(`[ELEVE] Ratio commentaires/code trop faible (${commentRatio}%) - Ajouter documentation`);
    }

    if (filesWithoutComments.length > 10) {
        maintIssues.push(`[MOYEN] ${filesWithoutComments.length} fichiers sans commentaires - Documenter le code`);
    }

    if (maintIssues.length > 0) {
        maintIssues.forEach(issue => report.push(`- ${issue}\n`));
    } else {
        report.push('Code bien organise et maintenable.\n');
    }

    report.push('\n---\n\n**Audit Phase 5 termine**\n');

    const reportPath = path.join(REPORTS_DIR, 'AUDIT-PHASE5-MAINTENABILITE.md');
    fs.writeFileSync(reportPath, report.join(''), 'utf-8');

    console.log(`[OK] Rapport Phase 5 genere: ${reportPath}`);
    console.log('');
    console.log(`ISSUES MAINTENABILITE: ${maintIssues.length}`);
}

// === PHASE 6: DEPENDANCES ===

function auditPhase6() {
    console.log('\n=== PHASE 6: AUDIT DEPENDANCES ===\n');

    const report = [];
    report.push('# AUDIT PHASE 6 - DEPENDANCES\n\n');
    report.push(`**Date:** ${new Date().toLocaleString()}\n`);
    report.push(`**Auditeur:** Automatise\n\n`);
    report.push('---\n\n');

    // Read package.json
    const packageJsonPath = path.join(ROOT_PATH, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        report.push('**ERREUR:** package.json non trouve\n');
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    report.push('## 1. DEPENDANCES NPM\n\n');

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    report.push(`**Dependencies:** ${Object.keys(dependencies).length}\n`);
    report.push(`**DevDependencies:** ${Object.keys(devDependencies).length}\n\n`);

    report.push('### 1.1 Dependencies de production\n\n');
    if (Object.keys(dependencies).length > 0) {
        report.push('| Package | Version |\n');
        report.push('|---------|---------|\\n');
        Object.entries(dependencies).forEach(([pkg, version]) => {
            report.push(`| ${pkg} | ${version} |\n`);
        });
    } else {
        report.push('Aucune dependency de production.\n');
    }

    report.push('\n### 1.2 DevDependencies\n\n');
    if (Object.keys(devDependencies).length > 0) {
        report.push('| Package | Version |\n');
        report.push('|---------|---------|\\n');
        Object.entries(devDependencies).forEach(([pkg, version]) => {
            report.push(`| ${pkg} | ${version} |\n`);
        });
    } else {
        report.push('Aucune devDependency.\n');
    }

    report.push('\n### 1.3 Scripts disponibles\n\n');
    const scripts = packageJson.scripts || {};
    if (Object.keys(scripts).length > 0) {
        report.push('| Script | Commande |\n');
        report.push('|--------|----------|\n');
        Object.entries(scripts).forEach(([name, cmd]) => {
            report.push(`| ${name} | \`${cmd}\` |\n`);
        });
    } else {
        report.push('Aucun script defini.\n');
    }

    report.push('\n## 2. RECOMMENDATIONS\n\n');
    report.push('- Executer `npm audit` pour verifier les vulnerabilites\n');
    report.push('- Verifier les versions obsoletes avec `npm outdated`\n');
    report.push('- Considerer l\'ajout de `package-lock.json` dans le repo\n');

    report.push('\n---\n\n**Audit Phase 6 termine**\n');

    const reportPath = path.join(REPORTS_DIR, 'AUDIT-PHASE6-DEPENDANCES.md');
    fs.writeFileSync(reportPath, report.join(''), 'utf-8');

    console.log(`[OK] Rapport Phase 6 genere: ${reportPath}`);
}

// === HELPER FUNCTIONS ===

function getAllFiles(dirPath, extension, arrayOfFiles = []) {
    try {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);

            try {
                if (fs.statSync(filePath).isDirectory()) {
                    arrayOfFiles = getAllFiles(filePath, extension, arrayOfFiles);
                } else {
                    if (filePath.endsWith(extension)) {
                        arrayOfFiles.push(filePath);
                    }
                }
            } catch (err) {
                // Skip files that can't be accessed
            }
        });
    } catch (err) {
        // Skip directories that can't be accessed
    }

    return arrayOfFiles;
}

// === MAIN EXECUTION ===

function main() {
    console.log('\n======================================');
    console.log('   AUDIT COMPLET - TOUTES PHASES');
    console.log('======================================\n');

    try {
        auditPhase2();  // Qualite code
        auditPhase3();  // Performance
        auditPhase4();  // Securite
        auditPhase5();  // Maintenabilite
        auditPhase6();  // Dependances

        console.log('\n======================================');
        console.log('   AUDIT COMPLET TERMINE');
        console.log('======================================\n');
        console.log(`Rapports generes dans: ${REPORTS_DIR}`);
    } catch (error) {
        console.error('ERREUR:', error);
        process.exit(1);
    }
}

main();
