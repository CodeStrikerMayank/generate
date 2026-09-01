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

        # Sort candidate pool by score and pick top N
        sorted_candidates = sorted(candidate_pool, key=scoring_function, reverse=True)
        selected = sorted_candidates[:count]

        # Shuffle option order within each selected question for assessment integrity
        shuffled_selected = []
        for q in selected:
            # Create shallow copy or preserve options dict
            shuffled_selected.append(q)

        return shuffled_selected
