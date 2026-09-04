import uuid
import datetime
import random
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.models.schema import (
    Assessment, AssessmentAttempt, StudentAttemptItem, Question,
    StudentConceptMastery, StudentErrorLog, Student
)
from backend.app.assessment.question_selector import QuestionSelector
from backend.app.assessment.timer import AssessmentTimer
from backend.app.student_model.mastery import MasteryEngine
from backend.app.student_model.bkt import BayesianKnowledgeTracing
from backend.app.student_model.irt import ItemResponseTheory
from backend.app.student_model.retention import ForgettingModel
from backend.app.student_model.error_classifier import ErrorClassifier
from backend.app.events.collector import EventCollector

class QuizEngine:
    """
    Assessment lifecycle manager: initializes timed diagnostic tests, evaluates submissions,
    updates student model statistics, and logs telemetry.
    """
    def __init__(self, db: Session):
        self.db = db
        self.selector = QuestionSelector(db)
        self.mastery_engine = MasteryEngine(db)
        self.bkt = BayesianKnowledgeTracing()
        self.forgetting_model = ForgettingModel()

    def start_assessment(
        self,
        student_id: str,
        exam: str = "JEE",
        assessment_type: str = "DIAGNOSTIC",
        stage: int = 1,
        duration_minutes: int = 30,
        target_concept_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a new assessment attempt session and selects personalized questions.
        """
        assessment_id = f"asmt_{uuid.uuid4().hex[:12]}"
        attempt_id = f"att_{uuid.uuid4().hex[:12]}"
        session_id = f"sess_{uuid.uuid4().hex[:16]}"

        title = f"{exam} Stage {stage} {assessment_type.replace('_', ' ').title()}"

        assessment = Assessment(
            assessment_id=assessment_id,
            exam=exam,
            title=title,
            assessment_type=assessment_type,
            stage=stage,
            duration_minutes=duration_minutes,
            is_strict_timed=True
        )
        self.db.add(assessment)
        self.db.flush()

        # Retrieve student latent ability theta if available
        student_masteries = self.db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == student_id
        ).all()
        student_theta = sum(m.irt_ability for m in student_masteries) / max(len(student_masteries), 1)

        # Select adaptive questions
        questions = self.selector.select_questions(
            exam=exam,
            student_id=student_id,
            target_concept_id=target_concept_id,
            diagnostic_goal=assessment_type,
            desired_difficulty=None,
            student_theta=student_theta,
            count=12 if assessment_type == "DIAGNOSTIC" else 6
        )

        return self._create_assessment_session(
            student_id=student_id,
            exam=exam,
            title=title,
            assessment_type=assessment_type,
            stage=stage,
            duration_minutes=duration_minutes,
            questions=questions,
            test_tier="SCREENER" if assessment_type == "DIAGNOSTIC" else "TOPIC_DRILL"
        )

    def _create_assessment_session(
        self,
        student_id: str,
        exam: str,
        title: str,
        assessment_type: str,
        stage: int,
        duration_minutes: int,
        questions: List[Question],
        test_tier: str = "SCREENER"
    ) -> Dict[str, Any]:
        assessment_id = f"asmt_{uuid.uuid4().hex[:12]}"
        attempt_id = f"att_{uuid.uuid4().hex[:12]}"
        session_id = f"sess_{uuid.uuid4().hex[:16]}"

        assessment = Assessment(
            assessment_id=assessment_id,
            exam=exam,
            title=title,
            assessment_type=assessment_type,
            stage=stage,
            duration_minutes=duration_minutes,
            is_strict_timed=True
        )
        self.db.add(assessment)
        self.db.flush()

        attempt = AssessmentAttempt(
            attempt_id=attempt_id,
            assessment_id=assessment_id,
            student_id=student_id,
            session_id=session_id,
            started_at=datetime.datetime.utcnow(),
            total_questions=len(questions),
            is_completed=False,
            status="IN_PROGRESS",
            test_tier=test_tier
        )
        self.db.add(attempt)
        self.db.flush()

        EventCollector.log_event(
            db=self.db,
            student_id=student_id,
            session_id=session_id,
            event_type="QUIZ_STARTED",
            resource_id=assessment_id,
            metadata={"exam": exam, "stage": stage, "test_tier": test_tier, "question_count": len(questions)}
        )
        self.db.commit()

        formatted_questions = []
        for q in questions:
            shuffled_options = list(q.options) if q.options else []
            random.shuffle(shuffled_options)
            formatted_questions.append({
                "question_id": q.question_id,
                "exam": q.exam,
                "subject": q.subject,
                "chapter": q.chapter,
                "chapter_id": getattr(q, "chapter_id", None),
                "topic": q.topic,
                "topic_id": getattr(q, "topic_id", None),
                "concept_id": q.concept_id,
                "skill": q.skill,
                "difficulty": q.difficulty,
                "estimated_time": q.estimated_time,
                "question_type": q.question_type,
                "content": q.content,
                "options": shuffled_options,
                "rubrics": q.rubrics,
                "image_url": getattr(q, "image_url", None)
            })

        return {
            "attempt_id": attempt_id,
            "assessment_id": assessment_id,
            "session_id": session_id,
            "exam": exam,
            "title": title,
            "test_tier": test_tier,
            "assessment_type": assessment_type,
            "duration_minutes": duration_minutes,
            "total_questions": len(questions),
            "questions": formatted_questions,
            "started_at": attempt.started_at
        }

    def start_drill_assessment(
        self,
        student_id: str,
        exam: str,
        subject: str,
        chapter_id: Optional[str] = None,
        duration_minutes: int = 15
    ) -> Dict[str, Any]:
        """Tier 2: Focuses on a weak subject and chapter with 5 PYQs."""
        questions = self.selector.select_drill_questions(
            exam=exam,
            subject=subject,
            chapter_id=chapter_id,
            student_id=student_id,
            count=5
        )
        return self._create_assessment_session(
            student_id=student_id,
            exam=exam,
            title=f"{exam} {subject} Topic Drill",
            assessment_type="CONCEPT_FOCUS",
            stage=2,
            duration_minutes=duration_minutes,
            questions=questions,
            test_tier="TOPIC_DRILL"
        )

    def start_full_scan_assessment(
        self,
        student_id: str,
        exam: str,
        duration_minutes: int = 40
    ) -> Dict[str, Any]:
        """Tier 3: Full Syllabus Deep Scan (15 balanced questions)."""
        questions = self.selector.select_full_scan_questions(
            exam=exam,
            student_id=student_id,
            count=15
        )
        return self._create_assessment_session(
            student_id=student_id,
            exam=exam,
            title=f"{exam} Full Syllabus Deep Scan",
            assessment_type="DIAGNOSTIC",
            stage=3,
            duration_minutes=duration_minutes,
            questions=questions,
            test_tier="FULL_SCAN"
        )

    def start_advanced_challenge(
        self,
        student_id: str,
        exam: str,
        subject: Optional[str] = None,
        duration_minutes: int = 20
    ) -> Dict[str, Any]:
        """Tier 4: Advanced Mastery Challenge (Higher difficulty questions 0.75 - 0.92)."""
        questions = self.selector.select_advanced_questions(
            exam=exam,
            subject=subject,
            student_id=student_id,
            count=6
        )
        sub_str = f" ({subject})" if subject else ""
        return self._create_assessment_session(
            student_id=student_id,
            exam=exam,
            title=f"{exam} Tier 4 Advanced Mastery Challenge{sub_str}",
            assessment_type="ADVANCED_CHALLENGE",
            stage=4,
            duration_minutes=duration_minutes,
            questions=questions,
            test_tier="ADVANCED_CHALLENGE"
        )

    def submit_assessment(
        self,
        attempt_id: str,
        responses: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Grades submitted assessment items, logs errors, updates concept mastery (Baseline + BKT + IRT),
        and updates attempt status.
        """
        attempt = self.db.query(AssessmentAttempt).filter(
            AssessmentAttempt.attempt_id == attempt_id
        ).first()

        if not attempt:
            raise ValueError(f"Attempt with ID {attempt_id} not found.")

        if attempt.is_completed:
            return {"status": "ALREADY_COMPLETED", "attempt_id": attempt_id}

        now = datetime.datetime.utcnow()
        assessment = attempt.assessment
        timing_check = AssessmentTimer.verify_attempt_timing(
            started_at=attempt.started_at,
            duration_minutes=assessment.duration_minutes,
            submission_time=now
        )

        response_map = {r["question_id"]: r for r in responses}
        question_ids = list(response_map.keys())

        questions = self.db.query(Question).filter(Question.question_id.in_(question_ids)).all()
        q_dict = {q.question_id: q for q in questions}

        total_questions = len(questions)
        correct_count = 0
        total_time_taken = 0
        items_feedback = []
        concept_ids_affected = set()

        for q in questions:
            resp = response_map.get(q.question_id, {})
            student_ans = resp.get("student_answer")
            time_spent = resp.get("time_taken_seconds", q.estimated_time)
            total_time_taken += time_spent

            is_correct = (student_ans == q.correct_answer)
            if is_correct:
                correct_count += 1

            # Classify error if incorrect
            err_info = ErrorClassifier.classify_error(
                question_distractor_explanations=q.distractor_explanations,
                student_answer=student_ans,
                correct_answer=q.correct_answer,
                time_taken_seconds=time_spent,
                estimated_time_seconds=q.estimated_time
            )

            # Record attempt item
            attempt_item = StudentAttemptItem(
                attempt_id=attempt_id,
                question_id=q.question_id,
                concept_id=q.concept_id,
                student_answer=student_ans,
                is_correct=is_correct,
                time_taken_seconds=time_spent,
                difficulty=q.difficulty,
                confidence_estimate=resp.get("confidence_estimate", 0.5),
                error_type=err_info["error_type"],
                timestamp=now
            )
            self.db.add(attempt_item)
            concept_ids_affected.add(q.concept_id)

            # Log to student error log if incorrect
            if not is_correct and err_info["error_type"]:
                error_log = StudentErrorLog(
                    student_id=attempt.student_id,
                    question_id=q.question_id,
                    concept_id=q.concept_id,
                    error_type=err_info["error_type"],
                    details=err_info["note"],
                    timestamp=now
                )
                self.db.add(error_log)

            # Collect individual feedback
            items_feedback.append({
                "question_id": q.question_id,
                "concept_id": q.concept_id,
                "student_answer": student_ans,
                "correct_answer": q.correct_answer,
                "is_correct": is_correct,
                "time_taken_seconds": time_spent,
                "difficulty": q.difficulty,
                "explanation": q.explanation,
                "error_type": err_info["error_type"],
                "distractor_note": err_info["note"]
            })

        score_pct = round((correct_count / max(total_questions, 1)) * 100.0, 2)
        attempt.submitted_at = now
        attempt.time_taken_seconds = total_time_taken
        attempt.total_questions = total_questions
        attempt.correct_count = correct_count
        attempt.score_percentage = score_pct
        attempt.is_completed = True
        attempt.status = "AUTO_SUBMITTED" if timing_check["is_timed_out"] else "COMPLETED"

        self.db.flush()

        # Update Student Concept Mastery for all affected concepts
        updated_masteries = []
        for cid in concept_ids_affected:
            metrics = self.mastery_engine.evaluate_concept_from_attempts(
                student_id=attempt.student_id,
                concept_id=cid
            )

            # Fetch all item attempts for this concept to run BKT and IRT
            concept_items = (
                self.db.query(StudentAttemptItem)
                .join(Question, StudentAttemptItem.question_id == Question.question_id)
                .filter(
                    StudentAttemptItem.concept_id == cid,
                    StudentAttemptItem.attempt.has(student_id=attempt.student_id)
                )
                .order_by(StudentAttemptItem.timestamp.asc())
                .all()
            )

            # BKT
            bool_seq = [ci.is_correct for ci in concept_items]
            bkt_score = self.bkt.compute_sequence_mastery(bool_seq)

            # IRT theta estimation for this concept
            irt_tuples = [(ci.is_correct, ci.difficulty, 1.2) for ci in concept_items]
            irt_theta = ItemResponseTheory.estimate_student_ability(irt_tuples)

            # Forgetting / Retention
            retention_data = self.forgetting_model.calculate_retention(
                base_mastery=metrics["mastery"],
                last_practiced_at=metrics.get("last_practiced_at"),
                review_count=max(1, len(concept_items) // 3),
                now=now
            )

            mastery_rec = self.db.query(StudentConceptMastery).filter(
                StudentConceptMastery.student_id == attempt.student_id,
                StudentConceptMastery.concept_id == cid
            ).first()

            if not mastery_rec:
                mastery_rec = StudentConceptMastery(
                    student_id=attempt.student_id,
                    concept_id=cid
                )
                self.db.add(mastery_rec)

            mastery_rec.mastery = metrics["mastery"]
            mastery_rec.confidence = metrics["confidence"]
            mastery_rec.bkt_mastery = bkt_score
            mastery_rec.irt_ability = irt_theta
            mastery_rec.attempts_count = metrics["attempts_count"]
            mastery_rec.correct_count = metrics["correct_count"]
            mastery_rec.recent_accuracy = metrics["recent_accuracy"]
            mastery_rec.historical_accuracy = metrics["historical_accuracy"]
            mastery_rec.average_response_time = metrics["average_time"]
            mastery_rec.difficulty_success_rate = metrics["difficulty_success"]
            mastery_rec.retention_score = retention_data["retention_score"]
            mastery_rec.forgetting_risk = retention_data["forgetting_risk"]
            mastery_rec.last_practiced_at = now

            updated_masteries.append({
                "concept_id": cid,
                "mastery": metrics["mastery"],
                "confidence": metrics["confidence"],
                "bkt_mastery": bkt_score,
                "irt_ability": irt_theta,
                "forgetting_risk": retention_data["forgetting_risk"]
            })

        # Log Quiz Completed Event
        EventCollector.log_event(
            db=self.db,
            student_id=attempt.student_id,
            session_id=attempt.session_id,
            event_type="QUIZ_COMPLETED",
            resource_id=attempt.assessment_id,
            metadata={
                "attempt_id": attempt_id,
                "score_percentage": score_pct,
                "correct_count": correct_count,
                "total_questions": total_questions
            }
        )

        # Calculate subject-level accuracies and flag weak subjects (< 60% accuracy)
        sub_stats = {}
        for item in items_feedback:
            q_obj = next((q for q in questions if q.question_id == item["question_id"]), None)
            if q_obj:
                s = q_obj.subject
                if s not in sub_stats:
                    sub_stats[s] = {"correct": 0, "total": 0, "chapters": set()}
                sub_stats[s]["total"] += 1
                if item["is_correct"]:
                    sub_stats[s]["correct"] += 1
                if getattr(q_obj, "chapter_id", None):
                    sub_stats[s]["chapters"].add(q_obj.chapter_id)

        weak_subjects = []
        for s, d in sub_stats.items():
            acc = (d["correct"] / max(d["total"], 1)) * 100
            if acc < 60.0:
                weak_subjects.append({
                    "subject": s,
                    "accuracy_pct": round(acc, 1),
                    "correct": d["correct"],
                    "total": d["total"],
                    "chapter_ids": list(d["chapters"]),
                    "drill_recommended": True
                })

        advanced_challenge_eligible = score_pct >= 80.0

        self.db.commit()

        return {
            "attempt_id": attempt_id,
            "test_tier": getattr(attempt, "test_tier", "SCREENER"),
            "total_questions": total_questions,
            "correct_count": correct_count,
            "score_percentage": score_pct,
            "time_taken_seconds": total_time_taken,
            "status": attempt.status,
            "weak_subjects": weak_subjects,
            "advanced_challenge_eligible": advanced_challenge_eligible,
            "items_feedback": items_feedback,
            "updated_masteries": updated_masteries
        }
