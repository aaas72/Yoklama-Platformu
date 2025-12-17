from server.utils import face_utils
from .face_cache import get_cached_encodings
from .decision_engine import evaluate_embedding
from .records_service import mark_attendance
from .learning_service import check_and_update_embedding

def process_scan(school_id, image_base64):
    """
    Orchestrates the face scan process.
    """
    encs_boxes = face_utils.get_face_encodings_and_boxes_from_base64(image_base64)
    if not encs_boxes:
        print("⚠️ [SCAN SERVICE] No face detected in the incoming image frame.")
        # Handle no faces found logic (part of decision_engine now)
        return {"status": "pending", "message": "Yüz algılanamadı"} # Or handle here

    print(f"📸 [SCAN SERVICE] Detected {len(encs_boxes)} face(s). Processing...")
    known = get_cached_encodings(school_id)
    
    for enc, box in encs_boxes:
        result = evaluate_embedding(enc, school_id, known)
        
        if result.get("status") == "ACCEPT":
            student_id = result["student_id"]
            
            # Active Learning: Update embedding if confidence is high
            confidence = result.get("confidence", 0.0)
            check_and_update_embedding(student_id, enc, confidence)
            
            attendance_response = mark_attendance(student_id)
            # Combine and return a rich response
            return {**result, **attendance_response, "box": box}
        
        # For now, return the first non-pending result
        if result.get("status") != "pending":
            return {**result, "box": box}

    return {"status": "pending", "message": "Yüz algılanamadı"} # Default response if all are pending
