from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Union

# Import the refactored service functions
from .attendance.scan_service import process_scan
from .attendance.records_service import get_attendance_logs
from .attendance.stats_service import get_stats
from server.config.security import get_current_user

router = APIRouter()

class ScanRequest(BaseModel):
    image: str

class ScanResponse(BaseModel):
    status: str
    student_id: Union[str, int] = None
    student_name: str = None
    class_name: str = None
    attendance_status: str = None
    method: str = None
    message: str
    sim: float = None
    dist: float = None

@router.post("/scan", response_model=ScanResponse, tags=["Attendance"])
def scan_face(scan_request: ScanRequest, current_user: dict = Depends(get_current_user)):
    """
    Processes a single frame for face recognition and attendance marking.
    """
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=403, detail="User is not associated with a school")

    try:
        result = process_scan(school_id, scan_request.image)
        return ScanResponse(**result)
    except Exception as e:
        print(f"[ERROR] Exception in /scan: {e}")
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")

@router.get("/logs", tags=["Attendance"])
def get_logs(current_user: dict = Depends(get_current_user)):
    """
    Retrieves attendance logs for the current user's school.
    """
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=403, detail="User is not associated with a school")
    
    return get_attendance_logs(school_id)

@router.get("/stats", tags=["Attendance"])
def get_statistics(current_user: dict = Depends(get_current_user)):
    """
    Retrieves attendance statistics for the current user's school.
    """
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=403, detail="User is not associated with a school")

    return get_stats(school_id)
