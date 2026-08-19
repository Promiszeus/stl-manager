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

import unicodedata

# Limit concurrent thumbnail renders to avoid RAM/GPU exhaustion on large folders
RENDER_SEMAPHORE = threading.Semaphore(2)

CACHE_DIR = Path(__file__).resolve().parent / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOADS_MAP_FILE = CACHE_DIR / "downloads_map.json"

SUPPORTED_3D_EXTENSIONS = ('.stl', '.3mf')

def get_file_hash(filepath):
    """MD5 hash of normalized file PATH - stable unique ID per location across Windows path variants."""
    norm = unicodedata.normalize('NFC', os.path.normcase(os.path.abspath(filepath)))
    return hashlib.md5(norm.encode('utf-8')).hexdigest()

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
        elif "crealitycloud" in domain:
            tag = "Creality Cloud"
            
        if tag:
            tags = model_entry.get("tags", [])
            if tag not in tags:
                tags.append(tag)
                model_entry["tags"] = tags
    except Exception:
        pass

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
    """Converts CDN direct file links, raw API URLs, and incomplete URLs to the actual model presentation page."""
    if not url or not isinstance(url, str):
        return None
    url = url.strip()

    # Ensure URL has scheme if starting with domain
    if not re.match(r'^https?://', url, re.I):
        if url.startswith('www.') or any(p in url.lower() for p in ['makerworld.com', 'printables.com', 'thingiverse.com', 'cults3d.com', 'makeronline.com', 'crealitycloud.com', 'thangs.com']):
            url = f"https://{url}"
        else:
            return None

    # 1. Printables
    m_printables = re.search(r'printables\.com/(?:media/)?prints/(\d+)', url, re.I)
    if m_printables:
        return f"https://www.printables.com/model/{m_printables.group(1)}"
    if "printables.com/model/" in url:
        return url.split('?')[0].split('#')[0]

    # 2. MakerWorld
    m_mw = re.search(r'makerworld\.com/(?:[a-z]{2}/)?models/(\d+)', url, re.I)
    if m_mw:
        return f"https://makerworld.com/en/models/{m_mw.group(1)}"
    m_mw_cdn_inst = re.search(r'makerworld\.bblmw\.com/makerworld/model/[^/]+/(\d+)/', url, re.I)
    if m_mw_cdn_inst:
        return f"https://makerworld.com/en/models/{m_mw_cdn_inst.group(1)}"
    m_mw_cdn = re.search(r'makerworld\.bblmw\.com/.*?(?:design|model)/([A-Za-z0-9]+)', url, re.I)
    if m_mw_cdn and m_mw_cdn.group(1).isdigit():
        return f"https://makerworld.com/en/models/{m_mw_cdn.group(1)}"

    # 3. Thingiverse
    m_thing = re.search(r'thingiverse\.com/(?:things/|thing:)(\d+)', url, re.I)
    if m_thing:
        return f"https://www.thingiverse.com/thing:{m_thing.group(1)}"

    # 4. Cults3D
    if "cults3d.com" in url:
        m_cults = re.search(r'cults3d\.com/([a-z]{2}/3d-model/[^?#]+)', url, re.I)
        if m_cults:
            return f"https://cults3d.com/{m_cults.group(1)}"
        m_cults_nolang = re.search(r'cults3d\.com/(3d-model/[^?#]+)', url, re.I)
        if m_cults_nolang:
            return f"https://cults3d.com/en/{m_cults_nolang.group(1)}"

    # 5. MakerOnline
    m_mo = re.search(r'makeronline\.com/(?:[a-z]{2}/)?model/([^?#]+)', url, re.I)
    if m_mo:
        return f"https://www.makeronline.com/en/model/{m_mo.group(1)}"

    # 6. Creality Cloud
    m_cc = re.search(r'crealitycloud\.com/(?:[a-z]{2}/)?model-detail/([a-zA-Z0-9]+)', url, re.I)
    if m_cc:
        return f"https://www.crealitycloud.com/model-detail/{m_cc.group(1)}"

    # 7. Thangs
    if "thangs.com" in url:
        return url.split('?')[0]

    if not is_valid_specific_url(url):
        return None

    return url

