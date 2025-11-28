import json
import sys
import io
import shutil
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

json_file = r'E:\TEST 3\server\data\application-data.json'

# Créer une sauvegarde
backup_file = f"{json_file}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
shutil.copy2(json_file, backup_file)
print(f"Backup cree: {backup_file}")

# Charger le fichier JSON
with open(json_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Chercher et modifier la tâche t30
modified = False
for phase in data['arretData']['phases']:
    for tache in phase.get('taches', []):
        if tache.get('id') == 't30':
            print(f"\nTache t30 trouvee dans phase: {phase.get('nom')}")
            print(f"  Ancien titre: {tache.get('titre')}")
            print(f"  Ancienne page: {tache.get('page')}")

            tache['titre'] = "FAIRE LES COMMANDE A LONG DELAIS"
            tache['page'] = "detail-suivi-pieces-delai"

            print(f"  Nouveau titre: {tache['titre']}")
            print(f"  Nouvelle page: {tache['page']}")
            modified = True
            break
    if modified:
        break

if modified:
    # Sauvegarder le fichier JSON
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("\nFichier JSON sauvegarde avec succes!")
else:
    print("\nERREUR: Tache t30 non trouvee!")
