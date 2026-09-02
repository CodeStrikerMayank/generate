import random
from typing import List, Optional, Set
from sqlalchemy.orm import Session
from backend.app.models.schema import Question, StudentAttemptItem
from backend.app.student_model.irt import ItemResponseTheory

class QuestionSelector:
    """
    Intelligent question selection engine based on curriculum coverage, diagnostic goal,
    information gain (IRT), prerequisite state, and exposure history.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_exposed_question_ids(self, student_id: str) -> Set[str]:
        """Returns set of question IDs already attempted by this student."""
        attempts = (
            self.db.query(StudentAttemptItem.question_id)
            .filter(StudentAttemptItem.attempt.has(student_id=student_id))
            .all()
        )
        return {a[0] for a in attempts}

    def select_questions(
        self,
        exam: str,
        student_id: Optional[str] = None,
        target_concept_id: Optional[str] = None,
        diagnostic_goal: str = "BASELINE",  # BASELINE, WEAKNESS_CONFIRMATION, PREREQUISITE_DIAGNOSIS, RETENTION_TEST, TRANSFER_TEST, CALIBRATION
        desired_difficulty: Optional[float] = None,
        student_theta: float = 0.0,
        count: int = 5
    ) -> List[Question]:
        """
        Selects optimal questions maximizing diagnostic value for the specific assessment mode.
        """
        exposed_ids = self.get_exposed_question_ids(student_id) if student_id else set()

        query = self.db.query(Question).filter(Question.exam == exam)

        if target_concept_id:
            query = query.filter(Question.concept_id == target_concept_id)

        if diagnostic_goal == "TRANSFER_TEST":
            query = query.filter(Question.is_transfer == True)
        elif diagnostic_goal == "PREREQUISITE_DIAGNOSIS":
            query = query.filter(Question.is_prerequisite_check == True)

        available_questions = query.all()

        # If question pool is small, allow unexposed first, then fallback to exposed
        unexposed = [q for q in available_questions if q.question_id not in exposed_ids]
        candidate_pool = unexposed if len(unexposed) >= count else available_questions

        if not candidate_pool:
            # Fallback to any questions for this exam
            candidate_pool = self.db.query(Question).filter(Question.exam == exam).all()

        if not candidate_pool:
            return []

        # Rank questions by Information Gain / proximity to desired target
        def scoring_function(q: Question) -> float:
            score = 0.0
            # 1. Fisher Information Gain relative to student ability theta
            b = ItemResponseTheory.difficulty_to_b_parameter(q.difficulty)
            info = ItemResponseTheory.item_information(student_theta, b, q.discrimination, q.guessing)
            score += info * 2.0

            # 2. Proximity to desired difficulty if specified
            if desired_difficulty is not None:
                diff_dist = abs(q.difficulty - desired_difficulty)
                score += max(0.0, 1.0 - diff_dist) * 3.0

            # 3. Preference for unexposed items
            if q.question_id not in exposed_ids:
                score += 1.5

            # 4. Transfer / Prerequisite match bonus
            if diagnostic_goal == "TRANSFER_TEST" and q.is_transfer:
                score += 2.0
            if diagnostic_goal == "PREREQUISITE_DIAGNOSIS" and q.is_prerequisite_check:
                score += 2.0

            return score

        # Sort candidate pool by score
        sorted_candidates = sorted(candidate_pool, key=scoring_function, reverse=True)

        # For multi-subject diagnostic assessment, balance question quotas across subjects
        if diagnostic_goal in ["DIAGNOSTIC", "BASELINE"] and not target_concept_id:
            subjects = ["Physics", "Chemistry", "Mathematics"] if exam == "JEE" else ["Biology", "Physics", "Chemistry"] if exam == "NEET" else []
            if subjects:
                per_subject_count = max(1, count // len(subjects))
                selected = []
                for sub in subjects:
                    sub_pool = [q for q in candidate_pool if q.subject == sub]
                    if not sub_pool:
                        sub_pool = [q for q in available_questions if q.subject == sub]
                    sorted_sub = sorted(sub_pool, key=scoring_function, reverse=True)
                    selected.extend(sorted_sub[:per_subject_count])

                # If still under total count, backfill from remaining sorted candidates
                if len(selected) < count:
                    selected_ids = {q.question_id for q in selected}
                    remaining = [q for q in sorted_candidates if q.question_id not in selected_ids]
                    selected.extend(remaining[:(count - len(selected))])

                return selected[:count]

        selected = sorted_candidates[:count]
        return selected

    def select_drill_questions(
        self,
        exam: str,
        subject: str,
        chapter_id: Optional[str] = None,
        student_id: Optional[str] = None,
        count: int = 5
    ) -> List[Question]:
        """Selects questions specifically targeting a weak subject and chapter."""
        query = self.db.query(Question).filter(
            Question.exam == exam,
            Question.subject == subject
        )
        if chapter_id:
            query = query.filter(Question.chapter_id == chapter_id)

        candidates = query.all()
        if not candidates:
            # Fallback to subject-only
            candidates = self.db.query(Question).filter(
                Question.exam == exam,
                Question.subject == subject
            ).all()

        # Shuffle and pick up to count
        random.shuffle(candidates)
        return candidates[:count]

    def select_full_scan_questions(
        self,
        exam: str,
        student_id: Optional[str] = None,
        count: int = 15
    ) -> List[Question]:
        """Selects comprehensive balanced questions across all chapters for full-scan diagnostic."""
        all_q = self.db.query(Question).filter(Question.exam == exam).all()
        if not all_q:
            return []

        subjects = ["Physics", "Chemistry", "Mathematics"] if exam == "JEE" else ["Biology", "Physics", "Chemistry"]
        per_sub = max(1, count // len(subjects))

        selected = []
        for sub in subjects:
            sub_qs = [q for q in all_q if q.subject == sub]
            random.shuffle(sub_qs)
            selected.extend(sub_qs[:per_sub])

        # Fill any remainder
        if len(selected) < count:
            chosen_ids = {q.question_id for q in selected}
            remaining = [q for q in all_q if q.question_id not in chosen_ids]
            random.shuffle(remaining)
            selected.extend(remaining[:(count - len(selected))])

        return selected[:count]
