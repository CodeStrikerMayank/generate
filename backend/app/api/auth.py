import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.models.schema import Student, StudentConceptMastery
from backend.app.schemas.pydantic_models import (
    StudentRegisterRequest, StudentLoginRequest, StudentProfileResponse
)
from backend.app.events.collector import EventCollector

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

@router.post("/register", response_model=StudentProfileResponse)
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    student_id = f"std_{uuid.uuid4().hex[:12]}"
    student = Student(
        student_id=student_id,
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        target_exam=req.target_exam,
        target_track=req.target_track,
        daily_available_hours=req.daily_available_hours,
        current_level="BEGINNER"
    )
    db.add(student)
    db.commit()

    EventCollector.log_event(
        db=db,
        student_id=student_id,
        session_id="auth",
        event_type="COURSE_STARTED",
        metadata={"exam": req.target_exam}
    )
    db.commit()

    return StudentProfileResponse(
        student_id=student.student_id,
        name=student.name,
        email=student.email,
        target_exam=student.target_exam,
        target_track=student.target_track,
        daily_available_hours=student.daily_available_hours,
        current_level=student.current_level,
        overall_mastery=0.0,
        overall_confidence=0.10,
        created_at=student.created_at
    )

@router.post("/login", response_model=StudentProfileResponse)
def login_student(req: StudentLoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == req.email).first()
    if not student or student.password_hash != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Calculate overall mastery & confidence
    masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student.student_id).all()
    overall_mastery = (sum(m.mastery for m in masteries) / max(len(masteries), 1)) if masteries else 0.0
    overall_conf = (sum(m.confidence for m in masteries) / max(len(masteries), 1)) if masteries else 0.10

    return StudentProfileResponse(
        student_id=student.student_id,
        name=student.name,
        email=student.email,
        target_exam=student.target_exam,
        target_track=student.target_track,
        daily_available_hours=student.daily_available_hours,
        current_level=student.current_level,
        overall_mastery=round(overall_mastery, 3),
        overall_confidence=round(overall_conf, 3),
        created_at=student.created_at
    )

@router.get("/profile/{student_id}", response_model=StudentProfileResponse)
def get_student_profile(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student_id).all()
    overall_mastery = (sum(m.mastery for m in masteries) / max(len(masteries), 1)) if masteries else 0.0
    overall_conf = (sum(m.confidence for m in masteries) / max(len(masteries), 1)) if masteries else 0.10

    return StudentProfileResponse(
        student_id=student.student_id,
        name=student.name,
        email=student.email,
        target_exam=student.target_exam,
        target_track=student.target_track,
        daily_available_hours=student.daily_available_hours,
        current_level=student.current_level,
        overall_mastery=round(overall_mastery, 3),
        overall_confidence=round(overall_conf, 3),
        created_at=student.created_at
    )
