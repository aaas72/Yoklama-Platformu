from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Union
from server.controllers import student_controller
from server.config.security import get_current_user, get_current_admin
import json
import numpy as np

router = APIRouter()

class StudentModel(BaseModel):
    full_name: str
    student_id: Union[str, int]
    class_id: Optional[int] = None
    photo_url: Optional[str] = None
    photos: Optional[list[str]] = None
    face_encoding: Optional[str] = None
    tc_no: Optional[str] = None
    birth_date: Optional[str] = None

class StudentUpdateModel(BaseModel):
    full_name: Optional[str] = None
    student_id: Optional[Union[str, int]] = None
    class_id: Optional[int] = None
    photo_url: Optional[str] = None
    photos: Optional[list[str]] = None
    face_encoding: Optional[str] = None
    tc_no: Optional[str] = None
    birth_date: Optional[str] = None

@router.get("/", tags=["Students"])
def get_students(current_user: dict = Depends(get_current_user)):
    """Kullanıcı okulunun tüm öğrenci listesini getir"""
    school_id = current_user.get("school_id")
    if not school_id:
        return []
        
    return student_controller.get_all_students(school_id)

@router.get("/{student_id}", tags=["Students"])
def get_student(student_id: int, current_user: dict = Depends(get_current_user)):
    student = student_controller.get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # Ensure student belongs to user's school
    if student['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Bu öğrenciye erişim yetkiniz yok")
        
    return student

@router.post("/", tags=["Students"])
def add_new_student(student: StudentModel, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_admin)):
    """Yeni öğrenci ekle (Yönetici yetkisi gerektirir)"""
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Yönetici bir okula ait olmalıdır")
        
    # Validate student_id
    if not str(student.student_id).isdigit():
        raise HTTPException(status_code=400, detail="Öğrenci numarası sadece rakamlardan oluşmalıdır")
        
    # Validate TC No length
    if student.tc_no and len(student.tc_no) > 11:
        raise HTTPException(status_code=400, detail="TC Kimlik No 11 haneden uzun olamaz")

    # Compute face encoding if photo is provided
    encoding_json = student.face_encoding
    if not encoding_json and student.photo_url:
        try:
            from server.utils import face_utils
            encoding = face_utils.get_face_encoding_from_base64(student.photo_url)
            if encoding:
                encoding_json = json.dumps(encoding)
        except Exception:
            pass

    # Split full name
    parts = student.full_name.strip().split(" ")
    last_name = parts.pop() if len(parts) > 1 else ""
    first_name = " ".join(parts) if parts else student.full_name

    result = student_controller.add_student(
        school_id=school_id,
        first_name=first_name,
        last_name=last_name,
        student_id=student.student_id,
        class_id=student.class_id,
        tc_no=student.tc_no or "00000000000",
        birth_date=student.birth_date or "2000-01-01"
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    quality_summary = None
    if encoding_json and (not student.photos or len(student.photos) == 0):
        try:
            student_controller._insert_face_embedding(student.student_id, json.loads(encoding_json), "enrollment")
            student_controller._upsert_face_profile(student.student_id, encoding_json, 1)
        except Exception:
            pass
    if student.photos and len(student.photos) > 0:
        quality_summary = student_controller.process_student_photos(student.student_id, student.photos)

        
    if quality_summary:
        result["quality_summary"] = quality_summary
    return result

@router.put("/{student_id}", tags=["Students"])
def update_student(student_id: int, student: StudentUpdateModel, current_user: dict = Depends(get_current_admin)):
    # Verify existence and ownership
    existing = student_controller.get_student_by_id(student_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    if existing['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
    
    # Filter None values
    data = student.dict(exclude_unset=True)
    
    # Handle name split if provided
    if 'full_name' in data:
        parts = data['full_name'].strip().split(" ")
        data['last_name'] = parts.pop() if len(parts) > 1 else ""
        data['first_name'] = " ".join(parts) if parts else data['full_name']
        del data['full_name']

    # If photo is updated, update encoding
    if 'photo_url' in data and 'face_encoding' not in data:
        if data['photo_url']:
            try:
                from server.utils import face_utils
                encoding = face_utils.get_face_encoding_from_base64(data['photo_url'])
                if encoding:
                    data['face_encoding'] = json.dumps(encoding)
            except Exception:
                pass
        else:
             # Photo removed? Maybe remove encoding too?
             pass

    # Process multiple photos if provided
    quality_summary = None
    if student.photos and len(student.photos) > 0:
        # Use the new ID if being updated, otherwise the existing one
        target_id = data.get('student_id', student_id)
        quality_summary = student_controller.process_student_photos(target_id, student.photos)

    result = student_controller.update_student(student_id, data)
    if quality_summary:
        result["quality_summary"] = quality_summary
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.delete("/{student_id}", tags=["Students"])
def delete_student(student_id: int, current_user: dict = Depends(get_current_admin)):
    # Verify existence and ownership
    existing = student_controller.get_student_by_id(student_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    if existing['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
    
    result = student_controller.delete_student(student_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result
