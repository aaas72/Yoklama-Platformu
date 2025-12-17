import mysql.connector
import sys

# Veritabanı bağlantı ayarları
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "ml"
}

def get_db_connection():
    """Veritabanı bağlantısı oluştur ve döndür"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"Hata: Veritabanına bağlanılamadı: {e}")
        return None

def init_db():
    """Başlangıçta veritabanını ve tabloları başlat"""
    try:
        # 1. Veritabanını oluştur (eğer yoksa)
        conn = mysql.connector.connect(
            host=DB_CONFIG["host"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"]
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
        conn.close()
        
        # 2. Tabloları oluşturmak için veritabanına bağlan
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Okul Tablosu (School Info)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS schools (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            logo_url VARCHAR(255),
            address VARCHAR(255),
            manager_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # Sınıflar Tablosu (Classes)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            schedule_time TIME,
            room_number VARCHAR(50),
            school_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
        """)

        # Öğrenciler Tablosu (Students)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(50) UNIQUE NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            photo_url VARCHAR(255),
            face_encoding TEXT, -- Matrisi JSON string olarak sakla
            class_id INT,
            school_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
        """)
        
        # Yoklama Kayıtları Tablosu (Attendance Logs)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(50) NOT NULL,
            class_id INT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'present', -- 'present', 'late', 'absent'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(student_id),
            FOREIGN KEY (class_id) REFERENCES classes(id)
        )
        """)
        
        # Kullanıcılar Tablosu (Yöneticiler)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'viewer', -- 'admin', 'viewer'
            school_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
        """)

        # Öğretmenler Tablosu (Teachers)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS teachers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            tc_no VARCHAR(11),
            birth_date DATE,
            phone VARCHAR(20),
            email VARCHAR(100),
            branch VARCHAR(100), -- Branş
            school_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(50) NOT NULL,
            embedding TEXT,
            source VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_face_profile (
            student_id VARCHAR(50) PRIMARY KEY,
            mean_embedding TEXT,
            emb_count INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
        )
        """)

        # Yeni sütunları kontrol et ve ekle (Basit Migrasyon Mantığı)
        
        # Öğrenciler tablosunu güncelle
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN tc_no VARCHAR(11)")
        except mysql.connector.Error:
            pass # Sütun zaten mevcut
            
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN birth_date DATE")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN is_active TINYINT(1) DEFAULT 1")
        except mysql.connector.Error:
            pass
            
        # Sınıflar tablosunu güncelle (Öğretmen/Gözetmen ekle)
        try:
            cursor.execute("ALTER TABLE classes ADD COLUMN teacher_id INT")
            cursor.execute("ALTER TABLE classes ADD CONSTRAINT fk_class_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL")
        except mysql.connector.Error:
            pass

        # Sınıflar tablosunu güncelle (Ek detaylar ekle)
        try:
            cursor.execute("ALTER TABLE classes ADD COLUMN capacity INT DEFAULT 30")
        except mysql.connector.Error: pass
        
        try:
            cursor.execute("ALTER TABLE classes ADD COLUMN grade_level VARCHAR(10)")
        except mysql.connector.Error: pass
        
        try:
            cursor.execute("ALTER TABLE classes ADD COLUMN branch VARCHAR(10)")
        except mysql.connector.Error: pass

        
        # Mevcut tabloları güncelleme denemeleri (Migrasyon için)
        try:
            cursor.execute("ALTER TABLE classes ADD COLUMN school_id INT")
            cursor.execute("ALTER TABLE classes ADD FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE")
        except mysql.connector.Error: pass

        try:
            cursor.execute("ALTER TABLE students ADD COLUMN school_id INT")
            cursor.execute("ALTER TABLE students ADD FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE")
        except mysql.connector.Error: pass

        try:
            cursor.execute("ALTER TABLE users ADD COLUMN school_id INT")
            cursor.execute("ALTER TABLE users ADD FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE")
        except mysql.connector.Error: pass
        
        conn.commit()
        conn.close()
        print("Veritabanı ve tablolar başarıyla başlatıldı.")
    except Exception as e:
        print(f"Hata: Veritabanı başlatılamadı: {e}")
