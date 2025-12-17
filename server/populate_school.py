import mysql.connector
import random
from config.database import get_db_connection

# Sample Data
FIRST_NAMES = ["Ahmet", "Mehmet", "Ayşe", "Fatma", "Mustafa", "Zeynep", "Emre", "Elif", "Can", "Cem", "Deniz", "Ece", "Ali", "Veli", "Hakan", "Selin", "Murat", "Burak", "Esra", "Seda", "Kaan", "Gökhan", "İrem", "Ozan", "Pınar", "Sinan", "Tolga", "Umut", "Yağmur", "Eren"]
LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Güler", "Bulut", "Keskin", "Ünal", "Turan", "Gül", "Erdoğan", "Sarı", "Yüksel"]

def generate_name():
    return random.choice(FIRST_NAMES), random.choice(LAST_NAMES)

def clear_data(cursor):
    print("Mevcut veriler temizleniyor...")
    # Order matters due to foreign keys
    try:
        cursor.execute("DELETE FROM attendance")
    except: pass
    try:
        cursor.execute("DELETE FROM students")
    except: pass
    try:
        cursor.execute("DELETE FROM classes")
    except: pass
    try:
        cursor.execute("DELETE FROM teachers")
    except: pass
    print("Veriler temizlendi.")

def populate():
    conn = get_db_connection()
    if not conn:
        print("Veritabanı bağlantısı başarısız.")
        return

    cursor = conn.cursor()

    try:
        # 1. Get School ID
        # Schema: school_id, school_name
        cursor.execute("SELECT school_id FROM schools LIMIT 1")
        school = cursor.fetchone()
        if not school:
            print("Okul bulunamadı. Yeni okul oluşturuluyor...")
            cursor.execute("INSERT INTO schools (school_name) VALUES ('HDSM Anadolu Lisesi')")
            school_id = cursor.lastrowid
        else:
            school_id = school[0]
        
        print(f"İşlem yapılacak Okul ID: {school_id}")

        # Clear old data
        clear_data(cursor)

        # 2. Create Teachers (Supervisors)
        # Schema: teacher_id, school_id, first_name, last_name, tc_no, birth_date, phone, email, is_active
        print("Öğretmenler oluşturuluyor...")
        teacher_ids = []
        for i in range(100): # 100 Teachers
            f_name, l_name = generate_name()
            tc_no = str(10000000000 + i)
            cursor.execute("""
                INSERT INTO teachers (first_name, last_name, tc_no, school_id)
                VALUES (%s, %s, %s, %s)
            """, (f_name, l_name, tc_no, school_id))
            teacher_ids.append(cursor.lastrowid)
        print(f"{len(teacher_ids)} öğretmen oluşturuldu.")

        # 3. Create Classes
        # Schema: class_id, school_id, class_name, grade_level, teacher_id, room_number, capacity, branch, schedule_time
        print("Sınıflar oluşturuluyor...")
        grades = [9, 10, 11, 12] # Int based on schema 'grade_level' int
        sections = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        class_ids = []
        
        total_students = 2000
        classes_per_grade = 17 
        
        count = 0
        for grade in grades:
            for i in range(classes_per_grade):
                section = sections[i]
                class_name = f"{grade}-{section}"
                
                # Assign a random teacher as supervisor
                teacher_id = random.choice(teacher_ids)
                
                cursor.execute("""
                    INSERT INTO classes (class_name, grade_level, branch, teacher_id, school_id, capacity, room_number)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (class_name, grade, section, teacher_id, school_id, 30, f"{grade}0{i+1}"))
                class_ids.append(cursor.lastrowid)
                count += 1
        
        print(f"{len(class_ids)} sınıf oluşturuldu.")

        # 4. Distribute 2000 Students
        # Schema: student_id, school_id, first_name, last_name, tc_no, class_id, is_active
        print("Öğrenciler oluşturuluyor ve dağıtılıyor...")
        
        for i in range(total_students):
            student_number = 1000 + i # Explicit ID
            f_name, l_name = generate_name()
            
            # Distribute evenly
            class_id = class_ids[i % len(class_ids)]
            
            cursor.execute("""
                INSERT INTO students (student_id, first_name, last_name, class_id, school_id, tc_no)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (student_number, f_name, l_name, class_id, school_id, str(20000000000 + i)))
            
            if i % 100 == 0:
                print(f"{i} öğrenci eklendi...", end="\r")
                
        print(f"\nToplam {total_students} öğrenci başarıyla eklendi.")

        conn.commit()
        print("İşlem tamamlandı!")

    except Exception as e:
        print(f"Hata oluştu: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    populate()
