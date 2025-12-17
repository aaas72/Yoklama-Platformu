from datetime import datetime
from server.config.database import get_db_connection

def get_attendance_logs(school_id):
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        # Updated for 'ml' database schema
        sql = """
            SELECT a.attendance_id as id, a.student_id, 
                   CONCAT(s.first_name, ' ', s.last_name) as full_name, 
                   c.class_name, 
                   a.timestamp, a.status 
            FROM attendance a 
            LEFT JOIN students s ON a.student_id = s.student_id 
            LEFT JOIN classes c ON a.class_id = c.class_id 
            WHERE s.school_id = %s 
            ORDER BY a.timestamp DESC
        """
        cursor.execute(sql, (school_id,))
        logs = cursor.fetchall()
        for log in logs:
            if log['timestamp']:
                log['timestamp'] = str(log['timestamp'])
        return logs
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []
    finally:
        if conn: conn.close()

def mark_attendance(student_id):
    try:
        conn = get_db_connection()
        if not conn:
            return {"status": "error", "message": "Veritabanı bağlantı hatası"}
            
        cursor = conn.cursor(dictionary=True)
        now = datetime.now()
        today_date = now.strftime('%Y-%m-%d')
        
        # 1. Get student's class_id and name FIRST
        cursor.execute("""
            SELECT s.class_id, s.school_id, s.first_name, s.last_name, c.class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.class_id 
            WHERE s.student_id = %s
        """, (student_id,))
        student_data = cursor.fetchone()
        
        if not student_data:
            conn.close()
            return {"status": "error", "message": "Öğrenci bulunamadı"}
            
        class_id = student_data['class_id']
        school_id = student_data['school_id']
        student_name = f"{student_data['first_name']} {student_data['last_name']}"
        class_name = student_data['class_name'] if student_data['class_name'] else "Bilinmeyen Sınıf"
        
        # 2. Check if attendance already exists for today
        cursor.execute(
            "SELECT status, timestamp FROM attendance WHERE student_id = %s AND DATE(timestamp) = %s", 
            (student_id, today_date)
        )
        existing = cursor.fetchone()
        
        if existing:
            conn.close()
            return {
                "status": "exists", 
                "message": f"Daha önce yoklama alındı ({existing['timestamp'].strftime('%H:%M')})",
                "student_name": student_name,
                "class_name": class_name,
                "attendance_status": existing['status']
            }

        # 3. Determine status
        status = "present"
        # Example late logic could be added here
        
        # 4. Insert attendance record
        insert_sql = """
            INSERT INTO attendance (student_id, school_id, class_id, timestamp, status, verification_method, confidence_score) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_sql, (student_id, school_id, class_id, now, status, 'face', 0.95))
        
        conn.commit()
        conn.close()
        
        return {
            "status": "success", 
            "message": "Yoklama başarıyla alındı", 
            "student_name": student_name,
            "class_name": class_name,
            "attendance_status": status
        }
        
    except Exception as e:
        print(f"Error marking attendance: {e}")
        return {"status": "error", "message": str(e)}
