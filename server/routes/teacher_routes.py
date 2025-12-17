from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel
from typing import Optional, List
from server.controllers import teacher_controller
from server.config.security import get_current_user, get_current_admin

router = APIRouter()

class TeacherBase(BaseModel):
    firstName: str
    lastName: str
    tcNo: Optional[str] = None
    birthDate: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    branch: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(TeacherBase):
    pass

@router.get("/")
def get_teachers(current_user: dict = Depends(get_current_user)):
    school_id = current_user.get("school_id")
    if not school_id:
        return []
    return teacher_controller.get_all_teachers(school_id)

@router.get("/{teacher_id}")
def get_teacher(teacher_id: int, current_user: dict = Depends(get_current_user)):
    teacher = teacher_controller.get_teacher_by_id(teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Öğretmen bulunamadı")
    
    if teacher['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
        
    return teacher

@router.post("/")
def create_teacher(teacher: TeacherCreate, current_user: dict = Depends(get_current_admin)):
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Yönetici bir okula ait olmalıdır")

    result = teacher_controller.add_teacher(
        school_id=school_id,
        first_name=teacher.firstName,
        last_name=teacher.lastName,
        tc_no=teacher.tcNo,
        birth_date=teacher.birthDate,
        phone=teacher.phone,
        email=teacher.email,
        branch=teacher.branch
    )
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=400, detail=result["message"])

@router.put("/{teacher_id}")
def update_teacher(teacher_id: int, teacher: TeacherUpdate, current_user: dict = Depends(get_current_admin)):
    # Verify existence and ownership
    existing = teacher_controller.get_teacher_by_id(teacher_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Öğretmen bulunamadı")
    
    if existing['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")

    # Convert camelCase to snake_case for database
    data = {
        "first_name": teacher.firstName,
        "last_name": teacher.lastName,
        "tc_no": teacher.tcNo,
        "birth_date": teacher.birthDate,
        "phone": teacher.phone,
        "email": teacher.email,
        "branch": teacher.branch
    }
    # Remove None values
    data = {k: v for k, v in data.items() if v is not None}
    
    result = teacher_controller.update_teacher(teacher_id, data)
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=400, detail=result["message"])

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, current_user: dict = Depends(get_current_admin)):
    existing = teacher_controller.get_teacher_by_id(teacher_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Öğretmen bulunamadı")
    
    if existing['school_id'] != current_user.get('school_id'):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")

    result = teacher_controller.delete_teacher(teacher_id)
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=400, detail=result["message"])
