import json
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Charger le fichier JSON
with open(r'E:\TEST 3\server\data\application-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Trouver et modifier la tâche t30
phases = data['arretData']['phases']
for phase in phases:
    for task in phase.get('taches', []):
        if task.get('id') == 't30':
            task['titre'] = "FAIRE LES COMMANDE A LONG DELAIS"
            task['page'] = "detail-suivi-pieces-delai"
            print(f"OK Tache t30 modifiee:")
            print(f"   - Nouveau titre: {task['titre']}")
            print(f"   - Nouvelle page: {task['page']}")
            break

# Sauvegarder le fichier JSON
with open(r'E:\TEST 3\server\data\application-data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("OK Fichier JSON sauvegarde")
