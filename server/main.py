import warnings
warnings.filterwarnings("ignore", category=UserWarning, message="pkg_resources is deprecated as an API")
warnings.filterwarnings("ignore", category=UserWarning, module="face_recognition_models")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.config.database import init_db
from server.routes import student_routes, auth_routes, school_routes, class_routes, teacher_routes
from server.controllers import attendance_controller
from server.controllers.auth_controller import seed_admin_if_not_exists
from server.middleware.error_handler import add_exception_handlers
import uvicorn

# Başlangıçta veritabanını başlat
# Not: Tablolar yoksa oluşturulacaktır
init_db()
seed_admin_if_not_exists()

app = FastAPI(title="Attendance System API", description="Akıllı Yoklama Sistemi - API Backend")

# Hata yakalayıcıları (Middleware) ekle
add_exception_handlers(app)

# CORS (Cross-Origin Resource Sharing) ayarları
# Bu, ön yüzün (React/HTML) sunucuyla iletişim kurmasını sağlar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme amaçlı tüm kaynaklara izin ver
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router dosyalarını ana uygulamaya bağla
app.include_router(auth_routes.router, prefix="/api/auth")
app.include_router(student_routes.router, prefix="/api/students")
app.include_router(attendance_controller.router, prefix="/api/attendance")
app.include_router(school_routes.router, prefix="/api/school")
app.include_router(class_routes.router, prefix="/api/classes")
app.include_router(teacher_routes.router, prefix="/api/teachers")

@app.get("/")
def read_root():
    return {"message": "Yoklama Sistemi API'sine Hoş Geldiniz. Swagger UI için /docs adresine gidin."}

if __name__ == "__main__":
    # Sunucuyu başlat
    # Terminalden çalıştırmak için: uvicorn server.main:app --reload
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
