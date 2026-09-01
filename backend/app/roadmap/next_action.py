from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.schema import Roadmap, RoadmapAction, Concept, Topic, Chapter, Subject, Student
from backend.app.roadmap.generator import RoadmapGenerator

class NextActionEngine:
    """
    Central decision intelligence layer answering: "What should this student do next?"
    """
    def __init__(self, db: Session):
        self.db = db

    def get_next_best_action(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves the immediate next uncompleted action from the active roadmap,
        or generates a new roadmap if none is active.
        """
        active_roadmap = (
            self.db.query(Roadmap)
            .filter(Roadmap.student_id == student_id, Roadmap.status == "ACTIVE")
            .order_by(Roadmap.version.desc())
            .first()
        )

        student = self.db.query(Student).filter(Student.student_id == student_id).first()
        exam_id = student.target_exam if student else "JEE"

        if not active_roadmap or not active_roadmap.actions:
            generator = RoadmapGenerator(self.db, exam_id=exam_id)
            active_roadmap = generator.generate_roadmap(student_id, trigger_event="SYSTEM_INIT")

        # Find first incomplete action
        next_action = (
            self.db.query(RoadmapAction)
            .filter(
                RoadmapAction.roadmap_id == active_roadmap.roadmap_id,
                RoadmapAction.is_completed == False
            )
            .order_by(RoadmapAction.sequence_order.asc())
            .first()
        )

        if not next_action:
            # All actions in roadmap were completed! Re-generate
            generator = RoadmapGenerator(self.db, exam_id=exam_id)
            active_roadmap = generator.generate_roadmap(student_id, trigger_event="ALL_ACTIONS_COMPLETED")
            next_action = (
                self.db.query(RoadmapAction)
                .filter(
                    RoadmapAction.roadmap_id == active_roadmap.roadmap_id,
                    RoadmapAction.is_completed == False
                )
                .order_by(RoadmapAction.sequence_order.asc())
                .first()
            )

        if not next_action:
            return None

        concept = self.db.query(Concept).filter(Concept.concept_id == next_action.concept_id).first()
        topic = concept.topic if concept else None
        chapter = topic.chapter if topic else None
        subject = chapter.subject if chapter else None

        explanation_summary = f"{next_action.action_type.replace('_', ' ').title()} for '{concept.name if concept else next_action.concept_id}': " + "; ".join(next_action.reasons or [])

        return {
            "action_type": next_action.action_type,
            "concept_id": next_action.concept_id,
            "concept_name": concept.name if concept else next_action.concept_id,
            "subject": subject.name if subject else "General",
            "chapter": chapter.name if chapter else "General",
            "reasons": next_action.reasons or [],
            "estimated_minutes": next_action.estimated_minutes,
            "target_questions_count": next_action.target_questions_count,
            "target_difficulty": next_action.target_difficulty,
            "explanation_summary": explanation_summary
        }
