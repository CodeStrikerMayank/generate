import pytest
from backend.app.database.connection import SessionLocal, Base, engine
from backend.app.models.schema import Student, Question, DailyAssignment, DailyAssignmentItem
from backend.app.curriculum.exambench_service import ExamBenchService
from backend.app.assessment.question_selector import QuestionSelector, STREAM_SUBJECTS
from backend.app.api.assignments import (
    get_today_assignment, save_assignment_progress, submit_assignment,
    get_assignment_history, SaveProgressRequest, SubmitAssignmentRequest, ItemProgress
)

def setup_module():
    Base.metadata.create_all(bind=engine)

def test_exambench_service_and_classification():
    service = ExamBenchService()
    assert len(service.cached_rows) > 0, "ExamBench cache should contain cached rows"

    # Test Mathematics classification
    m_exam, m_sub, m_chap, m_top = service.classify_row("Find the area enclosed by the curve y = x^3 - x and the x-axis.")
    assert m_sub == "Mathematics"

    # Test Physics classification
    p_exam, p_sub, p_chap, p_top = service.classify_row("Explain how a step-up transformer works in AC transmission.")
    assert p_sub == "Physics"

    # Test Chemistry classification
    c_exam, c_sub, c_chap, c_top = service.classify_row("Explain the structure and bonding properties of phosphine gas.")
    assert c_sub == "Chemistry"

    # Test Biology classification
    b_exam, b_sub, b_chap, b_top = service.classify_row("How do immune cells and digestive enzymes interact in gut physiology?")
    assert b_sub == "Biology"

    # Test MCQ synthesis
    mcq = service.synthesize_mcq(service.cached_rows[0], 1)
    assert mcq["question_id"].startswith("EB_")
    assert len(mcq["options"]) == 4
    assert mcq["correct_answer"] in ["A", "B", "C", "D"]
    assert len(mcq["distractor_explanations"]) == 3


def test_strict_stream_scoping_question_selector():
    db = SessionLocal()
    try:
        selector = QuestionSelector(db)

        # JEE selection: MUST only contain Physics, Chemistry, or Mathematics
        jee_qs = selector.select_questions(exam="JEE", count=9)
        assert len(jee_qs) > 0
        for q in jee_qs:
            assert q.subject in STREAM_SUBJECTS["JEE"], f"Unexpected subject {q.subject} in JEE pool"

        # NEET selection: MUST only contain Biology, Physics, or Chemistry
        neet_qs = selector.select_questions(exam="NEET", count=9)
        assert len(neet_qs) > 0
        for q in neet_qs:
            assert q.subject in STREAM_SUBJECTS["NEET"], f"Unexpected subject {q.subject} in NEET pool"
    finally:
        db.close()


def test_daily_assignment_lifecycle():
    db = SessionLocal()
    try:
        student_id = "test_student_daily_asgn"
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            student = Student(
                student_id=student_id,
                name="Siddharth Gupta",
                email="sid@adaptive.local",
                password_hash="mock",
                target_exam="JEE"
            )
            db.add(student)
            db.commit()

        # 1. Fetch/Generate today's assignment (20 Qs per subject = 60 total)
        data = get_today_assignment(student_id=student_id, questions_per_subject=20, db=db)
        assert data["total_questions"] == 60
        assert set(data["subjects"]) == {"Physics", "Chemistry", "Mathematics"}
        assert len(data["questions_by_subject"]["Physics"]) == 20
        assert len(data["questions_by_subject"]["Chemistry"]) == 20
        assert len(data["questions_by_subject"]["Mathematics"]) == 20

        aid = data["assignment_id"]

        # 2. Save partial progress
        p_q = data["questions_by_subject"]["Physics"][0]
        save_req = SaveProgressRequest(
            assignment_id=aid,
            responses=[
                ItemProgress(question_id=p_q["question_id"], student_answer="A", is_marked_review=True, time_taken_seconds=30)
            ]
        )
        save_res = save_progress_res = save_assignment_progress(save_req, db=db)
        assert save_progress_res["completed_count"] >= 1

        # 3. Submit assignment
        all_qs = []
        for sub in ["Physics", "Chemistry", "Mathematics"]:
            all_qs.extend(data["questions_by_subject"][sub])

        responses = [
            ItemProgress(
                question_id=q["question_id"],
                student_answer="A",
                is_marked_review=False,
                time_taken_seconds=45
            )
            for q in all_qs
        ]

        sub_req = SubmitAssignmentRequest(assignment_id=aid, responses=responses, time_taken_seconds=1800)
        sub_res = submit_assignment(sub_req, db=db)

        assert sub_res["status"] == "COMPLETED"
        assert sub_res["total_questions"] == 60
        assert sub_res["completed_count"] == 60
        assert "Physics" in sub_res["subject_scores"]
        assert "Chemistry" in sub_res["subject_scores"]
        assert "Mathematics" in sub_res["subject_scores"]

        # 4. Check history & streak
        hist = get_assignment_history(student_id=student_id, db=db)
        assert hist["streak_days"] >= 1
        assert hist["total_assignments_completed"] >= 1
    finally:
        db.close()
