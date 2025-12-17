import warnings
warnings.filterwarnings("ignore", category=UserWarning, message="pkg_resources is deprecated as an API")
warnings.filterwarnings("ignore", category=UserWarning, module="face_recognition_models")
import numpy as np
import base64
import cv2
import json
import os
import pickle
from deepface import DeepFace

# Global loaded model variables
_face_recognizer = None
_class_names = None
_model_loaded = False

# Define base path for models relative to this file
BASE_ML_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "output")

def load_ml_model(model_path=None, classes_path=None, force_reload=False):
    """
    Deprecated: MLP Model loading has been removed in favor of Dual-Model Hybrid.
    This function is kept as a stub to prevent import errors.
    """
    return True

def predict_face_from_base64(base64_string, threshold=0.5):
    """
    Deprecated: Use decision_engine.py logic instead.
    """
    return None, 0.0

def decode_base64_image(base64_string):
    try:
        # Remove header if present (e.g., "data:image/jpeg;base64,")
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
            
        image_bytes = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Hata: Base64 resim çözülemedi: {e}")
        return None

def _import_fr():
    try:
        import face_recognition as fr
        return fr
    except (ImportError, ModuleNotFoundError):
        print("Hata: 'face_recognition' kütüphanesi kurulu değil. Lütfen 'pip install face_recognition' komutu ile kurun.")
        return None
    except Exception as e:
        print(f"Hata: 'face_recognition' kütüphanesi yüklenirken beklenmedik bir hata oluştu: {e}")
        return None

def get_face_encoding_from_base64(base64_string):
    img = decode_base64_image(base64_string)
    if img is None:
        return None
        
    # Convert from BGR (OpenCV) to RGB (face_recognition)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Find face locations first (faster)
    fr = _import_fr()
    if fr is None:
        return None
    face_locations = fr.face_locations(rgb_img)
    if not face_locations:
        return None
        
    # Get encodings
    encodings = fr.face_encodings(rgb_img, face_locations)
    if encodings:
        # Convert numpy array to list for JSON serialization
        return encodings[0].tolist()
        
    return None

def recognize_face_from_base64(base64_string, known_encodings_dict, tolerance=0.5):
    unknown_encoding_list = get_face_encoding_from_base64(base64_string)
    if unknown_encoding_list is None:
        return None
        
    unknown_encoding = np.array(unknown_encoding_list)
    
    known_ids = list(known_encodings_dict.keys())
    known_encodings = [np.array(enc) for enc in known_encodings_dict.values()]
    
    if not known_encodings:
        return None
        
    # Compare faces
    fr = _import_fr()
    if fr is None:
        return None
    distances = fr.face_distance(known_encodings, unknown_encoding)
    min_distance_index = np.argmin(distances)
    min_distance = distances[min_distance_index]
    
    print(f"DEBUG: En iyi eşleşme mesafesi: {min_distance} (Tolerans: {tolerance})")
    
    if min_distance < tolerance:
        return known_ids[min_distance_index]
        
    return None

def get_face_encodings_and_boxes_from_base64(base64_string):
    img = decode_base64_image(base64_string)
    if img is None:
        return []
    
    try:
        # Use DeepFace with Facenet model
        # detector_backend='opencv' is faster for real-time video
        embedding_objs = DeepFace.represent(
            img_path=img,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=True,
            align=True
        )
        
        result = []
        for obj in embedding_objs:
            embedding = obj["embedding"]
            # DeepFace area: {'x': int, 'y': int, 'w': int, 'h': int}
            # Convert to (top, right, bottom, left) for compatibility
            area = obj["facial_area"]
            x, y, w, h = area['x'], area['y'], area['w'], area['h']
            box = (y, x + w, y + h, x)
            
            result.append((embedding, box))
            
        return result
    except ValueError as ve:
        # DeepFace raises ValueError if face not detected with enforce_detection=True
        # print(f"DEBUG: Face detection failed (ValueError): {ve}")
        return []
    except Exception as e:
        print(f"DEBUG: DeepFace error: {e}")
        return []

