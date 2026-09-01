from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.schema import StudentConceptMastery, Concept, Topic, Chapter, Subject, StudentErrorLog
from backend.app.knowledge_graph.graph import CurriculumGraph
from backend.app.knowledge_graph.prerequisites import PrerequisiteResolver

class WeaknessDetector:
    """
    Detects and classifies genuine vs transient student weaknesses across curriculum concepts.
    """
    def __init__(self, db: Session, exam_id: str = "JEE"):
        self.db = db
        self.exam_id = exam_id
        self.graph = CurriculumGraph(db, exam_id=exam_id)
        self.prereq_resolver = PrerequisiteResolver(db, self.graph)

    def detect_weaknesses(self, student_id: str) -> List[Dict[str, Any]]:
        """
        Scans all concepts and identifies ranked weaknesses with specific diagnosis types.
        """
        # Fetch all concepts for this exam
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

        weaknesses = []

        for c in concepts:
            m_rec = mastery_dict.get(c.concept_id)
            mastery = m_rec.mastery if m_rec else 0.0
            confidence = m_rec.confidence if m_rec else 0.10
            forgetting_risk = m_rec.forgetting_risk if m_rec else 0.0
            attempts = m_rec.attempts_count if m_rec else 0

            # Prerequisite check
            prereq_analysis = self.prereq_resolver.analyze_prerequisite_chain(student_id, c.concept_id)

            reasons = []
            weakness_type = None

            # 1. Broken foundational prerequisite
            if prereq_analysis["has_prerequisite_gaps"] and mastery < 0.60:
                broken_names = [b["name"] for b in prereq_analysis["broken_prerequisites"]]
                weakness_type = "FOUNDATIONAL_PREREQUISITE_GAP"
                reasons.append(f"Blocked by upstream prerequisite(s): {', '.join(broken_names)}")
                reasons.append(f"Current concept mastery is only {int(mastery * 100)}%")

            # 2. High forgetting risk on previously studied material
            elif forgetting_risk > 0.40 and mastery >= 0.50:
                weakness_type = "HIGH_FORGETTING_RISK"
                reasons.append(f"Memory retention decayed ({int(forgetting_risk * 100)}% forgetting risk)")
                reasons.append("Needs spaced retention review to reinforce long-term recall")

            # 3. Unstable mastery (frequent recent errors)
            elif attempts >= 3 and m_rec and m_rec.recent_accuracy < 0.50 and mastery < 0.65:
                weakness_type = "UNSTABLE_MASTERY"
                reasons.append(f"Low recent accuracy ({int(m_rec.recent_accuracy * 100)}%) over last attempts")
                reasons.append(f"Mastery ({int(mastery * 100)}%) is unstable under testing")

            # 4. Low mastery with sufficient confidence
            elif mastery < 0.50 and (attempts > 0 or c.exam_relevance >= 0.90):
                weakness_type = "LOW_MASTERY"
                reasons.append(f"Mastery is low ({int(mastery * 100)}%)")
                reasons.append(f"High exam relevance ({int(c.exam_relevance * 100)}%)")

            if weakness_type:
                # Get subject and chapter names
                topic = c.topic
                chapter = topic.chapter if topic else None
                subject = chapter.subject if chapter else None

                weaknesses.append({
                    "concept_id": c.concept_id,
                    "concept_name": c.name,
                    "subject": subject.name if subject else "General",
                    "chapter": chapter.name if chapter else "General",
                    "mastery": mastery,
                    "confidence": confidence,
                    "forgetting_risk": forgetting_risk,
                    "weakness_type": weakness_type,
                    "reasons": reasons,
                    "exam_relevance": c.exam_relevance,
                    "prerequisite_impact": self.graph.get_prerequisite_impact(c.concept_id)
                })

        # Rank weaknesses: Prerequisite gaps & high exam relevance first
        def weakness_rank(w: Dict[str, Any]) -> float:
            score = (1.0 - w["mastery"]) * w["exam_relevance"] * (1.0 + w["prerequisite_impact"])
            if w["weakness_type"] == "FOUNDATIONAL_PREREQUISITE_GAP":
                score *= 1.4
            elif w["weakness_type"] == "HIGH_FORGETTING_RISK":
                score *= 1.2
            return score

        return sorted(weaknesses, key=weakness_rank, reverse=True)
