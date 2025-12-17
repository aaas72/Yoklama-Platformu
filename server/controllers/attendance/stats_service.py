from datetime import datetime, timedelta
from server.config.database import get_db_connection

def get_stats(school_id):
    conn = get_db_connection()
    if not conn:
        return {
            "total_students": 0,
            "total_classes": 0,
            "today_count": 0,
            "weekly_stats": []
        }

    try:
        cursor = conn.cursor(dictionary=True)

        # 1. Get total students
        cursor.execute("SELECT COUNT(*) as count FROM students WHERE school_id = %s", (school_id,))
        total_students = cursor.fetchone()['count']

        # 2. Get total classes
        cursor.execute("SELECT COUNT(*) as count FROM classes WHERE school_id = %s", (school_id,))
        total_classes = cursor.fetchone()['count']

        # 3. Get today's attendance count (unique students)
        today_str = datetime.now().strftime('%Y-%m-%d')
        cursor.execute(
            """SELECT COUNT(DISTINCT a.student_id) as count 
               FROM attendance a
               JOIN students s ON a.student_id = s.student_id
               WHERE s.school_id = %s AND DATE(a.timestamp) = %s""",
            (school_id, today_str)
        )
        today_count = cursor.fetchone()['count']

        # 4. Get weekly attendance stats (last 7 days)
        weekly_stats = []
        for i in range(7):
            day = datetime.now() - timedelta(days=i)
            day_str = day.strftime('%Y-%m-%d')
            day_name = day.strftime('%A') # Or a shorter version if preferred

            cursor.execute(
                """SELECT COUNT(DISTINCT a.student_id) as attendance, 
                          (SELECT COUNT(*) FROM students WHERE school_id = %s) - COUNT(DISTINCT a.student_id) as absence
                   FROM attendance a
                   JOIN students s ON a.student_id = s.student_id
                   WHERE s.school_id = %s AND DATE(a.timestamp) = %s""",
                (school_id, school_id, day_str)
            )
            daily_data = cursor.fetchone()
            weekly_stats.append({
                "name": day_name,
                "attendance": daily_data['attendance'],
                "absence": daily_data['absence'],
                "total": total_students
            })
        
        weekly_stats.reverse() # To show oldest day first

        cursor.close()
        conn.close()

        return {
            "total_students": total_students,
            "total_classes": total_classes,
            "today_count": today_count,
            "weekly_stats": weekly_stats
        }

    except Exception as e:
        print(f"[ERROR] Could not retrieve stats: {e}")
        if conn and conn.is_connected():
            conn.close()
        return {
            "total_students": 0,
            "total_classes": 0,
            "today_count": 0,
            "weekly_stats": []
        }
