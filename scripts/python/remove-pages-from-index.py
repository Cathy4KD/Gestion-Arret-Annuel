#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour retirer les pages extraites du fichier index.html
Supprime toutes les <div class="page"> qui ont été extraites
"""

import re
import sys
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def remove_pages_from_index(html_file_path, output_file_path):
    """
    Retire toutes les pages du fichier index.html

    Args:
        html_file_path: Chemin vers index.html
        output_file_path: Chemin vers le fichier de sortie
    """
    print(f"[LECTURE] {html_file_path}...")

    with open(html_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_lines = len(content.split('\n'))
    print(f"[INFO] Fichier original: {original_lines} lignes")

    # Garder track des pages trouvées
    pages_removed = []

    # Méthode: analyser ligne par ligne et skipper les pages
    lines = content.split('\n')
    output_lines = []
    current_page_id = None
    page_content = []
    div_depth = 0
    in_page = False
    pages_start_line = None

    for i, line in enumerate(lines):
        # Détection du début d'une page
        match = re.search(r'<div id="([^"]+)"\s+class="page">', line)
        if match and not in_page:
            current_page_id = match.group(1)
            in_page = True
            div_depth = 1
            page_content = [line]
            if pages_start_line is None:
                # Marquer où commencent les pages pour ajouter un commentaire
                pages_start_line = len(output_lines)
            print(f"  [SKIP] Page: {current_page_id} (ligne {i+1})")
            continue

        if in_page:
            page_content.append(line)

            # Compter les divs ouvertes et fermées
            div_depth += line.count('<div')
            div_depth -= line.count('</div>')

            # Si on ferme la div principale de la page
            if div_depth == 0:
                pages_removed.append(current_page_id)
                in_page = False
                current_page_id = None
                page_content = []
            continue

        # Si on n'est pas dans une page, garder la ligne
        output_lines.append(line)

    # Ajouter un commentaire là où les pages ont été retirées
    if pages_start_line is not None:
        comment = f'''
        <!-- ============================================================ -->
        <!-- PAGES EXTRAITES                                              -->
        <!-- ============================================================ -->
        <!-- Les pages suivantes ont été extraites dans des fichiers     -->
        <!-- séparés dans client/components/pages/                        -->
        <!--                                                              -->
        <!-- Elles sont chargées dynamiquement par page-loader.js        -->
        <!-- à partir de /components/pages/{{pageId}}.html                 -->
        <!--                                                              -->
        <!-- Pages extraites: {len(pages_removed)} pages                                -->
        <!-- - detail-t22, detail-t24, detail-t27, detail-t29, ...      -->
        <!-- - contacts, etc.                                            -->
        <!--                                                              -->
        <!-- Voir: client/components/pages/ pour tous les fichiers       -->
        <!-- Voir: client/js/modules/pages/ pour les contrôleurs         -->
        <!-- ============================================================ -->
        '''

        output_lines.insert(pages_start_line, comment)

    # Écrire le fichier de sortie
    output_content = '\n'.join(output_lines)

    with open(output_file_path, 'w', encoding='utf-8') as f:
        f.write(output_content)

    new_lines = len(output_lines)
    reduction = original_lines - new_lines
    percent_reduction = (reduction / original_lines) * 100

    print(f"\n[SUCCESS] Pages retirees du fichier!")
    print(f"  - Pages retirees: {len(pages_removed)}")
    print(f"  - Lignes originales: {original_lines}")
    print(f"  - Nouvelles lignes: {new_lines}")
    print(f"  - Reduction: {reduction} lignes ({percent_reduction:.1f}%)")
    print(f"\n[OUTPUT] {output_file_path}")

    return pages_removed

if __name__ == '__main__':
    # Chemins
    html_file = r'E:\TEST 3\client\index.html'
    output_file = r'E:\TEST 3\client\index-refactored.html'

    # Suppression des pages
    pages = remove_pages_from_index(html_file, output_file)

    print(f"\nPages retirees:")
    for p in pages:
        print(f"  - {p}")
