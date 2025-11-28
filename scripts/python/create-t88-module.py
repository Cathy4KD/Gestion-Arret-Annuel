import re

# Lire le module t30
with open(r'E:\TEST 3\client\js\modules\data\t30-long-delai.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer toutes les occurrences de t30 par t88
content = content.replace('t30', 't88')
content = content.replace('T30', 'T88')
content = content.replace('>= 90 jours', '30-59 jours')
content = content.replace('>= 90', 'entre 30 et 59')
content = content.replace('> 90 jours', '30-59 jours')
content = re.sub(r'délai >= 90 jours', 'délai 30-59 jours', content)

# Changer le filtrage pour 30-59 jours au lieu de >= 90
content = re.sub(
    r'(return delaiNombre >= 90;)',
    'return delaiNombre >= 30 && delaiNombre < 60;',
    content
)
content = re.sub(
    r'(Filtrage des pièces avec délai >= 90 jours)',
    'Filtrage des pièces avec délai 30-59 jours',
    content
)

# Modifier la description du module
content = re.sub(
    r'(\* Gère les pièces avec un délai de livraison) supérieur à 90 jours',
    r'\1 entre 30 et 59 jours',
    content
)

# Écrire le nouveau module
with open(r'E:\TEST 3\client\js\modules\data\t88-long-delai.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Module t88-long-delai.js cree avec succes!")
