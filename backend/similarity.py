import os
import sys
import threading
import urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
try:
    import onnxruntime as ort
except ImportError:
    ort = None

from database import load_models

CACHE_DIR = Path(__file__).resolve().parent / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

AI_MODELS_DIR = CACHE_DIR / "ai_models"
AI_MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = AI_MODELS_DIR / "dinov2_small_quantized.onnx"
MODEL_URL = "https://huggingface.co/Xenova/dinov2-small/resolve/main/onnx/model_quantized.onnx"
EMBEDDINGS_FILE = CACHE_DIR / "embeddings.npz"

_session = None
_session_lock = threading.Lock()
_embeddings_lock = threading.Lock()

# In-memory dictionary: model_id -> np.ndarray (shape: 384,)
_EMBEDDINGS_STORE = {}
_IS_INDEXING = False

# ImageNet normalization for DINOv2
NORM_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
NORM_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def load_embeddings_from_disk():
    global _EMBEDDINGS_STORE
    with _embeddings_lock:
        if EMBEDDINGS_FILE.exists():
            try:
                npz = np.load(EMBEDDINGS_FILE)
                _EMBEDDINGS_STORE = {k: npz[k] for k in npz.files}
            except Exception as e:
                print(f"[AI Vision] Error loading embeddings.npz: {e}")
                _EMBEDDINGS_STORE = {}

def save_embeddings_to_disk():
    with _embeddings_lock:
        try:
            if _EMBEDDINGS_STORE:
                np.savez_compressed(EMBEDDINGS_FILE, **_EMBEDDINGS_STORE)
        except Exception as e:
            print(f"[AI Vision] Error saving embeddings.npz: {e}")

# Load cached embeddings on startup
load_embeddings_from_disk()

def ensure_model_session():
    """Thread-safe lazy initialization of the ONNX Vision AI session."""
    global _session, ort
    if _session is not None:
        return _session

    with _session_lock:
        if _session is not None:
            return _session

        if ort is None:
            try:
                import subprocess
                print("[AI Vision] onnxruntime not found. Attempting automatic installation...")
                subprocess.run([sys.executable, "-m", "pip", "install", "onnxruntime"], capture_output=True, timeout=60)
                import onnxruntime as _ort
                ort = _ort
            except Exception as e:
                print(f"[AI Vision] onnxruntime is not available: {e}")
                return None

        if ort is None:
            return None

        if not MODEL_PATH.exists() or MODEL_PATH.stat().st_size < 10000000:
            print(f"[AI Vision] Downloading lightweight DINOv2 model ({MODEL_URL})...")
            try:
                urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
                print(f"[AI Vision] Downloaded DINOv2 model ({MODEL_PATH.stat().st_size / (1024*1024):.2f} MB)")
            except Exception as e:
                print(f"[AI Vision] Failed to download model: {e}")
                return None

        try:
            # Configure CPU execution provider
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = 2
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            _session = ort.InferenceSession(str(MODEL_PATH), sess_options=opts, providers=['CPUExecutionProvider'])
            print("[AI Vision] DINOv2 Small Vision Model loaded successfully on CPU.")
            return _session
        except Exception as e:
            print(f"[AI Vision] Failed to initialize ONNX session: {e}")
            return None

def compute_image_embedding(image_path: Path):
    """Computes a 384-dimensional normalized visual feature vector from a PNG/JPG image."""
    session = ensure_model_session()
    if session is None or not image_path.exists():
        return None

    try:
        with Image.open(image_path) as raw_img:
            img = raw_img.convert('RGB').resize((224, 224), Image.Resampling.BICUBIC)
            arr = np.array(img).astype(np.float32) / 255.0

        # Normalize with ImageNet mean/std
        arr = (arr - NORM_MEAN) / NORM_STD
        # Transpose from (H, W, C) to (C, H, W)
        arr = np.transpose(arr, (2, 0, 1))
        # Add batch dimension: (1, 3, 224, 224)
        tensor = np.expand_dims(arr, axis=0).astype(np.float32)

        input_name = session.get_inputs()[0].name
        out = session.run(None, {input_name: tensor})
        feat = out[0]  # Shape: (1, 257, 384) or (1, 384)

        if len(feat.shape) == 3:
            # Extract CLS token
            feat = feat[:, 0, :]

        # Normalize to unit length for fast cosine similarity via dot product
        norm = np.linalg.norm(feat, axis=-1, keepdims=True)
        if norm > 0:
            feat = feat / norm

        return feat.flatten().astype(np.float32)
    except Exception as e:
        print(f"[AI Vision] Error computing embedding for {image_path}: {e}")
        return None

