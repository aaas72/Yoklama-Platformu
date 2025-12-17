from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from server.controllers import class_controller
from server.config.security import get_current_admin, get_current_user

router = APIRouter()

class ClassModel(BaseModel):
    name: str
    schedule_time: Optional[str] = None # Format: HH:MM:SS
    room_number: Optional[str] = None
    capacity: Optional[int] = 30
    grade_level: Optional[int] = None
    branch: Optional[str] = None
    teacher_id: Optional[int] = None

class ClassUpdateModel(BaseModel):
    name: Optional[str] = None
    schedule_time: Optional[str] = None
    room_number: Optional[str] = None
    capacity: Optional[int] = None
    grade_level: Optional[int] = None
    branch: Optional[str] = None
    teacher_id: Optional[int] = None

@router.get("/", tags=["Classes"])
def get_classes(current_user: dict = Depends(get_current_user)):
    """Kullanıcı okuluna ait tüm sınıfları getir"""
    school_id = current_user.get("school_id")
    if not school_id:
        return []
        
    return class_controller.get_all_classes(school_id)

@router.get("/{class_id}", tags=["Classes"])
def get_class(class_id: int, current_user: dict = Depends(get_current_user)):
    cls = class_controller.get_class_by_id(class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    if cls['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
        
    return cls

@router.post("/", tags=["Classes"])
def add_new_class(cls: ClassModel, current_user: dict = Depends(get_current_admin)):
    """Yeni sınıf ekle (Yöneticiler için)"""
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Sınıf eklemek için yönetici bir okula ait olmalıdır")
        
    result = class_controller.add_class(
        school_id, 
        cls.name, 
        cls.schedule_time, 
        cls.room_number,
        cls.capacity,
        cls.grade_level,
        cls.branch,
        cls.teacher_id
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.put("/{class_id}", tags=["Classes"])
def update_class(class_id: int, cls: ClassUpdateModel, current_user: dict = Depends(get_current_admin)):
    # Verify existence and ownership
    existing = class_controller.get_class_by_id(class_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Sınıf bulunamadı")
    
    if existing['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
    
    data = cls.dict(exclude_unset=True)
    result = class_controller.update_class(class_id, data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.delete("/{class_id}", tags=["Classes"])
def delete_class(class_id: int, current_user: dict = Depends(get_current_admin)):
    """Sınıfı sil"""
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Yönetici bir okula ait olmalıdır")
        
    result = class_controller.delete_class(class_id, school_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result
