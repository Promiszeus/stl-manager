import os
import sys
import threading
import urllib.request
from pathlib import Path
import io
import re
import requests
import concurrent.futures
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
_embeddings_lock = threading.RLock()

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

def compute_image_embedding_from_bytes(data: bytes):
    """Computes a 384-dimensional normalized visual feature vector directly from image bytes in-memory."""
    session = ensure_model_session()
    if session is None or not data:
        return None

    try:
        with Image.open(io.BytesIO(data)) as raw_img:
            img = raw_img.convert('RGB').resize((224, 224), Image.Resampling.BICUBIC)
            arr = np.array(img).astype(np.float32) / 255.0

        arr = (arr - NORM_MEAN) / NORM_STD
        arr = np.transpose(arr, (2, 0, 1))
        tensor = np.expand_dims(arr, axis=0).astype(np.float32)

        input_name = session.get_inputs()[0].name
        out = session.run(None, {input_name: tensor})
        feat = out[0]

        if len(feat.shape) == 3:
            feat = feat[:, 0, :]

        norm = np.linalg.norm(feat, axis=-1, keepdims=True)
        if norm > 0:
            feat = feat / norm

        return feat.flatten().astype(np.float32)
    except Exception as e:
        return None

def compute_image_embedding_from_url(url: str, timeout: int = 4):
    """Fetches image from URL in memory and computes its visual feature vector."""
    if not url:
        return None
    try:
        resp = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        if resp.status_code == 200 and resp.content:
            return compute_image_embedding_from_bytes(resp.content)
    except Exception:
        pass
    return None

PLATFORM_NOISE_WORDS = {"makerworld", "printables", "thingiverse", "cults", "cults3d", "creality", "makeronline", "bambulab", "anycubic", "prusa", "crealitycloud"}

def extract_keywords_from_model(model_data: dict) -> str:
    """Extracts clean, descriptive search keywords from a model's name, folder, and tags."""
    name = model_data.get("name", "")
    # Strip file extension
    name_clean = re.sub(r'\.(stl|3mf|obj|step|stp|gcode|lys|ctb)$', '', name, flags=re.IGNORECASE)
    # Remove special punctuation and noise words
    name_clean = re.sub(r'[_\-\+\.\(\)\[\]]+', ' ', name_clean)
    name_clean = re.sub(r'\b(v\d+|\d+mm|\d+cm|final|fixed|repaired|supported|nosupport|model)\b', '', name_clean, flags=re.IGNORECASE)
    
    parts = [w.strip() for w in name_clean.split() if len(w.strip()) > 1 and w.lower() not in PLATFORM_NOISE_WORDS]
    
    tags = model_data.get("tags", [])
    if tags:
        for t in tags[:2]:
            t_clean = t.strip()
            if t_clean and t_clean.lower() not in PLATFORM_NOISE_WORDS and t_clean.lower() not in [p.lower() for p in parts]:
                parts.append(t_clean)
                
    if not parts:
        rel = model_data.get("rel_path", "")
        if rel:
            folder = Path(rel).parent.name
            if folder and folder.lower() not in ["3d", "models", "stl", "print", "test", *PLATFORM_NOISE_WORDS]:
                parts.append(folder)
                
    return " ".join(parts[:4]) if parts else "3D model"

