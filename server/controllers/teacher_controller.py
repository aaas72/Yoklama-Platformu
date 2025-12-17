from server.config.database import get_db_connection
import mysql.connector
from fastapi import HTTPException

def get_all_teachers(school_id):
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Fixed: ORDER BY teacher_id (created_at does not exist)
        sql = """
        SELECT teacher_id as id, CONCAT(first_name, ' ', last_name) as full_name, t.* 
        FROM teachers t
        WHERE school_id = %s 
        ORDER BY teacher_id DESC
        """
        cursor.execute(sql, (school_id,))
        teachers = cursor.fetchall()
        
        # Convert date objects to string
        for t in teachers:
            if t.get('birth_date'):
                t['birth_date'] = str(t['birth_date'])
            # Removed created_at check as it doesn't exist
                
        return teachers
    except Exception as e:
        print(f"Error fetching teachers: {e}")
        return []
    finally:
        if conn: conn.close()

def get_teacher_by_id(teacher_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Fixed: WHERE teacher_id
        sql = "SELECT teacher_id as id, CONCAT(first_name, ' ', last_name) as full_name, t.* FROM teachers t WHERE teacher_id = %s"
        cursor.execute(sql, (teacher_id,))
        teacher = cursor.fetchone()
        
        if teacher:
            if teacher.get('birth_date'):
                teacher['birth_date'] = str(teacher['birth_date'])
                
        return teacher
    except Exception as e:
        print(f"Error fetching teacher: {e}")
        return None
    finally:
        if conn: conn.close()

def add_teacher(school_id, first_name, last_name, tc_no, birth_date, phone=None, email=None, branch=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
        INSERT INTO teachers (first_name, last_name, tc_no, birth_date, phone, email, branch, school_id) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        val = (first_name, last_name, tc_no, birth_date, phone, email, branch, school_id)
        
        cursor.execute(sql, val)
        conn.commit()
        teacher_id = cursor.lastrowid
        conn.close()
        return {"success": True, "message": "Öğretmen başarıyla eklendi", "id": teacher_id}
    except mysql.connector.Error as e:
        if e.errno == 1062:
            raise HTTPException(status_code=400, detail="Duplicate entry")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error: {e}")

def update_teacher(teacher_id, data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Dynamically build update query
        fields = []
        values = []
        
        for key, value in data.items():
            if key in ['first_name', 'last_name', 'tc_no', 'birth_date', 'phone', 'email', 'branch']:
                fields.append(f"{key} = %s")
                values.append(value)
        
        if not fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
            
        values.append(teacher_id)
        # Fixed: WHERE teacher_id
        sql = f"UPDATE teachers SET {', '.join(fields)} WHERE teacher_id = %s"
        
        cursor.execute(sql, tuple(values))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Öğretmen güncellendi"}
    except mysql.connector.Error as e:
        if e.errno == 1062:
            raise HTTPException(status_code=400, detail="Duplicate entry")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error: {e}")

def delete_teacher(teacher_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check existence
        cursor.execute("SELECT teacher_id FROM teachers WHERE teacher_id = %s", (teacher_id,))
        if not cursor.fetchone():
             conn.close()
             raise HTTPException(status_code=404, detail="Teacher not found")

        # Fixed: WHERE teacher_id
        sql = "DELETE FROM teachers WHERE teacher_id = %s"
        cursor.execute(sql, (teacher_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Öğretmen silindi"}
    except mysql.connector.Error as e:
        if e.errno == 1451:
            raise HTTPException(status_code=400, detail="Cannot delete teacher: Related records exist")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error: {e}")
