from server.config.database import get_db_connection
import mysql.connector

def get_school_info(school_id):
    """ID'ye göre okul bilgilerini getir"""
    conn = get_db_connection()
    if not conn: return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        # schools tablosunda id yerine school_id kullanılıyor olabilir, kontrol et
        cursor.execute("SELECT * FROM schools WHERE school_id = %s", (school_id,))
        school = cursor.fetchone()
        
        if school:
            # Frontend beklenen formatı sağla
            if 'school_name' in school:
                school['name'] = school['school_name']
            
            # Yönetici (Müdür) bilgisini users tablosundan al
            cursor.execute("SELECT username FROM users WHERE school_id = %s AND role = 'admin' LIMIT 1", (school_id,))
            admin = cursor.fetchone()
            if admin:
                school['manager_name'] = admin['username']
            elif 'manager_name' not in school:
                school['manager_name'] = "Yönetici Atanmamış"
                
        return school
    except Exception as e:
        print(f"Error fetching school info: {e}")
        # Fallback: Eğer school_id kolonu yoksa id ile dene (schema mismatch durumunda)
        try:
            cursor.execute("SELECT * FROM schools WHERE id = %s", (school_id,))
            school = cursor.fetchone()
            return school
        except:
            return None
    finally:
        if conn: conn.close()

def update_school_info(school_id, name, manager_name, address=None, logo_url=None):
    """Belirtilen okul bilgilerini güncelle"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Schema kontrolü yapmadan önce update deniyoruz, hata verirse diğer kolon adını deneriz
        try:
            sql = "UPDATE schools SET school_name=%s, address=%s, logo_url=%s WHERE school_id=%s"
            val = (name, address, logo_url, school_id)
            cursor.execute(sql, val)
        except:
            sql = "UPDATE schools SET name=%s, manager_name=%s, address=%s, logo_url=%s WHERE id=%s"
            val = (name, manager_name, address, logo_url, school_id)
            cursor.execute(sql, val)
            
        conn.commit()
        conn.close()
        return {"success": True, "message": "Okul bilgileri başarıyla güncellendi"}
    except Exception as e:
        return {"success": False, "message": f"Bir hata oluştu: {str(e)}"}
