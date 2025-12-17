from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from server.controllers import auth_controller
from server.config.security import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"

class SchoolRegistration(BaseModel):
    school_name: str
    manager_name: str
    address: str
    admin_username: str
    admin_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    school_id: Optional[int] = None

@router.post("/register-school", tags=["Public"])
def register_school(data: SchoolRegistration):
    """
    Yeni bir okul kaydet ve yöneticisi (Admin) için hesap oluştur.
    Sistemin ana giriş noktasıdır.
    """
    result = auth_controller.register_school_with_admin(
        data.school_name, 
        data.manager_name, 
        data.address, 
        data.admin_username, 
        data.admin_password
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Erişim belirteci (Token) almak için giriş yap"""
    print(f"--- [AUTH] Login Attempt: {form_data.username} ---")
    user = auth_controller.authenticate_user(form_data.username, form_data.password)
    if not user:
        print(f"Error: Authentication failed for user {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"Success: User {form_data.username} authenticated. Generating token...")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # تضمين school_id في التوكن
    access_token = create_access_token(
        data={
            "sub": user["username"], 
            "role": user["role"],
            "school_id": user.get("school_id")
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"],
        "school_id": user.get("school_id")
    }

@router.post("/register", tags=["Admin"])
def register_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    """
    Yeni kullanıcı oluştur (Yönetici/Öğretmen/Öğrenci).
    Yönetici girişi ve yetkisi gerektirir.
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Kullanıcı oluşturma yetkiniz yok")
    
    # Yeni kullanıcıyı yöneticinin okuluyla ilişkilendir
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="Yöneticinin kullanıcı oluşturabilmesi için bir okula ait olması gerekir")

    result = auth_controller.create_user(user.username, user.password, user.role, school_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.get("/me", response_model=dict)
def read_users_me(current_user: dict = Depends(get_current_user)):
    """Mevcut kullanıcı bilgilerini getir"""
    return {
        "username": current_user["username"],
        "role": current_user["role"],
        "school_id": current_user.get("school_id"),
        "created_at": current_user.get("created_at")
    }
