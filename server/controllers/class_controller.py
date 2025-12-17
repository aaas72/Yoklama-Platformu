from server.config.database import get_db_connection
import mysql.connector
from fastapi import HTTPException

def get_all_classes(school_id):
    """Belirli bir okulun tüm sınıflarını getir"""
    conn = get_db_connection()
    if not conn: return []
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Join with teachers to get supervisor name
        sql = """
        SELECT c.class_id as id, c.class_name as name, c.*, t.first_name, t.last_name 
        FROM classes c
        LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
        WHERE c.school_id = %s 
        ORDER BY c.class_id DESC
        """
        cursor.execute(sql, (school_id,))
        classes = cursor.fetchall()
        
        # Tarihleri metne çevir
        for c in classes:
            if c.get('schedule_time'):
                c['schedule_time'] = str(c['schedule_time'])
            if c.get('created_at'):
                c['created_at'] = str(c['created_at'])
                
        return classes
    except Exception as e:
        print(f"Hata: Sınıflar getirilemedi: {e}")
        return []
    finally:
        if conn: conn.close()

def get_class_by_id(class_id):
    conn = get_db_connection()
    if not conn: return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT c.class_id as id, c.class_name as name, c.*, t.first_name, t.last_name 
        FROM classes c
        LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
        WHERE c.class_id = %s
        """
        cursor.execute(sql, (class_id,))
        cls = cursor.fetchone()
        
        if cls:
            if cls.get('schedule_time'):
                cls['schedule_time'] = str(cls['schedule_time'])
            if cls.get('created_at'):
                cls['created_at'] = str(cls['created_at'])
        
        return cls
    except Exception as e:
        print(f"Hata: Sınıf bilgisi getirilemedi: {e}")
        return None
    finally:
        if conn: conn.close()

def add_class(school_id, name, schedule_time=None, room_number=None, capacity=30, grade_level=None, branch=None, teacher_id=None):
    """Belirli bir okul için yeni sınıf ekle"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
        INSERT INTO classes (class_name, schedule_time, room_number, school_id, capacity, grade_level, branch, teacher_id) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        val = (name, schedule_time, room_number, school_id, capacity, grade_level, branch, teacher_id)
        cursor.execute(sql, val)
        conn.commit()
        class_id = cursor.lastrowid
        conn.close()
        return {"success": True, "message": "Sınıf başarıyla eklendi", "id": class_id}
    except mysql.connector.Error as e:
        if e.errno == 1062:
            raise HTTPException(status_code=400, detail="Duplicate entry")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error: {e}")

def update_class(class_id, data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        fields = []
        values = []
        
        for key, value in data.items():
            if key == 'name':
                fields.append("class_name = %s")
                values.append(value)
            elif key in ['schedule_time', 'room_number', 'capacity', 'grade_level', 'branch', 'teacher_id']:
                fields.append(f"{key} = %s")
                values.append(value)
        
        if not fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
            
        values.append(class_id)
        sql = f"UPDATE classes SET {', '.join(fields)} WHERE class_id = %s"
        
        cursor.execute(sql, tuple(values))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Sınıf güncellendi"}
    except mysql.connector.Error as e:
        if e.errno == 1062:
            raise HTTPException(status_code=400, detail="Duplicate entry")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error: {e}")

def delete_class(class_id, school_id):
    """Sınıfı sil (Okul sahipliğini doğrulayarak)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Sınıfın aynı okula ait olup olmadığını kontrol et
        cursor.execute("SELECT class_id FROM classes WHERE class_id = %s AND school_id = %s", (class_id, school_id))
        if not cursor.fetchone():
             conn.close()
             raise HTTPException(status_code=404, detail="Class not found or access denied")
             
        cursor.execute("DELETE FROM classes WHERE class_id = %s AND school_id = %s", (class_id, school_id))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Sınıf başarıyla silindi"}
    except mysql.connector.Error as e:
        if e.errno == 1451:
            raise HTTPException(status_code=400, detail="Cannot delete class: Related records exist")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error: {e}")
