import json
import os
import threading
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent
SETTINGS_FILE = DB_DIR / "settings.json"
MODELS_FILE = DB_DIR / "models.json"

ROOT_DIR = DB_DIR.parent
LEGACY_SETTINGS = ROOT_DIR / "settings.json"
LEGACY_MODELS = ROOT_DIR / "models.json"

settings_lock = threading.Lock()
models_lock = threading.Lock()

def load_settings():
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

def save_settings(data):
    with settings_lock:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

def load_models():
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

def save_models(data):
    with models_lock:
        with open(MODELS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
