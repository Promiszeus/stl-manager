import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path
from database import load_settings, load_models, save_models
from thumbnailer import generate_thumbnail
import time
import hashlib
import threading

# Limit concurrent thumbnail renders to avoid RAM/GPU exhaustion on large folders
RENDER_SEMAPHORE = threading.Semaphore(2)

CACHE_DIR = Path(".cache")
CACHE_DIR.mkdir(exist_ok=True)

def get_file_hash(filepath):
    """MD5 hash of file PATH - used as a stable unique ID per location."""
    return hashlib.md5(str(filepath).encode()).hexdigest()

def get_content_hash(filepath):
    """MD5 hash of file CONTENT - used to find true duplicates."""
    h = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None

def apply_auto_tags(model_entry: dict, url: str):
    from urllib.parse import urlparse
    if not url:
        return
    try:
        domain = urlparse(url).netloc.lower()
        tag = None
        if "makerworld" in domain:
            tag = "Makerworld"
        elif "makeronline" in domain:
            tag = "Makeronline"
        elif "printables" in domain:
            tag = "Printables"
        elif "thingiverse" in domain:
            tag = "Thingiverse"
        elif "thangs" in domain:
            tag = "Thangs"
        elif "cults3d" in domain:
            tag = "Cults3D"
            
        if tag:
            tags = model_entry.get("tags", [])
            if tag not in tags:
                tags.append(tag)
                model_entry["tags"] = tags
    except Exception:
        pass

DOWNLOAD_CACHE = {}

def get_source_url(filepath: str):
    """Reads the Windows Zone.Identifier Alternate Data Stream to get the download URL."""
    # Check cache first (populated by Chrome Extension via API)
    filename = Path(filepath).name
    if filename in DOWNLOAD_CACHE:
        return DOWNLOAD_CACHE[filename]
        
    import sys
    if sys.platform != "win32":
        return None
    try:
        zone_file = filepath + ":Zone.Identifier"
        referrer = None
        host = None
        with open(zone_file, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if line.startswith("ReferrerUrl="):
                    referrer = line.split("=", 1)[1]
                elif line.startswith("HostUrl="):
                    host = line.split("=", 1)[1]
        return referrer if referrer else host
    except Exception:
        return None

class STLHandler(FileSystemEventHandler):
    def _is_3d_file(self, path: str) -> bool:
        p = path.lower()
        return p.endswith('.stl') or p.endswith('.3mf')

    def on_created(self, event):
        if not event.is_directory and self._is_3d_file(event.src_path):
            threading.Thread(target=self.delayed_process, args=(event.src_path,), daemon=True).start()

    def on_moved(self, event):
        if not event.is_directory and self._is_3d_file(event.dest_path):
            threading.Thread(target=self.delayed_process, args=(event.dest_path,), daemon=True).start()

    def on_deleted(self, event):
        if not event.is_directory and self._is_3d_file(event.src_path):
            file_id = get_file_hash(event.src_path)
            models = load_models()
            if file_id in models:
                del models[file_id]
                save_models(models)
                print(f"Removed {event.src_path} from database.")

    def delayed_process(self, filepath):
        # Wait 2 seconds to ensure large file copies are completed before reading
        time.sleep(2)
        try:
            # Check if it still exists and hasn't been deleted immediately
            if Path(filepath).exists():
                self.process_file(filepath)
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

    def process_file(self, filepath):
        models = load_models()
        path_obj = Path(filepath)
        file_id = get_file_hash(filepath)
        
        base_thumb = CACHE_DIR / file_id
        existing = list(CACHE_DIR.glob(f"{file_id}_*.png"))
        
        if not existing:
            # Also retry if already in DB but has no thumbnail (previous render failure)
            already_in_db_no_thumb = file_id in models and not models[file_id].get("thumbnails")
            file_size = path_obj.stat().st_size if path_obj.exists() else 0
            
            if file_size < 100:
                print(f"  Skipping {path_obj.name} - file too small ({file_size} bytes), likely empty")
            else:
                print(f"  Rendering thumbnail for {path_obj.name}...")
                with RENDER_SEMAPHORE:
                    try:
                        success = generate_thumbnail(filepath, str(base_thumb))
                        if success:
                            existing = list(CACHE_DIR.glob(f"{file_id}_*.png"))
                        else:
                            print(f"  Thumbnail failed for {path_obj.name} - will show without image")
                    except Exception as e:
                        print(f"  Thumbnail error for {path_obj.name}: {e}")
        
        existing.sort(key=lambda p: int(p.stem.split('_')[-1]) if '_' in p.stem else 0)
        thumbnails_list = [f"/cache/{p.name}" for p in existing]
        
        # Always save to DB - even without a thumbnail the model should appear
        existing_entry = models.get(file_id, {})
        new_source_url = get_source_url(filepath) or existing_entry.get("source_url")
        
        if file_id not in models or existing_entry.get("thumbnails") != thumbnails_list or existing_entry.get("source_url") != new_source_url:
            model_entry = {
                "id": file_id,
                "name": path_obj.name,
                "path": str(path_obj),
                "size_kb": round(path_obj.stat().st_size / 1024, 1),
                "thumbnails": thumbnails_list,
                "content_hash": get_content_hash(str(path_obj)),
                "status": existing_entry.get("status", "Not Printed"),
                "tags": existing_entry.get("tags", []),
                "source_url": new_source_url,
                "added_at": existing_entry.get("added_at", time.time())
            }
            # Auto-tag if new url is found
            if new_source_url and new_source_url != existing_entry.get("source_url"):
                apply_auto_tags(model_entry, new_source_url)
            
            models[file_id] = model_entry
            save_models(models)
            print(f"  Saved: {path_obj.name}")

def scan_all_directories():
    settings = load_settings()
    handler = STLHandler()
    for directory in settings.get("directories", []):
        dir_path = Path(directory)
        if dir_path.exists() and dir_path.is_dir():
            print(f"Scanning directory: {directory}")
            for filepath in dir_path.rglob('*'):
                p = str(filepath).lower()
                if filepath.is_file() and (p.endswith('.stl') or p.endswith('.3mf')):
                    print(f"  Found: {filepath.name}")
                    handler.process_file(str(filepath))

observer = None

def start_watching():
    global observer
    if observer:
        observer.stop()
        observer.join()
        
    settings = load_settings()
    directories = settings.get("directories", [])
    
    if not directories:
        return

    observer = Observer()
    event_handler = STLHandler()
    
    for directory in directories:
        if Path(directory).exists():
            observer.schedule(event_handler, directory, recursive=True)
            print(f"Started watching: {directory}")
            
    observer.start()
