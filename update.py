import urllib.request
import zipfile
import os
import shutil
import tempfile
import time

REPO_ZIP_URL = "https://github.com/Promiszeus/stl-manager/archive/refs/heads/main.zip"
# Dateien und Ordner, die beim Update NICHT überschrieben werden dürfen:
EXCLUDE = [
    "backend/models.json", 
    "backend/settings.json", 
    "backend/.env", 
    "backend/.cache",
    "python_embeded", 
    "update.py", 
    "update.bat",
    "run_portable.bat",
    "start.bat"
]

def update():
    print("========================================")
    print("       STL Manager - Auto Updater       ")
    print("========================================")
    print("\nLade die neueste Version von GitHub herunter...")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tf:
            urllib.request.urlretrieve(REPO_ZIP_URL, tf.name)
            zip_path = tf.name
            
        print("Entpacke Dateien...")
        with tempfile.TemporaryDirectory() as td:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(td)
                
            # GitHub ZIPs haben immer einen Hauptordner (z.B. stl-manager-main)
            extracted_folder = os.path.join(td, os.listdir(td)[0])
            
            print("Installiere Update...")
            updated_files = 0
            for root, dirs, files in os.walk(extracted_folder):
                for file in files:
                    src = os.path.join(root, file)
                    rel_path = os.path.relpath(src, extracted_folder)
                    rel_path_normalized = rel_path.replace("\\", "/")
                    
                    # Check if file is excluded
                    if any(rel_path_normalized.startswith(ex) for ex in EXCLUDE):
                        continue
                        
                    dst = os.path.join(os.getcwd(), rel_path)
                    
                    # Ordnerstruktur erstellen falls nicht vorhanden
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    
                    # Kopieren und überschreiben
                    shutil.copy2(src, dst)
                    updated_files += 1
                    
        os.remove(zip_path)
        print(f"\nErfolgreich! Es wurden {updated_files} Dateien aktualisiert.")
        print("Du kannst den Server nun wie gewohnt starten.")
        
    except Exception as e:
        print(f"\nFehler beim Update: {e}")

if __name__ == "__main__":
    update()
