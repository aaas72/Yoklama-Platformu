import os
import pickle
import numpy as np
from server.utils import face_utils
from .config import T_DIST, T_STRICT_FALLBACK, MARGIN, DEBUG_MODE, UNKNOWN_FRAMES

# Paths to model files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IDENTITY_PROFILES_PATH = os.path.join(BASE_DIR, "ml", "output", "identity_profiles.pkl")

# Load Identity Profiles (Decision Model)
identity_profiles = {}
try:
    if os.path.exists(IDENTITY_PROFILES_PATH):
        with open(IDENTITY_PROFILES_PATH, 'rb') as f:
            identity_profiles = pickle.load(f)
        print(f"[INFO] Loaded {len(identity_profiles)} identity profiles (Verification Model).")
    else:
        print(f"[WARNING] Identity profiles not found at {IDENTITY_PROFILES_PATH}. Using Distance-Only fallback.")
except Exception as e:
    print(f"[ERROR] Failed to load identity profiles: {e}")

# Sliding Window Settings
WINDOW_SIZE = 5
CONSENSUS_COUNT = 3

# State: { school_id: [ (candidate_id, decision_type), ... ] }
# decision_type: "verified", "rejected"
temporal_history = {}

# Unknown State: { school_id: consecutive_unknown_count }
unknown_state = {}

def evaluate_embedding(embedding, school_id, search_context):
    global temporal_history, unknown_state
    
    # Normalize input once
    emb = face_utils.l2_normalize(embedding)
    
    # ----------------------------------------------------
    # 1. Search (FAISS + Linear Fallback)
    # ----------------------------------------------------
    best_candidate_id = None
    best_candidate_dist = 10.0 # Large init
    second_best_dist = 10.0
    
    # Check if we have FAISS index
    faiss_index = None
    id_map = []
    legacy_encodings = search_context
    
    if isinstance(search_context, dict) and "faiss_index" in search_context:
        faiss_index = search_context.get("faiss_index")
        id_map = search_context.get("id_map", [])
        legacy_encodings = search_context.get("legacy_dict", {})
    
    if faiss_index is not None and len(id_map) > 0:
        # --- FAISS SEARCH ---
        try:
            query_np = np.array([emb]).astype('float32')
            k = 2 if faiss_index.ntotal >= 2 else 1
            D, I = faiss_index.search(query_np, k)
            
            # Best Match
            if k >= 1 and I[0][0] != -1:
                idx = I[0][0]
                sim = float(D[0][0])
                sim = max(-1.0, min(1.0, sim))
                best_candidate_dist = 1.0 - sim
                if idx < len(id_map):
                    best_candidate_id = id_map[idx]
            
            # Second Best Match
            if k >= 2 and I[0][1] != -1:
                sim2 = float(D[0][1])
                sim2 = max(-1.0, min(1.0, sim2))
                second_best_dist = 1.0 - sim2
                
        except Exception as e:
            print(f"FAISS Search Error: {e}")
            faiss_index = None 

    if faiss_index is None:
        # --- LINEAR SEARCH FALLBACK ---
        for sid, mean_emb in legacy_encodings.items():
            mean_emb_norm = face_utils.l2_normalize(mean_emb)
            sim = face_utils.cosine_similarity(emb, mean_emb_norm)
            dist = 1.0 - float(sim if sim >= 0.0 else 0.0)
            
            if dist < best_candidate_dist:
                second_best_dist = best_candidate_dist
                best_candidate_dist = dist
                best_candidate_id = sid
            elif dist < second_best_dist:
                second_best_dist = dist
            
    # If no candidate found (empty DB), reject
    if not best_candidate_id:
         return {"status": "pending", "message": "Veri yok"}

    # ----------------------------------------------------
    # 2. Decision Logic (Reverted)
    # ----------------------------------------------------
    
    # Logic: Reject if (Dist > Global) OR (Margin < MARGIN)
    if best_candidate_dist > T_DIST or (second_best_dist != 10.0 and (second_best_dist - best_candidate_dist) < MARGIN):
         current_observation = (None, "reject_ambiguous_or_dist")
         if DEBUG_MODE:
             print(f"🚫 [Reject] Best={best_candidate_id} Dist={best_candidate_dist:.4f} Margin={second_best_dist - best_candidate_dist:.4f}")
    
    else:
        # Passed Stage 1 -> Check Profile
        is_verified = False
        profile = identity_profiles.get(str(best_candidate_id))
        
        if profile:
            # Check specific threshold
            specific_threshold = profile.get("threshold", T_DIST)
            if best_candidate_dist <= specific_threshold:
                is_verified = True
            else:
                if DEBUG_MODE:
                    print(f"🚫 [Profile Reject] ID={best_candidate_id} Dist={best_candidate_dist:.4f} > Specific={specific_threshold:.4f}")
        else:
            # Fallback strict
            if best_candidate_dist <= T_STRICT_FALLBACK:
                is_verified = True
                if DEBUG_MODE: print(f"✅ [Fallback Pass] {best_candidate_dist:.4f}")
            else:
                 if DEBUG_MODE: print(f"🚫 [Fallback Fail] {best_candidate_dist:.4f}")
        
        if is_verified:
            current_observation = (best_candidate_id, "verified")
        else:
            current_observation = (best_candidate_id, "reject_profile")

    # ----------------------------------------------------
    # 3. Temporal Smoothing
    # ----------------------------------------------------
    
    if school_id not in temporal_history:
        temporal_history[school_id] = []
        
    history = temporal_history[school_id]
    history.append(current_observation)
    
    if len(history) > WINDOW_SIZE:
        history.pop(0)
        
    # Consensus Check
    counts = {}
    for obs in history:
        cid, status = obs
        if status == "verified" and cid:
            counts[cid] = counts.get(cid, 0) + 1
            
    final_decision_id = None
    for cid, count in counts.items():
        if count >= CONSENSUS_COUNT:
            final_decision_id = cid
            break
            
    # Unknown State Logic
    if school_id not in unknown_state:
        unknown_state[school_id] = 0
        
    if final_decision_id:
        unknown_state[school_id] = 0
        # Clear history to prevent this user's frames from affecting the next user
        temporal_history[school_id] = [] 
        if DEBUG_MODE: print(f"✅ [ACCEPT] {final_decision_id}")
        return {"status": "ACCEPT", "student_id": final_decision_id, "confidence": 1.0 - best_candidate_dist}
    else:
        reject_count = sum(1 for _, s in history if s.startswith("reject"))
        if reject_count >= CONSENSUS_COUNT:
             unknown_state[school_id] += 1
        
        if unknown_state[school_id] > UNKNOWN_FRAMES:
             unknown_state[school_id] = 0
             return {"status": "UNKNOWN", "message": "Kişi tanınamadı"}
             
        return {"status": "pending", "message": "Doğrulanıyor..."}
