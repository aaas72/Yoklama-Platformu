from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from server.controllers import attendance_controller
from server.config.security import get_current_user, get_current_admin
from server.ml.train_model import train_model_from_db

router = APIRouter()

class AttendanceRequest(BaseModel):
    student_id: str

class ScanRequest(BaseModel):
    image: str

@router.get("/", tags=["Attendance"])
def get_logs(current_user: dict = Depends(get_current_user)):
    """Kullanıcı okuluna ait yoklama kayıtlarını getir"""
    school_id = current_user.get("school_id")
    if not school_id:
        return []
        
    return attendance_controller.get_attendance_logs(school_id)

@router.post("/", tags=["Attendance"])
def record_attendance(data: AttendanceRequest):
    """
    Öğrenci yoklaması kaydet (Kamera için uç nokta).
    Öğrenci ve okul, student_id aracılığıyla otomatik olarak tanımlanır.
    """
    return attendance_controller.mark_attendance(data.student_id)

@router.post("/scan", tags=["Attendance"])
def scan_face(data: ScanRequest, current_user: dict = Depends(get_current_user)):
    """
    Yüz tanıma ve yoklama kaydı için kamera görüntüsünü işle
    """
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Okul kimliği bulunamadı")
        
    return attendance_controller.process_scan(school_id, data.image)

@router.get("/stats", tags=["Attendance"])
def get_statistics(current_user: dict = Depends(get_current_user)):
    """Kullanıcı okulu için hızlı istatistikler"""
    school_id = current_user.get("school_id")
    if not school_id:
        return {"today_count": 0, "total_students": 0}
        
    return attendance_controller.get_stats(school_id)

@router.post("/train", tags=["Attendance"])
def trigger_training(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_admin)):
    """Okul veri tabanındaki yüz embeddingleri ile MLP modelini eğit"""
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Yönetici bir okula ait olmalıdır")
    def _task():
        train_model_from_db(school_id)
    background_tasks.add_task(_task)
    return {"status": "started", "message": "Eğitim arka planda başlatıldı"}
