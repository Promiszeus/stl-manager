import json
import os
import threading
from pathlib import Path

SETTINGS_FILE = Path("settings.json")
MODELS_FILE = Path("models.json")

settings_lock = threading.Lock()
models_lock = threading.Lock()

def load_settings():
    if not SETTINGS_FILE.exists() or SETTINGS_FILE.stat().st_size == 0:
        return {"directories": [], "slicers": []}
    try:
        with open(SETTINGS_FILE, "r") as f:
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
            return data
    except json.JSONDecodeError:
        return {"directories": [], "slicers": [], "tag_colors": {}}

def save_settings(data):
    with settings_lock:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(data, f, indent=4)

def load_models():
    if not MODELS_FILE.exists() or MODELS_FILE.stat().st_size == 0:
        return {}
    try:
        with open(MODELS_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def save_models(data):
    with models_lock:
        with open(MODELS_FILE, "w") as f:
            json.dump(data, f, indent=4)
