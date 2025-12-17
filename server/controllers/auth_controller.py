from server.config.database import get_db_connection
from server.config.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
import mysql.connector

def authenticate_user(username, password):
    """التحقق من بيانات الدخول وإرجاع المستخدم إذا نجح"""
    conn = get_db_connection()
    if not conn: return False
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            return False
            
        if not verify_password(password, user['password_hash']):
            return False
            
        return user
    except Exception as e:
        print(f"Auth error: {e}")
        return False
    finally:
        if conn: conn.close()

def create_user(username, password, role="viewer", school_id=None):
    """إنشاء مستخدم جديد (مرتبط بمدرسة اختيارياً)"""
    hashed_password = get_password_hash(password)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO users (username, password_hash, role, school_id) VALUES (%s, %s, %s, %s)"
        val = (username, hashed_password, role, school_id)
        cursor.execute(sql, val)
        conn.commit()
        conn.close()
        return {"success": True, "message": "Kullanıcı başarıyla oluşturuldu"}
    except mysql.connector.IntegrityError:
        return {"success": False, "message": "Kullanıcı adı zaten mevcut"}
    except Exception as e:
        return {"success": False, "message": f"Bir hata oluştu: {str(e)}"}

def register_school_with_admin(school_name, manager_name, address, admin_username, admin_password):
    """إنشاء مدرسة جديدة مع حساب مدير لها في عملية واحدة (Transaction)"""
    print(f"--- [AUTH CONTROLLER] Registering School: {school_name} ---")
    conn = get_db_connection()
    if not conn: 
        print("Error: DB Connection failed")
        return {"success": False, "message": "Veritabanı bağlantı hatası"}
    
    try:
        conn.start_transaction()
        cursor = conn.cursor()
        
        # 1. إنشاء المدرسة
        print("Step 1: Inserting School...")
        sql_school = "INSERT INTO schools (name, manager_name, address) VALUES (%s, %s, %s)"
        val_school = (school_name, manager_name, address)
        cursor.execute(sql_school, val_school)
        school_id = cursor.lastrowid
        print(f"School inserted with ID: {school_id}")
        
        # 2. إنشاء حساب المدير (Admin) المرتبط بالمدرسة
        print("Step 2: Creating Admin User...")
        hashed_password = get_password_hash(admin_password)
        sql_user = "INSERT INTO users (username, password_hash, role, school_id) VALUES (%s, %s, %s, %s)"
        val_user = (admin_username, hashed_password, 'admin', school_id)
        cursor.execute(sql_user, val_user)
        print(f"Admin user '{admin_username}' inserted.")
        
        conn.commit()
        print("Transaction Committed Successfully.")
        return {"success": True, "message": "Okul kaydı ve yönetici hesabı başarıyla oluşturuldu", "school_id": school_id}
        
    except mysql.connector.IntegrityError as e:
        conn.rollback()
        print(f"Error: IntegrityError - {e}")
        if "username" in str(e):
            return {"success": False, "message": "Yönetici kullanıcı adı zaten mevcut"}
        return {"success": False, "message": f"Veri hatası: {str(e)}"}
    except Exception as e:
        conn.rollback()
        print(f"Error: General Exception - {e}")
        return {"success": False, "message": f"Kayıt sırasında bir hata oluştu: {str(e)}"}
    finally:
        conn.close()

def seed_admin_if_not_exists():
    """إنشاء مستخدم أدمن افتراضي إذا لم يوجد أي مستخدمين"""
    conn = get_db_connection()
    if not conn: return
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print("No users found. Creating default admin user...")
            # ملاحظة: الأدمن الافتراضي ليس له مدرسة (Global Admin or fallback)
            create_user("admin", "admin123", "admin")
            print("Default admin created: username='admin', password='admin123'")
    except Exception as e:
        print(f"Seeding error: {e}")
    finally:
        if conn: conn.close()