def is_valid_specific_url(url: str):
    """Returns True only if the URL is a specific model page and not just a homepage."""
    if not url or not isinstance(url, str):
        return False
    url_clean = url.strip().rstrip("/")
    parts = url_clean.split("://", 1)[-1].split("/")
    if len(parts) <= 1:
        return False
    if len(parts) == 2 and parts[1] in ("en", "de", "index.html", ""):
        return False
    return True

def extract_3mf_source_url(filepath: str) -> str:
    """Extracts source URL or MakerWorld design ID embedded in 3MF archive metadata."""
    import zipfile
    if not str(filepath).lower().endswith('.3mf'):
        return None
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            namelist = z.namelist()

            # 1. Check Metadata/*.config, *.json, *.xml (MakerWorld / Bambu Studio / OrcaSlicer)
            config_files = [n for n in namelist if n.lower().startswith('metadata/') and n.lower().endswith(('.config', '.json', '.xml'))]
            for cname in config_files:
                try:
                    content = z.read(cname).decode('utf-8', errors='ignore')
                    # <origin_url>, <url>, <model_url>, <source> tags
                    m_url = re.search(r'<(?:origin_url|url|model_url|source)>([^<]+)</(?:origin_url|url|model_url|source)>', content, re.I)
                    if m_url:
                        cleaned = clean_model_source_url(m_url.group(1).strip())
                        if cleaned:
                            return cleaned
                    # MakerWorld design_id or model_id
                    m_id = re.search(r'<(?:design_id|model_id)>(\d+)</(?:design_id|model_id)>', content, re.I)
                    if m_id:
                        return f"https://makerworld.com/en/models/{m_id.group(1)}"
                except Exception:
                    pass

            # 2. Check 3D/3dmodel.model (3MF Core XML Metadata)
            model_files = [n for n in namelist if n.lower().endswith('.model')]
            for mname in model_files:
                try:
                    content = z.read(mname).decode('utf-8', errors='ignore')
                    m_meta = re.search(r'<metadata[^>]+name=["\'](?:Url|origin_url|Source|Website|Link)["\'][^>]*>([^<]+)</metadata>', content, re.I)
                    if m_meta:
                        cleaned = clean_model_source_url(m_meta.group(1).strip())
                        if cleaned:
                            return cleaned
                except Exception:
                    pass

            # 3. Fallback scan for known platform URLs anywhere in metadata text
            for fname in namelist:
                if fname.lower().endswith(('.xml', '.config', '.txt', '.info', '.json', '.rels')):
                    try:
                        content = z.read(fname).decode('utf-8', errors='ignore')
                        patterns = [
                            r'https?://(?:www\.)?makerworld\.com/(?:[a-z]{2}/)?models/\d+',
                            r'https?://(?:www\.)?printables\.com/model/\d+[^"\'\s<>]*',
                            r'https?://(?:www\.)?thingiverse\.com/thing:\d+',
                            r'https?://(?:www\.)?cults3d\.com/[a-z]{2}/3d-model/[^"\'\s<>]+',
                            r'https?://(?:www\.)?makeronline\.com/model/[^"\'\s<>]+',
                            r'https?://(?:www\.)?crealitycloud\.com/model-detail/[^"\'\s<>]+',
                            r'https?://(?:www\.)?thangs\.com/designer/[^"\'\s<>]+',
                        ]
                        for pat in patterns:
                            m_found = re.search(pat, content, re.I)
                            if m_found:
                                cleaned = clean_model_source_url(m_found.group(0))
                                if cleaned:
                                    return cleaned
                    except Exception:
                        pass
    except Exception:
        pass
    return None

