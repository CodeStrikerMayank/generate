from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.schema import StudentConceptMastery, Concept, Topic, Chapter, Subject
from backend.app.knowledge_graph.graph import CurriculumGraph
from backend.app.knowledge_graph.prerequisites import PrerequisiteResolver

class PriorityEngine:
    """
    Computes normalized multi-factor priority scores with human-readable reasoning for every concept.
    """
    def __init__(self, db: Session, exam_id: str = "JEE"):
        self.db = db
        self.exam_id = exam_id
        self.graph = CurriculumGraph(db, exam_id=exam_id)
        self.prereq_resolver = PrerequisiteResolver(db, self.graph)

    def calculate_priority(
        self,
        concept: Concept,
        mastery_rec: Optional[StudentConceptMastery],
        student_id: str
    ) -> Dict[str, Any]:
        """
        Calculates priority score using normalized factors:
        Priority = Knowledge Gap * Exam Importance * Prerequisite Impact * Forgetting Multiplier * Uncertainty Factor
        """
        mastery = mastery_rec.mastery if mastery_rec else 0.0
        confidence = mastery_rec.confidence if mastery_rec else 0.10
        forgetting_risk = mastery_rec.forgetting_risk if mastery_rec else 0.0
        attempts = mastery_rec.attempts_count if mastery_rec else 0

        # 1. Knowledge Gap (0.0 to 1.0)
        knowledge_gap = 1.0 - mastery

        # 2. Exam Importance (0.0 to 1.0) with exam-specific weighting
        exam_importance = concept.exam_relevance
        sub_name = concept.topic.chapter.subject.name if (concept.topic and concept.topic.chapter and concept.topic.chapter.subject) else ""

        # NEET: Biology carries 50% total marks (360/720), so amplify Biology importance
        if self.exam_id == "NEET" and sub_name == "Biology":
            exam_importance = min(1.0, exam_importance * 1.25)
        # JEE: Multi-concept problems require heavy emphasis on foundational mechanics & calculus
        elif self.exam_id == "JEE" and sub_name in ["Physics", "Mathematics"]:
            prereq_impact = min(1.0, prereq_impact * 1.20)

        # 3. Prerequisite Impact (0.1 to 1.0)
        prereq_impact = self.graph.get_prerequisite_impact(concept.concept_id)

        # 4. Prerequisite readiness check: If this concept's own ancestors are broken,
        # its immediate study priority is adjusted to prioritize ancestors first.
        prereq_check = self.prereq_resolver.analyze_prerequisite_chain(student_id, concept.concept_id)

        # Multi-factor score tailored to exam
        if self.exam_id == "NEET":
            raw_score = (
                knowledge_gap * 0.40 +
                exam_importance * 0.30 +
                prereq_impact * 0.15 +
                forgetting_risk * 0.10 +
                (1.0 - confidence) * 0.05
            )
        else:
            raw_score = (
                knowledge_gap * 0.35 +
                exam_importance * 0.25 +
                prereq_impact * 0.25 +
                forgetting_risk * 0.08 +
                (1.0 - confidence) * 0.07
            )

        reasons = []
        if self.exam_id == "NEET" and sub_name == "Biology":
            reasons.append("NEET 50% Paper Weight: High-Yield NCERT Biology domain")
        elif self.exam_id == "JEE" and prereq_impact >= 0.5:
            reasons.append("JEE Multi-Concept Pivot: Unlocks advanced problem-solving sequences")

        if mastery < 0.40:
            reasons.append(f"Critical knowledge gap (mastery {int(mastery * 100)}%)")
        elif mastery < 0.70:
            reasons.append(f"Moderate mastery ({int(mastery * 100)}%) below target threshold")

        if exam_importance >= 0.90:
            reasons.append(f"High exam weight ({int(exam_importance * 100)}% relevance)")

        if prereq_impact >= 0.60:
            dependents = self.graph.get_dependents(concept.concept_id)
            dep_names = [self.graph.graph.nodes.get(d, {}).get("name", d) for d in dependents[:3]]
            reasons.append(f"Key foundational concept unlocking: {', '.join(dep_names)}")

        if forgetting_risk > 0.35:
            reasons.append(f"Spaced repetition alert ({int(forgetting_risk * 100)}% forgetting risk)")

        if prereq_check["has_prerequisite_gaps"]:
            broken_names = [b["name"] for b in prereq_check["broken_prerequisites"][:2]]
            reasons.append(f"Notice: Foundational prerequisite ({', '.join(broken_names)}) should be mastered first")

        if not reasons:
            reasons.append("Standard curriculum progression")

        priority_score = round(min(max(raw_score, 0.05), 0.99), 3)

        return {
            "concept_id": concept.concept_id,
            "concept_name": concept.name,
            "priority_score": priority_score,
            "knowledge_gap": round(knowledge_gap, 3),
            "exam_importance": round(exam_importance, 3),
            "prerequisite_impact": round(prereq_impact, 3),
            "forgetting_risk": round(forgetting_risk, 3),
            "confidence_factor": round(confidence, 3),
            "has_unresolved_prerequisites": prereq_check["has_prerequisite_gaps"],
            "reasons": reasons
        }

    def rank_all_priorities(self, student_id: str) -> List[Dict[str, Any]]:
        """Ranks all curriculum concepts by priority score."""
        concepts = (
            self.db.query(Concept)
            .join(Topic).join(Chapter).join(Subject)
            .filter(Subject.exam_id == self.exam_id)
            .all()
        )

        masteries = self.db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == student_id
        ).all()
        mastery_dict = {m.concept_id: m for m in masteries}

        priorities = []
        for c in concepts:
            p_data = self.calculate_priority(c, mastery_dict.get(c.concept_id), student_id)
            priorities.append(p_data)

        # Sort descending by priority score
        return sorted(priorities, key=lambda x: x["priority_score"], reverse=True)
