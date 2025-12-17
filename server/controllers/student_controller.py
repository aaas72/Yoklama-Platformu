from server.config.database import get_db_connection
import mysql.connector
from fastapi import HTTPException
import base64
import os
import uuid
import json
import numpy as np
import cv2
import warnings
from server.utils import face_utils

# Paths
DATASET_PATH_STUDENTS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "dataset", "students")

# Suppress warnings
warnings.filterwarnings("ignore", category=UserWarning, message="pkg_resources is deprecated as an API")
warnings.filterwarnings("ignore", category=UserWarning, module="face_recognition_models")

def get_all_students(school_id):
    """Belirli bir okulun tüm öğrencilerini getir"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Updated for 'ml' schema: classes table uses class_id and class_name
        # Removed schedule_time and created_at as they don't exist in current schema
        sql = """
        SELECT s.student_id as id, CONCAT(s.first_name, ' ', s.last_name) as full_name, s.*, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.class_id
        WHERE s.school_id = %s
        ORDER BY s.student_id DESC
        """
        cursor.execute(sql, (school_id,))
        students = cursor.fetchall()
        
        # Format dates
        for s in students:
            if s.get('birth_date'):
                s['birth_date'] = str(s['birth_date'])
            # Removed created_at and schedule_time checks
                
        return students
    except Exception as e:
        print(f"Error fetching students: {e}")
        return []
    finally:
        if conn: conn.close()

def get_student_by_id(student_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Updated for 'ml' schema
        sql = """
        SELECT s.student_id as id, CONCAT(s.first_name, ' ', s.last_name) as full_name, s.*, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.class_id
        WHERE s.student_id = %s
        """
        cursor.execute(sql, (student_id,))
        student = cursor.fetchone()
        
        if student:
            if student.get('birth_date'):
                student['birth_date'] = str(student['birth_date'])
            
            # Get face embeddings count
            cursor.execute("SELECT COUNT(*) as face_count FROM face_embeddings WHERE student_id = %s", (student_id,))
            result = cursor.fetchone()
            student['face_count'] = result['face_count'] if result else 0
                
        return student
    except Exception as e:
        print(f"Error fetching student: {e}")
        return None
    finally:
        if conn: conn.close()

def add_student(school_id, first_name, last_name, student_id, class_id=1, tc_no="00000000000", birth_date="2000-01-01"):
    """Yeni öğrenci ekle"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if student exists
        cursor.execute("SELECT student_id FROM students WHERE student_id = %s", (student_id,))
        if cursor.fetchone():
             conn.close()
             raise HTTPException(status_code=400, detail="Student ID already exists")

        # Insert student
        sql = """
        INSERT INTO students (student_id, school_id, first_name, last_name, tc_no, birth_date, class_id, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
        """
        val = (student_id, school_id, first_name, last_name, tc_no, birth_date, class_id)
        
        cursor.execute(sql, val)
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Student added successfully", "id": student_id}
        
    except mysql.connector.Error as err:
        if err.errno == 1062:
            raise HTTPException(status_code=400, detail="Student ID already exists")
        elif err.errno == 1406: # Data too long
            raise HTTPException(status_code=400, detail="Veri çok uzun (örn. İsim veya TC No)")
        elif err.errno == 1366: # Incorrect integer/string value
            raise HTTPException(status_code=400, detail="Veri tipi hatası (örn. Öğrenci No sayı olmalıdır)")
            
        print(f"Database Error in add_student: {err}")
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Error in add_student: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")

def _insert_face_embedding(student_id, embedding, embedding_type="enrollment"):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        sql = "INSERT INTO face_embeddings (student_id, embedding, embedding_type) VALUES (%s, %s, %s)"
        cursor.execute(sql, (student_id, json.dumps(embedding), embedding_type))
        conn.commit()
    except Exception as e:
        print(f"Error inserting embedding: {e}")
    finally:
        if conn: conn.close()

def _upsert_face_profile(student_id, mean_embedding, sample_count):
    # Optional: Update a face profile table if it exists, or just pass
    pass

