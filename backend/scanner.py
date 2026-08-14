import os
import re
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path
from database import load_settings, load_models, save_models
from thumbnailer import generate_thumbnail
import time
import hashlib
import threading
import sys

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

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

DOWNLOADS_MAP_FILE = Path(".cache/downloads_map.json")

def load_downloads_map():
    if DOWNLOADS_MAP_FILE.exists():
        try:
            with open(DOWNLOADS_MAP_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_downloads_map(dmap):
    try:
        DOWNLOADS_MAP_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(DOWNLOADS_MAP_FILE, "w", encoding="utf-8") as f:
            json.dump(dmap, f, indent=2)
    except Exception:
        pass

DOWNLOAD_CACHE = load_downloads_map()

def clean_model_source_url(url: str):
    """Converts CDN direct file links and raw API URLs to the actual model presentation page."""
    if not url or not isinstance(url, str):
        return None
    url = url.strip()

    # 1. Printables CDN: files.printables.com/media/prints/610638/stls/... -> https://www.printables.com/model/610638
    m_printables = re.search(r'printables\.com/(?:media/)?prints/(\d+)', url)
    if m_printables:
        return f"https://www.printables.com/model/{m_printables.group(1)}"
    if "printables.com/model/" in url:
        return url

    # 2. MakerWorld CDN or direct link: makerworld.bblmw.com/... or makerworld.com/models/12345
    m_mw = re.search(r'makerworld\.com/(?:[a-z]{2}/)?models/(\d+)', url)
    if m_mw:
        return f"https://makerworld.com/en/models/{m_mw.group(1)}"
    m_mw_cdn_inst = re.search(r'makerworld\.bblmw\.com/makerworld/model/[^/]+/(\d+)/', url)
    if m_mw_cdn_inst:
        return f"https://makerworld.com/en/models/{m_mw_cdn_inst.group(1)}"
    m_mw_cdn = re.search(r'makerworld\.bblmw\.com/.*?(?:design|model)/([A-Za-z0-9]+)', url)
    if m_mw_cdn and m_mw_cdn.group(1).isdigit():
        return f"https://makerworld.com/en/models/{m_mw_cdn.group(1)}"

    # 3. Thingiverse CDN or direct link: api.thingiverse.com/things/12345/files or thing:12345
    m_thing = re.search(r'thingiverse\.com/(?:things/|thing:)(\d+)', url)
    if m_thing:
        return f"https://www.thingiverse.com/thing:{m_thing.group(1)}"

    # 4. Cults3D CDN or model link
    if "cults3d.com" in url:
        m_cults = re.search(r'cults3d\.com/([a-z]{2}/3d-model/[^?#]+)', url)
        if m_cults:
            return f"https://cults3d.com/{m_cults.group(1)}"

    # 5. MakerOnline
    m_mo = re.search(r'makeronline\.com/model/([^?#]+)', url)
    if m_mo:
        return f"https://www.makeronline.com/model/{m_mo.group(1)}"

    # 6. Creality Cloud
    m_cc = re.search(r'crealitycloud\.com/model-detail/([a-zA-Z0-9]+)', url)
    if m_cc:
        return f"https://www.crealitycloud.com/model-detail/{m_cc.group(1)}"

    if not is_valid_specific_url(url):
        return None

    return url

def is_valid_specific_url(url: str):
    """Returns True only if the URL is a specific model page and not just a homepage."""
    if not url or not isinstance(url, str):
        return False
    url_clean = url.strip().rstrip("/")
    # Check if URL has a path beyond the domain
    parts = url_clean.split("://", 1)[-1].split("/")
    if len(parts) <= 1:
        return False
    # If the only path is 'en' or 'de'
    if len(parts) == 2 and parts[1] in ("en", "de", "index.html", ""):
        return False
    return True

def get_source_url(filepath: str):
    """Reads the exact download URL from Chrome extension cache or Windows Zone.Identifier."""
    path_obj = Path(filepath)
    filename = path_obj.name.lower()
    stem = path_obj.stem.lower()
    parent_name = path_obj.parent.name.lower()

    # 1. Check persistent cache (exact filename, stem, or normalized)
    dmap = load_downloads_map()
    dmap.update(DOWNLOAD_CACHE)

    for candidate in (filename, stem, parent_name):
        if candidate in dmap:
            cleaned = clean_model_source_url(dmap[candidate])
            if cleaned:
                return cleaned

    # Partial / prefix match in cache
    for key, raw_url in dmap.items():
        cleaned = clean_model_source_url(raw_url)
        if cleaned:
            k_lower = key.lower()
            if stem in k_lower or k_lower in stem or parent_name in k_lower:
                return cleaned
        
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
        
        # Check referrer first, then host
        for u in (referrer, host):
            if u:
                cleaned = clean_model_source_url(u)
                if cleaned:
                    return cleaned
        return None
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
        
        # Determine rel_path
        settings = load_settings()
        directories = settings.get("directories", [])
        rel_path = ""
        for d in directories:
            try:
                base = Path(d).resolve()
                res_path = path_obj.resolve()
                if res_path.is_relative_to(base):
                    rel = res_path.parent.relative_to(base).as_posix()
                    if rel == ".":
                        rel_path = base.name
                    else:
                        rel_path = f"{base.name}/{rel}"
                    break
            except Exception:
                pass

        mtime = path_obj.stat().st_mtime
        if file_id not in models or existing_entry.get("thumbnails") != thumbnails_list or existing_entry.get("source_url") != new_source_url or existing_entry.get("rel_path") != rel_path or existing_entry.get("modified_at") != mtime:
            model_entry = {
                "id": file_id,
                "name": path_obj.name,
                "path": str(path_obj),
                "rel_path": rel_path,
                "size_kb": round(path_obj.stat().st_size / 1024, 1),
                "thumbnails": thumbnails_list,
                "content_hash": get_content_hash(str(path_obj)),
                "status": existing_entry.get("status", "Not Printed"),
                "tags": existing_entry.get("tags", []),
                "source_url": new_source_url,
                "added_at": existing_entry.get("added_at", time.time()),
                "modified_at": mtime
            }
            # Auto-tag if new url is found
            if new_source_url and new_source_url != existing_entry.get("source_url"):
                apply_auto_tags(model_entry, new_source_url)
            
            models[file_id] = model_entry
            save_models(models)
            print(f"  Saved: {path_obj.name}")

def cleanup_existing_source_urls():
    """Migrates any legacy CDN/direct-file URLs in models.json to proper model overview pages."""
    try:
        models = load_models()
        changed = False
        for mid, model in models.items():
            surl = model.get("source_url")
            if surl:
                cleaned = clean_model_source_url(surl)
                if cleaned and cleaned != surl:
                    model["source_url"] = cleaned
                    apply_auto_tags(model, cleaned)
                    changed = True
                elif not cleaned and surl:
                    fpath = model.get("path")
                    if fpath:
                        better = get_source_url(fpath)
                        if better and better != surl:
                            model["source_url"] = better
                            apply_auto_tags(model, better)
                            changed = True
        if changed:
            save_models(models)
            print("  Cleaned up legacy model source URLs in database.")
    except Exception as e:
        print(f"Error cleaning legacy URLs: {e}")

def scan_all_directories():
    cleanup_existing_source_urls()
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
