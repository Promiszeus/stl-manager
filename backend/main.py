from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import subprocess
from pathlib import Path
from database import load_settings, save_settings, load_models, save_models
from scanner import scan_all_directories, start_watching
import os
import sys

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

Path(".cache").mkdir(exist_ok=True)
app.mount("/cache", StaticFiles(directory=".cache"), name="cache")

import threading

@app.on_event("startup")
async def startup_event():
    def background_task():
        scan_all_directories()
        start_watching()
    threading.Thread(target=background_task, daemon=True).start()

class DirectoryAdd(BaseModel):
    path: str

@app.get("/api/models")
def get_models():
    models_db = load_models()
    models = list(models_db.values())
    models.sort(key=lambda x: x["added_at"], reverse=True)
    return models

@app.get("/api/settings")
def get_settings():
    return load_settings()

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
        models[model_id]["source_url"] = data.url
        from scanner import apply_auto_tags
        apply_auto_tags(models[model_id], data.url)
        save_models(models)
    return {"status": "success"}



class DownloadUrl(BaseModel):
    filename: str
    url: str

@app.post("/api/downloads/url")
def set_download_url(data: DownloadUrl):
    from scanner import DOWNLOAD_CACHE
    DOWNLOAD_CACHE[data.filename] = data.url
    return {"status": "success"}

@app.get("/api/download/{model_id}")
def download_model(model_id: str):
    models = load_models()
    if model_id not in models:
        raise HTTPException(status_code=404, detail="Model not found")
    model_path = models[model_id]["path"]
    if not Path(model_path).exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(model_path)

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
