import json
import numpy as np
from server.config.database import get_db_connection

# Threshold for adding new embeddings
# High confidence required to avoid polluting the model with bad data.
LEARNING_THRESHOLD = 0.92 
MAX_EMBEDDINGS_PER_STUDENT = 20

def check_and_update_embedding(student_id, embedding, confidence):
    """
    If confidence is high, add the new embedding to the database
    to improve future recognition (Active Learning).
    """
    if confidence < LEARNING_THRESHOLD:
        return
        
    try:
        conn = get_db_connection()
        if not conn:
            return
            
        cursor = conn.cursor()
        
        # Check current count
        cursor.execute("SELECT COUNT(*) FROM face_embeddings WHERE student_id = %s", (student_id,))
        result = cursor.fetchone()
        count = result[0] if result else 0
        
        if count >= MAX_EMBEDDINGS_PER_STUDENT:
            # Optimization: If full, maybe replace the oldest 'active_learning' entry?
            # For safety, we just stop adding for now.
            conn.close()
            return

        # Insert new embedding
        # embedding is a numpy array or list. Needs to be JSON string.
        if isinstance(embedding, np.ndarray):
            embedding_list = embedding.tolist()
        else:
            embedding_list = embedding
            
        embedding_json = json.dumps(embedding_list)
        
        sql = "INSERT INTO face_embeddings (student_id, embedding, source) VALUES (%s, %s, 'active_learning')"
        cursor.execute(sql, (student_id, embedding_json))
        conn.commit()
        
        print(f"🧠 [Active Learning] Updated embedding for Student {student_id} (Conf: {confidence:.4f})")
        
        conn.close()
        
    except Exception as e:
        print(f"⚠️ [Active Learning] Error updating embedding: {e}")