def predict_from_embedding(embedding, threshold=0.5):
    global _face_recognizer, _class_names
    if not _model_loaded:
        if not load_ml_model():
            return None, 0.0
    try:
        enc = np.array(embedding).reshape(1, -1)
        preds = _face_recognizer.predict_proba(enc)[0]
        j = int(np.argmax(preds))
        proba = float(preds[j])
        name = _class_names[j]
        if proba > threshold:
            return name, proba
        return None, proba
    except Exception as e:
        print(f"Hata: Embedding tahmini başarısız: {e}")
        return None, 0.0

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    if a.ndim > 1:
        a = a.reshape(-1)
    if b.ndim > 1:
        b = b.reshape(-1)
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def l2_normalize(v):
    v = np.array(v).reshape(-1)
    norm = np.linalg.norm(v)
    if norm == 0:
        return v
    return v / (norm + 1e-8)

def get_face_encoding_from_image_path(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    fr = _import_fr()
    if fr is None:
        return None
    boxes = fr.face_locations(rgb)
    if not boxes:
        return None
    encs = fr.face_encodings(rgb, boxes)
    if len(encs) == 0:
        return None
    return encs[0]

def is_face_quality_ok(img, box):
    top, right, bottom, left = box
    h, w = img.shape[:2]
    fh = bottom - top
    fw = right - left
    if fh <= 0 or fw <= 0:
        return False
    face_area_ratio = (fh * fw) / (w * h + 1e-8)
    if face_area_ratio < 0.04:
        return False
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur < 80.0:
        return False
    brightness = float(np.mean(gray))
    if brightness < 40 or brightness > 215:
        return False
    return True

def get_quality_metrics(img, box):
    top, right, bottom, left = box
    h, w = img.shape[:2]
    fh = bottom - top
    fw = right - left
    area_ratio = (fh * fw) / (w * h + 1e-8)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    return {"area_ratio": float(area_ratio), "blur": float(blur), "brightness": float(brightness)}

def best_match_by_cosine(embedding, known_enc_dict):
    if not known_enc_dict:
        return None, 1.0, 0.0
    emb = np.array(embedding).reshape(-1)
    best_id = None
    best_sim = -1.0
    for sid, mean_emb in known_enc_dict.items():
        sim = cosine_similarity(emb, mean_emb)
        if sim > best_sim:
            best_sim = sim
            best_id = sid
    dist = 1.0 - float(best_sim if best_sim >= 0.0 else 0.0)
    return best_id, dist, float(best_sim if best_sim >= 0.0 else 0.0)

def threshold_match_any(embedding, known_enc_dict, t_dist: float):
    if not known_enc_dict:
        return None, 1.0, 0.0
    emb = np.array(embedding).reshape(-1)
    for sid, mean_emb in known_enc_dict.items():
        sim = cosine_similarity(emb, mean_emb)
        dist = 1.0 - float(sim if sim >= 0.0 else 0.0)
        if dist <= t_dist:
            return sid, dist, float(sim if sim >= 0.0 else 0.0)
    return None, 1.0, 0.0

def threshold_match_unique(embedding, known_enc_dict, t_dist: float):
    if not known_enc_dict:
        return None, 1.0, 0.0, 0, 1.0
    emb = np.array(embedding).reshape(-1)
    matches = []
    min_dist = 1.0
    for sid, mean_emb in known_enc_dict.items():
        sim = cosine_similarity(emb, mean_emb)
        dist = 1.0 - float(sim if sim >= 0.0 else 0.0)
        if dist < min_dist:
            min_dist = dist
        if dist <= t_dist:
            matches.append((sid, dist, float(sim if sim >= 0.0 else 0.0)))
    if len(matches) == 1:
        sid, dist, sim = matches[0]
        return sid, dist, sim, 1, min_dist
    return None, 1.0, 0.0, len(matches), min_dist