def process_student_photos(student_id, photos):
    print(f"DEBUG: Processing photos for student_id: {student_id}, count: {len(photos)}")
    from server.utils import face_utils
    details = []
    encs = []
    
    for idx, p in enumerate(photos):
        # Skip if not base64 (e.g. existing URL)
        if not p or not isinstance(p, str) or not p.startswith('data:image'):
            print(f"DEBUG: Photo {idx} skipped (not base64)")
            continue

        print(f"DEBUG: Processing photo {idx}")
        img = face_utils.decode_base64_image(p)
        if img is None:
            print(f"DEBUG: Photo {idx} decode failed")
            details.append({"index": idx, "status": "rejected", "reason": "decode_error"})
            continue
            
        pairs = face_utils.get_face_encodings_and_boxes_from_base64(p)
        print(f"DEBUG: Photo {idx} found {len(pairs)} faces")
        
        if not pairs or len(pairs) == 0:
            details.append({"index": idx, "status": "rejected", "reason": "no_face"})
            continue
        if len(pairs) > 1:
            details.append({"index": idx, "status": "rejected", "reason": "multiple_faces"})
            continue
        emb, box = pairs[0]

        metrics = face_utils.get_quality_metrics(img, box)
        print(f"DEBUG: Photo {idx} metrics: {metrics}")
        
        if metrics["area_ratio"] < 0.04:
            details.append({"index": idx, "status": "rejected", "reason": "face_too_small"})
            continue
        if metrics["blur"] < 80.0:
            details.append({"index": idx, "status": "rejected", "reason": "blurry"})
            continue
        if metrics["brightness"] < 40.0:
            details.append({"index": idx, "status": "rejected", "reason": "too_dark"})
            continue
        if metrics["brightness"] > 215.0:
            details.append({"index": idx, "status": "rejected", "reason": "too_bright"})
            continue
        details.append({"index": idx, "status": "accepted"})
        encs.append(np.array(emb))
    
    accepted_count = sum(1 for d in details if d["status"] == "accepted")
    print(f"DEBUG: Accepted count: {accepted_count}")
    
    rejected_count = len(details) - accepted_count
    quality_summary = {
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
        "details": details
    }
    
    if accepted_count > 0:
        mean_vec = np.mean(np.stack(encs, axis=0), axis=0)
        try:
            print("DEBUG: Inserting embeddings into DB...")
            for emb in encs:
                _insert_face_embedding(student_id, emb.tolist(), "enrollment")
            _upsert_face_profile(student_id, json.dumps(mean_vec.tolist()), accepted_count)
            print("DEBUG: Insert successful")
        except Exception as e:
            print(f"Error saving embeddings: {e}")
            pass
            
    return quality_summary

def update_student(student_id, data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        fields = []
        values = []
        
        for key, value in data.items():
            if key in ['first_name', 'last_name', 'tc_no', 'birth_date', 'class_id', 'is_active']:
                fields.append(f"{key} = %s")
                values.append(value)
        
        if not fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
            
        values.append(student_id)
        sql = f"UPDATE students SET {', '.join(fields)} WHERE student_id = %s"
        
        cursor.execute(sql, tuple(values))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Student updated successfully"}
    except mysql.connector.Error as err:
        if err.errno == 1062:
            raise HTTPException(status_code=400, detail="Student ID already exists")
        elif err.errno == 1406: # Data too long
            raise HTTPException(status_code=400, detail="Veri çok uzun")
        elif err.errno == 1366: # Incorrect integer/string value
            raise HTTPException(status_code=400, detail="Veri tipi hatası")
            
        # Log the actual error for debugging
        print(f"Database Error in update_student: {err}")
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Error in update_student: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")

def delete_student(student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check existence first
        cursor.execute("SELECT student_id FROM students WHERE student_id = %s", (student_id,))
        if not cursor.fetchone():
             conn.close()
             raise HTTPException(status_code=404, detail="Student not found")

        sql = "DELETE FROM students WHERE student_id = %s"
        cursor.execute(sql, (student_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Student deleted successfully"}
        
    except mysql.connector.Error as err:
        if err.errno == 1451: # Foreign key constraint fail
            raise HTTPException(status_code=400, detail="Cannot delete student: Related records exist")
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error: {e}")