def parse_url_file(candidate: Path) -> str:
    """Parses .url, .webloc, .desktop, or companion .txt files for valid model URLs."""
    try:
        content = candidate.read_text(encoding='utf-8', errors='ignore')
        # Windows .url file: URL=https://...
        m_ini = re.search(r'^\s*URL\s*=\s*(https?://[^\r\n\s]+)', content, re.M | re.I)
        if m_ini:
            cleaned = clean_model_source_url(m_ini.group(1).strip())
            if cleaned:
                return cleaned
        # macOS .webloc: <string>https://...</string>
        m_webloc = re.search(r'<string>(https?://[^<]+)</string>', content, re.I)
        if m_webloc:
            cleaned = clean_model_source_url(m_webloc.group(1).strip())
            if cleaned:
                return cleaned
        # Any URL in file
        urls = re.findall(r'https?://[^\s"\'<>]+', content)
        for u in urls:
            cleaned = clean_model_source_url(u.strip())
            if cleaned:
                return cleaned
    except Exception:
        pass
    return None

def extract_companion_source_url(filepath: str) -> str:
    """Searches for companion .url, .webloc, .txt, or .json files in the model's folder."""
    try:
        path_obj = Path(filepath)
        parent = path_obj.parent
        stem = path_obj.stem

        # 1. Stem-matched files: ModelName.url, ModelName.txt, etc.
        for ext in ('.url', '.URL', '.webloc', '.desktop', '.txt', '.json'):
            candidate = parent / f"{stem}{ext}"
            if candidate.exists() and candidate.is_file():
                found = parse_url_file(candidate)
                if found:
                    return found

        # 2. Well-known companion names in parent folder
        companion_names = [
            'source.url', 'link.url', 'model.url', 'url.url', 'makerworld.url', 'printables.url', 'thingiverse.url',
            'source.txt', 'url.txt', 'link.txt', 'info.txt', 'readme.txt', 'description.txt', 'source.json', 'info.json'
        ]
        for cname in companion_names:
            candidate = parent / cname
            if candidate.exists() and candidate.is_file():
                found = parse_url_file(candidate)
                if found:
                    return found

        # 3. Any .url file in parent folder
        for uf in parent.glob('*.url'):
            if uf.is_file():
                found = parse_url_file(uf)
                if found:
                    return found
    except Exception:
        pass
    return None

def get_source_url(filepath: str):
    """Multi-tiered source URL extraction: .3MF metadata -> companion files -> extension cache -> Zone.Identifier."""
    path_obj = Path(filepath)
    filename = path_obj.name.lower()
    stem = path_obj.stem.lower()
    parent_name = path_obj.parent.name.lower()

    # 1. Extract from .3MF metadata
    if str(filepath).lower().endswith('.3mf'):
        mf_url = extract_3mf_source_url(filepath)
        if mf_url:
            return mf_url

    # 2. Extract from companion .url / .txt files in same directory
    comp_url = extract_companion_source_url(filepath)
    if comp_url:
        return comp_url

    # 3. Persistent browser extension downloads map
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
        
    # 4. Windows Zone.Identifier
    import sys
    if sys.platform == "win32":
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
        except Exception:
            pass
    return None

