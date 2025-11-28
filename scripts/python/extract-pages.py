#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'extraction automatique des pages depuis index.html
Extrait chaque <div class="page"> dans un fichier HTML séparé
"""

import re
import os
import sys
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def extract_pages_from_html(html_file_path, output_dir):
    """
    Extrait toutes les pages d'un fichier HTML monolithique

    Args:
        html_file_path: Chemin vers index.html
        output_dir: Dossier de sortie pour les pages
    """
    print(f"[LECTURE] {html_file_path}...")

    with open(html_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern pour trouver toutes les pages
    # Capture: id="xxx" class="page"> ... </div> (en tenant compte des divs imbriquées)
    page_pattern = r'<div id="([^"]+)"\s+class="page">(.*?)</div>\s*(?=<div id="|</div>|</body>|$)'

    pages_found = []

    # Méthode alternative: split et analyse manuelle
    lines = content.split('\n')
    current_page = None
    current_page_id = None
    page_content = []
    div_depth = 0
    in_page = False

    for i, line in enumerate(lines):
        # Détection du début d'une page
        match = re.search(r'<div id="([^"]+)"\s+class="page">', line)
        if match and not in_page:
            current_page_id = match.group(1)
            in_page = True
            div_depth = 1
            page_content = [line]
            print(f"  [FOUND] Page: {current_page_id} (ligne {i+1})")
            continue

        if in_page:
            page_content.append(line)

            # Compter les divs ouvertes et fermées
            div_depth += line.count('<div')
            div_depth -= line.count('</div>')

            # Si on ferme la div principale de la page
            if div_depth == 0:
                pages_found.append({
                    'id': current_page_id,
                    'content': '\n'.join(page_content),
                    'start_line': i - len(page_content) + 2
                })
                in_page = False
                current_page_id = None
                page_content = []

    print(f"\n[STATS] {len(pages_found)} pages trouvees")

    # Créer le dossier de sortie
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Écrire chaque page dans un fichier séparé
    for page in pages_found:
        page_id = page['id']
        content = page['content']

        # Nom du fichier
        filename = f"{page_id}.html"
        filepath = output_path / filename

        # Template HTML complet pour la page
        html_template = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page_id}</title>
    <!-- Styles seront chargés par l'app principale -->
</head>
<body>
{content}
</body>
</html>
"""

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_template)

        print(f"  [OK] {filename} cree ({len(content)} caracteres)")

    print(f"\n[SUCCESS] Extraction terminee! {len(pages_found)} pages dans {output_dir}")

    # Créer un fichier de mapping
    mapping_file = output_path / '_pages-mapping.json'
    import json
    mapping = {
        page['id']: {
            'file': f"{page['id']}.html",
            'start_line': page['start_line']
        }
        for page in pages_found
    }

    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)

    print(f"[MAPPING] Created: {mapping_file}")

    return pages_found

if __name__ == '__main__':
    # Chemins
    html_file = r'E:\TEST 3\client\index.html'
    output_dir = r'E:\TEST 3\client\components\pages'

    # Extraction
    pages = extract_pages_from_html(html_file, output_dir)

    print(f"\n[TOTAL] Nombre total de pages extraites: {len(pages)}")
    print("\nPages:")
    for p in pages:
        print(f"  - {p['id']}")
