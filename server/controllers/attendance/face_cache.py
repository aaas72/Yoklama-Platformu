from datetime import datetime, timedelta
import json
import numpy as np
try:
    import faiss
except ImportError:
    faiss = None
    print("WARNING: FAISS not found. Falling back to linear search.")

from server.config.database import get_db_connection
from server.utils import face_utils

encodings_cache = {}
CACHE_DURATION = timedelta(minutes=10)

def get_cached_encodings(school_id, force_refresh: bool = False):
    now = datetime.now()
    
    if not force_refresh and school_id in encodings_cache:
        cache_entry = encodings_cache[school_id]
        if now - cache_entry['last_updated'] < CACHE_DURATION:
            return cache_entry['data']
            
    conn = get_db_connection()
    if not conn: return {"legacy_dict": {}, "faiss_index": None, "id_map": []}
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Use face_embeddings table directly if profiles table is empty/not used
        cursor.execute("""
            SELECT s.student_id, fe.embedding as mean_embedding
            FROM face_embeddings fe
            JOIN students s ON fe.student_id = s.student_id
            WHERE s.school_id = %s AND COALESCE(s.is_active, 1) = 1
        """, (school_id,))
        rows = cursor.fetchall()
        
        known_encodings = {}
        # Group by student and take average if multiple embeddings exist
        temp_encodings = {}
        
        for r in rows:
            if r['mean_embedding']:
                try:
                    sid = r['student_id']
                    emb = json.loads(r['mean_embedding'])
                    if sid not in temp_encodings:
                        temp_encodings[sid] = []
                    temp_encodings[sid].append(emb)
                except:
                    continue
        
        # Calculate mean for cache
        id_map = []
        matrix_list = []
        
        for sid, embs in temp_encodings.items():
            if embs:
                mean_vec = np.mean(embs, axis=0)
                known_encodings[sid] = mean_vec
                
                # Prepare for FAISS
                # Normalize for Cosine Similarity (IndexFlatIP)
                norm_vec = face_utils.l2_normalize(mean_vec)
                matrix_list.append(norm_vec)
                id_map.append(sid)
        
        # Build FAISS Index
        faiss_index = None
        if faiss and matrix_list:
            matrix_np = np.array(matrix_list).astype('float32')
            if matrix_np.ndim == 1:
                matrix_np = matrix_np.reshape(1, -1)
                
            # Dimension 128
            d = 128
            faiss_index = faiss.IndexFlatIP(d)
            faiss_index.add(matrix_np)
            print(f"DEBUG: FAISS Index built with {faiss_index.ntotal} vectors.")
        
        print(f"DEBUG: Okul {school_id} için {len(known_encodings)} öğrenci yüz verisi önbelleğe alınıyor.")
        
        result_data = {
            "legacy_dict": known_encodings,
            "faiss_index": faiss_index,
            "id_map": id_map
        }
        
        encodings_cache[school_id] = {
            'last_updated': now,
            'data': result_data
        }
        
        return result_data
    except Exception as e:
        print(f"Hata: Önbellekleme hatası: {e}")
        return {"legacy_dict": {}, "faiss_index": None, "id_map": []}
    finally:
        conn.close()
