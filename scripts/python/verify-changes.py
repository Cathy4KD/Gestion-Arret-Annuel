import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Vérifier les changements dans le JSON
with open(r'E:\TEST 3\server\data\application-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Chercher la tâche t30
t30 = None
for phase in data['arretData']['phases']:
    for tache in phase.get('taches', []):
        if tache.get('id') == 't30':
            t30 = tache
            break
    if t30:
        break

print("=== VERIFICATION DES CHANGEMENTS ===\n")

if t30:
    print(f"Tache t30 trouvee:")
    print(f"  Titre: {t30.get('titre')}")
    print(f"  Page: {t30.get('page')}")

    # Vérifier si les changements sont corrects
    titre_correct = t30.get('titre') == "FAIRE LES COMMANDE A LONG DELAIS"
    page_correcte = t30.get('page') == "detail-suivi-pieces-delai"

    print(f"\n  Titre correct: {'OUI' if titre_correct else 'NON'}")
    print(f"  Page correcte: {'OUI' if page_correcte else 'NON'}")
else:
    print("ERREUR: Tache t30 non trouvee!")

# Vérifier l'existence des fichiers
import os
fichiers = [
    r'E:\TEST 3\client\js\modules\data\t88-long-delai.js',
    r'E:\TEST 3\client\components\pages\detail-suivi-pieces-delai.html'
]

print("\n=== FICHIERS ===")
for f in fichiers:
    existe = os.path.exists(f)
    print(f"  {os.path.basename(f)}: {'EXISTE' if existe else 'MANQUANT'}")
