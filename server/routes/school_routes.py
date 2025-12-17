from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from server.controllers import school_controller
from server.config.security import get_current_admin, get_current_user

router = APIRouter()

class SchoolInfoModel(BaseModel):
    name: str
    manager_name: str
    address: Optional[str] = None
    logo_url: Optional[str] = None

@router.get("/", tags=["School"])
def get_info(current_user: dict = Depends(get_current_user)):
    """Mevcut kullanıcının okul bilgilerini getir"""
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=404, detail="Kullanıcı herhangi bir okula atanmamış")
        
    info = school_controller.get_school_info(school_id)
    if not info:
        raise HTTPException(status_code=404, detail="Okul bulunamadı")
    return info

@router.post("/", tags=["School"])
def update_info(info: SchoolInfoModel, current_user: dict = Depends(get_current_admin)):
    """Okul bilgilerini güncelle (Yöneticiler için)"""
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Yönetici herhangi bir okula atanmamış")
        
    result = school_controller.update_school_info(
        school_id, 
        info.name, 
        info.manager_name, 
        info.address, 
        info.logo_url
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result
