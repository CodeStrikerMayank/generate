import pytest
import datetime
from backend.app.database.connection import SessionLocal
from backend.app.models.schema import Student, StudentConceptMastery, StudentErrorLog, Concept, Question
from backend.app.api.supporting import get_review_queue, get_error_trends, get_report_card

def test_supporting_endpoints():
    db = SessionLocal()
    try:
        # Create test student
        sid = "test_sup_student_1"
        student = db.query(Student).filter(Student.student_id == sid).first()
        if not student:
            student = Student(
                student_id=sid,
                name="Aarav Sharma",
                email="aarav@example.com",
                password_hash="mock_hash_123",
                target_exam="JEE",
                daily_available_hours=3.5
            )
            db.add(student)

        # Add mastery record with decay
        q = db.query(Question).first()
        c = db.query(Concept).first()
        qid = q.question_id if q else "JEE_2021_PHY_001"
        cid = q.concept_id if q else (c.concept_id if c else "phy_vectors_basic")

        m = db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == sid,
            StudentConceptMastery.concept_id == cid
        ).first()
        if not m:
            m = StudentConceptMastery(
                student_id=sid,
                concept_id=cid,
                mastery=0.45,
                retention_score=0.40,
                forgetting_risk=0.60,
                last_practiced_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)
            )
            db.add(m)
        else:
            m.retention_score = 0.40
            m.forgetting_risk = 0.60

        # Add error log
        err = StudentErrorLog(
            student_id=sid,
            question_id=qid,
            concept_id=cid,
            error_type="CALCULATION_SLIP",
            details="Sign inversion",
            timestamp=datetime.datetime.utcnow()
        )
        db.add(err)
        db.commit()

        # 1. Test Review Queue
        data_rq = get_review_queue(sid, db)
        assert "queue" in data_rq
        assert data_rq["total_due"] >= 1

        # 2. Test Error Trends
        data_et = get_error_trends(sid, db)
        assert "by_error_type" in data_et
        assert "CALCULATION_SLIP" in data_et["by_error_type"]

        # 3. Test Report Card
        data_rc = get_report_card(sid, db)
        assert data_rc["student"]["name"] == "Aarav Sharma"
        assert "subject_breakdown" in data_rc
        assert "overall_performance" in data_rc

    finally:
        db.close()
