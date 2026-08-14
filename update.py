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

def download_with_retry(url, target_path, max_retries=3):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }
    req = urllib.request.Request(url, headers=headers)
    
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            print(f"Versuch {attempt}/{max_retries}: Verbindung zu GitHub wird aufgebaut...")
            with urllib.request.urlopen(req, timeout=15) as response, open(target_path, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
            return True
        except Exception as e:
            last_error = e
            print(f"  Fehler bei Versuch {attempt}: {e}")
            if attempt < max_retries:
                time.sleep(2)
    raise last_error

def update():
    print("========================================")
    print("       STL Manager - Auto Updater       ")
    print("========================================")
    print("\nLade die neueste Version von GitHub herunter...")
    
    zip_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tf:
            zip_path = tf.name
            
        download_with_retry(REPO_ZIP_URL, zip_path)
            
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
                    
            print(f"\n[OK] Update erfolgreich abgeschlossen! ({updated_files} Dateien aktualisiert)")
            
    except Exception as e:
        print(f"\n[ERROR] Fehler beim Update: {e}")
        print("Tipp: Bitte pruefe deine Internetverbindung oder versuche es in wenigen Minuten erneut.")
    finally:
        if zip_path and os.path.exists(zip_path):
            try:
                os.remove(zip_path)
            except:
                pass

if __name__ == "__main__":
    update()
