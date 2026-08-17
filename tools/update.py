import urllib.request
import zipfile
import os
import shutil
import tempfile
import time
import json
from pathlib import Path

REPO_ZIP_URL = "https://github.com/Promiszeus/stl-manager/archive/refs/heads/main.zip"

# Base directory is parent of the tools folder (STL-Manager root)
ROOT_DIR = Path(__file__).resolve().parent.parent

# Files and folders to NEVER overwrite during updates (user data / environments):
EXCLUDE = [
    "backend/models.json", 
    "backend/settings.json", 
    "backend/.env", 
    "backend/.cache",
    "port.txt",
    "python_embeded", 
    ".gitignore"
]

def get_version(path):
    try:
        vf = path / "version.json"
        if vf.exists():
            with open(vf, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return None

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
    current_ver = get_version(ROOT_DIR)
    cur_v_str = current_ver.get("version", "1.x") if current_ver else "1.x"

    print("========================================")
    print(f"       STL Manager - Auto Updater       ")
    print(f"       Installierte Version: v{cur_v_str}")
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
                
            # GitHub ZIPs have a top-level directory (e.g. stl-manager-main)
            extracted_folder = os.path.join(td, os.listdir(td)[0])
            
            print("Installiere Update...")
            updated_files = 0
            for root, dirs, files in os.walk(extracted_folder):
                for file in files:
                    src = os.path.join(root, file)
                    rel_path = os.path.relpath(src, extracted_folder)
                    rel_path_normalized = rel_path.replace("\\", "/")
                    
                    # Check if file is excluded
                    if any(rel_path_normalized == ex or rel_path_normalized.startswith(ex + "/") for ex in EXCLUDE):
                        continue
                        
                    dst = ROOT_DIR / rel_path
                    
                    # Ensure destination directory exists
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Copy and overwrite
                    shutil.copy2(src, str(dst))
                    updated_files += 1
                    
            new_ver = get_version(ROOT_DIR)
            new_v_str = new_ver.get("version", "1.3.0") if new_ver else "1.3.0"
            
            print(f"\n[OK] Update erfolgreich auf Version v{new_v_str} aktualisiert! ({updated_files} Dateien)")
            
            if new_ver and new_ver.get("features"):
                print("\n✨ Neuerungen in Version v" + new_v_str + ":")
                for feat in new_ver["features"]:
                    print(f"  • {feat}")
            
    except Exception as e:
        print(f"\n[ERROR] Fehler beim Update: {e}")
        print("Tipp: Bitte pruefe deine Internetverbindung oder versuche es in wenigen Minuten erneut.")
    finally:
        if zip_path and os.path.exists(zip_path):
            try:
                os.remove(zip_path)
            except Exception:
                pass

if __name__ == "__main__":
    update()
