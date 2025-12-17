from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import mysql.connector

# Dictionary for error translations (English -> Turkish)
# You can expand this list as needed
TRANSLATIONS = {
    "Student not found": "Öğrenci bulunamadı",
    "Student ID already exists": "Öğrenci numarası zaten mevcut",
    "Database error": "Veritabanı hatası",
    "Validation Error": "Doğrulama hatası",
    "Internal Server Error": "Dahili sunucu hatası",
    "Not Found": "Bulunamadı",
    "Unauthorized": "Yetkisiz işlem",
    "Forbidden": "Erişim engellendi",
    "Method Not Allowed": "Yönteme izin verilmiyor",
    "Could not validate credentials": "Kimlik bilgileri doğrulanamadı",
    "Incorrect username or password": "Kullanıcı adı veya şifre hatalı",
    "Token has expired": "Oturum süresi doldu",
    "Invalid token": "Geçersiz oturum anahtarı",
    "Face not detected": "Yüz algılanamadı",
    "Multiple faces detected": "Birden fazla yüz algılandı",
    "Face too small": "Yüz çok küçük",
    "Image too blurry": "Görüntü çok bulanık",
    "Image too dark": "Görüntü çok karanlık",
    "Image too bright": "Görüntü çok parlak",
    "Cannot delete student: Related records exist": "Öğrenci silinemez: Bağlı kayıtlar (yoklama vb.) mevcut",
    "No valid fields to update": "Güncellenecek geçerli veri yok",
    "Duplicate entry": "Bu kayıt zaten mevcut",
    "Teacher not found": "Öğretmen bulunamadı",
    "Cannot delete teacher: Related records exist": "Öğretmen silinemez: Bağlı kayıtlar mevcut",
    "Class not found or access denied": "Sınıf bulunamadı veya erişim yetkiniz yok",
    "Cannot delete class: Related records exist": "Sınıf silinemez: Bağlı kayıtlar mevcut",
    "Öğrenci numarası sadece rakamlardan oluşmalıdır": "Öğrenci numarası sadece rakamlardan oluşmalıdır",
    "TC Kimlik No 11 haneden uzun olamaz": "TC Kimlik No 11 haneden uzun olamaz",
    "Veri çok uzun (örn. İsim veya TC No)": "Girilen veri çok uzun (İsim veya TC No)",
    "Veri tipi hatası (örn. Öğrenci No sayı olmalıdır)": "Veri tipi hatası: Öğrenci No sayı olmalıdır",
    "Veri çok uzun": "Girilen veri çok uzun",
    "Veri tipi hatası": "Veri tipi hatası",
    "Bu öğrenciye erişim yetkiniz yok": "Bu öğrenciye erişim yetkiniz yok",
    "Yönetici bir okula ait olmalıdır": "Yönetici bir okula ait olmalıdır",
    "Yetkisiz erişim": "Yetkisiz erişim",
    "Silme işlemi başarısız oldu": "Silme işlemi başarısız oldu",
}

def translate_message(msg: str) -> str:
    """Helper to translate exact matches or partial matches if needed"""
    # 1. Exact match
    if msg in TRANSLATIONS:
        return TRANSLATIONS[msg]
    
    # 2. Check if any key is part of the message (simple containment)
    for key, val in TRANSLATIONS.items():
        if key in msg:
            return val
            
    # 3. Return original if no translation found
    return msg

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error['loc']) if 'loc' in error else "field"
        msg = error['msg']
        errors.append(f"{field}: {translate_message(msg)}")
        
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": TRANSLATIONS["Validation Error"],
            "details": errors
        }
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles standard HTTP exceptions thrown by FastAPI"""
    translated_detail = translate_message(str(exc.detail))
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": translated_detail,
            "code": exc.status_code
        }
    )

async def db_exception_handler(request: Request, exc: mysql.connector.Error):
    """Handles MySQL database errors"""
    print(f"Database Error: {exc}") # Log for server admin
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": TRANSLATIONS["Database error"],
            "code": 500
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    """Handles all other unhandled exceptions"""
    print(f"Unhandled Exception: {exc}") # Log for server admin
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": TRANSLATIONS["Internal Server Error"],
            "detail": str(exc) if "development" in str(request.url) else None 
        }
    )

def add_exception_handlers(app):
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(mysql.connector.Error, db_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)