class STLHandler(FileSystemEventHandler):
    def _is_3d_file(self, path: str) -> bool:
        p = path.lower()
        return any(p.endswith(ext) for ext in SUPPORTED_3D_EXTENSIONS)

    def on_created(self, event):
        if not event.is_directory and self._is_3d_file(event.src_path):
            threading.Thread(target=self.delayed_process, args=(event.src_path,), daemon=True).start()

    def on_modified(self, event):
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
        # Wait 1.5 seconds to ensure file write/copy is completed
        time.sleep(1.5)
        try:
            p = Path(filepath)
            if p.exists() and p.is_file() and p.stat().st_size > 0:
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
        
        # Trigger AI vision embedding in background
        if existing:
            try:
                from similarity import update_model_embedding
                threading.Thread(target=update_model_embedding, args=(file_id, existing[0]), daemon=True).start()
            except Exception:
                pass

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

        try:
            mtime = path_obj.stat().st_mtime
            file_size_kb = round(path_obj.stat().st_size / 1024, 1)
        except Exception:
            mtime = time.time()
            file_size_kb = 0.0

        if file_id not in models or existing_entry.get("thumbnails") != thumbnails_list or existing_entry.get("source_url") != new_source_url or existing_entry.get("rel_path") != rel_path or existing_entry.get("modified_at") != mtime:
            model_entry = {
                "id": file_id,
                "name": path_obj.name,
                "path": str(path_obj),
                "rel_path": rel_path,
                "size_kb": file_size_kb,
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
    """Migrates legacy CDN/direct-file URLs and discovers missing URLs for all models in models.json."""
    try:
        models = load_models()
        changed = False
        for mid, model in models.items():
            surl = model.get("source_url")
            fpath = model.get("path")
            if surl:
                cleaned = clean_model_source_url(surl)
                if cleaned and cleaned != surl:
                    model["source_url"] = cleaned
                    apply_auto_tags(model, cleaned)
                    changed = True
                elif not cleaned and surl and fpath and Path(fpath).exists():
                    better = get_source_url(fpath)
                    if better and better != surl:
                        model["source_url"] = better
                        apply_auto_tags(model, better)
                        changed = True
            elif fpath and Path(fpath).exists():
                discovered = get_source_url(fpath)
                if discovered:
                    model["source_url"] = discovered
                    apply_auto_tags(model, discovered)
                    changed = True
        if changed:
            save_models(models)
            print("  Cleaned up & auto-discovered model source URLs in database.")
    except Exception as e:
        print(f"Error cleaning legacy URLs: {e}")

def scan_all_directories():
    cleanup_existing_source_urls()
    settings = load_settings()
    handler = STLHandler()
    
    # 0. Prune models with unsupported extensions (non-.stl/.3mf)
    try:
        models = load_models()
        changed = False
        for mid, model in list(models.items()):
            fpath = model.get("path")
            if not fpath:
                del models[mid]
                changed = True
                continue
            lower_path = fpath.strip().lower()
            if not any(lower_path.endswith(ext) for ext in SUPPORTED_3D_EXTENSIONS):
                print(f"  [Prune] Removing unsupported format from DB: {model.get('name')}")
                del models[mid]
                changed = True
                continue
        if changed:
            save_models(models)
    except Exception as e:
        print(f"Error pruning models: {e}")

    # 1. Check existing database models and auto-repair any with missing thumbnail files on disk
    try:
        models = load_models()
        for mid, model in list(models.items()):
            fpath = model.get("path")
            if fpath and Path(fpath).exists():
                thumbs = model.get("thumbnails", [])
                needs_repair = not thumbs
                if not needs_repair:
                    # Verify thumbnail files exist in CACHE_DIR
                    for t in thumbs:
                        fname = t.split("/")[-1]
                        if not (CACHE_DIR / fname).exists():
                            needs_repair = True
                            break
                if needs_repair:
                    print(f"  [Auto-Repair] Regenerating missing thumbnail for: {model.get('name')}")
                    handler.process_file(fpath)
    except Exception as e:
        print(f"Error repairing thumbnails: {e}")

    # 2. Scan all monitored directories on disk (using os.walk with robust path normalization)
    for directory in settings.get("directories", []):
        if not os.path.exists(directory) or not os.path.isdir(directory):
            print(f"Directory not accessible or not found: {directory}")
            continue
        print(f"Scanning directory: {directory}")
        try:
            visited_dirs = set()
            for root, dirs, files in os.walk(directory, topdown=True, followlinks=True):
                norm_root = os.path.normcase(os.path.abspath(root))
                if norm_root in visited_dirs:
                    dirs[:] = []
                    continue
                visited_dirs.add(norm_root)

                # Skip hidden, system, and recycle bin directories
                dirs[:] = [d for d in dirs if not d.startswith('.') and not d.startswith('$') and d.lower() != 'system volume information']
                for filename in files:
                    lower = filename.lower()
                    if any(lower.endswith(ext) for ext in SUPPORTED_3D_EXTENSIONS):
                        filepath = os.path.join(root, filename)
                        try:
                            handler.process_file(filepath)
                        except Exception as file_err:
                            print(f"  Error processing file {filename}: {file_err}")
        except Exception as dir_err:
            print(f"Error walking directory {directory}: {dir_err}")

    # 3. Trigger AI vision indexing for any unindexed models
    try:
        from similarity import index_all_models_background
        index_all_models_background()
    except Exception as e:
        print(f"Failed to start AI indexing: {e}")

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
