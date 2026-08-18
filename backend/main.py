from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import subprocess
from pathlib import Path
from database import load_settings, save_settings, load_models, save_models
from scanner import scan_all_directories, start_watching
from online_search import search_online_models
import os
import sys
import asyncio
import threading

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    import tkinter as tk
    from tkinter import filedialog
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE_DIR = Path(__file__).resolve().parent / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/cache", StaticFiles(directory=str(CACHE_DIR)), name="cache")

import threading
from fastapi import Response

@app.on_event("startup")
async def startup_event():
    def background_task():
        scan_all_directories()
        start_watching()
    threading.Thread(target=background_task, daemon=True).start()

class DirectoryAdd(BaseModel):
    path: str

@app.get("/api/models")
def get_models(response: Response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    models_db = load_models()
    models = list(models_db.values())
    models.sort(key=lambda x: x["added_at"], reverse=True)
    return models

@app.get("/api/online/search")
def api_online_search(q: str = "", platforms: str = "", page: int = 1, sort: str = "", mode: str = ""):
    plat_list = [p.strip().lower() for p in platforms.split(",") if p.strip()] if platforms else None
    return search_online_models(q.strip(), platforms=plat_list, page=page, sort=sort, mode=mode)

@app.get("/api/models/{model_id}/similar")
async def get_similar_models_endpoint(model_id: str, limit: int = 16, min_score: float = 0.35):
    try:
        from similarity import get_similar_models
        models = load_models()
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")

        matches = await asyncio.to_thread(get_similar_models, model_id, limit=limit, min_similarity=min_score)
        result = []
        for m in matches:
            mid = m["id"]
            if mid in models:
                item = dict(models[mid])
                item["similarity_score"] = m["score"]
                item["similarity_percentage"] = m["percentage"]
                result.append(item)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in similar models endpoint: {e}")
        return []

@app.get("/api/models/{model_id}/similar-online")
async def get_similar_online_models_endpoint(
    request: Request,
    model_id: str,
    q: str = "",
    limit: int = 24,
    min_score: float = 0.20
):
    try:
        from similarity import get_similar_online_models
        models = load_models()
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")

        cancel_event = threading.Event()

        # Monitor client disconnection asynchronously
        async def monitor_disconnect():
            while not cancel_event.is_set():
                if await request.is_disconnected():
                    cancel_event.set()
                    break
                await asyncio.sleep(0.2)

        disconnect_task = asyncio.create_task(monitor_disconnect())

        try:
            return await asyncio.to_thread(
                get_similar_online_models,
                model_id,
                custom_query=q,
                limit=limit,
                min_similarity=min_score,
                cancel_event=cancel_event
            )
        finally:
            cancel_event.set()
            disconnect_task.cancel()

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in similar online models endpoint: {e}")
        return {"query": q, "total_evaluated": 0, "matches": []}

@app.get("/api/ai/status")
def api_ai_status():
    try:
        from similarity import get_ai_status
        return get_ai_status()
    except Exception as e:
        print(f"Error in ai status endpoint: {e}")
        return {"ready": False, "error": str(e)}

@app.post("/api/ai/reindex")
def api_ai_reindex():
    try:
        from similarity import index_all_models_background
        index_all_models_background()
        return {"status": "started"}
    except Exception as e:
        print(f"Error starting ai reindexing: {e}")
        return {"status": "error", "error": str(e)}

@app.get("/api/settings")
def get_settings():
    return load_settings()

class PlatformAccountPayload(BaseModel):
    username: str
    password: Optional[str] = ""
    token: Optional[str] = ""

@app.get("/api/version")
def api_get_version():
    version_file = Path(__file__).resolve().parent.parent / "version.json"
    if version_file.exists():
        try:
            with open(version_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"version": "1.4.0", "name": "STL-Manager"}

@app.get("/api/accounts")
def api_get_accounts():
    try:
        from credentials import get_all_accounts_status
        return get_all_accounts_status()
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        return []

@app.post("/api/accounts/{platform}")
def api_save_account(platform: str, payload: PlatformAccountPayload):
    try:
        from credentials import save_platform_credential
        success = save_platform_credential(platform, payload.username, payload.password or "", payload.token or "")
        return {"status": "saved", "success": success}
    except Exception as e:
        print(f"Error saving account for {platform}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/accounts/{platform}/autofill")
def api_autofill_account(platform: str):
    try:
        from credentials import get_platform_credential
        cred = get_platform_credential(platform)
        if not cred:
            return {"found": False}
        return {
            "found": True,
            "username": cred.get("username", ""),
            "password": cred.get("password", ""),
            "token": cred.get("token", "")
        }
    except Exception as e:
        print(f"Error reading credentials for autofill ({platform}): {e}")
        return {"found": False, "error": str(e)}

@app.delete("/api/accounts/{platform}")
def api_delete_account(platform: str):
    try:
        from credentials import delete_platform_credential
        success = delete_platform_credential(platform)
        return {"status": "deleted", "success": success}
    except Exception as e:
        print(f"Error deleting account for {platform}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fs/list")
def list_fs(path: str = "", filter_ext: str = ""):
    items = []
    
    # Always include quick access paths
    home = Path.home()
    quick_access = [
        {"name": "Desktop", "path": str(home / "Desktop")},
        {"name": "Dokumente", "path": str(home / "Documents")},
        {"name": "Downloads", "path": str(home / "Downloads")},
        {"name": "Bilder", "path": str(home / "Pictures")},
        {"name": "Musik", "path": str(home / "Music")},
        {"name": "Videos", "path": str(home / "Videos")},
        {"name": "Home", "path": str(home)},
    ]
    # filter out paths that don't exist
    quick_access = [q for q in quick_access if Path(q["path"]).exists()]
    
    drives = []
    if sys.platform == "win32":
        import ctypes
        bitmask = ctypes.windll.kernel32.GetLogicalDrives()
        for i in range(26):
            if bitmask & (1 << i):
                drive = f"{chr(65 + i)}:\\"
                drives.append({"name": f"Lokaler Datenträger ({drive[:2]})", "path": drive, "is_dir": True})
    else:
        drives.append({"name": "Root", "path": "/", "is_dir": True})

    if not path or path == "":
        return {"current_path": "", "parent_path": "", "items": drives, "quick_access": quick_access, "drives": drives}
        
    p = Path(path)
    if not p.exists() or not p.is_dir():
        raise HTTPException(status_code=400, detail="Invalid path")
        
    try:
        parent_path = str(p.parent) if str(p.parent) != str(p) else ""
        if sys.platform == "win32" and p.anchor == str(p):
            parent_path = ""
            
        for entry in os.scandir(p):
            try:
                if entry.name.startswith('.') and entry.name != '..': continue
                is_dir = entry.is_dir(follow_symlinks=False)
                
                if not is_dir:
                    if filter_ext:
                        if not entry.name.lower().endswith(filter_ext.lower()):
                            continue
                
                stat = entry.stat(follow_symlinks=False)
                items.append({
                    "name": entry.name,
                    "path": entry.path,
                    "is_dir": is_dir,
                    "size": stat.st_size if not is_dir else 0,
                    "mtime": stat.st_mtime
                })
            except Exception:
                # Skip inaccessible files (e.g. permission denied)
                continue
            
        items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
        return {"current_path": str(p), "parent_path": parent_path, "items": items, "quick_access": quick_access, "drives": drives}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings/directories")
def add_directory(data: DirectoryAdd):
    settings = load_settings()
    if data.path not in settings["directories"]:
        if not Path(data.path).exists():
            raise HTTPException(status_code=400, detail="Directory does not exist")
        settings["directories"].append(data.path)
        save_settings(settings)
        def bg_task():
            scan_all_directories()
            start_watching()
        threading.Thread(target=bg_task, daemon=True).start()
    return settings

@app.delete("/api/settings/directories")
def delete_directory(data: DirectoryAdd):
    settings = load_settings()
    if data.path in settings["directories"]:
        settings["directories"].remove(data.path)
        save_settings(settings)
        start_watching()
    return settings

class SlicerItem(BaseModel):
    name: str
    path: str

@app.post("/api/settings/slicer")
def add_slicer(data: SlicerItem):
    settings = load_settings()
    settings["slicers"].append({"name": data.name, "path": data.path})
    save_settings(settings)
    return settings

@app.delete("/api/settings/slicer/{slicer_name}")
def remove_slicer(slicer_name: str):
    settings = load_settings()
    settings["slicers"] = [s for s in settings["slicers"] if s["name"] != slicer_name]
    save_settings(settings)
    return settings

@app.post("/api/database/clear")
def clear_database():
    save_models({})
    import shutil
    cache_dir = Path(".cache")
    if cache_dir.exists():
        shutil.rmtree(cache_dir)
    cache_dir.mkdir(exist_ok=True)
    threading.Thread(target=scan_all_directories, daemon=True).start()
    return {"status": "success"}

@app.get("/api/duplicates")
def get_duplicates():
    models = load_models()
    # Group models by their content_hash
    groups: dict = {}
    for model in models.values():
        h = model.get("content_hash")
        if not h:
            continue
        if h not in groups:
            groups[h] = []
        groups[h].append(model)
    # Only return groups with 2+ files (actual duplicates)
    duplicates = [group for group in groups.values() if len(group) > 1]
    return duplicates

def _delete_single_model(model_id: str, models: dict):
    if model_id in models:
        model = models[model_id]
        filepath = model.get("path")
        if filepath and Path(filepath).exists():
            try:
                os.remove(filepath)
                print(f"Deleted physical file from disk: {filepath}")
            except Exception as e:
                print(f"Failed to delete file {filepath}: {e}")
        # Clean cached thumbnails
        from scanner import CACHE_DIR
        for thumb in CACHE_DIR.glob(f"{model_id}_*.png"):
            try:
                os.remove(thumb)
            except Exception:
                pass
        del models[model_id]

@app.delete("/api/models/{model_id}")
def delete_model(model_id: str):
    models = load_models()
    if model_id in models:
        _delete_single_model(model_id, models)
        save_models(models)
    return {"status": "success"}

class BatchDeleteRequest(BaseModel):
    ids: list[str]

@app.post("/api/models/batch-delete")
def batch_delete_models(data: BatchDeleteRequest):
    models = load_models()
    deleted_count = 0
    for mid in data.ids:
        if mid in models:
            _delete_single_model(mid, models)
            deleted_count += 1
    save_models(models)
    return {"status": "success", "deleted": deleted_count}

class BatchStatusRequest(BaseModel):
    ids: list[str]
    status: str

@app.post("/api/models/batch-status")
def batch_status_models(data: BatchStatusRequest):
    models = load_models()
    updated_count = 0
    for mid in data.ids:
        if mid in models:
            models[mid]["status"] = data.status
            updated_count += 1
    save_models(models)
    return {"status": "success", "updated": updated_count}

class StatusUpdate(BaseModel):
    status: str

@app.put("/api/models/{model_id}/status")
def update_status(model_id: str, data: StatusUpdate):
    models = load_models()
    if model_id in models:
        models[model_id]["status"] = data.status
        save_models(models)
    return {"status": "success"}

class TagsUpdate(BaseModel):
    tags: list[str]

@app.put("/api/models/{model_id}/tags")
def update_tags(model_id: str, data: TagsUpdate):
    models = load_models()
    if model_id in models:
        # Normalize: lowercase, strip whitespace, remove empty, deduplicate
        cleaned = list(dict.fromkeys(t.strip().lower() for t in data.tags if t.strip()))
        models[model_id]["tags"] = cleaned
        save_models(models)
    return {"status": "success"}

@app.get("/api/tags")
def get_all_tags():
    """Returns all unique tags used across all models and predefined tags, sorted alphabetically."""
    models = load_models()
    settings = load_settings()
    all_tags = set(settings.get("predefined_tags", []))
    for m in models.values():
        for tag in m.get("tags", []):
            all_tags.add(tag)
    return sorted(all_tags)

class TagColorUpdate(BaseModel):
    color: str

@app.put("/api/tags/{tag_name}/color")
def update_tag_color(tag_name: str, data: TagColorUpdate):
    settings = load_settings()
    if "tag_colors" not in settings:
        settings["tag_colors"] = {}
    settings["tag_colors"][tag_name.lower()] = data.color
    save_settings(settings)
    return settings

class TagItem(BaseModel):
    name: str

@app.post("/api/settings/tags")
def add_tag(data: TagItem):
    settings = load_settings()
    tag = data.name.strip().lower()
    if not tag:
        return settings
    if "predefined_tags" not in settings:
        settings["predefined_tags"] = []
    if tag not in settings["predefined_tags"]:
        settings["predefined_tags"].append(tag)
        save_settings(settings)
    return settings

@app.delete("/api/settings/tags/{tag_name}")
def delete_tag(tag_name: str):
    settings = load_settings()
    tag = tag_name.lower()
    if "predefined_tags" in settings and tag in settings["predefined_tags"]:
        settings["predefined_tags"].remove(tag)
        save_settings(settings)
    
    models = load_models()
    changed = False
    for m in models.values():
        if "tags" in m and tag in m["tags"]:
            m["tags"].remove(tag)
            changed = True
    if changed:
        save_models(models)
    
    return {"status": "success"}

class ModelUrlUpdate(BaseModel):
    url: str

@app.put("/api/models/{model_id}/url")
def update_model_url(model_id: str, data: ModelUrlUpdate):
    models = load_models()
    if model_id in models:
        from scanner import clean_model_source_url, apply_auto_tags
        cleaned_url = clean_model_source_url(data.url) or data.url.strip()
        models[model_id]["source_url"] = cleaned_url
        apply_auto_tags(models[model_id], cleaned_url)
        save_models(models)
    return {"status": "success"}



class DownloadUrl(BaseModel):
    filename: str
    url: str

@app.post("/api/downloads/url")
def set_download_url(data: DownloadUrl):
    from scanner import DOWNLOAD_CACHE, load_downloads_map, save_downloads_map, clean_model_source_url
    if not data.filename or not data.url:
        return {"status": "ignored"}
    
    cleaned_url = clean_model_source_url(data.url) or data.url.strip()
    fname_clean = data.filename.strip()
    dmap = load_downloads_map()
    
    # Store multiple matching keys (exact, lowercase, stem)
    dmap[fname_clean] = cleaned_url
    dmap[fname_clean.lower()] = cleaned_url
    stem = Path(fname_clean).stem
    dmap[stem] = cleaned_url
    dmap[stem.lower()] = cleaned_url
    
    DOWNLOAD_CACHE.update(dmap)
    save_downloads_map(dmap)
    print(f"  [Chrome-Extension] Recorded source URL: {fname_clean} -> {cleaned_url}")
    return {"status": "success"}

@app.get("/api/download/{model_id}")
def download_model(model_id: str):
    models = load_models()
    if model_id not in models:
        raise HTTPException(status_code=404, detail="Model not found")
    model_path = models[model_id]["path"]
    p = Path(model_path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(str(p), filename=p.name)

class SliceRequest(BaseModel):
    slicer_path: str

@app.post("/api/slice/{model_id}")
def slice_model(model_id: str, request: SliceRequest):
    models = load_models()
    if model_id not in models:
        raise HTTPException(status_code=404, detail="Model not found")
        
    model_path = models[model_id]["path"]
    slicer_path = request.slicer_path
    
    if not slicer_path:
        raise HTTPException(status_code=400, detail="Kein Slicer hinterlegt. Bitte füge in den Einstellungen einen Slicer hinzu.")
        
    try:
        subprocess.Popen(f'"{slicer_path}" "{model_path}"')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/open-folder/{model_id}")
def open_folder(model_id: str):
    models = load_models()
    if model_id not in models:
        raise HTTPException(status_code=404, detail="Model not found")
        
    model_path = models[model_id]["path"]
    path_obj = Path(model_path)
    if not path_obj.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    try:
        if sys.platform == "win32":
            subprocess.Popen(f'explorer /select,"{str(path_obj)}"')
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", str(path_obj)])
        else:
            subprocess.Popen(["xdg-open", str(path_obj.parent)])
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve Frontend static build if present (for Portable / standalone mode)
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