def update_model_embedding(model_id: str, thumbnail_path: Path):
    """Computes and registers the embedding for a single model."""
    vec = compute_image_embedding(thumbnail_path)
    if vec is not None:
        with _embeddings_lock:
            _EMBEDDINGS_STORE[model_id] = vec
        save_embeddings_to_disk()
        return True
    return False

def get_similar_models(target_model_id: str, limit: int = 16, min_similarity: float = 0.40):
    """
    Finds models visually most similar to the target model.
    Returns list of {"id": model_id, "score": float, "percentage": int}.
    """
    ensure_model_session()
    
    with _embeddings_lock:
        if target_model_id not in _EMBEDDINGS_STORE:
            # Try to compute it on the fly if thumbnail exists
            thumb_path = CACHE_DIR / f"{target_model_id}.png"
            if thumb_path.exists():
                vec = compute_image_embedding(thumb_path)
                if vec is not None:
                    _EMBEDDINGS_STORE[target_model_id] = vec
                    save_embeddings_to_disk()

        if target_model_id not in _EMBEDDINGS_STORE:
            return []

        target_vec = _EMBEDDINGS_STORE[target_model_id]
        
        # Build candidate matrix
        model_ids = [mid for mid in _EMBEDDINGS_STORE.keys() if mid != target_model_id]
        if not model_ids:
            return []

        matrix = np.array([_EMBEDDINGS_STORE[mid] for mid in model_ids], dtype=np.float32)
        
        # Cosine similarity via dot product
        scores = np.dot(matrix, target_vec).flatten()

    # Pair with model IDs and filter
    matches = []
    for mid, score in zip(model_ids, scores):
        s = float(score)
        if s >= min_similarity:
            # Map score to clean percentage (DINOv2 cosine scores typically range 0.4 - 1.0)
            pct = int(min(100, max(0, round(s * 100))))
            matches.append({
                "id": mid,
                "score": round(s, 4),
                "percentage": pct
            })

    # Sort descending by similarity
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches[:limit]

def index_all_models_background():
    """Background worker to index all models currently in models.json that have thumbnails."""
    global _IS_INDEXING
    if _IS_INDEXING:
        return

    def worker():
        global _IS_INDEXING
        _IS_INDEXING = True
        try:
            print("[AI Vision] Starting background visual indexing...")
            ensure_model_session()
            models = load_models()
            updated = 0

            for mid, mdata in models.items():
                if mid not in _EMBEDDINGS_STORE:
                    thumb_path = CACHE_DIR / f"{mid}.png"
                    if thumb_path.exists():
                        vec = compute_image_embedding(thumb_path)
                        if vec is not None:
                            with _embeddings_lock:
                                _EMBEDDINGS_STORE[mid] = vec
                            updated += 1
                            if updated % 20 == 0:
                                save_embeddings_to_disk()

            if updated > 0:
                save_embeddings_to_disk()
            print(f"[AI Vision] Indexing complete. Indexed {updated} new models. Total indexed: {len(_EMBEDDINGS_STORE)}")
        except Exception as e:
            print(f"[AI Vision] Indexing error: {e}")
        finally:
            _IS_INDEXING = False

    t = threading.Thread(target=worker, daemon=True)
    t.start()

def get_ai_status():
    """Returns status metrics for AI similarity search."""
    models = load_models()
    return {
        "ready": _session is not None or MODEL_PATH.exists(),
        "model_name": "Meta DINOv2 Small (Quantized ONNX)",
        "indexed_count": len(_EMBEDDINGS_STORE),
        "total_models": len(models),
        "is_indexing": _IS_INDEXING
    }
