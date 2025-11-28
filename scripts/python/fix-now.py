import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

json_file = r'E:\TEST 3\server\data\application-data.json'

with open(json_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

for phase in data['arretData']['phases']:
    for tache in phase.get('taches', []):
        if tache.get('id') == 't30':
            tache['titre'] = "FAIRE LES COMMANDE A LONG DELAIS"
            tache['page'] = "detail-suivi-pieces-delai"
            print("Modifie!")
            break

with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Sauvegarde!")