def get_similar_online_models(
    target_model_id: str,
    custom_query: str = None,
    limit: int = 24,
    min_similarity: float = 0.20,
    cancel_event: threading.Event = None
):
    """
    Hybrid AI Visual Similarity Search for Online Repositories:
    1. Obtains reference DINOv2 embedding for the local target model.
    2. Discovers online candidate models across all 6 platforms.
    3. Concurrently downloads candidate thumbnails in-memory & computes DINOv2 embeddings.
    4. Computes exact cosine visual similarity & returns candidates ranked by match score.
    Supports cooperative cancellation via cancel_event.
    """
    from database import load_models
    from online_search import search_online_models

    ensure_model_session()
    models = load_models()
    if target_model_id not in models:
        return {"query": "", "total_evaluated": 0, "matches": []}

    target_model = models[target_model_id]

    # Ensure target embedding is available
    target_vec = None
    with _embeddings_lock:
        if target_model_id in _EMBEDDINGS_STORE:
            target_vec = _EMBEDDINGS_STORE[target_model_id]

    if target_vec is None:
        thumb_path = CACHE_DIR / f"{target_model_id}_0.png"
        if not thumb_path.exists():
            thumb_path = CACHE_DIR / f"{target_model_id}.png"
        if thumb_path.exists():
            vec = compute_image_embedding(thumb_path)
            if vec is not None:
                with _embeddings_lock:
                    _EMBEDDINGS_STORE[target_model_id] = vec
                save_embeddings_to_disk()
                target_vec = vec

    if target_vec is None:
        return {"query": "", "total_evaluated": 0, "matches": []}

    if cancel_event and cancel_event.is_set():
        return {"query": "", "total_evaluated": 0, "matches": []}

    # Determine search query keywords
    search_query = (custom_query.strip() if custom_query and custom_query.strip() else extract_keywords_from_model(target_model))
    if not search_query:
        search_query = target_model.get("name", "3d model")

    # Step 1: Fetch candidate models across all 6 platforms
    try:
        candidates_result = search_online_models(search_query, platforms=None, page=1, sort="popular")
        if isinstance(candidates_result, dict):
            candidate_models = candidates_result.get("models", [])
        elif isinstance(candidates_result, list):
            candidate_models = candidates_result
        else:
            candidate_models = []
    except Exception as e:
        print(f"[AI Vision] Error fetching online candidates: {e}")
        candidate_models = []

    if not candidate_models or (cancel_event and cancel_event.is_set()):
        return {"query": search_query, "total_evaluated": 0, "matches": []}

    # Step 2: Concurrently fetch thumbnails & compute visual embeddings
    def process_candidate(cand):
        if cancel_event and cancel_event.is_set():
            return None
        thumb_url = cand.get("thumbnail")
        if not thumb_url:
            return None
        cand_vec = compute_image_embedding_from_url(thumb_url, timeout=4)
        if cand_vec is None or (cancel_event and cancel_event.is_set()):
            return None
        
        score = float(np.dot(target_vec, cand_vec))
        if score >= min_similarity:
            pct = int(min(100, max(0, round(score * 100))))
            item = dict(cand)
            name = cand.get("name") or cand.get("title") or "3D Model"
            item["name"] = name
            item["title"] = name
            item["similarity_score"] = round(score, 4)
            item["similarity_percentage"] = pct
            return item
        return None

    matches = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(process_candidate, m) for m in candidate_models]
        for f in concurrent.futures.as_completed(futures):
            if cancel_event and cancel_event.is_set():
                for p in futures:
                    p.cancel()
                break
            try:
                res = f.result()
                if res is not None:
                    matches.append(res)
            except Exception:
                pass

    if cancel_event and cancel_event.is_set():
        return {"query": search_query, "total_evaluated": len(candidate_models), "matches": []}

    # Sort descending by visual similarity score
    matches.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)
    return {
        "query": search_query,
        "total_evaluated": len(candidate_models),
        "matches": matches[:limit]
    }

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
    
    target_vec = None
    with _embeddings_lock:
        if target_model_id in _EMBEDDINGS_STORE:
            target_vec = _EMBEDDINGS_STORE[target_model_id]

    if target_vec is None:
        # Try to compute it on the fly outside the lock
        thumb_path = CACHE_DIR / f"{target_model_id}_0.png"
        if not thumb_path.exists():
            thumb_path = CACHE_DIR / f"{target_model_id}.png"
        if thumb_path.exists():
            vec = compute_image_embedding(thumb_path)
            if vec is not None:
                with _embeddings_lock:
                    _EMBEDDINGS_STORE[target_model_id] = vec
                save_embeddings_to_disk()
                target_vec = vec

    if target_vec is None:
        return []

    with _embeddings_lock:
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
