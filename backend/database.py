import json
import os
import threading
from pathlib import Path
from typing import Dict, Any, Callable, Optional, List

DB_DIR = Path(__file__).resolve().parent
SETTINGS_FILE = DB_DIR / "settings.json"
MODELS_FILE = DB_DIR / "models.json"

ROOT_DIR = DB_DIR.parent
LEGACY_SETTINGS = ROOT_DIR / "settings.json"
LEGACY_MODELS = ROOT_DIR / "models.json"

settings_lock = threading.RLock()
models_lock = threading.RLock()

def _load_settings_unlocked() -> dict:
    target = SETTINGS_FILE
    if (not target.exists() or target.stat().st_size == 0) and LEGACY_SETTINGS.exists() and LEGACY_SETTINGS.stat().st_size > 0:
        target = LEGACY_SETTINGS

    if not target.exists() or target.stat().st_size == 0:
        return {"directories": [], "slicers": [], "tag_colors": {}, "predefined_tags": [], "platform_accounts": {}}
    try:
        with open(target, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Migration from old format
            if "slicer_path" in data and "slicers" not in data:
                if data["slicer_path"]:
                    data["slicers"] = [{"name": "Default", "path": data["slicer_path"]}]
                else:
                    data["slicers"] = []
            if "slicers" not in data:
                data["slicers"] = []
            if "tag_colors" not in data:
                data["tag_colors"] = {}
            if "predefined_tags" not in data:
                data["predefined_tags"] = []
            if "platform_accounts" not in data:
                data["platform_accounts"] = {}
            return data
    except (json.JSONDecodeError, Exception):
        return {"directories": [], "slicers": [], "tag_colors": {}, "predefined_tags": [], "platform_accounts": {}}

def load_settings() -> dict:
    with settings_lock:
        return _load_settings_unlocked()

def _save_settings_unlocked(data: dict):
    tmp_file = DB_DIR / "settings.json.tmp"
    try:
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        tmp_file.replace(SETTINGS_FILE)
    except Exception:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

def save_settings(data: dict):
    with settings_lock:
        _save_settings_unlocked(data)

def _load_models_unlocked() -> dict:
    target = MODELS_FILE
    if (not target.exists() or target.stat().st_size == 0) and LEGACY_MODELS.exists() and LEGACY_MODELS.stat().st_size > 0:
        target = LEGACY_MODELS

    if not target.exists() or target.stat().st_size == 0:
        return {}
    try:
        with open(target, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, Exception):
        return {}

def load_models() -> dict:
    with models_lock:
        return _load_models_unlocked()

def _save_models_unlocked(data: dict):
    tmp_file = DB_DIR / "models.json.tmp"
    try:
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        tmp_file.replace(MODELS_FILE)
    except Exception:
        with open(MODELS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

def save_models(data: dict):
    with models_lock:
        _save_models_unlocked(data)

def upsert_model(model_id: str, model_data: dict):
    """Thread-safe atomic upsert for a single model in models.json."""
    with models_lock:
        models = _load_models_unlocked()
        models[model_id] = model_data
        _save_models_unlocked(models)

def remove_model(model_id: str) -> bool:
    """Thread-safe atomic removal of a model."""
    with models_lock:
        models = _load_models_unlocked()
        if model_id in models:
            del models[model_id]
            _save_models_unlocked(models)
            return True
        return False

def batch_upsert_models(new_models: dict):
    """Thread-safe atomic batch upsert."""
    if not new_models:
        return
    with models_lock:
        models = _load_models_unlocked()
        models.update(new_models)
        _save_models_unlocked(models)

def atomic_mutate_models(mutator_fn: Callable[[dict], Any]) -> Any:
    """Execute a function while holding the models lock and automatically persist changes."""
    with models_lock:
        models = _load_models_unlocked()
        result = mutator_fn(models)
        _save_models_unlocked(models)
        return result
