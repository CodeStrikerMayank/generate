import pytest
import uuid
from backend.app.database.connection import SessionLocal, Base, engine
from backend.app.models.schema import Student, Question, UPSCWrittenSubmission
from backend.app.curriculum.benchmark_service import JeeNeetBenchmarkService
from backend.app.curriculum.loader import seed_curriculum_and_questions
from backend.app.api.upsc import (
    get_mains_prompts, get_prelims_quiz, evaluate_written_answer, get_upsc_history,
    WrittenSubmissionInput
)

def setup_module():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_curriculum_and_questions(db)

def test_jee_neet_benchmark_service_cache_and_seeding():
    service = JeeNeetBenchmarkService()
    assert len(service.cached_rows) > 0, "Benchmark service should load cached authentic rows"
    
    # Verify row structure from Reja1/jee-neet-benchmark
    sample = service.cached_rows[0]
    row = sample.get("row", sample)
    assert "image" in row
    assert "src" in row["image"]
    assert "exam_name" in row

    # Test parser
    assert service.parse_correct_letter('["1"]') == "A"
    assert service.parse_correct_letter('["2"]') == "B"
    assert service.parse_correct_letter('["C"]') == "C"

    # Test seeding into database
    with SessionLocal() as db:
        service.seed_to_database(db, max_items=25)

        # Verify question attributes
        benchmark_qs = db.query(Question).filter(Question.question_id.like("BENCH_%")).all()
        assert len(benchmark_qs) > 0, "Benchmark questions should be present in database"
        for bq in benchmark_qs:
            assert bq.image_url is not None
            assert len(bq.options) >= 2
            assert bq.exam in ["JEE", "NEET"]
            if bq.exam == "JEE":
                assert bq.subject in ["Physics", "Chemistry", "Mathematics"]
            elif bq.exam == "NEET":
                assert bq.subject in ["Biology", "Physics", "Chemistry"]

def test_upsc_mains_prompts_endpoint():
    prompts = get_mains_prompts()
    assert len(prompts) >= 4
    for p in prompts:
        assert "question_id" in p
        assert "paper" in p
        assert "word_limit" in p
        assert "marks" in p
        assert len(p["key_dimensions"]) > 0
        assert len(p["recommended_structure"]) > 0

def test_upsc_prelims_quiz_endpoint():
    with SessionLocal() as db:
        quiz = get_prelims_quiz(db)
        assert len(quiz) > 0
        for item in quiz:
            assert "question_id" in item
            assert "content" in item
            assert "options" in item
            assert "correct_answer" in item
            assert "explanation" in item

def test_upsc_written_evaluation_rubrics():
    with SessionLocal() as db:
        # Create test student
        test_sid = f"stud_upsc_{uuid.uuid4().hex[:6]}"
        student = Student(
            student_id=test_sid,
            name="Aarav Civil Aspirant",
            email=f"aarav_{uuid.uuid4().hex[:6]}@upsc.test",
            password_hash="test_hash",
            target_exam="UPSC"
        )
        db.add(student)
        db.commit()

        # Comprehensive analytical essay answer
        comprehensive_answer = """
        The Basic Structure doctrine, enunciated by the Supreme Court of India in the landmark Kesavananda Bharati case (1973), represents an essential constitutional safeguard against executive hegemony and unchecked parliamentary sovereignty under Article 368.

        Arguments in favor of judicial review and basic structure:
        - Prevents subversion of core democratic principles: It ensures that no transient legislative majority can dilute the secular fabric, republican framework, or separation of powers.
        - Upholds constitutional morality: In the NJAC judgment and Minerva Mills, the judiciary asserted that the Constitution, not Parliament, remains supreme.
        - Safeguards fundamental rights: Without judicial review under Article 13 and 32, individual liberty would be hostage to majoritarian impulses.

        However, critics highlight significant operational challenges:
        - Judicial overreach: Critics argue that vague parameters of 'basic structure' enable unelected judges to veto policy choices and legislative mandates, creating democratic accountability friction.
        - Ambiguity and lack of textual constitutional basis: Article 368 contains no explicit mention of the doctrine, leading some to view it as judicial legislation.

        In conclusion, while judicial restraint is imperative to prevent institutional overstepping, the Basic Structure doctrine remains the bedrock of Indian constitutionalism and the ultimate bulwark against democratic backsliding.
        """

        req = WrittenSubmissionInput(
            student_id=test_sid,
            question_id="UPSC_MAINS_GS2_01",
            answer_text=comprehensive_answer,
            time_taken_seconds=480
        )

        eval_result = evaluate_written_answer(req, db)
        assert eval_result["total_score"] >= 8.0, "Comprehensive answer should score high on UPSC rubric"
        assert "rubric_scores" in eval_result
        rubrics = eval_result["rubric_scores"]
        assert "understanding" in rubrics
        assert "structure" in rubrics
        assert "content_depth" in rubrics
        assert "policy_context" in rubrics
        assert "critical_balance" in rubrics
        assert eval_result["word_count"] > 100

        # Test history retrieval
        history = get_upsc_history(test_sid, db)
        assert len(history) == 1
        assert history[0]["submission_id"] == eval_result["submission_id"]
        assert history[0]["total_score"] == eval_result["total_score"]

def test_both_huggingface_apis_coexist_in_db():
    with SessionLocal() as db:
        # Check ExamBench questions (169Pi/exambench)
        eb_count = db.query(Question).filter(Question.question_id.like("EB_%")).count()
        assert eb_count > 0, "169Pi/exambench questions must exist in database"

        # Check Benchmark questions (Reja1/jee-neet-benchmark)
        bm_count = db.query(Question).filter(Question.question_id.like("BENCH_%")).count()
        assert bm_count > 0, "Reja1/jee-neet-benchmark questions must exist in database"

        # Check UPSC questions
        upsc_count = db.query(Question).filter(Question.exam == "UPSC").count()
        assert upsc_count > 0, "UPSC questions must exist in database"
