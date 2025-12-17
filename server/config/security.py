from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from server.config.database import get_db_connection

# Şifreleme ve token ayarları
SECRET_KEY = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_THIS_IN_PROD"  # Prodüksiyonda değiştirilmeli
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Bir gün

# Şifreleme bağlamı ayarı
# bcrypt (72 bayt sınırı) sorunlarından kaçınmak için pbkdf2_sha256 kullanımı
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    """Parola doğrulama"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Parola şifreleme"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Erişim belirteci (JWT) oluştur"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Token üzerinden mevcut kullanıcıyı doğrula.
    Korumalı rotalarda Dependency olarak kullanılır.
    """
    print(f"--- [SECURITY] Validating Token ---")
    print(f"Token received: {token[:20]}...{token[-20:] if len(token) > 20 else ''}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik bilgileri doğrulanamadı",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        school_id: int = payload.get("school_id") # None olabilir
        
        print(f"Token Decoded Successfully: User={username}, Role={role}, SchoolID={school_id}")
        
        if username is None:
            print("Error: Username is None in payload")
            raise credentials_exception
    except JWTError as e:
        print(f"Error: JWT Validation Failed: {str(e)}")
        raise credentials_exception
        
    # Veritabanında kullanıcı kontrolü (Güvenliği artırmak için opsiyonel)
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        conn.close()
        if user is None:
            return {"username": username, "role": role, "school_id": school_id}
        
        print(f"User verified in DB: ID={user.get('id')}")
        return user
    
    print("Warning: DB Connection failed, returning payload data only")
    return {"username": username, "role": role, "school_id": school_id}

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    """Mevcut kullanıcının yönetici (Admin) olup olmadığını kontrol et"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yetersiz izinler"
        )
    return current_user
